import asyncio
import copy
import hashlib
import json
import threading
import time
from pathlib import Path
from types import SimpleNamespace

import httpx
import pytest
from starlette.applications import Starlette

try:
    from lawbench import CaseRegistry, TaskStore
except ImportError:
    from lawbench.cases.registry import CaseRegistry
    from lawbench.tasks.store import TaskStore
try:
    from lawbench import schemas
except ImportError:
    from lawbench.ui import schemas
from lawbench.config import Config
from lawbench.ui import routes as ui_routes


REPO = Path(__file__).resolve().parents[5]
CONTRACTS = REPO / "contracts"
CASES = {"v": 1, "cases": [{"case_id": "3f2b9c1e-7a4d-4e8b-9c2a-1b5d6e7f8a90",
    "root": r"D:\案件\张某诈骗案", "name": "张某诈骗案",
    "last_opened": "2026-09-28T09:30:00+08:00"}]}
TASK = {"v": 1, "task_id": "T-20260928093000-7c1f",
    "case_id": "3f2b9c1e-7a4d-4e8b-9c2a-1b5d6e7f8a90", "kind": "agent",
    "session_id": "s_01HZX", "entry": "case-analysis", "skill": "criminal-reading-notes",
    "route": "external", "step": None, "inputs": [{"index": 1, "title": "刑事阅卷笔录",
        "path": "成果/刑事阅卷笔录-v1.md", "version": 1,
        "sha256": "a" * 64}], "params": {"thinking": "低", "window": "64K",
        "max_tokens": 16384}, "budget": {"model_calls": 8, "tool_calls": 24,
        "minutes": 45}, "state": "pending", "created_at": "2026-09-28T09:30:00+08:00"}
RESULT = {"v": 1, "task_id": "T-20260928093000-7c1f", "status": "completed",
    "usage": {"model_calls": 6, "tool_calls": 14, "elapsed_s": 480},
    "drafts": [{"title": "刑事阅卷笔录", "path": "工作区/任务/T-20260928093000-7c1f/草稿/"
        "刑事阅卷笔录-v2.md", "version": 2}], "citation_check": {"passed": False,
        "problems": [{"class": "B", "severity": "must_fix", "excerpt": "借款金额 60,000 元〔借条 第3页〕",
            "citation": "〔借条 第3页〕", "message": "该金额在〔借条 第2页〕，不在第3页"}],
        "stats": {"citations": 12, "must_fix": 1, "hints": 0}}, "coverage": {"total": 3,
        "fully_read": ["借条"], "partially_read": [{"name": "银行流水", "read_units": 40,
            "total_units": 120}], "not_read": [], "unreadable": [{"name": "证据/照片2",
            "reason": "识别未完成"}]}, "citations": [{"material_id": "M0001",
        "material_version": "a" * 64, "name": "借条", "loc": {"unit": "page", "from": 2}}],
    "finished_at": "2026-09-28T09:30:00+08:00"}


def _json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8", newline="\n")


def _schema(payload):
    for model in vars(schemas).values():
        fields = getattr(model, "model_fields", None)
        if isinstance(fields, dict) and set(fields) == set(payload):
            model.model_validate(payload)
            return
    raise AssertionError(f"no original schema for seed fields: {sorted(payload)}")


def _snapshot(root):
    return {str(path.relative_to(root)): (data, hashlib.sha256(data).hexdigest(),
            path.stat().st_mtime_ns) for path in sorted(root.rglob("*"))
            if path.is_file() and (data := path.read_bytes()) is not None}


@pytest.mark.parametrize("bad_value,bad_result_null", [
    (None, False), ([], False), ("bad-record", False), (17, False), (True, False),
    (None, True)])
def test_public_task_list_recovers_without_mutating_private_seeds(
        tmp_path, bad_value, bad_result_null):
    appdata, case_root = tmp_path / "appdata", tmp_path / "case"
    cases = copy.deepcopy(CASES)
    cases["cases"][0].update(root=str(case_root), name="T17 合成测试案件")
    good_id, bad_id = "T-20261101000000-0017", "T-20261101000001-0018"
    good_task, bad_task = copy.deepcopy(TASK), copy.deepcopy(TASK)
    good_result = copy.deepcopy(RESULT)
    for task, task_id in ((good_task, good_id), (bad_task, bad_id)):
        task.update(task_id=task_id, case_id=cases["cases"][0]["case_id"])
    good_result["task_id"] = good_id
    good_result["drafts"][0]["path"] = f"工作区/任务/{good_id}/草稿/刑事阅卷笔录-v2.md"
    good_dir, bad_dir = case_root / "工作区" / "任务" / good_id, case_root / "工作区" / "任务" / bad_id
    _schema(cases)
    _schema(good_task)
    _schema(good_result)
    _json(appdata / "cases.json", cases)
    _json(good_dir / "task.json", good_task)
    _json(good_dir / "result.json", good_result)
    draft = case_root / good_result["drafts"][0]["path"]
    draft.parent.mkdir(parents=True, exist_ok=True)
    draft.write_bytes("T17 synthetic private draft bytes\n".encode("utf-8"))
    if bad_result_null:
        bad_task["state"] = "finished"
        _schema(bad_task)
        _json(bad_dir / "task.json", bad_task)
        _json(bad_dir / "result.json", None)
    else:
        _json(bad_dir / "task.json", bad_value)

    expected = [{"task_id": good_id, "skill": good_task["skill"],
        "status": good_result["status"], "drafts": good_result["drafts"],
        "citation_passed": good_result["citation_check"]["passed"],
        "finished_at": good_result["finished_at"], "coverage": good_result["coverage"],
        "citation_check": good_result["citation_check"]}]
    registry = CaseRegistry(appdata, CONTRACTS / "case_db.sql")
    store = TaskStore(registry, None, None)
    config = Config(token="s" * 43, appdata=appdata, skills_dirs=[],
                    contracts_dir=CONTRACTS)
    state = SimpleNamespace(config=config, tasks=store)
    route_space = ui_routes.routes(state)
    route_items = getattr(route_space, "routes", route_space)
    original_route = next(route for route in route_items
                          if route.path == "/api/tasks" and route.methods == {"GET"})
    app = Starlette(routes=[original_route])
    before, before_threads = _snapshot(tmp_path), set(threading.enumerate())
    logs = None
    main_failure = state_failure = cleanup_failure = None
    try:
        async def exercise():
            actual = store.list(cases["cases"][0]["case_id"])
            if hasattr(actual, "model_dump"):
                actual = actual.model_dump(mode="json")
            if isinstance(actual, dict) and set(actual) == {"tasks"}:
                actual = actual["tasks"]
            assert actual == expected
            transport = httpx.ASGITransport(app=app)
            try:
                async with httpx.AsyncClient(transport=transport,
                        base_url="http://lawbench.test") as client:
                    response = await client.get("/api/tasks", params={
                        "case_id": cases["cases"][0]["case_id"]})
                    assert response.status_code == 200
                    assert response.json() == expected
            finally:
                close = getattr(transport, "aclose", None)
                if close is not None:
                    await close()
        async_failure = thread_failure = None
        try:
            asyncio.run(exercise())
        except BaseException as exc:
            async_failure = exc
        workers = [thread for thread in threading.enumerate()
                   if thread not in before_threads and thread.is_alive()
                   and thread.name.startswith("AnyIO worker thread")]
        deadline = time.monotonic() + 2.0
        for worker in workers:
            worker.join(max(0.0, deadline - time.monotonic()))
        try:
            assert not any(worker.is_alive() for worker in workers)
        except BaseException as exc:
            thread_failure = exc
        run_failures = [exc for exc in (async_failure, thread_failure) if exc]
        if run_failures:
            raise BaseExceptionGroup("async task-list failures", run_failures)
    except BaseException as exc:
        main_failure = exc
    finally:
        try:
            assert _snapshot(tmp_path) == before
        except BaseException as exc:
            state_failure = exc
        finally:
            if logs is not None:
                try:
                    logs.close()
                except BaseException as exc:
                    cleanup_failure = exc
    failures = [exc for exc in (main_failure, state_failure, cleanup_failure) if exc]
    if failures:
        raise BaseExceptionGroup("task-list recovery failures", failures)
