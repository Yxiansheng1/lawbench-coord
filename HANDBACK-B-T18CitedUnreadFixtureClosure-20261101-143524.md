# HANDBACK — B / T18 cited-unread fixture closure

状态：AUTHORED_NOT_RUN / runtime0

范围：仅修改测试 helper `_assert_citation_denied`；产品、错误契约、schema、六个测试主体及其前置条件和行为断言均未改。

目标文件：

- `D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py`
- SHA-256：`d341d1ec25e9ad6e265523c92cfdf7a07c0cd70c952e3f08630b0e88bfa93047`
- Size：`8985` bytes

原始 before 文件按令保留：

- `D:\Lawbeach\lawbench-coord\T18CitedUnreadFixtureClosure-20261101-143524-before.py`

精确 hunk：

```diff
@@ -48,21 +48,24 @@
     return result, drafts
 
 
 def _assert_citation_denied(env: Env, task_id: str, content: str, name: str, loc: str,
                             private_text: str) -> None:
+    materials = env.tool_ok(task_id, "case_list_materials", {})["materials"]
+    material_id = next(m["material_id"] for m in materials if m["name"] == name)
     before = _snapshot(env, task_id)
     body = fail(env.tool(task_id, "case_save_draft", {"title": "辩护意见", "content": content}),
                 "INVALID_ARGUMENT")
     error = body["error"]
-    assert error["reason"] == "defense_citation_not_read"
-    detail = error["detail"]
-    assert isinstance(detail, str) and detail
-    assert name in detail and loc in detail
-    assert "读取" in detail
-    assert private_text not in detail
-    assert len(detail) <= 500
+    message = error["message"]
+    assert isinstance(message, str) and message
+    assert material_id in message and loc in message
+    assert "读取" in message
+    assert name not in message
+    assert private_text not in message
+    assert len(message) <= 500
     assert _snapshot(env, task_id) == before
     assert env.read_json(task_id, "task.json", "files/task.schema.json")["state"] == "running"
 
 
 def test_t18_main_search_only_numeric_citation_denied_without_side_effects(tmp_path):
```

运行时调用：0。未执行 Python、parser、test、collect、check、build、prepare、HTTP、模型、GUI 或凭据访问。

Git：未执行任何写入；未 add、commit、rebase、stash、reset、clean、checkout 或 push。

说明：该修改修正 Root fixture 对统一错误契约的误判，属于 fixture mistake closure，不构成产品 RED，也不豁免任何原断言。

STOP
