"""材料：扫描原件区、解析、材料索引、导入（Spec 4.1、5.1–5.3、20.2；契约 files/material_index、
api/materials_scan、api/materials_list、api/materials_import）。

- 原件区 = 案件根目录下除 工作区/、成果/ 和以 . 开头的项以外的全部内容；不跟随链接和 junction；
  Office 锁文件（~$…）和不支持的格式不进材料清单。
- 新增、变化、删除：按大小和修改时间缓存哈希，变了才重算；变化的重新解析（已有识别结果据 case.db 判为过期）；
  删除的标 source_deleted，保留文本。
- 材料编号 M + 4 位序号，同一案件内不复用；改名或移动视为删除后新增。
- 材料名三级唯一规则（Spec 20.2）；新材料导致重名时，已有材料的名字也改长，并更新其材料文本的标题。
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import re
import shutil
import sqlite3
import stat
import threading
import time
import uuid
import zipfile
from datetime import datetime

from .. import contracts, logs
from ..errors import ApiError
from ..ingest import MAX_BYTES, REASONS, RETRY_MESSAGES, Parsed, ParseError
from ..ingest import detect, docx, image, links, pdf, text, xlsx
from ..ingest.libreoffice import Converter, remove_tree
from ..search import fts as search_fts
from . import gate, refs as ref_registry, texts, trash
from .registry import TEMPLATES, CaseRegistry

INDEX_REL = "工作区/材料/index.json"
TEXT_DIR = "工作区/材料/文本"
FORMULA_DIR = "工作区/材料/公式"
STATUS_REL = "工作区/材料/_处理状态.md"
TEMP_REL = "工作区/临时"
INDEX_SCHEMA = "files/material_index.schema.json"
SOURCE_KIND = {"none": "文字版", "partial": "部分识别", "full": "识别所得"}
CONVERTED_NOTE = {"doc": "由 doc 转换", "wps": "由 wps 转换", "xls": "由 xls 转换"}
SHORTCUT_EXT = {".lnk", ".url"}
ZIP_MAX_FILES = 500
# 材料文本的格式版本（X13）：写在 _处理状态.md 里（那个文件"无固定格式"，不加契约字段）。版本变了，下次扫描时
# 这几种材料原件没变也重新解析：2 = Excel 按显示值写（N27）、整份待识别的 Source 行写"待识别"（N28）；
# 3 = Word 段落不再把段落制表位定义读成制表符（T15 复核 P2-1）
TEXT_FORMAT_VERSION = 3
REFORMAT_TYPES = ("xlsx", "xls", "pdf", "image", "docx", "doc", "wps")
_FORMAT_LINE = re.compile(r"^材料文本格式版本：(\d+)\s*$", re.M)
EXTERNAL_NOTE = "有外部链接，未重算公式"  # 契约 1.2 N21
# 本服务在 工作区/临时/ 下自己建的项的前缀（X6 按前缀清残留）
TEMP_PREFIXES = ("lo-", "unzip-", gate.IMPORT_TMP_PREFIX)
# 只认本服务自己建的形状（T5 第二轮）：lo-/unzip- 加 8 位十六进制的目录、imp- 加 8 位十六进制的文件；
# 律师自己放的 lo-截图.png、imp-合同.pdf 不动
_OWN_TEMP_DIR = re.compile(r"^(lo|unzip)-[0-9a-f]{8}$")
_OWN_TEMP_FILE = re.compile(r"^imp-[0-9a-f]{8}$")
ZERO_SHA = "0" * 64
STANDARD_TOPS = {rel for t in TEMPLATES.values() for rel in t if "/" not in rel}
_FILE_ATTRIBUTE_REPARSE_POINT = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def mtime_iso(st: os.stat_result) -> str:
    return datetime.fromtimestamp(st.st_mtime).astimezone().isoformat(timespec="microseconds")


def sha256_file(path: str | os.PathLike) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _is_link_entry(st: os.stat_result) -> bool:
    return stat.S_ISLNK(st.st_mode) or bool(getattr(st, "st_file_attributes", 0) & _FILE_ATTRIBUTE_REPARSE_POINT)


def _key(rel: str) -> str:
    return os.path.normcase(rel)


# ---------- 材料名（Spec 20.2） ----------

def _clean(name: str) -> str:
    return name.replace(" ", "_").replace("、", "_")


def _assign_names(items: list[tuple[str, str]], taken_names=()) -> dict[str, str]:
    """按给定的显示路径分配名字；``items`` 是 ``(稳定键, 显示路径)``。"""
    def stem_path(r: str) -> str:
        p = pathlib.PurePosixPath(r)
        return str(p.with_suffix("")) if p.suffix else r

    levels = [lambda r: pathlib.PurePosixPath(stem_path(r)).name, stem_path, lambda r: r]
    names: dict[str, str] = {}
    pending = list(items)
    taken = {name.casefold() for name in taken_names}
    for i, level in enumerate(levels):
        cand = {key: _clean(level(rel)) for key, rel in pending}
        counts: dict[str, int] = {}
        for n in cand.values():
            counts[n.casefold()] = counts.get(n.casefold(), 0) + 1
        nxt: list[tuple[str, str]] = []
        last = i == len(levels) - 1
        for (key, rel), n in ((item, cand[item[0]]) for item in pending):
            if last:
                base, k = n, 2
                while n.casefold() in taken:
                    n = f"{base}_{k}"
                    k += 1
                names[key] = n
                taken.add(n.casefold())
            elif counts[n.casefold()] == 1 and n.casefold() not in taken:
                names[key] = n
                taken.add(n.casefold())
            else:
                nxt.append((key, rel))
        pending = nxt
        if not pending:
            break
    return names


def assign_names(rels: list[str]) -> dict[str, str]:
    """① 文件名去扩展名；② 重复时用去扩展名的相对路径；③ 仍重复时用带扩展名的相对路径。

    ③ 之后仍重名（空格、顿号换成下划线后撞上等）按主编排的临时裁决（T5 返修 X10，候 owner N25）：排在前面的名字不变，
    后来者在末尾加 _2、_3……直到不重名。rels 的顺序就是先后：index.json 里已有的材料按原顺序在前，
    同一次扫描新增的按原件相对路径排序接在后面。比较不分大小写。"""
    return _assign_names([(rel, rel) for rel in rels])


# ---------- 渲染材料文本（formats.md 第 2 节） ----------

def render(name: str, entry: dict, parsed: Parsed) -> str:
    kind = SOURCE_KIND[entry["is_ocr"]]
    if entry["is_ocr"] == "none" and parsed.unit == "page" and parsed.pages_need_ocr and \
            len(parsed.pages_need_ocr) == parsed.unit_count:
        kind = "待识别"  # 整份都是扫描件、还没有识别结果（契约 1.2 N28）
    head = [f"# {name}", "", f"> Source: {entry['rel_path']}（{kind}，{parsed.unit_count}{parsed.count_word}）",
            f"> Collected: {entry['imported_at'][:10]}"]
    if entry["note"]:
        head.append(f"> Note: {entry['note']}")
    parts = ["\n".join(head)]
    for b in parsed.blocks:
        parts.append(f"【{b.label}】\n{escape_marks(b.text)}" if b.text else f"【{b.label}】")
    return "\n\n".join(parts) + "\n"


# 正文里恰好与位置标记相同的整行（PDF 原文、识别文本里有一行就是"【第1页】"）：行首加一个全角空格，
# 读回时不会被当成我方的位置标记（注记 20261001-1354；formats.md 第 2 节）。
_MARK_LINE = re.compile(r"^(?=【(?:第[0-9]+[页段行]|表:[^\n]+)】$)", re.M)


def escape_marks(body: str) -> str:
    return _MARK_LINE.sub("\u3000", body)


class Materials:
    def __init__(self, cases: CaseRegistry, lo_base: pathlib.Path, *, ref_context=None):
        self.lo_base = lo_base  # LibreOffice 配置目录的上级：<应用数据>/临时/lo（Spec 5.2）
        self.cases = cases
        # 应用装配传 CaseRegistry.ref_context_for，每次按当前 cases.json 重取；显式 dict
        # 继续供旧独立验证使用，None 仍保持 fail closed。
        self._ref_context = ref_context if callable(ref_context) else self._snapshot_ref_context(ref_context)
        self._locks: dict[str, threading.Lock] = {}
        self._guard = threading.Lock()
        # 识别队列（T12）挂上：重新生成文本后把已有识别结果合并回去，签名 (root, index, material_ids)；持锁调用
        self.after_render = None
        self.before_remove = None                # 识别队列挂上：移除材料前取消它还没做完的识别任务，签名 (case_id, material_id)
        self.recycle = trash.recycle             # 原件移到系统回收站；测试里可以换掉
        self.can_recycle = trash.has_recycle_bin  # 这个位置有没有回收站（网络盘、U 盘没有：不移，免得被系统静默永久删除）
        self._chars_cache: dict[tuple, tuple] = {}   # 材料文本字数（materials_list.chars），按文本文件 mtime+大小缓存

    def _lock(self, case_id: str) -> threading.Lock:
        with self._guard:
            return self._locks.setdefault(case_id, threading.Lock())

    @staticmethod
    def _snapshot_ref_context(context: dict | None) -> dict | None:
        """引用根的四个禁区上下文只取一次显式输入，不从环境或用户目录推导。"""
        if context is None:
            return None
        try:
            return {
                "home": os.fspath(context["home"]),
                "appdata": os.fspath(context["appdata"]),
                "system_dirs": (
                    (os.fspath(context["system_dirs"]),)
                    if isinstance(context["system_dirs"], (str, os.PathLike))
                    else tuple(os.fspath(p) for p in context["system_dirs"])
                ),
                "other_case_roots": (
                    (os.fspath(context["other_case_roots"]),)
                    if isinstance(context["other_case_roots"], (str, os.PathLike))
                    else tuple(os.fspath(p) for p in context["other_case_roots"])
                ),
            }
        except (KeyError, TypeError):
            raise ApiError("INVALID_ARGUMENT", "ref_context_invalid") from None

    def _registry(self, root: str) -> ref_registry.RefRegistry:
        context = self._context(root)
        if context is None:
            raise ApiError("INVALID_ARGUMENT", "ref_context_required")
        return ref_registry.RefRegistry(root, **context)

    def _context(self, root: str) -> dict | None:
        context = self._ref_context(root) if callable(self._ref_context) else self._ref_context
        return self._snapshot_ref_context(context)

    def _load_refs(self, root: str) -> tuple[ref_registry.RefRegistry | None, dict | None]:
        path = gate.resolve_internal(root, ref_registry.REF_REL, op="refs_load")
        if not path.exists():
            return None, None
        registry = self._registry(root)
        return registry, registry.load()

    def _assert_refs_available_for_default_path(self, root: str) -> None:
        """有登记文件却没有显式上下文时，默认 copy 也必须在写原件前停住。"""
        path = gate.resolve_internal(root, ref_registry.REF_REL, op="refs_load")
        if path.exists() and self._context(root) is None:
            raise ApiError("INVALID_ARGUMENT", "ref_context_required")

    # ---------- index.json ----------

    def _load_index(self, root: str, case_id: str) -> dict:
        p = gate.resolve_internal(root, INDEX_REL, op="materials_index")
        if not p.exists():
            return {"v": 1, "case_id": case_id, "next_seq": _recover_next_seq(root), "materials": []}
        data = contracts.read_json(p)
        if data.get("v") != 1:
            raise ApiError("INTERNAL", "index_unknown_v")
        contracts.validate(INDEX_SCHEMA, "", data)
        return data

    def _save_index(self, root: str, data: dict) -> None:
        contracts.validate(INDEX_SCHEMA, "", data)
        gate.write_bytes(root, INDEX_REL, json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
                         op="materials_index")

    # ---------- 原件区遍历 ----------

    @staticmethod
    def walk(root: str) -> dict[str, tuple[str, os.stat_result | None]]:
        """{rel_path: (绝对路径, stat)}；不跟随链接，跳过 工作区、成果、以 . 开头的项和锁文件。"""
        return Materials.walk_all(root)[0]

    @staticmethod
    def walk_all(root: str) -> tuple[dict[str, tuple[str, os.stat_result | None]], list[str]]:
        """同 walk，另返回读不了的子文件夹（相对路径，以 / 结尾）。

        用长路径前缀（\\\\?\\）遍历：路径超过 259 字符的原件也要列出来，登记为失败而不是静默消失（T5 返修 X8）；
        它们的材料文本路径更长，解析时按 path_too_long 失败。stat 取不到的，stat 为 None，按"无法读取"登记。"""
        found: dict[str, tuple[str, os.stat_result | None]] = {}
        unreadable: list[str] = []
        stack: list[tuple[str, str]] = [(_long_path(root), "")]
        while stack:
            d, prefix = stack.pop()
            try:
                entries = list(os.scandir(d))
            except OSError:
                unreadable.append(prefix)
                continue
            for e in entries:
                name = e.name
                if name.startswith(".") or detect.is_ignored(name):
                    continue
                if not prefix and name in gate.WRITABLE_TOP:
                    continue
                rel = f"{prefix}{name}"
                try:
                    st = e.stat(follow_symlinks=False)
                except OSError:
                    if detect.material_type(pathlib.Path(name)):
                        found[rel] = (e.path, None)
                    continue
                if _is_link_entry(st):
                    continue
                if stat.S_ISDIR(st.st_mode):
                    stack.append((e.path, rel + "/"))
                elif stat.S_ISREG(st.st_mode) and detect.material_type(pathlib.Path(name)):
                    found[rel] = (e.path, st)
        return found, sorted(unreadable)

    # ---------- 解析一份 ----------

    def _parse(
        self,
        root: str,
        rel: str,
        mtype: str,
        conv: Converter,
        *,
        entry: dict | None = None,
        refs_doc: dict | None = None,
    ) -> Parsed:
        """扩展名定"哪一类材料"，文件头定"走哪条解析、过哪道检查"（T5 返修 X1）：
        - Word 类（docx / doc / wps）：压缩包 → 直接读 XML（不经 LibreOffice）；OLE → 查加密、查外链后交给
          LibreOffice 转 docx；其他（RTF、HTML 冒充 .doc 等）→ 查不了外链，不交给 LibreOffice（unchecked）。
        - Excel 类（xlsx / xls）：压缩包 → 查全部关系文件后直接读，只有没有外链才交给 LibreOffice 重算；
          OLE → 查加密后转 xlsx，转出来的再查关系文件；其他 → 同上不交给 LibreOffice。
        - PDF、文本、图片不经 LibreOffice，按扩展名解析，内容不符的由各自的解析器报损坏。"""
        original = entry if entry is not None else {"rel_path": rel}
        path = gate.resolve_original(
            root,
            refs_doc or {},
            original,
            op="materials_read",
            **(self._context(root) or {}),
        )
        if path.stat().st_size > MAX_BYTES:
            raise ParseError("too_large")
        with conv.session() as s:
            if mtype == "pdf":
                return pdf.parse(path)
            if mtype in ("csv", "md", "txt"):
                return text.parse(path)
            if mtype == "image":
                return image.parse(path)
            kind = detect.content_kind(path)
            if mtype in ("docx", "doc", "wps"):
                if kind == "zip":
                    return docx.parse(path)
                if kind != "ole":
                    raise ParseError("corrupt" if mtype == "docx" else "not_office")  # N44 ①
                if detect.ole_encrypted(path):
                    raise ParseError("encrypted")
                if links.has_external_picture(path):
                    raise ParseError("external_link")  # 不交给 LibreOffice（Spec 14.3 ②a）
                return docx.parse(s.convert(path, "docx", suffix=".doc" if mtype == "docx" else None),
                                  note=CONVERTED_NOTE.get(mtype))
            if mtype in ("xlsx", "xls"):
                if kind == "zip":
                    rc = self._recalc(path, s)
                    return xlsx.parse(path, recalc=rc, blocked_note=None if rc else EXTERNAL_NOTE)
                if kind != "ole":
                    raise ParseError("corrupt" if mtype == "xlsx" else "not_office")  # N44 ①
                if detect.ole_encrypted(path):
                    raise ParseError("encrypted")
                converted = s.convert(path, "xlsx", suffix=".xls")
                rc = self._recalc(converted, s)
                return xlsx.parse(converted, recalc=rc, note=CONVERTED_NOTE["xls"],
                                  blocked_note=None if rc else EXTERNAL_NOTE)
        raise ParseError("corrupt")

    @staticmethod
    def _recalc(path: pathlib.Path, s):
        """有外链图片或对象的 xlsx 不交给 LibreOffice 重算（Calc 导入时会去取，设置拦不住；Spec 14.3 ②b）：
        返回 None，没有缓存值的单元格只写公式。关系文件查不了的报 unchecked（X2），整份不解析。"""
        if links.xlsx_has_external_rels(path):
            return None
        return lambda p: s.convert(p, "xlsx", suffix=".xlsx")

    # ---------- 扫描 ----------

    @staticmethod
    def _ref_tail(material: dict) -> str:
        prefix = f"{gate.WORK}/引用/{material['ref_id']}/"
        if not material.get("rel_path", "").startswith(prefix):
            raise ApiError("INTERNAL", "ref_virtual_key")
        return material["rel_path"][len(prefix):]

    def _material_name_rel(self, material: dict, refs_by_id: dict[str, dict]) -> str:
        if material.get("origin") != "ref":
            return material["rel_path"]
        ref = refs_by_id.get(material.get("ref_id"))
        if ref is None:
            raise ApiError("INTERNAL", "ref_not_found")
        tail = self._ref_tail(material)
        root_name = os.path.basename(os.path.normpath(ref["path"]))
        return _join(root_name, tail)

    def _entry_shell(self, material_id: str, rel: str, mtype: str, now: str,
                     origin: str = "case", ref_id: str | None = None) -> dict:
        entry = {
            "material_id": material_id,
            "rel_path": rel,
            "name": "",
            "type": mtype,
            "size": 0,
            "mtime": now,
            "sha256": ZERO_SHA,
            "status": "parsed",
            "unit": _default_unit(mtype),
            "unit_count": 0,
            "is_ocr": "none",
            "text_path": f"{TEXT_DIR}/{rel}.md",
            "pages_need_ocr": [],
            "pages_mixed": [],
            "note": None,
            "error": None,
            "imported_at": now,
            "updated_at": now,
        }
        if origin == "ref":
            entry.update(origin="ref", ref_id=ref_id)
        return entry

    def _recover_ref_renames(
        self,
        root: str,
        by_key: dict[str, dict],
        sources: dict[str, tuple[str, os.stat_result | None]],
        ref_rels: set[str],
        refs_doc: dict | None,
    ) -> set[str]:
        """同根唯一内容匹配；返回保名材料编号，找不到唯一配对时不猜。"""
        if refs_doc is None:
            return set()
        source_keys = {_key(rel) for rel in sources}
        missing = [
            m for m in by_key.values()
            if m.get("origin") == "ref"
            and m.get("status") != "removed"
            and (
                _key(m["rel_path"]) not in source_keys
                or m["status"] == "missing"
            )
        ]
        fresh = [
            rel for rel in sorted(ref_rels)
            if _key(rel) not in by_key
        ]
        if not missing:
            return set()

        sources_by_key: dict[str, str] = {}
        source_rels_by_key: dict[str, list[str]] = {}
        for rel, (actual, _info) in sources.items():
            key = _key(rel)
            sources_by_key[key] = actual
            source_rels_by_key.setdefault(key, []).append(rel)
        by_ref_tail: dict[tuple[str, str], list[dict]] = {}
        for material in missing:
            key = (material["ref_id"], _key(self._ref_tail(material)))
            by_ref_tail.setdefault(key, []).append(material)
        stable_ids: set[str] = set()
        stable_rels: set[str] = set()
        stable_paths: set[str] = set()
        for (ref_id, _tail_key), materials in by_ref_tail.items():
            if len(materials) != 1:
                continue
            material = materials[0]
            prefix = f"{gate.WORK}/引用/{ref_id}/"
            source_key = _key(f"{prefix}{self._ref_tail(material)}")
            candidates = source_rels_by_key.get(source_key, [])
            if len(candidates) != 1:
                continue
            rel = candidates[0]
            if not rel.startswith(prefix):
                continue
            actual = sources_by_key.get(source_key)
            digest = material.get("sha256")
            if actual is None or not digest or digest == ZERO_SHA:
                continue
            try:
                if sha256_file(actual) != digest:
                    continue
            except OSError:
                continue
            stable_ids.add(material["material_id"])
            stable_rels.add(_key(rel))
            if material["rel_path"] != rel:
                by_key.pop(_key(material["rel_path"]), None)
                material["rel_path"] = rel
                material["updated_at"] = now_iso()
                by_key[_key(rel)] = material
                stable_paths.add(material["material_id"])

        old_groups: dict[tuple[str, str], list[dict]] = {}
        for material in missing:
            if material["material_id"] in stable_ids:
                continue
            digest = material.get("sha256")
            if digest and digest != ZERO_SHA:
                old_groups.setdefault((material["ref_id"], digest), []).append(material)
        new_groups: dict[tuple[str, str], list[str]] = {}
        for rel in fresh:
            if _key(rel) in stable_rels:
                continue
            mtype = detect.material_type(pathlib.Path(rel))
            if mtype is None:
                continue
            ref_id = rel.split("/", 3)[2]
            shell = self._entry_shell("M0001", rel, mtype, now_iso(), "ref",
                                      ref_id)
            try:
                path = gate.resolve_original(
                    root, refs_doc, shell, op="materials_ref_identity",
                    **(self._context(root) or {}),
                )
                digest = sha256_file(path)
            except ApiError as error:
                if error.reason in ("candidate_missing", "root_missing"):
                    continue
                raise
            except OSError:
                continue
            new_groups.setdefault((ref_id, digest), []).append(rel)

        locked: set[str] = stable_paths
        for (ref_id, digest), olds in old_groups.items():
            news = new_groups.get((ref_id, digest), [])
            if len(olds) != 1 or len(news) != 1:
                continue
            old, rel = olds[0], news[0]
            old_prefix = f"{gate.WORK}/引用/{ref_id}/"
            if not rel.startswith(old_prefix):
                continue
            by_key.pop(_key(old["rel_path"]), None)
            old["rel_path"] = rel
            old["updated_at"] = now_iso()
            by_key[_key(rel)] = old
            locked.add(old["material_id"])
        return locked

    def scan(self, case_id: str) -> dict:
        root = self.cases.root_of(case_id)
        t0 = time.monotonic()
        with self._lock(case_id):
            result = self._scan(root, case_id)
        logs.event("materials", "scan", case_id=case_id, duration_ms=(time.monotonic() - t0) * 1000)
        return result

    def _scan(self, root: str, case_id: str) -> dict:
        if not os.path.isdir(root):
            raise ApiError("CASE_NOT_FOUND", "root_missing")
        self._assert_refs_available_for_default_path(root)
        for rel in ("工作区/材料", TEXT_DIR, TEMP_REL):
            gate.mkdir_work(root, rel, op="materials_scan")
        self._clean_temp(root)
        index = self._load_index(root, case_id)
        for m in index["materials"]:
            if m["status"] != "removed" and "text_path" in m:
                texts.text_rel(m)
        removed_ref_keys = {
            _key(m["rel_path"])
            for m in index["materials"]
            if m.get("origin") == "ref" and m["status"] == "removed"
        }
        by_key = {_key(m["rel_path"]): m for m in index["materials"] if m["status"] != "removed"}
        found, unreadable_dirs = self.walk_all(root)
        registry, refs_doc = self._load_refs(root)
        refs_by_id = {r["ref_id"]: r for r in (refs_doc or {}).get("refs", [])}
        ref_found: dict[str, tuple[str, os.stat_result | None]] = {}
        ref_ok: set[str] = set()
        ref_missing: set[str] = set()
        if registry is not None:
            for ref in (refs_doc or {}).get("refs", []):
                if ref["status"] == "removed":
                    continue
                try:
                    children = registry.preflight(ref["path"])
                except ApiError as error:
                    if error.reason == "missing":
                        ref_missing.add(ref["ref_id"])
                        continue
                    raise
                ref_ok.add(ref["ref_id"])
                for tail, (actual, info) in children.items():
                    rel = f"{gate.WORK}/引用/{ref['ref_id']}/{tail}"
                    ref_found[rel] = (actual, info)
            for ref in (refs_doc or {}).get("refs", []):
                if ref["ref_id"] in ref_ok:
                    ref["status"] = "ok"
                elif ref["ref_id"] in ref_missing:
                    ref["status"] = "missing"

        sources = dict(found)
        sources.update(ref_found)
        ref_rels = set(ref_found)
        locked_names = self._recover_ref_renames(root, by_key, sources, ref_rels, refs_doc)
        conv = Converter(gate.resolve_internal(root, TEMP_REL), lo_base=self.lo_base)
        stale_format = self._text_format(root) < TEXT_FORMAT_VERSION
        ids = _MaterialIds(root, self.cases.sql_path)
        ids.backfill(index)  # 升级前已有的材料：按 index.json 回填编号留底（T5 第三轮 P3-1）
        for material_id in locked_names:
            material = next(m for m in index["materials"] if m["material_id"] == material_id)
            ids.relocate(material_id, material["rel_path"], material["sha256"])
        added = changed = removed = failed = recovered = 0
        parsed_now: dict[str, Parsed | None] = {}
        now = now_iso()

        counts = {"added": 0, "changed": 0, "failed": 0, "recovered": 0, "removed": 0}
        for rel, (_abspath, st) in sorted(sources.items()):
            is_ref = rel in ref_rels
            # 引用根尚活跃时普通扫描仍会枚举已取消的材料；同一虚拟身份不能重新登记，
            # 但同根改名的当前活跃条目已在 _recover_ref_renames 关联到该路径时照常处理。
            if _key(rel) in removed_ref_keys and _key(rel) not in by_key:
                continue
            try:
                ref_id = rel.split("/", 3)[2] if is_ref else None
            except IndexError:
                raise ApiError("INTERNAL", "ref_virtual_key") from None
            entry = by_key.get(_key(rel))
            live = entry is not None and entry["status"] != "source_deleted"
            # 跟环境有关的失败（转换程序异常、超时、路径太长、无法读取等）每次扫描都重试（X9）
            retry = live and entry["status"] == "failed" and entry["error"] in RETRY_MESSAGES
            # 材料文本格式版本变了：这几种材料原件没变也重新解析（X13）
            refresh = live and stale_format and entry["type"] in REFORMAT_TYPES and entry["status"] != "failed"
            redo = retry or refresh
            mt = mtime_iso(st) if st is not None else None
            if (
                live
                and not redo
                and st is not None
                and entry["status"] != "missing"
                and entry["size"] == st.st_size
                and entry["mtime"] == mt
            ):
                continue
            mtype = detect.material_type(pathlib.Path(rel))
            new_entry = entry is None
            if new_entry:
                mtype = detect.material_type(pathlib.Path(rel))
                if mtype is None:
                    continue
                entry = self._entry_shell("", rel, mtype, now, "ref" if is_ref else "case", ref_id)
                entry["imported_at"] = now
                index["materials"].append(entry)
                by_key[_key(rel)] = entry
                counts["added"] += 1
            elif is_ref:
                entry.update(origin="ref", ref_id=ref_id)
            probe = dict(entry)
            if not probe["material_id"]:
                probe["material_id"] = "M9999"
            if probe["status"] == "missing":
                probe["status"] = "parsed"
            was_missing = entry["status"] == "missing"
            try:
                checked = gate.resolve_original(
                    root, refs_doc or {}, probe, op="materials_read",
                    **(self._context(root) or {}),
                )
                checked_st = checked.stat()
                st = checked_st
                mt = mtime_iso(st)
                digest = sha256_file(checked)
            except ApiError as error:
                if is_ref and error.reason in ("candidate_missing", "root_missing"):
                    if entry["status"] != "missing":
                        counts["removed"] += 1
                    entry.update(status="missing", updated_at=now)
                    continue
                raise
            except OSError:
                digest = None  # 被占用、没有权限：登记为失败（X8），下次扫描重试
            if is_ref and entry["status"] == "missing":
                # 重新定位后同相对路径必须先由内容确认身份。同名不同内容不能被当成
                # 旧材料复活，也不能覆盖旧 ID；本路径的旧条目继续 missing。
                if digest is None or entry["sha256"] == ZERO_SHA or digest != entry["sha256"]:
                    continue
            if entry["material_id"] == "":
                used = {m["material_id"] for m in index["materials"]}
                mid = ids.reuse(rel, digest, used) if digest else None  # index.json 重建后拿回原编号（N26）
                if mid is None:
                    seq = max(index["next_seq"], ids.next_seq())
                    mid = f"M{seq:04d}"
                    index["next_seq"] = seq + 1
                ids.record(mid, rel, digest or "0" * 64, now, index["next_seq"])
                entry["material_id"] = mid
            elif redo and (digest is None or digest == entry["sha256"] or entry["sha256"] == ZERO_SHA):
                pass  # 原件没变（或第一次就读不了、没有哈希可比），只是重试或按新格式重写
            else:
                if digest is not None and entry.get("sha256") != digest:
                    counts["changed"] += 1
                    if is_ref:
                        ids.relocate(entry["material_id"], rel, digest)
            if new_entry and any(
                other is not entry
                and other.get("origin") == "ref"
                and other["status"] != "removed"
                and _key(other["text_path"]) == _key(entry["text_path"])
                for other in index["materials"]
            ):
                # 同尾新文件可能占用一个旧材料的持久 text_path；新材料另用
                # 带编号的文本路径，旧身份的历史文本位置保持不变。
                entry["text_path"] = (
                    f"{TEXT_DIR}/{rel}.{entry['material_id']}.md"
                )
            if digest and entry.get("sha256") == ZERO_SHA:
                ids.fix_sha(entry["material_id"], digest)  # 第一次读不了时留底的是 64 个 0，现在更正
            # 读不了的原件没有哈希：沿用上次的；第一次就读不了的先填 64 个 0（契约要求 sha256 格式），下次重试时更正
            entry.update(type=mtype, size=st.st_size if st is not None else entry.get("size", 0),
                         mtime=mt or entry.get("mtime", now), sha256=digest or entry.get("sha256", "0" * 64),
                         updated_at=now, is_ocr="none")
            try:
                if digest is None:
                    raise ParseError("unreadable")
                if _too_long(root, entry["text_path"]) or (
                        mtype in ("xlsx", "xls") and _too_long(root, f"{FORMULA_DIR}/{rel}.txt")):
                    raise ParseError("path_too_long")  # 文本写不下去：只让这一份失败，不中断整次扫描
                p = self._parse(root, rel, mtype, conv, entry=probe, refs_doc=refs_doc)
            except ParseError as e:
                p = None
                entry.update(status="failed", unit=_default_unit(mtype), unit_count=0, pages_need_ocr=[],
                             pages_mixed=[], note=None, error=e.message)
                counts["failed"] += 1
                logs.event("materials", "parse", status="fail", case_id=case_id, error=e.reason)
            except ApiError:
                raise
            except Exception as e:  # noqa: BLE001 解析器报错一律按损坏处理，只记异常类名
                p = None
                entry.update(status="failed", unit=_default_unit(mtype), unit_count=0, pages_need_ocr=[],
                             pages_mixed=[], note=None, error=REASONS["corrupt"])
                counts["failed"] += 1
                logs.event("materials", "parse", status="fail", case_id=case_id, error=type(e).__name__)
            else:
                entry.update(status="needs_ocr" if p.pages_need_ocr else "parsed", unit=p.unit,
                             unit_count=p.unit_count, pages_need_ocr=p.pages_need_ocr, pages_mixed=p.pages_mixed,
                             note=p.note, error=None)
                if retry or was_missing:
                    counts["recovered"] += 1
            parsed_now[entry["material_id"]] = p
        ids.close()
        added, changed, failed, recovered = (
            counts["added"], counts["changed"], counts["failed"], counts["recovered"]
        )

        seen = {_key(r) for r in sources}
        for m in index["materials"]:
            if m["status"] == "removed" or _key(m["rel_path"]) in seen:
                continue
            if m.get("origin") == "ref":
                if m["status"] != "missing":
                    counts["removed"] += 1
                m["status"] = "missing"
                m["updated_at"] = now
                continue
            if m["status"] == "source_deleted":
                continue
            if any(m["rel_path"].startswith(d) for d in unreadable_dirs):
                continue  # 所在文件夹这次读不了：不知道原件还在不在，不标"原件已删除"（X8）
            m["status"] = "source_deleted"
            m["updated_at"] = now
            counts["removed"] += 1
        removed = counts["removed"]

        # 材料名：新材料导致重名时，已有材料的名字也改长
        locked = {
            m["material_id"]: m["name"] for m in index["materials"]
            if m.get("origin") == "ref" and m["status"] != "removed" and m["name"]
        }
        name_items = [
            (m["material_id"], self._material_name_rel(m, refs_by_id))
            for m in index["materials"]
            if m["status"] != "removed" and m["material_id"] not in locked
        ]
        names = _assign_names(name_items, locked.values())
        renamed = []
        for m in index["materials"]:
            if m["status"] == "removed":
                continue                   # 已移除的不占名字（同一路径可能已有新材料）
            new = locked.get(m["material_id"], names.get(m["material_id"]))
            if new is None:
                new = m["name"]
            if m["name"] and m["name"] != new and m["material_id"] not in parsed_now:
                renamed.append(m)
            m["name"] = new

        for m in index["materials"]:
            if m["material_id"] not in parsed_now:
                continue
            p = parsed_now[m["material_id"]]
            if p is None:
                gate.delete_work_file(root, texts.text_rel(m), op="materials_text")  # 不留旧版本的文本
                continue
            gate.write_bytes(root, m["text_path"], render(m["name"], m, p).encode("utf-8"), op="materials_text")
            if p.formulas:
                gate.write_bytes(root, f"{FORMULA_DIR}/{m['rel_path']}.txt", (p.formulas + "\n").encode("utf-8"),
                                 op="materials_text")
        for m in renamed:
            self._retitle(root, m)
        if self.after_render is not None:
            self.after_render(root, index, [mid for mid, p in parsed_now.items() if p is not None])

        self._save_index(root, index)
        self._write_status(root, index, unreadable_dirs)
        if registry is not None:
            registry.update_scan_statuses(ok=ref_ok, missing=ref_missing)
        live = {**index, "materials": [m for m in index["materials"] if m["status"] != "removed"]}
        search_fts.refresh_after_scan(root, case_id, live)  # T9：扫描完就建检索索引（自己兜住异常）
        return {"added": added, "changed": changed, "removed": removed, "failed": failed,
                "review_needed": bool(added or changed or removed or recovered)}

    @staticmethod
    def _text_format(root: str) -> int:
        """_处理状态.md 里记的材料文本格式版本；没有这个文件或这一行的算 1（X13 之前）。"""
        try:
            p = gate.resolve_internal(root, STATUS_REL, op="materials_status")
            m = _FORMAT_LINE.search(p.read_text(encoding="utf-8")) if p.is_file() else None
        except (ApiError, OSError, UnicodeDecodeError):
            return 1
        return int(m.group(1)) if m else 1

    @staticmethod
    def _clean_temp(root: str) -> None:
        """扫描开始时（已在该案件的锁内）清掉本服务自己前缀的残留：转换的 lo-*、解压的 unzip-*、导入复制的 imp-*
        （T5 返修 X6）。只认这几个前缀：工作区/临时/ 里粘贴的截图、委托材料窗口的下载不能动。链接一律不碰。"""
        tdir = gate.resolve_internal(root, TEMP_REL, op="materials_scan")
        try:
            entries = list(os.scandir(tdir))
        except OSError:
            return
        for e in entries:
            if not (_OWN_TEMP_DIR.match(e.name) or _OWN_TEMP_FILE.match(e.name)):
                continue
            try:
                st = e.stat(follow_symlinks=False)
                if _is_link_entry(st):
                    logs.event("materials", "temp_cleanup", status="denied", error="LINK")
                elif stat.S_ISDIR(st.st_mode) and _OWN_TEMP_DIR.match(e.name):
                    remove_tree(pathlib.Path(e.path))  # 删不掉会记日志
                elif stat.S_ISREG(st.st_mode) and _OWN_TEMP_FILE.match(e.name):
                    os.unlink(e.path)
            except OSError as err:
                logs.event("materials", "temp_cleanup", status="fail", error=type(err).__name__)

    def _retitle(self, root: str, m: dict) -> None:
        p = gate.resolve_internal(root, m["text_path"], op="materials_text")
        if not p.is_file():
            return
        lines = p.read_text(encoding="utf-8").split("\n", 1)
        body = lines[1] if len(lines) > 1 else ""
        gate.write_bytes(root, m["text_path"], f"# {m['name']}\n{body}".encode("utf-8"), op="materials_text")

    def _write_status(self, root: str, index: dict, unreadable_dirs: list[str] = ()) -> None:
        mats = index["materials"]
        count = {s: sum(1 for m in mats if m["status"] == s) for s in
                 ("parsed", "needs_ocr", "failed", "source_deleted", "missing")}
        lines = ["# 材料处理状态", "", f"更新时间：{now_iso()}", f"材料文本格式版本：{TEXT_FORMAT_VERSION}", "",
                 f"共 {len(mats)} 份：已解析 {count['parsed']}，待识别 {count['needs_ocr']}，"
                 f"失败 {count['failed']}，原件已删除 {count['source_deleted']}，"
                 f"外部原件不见了 {count['missing']}。", ""]
        for title, st in (("处理失败", "failed"), ("待识别", "needs_ocr"),
                          ("原件已删除", "source_deleted"), ("外部原件不见了", "missing")):
            rows = [m for m in mats if m["status"] == st]
            if rows:
                lines.append(f"## {title}")
                for m in rows:
                    extra = m["error"] if st == "failed" else (
                        "第 " + "、".join(map(str, m["pages_need_ocr"])) + " 页"
                        if st == "needs_ocr" else "保留原有文本")
                    lines.append(f"- {m['name']}：{extra}")
                lines.append("")
        if unreadable_dirs:
            lines.append(f"## 无法读取的文件夹（{len(unreadable_dirs)} 个，其中的文件这次没有列入，以前列入的保持原状）")
            lines += [f"- {d.rstrip('/') or '（案件文件夹本身）'}" for d in unreadable_dirs]
            lines.append("")
        gate.write_bytes(root, STATUS_REL, "\n".join(lines).encode("utf-8"), op="materials_status")

    def index(self, case_id: str) -> dict:
        """材料索引（只读，给工具和覆盖清单用）。不拿案件锁（T8 返修 P2-5）：扫描、导入要持锁很久，
        index.json 是原子替换写入的，不加锁读到的一定是完整的旧版或新版。"""
        root = self.cases.root_of(case_id)
        index = self._load_index(root, case_id)
        # 已移除的材料（契约 1.4）只在 index.json 里留编号：工具、检索、覆盖清单、wiki、归档、识别都当它不存在
        return {**index, "materials": [m for m in index["materials"] if m["status"] != "removed"]}

    def original_path(
        self, case_id: str, material_id: str, *, op: str = "materials_original"
    ) -> tuple[pathlib.Path | None, str]:
        """按当前案与材料身份返回原件的当前路径和契约状态。

        只接受材料编号；引用材料使用本案持久索引登记的虚拟键和 ``引用.json``，
        每次调用都在真实 gate 中重新校验，不接受调用方绝对路径。单位状态为
        ``ok`` / ``missing`` / ``deleted``。文本由调用方从案件工作区另读。
        """
        root = self.cases.root_of(case_id)
        index = self._load_index(root, case_id)
        meta = next((m for m in index["materials"] if m["material_id"] == material_id), None)
        if meta is None or meta["status"] == "removed":
            raise ApiError("MATERIAL_NOT_FOUND", "original_material")

        _, refs_doc = self._load_refs(root)
        if meta.get("origin") == "ref" and refs_doc is None:
            raise ApiError("INTERNAL", "refs_missing")
        if meta["status"] == "source_deleted":
            return None, "deleted"

        probe_meta = meta
        probe_refs = refs_doc or {}
        if meta.get("origin") == "ref":
            if meta["status"] == "missing":
                probe_meta = {**meta, "status": "parsed"}
            missing_refs = {
                ref["ref_id"] for ref in probe_refs.get("refs", []) if ref["status"] == "missing"
            }
            if meta.get("ref_id") in missing_refs:
                probe_refs = {
                    **probe_refs,
                    "refs": [
                        {**ref, "status": "ok"} if ref["ref_id"] == meta.get("ref_id") else ref
                        for ref in probe_refs.get("refs", [])
                    ],
                }
        try:
            path = gate.resolve_original(
                root,
                probe_refs,
                probe_meta,
                op=op,
                **(self._context(root) or {}),
            )
        except ApiError as error:
            if (
                meta.get("origin") == "ref"
                and error.reason in ("candidate_missing", "root_missing")
            ):
                return None, "missing"
            raise

        if not path.is_file():
            return None, "missing" if meta.get("origin") == "ref" else "deleted"
        if meta.get("origin") == "ref" and meta["status"] == "missing":
            # 同尾路径可能已被另一份内容占用。missing 条目只有当前字节仍与
            # 持久身份一致时才可作为旧原件返回；恢复未扫描的同字节原件仍可读取。
            if meta["sha256"] == ZERO_SHA:
                return None, "missing"
            try:
                if sha256_file(path) != meta["sha256"]:
                    return None, "missing"
            except OSError:
                return None, "missing"
        return path, "ok"

    # ---------- 引用根重新定位（内部服务） ----------

    def relocate(self, case_id: str, ref_id: str, path: str) -> dict:
        """把已缺失的引用根指向律师选出的新位置，并按材料身份重扫。

        先由登记器完成四禁区、真实预扫描、类型、上限和现役根冲突校验；随后只用
        相对子路径+sha256，或同根唯一同内容改名来认回旧材料。多候选、同名不同内容
        和跨根情况都不猜，旧条目继续 missing。根路径与材料索引是两个文件，本方法
        不承诺跨文件原子事务；根更新成功后扫描失败会如实向上传播。
        """
        root = self.cases.root_of(case_id)
        t0 = time.monotonic()
        with self._lock(case_id):
            registry, refs_doc = self._load_refs(root)
            if registry is None or refs_doc is None:
                raise ApiError("INTERNAL", "refs_missing")
            prepared = registry.prepare_relocate(ref_id, path)
            index = self._load_index(root, case_id)
            missing = [
                material
                for material in index["materials"]
                if material.get("origin") == "ref"
                and material.get("ref_id") == ref_id
                and material["status"] == "missing"
            ]

            candidate_digests: dict[str, tuple[str, os.stat_result, str]] = {}
            for tail, (actual, info) in prepared["children"].items():
                try:
                    digest = sha256_file(actual)
                except OSError:
                    continue
                candidate_digests[tail] = (actual, info, digest)

            restored_ids = self._match_relocated_refs(missing, candidate_digests)
            registry.commit_relocate(ref_id, prepared["path"], prepared["kind"])
            scan = self._scan(root, case_id)

            refreshed = self._load_index(root, case_id)
            remaining = {
                material["material_id"]
                for material in refreshed["materials"]
                if material.get("origin") == "ref"
                and material.get("ref_id") == ref_id
                and material["status"] == "missing"
            }
            healthy = {
                material["material_id"]
                for material in refreshed["materials"]
                if material.get("origin") == "ref"
                and material.get("ref_id") == ref_id
                and material["status"] not in
                ("missing", "failed", "source_deleted", "removed")
            }
            value = {
                "ref_id": ref_id,
                "restored": len(restored_ids & healthy),
                "still_missing": len(remaining),
                "scan": scan,
            }
            contracts.validate(
                "api/materials_relocate.schema.json",
                "#/$defs/value",
                value,
            )
        logs.event(
            "materials",
            "relocate",
            case_id=case_id,
            duration_ms=(time.monotonic() - t0) * 1000,
        )
        return value

    def _match_relocated_refs(
        self,
        missing: list[dict],
        candidates: dict[str, tuple[str, os.stat_result, str]],
    ) -> set[str]:
        """按相对子路径+sha 认回，再用未占用候选做唯一同内容改名匹配。"""
        matched: set[str] = set()
        used_keys: set[str] = set()
        by_tail: dict[str, list[dict]] = {}
        for material in missing:
            by_tail.setdefault(_key(self._ref_tail(material)), []).append(material)

        candidates_by_key: dict[
            str, list[tuple[str, tuple[str, os.stat_result, str]]]
        ] = {}
        for tail, candidate in candidates.items():
            candidates_by_key.setdefault(_key(tail), []).append((tail, candidate))

        for key, materials in by_tail.items():
            entries = candidates_by_key.get(key)
            if entries is None or len(entries) != 1 or len(materials) != 1:
                continue
            tail, candidate = entries[0]
            digest = candidate[2]
            material = materials[0]
            if material["sha256"] != ZERO_SHA and digest == material["sha256"]:
                matched.add(material["material_id"])
                used_keys.add(_key(tail))

        old_remaining: dict[str, list[dict]] = {}
        for material in missing:
            if material["material_id"] in matched or material["sha256"] == ZERO_SHA:
                continue
            old_remaining.setdefault(material["sha256"], []).append(material)
        new_remaining: dict[str, list[str]] = {}
        for tail, (_actual, _info, digest) in candidates.items():
            key = _key(tail)
            if key not in used_keys:
                new_remaining.setdefault(digest, []).append(key)
        for digest, materials in old_remaining.items():
            tails = new_remaining.get(digest, [])
            if len(materials) == 1 and len(tails) == 1:
                matched.add(materials[0]["material_id"])
        return matched

    # ---------- 移除（契约 1.4 materials_remove） ----------

    def remove(self, case_id: str, material_ids: list[str]) -> dict:
        """律师移除材料：案件内原件移到系统回收站，引用材料只取消登记；两者都删掉材料文本、公式文本、
        识别页并清检索。index.json 保留这一条、状态 removed（编号不复用）。引用根下最后一份材料成功
        取消后才把根标 removed；外部原件始终不读、不动、不进回收站。编号不在本案的整个请求拒绝、什么
        都不做；已移除的再来一次算 already_removed；案件内原件移不进回收站的那一份不动。"""
        root = self.cases.root_of(case_id)
        t0 = time.monotonic()
        try:
            with self._lock(case_id):
                index = self._load_index(root, case_id)
                known = {m["material_id"] for m in index["materials"]}
        except contracts.ContractError:
            # index.json 不合契约（如某条路径被改到案件外）：不敢按它去动文件，也没法安全改写，全部记为没移除（1.4 复核 NOTE 2）。
            # 不引导重新扫描：scan、list 遇到坏索引同样读不了（那两处的 500 转业务码另记后续）
            logs.event("materials", "remove", status="fail", case_id=case_id, error="INDEX_INVALID")
            return {"removed": [], "already_removed": [], "wiki_needs_update": False,
                    "failed": [{"material_id": mid, "reason": "材料索引已损坏，未移除；请联系技术支持"} for mid in material_ids]}
        if any(mid not in known for mid in material_ids):
            raise ApiError("MATERIAL_NOT_FOUND", "remove_unknown")
        by_id = {m["material_id"]: m for m in index["materials"]}
        active_ref_ids = {
            by_id[mid].get("ref_id")
            for mid in material_ids
            if by_id[mid].get("origin") == "ref" and by_id[mid]["status"] != "removed"
        }
        registry = None
        if active_ref_ids:
            registry, refs_doc = self._load_refs(root)
            if refs_doc is None:
                raise ApiError("INTERNAL", "refs_missing")
            refs_by_id = {ref["ref_id"]: ref for ref in refs_doc["refs"]}
            for mid in material_ids:
                material = by_id[mid]
                if material.get("origin") != "ref" or material["status"] == "removed":
                    continue
                ref_id = material.get("ref_id")
                if ref_id not in refs_by_id or not self._ref_tail(material):
                    raise ApiError("INTERNAL", "ref_not_found")
        if self.before_remove is not None:               # 识别队列：先停掉这些材料还在跑的识别（它自己要拿案件锁）
            for mid in material_ids:
                self.before_remove(case_id, mid)
        removed, already, failed = [], [], []
        affected_refs: set[str] = set()
        with self._lock(case_id):
            index = self._load_index(root, case_id)
            by_id = {m["material_id"]: m for m in index["materials"]}
            for mid in material_ids:
                m = by_id[mid]
                if m["status"] == "removed":
                    already.append(mid)
                    continue
                reason = None
                try:
                    if m.get("origin") != "ref" and m["status"] != "source_deleted":
                        src = gate.resolve_read(root, m["rel_path"], op="materials_remove")
                        if src.is_file():
                            if not self.can_recycle(src):
                                reason, err = "该位置没有回收站，未移除；请在资源管理器里自行处理", "NO_RECYCLE_BIN"
                            else:
                                self.recycle(src)
                except ApiError as e:      # 闸门拒绝：原件位置被换成链接、rel_path 被改出案件等
                    reason, err = "该材料位置不在案件内，未移除", e.code
                except OSError as e:
                    reason, err = "原件移不进回收站（可能正被其他程序打开），这份没有移除", type(e).__name__
                except Exception as e:  # noqa: BLE001 这一份出了没料到的错：只让这一份失败
                    reason, err = "未能移除，请稍后再试", type(e).__name__
                if reason is not None:
                    failed.append({"material_id": mid, "reason": reason})
                    logs.event("materials", "remove", status="fail", case_id=case_id, material_id=mid, error=err)
                    continue
                self._drop_derived(root, m)
                m.update(status="removed", pages_need_ocr=[], pages_mixed=[], error=None, updated_at=now_iso())
                removed.append(mid)
                if m.get("origin") == "ref":
                    affected_refs.add(m["ref_id"])
            if removed:
                close_refs = {
                    ref_id for ref_id in affected_refs
                    if not any(
                        m.get("origin") == "ref"
                        and m.get("ref_id") == ref_id
                        and m["status"] != "removed"
                        for m in index["materials"]
                    )
                }
                if close_refs and registry is not None:
                    registry.mark_removed(close_refs)
                self._save_index(root, index)
                live = {**index, "materials": [x for x in index["materials"] if x["status"] != "removed"]}
                self._write_status(root, live)
                search_fts.refresh_after_scan(root, case_id, live)
        logs.event("materials", "remove", case_id=case_id, duration_ms=(time.monotonic() - t0) * 1000)
        return {"removed": removed, "already_removed": already, "failed": failed,
                "wiki_needs_update": bool(removed) and self._in_wiki(root, set(removed))}

    def _drop_derived(self, root: str, m: dict) -> None:
        """材料文本、Excel 公式文本、识别页。都在 工作区/ 里，经闸门删；删不掉的不拦移除（文件名只是编号或同名路径）。"""
        for rel in (m["text_path"], f"{FORMULA_DIR}/{m['rel_path']}.txt"):
            try:
                if rel.startswith(gate.WORK + "/"):
                    gate.delete_work_file(root, rel, op="materials_remove")
            except (ApiError, OSError):
                pass
        try:
            pages = gate.resolve_internal(root, f"工作区/材料/识别页/{m['material_id']}", op="materials_remove")
            if pages.is_dir():
                for f in list(pages.iterdir()):
                    gate.delete_work_file(root, f"工作区/材料/识别页/{m['material_id']}/{f.name}", op="materials_remove")
                pages.rmdir()
        except (ApiError, OSError):
            pass

    @staticmethod
    def _in_wiki(root: str, ids: set[str]) -> bool:
        """被移除的材料在 wiki 生成时用过没有（case.json 的 materials_at_generation）；读不了按没有。"""
        try:
            card = json.loads(gate.resolve_internal(root, "工作区/wiki/case.json", op="materials_remove").read_text(encoding="utf-8"))
            return any(x.get("material_id") in ids for x in card.get("materials_at_generation", []))
        except (ApiError, OSError, ValueError, AttributeError):
            return False

    # ---------- 列表 ----------

    def list(self, case_id: str) -> dict:
        root = self.cases.root_of(case_id)
        with self._lock(case_id):
            index = self._load_index(root, case_id)
            _, refs_doc = self._load_refs(root)
            refs_by_id = {r["ref_id"]: r for r in (refs_doc or {}).get("refs", [])}
        stale = self._stale_ocr(root, index)
        return {"materials": [{
            "material_id": m["material_id"], "name": m["name"], "rel_path": m["rel_path"], "type": m["type"],
            "status": m["status"], "unit": m["unit"], "unit_count": m["unit_count"], "is_ocr": m["is_ocr"],
            "stale_ocr": m["material_id"] in stale, "error": m["error"], "pages_need_ocr": m["pages_need_ocr"],
            "pages_mixed": m["pages_mixed"], "chars": self._chars(root, m),
            **({"origin": "ref", "ref_id": m["ref_id"],
                "location": self._ref_location(m, refs_by_id)}
               if m.get("origin") == "ref" else {})}
            for m in index["materials"] if m["status"] != "removed"]}     # 已移除的（契约 1.4）不列

    def _ref_location(self, material: dict, refs_by_id: dict[str, dict]) -> str:
        ref = refs_by_id.get(material.get("ref_id"))
        if ref is None:
            raise ApiError("INTERNAL", "ref_not_found")
        if ref["kind"] == "file":
            return ref["path"]
        return os.path.normpath(os.path.join(ref["path"], *self._ref_tail(material).split("/")))

    def _chars(self, root: str, m: dict) -> int | None:
        """材料文本的字数（契约 1.4 materials_list.chars）：各单元正文之和，不含位置标记、"本页需识别"占位。
        按文本文件的修改时间和大小缓存，文本没变不重读。没有文本（失败、文本缺失）为 None。"""
        if m["status"] == "failed":
            return None
        try:
            path = gate.resolve_internal(root, texts.text_rel(m), op="material_text")
            st = path.stat()
        except (ApiError, OSError):
            return None
        key = (str(path), m["unit"])
        hit = self._chars_cache.get(key)
        if hit and hit[0] == (st.st_mtime_ns, st.st_size):
            return hit[1]
        try:
            units = texts.split_units(path.read_text(encoding="utf-8"), m["unit"])
        except (OSError, ValueError):
            return None
        n = sum(len(u.text) for u in units if u.text.strip() != texts.PENDING_OCR)
        self._chars_cache[key] = ((st.st_mtime_ns, st.st_size), n)
        return n

    @staticmethod
    def _stale_ocr(root: str, index: dict) -> set[str]:
        """原件变了而识别结果还是旧版本：该材料有已完成页的识别任务，但没有一个是当前 sha256 的
        （T12：原件改过后重新识别过，就不再算过期）。"""
        db = gate.resolve_internal(root, "工作区/case.db", op="materials_list")
        if not db.exists():
            return set()
        cur = {m["material_id"]: m["sha256"] for m in index["materials"]}
        con = sqlite3.connect(f"file:{db.as_posix()}?mode=ro", uri=True)
        try:
            rows = con.execute("SELECT material_id, material_version FROM ocr_jobs WHERE done > 0").fetchall()
        except sqlite3.Error:
            rows = []
        finally:
            con.close()
        current = {mid for mid, ver in rows if mid in cur and cur[mid] == ver}
        return {mid for mid, ver in rows if mid in cur and cur[mid] != ver and mid not in current}

    stale_ocr = _stale_ocr  # 工具 case_list_materials 也用

    # ---------- 导入（Spec 5.1） ----------

    def import_(
        self,
        case_id: str,
        paths: list[str],
        target: str | None,
        unzip: bool,
        *,
        mode: str = "copy",
    ) -> dict:
        root = self.cases.root_of(case_id)
        t0 = time.monotonic()
        if mode not in ("copy", "ref"):
            raise ApiError("INVALID_ARGUMENT", "ref_mode_invalid")
        copied: list[dict] = []
        skipped = []
        registered: list[dict] = []
        if mode == "copy":
            self._assert_refs_available_for_default_path(root)
            with self._lock(case_id):
                copied, skipped = self._import(root, paths, target, unzip)
        else:
            registry = self._registry(root)
            external: list[str] = []
            for src in paths:
                if not os.path.isabs(src):
                    raise ApiError("INVALID_ARGUMENT", "path_not_abs")
                plain = gate.strip_long_prefix(os.path.normpath(src))
                parts = _parts_in_case(plain, root)
                if parts is not None or gate.is_within(root, os.path.realpath(plain)):
                    continue
                external.append(plain)
            if external:
                with self._lock(case_id):
                    registered = registry.register(external)
        scan = self.scan(case_id)
        logs.event("materials", "import", case_id=case_id, duration_ms=(time.monotonic() - t0) * 1000)
        value = {"copied": copied, "skipped": skipped, "scan": scan}
        if mode == "ref":
            value["registered"] = [
                {"path": r["path"], "ref_id": r["ref_id"], "kind": r["kind"]}
                for r in registered
            ]
        return value

    def _default_target(self, root: str) -> str:
        return "02案件材料" if os.path.isdir(os.path.join(root, "02案件材料")) else ""

    def _import(self, root: str, paths: list[str], target: str | None, unzip: bool):
        if target is None:
            target = self._default_target(root)
        else:
            target = target.strip("/")
            gate.check_ai_rel(target, op="import_target")
        copied: list[dict] = []
        skipped: list[dict] = []
        for src in paths:
            if not os.path.isabs(src):
                raise ApiError("INVALID_ARGUMENT", "path_not_abs")
            p = gate.strip_long_prefix(os.path.normpath(src))  # \\?\ 写法先去掉前缀（B-P2-1）
            try:
                st = os.lstat(p)
            except OSError:
                skipped.append({"path": src, "reason": "无法读取"})
                continue
            if _is_link_entry(st) or os.path.splitext(p)[1].lower() in SHORTCUT_EXT:
                skipped.append({"path": src, "reason": "链接或快捷方式"})
                continue
            real = os.path.realpath(p)
            # 是不是案件根目录或它里面：按文件身份逐级比对上级目录，\\?\、UNC 管理共享等别名写法也认得出（B-P2-1）
            parts = _parts_in_case(p, root)
            if parts is None and gate.is_within(root, real):
                parts = os.path.relpath(real, root).replace("\\", "/").split("/")
            if parts == []:
                continue  # 导入源就是案件根目录：按"已在案件内"处理，只扫描（X3）
            if parts is not None:
                if parts[0] == gate.WORK:
                    # 只有 工作区/临时/ 下的文件（粘贴的截图、委托材料下载）按临时文件导入：复制成功或判定
                    # "同名同内容已存在"之后才删；工作区 下其他位置的不接受导入（X7）
                    if len(parts) > 2 and parts[1] == "临时" and stat.S_ISREG(st.st_mode):
                        if self._import_file(root, p, target, os.path.basename(p), copied, skipped, unzip):
                            gate.delete_work_file(root, "/".join(parts), op="import")
                    else:
                        skipped.append({"path": src, "reason": "无法读取"})
                continue  # 已在案件文件夹内：不复制，直接解析
            # 源文件在云同步目录也照常复制（N80，2026-10-08 用户定）：只是复制进本机案件文件夹；案件根和日常办公文件夹仍按 SEC-14 拒绝
            if stat.S_ISDIR(st.st_mode):
                self._import_dir(root, p, target, copied, skipped)
            elif stat.S_ISREG(st.st_mode):
                self._import_file(root, p, target, os.path.basename(p), copied, skipped, unzip)
            else:
                skipped.append({"path": src, "reason": "无法读取"})
        return copied, skipped

    def _import_dir(self, root: str, src_dir: str, target: str, copied, skipped) -> None:
        """案件根目录在导入源之内（拖进来的是案件的上级文件夹）：跳过案件根目录那一支，不复制也不计入跳过（X3）。
        任何层级以 . 开头的项都跳过，计入"跳过"（X12，与扫描一致）。"""
        base = _join(target, os.path.basename(src_dir.rstrip("\\/")))
        stack = [(src_dir, base)]
        while stack:
            d, dest = stack.pop()
            try:
                entries = sorted(os.scandir(d), key=lambda e: e.name)
            except OSError:
                skipped.append({"path": d, "reason": "无法读取"})
                continue
            for e in entries:
                if e.name.startswith("."):
                    skipped.append({"path": e.path, "reason": "无法读取"})
                    continue
                try:
                    st = e.stat(follow_symlinks=False)
                except OSError:
                    skipped.append({"path": e.path, "reason": "无法读取"})
                    continue
                if _is_link_entry(st) or os.path.splitext(e.name)[1].lower() in SHORTCUT_EXT:
                    skipped.append({"path": e.path, "reason": "链接或快捷方式"})
                elif stat.S_ISDIR(st.st_mode):
                    if not _same_file(e.path, root):  # 案件根目录那一支：按文件身份比，别名写法也认得出
                        stack.append((e.path, _join(dest, e.name)))
                elif stat.S_ISREG(st.st_mode):
                    self._copy_one(root, e.path, _join(dest, e.name), copied, skipped)

    def _import_file(self, root: str, src: str, target: str, name: str, copied, skipped, unzip: bool) -> bool:
        """返回是否全部落位（复制成功或同名同内容已存在）：导入临时文件时只有这样才删源文件（X7）。"""
        if unzip and name.lower().endswith(".zip"):
            return self._import_zip(root, src, target, copied, skipped)
        return self._copy_one(root, src, _join(target, name), copied, skipped)

    def _copy_one(self, root: str, src: str, dest_rel: str, copied, skipped, from_label: str | None = None) -> bool:
        label = from_label or src
        try:
            size = os.path.getsize(src)
        except OSError:
            skipped.append({"path": label, "reason": "无法读取"})
            return False
        if size > MAX_BYTES:
            skipped.append({"path": label, "reason": "超过大小上限"})
            return False
        try:
            digest = sha256_file(src)
        except OSError:
            skipped.append({"path": label, "reason": "无法读取"})
            return False
        stem, ext = os.path.splitext(dest_rel)
        n = 1
        while True:
            cand = dest_rel if n == 1 else f"{stem}({n}){ext}"
            try:
                existing = gate.resolve_read(root, cand, op="import")
            except ApiError:
                # 文件名是设备名（con.txt）或以 . 开头（.env）等闸门不收的名字：只跳过这一个，不中止整次导入
                skipped.append({"path": label, "reason": "无法读取"})
                return False
            if os.path.lexists(existing):
                if os.path.isfile(existing) and not gate.is_link(existing) and sha256_file(existing) == digest:
                    skipped.append({"path": label, "reason": "同名同内容已存在"})
                    return True
                n += 1
                continue
            try:
                gate.copy_original(root, cand, src, op="import")
            except FileExistsError:
                continue  # 并发下被别人抢先建了同名文件：重新比对
            except OSError:
                skipped.append({"path": label, "reason": "无法读取"})
                return False
            copied.append({"from": label, "to": cand})
            return True

    def _import_zip(self, root: str, src: str, target: str, copied, skipped) -> bool:
        """ZIP 先解压到 工作区/临时/（拒绝越界、链接、超过 500 个文件），再按普通文件复制。
        任何层级以 . 开头的成员跳过（X12）。返回是否每个成员都已落位。"""
        try:
            zf = zipfile.ZipFile(src)
        except (zipfile.BadZipFile, OSError):
            skipped.append({"path": src, "reason": "无法读取"})
            return False
        with zf:
            members = [i for i in zf.infolist() if not i.is_dir()]
            if len(members) > ZIP_MAX_FILES or any(_zip_bad(i) for i in zf.infolist()):
                skipped.append({"path": src, "reason": "无法读取"})
                return False
            tops = {i.filename.replace("\\", "/").split("/")[0] for i in members}
            dest_base = "" if tops & STANDARD_TOPS else target
            work_rel = f"{TEMP_REL}/unzip-{uuid.uuid4().hex[:8]}"
            work = gate.mkdir_work(root, work_rel, op="import")
            done = True
            try:
                for i, info in enumerate(members):
                    name = info.filename.replace("\\", "/")
                    label = src + os.sep + name.replace("/", os.sep)
                    if any(part.startswith(".") for part in name.split("/")):
                        skipped.append({"path": label, "reason": "无法读取"})
                        done = False
                        continue
                    if info.file_size > MAX_BYTES:
                        skipped.append({"path": label, "reason": "超过大小上限"})
                        done = False
                        continue
                    tmp = gate.write_bytes(root, f"{work_rel}/{i}", zf.read(info), op="import")
                    done = self._copy_one(root, str(tmp), _join(dest_base, name), copied, skipped,
                                          from_label=label) and done
            finally:
                remove_tree(work)  # 删不掉记日志（Y2），下次扫描按 unzip- 前缀再清
            return done


def _zip_bad(info: zipfile.ZipInfo) -> bool:
    name = info.filename.replace("\\", "/")
    if name.startswith("/") or ":" in name or any(p == ".." for p in name.split("/")):
        return True
    mode = (info.external_attr >> 16) & 0o170000
    return mode == stat.S_IFLNK


# Windows 不开长路径支持时：文件完整路径不超过 259 字符，新建目录不超过 247 字符；
# 原子写的临时文件（.~lb-xxxxxxxx.tmp，17 字符）和目标在同一目录，也要放得下
_MAX_FILE = 259
_MAX_DIR = 247
_ATOMIC_TMP_NAME = 17


def _too_long(root: str, rel: str) -> bool:
    if os.name != "nt":
        return False
    full = os.path.join(root, *rel.split("/"))
    parent = os.path.dirname(full)
    return (len(full) > _MAX_FILE or len(parent) > _MAX_DIR
            or len(parent) + 1 + _ATOMIC_TMP_NAME > _MAX_FILE)


def _long_path(path: str) -> str:
    """Windows 上加长路径前缀，遍历、读取不受 260 字符上限影响（X8）。"""
    if os.name != "nt" or path.startswith("\\\\?\\"):
        return path
    path = os.path.abspath(path)
    if path.startswith("\\\\"):
        return "\\\\?\\UNC\\" + path[2:]
    return "\\\\?\\" + path


_MID = re.compile(r"^M(\d{4,})$")


def _recover_next_seq(root: str) -> int:
    """index.json 不在了（被删）时的起始编号（T5 返修 X11，裁决 2）：从"案件里还能找到的最大编号"加 1 起，
    来源是 case.db 里出现过的材料编号、工作区/材料/识别页/ 下的目录名、工作区/wiki/材料/ 下的文件名，旧编号不再复用。
    根治要在 case.db 里留底（改契约，候 owner N26）。"""
    seen: list[int] = []

    def take(mid) -> None:
        m = _MID.match(str(mid))
        if m:
            seen.append(int(m.group(1)))

    for rel, strip_suffix in (("工作区/材料/识别页", False), ("工作区/wiki/材料", True)):
        try:
            d = gate.resolve_internal(root, rel, op="materials_index")
            names = [e.name for e in os.scandir(d)] if d.is_dir() else []
        except (ApiError, OSError):
            names = []
        for n in names:
            take(os.path.splitext(n)[0] if strip_suffix else n)
    try:
        db = gate.resolve_internal(root, "工作区/case.db", op="materials_index")
        if db.is_file():
            con = sqlite3.connect(f"file:{db.as_posix()}?mode=ro", uri=True)
            try:
                for table in ("material_ids", "ocr_jobs", "search_units"):
                    try:
                        for (mid,) in con.execute(f"SELECT DISTINCT material_id FROM {table}"):
                            take(mid)
                    except sqlite3.Error:
                        pass
                try:
                    row = con.execute("SELECT value FROM meta WHERE key = 'next_material_seq'").fetchone()
                    if row and str(row[0]).isdigit():
                        seen.append(int(row[0]) - 1)
                except sqlite3.Error:
                    pass
            finally:
                con.close()
    except (ApiError, OSError, sqlite3.Error):
        pass
    return max(seen, default=0) + 1


def _same_file(a: str, b: str) -> bool:
    try:
        return os.path.samefile(a, b)
    except (OSError, ValueError):
        return _same_path(os.path.realpath(a), b)


def _parts_in_case(path: str, root: str) -> list[str] | None:
    """path 是案件根目录本身返回 []；在根目录之内返回相对的各级名字；不在返回 None。逐级往上比文件身份。"""
    cur = os.path.abspath(path)
    names: list[str] = []
    while True:
        if _same_file(cur, root):
            return list(reversed(names))
        parent = os.path.dirname(cur)
        if parent == cur:
            return None
        names.append(os.path.basename(cur))
        cur = parent


def _same_path(a: str, b: str) -> bool:
    return os.path.normcase(os.path.normpath(a)) == os.path.normcase(os.path.normpath(b))


class _MaterialIds:
    """case.db 的 material_ids 表（契约 1.2 N26，T5 返修 X11）：分配编号时写一行，meta 里记 next_material_seq；
    index.json 丢失后重建时，同一份原件（rel_path + sha256）拿回原编号，新编号从
    max(next_material_seq, 表内最大编号 + 1) 起。index.json 仍是主本：case.db 不在或读写出错时只记日志，照常扫描。"""

    def __init__(self, root: str, sql_path: pathlib.Path | None = None):
        self.con = None
        try:
            db = gate.resolve_internal(root, "工作区/case.db", op="materials_ids")
            if not db.is_file():
                logs.event("materials", "material_ids", status="fail", error="CASE_DB_MISSING")
                return
            con = sqlite3.connect(str(db), timeout=10)
            has = con.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'material_ids'").fetchone()
            if not has:
                # 打开案件时已按契约补建；万一还没有（旧库、打开之后被人动过）：按契约补建并记日志，不静默跳过
                logs.event("materials", "material_ids", status="fail", error="TABLE_MISSING")
                if sql_path is not None:
                    con.executescript(pathlib.Path(sql_path).read_text(encoding="utf-8"))
            self.con = con
        except (ApiError, OSError, sqlite3.Error) as e:
            logs.event("materials", "material_ids", status="fail", error=type(e).__name__)

    def _q(self, sql: str, args=()):
        if self.con is None:
            return []
        try:
            return self.con.execute(sql, args).fetchall()
        except sqlite3.Error as e:
            logs.event("materials", "material_ids", status="fail", error=type(e).__name__)
            return []

    def reuse(self, rel: str, digest: str, used: set[str]) -> str | None:
        for (mid,) in self._q("SELECT material_id FROM material_ids WHERE rel_path = ? AND sha256 = ? "
                              "ORDER BY material_id", (rel, digest)):
            if mid not in used and _MID.match(mid):
                return mid
        return None

    def next_seq(self) -> int:
        n = 1
        for (mid,) in self._q("SELECT material_id FROM material_ids"):
            m = _MID.match(mid)
            if m:
                n = max(n, int(m.group(1)) + 1)
        for (v,) in self._q("SELECT value FROM meta WHERE key = 'next_material_seq'"):
            if str(v).isdigit():
                n = max(n, int(v))
        return n

    def record(self, mid: str, rel: str, digest: str, now: str, next_seq: int) -> None:
        if self.con is None:
            return
        try:
            with self.con:
                self.con.execute("INSERT OR IGNORE INTO material_ids (material_id, rel_path, sha256, first_seen) "
                                 "VALUES (?, ?, ?, ?)", (mid, rel, digest, now))
                cur = self.next_seq()
                self.con.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('next_material_seq', ?)",
                                 (str(max(cur, next_seq)),))
        except sqlite3.Error as e:
            logs.event("materials", "material_ids", status="fail", error=type(e).__name__)

    def backfill(self, index: dict) -> None:
        """把 index.json 里已有的材料补进 material_ids（INSERT OR IGNORE）：1.2 之前建的库补表后是空的，
        不回填的话 index.json 再丢一次，这些材料就拿不回原编号。"""
        if self.con is None or not index["materials"]:
            return
        try:
            with self.con:
                self.con.executemany(
                    "INSERT OR IGNORE INTO material_ids (material_id, rel_path, sha256, first_seen) VALUES (?, ?, ?, ?)",
                    [(m["material_id"], m["rel_path"], m["sha256"], m["imported_at"]) for m in index["materials"]])
        except sqlite3.Error as e:
            logs.event("materials", "material_ids", status="fail", error=type(e).__name__)

    def fix_sha(self, mid: str, digest: str) -> None:
        if self.con is None:
            return
        try:
            with self.con:
                self.con.execute("UPDATE material_ids SET sha256 = ? WHERE material_id = ? AND sha256 = ?",
                                 (digest, mid, ZERO_SHA))
        except sqlite3.Error as e:
            logs.event("materials", "material_ids", status="fail", error=type(e).__name__)

    def relocate(self, mid: str, rel: str, digest: str) -> None:
        """同根改名认回后，把编号留底表指向当前虚拟位置。"""
        if self.con is None:
            return
        try:
            with self.con:
                self.con.execute(
                    "UPDATE material_ids SET rel_path = ?, sha256 = ? WHERE material_id = ?",
                    (rel, digest, mid),
                )
        except sqlite3.Error as e:
            logs.event("materials", "material_ids", status="fail", error=type(e).__name__)

    def close(self) -> None:
        if self.con is not None:
            self.con.close()
            self.con = None

    def __del__(self):
        try:
            self.close()
        except Exception:
            pass


def _join(a: str, b: str) -> str:
    return f"{a}/{b}" if a else b


def _default_unit(mtype: str) -> str:
    return {"pdf": "page", "image": "page", "docx": "para", "doc": "para", "wps": "para", "xlsx": "cell",
            "xls": "cell"}.get(mtype, "line")
