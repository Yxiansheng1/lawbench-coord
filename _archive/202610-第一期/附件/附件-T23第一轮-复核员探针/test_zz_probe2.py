"""复核员探针 2：经 /api/archive/build 的端到端外链路径。外链只指向 127.0.0.1。不启动真 Word（Word 用假子进程）。"""
from __future__ import annotations

import json
import pathlib
import shutil
import sys

import pytest
from pypdf import PdfReader

from lawbench.ingest import libreoffice as lo
from lawbench.office import convert as C

from conftest import short_dir
from fakes import CountingListener, linked_image_docx
from t8_helpers import FIXTURES, Env, ok

CLOSED = FIXTURES / "closed-01"
FILES = {str(p.relative_to(CLOSED)).replace("\\", "/"): p for p in CLOSED.rglob("*") if p.is_file()}
OUT = pathlib.Path(r"C:\Users\<用户>\AppData\Local\Temp\claude\D--lawbench\780b8a59-1849-4c63-905e-c6705fafa3f6\scratchpad\rv-C21-T23-lab\probe-out.txt")


def note(*a):
    with open(OUT, "a", encoding="utf-8") as f:
        f.write(" ".join(str(x) for x in a) + "\n")


def plan(extra):
    return {"catalog": "民事行政卷", "client": "赵某丁", "opponent": "钱某戊", "cause": "买卖合同纠纷", "lawyer": None,
            "entrust_date": "2026-01-05", "close_date": "2026-06-30", "jzl_no": None, "result": "调解",
            "summary": "s", "opinion": "o", "fee_settled": True,
            "items": [{"code": 1, "name": "合同", "materials": ["委托代理合同"]},
                      {"code": 7, "name": "证据材料", "materials": ["送货单"] + extra}]}


@pytest.mark.skipif(lo.find_soffice() is None, reason="no LO")
def test_e2e(tmp_path, monkeypatch):
    lis = CountingListener().__enter__()
    try:
        linked_image_docx(tmp_path / "linked.docx", lis.url)
        with short_dir("lblo-") as lb, lo.Converter(tmp_path / "t", lo_base=lb).session() as s:
            doc_bytes = s.convert(tmp_path / "linked.docx", "doc").read_bytes()
        files = dict(FILES)
        (tmp_path / "src").mkdir()
        a = tmp_path / "src" / "对方证据甲.docx"; a.write_bytes(doc_bytes)              # OLE .doc，扩展名 .docx
        b = tmp_path / "src" / "对方证据乙.doc"; shutil.copy(tmp_path / "linked.docx", b)  # docx 内容，扩展名 .doc
        c = tmp_path / "src" / "说明.md"; c.write_text("# x\n", encoding="utf-8")
        files["03一审/我方证据/对方证据甲.docx"] = a
        files["03一审/我方证据/对方证据乙.doc"] = b
        files["03一审/我方证据/说明.md"] = c
        lis.count = 0
        env = Env(tmp_path / "e", files)
        try:
            note("e2e scan hits", lis.count)
            idx = json.loads((env.root / "工作区" / "材料" / "index.json").read_text(encoding="utf-8"))
            st = {m["name"]: (m["type"], m["status"], m.get("error")) for m in idx["materials"]}
            note("e2e status 甲", st.get("对方证据甲"), "乙", st.get("对方证据乙"))
            tid = env.begin("sess-p")["task_id"]
            m = env.tool_ok(tid, "case_archive_match", {"catalog": "民事行政卷"})
            note("e2e ignored", m["ignored"])
            # 甲：失败材料仍放进方案；转换程序 auto，Word 用假子进程（ok）
            log = tmp_path / "com.log"; log.write_text("", encoding="utf-8")
            monkeypatch.setattr(C, "WORKER_CMD", [sys.executable, str(pathlib.Path(__file__).with_name("fake_com_worker.py"))])
            monkeypatch.setenv("FAKE_COM_LOG", str(log)); monkeypatch.setenv("FAKE_COM_PIDS", str(tmp_path / "p"))
            monkeypatch.setenv("FAKE_COM_WORD", "ok")
            monkeypatch.setattr(C, "QUIT_WAIT", 0.3)
            s = ok(env.client.get("/api/settings"), "api/settings.schema.json"); s["converter"] = "auto"
            ok(env.client.put("/api/settings", json=s), "api/settings.schema.json")
            for label, extra in (("甲", ["对方证据甲"]), ("乙", ["对方证据乙"]), ("md", ["说明"])):
                p = plan(extra)
                sv = env.tool(tid, "case_save_archive_plan", p).json()
                note("e2e save", label, sv.get("ok"), (sv.get("value") or {}).get("warnings"), sv.get("error"))
                lis.count = 0
                log.write_text("", encoding="utf-8")
                r = env.client.post("/api/archive/build", json={"case_id": env.case_id, "task_id": tid,
                                    "plan": f"工作区/任务/{tid}/归档方案.json", "confirmed": p}).json()
                note("e2e build", label, "ok=", r.get("ok"), r.get("error", {}).get("code") if not r.get("ok") else
                     r["value"]["folder"], "hits=", lis.count, "com_calls=", log.read_text(encoding="utf-8").split())
        finally:
            env.close()
    finally:
        lis.__exit__(None, None, None)


def test_evidence_output():
    ev = pathlib.Path(__file__).resolve().parents[2] / "docs" / "plan" / "evidence" / "T23" / "closed-01-output"
    folder = next(p for p in ev.iterdir() if p.is_dir())
    ret = json.loads((ev / "archive_build-返回.json").read_text(encoding="utf-8"))
    vol = PdfReader(str(folder / "卷宗.pdf"))
    n = len(vol.pages)
    bad = [i for i, pg in enumerate(vol.pages, 1) if f"第{i}页 共{n}页" not in pg.extract_text()]
    rng = ret.get("value", ret).get("page_ranges")
    note("evidence pages", n, "missing pageno", bad, "ranges", rng)
    import docx
    t = docx.Document(str(folder / "立卷申请书.docx")).tables[0]
    note("evidence app rows", [(r.cells[0].text, r.cells[1].text) for r in t.rows[1:]])
    srcs = {"委托代理合同": "01委托手续/委托代理合同.pdf", "律师费发票": "01委托手续/律师费发票.pdf",
            "授权委托书": "01委托手续/授权委托书.pdf", "聊天记录": "03一审/我方证据/聊天记录.pdf",
            "送货单": "03一审/我方证据/送货单.pdf", "对账单": "03一审/我方证据/对账单.pdf",
            "民事调解书": "03一审/法院文书/民事调解书.pdf"}
    note("evidence src pages", {k: len(PdfReader(str(CLOSED / v)).pages) for k, v in srcs.items()})
    note("evidence invoice pages", len(PdfReader(str(folder / "发票.pdf")).pages))
