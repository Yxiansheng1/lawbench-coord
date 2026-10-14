"""复核员 C16 的附加实验（只在导出副本里，不进仓库）。"""
from __future__ import annotations

import hashlib
import pathlib
import sqlite3
import threading
import time

from test_api_case import ok
from test_ocr_queue import (KEY, PDF, Env, Fake395, env, fake, job_status, open_second_case,  # noqa: F401
                            submit_in, wait_in)


def page_rows(root, job_id):
    con = sqlite3.connect(str(pathlib.Path(root) / "工作区" / "case.db"))
    try:
        return {r[0]: r[1:] for r in con.execute(
            "SELECT page_no, status, attempts FROM ocr_pages WHERE job_id = ?", (job_id,))}
    finally:
        con.close()


def test_x1_lock_while_page_in_flight(env, fake):
    """395 正在处理第 1 页时 case.db 被占 20 秒：写"已完成"超时（10 秒）、回退 _set_page（1 秒）也超时。
    放开后任务能否做完？重开案件能否救回？"""
    fake.block = True
    env.st.ocr.concurrency = 1
    env.st.ocr.start()
    m = env.material("讯问笔录")
    v = env.submit(m["material_id"], [1])
    assert fake.arrived.wait(10)
    hold = sqlite3.connect(str(env.root / "工作区" / "case.db"), timeout=1, isolation_level=None)
    hold.execute("BEGIN IMMEDIATE")
    t0 = time.monotonic()
    fake.hold.set()
    try:
        time.sleep(20)
    finally:
        hold.execute("ROLLBACK")
        hold.close()
    print("after lock release", job_status(env, env.case_id, v["job_id"]), page_rows(env.root, v["job_id"]))
    time.sleep(15)
    j1 = job_status(env, env.case_id, v["job_id"])
    p1 = page_rows(env.root, v["job_id"])
    print("15s after release", j1, p1)
    ok(env.client.post("/api/case/open", json={"path": str(env.root)}), "case_open")   # 作者注释说重开案件能救回
    time.sleep(10)
    j2 = job_status(env, env.case_id, v["job_id"])
    p2 = page_rows(env.root, v["job_id"])
    print("10s after reopen", j2, p2, "threads", [(t.name, t.is_alive()) for t in env.st.ocr._threads])
    assert j2["status"] == "done", (j1, p1, j2, p2)


def test_x2_settings_put_latency_with_locked_case(env, fake):
    """有在内存里的任务、case.db 被占时，保存设置要等多久（on_change 同步跑 _resume_where，每个任务 10 秒超时）。"""
    fake.block = True
    env.st.ocr.concurrency = 1
    env.st.ocr.start()
    m = env.material("讯问笔录")
    env.submit(m["material_id"], [1])
    env.submit(m["material_id"], [2])
    assert fake.arrived.wait(10)
    hold = sqlite3.connect(str(env.root / "工作区" / "case.db"), timeout=1, isolation_level=None)
    hold.execute("BEGIN IMMEDIATE")
    try:
        s = ok(env.client.get("/api/settings"), "settings")
        t0 = time.monotonic()
        ok(env.client.put("/api/settings", json=s), "settings")
        dt = time.monotonic() - t0
    finally:
        hold.execute("ROLLBACK")
        hold.close()
        fake.hold.set()
    print("PUT /api/settings took", round(dt, 2))
    assert dt < 3, dt


def test_x3_vanish_while_in_flight(env, fake):
    """395 正在处理时案件文件夹被移走：不在原路径重建文件夹；线程活着；插回、重开后做完。"""
    fake.block = True
    env.st.ocr.concurrency = 1
    env.st.ocr.start()
    m = env.material("讯问笔录")
    v = env.submit(m["material_id"], [1, 2])
    assert fake.arrived.wait(10)
    moved = env.root.parent / "甲-拔掉"
    for _ in range(50):
        try:
            env.root.rename(moved)
            break
        except PermissionError:
            time.sleep(0.1)
    fake.hold.set()
    time.sleep(4)
    assert not env.root.exists(), "原路径被重建"
    assert all(t.is_alive() for t in env.st.ocr._threads)
    moved.rename(env.root)
    ok(env.client.post("/api/case/open", json={"path": str(env.root)}), "case_open")
    j = wait_in(env, env.case_id, v["job_id"], ("done",), timeout=30)
    assert j["done"] == 2


def test_x4_key_not_in_logs(tmp_path, fake):
    """换 Key 恢复全过程，日志里不出现 Key 明文、Key 指纹。"""
    key = ["sk-bad-c16-secret"]
    e = Env(tmp_path, fake.url, {"卷一/讯问笔录.pdf": PDF}, key=lambda: key[0])
    try:
        fake.script = [(401, {})]
        e.st.ocr.concurrency = 1
        e.st.ocr.start()
        v = e.submit(e.material("讯问笔录")["material_id"], [1])
        assert e.wait(v["job_id"], ("paused",))["pause_reason"] == "key_invalid"
        key[0] = "sk-good-c16-secret"
        assert e.wait(v["job_id"], ("done",), timeout=20)["done"] == 1
        needles = ["sk-bad-c16-secret", "sk-good-c16-secret",
                   hashlib.sha256(b"sk-bad-c16-secret").hexdigest(), hashlib.sha256(b"sk-good-c16-secret").hexdigest(),
                   hashlib.sha256(b"sk-bad-c16-secret").hexdigest()[:16]]
        blob = ""
        for p in e.appdata.rglob("*"):
            if p.is_file():
                blob += p.read_bytes().decode("utf-8", "replace")
        for p in e.root.rglob("*"):
            if p.is_file() and p.suffix in (".log", ".json", ".md", ".txt"):
                blob += p.read_bytes().decode("utf-8", "replace")
        assert "key_resume" in blob
        assert not [n for n in needles if n in blob]
    finally:
        e.close()


def test_x5_threads_alive_check_is_meaningful(env, fake):
    """线程活性断言能抓住线程死：人为让一个发送线程退出，看 is_alive 是否变 False。"""
    env.st.ocr.start()
    w = env.st.ocr._threads[0]
    assert w.is_alive()
    env.st.ocr._stop.set()
    w.join(5)
    assert not w.is_alive()
    env.st.ocr._stop.clear()
