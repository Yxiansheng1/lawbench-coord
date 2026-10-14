"""在 srcm 副本上逐个变异、跑 test_ocr_queue.py、逐字节复原并核 sha256。"""
import hashlib
import os
import pathlib
import re
import subprocess
import sys
import time

LAB = pathlib.Path(__file__).resolve().parent
SRC = LAB / "srcm" / "service"
Q = SRC / "lawbench" / "ocr" / "queue.py"
M = SRC / "lawbench" / "ocr" / "merge.py"
SB = r"C:\Users\<用户>\AppData\Local\Temp\claude\rvC18s"
PY = r"D:\lawbench-B\service\.venv\Scripts\python.exe"

MUTS = {
    # 作者的 4 个（复现）
    "A1-no-orphan-reset": (Q, 'orphans = [p for p, s in rows if s == "sending" and p not in job.claimed]',
                           'orphans = []'),
    "A2-no-finish-stuck": (Q, "                    if not rows and not job.claimed:\n                        job.finalizing = True\n                        return job, None\n",
                           ""),
    "A3-settings-sync-db": (Q, "        if self._bad_key is not None:\n            self._key_resume_asked = True",
                            "        if self._bad_key is not None:\n            self._bad_key = None\n            for job in list(self._jobs.values()):\n                try:\n                    with merge.connect(job.root) as con:\n                        con.execute(\"UPDATE ocr_jobs SET status = 'queued', pause_reason = NULL WHERE job_id = ? AND status = 'paused' AND pause_reason = 'key_invalid'\", (job.job_id,))\n                except Exception:\n                    pass"),
    "B1-split-line-start": (M, '_PAGE_MARK = texts._MARKS["page"]', '_PAGE_MARK = re.compile(r"^【(第\\d+页)】\\n?", re.M)'),
    # 复核员自做
    "C1-orphan-ignores-claimed": (Q, 'orphans = [p for p, s in rows if s == "sending" and p not in job.claimed]',
                                  'orphans = [p for p, s in rows if s == "sending"]'),
    "C2-finish-stuck-noop": (Q, "            if page_no is None:                                       # 页都结束了而任务没收尾：补一次收尾\n                self._finish_stuck(job)\n",
                             "            if page_no is None:\n                job.finalizing = False\n"),
    "C3-no-finalizing-guard": (Q, "if job.skip_until > t or job.finalizing:", "if job.skip_until > t:"),
    "C4-prober-ignores-flag": (Q, "                self._key_resume_asked = False\n                self._resume_key_now(\"settings\")",
                               "                self._key_resume_asked = False"),
    "C5-split-line-start-v2": (M, '_PAGE_MARK = texts._MARKS["page"]', '_PAGE_MARK = re.compile(r"^【(第[0-9]+页)】", re.M)'),
    "C6-escape-any-bracket": (M, "from ..case.materials import escape_marks",
                              "escape_marks = lambda md: \"\\n\".join(\"\\u3000\" + l if l.startswith(\"【\") else l for l in md.split(\"\\n\"))"),
    "C7-no-pop-finished": (Q, "                        self._jobs.pop(job.job_id, None)\n                        continue\n                    if st[0] not in",
                           "                        continue\n                    if st[0] not in"),
}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def run(name, args, timeout=1500):
    out = LAB / f"mut-{name}.txt"
    env = dict(os.environ, PYTHONPATH=str(SRC), TEMP=SB, TMP=SB, LOCALAPPDATA=SB + r"\local",
               APPDATA=SB + r"\roaming", PYTHONDONTWRITEBYTECODE="1")
    cmd = [PY, "-B", "-m", "pytest", *args, "-q", "-p", "no:cacheprovider", f"--basetemp={SB}\\m{name[:3]}"]
    with open(out, "w", encoding="utf-8") as f:
        try:
            p = subprocess.run(cmd, cwd=SRC, stdout=f, stderr=subprocess.STDOUT, timeout=timeout)
            rc = p.returncode
        except subprocess.TimeoutExpired:
            rc = "TIMEOUT"
    tail = out.read_text(encoding="utf-8", errors="replace").strip().splitlines()[-1:]
    fails = [l for l in out.read_text(encoding="utf-8", errors="replace").splitlines() if l.startswith("FAILED")]
    return rc, tail, fails


def main():
    names = sys.argv[1:] or list(MUTS)
    orig = {p: (p.read_bytes(), sha(p)) for p in (Q, M)}
    for name in names:
        path, a, b = MUTS[name]
        text = path.read_bytes().decode("utf-8")
        if "\r\n" in text:
            a, b = a.replace("\n", "\r\n"), b.replace("\n", "\r\n")
        assert text.count(a) == 1, (name, text.count(a))
        path.write_bytes(text.replace(a, b).encode("utf-8"))
        t0 = time.monotonic()
        try:
            extra = ["tests/test_lab_c18.py", "tests/test_lab_c16.py"] if name.startswith(("C1", "C3", "C2", "A2")) else []
            rc, tail, fails = run(name, ["tests/test_ocr_queue.py", *extra])
        finally:
            path.write_bytes(orig[path][0])
            assert sha(path) == orig[path][1]
        line = f"{name}: rc={rc} {tail} {round(time.monotonic()-t0)}s FAILED={fails}"
        print(line, flush=True)
        with open(LAB / "mutations-c18.txt", "a", encoding="utf-8") as f:
            f.write(line + "\n")
    for p, (b, h) in orig.items():
        assert sha(p) == h
    print("restored OK", {p.name: h[:12] for p, (b, h) in orig.items()})


if __name__ == "__main__":
    main()
