#!/usr/bin/env python3
"""T32 native-document citation entry.

The prepare phase creates one fresh private root. The serve phase reuses the
reviewed mixed-materials safety base, current-B product sources, and one exact
native ASGI bootstrap. That bootstrap opens the owned case, imports one
synthetic reference TXT, begins one legacy unscoped task, reads the TXT through
case_read_material, saves one deterministic citation through case_save_draft,
and ends the task as aborted with zero model calls.

After bootstrap, TCP is read-only except for exact same-case case/open and the
exact GET /api/source request for the generated material, citation, and task.
The entry is not a GUI/Host/model/OCR/packaging acceptance.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import hmac
import json
import os
import pathlib
import platform
import re
import shutil
import socket
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


EXPECTED_HEAD = "dc56a93be4b07dbe7a48863e3135351659817fb5"
PREP_DIR = pathlib.Path(__file__).resolve().parent
PRODUCT_ROOT = PREP_DIR.parents[4]
SERVICE_DIR = PRODUCT_ROOT / "service"
CONTRACTS_DIR = PRODUCT_ROOT / "contracts"
SKILLS_DIR = PRODUCT_ROOT / "skills"
RUNS_ROOT = PREP_DIR / "runs"

SAFETY_BASE = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830"
    r"\10-MixedMaterialsGui-20261027-164646-server.py"
)
SAFETY_BASE_BYTES = 151304
SAFETY_BASE_SHA256 = (
    "a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5"
)
SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932"
    r"\reviewed-source-pins.json"
)
SOURCE_PINS_BYTES = 53547
SOURCE_PINS_SHA256 = (
    "5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf"
)
FIXTURE = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg"
)
FIXTURE_BYTES = 47379
FIXTURE_SHA256 = (
    "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
)

RUN_NAME = re.compile(r"^T32-citation-[0-9]{8}-[0-9]{6}$")
PREPARED_FORMAT = "T32-native-document-citation-entry-prepared-v1"
CASE_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
TASK_ID = re.compile(r"^T-[0-9]{14}-[0-9a-f]{4}$")
MATERIAL_ID = re.compile(r"^M[0-9]{4}$")

SESSION_ID = "11111111-1111-4111-8111-111111111111"
REF_ID = "R01"
SOURCE_FILE = "引用材料.txt"
MATERIAL_NAME = "引用材料"
SOURCE_LINE = "T32 合成引用原文，仅用于本地测试。"
SOURCE_TEXT = SOURCE_LINE + "\n"
CITATION = f"〔{MATERIAL_NAME} 第1行〕"
DRAFT_TITLE = "T32NativeCitation"
DRAFT_TEXT = (
    "# T32 native document citation\n\n"
    f"引用行：{CITATION}\n\n"
    "控制行：普通文字，没有出处。\n"
)

SERVERS = {
    "llm_base_url": "http://127.0.0.1:65001/v1",
    "prep_base_url": "http://127.0.0.1:65002",
    "llm_alt_base_url": "http://127.0.0.1:65003/v1",
    "prep_alt_base_url": "http://127.0.0.1:65004",
}
EXTERNAL_OFF = {
    "enabled": False,
    "base_url": None,
    "model": None,
    "context_window": None,
    "supports_tools": True,
}

DEFAULT_SECONDS = 600
MAX_SECONDS = 600
MAX_BODY = 64 * 1024
MAX_CAPTURE = 1024 * 1024
DRAFT_LIMIT = 64 * 1024
SPARSE = 0x200

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
    {
        "/health",
        "/api/case/recent",
        "/api/settings",
        "/api/capsules",
    }
)
ROUTES = frozenset(
    {
        *(("GET", path) for path in CASE_QUERY_ROUTES),
        *(("GET", path) for path in NO_QUERY_ROUTES),
        ("GET", "/api/task/current"),
        ("GET", "/api/source"),
        ("POST", "/api/case/open"),
    }
)
RUNTIME_ARTIFACTS = (
    "started.json",
    "native-calls.ndjson",
    "bootstrap-report.json",
    "ready.json",
    "requests.ndjson",
    "final-metadata.json",
    "loop-closed.json",
    "run-error.json",
)


def _plain_sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
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
    # The frozen helper was prepared under the shorter coordination-directory
    # layout and derives PRODUCT_ROOT from parents[4]. Execute its verified
    # source with a non-existent compatibility path at the same repo depth so
    # that derivation uses current-B without editing or copying the old file.
    compatibility_file = (
        PREP_DIR.parent / "_verified_safety_base_compat" / "server.py"
    )
    namespace: dict[str, Any] = {
        "__name__": "_t32_citation_safety_base",
        "__file__": str(compatibility_file),
        "__package__": None,
    }
    with open(SAFETY_BASE, "rb") as stream:
        source = stream.read()
    exec(compile(source, str(SAFETY_BASE), "exec"), namespace)
    return types.SimpleNamespace(**namespace)


BASE = _load_safety_base()
Deny = BASE.Deny
_norm = BASE._norm
_within = BASE._within
_link = BASE._link
_no_reparse = BASE._no_reparse
_sha256 = BASE._sha256
_file_identity = BASE._file_identity
_write_json = BASE._write_json
_read_json = BASE._read_json
_path_identity = BASE._path_identity
_scrub_env = BASE._scrub_env
_install_keyring = BASE._install_keyring
_install_guards = BASE._install_guards
_assert_wiring = BASE._assert_wiring
_read_body = BASE._read_body
_json = BASE._json
_started = BASE._started
_listener = BASE._listener
_closed = BASE._closed


async def _guard_reply(send, status: int, code: str) -> None:
    body = json.dumps(
        {
            "error": {
                "code": code,
                "message": "outside T32 citation entry boundary",
            }
        },
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


def _layout(root: pathlib.Path) -> dict[str, pathlib.Path]:
    private = {
        name: root / "private" / name
        for name in ("home", "appdata", "system", "temp")
    }
    return {
        "root": root,
        "case": root / "case",
        "ready": root / "input" / "ready",
        "paste": private["appdata"] / "临时" / "粘贴",
        **{f"private_{name}": value for name, value in private.items()},
        "appdata": private["appdata"],
        "settings": private["appdata"] / "settings.json",
        "daily_marker": private["appdata"] / "daily-case.json",
        "prepared": root / "prepared.json",
    }


def _validate_run_path(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute() or _norm(root.parent) != _norm(RUNS_ROOT):
        raise Deny("root_must_be_direct_child_of_runs")
    if RUN_NAME.fullmatch(root.name) is None:
        raise Deny("bad_run_name")
    return root


def _settings() -> dict[str, Any]:
    return {
        "v": 1,
        "servers": dict(SERVERS),
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
        "external_llm": dict(EXTERNAL_OFF),
    }


def _pinned_sources() -> dict[str, Any]:
    _no_reparse(SOURCE_PINS)
    info = os.lstat(SOURCE_PINS)
    if (
        not stat.S_ISREG(info.st_mode)
        or info.st_size != SOURCE_PINS_BYTES
        or _sha256(SOURCE_PINS) != SOURCE_PINS_SHA256
    ):
        raise Deny("source_pins_identity")
    pins = _read_json(SOURCE_PINS)
    if not isinstance(pins, dict) or not pins or "entry/server.py" in pins:
        raise Deny("source_pins_format")
    actual_names = {
        path.relative_to(PRODUCT_ROOT).as_posix()
        for base in (SERVICE_DIR, CONTRACTS_DIR)
        for path in base.rglob("*")
        if path.is_file()
        and "__pycache__" not in path.parts
        and path.suffix.lower() in {".py", ".json", ".sql", ".toml"}
    }
    if actual_names != set(pins):
        raise Deny("source_pin_file_set")
    for relative, expected in pins.items():
        if (
            not isinstance(expected, dict)
            or set(expected) != {"sha256", "bytes"}
            or not isinstance(expected["sha256"], str)
            or not isinstance(expected["bytes"], int)
        ):
            raise Deny("source_pin_shape")
        path = PRODUCT_ROOT / pathlib.PurePosixPath(relative)
        _no_reparse(path)
        if (
            path.stat().st_size != expected["bytes"]
            or _sha256(path) != expected["sha256"]
        ):
            raise Deny("source_pin_mismatch")
    return pins


def _source_identity() -> dict[str, Any]:
    pins = _pinned_sources()
    entry = pathlib.Path(__file__).resolve()
    _no_reparse(entry)
    result = {name: dict(value) for name, value in pins.items()}
    result["entry/server.py"] = {
        "sha256": _sha256(entry),
        "bytes": entry.stat().st_size,
    }
    return result


def _fixture_identity(path: pathlib.Path) -> dict[str, Any]:
    identity = _file_identity(path)
    info = os.lstat(path)
    if (
        getattr(info, "st_nlink", 0) != 1
        or getattr(info, "st_file_attributes", 0) & SPARSE
        or identity["bytes"] != FIXTURE_BYTES
        or identity["sha256"] != FIXTURE_SHA256
    ):
        raise Deny("jpeg_fixture_identity")
    return {
        **identity,
        "mtime_ns": getattr(info, "st_mtime_ns", int(info.st_mtime * 1_000_000_000)),
    }


def _source_file_identity(path: pathlib.Path) -> dict[str, Any]:
    _no_reparse(path)
    info = os.lstat(path)
    expected = SOURCE_TEXT.encode("utf-8")
    if (
        not stat.S_ISREG(info.st_mode)
        or _link(path)
        or getattr(info, "st_nlink", 0) != 1
        or getattr(info, "st_file_attributes", 0) & SPARSE
        or info.st_size != len(expected)
    ):
        raise Deny("citation_source_not_plain_small")
    with open(path, "rb") as stream:
        if stream.read() != expected:
            raise Deny("citation_source_bytes")
    return {
        **_file_identity(path),
        "mtime_ns": getattr(info, "st_mtime_ns", int(info.st_mtime * 1_000_000_000)),
        "text": SOURCE_TEXT,
    }


def _prepare(raw_root: str) -> pathlib.Path:
    root = _validate_run_path(raw_root)
    if os.path.lexists(root):
        raise Deny("root_exists")
    _no_reparse(root, allow_missing_tail=True)
    root.mkdir(parents=True, exist_ok=False)
    layout = _layout(root)
    for key in ("private_home", "appdata", "private_system", "private_temp"):
        layout[key].mkdir(parents=True, exist_ok=False)
    layout["case"].mkdir(parents=True, exist_ok=False)
    layout["ready"].mkdir(parents=True, exist_ok=False)
    _write_json(layout["settings"], _settings())
    _write_json(layout["daily_marker"], {"root": str(layout["case"])})

    _fixture_identity(FIXTURE)
    fixture_copy = layout["ready"] / FIXTURE.name
    with open(FIXTURE, "rb") as source, open(fixture_copy, "xb") as destination:
        shutil.copyfileobj(source, destination, length=1 << 20)
    source_file = layout["ready"] / SOURCE_FILE
    with open(source_file, "xb") as stream:
        stream.write(SOURCE_TEXT.encode("utf-8"))

    fixture_source = _fixture_identity(FIXTURE)
    fixture_copy_identity = _fixture_identity(fixture_copy)
    citation_source = _source_file_identity(source_file)
    source = _source_identity()
    safety_base = _file_identity(SAFETY_BASE)

    manifest = {
        "format": PREPARED_FORMAT,
        "not_service_registration": True,
        "not_case_id_or_session": True,
        "not_acceptance": (
            "Prepared fixture only. This is not GUI, Host/RPC, model, OCR, "
            "packaging, or production evidence."
        ),
        "created_at": datetime.now().astimezone().isoformat(timespec="milliseconds"),
        "expected_head": EXPECTED_HEAD,
        "source_pins": {
            **_file_identity(SOURCE_PINS),
            "frozen_sha256": SOURCE_PINS_SHA256,
        },
        "safety_base": {
            **safety_base,
            "frozen_sha256": SAFETY_BASE_SHA256,
        },
        "source": source,
        "paths": {
            "root": _path_identity(root),
            "case": _path_identity(layout["case"]),
            "ready": _path_identity(layout["ready"]),
            "appdata": _path_identity(layout["appdata"]),
            "paste": _path_identity(layout["paste"]),
            "home": _path_identity(layout["private_home"]),
            "system": _path_identity(layout["private_system"]),
            "temp": _path_identity(layout["private_temp"]),
        },
        "initial_case_empty": True,
        "fixture_source": fixture_source,
        "fixture_copy": fixture_copy_identity,
        "citation_source": citation_source,
        "settings": {
            **_file_identity(layout["settings"]),
            "fixed_servers": dict(SERVERS),
            "external_llm": dict(EXTERNAL_OFF),
        },
        "daily_marker": {
            **_file_identity(layout["daily_marker"]),
            "host_shape": {"root": str(layout["case"])},
            "service_registration": False,
        },
        "draft": {
            "title": DRAFT_TITLE,
            "text": DRAFT_TEXT,
            "bytes": len(DRAFT_TEXT.encode("utf-8")),
            "sha256": hashlib.sha256(DRAFT_TEXT.encode("utf-8")).hexdigest(),
        },
        "citation": {
            "text": CITATION,
            "material_name": MATERIAL_NAME,
            "unit": "line",
            "from": 1,
        },
    }
    _write_json(layout["prepared"], manifest)
    return layout["prepared"]


def _check_path(value: Any, expected: pathlib.Path, code: str) -> None:
    if not isinstance(value, dict) or (
        value.get("path") != str(expected) or value.get("canonical") != _norm(expected)
    ):
        raise Deny(code)


def _verify_prepared(
    root: pathlib.Path,
) -> tuple[dict[str, Any], dict[str, pathlib.Path], dict[str, Any], str]:
    if not root.is_dir():
        raise Deny("prepared_root_missing")
    _no_reparse(root)
    layout = _layout(root)
    manifest = _read_json(layout["prepared"])
    prepared_sha256 = _sha256(layout["prepared"])
    if not isinstance(manifest, dict) or manifest.get("format") != PREPARED_FORMAT:
        raise Deny("prepared_manifest_format")
    if (
        manifest.get("not_service_registration") is not True
        or manifest.get("not_case_id_or_session") is not True
        or manifest.get("initial_case_empty") is not True
        or manifest.get("expected_head") != EXPECTED_HEAD
    ):
        raise Deny("prepared_manifest_markers")
    if (
        manifest.get("source_pins", {}).get("sha256") != SOURCE_PINS_SHA256
        or manifest.get("source_pins", {}).get("frozen_sha256")
        != SOURCE_PINS_SHA256
        or manifest.get("source_pins", {}).get("bytes") != SOURCE_PINS_BYTES
    ):
        raise Deny("prepared_source_pins")
    if (
        manifest.get("safety_base", {}).get("sha256") != SAFETY_BASE_SHA256
        or manifest.get("safety_base", {}).get("frozen_sha256")
        != SAFETY_BASE_SHA256
        or manifest.get("safety_base", {}).get("bytes") != SAFETY_BASE_BYTES
    ):
        raise Deny("prepared_safety_base")

    path_map = manifest.get("paths")
    if not isinstance(path_map, dict) or set(path_map) != {
        "root",
        "case",
        "ready",
        "appdata",
        "paste",
        "home",
        "system",
        "temp",
    }:
        raise Deny("prepared_paths_shape")
    for name in ("root", "case", "ready", "appdata", "paste", "home", "system", "temp"):
        layout_name = {
            "home": "private_home",
            "system": "private_system",
            "temp": "private_temp",
        }.get(name, name)
        _check_path(path_map[name], layout[layout_name], "prepared_path_" + name)
    if _norm(root) != _norm(layout["root"]):
        raise Deny("prepared_root_not_canonical")
    for key in ("private_home", "appdata", "private_system", "private_temp", "case", "ready"):
        _no_reparse(layout[key])
        if not layout[key].is_dir() or _link(layout[key]):
            raise Deny("prepared_directory_" + key)

    if _settings() != _read_json(layout["settings"]):
        raise Deny("prepared_settings_content")
    if _read_json(layout["daily_marker"]) != {"root": str(layout["case"])}:
        raise Deny("prepared_daily_marker")
    if _fixture_identity(FIXTURE) != manifest["fixture_source"]:
        raise Deny("fixture_source_changed")
    if _fixture_identity(layout["ready"] / FIXTURE.name) != manifest["fixture_copy"]:
        raise Deny("fixture_copy_changed")
    if (
        _source_file_identity(layout["ready"] / SOURCE_FILE)
        != manifest["citation_source"]
    ):
        raise Deny("citation_source_changed")
    source = _source_identity()
    if source != manifest.get("source"):
        raise Deny("source_identity_changed")
    if source.get("entry/server.py", {}).get("sha256") != _sha256(
        pathlib.Path(__file__).resolve()
    ):
        raise Deny("entry_source_identity")
    if any(os.path.lexists(root / name) for name in RUNTIME_ARTIFACTS):
        raise Deny("runtime_artifact_exists")
    return manifest, layout, source, prepared_sha256


def _append_ndjson(path: pathlib.Path, item: dict[str, Any]) -> None:
    with open(path, "a", encoding="utf-8", newline="\n") as stream:
        stream.write(json.dumps(item, ensure_ascii=False, separators=(",", ":")) + "\n")


def _checked_file(path: pathlib.Path, limit: int = 1024 * 1024) -> Any:
    _no_reparse(path)
    info = os.lstat(path)
    if (
        not stat.S_ISREG(info.st_mode)
        or _link(path)
        or getattr(info, "st_nlink", 0) != 1
        or getattr(info, "st_file_attributes", 0) & SPARSE
        or info.st_size > limit
    ):
        raise Deny("native_file_not_plain_small")
    return _read_json(path)


def _plain_file(path: pathlib.Path, limit: int = DRAFT_LIMIT) -> bytes:
    _no_reparse(path)
    info = os.lstat(path)
    if (
        not stat.S_ISREG(info.st_mode)
        or _link(path)
        or getattr(info, "st_nlink", 0) != 1
        or getattr(info, "st_file_attributes", 0) & SPARSE
        or info.st_size != limit
    ):
        if info.st_size > limit:
            raise Deny("native_file_grew")
        raise Deny("native_file_identity")
    with open(path, "rb") as stream:
        return stream.read(limit + 1)


def _single_child(path: pathlib.Path) -> pathlib.Path:
    _no_reparse(path)
    with os.scandir(path) as entries:
        children = list(entries)
    if len(children) != 1:
        raise Deny("native_single_child")
    child = pathlib.Path(children[0].path)
    _no_reparse(child)
    if _link(child) or not child.is_dir():
        raise Deny("native_child_directory")
    return child


def _bootstrap_snapshot(
    layout: dict[str, pathlib.Path],
    case_id: str,
    task_id: str,
    material_id: str,
) -> dict[str, Any]:
    registry = _checked_file(layout["appdata"] / "cases.json", 64 * 1024)
    if not (
        registry.get("v") == 1
        and isinstance(registry.get("cases"), list)
        and len(registry["cases"]) == 1
        and registry["cases"][0].get("case_id") == case_id
        and _norm(registry["cases"][0].get("root", "")) == _norm(layout["case"])
    ):
        raise Deny("native_case_registry")

    index = _checked_file(layout["case"] / "工作区" / "材料" / "index.json")
    if not (
        set(index) == {"v", "case_id", "next_seq", "materials"}
        and index.get("v") == 1
        and index.get("case_id") == case_id
        and isinstance(index.get("materials"), list)
        and len(index["materials"]) == 1
    ):
        raise Deny("native_material_index_shape")
    material = index["materials"][0]
    if not (
        material.get("material_id") == material_id
        and MATERIAL_ID.fullmatch(material_id) is not None
        and material.get("name") == MATERIAL_NAME
        and material.get("type") == "txt"
        and material.get("status") == "parsed"
        and material.get("unit") == "line"
        and material.get("unit_count") == 1
        and material.get("origin") == "ref"
        and material.get("ref_id") == REF_ID
        and material.get("sha256")
        == hashlib.sha256(SOURCE_TEXT.encode("utf-8")).hexdigest()
    ):
        raise Deny("native_material_identity")

    refs = _checked_file(layout["case"] / "工作区" / "材料" / "引用.json")
    if not (
        set(refs) == {"v", "refs", "next_seq"}
        and refs.get("v") == 1
        and isinstance(refs.get("refs"), list)
        and len(refs["refs"]) == 1
        and refs["refs"][0].get("ref_id") == REF_ID
        and refs["refs"][0].get("kind") == "file"
        and refs["refs"][0].get("status") == "ok"
        and _norm(refs["refs"][0].get("path", ""))
        == _norm(layout["ready"] / SOURCE_FILE)
    ):
        raise Deny("native_reference_identity")

    task_dir = _single_child(layout["case"] / "工作区" / "任务")
    if task_dir.name != task_id or TASK_ID.fullmatch(task_id) is None:
        raise Deny("native_task_directory")
    with os.scandir(task_dir) as entries:
        names = {entry.name for entry in entries}
    if names != {"task.json", "result.json", "reads.json", "草稿"}:
        raise Deny("native_task_file_set")
    task = _checked_file(task_dir / "task.json")
    result = _checked_file(task_dir / "result.json")
    reads = _checked_file(task_dir / "reads.json")
    if not (
        task.get("task_id") == task_id
        and task.get("case_id") == case_id
        and task.get("session_id") == SESSION_ID
        and task.get("kind") == "agent"
        and task.get("route") == "local"
        and task.get("skill") is None
        and task.get("state") == "finished"
        and "request_id" not in task
        and "request_scope" not in task
    ):
        raise Deny("native_task_identity")
    if not (
        result.get("task_id") == task_id
        and result.get("status") == "cancelled"
        and result.get("usage")
        == {"model_calls": 0, "tool_calls": 2, "elapsed_s": 0}
        and result.get("finished_at") is not None
        and result.get("drafts")
        == [
            {
                "title": DRAFT_TITLE,
                "path": (
                    f"工作区/任务/{task_id}/草稿/{DRAFT_TITLE}-v1.md"
                ),
                "version": 1,
            }
        ]
        and result.get("citation_check", {}).get("passed") is True
        and result.get("citation_check", {}).get("problems") == []
        and isinstance(result.get("citations"), list)
        and len(result["citations"]) == 1
    ):
        raise Deny("native_result_identity")
    citation = result["citations"][0]
    if citation != {
        "material_id": material_id,
        "material_version": material["sha256"],
        "name": MATERIAL_NAME,
        "loc": {"unit": "line", "from": 1},
    }:
        raise Deny("native_result_citation")
    if not (
        reads.get("task_id") == task_id
        and isinstance(reads.get("reads"), list)
        and len(reads["reads"]) == 1
    ):
        raise Deny("native_reads_identity")
    read = reads["reads"][0]
    if not (
        read.get("material_id") == material_id
        and read.get("material_version") == material["sha256"]
        and read.get("unit") == "line"
        and read.get("from") == 1
        and read.get("to") == 1
    ):
        raise Deny("native_read_record")
    coverage = result.get("coverage")
    if not (
        isinstance(coverage, dict)
        and coverage.get("fully_read") == [MATERIAL_NAME]
        and coverage.get("partially_read") == []
        and coverage.get("not_read") == []
        and coverage.get("unreadable") == []
    ):
        raise Deny("native_coverage")

    draft_relative = result["drafts"][0]["path"]
    draft_parts = pathlib.PurePosixPath(draft_relative).parts
    if not draft_parts or any(part in {"", ".", ".."} for part in draft_parts):
        raise Deny("native_draft_path")
    draft_path = layout["case"].joinpath(*draft_parts)
    if not _within(layout["case"], draft_path):
        raise Deny("native_draft_path")
    expected = DRAFT_TEXT.encode("utf-8")
    draft = _plain_file(draft_path, len(expected))
    if draft != expected:
        raise Deny("native_draft_text")

    return {
        "case_id": case_id,
        "task_id": task_id,
        "task_state": task["state"],
        "result_status": result["status"],
        "usage": result["usage"],
        "material": {
            "material_id": material_id,
            "name": material["name"],
            "origin": material["origin"],
            "ref_id": material["ref_id"],
            "type": material["type"],
            "unit": material["unit"],
            "unit_count": material["unit_count"],
            "bytes": material["size"],
            "sha256": material["sha256"],
        },
        "reference": {
            "ref_id": REF_ID,
            "path": refs["refs"][0]["path"],
            "kind": refs["refs"][0]["kind"],
            "status": refs["refs"][0]["status"],
        },
        "read_record": read,
        "citation": citation,
        "citation_check": result["citation_check"],
        "coverage": coverage,
        "draft": {
            "relative_path": draft_relative,
            "text": DRAFT_TEXT,
            "bytes": len(expected),
            "sha256": hashlib.sha256(expected).hexdigest(),
        },
    }


async def _bootstrap_native(
    native,
    root: pathlib.Path,
    layout: dict[str, pathlib.Path],
    host_token: str,
) -> tuple[dict[str, Any], dict[str, Any]]:
    started = datetime.now().astimezone()
    calls: list[dict[str, Any]] = []
    ledger = root / "native-calls.ndjson"
    transport = httpx.ASGITransport(app=native)

    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://127.0.0.1",
        headers={"Authorization": f"Bearer {host_token}"},
    ) as client:

        async def post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
            t0 = time.monotonic()
            response = await client.post(path, json=payload)
            item = {
                "method": "POST",
                "path": path,
                "status": response.status_code,
                "elapsed_ms": int((time.monotonic() - t0) * 1000),
                "channel": "bootstrap_asgi_inprocess",
            }
            calls.append(item)
            _append_ndjson(ledger, item)
            if response.status_code != 200:
                raise Deny("bootstrap_native_http_" + str(response.status_code))
            body = response.json()
            if not (
                isinstance(body, dict)
                and set(body) == {"ok", "value"}
                and body.get("ok") is True
                and isinstance(body.get("value"), dict)
            ):
                raise Deny("bootstrap_native_response")
            return body["value"]

        async def sequence() -> tuple[dict[str, Any], dict[str, Any]]:
            case_value = await post("/api/case/open", {"path": str(layout["case"])})
            case_id = case_value.get("case_id")
            if (
                not isinstance(case_id, str)
                or CASE_ID.fullmatch(case_id) is None
                or case_value.get("created") is not True
            ):
                raise Deny("bootstrap_case_open")

            imported = await post(
                "/api/materials/import",
                {
                    "case_id": case_id,
                    "paths": [str(layout["ready"] / SOURCE_FILE)],
                    "target": None,
                    "unzip": False,
                    "mode": "ref",
                },
            )
            registered = imported.get("registered")
            if not (
                imported.get("copied") == []
                and imported.get("skipped") == []
                and isinstance(registered, list)
                and len(registered) == 1
                and registered[0].get("ref_id") == REF_ID
                and registered[0].get("kind") == "file"
                and _norm(registered[0].get("path", ""))
                == _norm(layout["ready"] / SOURCE_FILE)
            ):
                raise Deny("bootstrap_reference_import")

            index = _checked_file(layout["case"] / "工作区" / "材料" / "index.json")
            if not (
                isinstance(index.get("materials"), list)
                and len(index["materials"]) == 1
                and MATERIAL_ID.fullmatch(
                    str(index["materials"][0].get("material_id"))
                )
            ):
                raise Deny("bootstrap_material_index")
            material_id = index["materials"][0]["material_id"]

            begin = await post(
                "/core/task/begin",
                {"session_id": SESSION_ID, "cwd": str(layout["case"])},
            )
            task_id = begin.get("task_id")
            if not (
                isinstance(task_id, str)
                and TASK_ID.fullmatch(task_id) is not None
                and begin.get("case_id") == case_id
                and begin.get("route") == "local"
                and begin.get("skill") is None
            ):
                raise Deny("bootstrap_task_begin")

            read = await post(
                "/core/tool",
                {
                    "task_id": task_id,
                    "tool": "case_read_material",
                    "args": {"name": MATERIAL_NAME, "max_chars": 8000},
                },
            )
            if not (
                read.get("material_id") == material_id
                and read.get("name") == MATERIAL_NAME
                and read.get("unit") == "line"
                and read.get("start") == 1
                and read.get("end") == 1
                and read.get("text") == f"【第1行】\n{SOURCE_LINE}"
            ):
                raise Deny("bootstrap_read_material")

            saved = await post(
                "/core/tool",
                {
                    "task_id": task_id,
                    "tool": "case_save_draft",
                    "args": {"title": DRAFT_TITLE, "content": DRAFT_TEXT},
                },
            )
            expected_relative = (
                f"工作区/任务/{task_id}/草稿/{DRAFT_TITLE}-v1.md"
            )
            if not (
                saved.get("path") == expected_relative
                and saved.get("version") == 1
                and saved.get("citation_check", {}).get("passed") is True
                and saved.get("not_fully_read") == []
            ):
                raise Deny("bootstrap_save_draft")

            ended = await post(
                "/core/task/end",
                {
                    "task_id": task_id,
                    "reason": "aborted",
                    "model_calls": 0,
                    "tool_calls": 2,
                    "elapsed_s": 0,
                },
            )
            if ended != {"status": "cancelled"}:
                raise Deny("bootstrap_task_end")
            return {"case_id": case_id, "task_id": task_id, "material_id": material_id}, {
                "read": read,
                "saved": saved,
                "ended": ended,
            }

        ids, values = await asyncio.wait_for(sequence(), timeout=20)

    if len(calls) != 6:
        raise Deny("bootstrap_native_call_count")
    snap = _bootstrap_snapshot(
        layout, ids["case_id"], ids["task_id"], ids["material_id"]
    )
    if not (
        snap["read_record"]["material_id"] == values["read"]["material_id"]
        and snap["read_record"]["unit"] == values["read"]["unit"]
        and snap["read_record"]["from"] == values["read"]["start"]
        and snap["read_record"]["to"] == values["read"]["end"]
    ):
        raise Deny("bootstrap_read_snapshot")
    if not (
        snap["draft"]["relative_path"] == values["saved"]["path"]
        and snap["citation_check"] == values["saved"]["citation_check"]
    ):
        raise Deny("bootstrap_saved_snapshot")
    report = {
        "format": "T32-native-document-citation-bootstrap-v1",
        "transport": "ASGI-inprocess-no-socket",
        "started_at": started.isoformat(timespec="milliseconds"),
        "finished_at": datetime.now()
        .astimezone()
        .isoformat(timespec="milliseconds"),
        "native_calls": calls,
        "native_call_count": len(calls),
        "case_id": ids["case_id"],
        "task_id": ids["task_id"],
        "task_state": snap["task_state"],
        "result_status": snap["result_status"],
        "usage": snap["usage"],
        "material": snap["material"],
        "reference": snap["reference"],
        "read_response": values["read"],
        "read_record": snap["read_record"],
        "citation": snap["citation"],
        "citation_check": snap["citation_check"],
        "coverage": snap["coverage"],
        "draft": snap["draft"],
        "one_draft_only": True,
        "model_calls_zero": True,
        "ocr_started": False,
        "real_native_records_only": True,
        "not_tcp_or_gui_proof": True,
    }
    _write_json(root / "bootstrap-report.json", report)
    return report, snap


def _query_pairs(query: bytes, *, require: set[str], optional: set[str] = frozenset()):
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
    if any(not value for _key, value in pairs):
        return None
    keys = [key for key, _value in pairs]
    if len(keys) != len(set(keys)):
        return None
    if not require.issubset(keys) or not set(keys).issubset(require | optional):
        return None
    return dict(pairs)


class Firewall:
    def __init__(
        self,
        app,
        *,
        layout: dict[str, pathlib.Path],
        report: dict[str, Any],
        host_token: str,
    ) -> None:
        self.app = app
        self.case = layout["case"]
        self.case_id = report["case_id"]
        self.task_id = report["task_id"]
        self.material_id = report["material"]["material_id"]
        self.material_name = report["material"]["name"]
        self.citation = CITATION
        self.expected_auth = ("Bearer " + host_token).encode("utf-8")
        self.registry = layout["appdata"] / "cases.json"
        self.ledger = layout["root"] / "requests.ndjson"
        self.lock = threading.RLock()
        self.records: list[dict[str, Any]] = []
        self.failure_code: str | None = None
        self.source_claimed = False
        self.source_complete = False
        self.case_open_attempts = 0
        self.case_open_ok = 0
        self.auth_denials = 0
        self.policy_denials: dict[str, int] = {}
        self.read_ok = 0
        with open(self.ledger, "x", encoding="utf-8"):
            pass

    def _record(
        self,
        method: str,
        path: str,
        status: int | None,
        disposition: str,
        started: float,
    ) -> None:
        item = {
            "method": method,
            "path": path,
            "status": status,
            "disposition": disposition,
            "channel": "tcp_loopback",
            "elapsed_ms": int((time.monotonic() - started) * 1000),
        }
        with self.lock:
            if self.failure_code is not None:
                item["protocol_failure"] = self.failure_code
            self.records.append(item)
            _append_ndjson(self.ledger, item)

    def _deny(self, code: str) -> None:
        with self.lock:
            self.policy_denials[code] = self.policy_denials.get(code, 0) + 1

    def _fail(self, code: str) -> None:
        with self.lock:
            self.failure_code = self.failure_code or code

    def _authorized(self, scope) -> bool:
        values = [
            value
            for key, value in scope.get("headers", [])
            if key.lower() == b"authorization"
        ]
        if len(values) != 1 or not hmac.compare_digest(values[0], self.expected_auth):
            with self.lock:
                self.auth_denials += 1
            return False
        return True

    def _own_registry(self) -> bool:
        try:
            data = _checked_file(self.registry, 64 * 1024)
            cases = data.get("cases") if isinstance(data, dict) else None
            return (
                isinstance(data, dict)
                and data.get("v") == 1
                and isinstance(cases, list)
                and len(cases) == 1
                and cases[0].get("case_id") == self.case_id
                and _norm(cases[0].get("root", "")) == _norm(self.case)
            )
        except (Deny, OSError, ValueError, TypeError):
            return False

    def _source_authority(self) -> bool:
        try:
            task_dir = _single_child(self.case / "工作区" / "任务")
            if task_dir.name != self.task_id:
                return False
            result = _checked_file(task_dir / "result.json")
            index = _checked_file(self.case / "工作区" / "材料" / "index.json")
            material = next(
                (
                    item
                    for item in index.get("materials", [])
                    if item.get("material_id") == self.material_id
                ),
                None,
            )
            return bool(
                result.get("task_id") == self.task_id
                and isinstance(result.get("citations"), list)
                and len(result["citations"]) == 1
                and result["citations"][0].get("material_id") == self.material_id
                and result["citations"][0].get("name") == self.material_name
                and result["citations"][0].get("loc")
                == {"unit": "line", "from": 1}
                and material is not None
                and material.get("name") == self.material_name
                and material.get("origin") == "ref"
            )
        except (Deny, OSError, ValueError, TypeError):
            return False

    def _case_query(self, path: str, query: bytes) -> str | None:
        values = _query_pairs(query, require={"case_id"})
        if values is None:
            return "CASE_QUERY_EXACT"
        if values["case_id"] != self.case_id:
            return "CASE_ID_OUTSIDE_RUN"
        return None

    def _source_query(self, query: bytes) -> str | None:
        values = _query_pairs(
            query,
            require={"case_id", "material_id", "citation", "task_id"},
        )
        if values is None:
            return "SOURCE_QUERY_EXACT"
        if values["case_id"] != self.case_id:
            return "SOURCE_CASE_ID"
        if values["material_id"] != self.material_id:
            return "SOURCE_MATERIAL_ID"
        if values["citation"] != self.citation:
            return "SOURCE_CITATION"
        if values["task_id"] != self.task_id:
            return "SOURCE_TASK_ID"
        if not self._own_registry():
            return "SOURCE_CASE_REGISTRY"
        if not self._source_authority():
            return "SOURCE_AUTHORITY"
        with self.lock:
            if self.source_claimed or self.source_complete:
                return "SOURCE_ALREADY_ATTEMPTED"
            self.source_claimed = True
        return None

    def _claim_case(self, data: Any, query: bytes) -> str | None:
        if query:
            return "CASE_OPEN_QUERY"
        if not (
            isinstance(data, dict)
            and set(data) == {"path", "template"}
            and data.get("template") is None
            and isinstance(data.get("path"), str)
        ):
            return "CASE_OPEN_BODY"
        if _norm(data["path"]) != _norm(self.case):
            return "CASE_OPEN_PATH"
        with self.lock:
            if self.case_open_attempts >= 4:
                return "CASE_OPEN_LIMIT"
            self.case_open_attempts += 1
        return None

    def _policy(
        self,
        method: str,
        path: str,
        data: Any,
        query: bytes,
    ) -> str | None:
        if (method, path) not in ROUTES:
            return "ROUTE_OR_METHOD_NOT_ALLOWED"
        if not self._own_registry():
            return "CASE_REGISTRY"
        if method == "POST":
            return self._claim_case(data, query)
        if path in NO_QUERY_ROUTES:
            return None if not query else "UNEXPECTED_QUERY"
        if path == "/api/task/current":
            values = _query_pairs(query, require={"session_id"})
            if values is None:
                return "SESSION_ID_QUERY_REQUIRED"
            if len(values["session_id"]) > 128:
                return "SESSION_ID_LENGTH"
            return None
        if path in CASE_QUERY_ROUTES:
            return self._case_query(path, query)
        if path == "/api/source":
            return self._source_query(query)
        return "ROUTE_NOT_ALLOWED"

    def _complete_case(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and set(response) == {"ok", "value"}
            and response.get("ok") is True
            and isinstance(value, dict)
            and value.get("case_id") == self.case_id
            and value.get("created") is False
        ):
            self._fail("CASE_OPEN_RESPONSE")
            return
        with self.lock:
            self.case_open_ok += 1

    def _complete_source(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and set(response) == {"ok", "value"}
            and response.get("ok") is True
            and isinstance(value, dict)
            and value.get("name") == self.material_name
            and value.get("loc") == {"unit": "line", "from": 1}
            and value.get("text") == SOURCE_LINE
            and value.get("page_png_base64") is None
            and value.get("source_changed") is False
            and value.get("original_status") == "ok"
        ):
            self._fail("SOURCE_RESPONSE")
            return
        with self.lock:
            self.source_complete = True

    def _complete_read(self, path: str, status: int | None, response: Any) -> None:
        if path == "/health":
            if not (
                status == 200
                and response == {"status": "ok", "contract_version": "1.6"}
            ):
                self._fail("HEALTH_RESPONSE")
            return
        if not (
            status == 200
            and isinstance(response, dict)
            and set(response) == {"ok", "value"}
            and response.get("ok") is True
        ):
            self._fail("READ_RESPONSE")
            return
        with self.lock:
            self.read_ok += 1

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return
        method, path, started = scope["method"], scope["path"], time.monotonic()
        if not self._authorized(scope):
            self._record(method, path, 401, "auth_not_forwarded", started)
            await _guard_reply(send, 401, "AUTH_REQUIRED")
            return
        if (method, path) not in ROUTES:
            self._deny("ROUTE_OR_METHOD_NOT_ALLOWED")
            self._record(
                method, path, 403, "ROUTE_OR_METHOD_NOT_ALLOWED", started
            )
            await _guard_reply(send, 403, "ROUTE_OR_METHOD_NOT_ALLOWED")
            return

        body, data = b"", None
        if method == "POST":
            original = receive
            try:
                body = await _read_body(receive)
            except Deny:
                self._deny("BODY_TOO_LARGE")
                self._record(method, path, 413, "BODY_TOO_LARGE", started)
                await _guard_reply(send, 413, "BODY_TOO_LARGE")
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
                return await original()

            receive = replay

        query = scope.get("query_string", b"")
        denial = self._policy(method, path, data, query)
        if denial:
            self._deny(denial)
            self._record(method, path, 403, denial, started)
            await _guard_reply(send, 403, denial)
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
        except BaseException as exc:
            self._fail(getattr(exc, "code", type(exc).__name__))
            raise
        finally:
            self._record(method, path, status, "native_app", started)

        if overflow:
            self._fail("RESPONSE_CAPTURE_OVERFLOW")
            return
        response = _json(bytes(captured))
        if path == "/api/case/open":
            self._complete_case(status, response)
        elif path == "/api/source":
            self._complete_source(status, response)
        else:
            self._complete_read(path, status, response)

    def snapshot(self) -> list[dict[str, Any]]:
        with self.lock:
            return list(self.records)

    def evidence(self) -> dict[str, Any]:
        with self.lock:
            complete = (
                self.failure_code is None
                and self.source_claimed
                and self.source_complete
                and self.case_open_ok >= 1
            )
            return {
                "protocol_complete": complete,
                "failure_code": self.failure_code,
                "source_claimed": self.source_claimed,
                "source_complete": self.source_complete,
                "case_open_attempts": self.case_open_attempts,
                "case_open_ok": self.case_open_ok,
                "auth_denials": self.auth_denials,
                "policy_denials": dict(sorted(self.policy_denials.items())),
                "read_ok": self.read_ok,
            }


async def _serve(
    root: pathlib.Path,
    layout: dict[str, pathlib.Path],
    manifest: dict[str, Any],
    source_before: dict[str, Any],
    prepared_sha256: str,
    seconds: int,
    host_port: int,
    host_token: str,
) -> tuple[str, str]:
    guard = BASE.Guard()
    started_at = datetime.now().astimezone()
    local_count = {"local": 0, "external": 0, "keyring": 0}
    cred_lock = threading.Lock()
    restore = logs = lb = server = task = firewall = None
    net_closed = False
    logs_closed = False
    failure: str | None = None
    port: int | None = None
    report: dict[str, Any] | None = None
    final_path = root / "final-metadata.json"

    def local_key():
        with cred_lock:
            local_count["local"] += 1
        return "T32-citation-fixture-placeholder"

    def external_key():
        with cred_lock:
            local_count["external"] += 1
        return "T32-citation-fixture-placeholder"

    try:
        _scrub_env(layout)
        _install_keyring(local_count, guard, cred_lock)
        original_uname = platform.uname
        platform.uname = lambda: platform.uname_result(
            "Windows", "T32-CITATION-SYNTHETIC", "", "", "", ""
        )

        guard.phase = "product_import"
        restore = _install_guards(guard)
        sys.path.insert(0, str(SERVICE_DIR))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench.app import create_app
        from lawbench.case import gate as gate_module
        from lawbench.case import materials as materials_module
        from lawbench.config import Config
        from lawbench.ingest import libreoffice as lo_module

        logs = imported_logs
        module_path = sys.modules["lawbench"].__file__
        if not module_path:
            raise Deny("product_root_ambiguous")
        module_file = pathlib.Path(module_path).resolve()
        if module_file.parents[2] != PRODUCT_ROOT.resolve():
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
            contracts_dir=CONTRACTS_DIR,
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

        def no_recycle(*_args, **_kwargs):
            guard.deny("recycle")
            raise Deny("recycle")

        lb.materials.can_recycle = no_recycle
        lb.materials.recycle = no_recycle
        with cred_lock:
            if local_count["local"] or local_count["external"]:
                raise Deny("credential_getter_at_startup")

        guard.phase = "bootstrap_asgi"
        report, _snapshot = await _bootstrap_native(
            native, root, layout, host_token
        )
        if _source_identity() != source_before:
            raise Deny("source_changed_during_bootstrap")

        firewall = Firewall(
            native,
            layout=layout,
            report=report,
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
        contract_version = imported_contracts.version()
        if contract_version != "1.6":
            raise Deny("contract_version_not_1_6")
        _write_json(
            root / "ready.json",
            {
                "status": "ready",
                "host": "127.0.0.1",
                "port": port,
                "pid": os.getpid(),
                "started_at": datetime.now()
                .astimezone()
                .isoformat(timespec="milliseconds"),
                "contract_version": contract_version,
                "case_path": str(layout["case"]),
                "appdata": str(layout["appdata"]),
                "ready_input": str(layout["ready"]),
                "fixture_path": str(layout["ready"] / FIXTURE.name),
                "fixture_bytes": FIXTURE_BYTES,
                "fixture_sha256": FIXTURE_SHA256,
                "citation_source_path": str(layout["ready"] / SOURCE_FILE),
                "expected_head": EXPECTED_HEAD,
                "prepared_sha256": prepared_sha256,
                "source_pins_sha256": SOURCE_PINS_SHA256,
                "bootstrap_report": str(root / "bootstrap-report.json"),
                "native_call_log": str(root / "native-calls.ndjson"),
                "tcp_request_log": str(root / "requests.ndjson"),
                "case_id": report["case_id"],
                "task_id": report["task_id"],
                "material_id": report["material"]["material_id"],
                "draft_relative_path": report["draft"]["relative_path"],
                "citation": CITATION,
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
        if "original_uname" in locals():
            platform.uname = original_uname

    guard_state = guard.snapshot()
    requests = firewall.snapshot() if firewall is not None else []
    firewall_state = firewall.evidence() if firewall is not None else {}
    with cred_lock:
        credential_state = {
            "local_getter_calls": local_count["local"],
            "external_getter_calls": local_count["external"],
            "keyring_rejections": local_count["keyring"],
        }
    source_after: dict[str, Any] = {}
    source_unchanged = False
    try:
        source_after = _source_identity()
        source_unchanged = source_after == source_before
    except Exception as exc:
        failure = failure or getattr(exc, "code", type(exc).__name__)
    fixture_unchanged = False
    fixture_copy_unchanged = False
    citation_source_unchanged = False
    settings_after = None
    marker_after = None
    settings_unchanged = False
    marker_unchanged = False
    try:
        fixture_unchanged = (
            _fixture_identity(FIXTURE) == manifest["fixture_source"]
        )
        fixture_copy_unchanged = (
            _fixture_identity(layout["ready"] / FIXTURE.name)
            == manifest["fixture_copy"]
        )
        citation_source_unchanged = (
            _source_file_identity(layout["ready"] / SOURCE_FILE)
            == manifest["citation_source"]
        )
        settings_after = _file_identity(layout["settings"])
        marker_after = _file_identity(layout["daily_marker"])
        settings_unchanged = settings_after == {
            key: manifest["settings"][key]
            for key in ("path", "canonical", "bytes", "sha256")
        }
        marker_unchanged = (
            marker_after
            == {
                key: manifest["daily_marker"][key]
                for key in ("path", "canonical", "bytes", "sha256")
            }
            and _read_json(layout["daily_marker"]) == {"root": str(layout["case"])}
        )
    except Exception as exc:
        failure = failure or getattr(exc, "code", type(exc).__name__)
    if firewall_state.get("failure_code") and failure is None:
        failure = "protocol:" + str(firewall_state["failure_code"])
    if not firewall_state.get("protocol_complete") and failure is None:
        failure = "protocol_incomplete"
    task_done = bool(task is not None and task.done())
    listener_closed = _closed(server)
    if (
        guard_state.get("violations")
        or any(credential_state.values())
        or not source_unchanged
        or not fixture_unchanged
        or not fixture_copy_unchanged
        or not citation_source_unchanged
        or not settings_unchanged
        or not marker_unchanged
    ) and failure is None:
        failure = "guard_credential_source_or_fixture_violation"
    if task is not None and not (
        task_done and listener_closed and net_closed and logs_closed
    ):
        failure = failure or "cleanup_incomplete"

    finished = datetime.now().astimezone()
    final = {
        "outcome": (
            "COMPLETED_FOR_ROOT_REVIEW"
            if failure is None
            else "FAILED_FOR_ROOT_REVIEW"
        ),
        "not_acceptance": (
            "Finite native-document citation backend/TCP slice. Not GUI, "
            "Host/RPC, model, OCR, packaging, or production acceptance."
        ),
        "root": str(root),
        "prepared_sha256": prepared_sha256,
        "expected_head": EXPECTED_HEAD,
        "started_at": started_at.isoformat(timespec="milliseconds"),
        "finished_at": finished.isoformat(timespec="milliseconds"),
        "requested_seconds": seconds,
        "elapsed_seconds": round((finished - started_at).total_seconds(), 3),
        "failure_code": failure,
        "private_paths": {
            "home": str(layout["private_home"]),
            "appdata": str(layout["appdata"]),
            "system": str(layout["private_system"]),
            "temp": str(layout["private_temp"]),
        },
        "bootstrap_report": report,
        "source_pins_sha256": SOURCE_PINS_SHA256,
        "source_unchanged": source_unchanged,
        "source_before": source_before,
        "source_after": source_after,
        "fixture_source_unchanged": fixture_unchanged,
        "fixture_copy_unchanged": fixture_copy_unchanged,
        "citation_source_unchanged": citation_source_unchanged,
        "settings_after": settings_after,
        "daily_marker_after": marker_after,
        "settings_unchanged": settings_unchanged,
        "daily_marker_unchanged": marker_unchanged,
        "listener": {
            "host": "127.0.0.1",
            "requested_port": host_port,
            "actual_port": port,
            "ipv4_only": True,
            "websocket": False,
            "forward_listener": False,
        },
        "native_app": {
            "factory": "lawbench.app.create_app(Config(...))",
            "lifespan": "off",
            "auth": "exact wrapper token check before claims, then native middleware",
            "routes_contracts": "native",
            "materials_registry_gate": "native",
            "allowed_routes": sorted([list(item) for item in ROUTES]),
        },
        "credentials": credential_state,
        "guard": guard_state,
        "protocol": firewall_state,
        "requests": requests,
        "lifecycle": {
            "ocr_threads": len(getattr(getattr(lb, "ocr", None), "_threads", [])),
            "ocr_start_called": False,
            "ocr_stop_called": False,
            "retainer_process_started": getattr(
                getattr(lb, "retainer", None), "_proc", None
            )
            is not None,
            "retainer_close_called": False,
            "product_lifespan_started": False,
        },
        "cleanup": {
            "server_should_exit": True,
            "server_task_done": task_done,
            "listener_closed": listener_closed,
            "net_client_closed": net_closed,
            "product_logs_closed": logs_closed,
            "event_loop_closed": "recorded separately in loop-closed.json",
            "root_retained": True,
        },
        "service_log": str(layout["appdata"] / "logs" / "service.log"),
        "native_call_log": str(root / "native-calls.ndjson"),
        "request_log": str(root / "requests.ndjson"),
    }
    _write_json(final_path, final)
    return str(final_path), failure or ""


def _host_values(
    raw_root: pathlib.Path, layout: dict[str, pathlib.Path]
) -> tuple[int, str]:
    port = os.environ.get("LB_PORT")
    token = os.environ.get("LB_TOKEN")
    appdata = os.environ.get("LB_APPDATA")
    if port is None or re.fullmatch(r"[0-9]+", port) is None:
        raise Deny("missing_or_invalid_LB_PORT")
    if token is None or re.fullmatch(r"[0-9a-f]{64}", token) is None:
        raise Deny("missing_or_invalid_LB_TOKEN")
    if appdata is None or _norm(appdata) != _norm(layout["appdata"]):
        raise Deny("LB_APPDATA_not_prepared_appdata")
    host_port = int(port, 10)
    if not 1 <= host_port <= 65535:
        raise Deny("LB_PORT_out_of_range")
    if _norm(raw_root) != _norm(layout["root"]):
        raise Deny("root_not_canonical")
    return host_port, token


def _serve_checked(raw_root: str, seconds: int) -> tuple[pathlib.Path, str, str]:
    root = _validate_run_path(raw_root)
    manifest, layout, source, prepared_sha256 = _verify_prepared(root)
    host_port, host_token = _host_values(root, layout)
    _write_json(
        root / "started.json",
        {
            "status": "started",
            "pid": os.getpid(),
            "started_at": datetime.now()
            .astimezone()
            .isoformat(timespec="milliseconds"),
            "root": str(root),
            "appdata": str(layout["appdata"]),
            "requested_seconds": seconds,
            "host_port": host_port,
            "prepared_sha256": prepared_sha256,
        },
    )
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    final_path, failure = None, ""
    try:
        name, failure = loop.run_until_complete(
            _serve(
                root,
                layout,
                manifest,
                source,
                prepared_sha256,
                seconds,
                host_port,
                host_token,
            )
        )
        final_path = pathlib.Path(name)
    except BaseException as exc:
        failure = getattr(exc, "code", type(exc).__name__)
        try:
            _write_json(
                root / "run-error.json",
                {
                    "outcome": "FAILED_FOR_ROOT_REVIEW",
                    "exception_type": type(exc).__name__,
                    "guard_code": getattr(exc, "code", None),
                    "root_retained": True,
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
    loop_closed = False
    try:
        _write_json(
            root / "loop-closed.json",
            {
                "closed_at": datetime.now()
                .astimezone()
                .isoformat(timespec="milliseconds"),
                "event_loop_closed": True,
                "final_metadata_written": bool(
                    final_path is not None and final_path.is_file()
                ),
            },
        )
        loop_closed = True
    except BaseException:
        loop_closed = False
    if not loop_closed:
        failure = failure or "loop_close_evidence_failed"
    return root, failure, str(final_path) if final_path else ""


def _prepare_checked(raw_root: str) -> tuple[pathlib.Path, str]:
    try:
        root = _validate_run_path(raw_root)
        _prepare(raw_root)
    except BaseException as exc:
        try:
            root = _validate_run_path(raw_root)
        except BaseException:
            root = pathlib.Path(raw_root)
        return root, getattr(exc, "code", type(exc).__name__)
    return root, ""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="T32 native-document citation finite entry"
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--prepare", action="store_true")
    mode.add_argument("--serve", action="store_true")
    parser.add_argument(
        "--root",
        required=True,
        help="new T32-citation-YYYYMMDD-HHMMSS direct child of this entry's runs",
    )
    parser.add_argument("--seconds", type=int, default=DEFAULT_SECONDS)
    args = parser.parse_args()
    if args.prepare:
        root, failure = _prepare_checked(args.root)
        if failure:
            print(f"prepare refused: {failure}", file=sys.stderr)
            return 2
        print(root / "prepared.json")
        return 0
    if not 1 <= args.seconds <= MAX_SECONDS:
        parser.error(f"--seconds must be 1..{MAX_SECONDS}")
    try:
        root, failure, final_path = _serve_checked(args.root, args.seconds)
    except BaseException as exc:
        detail = f":{exc}" if isinstance(exc, KeyError) else ""
        print(
            f"serve refused: {getattr(exc, 'code', type(exc).__name__)}{detail}",
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
