"""复核员探针 3：扩展名 .xls、内容是带外链图片的 xlsx（T5 X1 的同一个样本），在归档转换里会不会交给 LibreOffice 取图。"""
from __future__ import annotations

import json
import pathlib

import pytest

from lawbench.case import gate
from lawbench.ingest import libreoffice as lo
from lawbench.office import convert as C

from conftest import short_dir
from fakes import CountingListener, linked_image_xlsx
from t8_helpers import FIXTURES, Env

OUT = pathlib.Path(r"C:\Users\<用户>\AppData\Local\Temp\claude\D--lawbench\780b8a59-1849-4c63-905e-c6705fafa3f6\scratchpad\rv-C21-T23-lab\probe-out.txt")


def note(*a):
    with open(OUT, "a", encoding="utf-8") as f:
        f.write(" ".join(str(x) for x in a) + "\n")


@pytest.mark.skipif(lo.find_soffice() is None, reason="no LO")
def test_xls_disguised(tmp_path):
    with CountingListener() as lis:
        x = tmp_path / "src" / "流水.xls"
        x.parent.mkdir()
        linked_image_xlsx(x, lis.url)
        env = Env(tmp_path / "e", {"03一审/我方证据/流水.xls": x})
        try:
            idx = json.loads((env.root / "工作区" / "材料" / "index.json").read_text(encoding="utf-8"))
            m = idx["materials"][0]
            note("xls-disguised ingest", m["type"], m["status"], m.get("note"), "hits", lis.count)
        finally:
            env.close()
        lis.count = 0
        root = tmp_path / "案件"
        (root / "工作区" / "临时").mkdir(parents=True)
        gate.mkdir_work(str(root), "工作区/临时/j")
        with short_dir("lblo-") as lb:
            try:
                out, used = C.OfficeConverter(lb).to_pdf(str(root), x, "工作区/临时/j", "auto")
                note("xls-disguised archive convert", used, "hits", lis.count)
            except Exception as e:  # noqa: BLE001
                note("xls-disguised archive convert raised", getattr(e, "code", type(e).__name__), "hits", lis.count)
