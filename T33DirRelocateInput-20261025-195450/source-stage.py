#!/usr/bin/env python3
"""Prepare and verify the fixed T33 relocate fixture without guessing API state."""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import stat
from typing import Any

ALLOWED_BASE = pathlib.Path(
    r"D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\runs"
)
RUN_NAME = re.compile(r"^T33-host-[0-9]{8}-[0-9]{6}$")
MATERIAL_ID = re.compile(r"^M[0-9]{4,}$")
EXPECTED_HEAD = "dc56a93be4b07dbe7a48863e3135351659817fb5"
PREPARED_SCHEMA = "T33-host-entry-prepared-v1"
SOURCE_SCHEMA = "T33-relocate-source-v1"
MOVE_SCHEMA = "T33-relocate-move-v1"
SOURCE_NAME = "relocation-source.jpg"
TARGET_NAME = "relocation-moved.jpg"
REF_ID = "R01"
REF_REL = pathlib.Path("工作区") / "材料" / "引用.json"
INDEX_REL = pathlib.Path("工作区") / "材料" / "index.json"
SOURCE_REL = f"工作区/引用/{REF_ID}/{SOURCE_NAME}"
JPEG_BYTES = 47379
JPEG_HASH = "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
REPARSE_FLAG = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
SPARSE_FLAG = 0x200
HASH_BLOCK = 1024 * 1024
RUNTIME_ROOTS = ("started", "gui", "requests", "serving")


class GuardViolation(RuntimeError):
    pass


def _guard(condition: Any, message: str) -> None:
    if not condition:
        raise GuardViolation(message)


def _canonical(path: str | os.PathLike[str]) -> str:
    return os.path.normcase(os.path.normpath(os.path.abspath(os.fspath(path))))


def _same_path(value: Any, expected: pathlib.Path) -> bool:
    return (
        isinstance(value, str)
        and pathlib.Path(value).is_absolute()
        and _canonical(value) == _canonical(expected)
    )


def _within(root: pathlib.Path, path: pathlib.Path) -> bool:
    try:
        return os.path.commonpath((_canonical(root), _canonical(path))) == _canonical(root)
    except (OSError, ValueError):
        return False


def _is_linkish(path: str | os.PathLike[str]) -> bool:
    info = os.lstat(path)
    is_junction = getattr(os.path, "isjunction", lambda _path: False)
    return (
        stat.S_ISLNK(info.st_mode)
        or bool(getattr(info, "st_file_attributes", 0) & REPARSE_FLAG)
        or is_junction(path)
    )


def _assert_safe_chain(path: pathlib.Path) -> None:
    _guard(path.is_absolute(), f"路径必须是绝对路径：{path}")
    for component in (path, *path.parents):
        try:
            os.lstat(component)
        except FileNotFoundError as exc:
            raise GuardViolation(f"路径组件不存在：{component}") from exc
        _guard(not _is_linkish(component), f"路径组件是链接或重解析点：{component}")


def _safe_directory(path: pathlib.Path) -> os.stat_result:
    _assert_safe_chain(path)
    info = os.lstat(path)
    _guard(stat.S_ISDIR(info.st_mode), f"不是目录：{path}")
    return info


def _safe_regular_file(path: pathlib.Path) -> os.stat_result:
    _assert_safe_chain(path)
    info = os.lstat(path)
    _guard(stat.S_ISREG(info.st_mode), f"不是普通文件：{path}")
    _guard(not (getattr(info, "st_file_attributes", 0) & SPARSE_FLAG), f"文件是稀疏文件：{path}")
    _guard(getattr(info, "st_nlink", 1) == 1, f"文件是硬链接：{path}")
    return info


def _run_root(raw_root: str) -> pathlib.Path:
    root = pathlib.Path(raw_root)
    _guard(root.is_absolute(), "--root 必须是绝对路径")
    root = pathlib.Path(os.path.abspath(root))
    _guard(RUN_NAME.fullmatch(root.name) is not None, "run 根目录名不符合 T33-host-YYYYMMDD-HHMMSS")
    stamp = root.name.removeprefix("T33-host-").replace("-", "")
    _guard(1 <= int(stamp[4:6]) <= 12, "run 根目录月份无效")
    _guard(1 <= int(stamp[6:8]) <= 31, "run 根目录日期无效")
    _guard(0 <= int(stamp[8:10]) <= 23, "run 根目录小时无效")
    _guard(0 <= int(stamp[10:12]) <= 59, "run 根目录分钟无效")
    _guard(0 <= int(stamp[12:14]) <= 59, "run 根目录秒数无效")
    _guard(_canonical(root.parent) == _canonical(ALLOWED_BASE), "run 根目录不是允许基座的直接子目录")
    _safe_directory(root)
    return root


def _paths(root: pathlib.Path) -> tuple[pathlib.Path, pathlib.Path, pathlib.Path]:
    input_dir = root / "input"
    case_dir = root / "case"
    ready_dir = input_dir / "ready"
    _safe_directory(input_dir)
    _safe_directory(case_dir)
    _safe_directory(ready_dir)
    return input_dir, case_dir, ready_dir


def _read_json(path: pathlib.Path, label: str) -> dict[str, Any]:
    _safe_regular_file(path)
    try:
        with open(path, "r", encoding="utf-8") as stream:
            value = json.load(stream)
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise GuardViolation(f"{label} 不是有效 JSON") from exc
    _guard(isinstance(value, dict), f"{label} 顶层必须是对象")
    return value


def _hash_file(path: pathlib.Path) -> tuple[str, os.stat_result]:
    before = _safe_regular_file(path)
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        while True:
            block = stream.read(HASH_BLOCK)
            if not block:
                break
            digest.update(block)
    after = _safe_regular_file(path)
    identity_before = (
        before.st_size,
        before.st_mtime_ns,
        getattr(before, "st_ino", None),
    )
    identity_after = (
        after.st_size,
        after.st_mtime_ns,
        getattr(after, "st_ino", None),
    )
    _guard(identity_before == identity_after, f"文件在读取期间发生变化：{path}")
    return digest.hexdigest(), after


def _file_record(path: pathlib.Path) -> dict[str, Any]:
    digest, info = _hash_file(path)
    return {
        "path": str(path),
        "canonical": _canonical(path),
        "bytes": info.st_size,
        "hash": digest,
        "mtime_ns": info.st_mtime_ns,
    }


def _path_record(path: pathlib.Path) -> dict[str, str]:
    return {"path": str(path), "canonical": _canonical(path)}


def _check_path_record(value: Any, expected: pathlib.Path, label: str) -> None:
    _guard(isinstance(value, dict), f"{label} 不是对象")
    _guard(_same_path(value.get("path"), expected), f"{label}.path 不是当前规范路径")
    _guard(_same_path(value.get("canonical"), expected), f"{label}.canonical 不是当前规范路径")


def _check_file_record(
    value: Any,
    expected_path: pathlib.Path,
    label: str,
    *,
    expected_bytes: int | None = None,
    expected_hash: str | None = None,
) -> None:
    _guard(isinstance(value, dict), f"{label} 不是对象")
    _guard(_same_path(value.get("path"), expected_path), f"{label}.path 不符")
    _guard(_same_path(value.get("canonical"), expected_path), f"{label}.canonical 不符")
    current = _file_record(expected_path)
    for key in ("bytes", "hash", "mtime_ns"):
        _guard(value.get(key) == current[key], f"{label}.{key} 已变化")
    if expected_bytes is not None:
        _guard(current["bytes"] == expected_bytes, f"{label} 当前字节数不符")
    if expected_hash is not None:
        _guard(current["hash"] == expected_hash, f"{label} 当前 hash 不符")


def _write_new_json(path: pathlib.Path, value: dict[str, Any]) -> None:
    _guard(not os.path.lexists(path), f"{path.name} 已存在")
    with open(path, "x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


def _prepared(root: pathlib.Path, case_dir: pathlib.Path, ready_dir: pathlib.Path) -> tuple[dict[str, Any], dict[str, Any], pathlib.Path]:
    path = root / "prepared.json"
    value = _read_json(path, "prepared.json")
    _guard(value.get("format") == PREPARED_SCHEMA, "prepared.json format 不符")
    _guard(value.get("expected_head") == EXPECTED_HEAD, "prepared.json expected_head 不符")
    paths = value.get("paths")
    _guard(isinstance(paths, dict), "prepared.json paths 不是对象")
    for name, expected in (("root", root), ("case", case_dir), ("ready", ready_dir)):
        _check_path_record(paths.get(name), expected, f"prepared.paths.{name}")

    fixture = value.get("fixture")
    _guard(isinstance(fixture, dict), "prepared.json fixture 不是对象")
    copy_path = fixture.get("copy_path")
    _guard(isinstance(copy_path, str) and pathlib.Path(copy_path).is_absolute(), "prepared fixture.copy_path 不是绝对路径")
    jpeg_path = pathlib.Path(copy_path)
    _guard(_canonical(jpeg_path.parent) == _canonical(ready_dir), "原 JPEG 不在 ready 目录")
    _guard(fixture.get("copy_bytes") == JPEG_BYTES, "prepared fixture.copy_bytes 不符")
    _guard(fixture.get("copy_sha256") == JPEG_HASH, "prepared fixture.copy_sha256 不符")
    _guard(_same_path(fixture.get("copy_canonical"), jpeg_path), "prepared fixture.copy_canonical 不符")
    current_jpeg = _file_record(jpeg_path)
    _guard(fixture.get("copy_bytes") == current_jpeg["bytes"], "prepared fixture 当前字节数不符")
    _guard(fixture.get("copy_sha256") == current_jpeg["hash"], "prepared fixture 当前 hash 不符")
    _guard(current_jpeg["bytes"] == JPEG_BYTES, "原 JPEG 当前字节数不符")
    _guard(current_jpeg["hash"] == JPEG_HASH, "原 JPEG 当前 hash 不符")
    return value, _file_record(path), jpeg_path


def _creation_shape(root: pathlib.Path) -> None:
    expected = {"case", "input", "private", "prepared.json"}
    actual = {entry.name for entry in root.iterdir()}
    _guard(actual == expected, f"create 前 run 顶层集合不符：{sorted(actual)}")
    _guard(not any(name.casefold().startswith(RUNTIME_ROOTS) for name in actual), "create 前已有 runtime 工件")


def _copy_source(original: pathlib.Path, source: pathlib.Path) -> None:
    before = _file_record(original)
    _guard(not os.path.lexists(source), "relocation-source.jpg 已存在")
    with open(original, "rb") as reader, open(source, "xb") as writer:
        while True:
            block = reader.read(HASH_BLOCK)
            if not block:
                break
            writer.write(block)
        writer.flush()
        os.fsync(writer.fileno())
    added = _file_record(source)
    _guard(added["bytes"] == JPEG_BYTES, "新私有源字节数不符")
    _guard(added["hash"] == JPEG_HASH, "新私有源 SHA-256 不符")
    _guard(_file_record(original) == before, "复制后原 JPEG 身份改变")


def create(raw_root: str) -> pathlib.Path:
    root = _run_root(raw_root)
    _creation_shape(root)
    _input_dir, case_dir, ready_dir = _paths(root)
    _guard(not any(case_dir.iterdir()), "create 前 case 目录不是空的")
    prepared_value, prepared_record, original_path = _prepared(root, case_dir, ready_dir)
    del prepared_value

    ready_entries = list(ready_dir.iterdir())
    _guard(len(ready_entries) == 1, "create 前 ready 必须只含原 JPEG")
    _guard(_canonical(ready_entries[0]) == _canonical(original_path), "ready 唯一文件不是 prepared 声明的原 JPEG")
    _guard(not _is_linkish(original_path), "原 JPEG 是链接或重解析点")
    original_record = _file_record(original_path)

    source = ready_dir / SOURCE_NAME
    target = ready_dir / TARGET_NAME
    source_manifest = root / "relocation-source.json"
    _guard(not os.path.lexists(source), "relocation-source.jpg 已存在")
    _guard(not os.path.lexists(target), "relocation-moved.jpg 已存在")
    _guard(not os.path.lexists(source_manifest), "relocation-source.json 已存在")
    _guard(not _within(case_dir, source), "新私有源不得位于 case")

    _copy_source(original_path, source)
    source_record = _file_record(source)
    _guard(not any(case_dir.iterdir()), "创建后 case 目录不是空的")
    _guard(_file_record(original_path) == original_record, "创建后原 JPEG 身份改变")
    _guard(_file_record(root / "prepared.json") == prepared_record, "创建后 prepared.json 身份改变")

    manifest = {
        "schema": SOURCE_SCHEMA,
        "run_root": _path_record(root),
        "case": _path_record(case_dir),
        "ready": _path_record(ready_dir),
        "source_path": _path_record(source),
        "target_path": _path_record(target),
        "original_prepared": prepared_record,
        "original_jpeg": original_record,
        "source": source_record,
        "provenance": {
            "newly_copied_private_source": True,
            "external_to_case": True,
        },
    }
    _write_new_json(source_manifest, manifest)
    return source_manifest


def _source_manifest(root: pathlib.Path, case_dir: pathlib.Path, ready_dir: pathlib.Path) -> tuple[dict[str, Any], dict[str, Any], pathlib.Path, pathlib.Path]:
    path = root / "relocation-source.json"
    value = _read_json(path, "relocation-source.json")
    _guard(value.get("schema") == SOURCE_SCHEMA, "relocation-source.json schema 不符")
    _check_path_record(value.get("run_root"), root, "source.run_root")
    _check_path_record(value.get("case"), case_dir, "source.case")
    _check_path_record(value.get("ready"), ready_dir, "source.ready")
    source = ready_dir / SOURCE_NAME
    target = ready_dir / TARGET_NAME
    _check_path_record(value.get("source_path"), source, "source.source_path")
    _check_path_record(value.get("target_path"), target, "source.target_path")
    provenance = value.get("provenance")
    _guard(isinstance(provenance, dict), "source.provenance 不是对象")
    _guard(provenance.get("newly_copied_private_source") is True, "未声明新复制私有源")
    _guard(provenance.get("external_to_case") is True, "未声明源位于 case 外")
    _check_file_record(value.get("original_prepared"), root / "prepared.json", "source.original_prepared")
    original_record = value.get("original_jpeg")
    _guard(isinstance(original_record, dict), "source.original_jpeg 不是对象")
    original_path = original_record.get("path")
    _guard(isinstance(original_path, str) and pathlib.Path(original_path).is_absolute(), "source.original_jpeg.path 不是绝对路径")
    _guard(_canonical(pathlib.Path(original_path).parent) == _canonical(ready_dir), "原 JPEG 不在 ready 目录")
    _check_file_record(
        original_record,
        pathlib.Path(original_path),
        "source.original_jpeg",
        expected_bytes=JPEG_BYTES,
        expected_hash=JPEG_HASH,
    )
    return value, _file_record(path), source, target


def _registered_identity(
    case_dir: pathlib.Path,
    source: pathlib.Path,
) -> dict[str, dict[str, Any]]:
    refs_path = case_dir / REF_REL
    index_path = case_dir / INDEX_REL
    refs = _read_json(refs_path, "引用.json")
    index = _read_json(index_path, "index.json")
    _guard(refs.get("v") == 1, "引用.json 版本不符")
    ref_entries = refs.get("refs")
    _guard(isinstance(ref_entries, list), "引用.json refs 不是数组")
    matches = [
        item
        for item in ref_entries
        if isinstance(item, dict) and item.get("ref_id") == REF_ID
    ]
    _guard(len(matches) == 1, "引用.json 必须恰有一个 R01")
    ref = matches[0]
    _guard(_same_path(ref.get("path"), source), "R01 path 不是当前 relocation-source.jpg")
    _guard(ref.get("kind") == "file", "R01 kind 不是 file")
    _guard(ref.get("status") == "ok", "R01 尚未由真实 API 登记为 ok")

    _guard(index.get("v") == 1, "index.json 版本不符")
    materials = index.get("materials")
    _guard(isinstance(materials, list), "index.json materials 不是数组")
    found = [
        item
        for item in materials
        if isinstance(item, dict)
        and item.get("origin") == "ref"
        and item.get("ref_id") == REF_ID
        and item.get("rel_path") == SOURCE_REL
    ]
    _guard(len(found) == 1, "index.json 必须恰有一份 R01 源材料")
    material = found[0]
    _guard(isinstance(material.get("material_id"), str) and MATERIAL_ID.fullmatch(material["material_id"]) is not None, "R01 material_id 不符")
    _guard(material.get("status") == "needs_ocr", "R01 材料状态不是待识别")
    _guard(material.get("sha256") == JPEG_HASH, "R01 材料 SHA-256 不符")
    _guard(material.get("size") == JPEG_BYTES, "R01 材料字节数不符")
    return {
        "refs": _file_record(refs_path),
        "index": _file_record(index_path),
        "ref": ref,
        "material": material,
    }


def _gui_running(root: pathlib.Path) -> dict[str, Any]:
    started = root / "started.json"
    current = root / "gui" / "state" / "current.json"
    _safe_regular_file(started)
    state = _read_json(current, "gui/state/current.json")
    _guard(isinstance(state.get("runRoot"), str), "GUI current.runRoot 缺失")
    _guard(_same_path(state.get("runRoot"), root), "GUI current.runRoot 不是当前 run")
    _guard(state.get("phase") == "running", "GUI current.phase 不是 running")
    return {"started": _file_record(started), "current": _file_record(current)}


def move(raw_root: str) -> pathlib.Path:
    root = _run_root(raw_root)
    _input_dir, case_dir, ready_dir = _paths(root)
    source_manifest, source_manifest_record, source, target = _source_manifest(
        root, case_dir, ready_dir
    )
    move_manifest = root / "relocation-move.json"
    _guard(not os.path.lexists(move_manifest), "relocation-move.json 已存在，禁止自动重复")
    _guard(os.path.lexists(source), "原 relocation-source.jpg 不存在")
    _guard(not os.path.lexists(target), "目标 relocation-moved.jpg 已存在，禁止覆盖")
    source_record = _file_record(source)
    _guard(source_record == source_manifest.get("source"), "新私有源当前身份与 create sidecar 不符")
    _guard(source_record["bytes"] == JPEG_BYTES, "新私有源字节数不符")
    _guard(source_record["hash"] == JPEG_HASH, "新私有源 SHA-256 不符")

    registered = _registered_identity(case_dir, source)
    gui = _gui_running(root)
    prepared_record = _file_record(root / "prepared.json")
    original_record = _file_record(pathlib.Path(source_manifest["original_jpeg"]["path"]))
    _guard(prepared_record == source_manifest.get("original_prepared"), "prepared.json 未保持 create 时身份")
    _guard(original_record == source_manifest.get("original_jpeg"), "原 JPEG 未保持 create 时身份")

    _guard(not os.path.lexists(target), "改名目标在提交前出现")
    os.rename(source, target)
    moved_record = _file_record(target)
    _guard(not os.path.lexists(source), "改名后原名仍存在")
    _guard(moved_record["bytes"] == source_record["bytes"], "改名后字节数改变")
    _guard(moved_record["hash"] == source_record["hash"], "改名后 SHA-256 改变")
    _guard(moved_record["mtime_ns"] == source_record["mtime_ns"], "改名后 mtime 改变")
    _guard(_file_record(root / "prepared.json") == prepared_record, "改名触及 prepared.json")
    _guard(_file_record(pathlib.Path(source_manifest["original_jpeg"]["path"])) == original_record, "改名触及原 JPEG")
    _guard(_file_record(root / "relocation-source.json") == source_manifest_record, "改名触及 source sidecar")
    _guard(_file_record(case_dir / REF_REL) == registered["refs"], "改名触及 引用.json")
    _guard(_file_record(case_dir / INDEX_REL) == registered["index"], "改名触及 index.json")

    manifest = {
        "schema": MOVE_SCHEMA,
        "run_root": _path_record(root),
        "ready": _path_record(ready_dir),
        "ref_id": REF_ID,
        "material_id": registered["material"]["material_id"],
        "before": source_record,
        "after": moved_record,
        "unchanged": {
            "source_manifest": source_manifest_record,
            "prepared": prepared_record,
            "original_jpeg": original_record,
            "refs": registered["refs"],
            "index": registered["index"],
            "gui_started": gui["started"],
            "gui_current": gui["current"],
        },
    }
    _write_new_json(move_manifest, manifest)
    return move_manifest


def _verify_move_manifest(
    root: pathlib.Path,
    ready_dir: pathlib.Path,
    source_manifest: dict[str, Any],
    source: pathlib.Path,
    target: pathlib.Path,
) -> None:
    path = root / "relocation-move.json"
    value = _read_json(path, "relocation-move.json")
    _guard(value.get("schema") == MOVE_SCHEMA, "relocation-move.json schema 不符")
    _check_path_record(value.get("run_root"), root, "move.run_root")
    _check_path_record(value.get("ready"), ready_dir, "move.ready")
    _guard(value.get("ref_id") == REF_ID, "move.ref_id 不是 R01")
    _guard(isinstance(value.get("material_id"), str) and MATERIAL_ID.fullmatch(value["material_id"]) is not None, "move.material_id 不符")
    _guard(value.get("before") == source_manifest.get("source"), "move.before 与 create source 记录不符")
    _check_file_record(value.get("after"), target, "move.after", expected_bytes=JPEG_BYTES, expected_hash=JPEG_HASH)
    for key in ("bytes", "hash", "mtime_ns"):
        _guard(value["after"].get(key) == value["before"].get(key), f"move.{key} 未保持")
    unchanged = value.get("unchanged")
    _guard(isinstance(unchanged, dict), "move.unchanged 不是对象")
    _check_file_record(
        unchanged.get("source_manifest"),
        root / "relocation-source.json",
        "move.unchanged.source_manifest",
    )
    _check_file_record(
        unchanged.get("prepared"),
        root / "prepared.json",
        "move.unchanged.prepared",
    )
    _check_file_record(
        unchanged.get("original_jpeg"),
        pathlib.Path(source_manifest["original_jpeg"]["path"]),
        "move.unchanged.original_jpeg",
        expected_bytes=JPEG_BYTES,
        expected_hash=JPEG_HASH,
    )
    _guard(not os.path.lexists(source), "移动态原 relocation-source.jpg 仍存在")


def _ready_set(ready_dir: pathlib.Path, expected: tuple[pathlib.Path, ...]) -> None:
    actual = {_canonical(entry) for entry in ready_dir.iterdir()}
    wanted = {_canonical(entry) for entry in expected}
    _guard(actual == wanted, "ready 文件集合与声明状态不符")


def verify(raw_root: str) -> tuple[pathlib.Path, str]:
    root = _run_root(raw_root)
    _input_dir, case_dir, ready_dir = _paths(root)
    source_manifest, _source_manifest_record, source, target = _source_manifest(
        root, case_dir, ready_dir
    )
    original = pathlib.Path(source_manifest["original_jpeg"]["path"])
    _check_file_record(
        source_manifest.get("original_jpeg"),
        original,
        "source.original_jpeg",
        expected_bytes=JPEG_BYTES,
        expected_hash=JPEG_HASH,
    )

    move_manifest = root / "relocation-move.json"
    if os.path.lexists(move_manifest):
        _guard(os.path.lexists(target), "移动态目标不存在")
        _guard(not os.path.lexists(source), "移动态原 relocation-source.jpg 仍存在")
        _verify_move_manifest(
            root, ready_dir, source_manifest, source, target
        )
        _ready_set(ready_dir, (original, target))
        state = "move"
    else:
        _guard(os.path.lexists(source), "创建态 relocation-source.jpg 不存在")
        _guard(not os.path.lexists(target), "创建态 relocation-moved.jpg 已出现")
        _guard(not any(case_dir.iterdir()), "创建态 case 目录不是空的")
        _check_file_record(
            source_manifest.get("source"),
            source,
            "source.source",
            expected_bytes=JPEG_BYTES,
            expected_hash=JPEG_HASH,
        )
        _ready_set(ready_dir, (original, source))
        state = "create"
    return root / "relocation-source.json", state


def main() -> int:
    parser = argparse.ArgumentParser(description="T33 fixed relocate source stage")
    parser.add_argument("--root", required=True)
    stage = parser.add_mutually_exclusive_group(required=True)
    stage.add_argument("--create", action="store_true")
    stage.add_argument("--move", action="store_true")
    stage.add_argument("--verify", action="store_true")
    args = parser.parse_args()
    try:
        if args.create:
            result, state = create(args.root), "create"
        elif args.move:
            result, state = move(args.root), "move"
        else:
            result, state = verify(args.root)
    except GuardViolation as exc:
        raise SystemExit(f"GUARD: {exc}") from None
    print(f"OK: state={state}; sidecar={result}; not GUI acceptance")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
