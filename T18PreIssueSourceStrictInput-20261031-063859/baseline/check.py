#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""T18 出稿前原文回读：只对真实合成案件副本跑 GET /api/source 的实际请求。

用法：
    python check.py <全新输出目录>

本脚本只做一件事：把执行令批准的 13 条出处，逐条打到原始服务的 GET /api/source
路由上，核对返回的原文单元与批准预期逐字一致；同时确认 GET 前后副本、原始来源、
案件登记都没有被改动。

边界（详见同目录 README.md）：
- 不建默认 app、不跑 lifespan、不取 Key、不连 6000D/395、不开任何 TCP；
- 导入产品代码之前先装守卫：联网与子进程一律拒绝，被拒即失败并记录尝试种类；
- 只复制执行令批准的 20 个案件文件字节副本，案件登记只改 root 重绑；
- 失败只报有界错误类名，不打印异常内容、案卷内容或日志内容。

本文件在 B 线未运行过（source NOT RUN）：不导入、不自检、不发请求。
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import os
import pathlib
import socket
import subprocess
import sys
import types

sys.dont_write_bytecode = True

import httpx
from starlette.applications import Starlette

_ATTEMPTS: list[str] = []
_SAVED: list[tuple[object, str, object]] = []


class GuardDenied(RuntimeError):
    """守卫拦下的联网或子进程尝试。"""


class CheckerError(RuntimeError):
    """本脚本自检不通过（只报类名，不报内容）。"""


def _deny(kind: str) -> None:
    _ATTEMPTS.append(kind)
    raise GuardDenied(kind)


def _install_guards() -> None:
    """把联网与子进程入口换成拒绝实现；只记尝试种类，不记参数。"""

    def wrap(obj: object, name: str, kind: str) -> None:
        orig = getattr(obj, name, None)
        if orig is None:
            return
        _SAVED.append((obj, name, orig))

        def guarded(*args, **kwargs):  # noqa: ANN002, ANN003, ANN202
            _deny(kind)

        guarded.__name__ = kind
        setattr(obj, name, guarded)

    wrap(socket.socket, "connect", "socket.connect")
    wrap(socket.socket, "connect_ex", "socket.connect_ex")
    wrap(socket.socket, "bind", "socket.bind")
    wrap(socket.socket, "listen", "socket.listen")
    wrap(socket, "create_connection", "socket.create_connection")
    wrap(subprocess, "Popen", "subprocess.Popen")
    for name in ("run", "call", "check_call", "check_output"):
        wrap(subprocess, name, "subprocess." + name)
    for name in ("system", "posix_spawn", "posix_spawnp", "startfile",
                 "execv", "execve", "execvp", "execvpe",
                 "execl", "execle", "execlp", "execlpe"):
        wrap(os, name, "os." + name)


def _restore_guards() -> None:
    while _SAVED:
        obj, name, orig = _SAVED.pop()
        setattr(obj, name, orig)


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _is_link(path: pathlib.Path) -> bool:
    stat = os.lstat(path)
    if os.path.islink(path):
        return True
    attrs = getattr(stat, "st_file_attributes", 0)
    return bool(attrs & 0x400)  # FILE_ATTRIBUTE_REPARSE_POINT


def _snapshot(root: pathlib.Path) -> dict:
    """{相对路径: {"sha256", "bytes", "mtime_ns}}；不跟随链接。"""
    out: dict[str, dict] = {}
    if not root.exists():
        return out
    for dirpath, _dirnames, filenames in os.walk(root, followlinks=False):
        for name in filenames:
            path = pathlib.Path(dirpath) / name
            rel = str(path.relative_to(root)).replace("\\", "/")
            stat = os.lstat(path)
            out[rel] = {"sha256": _sha256_file(path), "bytes": stat.st_size,
                        "mtime_ns": stat.st_mtime_ns}
    return out


def _copy_case(approved: dict, fresh_case: pathlib.Path) -> None:
    """只复制批准的 20 个文件，逐个核对字节数与 SHA256，并拒绝链接与联接。"""
    for entry in approved["case_files"]:
        src = pathlib.Path(entry["path"])
        if not src.is_file():
            raise CheckerError("SourceFileMissing")
        if _is_link(src):
            raise CheckerError("SourceIsLink")
        data = src.read_bytes()
        if len(data) != int(entry["bytes"]):
            raise CheckerError("SourceBytesMismatch")
        if _sha256_bytes(data) != entry["sha256"]:
            raise CheckerError("SourceShaMismatch")
        dst = fresh_case / pathlib.Path(str(entry["relative"]).replace("\\", "/"))
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_bytes(data)
        src_stat = os.lstat(src)
        os.utime(dst, ns=(src_stat.st_atime_ns, src_stat.st_mtime_ns))
        if _sha256_file(dst) != entry["sha256"] or dst.stat().st_size != int(entry["bytes"]):
            raise CheckerError("CopyVerifyFailed")


def _write_registry(approved: dict, appdata: pathlib.Path, fresh_case: pathlib.Path) -> pathlib.Path:
    """照抄批准里的案件登记文档，只把 root 重绑到本次的全新副本。"""
    doc = approved["registry_document"]
    cases = []
    for item in doc.get("cases", []):
        entry = dict(item)
        entry["root"] = str(fresh_case)
        cases.append(entry)
    payload = {"v": doc.get("v", 1), "cases": cases}
    path = appdata / "cases.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return path


def _index_versions(approved: dict, fresh_case: pathlib.Path) -> dict:
    """核对副本 index.json 的材料版本、原件字节 SHA 与批准版本三者一致。"""
    index_path = fresh_case / "工作区" / "材料" / "index.json"
    data = json.loads(index_path.read_text(encoding="utf-8"))
    by_id: dict[str, dict] = {}
    for item in data.get("materials", []) or []:
        by_id[str(item.get("material_id"))] = item
    approved_by_sha: dict[str, str] = {}
    for entry in approved["case_files"]:
        approved_by_sha[str(entry["sha256"])] = str(entry["relative"])
    out: dict[str, dict] = {}
    for req in approved["requests"]:
        mid = str(req.get("material_id"))
        version = str(req.get("material_version"))
        meta = by_id.get(mid)
        entry = out.setdefault(mid, {"index_sha_ok": None, "raw_sha_ok": None, "rel_ok": None})
        if meta is None:
            continue
        entry["index_sha_ok"] = meta.get("sha256") == version
        rel = meta.get("rel_path")
        rel_sha_ok = None
        if isinstance(rel, str) and rel:
            candidate = fresh_case / pathlib.Path(rel.replace("\\", "/"))
            if candidate.is_file():
                rel_sha_ok = _sha256_file(candidate) == version
        entry["rel_ok"] = rel_sha_ok
        byte_copy_ok = False
        rel_name = approved_by_sha.get(version)
        if rel_name is not None:
            copied = fresh_case / pathlib.Path(rel_name.replace("\\", "/"))
            byte_copy_ok = copied.is_file() and _sha256_file(copied) == version
        entry["raw_sha_ok"] = bool(byte_copy_ok) and (rel_sha_ok is not False)
    return out


def _select_source_route(routes) -> object:
    hits = []
    for route in routes:
        path = getattr(route, "path", None)
        methods = getattr(route, "methods", None) or ()
        if path == "/api/source" and "GET" in methods:
            hits.append(route)
    if len(hits) != 1:
        raise CheckerError("SourceRouteNotUnique")
    return hits[0]


def _base_record(index: int, req: dict) -> dict:
    expected_loc = req.get("expected_loc") or {}
    return {
        "i": index,
        "material_id": req.get("material_id"),
        "unit": expected_loc.get("unit"),
        "from": expected_loc.get("from"),
        "http": None,
        "ok": False,
        "name_match": False,
        "loc_match": False,
        "text_match": False,
        "png_none": False,
        "source_changed": None,
        "original_status": None,
        "text_sha256": None,
        "expected_text_sha256": _sha256_bytes(str(req.get("expected_text", "")).encode("utf-8")),
        "error_class": None,
        "error_code": None,
    }


def _error_record(index: int, req: dict, exc: Exception) -> dict:
    record = _base_record(index, req)
    record["error_class"] = type(exc).__name__
    code = getattr(exc, "code", None)
    if isinstance(code, str):
        record["error_code"] = code
    return record


def _inspect(index: int, req: dict, resp) -> dict:
    record = _base_record(index, req)
    record["http"] = resp.status_code
    try:
        body = resp.json()
    except Exception:  # noqa: BLE001
        body = None
    if not isinstance(body, dict) or body.get("ok") is not True:
        return record
    value = body.get("value")
    if not isinstance(value, dict):
        return record
    record["ok"] = True
    loc = value.get("loc")
    loc = loc if isinstance(loc, dict) else {}
    expected_loc = req.get("expected_loc") or {}
    loc_ok = bool(expected_loc) and all(
        key in loc and loc[key] == expected for key, expected in expected_loc.items())
    if "to" not in expected_loc and loc.get("to") not in (None, loc.get("from")):
        loc_ok = False
    record["unit"] = loc.get("unit")
    record["from"] = loc.get("from")
    record["name_match"] = value.get("name") == req.get("expected_name")
    record["loc_match"] = bool(loc_ok)
    text = value.get("text")
    record["text_match"] = text == req.get("expected_text")
    if isinstance(text, str):
        record["text_sha256"] = _sha256_bytes(text.encode("utf-8"))
    record["png_none"] = value.get("page_png_base64", "missing") is None
    record["source_changed"] = value.get("source_changed")
    record["original_status"] = value.get("original_status")
    return record


async def _run_gets(app, approved: dict, case_id: str, task_id: str, state: dict) -> list[dict]:
    transport = httpx.ASGITransport(app=app)
    records: list[dict] = []
    try:
        async with httpx.AsyncClient(transport=transport, base_url="http://in-memory.invalid") as client:
            for index, req in enumerate(approved["requests"], 1):
                params = {
                    "case_id": case_id,
                    "material_id": req.get("material_id"),
                    "citation": req.get("citation"),
                    "task_id": task_id,
                }
                try:
                    resp = await client.get("/api/source", params=params)
                except Exception as exc:  # noqa: BLE001
                    records.append(_error_record(index, req, exc))
                    continue
                records.append(_inspect(index, req, resp))
        state["client_closed"] = True
    finally:
        closer = getattr(transport, "aclose", None)
        if closer is not None:
            try:
                await closer()
            except Exception:  # noqa: BLE001
                pass
        state["transport_closed"] = True
    return records


def _run(argv: list[str], state: dict) -> dict:
    if len(argv) != 2:
        raise CheckerError("UsageError")
    out_dir = pathlib.Path(argv[1]).expanduser().resolve()
    script_dir = pathlib.Path(__file__).resolve().parent
    approved = json.loads((script_dir / "literal-inputs.json").read_text(encoding="utf-8"))

    case_id = approved["case_id"]
    task_id = approved["task_id"]
    fresh_case = out_dir / "case"
    appdata = out_dir / "appdata"
    if fresh_case.exists():
        raise CheckerError("OutputCaseNotFresh")
    fresh_case.mkdir(parents=True, exist_ok=True)
    appdata.mkdir(parents=True, exist_ok=True)

    _copy_case(approved, fresh_case)
    registry_path = _write_registry(approved, appdata, fresh_case)

    case_before = _snapshot(fresh_case)
    old_root = pathlib.Path(approved["old_case"])
    old_before = _snapshot(old_root)
    registry_before = _sha256_file(registry_path)
    versions = _index_versions(approved, fresh_case)

    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)

        # 事件循环的内部自管道在 Windows 上要建本地 socketpair：必须在守卫装上之前把
        # 事件循环和它的工作线程备好（守卫只拦网络与子进程，不拦本地自管道）。
        from starlette.concurrency import run_in_threadpool

        async def _warm() -> None:
            await run_in_threadpool(lambda: None)

        loop.run_until_complete(_warm())

        _install_guards()

        service_path = pathlib.Path(approved["service_path"])
        contracts_path = pathlib.Path(approved["contracts_path"])
        if str(service_path) not in sys.path:
            sys.path.insert(0, str(service_path))

        from lawbench import contracts as lb_contracts
        from lawbench import logs as lb_logs
        from lawbench.api import ui as lb_ui
        from lawbench.case.materials import Materials
        from lawbench.case.registry import CaseRegistry

        lb_contracts.set_contracts_dir(contracts_path)
        lb_logs.setup(appdata)
        cases = CaseRegistry(appdata, sql_path=contracts_path / "case_db.sql")
        materials = Materials(cases, lo_base=appdata / "临时" / "lo",
                              ref_context=cases.ref_context_for)
        st = types.SimpleNamespace(
            config=types.SimpleNamespace(validate_responses=True),
            cases=cases,
            materials=materials,
        )
        route = _select_source_route(lb_ui.routes(st))
        app = Starlette(routes=[route])
        records = loop.run_until_complete(_run_gets(app, approved, case_id, task_id, state))
    finally:
        try:
            asyncio.set_event_loop(None)
        except Exception:  # noqa: BLE001
            pass
        try:
            loop.close()
        except Exception:  # noqa: BLE001
            pass

    case_after = _snapshot(fresh_case)
    old_after = _snapshot(old_root)
    registry_after = _sha256_file(registry_path)
    versions_ok = bool(versions) and all(
        entry.get("index_sha_ok") and entry.get("raw_sha_ok") for entry in versions.values())
    passed_records = [
        rec for rec in records
        if rec.get("http") == 200
        and rec.get("ok")
        and rec.get("name_match")
        and rec.get("loc_match")
        and rec.get("text_match")
        and rec.get("png_none")
        and rec.get("source_changed") is False
        and rec.get("original_status") == "ok"
        and not rec.get("error_class")
    ]
    return {
        "original_business_status": approved.get("original_business_status"),
        "expected_gets": int(approved.get("expected_gets", len(approved["requests"]))),
        "gets_total": len(records),
        "gets_passed": len(passed_records),
        "attempt_kinds": list(_ATTEMPTS),
        "case_files": len(case_before),
        "case_files_unchanged": case_before == case_after,
        "old_source_files": len(old_before),
        "old_source_files_unchanged": old_before == old_after,
        "registry_unchanged": registry_before == registry_after,
        "index_and_raw_sha_ok": versions_ok,
        "records": records,
    }


def _flag(value) -> str:
    if value is None:
        return "n/a"
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def _record_line(rec: dict) -> str:
    parts = [
        "{0:02d}".format(int(rec.get("i") or 0)),
        "material=" + str(rec.get("material_id")),
        "unit=" + str(rec.get("unit")),
        "from=" + str(rec.get("from")),
        "http=" + str(rec.get("http")),
        "ok=" + _flag(rec.get("ok")),
        "name=" + _flag(rec.get("name_match")),
        "loc=" + _flag(rec.get("loc_match")),
        "text=" + _flag(rec.get("text_match")),
        "png_none=" + _flag(rec.get("png_none")),
        "source_changed=" + str(rec.get("source_changed")),
        "original_status=" + str(rec.get("original_status")),
        "text_sha256=" + str(rec.get("text_sha256")),
        "expected_text_sha256=" + str(rec.get("expected_text_sha256")),
    ]
    if rec.get("error_class"):
        parts.append("error_class=" + str(rec.get("error_class")))
        if rec.get("error_code"):
            parts.append("error_code=" + str(rec.get("error_code")))
    return " ".join(parts)


def _print_report(report: dict) -> None:
    print("T18 pre-issue source readback (GET /api/source only)")
    print("scope=GET_/api/source_only")
    print("original_business_status=" + str(report.get("original_business_status", "FAILED")))
    print("original_business_rejudged=false")
    print("source_only=false")
    print("whole_T18_pass=false")
    print("expected_gets=" + str(report.get("expected_gets", "n/a")))
    print("gets_total=" + str(report.get("gets_total", "n/a")))
    print("gets_passed=" + str(report.get("gets_passed", "n/a")))
    print("attempt_kinds=" + json.dumps(report.get("attempt_kinds", []), ensure_ascii=False))
    print("case_files=" + str(report.get("case_files", "n/a")))
    print("case_files_unchanged=" + _flag(report.get("case_files_unchanged")))
    print("old_source_files=" + str(report.get("old_source_files", "n/a")))
    print("old_source_files_unchanged=" + _flag(report.get("old_source_files_unchanged")))
    print("registry_unchanged=" + _flag(report.get("registry_unchanged")))
    print("index_and_raw_sha_ok=" + _flag(report.get("index_and_raw_sha_ok")))
    print("client_closed=" + _flag(report.get("client_closed")))
    print("transport_closed=" + _flag(report.get("transport_closed")))
    print("logs_closed=" + _flag(report.get("logs_closed")))
    print("guards_restored=" + _flag(report.get("guards_restored")))
    if report.get("error_class"):
        print("error_class=" + str(report.get("error_class")))
    print("passed=" + _flag(report.get("passed")))
    for rec in report.get("records", []) or []:
        print(_record_line(rec))


def main(argv: list[str]) -> int:
    state = {"client_closed": False, "transport_closed": False,
             "logs_closed": False, "guards_restored": False}
    report: dict = {}
    error: str | None = None
    try:
        report = _run(argv, state)
    except GuardDenied:
        error = "GuardDenied"
    except Exception as exc:  # noqa: BLE001
        error = type(exc).__name__
    finally:
        try:
            module = sys.modules.get("lawbench.logs")
            if module is not None:
                module.close()
                state["logs_closed"] = True
        except Exception:  # noqa: BLE001
            pass
        try:
            _restore_guards()
            state["guards_restored"] = True
        except Exception:  # noqa: BLE001
            pass

    report.update(state)
    if error is not None:
        report["error_class"] = error
        report["passed"] = False
    else:
        report["passed"] = bool(
            report.get("gets_total") == report.get("expected_gets")
            and report.get("gets_total") == report.get("gets_passed")
            and not report.get("attempt_kinds")
            and report.get("case_files_unchanged")
            and report.get("old_source_files_unchanged")
            and report.get("registry_unchanged")
            and report.get("index_and_raw_sha_ok")
            and report.get("client_closed")
            and report.get("transport_closed")
            and report.get("logs_closed")
            and report.get("guards_restored")
        )
    _print_report(report)
    return 0 if report.get("passed") else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv))
