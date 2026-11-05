"""T18 有界读取 RED 回归：不依赖真实案卷、解析器、模型或网络。"""
from __future__ import annotations

import copy
import json
import pathlib

import pytest

from lawbench.tools import ToolContext
from lawbench.tools.materials import read_material
from t8_helpers import Env, fail


RANGE_FILE = "证据/范围.txt"
OTHER_FILE = "证据/另一份.txt"
LONG_FILE = "证据/超长单元.txt"

RANGE_TEXT = "\n".join(
    [
        "单元一-起点哨兵",
        "单元二-区间内甲",
        "单元三-区间内乙",
        "单元四-尾哨兵",
    ]
)
LONG_TEXT = "超长单元-" + ("甲" * 900) + "-超长单元终点\n单元二-不得泄漏"


def _make_env(tmp_path: pathlib.Path) -> Env:
    sources = {
        RANGE_FILE: tmp_path / "范围-源.txt",
        OTHER_FILE: tmp_path / "另一份-源.txt",
        LONG_FILE: tmp_path / "超长单元-源.txt",
    }
    sources[RANGE_FILE].write_text(RANGE_TEXT, encoding="utf-8")
    sources[OTHER_FILE].write_text("另一份材料-不得因非法参数被读", encoding="utf-8")
    sources[LONG_FILE].write_text(LONG_TEXT, encoding="utf-8")
    return Env(tmp_path, sources)


@pytest.fixture
def txt_env(tmp_path):
    env = None
    try:
        env = _make_env(tmp_path)
        yield env
    finally:
        if env is not None:
            env.close()


def _begin(env: Env) -> str:
    return env.begin(session="bounded-read-red")["task_id"]


def _range_entries(data) -> list[dict]:
    found: list[dict] = []

    def walk(value) -> None:
        if isinstance(value, dict):
            if "from" in value and "to" in value:
                found.append(value)
                return
            for child in value.values():
                walk(child)
        elif isinstance(value, list):
            for child in value:
                walk(child)

    walk(data)
    return found


def _coverage_snapshot(env: Env, task_id: str) -> dict:
    return copy.deepcopy(
        env.client.app.state.lb.tasks.coverage(
            str(env.root), env.case_id, task_id
        )
    )


def _selected_unit_count(coverage, name: str) -> int:
    assert name not in coverage["fully_read"]
    partial = [entry for entry in coverage["partially_read"] if entry["name"] == name]
    assert len(partial) == 1
    return partial[0]["read_units"]


def _snapshot_accounting(env: Env, task_id: str) -> dict[str, object]:
    path = env.task_dir(task_id) / "reads.json"
    return {
        "reads": path.read_bytes() if path.exists() else None,
        "coverage": _coverage_snapshot(env, task_id),
    }


def _read_ranges(task_dir: pathlib.Path) -> list[dict]:
    path = task_dir / "reads.json"
    if not path.exists():
        return []
    return _range_entries(json.loads(path.read_text(encoding="utf-8")))


def _input_bytes(env: Env) -> dict[str, bytes]:
    return {
        relative: (env.root / relative).read_bytes()
        for relative in (RANGE_FILE, OTHER_FILE, LONG_FILE)
    }


def test_bounded_end_returns_only_selected_units_without_sentinels(txt_env: Env) -> None:
    task_id = _begin(txt_env)
    before = _input_bytes(txt_env)

    first = txt_env.tool_ok(
        task_id,
        "case_read_material",
        {"name": "范围", "start": 1, "end": 1, "max_chars": 500},
    )
    assert first["start"] == 1 and first["end"] == 1
    assert "单元一-起点哨兵" in first["text"]
    assert "单元二-区间内甲" not in first["text"]

    middle = txt_env.tool_ok(
        task_id,
        "case_read_material",
        {"name": "范围", "start": 2, "end": 3, "max_chars": 500},
    )
    assert middle["start"] == 2 and middle["end"] == 3
    assert "单元二-区间内甲" in middle["text"]
    assert "单元三-区间内乙" in middle["text"]
    assert "单元一-起点哨兵" not in middle["text"]
    assert "单元四-尾哨兵" not in middle["text"]
    assert _input_bytes(txt_env) == before


def test_legacy_omitted_end_keeps_original_range(txt_env: Env) -> None:
    task_id = _begin(txt_env)

    value = txt_env.tool_ok(
        task_id,
        "case_read_material",
        {"name": "范围", "start": 1, "max_chars": 8000},
    )
    assert value["start"] == 1
    assert value["has_more"] is False
    for marker in (
        "单元一-起点哨兵",
        "单元二-区间内甲",
        "单元三-区间内乙",
        "单元四-尾哨兵",
    ):
        assert marker in value["text"]


def test_oversized_unit_offset_stays_in_unit_and_records_after_completion(
    txt_env: Env,
) -> None:
    task_id = _begin(txt_env)
    task_dir = txt_env.task_dir(task_id)
    before = _snapshot_accounting(txt_env, task_id)

    first = txt_env.tool_ok(
        task_id,
        "case_read_material",
        {"name": "超长单元", "start": 1, "end": 1, "max_chars": 500},
    )
    assert first["start"] == 1 and first["end"] == 1
    assert first["next_offset"] is not None
    assert "单元二-不得泄漏" not in first["text"]
    assert _snapshot_accounting(txt_env, task_id) == before
    assert _read_ranges(task_dir) == []

    value = first
    offset = first["next_offset"]
    for _ in range(5):
        value = txt_env.tool_ok(
            task_id,
            "case_read_material",
            {
                "name": "超长单元",
                "start": 1,
                "end": 1,
                "offset": offset,
                "max_chars": 500,
            },
        )
        assert value["start"] == 1 and value["end"] == 1
        assert "单元二-不得泄漏" not in value["text"]
        if value["next_offset"] is None:
            break
        offset = value["next_offset"]
    else:
        pytest.fail("超长单元在五次续读内仍未读完")

    assert value["next_offset"] is None
    assert value["has_more"] is False
    assert value["next_start"] is None
    assert "单元二-不得泄漏" not in value["text"]
    ranges = _read_ranges(task_dir)
    assert len(ranges) == 1
    assert ranges[0]["from"] == 1 and ranges[0]["to"] == 1
    assert (
        _selected_unit_count(_coverage_snapshot(txt_env, task_id), first["name"])
        == 1
    )


def test_direct_read_material_honors_end_with_real_task_context(txt_env: Env) -> None:
    task_id = _begin(txt_env)
    tasks = txt_env.client.app.state.lb.tasks
    materials = txt_env.client.app.state.lb.materials
    task = txt_env.read_json(task_id, "task.json", "files/task.schema.json")
    ctx = ToolContext(
        root=str(txt_env.root),
        case_id=txt_env.case_id,
        task=task,
        tasks=tasks,
        materials=materials,
    )

    value = read_material(
        ctx,
        {"name": "范围", "start": 2, "end": 2, "max_chars": 500},
    )

    assert value["start"] == 2 and value["end"] == 2
    assert "单元二-区间内甲" in value["text"]
    assert "单元四-尾哨兵" not in value["text"]
    coverage = tasks.coverage(str(txt_env.root), txt_env.case_id, task_id)
    assert _selected_unit_count(coverage, value["name"]) == 1


def test_reversed_and_out_of_range_end_reject_without_read_mutation(
    txt_env: Env,
) -> None:
    task_id = _begin(txt_env)
    before = _snapshot_accounting(txt_env, task_id)
    inputs = _input_bytes(txt_env)

    for args in (
        {"name": "范围", "start": 2, "end": 1, "max_chars": 500},
        {"name": "范围", "start": 1, "end": 999, "max_chars": 500},
    ):
        fail(txt_env.tool(task_id, "case_read_material", args), "INVALID_ARGUMENT")
        assert _snapshot_accounting(txt_env, task_id) == before
        assert _input_bytes(txt_env) == inputs


def test_more_names_with_end_rejects_without_read_mutation(txt_env: Env) -> None:
    task_id = _begin(txt_env)
    before = _snapshot_accounting(txt_env, task_id)

    fail(
        txt_env.tool(
            task_id,
            "case_read_material",
            {
                "name": "范围",
                "more_names": ["另一份"],
                "end": 1,
                "max_chars": 8000,
            },
        ),
        "INVALID_ARGUMENT",
    )
    assert _snapshot_accounting(txt_env, task_id) == before


@pytest.mark.parametrize(
    "bad_args",
    [
        {"name": "范围", "start": "1"},
        {"name": "范围", "end": "2"},
        {"name": "范围", "offset": 0.5},
        {"name": "范围", "max_chars": 499},
        {"name": "范围", "more_names": [123]},
    ],
)
def test_public_tool_schema_rejects_invalid_types(
    txt_env: Env, bad_args: dict
) -> None:
    task_id = _begin(txt_env)
    before = _snapshot_accounting(txt_env, task_id)

    fail(
        txt_env.tool(task_id, "case_read_material", bad_args),
        "INVALID_ARGUMENT",
    )
    assert _snapshot_accounting(txt_env, task_id) == before
