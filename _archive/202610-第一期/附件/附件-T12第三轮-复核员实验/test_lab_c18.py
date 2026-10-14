"""复核员 C18 的附加实验（放进导出副本的 service/tests/ 下跑；不进仓库）。y1、y2 在 850bed7 上红（P2-A 残留）。"""
from __future__ import annotations

import hashlib
import pathlib
import sqlite3
import threading
import time

from test_api_case import ok
from test_ocr_queue import (KEY, Env, Fake395, env, fake, job_status, open_second_case,  # noqa: F401
                            submit_in, wait_in)


def rows(root, job_id):
    con = sqlite3.connect(str(pathlib.Path(root) / "工作区" / "case.db"))
    try:
        j = con.execute("SELECT status, done, failed FROM ocr_jobs WHERE job_id = ?", (job_id,)).fetchone()
        p = {r[0]: r[1] for r in con.execute("SELECT page_no, status FROM ocr_pages WHERE job_id = ?", (job_id,))}
        return j, p
    finally:
        con.close()


def test_y1_finalize_fails_after_pop_deterministic(env, fake, monkeypatch):
    """_finalize 已把任务移出内存后库写失败（让 _other_active 抛一次 database is locked）：不重开不重启能否收尾？"""
    from lawbench.ocr import queue as Q
    real = Q.OcrQueue._other_active
    n = []

    def flaky(root, mid, jid):
        n.append(1)
        if len(n) == 1:
            raise sqlite3.OperationalError("database is locked")
        return real(root, mid, jid)
    monkeypatch.setattr(Q.OcrQueue, "_other_active", staticmethod(flaky))
    monkeypatch.setattr(Q, "LOCKED_BACKOFF_S", 0.5)
    env.st.ocr.concurrency = 1
    env.st.ocr.start()
    v = env.submit(env.material("讯问笔录")["material_id"], [1])
    time.sleep(12)
    print("Y1 after 12s:", rows(env.root, v["job_id"]), "in_mem", v["job_id"] in env.st.ocr._jobs,
          "threads", [t.is_alive() for t in env.st.ocr._threads], "other_active calls", len(n))
    j = job_status(env, env.case_id, v["job_id"])
    assert j["status"] == "done", j


def test_y2_finalize_final_update_lock_realistic(env, fake, monkeypatch):
    """合并（_apply）返回后另一连接 BEGIN IMMEDIATE 占 case.db 12 秒，_finalize 最后"标完成"10 秒超时。
    放开后 20 秒内不重开、不重启，任务能否变 done？"""
    from lawbench.ocr import queue as Q
    real_apply = Q.OcrQueue._apply
    held = {}

    def apply_then_lock(self, case_id, root, material_id, active=None):
        real_apply(self, case_id, root, material_id, active=active)
        if active is not None and "hold" not in held:
            h = sqlite3.connect(str(pathlib.Path(root) / "工作区" / "case.db"), timeout=1,
                                isolation_level=None, check_same_thread=False)
            h.execute("BEGIN IMMEDIATE")
            held["hold"] = h

            def release():
                time.sleep(12)
                h.execute("ROLLBACK")
                h.close()
                held["released"] = time.monotonic()
            threading.Thread(target=release, daemon=True).start()
    monkeypatch.setattr(Q.OcrQueue, "_apply", apply_then_lock)
    env.st.ocr.concurrency = 1
    env.st.ocr.start()
    v = env.submit(env.material("讯问笔录")["material_id"], [1])
    end = time.monotonic() + 20
    while "released" not in held and time.monotonic() < end:
        time.sleep(0.2)
    assert "released" in held
    time.sleep(20)
    st = rows(env.root, v["job_id"])
    print("Y2 20s after release:", st, "in_mem", v["job_id"] in env.st.ocr._jobs,
          "threads", [t.is_alive() for t in env.st.ocr._threads], "calls", len(fake.calls))
    stuck = st[0][0] != "done"
    if stuck:
        ok(env.client.post("/api/case/open", json={"path": str(env.root)}), "case_open")
        time.sleep(5)
        print("Y2 after case_open:", rows(env.root, v["job_id"]))
    assert not stuck, st


def test_y3_case_open_during_finalize_double_finalize(env, fake, monkeypatch):
    """收尾合并进行中调 case_open：是否双收尾、最终 done、不留空转条目。"""
    from lawbench.ocr import queue as Q
    real_apply = Q.OcrQueue._apply
    calls = []

    def slow_apply(self, case_id, root, material_id, active=None):
        calls.append((threading.current_thread().name, active))
        if active is not None and len(calls) == 2:
            ok(env.client.post("/api/case/open", json={"path": str(env.root)}), "case_open")
            time.sleep(3)
        real_apply(self, case_id, root, material_id, active=active)
    monkeypatch.setattr(Q.OcrQueue, "_apply", slow_apply)
    env.st.ocr.concurrency = 2
    env.st.ocr.start()
    v = env.submit(env.material("讯问笔录")["material_id"], [1])
    j = wait_in(env, env.case_id, v["job_id"], ("done",), timeout=20)
    time.sleep(4)
    print("Y3 apply calls:", calls, "status", j["status"], "in_mem", v["job_id"] in env.st.ocr._jobs)
    assert j["status"] == "done"
    assert v["job_id"] not in env.st.ocr._jobs
    print("Y3 finalize-merge count:", len([c for c in calls if c[1] is not None]))


def test_y4_settings_put_two_cases_locked(env, fake):
    """两个案件各有任务、两个 case.db 都被占、_bad_key 为当前 Key 指纹：PUT /api/settings < 2 秒；
    锁里恢复写不成 → _bad_key 记空串；放开后 key_invalid 任务回排队。"""
    cid_b, root_b = open_second_case(env, "案件乙")
    fake.block = True
    env.st.ocr.concurrency = 1
    env.st.ocr.start()
    submit_in(env, env.case_id, [1])
    jb = submit_in(env, cid_b, [1])
    assert fake.arrived.wait(10)
    con = sqlite3.connect(str(pathlib.Path(root_b) / "工作区" / "case.db"))
    with con:
        con.execute("UPDATE ocr_jobs SET status='paused', pause_reason='key_invalid' WHERE job_id=?", (jb,))
    con.close()
    env.st.ocr._bad_key = hashlib.sha256(KEY.encode()).hexdigest()
    time.sleep(1.5)
    assert env.st.ocr._bad_key is not None
    holds = []
    for r in (env.root, pathlib.Path(root_b)):
        h = sqlite3.connect(str(r / "工作区" / "case.db"), timeout=1, isolation_level=None)
        h.execute("BEGIN IMMEDIATE")
        holds.append(h)
    try:
        s = ok(env.client.get("/api/settings"), "settings")
        t0 = time.monotonic()
        ok(env.client.put("/api/settings", json=s), "settings")
        dt = time.monotonic() - t0
        seen = set()
        for _ in range(60):
            seen.add(env.st.ocr._bad_key if env.st.ocr._bad_key in (None, "") else "fp")
            time.sleep(0.1)
        bk = "" if "" in seen else seen
    finally:
        for h in holds:
            h.execute("ROLLBACK")
            h.close()
        fake.hold.set()
    print("Y4 PUT took", round(dt, 3), "bad_key after locked resume:", repr(bk)[:6])
    assert dt < 2, dt
    assert bk == "", bk
    fake.block = False
    t1 = time.monotonic()
    jbs = wait_in(env, cid_b, jb, ("done", "queued", "running"), timeout=10)
    print("Y4 job b after release:", jbs["status"], "in", round(time.monotonic() - t1, 2), "s")
