"""复核员变异：在 mut 副本上逐条改坏、跑指定用例、逐字节复原。"""
import hashlib
import os
import pathlib
import subprocess
import sys

LAB = pathlib.Path(__file__).resolve().parent
SVC = LAB / "mut" / "service"
PY = r"D:\lawbench-C\.venv\Scripts\python.exe"
SHORT = r"C:\Users\<用户>\AppData\Local\Temp\claude\rvC21s"

M = [
    ("M1 转换顺序 WPS 先于 Word", "lawbench/office/convert.py",
     'ORDER = ("word", "wps", "libreoffice")', 'ORDER = ("wps", "word", "libreoffice")',
     "tests/test_convert.py::test_word_ok_is_first tests/test_convert.py::test_word_missing_then_wps"),
    ("M2 超时只杀子进程不杀树", "lawbench/office/convert.py",
     "            kill_tree(proc, drain=True)\n", "            proc.kill(); proc.wait()\n",
     "tests/test_convert.py::test_hang_times_out_kills_and_falls_through"),
    ("M3 去掉外链预检", "lawbench/office/convert.py",
     'if any(o != "libreoffice" for o in order) and word_has_external(local):',
     'if False and word_has_external(local):',
     "tests/test_convert.py::test_external_link_skips_word_and_wps"),
    ("M4 忽略规则失效（命名混乱）", "lawbench/archive/match.py",
     '_MESSY = re.compile(r"^(微信图片|IMG)_\\d+", re.IGNORECASE)', '_MESSY = re.compile(r"^$^x")',
     "tests/test_archive.py::test_match_closed01 tests/test_archive.py::test_match_rules_unit"),
    ("M5 文件夹对应多项也归入", "lawbench/archive/match.py",
     "if len(by_folder) == 1:", "if len(by_folder) >= 1:",
     "tests/test_archive.py::test_match_rules_unit"),
    ("M6 缺失必交项不看 required", "lawbench/archive/match.py",
     'if it["required"] and not it.get("generated") and it["code"] not in codes]',
     'if not it.get("generated") and it["code"] not in codes]',
     "tests/test_archive.py::test_save_plan"),
    ("M7 不加页码层", "lawbench/archive/build.py",
     "        number_pages(writer)\n", "        pass\n",
     "tests/test_archive.py::test_build_closed01"),
    ("M8 同名不加 -v2（覆盖旧文件夹）", "lawbench/archive/build.py",
     "while gate.resolve_internal(root, folder, op=\"archive_build\").exists():",
     "while False:",
     "tests/test_archive.py::test_build_again_v2_and_statements"),
    ("M9 result 为 null 也生成", "lawbench/archive/build.py",
     '        if plan["result"] is None:\n            raise ApiError("PLAN_NOT_CONFIRMED", "result_null")\n', "",
     "tests/test_archive.py::test_result_null_rejected"),
    ("M10 原件被改（PDF 原件追加一字节）", "lawbench/archive/build.py",
     '        if m["type"] in PDF_TYPES:\n            return src, None',
     '        if m["type"] in PDF_TYPES:\n            open(src, "ab").write(b"\\n")\n            return src, None',
     "tests/test_archive.py::test_build_closed01"),
    ("M11 临时目录不清", "lawbench/archive/build.py",
     '            remove_tree(gate.resolve_internal(root, job, op="archive_build"))', "            pass",
     "tests/test_archive.py::test_build_closed01"),
    ("M12 COM 收尾不分父进程", "lawbench/office/convert.py",
     'if parent is not None and parent[1] == "svchost.exe":', "if True:",
     "tests/test_convert.py::test_com_started_only_ours"),
    ("M13 页码范围少算一页", "lawbench/archive/build.py",
     "                ranges[code] = (start, len(writer.pages))", "                ranges[code] = (start, len(writer.pages) - 1 if len(writer.pages) > start else start)",
     "tests/test_archive.py::test_build_closed01"),
    ("M14 AddToRecentFiles=True（com_worker）", "lawbench/office/com_worker.py",
     "app.Documents.Open(src, False, True, False)", "app.Documents.Open(src, False, True, True)",
     "tests/test_convert.py tests/test_archive.py"),
    ("M15 不恢复 UpdateLinksAtOpen、ReadOnly=False（com_worker）", "lawbench/office/com_worker.py",
     "app.Documents.Open(src, False, True, False)", "app.Documents.Open(src, False, False, False)",
     "tests/test_convert.py tests/test_archive.py"),
    ("M16 不拒失败材料（基线：现在就不拒，看有无用例守）", "lawbench/archive/match.py",
     '_UNREADABLE = ("failed", "source_deleted")', '_UNREADABLE = ("source_deleted",)',
     "tests/test_archive.py"),
]


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main(only=None):
    env = dict(os.environ, TEMP=SHORT + r"\tmp", TMP=SHORT + r"\tmp", LOCALAPPDATA=SHORT + r"\local",
               APPDATA=SHORT + r"\roam", PYTHONPATH=str(SVC), PYTHONDONTWRITEBYTECODE="1")
    env.pop("LAWBENCH_REAL_WORD", None)
    out = open(LAB / "mutations-result.txt", "a", encoding="utf-8")
    for i, (name, rel, old, new, tests) in enumerate(M):
        if only and name.split()[0] not in only:
            continue
        f = SVC / rel
        orig = f.read_bytes()
        h0 = sha(f)
        text = orig.decode("utf-8")
        if text.count(old) == 0 and "\r\n" in text:
            old, new = old.replace("\n", "\r\n"), new.replace("\n", "\r\n")
        n = text.count(old)
        if n != 1:
            out.write(f"{name}: SKIP 匹配 {n} 处\n"); out.flush(); continue
        f.write_bytes(text.replace(old, new).encode("utf-8"))
        try:
            r = subprocess.run([PY, "-B", "-m", "pytest", *tests.split(), "-q", "-x", "-p", "no:cacheprovider",
                                f"--basetemp={SHORT}\\bt-m{i}"], cwd=str(SVC), env=env, capture_output=True,
                               text=True, encoding="utf-8", errors="replace", timeout=900)
            last = [l for l in r.stdout.splitlines() if l.strip()][-1:]
            verdict = "红(被抓住)" if r.returncode != 0 else "绿(没抓住)"
            out.write(f"{name}: {verdict} rc={r.returncode} {last}\n")
        except subprocess.TimeoutExpired:
            out.write(f"{name}: 超时\n")
        finally:
            f.write_bytes(orig)
            assert sha(f) == h0
            out.write(f"  复原 sha256 一致 {h0[:12]}\n")
            out.flush()


if __name__ == "__main__":
    main(sys.argv[1:] or None)
