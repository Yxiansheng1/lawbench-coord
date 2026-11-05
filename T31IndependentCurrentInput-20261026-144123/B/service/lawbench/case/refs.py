"""T37 引用根登记与写入前元数据预扫描底座。

本模块负责 ``工作区/材料/引用.json`` 的读取、校验、最小登记事务、登记前的只读
文件枚举，以及材料全部取消登记后的根状态写入。预扫描不打开原件正文、不 hash；移除只
写登记状态，不访问外部原件。实例内的 ``RLock`` 只保证同一进程内使用同一实例的读改写
不丢更新，不是跨进程文件锁。
"""
from __future__ import annotations

import copy
import json
import os
import pathlib
import stat
import threading
from collections.abc import Iterable
from datetime import datetime
from typing import Any

from .. import contracts
from ..errors import ApiError
from ..ingest import detect
from . import gate, ref_paths

REF_REL = "工作区/材料/引用.json"
SCHEMA = "files/material_refs.schema.json"
MAX_REF_FILES = 5000
_FILE_ATTRIBUTE_REPARSE_POINT = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)


def _empty_document() -> dict[str, Any]:
    return {"v": 1, "refs": [], "next_seq": 1}


def _context_items(values: Any) -> tuple[str, ...]:
    if isinstance(values, (str, os.PathLike)):
        values = (values,)
    return tuple(os.fspath(value) for value in values)


def _path_key(path: str) -> str:
    return os.path.normcase(os.path.normpath(path))


def _now_with_timezone() -> str:
    return datetime.now().astimezone().replace(microsecond=0).isoformat()


def _is_link_entry(info: os.stat_result) -> bool:
    return stat.S_ISLNK(info.st_mode) or bool(
        getattr(info, "st_file_attributes", 0) & _FILE_ATTRIBUTE_REPARSE_POINT
    )


def _scan_error(reason: str) -> ApiError:
    details = {
        "ref_scan_unreadable": "所选文件夹无法完整读取，请检查访问权限后重试",
        "ref_scan_metadata": "所选文件夹中的项目无法读取，请检查访问权限后重试",
        "identity_changed": "所选路径在扫描期间发生变化，请重试",
    }
    return ApiError("INVALID_ARGUMENT", reason, detail=details[reason])


def _entry_stat(entry: os.DirEntry[str]) -> os.stat_result:
    try:
        return entry.stat(follow_symlinks=False)
    except OSError:
        error = _scan_error("ref_scan_metadata")
    else:
        error = None
    if error is not None:
        raise error


class RefRegistry:
    """同一案件的引用根登记器。

    ``home``、``appdata``、``system_dirs`` 和 ``other_case_roots`` 必须由调用方显式提供；
    本类不从环境变量、用户目录或注册表推导这些禁区，也不读取候选文件的内容。
    """

    def __init__(
        self,
        case_root: str | os.PathLike[str],
        *,
        home: str | os.PathLike[str],
        appdata: str | os.PathLike[str],
        system_dirs: Iterable[str | os.PathLike[str]],
        other_case_roots: Iterable[str | os.PathLike[str]],
    ) -> None:
        self._root = os.fspath(case_root)
        self._home = os.fspath(home)
        self._appdata = os.fspath(appdata)
        self._system_dirs = _context_items(system_dirs)
        self._other_case_roots = _context_items(other_case_roots)
        self._lock = threading.RLock()

    def _validate_document(self, data: Any) -> dict[str, Any]:
        contracts.validate(SCHEMA, "", data)
        ref_ids: set[str] = set()
        for entry in data["refs"]:
            ref_id = entry["ref_id"]
            if ref_id in ref_ids:
                raise ValueError("refs registry contains a duplicate ref_id")
            ref_ids.add(ref_id)
            if int(ref_id[1:]) >= data["next_seq"]:
                raise ValueError("refs registry next_seq would reuse an existing ref_id")
        return data

    def _load_unlocked(self) -> dict[str, Any]:
        path = gate.resolve_internal(self._root, REF_REL, op="refs_load")
        try:
            raw = path.read_text(encoding="utf-8")
        except FileNotFoundError:
            return _empty_document()
        data = json.loads(raw)
        self._validate_document(data)
        return data

    def load(self) -> dict[str, Any]:
        """读取完整 v1 登记；文件不存在时返回默认文档，且不落盘。"""
        with self._lock:
            return copy.deepcopy(self._load_unlocked())

    def _validate_candidate(self, candidate: str | os.PathLike[str]) -> tuple[str, str, str]:
        canonical = ref_paths.validate_ref_root_path(
            candidate,
            home=self._home,
            appdata=self._appdata,
            system_dirs=self._system_dirs,
            other_case_roots=self._other_case_roots,
        )
        try:
            info = os.lstat(canonical)
        except FileNotFoundError:
            raise ApiError("INVALID_ARGUMENT", "missing") from None
        except OSError:
            raise ApiError("INVALID_ARGUMENT", "metadata") from None
        if _is_link_entry(info):
            raise ApiError("OUT_OF_CASE", "link")
        if stat.S_ISDIR(info.st_mode):
            kind = "dir"
        elif stat.S_ISREG(info.st_mode):
            kind = "file"
        else:
            raise ApiError("INVALID_ARGUMENT", "not_file_or_dir")
        return canonical, kind, _path_key(canonical)

    def _validated_scan_path(self, path: str, expected_kind: str) -> str:
        canonical, kind, _ = self._validate_candidate(path)
        if kind != expected_kind:
            raise _scan_error("identity_changed")
        return canonical

    def _preflight_file(
        self, canonical: str, info: os.stat_result
    ) -> dict[str, tuple[str, os.stat_result]]:
        name = os.path.basename(canonical)
        if name.startswith(".") or detect.is_ignored(name):
            return {}
        if detect.material_type(pathlib.Path(name)) is None:
            return {}
        return {name: (canonical, info)}

    def _preflight_dir(self, root: str) -> dict[str, tuple[str, os.stat_result]]:
        found: dict[str, tuple[str, os.stat_result]] = {}
        stack: list[tuple[str, str]] = [(root, "")]
        supported_count = 0
        while stack:
            directory, prefix = stack.pop()
            directory = self._validated_scan_path(directory, "dir")
            if (
                _path_key(directory) != _path_key(root)
                and not ref_paths._within(root, directory)
            ):
                raise ApiError("OUT_OF_CASE", "identity")
            error = None
            try:
                with os.scandir(directory) as entries:
                    for entry in entries:
                        name = entry.name
                        if name.startswith(".") or detect.is_ignored(name):
                            continue
                        absolute = os.path.join(directory, name)
                        if not ref_paths._within(root, absolute):
                            raise ApiError("OUT_OF_CASE", "identity")
                        info = _entry_stat(entry)
                        if _is_link_entry(info):
                            continue
                        if not prefix and name in gate.WRITABLE_TOP:
                            self._validate_candidate(absolute)
                            continue

                        tail = f"{prefix}{name}"
                        if stat.S_ISDIR(info.st_mode):
                            canonical = self._validated_scan_path(absolute, "dir")
                            if not ref_paths._within(root, canonical):
                                raise ApiError("OUT_OF_CASE", "identity")
                            stack.append((canonical, tail + "/"))
                        elif (
                            stat.S_ISREG(info.st_mode)
                            and detect.material_type(pathlib.Path(name)) is not None
                        ):
                            supported_count += 1
                            if supported_count > MAX_REF_FILES:
                                raise ApiError(
                                    "INVALID_ARGUMENT",
                                    "ref_too_many",
                                    detail="文件太多，请拖具体的子文件夹",
                                )
                            canonical = self._validated_scan_path(absolute, "file")
                            found[tail] = (canonical, info)
            except OSError:
                error = _scan_error("ref_scan_unreadable")
            if error is not None:
                raise error
        return found

    def _preflight_canonical(
        self, canonical: str, expected_kind: str
    ) -> dict[str, tuple[str, os.stat_result]]:
        try:
            info = os.lstat(canonical)
        except OSError:
            error = _scan_error("ref_scan_metadata")
        else:
            error = None
        if error is not None:
            raise error
        if _is_link_entry(info):
            raise ApiError("OUT_OF_CASE", "link")
        kind_matches = (
            expected_kind == "dir" and stat.S_ISDIR(info.st_mode)
        ) or (
            expected_kind == "file" and stat.S_ISREG(info.st_mode)
        )
        if not kind_matches:
            raise _scan_error("identity_changed")
        if expected_kind == "file":
            return self._preflight_file(canonical, info)
        if expected_kind == "dir":
            return self._preflight_dir(canonical)
        raise _scan_error("identity_changed")

    def preflight(
        self, path: str | os.PathLike[str]
    ) -> dict[str, tuple[str, os.stat_result]]:
        """只读枚举一个候选根，返回 ``相对tail -> (绝对路径, lstat)``。

        目录根递归使用栈且不跟随链接；文件根以自身 basename 为 tail。仅纳入
        ``detect.material_type`` 支持的材料，跳过点项和 Office 锁文件。所在目录读不了、
        条目元数据读不了或根类型变化时整批拒绝；单根超过 5000 份支持材料时立即拒绝。
        返回路径仍须在真正打开原件时重新过路径闸门，本方法不承诺消除后续 TOCTOU。
        """
        with self._lock:
            canonical, kind, _ = self._validate_candidate(path)
            return self._preflight_canonical(canonical, kind)

    def register(
        self, paths: str | os.PathLike[str] | Iterable[str | os.PathLike[str]]
    ) -> list[dict[str, Any]]:
        """校验并登记一批引用根，返回与输入顺序对应的条目副本。

        整批候选先全部通过真实路径底座校验，之后才进行去重、编号和一次 Gate 写入。
        同一规范路径的未 removed 记录复用原身份；removed 记录原样保留，新导入分配新编号。
        """
        if isinstance(paths, (str, os.PathLike)):
            inputs = (paths,)
        else:
            inputs = tuple(paths)

        with self._lock:
            document = self._load_unlocked()
            validated: list[tuple[str, str, str]] = []
            unique_candidates: dict[str, tuple[str, str]] = {}
            for candidate in inputs:
                canonical, kind, key = self._validate_candidate(candidate)
                previous = unique_candidates.get(key)
                if previous is not None and previous[1] != kind:
                    raise ApiError("INVALID_ARGUMENT", "identity_changed")
                unique_candidates.setdefault(key, (canonical, kind))
                validated.append((canonical, kind, key))

            # 同规范根只枚举一次；已登记根也按当前文件系统状态重新校验数量。
            for canonical, kind in unique_candidates.values():
                self._preflight_canonical(canonical, kind)

            assigned: dict[str, dict[str, Any]] = {}
            changed = False
            now = _now_with_timezone()
            for key, (canonical, kind) in unique_candidates.items():
                existing = next(
                    (
                        entry
                        for entry in document["refs"]
                        if entry["status"] != "removed" and _path_key(entry["path"]) == key
                    ),
                    None,
                )
                if existing is not None:
                    assigned[key] = existing
                    continue

                seq = int(document["next_seq"])
                entry = {
                    "ref_id": f"R{seq:02d}",
                    "path": canonical,
                    "kind": kind,
                    "status": "ok",
                    "added_at": now,
                    "checked_at": now,
                }
                document["refs"].append(entry)
                document["next_seq"] = seq + 1
                assigned[key] = entry
                changed = True

            result = [copy.deepcopy(assigned[key]) for _, _, key in validated]
            if changed:
                self._validate_document(document)
                payload = json.dumps(document, ensure_ascii=False, indent=2).encode("utf-8")
                gate.write_bytes(self._root, REF_REL, payload, op="refs_write")
            return result

    def update_scan_statuses(
        self, *, ok: Iterable[str], missing: Iterable[str]
    ) -> None:
        """记录一次扫描对已登记根的观察结果；不新增、不删除、不重排引用根。"""
        with self._lock:
            document = self._load_unlocked()
            ok_ids = set(ok)
            missing_ids = set(missing)
            if ok_ids & missing_ids:
                raise ValueError("a reference root cannot be both ok and missing")
            known = {entry["ref_id"] for entry in document["refs"]}
            if not (ok_ids | missing_ids) <= known:
                raise ValueError("scan status contains an unknown ref_id")
            now = _now_with_timezone()
            changed = False
            for entry in document["refs"]:
                ref_id = entry["ref_id"]
                status = "ok" if ref_id in ok_ids else "missing" if ref_id in missing_ids else None
                if status is None or entry["status"] == "removed":
                    continue
                if entry["status"] != status or entry["checked_at"] != now:
                    entry["status"] = status
                    entry["checked_at"] = now
                    changed = True
            if changed:
                self._validate_document(document)
                payload = json.dumps(document, ensure_ascii=False, indent=2).encode("utf-8")
                gate.write_bytes(self._root, REF_REL, payload, op="refs_write")

    def prepare_relocate(
        self, ref_id: str, path: str | os.PathLike[str]
    ) -> dict[str, Any]:
        """只读校验一次引用根重新定位，返回候选枚举但不写登记文件。

        只接受扫描时已标为 ``missing`` 的根；removed 根不得复活，ok 根也不在
        “整体搬家”语义内。候选必须仍与旧根同类型、通过显式四禁区路径校验和
        真实预扫描，且不能占用另一现役根的规范路径。
        """
        try:
            contracts.validate("common.schema.json", "#/$defs/ref_id", ref_id)
        except contracts.ContractError:
            raise ApiError("INVALID_ARGUMENT", "ref_id") from None

        with self._lock:
            document = self._load_unlocked()
            entry = next(
                (ref for ref in document["refs"] if ref["ref_id"] == ref_id),
                None,
            )
            if entry is None:
                raise ApiError("MATERIAL_NOT_FOUND", "ref_not_found")
            if entry["status"] == "removed":
                raise ApiError("MATERIAL_NOT_FOUND", "ref_removed")
            if entry["status"] != "missing":
                raise ApiError("INVALID_ARGUMENT", "ref_not_missing")

            canonical, kind, key = self._validate_candidate(path)
            if kind != entry["kind"]:
                raise ApiError("INVALID_ARGUMENT", "identity_changed")
            if any(
                other["ref_id"] != ref_id
                and other["status"] != "removed"
                and _path_key(other["path"]) == key
                for other in document["refs"]
            ):
                raise ApiError("INVALID_ARGUMENT", "ref_path_conflict")
            children = self._preflight_canonical(canonical, kind)
            return {
                "ref_id": ref_id,
                "path": canonical,
                "kind": kind,
                "children": children,
            }

    def commit_relocate(
        self,
        ref_id: str,
        expected_path: str,
        expected_kind: str,
    ) -> dict[str, Any]:
        """提交已经过身份匹配的重新定位；写前重做路径、类型、上限与冲突校验。"""
        with self._lock:
            document = self._load_unlocked()
            entry = next(
                (ref for ref in document["refs"] if ref["ref_id"] == ref_id),
                None,
            )
            if entry is None:
                raise ApiError("MATERIAL_NOT_FOUND", "ref_not_found")
            if entry["status"] == "removed":
                raise ApiError("MATERIAL_NOT_FOUND", "ref_removed")
            if entry["status"] != "missing":
                raise ApiError("INVALID_ARGUMENT", "ref_not_missing")

            canonical, kind, key = self._validate_candidate(expected_path)
            if (
                kind != expected_kind
                or _path_key(canonical) != _path_key(expected_path)
            ):
                raise ApiError("INVALID_ARGUMENT", "identity_changed")
            if any(
                other["ref_id"] != ref_id
                and other["status"] != "removed"
                and _path_key(other["path"]) == key
                for other in document["refs"]
            ):
                raise ApiError("INVALID_ARGUMENT", "ref_path_conflict")
            self._preflight_canonical(canonical, kind)

            entry.update(path=canonical, status="ok", checked_at=_now_with_timezone())
            self._validate_document(document)
            payload = json.dumps(document, ensure_ascii=False, indent=2).encode("utf-8")
            gate.write_bytes(self._root, REF_REL, payload, op="refs_write")
            return copy.deepcopy(entry)

    def mark_removed(self, ref_ids: Iterable[str]) -> None:
        """把一个或多个根标成 removed；只写登记状态，不访问引用根或外部原件。"""
        with self._lock:
            document = self._load_unlocked()
            removing = set(ref_ids)
            known = {entry["ref_id"] for entry in document["refs"]}
            if not removing <= known:
                raise ValueError("remove status contains an unknown ref_id")
            now = _now_with_timezone()
            changed = False
            for entry in document["refs"]:
                if entry["ref_id"] not in removing or entry["status"] == "removed":
                    continue
                entry["status"] = "removed"
                entry["checked_at"] = now
                changed = True
            if changed:
                self._validate_document(document)
                payload = json.dumps(document, ensure_ascii=False, indent=2).encode("utf-8")
                gate.write_bytes(self._root, REF_REL, payload, op="refs_write")
