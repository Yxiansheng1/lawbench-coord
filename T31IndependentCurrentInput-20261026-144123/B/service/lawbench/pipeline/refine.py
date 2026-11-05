"""提示词优化（T39，需求记录第 14 条）：律师在输入框写完点一下，本地模型把这句话改写成更清楚完整的指令。

- 只走律所 6000D（经 pipeline/llm.py 的 LLM：地址白名单、所内所外自动切换），不外连；不开思考，max_tokens 小。
- 上下文：当前 Skill 的标题与说明（读 SKILL.md 头部）、当前案件的材料名（最多 MAX_NAMES 个）。只用来让模型补对文书类型和材料，
  不发材料正文。
- 任何失败（没 Key、连不上、超时、被截断、改写结果为空或离谱地长）都回原文，refined=false，reason 是固定代号。
- 日志只记元数据（耗时、是否改写、失败代号），不记原话和改写结果（Spec 20.8）。

接口 POST /api/prompt/refine 进契约 1.5（与 T37 同车升版）；在那之前本模块只有函数和用例，不挂路由。
"""
from __future__ import annotations

import pathlib
import re
import secrets
import time

from .. import logs
from ..errors import ApiError
from .llm import LLM, Cancelled

MAX_INPUT = 2000          # 律师原话上限（字）；超过不改写，直接回原文
MAX_NAMES = 30
MAX_GROWTH = 4            # 改写结果超过原话 4 倍且超过 MAX_OUTPUT 视为跑题，回原文
MAX_OUTPUT = 600
PARAMS = {"max_tokens": 512, "temperature": 0.3, "thinking": "关闭", "window": "32K"}

SYSTEM = """你是律师工作台里的"提示词优化"助手。律师在对话框里写了一句要交给 AI 助理的话，你把它改写成一条清楚、完整的指令，律师看过后自己再发。

改写要求：
- 只改写，不回答、不执行，不加任何解释；只输出改写后的那条指令本身。
- 保留律师原意和原话里的人名、日期、金额、案号，不编造新事实；原话没说清的地方用【待补充：缺什么】标出，不替律师决定。
- 补齐三样东西（原话已经有的不重复）：要做什么（文书类型或任务，例如起草起诉状、整理时间线、审查合同）；针对哪些材料（从下面的材料清单里选名字，没有对得上的就写"全部材料"）；输出格式（例如 Markdown 草稿、表格、要点列表，起草类一律先出 Markdown 草稿）。
- 用简体中文，一到三句话，不超过 200 字。"""

_FRONT_FIELD = re.compile(r"^(title|description):\s*(.+?)\s*$", re.M)


def skill_brief(skills_dirs, skill: str | None) -> str | None:
    """Skill 的"标题：说明"；读不到返回 None。同名时后面的目录覆盖前面的（Spec 10.1，同 checks.skill_kind）。"""
    if not skill or not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", skill):
        return None
    for d in reversed(list(skills_dirs or ())):
        try:
            text = (pathlib.Path(d) / skill / "SKILL.md").read_text(encoding="utf-8", errors="replace").lstrip("﻿")
        except OSError:
            continue
        head = text.split("---", 2)[1] if text.startswith("---") and text.count("---") >= 2 else ""
        fields = {k: v.strip("\"'") for k, v in _FRONT_FIELD.findall(head)}
        if not fields:
            return None
        return "：".join(x for x in (fields.get("title"), fields.get("description")) if x)
    return None


def build_user(text: str, brief: str | None, names: list[str]) -> str:
    parts = [f"当前使用的 Skill：{brief}" if brief else "当前没有选 Skill。"]
    if names:
        shown = names[:MAX_NAMES]
        more = f"（另有 {len(names) - len(shown)} 份未列出）" if len(names) > len(shown) else ""
        parts.append("当前案件的材料：" + "、".join(shown) + more)
    else:
        parts.append("当前没有打开案件，或案件里还没有材料。")
    parts.append("律师的原话：\n" + text)
    return "\n\n".join(parts)


def clean(out: str) -> str:
    s = out.strip()
    s = re.sub(r"^```[a-zA-Z]*\s*\n?|\n?```$", "", s).strip()
    s = re.sub(r"^(改写后的指令|改写后|优化后的指令|优化后|指令)\s*[:：]\s*", "", s)
    if len(s) >= 2 and s[0] in "\"“「" and s[-1] in "\"”」":
        s = s[1:-1].strip()
    return s


def refine(net, key_getter, skills_dirs, text: str, skill: str | None = None,
           material_names: list[str] | None = None, llm_factory=LLM) -> dict:
    """返回 {text, refined, reason?}：改写成功 refined=true；否则原文原样返回、refined=false。"""
    t0 = time.monotonic()
    original = text

    def done(value: dict, error: str | None = None) -> dict:
        logs.event("prompt", "refine", status="ok" if value["refined"] else "fail", error=error,
                   duration_ms=(time.monotonic() - t0) * 1000)
        return value

    def keep(reason: str) -> dict:
        return done({"text": original, "refined": False, "reason": reason}, reason)

    if not text.strip():
        return keep("EMPTY")
    if len(text) > MAX_INPUT:
        return keep("TOO_LONG")
    user = build_user(text.strip(), skill_brief(skills_dirs, skill), list(material_names or []))
    try:
        reply = llm_factory(net, key_getter).chat(SYSTEM, user, PARAMS, f"refine-{secrets.token_hex(4)}")
    except ApiError as e:
        return keep(e.code)
    except Cancelled:
        return keep("CANCELLED")
    if reply.finish_reason == "length":
        return keep("TRUNCATED")
    out = clean(reply.text)
    if not out:
        return keep("EMPTY_REPLY")
    if len(out) > MAX_OUTPUT and len(out) > MAX_GROWTH * len(text):
        return keep("OFF_TOPIC")
    return done({"text": out, "refined": out != original.strip()})
