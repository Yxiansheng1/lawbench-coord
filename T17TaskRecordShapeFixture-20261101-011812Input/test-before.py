import hashlib
import json
from pathlib import Path

import pytest

from lawbench import contracts
from lawbench.case.task import TaskStore


TASK_ID = "T-20260928093000-7c1f"
TASK_SCHEMA = "files/task.schema.json"
RESULT_SCHEMA = "files/result.schema.json"
VALID_TASK = {
    "v": 1,
    "task_id": TASK_ID,
    "case_id": "3f2b9c1e-7a4d-4e8b-9c2a-1b5d6e7f8a90",
    "kind": "agent",
    "session_id": "s_01HZX",
    "entry": "case-analysis",
    "skill": "criminal-reading-notes",
    "route": "external",
    "step": None,
    "inputs": [{
        "index": 1,
        "title": "刑事阅卷笔录",
        "path": "成果/刑事阅卷笔录-v1.md",
        "version": 1,
        "sha256": "a" * 64,
    }],
    "params": {"thinking": "低", "window": "64K", "max_tokens": 16384},
    "budget": {"model_calls": 8, "tool_calls": 24, "minutes": 45},
    "state": "pending",
    "created_at": "2026-09-28T09:30:00+08:00",
}
LEGACY_TASK = {
    key: value for key, value in VALID_TASK.items() if key != "route"
}
LEGACY_TASK["inputs"] = []


def _task_file(root: Path, name: str, payload) -> Path:
    path = root / Path(TaskStore.rel(TASK_ID)) / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return path


def _snapshot(path: Path):
    raw = path.read_bytes()
    return raw, hashlib.sha256(raw).hexdigest(), path.stat().st_mtime_ns


def _read(root: Path, path: Path, schema: str):
    return TaskStore._read(str(root), str(path.relative_to(root)), schema)


def _unchanged(path: Path, before) -> None:
    assert _snapshot(path) == before


def _contract_error(exc, schema: str) -> None:
    assert type(exc) is contracts.ContractError
    assert exc.schema == schema
    assert getattr(exc, "path", getattr(exc, "field_path", None)) == "/"


@pytest.mark.parametrize("payload", [None, [], "bad-record", 17, True])
def test_non_object_task_record_raises_contract_error(tmp_path, payload):
    path = _task_file(tmp_path, "file_task.json", payload)
    before = _snapshot(path)
    with pytest.raises(contracts.ContractError) as caught:
        _read(tmp_path, path, TASK_SCHEMA)
    _contract_error(caught.value, TASK_SCHEMA)
    _unchanged(path, before)


def test_valid_full_sample_returns_same_data_and_external_route(tmp_path):
    path = _task_file(tmp_path, "file_task.json", VALID_TASK)
    before = _snapshot(path)
    data = _read(tmp_path, path, TASK_SCHEMA)
    assert data == VALID_TASK
    assert data["route"] == "external"
    _unchanged(path, before)


def test_legacy_sample_returns_local_compatibility_without_rewrite(tmp_path):
    path = _task_file(tmp_path, "file_task.legacy.json", LEGACY_TASK)
    before = _snapshot(path)
    data = _read(tmp_path, path, TASK_SCHEMA)
    assert data == {**LEGACY_TASK, "route": "local"}
    _unchanged(path, before)


def test_invalid_explicit_route_is_not_silently_replaced(tmp_path):
    payload = dict(VALID_TASK, route="invalid-route")
    path = _task_file(tmp_path, "file_task.json", payload)
    before = _snapshot(path)
    with pytest.raises(contracts.ContractError) as caught:
        _read(tmp_path, path, TASK_SCHEMA)
    _contract_error(caught.value, TASK_SCHEMA)
    _unchanged(path, before)


def test_null_result_fails_original_schema_validation_unchanged(tmp_path):
    path = _task_file(tmp_path, "result.json", None)
    before = _snapshot(path)
    with pytest.raises(contracts.ContractError) as caught:
        _read(tmp_path, path, RESULT_SCHEMA)
    _contract_error(caught.value, RESULT_SCHEMA)
    _unchanged(path, before)
