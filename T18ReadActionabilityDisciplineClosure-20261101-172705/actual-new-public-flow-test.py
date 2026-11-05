

def test_t18_actionability_public_material_id_recovery_flow(tmp_path):
    """未读引用错误应给出从公开材料 ID 恢复到按名称读取的可执行路径。"""
    first_line = "第一行 前导合成事实"
    private_line = "第二行 私有合成词霜桥"
    source = tmp_path / "事实材料.txt"
    env = _material_env(tmp_path, first_line + "\n" + private_line + "\n")
    original_bytes = source.read_bytes()
    try:
        task_id = _selected_task(env, "t18-actionability-name-recovery", DEFENSE_SKILL)
        materials = env.tool_ok(task_id, "case_list_materials", {})["materials"]
        material = next(item for item in materials if item["name"] == "事实材料")
        material_id = material["material_id"]
        before = _snapshot(env, task_id)

        content = "辩护意见正文〔事实材料 第2行〕"
        denied = fail(
            env.tool(
                task_id,
                "case_save_draft",
                {"title": "辩护意见", "content": content},
            ),
            "INVALID_ARGUMENT",
        )
        original_error = denied["error"]
        message = original_error["message"]
        assert isinstance(message, str) and message
        assert material_id in message and "第2行" in message
        assert "读取" in message
        assert "事实材料" not in message
        assert content not in message
        assert first_line not in message and private_line not in message
        assert len(message) <= 500
        assert _snapshot(env, task_id) == before
        assert _reads(env, task_id) == []
        assert env.read_json(
            task_id, "task.json", "files/task.schema.json"
        )["state"] == "running"

        fail(
            env.tool(
                task_id,
                "case_read_material",
                {"name": material_id, "start": 2, "end": 2},
            ),
            "MATERIAL_NOT_FOUND",
        )
        assert _reads(env, task_id) == []
        assert _snapshot(env, task_id) == before

        resolved = next(
            item
            for item in env.tool_ok(task_id, "case_list_materials", {})["materials"]
            if item["material_id"] == material_id
        )
        assert resolved["name"] == "事实材料"
        read = env.tool_ok(
            task_id,
            "case_read_material",
            {"name": resolved["name"], "start": 2, "end": 2},
        )
        assert read["unit"] == "line"
        assert (read["start"], read["end"]) == (2, 2)
        assert private_line in read["text"].splitlines()

        current_version = hashlib.sha256(original_bytes).hexdigest()
        records = _reads(env, task_id)
        assert len(records) == 1
        assert records[0]["material_id"] == material_id
        assert records[0]["material_version"] == current_version
        assert (
            records[0]["unit"],
            records[0]["from"],
            records[0]["to"],
        ) == ("line", 2, 2)

        saved = env.tool_ok(
            task_id,
            "case_save_draft",
            {"title": "名称映射恢复", "content": content},
        )
        assert saved["version"] == 1
        assert (env.root / saved["path"]).read_bytes() == content.encode("utf-8")
        assert source.read_bytes() == original_bytes
        assert (env.root / "事实材料.txt").read_bytes() == original_bytes

        list_position = message.find("case_list_materials")
        read_position = message.find("case_read_material")
        assert (
            list_position >= 0
            and read_position > list_position
            and "name" in message
        )
    finally:
        env.close()
