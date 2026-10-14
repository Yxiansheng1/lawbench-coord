"""变异：每个变异改导出副本里的一处，跑指定用例，记录红绿，逐字节复原并核 sha。"""
import hashlib
import os
import pathlib
import subprocess
import sys
import time

LAB = pathlib.Path(__file__).parent
SVC = LAB / "src" / "service"
PY = r"D:\lawbench-B\service\.venv\Scripts\python.exe"
Q = SVC / "lawbench" / "ocr" / "queue.py"
MERGE = SVC / "lawbench" / "ocr" / "merge.py"
APP = SVC / "lawbench" / "app.py"
UI = SVC / "lawbench" / "api" / "ui.py"
T = "tests/test_ocr_queue.py::"

MUTS = {
    "M1_worker_setpage_unguarded": (Q, [(
        """                try:
                    self._set_page(job.root, job.job_id, page_no, "pending", timeout=1.0)
                except Exception as e2:  # noqa: BLE001 case.db 还是写不了：留在"发送中"，重开案件或重启时回到待发送
                    logs.event("ocr", "page_reset", status="fail", case_id=job.case_id, error=type(e2).__name__)""",
        """                self._set_page(job.root, job.job_id, page_no, "pending")""")],
        [T + "test_case_folder_gone_others_continue_then_resume_on_open", T + "test_case_db_locked_20s_others_continue",
         "tests/test_lab_c16.py::test_x3_vanish_while_in_flight"]),
    "M2_process_no_isdir": (Q, [(
        """        if not os.path.isdir(job.root):                               # 发送前案件文件夹没了
            with self._cv:""", """        if False:
            with self._cv:""")],
        [T + "test_case_folder_gone_others_continue_then_resume_on_open", "tests/test_lab_c16.py::test_x3_vanish_while_in_flight"]),
    "M3_next_no_per_job_guard": (Q, [(
        """            if not os.path.isdir(job.root):                           # 文件夹被移走、移动盘拔了：先放下，重开案件时再接
                self._jobs.pop(job.job_id, None)
                logs.event("ocr", "case_gone", status="fail", case_id=job.case_id)
                continue
            try:""", """            if True:"""),
        ("""            except sqlite3.OperationalError as e:                     # 多半是被占（database is locked）
                job.skip_until = t + LOCKED_BACKOFF_S
                logs.event("ocr", "next", status="fail", case_id=job.case_id, error=type(e).__name__)
            except Exception as e:  # noqa: BLE001
                job.skip_until = t + ERROR_BACKOFF_S
                logs.event("ocr", "next", status="fail", case_id=job.case_id, error=type(e).__name__)
""", "")],
        [T + "test_case_folder_gone_others_continue_then_resume_on_open", T + "test_case_db_locked_20s_others_continue"]),
    "M3b_next_no_isdir_pop_only": (Q, [(
        """            if not os.path.isdir(job.root):                           # 文件夹被移走、移动盘拔了：先放下，重开案件时再接""",
        """            if False:""")],
        [T + "test_case_folder_gone_others_continue_then_resume_on_open"]),
    "M4_process_timeout_10": (Q, [(
        """        with merge.connect(job.root, timeout=1.0) as con:              # 被占就很快放弃""",
        """        with merge.connect(job.root, timeout=10) as con:              # 被占就很快放弃""")],
        [T + "test_case_db_locked_20s_others_continue"]),
    "M5_no_settings_hook": (APP, [(
        """    st.settings.on_change(lambda s: st.ocr.resume_key_invalid())""", """    pass""")],
        [T + "test_settings_save_resumes_key_invalid_job"]),
    "M6_no_key_poll": (Q, [(
        """                if fp is not None and fp != self._bad_key:""", """                if False:""")],
        [T + "test_key_change_resumes_key_invalid_job", T + "test_no_key_then_key_set_resumes"]),
    "M6b_key_poll_compare_plaintext": (Q, [(
        """        return hashlib.sha256(key.encode("utf-8")).hexdigest()
""", """        return key
""")],
        [T + "test_key_change_resumes_key_invalid_job", T + "test_no_key_then_key_set_resumes",
         "tests/test_lab_c16.py::test_x4_key_not_in_logs"]),
    "M7_cancel_no_disconnect": (Q, [(
        """        for s in senders:                                              # 正在发送的请求立即断开
            s.cancel()""", """        for s in senders:                                              # 正在发送的请求立即断开
            pass""")],
        [T + "test_cancel_keeps_done_pages_and_drops_in_flight"]),
    "M8_503_no_wait": (Q, [(
        """        end = time.monotonic() + seconds
        while""", """        end = time.monotonic() + 0
        while""")],
        [T + "test_503_waits_and_retries_without_counting"]),
    "M9_write_fail_unbounded": (Q, [(
        """            if n >= MAX_WRITE_FAIL:""", """            if False:""")],
        [T + "test_result_write_failure_stops_after_three"]),
    "M10_no_resume_on_case_open": (UI, [(
        """        st.ocr.resume_case(value["case_id"])""", """        pass""")],
        [T + "test_case_folder_gone_others_continue_then_resume_on_open"]),
    "M11_no_escape": (MERGE, [(
        """            body = OCR_HEAD + "\\n" + escape_marks(results[no].strip("\\n"))""",
        """            body = OCR_HEAD + "\\n" + results[no].strip("\\n")""")],
        [T + "test_ocr_line_like_page_mark_escaped"]),
    "M12_resume_case_touches_inmemory": (Q, [(
        """                    if r[0] not in self._jobs]                             # 正在做的不动""",
        """                    ]""")],
        [T + "test_case_folder_gone_others_continue_then_resume_on_open", T + "test_case_db_locked_20s_others_continue"]),
}


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main(names):
    out = LAB / "mutations.txt"
    for name in names:
        path, edits, tests = MUTS[name]
        orig = path.read_bytes()
        h0 = sha(path)
        src = orig.decode("utf-8")
        for a, b in edits:
            if "\r\n" in src:
                a, b = a.replace("\n", "\r\n"), b.replace("\n", "\r\n")
            n = src.count(a)
            assert n == 1, (name, n, a[:60])
            src = src.replace(a, b)
        path.write_bytes(src.encode("utf-8"))
        t0 = time.monotonic()
        try:
            r = subprocess.run([PY, "-B", "-m", "pytest", "-q", "-p", "no:cacheprovider", "-x", *tests], cwd=SVC,
                               capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=900)
            tail = "\n".join(r.stdout.strip().splitlines()[-4:])
            code = r.returncode
        except subprocess.TimeoutExpired:
            tail, code = "TIMEOUT", -1
        finally:
            path.write_bytes(orig)
        assert sha(path) == h0
        line = f"{name}: exit={code} ({'RED' if code else 'GREEN'}) {time.monotonic() - t0:.0f}s restored_sha_ok\n  {tail}\n"
        print(line, flush=True)
        with open(out, "a", encoding="utf-8") as f:
            f.write(line)


if __name__ == "__main__":
    main(sys.argv[1:] or list(MUTS))
