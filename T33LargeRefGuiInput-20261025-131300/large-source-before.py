#!/usr/bin/env python3
"""T33 一次性真实文件有限核查准备件；本文件在准备阶段不执行。

运行时只写显式指定的全新 ``runs/T33-real-YYYYMMDD-HHMMSS`` 目录，调用当前 B
工作树中的真实 ``CaseRegistry``、``Materials.import_``、``scan`` 和 ``list``。
不启动 HTTP、app lifespan、事件循环、线程或子进程，不访问网络或凭据存储。
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import platform
import re
import shutil
import socket
import stat
import subprocess
import sys
import threading
import time
import types
from typing import Any


REPO_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
SERVICE_DIR = REPO_ROOT / "service"
CONTRACTS_DIR = REPO_ROOT / "contracts"
EVIDENCE_DIR = REPO_ROOT / "docs" / "plan" / "evidence" / "T33"
PREP_DIR = EVIDENCE_DIR / "真实文件有限验证准备-20261025-081905"
RUNS_ROOT = PREP_DIR / "runs"
FIXTURE = pathlib.Path(r"D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg")
EXPECTED_FIXTURE_BYTES = 47379
EXPECTED_FIXTURE_SHA256 = "FEEB9FAF008BFFB8BDEA5977D7FFD269DE1177D81B160E1883BA456F186059AD"
BIG_BYTES = 104857600
RUN_NAME = re.compile(r"^T33-real-[0-9]{8}-[0-9]{6}$")
_FILE_ATTRIBUTE_REPARSE_POINT = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)

SOURCE_PATHS = (
    REPO_ROOT / "service" / "lawbench" / "case" / "materials.py",
    REPO_ROOT / "service" / "lawbench" / "case" / "registry.py",
    REPO_ROOT / "service" / "lawbench" / "case" / "refs.py",
    REPO_ROOT / "service" / "lawbench" / "case" / "ref_paths.py",
    REPO_ROOT / "service" / "lawbench" / "case" / "gate.py",
    REPO_ROOT / "service" / "lawbench" / "api" / "ui.py",
    CONTRACTS_DIR / "case_db.sql",
)

_RUN_ROOT: pathlib.Path | None = None
_PRODUCT_ACTIVE = False
_DISCOVERY_ALLOW: tuple[pathlib.Path, ...] = ()


class GuardViolation(RuntimeError):
    """运行期外围被明确拒绝。"""


def _norm(path: str | os.PathLike[str]) -> str:
    """只把标准盘符/UNC 长路径前缀还原成同一条普通路径。"""
    value = os.fspath(path)
    if isinstance(value, str):
        if value.startswith("\\\\?\\UNC\\"):
            value = "\\\\" + value[8:]
        elif value.startswith("\\\\?\\") and re.fullmatch(r"[A-Za-z]:\\", value[4:7]):
            value = value[4:]
    return os.path.normcase(os.path.normpath(os.path.abspath(value)))


def _within(root: pathlib.Path, candidate: str | os.PathLike[str]) -> bool:
    try:
        return os.path.commonpath((_norm(root), _norm(candidate))) == _norm(root)
    except (OSError, ValueError):
        return False


def _is_link(path: str | os.PathLike[str]) -> bool:
    try:
        info = os.lstat(path)
    except FileNotFoundError:
        return False
    return stat.S_ISLNK(info.st_mode) or bool(
        getattr(info, "st_file_attributes", 0) & _FILE_ATTRIBUTE_REPARSE_POINT
    )


def _check_no_reparse_chain(path: pathlib.Path, *, include_missing_tail: bool) -> None:
    parts = pathlib.PureWindowsPath(str(path)).parts
    current = parts[0]
    for component in parts[1:]:
        current = os.path.join(current, component)
        if not os.path.lexists(current):
            if include_missing_tail:
                continue
            raise GuardViolation(f"必需路径不存在：{current}")
        if _is_link(current):
            raise GuardViolation(f"拒绝重解析点：{current}")


def _sha256(path: pathlib.Path) -> str:
    if _is_link(path):
        raise GuardViolation(f"拒绝读取链接：{path}")
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def _metadata(path: pathlib.Path) -> dict[str, Any]:
    info = os.lstat(path)
    return {
        "path": str(path),
        "bytes": info.st_size,
        "sha256": _sha256(path) if stat.S_ISREG(info.st_mode) else None,
        "mtime_ns": info.st_mtime_ns,
    }


def _line_count(path: pathlib.Path) -> int:
    with open(path, "rb") as stream:
        return sum(1 for _ in stream)


def _tree_inventory(root: pathlib.Path) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    if root.exists():
        stack = [root]
        while stack:
            directory = stack.pop()
            if _is_link(directory):
                raise GuardViolation(f"证据树内拒绝链接：{directory}")
            with os.scandir(directory) as entries:
                for entry in entries:
                    info = entry.stat(follow_symlinks=False)
                    if stat.S_ISLNK(info.st_mode) or bool(
                        getattr(info, "st_file_attributes", 0) & _FILE_ATTRIBUTE_REPARSE_POINT
                    ):
                        raise GuardViolation(f"证据树内拒绝重解析点：{entry.path}")
                    if stat.S_ISDIR(info.st_mode):
                        stack.append(pathlib.Path(entry.path))
                    elif stat.S_ISREG(info.st_mode):
                        files.append(
                            {
                                "relative_path": pathlib.Path(entry.path).relative_to(root).as_posix(),
                                "bytes": info.st_size,
                                "sha256": _sha256(pathlib.Path(entry.path)),
                                "mtime_ns": info.st_mtime_ns,
                            }
                        )
    files.sort(key=lambda item: item["relative_path"])
    return {
        "files": len(files),
        "bytes": sum(item["bytes"] for item in files),
        "items": files,
    }


def _tree_totals(root: pathlib.Path) -> dict[str, int]:
    files = 0
    directories = 0
    total = 0
    if root.exists():
        stack = [root]
        while stack:
            directory = stack.pop()
            if _is_link(directory):
                raise GuardViolation(f"量测路径含重解析点：{directory}")
            directories += 1
            with os.scandir(directory) as entries:
                for entry in entries:
                    info = entry.stat(follow_symlinks=False)
                    if stat.S_ISLNK(info.st_mode) or bool(
                        getattr(info, "st_file_attributes", 0) & _FILE_ATTRIBUTE_REPARSE_POINT
                    ):
                        raise GuardViolation(f"量测路径含重解析点：{entry.path}")
                    if stat.S_ISDIR(info.st_mode):
                        stack.append(pathlib.Path(entry.path))
                    elif stat.S_ISREG(info.st_mode):
                        files += 1
                        total += info.st_size
    return {"files": files, "directories": directories, "bytes": total}


def _case_zones(case_root: pathlib.Path) -> dict[str, dict[str, int]]:
    zones: dict[str, dict[str, int]] = {}
    if case_root.exists():
        with os.scandir(case_root) as entries:
            for entry in entries:
                if entry.is_dir(follow_symlinks=False):
                    zones[entry.name] = _tree_totals(pathlib.Path(entry.path))
    return dict(sorted(zones.items()))


def _zone_growth(
    before: dict[str, dict[str, int]], after: dict[str, dict[str, int]]
) -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for name in sorted(set(before) | set(after)):
        old = before.get(name, {"files": 0, "directories": 0, "bytes": 0})
        new = after.get(name, {"files": 0, "directories": 0, "bytes": 0})
        result[name] = {
            "bytes_before": old["bytes"],
            "bytes_after": new["bytes"],
            "bytes_delta": new["bytes"] - old["bytes"],
            "files_before": old["files"],
            "files_after": new["files"],
            "files_delta": new["files"] - old["files"],
        }
    return result


def _sql_totals(case_root: pathlib.Path) -> dict[str, Any]:
    work = case_root / "工作区"
    files: list[dict[str, Any]] = []
    if work.exists():
        with os.scandir(work) as entries:
            for entry in entries:
                if entry.is_file(follow_symlinks=False) and entry.name.startswith("case.db"):
                    files.append(_metadata(pathlib.Path(entry.path)))
    return {"bytes": sum(item["bytes"] for item in files), "files": sorted(files, key=lambda x: x["path"])}


def _file_metric(path: pathlib.Path) -> dict[str, Any]:
    if not path.exists():
        return {"path": str(path), "exists": False, "bytes": 0, "sha256": None}
    item = _metadata(path)
    return {"path": str(path), "exists": True, "bytes": item["bytes"], "sha256": item["sha256"]}


def _write_json(path: pathlib.Path, value: Any) -> None:
    if _RUN_ROOT is None or not _within(_RUN_ROOT, path):
        raise GuardViolation(f"拒绝写到运行根外：{path}")
    with open(path, "x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")


def _audit(event: str, args: tuple[Any, ...]) -> None:
    denied_prefixes = (
        "socket.",
        "subprocess.",
        "os.system",
        "os.posix_spawn",
        "os.spawn",
        "_thread.start_new_thread",
    )
    if event.startswith(denied_prefixes):
        raise GuardViolation(f"运行期外围拒绝：{event}")
    if not _PRODUCT_ACTIVE or event not in ("os.scandir", "os.listdir"):
        return
    if not args or not isinstance(args[0], (str, bytes, os.PathLike)):
        raise GuardViolation(f"拒绝无路径目录发现：{event}")
    candidate = os.fsdecode(args[0])
    if _RUN_ROOT is not None and _within(_RUN_ROOT, candidate):
        return
    if any(_within(allowed, candidate) for allowed in _DISCOVERY_ALLOW):
        return
    raise GuardViolation(f"拒绝越界目录发现：{event}:{candidate}")


def _credential_denied(*_args: Any, **_kwargs: Any) -> None:
    raise GuardViolation("运行期拒绝凭据访问")


def _set_private_environment(root: pathlib.Path) -> dict[str, str]:
    private = {
        "home": root / "private" / "home",
        "appdata": root / "private" / "appdata",
        "system": root / "private" / "system",
        "temp": root / "private" / "temp",
    }
    for path in private.values():
        path.mkdir(parents=True, exist_ok=False)
    for name in list(os.environ):
        upper = name.upper()
        if name.startswith("LB_") or any(word in upper for word in ("KEY", "TOKEN", "PASSWORD", "SECRET")):
            os.environ.pop(name, None)
    for name in ("OneDrive", "OneDriveCommercial", "OneDriveConsumer"):
        os.environ.pop(name, None)
    os.environ.update(
        {
            "HOME": str(private["home"]),
            "USERPROFILE": str(private["home"]),
            "APPDATA": str(private["appdata"]),
            "LOCALAPPDATA": str(private["appdata"]),
            "TEMP": str(private["temp"]),
            "TMP": str(private["temp"]),
            "LB_APPDATA": str(private["appdata"]),
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONPATH": str(SERVICE_DIR),
        }
    )
    sys.dont_write_bytecode = True
    keyring = types.ModuleType("keyring")
    keyring.get_password = _credential_denied
    keyring.set_password = _credential_denied
    keyring.delete_password = _credential_denied
    keyring.get_credential = _credential_denied
    keyring.__getattr__ = _credential_denied
    sys.modules["keyring"] = keyring
    return {name: str(path) for name, path in private.items()}


def _install_runtime_guards(root: pathlib.Path) -> None:
    global _RUN_ROOT, _DISCOVERY_ALLOW
    _RUN_ROOT = root
    allow = {root, REPO_ROOT, CONTRACTS_DIR, pathlib.Path(sys.prefix), pathlib.Path(sys.base_prefix)}
    allow.add(pathlib.Path(sys.executable).resolve().parent)
    for item in sys.path:
        if item:
            candidate = pathlib.Path(item)
            if candidate.is_absolute() and candidate.exists():
                allow.add(candidate.resolve())
    _DISCOVERY_ALLOW = tuple(sorted(allow, key=lambda path: str(path).casefold()))
    sys.addaudithook(_audit)


def _fixed_platform_uname() -> platform.uname_result:
    return platform.uname_result("Windows", "T33-SYNTHETIC", "", "", "")


def _install_synthetic_platform_identity() -> None:
    # pypdfium2_raw 只以 platform.system() 判断 BSD，不读取真实主机名或系统身份。
    platform.uname = _fixed_platform_uname


def _source_identities() -> dict[str, dict[str, Any]]:
    identities: dict[str, dict[str, Any]] = {}
    for path in SOURCE_PATHS:
        identities[path.relative_to(REPO_ROOT).as_posix()] = {
            "path": str(path),
            "bytes": path.stat().st_size,
            "sha256": _sha256(path),
            "lines": _line_count(path),
        }
    return identities


def _create_big_bmp(path: pathlib.Path) -> None:
    if path.exists():
        raise GuardViolation(f"合成文件目标已存在：{path}")
    offset = 56
    stride = 4
    if (BIG_BYTES - offset) % stride:
        raise AssertionError("BMP 尺寸不可整除")
    height = (BIG_BYTES - offset) // stride
    import struct

    header = struct.pack(
        "<2sIHHI IiiHHIIiiII",
        b"BM",
        BIG_BYTES,
        0,
        0,
        offset,
        40,
        1,
        height,
        1,
        24,
        0,
        BIG_BYTES - offset,
        2835,
        2835,
        0,
        0,
    )
    if len(header) != 54:
        raise AssertionError("BMP 头长度错误")
    block = b"\0" * (1024 * 1024)
    remaining = BIG_BYTES
    with open(path, "xb") as stream:
        stream.write(header)
        stream.write(b"\0\0")
        remaining -= offset
        while remaining:
            chunk = block if remaining >= len(block) else block[:remaining]
            stream.write(chunk)
            remaining -= len(chunk)
        stream.flush()
        os.fsync(stream.fileno())
    if path.stat().st_size != BIG_BYTES:
        raise AssertionError("BMP 物理大小不等于 104857600")


def _validate_root(raw_root: str) -> pathlib.Path:
    root = pathlib.Path(raw_root)
    if not root.is_absolute():
        raise GuardViolation("--root 必须是绝对路径")
    if os.path.normcase(os.path.normpath(str(root.parent))) != os.path.normcase(
        os.path.normpath(str(RUNS_ROOT))
    ):
        raise GuardViolation("--root 必须是固定 runs 根的直接子目录")
    if not RUN_NAME.fullmatch(root.name):
        raise GuardViolation("--root 目录名必须为 T33-real-YYYYMMDD-HHMMSS")
    if os.path.lexists(root):
        raise GuardViolation("--root 已存在；拒绝覆盖或复用")
    _check_no_reparse_chain(root, include_missing_tail=True)
    return root


def _run(root: pathlib.Path) -> dict[str, Any]:
    global _PRODUCT_ACTIVE, _RUN_ROOT
    started_at = time.time()
    _RUN_ROOT = root
    root.mkdir(parents=True, exist_ok=False)
    private = _set_private_environment(root)
    _install_runtime_guards(root)
    _install_synthetic_platform_identity()

    if not FIXTURE.is_file() or _is_link(FIXTURE):
        raise GuardViolation("固定 JPEG fixture 不存在或为链接")
    fixture_before = _metadata(FIXTURE)
    if fixture_before["bytes"] != EXPECTED_FIXTURE_BYTES or fixture_before["sha256"] != EXPECTED_FIXTURE_SHA256:
        raise GuardViolation("固定 JPEG fixture 的大小或 SHA-256 与执行令不符")

    source_identities = _source_identities()
    external = root / "external-100MiB"
    external.mkdir()
    big_path = external / "合成引用材料-100MiB.bmp"
    _create_big_bmp(big_path)
    external_before = _tree_inventory(external)
    if external_before["bytes"] != BIG_BYTES or external_before["files"] != 1:
        raise AssertionError("外部合成文件夹不是单个 104857600 字节文件")

    sys.path.insert(0, str(SERVICE_DIR))
    from lawbench import contracts, logs
    from lawbench.case.materials import Materials
    from lawbench.case.registry import CaseRegistry

    contracts.set_contracts_dir(CONTRACTS_DIR)
    log_dir = logs.setup(pathlib.Path(private["appdata"]))

    def converter_denied(*_args: Any, **_kwargs: Any) -> None:
        raise GuardViolation("拒绝 LibreOffice/Office 转换外围")

    from lawbench.case import materials as materials_module
    from lawbench.case import gate as gate_module
    from lawbench.ingest import libreoffice as libreoffice_module

    materials_module.Converter.convert = converter_denied
    libreoffice_module.find_soffice = lambda: None
    gate_module._registry_onedrive_folders = lambda: []
    registry = CaseRegistry(
        pathlib.Path(private["appdata"]),
        CONTRACTS_DIR / "case_db.sql",
        ref_home=private["home"],
        ref_appdata=private["appdata"],
        ref_system_dirs=(private["system"],),
    )
    case_root = root / "case"
    case_root.mkdir()
    _PRODUCT_ACTIVE = True
    case = registry.open(str(case_root), "civil", None, "daily")
    materials = Materials(
        registry,
        lo_base=pathlib.Path(private["appdata"]) / "临时" / "lo",
        ref_context=registry.ref_context_for,
    )
    materials.recycle = converter_denied
    materials.can_recycle = lambda _path: False

    initial_scan = materials.scan(case["case_id"])
    zones_baseline = _case_zones(case_root)
    sql_baseline = _sql_totals(case_root)
    text_baseline = _tree_totals(case_root / "工作区" / "材料" / "文本")
    index_path = case_root / "工作区" / "材料" / "index.json"
    refs_path = case_root / "工作区" / "材料" / "引用.json"
    index_baseline = _file_metric(index_path)
    refs_baseline = _file_metric(refs_path)

    ref_result = materials.import_(
        case["case_id"], [str(external)], None, False, mode="ref"
    )
    external_after = _tree_inventory(external)
    zones_after_ref = _case_zones(case_root)
    sql_after_ref = _sql_totals(case_root)
    text_after_ref = _tree_totals(case_root / "工作区" / "材料" / "文本")
    index_after_ref = _file_metric(index_path)
    refs_after_ref = _file_metric(refs_path)

    index_after_ref_doc = materials.index(case["case_id"])
    ref_entries = [
        material
        for material in index_after_ref_doc["materials"]
        if material.get("origin") == "ref"
    ]
    ref_identities: list[dict[str, Any]] = []
    for material in ref_entries:
        original_path, original_state = materials.original_path(
            case["case_id"], material["material_id"]
        )
        ref_identities.append(
            {
                "material_id": material["material_id"],
                "rel_path": material["rel_path"],
                "ref_id": material.get("ref_id"),
                "origin": material.get("origin"),
                "status": material["status"],
                "bytes": material["size"],
                "sha256": material["sha256"],
                "original_path": str(original_path) if original_path else None,
                "original_state": original_state,
            }
        )

    external_hash = external_before["items"][0]["sha256"]
    original_area_duplicates = [
        item["relative_path"]
        for item in _tree_inventory(case_root)["items"]
        if item["relative_path"].split("/", 1)[0] not in ("工作区", "成果")
        and item["sha256"] == external_hash
    ]

    temp_source = case_root / "工作区" / "临时" / "Host私有粘贴源-转账截图.jpg"
    shutil.copyfile(FIXTURE, temp_source)
    temp_before = _metadata(temp_source)
    copy_result = materials.import_(
        case["case_id"],
        [str(temp_source)],
        "02案件材料/粘贴图片",
        False,
    )
    final_scan = materials.scan(case["case_id"])
    materials_list = materials.list(case["case_id"])["materials"]
    fixture_after = _metadata(FIXTURE)
    external_after_final = _tree_inventory(external)
    zones_final = _case_zones(case_root)
    sql_final = _sql_totals(case_root)
    text_final = _tree_totals(case_root / "工作区" / "材料" / "文本")
    index_final = _file_metric(index_path)
    refs_final = _file_metric(refs_path)

    expected_destination = case_root / "02案件材料" / "粘贴图片" / temp_source.name
    destination_metric = _file_metric(expected_destination)
    copied_image_entries = [
        material
        for material in materials_list
        if material.get("sha256") is None
        and material["rel_path"] == "02案件材料/粘贴图片/Host私有粘贴源-转账截图.jpg"
    ]
    # materials.list 的契约字段不含 sha256，再从持久索引取身份。
    copied_index_entries = [
        material
        for material in materials.index(case["case_id"])["materials"]
        if material["rel_path"] == "02案件材料/粘贴图片/Host私有粘贴源-转账截图.jpg"
    ]
    final_original_duplicates = [
        item["relative_path"]
        for item in _tree_inventory(case_root)["items"]
        if item["relative_path"].split("/", 1)[0] not in ("工作区", "成果")
        and item["sha256"] == external_hash
    ]

    logs.close()
    report = {
        "outcome": "COMPLETED_FOR_ROOT_REVIEW",
        "not_acceptance": "本脚本只做一次有限文件操作核查；完成不等于验收通过。",
        "started_at_epoch": started_at,
        "finished_at_epoch": time.time(),
        "head_expected": "dc56a93be4b07dbe7a48863e3135351659817fb5",
        "root": str(root),
        "private_paths": private,
        "source_identities": source_identities,
        "fixture": {
            "path": str(FIXTURE),
            "before": fixture_before,
            "after": fixture_after,
            "unchanged": fixture_before == fixture_after,
        },
        "big_external_folder": {
            "path": str(external),
            "expected_bytes": BIG_BYTES,
            "before": external_before,
            "after_ref_import": external_after,
            "after_all": external_after_final,
            "unchanged_metadata_and_hash": external_before == external_after_final,
        },
        "case": case,
        "initial_scan": initial_scan,
        "ref_import": {
            "result": ref_result,
            "registered": ref_result.get("registered", []),
            "members": ref_identities,
            "original_area_same_hash_as_external": original_area_duplicates,
            "final_original_area_same_hash_as_external": final_original_duplicates,
        },
        "jpeg_copy": {
            "source_fixture": str(FIXTURE),
            "private_temporary_source": str(temp_source),
            "temporary_source_before": temp_before,
            "temporary_source_exists_after_import": os.path.lexists(temp_source),
            "result": copy_result,
            "destination": destination_metric,
            "persistent_index_entries": copied_index_entries,
            "listed_entries": copied_image_entries,
            "destination_matches_fixture": (
                destination_metric["exists"]
                and destination_metric["bytes"] == EXPECTED_FIXTURE_BYTES
                and destination_metric["sha256"] == EXPECTED_FIXTURE_SHA256
            ),
        },
        "final_scan": final_scan,
        "materials_list": materials_list,
        "measurements": {
            "zones_baseline": zones_baseline,
            "zones_after_ref": zones_after_ref,
            "zones_final": zones_final,
            "zone_growth_after_ref": _zone_growth(zones_baseline, zones_after_ref),
            "zone_growth_final": _zone_growth(zones_baseline, zones_final),
            "derived_text_after_ref": {
                "baseline": text_baseline,
                "after_ref": text_after_ref,
                "final": text_final,
                "bytes_delta_after_ref": text_after_ref["bytes"] - text_baseline["bytes"],
                "bytes_delta_final": text_final["bytes"] - text_baseline["bytes"],
            },
            "sql_after_ref": {
                "baseline": sql_baseline,
                "after_ref": sql_after_ref,
                "final": sql_final,
                "bytes_delta_after_ref": sql_after_ref["bytes"] - sql_baseline["bytes"],
                "bytes_delta_final": sql_final["bytes"] - sql_baseline["bytes"],
            },
            "index_after_ref": {
                "baseline": index_baseline,
                "after_ref": index_after_ref,
                "final": index_final,
            },
            "refs_registry_after_ref": {
                "baseline": refs_baseline,
                "after_ref": refs_after_ref,
                "final": refs_final,
            },
        },
        "side_effects": {
            "writes_only_under": str(root),
            "synthetic_big_file": str(big_path),
            "temporary_jpeg_source_deleted_by_product_after_copy": not os.path.lexists(temp_source),
            "root_retained_for_review": True,
            "http_service_started": False,
            "socket_connection_or_listener_started": False,
            "thread_started_by_prepare": False,
            "child_process_started_by_prepare": False,
            "app_or_lifespan_imported": False,
            "libreoffice_or_office_conversion_called": False,
            "private_logs": str(log_dir),
        },
    }
    _PRODUCT_ACTIVE = False
    return report


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True, help="runs 下尚不存在的唯一证据目录")
    args = parser.parse_args()
    root = _validate_root(args.root)
    try:
        report = _run(root)
    except Exception as exc:
        if root.exists():
            failure = root / "run-report.failed.json"
            if not failure.exists():
                _write_json(
                    failure,
                    {
                        "outcome": "FAILED_FOR_ROOT_REVIEW",
                        "root": str(root),
                        "exception_type": type(exc).__name__,
                        "exception_text": str(exc),
                        "partial_state_retained": True,
                    },
                )
        raise
    report_path = root / "run-report.json"
    _write_json(report_path, report)
    print(report_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
