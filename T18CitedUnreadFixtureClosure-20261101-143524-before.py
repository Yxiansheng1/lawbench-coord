"""T18：辩护意见引用必须由本任务当前材料版本的完整读取支撑。

本文件只定义有限的红灯测试和正向对照，不修改产品实现、旧测试或测试辅助层。
"""
from __future__ import annotations

import pathlib

from t8_helpers import Env, fail, ok


DEFENSE_SKILL = "defense-opinion"
TASK_PARAMS = {"thinking": "中", "window": "32K", "max_tokens": 2048}


def _selected_task(env: Env, session: str, skill: str | None) -> str:
    """通过公开的 /api/task 选择 skill，再由真实 /core/task/begin 建运行中任务。"""
    req = {
        "case_id": env.case_id,
        "session_id": session,
        "entry": skill,
        "skill": skill,
        "inputs": [],
        "params": TASK_PARAMS,
    }
    ok(env.client.post("/api/task", json=req), "api/task_create.schema.json")
    return env.begin(session)["task_id"]


def _material_env(tmp_path: pathlib.Path, text: str) -> Env:
    source = tmp_path / "事实材料.txt"
    source.write_text(text, encoding="utf-8")
    return Env(tmp_path / "case", {"事实材料.txt": source})


def _reads(env: Env, task_id: str) -> list[dict]:
    return env.read_json(task_id, "reads.json", "files/reads.schema.json")["reads"]


def _snapshot(env: Env, task_id: str) -> tuple[bytes, tuple[tuple[str, bytes], ...]]:
    task_dir = env.task_dir(task_id)
    result = (task_dir / "result.json").read_bytes()
    drafts_dir = task_dir / "草稿"
    drafts = tuple(sorted(
        ((p.relative_to(drafts_dir).as_posix(), p.read_bytes()) for p in drafts_dir.glob("*.md")),
        key=lambda item: item[0],
    ))
    return result, drafts


def _assert_citation_denied(env: Env, task_id: str, content: str, name: str, loc: str,
                            private_text: str) -> None:
    before = _snapshot(env, task_id)
    body = fail(env.tool(task_id, "case_save_draft", {"title": "辩护意见", "content": content}),
                "INVALID_ARGUMENT")
    error = body["error"]
    assert error["reason"] == "defense_citation_not_read"
    detail = error["detail"]
    assert isinstance(detail, str) and detail
    assert name in detail and loc in detail
    assert "读取" in detail
    assert private_text not in detail
    assert len(detail) <= 500
    assert _snapshot(env, task_id) == before
    assert env.read_json(task_id, "task.json", "files/task.schema.json")["state"] == "running"


def test_t18_main_search_only_numeric_citation_denied_without_side_effects(tmp_path):
    """搜索命中不是读取；未读引用必须拒绝，且不落草稿、不改 result。"""
    env = _material_env(
        tmp_path,
        "第一行 借款经过\n第二行 红色雨伞是检索命中\n第三行 还款经过\n第四行 其他事实\n",
    )
    try:
        task_id = _selected_task(env, "t18-main-search-only", DEFENSE_SKILL)
        env.tool_ok(task_id, "case_search", {"query": "红色雨伞"})
        assert _reads(env, task_id) == []

        _assert_citation_denied(
            env,
            task_id,
            "辩护意见正文〔事实材料 第2行〕",
            "事实材料",
            "第2行",
            "红色雨伞",
        )

        # 放在第一个主断言之后：即便旧实现同时缺少区间并集核对，也只产生一个主 RED 节点。
        env.tool_ok(task_id, "case_read_material", {"name": "事实材料", "start": 2, "end": 2})
        env.tool_ok(task_id, "case_read_material", {"name": "事实材料", "start": 4, "end": 4})
        _assert_citation_denied(
            env,
            task_id,
            "辩护意见正文〔事实材料 第2-4行〕",
            "事实材料",
            "第2-4行",
            "还款经过",
        )
    finally:
        env.close()


def test_t18_main_wrong_task_or_old_version_read_does_not_authorize(tmp_path):
    """别的任务读过、或本任务读过旧版本，都不能支撑当前辩护意见保存。"""
    env = _material_env(
        tmp_path,
        "第一行 红色雨伞\n第二行 还款经过\n第三行 其他事实\n",
    )
    try:
        defense_task = _selected_task(env, "t18-main-identity-defense", DEFENSE_SKILL)
        other_task = _selected_task(env, "t18-main-identity-other", None)
        env.tool_ok(other_task, "case_search", {"query": "红色雨伞"})
        env.tool_ok(other_task, "case_read_material", {"name": "事实材料", "start": 1, "end": 1})
        assert _reads(env, other_task)
        assert _reads(env, defense_task) == []

        _assert_citation_denied(
            env,
            defense_task,
            "辩护意见正文〔事实材料 第1行〕",
            "事实材料",
            "第1行",
            "红色雨伞",
        )

        env.tool_ok(defense_task, "case_search", {"query": "还款经过"})
        env.tool_ok(defense_task, "case_read_material", {"name": "事实材料", "start": 2, "end": 2})
        stale_reads = _reads(env, defense_task)
        assert any(r["from"] <= 2 <= r["to"] for r in stale_reads)

        (env.root / "事实材料.txt").write_text(
            "第一行 红色雨伞\n第二行 还款经过已更新\n第三行 其他事实已更新\n",
            encoding="utf-8",
        )
        ok(env.client.post("/api/materials/scan", json={"case_id": env.case_id}),
           "api/materials_scan.schema.json")
        _assert_citation_denied(
            env,
            defense_task,
            "辩护意见正文〔事实材料 第2行〕",
            "事实材料",
            "第2行",
            "还款经过已更新",
        )
    finally:
        env.close()


def test_t18_positive_correct_actual_read_allows_same_content(tmp_path):
    env = _material_env(tmp_path, "第一行 红色雨伞\n第二行 还款经过\n第三行 其他事实\n")
    try:
        task_id = _selected_task(env, "t18-positive-correct-read", DEFENSE_SKILL)
        env.tool_ok(task_id, "case_search", {"query": "还款经过"})
        env.tool_ok(task_id, "case_read_material", {"name": "事实材料", "start": 2, "end": 2})
        content = "辩护意见正文〔事实材料 第2行〕"
        saved = env.tool_ok(task_id, "case_save_draft", {"title": "正确读取", "content": content})
        assert saved["version"] == 1
        assert (env.root / saved["path"]).read_text(encoding="utf-8") == content
    finally:
        env.close()


def test_t18_positive_complete_inclusive_range_allows(tmp_path):
    env = _material_env(tmp_path, "第一行 借款\n第二行 交付\n第三行 催款\n第四行 其他\n")
    try:
        task_id = _selected_task(env, "t18-positive-range", DEFENSE_SKILL)
        env.tool_ok(task_id, "case_search", {"query": "交付"})
        env.tool_ok(task_id, "case_read_material", {"name": "事实材料", "start": 1, "end": 3})
        content = "辩护意见正文〔事实材料 第1-3行〕"
        saved = env.tool_ok(task_id, "case_save_draft", {"title": "完整区间", "content": content})
        assert saved["version"] == 1
        assert any(r["from"] == 1 and r["to"] == 3 for r in _reads(env, task_id))
    finally:
        env.close()


def test_t18_positive_long_unit_partial_then_offset_recovery(tmp_path):
    env = _material_env(tmp_path, "第一行 短行\n" + "长" * 3360 + "\n第三行 短行\n")
    try:
        task_id = _selected_task(env, "t18-positive-long-offset", DEFENSE_SKILL)
        env.tool_ok(task_id, "case_search", {"query": "长"})
        args = {"name": "事实材料", "start": 2, "max_chars": 500}
        part = env.tool_ok(task_id, "case_read_material", args)
        assert part["next_offset"] is not None
        assert _reads(env, task_id) == []
        while part["next_offset"] is not None:
            part = env.tool_ok(
                task_id,
                "case_read_material",
                {**args, "offset": part["next_offset"]},
            )
        assert any(r["from"] == 2 and r["to"] == 2 for r in _reads(env, task_id))
        saved = env.tool_ok(
            task_id,
            "case_save_draft",
            {"title": "续读完成", "content": "辩护意见正文〔事实材料 第2行〕"},
        )
        assert saved["version"] == 1
    finally:
        env.close()


def test_t18_positive_non_defense_save_unchanged(tmp_path):
    env = _material_env(tmp_path, "第一行 红色雨伞\n第二行 还款经过\n")
    try:
        task_id = _selected_task(env, "t18-positive-free-save", None)
        env.tool_ok(task_id, "case_search", {"query": "红色雨伞"})
        saved = env.tool_ok(
            task_id,
            "case_save_draft",
            {"title": "普通草稿", "content": "普通草稿〔事实材料 第1行〕"},
        )
        assert saved["version"] == 1
        assert (env.root / saved["path"]).is_file()
    finally:
        env.close()
