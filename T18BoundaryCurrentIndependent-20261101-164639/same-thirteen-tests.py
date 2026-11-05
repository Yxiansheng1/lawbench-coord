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
    materials = env.tool_ok(task_id, "case_list_materials", {})["materials"]
    material_id = next(m["material_id"] for m in materials if m["name"] == name)
    before = _snapshot(env, task_id)
    body = fail(env.tool(task_id, "case_save_draft", {"title": "辩护意见", "content": content}),
                "INVALID_ARGUMENT")
    error = body["error"]
    message = error["message"]
    assert isinstance(message, str) and message
    assert material_id in message and loc in message
    assert "读取" in message
    assert name not in message
    assert private_text not in message
    assert len(message) <= 500
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


# T18 边界证据：以下追加内容不改变上方既有六个节点的任何字节。
import hashlib
import os

import pytest

from lawbench.tools import drafts as drafts_mod
from t8_helpers import CASE_FILES, Env


_EDGE_ORIGINAL_DRAFTS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18CitedUnreadProductFix-20261101-144353Before\drafts.py"
)
_EDGE_ORIGINAL_DRAFTS_SHA256 = (
    "e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822"
)


@pytest.fixture(autouse=True)
def _edge_original_save_counterfactual(request, monkeypatch):
    """仅在显式对照模式下，只换入旧版 save_draft 业务函数。"""
    if not (
        request.node.name.startswith("test_t18_edge_")
        and os.environ.get("LB_T18_COMPARE_ORIGINAL_SAVE") == "1"
    ):
        return

    raw = _EDGE_ORIGINAL_DRAFTS.read_bytes()
    assert hashlib.sha256(raw).hexdigest() == _EDGE_ORIGINAL_DRAFTS_SHA256
    source = raw.decode("utf-8")
    start = source.index("def save_draft(")
    stop = source.index("def _save_locked(", start)
    function_source = source[start:stop]

    namespace = dict(vars(drafts_mod))
    exec(compile(function_source, str(_EDGE_ORIGINAL_DRAFTS), "exec"), namespace)
    original_save_draft = namespace["save_draft"]
    assert callable(original_save_draft)
    monkeypatch.setattr(drafts_mod, "save_draft", original_save_draft)


def _edge_end(env: Env, task_id: str, reason: str) -> str:
    expected = {"budget": "budget_stopped", "completed": "completed", "error": "failed"}[reason]
    value = ok(
        env.client.post(
            "/core/task/end",
            json={
                "task_id": task_id,
                "reason": reason,
                "model_calls": 7,
                "tool_calls": 2,
                "elapsed_s": 3,
            },
        ),
        "core/task_end.schema.json",
    )
    assert value == {"status": expected}
    assert env.read_json(task_id, "task.json", "files/task.schema.json")["state"] == "finished"
    result = env.read_json(task_id, "result.json", "files/result.schema.json")
    assert result["status"] == expected
    assert result["usage"] == {"model_calls": 7, "tool_calls": 2, "elapsed_s": 3}
    return expected


def _edge_material(env: Env, task_id: str, name: str) -> dict:
    materials = env.tool_ok(task_id, "case_list_materials", {})["materials"]
    return next(material for material in materials if material["name"] == name)


def test_t18_edge_docx_para_denial_then_single_para_allows(tmp_path):
    source = CASE_FILES["证据/借条.docx"]
    source_bytes = source.read_bytes()
    env = Env(tmp_path / "case", {"证据/借条.docx": source})
    try:
        material_file = env.root / "证据" / "借条.docx"
        assert material_file.read_bytes() == source_bytes
        task_id = _selected_task(env, "t18-edge-docx-para", DEFENSE_SKILL)
        assert _reads(env, task_id) == []

        content = "辩护意见正文〔借条 第1段〕"
        _assert_citation_denied(env, task_id, content, "借条", "第1段", "借款")

        read = env.tool_ok(
            task_id, "case_read_material", {"name": "借条", "start": 1, "end": 1}
        )
        assert read["unit"] == "para"
        assert read["start"] == read["end"] == 1
        assert read["text"].startswith("【第1段】")

        material = _edge_material(env, task_id, "借条")
        reads = _reads(env, task_id)
        assert len(reads) == 1
        assert reads[0]["material_id"] == material["material_id"]
        assert reads[0]["material_version"] == hashlib.sha256(source_bytes).hexdigest()
        assert (reads[0]["unit"], reads[0]["from"], reads[0]["to"]) == ("para", 1, 1)

        saved = env.tool_ok(
            task_id, "case_save_draft", {"title": "DOCX一段", "content": content}
        )
        assert saved["version"] == 1
        assert (env.root / saved["path"]).read_bytes() == content.encode("utf-8")
        assert material_file.read_bytes() == source_bytes
    finally:
        env.close()


def test_t18_edge_pdf_page_denial_then_single_page_allows(tmp_path):
    source = CASE_FILES["起诉意见书.pdf"]
    source_bytes = source.read_bytes()
    env = Env(tmp_path / "case", {"起诉意见书.pdf": source})
    try:
        material_file = env.root / "起诉意见书.pdf"
        assert material_file.read_bytes() == source_bytes
        task_id = _selected_task(env, "t18-edge-pdf-page", DEFENSE_SKILL)
        assert _reads(env, task_id) == []

        content = "辩护意见正文〔起诉意见书 第2页〕"
        _assert_citation_denied(env, task_id, content, "起诉意见书", "第2页", "起诉意见")

        read = env.tool_ok(
            task_id,
            "case_read_material",
            {"name": "起诉意见书", "start": 2, "end": 2, "max_chars": 8000},
        )
        assert read["unit"] == "page"
        assert read["start"] == read["end"] == 2
        assert read["has_more"] is False
        assert read["next_offset"] is None
        assert read["text"].startswith("【第2页】")

        material = _edge_material(env, task_id, "起诉意见书")
        reads = _reads(env, task_id)
        assert len(reads) == 1
        assert reads[0]["material_id"] == material["material_id"]
        assert reads[0]["material_version"] == hashlib.sha256(source_bytes).hexdigest()
        assert (reads[0]["unit"], reads[0]["from"], reads[0]["to"]) == ("page", 2, 2)

        saved = env.tool_ok(
            task_id, "case_save_draft", {"title": "PDF一页", "content": content}
        )
        assert saved["version"] == 1
        assert (env.root / saved["path"]).read_bytes() == content.encode("utf-8")
        assert material_file.read_bytes() == source_bytes
    finally:
        env.close()


def test_t18_edge_budget_stopped_carries_reads_to_next_same_session_task(tmp_path):
    env = _material_env(tmp_path, "第一行 借款经过\n第二行 还款经过\n")
    try:
        session = "t18-edge-budget-carry"
        predecessor = _selected_task(env, session, DEFENSE_SKILL)
        env.tool_ok(
            predecessor, "case_read_material", {"name": "事实材料", "start": 1, "end": 1}
        )
        predecessor_reads = _reads(env, predecessor)
        assert len(predecessor_reads) == 1
        assert _edge_end(env, predecessor, "budget") == "budget_stopped"

        successor = _selected_task(env, session, DEFENSE_SKILL)
        assert successor != predecessor
        assert _reads(env, successor) == predecessor_reads
        assert env.read_json(successor, "result.json", "files/result.schema.json")["status"] == "running"

        content = "辩护意见正文〔事实材料 第1行〕"
        saved = env.tool_ok(
            successor, "case_save_draft", {"title": "预算续接", "content": content}
        )
        assert saved["version"] == 1
        assert (env.root / saved["path"]).read_bytes() == content.encode("utf-8")
    finally:
        env.close()


def test_t18_edge_completed_does_not_carry_reads(tmp_path):
    env = _material_env(tmp_path, "第一行 借款经过\n第二行 还款经过\n")
    try:
        session = "t18-edge-completed-no-carry"
        predecessor = _selected_task(env, session, DEFENSE_SKILL)
        env.tool_ok(
            predecessor, "case_read_material", {"name": "事实材料", "start": 1, "end": 1}
        )
        assert len(_reads(env, predecessor)) == 1
        assert _edge_end(env, predecessor, "completed") == "completed"

        successor = _selected_task(env, session, DEFENSE_SKILL)
        assert successor != predecessor
        assert _reads(env, successor) == []
        assert env.read_json(successor, "result.json", "files/result.schema.json")["status"] == "running"
        _assert_citation_denied(
            env,
            successor,
            "辩护意见正文〔事实材料 第1行〕",
            "事实材料",
            "第1行",
            "第一行 借款经过",
        )
    finally:
        env.close()


def test_t18_edge_error_does_not_carry_reads(tmp_path):
    env = _material_env(tmp_path, "第一行 借款经过\n第二行 还款经过\n")
    try:
        session = "t18-edge-error-no-carry"
        predecessor = _selected_task(env, session, DEFENSE_SKILL)
        env.tool_ok(
            predecessor, "case_read_material", {"name": "事实材料", "start": 1, "end": 1}
        )
        assert len(_reads(env, predecessor)) == 1
        assert _edge_end(env, predecessor, "error") == "failed"

        successor = _selected_task(env, session, DEFENSE_SKILL)
        assert successor != predecessor
        assert _reads(env, successor) == []
        assert env.read_json(successor, "result.json", "files/result.schema.json")["status"] == "running"
        _assert_citation_denied(
            env,
            successor,
            "辩护意见正文〔事实材料 第1行〕",
            "事实材料",
            "第1行",
            "第一行 借款经过",
        )
    finally:
        env.close()


import lawbench.case.texts as texts


def test_t18_gap_encrypted_pdf_inverted_range_rejects_failed_page(tmp_path):
    source = CASE_FILES["加密.pdf"]
    source_bytes = source.read_bytes()
    env = Env(tmp_path / "case", {"加密.pdf": source})
    try:
        material_file = env.root / "加密.pdf"
        assert material_file.read_bytes() == source_bytes
        task_id = _selected_task(env, "t18-gap-encrypted-pdf", DEFENSE_SKILL)

        material = _edge_material(env, task_id, "加密")
        assert material["unit"] == "page"
        assert material["status"] == "failed"

        fail(
            env.tool(task_id, "case_read_material", {"name": "加密", "start": 1, "end": 1}),
            "MATERIAL_NOT_READY",
        )
        assert _reads(env, task_id) == []

        _assert_citation_denied(
            env,
            task_id,
            "辩护意见正文〔加密 第1页〕",
            "加密",
            "第1页",
            "加密",
        )
        _assert_citation_denied(
            env,
            task_id,
            "辩护意见正文〔加密 第5-3页〕",
            "加密",
            "第5-3页",
            "加密",
        )

        assert source.read_bytes() == source_bytes
        assert material_file.read_bytes() == source_bytes
    finally:
        env.close()


def test_t18_gap_placeholder_page2_not_coverage_and_citation_denied(tmp_path):
    source = CASE_FILES["起诉意见书.pdf"]
    source_bytes = source.read_bytes()
    env = Env(tmp_path / "case", {"起诉意见书.pdf": source})
    cache_path = None
    original_cache_bytes = None
    material_file = None
    try:
        material_file = env.root / "起诉意见书.pdf"
        assert material_file.read_bytes() == source_bytes
        task_id = _selected_task(env, "t18-gap-placeholder-page2", DEFENSE_SKILL)

        material = _edge_material(env, task_id, "起诉意见书")
        # case_list_materials 只给公开元数据（无 rel_path / text_path），材料文本位置取自本案持久索引。
        index_meta = next(
            m for m in env.client.app.state.lb.materials.index(env.case_id)["materials"]
            if m["material_id"] == material["material_id"]
        )
        cache_path = env.root / texts.text_rel(index_meta)
        original_cache_bytes = cache_path.read_bytes()
        original_text = original_cache_bytes.decode("utf-8")
        units = texts.split_units(original_text, "page")
        assert len(units) >= 2

        page2_text = units[1].text.strip()
        assert page2_text
        patched = original_text.replace(
            units[1].header + "\n" + units[1].text,
            units[1].header + "\n" + texts.PENDING_OCR,
            1,
        )
        assert patched != original_text
        assert units[0].header + "\n" + units[0].text in patched
        cache_path.write_bytes(patched.encode("utf-8"))
        assert cache_path.read_bytes() == patched.encode("utf-8")

        read = env.tool_ok(
            task_id,
            "case_read_material",
            {"name": "起诉意见书", "start": 1, "end": 2, "max_chars": 8000},
        )
        assert read["unit"] == "page"
        assert (read["start"], read["end"]) == (1, 2)
        assert units[0].header + "\n" + units[0].text in read["text"]
        assert texts.PENDING_OCR in read["text"]
        read_records = _reads(env, task_id)
        assert any(
            record["material_id"] == material["material_id"]
            and record["unit"] == "page"
            and record["from"] <= 1
            and record["to"] >= 2
            for record in read_records
        )

        coverage = env.client.app.state.lb.tasks.coverage(
            str(env.root), env.case_id, task_id
        )
        assert "起诉意见书" not in coverage["fully_read"]
        partially_read = next(
            item for item in coverage["partially_read"] if item["name"] == "起诉意见书"
        )
        assert partially_read["read_units"] == 1
        assert partially_read["total_units"] == len(units)

        _assert_citation_denied(
            env,
            task_id,
            "辩护意见正文〔起诉意见书 第2页〕",
            "起诉意见书",
            "第2页",
            page2_text,
        )

        content = "辩护意见正文〔起诉意见书 第1页〕"
        saved = env.tool_ok(
            task_id, "case_save_draft", {"title": "真实页对照", "content": content}
        )
        assert saved["version"] == 1
        assert (env.root / saved["path"]).read_bytes() == content.encode("utf-8")
        assert source.read_bytes() == source_bytes
        assert material_file.read_bytes() == source_bytes
    finally:
        try:
            if cache_path is not None and original_cache_bytes is not None:
                cache_path.write_bytes(original_cache_bytes)
            assert source.read_bytes() == source_bytes
            if material_file is not None:
                assert material_file.read_bytes() == source_bytes
        finally:
            env.close()
