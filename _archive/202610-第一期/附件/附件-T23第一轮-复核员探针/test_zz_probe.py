"""复核员探针（只在导出副本里）。所有外链只指向 127.0.0.1 本机监听。不启动真 Word。"""
from __future__ import annotations

import hashlib
import io
import json
import pathlib
import shutil
import sys
import types
import zipfile

import docx as pydocx
import pytest
from pypdf import PdfReader, PdfWriter

from lawbench.archive import build as B
from lawbench.case import gate
from lawbench.ingest import libreoffice as lo
from lawbench.office import convert as C

from conftest import short_dir
from fakes import CountingListener, linked_image_docx

FIX = pathlib.Path(__file__).resolve().parents[2] / "tests" / "fixtures"
COMPLAINT = FIX / "closed-01" / "03一审" / "我方文件" / "民事起诉状.docx"
OUT = pathlib.Path(r"C:\Users\<用户>\AppData\Local\Temp\claude\D--lawbench\780b8a59-1849-4c63-905e-c6705fafa3f6\scratchpad\rv-C21-T23-lab\probe-out.txt")


def note(*a):
    with open(OUT, "a", encoding="utf-8") as f:
        f.write(" ".join(str(x) for x in a) + "\n")


@pytest.fixture
def case(tmp_path):
    root = tmp_path / "案件"
    (root / "工作区" / "临时").mkdir(parents=True)
    gate.mkdir_work(str(root), "工作区/临时/j")
    return root


@pytest.fixture
def lo_base():
    with short_dir("lblo-") as d:
        yield pathlib.Path(d)


def _zip_edit(src, dst, edits: dict, add: dict | None = None):
    zin = zipfile.ZipFile(src)
    with zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as z:
        for n in zin.namelist():
            d = zin.read(n)
            if n in edits:
                d = edits[n](d)
            z.writestr(n, d)
        for n, d in (add or {}).items():
            z.writestr(n, d)


# ---------------------------------------------------------------- 1. 外链预检覆盖面
def test_precheck_matrix(tmp_path):
    url = "http://127.0.0.1:9"
    base = tmp_path / "linked.docx"
    linked_image_docx(base, url)
    rows = []
    # a) 同一份带外链图片的 docx，扩展名改成 .doc / .wps（内容仍是 docx）
    for ext in (".docx", ".doc", ".wps"):
        p = tmp_path / f"a{ext}"
        shutil.copy(base, p)
        rows.append((f"docx 内容 + 扩展名 {ext}", C.word_has_external(p)))
    # b) RTF 内容，扩展名 .doc，Word 常见写法：fldinst 被拆成多个组
    rtf = (b"{\\rtf1\\ansi{\\field{\\*\\fldinst {\\rtlch\\fcs1 \\af0 \\ltrch\\fcs0 \\insrsid1 INCLUDEPICTURE }"
           b"{\\rtlch\\fcs1 \\af0 \\ltrch\\fcs0 \\insrsid1 \"" + url.encode() + b"/x.png\" \\\\* MERGEFORMATINET }}"
           b"{\\fldrslt {}}}}")
    for ext in (".doc", ".rtf"):
        p = tmp_path / f"b{ext}"
        p.write_bytes(rtf)
        rows.append((f"RTF(拆组 fldinst) 扩展名 {ext}", C.word_has_external(p)))
    # b2) RTF 远程模板
    p = tmp_path / "b2.rtf"
    p.write_bytes(b"{\\rtf1\\ansi{\\*\\template \\\\\\\\127.0.0.1\\\\s\\\\t.dot}hello}")
    rows.append(("RTF \\*\\template UNC 扩展名 .rtf", C.word_has_external(p)))
    p = tmp_path / "b2.doc"
    p.write_bytes(p.with_suffix(".rtf").read_bytes())
    rows.append(("RTF \\*\\template UNC 扩展名 .doc", C.word_has_external(p)))
    # c) HTML 内容扩展名 .doc（裁判文书网下载的 .doc 常是 HTML）
    p = tmp_path / "c.doc"
    p.write_bytes(f'<html><body><p>判决书</p><img src="{url}/h.png"></body></html>'.encode("utf-8"))
    rows.append(("HTML(img src=http) 扩展名 .doc", C.word_has_external(p)))
    # d) docx 的 attachedTemplate 外部关系（settings.xml.rels）
    plain = tmp_path / "plain.docx"
    pydocx.Document().save(str(plain))
    p = tmp_path / "d.docx"
    _zip_edit(plain, p, {"word/settings.xml": lambda d: d.replace(
        b"<w:zoom", b'<w:attachedTemplate r:id="rIdT"/><w:zoom', 1)},
        {"word/_rels/settings.xml.rels": (
            '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/attachedTemplate" '
            'Target="\\\\127.0.0.1\\s\\t.dotm" TargetMode="External"/></Relationships>')})
    rows.append(("docx attachedTemplate 外部关系", C.word_has_external(p)))
    # e) 页眉部件的外部图片关系
    p = tmp_path / "e.docx"
    _zip_edit(plain, p, {}, {"word/_rels/header9.xml.rels": (
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" '
        f'Target="{url}/h.png" TargetMode="External"/></Relationships>')})
    rows.append(("docx 页眉 rels 外部图片", C.word_has_external(p)))
    # f) 外部超链接（应放行）
    p = tmp_path / "f.docx"
    _zip_edit(plain, p, {}, {"word/_rels/footnotes.xml.rels": (
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" '
        f'Target="{url}/" TargetMode="External"/></Relationships>')})
    rows.append(("docx 外部超链接（应为 False）", C.word_has_external(p)))
    # g) altChunk：内部 mht/html 部件里引用远程图片
    p = tmp_path / "g.docx"
    _zip_edit(plain, p, {"word/document.xml": lambda d: d.replace(b"<w:sectPr", b'<w:altChunk r:id="rIdA"/><w:sectPr', 1),
                         "word/_rels/document.xml.rels": lambda d: d.replace(b"</Relationships>",
                         b'<Relationship Id="rIdA" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="chunk.html"/></Relationships>'),
                         "[Content_Types].xml": lambda d: d.replace(b"</Types>",
                         b'<Default Extension="html" ContentType="text/html"/></Types>')},
              {"word/chunk.html": f'<html><body><img src="{url}/alt.png"></body></html>'})
    rows.append(("docx altChunk(html 里 img src=http)", C.word_has_external(p)))
    # h) INCLUDEPICTURE 本机映射盘 / 无协议
    for k, v in rows:
        note("precheck", k, "=>", v)


# ---------------------------------------------------------------- 2. 旧版 .doc 外链样本改名 .docx 交给 LibreOffice
@pytest.mark.skipif(lo.find_soffice() is None, reason="no LO")
def test_ole_doc_renamed_docx_lo_fetch(case, lo_base, tmp_path, monkeypatch):
    lis = CountingListener().__enter__()
    try:
        linked_image_docx(tmp_path / "linked.docx", lis.url)
        with short_dir("lblo-") as lb, lo.Converter(tmp_path / "t", lo_base=lb).session() as s:
            doc_bytes = s.convert(tmp_path / "linked.docx", "doc").read_bytes()
        lis.count = 0
        src = tmp_path / "对方证据.docx"           # OLE .doc 内容，扩展名 .docx
        src.write_bytes(doc_bytes)
        note("ole-as-docx head", src.read_bytes()[:8].hex(), "word_has_external", C.word_has_external(src))
        try:
            out, used = C.OfficeConverter(lo_base).to_pdf(str(case), src, "工作区/临时/j", "auto")
            note("ole-as-docx auto converter", used, "hits", lis.count)
        except Exception as e:  # noqa: BLE001
            note("ole-as-docx auto raised", type(e).__name__, getattr(e, "code", ""), "hits", lis.count)
        # 对照：扩展名 .doc
        lis.count = 0
        src2 = tmp_path / "对方证据.doc"
        src2.write_bytes(doc_bytes)
        try:
            out, used = C.OfficeConverter(lo_base).to_pdf(str(case), src2, "工作区/临时/j", "libreoffice")
            note("ole-as-doc lo", used, "hits", lis.count)
        except Exception as e:  # noqa: BLE001
            note("ole-as-doc lo raised", type(e).__name__, getattr(e, "code", ""), "hits", lis.count)
    finally:
        lis.__exit__(None, None, None)


# ---------------------------------------------------------------- 3. com_worker 用假 win32com 核调用
def test_com_worker_fake(monkeypatch, tmp_path):
    calls = []

    class Doc:
        def ExportAsFixedFormat(self, out, fmt):
            calls.append(("Export", out, fmt))

        def Close(self, save):
            calls.append(("Close", save))

        def PrintOut(self, *a):
            calls.append(("PrintOut",))

    class Opt:
        def __init__(self):
            object.__setattr__(self, "UpdateLinksAtOpen", True)

        def __setattr__(self, k, v):
            calls.append(("Options." + k, v))
            object.__setattr__(self, k, v)

    class Docs:
        def Open(self, *a, **kw):
            calls.append(("Open", a, kw))
            return Doc()

    class App:
        def __init__(self):
            object.__setattr__(self, "Options", Opt())
            object.__setattr__(self, "Documents", Docs())

        def __setattr__(self, k, v):
            calls.append(("App." + k, v))
            object.__setattr__(self, k, v)

        def Quit(self, *a):
            calls.append(("Quit", a))

    w32 = types.ModuleType("win32com")
    cl = types.ModuleType("win32com.client")
    cl.DispatchEx = lambda progid: (calls.append(("DispatchEx", progid)), App())[1]
    cl.Dispatch = lambda progid: (calls.append(("Dispatch", progid)), App())[1]
    w32.client = cl
    pc = types.ModuleType("pythoncom")
    pc.CoInitialize = lambda: calls.append(("CoInit",))
    pc.CoUninitialize = lambda: calls.append(("CoUninit",))
    pt = types.ModuleType("pywintypes")
    pt.com_error = type("com_error", (Exception,), {})
    monkeypatch.setitem(sys.modules, "win32com", w32)
    monkeypatch.setitem(sys.modules, "win32com.client", cl)
    monkeypatch.setitem(sys.modules, "pythoncom", pc)
    monkeypatch.setitem(sys.modules, "pywintypes", pt)
    from lawbench.office import com_worker
    rc = com_worker.main("Word.Application", "C:/x/in.docx", "C:/x/out.pdf")
    note("com_worker rc", rc)
    for c in calls:
        note("com_worker call", c)


# ---------------------------------------------------------------- 4. 只有权限密码（空打开密码）的 PDF
def test_owner_password_pdf(tmp_path):
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    for i in range(2):
        c.drawString(100, 700, f"page {i}")
        c.showPage()
    c.save()
    w = PdfWriter()
    w.append(PdfReader(io.BytesIO(buf.getvalue())))
    w.encrypt(user_password="", owner_password="owner-only", algorithm="AES-128")
    p = tmp_path / "判决书.pdf"
    with open(p, "wb") as f:
        w.write(f)
    r = B._readable(p)
    note("ownerpw _readable", r is not None)
    try:
        wr = PdfWriter()
        wr.append(PdfReader(str(p)))
        B.number_pages(wr)
        o = io.BytesIO()
        wr.write(o)
        rr = PdfReader(io.BytesIO(o.getvalue()))
        note("ownerpw merged pages", len(rr.pages), [pg.extract_text()[-12:] for pg in rr.pages])
    except Exception as e:  # noqa: BLE001
        note("ownerpw merge raised", type(e).__name__, str(e)[:120])


# ---------------------------------------------------------------- 5. CropBox 比 MediaBox 小时页码是否在可见区
def test_cropbox(tmp_path):
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(595, 842))
    c.drawString(100, 400, "body")
    c.showPage()
    c.save()
    w = PdfWriter()
    w.append(PdfReader(io.BytesIO(buf.getvalue())))
    w.pages[0].cropbox.lower_left = (0, 100)     # 扫描件常见：可见区比纸张小
    B.number_pages(w)
    o = io.BytesIO()
    w.write(o)
    r = PdfReader(io.BytesIO(o.getvalue()))
    pg = r.pages[0]
    ys = []

    def visit(text, cm, tm, fd, fs):
        if "第" in text:
            ys.append(round(tm[5] * cm[3] + cm[5], 1) if cm else tm[5])
    pg.extract_text(visitor_text=visit)
    note("cropbox", "crop=", [float(x) for x in pg.cropbox], "pageno y=", ys)
