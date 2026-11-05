"""case_save_draft、case_suggest_wiki。"""
from __future__ import annotations

import json
import threading
import time
from datetime import datetime

from .. import checks, contracts, logs
from ..case import documents, gate
from ..case.task import IN_PROGRESS
from ..errors import ApiError
from . import ToolContext

PENDING_REL = "工作区/wiki/待确认.json"
PENDING_SCHEMA = "files/wiki_pending.schema.json"
_WIKI_LOCK = threading.Lock()  # 待确认.json 的读-改-写（P2-3）；只是本地读写，跨案件共用一把也不会久等


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
                root, a["case_id"], task, materials.index(a["case_id"]), a["content"], skills_dirs),
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
