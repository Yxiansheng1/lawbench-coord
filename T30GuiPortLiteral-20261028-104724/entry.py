#!/usr/bin/env python3
"""T30 genuine-session GUI admission and read-only service entry.

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
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T30"
    r"\GenuineSessionGui-20261028-094637"
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
    r"D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932"
    r"\reviewed-source-pins.json"
)
B_SOURCE_PINS_BYTES = 53547
B_SOURCE_PINS_SHA256 = (
    "5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf"
)

SAFETY_BASE = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830"
    r"\10-MixedMaterialsGui-20261027-164646-server.py"
)
SAFETY_BASE_BYTES = 151304
SAFETY_BASE_SHA256 = (
    "a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5"
)

PREPARED_FORMAT = "lawbench-t30-genuine-session-gui-prepared-v1"
ADMISSION_FORMAT = "lawbench-t30-genuine-session-gui-admission-v1"
RUN_NAME = re.compile(r"^T30-genuine-session-gui-[0-9]{8}-[0-9]{6}$")
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
    required_paths = {source_path, case_db_path}
    allowed_paths = (
        required_paths
        | {child_path}
        | sqlite_aux_paths
        | set(cache_paths.values())
    )
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

    source_row = exact_row(source_path)
    session_root = case_root / pathlib.PurePosixPath(source_path).parent.parent
    session_root_io = _long_local_alias(session_root)
    _no_reparse(session_root_io)
    if not session_root_io.is_dir() or _link(session_root_io):
        raise Deny("final_session_root")
    entries = {entry.name: entry for entry in session_root_io.iterdir()}
    expected_session_dirs = (
        {SOURCE_SESSION, CHILD_SESSION} if child_present else {SOURCE_SESSION}
    )
    if set(entries) != expected_session_dirs:
        raise Deny("final_session_directory_inventory")
    for name in expected_session_dirs:
        entry = entries[name]
        _no_reparse(entry)
        if not entry.is_dir() or _link(entry):
            raise Deny("final_session_directory")

    if child_present:
        child_row = exact_row(child_path)
        if child_row != admission.get("sourceLogs", {}).get("child"):
            raise Deny("admission_log_identity")
        child_state = "PRESENT_UNCHANGED"
        target_logs_unchanged = True
    else:
        if CHILD_SESSION in entries:
            raise Deny("final_child_directory_present")
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
    return {
        "sourceCaseFilesUnchanged": True,
        "sourceSession": source_row,
        "childSession": child_row,
        "childSessionState": child_state,
        "targetLogsUnchanged": target_logs_unchanged,
        "sqliteFiles": sqlite_files,
        "caseDbMetadata": {
            "caseId": case_id_row[0],
            "schemaVersion": schema_row[0],
            "readMode": "sqlite_uri_mode_ro_query_only",
        },
        "projectionCacheFiles": cache_files,
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
            "enabled": False,
            "base_url": None,
            "model": None,
            "context_window": None,
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
    if _norm(os.environ.get("LB_FORWARD_PORT", "")) != "65005":
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
        {"error": {"code": code, "message": "outside T30 GUI preparation boundary"}},
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
        if method == "POST":
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
        return "T30-gui-readonly-placeholder"

    def external_key():
        with cred_lock:
            local_count["external"] += 1
        return "T30-gui-readonly-placeholder"

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
        final_target = _final_target_observation(
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
            "Child-directory absence only awaits root GUI and OS recycle proof. "
            "Projection-cache presence and SQLite auxiliary-file lifecycle are "
            "observations, not acceptance proof. This service run is not GUI, "
            "session-delete, recycle-bin, USB, model, OCR, packaging, or "
            "whole-T30 acceptance."
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
    parser = argparse.ArgumentParser(description="T30 genuine-session GUI entry")
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
