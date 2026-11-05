"""case_save_draft、case_suggest_wiki。"""
from __future__ import annotations

import json
import re
import threading
import time
from datetime import datetime
from decimal import Decimal, InvalidOperation
from fractions import Fraction

from .. import checks, contracts, logs
from ..case import documents, gate
from ..case.task import IN_PROGRESS
from ..errors import ApiError
from . import ToolContext

PENDING_REL = "工作区/wiki/待确认.json"
PENDING_SCHEMA = "files/wiki_pending.schema.json"
_WIKI_LOCK = threading.Lock()  # 待确认.json 的读-改-写（P2-3）；只是本地读写，跨案件共用一把也不会久等
_CN_DIGITS = {
    "〇": 0, "零": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4,
    "五": 5, "六": 6, "七": 7, "八": 8, "九": 9,
}
_RATE_TOKEN_RE = re.compile(
    r"(?<![〇零一二两三四五六七八九十百千万亿\d.])"
    r"(?P<denominator>百分之|千分之|万分之)"
    r"(?P<numerator>[〇零一二两三四五六七八九十]{1,8}|\d{1,6}(?:\.\d{1,6})?)"
    r"(?![〇零一二两三四五六七八九十百千万亿\d.点])"
)
_PERCENT_TOKEN_RE = re.compile(
    r"(?<![0-9A-Za-z_.+\-−＋－/／])"
    r"(?P<numerator>\d{1,6}(?:\.\d{1,6})?)\s*%(?!\d)"
)
_RATIO_CLAIM_RE = re.compile(
    r"(?P<former>前者|后者)(?:是|为)(?P<latter>后者|前者)的"
    r"(?P<multiple>[〇零一二两三四五六七八九十]{1,8}|\d{1,6}(?:\.\d{1,6})?)\s*倍"
)
_DIRECT_RATIO_BRIDGE_RE = re.compile(
    r"\s*[）)]?\s*(?:是|为)\s*"
    r"(?:[^（）()，,。；;！!？?\n]{1,80}[（(])?\s*"
)
_DIRECT_RATIO_CLAIM_RE = re.compile(
    r"\s*[）)]?\s*的\s*"
    r"(?P<multiple>[〇零一二两三四五六七八九十]{1,8}|\d{1,6}(?:\.\d{1,6})?)\s*倍"
)
_NONASSERTION_QUOTE_RE = re.compile(
    r"`[^`\n]*`|「[^」\n]*」|『[^』\n]*』|“[^”\n]*”|‘[^’\n]*’|"
    r"\"[^\"\n]*\"|'[^'\n]*'|〔[^〕\n]*〕|\[[^\]\n]*\]"
)


def _exact_number(text: str, *, allow_zero: bool) -> Fraction | None:
    """只接受本检查声明支持的有限中文小整数或阿拉伯十进制数。"""
    if text and all(char in _CN_DIGITS or char == "十" for char in text):
        if text == "十":
            value = Fraction(10)
        elif len(text) == 1:
            value = Fraction(_CN_DIGITS[text])
        elif text.count("十") == 1:
            tens, ones = text.split("十")
            if len(tens) > 1 or len(ones) > 1:
                return None
            value = Fraction((_CN_DIGITS[tens] if tens else 1) * 10
                             + (_CN_DIGITS[ones] if ones else 0))
        else:
            return None
    else:
        try:
            value = Fraction(Decimal(text))
        except (InvalidOperation, ValueError):
            return None
    if value < 0 or (value == 0 and not allow_zero):
        return None
    return value


def _rate_unit(segment: str, start: int, end: int) -> str | None:
    """仅识别明确的日/月/年计率单位；缺失或含糊时不参与判断。"""
    suffix = re.match(r"\s*(?:/|每)\s*(日|月|年)", segment[end:end + 6])
    if suffix:
        return suffix.group(1)
    prefix = segment[max(0, start - 6):start]
    prefix_unit = re.search(r"(日|月|年)(?:利率|费率)?(?:为|是)?$", prefix)
    return prefix_unit.group(1) if prefix_unit else None


def _segment_rates(segment: str) -> list[dict]:
    rates = []
    for match in _RATE_TOKEN_RE.finditer(segment):
        denominator = {"百分之": 100, "千分之": 1000, "万分之": 10000}[match.group("denominator")]
        numerator = _exact_number(match.group("numerator"), allow_zero=True)
        if numerator is None:
            continue
        rates.append({
            "value": numerator / denominator,
            "unit": _rate_unit(segment, match.start(), match.end()),
            "start": match.start(),
            "end": match.end(),
        })
    for match in _PERCENT_TOKEN_RE.finditer(segment):
        numerator = _exact_number(match.group("numerator"), allow_zero=True)
        if numerator is None:
            continue
        rates.append({
            "value": numerator / 100,
            "unit": _rate_unit(segment, match.start(), match.end()),
            "start": match.start(),
            "end": match.end(),
        })
    return sorted(rates, key=lambda rate: rate["start"])


def _fraction_text(value: Fraction) -> str:
    return str(value.numerator) if value.denominator == 1 else f"{value.numerator}/{value.denominator}"


def _rate_ratio_mismatch(content: str) -> str | None:
    """合同审查草稿中，只拒绝同一句中两个比率被明确写成相反倍数的硬算术错误。"""
    in_fence = False
    for raw_line in content.splitlines():
        stripped = raw_line.lstrip()
        if stripped.startswith(("```", "~~~")):
            in_fence = not in_fence
            continue
        if in_fence or re.match(r"^\s*>", raw_line):
            continue
        line = _NONASSERTION_QUOTE_RE.sub(lambda match: " " * len(match.group()), raw_line)
        for sentence in re.finditer(r"[^。！？!?；;]+[。！？!?；;]*", line):
            segment = sentence.group()
            if re.search(r"[?？]|是否|能否|可否|吗|如果|假如|假设|倘若|若", segment):
                continue
            claim = _RATIO_CLAIM_RE.search(segment)
            rates = _segment_rates(segment)
            if len(rates) != 2 or rates[0]["value"] == 0 or rates[1]["value"] == 0:
                continue
            if rates[0]["unit"] != rates[1]["unit"]:
                continue
            if claim:
                if claim.group("former") == claim.group("latter"):
                    continue
                if rates[1]["end"] > claim.start():
                    continue
                context_before = segment[max(0, claim.start() - 20):claim.start()]
                context_after = segment[claim.end():claim.end() + 12]
                claimed = _exact_number(claim.group("multiple"), allow_zero=False)
                if claimed is None:
                    continue
                former_is_rate_one = claim.group("former") == "前者"
                actual = (rates[0]["value"] / rates[1]["value"] if former_is_rate_one
                          else rates[1]["value"] / rates[0]["value"])
                direction = "前者/后者" if former_is_rate_one else "后者/前者"
            else:
                if not _DIRECT_RATIO_BRIDGE_RE.fullmatch(
                        segment, rates[0]["end"], rates[1]["start"]):
                    continue
                direct_claim = _DIRECT_RATIO_CLAIM_RE.match(segment, rates[1]["end"])
                if direct_claim is None:
                    continue
                context_before = segment[max(0, rates[0]["start"] - 20):rates[0]["start"]]
                context_after = segment[direct_claim.end():direct_claim.end() + 12]
                claimed = _exact_number(direct_claim.group("multiple"), allow_zero=False)
                if claimed is None:
                    continue
                actual = rates[0]["value"] / rates[1]["value"]
                direction = "第一项/第二项"
            if re.search(r"(?:并非|不是|不构成|不能|不应|不得|不存在|不具有)[^，。；]{0,12}$",
                         context_before):
                continue
            if re.match(r"\s*(?:的说法)?(?:不成立|不正确|有误)", context_after):
                continue
            if actual == claimed:
                continue
            unit = f"/{rates[0]['unit']}" if rates[0]["unit"] else ""
            return (
                f"违约金比例换算不一致：前者={_fraction_text(rates[0]['value'])}{unit}，"
                f"后者={_fraction_text(rates[1]['value'])}{unit}；"
                f"按{direction}计算的准确倍数为{_fraction_text(actual)}倍，"
                f"草稿表述为{_fraction_text(claimed)}倍。请核对原文比例后重新保存。"
            )
    return None


def _citation_check(root: str, case_id: str, task: dict, index: dict, content: str,
                    skills_dirs) -> tuple[dict, list[dict]]:
    t0 = time.monotonic()
    kind = checks.skill_kind(skills_dirs, task.get("skill"))
    check, cites = checks.check_text(content, checks.MaterialSet.from_case(root, index), kind)
    logs.event("checks", "draft", case_id=case_id, duration_ms=(time.monotonic() - t0) * 1000)
    return check, cites


def citation_check(ctx: ToolContext, content: str) -> tuple[dict, list[dict]]:
    """出处核对（T10）：按任务 Skill 的 kind 区分 G 类；不查 D 类（裁决 1）。日志只记元数据。"""
    return _citation_check(ctx.root, ctx.case_id, ctx.task, ctx.index(), content, ctx.skills_dirs)


def merge_citations(old: list[dict], new: list[dict]) -> list[dict]:
    """本任务全部草稿的出处，按（材料编号、位置）去重（裁决 6）；同一处以最新这次保存的为准
    （两次保存之间材料重新导入过，material_version 取新的；复核 NOTE）。"""
    out = {(c["material_id"], json.dumps(c["loc"], sort_keys=True)): c for c in old}
    for c in new:
        out[(c["material_id"], json.dumps(c["loc"], sort_keys=True))] = c
    return list(out.values())


def save_draft(ctx: ToolContext, a: dict) -> dict:
    title = a["title"].strip()
    if not title:
        raise ApiError("INVALID_ARGUMENT", "empty_title")
    tid = ctx.task["task_id"]
    # 取版本号、写文件、改 result.json 都在这个任务的锁里（P1-3、P2-2）；
    # 匹配已有版本不分大小写：NTFS 上 Report-v1.md 和 report-v1.md 是同一个文件
    with ctx.tasks.task_lock(tid):
        # 在任务锁里再核一次状态：/core/tool 在锁外查过，这之间 end 可能已经插进来（F2）
        task = ctx.tasks.locate(tid)[2]
        if task["state"] != "running":
            raise ApiError("TASK_NOT_FOUND", "not_running")
        return _save_locked(
            ctx.tasks, ctx.root, ctx.case_id, task, title, a["content"],
            check_fn=lambda: citation_check(ctx, a["content"]),
            coverage_fn=lambda: ctx.tasks.coverage(ctx.root, ctx.case_id, tid),
        )


def _save_locked(tasks, root: str, case_id: str, task: dict, title: str, content: str,
                 *, check_fn, coverage_fn) -> dict:
    """调用方持有来源任务锁；只写一个新版本，并在 metadata 失败时收回本次新文件。"""
    if task.get("skill") == "contract-review":
        mismatch = _rate_ratio_mismatch(content)
        if mismatch is not None:
            raise ApiError("INVALID_ARGUMENT", "rate_ratio_mismatch", mismatch)
    tid = task["task_id"]
    drafts_rel = tasks.rel(tid, "草稿")
    version = tasks.next_draft_version(root, title, ".md")   # 本案同标题接着往上加，不分任务
    rel = f"{drafts_rel}/{title}-v{version}.md"
    target = gate.resolve_write(root, rel, op="save_draft")
    if target.exists():
        raise ApiError("INVALID_ARGUMENT", "target_exists")
    gate.write_bytes(root, rel, content.encode("utf-8"), op="save_draft")  # 标题是设备名等：闸门拒绝
    try:
        check, cites = check_fn()
        cov = coverage_fn()
        res = tasks.result(root, tid)
        res["drafts"].append({"title": title, "path": rel, "version": version})
        res.update(citation_check=check, coverage=cov, citations=merge_citations(res["citations"], cites))
        tasks.save_result(root, res)
    except BaseException:
        try:
            gate.delete_work_file(root, rel, op="save_draft_rollback")
        except Exception as exc:  # noqa: BLE001 保留原异常；清理失败只记类型
            logs.event("draft", "rollback", status="fail", case_id=case_id, error=type(exc).__name__)
        raise
    # 正式草稿存好了：进度文件清掉（T14 派修；之后模型再回复，progress 会重写，task/end 时再清）
    gate.delete_work_file(root, f"{drafts_rel}/{IN_PROGRESS}", op="save_draft")
    not_fully = [p["name"] for p in cov["partially_read"]] + cov["not_read"]
    return {"path": rel, "version": version, "citation_check": check, "coverage": cov, "not_fully_read": not_fully}


def save_document_ui(tasks, materials, skills_dirs, a: dict) -> dict:
    """界面保存：来源任务结束后，从登记恢复标题并写同标题新草稿版本。"""
    source = documents.locate_source(tasks, a["case_id"], a["path"])
    if contracts.errors("tools/case_save_draft.schema.json", "#/$defs/args",
                        {"title": source["title"], "content": a["content"]}):
        raise ApiError("INVALID_ARGUMENT", "source_metadata")
    tid = source["task_id"]
    with tasks.task_lock(tid):
        root, task = documents.recheck_stable_source(tasks, source)
        saved = _save_locked(
            tasks, root, a["case_id"], task, source["title"], a["content"],
            check_fn=lambda: _citation_check(
                root, a["case_id"], task, tasks.index_for_task(task), a["content"], skills_dirs),
            coverage_fn=lambda: tasks.coverage(root, a["case_id"], tid),
        )
    return {"task_id": tid, **saved}


def suggest_wiki(ctx: ToolContext, a: dict) -> dict:
    with _WIKI_LOCK:
        return _suggest_wiki(ctx, a)


def _suggest_wiki(ctx: ToolContext, a: dict) -> dict:
    p = gate.resolve_internal(ctx.root, PENDING_REL, op="suggest_wiki")
    data = contracts.read_json(p) if p.is_file() else {"v": 1, "suggestions": []}
    contracts.validate(PENDING_SCHEMA, "", data)
    n = max((int(s["id"][1:]) for s in data["suggestions"]), default=0) + 1
    if n > 9999:
        raise ApiError("INVALID_ARGUMENT", "too_many_suggestions")
    sid = f"S{n:04d}"
    data["suggestions"].append({"id": sid, "field": a["field"], "value": a["value"], "source": a["source"],
                                "reason": a.get("reason"), "task_id": ctx.task["task_id"],
                                "created_at": datetime.now().astimezone().isoformat(timespec="seconds"),
                                "status": "pending"})
    contracts.validate(PENDING_SCHEMA, "", data)
    gate.write_bytes(ctx.root, PENDING_REL, json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
                     op="suggest_wiki")
    return {"suggestion_id": sid}
