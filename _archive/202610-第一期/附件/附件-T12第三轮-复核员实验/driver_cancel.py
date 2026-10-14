"""真进程实验：硬杀续做、取消断开、两案件并发加重复提交、日志泄漏。端口 19451（假 395）、19452（服务）。"""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time

import httpx

LAB = pathlib.Path(__file__).parent
SB = pathlib.Path(os.environ["LAB_SB"])
PY = r"D:\lawbench-B\service\.venv\Scripts\python.exe"
PDF = LAB / "src" / "tests" / "fixtures" / "criminal-01" / "讯问笔录.pdf"
FAKE = "http://127.0.0.1:19451"
SVC = "http://127.0.0.1:19452"
H = {"Authorization": "Bearer " + "c" * 40}
APPDATA = SB / "appdata"
procs = []
out = []


def log(*a):
    s = " ".join(str(x) for x in a)
    print(s, flush=True)
    out.append(s)


def start(args, name):
    p = subprocess.Popen([PY, "-B", *args], cwd=LAB, stdout=open(SB / f"{name}.out", "ab"), stderr=subprocess.STDOUT)
    procs.append(p)
    log("started", name, "pid", p.pid)
    return p


def wait_up(url, t=20):
    end = time.time() + t
    while time.time() < end:
        try:
            if httpx.get(url + "/health", timeout=1).status_code == 200:
                return
        except httpx.HTTPError:
            pass
        time.sleep(0.2)
    raise RuntimeError("not up " + url)


def api(method, path, **kw):
    r = httpx.request(method, SVC + path, headers=H, timeout=30, **kw)
    b = r.json()
    if not b.get("ok"):
        raise RuntimeError(f"{path} {b.get('error')}")
    return b["value"]


def fake(path="/stats", body=None):
    return (httpx.post(FAKE + path, json=body, timeout=5) if body is not None else httpx.get(FAKE + path, timeout=5)).json()


def mkcase(name):
    root = SB / "cases" / name
    (root / "卷一").mkdir(parents=True, exist_ok=True)
    shutil.copy(PDF, root / "卷一" / "讯问笔录.pdf")
    cid = api("POST", "/api/case/open", json={"path": str(root)})["case_id"]
    api("POST", "/api/materials/scan", json={"case_id": cid})
    ms = api("GET", "/api/materials", params={"case_id": cid})["materials"]
    mid = next(m["material_id"] for m in ms if m["name"] == "讯问笔录")
    return cid, root, mid


def submit(cid, mid, pages):
    return api("POST", "/api/ocr/jobs", json={"case_id": cid, "material_id": mid, "pages": pages,
                                              "dewatermark": False})["job_id"]


def job(cid, jid):
    return next(j for j in api("GET", "/api/ocr/jobs", params={"case_id": cid})["jobs"] if j["job_id"] == jid)


def wait_job(cid, jid, sts, t=90):
    end = time.time() + t
    while time.time() < end:
        j = job(cid, jid)
        if j["status"] in sts:
            return j
        time.sleep(0.2)
    raise RuntimeError(f"timeout {j}")


def netstat_conns():
    o = subprocess.run(["netstat", "-ano", "-p", "TCP"], capture_output=True, text=True).stdout
    return sum(1 for l in o.splitlines() if "127.0.0.1:19451" in l.split()[2:3] and "ESTABLISHED" in l)


def main():
    shutil.rmtree(SB / "cases", ignore_errors=True)
    shutil.rmtree(APPDATA, ignore_errors=True)
    start(["fake395.py", "19451"], "fake395")
    wait_up(FAKE)
    start(["svc.py", str(APPDATA), "19452", FAKE], "svc")
    wait_up(SVC)
    cid, root, mid = mkcase("丙")
    for rnd in range(3):
        fake("/cfg", {"delay": 30.0, "calls": [], "cancelled": 0, "started": 0, "done": 0})
        jid = submit(cid, mid, [1, 2, 3])
        end = time.time() + 20
        while fake()["started"] < 2 and time.time() < end:
            time.sleep(0.05)
        time.sleep(0.5)
        c0 = netstat_conns()
        t0 = time.time()
        r = api("POST", f"/api/ocr/jobs/{jid}/cancel")
        tc = time.time() - t0
        n, tz = c0, None
        while time.time() - t0 < 10:
            n = netstat_conns()
            if n == 0:
                tz = time.time() - t0
                break
            time.sleep(0.05)
        log(f"cancel#{rnd}: api {r['status']} {tc:.2f}s | conns before {c0} | zero at {tz}")
        time.sleep(1)


try:
    main()
finally:
    for p in procs:
        if p.poll() is None:
            subprocess.run(["taskkill", "/F", "/PID", str(p.pid)], capture_output=True)
    (LAB / "real-cancel.txt").write_text("\n".join(out), encoding="utf-8")
