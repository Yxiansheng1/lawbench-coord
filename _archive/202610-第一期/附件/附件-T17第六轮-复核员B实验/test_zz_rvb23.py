"""复核员 B（T17 第五轮返修）：复制后在新位置打开，用旧位置 cwd 调 /core/task/begin（活会话内存里的记录头）。"""
from __future__ import annotations
import shutil
from t8_helpers import CASE_FILES, Env, fail, ok


def test_live_session_old_cwd_after_copy(tmp_path):
    e = Env(tmp_path, CASE_FILES)
    try:
        old = str(e.root)
        assert e.begin("s-live", old)["case_id"] == e.case_id           # 复制前：旧位置照常
        new = tmp_path / "案件盘" / "张某甲借款纠纷"
        shutil.copytree(e.root, new)
        v = e.client.post("/api/case/open", json={"path": str(new)}).json()
        assert v["ok"] and v["value"]["case_id"] == e.case_id
        r = e.client.post("/core/task/begin", json={"session_id": "s-live", "cwd": old}).json()
        print("RVB23 old-cwd begin after copy+open-new:", r.get("ok"), (r.get("error") or {}).get("code"))
        assert r["ok"] is False and r["error"]["code"] == "CASE_NOT_FOUND"
        assert e.begin("s-live", str(new))["case_id"] == e.case_id     # 用新位置 cwd 才行
    finally:
        e.close()
