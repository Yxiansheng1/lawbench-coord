"""真进程实验：硬杀续做、取消断开、两案件并发加重复提交、日志泄漏。端口 19441（假 395）、19442（服务）。"""
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
FAKE = "http://127.0.0.1:19441"
SVC = "http://127.0.0.1:19442"
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


def main():
    shutil.rmtree(SB / "cases", ignore_errors=True)
    shutil.rmtree(APPDATA, ignore_errors=True)
    start(["fake395.py", "19441"], "fake395")
    wait_up(FAKE)
    svc = start(["svc.py", str(APPDATA), "19442", FAKE], "svc")
    wait_up(SVC)

    # ---- 1 硬杀续做
    fake("/cfg", {"delay": 3.0})
    cid, root, mid = mkcase("甲")
    jid = submit(cid, mid, [1, 2, 3])
    end = time.time() + 30
    while job(cid, jid)["done"] < 1 and time.time() < end:
        time.sleep(0.1)
    rdir = root / "工作区" / "材料" / "识别页" / mid
    before = {p.name: p.stat().st_mtime_ns for p in rdir.glob("*.md")}
    st0 = fake()
    subprocess.run(["taskkill", "/F", "/PID", str(svc.pid)], capture_output=True)
    svc.wait(10)
    log("hardkill: done-before-kill", sorted(before), "fake started", st0["started"])
    svc = start(["svc.py", str(APPDATA), "19442", FAKE], "svc2")
    wait_up(SVC)
    j = wait_job(cid, jid, ("done", "partial_failed"))
    after = {p.name: p.stat().st_mtime_ns for p in rdir.glob("*.md")}
    st = fake()
    shas = [c["sha"] for c in st["calls"]]
    log("hardkill: job", j["status"], j["done"], j["failed"], "| total sent", len(shas),
        "| max per page", max(shas.count(h) for h in set(shas)),
        "| done-before-kill rewritten:", [n for n in before if after.get(n) != before[n]])

    # ---- 2 取消断开
    fake("/cfg", {"delay": 30.0, "calls": [], "cancelled": 0, "started": 0, "done": 0})
    _, _, mid_b = cid, root, mid
    jid2 = submit(cid, mid, [1, 2, 3])
    end = time.time() + 20
    while fake()["started"] < 2 and time.time() < end:
        time.sleep(0.05)
    def conns():
        ps = ("(Get-NetTCPConnection -State Established -RemotePort 19441 -ErrorAction SilentlyContinue | "
              "Measure-Object).Count")
        return int(subprocess.run(["powershell", "-NoProfile", "-Command", ps], capture_output=True, text=True).stdout.strip() or 0)
    c0 = conns()
    t0 = time.time()
    r = api("POST", f"/api/ocr/jobs/{jid2}/cancel")
    tc = time.time() - t0
    end = time.time() + 5
    n = conns()
    while n > 0 and time.time() < end:
        time.sleep(0.1)
        n = conns()
    log("cancel: api", r["status"], f"{tc:.2f}s", "| svc->395 conns before", c0, "after", n,
        f"at {time.time() - t0:.2f}s", "| job", job(cid, jid2)["status"])

    # ---- 3 两案件并发加重复提交
    fake("/cfg", {"delay": 0.5, "calls": [], "cancelled": 0, "started": 0, "done": 0})
    cid2, root2, mid2 = mkcase("乙")
    a = submit(cid, mid, [1, 2, 3])
    b = submit(cid2, mid2, [1, 2, 3])
    a2 = submit(cid, mid, [1, 2, 3])
    for c, jj in ((cid, a), (cid2, b), (cid, a2)):
        log("two_cases:", wait_job(c, jj, ("done", "partial_failed"))["status"])
    for c in (cid, cid2):
        m = next(x for x in api("GET", "/api/materials", params={"case_id": c})["materials"] if x["name"] == "讯问笔录")
        log("two_cases material:", m["status"], m["is_ocr"], m.get("pages_need_ocr"), m.get("stale_ocr"))
    log("two_cases fake pages:", fake()["started"])

    # ---- 4 日志
    blob = ""
    for p in APPDATA.rglob("*"):
        if p.is_file() and p.suffix in (".log", ".jsonl", ".txt", "") or p.name.endswith(".log"):
            try:
                blob += p.read_text(encoding="utf-8", errors="replace")
            except OSError:
                pass
    hits = {n: blob.count(n) for n in ("讯问笔录", "识别文本", "sk-lab-fake-c16", "甲", "乙", "卷一")}
    log("log leak hits:", hits, "| ocr log lines:", blob.count('"ocr"'))


try:
    main()
finally:
    for p in procs:
        if p.poll() is None:
            subprocess.run(["taskkill", "/F", "/PID", str(p.pid)], capture_output=True)
    (LAB / "real-process.txt").write_text("\n".join(out), encoding="utf-8")
