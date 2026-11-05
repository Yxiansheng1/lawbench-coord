#!/usr/bin/env python3
"""T31 genuine-branch GUI admission and read-only service entry.

``--admit`` registers the prepared byte-exact case copy through the installed
B-line ``CaseRegistry``. ``--serve`` is launched only by the frozen GUI Host and
exposes the production ASGI routes through an exact read-only firewall. This
file performs no model, OCR, retainer, credential, public-search, delete, stop,
release, or recycle operation.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import hmac
import json
import os
import pathlib
import re
import sqlite3
import stat
import sys
import threading
import time
import types
from datetime import datetime
from typing import Any
from urllib.parse import parse_qsl

import httpx
import uvicorn


EVIDENCE_ROOT = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T34"
    r"\SettingsSaveGUI-20261031-115923"
)
RUNS_ROOT = EVIDENCE_ROOT / "runs"
SOURCE_CASE_ROOT = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T30"
    r"\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case"
)
SOURCE_RUN_REPORT = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T30"
    r"\GenuineSessionAdmission-20261028-092536\run-kLVTTq\admission-report.json"
)
B_PRODUCT_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
B_SERVICE = B_PRODUCT_ROOT / "service"
B_CONTRACTS = B_PRODUCT_ROOT / "contracts"
SKILLS_DIR = B_PRODUCT_ROOT / "skills"
B_SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18WikiTableFidelityBSourcePins-20261030-033727"
    r".json"
)
B_SOURCE_PINS_BYTES = 53548
B_SOURCE_PINS_SHA256 = (
    "7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b"
)

SAFETY_BASE = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830"
    r"\10-MixedMaterialsGui-20261027-164646-server.py"
)
SAFETY_BASE_BYTES = 151304
SAFETY_BASE_SHA256 = (
    "a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5"
)

PREPARED_FORMAT = "lawbench-t34-private-projection-observer-prepared-v1"
ADMISSION_FORMAT = "lawbench-t34-private-projection-observer-admission-v1"
RUN_NAME = re.compile(r"^T34-private-projection-observer-[0-9]{8}-[0-9]{6}$")
EXPECTED_CASE_ID = "872b161f-27d4-40bf-879e-ee457ef6454b"
SOURCE_SESSION = "session-97c67db2-b8a6-428b-be48-04b4144d10bd"
CHILD_SESSION = "session-7fd6b82e-f361-456a-9c91-b6ba77991bb9"
SOURCE_BYTES = 12059
SOURCE_SHA256 = "e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee"
CHILD_BYTES = 16235
CHILD_SHA256 = "b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461"
SOURCE_RUN_REPORT_SHA256 = (
    "238bc2fa4d720d0b5c41e60f1c66a0fe51610e5b7a100b7593f4b61e978ea08e"
)
SOURCE_RUN_PACKET_MANIFEST_SHA256 = (
    "b7c1933e9065a67049a2f4cb14d6eac804f084d388a130371664442876d708f4"
)

EXPECTED_FILES = {
    "工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/session-97c67db2-b8a6-428b-be48-04b4144d10bd/session.v4.jsonl":
        (SOURCE_BYTES, SOURCE_SHA256),
    "工作区/会话/--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--/session-7fd6b82e-f361-456a-9c91-b6ba77991bb9/session.v4.jsonl":
        (CHILD_BYTES, CHILD_SHA256),
    "工作区/case.db": (
        65536,
        "47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6",
    ),
    "工作区/case.db-shm": (
        32768,
        "fd4c9fda9cd3f9ae7c962b0ddf37232294d55580e1aa165aa06129b8549389eb",
    ),
    "工作区/case.db-wal": (
        0,
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    ),
}

ADMISSION_FILE = "admission.json"
RUNTIME_ARTIFACTS = (
    "started.json",
    "ready.json",
    "final-metadata.json",
    "loop-closed.json",
    "requests.ndjson",
    "run-error.json",
)

SERVERS = {
    "llm_base_url": "http://127.0.0.1:65001/v1",
    "prep_base_url": "http://127.0.0.1:65002",
    "llm_alt_base_url": "http://127.0.0.1:65003/v1",
    "prep_alt_base_url": "http://127.0.0.1:65004",
}

READ_ONLY_ROUTES = frozenset(
    {
        "/health",
        "/api/case/recent",
        "/api/settings",
        "/api/capsules",
        "/api/materials",
        "/api/tasks",
        "/api/task/current",
        "/api/outputs",
        "/api/ocr/jobs",
        "/api/wiki/suggestions",
        "/api/wiki/review",
    }
)
CASE_QUERY_ROUTES = frozenset(
    {
        "/api/materials",
        "/api/tasks",
        "/api/outputs",
        "/api/ocr/jobs",
        "/api/wiki/suggestions",
        "/api/wiki/review",
    }
)
NO_QUERY_ROUTES = frozenset(
    {"/health", "/api/case/recent", "/api/settings", "/api/capsules"}
)

MAX_SECONDS = 600
MAX_BODY = 64 * 1024
MAX_CAPTURE = 256 * 1024


def _plain_sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def _load_safety_base():
    if not SAFETY_BASE.is_file():
        raise RuntimeError("safety_base_missing")
    info = os.lstat(SAFETY_BASE)
    if (
        not stat.S_ISREG(info.st_mode)
        or info.st_size != SAFETY_BASE_BYTES
        or _plain_sha256(SAFETY_BASE) != SAFETY_BASE_SHA256
    ):
        raise RuntimeError("safety_base_identity")
    compatibility_file = (
        B_PRODUCT_ROOT
        / "docs"
        / "plan"
        / "evidence"
        / "T30"
        / "_verified_safety_base_compat"
        / "server.py"
    )
    namespace: dict[str, Any] = {
        "__name__": "_t30_gui_safety_base",
        "__file__": str(compatibility_file),
        "__package__": None,
    }
    with SAFETY_BASE.open("rb") as stream:
        source = stream.read()
    exec(compile(source, str(SAFETY_BASE), "exec"), namespace)
    return types.SimpleNamespace(**namespace)


BASE = _load_safety_base()
Deny = BASE.Deny
_norm = BASE._norm
_link = BASE._link
_no_reparse = BASE._no_reparse
_sha256 = BASE._sha256
_write_json = BASE._write_json
_read_json = BASE._read_json
_file_identity = BASE._file_identity
_scrub_env = BASE._scrub_env
_install_keyring = BASE._install_keyring
_install_guards = BASE._install_guards
_assert_wiring = BASE._assert_wiring
_read_body = BASE._read_body
_json = BASE._json
_started = BASE._started
_listener = BASE._listener
_closed = BASE._closed


def _now() -> str:
    return datetime.now().astimezone().isoformat(timespec="milliseconds")


def _long_local_alias(path: pathlib.Path) -> pathlib.Path:
    value = os.path.abspath(os.fspath(path))
    if value.startswith("\\\\?\\"):
        if re.fullmatch(r"[A-Za-z]:\\", value[4:7]):
            return pathlib.Path(value)
        raise Deny("long_path_not_local")
    if re.fullmatch(r"[A-Za-z]:\\", value[:3]) is None:
        raise Deny("long_path_not_local")
    return pathlib.Path("\\\\?\\" + value)


def _validate_root(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute() or _norm(root.parent) != _norm(RUNS_ROOT):
        raise Deny("root_must_be_direct_child_of_runs")
    if RUN_NAME.fullmatch(root.name) is None:
        raise Deny("bad_run_name")
    return root


def _layout(root: pathlib.Path) -> dict[str, pathlib.Path]:
    private = root / "private"
    return {
        "root": root,
        "case": root / "case",
        "private": private,
        "private_home": private / "home",
        "appdata": private / "appdata",
        "private_system": private / "system",
        "private_temp": private / "temp",
        "roaming": private / "roaming",
        "programdata": private / "programdata",
        "settings": private / "appdata" / "settings.json",
        "daily_marker": private / "appdata" / "daily-case.json",
        "prepared": root / "prepared.json",
        "admission": root / ADMISSION_FILE,
    }


def _tree_files(root: pathlib.Path) -> list[dict[str, Any]]:
    _no_reparse(root)
    io_root = _long_local_alias(root)
    rows: list[dict[str, Any]] = []
    for path in io_root.rglob("*"):
        if path.is_dir():
            _no_reparse(path)
            continue
        _no_reparse(path)
        rows.append(
            {
                "relativePath": path.relative_to(io_root).as_posix(),
                "bytes": path.stat().st_size,
                "sha256": _sha256(path),
            }
        )
    rows.sort(key=lambda item: item["relativePath"])
    return rows


def _expected_rows() -> list[dict[str, Any]]:
    return [
        {"relativePath": path, "bytes": size, "sha256": digest}
        for path, (size, digest) in sorted(
            EXPECTED_FILES.items(), key=lambda item: item[0]
        )
    ]


def _row_map(rows: list[dict[str, Any]]) -> dict[str, tuple[int, str]]:
    return {
        row["relativePath"]: (row["bytes"], row["sha256"])
        for row in rows
    }


def _assert_source_case() -> None:
    _no_reparse(SOURCE_CASE_ROOT)
    if _row_map(_tree_files(SOURCE_CASE_ROOT)) != _row_map(_expected_rows()):
        raise Deny("source_case_identity")
    if (
        not SOURCE_RUN_REPORT.is_file()
        or _sha256(SOURCE_RUN_REPORT) != SOURCE_RUN_REPORT_SHA256
    ):
        raise Deny("source_run_report_identity")


def _assert_source_unchanged(manifest: dict[str, Any]) -> None:
    _assert_source_case()
    if _row_map(manifest["sourceFiles"]) != _row_map(_expected_rows()):
        raise Deny("prepared_source_rows")


def _assert_b_sources() -> None:
    _no_reparse(B_SOURCE_PINS)
    if (
        not B_SOURCE_PINS.is_file()
        or B_SOURCE_PINS.stat().st_size != B_SOURCE_PINS_BYTES
        or _sha256(B_SOURCE_PINS) != B_SOURCE_PINS_SHA256
    ):
        raise Deny("b_source_pins_identity")
    pins = _read_json(B_SOURCE_PINS)
    if not isinstance(pins, dict) or len(pins) != 346:
        raise Deny("b_source_pin_count")
    for relative, expected in pins.items():
        path = B_PRODUCT_ROOT / pathlib.PurePosixPath(relative)
        _no_reparse(path)
        if (
            not isinstance(expected, dict)
            or set(expected) != {"bytes", "sha256"}
            or path.stat().st_size != expected["bytes"]
            or _sha256(path) != expected["sha256"]
        ):
            raise Deny("b_source_pin_identity")


def _assert_no_runtime_artifacts(root: pathlib.Path) -> None:
    if any(os.path.lexists(root / name) for name in RUNTIME_ARTIFACTS):
        raise Deny("runtime_artifact_exists")


def _load_prepared(
    root: pathlib.Path, *, verify_target_case: bool = True
) -> tuple[dict[str, Any], dict[str, pathlib.Path]]:
    if not root.is_dir():
        raise Deny("prepared_root_missing")
    _no_reparse(root)
    layout = _layout(root)
    manifest = _read_json(layout["prepared"])
    if (
        not isinstance(manifest, dict)
        or manifest.get("format") != PREPARED_FORMAT
        or manifest.get("expectedCaseId") != EXPECTED_CASE_ID
        or manifest.get("sourceCaseRoot") != str(SOURCE_CASE_ROOT)
        or manifest.get("sourceRunReport", {}).get("sha256")
        != SOURCE_RUN_REPORT_SHA256
        or manifest.get("sourceRunReport", {}).get("packetManifestSha256")
        != SOURCE_RUN_PACKET_MANIFEST_SHA256
        or _row_map(manifest.get("sourceFiles", [])) != _row_map(_expected_rows())
        or _row_map(manifest.get("targetFilesBeforeAdmission", []))
        != _row_map(_expected_rows())
    ):
        raise Deny("prepared_manifest_identity")
    paths = manifest.get("paths")
    expected_paths = {
        "root": layout["root"],
        "case": layout["case"],
        "private": layout["private"],
        "home": layout["private_home"],
        "appdata": layout["appdata"],
        "system": layout["private_system"],
        "temp": layout["private_temp"],
        "roaming": layout["roaming"],
        "programdata": layout["programdata"],
    }
    if not isinstance(paths, dict) or set(paths) != set(expected_paths):
        raise Deny("prepared_paths_shape")
    for name, expected in expected_paths.items():
        if _norm(paths[name]) != _norm(expected):
            raise Deny("prepared_path_" + name)
    for name in (
        "case",
        "private_home",
        "appdata",
        "private_system",
        "private_temp",
        "roaming",
        "programdata",
    ):
        path = layout[name]
        _no_reparse(path)
        if not path.is_dir() or _link(path):
            raise Deny("prepared_directory_" + name)
    _assert_source_unchanged(manifest)
    if verify_target_case and (
        _row_map(_tree_files(layout["case"])) != _row_map(_expected_rows())
    ):
        raise Deny("prepared_case_copy_identity")
    _assert_no_runtime_artifacts(root)
    return manifest, layout


def _write_exclusive(path: pathlib.Path, value: dict[str, Any]) -> None:
    if os.path.lexists(path):
        raise Deny("target_already_exists")
    encoded = (
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    ).encode("utf-8")
    with path.open("xb") as stream:
        stream.write(encoded)
        stream.flush()
        os.fsync(stream.fileno())


def _target_log_identity(case_root: pathlib.Path) -> dict[str, Any]:
    rows = _tree_files(case_root)
    # Two generations share the filename, so identify each by its session dir.
    all_logs = [
        row
        for row in rows
        if row["relativePath"].endswith("/session.v4.jsonl")
    ]
    found: dict[str, dict[str, Any]] = {}
    for row in all_logs:
        parent = row["relativePath"].split("/")[-2]
        if parent == SOURCE_SESSION:
            found["source"] = row
        elif parent == CHILD_SESSION:
            found["child"] = row
    if set(found) != {"source", "child"}:
        raise Deny("target_session_inventory")
    if (
        found["source"]["bytes"] != SOURCE_BYTES
        or found["source"]["sha256"] != SOURCE_SHA256
        or found["child"]["bytes"] != CHILD_BYTES
        or found["child"]["sha256"] != CHILD_SHA256
    ):
        raise Deny("target_session_identity")
    return found


def _final_target_observation(
    case_root: pathlib.Path,
    manifest: dict[str, Any],
    admission: dict[str, Any],
) -> dict[str, Any]:
    _assert_source_case()
    rows = _tree_files(case_root)
    by_path = {row["relativePath"]: row for row in rows}
    expected_paths = set(EXPECTED_FILES)
    session_paths = {
        path.split("/")[-2]: path
        for path in expected_paths
        if path.endswith("/session.v4.jsonl")
    }
    if set(session_paths) != {SOURCE_SESSION, CHILD_SESSION}:
        raise Deny("expected_session_inventory")
    source_path = session_paths[SOURCE_SESSION]
    child_path = session_paths[CHILD_SESSION]
    source_project = str(pathlib.PurePosixPath(source_path).parent.parent)

    def runtime_project_key(raw: str) -> str:
        readable = ""
        separator_run = False
        encoded = raw.encode("utf-16-le", "surrogatepass")
        for offset in range(0, len(encoded), 2):
            code = int.from_bytes(encoded[offset : offset + 2], "little")
            char = chr(code)
            if char in "/\\:":
                if not separator_run:
                    readable += "-"
                separator_run = True
            elif char != "~" and re.fullmatch(r"[A-Za-z0-9._-]", char):
                readable += char
                separator_run = False
            else:
                readable += f"~{code:04X}"
                separator_run = False
        slug = re.sub(r"^-+", "", readable) or "root"
        return f"--{slug[:251]}--"

    runtime_case_cwd = os.path.abspath(os.fspath(case_root))
    runtime_project = runtime_project_key(runtime_case_cwd)
    runtime_project_dir = f"工作区/会话/{runtime_project}"
    if runtime_project_dir == source_project:
        raise Deny("runtime_session_project_not_separate")

    runtime_session_logs = sorted(
        path
        for path in by_path
        if path.startswith(runtime_project_dir + "/")
        and path.endswith("/session.v4.jsonl")
    )
    if len(runtime_session_logs) > 1:
        raise Deny("final_native_session_count")
    native_session_path = (
        runtime_session_logs[0] if runtime_session_logs else None
    )
    native_session_id = (
        pathlib.PurePosixPath(native_session_path).parent.name
        if native_session_path is not None
        else None
    )
    native_session_name = re.compile(
        r"^session-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-"
        r"[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )
    if (
        native_session_id is not None
        and native_session_name.fullmatch(native_session_id) is None
    ):
        raise Deny("final_native_session_uuid")

    case_db_path = "工作区/case.db"
    sqlite_aux_paths = {
        "工作区/case.db-shm",
        "工作区/case.db-wal",
    }
    cache_paths = {
        role: f"工作区/会话缓存/{session_id}.json"
        for role, session_id in (
            ("source", SOURCE_SESSION),
            ("child", CHILD_SESSION),
        )
    }
    if native_session_id is not None:
        cache_paths["native"] = (
            f"工作区/会话缓存/{native_session_id}.json"
        )
    required_paths = {source_path, case_db_path}
    allowed_paths = (
        required_paths
        | {child_path}
        | sqlite_aux_paths
        | set(cache_paths.values())
    )
    if native_session_path is not None:
        allowed_paths.add(native_session_path)
    if not required_paths.issubset(by_path):
        raise Deny("final_required_file_absent")
    if not set(by_path).issubset(allowed_paths):
        raise Deny("final_target_inventory")

    child_present = child_path in by_path
    case_root_io = _long_local_alias(case_root)

    def observed_row(relative: str) -> dict[str, Any]:
        path = case_root_io / pathlib.PurePosixPath(relative)
        _no_reparse(path)
        info = os.lstat(path)
        if not stat.S_ISREG(info.st_mode) or _link(path):
            raise Deny("final_target_not_ordinary_file")
        return by_path[relative]

    def exact_row(relative: str) -> dict[str, Any]:
        size, digest = EXPECTED_FILES[relative]
        actual = observed_row(relative)
        if actual != {
            "relativePath": relative,
            "bytes": size,
            "sha256": digest,
        }:
            raise Deny("final_session_identity")
        return actual

    started_path = case_root.parent / "started.json"
    started = _read_json(started_path)
    if (
        not isinstance(started, dict)
        or started.get("status") != "started"
        or _norm(started.get("root", "")) != _norm(case_root.parent)
    ):
        raise Deny("final_native_runtime_start")
    try:
        started_at = datetime.fromisoformat(str(started["started_at"]))
        if started_at.tzinfo is None:
            raise ValueError("timezone required")
    except (KeyError, TypeError, ValueError):
        raise Deny("final_native_runtime_start") from None
    runtime_min_ms = int(started_at.timestamp() * 1000)
    runtime_max_ms = int(time.time() * 1000) + 1

    source_row = exact_row(source_path)
    session_root = case_root / "工作区" / "会话"
    session_root_io = _long_local_alias(session_root)
    _no_reparse(session_root_io)
    if not session_root_io.is_dir() or _link(session_root_io):
        raise Deny("final_session_root")
    expected_projects = (
        {pathlib.PurePosixPath(source_project).name, runtime_project}
        if native_session_path is not None
        else {pathlib.PurePosixPath(source_project).name}
    )
    project_entries = {entry.name: entry for entry in session_root_io.iterdir()}
    if set(project_entries) != expected_projects:
        raise Deny("final_session_project_inventory")
    for name in expected_projects:
        entry = project_entries[name]
        _no_reparse(entry)
        if not entry.is_dir() or _link(entry):
            raise Deny("final_session_project")

    original_project_entries = {
        entry.name: entry
        for entry in (case_root_io / pathlib.PurePosixPath(source_project)).iterdir()
    }
    expected_original_sessions = (
        {SOURCE_SESSION, CHILD_SESSION} if child_present else {SOURCE_SESSION}
    )
    if set(original_project_entries) != expected_original_sessions:
        raise Deny("final_session_directory_inventory")
    for name in expected_original_sessions:
        entry = original_project_entries[name]
        _no_reparse(entry)
        if not entry.is_dir() or _link(entry):
            raise Deny("final_session_directory")

    if native_session_path is not None:
        native_project_entries = {
            entry.name: entry
            for entry in (
                case_root_io / pathlib.PurePosixPath(runtime_project_dir)
            ).iterdir()
        }
        if set(native_project_entries) != {native_session_id}:
            raise Deny("final_native_session_directory_inventory")
        native_entry = native_project_entries[native_session_id]
        _no_reparse(native_entry)
        if not native_entry.is_dir() or _link(native_entry):
            raise Deny("final_native_session_directory")

    expected_session_logs = {source_path}
    if child_present:
        expected_session_logs.add(child_path)
    if native_session_path is not None:
        expected_session_logs.add(native_session_path)
    observed_session_logs = {
        path
        for path in by_path
        if path.endswith("/session.v4.jsonl")
    }
    if observed_session_logs != expected_session_logs:
        raise Deny("final_session_log_inventory")
    for session_path in expected_session_logs:
        session_dir = case_root_io / pathlib.PurePosixPath(
            str(pathlib.PurePosixPath(session_path).parent)
        )
        session_entries = {
            entry.name: entry
            for entry in session_dir.iterdir()
        }
        if set(session_entries) != {"session.v4.jsonl"}:
            raise Deny("final_session_owned_directory_inventory")
        session_entry = session_entries["session.v4.jsonl"]
        _no_reparse(session_entry)
        if not stat.S_ISREG(os.lstat(session_entry).st_mode) or _link(session_entry):
            raise Deny("final_session_owned_directory_file")

    native_observation: dict[str, Any] = {
        "present": False,
        "acceptanceProof": False,
    }
    native_cache_observation: dict[str, Any] = {
        "present": False,
        "productGeneratedCache": True,
        "acceptanceProof": False,
    }
    if native_session_path is not None:
        native_row = observed_row(native_session_path)
        native_io_path = (
            case_root_io / pathlib.PurePosixPath(native_session_path)
        )
        native_bytes = native_io_path.read_bytes()
        if (
            native_row["bytes"] != len(native_bytes)
            or native_row["sha256"] != hashlib.sha256(native_bytes).hexdigest()
        ):
            raise Deny("final_native_session_changed_during_observation")
        if native_bytes.count(b"\n") != 1 or not native_bytes.endswith(b"\n"):
            raise Deny("final_native_session_not_header_only")
        try:
            native_header = json.loads(native_bytes.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            raise Deny("final_native_session_header") from None
        if (
            not isinstance(native_header, dict)
            or set(native_header)
            != {
                "type",
                "version",
                "id",
                "createdAt",
                "cwd",
                "isSeeded",
                "delegationDepth",
                "agentPreset",
            }
            or native_header.get("type") != "session"
            or native_header.get("version") != 4
            or native_header.get("id") != native_session_id
            or type(native_header.get("createdAt")) is not int
            or not runtime_min_ms
            <= native_header["createdAt"]
            <= runtime_max_ms
            or native_header.get("cwd") != runtime_case_cwd
            or native_header.get("isSeeded") is not False
            or type(native_header.get("delegationDepth")) is not int
            or native_header["delegationDepth"] != 0
            or native_header.get("agentPreset") != "lawbench"
        ):
            raise Deny("final_native_session_header")
        expected_native_path = (
            f"{runtime_project_dir}/{native_session_id}/session.v4.jsonl"
        )
        if native_session_path != expected_native_path:
            raise Deny("final_native_session_storage_identity")
        expected_header_bytes = (
            '{"type":"session","version":4,"id":'
            + json.dumps(native_session_id, ensure_ascii=False)
            + ',"createdAt":'
            + str(native_header["createdAt"])
            + ',"cwd":'
            + json.dumps(runtime_case_cwd, ensure_ascii=False)
            + ',"isSeeded":false,"delegationDepth":0,'
            + '"agentPreset":"lawbench"}\n'
        ).encode("utf-8")
        if native_bytes != expected_header_bytes:
            raise Deny("final_native_session_canonical_header")
        native_observation = {
            "present": True,
            "sessionId": native_session_id,
            "relativePath": native_session_path,
            "projectDirectory": runtime_project,
            "headerOnly": True,
            "eventCount": 0,
            "header": native_header,
            "acceptanceProof": False,
        }

    child_marker: dict[str, Any] | None = None
    if child_present:
        original_child = {
            "relativePath": child_path,
            "bytes": CHILD_BYTES,
            "sha256": CHILD_SHA256,
        }
        if original_child != admission.get("sourceLogs", {}).get("child"):
            raise Deny("admission_log_identity")
        source_child_io = _long_local_alias(
            SOURCE_CASE_ROOT / pathlib.PurePosixPath(child_path)
        )
        _no_reparse(source_child_io)
        original_child_bytes = source_child_io.read_bytes()
        if (
            len(original_child_bytes) != CHILD_BYTES
            or hashlib.sha256(original_child_bytes).hexdigest() != CHILD_SHA256
        ):
            raise Deny("source_child_session_identity")
        child_row = observed_row(child_path)
        child_io = case_root_io / pathlib.PurePosixPath(child_path)
        child_bytes = child_io.read_bytes()
        if (
            child_row["bytes"] != len(child_bytes)
            or child_row["sha256"] != hashlib.sha256(child_bytes).hexdigest()
        ):
            raise Deny("final_child_changed_during_observation")
        if child_bytes == original_child_bytes:
            child_row = original_child
            child_state = "PRESENT_UNCHANGED"
            target_logs_unchanged = True
        else:
            if not child_bytes.startswith(original_child_bytes):
                raise Deny("final_child_not_original_prefix")
            suffix = child_bytes[len(original_child_bytes) :]
            if suffix.count(b"\n") != 1 or not suffix.endswith(b"\n"):
                raise Deny("final_child_extra_bytes")
            try:
                event = json.loads(suffix.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                raise Deny("final_child_resume_event") from None
            if (
                not isinstance(event, dict)
                or set(event) != {"type", "seq", "time", "data"}
                or event.get("type") != "session/end-seed"
                or type(event.get("seq")) is not int
                or event["seq"] != 37
                or type(event.get("time")) is not int
                or not runtime_min_ms <= event["time"] <= runtime_max_ms
                or not isinstance(event.get("data"), dict)
                or event["data"] != {}
            ):
                raise Deny("final_child_resume_event")
            canonical_suffix = (
                '{"type":"session/end-seed","seq":37,"time":'
                + str(event["time"])
                + ',"data":{}}\n'
            ).encode("utf-8")
            if suffix != canonical_suffix:
                raise Deny("final_child_resume_event_bytes")
            child_row = {
                "relativePath": child_path,
                "bytes": len(child_bytes),
                "sha256": hashlib.sha256(child_bytes).hexdigest(),
            }
            child_marker = {
                "type": event["type"],
                "seq": event["seq"],
                "time": event["time"],
                "data": event["data"],
                "appendedBytes": len(suffix),
                "productionContract": (
                    "packages/core/session/src/index.ts:620-621"
                ),
                "targetLogsUnchanged": False,
                "acceptanceProof": False,
            }
            child_state = "PRESENT_NATIVE_RESUME_MARKER_APPENDED"
            target_logs_unchanged = False
    else:
        if CHILD_SESSION in original_project_entries:
            raise Deny("final_child_directory_present")
        if admission.get("sourceLogs", {}).get("child") != {
            "relativePath": child_path,
            "bytes": CHILD_BYTES,
            "sha256": CHILD_SHA256,
        }:
            raise Deny("admission_log_identity")
        child_row = None
        child_state = "CHILD_DIRECTORY_ABSENT_PENDING_ROOT_GUI_AND_OS_RECYCLE_PROOF"
        target_logs_unchanged = False
    if source_row != admission.get("sourceLogs", {}).get("source"):
        raise Deny("admission_source_log_identity")

    before = _row_map(manifest["targetFilesBeforeAdmission"])
    sqlite_files: dict[str, Any] = {}
    for relative in (case_db_path, *sorted(sqlite_aux_paths)):
        prior = before[relative]
        if relative in by_path:
            actual = observed_row(relative)
            sqlite_files[relative] = {
                "present": True,
                "state": "PRESENT_OBSERVED",
                "beforeBytes": prior[0],
                "afterBytes": actual["bytes"],
                "beforeSha256": prior[1],
                "afterSha256": actual["sha256"],
                "changed": prior != (actual["bytes"], actual["sha256"]),
            }
        else:
            sqlite_files[relative] = {
                "present": False,
                "state": "ABSENT_AFTER_GUI_LIFECYCLE",
                "beforeBytes": prior[0],
                "afterBytes": None,
                "beforeSha256": prior[1],
                "afterSha256": None,
                "changed": True,
            }

    case_db = case_root / pathlib.PurePosixPath(case_db_path)
    metadata_uri = case_db.resolve(strict=True).as_uri() + "?mode=ro"
    connection = sqlite3.connect(metadata_uri, uri=True)
    try:
        connection.execute("PRAGMA query_only = ON")
        case_id_row = connection.execute(
            "SELECT value FROM meta WHERE key = 'case_id'"
        ).fetchone()
        schema_row = connection.execute(
            "SELECT value FROM meta WHERE key = 'schema_version'"
        ).fetchone()
    finally:
        connection.close()
    if (
        case_id_row is None
        or case_id_row[0] != EXPECTED_CASE_ID
        or schema_row is None
        or schema_row[0] != "1"
    ):
        raise Deny("case_db_metadata_identity")

    cache_files: dict[str, Any] = {}
    for role, relative in cache_paths.items():
        actual = by_path.get(relative)
        if actual is None:
            cache_files[role] = {
                "relativePath": relative,
                "present": False,
                "bytes": None,
                "sha256": None,
                "productGeneratedCache": True,
                "acceptanceProof": False,
            }
        else:
            actual = observed_row(relative)
            cache_files[role] = {
                "relativePath": actual["relativePath"],
                "present": True,
                "bytes": actual["bytes"],
                "sha256": actual["sha256"],
                "productGeneratedCache": True,
                "acceptanceProof": False,
            }
    cache_root = case_root / "工作区" / "会话缓存"
    if os.path.lexists(cache_root):
        cache_root_io = _long_local_alias(cache_root)
        _no_reparse(cache_root_io)
        if not cache_root_io.is_dir() or _link(cache_root_io):
            raise Deny("final_cache_root")
        expected_cache_names = {
            pathlib.PurePosixPath(relative).name
            for relative in cache_paths.values()
            if relative in by_path
        }
        cache_entries = {
            entry.name: entry
            for entry in cache_root_io.iterdir()
        }
        if set(cache_entries) != expected_cache_names:
            raise Deny("final_cache_inventory")
        for entry in cache_entries.values():
            _no_reparse(entry)
            if not stat.S_ISREG(os.lstat(entry).st_mode) or _link(entry):
                raise Deny("final_cache_not_ordinary_file")
    elif any(relative in by_path for relative in cache_paths.values()):
        raise Deny("final_cache_root_absent")
    if native_session_id is not None:
        native_cache_observation = cache_files["native"]

    return {
        "sourceCaseFilesUnchanged": True,
        "sourceSession": source_row,
        "childSession": child_row,
        "childSessionState": child_state,
        "childSessionResumeMarker": child_marker,
        "targetLogsUnchanged": target_logs_unchanged,
        "nativeAutoSession": native_observation,
        "sqliteFiles": sqlite_files,
        "caseDbMetadata": {
            "caseId": case_id_row[0],
            "schemaVersion": schema_row[0],
            "readMode": "sqlite_uri_mode_ro_query_only",
        },
        "projectionCacheFiles": cache_files,
        "nativeAutoSessionProjectionCache": native_cache_observation,
    }


def _t31_final_target_observation(
    case_root: pathlib.Path,
    manifest: dict[str, Any],
    admission: dict[str, Any],
) -> dict[str, Any]:
    """Validate only the ordinary and empty GUI-created native outcomes."""
    _assert_source_case()
    rows = _tree_files(case_root)
    by_path = {row["relativePath"]: row for row in rows}
    expected_paths = set(EXPECTED_FILES)
    session_paths = {
        path.split("/")[-2]: path
        for path in expected_paths
        if path.endswith("/session.v4.jsonl")
    }
    if set(session_paths) != {SOURCE_SESSION, CHILD_SESSION}:
        raise Deny("expected_session_inventory")
    source_path = session_paths[SOURCE_SESSION]
    child_path = session_paths[CHILD_SESSION]
    source_project = str(pathlib.PurePosixPath(source_path).parent.parent)

    def runtime_project_key(raw: str) -> str:
        readable = ""
        separator_run = False
        encoded = raw.encode("utf-16-le", "surrogatepass")
        for offset in range(0, len(encoded), 2):
            code = int.from_bytes(encoded[offset : offset + 2], "little")
            char = chr(code)
            if char in "/\\:":
                if not separator_run:
                    readable += "-"
                separator_run = True
            elif char != "~" and re.fullmatch(r"[A-Za-z0-9._-]", char):
                readable += char
                separator_run = False
            else:
                readable += f"~{code:04X}"
                separator_run = False
        slug = re.sub(r"^-+", "", readable) or "root"
        return f"--{slug[:251]}--"

    runtime_case_cwd = os.path.abspath(os.fspath(case_root))
    runtime_project = runtime_project_key(runtime_case_cwd)
    runtime_project_dir = f"工作区/会话/{runtime_project}"
    if runtime_project_dir == source_project:
        raise Deny("runtime_session_project_not_separate")

    case_root_io = _long_local_alias(case_root)
    _no_reparse(case_root_io)
    if not case_root_io.is_dir() or _link(case_root_io):
        raise Deny("final_case_root")

    def relative_path(path: pathlib.Path) -> str:
        return os.path.relpath(path, case_root_io).replace("\\", "/")

    def observed_row(relative: str) -> dict[str, Any]:
        path = case_root_io / pathlib.PurePosixPath(relative)
        _no_reparse(path)
        info = os.lstat(path)
        if not stat.S_ISREG(info.st_mode) or _link(path):
            raise Deny("final_target_not_ordinary_file")
        row = by_path.get(relative)
        if row is None:
            raise Deny("final_target_inventory")
        return row

    def read_relative(relative: str) -> bytes:
        observed_row(relative)
        path = case_root_io / pathlib.PurePosixPath(relative)
        data = path.read_bytes()
        row = by_path[relative]
        if row["bytes"] != len(data) or row["sha256"] != hashlib.sha256(data).hexdigest():
            raise Deny("final_target_changed_during_observation")
        return data

    def parse_jsonl(data: bytes, label: str) -> list[tuple[bytes, Any]]:
        pieces = data.split(b"\n")
        if (
            len(pieces) < 2
            or pieces[-1] != b""
            or any(not piece for piece in pieces[:-1])
        ):
            raise Deny(label)
        records: list[tuple[bytes, Any]] = []
        for piece in pieces[:-1]:
            record = piece + b"\n"
            try:
                value = json.loads(record.decode("utf-8"))
            except (UnicodeDecodeError, json.JSONDecodeError):
                raise Deny(label) from None
            records.append((record, value))
        return records

    if not {source_path, child_path, "工作区/case.db"}.issubset(by_path):
        raise Deny("final_required_file_absent")

    started_path = case_root.parent / "started.json"
    started = _read_json(started_path)
    if (
        not isinstance(started, dict)
        or started.get("status") != "started"
        or _norm(started.get("root", "")) != _norm(case_root.parent)
    ):
        raise Deny("final_native_runtime_start")
    try:
        started_at = datetime.fromisoformat(str(started["started_at"]))
        if started_at.tzinfo is None:
            raise ValueError("timezone required")
    except (KeyError, TypeError, ValueError):
        raise Deny("final_native_runtime_start") from None
    runtime_min_ms = int(started_at.timestamp() * 1000)
    runtime_max_ms = int(time.time() * 1000) + 1

    def validate_normal_resume_marker(
        suffix: bytes, seq: int, label: str
    ) -> dict[str, Any]:
        suffix_records = parse_jsonl(suffix, f"{label}_bytes")
        if len(suffix_records) != 1:
            raise Deny(f"{label}_count")
        record, event = suffix_records[0]
        if (
            not isinstance(event, dict)
            or set(event) != {"type", "seq", "time", "data"}
            or event.get("type") != "session/end-seed"
            or type(event.get("seq")) is not int
            or event["seq"] != seq
            or type(event.get("time")) is not int
            or not runtime_min_ms <= event["time"] <= runtime_max_ms
            or not isinstance(event.get("data"), dict)
            or event["data"] != {}
        ):
            raise Deny(label)
        canonical = (
            '{"type":"session/end-seed","seq":'
            + str(seq)
            + ',"time":'
            + str(event["time"])
            + ',"data":{}}\n'
        ).encode("utf-8")
        if record != canonical:
            raise Deny(f"{label}_bytes")
        return {
            "type": event["type"],
            "seq": event["seq"],
            "time": event["time"],
            "data": event["data"],
            "appendedBytes": len(record),
            "productionContract": "packages/core/session/src/index.ts:620-621",
            "acceptanceProof": False,
        }

    original_observations: dict[str, Any] = {}
    target_logs_unchanged = True
    for role, relative, session_id in (
        ("source", source_path, SOURCE_SESSION),
        ("child", child_path, CHILD_SESSION),
    ):
        prior = admission.get("sourceLogs", {}).get(role)
        if prior != {
            "relativePath": relative,
            "bytes": EXPECTED_FILES[relative][0],
            "sha256": EXPECTED_FILES[relative][1],
        }:
            raise Deny("admission_log_identity")
        source_log = _long_local_alias(
            SOURCE_CASE_ROOT / pathlib.PurePosixPath(relative)
        )
        _no_reparse(source_log)
        original_bytes = source_log.read_bytes()
        if (
            len(original_bytes) != EXPECTED_FILES[relative][0]
            or hashlib.sha256(original_bytes).hexdigest()
            != EXPECTED_FILES[relative][1]
        ):
            raise Deny("source_session_identity")
        original_records = parse_jsonl(original_bytes, "original_session_bytes")
        if (
            not original_records
            or not isinstance(original_records[0][1], dict)
            or original_records[0][1].get("id") != session_id
        ):
            raise Deny("original_session_header")
        target_bytes = read_relative(relative)
        if not target_bytes.startswith(original_bytes):
            raise Deny("original_session_not_prefix")
        suffix = target_bytes[len(original_bytes) :]
        marker = None
        state = "PRESENT_UNCHANGED"
        if suffix:
            marker = validate_normal_resume_marker(
                suffix, len(original_records) - 1, "original_resume_marker"
            )
            state = "PRESENT_NATIVE_RESUME_MARKER_APPENDED"
            target_logs_unchanged = False
        original_observations[role] = {
            "sessionId": session_id,
            "relativePath": relative,
            "state": state,
            "originalBytes": EXPECTED_FILES[relative][0],
            "observedBytes": len(target_bytes),
            "originalSha256": EXPECTED_FILES[relative][1],
            "observedSha256": hashlib.sha256(target_bytes).hexdigest(),
            "normalResumeMarker": marker,
            "acceptanceProof": False,
        }

    new_logs = sorted(
        path
        for path in by_path
        if path.startswith(runtime_project_dir + "/")
        and path.endswith("/session.v4.jsonl")
    )
    if len(new_logs) > 2:
        raise Deny("final_native_session_count")
    session_name = re.compile(
        r"^session-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-"
        r"[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
    )
    parsed_new: dict[str, dict[str, Any]] = {}
    for relative in new_logs:
        session_id = pathlib.PurePosixPath(relative).parent.name
        expected_path = f"{runtime_project_dir}/{session_id}/session.v4.jsonl"
        if relative != expected_path or session_name.fullmatch(session_id) is None:
            raise Deny("final_native_session_storage_identity")
        data = read_relative(relative)
        records = parse_jsonl(data, "final_native_session_bytes")
        if len(records) < 1 or not isinstance(records[0][1], dict):
            raise Deny("final_native_session_header")
        parsed_new[session_id] = {
            "relativePath": relative,
            "data": data,
            "records": records,
            "header": records[0][1],
        }
    if len(parsed_new) != len(new_logs):
        raise Deny("final_native_session_duplicate_id")

    empty_ids = {
        session_id
        for session_id, parsed in parsed_new.items()
        if parsed["header"].get("isSeeded") is False
    }
    seeded_ids = set(parsed_new) - empty_ids
    if len(empty_ids) > 1 or len(seeded_ids) > 1:
        raise Deny("final_native_action_count")
    known_parent_ids = {SOURCE_SESSION, CHILD_SESSION} | empty_ids

    def canonical_header(
        session_id: str,
        created_at: int,
        *,
        parent_session: str | None,
    ) -> bytes:
        fields = (
            '{"type":"session","version":4,"id":'
            + json.dumps(session_id, ensure_ascii=False)
            + ',"createdAt":'
            + str(created_at)
            + ',"cwd":'
            + json.dumps(runtime_case_cwd, ensure_ascii=False)
        )
        if parent_session is not None:
            fields += ',"parentSession":' + json.dumps(
                parent_session, ensure_ascii=False
            )
        fields += (
            ',"isSeeded":'
            + ("true" if parent_session is not None else "false")
            + ',"delegationDepth":0,"agentPreset":"lawbench"}\n'
        )
        return fields.encode("utf-8")

    native_observations: list[dict[str, Any]] = []
    for session_id, parsed in parsed_new.items():
        header = parsed["header"]
        seeded = session_id in seeded_ids
        expected_keys = {
            "type",
            "version",
            "id",
            "createdAt",
            "cwd",
            "isSeeded",
            "delegationDepth",
            "agentPreset",
        }
        if seeded:
            expected_keys.add("parentSession")
        if (
            set(header) != expected_keys
            or header.get("type") != "session"
            or header.get("version") != 4
            or header.get("id") != session_id
            or type(header.get("createdAt")) is not int
            or not runtime_min_ms <= header["createdAt"] <= runtime_max_ms
            or header.get("cwd") != runtime_case_cwd
            or header.get("isSeeded") is not seeded
            or type(header.get("delegationDepth")) is not int
            or header["delegationDepth"] != 0
            or header.get("agentPreset") != "lawbench"
            or (
                seeded
                and header.get("parentSession") not in known_parent_ids
            )
        ):
            raise Deny("final_native_session_header")
        expected_header = canonical_header(
            session_id,
            header["createdAt"],
            parent_session=header.get("parentSession") if seeded else None,
        )
        if parsed["records"][0][0] != expected_header:
            raise Deny("final_native_session_canonical_header")
        if not seeded:
            if len(parsed["records"]) != 1:
                raise Deny("final_empty_native_session_not_header_only")
            native_observations.append(
                {
                    "kind": "productionCreatedEmpty",
                    "sessionId": session_id,
                    "relativePath": parsed["relativePath"],
                    "projectDirectory": runtime_project,
                    "headerOnly": True,
                    "eventCount": 0,
                    "header": header,
                    "acceptanceProof": False,
                }
            )

    for session_id in sorted(seeded_ids):
        parsed = parsed_new[session_id]
        header = parsed["header"]
        parent_id = header["parentSession"]
        if parent_id in parsed_new:
            parent_records = parsed_new[parent_id]["records"]
        elif parent_id == SOURCE_SESSION:
            parent_records = parse_jsonl(read_relative(source_path), "source_parent_bytes")
        else:
            parent_records = parse_jsonl(read_relative(child_path), "child_parent_bytes")
        parent_events = parent_records[1:]
        if not parent_events:
            raise Deny("native_seeded_empty_parent_not_producible")
        child_events = parsed["records"][1:]
        inherited_markers = [
            index
            for index, (_, event) in enumerate(child_events)
            if (
                isinstance(event, dict)
                and event.get("type") == "session/end-seed"
                and isinstance(event.get("data"), dict)
                and event["data"].get("inherited") is True
            )
        ]
        if len(inherited_markers) != 1:
            raise Deny("native_seeded_child_inherited_marker_count")
        inherited_count = inherited_markers[0]
        if (
            inherited_count < 1
            or inherited_count > len(parent_events)
            or len(child_events) != inherited_count + 1
        ):
            raise Deny("native_seeded_child_event_count")
        if child_events[:inherited_count] != parent_events[:inherited_count]:
            raise Deny("native_seeded_child_parent_prefix")
        parent_boundary = parent_events[inherited_count - 1][1]
        boundary_explicit_completed_turn = (
            isinstance(parent_boundary, dict)
            and parent_boundary.get("type") == "turn/end"
        )
        boundary_omitted_completed_prefix = (
            inherited_count == len(parent_events)
            and isinstance(parent_boundary, dict)
            and parent_boundary.get("type") == "session/end-seed"
            and parent_boundary.get("data") == {}
            and any(
                isinstance(event, dict) and event.get("type") == "turn/end"
                for _, event in parent_events[: inherited_count - 1]
            )
        )
        if not (
            boundary_explicit_completed_turn
            or boundary_omitted_completed_prefix
        ):
            raise Deny("native_seeded_child_unverified_boundary")
        marker_record, marker = child_events[inherited_count]
        parent_time = (
            parent_boundary.get("time")
            if isinstance(parent_boundary, dict)
            else None
        )
        if (
            not isinstance(marker, dict)
            or set(marker) != {"type", "seq", "time", "data"}
            or marker.get("type") != "session/end-seed"
            or type(marker.get("seq")) is not int
            or marker["seq"] != inherited_count
            or type(marker.get("time")) is not int
            or type(parent_time) is not int
            or marker["time"] != parent_time
            or marker.get("data") != {"inherited": True}
        ):
            raise Deny("native_seeded_child_end_seed")
        expected_marker = (
            '{"type":"session/end-seed","seq":'
            + str(inherited_count)
            + ',"time":'
            + str(marker["time"])
            + ',"data":{"inherited":true}}\n'
        ).encode("utf-8")
        if marker_record != expected_marker:
            raise Deny("native_seeded_child_end_seed_bytes")
        native_observations.append(
            {
                "kind": "nativeSeededFork",
                "sessionId": session_id,
                "relativePath": parsed["relativePath"],
                "projectDirectory": runtime_project,
                "parentSession": parent_id,
                "inheritedEventCount": inherited_count,
                "eventCount": inherited_count + 1,
                "forkBoundary": (
                    "explicitCompletedTurn"
                    if boundary_explicit_completed_turn
                    else "omittedLatestCompletedPrefix"
                ),
                "parentEventCountAtEnd": len(parent_events),
                "header": header,
                "childEndSeed": {
                    "type": marker["type"],
                    "seq": marker["seq"],
                    "time": marker["time"],
                    "data": marker["data"],
                },
                "primaryContract": (
                    "packages/api/session-controller/src/commands.ts:fork; "
                    "packages/core/session/src/fork.ts:buildForkSeed"
                ),
                "acceptanceProof": False,
            }
        )

    native_ids = set(parsed_new)
    expected_session_paths = {source_path, child_path} | set(new_logs)
    observed_session_logs = {
        path for path in by_path if path.endswith("/session.v4.jsonl")
    }
    if observed_session_logs != expected_session_paths:
        raise Deny("final_session_log_inventory")
    for relative in expected_session_paths:
        session_dir = case_root_io / pathlib.PurePosixPath(
            str(pathlib.PurePosixPath(relative).parent)
        )
        _no_reparse(session_dir)
        entries = {entry.name: entry for entry in session_dir.iterdir()}
        if set(entries) != {"session.v4.jsonl"}:
            raise Deny("final_session_owned_directory_inventory")
        entry = entries["session.v4.jsonl"]
        _no_reparse(entry)
        if not stat.S_ISREG(os.lstat(entry).st_mode) or _link(entry):
            raise Deny("final_session_owned_directory_file")

    session_root = case_root / "工作区" / "会话"
    session_root_io = _long_local_alias(session_root)
    _no_reparse(session_root_io)
    if not session_root_io.is_dir() or _link(session_root_io):
        raise Deny("final_session_root")
    expected_projects = {pathlib.PurePosixPath(source_project).name}
    if new_logs:
        expected_projects.add(runtime_project)
    project_entries = {entry.name: entry for entry in session_root_io.iterdir()}
    if set(project_entries) != expected_projects:
        raise Deny("final_session_project_inventory")
    for entry in project_entries.values():
        _no_reparse(entry)
        if not entry.is_dir() or _link(entry):
            raise Deny("final_session_project")
    original_entries = {
        entry.name: entry
        for entry in (case_root_io / pathlib.PurePosixPath(source_project)).iterdir()
    }
    if set(original_entries) != {SOURCE_SESSION, CHILD_SESSION}:
        raise Deny("final_session_directory_inventory")
    for entry in original_entries.values():
        _no_reparse(entry)
        if not entry.is_dir() or _link(entry):
            raise Deny("final_session_directory")
    if new_logs:
        native_entries = {
            entry.name: entry
            for entry in (
                case_root_io / pathlib.PurePosixPath(runtime_project_dir)
            ).iterdir()
        }
        if set(native_entries) != native_ids:
            raise Deny("final_native_session_directory_inventory")
        for entry in native_entries.values():
            _no_reparse(entry)
            if not entry.is_dir() or _link(entry):
                raise Deny("final_native_session_directory")

    cache_paths = {
        session_id: f"工作区/会话缓存/{session_id}.json"
        for session_id in ({SOURCE_SESSION, CHILD_SESSION} | native_ids)
    }
    case_db_path = "工作区/case.db"
    sqlite_aux_paths = {"工作区/case.db-shm", "工作区/case.db-wal"}
    allowed_paths = (
        expected_session_paths
        | {case_db_path}
        | sqlite_aux_paths
        | set(cache_paths.values())
    )
    if not set(by_path).issubset(allowed_paths):
        raise Deny("final_target_inventory")

    source_root_io = _long_local_alias(SOURCE_CASE_ROOT)
    source_dirs: set[str] = set()
    for directory, child_dirs, _ in os.walk(source_root_io, followlinks=False):
        current = pathlib.Path(directory)
        for name in child_dirs:
            child = current / name
            _no_reparse(child)
            if _link(child) or not child.is_dir():
                raise Deny("source_case_directory")
            source_dirs.add(
                os.path.relpath(child, source_root_io).replace("\\", "/")
            )
    expected_dirs = set(source_dirs)
    if new_logs:
        expected_dirs.add(runtime_project_dir)
        expected_dirs.update(
            str(pathlib.PurePosixPath(relative).parent) for relative in new_logs
        )
    cache_root = case_root / "工作区" / "会话缓存"
    if os.path.lexists(cache_root):
        expected_dirs.add("工作区/会话缓存")
    observed_dirs: set[str] = set()
    for directory, child_dirs, _ in os.walk(case_root_io, followlinks=False):
        current = pathlib.Path(directory)
        for name in child_dirs:
            child = current / name
            _no_reparse(child)
            if _link(child) or not child.is_dir():
                raise Deny("final_target_directory")
            observed_dirs.add(relative_path(child))
    if observed_dirs != expected_dirs:
        raise Deny("final_target_directory_inventory")

    cache_files: dict[str, Any] = {}
    for session_id, relative in cache_paths.items():
        actual = by_path.get(relative)
        if actual is None:
            cache_files[session_id] = {
                "relativePath": relative,
                "present": False,
                "bytes": None,
                "sha256": None,
                "productGeneratedCache": True,
                "acceptanceProof": False,
            }
        else:
            actual = observed_row(relative)
            cache_files[session_id] = {
                "relativePath": actual["relativePath"],
                "present": True,
                "bytes": actual["bytes"],
                "sha256": actual["sha256"],
                "productGeneratedCache": True,
                "acceptanceProof": False,
            }
    if os.path.lexists(cache_root):
        cache_root_io = _long_local_alias(cache_root)
        _no_reparse(cache_root_io)
        if not cache_root_io.is_dir() or _link(cache_root_io):
            raise Deny("final_cache_root")
        expected_cache_names = {
            pathlib.PurePosixPath(relative).name
            for relative in cache_paths.values()
            if relative in by_path
        }
        cache_entries = {entry.name: entry for entry in cache_root_io.iterdir()}
        if set(cache_entries) != expected_cache_names:
            raise Deny("final_cache_inventory")
        for entry in cache_entries.values():
            _no_reparse(entry)
            if not stat.S_ISREG(os.lstat(entry).st_mode) or _link(entry):
                raise Deny("final_cache_not_ordinary_file")
    elif any(relative in by_path for relative in cache_paths.values()):
        raise Deny("final_cache_root_absent")

    sqlite_files: dict[str, Any] = {}
    before = _row_map(manifest["targetFilesBeforeAdmission"])
    for relative in (case_db_path, *sorted(sqlite_aux_paths)):
        prior = before[relative]
        if relative in by_path:
            actual = observed_row(relative)
            sqlite_files[relative] = {
                "present": True,
                "state": "PRESENT_OBSERVED",
                "beforeBytes": prior[0],
                "afterBytes": actual["bytes"],
                "beforeSha256": prior[1],
                "afterSha256": actual["sha256"],
                "changed": prior != (actual["bytes"], actual["sha256"]),
            }
        else:
            sqlite_files[relative] = {
                "present": False,
                "state": "ABSENT_AFTER_GUI_LIFECYCLE",
                "beforeBytes": prior[0],
                "afterBytes": None,
                "beforeSha256": prior[1],
                "afterSha256": None,
                "changed": True,
            }

    case_db = case_root / pathlib.PurePosixPath(case_db_path)
    metadata_uri = case_db.resolve(strict=True).as_uri() + "?mode=ro"
    connection = sqlite3.connect(metadata_uri, uri=True)
    try:
        connection.execute("PRAGMA query_only = ON")
        case_id_row = connection.execute(
            "SELECT value FROM meta WHERE key = 'case_id'"
        ).fetchone()
        schema_row = connection.execute(
            "SELECT value FROM meta WHERE key = 'schema_version'"
        ).fetchone()
    finally:
        connection.close()
    if (
        case_id_row is None
        or case_id_row[0] != EXPECTED_CASE_ID
        or schema_row is None
        or schema_row[0] != "1"
    ):
        raise Deny("case_db_metadata_identity")

    seeded_observations = [
        row for row in native_observations if row["kind"] == "nativeSeededFork"
    ]
    empty_observations = [
        row
        for row in native_observations
        if row["kind"] == "productionCreatedEmpty"
    ]
    return {
        "sourceCaseFilesUnchanged": True,
        "targetLogsUnchanged": target_logs_unchanged,
        "originalSessions": original_observations,
        "nativeSessions": native_observations,
        "nativeSeededForkCount": len(seeded_observations),
        "nativeEmptyCreateCount": len(empty_observations),
        "nativeSeededEmptyParentContract": (
            "Rejected: the pinned Session Controller requires a completed "
            "turn boundary and buildForkSeed requires a parent event."
        ),
        "sqliteFiles": sqlite_files,
        "caseDbMetadata": {
            "caseId": case_id_row[0],
            "schemaVersion": schema_row[0],
            "readMode": "sqlite_uri_mode_ro_query_only",
        },
        "projectionCacheFiles": cache_files,
        "notAcceptance": (
            "Structural file observation is not GUI-action proof. Root must "
            "independently observe the ordinary branch or empty/unavailable "
            "branch outcome, actual native IDs, parent stability, source "
            "immutability, zero new turns, and zero model requests."
        ),
    }


def _admit(raw_root: str) -> pathlib.Path:
    root = _validate_root(raw_root)
    manifest, layout = _load_prepared(root)
    if os.path.lexists(layout["admission"]):
        raise Deny("already_admitted")

    _assert_source_case()
    _assert_b_sources()
    if _row_map(_tree_files(layout["case"])) != _row_map(_expected_rows()):
        raise Deny("target_before_admission")

    sys.path.insert(0, str(B_SERVICE))
    from lawbench import contracts as imported_contracts
    from lawbench.case.registry import CaseRegistry

    imported_contracts.set_contracts_dir(B_CONTRACTS)
    registry = CaseRegistry(layout["appdata"], B_CONTRACTS / "case_db.sql")
    opened = registry.open(str(layout["case"]), None, None, None)
    if opened.get("case_id") != EXPECTED_CASE_ID:
        raise Deny("case_id_changed")
    recent = registry.recent()
    matches = [row for row in recent if row.get("case_id") == EXPECTED_CASE_ID]
    if (
        len(matches) != 1
        or _norm(matches[0].get("root", "")) != _norm(layout["case"])
        or matches[0].get("exists") is not True
        or matches[0].get("kind") != "daily"
    ):
        raise Deny("case_registry_shape")
    cases = _read_json(layout["appdata"] / "cases.json")
    if (
        cases.get("v") != 1
        or not isinstance(cases.get("cases"), list)
        or len(cases["cases"]) != 1
        or cases["cases"][0].get("case_id") != EXPECTED_CASE_ID
        or _norm(cases["cases"][0].get("root", "")) != _norm(layout["case"])
    ):
        raise Deny("cases_json_identity")

    source_after = _tree_files(SOURCE_CASE_ROOT)
    _assert_source_case()
    logs = _target_log_identity(layout["case"])
    report = {
        "format": ADMISSION_FORMAT,
        "status": "REGISTERED_NOT_GUI_RUN",
        "createdAt": _now(),
        "runRoot": str(root),
        "caseRoot": str(layout["case"]),
        "appdata": str(layout["appdata"]),
        "caseId": EXPECTED_CASE_ID,
        "registryCreated": opened.get("created"),
        "registryKind": matches[0].get("kind"),
        "casesJson": _file_identity(layout["appdata"] / "cases.json"),
        "sourceRunReport": _file_identity(SOURCE_RUN_REPORT),
        "sourceFiles": _expected_rows(),
        "sourceBeforeEqualsAfter": _row_map(source_after)
        == _row_map(_expected_rows()),
        "sourceLogs": logs,
        "preparedSha256": _sha256(layout["prepared"]),
        "settings": _file_identity(layout["settings"]),
        "dailyMarker": _file_identity(layout["daily_marker"]),
        "modelCalls": 0,
        "httpRequests": 0,
        "guiStarted": False,
        "deleteAttempted": False,
    }
    if (
        report["registryCreated"] is not False
        or report["sourceBeforeEqualsAfter"] is not True
        or report["casesJson"]["sha256"]
        != _sha256(layout["appdata"] / "cases.json")
        or manifest["expectedCaseId"] != EXPECTED_CASE_ID
    ):
        raise Deny("admission_result_identity")
    _write_exclusive(layout["admission"], report)
    _assert_source_case()
    return layout["admission"]


def _verify_admission(
    root: pathlib.Path,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, pathlib.Path]]:
    manifest, layout = _load_prepared(root, verify_target_case=False)
    if not layout["admission"].is_file():
        raise Deny("admission_missing")
    admission = _read_json(layout["admission"])
    if (
        not isinstance(admission, dict)
        or admission.get("format") != ADMISSION_FORMAT
        or admission.get("status") != "REGISTERED_NOT_GUI_RUN"
        or admission.get("runRoot") != str(root)
        or admission.get("caseRoot") != str(layout["case"])
        or admission.get("appdata") != str(layout["appdata"])
        or admission.get("caseId") != EXPECTED_CASE_ID
        or admission.get("registryKind") != "daily"
        or admission.get("sourceBeforeEqualsAfter") is not True
        or admission.get("modelCalls") != 0
        or admission.get("httpRequests") != 0
        or admission.get("guiStarted") is not False
        or admission.get("deleteAttempted") is not False
    ):
        raise Deny("admission_manifest_identity")
    _assert_source_case()
    if _target_log_identity(layout["case"]) != admission.get("sourceLogs"):
        raise Deny("target_logs_changed_after_admission")
    cases = _read_json(layout["appdata"] / "cases.json")
    if (
        cases.get("v") != 1
        or not isinstance(cases.get("cases"), list)
        or len(cases["cases"]) != 1
        or cases["cases"][0].get("case_id") != EXPECTED_CASE_ID
        or _norm(cases["cases"][0].get("root", "")) != _norm(layout["case"])
        or cases["cases"][0].get("kind") != "daily"
    ):
        raise Deny("registry_after_admission")
    if _read_json(layout["daily_marker"]) != {"root": str(layout["case"])}:
        raise Deny("daily_marker_identity")
    if _read_json(layout["settings"]) != {
        "v": 1,
        "servers": SERVERS,
        "defaults": {
            "thinking": "中",
            "window": "64K",
            "max_tokens": 16384,
            "temperature": 0.6,
        },
        "skill_presets": {},
        "templates": {"文书": None, "合同": None},
        "ocr_fallback_llm": False,
        "profile": {"lawyer_name": None},
        "office": {"dir": None, "invoice_buyer": None},
        "converter": "auto",
        "external_llm": {
            "enabled": True,
            "base_url": "http://127.0.0.1:65005/v1",
            "model": "t34-enabled-ui-synthetic",
            "context_window": 32768,
            "supports_tools": True,
        },
    }:
        raise Deny("settings_identity")
    _assert_no_runtime_artifacts(root)
    return manifest, admission, layout


def _host_values(root: pathlib.Path, appdata: pathlib.Path) -> tuple[int, str]:
    port = os.environ.get("LB_PORT")
    token = os.environ.get("LB_TOKEN")
    host_appdata = os.environ.get("LB_APPDATA")
    if port is None or re.fullmatch(r"[0-9]+", port) is None:
        raise Deny("invalid_LB_PORT")
    if token is None or re.fullmatch(r"[0-9a-f]{64}", token) is None:
        raise Deny("invalid_LB_TOKEN")
    if host_appdata is None or _norm(host_appdata) != _norm(appdata):
        raise Deny("LB_APPDATA_not_prepared")
    if os.environ.get("LB_FORWARD_PORT", "") != "65005":
        raise Deny("LB_FORWARD_PORT_not_fixed")
    host_port = int(port, 10)
    if not 1 <= host_port <= 65535:
        raise Deny("LB_PORT_out_of_range")
    if not root.is_dir():
        raise Deny("root_missing")
    return host_port, token


def _query_values(
    query: bytes, *, required: set[str], optional: set[str] | None = frozenset()
) -> dict[str, str] | None:
    if not query or len(query) > 4096:
        return None
    try:
        pairs = parse_qsl(
            query.decode("utf-8"),
            keep_blank_values=True,
            strict_parsing=True,
            max_num_fields=12,
        )
    except (UnicodeDecodeError, ValueError):
        return None
    keys = [key for key, _ in pairs]
    if (
        any(not value for _, value in pairs)
        or len(keys) != len(set(keys))
        or not required.issubset(keys)
        or (optional is not None and not set(keys).issubset(required | optional))
    ):
        return None
    return dict(pairs)


async def _deny_reply(send, status: int, code: str) -> None:
    body = json.dumps(
        {"error": {"code": code, "message": "outside T31 branch GUI preparation boundary"}},
        separators=(",", ":"),
    ).encode()
    await send(
        {
            "type": "http.response.start",
            "status": status,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode()),
            ],
        }
    )
    await send({"type": "http.response.body", "body": body, "more_body": False})


def expected_saved_settings() -> dict[str, Any]:
    return {
        "v": 1,
        "servers": {
            "llm_base_url": "http://127.0.0.1:65001/v1",
            "prep_base_url": "http://127.0.0.1:65002",
            "llm_alt_base_url": "http://127.0.0.1:65003/v1",
            "prep_alt_base_url": "http://127.0.0.1:65004",
        },
        "defaults": {
            "thinking": "中",
            "window": "64K",
            "max_tokens": 16384,
            "temperature": 0.6,
        },
        "skill_presets": {},
        "templates": {"文书": None, "合同": None},
        "ocr_fallback_llm": False,
        "profile": {"lawyer_name": None},
        "office": {"dir": None, "invoice_buyer": None},
        "converter": "auto",
        "external_llm": {
            "enabled": True,
            "base_url": "http://127.0.0.1:65005/v1",
            "model": "t34-enabled-ui-synthetic",
            "context_window": 65536,
            "supports_tools": True,
        },
    }


class Firewall:
    def __init__(
        self,
        app,
        *,
        root: pathlib.Path,
        case: pathlib.Path,
        case_id: str,
        host_token: str,
    ) -> None:
        self.app = app
        self.root = root
        self.case = case
        self.case_id = case_id
        self.expected_auth = ("Bearer " + host_token).encode()
        self.ledger = root / "requests.ndjson"
        self.lock = threading.RLock()
        self.records: list[dict[str, Any]] = []
        self.settings_put_attempts = 0
        self.settings_put_ok = 0
        self.case_open_attempts = 0
        self.case_open_ok = 0
        self.read_ok = 0
        self.auth_denials = 0
        self.policy_denials: dict[str, int] = {}
        with self.ledger.open("x", encoding="utf-8"):
            pass

    def _record(
        self, method: str, path: str, status: int | None, disposition: str, started: float
    ) -> None:
        row = {
            "method": method,
            "path": path,
            "status": status,
            "disposition": disposition,
            "elapsed_ms": int((time.monotonic() - started) * 1000),
        }
        with self.lock:
            self.records.append(row)
            with self.ledger.open("a", encoding="utf-8", newline="\n") as stream:
                stream.write(json.dumps(row, ensure_ascii=False) + "\n")

    def _deny(self, code: str) -> None:
        with self.lock:
            self.policy_denials[code] = self.policy_denials.get(code, 0) + 1

    def _authorized(self, scope) -> bool:
        values = [
            value
            for key, value in scope.get("headers", [])
            if key.lower() == b"authorization"
        ]
        if len(values) == 1 and hmac.compare_digest(values[0], self.expected_auth):
            return True
        with self.lock:
            self.auth_denials += 1
        return False

    def _policy(self, method: str, path: str, data: Any, query: bytes) -> str | None:
        if method == "PUT" and path == "/api/settings":
            if query:
                return "SETTINGS_PUT_QUERY"
            if (
                not isinstance(data, dict)
                or json.dumps(
                    data, sort_keys=True, separators=(",", ":"), ensure_ascii=False
                )
                != json.dumps(
                    expected_saved_settings(),
                    sort_keys=True,
                    separators=(",", ":"),
                    ensure_ascii=False,
                )
            ):
                return "SETTINGS_PUT_BODY"
            with self.lock:
                if self.settings_put_attempts >= 1:
                    return "SETTINGS_PUT_LIMIT"
                self.settings_put_attempts += 1
            return None
        if method == "POST" and path == "/api/case/open":
            if query:
                return "CASE_OPEN_QUERY"
            if not (
                isinstance(data, dict)
                and set(data).issubset({"path", "template", "kind"})
                and {"path", "template"}.issubset(data)
                and data.get("template") is None
                and data.get("kind") in {None, "daily"}
                and isinstance(data.get("path"), str)
                and _norm(data["path"]) == _norm(self.case)
            ):
                return "CASE_OPEN_BODY"
            with self.lock:
                if self.case_open_attempts >= 2:
                    return "CASE_OPEN_LIMIT"
                self.case_open_attempts += 1
            return None
        if method != "GET" or path not in READ_ONLY_ROUTES:
            return "ROUTE_OR_METHOD_NOT_ALLOWED"
        if path in NO_QUERY_ROUTES:
            return None if not query else "UNEXPECTED_QUERY"
        if path == "/api/task/current":
            values = _query_values(query, required={"session_id"}, optional=None)
            if values is None or len(values["session_id"]) > 128:
                return "SESSION_ID_QUERY"
            return None
        if path in CASE_QUERY_ROUTES:
            values = _query_values(query, required={"case_id"}, optional=None)
            if values is None:
                return "CASE_QUERY_EXACT"
            if values["case_id"] != self.case_id:
                return "CASE_ID_OUTSIDE_RUN"
        return None

    def _complete(self, method: str, path: str, status: int | None, response: Any) -> None:
        if method == "PUT" and path == "/api/settings":
            value = response.get("value") if isinstance(response, dict) else None
            if (
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and isinstance(value, dict)
                and json.dumps(
                    value, sort_keys=True, separators=(",", ":"), ensure_ascii=False
                )
                == json.dumps(
                    expected_saved_settings(),
                    sort_keys=True,
                    separators=(",", ":"),
                    ensure_ascii=False,
                )
            ):
                with self.lock:
                    self.settings_put_ok += 1
            return
        if path == "/health":
            return
        if method == "POST" and path == "/api/case/open":
            value = response.get("value") if isinstance(response, dict) else None
            if (
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and isinstance(value, dict)
                and value.get("case_id") == self.case_id
                and value.get("created") is False
            ):
                with self.lock:
                    self.case_open_ok += 1
            return
        if status == 200 and isinstance(response, dict) and response.get("ok") is True:
            with self.lock:
                self.read_ok += 1

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return
        method, path, started = scope["method"], scope["path"], time.monotonic()
        if not self._authorized(scope):
            self._record(method, path, 401, "auth_not_forwarded", started)
            await _deny_reply(send, 401, "AUTH_REQUIRED")
            return

        body = b""
        data = None
        if method in {"POST", "PUT"}:
            try:
                body = await _read_body(receive)
            except Deny:
                self._deny("BODY_TOO_LARGE")
                self._record(method, path, 413, "BODY_TOO_LARGE", started)
                await _deny_reply(send, 413, "BODY_TOO_LARGE")
                return
            if body is None:
                self._record(method, path, None, "disconnected", started)
                return
            data = _json(body)
            used = False

            async def replay():
                nonlocal used
                if not used:
                    used = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return await original_receive()

            original_receive = receive
            receive = replay

        query = scope.get("query_string", b"")
        denial = self._policy(method, path, data, query)
        if denial:
            self._deny(denial)
            self._record(method, path, 403, denial, started)
            await _deny_reply(send, 403, denial)
            return

        status: int | None = None
        captured = bytearray()
        overflow = False

        async def observed(message):
            nonlocal status, overflow
            if message["type"] == "http.response.start":
                status = int(message["status"])
            elif message["type"] == "http.response.body":
                chunk = message.get("body", b"")
                room = max(0, MAX_CAPTURE - len(captured))
                if len(chunk) > room:
                    overflow = True
                captured.extend(chunk[:room])
            await send(message)

        try:
            await self.app(scope, receive, observed)
        finally:
            self._record(method, path, status, "native_app", started)
        if overflow:
            self._deny("RESPONSE_CAPTURE_OVERFLOW")
            return
        self._complete(method, path, status, _json(bytes(captured)))

    def evidence(self) -> dict[str, Any]:
        with self.lock:
            return {
                "requests": len(self.records),
                "read_ok": self.read_ok,
                "settings_put_attempts": self.settings_put_attempts,
                "settings_put_ok": self.settings_put_ok,
                "case_open_attempts": self.case_open_attempts,
                "case_open_ok": self.case_open_ok,
                "auth_denials": self.auth_denials,
                "policy_denials": dict(sorted(self.policy_denials.items())),
                "delete_route_observed": any(
                    "session-delete" in row["path"] for row in self.records
                ),
            }


class DisabledRetainer:
    def close(self) -> None:
        return None


async def _serve(root: pathlib.Path, seconds: int) -> tuple[str, str]:
    manifest, admission, layout = _verify_admission(root)
    host_port, host_token = _host_values(root, layout["appdata"])
    started_path = root / "started.json"
    _write_json(
        started_path,
        {
            "status": "started",
            "pid": os.getpid(),
            "started_at": _now(),
            "root": str(root),
            "case_id": EXPECTED_CASE_ID,
            "host_port": host_port,
            "requested_seconds": seconds,
        },
    )

    guard = BASE.Guard()
    local_count = {"local": 0, "external": 0, "keyring": 0}
    cred_lock = threading.Lock()
    restore = None
    logs = None
    lb = None
    server = None
    task = None
    firewall = None
    failure: str | None = None
    port: int | None = None
    net_closed = False
    logs_closed = False
    started_at = _now()

    def local_key():
        with cred_lock:
            local_count["local"] += 1
        return "T31-branch-gui-readonly-placeholder"

    def external_key():
        with cred_lock:
            local_count["external"] += 1
        return "T31-branch-gui-readonly-placeholder"

    try:
        _scrub_env(layout)
        _install_keyring(local_count, guard, cred_lock)
        _assert_b_sources()
        guard.phase = "product_import"
        restore = _install_guards(guard)
        sys.path.insert(0, str(B_SERVICE))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench.app import create_app
        from lawbench.case import gate as gate_module
        from lawbench.case import materials as materials_module
        from lawbench.config import Config
        from lawbench.ingest import libreoffice as lo_module

        logs = imported_logs
        module_file = pathlib.Path(sys.modules["lawbench"].__file__).resolve()
        if module_file.parents[2] != B_PRODUCT_ROOT.resolve():
            raise Deny("product_root_not_current_b")
        gate_module._registry_onedrive_folders = lambda: []
        lo_module.find_soffice = lambda: None

        def no_convert(*_args, **_kwargs):
            guard.deny("office_conversion")
            raise Deny("office_conversion")

        materials_module.Converter.convert = no_convert
        guard.phase = "app_create"
        config = Config(
            token=host_token,
            appdata=layout["appdata"],
            port=host_port,
            forward_port=65005,
            skills_dirs=[SKILLS_DIR],
            contracts_dir=B_CONTRACTS,
            validate_responses=True,
        )

        def refuse(_request):
            guard.deny("httpx_mock_transport")
            raise Deny("httpx_mock_transport")

        native = create_app(
            config,
            key_getter=local_key,
            external_key_getter=external_key,
            transport=httpx.MockTransport(refuse),
        )
        lb = native.state.lb
        _assert_wiring(lb, layout["appdata"], host_port, host_token)
        lb.retainer = DisabledRetainer()

        def no_recycle(*_args, **_kwargs):
            guard.deny("recycle")
            raise Deny("recycle")

        lb.materials.can_recycle = no_recycle
        lb.materials.recycle = no_recycle
        with cred_lock:
            if local_count["local"] or local_count["external"]:
                raise Deny("credential_getter_at_startup")

        firewall = Firewall(
            native,
            root=root,
            case=layout["case"],
            case_id=EXPECTED_CASE_ID,
            host_token=host_token,
        )
        server = uvicorn.Server(
            uvicorn.Config(
                app=firewall,
                host="127.0.0.1",
                port=host_port,
                workers=1,
                lifespan="off",
                ws="none",
                loop="asyncio",
                http="h11",
                access_log=False,
                log_level="warning",
                log_config=None,
                server_header=False,
                date_header=False,
                proxy_headers=False,
            )
        )
        guard.phase = "server_start"
        task = asyncio.create_task(server.serve())
        await _started(server, task)
        listener = _listener(server)
        port = int(listener.getsockname()[1])
        if port != host_port:
            raise Deny("listener_port_mismatch")
        if imported_contracts.version() != "1.6":
            raise Deny("contract_version_not_1_6")
        _write_json(
            root / "ready.json",
            {
                "status": "ready",
                "host": "127.0.0.1",
                "port": port,
                "pid": os.getpid(),
                "started_at": _now(),
                "contract_version": "1.6",
                "case_path": str(layout["case"]),
                "case_id": EXPECTED_CASE_ID,
                "source_session_id": SOURCE_SESSION,
                "child_session_id": CHILD_SESSION,
                "prepared_sha256": _sha256(layout["prepared"]),
                "admission_sha256": _sha256(layout["admission"]),
                "allowed_routes": sorted(READ_ONLY_ROUTES)
                + ["POST /api/case/open"],
            },
        )
        guard.phase = "serving"
        deadline = asyncio.get_running_loop().time() + seconds
        while asyncio.get_running_loop().time() < deadline:
            if task.done():
                await task
                raise Deny("server_exited_early")
            await asyncio.sleep(
                min(0.25, max(0.0, deadline - asyncio.get_running_loop().time()))
            )
    except asyncio.CancelledError:
        failure = "cancelled"
    except Exception as exc:
        failure = getattr(exc, "code", type(exc).__name__)
    finally:
        guard.phase = "shutdown"
        if server is not None:
            server.should_exit = True
        if task is not None:
            try:
                await asyncio.wait_for(asyncio.shield(task), timeout=15)
            except asyncio.TimeoutError:
                if server is not None:
                    server.force_exit = True
                try:
                    await asyncio.wait_for(asyncio.shield(task), timeout=5)
                except asyncio.TimeoutError:
                    task.cancel()
                    try:
                        await task
                    except BaseException:
                        pass
            except Exception as exc:
                failure = failure or type(exc).__name__
        if lb is not None:
            try:
                lb.net.client.close()
                net_closed = bool(lb.net.client.is_closed)
            except Exception:
                net_closed = False
        if logs is not None:
            try:
                logs.close()
                logs_closed = True
            except Exception:
                logs_closed = False
        if restore is not None:
            restore()

    source_unchanged = False
    target_logs_unchanged = False
    final_target: dict[str, Any] = {}
    try:
        source_unchanged = _row_map(_tree_files(SOURCE_CASE_ROOT)) == _row_map(
            _expected_rows()
        )
        final_target = _t31_final_target_observation(
            layout["case"], manifest, admission
        )
        target_logs_unchanged = final_target["targetLogsUnchanged"]
    except Exception as exc:
        failure = failure or getattr(exc, "code", type(exc).__name__)
    guard_state = guard.snapshot()
    request_state = firewall.evidence() if firewall is not None else {}
    query_count = int(request_state.get("read_ok", 0))
    if guard_state.get("violations") or any(local_count.values()):
        failure = failure or "guard_or_credential_violation"
    if not source_unchanged:
        failure = failure or "source_changed"
    task_done = bool(task is not None and task.done())
    listener_closed = _closed(server)
    if task is not None and not (
        task_done and listener_closed and net_closed and logs_closed
    ):
        failure = failure or "cleanup_incomplete"

    final = {
        "outcome": "COMPLETED_FOR_ROOT_REVIEW" if failure is None else "FAILED_FOR_ROOT_REVIEW",
        "root": str(root),
        "startedAt": started_at,
        "finishedAt": _now(),
        "requestedSeconds": seconds,
        "failureCode": failure,
        "caseId": EXPECTED_CASE_ID,
        "sourceSessionId": SOURCE_SESSION,
        "childSessionId": CHILD_SESSION,
        "sourceUnchanged": source_unchanged,
        "targetLogsUnchanged": target_logs_unchanged,
        "finalTargetObservation": final_target,
        "credentials": {
            "localGetterCalls": local_count["local"],
            "externalGetterCalls": local_count["external"],
            "keyringRejections": local_count["keyring"],
        },
        "guard": guard_state,
        "requests": request_state,
        "routeReads": query_count,
        "lifespan": "off",
        "ocrStarted": False,
        "retainerStarted": False,
        "credentialsDisabled": True,
        "listener": {
            "host": "127.0.0.1",
            "port": port,
            "websocket": False,
            "forwardListener": False,
        },
        "cleanup": {
            "serverTaskDone": task_done,
            "listenerClosed": listener_closed,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "rootRetained": True,
        },
        "notAcceptance": (
            "This service writes structural file observations only. Root must "
            "independently observe the actual GUI action, actual native IDs, "
            "parent stability, source immutability, zero new turns, and zero "
            "model requests. This is not GUI, model, packaging, whole-T31, or "
            "project acceptance; the just-compacted state remains unverified."
        ),
    }
    _write_json(root / "final-metadata.json", final)
    return str(root / "final-metadata.json"), failure or ""


def _serve_checked(raw_root: str, seconds: int) -> tuple[pathlib.Path, str, str]:
    root = _validate_root(raw_root)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    final_path = ""
    failure = ""
    try:
        final_path, failure = loop.run_until_complete(_serve(root, seconds))
    except BaseException as exc:
        failure = getattr(exc, "code", type(exc).__name__)
        try:
            _write_json(
                root / "run-error.json",
                {
                    "outcome": "FAILED_FOR_ROOT_REVIEW",
                    "exceptionType": type(exc).__name__,
                    "guardCode": getattr(exc, "code", None),
                    "rootRetained": True,
                },
            )
        except BaseException:
            pass
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except BaseException:
            pass
        loop.close()
        asyncio.set_event_loop(None)
    try:
        _write_json(
            root / "loop-closed.json",
            {
                "closedAt": _now(),
                "eventLoopClosed": True,
                "finalMetadataWritten": bool(final_path and pathlib.Path(final_path).is_file()),
            },
        )
    except BaseException:
        failure = failure or "loop_close_evidence_failed"
    return root, failure, final_path


def main() -> int:
    parser = argparse.ArgumentParser(description="T31 genuine-branch GUI entry")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--admit", action="store_true")
    mode.add_argument("--serve", action="store_true")
    parser.add_argument("--root", required=True)
    parser.add_argument("--seconds", type=int, default=600)
    args = parser.parse_args()
    if args.admit:
        try:
            report = _admit(args.root)
        except BaseException as exc:
            print(
                f"admit refused: {getattr(exc, 'code', type(exc).__name__)}",
                file=sys.stderr,
            )
            return 2
        print(report)
        return 0
    if not 1 <= args.seconds <= MAX_SECONDS:
        parser.error(f"--seconds must be 1..{MAX_SECONDS}")
    try:
        _, failure, final_path = _serve_checked(args.root, args.seconds)
    except BaseException as exc:
        print(
            f"serve refused: {getattr(exc, 'code', type(exc).__name__)}",
            file=sys.stderr,
        )
        return 2
    if final_path:
        print(final_path)
    if failure:
        print(f"serve failed: {failure}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
