"""T37 Word 修改清单与修订版两个当前原件读点的独立 stdlib 验证。

直接运行：
``python -B -X utf8 service\\tests\\t37_word_ref_standalone.py -v``

设置 ``LB_T37_CODE_REV=217cdec65f435db3cecd43885c792d290f8267d1`` 时，
只从 Git 读取该提交的 outputs.py / edit_list.py，配同一份最终测试和当前未改
redline/Materials 核心做私有 hybrid。脚本不导入 app、真实 Tools registry、
TaskStore 模块或旧 T37 pytest；TaskStore 仅按准确 AST 取本旅程所需真实方法。
"""
from __future__ import annotations

import ast
import hashlib
import inspect
import json
import os
import pathlib
import re
import shutil
import socket
import sqlite3
import stat
import subprocess
import sys
import tempfile
import threading
import time
import types
import unittest
import uuid
import zipfile
from datetime import datetime
from unittest import mock
from xml.sax.saxutils import escape

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
SERVICE_ROOT = REPO_ROOT / "service"
CODE_REV = os.environ.get("LB_T37_CODE_REV", "").strip().lower()
BASE_REV = "217cdec65f435db3cecd43885c792d290f8267d1"
CASE_ID = "3f2b9c1e-7a4d-4e8b-9c2a-1b5d6e7f8a90"
OTHER_CASE = "9c4e7a1f-2b6d-4c8e-8f0a-5d3b1e9c7a42"
TASK_ID = "T-20261022131439-a037"
NOW = "2026-10-22T13:14:39+08:00"
PARAMS = {"thinking": "中", "window": "64K", "max_tokens": 16384, "temperature": 0.6}
BUDGET = {"model_calls": 32, "tool_calls": 48, "minutes": 45}
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}

if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from lawbench import contracts  # noqa: E402
from lawbench.case import gate, refs as ref_registry, texts  # noqa: E402
from lawbench.errors import ApiError  # noqa: E402
from lawbench.ingest import MAX_BYTES, REASONS, RETRY_MESSAGES, Parsed, ParseError  # noqa: E402
from lawbench.ingest import detect, docx as ingest_docx, image, links, pdf, text, xlsx  # noqa: E402
from lxml import etree  # noqa: E402


def _dangerous(*_args, **_kwargs):
    raise AssertionError("危险外围被触达")


def _deny_network(*_args, **_kwargs):
    raise AssertionError("测试禁止网络连接")


def _deny_thread_start(*_args, **_kwargs):
    raise AssertionError("测试禁止启动线程")


class _LogsProbe:
    events: list[dict] = []

    @classmethod
    def event(cls, module, event, **fields):
        cls.events.append({"module": module, "event": event, **fields})


class _ChecksShell:
    @staticmethod
    def skill_kind(*_args, **_kwargs):
        return "analysis"

    @classmethod
    def check_text(cls, *_args, **_kwargs):
        return {"passed": True, "problems": [], "stats": {"citations": 0, "must_fix": 0, "hints": 0}}, []


class _PandocShell:
    @staticmethod
    def strip_workspace_links(value):
        return value

    @staticmethod
    def template_path(*_args, **_kwargs):
        return _dangerous()

    @staticmethod
    def to_docx(*_args, **_kwargs):
        return _dangerous()


class _ConverterShell:
    def __init__(self, workdir, lo_base):
        self.workdir = workdir
        self.lo_base = lo_base

    def session(self):
        return self

    def __enter__(self):
        return self

    def __exit__(self, _exc_type, _exc, _tb):
        return False

    def convert(self, *_args, **_kwargs):
        return _dangerous()


class _SearchProbe:
    calls: list[tuple[str, str, list[str]]] = []

    @classmethod
    def refresh_after_scan(cls, root, case_id, index):
        cls.calls.append((root, case_id, [m["material_id"] for m in index["materials"]]))


def _git_show(rev: str, rel: str) -> bytes:
    completed = subprocess.run(
        ["git", "show", f"{rev}:{rel}"],
        cwd=REPO_ROOT,
        check=False,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        timeout=15,
    )
    if completed.returncode != 0:
        raise RuntimeError(completed.stderr.decode("utf-8", "replace"))
    return completed.stdout


def _source(rel: str, *, revisioned: bool = False) -> tuple[str, bytes]:
    if CODE_REV and revisioned:
        return f"git:{CODE_REV}:{rel}", _git_show(CODE_REV, rel)
    return f"worktree:{rel}", (REPO_ROOT / rel).read_bytes()


def _kept_nodes(raw: bytes, label: str):
    tree = ast.parse(raw.decode("utf-8"), filename=label)
    kept = [
        node for node in tree.body
        if isinstance(node, (ast.Assign, ast.AnnAssign, ast.FunctionDef, ast.ClassDef))
    ]
    module = ast.Module(body=kept, type_ignores=[])
    ast.fix_missing_locations(module)
    return tree, module


def _templates() -> dict:
    source = (SERVICE_ROOT / "lawbench/case/registry.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    names = {"_TRIAL6", "_INVEST5", "_expand", "TEMPLATES"}
    nodes = [
        node for node in tree.body
        if (
            isinstance(node, ast.Assign)
            and any(isinstance(t, ast.Name) and t.id in names for t in node.targets)
        )
        or (isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and node.target.id in names)
        or (isinstance(node, ast.FunctionDef) and node.name in names)
    ]
    module = ast.Module(body=nodes, type_ignores=[])
    ast.fix_missing_locations(module)
    namespace = {"__builtins__": __builtins__}
    exec(compile(module, "registry.py<T37 word templates>", "exec"), namespace)
    return namespace["TEMPLATES"]


def _materials_namespace(raw: bytes, label: str) -> dict:
    _, module = _kept_nodes(raw, f"materials.py<{label}>")
    namespace = {
        "__builtins__": __builtins__,
        "hashlib": hashlib,
        "json": json,
        "os": os,
        "pathlib": pathlib,
        "re": re,
        "shutil": shutil,
        "sqlite3": sqlite3,
        "stat": stat,
        "threading": threading,
        "time": time,
        "uuid": uuid,
        "zipfile": zipfile,
        "datetime": datetime,
        "contracts": contracts,
        "ApiError": ApiError,
        "MAX_BYTES": MAX_BYTES,
        "REASONS": REASONS,
        "RETRY_MESSAGES": RETRY_MESSAGES,
        "Parsed": Parsed,
        "ParseError": ParseError,
        "detect": detect,
        "docx": ingest_docx,
        "image": image,
        "links": links,
        "pdf": pdf,
        "text": text,
        "xlsx": xlsx,
        "Converter": _ConverterShell,
        "CaseRegistry": type("CaseRegistry", (), {}),
        "remove_tree": lambda path: shutil.rmtree(path, ignore_errors=True),
        "gate": gate,
        "refs": ref_registry,
        "ref_registry": ref_registry,
        "texts": texts,
        "trash": types.SimpleNamespace(recycle=_dangerous, has_recycle_bin=lambda _p: False),
        "search_fts": _SearchProbe,
        "logs": _LogsProbe,
        "TEMPLATES": _templates(),
    }
    exec(compile(module, f"materials.py<{label}>", "exec"), namespace)
    return namespace


def _edit_list_namespace(raw: bytes, label: str) -> dict:
    _, module = _kept_nodes(raw, f"edit_list.py<{label}>")
    namespace = {
        "__builtins__": __builtins__,
        "json": json,
        "zipfile": zipfile,
        "etree": etree,
        "contracts": contracts,
        "gate": gate,
        "ApiError": ApiError,
        "ParseError": ParseError,
        "dx": ingest_docx,
        "ToolContext": object,
    }
    exec(compile(module, f"edit_list.py<{label}>", "exec"), namespace)
    return namespace


def _redline_namespace(raw: bytes, label: str, edit_ns: dict) -> dict:
    namespace = {
        "__builtins__": __builtins__,
        "copy": __import__("copy"),
        "io": __import__("io"),
        "re": re,
        "zipfile": zipfile,
        "datetime": datetime,
        "timezone": __import__("datetime").timezone,
        "etree": etree,
        "dx": ingest_docx,
        "el": types.SimpleNamespace(**edit_ns),
    }
    _, module = _kept_nodes(raw, f"redline.py<{label}>")
    exec(compile(module, f"redline.py<{label}>", "exec"), namespace)
    return namespace


def _outputs_namespace(raw: bytes, label: str, redline_ns: dict) -> dict:
    namespace = {
        "__builtins__": __builtins__,
        "contextlib": __import__("contextlib"),
        "json": json,
        "re": re,
        "threading": threading,
        "zipfile": zipfile,
        "etree": etree,
        "checks": _ChecksShell,
        "contracts": contracts,
        "logs": _LogsProbe,
        "gate": gate,
        "OUTPUTS_REL": "成果/索引.json",
        "now_iso": lambda: NOW,
        "sha256_file": lambda path: hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest(),
        "ApiError": ApiError,
        "ParseError": ParseError,
        "pandoc": _PandocShell,
        "redline": types.SimpleNamespace(**redline_ns),
    }
    _, module = _kept_nodes(raw, f"outputs.py<{label}>")
    exec(compile(module, f"outputs.py<{label}>", "exec"), namespace)
    return namespace


def _tool_context_type() -> type:
    source = (SERVICE_ROOT / "lawbench/tools/__init__.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    cls = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "ToolContext")
    module = ast.Module(body=[cls], type_ignores=[])
    ast.fix_missing_locations(module)
    namespace = {
        "__builtins__": __builtins__,
        "dataclass": __import__("dataclasses").dataclass,
        "Callable": __import__("typing").Callable,
        "contracts": contracts,
        "ApiError": ApiError,
    }
    exec(compile(module, "tools/__init__.py<T37 word ToolContext>", "exec"), namespace)
    return namespace["ToolContext"]


def _task_store_type() -> type:
    source = (SERVICE_ROOT / "lawbench/case/task.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    task_class = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "TaskStore")
    wanted = {"_write", "_read", "locate", "next_draft_version", "result", "save_result", "task_lock", "rel"}
    methods = [node for node in task_class.body if isinstance(node, ast.FunctionDef) and node.name in wanted]
    extracted = ast.ClassDef(
        name="ExtractedTaskStore",
        bases=[],
        keywords=[],
        body=methods,
        decorator_list=[],
        type_params=[],
    )
    module = ast.Module(body=[extracted], type_ignores=[])
    ast.fix_missing_locations(module)
    namespace = {
        "__builtins__": __builtins__,
        "gate": gate,
        "contracts": contracts,
        "ApiError": ApiError,
        "re": re,
        "os": os,
        "json": json,
        "time": time,
        "threading": threading,
        "logs": _LogsProbe,
        "TASK_DIR": "工作区/任务",
    }
    exec(compile(module, "case/task.py<T37 word TaskStore>", "exec"), namespace)
    return namespace["ExtractedTaskStore"]


OUTPUTS_REL = "service/lawbench/export/outputs.py"
EDIT_LIST_REL = "service/lawbench/tools/edit_list.py"
REDLINE_REL = "service/lawbench/export/redline.py"
MATERIALS_REL = "service/lawbench/case/materials.py"

OUTPUTS_LABEL, OUTPUTS_RAW = _source(OUTPUTS_REL, revisioned=True)
EDIT_LIST_LABEL, EDIT_LIST_RAW = _source(EDIT_LIST_REL, revisioned=True)
REDLINE_LABEL, REDLINE_RAW = _source(REDLINE_REL)
MATERIALS_LABEL, MATERIALS_RAW = _source(MATERIALS_REL)

EDIT_LIST_TREE, EDIT_LIST_MODULE = _kept_nodes(EDIT_LIST_RAW, EDIT_LIST_LABEL)
OUTPUTS_TREE, OUTPUTS_MODULE = _kept_nodes(OUTPUTS_RAW, OUTPUTS_LABEL)
REDLINE_TREE, REDLINE_MODULE = _kept_nodes(REDLINE_RAW, REDLINE_LABEL)

EDIT_LIST_NS = _edit_list_namespace(EDIT_LIST_RAW, EDIT_LIST_LABEL)
REDLINE_NS = _redline_namespace(REDLINE_RAW, REDLINE_LABEL, EDIT_LIST_NS)
OUTPUTS_NS = _outputs_namespace(OUTPUTS_RAW, OUTPUTS_LABEL, REDLINE_NS)
MATERIALS_NS = _materials_namespace(MATERIALS_RAW, MATERIALS_LABEL)
MATERIALS = MATERIALS_NS["Materials"]
TOOL_CONTEXT = _tool_context_type()
TASK_STORE = _task_store_type()
save_edit_list = EDIT_LIST_NS["save_edit_list"]
Exporter = OUTPUTS_NS["Exporter"]

# 产品源码读取和私有 AST 装配完成后才封外围：Windows subprocess 的 stdio
# 通信会短暂使用线程，不能把这段装配误判成产品后台线程。
socket.socket.connect = _deny_network
socket.create_connection = _deny_network
threading.Thread.start = _deny_thread_start


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _file_state(path: pathlib.Path) -> tuple[str, int, int]:
    info = path.stat()
    return _sha(path.read_bytes()), info.st_mtime_ns, info.st_size


class _RedlineGenerateSpy:
    """只观测 Exporter 实际持有的 redline 对象，并始终转调真实 generate。"""

    def __enter__(self) -> list[bytes]:
        self.calls: list[bytes] = []
        self.callsite = OUTPUTS_NS["redline"]
        self.real_generate = self.callsite.generate

        def observed(*args, **kwargs):
            self.calls.append(args[0] if args else kwargs["data"])
            return self.real_generate(*args, **kwargs)

        self.callsite.generate = observed
        return self.calls

    def __exit__(self, _exc_type, _exc, _tb) -> bool:
        self.callsite.generate = self.real_generate
        return False


def _temporary_directory() -> tempfile.TemporaryDirectory[str]:
    return tempfile.TemporaryDirectory(prefix=".t37-word-ref-", dir=REPO_ROOT)


class FakeCases:
    def __init__(self):
        self.roots: dict[str, pathlib.Path] = {}
        self.sql_path = REPO_ROOT / "contracts" / "case_db.sql"
        self._lock = threading.Lock()

    def add(self, case_id: str, root: pathlib.Path) -> None:
        self.roots[case_id] = root

    def root_of(self, case_id: str) -> str:
        if case_id not in self.roots:
            raise ApiError("CASE_NOT_FOUND", "unknown_case_id")
        return str(self.roots[case_id])

    def recent(self) -> list[dict]:
        return [{"case_id": case_id, "root": str(root), "exists": root.is_dir()}
                for case_id, root in self.roots.items()]


def _context(base: pathlib.Path) -> dict:
    values = {
        "home": base / "fake-home",
        "appdata": base / "fake-appdata",
        "system_dirs": (base / "fake-system",),
        "other_case_roots": (base / "fake-other-case",),
    }
    for value in (values["home"], values["appdata"], values["system_dirs"][0],
                  values["other_case_roots"][0]):
        value.mkdir(parents=True, exist_ok=True)
    return values


def _case(base: pathlib.Path, name: str = "case") -> pathlib.Path:
    root = base / name
    (root / "工作区" / "材料" / "文本").mkdir(parents=True)
    (root / "工作区" / "临时").mkdir(parents=True)
    db = root / "工作区" / "case.db"
    con = sqlite3.connect(db)
    try:
        con.executescript((REPO_ROOT / "contracts" / "case_db.sql").read_text(encoding="utf-8"))
        con.execute("INSERT OR REPLACE INTO meta VALUES ('case_id', ?)", (CASE_ID,))
        con.execute("INSERT OR REPLACE INTO meta VALUES ('schema_version', '1')")
        con.commit()
    finally:
        con.close()
    return root


def _materials(cases: FakeCases, root: pathlib.Path, context: dict | None) -> object:
    lo_base = root.parent / "lo"
    lo_base.mkdir(exist_ok=True)
    return MATERIALS(cases, lo_base, ref_context=context)


def _ref(ref_id: str, path: pathlib.Path, kind: str, status: str = "ok") -> dict:
    return {
        "ref_id": ref_id,
        "path": os.path.normpath(path),
        "kind": kind,
        "status": status,
        "added_at": NOW,
        "checked_at": NOW,
    }


def _write_refs(root: pathlib.Path, entries: list[dict]) -> None:
    doc = {"v": 1, "refs": entries, "next_seq": len(entries) + 1}
    contracts.validate("files/material_refs.schema.json", "", doc)
    path = root / "工作区" / "材料" / "引用.json"
    path.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")


def _index(root: pathlib.Path) -> dict:
    return json.loads((root / "工作区" / "材料" / "index.json").read_text(encoding="utf-8"))


def _material(root: pathlib.Path) -> dict:
    materials = _index(root)["materials"]
    if len(materials) != 1:
        raise AssertionError(f"expected one material, got {len(materials)}")
    return materials[0]


def _synthetic_docx(path: pathlib.Path, payment: str = "乙方应于收到货物后九十日内付款。") -> None:
    document = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="{W}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>采购合同</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:sz w:val="24"/></w:rPr><w:t>{escape(payment)}</w:t></w:r></w:p>
    <w:sectPr/>
  </w:body>
</w:document>"""
    document_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>"""
    package_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>"""
    content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types)
        archive.writestr("_rels/.rels", package_rels)
        archive.writestr("word/document.xml", document)
        archive.writestr("word/_rels/document.xml.rels", document_rels)


def _seed_task(root: pathlib.Path, cases: FakeCases, materials: object) -> tuple[object, object, dict]:
    task = {
        "v": 1,
        "task_id": TASK_ID,
        "case_id": CASE_ID,
        "kind": "agent",
        "session_id": "s_01HT37WORD",
        "entry": None,
        "skill": "contract-review",
        "step": None,
        "inputs": [],
        "params": dict(PARAMS),
        "budget": dict(BUDGET),
        "state": "running",
        "created_at": NOW,
    }
    result = {
        "v": 1,
        "task_id": TASK_ID,
        "status": "running",
        "usage": {"model_calls": 0, "tool_calls": 0, "elapsed_s": 0},
        "drafts": [],
        "citation_check": None,
        "coverage": None,
        "citations": [],
        "finished_at": None,
    }
    task_rel = f"工作区/任务/{TASK_ID}/task.json"
    result_rel = f"工作区/任务/{TASK_ID}/result.json"
    contracts.validate("files/task.schema.json", "", task)
    contracts.validate("files/result.schema.json", "", result)
    gate.write_bytes(root, task_rel, json.dumps(task, ensure_ascii=False, indent=2).encode("utf-8"),
                     op="t37_word_task")
    gate.write_bytes(root, result_rel, json.dumps(result, ensure_ascii=False, indent=2).encode("utf-8"),
                     op="t37_word_result")
    store = object.__new__(TASK_STORE)
    store.cases = cases
    store.settings = types.SimpleNamespace(get=lambda: {})
    store.materials = materials
    store._lock = threading.Lock()
    store._where = {TASK_ID: CASE_ID}
    store._begun = {}
    store._task_locks = {}
    store._guard = threading.Lock()
    store._parts = {}
    store._latest = {}
    ctx = TOOL_CONTEXT(root=str(root), case_id=CASE_ID, task=task, tasks=store, materials=materials)
    exporter = Exporter(cases, store, materials, types.SimpleNamespace(get=lambda: {}))
    return store, ctx, exporter


def _fixture(base: pathlib.Path):
    root = _case(base)
    context = _context(base)
    external = base / "外部合同"
    external.mkdir()
    original = external / "采购合同.docx"
    _synthetic_docx(original)
    _write_refs(root, [_ref("R01", external, "dir")])
    cases = FakeCases()
    cases.add(CASE_ID, root)
    cases.add(OTHER_CASE, base / "other-case")
    (base / "other-case").mkdir()
    materials = _materials(cases, root, context)
    materials.scan(CASE_ID)
    meta = _material(root)
    store, ctx, exporter = _seed_task(root, cases, materials)
    args = {
        "name": meta["name"],
        "edits": [
            {
                "id": 1,
                "para": 2,
                "action": "replace",
                "find": "收到货物后九十日内付款",
                "text": "收到货物后三十日内付款",
                "comment": "付款期限过长，建议缩短。",
            }
        ],
    }
    return types.SimpleNamespace(
        base=base,
        root=root,
        context=context,
        external=external,
        original=original,
        cases=cases,
        materials=materials,
        store=store,
        ctx=ctx,
        exporter=exporter,
        meta=meta,
        args=args,
    )


def _persistent_state(fix) -> tuple[dict, tuple[str, int, int], tuple[str, int, int]]:
    refs_path = fix.root / "工作区" / "材料" / "引用.json"
    text_path = fix.root / fix.meta["text_path"]
    return (
        _index(fix.root),
        _file_state(refs_path),
        _file_state(text_path),
    )


class WordRefStandaloneTest(unittest.TestCase):
    def _assert_api(self, code: str, reason: str, call):
        with self.assertRaises(ApiError) as raised:
            call()
        self.assertEqual((raised.exception.code, raised.exception.reason), (code, reason))

    def _assert_word_output(self, path: pathlib.Path, *, version: int) -> None:
        self.assertTrue(path.is_file())
        self.assertTrue(path.name.endswith(f"-修订版-v{version}.docx"))
        with zipfile.ZipFile(path) as archive:
            names = set(archive.namelist())
            root = ingest_docx._parse_xml(archive.read("word/document.xml"))
            comments = ingest_docx._parse_xml(archive.read("word/comments.xml"))
            rels = ingest_docx._parse_xml(archive.read("word/_rels/document.xml.rels"))
            content_types = ingest_docx._parse_xml(archive.read("[Content_Types].xml"))
        body_text = "".join(ingest_docx._text(p) for p in root.iterfind(".//w:body/w:p", NS))
        deleted = [el.text or "" for el in root.iter(f"{{{W}}}delText")]
        self.assertIn("三十日内付款", body_text)
        self.assertIn("九十日内付款", "".join(deleted))
        self.assertEqual(len(root.findall(f".//{{{W}}}ins")), 1)
        self.assertEqual(len(root.findall(f".//{{{W}}}del")), 1)
        self.assertIn("付款期限过长", "".join(comments.itertext()))
        self.assertTrue(any(r.get("Type", "").endswith("/comments") for r in rels))
        self.assertTrue(any(o.get("PartName") == "/word/comments.xml" for o in content_types))
        self.assertIn("word/comments.xml", names)

    def test_reference_docx_journey_rename_scan_and_real_ooxml(self) -> None:
        with _temporary_directory() as raw:
            fix = _fixture(pathlib.Path(raw))
            source_before = _file_state(fix.original)

            saved = save_edit_list(fix.ctx, fix.args)
            contracts.validate("tools/case_save_edit_list.schema.json", "#/$defs/result", saved)
            self.assertEqual((saved["accepted"], saved["out_of_scope"]), (1, []))
            edit_path = fix.root / saved["path"]
            self.assertTrue(edit_path.is_file())
            self.assertEqual(_file_state(fix.original), source_before)

            with _RedlineGenerateSpy() as generate_calls:
                first = fix.exporter.redline({
                    "case_id": CASE_ID,
                    "task_id": TASK_ID,
                    "edit_list": saved["path"],
                })
            self.assertEqual(len(generate_calls), 1)
            contracts.validate("api/redline.schema.json", "#/$defs/value", first)
            self._assert_word_output(fix.root / first["path"], version=1)
            result = fix.store.result(str(fix.root), TASK_ID)
            self.assertEqual(result["drafts"][-1]["path"], first["path"])
            self.assertEqual(_file_state(fix.original), source_before)

            material_id = fix.meta["material_id"]
            name = fix.meta["name"]
            text_path = fix.meta["text_path"]
            renamed = fix.external / "采购合同-改名后.docx"
            fix.original.rename(renamed)
            renamed_state = _file_state(renamed)
            scan = fix.materials.scan(CASE_ID)
            self.assertGreaterEqual(scan["changed"], 0)
            after_rename = _material(fix.root)
            self.assertEqual(after_rename["material_id"], material_id)
            self.assertEqual(after_rename["name"], name)
            self.assertEqual(after_rename["text_path"], text_path)
            self.assertEqual(fix.materials.original_path(CASE_ID, material_id)[0], renamed)

            second = fix.exporter.redline({
                "case_id": CASE_ID,
                "task_id": TASK_ID,
                "edit_list": saved["path"],
            })
            self._assert_word_output(fix.root / second["path"], version=2)
            self.assertNotEqual(first["path"], second["path"])
            self.assertEqual(_file_state(renamed), renamed_state)
            print("CASE ref-docx edit-list=1 redline=2 rename-scan-id/text=stable originals=unchanged")

            copy_case = _case(pathlib.Path(raw), "copy-case")
            copy_context = _context(pathlib.Path(raw))
            copy_source = pathlib.Path(raw) / "旧copy源.txt"
            copy_source.write_text("复制模式正文\n", encoding="utf-8")
            copy_before = _file_state(copy_source)
            copy_cases = FakeCases()
            copy_cases.add(CASE_ID, copy_case)
            copy_materials = _materials(copy_cases, copy_case, copy_context)
            copied = copy_materials.import_(CASE_ID, [str(copy_source)], None, False)
            self.assertEqual(len(copied["copied"]), 1)
            self.assertFalse((copy_case / "工作区" / "材料" / "引用.json").exists())
            copied_entry = _index(copy_case)["materials"][0]
            self.assertNotIn("origin", copied_entry)
            self.assertEqual(_file_state(copy_source), copy_before)
            print("CASE historical-txt-copy copied=1 refs=absent origin=absent source=unchanged")

    def test_persistent_missing_with_restored_root_rejects_until_scan(self) -> None:
        with _temporary_directory() as raw:
            fix = _fixture(pathlib.Path(raw))
            saved = save_edit_list(fix.ctx, fix.args)
            edit_path = fix.root / saved["path"]
            result_path = fix.root / "工作区" / "任务" / TASK_ID / "result.json"
            before_index, before_refs, before_text = _persistent_state(fix)
            before_edit = _file_state(edit_path)
            before_result = _file_state(result_path)

            hidden = fix.external / "采购合同.docx.bin"
            fix.original.rename(hidden)
            fix.materials.scan(CASE_ID)
            self.assertEqual(_material(fix.root)["status"], "missing")
            hidden.rename(fix.original)
            restored_state = _file_state(fix.original)
            path, current = fix.materials.original_path(CASE_ID, fix.meta["material_id"])
            self.assertEqual((path, current), (fix.original, "ok"))

            before_index, before_refs, before_text = _persistent_state(fix)
            with _RedlineGenerateSpy() as generate_calls:
                self._assert_api("MATERIAL_NOT_READY", "material_missing",
                                 lambda: save_edit_list(fix.ctx, fix.args))
                self._assert_api(
                    "MATERIAL_NOT_READY",
                    "material_missing",
                    lambda: fix.exporter.redline({
                        "case_id": CASE_ID,
                        "task_id": TASK_ID,
                        "edit_list": saved["path"],
                    }),
                )

            self.assertEqual(generate_calls, [])
            self.assertEqual(_file_state(edit_path), before_edit)
            self.assertEqual(_file_state(result_path), before_result)
            self.assertEqual(_persistent_state(fix), (before_index, before_refs, before_text))
            self.assertEqual(_file_state(fix.original), restored_state)

            fix.materials.scan(CASE_ID)
            self.assertEqual(_material(fix.root)["status"], "parsed")
            recovered = fix.exporter.redline({
                "case_id": CASE_ID,
                "task_id": TASK_ID,
                "edit_list": saved["path"],
            })
            self._assert_word_output(fix.root / recovered["path"], version=1)
            self.assertEqual(_file_state(fix.original), restored_state)
            print("CASE persisted-missing restored-unscanned=reject scan=recover redline=ok")

    def test_current_missing_and_hash_change_reject_before_draft(self) -> None:
        with _temporary_directory() as raw:
            fix = _fixture(pathlib.Path(raw))
            saved = save_edit_list(fix.ctx, fix.args)
            edit_path = fix.root / saved["path"]
            result_path = fix.root / "工作区" / "任务" / TASK_ID / "result.json"
            before_index, before_refs, before_text = _persistent_state(fix)
            before_edit = _file_state(edit_path)
            before_result = _file_state(result_path)

            hidden = fix.external / "当前消失.docx.bin"
            fix.original.rename(hidden)
            hidden_state = _file_state(hidden)
            self.assertEqual(_material(fix.root)["status"], "parsed")
            self._assert_api("MATERIAL_NOT_READY", "material_missing",
                             lambda: save_edit_list(fix.ctx, fix.args))
            self._assert_api(
                "MATERIAL_NOT_READY",
                "material_missing",
                lambda: fix.exporter.redline({
                    "case_id": CASE_ID,
                    "task_id": TASK_ID,
                    "edit_list": saved["path"],
                }),
            )
            self.assertEqual(_file_state(edit_path), before_edit)
            self.assertEqual(_file_state(result_path), before_result)
            self.assertEqual(_persistent_state(fix), (before_index, before_refs, before_text))
            self.assertEqual(_file_state(hidden), hidden_state)
            hidden.rename(fix.original)

            _synthetic_docx(fix.original, payment="乙方应于收到货物后十五日内付款。")
            changed_state = _file_state(fix.original)
            with _RedlineGenerateSpy() as generate_calls:
                self._assert_api(
                    "INPUT_CHANGED",
                    "original_changed",
                    lambda: fix.exporter.redline({
                        "case_id": CASE_ID,
                        "task_id": TASK_ID,
                        "edit_list": saved["path"],
                    }),
                )
            self.assertEqual(generate_calls, [])
            self.assertEqual(_file_state(edit_path), before_edit)
            self.assertEqual(_file_state(result_path), before_result)
            self.assertEqual(_file_state(fix.original), changed_state)
            print("CASE current-missing=reject hash-changed=INPUT_CHANGED drafts=0")

    def test_bad_refs_missing_context_and_foreign_task_fail_closed(self) -> None:
        with _temporary_directory() as raw:
            fix = _fixture(pathlib.Path(raw))
            saved = save_edit_list(fix.ctx, fix.args)
            edit_path = fix.root / saved["path"]
            result_path = fix.root / "工作区" / "任务" / TASK_ID / "result.json"
            refs_path = fix.root / "工作区" / "材料" / "引用.json"
            refs_raw = refs_path.read_bytes()
            before_index, _before_refs, before_text = _persistent_state(fix)
            before_edit = _file_state(edit_path)
            before_result = _file_state(result_path)
            before_source = _file_state(fix.original)

            refs_path.write_text("{坏引用", encoding="utf-8")
            with self.assertRaises((ValueError, ApiError, contracts.ContractError)):
                save_edit_list(fix.ctx, fix.args)
            with self.assertRaises((ValueError, ApiError, contracts.ContractError)):
                fix.exporter.redline({
                    "case_id": CASE_ID,
                    "task_id": TASK_ID,
                    "edit_list": saved["path"],
                })
            refs_path.write_bytes(refs_raw)
            self.assertEqual(_file_state(edit_path), before_edit)
            self.assertEqual(_file_state(result_path), before_result)
            self.assertEqual(_index(fix.root), before_index)
            self.assertEqual(_file_state(fix.root / fix.meta["text_path"]), before_text)
            self.assertEqual(_file_state(fix.original), before_source)

            no_context = _materials(fix.cases, fix.root, None)
            no_ctx = TOOL_CONTEXT(
                root=str(fix.root),
                case_id=CASE_ID,
                task=fix.ctx.task,
                tasks=fix.store,
                materials=no_context,
            )
            self._assert_api("INVALID_ARGUMENT", "ref_context_required",
                             lambda: save_edit_list(no_ctx, fix.args))
            no_context_exporter = Exporter(fix.cases, fix.store, no_context, types.SimpleNamespace(get=lambda: {}))
            self._assert_api(
                "INVALID_ARGUMENT",
                "ref_context_required",
                lambda: no_context_exporter.redline({
                    "case_id": CASE_ID,
                    "task_id": TASK_ID,
                    "edit_list": saved["path"],
                }),
            )

            self._assert_api(
                "TASK_NOT_FOUND",
                "other_case",
                lambda: fix.exporter.redline({
                    "case_id": OTHER_CASE,
                    "task_id": TASK_ID,
                    "edit_list": saved["path"],
                }),
            )
            self.assertEqual(_file_state(edit_path), before_edit)
            self.assertEqual(_file_state(result_path), before_result)
            self.assertEqual(_file_state(fix.original), before_source)
            print("CASE bad-refs/missing-context/foreign-task=reject side-effects=0")

    def test_non_docx_branch_stays_manual_and_does_not_read_original(self) -> None:
        with _temporary_directory() as raw:
            base = pathlib.Path(raw)
            root = _case(base)
            legacy = root / "01案件材料" / "旧格式.doc"
            legacy.parent.mkdir()
            legacy.write_bytes(b"synthetic legacy office placeholder")
            legacy_state = _file_state(legacy)
            context = _context(base)
            cases = FakeCases()
            cases.add(CASE_ID, root)
            materials = _materials(cases, root, context)
            materials.scan(CASE_ID)
            meta = _material(root)
            self.assertEqual(meta["type"], "doc")
            store, ctx, _exporter = _seed_task(root, cases, materials)
            args = {
                "name": meta["name"],
                "edits": [{
                    "id": 1,
                    "para": 1,
                    "action": "delete",
                    "find": "合成",
                    "comment": "仅验证旧格式分支",
                }],
            }
            with mock.patch.object(materials, "original_path", side_effect=AssertionError("不应读取原件")):
                result = save_edit_list(ctx, args)
            contracts.validate("tools/case_save_edit_list.schema.json", "#/$defs/result", result)
            self.assertEqual(result["accepted"], 0)
            self.assertEqual(result["out_of_scope"][0]["reason"], "原件不是 docx，不能生成修订版")
            self.assertTrue((root / result["path"]).is_file())
            self.assertEqual(_file_state(legacy), legacy_state)
            print("CASE doc branch=manual original-read=0")

    def test_copied_docx_reaches_both_changed_consumers(self) -> None:
        with _temporary_directory() as raw:
            base = pathlib.Path(raw)
            root = _case(base, "copied-docx-case")
            context = _context(base)
            source = base / "采购合同-copy源.docx"
            _synthetic_docx(source)
            source_before = _file_state(source)
            cases = FakeCases()
            cases.add(CASE_ID, root)
            materials = _materials(cases, root, context)
            imported = materials.import_(CASE_ID, [str(source)], None, False)
            self.assertEqual(len(imported["copied"]), 1)
            self.assertEqual(_file_state(source), source_before)

            meta = _material(root)
            self.assertEqual(meta["type"], "docx")
            copied_path, copied_state = materials.original_path(CASE_ID, meta["material_id"])
            self.assertEqual(copied_state, "ok")
            self.assertIsNotNone(copied_path)
            assert copied_path is not None
            copied_before = _file_state(copied_path)

            store, ctx, exporter = _seed_task(root, cases, materials)
            args = {
                "name": meta["name"],
                "edits": [{
                    "id": 1,
                    "para": 2,
                    "action": "replace",
                    "find": "收到货物后九十日内付款",
                    "text": "收到货物后三十日内付款",
                    "comment": "付款期限过长，建议缩短。",
                }],
            }
            saved = save_edit_list(ctx, args)
            contracts.validate("tools/case_save_edit_list.schema.json", "#/$defs/result", saved)
            self.assertEqual((saved["accepted"], saved["out_of_scope"]), (1, []))
            self.assertEqual(_file_state(copied_path), copied_before)

            with _RedlineGenerateSpy() as generate_calls:
                result = exporter.redline({
                    "case_id": CASE_ID,
                    "task_id": TASK_ID,
                    "edit_list": saved["path"],
                })
            self.assertEqual(len(generate_calls), 1)
            contracts.validate("api/redline.schema.json", "#/$defs/value", result)
            self._assert_word_output(root / result["path"], version=1)
            task_result = store.result(str(root), TASK_ID)
            self.assertEqual(task_result["drafts"][-1]["path"], result["path"])
            self.assertEqual(_file_state(copied_path), copied_before)
            self.assertEqual(_file_state(source), source_before)
            print("CASE copied-docx edit-list=1 redline=1 draft=ooxml result=recorded originals=unchanged")

    def test_static_boundary_and_source_identity(self) -> None:
        forbidden = {
            "lawbench.app",
            "lawbench.case.materials",
            "lawbench.case.registry",
            "lawbench.export.outputs",
            "lawbench.export.redline",
            "lawbench.search.fts",
            "lawbench.tools",
            "lawbench.tools.edit_list",
        }
        self.assertTrue(forbidden.isdisjoint(sys.modules))

        def method(tree, class_name: str, method_name: str):
            cls = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == class_name)
            return next(node for node in cls.body if isinstance(node, ast.FunctionDef) and node.name == method_name)

        def calls_original_path(node) -> bool:
            return any(
                isinstance(call, ast.Call)
                and isinstance(call.func, ast.Attribute)
                and call.func.attr == "original_path"
                for call in ast.walk(node)
            )

        self.assertTrue(calls_original_path(next(
            node for node in EDIT_LIST_TREE.body if isinstance(node, ast.FunctionDef) and node.name == "save_edit_list"
        )))
        self.assertTrue(calls_original_path(method(OUTPUTS_TREE, "Exporter", "redline")))

        identity = {
            "mode": "git-hybrid" if CODE_REV else "worktree",
            "rev": CODE_REV or "HEAD-worktree",
            "outputs": {"source": OUTPUTS_LABEL, "bytes": len(OUTPUTS_RAW), "sha256": _sha(OUTPUTS_RAW)},
            "edit_list": {"source": EDIT_LIST_LABEL, "bytes": len(EDIT_LIST_RAW), "sha256": _sha(EDIT_LIST_RAW)},
            "redline": {"source": REDLINE_LABEL, "bytes": len(REDLINE_RAW), "sha256": _sha(REDLINE_RAW)},
            "materials": {"source": MATERIALS_LABEL, "bytes": len(MATERIALS_RAW), "sha256": _sha(MATERIALS_RAW)},
            "real_core": [
                "Materials", "RefRegistry", "gate", "ingest.docx", "redline.generate",
                "TaskStore.locate/rel/task_lock/next_draft_version/result/save_result",
            ],
            "finite_edges": [
                "logs metadata no-op", "checks shell", "pandoc shell", "converter refusal",
                "search refresh probe", "network/thread start refusal",
            ],
        }
        print("SOURCE " + json.dumps(identity, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    unittest.main(verbosity=2)
