"""已登记 Markdown 文稿的来源定位与界面保存复核。

界面只提供 case_id 和登记路径；标题、任务和案件归属一律从本案登记恢复。
本模块不导入 TaskStore、Materials 或 tools 包，实际写入由 tools.drafts 共用。
"""
from __future__ import annotations

import os
import re

from ..errors import ApiError
from . import gate

_TASK_ID = r"[TP]-\d{14}-[0-9a-f]{4}"
_DRIVE = re.compile(r"^[A-Za-z]:")


def _invalid(reason: str) -> ApiError:
    return ApiError("INVALID_ARGUMENT", reason)


def md_source_shape(path: str) -> str:
    """只接受草稿与成果两种 Markdown 形状；不规范化客户端给的路径。"""
    if not isinstance(path, str) or not path:
        raise _invalid("source_path")
    if "\\" in path or path.startswith("/") or _DRIVE.match(path) or os.path.isabs(path):
        raise _invalid("source_path")
    parts = path.split("/")
    if any(part in ("", ".", "..") for part in parts):
        raise _invalid("source_path")
    if len(parts) == 5 and parts[:2] == ["工作区", "任务"] and parts[3] == "草稿" \
            and re.fullmatch(_TASK_ID, parts[2]) and parts[4].endswith(".md"):
        return "draft"
    if len(parts) == 2 and parts[0] == "成果" and parts[1].endswith(".md"):
        return "output"
    raise _invalid("source_path")


def _root_key(root: str) -> str:
    return os.path.normcase(os.path.abspath(os.path.realpath(root)))


def locate_source(tasks, case_id: str, path: str) -> dict:
    """从本案任务草稿和成果索引中找回唯一的实际来源。"""
    kind = md_source_shape(path)
    matches: list[dict] = []
    located = None

    if kind == "draft":
        task_id = path.split("/")[2]
        try:
            located = tasks.locate(task_id)
        except ApiError as exc:
            if exc.code == "TASK_NOT_FOUND":
                raise _invalid("source_unregistered") from exc
            raise
        cid, root, task = located
        if cid != case_id or task["case_id"] != case_id or task["task_id"] != task_id:
            raise _invalid("source_unregistered")
        result = tasks.result(root, task_id)
        if result["task_id"] != task_id:
            raise _invalid("source_unregistered")
        for draft in result["drafts"]:
            if draft["path"] == path:
                matches.append({
                    "case_id": case_id,
                    "kind": "draft",
                    "task_id": task_id,
                    "title": draft["title"],
                    "version": draft["version"],
                    "path": path,
                })
    else:
        outputs = tasks.outputs(case_id)
        for output in outputs["outputs"]:
            for file in output["files"]:
                if file["format"] == "md" and file["path"] == path:
                    matches.append({
                        "case_id": case_id,
                        "kind": "output",
                        "task_id": output["task_id"],
                        "title": output["title"],
                        "version": output["version"],
                        "path": path,
                    })

    if len(matches) != 1:
        raise _invalid("source_unregistered" if not matches else "source_ambiguous")
    if matches[0]["kind"] != kind:
        raise _invalid("source_kind")

    if located is None:
        located = tasks.locate(matches[0]["task_id"])
    cid, root, task = located
    if cid != case_id or task["case_id"] != case_id or task["task_id"] != matches[0]["task_id"]:
        raise ApiError("TASK_NOT_FOUND", "other_case")
    matches[0]["root"] = root
    return matches[0]


def recheck_stable_source(tasks, source: dict) -> tuple[str, dict]:
    """调用方必须持有来源任务锁；再次核对案件、根目录、任务、登记元数据和文件。"""
    kind = md_source_shape(source["path"])
    if kind != source["kind"]:
        raise _invalid("source_changed")
    if kind == "draft" and source["path"].split("/")[2] != source["task_id"]:
        raise _invalid("source_changed")

    cid, root, task = tasks.locate(source["task_id"])
    if cid != source["case_id"] or _root_key(root) != _root_key(source["root"]) \
            or task["case_id"] != source["case_id"] or task["task_id"] != source["task_id"]:
        raise ApiError("TASK_NOT_FOUND", "other_case")
    if task["state"] != "finished":
        raise ApiError("TASK_NOT_FOUND", "not_finished")

    result = tasks.result(root, source["task_id"])
    if result["task_id"] != source["task_id"] or result["status"] == "running":
        raise ApiError("TASK_NOT_FOUND", "result_running")

    if source["kind"] == "draft":
        registered = [
            draft for draft in result["drafts"]
            if draft["path"] == source["path"] and draft["title"] == source["title"]
            and draft["version"] == source["version"]
        ]
    else:
        registered = [
            {"title": output["title"], "task_id": output["task_id"],
             "path": file["path"], "version": output["version"]}
            for output in tasks.outputs(source["case_id"])["outputs"]
            if output["title"] == source["title"] and output["task_id"] == source["task_id"]
            and output["version"] == source["version"]
            for file in output["files"]
            if file["format"] == "md" and file["path"] == source["path"]
        ]
    if len(registered) != 1:
        raise _invalid("source_changed")

    file_path = gate.resolve_internal(root, source["path"], op="documents_save")
    if gate.is_link(file_path) or not file_path.is_file():
        raise _invalid("source_not_file")
    return root, task
