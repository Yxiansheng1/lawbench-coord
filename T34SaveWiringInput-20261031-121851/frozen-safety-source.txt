#!/usr/bin/env python3
"""T37 finite mixed legacy-copy/reference materials entry for current opt-in source.

The prepare phase creates a fresh private root without importing lawbench.  The
serve phase reuses that root, current-B contracts/skills and the current-B
``lawbench.app.create_app`` behind one IPv4 loopback listener.  Product
lifespan remains off; native auth, routes, Gate, Materials and Registry remain
in use.  Before the listener starts, the wrapper admits exactly one native
case-open, one legacy default-copy import of ``scope-in.txt``, and one
reference-mode import of the other two synthetic files through
``httpx.ASGITransport``.  TCP traffic is then limited to readback and one exact
native removal of reference material M0002.  The finite HTTP probe checks the
case-copy/reference mix, the default/false live-only list, and the exact true
tombstone list; it is not a GUI launcher or GUI acceptance.
"""
from __future__ import annotations

import argparse
import asyncio
import copy
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
import subprocess
import sys
import threading
import time
import types
import uuid
from datetime import datetime
from typing import Any
from urllib.parse import parse_qs, urlsplit

import httpx
import uvicorn

EXPECTED_HEAD = "dc56a93be4b07dbe7a48863e3135351659817fb5"
PREP_DIR = pathlib.Path(__file__).resolve().parent
PRODUCT_ROOT = PREP_DIR.parents[4]
SERVICE_DIR = PRODUCT_ROOT / "service"
CONTRACTS_DIR = PRODUCT_ROOT / "contracts"
SKILLS_DIR = PRODUCT_ROOT / "skills"
RUNS_ROOT = PREP_DIR / "runs"
SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json"
)
SOURCE_PINS_SHA256 = (
    "5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf"
)
FIXTURE = pathlib.Path(r"D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg")
FIXTURE_BYTES = 47379
FIXTURE_SHA256 = "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
RUN_NAME = re.compile(r"^T33-host-[0-9]{8}-[0-9]{6}$")
PREPARED_FORMAT = "T37-mixed-materials-gui-prepared-v1"
REQUEST_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
CASE_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
MATERIAL_ID = re.compile(r"^M[0-9]{4}$")
TARGET_MATERIAL_ID = "M0002"
CASE_MATERIAL_ID = "M0001"
CASE_SOURCE_FILE = "scope-in.txt"
REFERENCE_MATERIALS = (
    ("R01", "scope-out.txt", "scope-out", "M0002"),
    ("R02", "scope-third.txt", "scope-third", "M0003"),
)
REFERENCE_MATERIAL_IDS = tuple(item[3] for item in REFERENCE_MATERIALS)
EXPECTED_MATERIAL_IDS = (CASE_MATERIAL_ID, *REFERENCE_MATERIAL_IDS)
REMAINING_MATERIAL_IDS = ("M0001", "M0003")
SCOPE_SOURCE_NAME = "scope-source"
SCOPE_SOURCE_FILES = (
    ("scope-in.txt", "scope-in", "T31_SHARED 内部唯一正文\n"),
    ("scope-out.txt", "scope-out", "T31_SHARED 外部唯一正文\n"),
    ("scope-third.txt", "scope-third", "第三份合成正文\n"),
)
SCOPE_FILE_LIMIT = 4096
FAKE_LOCAL_KEY = "T31-fixture-local-key-never-real"
FAKE_EXTERNAL_KEY = "T31-fixture-external-key-never-real"
DEFAULT_SECONDS, MAX_SECONDS, MAX_BODY = 600, 600, 64 * 1024
MAX_CAPTURE = 1 * 1024 * 1024
REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
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
ROUTES = frozenset(
    {
        ("GET", "/health"),
        ("GET", "/api/case/recent"),
        ("GET", "/api/settings"),
        ("GET", "/api/capsules"),
        ("GET", "/api/materials"),
        ("GET", "/api/task/current"),
        ("GET", "/api/tasks"),
        ("GET", "/api/outputs"),
        ("GET", "/api/ocr/jobs"),
        ("GET", "/api/wiki/suggestions"),
        ("GET", "/api/wiki/review"),
        ("POST", "/api/case/open"),
        ("POST", "/api/materials/import"),
        ("POST", "/api/materials/remove"),
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
    {
        "/health",
        "/api/case/recent",
        "/api/settings",
        "/api/capsules",
    }
)
TASK_EMPTY_ROUTES = frozenset({"/api/task/current", "/api/tasks"})
RUNTIME_ARTIFACTS = (
    "started.json",
    "ready.json",
    "final-metadata.json",
    "loop-closed.json",
    "setup-requests.ndjson",
    "requests.ndjson",
    "run-error.json",
)


class Deny(RuntimeError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def _norm(path: str | os.PathLike[str]) -> str:
    """Reviewed T31 rule: normalize only standard drive/UNC long-path aliases."""
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
    except (OSError, ValueError, TypeError):
        return False


def _link(path: str | os.PathLike[str]) -> bool:
    try:
        info = os.lstat(path)
    except (FileNotFoundError, OSError):
        return False
    return stat.S_ISLNK(info.st_mode) or bool(
        getattr(info, "st_file_attributes", 0) & REPARSE
    )


def _no_reparse(
    path: pathlib.Path, *, allow_missing_tail: bool = False
) -> None:
    parts = pathlib.PureWindowsPath(path).parts
    if not parts:
        raise Deny("path_empty")
    current = parts[0]
    for part in parts[1:]:
        current = os.path.join(current, part)
        if not os.path.lexists(current):
            if allow_missing_tail:
                continue
            raise Deny("required_path_missing")
        if _link(current):
            raise Deny("reparse_point")


def _sha256(path: pathlib.Path) -> str:
    if _link(path):
        raise Deny("linked_file")
    digest = hashlib.sha256()
    with open(path, "rb") as stream:
        for block in iter(lambda: stream.read(1 << 20), b""):
            digest.update(block)
    return digest.hexdigest()


def _file_identity(path: pathlib.Path) -> dict[str, Any]:
    _no_reparse(path)
    info = os.lstat(path)
    if not stat.S_ISREG(info.st_mode):
        raise Deny("not_regular_file")
    return {
        "path": str(path),
        "canonical": _norm(path),
        "bytes": info.st_size,
        "sha256": _sha256(path),
    }


def _write_json(path: pathlib.Path, value: Any, mode: str = "x") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, mode, encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")


def _read_json(path: pathlib.Path) -> Any:
    _no_reparse(path)
    with open(path, "r", encoding="utf-8") as stream:
        return json.load(stream)


def _path_identity(path: pathlib.Path) -> dict[str, str]:
    return {"path": str(path), "canonical": _norm(path)}


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
    if not RUN_NAME.fullmatch(root.name):
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


def _sources() -> dict[str, Any]:
    for base in (SERVICE_DIR, CONTRACTS_DIR):
        _no_reparse(base)
    result = {}
    for base in (SERVICE_DIR, CONTRACTS_DIR):
        for path in sorted(base.rglob("*")):
            if (
                path.is_file()
                and "__pycache__" not in path.parts
                and path.suffix.lower() in {".py", ".json", ".sql", ".toml"}
            ):
                relative = path.relative_to(PRODUCT_ROOT).as_posix()
                result[relative] = {
                    "sha256": _sha256(path),
                    "bytes": path.stat().st_size,
                }
    entry = pathlib.Path(__file__).resolve()
    _no_reparse(entry)
    result["entry/server.py"] = {
        "sha256": _sha256(entry),
        "bytes": entry.stat().st_size,
    }
    return result


def _copy_fixture(ready: pathlib.Path) -> dict[str, Any]:
    _no_reparse(FIXTURE)
    if not FIXTURE.is_file() or _link(FIXTURE):
        raise Deny("fixture_missing_or_link")
    source_bytes, source_sha = FIXTURE.stat().st_size, _sha256(FIXTURE)
    if source_bytes != FIXTURE_BYTES or source_sha != FIXTURE_SHA256:
        raise Deny("fixture_identity")
    copy = ready / FIXTURE.name
    with open(FIXTURE, "rb") as source, open(copy, "xb") as destination:
        shutil.copyfileobj(source, destination, length=1 << 20)
    if copy.stat().st_size != FIXTURE_BYTES or _sha256(copy) != FIXTURE_SHA256:
        raise Deny("fixture_copy_identity")
    return {
        "source_path": str(FIXTURE),
        "source_canonical": _norm(FIXTURE),
        "source_bytes": source_bytes,
        "source_sha256": source_sha,
        "copy_path": str(copy),
        "copy_canonical": _norm(copy),
        "copy_bytes": FIXTURE_BYTES,
        "copy_sha256": FIXTURE_SHA256,
    }


def _reviewed_sources(source: dict[str, Any]) -> dict[str, Any]:
    _no_reparse(SOURCE_PINS)
    if _sha256(SOURCE_PINS) != SOURCE_PINS_SHA256:
        raise Deny("source_pins_changed")
    pins = _read_json(SOURCE_PINS)
    if not isinstance(pins, dict) or not pins:
        raise Deny("source_pins_format")
    actual = {
        name: value
        for name, value in source.items()
        if name != "entry/server.py"
    }
    if actual != pins:
        raise Deny("source_pin_mismatch")
    return pins


def _scope_source_manifest(ready: pathlib.Path) -> dict[str, Any]:
    _no_reparse(ready)
    source = ready / SCOPE_SOURCE_NAME
    _no_reparse(source)
    info = os.lstat(source)
    if not stat.S_ISDIR(info.st_mode) or _link(source):
        raise Deny("scope_source_not_plain_directory")
    with os.scandir(ready) as entries:
        if {entry.name for entry in entries} != {
            FIXTURE.name,
            SCOPE_SOURCE_NAME,
        }:
            raise Deny("ready_input_set")
    expected_names = {name for name, _material_name, _text in SCOPE_SOURCE_FILES}
    with os.scandir(source) as entries:
        if {entry.name for entry in entries} != expected_names:
            raise Deny("scope_source_file_set")
    files = []
    for file_name, material_name, text in SCOPE_SOURCE_FILES:
        path = source / file_name
        _no_reparse(path)
        info = os.lstat(path)
        expected = text.encode("utf-8")
        if (
            not stat.S_ISREG(info.st_mode)
            or _link(path)
            or getattr(info, "st_nlink", 0) != 1
            or getattr(info, "st_file_attributes", 0) & 0x200
            or info.st_size != len(expected)
            or info.st_size > SCOPE_FILE_LIMIT
        ):
            raise Deny("scope_source_file_not_plain_small")
        with open(path, "rb") as stream:
            if stream.read() != expected:
                raise Deny("scope_source_file_bytes")
        files.append(
            {
                "name": file_name,
                "material_name": material_name,
                "path": str(path),
                "canonical": _norm(path),
                "bytes": len(expected),
                "sha256": _sha256(path),
            }
        )
    return {
        "path": str(source),
        "canonical": _norm(source),
        "scope_in_material_name": "scope-in",
        "files": files,
    }


def _verify_scope_source(
    ready: pathlib.Path, expected: Any
) -> dict[str, Any]:
    if not isinstance(expected, dict):
        raise Deny("prepared_scope_source")
    if set(expected) != {
        "path",
        "canonical",
        "scope_in_material_name",
        "files",
    }:
        raise Deny("prepared_scope_source_shape")
    actual = _scope_source_manifest(ready)
    if expected != actual:
        raise Deny("scope_source_changed")
    return actual


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
    fixture = _copy_fixture(layout["ready"])
    source_dir = layout["ready"] / SCOPE_SOURCE_NAME
    source_dir.mkdir(exist_ok=False)
    for file_name, _material_name, text in SCOPE_SOURCE_FILES:
        with open(source_dir / file_name, "xb") as stream:
            stream.write(text.encode("utf-8"))
    scope_source = _scope_source_manifest(layout["ready"])
    source = _sources()
    _reviewed_sources(source)
    manifest = {
        "format": PREPARED_FORMAT,
        "not_service_registration": True,
        "not_case_id_or_session": True,
        "created_at": datetime.now().astimezone().isoformat(timespec="milliseconds"),
        "expected_head": EXPECTED_HEAD,
        "source_pins_sha256": SOURCE_PINS_SHA256,
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
        "fixture": fixture,
        "scope_source": scope_source,
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
        "source": source,
    }
    _write_json(layout["prepared"], manifest)
    return layout["prepared"]


def _check_expected_path(
    value: Any, expected: pathlib.Path, code: str
) -> None:
    if not isinstance(value, dict):
        raise Deny(code)
    if value.get("path") != str(expected) or value.get("canonical") != _norm(expected):
        raise Deny(code)


def _verify_prepared(
    root: pathlib.Path,
) -> tuple[dict[str, Any], dict[str, pathlib.Path], dict[str, Any], str]:
    if not root.is_dir():
        raise Deny("prepared_root_missing")
    _no_reparse(root)
    layout = _layout(root)
    manifest = _read_json(layout["prepared"])
    if not isinstance(manifest, dict) or manifest.get("format") != PREPARED_FORMAT:
        raise Deny("prepared_manifest_format")
    if (
        manifest.get("not_service_registration") is not True
        or manifest.get("not_case_id_or_session") is not True
        or manifest.get("expected_head") != EXPECTED_HEAD
        or manifest.get("source_pins_sha256") != SOURCE_PINS_SHA256
    ):
        raise Deny("prepared_manifest_marker")
    paths = manifest.get("paths")
    if not isinstance(paths, dict):
        raise Deny("prepared_paths")
    expected_paths = {
        "root": root,
        "case": layout["case"],
        "ready": layout["ready"],
        "appdata": layout["appdata"],
        "paste": layout["paste"],
        "home": layout["private_home"],
        "system": layout["private_system"],
        "temp": layout["private_temp"],
    }
    for name, expected in expected_paths.items():
        _check_expected_path(paths.get(name), expected, f"prepared_path_{name}")
    for key in (
        "private_home",
        "appdata",
        "private_system",
        "private_temp",
        "case",
        "ready",
    ):
        path = layout[key]
        _no_reparse(path)
        if not path.is_dir():
            raise Deny(f"prepared_dir_{key}")
    if os.path.lexists(layout["paste"]):
        _no_reparse(layout["paste"])
        if not layout["paste"].is_dir():
            raise Deny("prepared_paste_not_directory")
    fixture = manifest.get("fixture")
    if not isinstance(fixture, dict):
        raise Deny("prepared_fixture")
    if (
        fixture.get("source_path") != str(FIXTURE)
        or fixture.get("source_canonical") != _norm(FIXTURE)
        or fixture.get("source_bytes") != FIXTURE_BYTES
        or fixture.get("source_sha256") != FIXTURE_SHA256
        or fixture.get("copy_path") != str(layout["ready"] / FIXTURE.name)
        or fixture.get("copy_canonical")
        != _norm(layout["ready"] / FIXTURE.name)
        or fixture.get("copy_bytes") != FIXTURE_BYTES
        or fixture.get("copy_sha256") != FIXTURE_SHA256
    ):
        raise Deny("prepared_fixture_identity")
    if (
        _link(FIXTURE)
        or not FIXTURE.is_file()
        or FIXTURE.stat().st_size != FIXTURE_BYTES
        or _sha256(FIXTURE) != FIXTURE_SHA256
    ):
        raise Deny("fixture_source_changed")
    _no_reparse(FIXTURE)
    copy_identity = _file_identity(layout["ready"] / FIXTURE.name)
    if (
        copy_identity["bytes"] != FIXTURE_BYTES
        or copy_identity["sha256"] != FIXTURE_SHA256
    ):
        raise Deny("fixture_copy_changed")
    if manifest.get("initial_case_empty") is not True:
        raise Deny("prepared_case_marker")
    with os.scandir(layout["case"]) as entries:
        if next(entries, None) is not None:
            raise Deny("prepared_case_not_empty")
    if os.path.lexists(layout["appdata"] / "cases.json"):
        raise Deny("prepared_case_registry_exists")
    if os.path.lexists(layout["appdata"] / "request-scopes.json"):
        raise Deny("prepared_scope_store_exists")
    _verify_scope_source(layout["ready"], manifest.get("scope_source"))
    settings_manifest = manifest.get("settings")
    if not isinstance(settings_manifest, dict):
        raise Deny("prepared_settings")
    settings_identity = _file_identity(layout["settings"])
    for key in ("path", "canonical", "bytes", "sha256"):
        if settings_identity[key] != settings_manifest.get(key):
            raise Deny("settings_changed")
    if (
        settings_manifest.get("fixed_servers") != SERVERS
        or settings_manifest.get("external_llm") != EXTERNAL_OFF
    ):
        raise Deny("settings_scope_changed")
    marker_manifest = manifest.get("daily_marker")
    if not isinstance(marker_manifest, dict):
        raise Deny("prepared_daily_marker")
    marker_identity = _file_identity(layout["daily_marker"])
    for key in ("path", "canonical", "bytes", "sha256"):
        if marker_identity[key] != marker_manifest.get(key):
            raise Deny("daily_marker_changed")
    if (
        marker_manifest.get("host_shape") != {"root": str(layout["case"])}
        or marker_manifest.get("service_registration") is not False
        or _read_json(layout["daily_marker"]) != {"root": str(layout["case"])}
    ):
        raise Deny("daily_marker_shape")
    source = manifest.get("source")
    if not isinstance(source, dict) or not source:
        raise Deny("prepared_source")
    if _sources() != source:
        raise Deny("source_identity_changed")
    _reviewed_sources(source)
    return manifest, layout, source, _sha256(layout["prepared"])


def _scrub_env(layout: dict[str, pathlib.Path]) -> None:
    for name in list(os.environ):
        upper = name.upper()
        if upper.startswith("LB_") or any(
            word in upper for word in ("KEY", "TOKEN", "PASSWORD", "SECRET")
        ):
            os.environ.pop(name, None)
    for name in ("OneDrive", "OneDriveCommercial", "OneDriveConsumer"):
        os.environ.pop(name, None)
    os.environ.update(
        {
            "HOME": str(layout["private_home"]),
            "USERPROFILE": str(layout["private_home"]),
            "APPDATA": str(layout["appdata"]),
            "LOCALAPPDATA": str(layout["appdata"]),
            "TEMP": str(layout["private_temp"]),
            "TMP": str(layout["private_temp"]),
            "TMPDIR": str(layout["private_temp"]),
            "PYTHONDONTWRITEBYTECODE": "1",
            "PYTHONPATH": str(SERVICE_DIR),
        }
    )
    sys.dont_write_bytecode = True


class Guard:
    def __init__(self) -> None:
        self.lock = threading.Lock()
        self.phase, self.counts, self.events = "setup", {}, []

    def bump(self, name: str) -> None:
        with self.lock:
            self.counts[name] = self.counts.get(name, 0) + 1

    def deny(self, name: str) -> None:
        with self.lock:
            self.counts[name] = self.counts.get(name, 0) + 1
            if len(self.events) < 256:
                self.events.append({"phase": self.phase, "guard": name})

    def snapshot(self) -> dict[str, Any]:
        with self.lock:
            outbound = sum(
                self.counts.get(name, 0)
                for name in (
                    "socket.connect",
                    "socket.connect_ex",
                    "socket.create_connection",
                    "httpx_mock_transport",
                )
            )
            return {
                "counts": dict(sorted(self.counts.items())),
                "violations": list(self.events),
                "unexpected_outbound_violations": outbound,
            }


def _install_keyring(
    counts: dict[str, int], guard: Guard, lock: threading.Lock
) -> None:
    def denied(*_args, **_kwargs):
        with lock:
            counts["keyring"] += 1
        guard.deny("keyring_access")
        raise Deny("keyring_access")

    module = types.ModuleType("keyring")
    for name in ("get_password", "set_password", "delete_password", "get_credential"):
        setattr(module, name, denied)
    module.__getattr__ = denied
    sys.modules["keyring"] = module


def _install_guards(guard: Guard):
    socket_connect = socket.socket.connect
    connect_ex = socket.socket.connect_ex
    create_connection = socket.create_connection
    socketpair = socket.socketpair
    thread_start = threading.Thread.start
    popen = subprocess.Popen
    system = os.system

    def no_connect(_self, _address):
        guard.deny("socket.connect")
        raise Deny("socket.connect")

    def no_connect_ex(_self, _address):
        guard.deny("socket.connect_ex")
        raise Deny("socket.connect_ex")

    def no_create(_address, *_args, **_kwargs):
        guard.deny("socket.create_connection")
        raise Deny("socket.create_connection")

    def counted_pair(*args, **kwargs):
        guard.bump("socket.socketpair")
        return socketpair(*args, **kwargs)

    def guarded_thread(self):
        if self.name.startswith("AnyIO worker thread"):
            guard.bump("anyio_worker_start")
            return thread_start(self)
        guard.deny("thread.start")
        raise Deny("thread.start")

    def no_popen(*_args, **_kwargs):
        guard.deny("subprocess.Popen")
        raise Deny("subprocess.Popen")

    def no_system(*_args, **_kwargs):
        guard.deny("os.system")
        raise Deny("os.system")

    socket.socket.connect = no_connect
    socket.socket.connect_ex = no_connect_ex
    socket.create_connection = no_create
    socket.socketpair = counted_pair
    threading.Thread.start = guarded_thread
    subprocess.Popen = no_popen
    os.system = no_system

    def restore() -> None:
        socket.socket.connect = socket_connect
        socket.socket.connect_ex = connect_ex
        socket.create_connection = create_connection
        socket.socketpair = socketpair
        threading.Thread.start = thread_start
        subprocess.Popen = popen
        os.system = system

    return restore


def _targets(servers: dict[str, str]) -> set[tuple[str, int]]:
    return {
        (urlsplit(value).hostname or "", urlsplit(value).port or 80)
        for value in servers.values()
    }


def _assert_wiring(
    lb: Any,
    appdata: pathlib.Path,
    expected_port: int,
    expected_token: str,
) -> None:
    if lb.settings.get()["servers"] != SERVERS or lb.net._servers != SERVERS:
        raise Deny("settings_or_net_not_private")
    if set(lb.net.allow._targets) != _targets(SERVERS) or lb.external.target() is not None:
        raise Deny("allowlist_or_external_not_private")
    if lb.config.contracts_dir.resolve() != CONTRACTS_DIR.resolve():
        raise Deny("contracts_not_current_b")
    if [path.resolve() for path in lb.config.skills_dirs] != [SKILLS_DIR.resolve()]:
        raise Deny("skills_not_current_b")
    if pathlib.Path(lb.config.appdata).resolve() != appdata.resolve():
        raise Deny("appdata_not_private")
    if lb.config.port != expected_port:
        raise Deny("config_port_mismatch")
    if not hmac.compare_digest(lb.config.token, expected_token):
        raise Deny("config_token_mismatch")
    if list(getattr(lb.ocr, "_threads", [])) or getattr(lb.retainer, "_proc", None) is not None:
        raise Deny("ocr_or_retainer_started")


async def _read_body(receive) -> bytes | None:
    body = bytearray()
    while True:
        message = await receive()
        if message["type"] == "http.disconnect":
            return None
        body.extend(message.get("body", b""))
        if len(body) > MAX_BODY:
            raise Deny("request_too_large")
        if not message.get("more_body", False):
            return bytes(body)


def _json(body: bytes) -> Any:
    try:
        return json.loads(body) if body.strip() else {}
    except (UnicodeDecodeError, ValueError):
        return None


async def _guard_reply(send, status: int, code: str) -> None:
    body = json.dumps(
        {"error": {"code": code, "message": "outside T31 reviewed boundary"}},
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
    SESSION_ID = "11111111-1111-4111-8111-111111111111"
    TASK_ID = re.compile(r"^T-[0-9]{14}-[0-9a-f]{4}$")
    TASK_FILES = frozenset({"task.json", "result.json", "reads.json"})
    FILE_LIMIT = 64 * 1024
    SPARSE = 0x200
    TARGET_REF_ID = "R01"
    MAX_CASE_OPENS = 4
    MAX_IMPORTS = 2
    MAX_MATERIAL_LISTS = 16
    MATERIAL_ROW_KEYS = frozenset(
        {
            "material_id",
            "rel_path",
            "name",
            "type",
            "size",
            "mtime",
            "sha256",
            "status",
            "unit",
            "unit_count",
            "is_ocr",
            "text_path",
            "pages_need_ocr",
            "pages_mixed",
            "note",
            "error",
            "imported_at",
            "updated_at",
            "origin",
            "ref_id",
        }
    )
    CASE_ROW_KEYS = MATERIAL_ROW_KEYS - {"origin", "ref_id"}
    TOOL_PLAN = (
        ("case_list_materials", {}),
        ("case_read_material", {"name": "scope-in"}),
        ("case_search", {"query": "T31_SHARED"}),
        ("case_read_material", {"name": "scope-out"}),
    )

    def __init__(
        self,
        app,
        *,
        case: pathlib.Path,
        ready: pathlib.Path,
        paste: pathlib.Path,
        appdata: pathlib.Path,
        ledger: pathlib.Path,
        host_token: str,
    ) -> None:
        self.app = app
        self.case = case
        self.ready = ready
        del paste
        self.appdata = appdata
        self.registry = appdata / "cases.json"
        self.ledger = ledger
        self.setup_ledger = ledger.with_name("setup-requests.ndjson")
        self.host_token = ("Bearer " + host_token).encode("utf-8")
        self.lock = threading.RLock()
        self.records: list[dict[str, Any]] = []
        self.setup_records: list[dict[str, Any]] = []
        self.io_mode = "setup_asgi"
        self.phase = "await_case_open"
        self.failure_code: str | None = None
        self.protocol_failure_details: dict[str, Any] | None = None
        self.inflight: str | None = None
        self.case_id: str | None = None
        self.case_open_attempts = 0
        self.case_open_ok = 0
        self.gui_case_open_attempts = 0
        self.gui_case_open_ok = 0
        self.import_attempts = 0
        self.import_ok = 0
        self.remove_attempts = 0
        self.remove_ok = 0
        self.auth_denials = 0
        self.policy_denials: dict[str, int] = {}
        self.read_counts: dict[str, int] = {}
        self.read_ok: dict[str, int] = {}
        self.material_list_attempts = 0
        self.materials_first: list[dict[str, Any]] | None = None
        self.materials_after: list[dict[str, Any]] | None = None
        self.pre_remove_baseline: dict[str, Any] | None = None
        self.post_remove_baseline: dict[str, Any] | None = None
        self.post_remove_list: list[dict[str, Any]] | None = None
        self.pre_remove_list_results: dict[str, list[dict[str, Any]]] = {}
        self.post_remove_list_results: dict[str, list[dict[str, Any]]] = {}
        self.pre_remove_list_ok = 0
        self.post_remove_list_ok = 0
        self.setup_complete = False
        self.native_refs_verified = False
        self.native_index_verified = False
        self.case_original_copy_verified = False
        self.scope_source = _scope_source_manifest(ready)
        self.source_root = ready / SCOPE_SOURCE_NAME
        self.expected_source_files = {
            item["name"]: item for item in self.scope_source["files"]
        }
        self.source_identity_before = self._source_snapshot()
        with open(self.setup_ledger, "x", encoding="utf-8"):
            pass
        with open(self.ledger, "x", encoding="utf-8"):
            pass

    def _record(self, method, path, status, disposition, started) -> None:
        item = {
            "method": method,
            "path": path,
            "status": status,
            "disposition": disposition,
            "channel": self.io_mode,
            "elapsed_ms": int((time.monotonic() - started) * 1000),
        }
        with self.lock:
            if self.failure_code is not None:
                item["protocol_failure"] = self.failure_code
                if self.protocol_failure_details is not None:
                    item["protocol_failure_details"] = self.protocol_failure_details
            target = self.setup_records if self.io_mode == "setup_asgi" else self.records
            ledger = self.setup_ledger if self.io_mode == "setup_asgi" else self.ledger
            target.append(item)
            with open(ledger, "a", encoding="utf-8", newline="\n") as stream:
                stream.write(json.dumps(item, separators=(",", ":")) + "\n")

    def _source_snapshot(self) -> dict[str, Any]:
        verified = _verify_scope_source(self.ready, self.scope_source)
        files = []
        for item in verified["files"]:
            path = pathlib.Path(item["path"])
            info = os.lstat(path)
            files.append(
                {
                    "name": item["name"],
                    "material_name": item["material_name"],
                    "path": item["path"],
                    "canonical": item["canonical"],
                    "bytes": info.st_size,
                    "sha256": _sha256(path),
                    "mtime": datetime.fromtimestamp(info.st_mtime)
                    .astimezone()
                    .isoformat(timespec="microseconds"),
                    "mtime_ns": getattr(
                        info, "st_mtime_ns", int(info.st_mtime * 1_000_000_000)
                    ),
                }
            )
        jpeg = []
        for label, path in (("source", FIXTURE), ("copy", self.ready / FIXTURE.name)):
            _no_reparse(path)
            info = os.lstat(path)
            if (
                not stat.S_ISREG(info.st_mode)
                or _link(path)
                or getattr(info, "st_nlink", 0) != 1
                or getattr(info, "st_file_attributes", 0) & self.SPARSE
                or info.st_size != FIXTURE_BYTES
                or _sha256(path) != FIXTURE_SHA256
            ):
                raise Deny(f"jpeg_{label}_identity")
            jpeg.append(
                {
                    "label": label,
                    "path": str(path),
                    "canonical": _norm(path),
                    "bytes": info.st_size,
                    "sha256": FIXTURE_SHA256,
                    "mtime_ns": getattr(
                        info, "st_mtime_ns", int(info.st_mtime * 1_000_000_000)
                    ),
                }
            )
        return {"files": files, "jpeg": jpeg}

    def _source_unchanged(self) -> bool:
        try:
            return self._source_snapshot() == self.source_identity_before
        except (Deny, OSError, ValueError, TypeError):
            return False

    def _native_refs(
        self, *, removed_ref_ids: frozenset[str] = frozenset()
    ) -> list[dict[str, Any]]:
        path = self.case / "工作区" / "材料" / "引用.json"
        data = self._checked_file(path)
        if (
            not isinstance(data, dict)
            or set(data) != {"v", "refs", "next_seq"}
            or data.get("v") != 1
            or data.get("next_seq") != 1 + len(REFERENCE_MATERIALS)
            or not isinstance(data.get("refs"), list)
            or len(data["refs"]) != len(REFERENCE_MATERIALS)
        ):
            raise Deny("native_refs_shape")
        expected = {
            ref_id: (file_name, ref_id in removed_ref_ids)
            for ref_id, file_name, _material_name, _material_id in REFERENCE_MATERIALS
        }
        found: dict[str, dict[str, Any]] = {}
        for ref in data["refs"]:
            if (
                not isinstance(ref, dict)
                or set(ref) != {
                    "ref_id",
                    "path",
                    "kind",
                    "status",
                    "added_at",
                    "checked_at",
                }
                or ref.get("ref_id") not in expected
                or ref.get("ref_id") in found
            ):
                raise Deny("native_refs_identity")
            ref_id = ref["ref_id"]
            file_name, is_removed = expected[ref_id]
            path_value = ref.get("path")
            if (
                not isinstance(path_value, str)
                or _norm(path_value) != _norm(self.source_root / file_name)
                or ref.get("kind") != "file"
                or ref.get("status") != ("removed" if is_removed else "ok")
                or not isinstance(ref.get("added_at"), str)
                or not ref["added_at"]
                or not isinstance(ref.get("checked_at"), str)
                or not ref["checked_at"]
            ):
                raise Deny("native_refs_identity")
            found[ref_id] = {
                "ref_id": ref_id,
                "path": path_value,
                "canonical": _norm(path_value),
                "kind": ref["kind"],
                "status": ref["status"],
            }
        if set(found) != set(expected):
            raise Deny("native_refs_identity")
        self.native_refs_verified = True
        return [found[ref_id] for ref_id in sorted(found)]

    def _native_materials(self) -> list[dict[str, Any]]:
        path = self.case / "工作区" / "材料" / "index.json"
        data = self._checked_file(path)
        if (
            not isinstance(data, dict)
            or set(data) != {"v", "case_id", "next_seq", "materials"}
            or data.get("v") != 1
            or data.get("case_id") != self.case_id
            or data.get("next_seq") != 1 + len(SCOPE_SOURCE_FILES)
            or not isinstance(data.get("materials"), list)
            or len(data["materials"]) != len(SCOPE_SOURCE_FILES)
        ):
            raise Deny("native_index_shape")
        source_now = self._source_snapshot()["files"]
        by_name = {item["name"]: item for item in source_now}
        reference_by_rel = {
            f"工作区/引用/{ref_id}/{file_name}": (
                ref_id,
                file_name,
                material_name,
                material_id,
            )
            for ref_id, file_name, material_name, material_id in REFERENCE_MATERIALS
        }
        found: dict[str, dict[str, Any]] = {}
        ids: set[str] = set()
        for row in data["materials"]:
            if not isinstance(row, dict) or not isinstance(row.get("rel_path"), str):
                raise Deny("native_material_row_shape")
            rel_path = row["rel_path"]
            if rel_path == CASE_SOURCE_FILE:
                if (
                    set(row) not in {self.CASE_ROW_KEYS, self.CASE_ROW_KEYS | {"origin"}}
                    or row.get("origin") not in (None, "case")
                    or row.get("ref_id") is not None
                ):
                    raise Deny("native_case_material_row_shape")
                ref_id = None
                expected_material_id = CASE_MATERIAL_ID
                file_name = CASE_SOURCE_FILE
                material_name = "scope-in"
            else:
                reference = reference_by_rel.get(rel_path)
                if (
                    reference is None
                    or set(row) != self.MATERIAL_ROW_KEYS
                    or row.get("origin") != "ref"
                ):
                    raise Deny("native_material_row_shape")
                ref_id, file_name, material_name, expected_material_id = reference
                if row.get("ref_id") != ref_id:
                    raise Deny("native_material_ref_identity")
            expected = by_name.get(file_name)
            if expected is None or file_name in found:
                raise Deny("native_material_path_identity")
            material_id = row.get("material_id")
            text_path = row.get("text_path")
            text_parts = (
                pathlib.PurePosixPath(text_path)
                if isinstance(text_path, str)
                else None
            )
            if (
                material_id != expected_material_id
                or material_id in ids
                or row.get("name") != material_name
                or row.get("type") != "txt"
                or row.get("status") != "parsed"
                or row.get("size") != expected["bytes"]
                or row.get("sha256") != expected["sha256"]
                or row.get("mtime") != expected["mtime"]
                or not isinstance(text_path, str)
                or not text_path.startswith("工作区/材料/文本/")
                or text_parts is None
                or text_parts.is_absolute()
                or any(part in ("", ".", "..") for part in text_parts.parts)
            ):
                raise Deny("native_material_identity")
            ids.add(material_id)
            found[file_name] = {
                "file_name": file_name,
                "material_name": material_name,
                "material_id": material_id,
                "origin": "case" if ref_id is None else "ref",
                "ref_id": ref_id,
                "sha256": row["sha256"],
                "bytes": row["size"],
                "rel_path": rel_path,
                "text_path": text_path,
                "name": row["name"],
                "status": row["status"],
            }
        if set(found) != set(by_name) or tuple(
            found[name]["material_id"] for name in sorted(found)
        ) != tuple(sorted(EXPECTED_MATERIAL_IDS)):
            raise Deny("native_material_set")
        self.native_index_verified = True
        ordered_names = [
            CASE_SOURCE_FILE,
            *[item[1] for item in REFERENCE_MATERIALS],
        ]
        return [found[file_name] for file_name in ordered_names]

    def _source_payload_matches(self) -> list[dict[str, str]]:
        def traversal_access(value: str | os.PathLike[str]) -> pathlib.Path:
            text = os.fspath(value)
            if (
                os.name != "nt"
                or not isinstance(text, str)
                or len(text) < 248
                or text.startswith(("\\\\?\\", "\\\\.\\"))
                or not os.path.isabs(text)
            ):
                return pathlib.Path(value)
            canonical = os.path.abspath(text)
            drive, _ = os.path.splitdrive(canonical)
            if not drive:
                return pathlib.Path(value)
            if drive.startswith("\\\\"):
                alias = "\\\\?\\UNC\\" + canonical[2:]
            else:
                alias = "\\\\?\\" + canonical
            if _norm(alias) == _norm(text):
                return pathlib.Path(alias)
            return pathlib.Path(value)

        wanted = {
            (item["bytes"], item["sha256"]): item["name"]
            for item in self.scope_source["files"]
        }
        matches: list[dict[str, str]] = []
        stack = [self.case]
        while stack:
            directory = traversal_access(stack.pop())
            _no_reparse(directory)
            with os.scandir(directory) as entries:
                for entry in entries:
                    entry_path = traversal_access(entry.path)
                    if _link(entry_path):
                        raise Deny("case_link_identity")
                    if entry.is_dir(follow_symlinks=False):
                        stack.append(entry_path)
                    elif entry.is_file(follow_symlinks=False):
                        info = entry.stat(follow_symlinks=False)
                        key = (info.st_size, _sha256(entry_path))
                        source_name = wanted.get(key)
                        if source_name is not None:
                            relative = entry_path.relative_to(self.case).as_posix()
                            matches.append(
                                {
                                    "source_name": source_name,
                                    "rel_path": relative,
                                }
                            )
        return sorted(matches, key=lambda item: item["rel_path"])

    def _case_copy_state(self) -> dict[str, Any]:
        matches = self._source_payload_matches()
        expected = [{"source_name": CASE_SOURCE_FILE, "rel_path": CASE_SOURCE_FILE}]
        if matches != expected:
            raise Deny("case_original_copy_identity")
        self.case_original_copy_verified = True
        return {
            "case_original_rel_path": CASE_SOURCE_FILE,
            "source_payload_matches": matches,
            "reference_original_copies": 0,
        }

    def _verify_case_only_state(self) -> list[dict[str, Any]]:
        if not self._own_registry() or not self._task_dir_empty():
            raise Deny("case_or_task_scope")
        if not self._source_unchanged():
            raise Deny("source_identity_changed")
        data = self._case_index()
        if data.get("next_seq") != 2 or len(data["materials"]) != 1:
            raise Deny("case_only_index_shape")
        row = data["materials"][0]
        expected = next(
            item for item in self.source_identity_before["files"]
            if item["name"] == CASE_SOURCE_FILE
        )
        if (
            not isinstance(row, dict)
            or set(row) not in {self.CASE_ROW_KEYS, self.CASE_ROW_KEYS | {"origin"}}
            or row.get("origin") not in (None, "case")
            or row.get("ref_id") is not None
            or row.get("material_id") != CASE_MATERIAL_ID
            or row.get("rel_path") != CASE_SOURCE_FILE
            or row.get("name") != "scope-in"
            or row.get("type") != "txt"
            or row.get("status") != "parsed"
            or row.get("size") != expected["bytes"]
            or row.get("sha256") != expected["sha256"]
            or row.get("mtime") != expected["mtime"]
        ):
            raise Deny("case_only_material_identity")
        text = self._text_identity(row)
        refs_path = self.case / "工作区" / "材料" / "引用.json"
        if os.path.lexists(refs_path):
            refs = self._checked_file(refs_path)
            if refs != {"v": 1, "refs": [], "next_seq": 1}:
                raise Deny("case_only_refs_not_empty")
        copy_state = self._case_copy_state()
        return [
            {
                "file_name": CASE_SOURCE_FILE,
                "material_name": "scope-in",
                "material_id": CASE_MATERIAL_ID,
                "origin": "case",
                "ref_id": None,
                "sha256": row["sha256"],
                "bytes": row["size"],
                "rel_path": row["rel_path"],
                "text_path": row["text_path"],
                "name": row["name"],
                "status": row["status"],
                "text": text,
                "case_copy": copy_state,
            }
        ]

    def _verify_import_state(self) -> list[dict[str, Any]]:
        if not self._own_registry() or not self._task_dir_empty():
            raise Deny("case_or_task_scope")
        if not self._source_unchanged():
            raise Deny("source_identity_changed")
        self._native_refs()
        materials = self._native_materials()
        self._case_copy_state()
        return materials

    @staticmethod
    def _single_query(query: bytes, key: str) -> str | None:
        values = parse_qs(query.decode("latin-1"), keep_blank_values=True)
        if set(values) != {key}:
            return None
        items = values[key]
        return items[0] if len(items) == 1 and items[0] else None

    @staticmethod
    def _material_list_query(query: bytes) -> tuple[str, str | None] | None:
        if not query or len(query) > 128:
            return None
        seen: set[bytes] = set()
        case_id: str | None = None
        include_removed: str | None = None
        for part in query.split(b"&"):
            key, separator, value = part.partition(b"=")
            if not separator or not key or key in seen:
                return None
            seen.add(key)
            if key == b"case_id":
                try:
                    candidate = value.decode("ascii")
                except UnicodeDecodeError:
                    return None
                if CASE_ID.fullmatch(candidate) is None:
                    return None
                case_id = candidate
            elif key == b"include_removed":
                if value not in {b"true", b"false"}:
                    return None
                include_removed = value.decode("ascii")
            else:
                return None
        if case_id is None:
            return None
        return case_id, include_removed

    @staticmethod
    def _material_list_key(include_removed: str | None) -> str:
        return "default" if include_removed is None else include_removed

    def _bound_case(self) -> str | None:
        with self.lock:
            return self.case_id

    def _own_registry(self) -> bool:
        bound_case = self._bound_case()
        try:
            _no_reparse(self.registry)
            data = _read_json(self.registry)
            cases = data.get("cases") if isinstance(data, dict) else None
            if (
                not isinstance(data, dict)
                or data.get("v") != 1
                or not isinstance(cases, list)
                or len(cases) != 1
                or not isinstance(cases[0], dict)
            ):
                return False
            return (
                bound_case is not None
                and cases[0].get("case_id") == bound_case
                and isinstance(cases[0].get("root"), str)
                and _norm(cases[0]["root"]) == _norm(self.case)
            )
        except (Deny, OSError, ValueError, TypeError):
            return False

    def _task_dir_empty(self) -> bool:
        path = self.case / "工作区" / "任务"
        try:
            _no_reparse(self.case)
            _no_reparse(path, allow_missing_tail=True)
            if not os.path.lexists(path):
                return True
            if _link(path) or not path.is_dir():
                return False
            with os.scandir(path) as entries:
                return next(entries, None) is None
        except (Deny, OSError, ValueError, TypeError):
            return False

    def _case_index(self) -> dict[str, Any]:
        path = self.case / "工作区" / "材料" / "index.json"
        data = self._checked_file(path)
        if (
            not isinstance(data, dict)
            or set(data) != {"v", "case_id", "next_seq", "materials"}
            or data.get("v") != 1
            or data.get("case_id") != self.case_id
            or not isinstance(data.get("materials"), list)
        ):
            raise Deny("materials_index_shape")
        return data

    def _material_by_name(self, name: str) -> dict[str, Any]:
        index = self._case_index()
        matches = [item for item in index["materials"] if item.get("name") == name]
        if len(matches) != 1:
            raise Deny("materials_name_identity")
        material = matches[0]
        expected = self.expected_materials[name]
        material_id = material.get("material_id")
        digest = material.get("sha256")
        rel_path = material.get("rel_path")
        if (
            not isinstance(material_id, str)
            or MATERIAL_ID.fullmatch(material_id) is None
            or material.get("type") != "txt"
            or material.get("status") != "parsed"
            or not isinstance(digest, str)
            or re.fullmatch(r"[0-9a-f]{64}", digest) is None
            or not isinstance(rel_path, str)
            or not rel_path
            or material.get("size") != expected["bytes"]
            or digest != expected["sha256"]
        ):
            raise Deny("materials_native_identity")
        relative = pathlib.PurePosixPath(rel_path)
        if (
            relative.is_absolute()
            or not relative.parts
            or any(part in ("", ".", "..") for part in relative.parts)
        ):
            raise Deny("materials_rel_path")
        path = self.case.joinpath(*relative.parts)
        if not _within(self.case, path):
            raise Deny("materials_outside_case")
        _no_reparse(path)
        info = os.lstat(path)
        if (
            not stat.S_ISREG(info.st_mode)
            or _link(path)
            or getattr(info, "st_nlink", 0) != 1
            or getattr(info, "st_file_attributes", 0) & self.SPARSE
            or info.st_size > SCOPE_FILE_LIMIT
            or info.st_size != expected["bytes"]
            or _sha256(path) != digest
        ):
            raise Deny("materials_current_hash")
        return {
            "material_id": material_id,
            "name": name,
            "sha256": digest,
            "bytes": info.st_size,
            "rel_path": rel_path,
        }

    def _validate_imported_materials(self) -> None:
        index = self._case_index()
        actual_names = [item.get("name") for item in index["materials"]]
        if (
            len(index["materials"]) != len(SCOPE_SOURCE_FILES)
            or set(actual_names) != set(self.expected_materials)
        ):
            raise Deny("materials_set_identity")
        found: dict[str, dict[str, Any]] = {}
        ids: set[str] = set()
        for name in self.expected_materials:
            item = self._material_by_name(name)
            if item["material_id"] in ids:
                raise Deny("materials_id_duplicate")
            ids.add(item["material_id"])
            found[name] = item
        self.index_by_name = found

    def _case_relative_path(self, rel_path: str) -> pathlib.Path:
        relative = pathlib.PurePosixPath(rel_path)
        if (
            relative.is_absolute()
            or not relative.parts
            or any(part in ("", ".", "..") for part in relative.parts)
        ):
            raise Deny("case_relative_path")
        path = self.case.joinpath(*relative.parts)
        if not _within(self.case, path):
            raise Deny("case_path_escape")
        return path

    def _text_identity(
        self, row: dict[str, Any], *, allow_missing: bool = False
    ) -> dict[str, Any] | None:
        text_path = row.get("text_path")
        if not isinstance(text_path, str) or not text_path.startswith(
            "工作区/材料/文本/"
        ):
            raise Deny("material_text_path")
        path = self._case_relative_path(text_path)
        _no_reparse(path, allow_missing_tail=allow_missing)
        if not os.path.lexists(path):
            if allow_missing:
                return None
            raise Deny("material_text_missing")
        info = os.lstat(path)
        if (
            not stat.S_ISREG(info.st_mode)
            or _link(path)
            or getattr(info, "st_nlink", 0) != 1
            or getattr(info, "st_file_attributes", 0) & self.SPARSE
            or info.st_size > self.FILE_LIMIT
        ):
            raise Deny("material_text_not_plain_small")
        return {
            "path": str(path),
            "canonical": _norm(path),
            "bytes": info.st_size,
            "sha256": _sha256(path),
            "mtime_ns": getattr(
                info, "st_mtime_ns", int(info.st_mtime * 1_000_000_000)
            ),
        }

    def _native_material_state(self) -> dict[str, Any]:
        if not self._own_registry() or not self._task_dir_empty():
            raise Deny("case_or_task_scope")
        if not self._source_unchanged():
            raise Deny("source_identity_changed")
        refs = self._native_refs()
        materials = self._native_materials()
        raw = self._case_index()
        rows = {item["material_id"]: item for item in raw["materials"]}
        if set(rows) != {item["material_id"] for item in materials}:
            raise Deny("native_material_state_ids")
        texts = {
            material_id: self._text_identity(row)
            for material_id, row in rows.items()
        }
        case_copy = self._case_copy_state()
        return {
            "refs": refs,
            "materials": materials,
            "index": raw,
            "texts": texts,
            "case_copy": case_copy,
        }

    def finish_setup(self, public_value: dict[str, Any]) -> None:
        with self.lock:
            if (
                self.setup_complete
                or self.case_id is None
                or self.case_open_ok != 1
                or self.import_attempts != self.MAX_IMPORTS
                or self.import_ok != self.MAX_IMPORTS
                or self.materials_first is None
                or len(self.materials_first) != 1
                or self.materials_first[0].get("material_id") != CASE_MATERIAL_ID
                or self.materials_after is None
                or tuple(
                    item.get("material_id") for item in self.materials_after
                )
                != EXPECTED_MATERIAL_IDS
            ):
                raise Deny("setup_state_incomplete")
        native = self._native_material_state()
        if (
            not isinstance(public_value, dict)
            or set(public_value) != {"materials"}
        ):
            raise Deny("setup_public_materials")
        public_rows = public_value.get("materials")
        if (
            not isinstance(public_rows, list)
            or len(public_rows) != len(SCOPE_SOURCE_FILES)
        ):
            raise Deny("setup_public_materials")
        materials = native["materials"]
        by_id = {item["material_id"]: item for item in materials}
        target = by_id.get(TARGET_MATERIAL_ID)
        if (
            len(materials) != len(SCOPE_SOURCE_FILES)
            or target is None
            or target["file_name"] != "scope-out.txt"
            or target["ref_id"] != self.TARGET_REF_ID
            or target["rel_path"]
            != f"工作区/引用/{self.TARGET_REF_ID}/scope-out.txt"
        ):
            raise Deny("target_material_identity")
        public_by_id = {
            row.get("material_id"): row
            for row in public_rows
            if isinstance(row, dict)
        }
        if (
            len(public_by_id) != len(public_rows)
            or set(public_by_id) != set(by_id)
            or any(public_by_id[mid].get("name") != item["name"] for mid, item in by_id.items())
            or any(
                public_by_id[mid].get("status") != "parsed"
                for mid in by_id
            )
            or public_by_id[CASE_MATERIAL_ID].get("origin") not in (None, "case")
            or public_by_id[CASE_MATERIAL_ID].get("ref_id") is not None
            or public_by_id[CASE_MATERIAL_ID].get("location") is not None
            or any(
                public_by_id[material_id].get("origin") != "ref"
                or public_by_id[material_id].get("ref_id") != ref_id
                or not isinstance(public_by_id[material_id].get("location"), str)
                or _norm(public_by_id[material_id]["location"])
                != _norm(self.source_root / file_name)
                for ref_id, file_name, _material_name, material_id in REFERENCE_MATERIALS
            )
        ):
            raise Deny("setup_public_materials_identity")
        with self.lock:
            self.pre_remove_baseline = copy.deepcopy(
                {
                    **native,
                    "public_materials": public_rows,
                }
            )
            self.setup_complete = True
            self.io_mode = "gui_tcp"
            self.phase = "await_remove"
            self.inflight = None

    def _verify_pre_remove_state(self) -> None:
        baseline = self.pre_remove_baseline
        if not isinstance(baseline, dict) or not self.setup_complete:
            raise Deny("remove_before_setup")
        if not self._own_registry() or not self._task_dir_empty():
            raise Deny("remove_case_or_task_scope")
        if not self._source_unchanged():
            raise Deny("remove_source_identity")
        current = self._native_material_state()
        expected = {
            key: baseline[key]
            for key in ("refs", "materials", "index", "texts", "case_copy")
        }
        if current != expected:
            raise Deny("remove_pre_state_changed")

    def _verify_post_remove_state(self) -> dict[str, Any]:
        baseline = self.pre_remove_baseline
        if not isinstance(baseline, dict):
            raise Deny("remove_baseline_missing")
        if not self._own_registry() or not self._task_dir_empty():
            raise Deny("remove_post_case_or_task_scope")
        if not self._source_unchanged():
            raise Deny("remove_external_source_changed")
        refs = self._native_refs(
            removed_ref_ids=frozenset({self.TARGET_REF_ID})
        )
        expected_refs = []
        for ref in baseline["refs"]:
            expected_ref = dict(ref)
            if expected_ref["ref_id"] == self.TARGET_REF_ID:
                expected_ref["status"] = "removed"
            expected_refs.append(expected_ref)
        if refs != expected_refs:
            raise Deny("remove_ref_state")
        raw = self._case_index()
        before_raw = baseline["index"]
        if (
            raw["v"] != before_raw["v"]
            or raw["case_id"] != before_raw["case_id"]
            or raw["next_seq"] != before_raw["next_seq"]
            or len(raw["materials"]) != len(before_raw["materials"])
        ):
            raise Deny("remove_index_envelope")
        before_rows = {
            row["material_id"]: row for row in before_raw["materials"]
        }
        after_rows = {row["material_id"]: row for row in raw["materials"]}
        if set(after_rows) != set(before_rows) or TARGET_MATERIAL_ID not in after_rows:
            raise Deny("remove_index_ids")
        before_target = before_rows[TARGET_MATERIAL_ID]
        after_target = after_rows[TARGET_MATERIAL_ID]
        immutable_keys = {
            "material_id",
            "rel_path",
            "name",
            "type",
            "size",
            "mtime",
            "sha256",
            "unit",
            "unit_count",
            "is_ocr",
            "text_path",
            "note",
            "imported_at",
            "origin",
            "ref_id",
        }
        if (
            set(after_target) != set(before_target)
            or any(
                after_target.get(key) != before_target.get(key)
                for key in immutable_keys
            )
            or after_target.get("status") != "removed"
            or after_target.get("pages_need_ocr") != []
            or after_target.get("pages_mixed") != []
            or after_target.get("error") is not None
            or not isinstance(after_target.get("updated_at"), str)
            or not after_target["updated_at"]
        ):
            raise Deny("remove_target_tombstone")
        remaining_ids = set(after_rows) - {TARGET_MATERIAL_ID}
        if len(remaining_ids) != 2 or any(
            after_rows[mid] != before_rows[mid] for mid in remaining_ids
        ):
            raise Deny("remove_remaining_index_identity")
        target_text = self._text_identity(after_target, allow_missing=True)
        if target_text is not None:
            raise Deny("remove_target_text_not_deleted")
        remaining_texts = {
            mid: self._text_identity(after_rows[mid]) for mid in remaining_ids
        }
        expected_texts = {
            mid: baseline["texts"][mid] for mid in remaining_ids
        }
        if remaining_texts != expected_texts:
            raise Deny("remove_remaining_text_identity")
        case_copy = self._case_copy_state()
        return {
            "refs": refs,
            "index": raw,
            "target": after_target,
            "remaining_ids": sorted(remaining_ids),
            "remaining_texts": remaining_texts,
            "target_text_absent": True,
            "case_copy": case_copy,
            "source_unchanged": True,
        }

    def _validate_public_materials(
        self,
        rows: Any,
        *,
        before_remove: bool,
        include_removed: str | None,
    ) -> list[dict[str, Any]]:
        baseline = self.pre_remove_baseline
        if not isinstance(baseline, dict) or not isinstance(rows, list):
            raise Deny("materials_list_authority")
        expected_rows = baseline["public_materials"]
        if before_remove:
            expected_by_id = {
                row["material_id"]: row for row in expected_rows
            }
            expected_count = len(SCOPE_SOURCE_FILES)
        else:
            post = self.post_remove_baseline
            if not isinstance(post, dict):
                raise Deny("materials_list_post_missing")
            remaining_ids = set(post["remaining_ids"])
            baseline_by_id = {
                row["material_id"]: row for row in expected_rows
            }
            expected_by_id = {
                material_id: baseline_by_id[material_id]
                for material_id in remaining_ids
            }
            if include_removed == "true":
                target = baseline_by_id.get(TARGET_MATERIAL_ID)
                if not isinstance(target, dict):
                    raise Deny("materials_list_target_authority")
                tombstone = copy.deepcopy(target)
                tombstone.update(
                    {
                        "status": "removed",
                        "stale_ocr": False,
                        "error": None,
                        "pages_need_ocr": [],
                        "pages_mixed": [],
                        "chars": None,
                    }
                )
                expected_by_id[TARGET_MATERIAL_ID] = tombstone
            expected_count = len(expected_by_id)
        by_id = {
            row.get("material_id"): row for row in rows if isinstance(row, dict)
        }
        if (
            len(rows) != expected_count
            or len(by_id) != len(rows)
            or set(by_id) != set(expected_by_id)
        ):
            raise Deny("materials_list_identity")
        for material_id, expected in expected_by_id.items():
            if by_id[material_id] != expected:
                raise Deny("materials_list_native_identity")
        return copy.deepcopy(rows)

    def _scope_record(self) -> dict[str, Any]:
        path = self.appdata / "request-scopes.json"
        data = self._checked_file(path)
        if (
            not isinstance(data, dict)
            or set(data) != {"v", "records"}
            or data.get("v") != 1
            or not isinstance(data.get("records"), dict)
        ):
            raise Deny("request_scope_store_shape")
        records = data["records"]
        if self.request_id is None or set(records) != {self.request_id}:
            raise Deny("request_scope_store_identity")
        record = records[self.request_id]
        if not isinstance(record, dict) or set(record) != {
            "case_id",
            "session_id",
            "state",
            "materials",
            "task_id",
            "updated_at",
        }:
            raise Deny("request_scope_record_shape")
        if (
            record.get("case_id") != self.case_id
            or record.get("session_id") != self.SESSION_ID
            or not isinstance(record.get("materials"), list)
            or len(record["materials"]) != 1
        ):
            raise Deny("request_scope_record_identity")
        material = record["materials"][0]
        if (
            not isinstance(material, dict)
            or set(material) != {"material_id", "sha256"}
            or material.get("material_id") != self.scope_in_id
            or material.get("sha256") != self.scope_in_sha
        ):
            raise Deny("request_scope_record_material")
        return record

    def _expected_scope(self) -> dict[str, Any]:
        if (
            self.request_id is None
            or self.case_id is None
            or self.scope_in_id is None
            or self.scope_in_sha is None
        ):
            raise Deny("request_scope_not_prepared")
        return {
            "request_id": self.request_id,
            "case_id": self.case_id,
            "kind": "materials",
            "materials": [
                {
                    "material_id": self.scope_in_id,
                    "sha256": self.scope_in_sha,
                }
            ],
        }

    def _prepared_scope_authority(self) -> dict[str, Any]:
        record = self._scope_record()
        if record.get("state") != "prepared" or record.get("task_id") is not None:
            raise Deny("request_scope_not_prepared")
        if not self._task_dir_empty():
            raise Deny("task_preclaim_not_empty")
        current = self._material_by_name("scope-in")
        if current["sha256"] != self.scope_in_sha:
            raise Deny("request_scope_material_current")
        return record

    def _task_tree(
        self, task_id: str, *, final: bool = False
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
        base = self.case / "工作区" / "任务"
        _no_reparse(self.case)
        _no_reparse(base)
        if _link(base) or not base.is_dir():
            raise Deny("task_base_not_directory")
        with os.scandir(base) as entries:
            folders = list(entries)
        if len(folders) != 1:
            raise Deny("task_dir_count")
        folder = folders[0]
        if (
            folder.name != task_id
            or not folder.is_dir(follow_symlinks=False)
            or _link(folder.path)
        ):
            raise Deny("task_dir_identity")
        task_dir = pathlib.Path(folder.path)
        _no_reparse(task_dir)
        with os.scandir(task_dir) as entries:
            files = list(entries)
        if (
            {item.name for item in files} != self.TASK_FILES
            or any(
                not item.is_file(follow_symlinks=False) or _link(item.path)
                for item in files
            )
        ):
            raise Deny("task_files_identity")
        task = self._checked_file(task_dir / "task.json")
        result = self._checked_file(task_dir / "result.json")
        reads = self._checked_file(task_dir / "reads.json")
        expected_state = "finished" if final else "running"
        if not isinstance(task, dict) or not (
            task.get("v") == 1
            and task.get("task_id") == task_id
            and task.get("case_id") == self.case_id
            and task.get("session_id") == self.SESSION_ID
            and task.get("kind") == "agent"
            and task.get("route") == "local"
            and task.get("skill") is None
            and task.get("state") == expected_state
            and task.get("request_id") == self.request_id
            and task.get("request_scope") == self._expected_scope()
        ):
            raise Deny("task_identity")
        usage = result.get("usage") if isinstance(result, dict) else None
        expected_status = self.task_status if final else "running"
        expected_usage = (
            {
                "model_calls": 0,
                "tool_calls": 4,
                "elapsed_s": self.end_elapsed,
            }
            if final
            else {"model_calls": 0, "tool_calls": 0, "elapsed_s": 0}
        )
        if not isinstance(result, dict) or not (
            result.get("v") == 1
            and result.get("task_id") == task_id
            and result.get("status") == expected_status
            and usage == expected_usage
            and result.get("drafts") == []
            and result.get("citations") == []
        ):
            raise Deny("result_identity")
        if not isinstance(reads, dict) or set(reads) != {"v", "task_id", "reads"}:
            raise Deny("reads_identity")
        rows = reads.get("reads")
        expected_reads = 1 if self.tool_ok >= 2 else 0
        if (
            reads.get("v") != 1
            or reads.get("task_id") != task_id
            or not isinstance(rows, list)
            or len(rows) != expected_reads
        ):
            raise Deny("reads_count")
        for row in rows:
            if (
                not isinstance(row, dict)
                or row.get("material_id") != self.scope_in_id
                or row.get("material_version") != self.scope_in_sha
            ):
                raise Deny("reads_scope")
        return task, result, reads

    def _task_authority(
        self, task_id: str, *, final: bool = False
    ) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
        record = self._scope_record()
        if record.get("state") != "claimed" or record.get("task_id") != task_id:
            raise Deny("request_scope_not_claimed")
        tree = self._task_tree(task_id, final=final)
        current = self._material_by_name("scope-in")
        if current["sha256"] != self.scope_in_sha:
            raise Deny("task_scope_current_hash")
        return tree

    @staticmethod
    def _exact_keys(value: Any, keys: set[str]) -> bool:
        return isinstance(value, dict) and set(value) == keys

    @staticmethod
    def _is_int(value: Any, minimum: int, maximum: int | None = None) -> bool:
        return (
            isinstance(value, int)
            and not isinstance(value, bool)
            and value >= minimum
            and (maximum is None or value <= maximum)
        )

    def _authorized(self, scope) -> bool:
        values = [
            value
            for name, value in scope.get("headers", [])
            if name.lower() == b"authorization"
        ]
        return len(values) == 1 and hmac.compare_digest(values[0], self.host_token)

    def _deny(self, code: str) -> str:
        self.policy_denials[code] = self.policy_denials.get(code, 0) + 1
        return code

    def _fail(self, code: str) -> None:
        with self.lock:
            if self.failure_code is None:
                self.failure_code = code
            self.phase = "failed"
            self.inflight = None

    def _required_path_diagnostic(self, exc: BaseException) -> dict[str, Any]:
        frames: list[dict[str, Any]] = []
        no_reparse_path = None
        no_reparse_current = None
        cursor = exc.__traceback__
        while cursor is not None:
            function = cursor.tb_frame.f_code.co_name
            frames.append({"function": function, "line": cursor.tb_lineno})
            if function == "_no_reparse" and no_reparse_path is None:
                namespace = cursor.tb_frame.f_locals
                no_reparse_path = self._diagnostic_relative(
                    namespace.get("path"), self.case.parent
                )
                no_reparse_current = self._diagnostic_relative(
                    namespace.get("current"), self.case.parent
                )
            cursor = cursor.tb_next
        return {
            "traceback": frames,
            "no_reparse_path": no_reparse_path,
            "no_reparse_current": no_reparse_current,
        }

    @staticmethod
    def _diagnostic_relative(
        value: str | os.PathLike[str] | None, run_root: pathlib.Path
    ) -> str | None:
        if value is None:
            return None
        if not _within(run_root, value):
            return "pinned_external"
        try:
            relative = os.path.relpath(_norm(value), _norm(run_root))
        except (OSError, ValueError, TypeError):
            return "pinned_external"
        if relative == ".." or relative.startswith(".." + os.sep):
            return "pinned_external"
        return "." if relative == "." else relative.replace("\\", "/")

    @staticmethod
    def _no_query(query: bytes) -> bool:
        return query == b""

    def _claim_case(self, query: bytes, body: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("CASE_OPEN_QUERY_OR_BODY")
        if not (
            isinstance(data, dict)
            and (
                set(data) == {"path"}
                or (set(data) == {"path", "template"} and data["template"] is None)
            )
            and isinstance(data.get("path"), str)
        ):
            return self._deny("CASE_OPEN_BODY")
        try:
            if _norm(data["path"]) != _norm(self.case):
                return self._deny("CASE_OPEN_PATH")
        except (OSError, ValueError, TypeError):
            return self._deny("CASE_OPEN_PATH")
        with self.lock:
            if self.setup_complete:
                if (
                    self.phase != "await_remove"
                    or self.gui_case_open_attempts >= 2
                    or self.inflight is not None
                ):
                    return self._deny("CASE_OPEN_AFTER_SETUP")
                if not self._own_registry() or not self._task_dir_empty():
                    return self._deny("CASE_OPEN_SCOPE")
                if not self._source_unchanged():
                    self._fail("source_identity_changed")
                    return "source_identity_changed"
                self.gui_case_open_attempts += 1
                self.case_open_attempts += 1
                self.inflight = "case_open"
                return None
            if self.inflight is not None or self.phase == "failed":
                return self._deny("CASE_OPEN_PHASE")
            if self.case_open_attempts >= self.MAX_CASE_OPENS:
                return self._deny("CASE_OPEN_LIMIT")
            if self.case_id is None:
                if self.phase != "await_case_open":
                    return self._deny("CASE_OPEN_PHASE")
            elif not self._own_registry() or not self._task_dir_empty():
                return self._deny("CASE_OPEN_SCOPE")
            self.case_open_attempts += 1
            self.inflight = "case_open"
        return None

    def _claim_import(self, query: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("IMPORT_QUERY")
        source = self.ready / SCOPE_SOURCE_NAME
        case_path = str(source / CASE_SOURCE_FILE)
        reference_paths = [
            str(source / file_name)
            for _ref_id, file_name, _material_name, _material_id in REFERENCE_MATERIALS
        ]
        with self.lock:
            attempt_index = self.import_attempts
        if attempt_index == 0:
            if (
                not self._exact_keys(data, {"case_id", "paths", "target", "unzip"})
                or data["case_id"] != self.case_id
                or data["paths"] != [case_path]
                or data["target"] is not None
                or data["unzip"] is not False
            ):
                return self._deny("IMPORT_SCOPE")
        elif attempt_index == 1:
            if (
                not self._exact_keys(
                    data, {"case_id", "paths", "target", "unzip", "mode"}
                )
                or data["case_id"] != self.case_id
                or data["paths"] != reference_paths
                or data["target"] is not None
                or data["unzip"] is not False
                or data["mode"] != "ref"
            ):
                return self._deny("IMPORT_SCOPE")
        else:
            return self._deny("IMPORT_LIMIT")
        with self.lock:
            if self.setup_complete:
                return self._deny("IMPORT_AFTER_SETUP")
            if self.import_attempts >= self.MAX_IMPORTS:
                return self._deny("IMPORT_LIMIT")
            if self.phase not in {"ready", "one_import"} or self.inflight is not None:
                return self._deny("IMPORT_PHASE")
            if not self._own_registry() or not self._task_dir_empty():
                return self._deny("IMPORT_SCOPE")
            if not self._source_unchanged():
                self._fail("source_identity_changed")
                return "source_identity_changed"
            if self.import_attempts == 1:
                try:
                    materials = self._verify_case_only_state()
                except Deny as exc:
                    self._fail(exc.code)
                    return exc.code
                if materials != self.materials_first:
                    self._fail("FIRST_IMPORT_CHANGED")
                    return "FIRST_IMPORT_CHANGED"
            self.import_attempts += 1
            self.inflight = "materials_import"
        return None

    def _claim_remove(self, query: bytes, data: Any, body: bytes) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("REMOVE_QUERY")
        if not self._exact_keys(data, {"case_id", "material_ids"}):
            return self._deny("REMOVE_BODY")
        if data["case_id"] != self.case_id:
            return self._deny("REMOVE_CASE")
        if data["material_ids"] != [TARGET_MATERIAL_ID]:
            return self._deny("REMOVE_TARGET")
        if not body:
            return self._deny("REMOVE_BODY")
        with self.lock:
            if (
                not self.setup_complete
                or self.remove_attempts != 0
                or self.remove_ok != 0
                or self.phase != "await_remove"
                or self.inflight is not None
            ):
                return self._deny("REMOVE_PHASE")
        try:
            self._verify_pre_remove_state()
        except Deny as exc:
            self._fail(exc.code)
            return exc.code
        with self.lock:
            if (
                not self.setup_complete
                or self.remove_attempts != 0
                or self.remove_ok != 0
                or self.phase != "await_remove"
                or self.inflight is not None
            ):
                return self._deny("REMOVE_PHASE")
            self.remove_attempts = 1
            self.inflight = "materials_remove"
        return None

    def _claim_get(
        self,
        path: str,
        query: bytes,
        body: bytes,
        material_query: tuple[str, str | None] | None,
    ) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if body != b"":
            return self._deny("GET_BODY")
        if self.inflight is not None and path != "/health":
            return self._deny("READ_INFLIGHT")
        if path in NO_QUERY_ROUTES:
            if query != b"":
                return self._deny("GET_QUERY")
        elif path == "/api/materials":
            if (
                material_query is None
                or self.case_id is None
                or material_query[0] != self.case_id
            ):
                return self._deny("MATERIALS_LIST_QUERY")
            if not self._own_registry():
                return self._deny("CASE_REGISTRY_OUTSIDE_RUN")
        elif path in CASE_QUERY_ROUTES:
            if self.case_id is None or self._single_query(query, "case_id") != self.case_id:
                return self._deny("CASE_ID_QUERY_REQUIRED")
            if not self._own_registry():
                return self._deny("CASE_REGISTRY_OUTSIDE_RUN")
        elif path == "/api/task/current":
            session_id = self._single_query(query, "session_id")
            if session_id is None:
                return self._deny("SESSION_ID_QUERY_REQUIRED")
            if not self._own_registry():
                return self._deny("CASE_REGISTRY_OUTSIDE_RUN")
        else:
            return self._deny("OUT_OF_SCOPE")
        if path in TASK_EMPTY_ROUTES and not self._task_dir_empty():
            return self._deny("TASK_DIR_NOT_EMPTY")
        with self.lock:
            if path == "/api/materials":
                if self.material_list_attempts >= self.MAX_MATERIAL_LISTS:
                    return self._deny("MATERIALS_LIST_LIMIT")
                self.material_list_attempts += 1
            self.read_counts[path] = self.read_counts.get(path, 0) + 1
        return None

    def _claim_material_list(self, query: bytes, body: bytes) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if body != b"" or self.case_id is None:
            return self._deny("MATERIALS_LIST_QUERY")
        case_id = self._single_query(query, "case_id")
        if case_id != self.case_id:
            return self._deny("MATERIALS_LIST_QUERY")
        with self.lock:
            if (
                self.phase
                not in {"await_material_list", "await_scope_prepare"}
                or self.inflight is not None
            ):
                return self._deny("MATERIALS_LIST_PHASE")
            if self.material_list_attempts >= 2:
                return self._deny("MATERIALS_LIST_LIMIT")
            self.material_list_attempts += 1
            self.inflight = "materials_list"
        return None

    def _claim_scope_prepare(
        self, query: bytes, data: Any, body: bytes
    ) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("SCOPE_PREPARE_QUERY")
        keys = {"action", "case_id", "session_id", "request_id", "material_ids"}
        if (
            not self._exact_keys(data, keys)
            or data["action"] != "prepare"
            or data["case_id"] != self.case_id
            or data["session_id"] != self.SESSION_ID
            or not isinstance(data["request_id"], str)
            or REQUEST_ID.fullmatch(data["request_id"]) is None
            or not isinstance(data["material_ids"], list)
            or data["material_ids"] != [self.scope_in_id]
        ):
            return self._deny("SCOPE_PREPARE_BODY")
        try:
            parsed = uuid.UUID(data["request_id"])
            if parsed.version != 4 or str(parsed) != data["request_id"]:
                return self._deny("SCOPE_PREPARE_UUID")
        except (ValueError, AttributeError):
            return self._deny("SCOPE_PREPARE_UUID")
        with self.lock:
            if (
                self.phase not in {"await_scope_prepare", "await_task_begin"}
                or self.inflight is not None
                or self.begin_attempts != 0
            ):
                return self._deny("SCOPE_PREPARE_PHASE")
            if self.scope_prepare_attempts >= 2:
                return self._deny("SCOPE_PREPARE_LIMIT")
            request_id = data["request_id"]
            if self.request_id is None:
                self.request_id = request_id
            elif self.request_id != request_id:
                return self._deny("SCOPE_PREPARE_NEW_REQUEST")
            try:
                if self.scope_prepare_attempts == 0:
                    if not self._task_dir_empty():
                        raise Deny("task_preclaim_not_empty")
                else:
                    self._prepared_scope_authority()
            except Deny as exc:
                self._fail(exc.code)
                return exc.code
            self.scope_prepare_attempts += 1
            self.inflight = "scope_prepare"
        return None

    def _claim_begin(self, query: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("TASK_BEGIN_QUERY")
        if not self._exact_keys(data, {"session_id", "cwd", "request_id"}):
            return self._deny("TASK_BEGIN_BODY")
        if (
            data["session_id"] != self.SESSION_ID
            or data["cwd"] != str(self.case)
            or self.request_id is None
            or data["request_id"] != self.request_id
        ):
            return self._deny("TASK_BEGIN_IDENTITY")
        with self.lock:
            if (
                self.phase not in {"await_task_begin", "task_running"}
                or self.inflight is not None
                or self.begin_attempts >= 2
            ):
                return self._deny("TASK_BEGIN_PHASE")
            if self.begin_attempts == 0:
                if self.begin_ok != 0 or self.scope_prepare_ok < 1:
                    return self._deny("TASK_BEGIN_PREPARE")
                try:
                    self._prepared_scope_authority()
                except Deny as exc:
                    self._fail(exc.code)
                    return exc.code
                self.begin_ok = 1
            else:
                if (
                    self.task_id is None
                    or self.context_attempts != 0
                    or self.tool_attempts != 0
                ):
                    return self._deny("TASK_BEGIN_AFTER_EXECUTION")
                try:
                    self._task_authority(self.task_id)
                except Deny as exc:
                    self._fail(exc.code)
                    return exc.code
            self.begin_attempts += 1
            self.inflight = "task_begin"
        return None

    def _claim_context(self, query: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("CONTEXT_QUERY")
        if not self._exact_keys(data, {"task_id"}) or data["task_id"] != self.task_id:
            return self._deny("CONTEXT_BODY")
        with self.lock:
            if (
                self.phase not in {"task_running", "await_task_end"}
                or self.inflight is not None
                or self.begin_ok != 1
                or self.context_attempts >= 2
                or self.tool_attempts != 0
            ):
                return self._deny("CONTEXT_PHASE")
            try:
                self._task_authority(data["task_id"])
            except Deny as exc:
                self._fail(exc.code)
                return exc.code
            self.context_attempts += 1
            self.inflight = "context"
        return None

    def _claim_tool(self, query: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("TOOL_QUERY")
        if not self._exact_keys(data, {"task_id", "tool", "args"}):
            return self._deny("TOOL_BODY")
        with self.lock:
            if (
                self.phase != "task_running"
                or self.inflight is not None
                or self.begin_ok != 1
                or self.context_ok < 1
                or self.tool_attempts >= len(self.TOOL_PLAN)
            ):
                return self._deny("TOOL_PHASE")
            if (
                data["task_id"] != self.task_id
                or data["tool"] != self.TOOL_PLAN[self.tool_attempts][0]
                or data["args"] != self.TOOL_PLAN[self.tool_attempts][1]
            ):
                return self._deny("TOOL_NOT_WHITELISTED")
            try:
                self._task_authority(data["task_id"])
            except Deny as exc:
                self._fail(exc.code)
                return exc.code
            self.tool_attempts += 1
            self.inflight = "tool"
        return None

    def _claim_end(self, query: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("TASK_END_QUERY")
        keys = {"task_id", "reason", "model_calls", "tool_calls", "elapsed_s"}
        if not self._exact_keys(data, keys):
            return self._deny("TASK_END_BODY")
        if (
            data["task_id"] != self.task_id
            or data["reason"] != "aborted"
            or not self._is_int(data["model_calls"], 0, 0)
            or data["tool_calls"] != 4
            or not self._is_int(data["elapsed_s"], 0, 120)
        ):
            return self._deny("TASK_END_VALUES")
        with self.lock:
            if (
                self.phase != "await_task_end"
                or self.inflight is not None
                or self.end_attempts != 0
                or self.context_ok < 1
                or self.tool_ok != len(self.TOOL_PLAN)
            ):
                return self._deny("TASK_END_PHASE")
            try:
                self._task_authority(data["task_id"])
            except Deny as exc:
                self._fail(exc.code)
                return exc.code
            self.end_attempts = 1
            self.end_elapsed = data["elapsed_s"]
            self.inflight = "task_end"
        return None

    def _checked_file(self, path: pathlib.Path) -> Any:
        _no_reparse(path)
        info = os.lstat(path)
        if (
            not stat.S_ISREG(info.st_mode)
            or _link(path)
            or getattr(info, "st_nlink", 0) != 1
            or getattr(info, "st_file_attributes", 0) & self.SPARSE
            or info.st_size > self.FILE_LIMIT
        ):
            raise Deny("task_file_not_plain_small")
        return _read_json(path)

    def _policy(
        self,
        method: str,
        path: str,
        data: Any,
        query: bytes,
        body: bytes,
        material_query: tuple[str, str | None] | None,
    ) -> str | None:
        with self.lock:
            if method == "GET":
                return self._claim_get(path, query, body, material_query)
            if path == "/api/case/open":
                return self._claim_case(query, body, data)
            if path == "/api/materials/import":
                return self._claim_import(query, data)
            if path == "/api/materials/remove":
                return self._claim_remove(query, data, body)
            return self._deny("OUT_OF_SCOPE")

    def _complete_health(self, status: int | None, response: Any) -> None:
        if not (
            status == 200
            and isinstance(response, dict)
            and response == {"status": "ok", "contract_version": "1.6"}
        ):
            raise Deny("HEALTH_RESPONSE")

    def _complete_case(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        expected_created = self.case_open_ok == 0
        if not (
            status == 200
            and isinstance(response, dict)
            and set(response) == {"ok", "value"}
            and response.get("ok") is True
            and isinstance(value, dict)
            and set(value) == {
                "case_id",
                "name",
                "created",
                "folders_created",
                "kind",
            }
            and isinstance(value.get("case_id"), str)
            and CASE_ID.fullmatch(value["case_id"]) is not None
            and value.get("name") == self.case.name
            and value.get("created") is expected_created
            and value.get("folders_created") == []
            and value.get("kind") is None
        ):
            raise Deny("CASE_OPEN_RESPONSE")
        if self.case_id is not None and self.case_id != value["case_id"]:
            raise Deny("CASE_OPEN_BINDING_CHANGED")
        self.case_id = value["case_id"]
        if not self._own_registry():
            raise Deny("CASE_REGISTRY_IDENTITY")
        if not self._task_dir_empty() or not self._source_unchanged():
            raise Deny("CASE_OPEN_SCOPE_CHANGED")
        self.case_open_ok += 1
        if self.setup_complete:
            self.gui_case_open_ok += 1
        if self.phase == "await_case_open":
            self.phase = "ready"

    def _complete_import(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        scan = value.get("scan") if isinstance(value, dict) else None
        registered = value.get("registered") if isinstance(value, dict) else None
        if self.import_attempts == 1:
            source = str(self.source_root / CASE_SOURCE_FILE)
            if not (
                status == 200
                and isinstance(response, dict)
                and set(response) == {"ok", "value"}
                and response.get("ok") is True
                and isinstance(value, dict)
                and set(value) == {"copied", "skipped", "scan"}
                and value.get("copied")
                == [{"from": source, "to": CASE_SOURCE_FILE}]
                and value.get("skipped") == []
                and scan
                == {
                    "added": 1,
                    "changed": 0,
                    "removed": 0,
                    "failed": 0,
                    "review_needed": True,
                }
            ):
                raise Deny("CASE_COPY_IMPORT_RESPONSE")
            materials = self._verify_case_only_state()
            self.materials_first = materials
            self.phase = "one_import"
        else:
            expected_registered = [
                {
                    "path": str(self.source_root / file_name),
                    "ref_id": ref_id,
                    "kind": "file",
                }
                for ref_id, file_name, _material_name, _material_id in REFERENCE_MATERIALS
            ]
            if not (
                status == 200
                and isinstance(response, dict)
                and set(response) == {"ok", "value"}
                and response.get("ok") is True
                and isinstance(value, dict)
                and set(value) == {"copied", "skipped", "scan", "registered"}
                and value.get("copied") == []
                and value.get("skipped") == []
                and scan
                == {
                    "added": len(REFERENCE_MATERIALS),
                    "changed": 0,
                    "removed": 0,
                    "failed": 0,
                    "review_needed": True,
                }
                and isinstance(registered, list)
                and len(registered) == len(expected_registered)
                and all(
                    isinstance(item, dict)
                    and set(item) == {"path", "ref_id", "kind"}
                    and isinstance(item.get("path"), str)
                    and _norm(item["path"]) == _norm(expected["path"])
                    and item.get("ref_id") == expected["ref_id"]
                    and item.get("kind") == expected["kind"]
                    for item, expected in zip(registered, expected_registered)
                )
            ):
                raise Deny("REFERENCE_IMPORT_RESPONSE")
            materials = self._verify_import_state()
            self.materials_after = materials
            self.phase = "done"
        self.import_ok += 1

    def _complete_remove(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        expected_value = {
            "removed": [TARGET_MATERIAL_ID],
            "already_removed": [],
            "failed": [],
            "wiki_needs_update": False,
        }
        if not (
            status == 200
            and isinstance(response, dict)
            and set(response) == {"ok", "value"}
            and response.get("ok") is True
            and value == expected_value
        ):
            raise Deny("MATERIALS_REMOVE_RESPONSE")
        with self.lock:
            if self.remove_attempts != 1 or self.remove_ok != 0:
                raise Deny("MATERIALS_REMOVE_REPLAY")
        post = self._verify_post_remove_state()
        with self.lock:
            self.remove_ok = 1
            self.post_remove_baseline = copy.deepcopy(
                {
                    **post,
                    "response": response,
                }
            )
            self.phase = "await_materials_after_remove"

    def _complete_get(
        self,
        path: str,
        status: int | None,
        response: Any,
        include_removed: str | None,
    ) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and set(response) == {"ok", "value"}
            and response.get("ok") is True
            and isinstance(value, dict)
        ):
            raise Deny("READ_RESPONSE")
        if path == "/api/case/recent":
            cases = value.get("cases")
            expected = self.case_id is not None
            if (
                not isinstance(cases, list)
                or len(cases) != (1 if expected else 0)
                or (
                    expected
                    and (
                        not isinstance(cases[0], dict)
                        or cases[0].get("case_id") != self.case_id
                        or not isinstance(cases[0].get("root"), str)
                        or _norm(cases[0]["root"]) != _norm(self.case)
                        or cases[0].get("kind") is not None
                    )
                )
            ):
                raise Deny("CASE_RECENT_RESPONSE")
        elif path == "/api/settings":
            if (
                value.get("servers") != SERVERS
                or value.get("external_llm") != EXTERNAL_OFF
            ):
                raise Deny("SETTINGS_RESPONSE")
        elif path == "/api/capsules":
            if not (
                set(value) == {"v", "hint", "shared", "groups"}
                and value.get("v") == 1
                and isinstance(value.get("hint"), str)
                and isinstance(value.get("shared"), list)
                and isinstance(value.get("groups"), list)
            ):
                raise Deny("CAPSULES_RESPONSE")
        elif path == "/api/materials":
            rows = value.get("materials")
            if not self.setup_complete:
                raise Deny("MATERIALS_LIST_BEFORE_SETUP")
            key = self._material_list_key(include_removed)
            if self.phase == "await_remove":
                checked_rows = self._validate_public_materials(
                    rows,
                    before_remove=True,
                    include_removed=include_removed,
                )
                with self.lock:
                    self.pre_remove_list_results[key] = checked_rows
                    self.pre_remove_list_ok += 1
            elif self.phase in {"await_materials_after_remove", "done"}:
                checked_rows = self._validate_public_materials(
                    rows,
                    before_remove=False,
                    include_removed=include_removed,
                )
                with self.lock:
                    self.post_remove_list_results[key] = checked_rows
                    if include_removed is None:
                        self.post_remove_list = checked_rows
                    self.post_remove_list_ok += 1
                    if self.phase == "await_materials_after_remove":
                        self.phase = "done"
            else:
                raise Deny("MATERIALS_LIST_PHASE")
        elif path == "/api/task/current":
            if set(value) != {"selection"} or value.get("selection") is not None:
                raise Deny("TASK_CURRENT_RESPONSE")
        elif path == "/api/tasks":
            if set(value) != {"tasks"} or value.get("tasks") != []:
                raise Deny("TASKS_RESPONSE")
        elif path == "/api/outputs":
            if set(value) != {"v", "outputs"} or value != {"v": 1, "outputs": []}:
                raise Deny("OUTPUTS_RESPONSE")
        elif path == "/api/ocr/jobs":
            if set(value) != {"jobs"} or value.get("jobs") != []:
                raise Deny("OCR_JOBS_RESPONSE")
        elif path == "/api/wiki/suggestions":
            if set(value) != {"suggestions"} or value.get("suggestions") != []:
                raise Deny("WIKI_SUGGESTIONS_RESPONSE")
        elif path == "/api/wiki/review":
            if value != {
                "exists": False,
                "reviewed": False,
                "reviewed_at": None,
                "changes": None,
            }:
                raise Deny("WIKI_REVIEW_RESPONSE")
        else:
            raise Deny("OUT_OF_SCOPE_RESPONSE")
        self.read_ok[path] = self.read_ok.get(path, 0) + 1

    def _complete_material_list(
        self, status: int | None, response: Any
    ) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        rows = value.get("materials") if isinstance(value, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and isinstance(rows, list)
            and len(rows) == len(SCOPE_SOURCE_FILES)
        ):
            raise Deny("MATERIALS_LIST_RESPONSE")
        by_name = {row.get("name"): row for row in rows if isinstance(row, dict)}
        if (
            len(by_name) != len(rows)
            or set(by_name) != set(self.expected_materials)
            or len({row.get("material_id") for row in rows}) != len(rows)
        ):
            raise Deny("MATERIALS_LIST_IDENTITY")
        for name, row in by_name.items():
            index_item = self.index_by_name[name]
            if (
                row.get("material_id") != index_item["material_id"]
                or row.get("type") != "txt"
                or row.get("status") != "parsed"
            ):
                raise Deny("MATERIALS_LIST_NATIVE_IDENTITY")
        if self.list_by_name and {
            name: row["material_id"] for name, row in self.list_by_name.items()
        } != {name: row["material_id"] for name, row in by_name.items()}:
            raise Deny("MATERIALS_LIST_REPLAY")
        self.list_by_name = by_name
        self.scope_in_id = by_name["scope-in"]["material_id"]
        self.scope_in_sha = self.index_by_name["scope-in"]["sha256"]
        self.material_list_ok += 1
        self.phase = "await_scope_prepare"

    def _complete_scope_prepare(
        self, status: int | None, response: Any
    ) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and isinstance(value, dict)
            and value == {
                "action": "prepare",
                "request_id": self.request_id,
                "case_id": self.case_id,
                "session_id": self.SESSION_ID,
                "material_ids": [self.scope_in_id],
            }
        ):
            raise Deny("SCOPE_PREPARE_RESPONSE")
        self._prepared_scope_authority()
        self.scope_prepare_ok += 1
        self.phase = "await_task_begin"

    def _complete_begin(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        expected_keys = {
            "task_id",
            "case_id",
            "skill",
            "params",
            "budget",
            "route",
            "request_id",
            "request_scope",
        }
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and isinstance(value, dict)
            and set(value) == expected_keys
            and isinstance(value.get("task_id"), str)
            and self.TASK_ID.fullmatch(value["task_id"]) is not None
            and value.get("case_id") == self.case_id
            and value.get("skill") is None
            and isinstance(value.get("params"), dict)
            and isinstance(value.get("budget"), dict)
            and value.get("route") == "local"
            and value.get("request_id") == self.request_id
            and value.get("request_scope") == self._expected_scope()
        ):
            raise Deny("TASK_BEGIN_RESPONSE")
        task_id = value["task_id"]
        if self.task_id is not None and self.task_id != task_id:
            raise Deny("TASK_BEGIN_REPLAY_ID")
        self.task_id = task_id
        self._task_authority(task_id)
        self.phase = "task_running"

    def _complete_context(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and isinstance(value, dict)
            and isinstance(value.get("l0"), dict)
            and isinstance(value.get("l1"), dict)
        ):
            raise Deny("CONTEXT_RESPONSE")
        self._task_authority(self.task_id)
        self.context_ok += 1

    def _complete_tool(self, status: int | None, response: Any) -> None:
        ordinal = self.tool_attempts - 1
        tool_name = self.TOOL_PLAN[ordinal][0]
        value = response.get("value") if isinstance(response, dict) else None
        positive = False
        expected_denial = False
        if ordinal == 0:
            rows = value.get("materials") if isinstance(value, dict) else None
            positive = bool(
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and value.get("total") == 1
                and isinstance(rows, list)
                and len(rows) == 1
                and rows[0].get("material_id") == self.scope_in_id
                and rows[0].get("name") == "scope-in"
            )
            if not positive:
                raise Deny("TOOL_LIST_RESPONSE")
        elif ordinal == 1:
            positive = bool(
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and isinstance(value, dict)
                and value.get("material_id") == self.scope_in_id
                and isinstance(value.get("text"), str)
                and "T31_SHARED" in value["text"]
                and "内部唯一正文" in value["text"]
            )
            if not positive:
                raise Deny("TOOL_READ_RESPONSE")
        elif ordinal == 2:
            hits = value.get("hits") if isinstance(value, dict) else None
            positive = bool(
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and isinstance(hits, list)
                and len(hits) >= 1
                and all(hit.get("material_id") == self.scope_in_id for hit in hits)
                and value.get("total") == len(hits)
            )
            if not positive:
                raise Deny("TOOL_SEARCH_SCOPE_RESPONSE")
        else:
            error = response.get("error") if isinstance(response, dict) else None
            expected_denial = bool(
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is False
                and isinstance(error, dict)
                and error.get("code") == "MATERIAL_NOT_FOUND"
            )
            if not expected_denial:
                raise Deny("TOOL_EXPECTED_NATIVE_DENIAL_MISSING")
            self.scope_out_native_denial = True
        self.tool_ok += 1
        self.tool_results.append(
            {
                "ordinal": ordinal + 1,
                "tool": tool_name,
                "http_status": status,
                "business_ok": (
                    response.get("ok") if isinstance(response, dict) else None
                ),
                "native_error_code": (
                    response["error"].get("code")
                    if isinstance(response, dict)
                    and isinstance(response.get("error"), dict)
                    else None
                ),
                "positive_native": positive,
                "expected_native_denial": expected_denial,
            }
        )
        self._task_authority(self.task_id)
        if self.tool_ok == len(self.TOOL_PLAN):
            self.phase = "await_task_end"

    def _complete_end(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and value == {"status": "cancelled"}
        ):
            raise Deny("TASK_END_RESPONSE")
        self.task_status = "cancelled"
        self._task_authority(self.task_id, final=True)
        self.end_ok = True
        self.phase = "done"

    def _complete(
        self,
        path: str,
        status: int | None,
        body: bytes,
        overflow: bool,
        include_removed: str | None,
    ) -> None:
        if overflow:
            self._fail("NATIVE_RESPONSE_TOO_LARGE")
            return
        response = _json(body)
        try:
            if path == "/health":
                self._complete_health(status, response)
            elif path == "/api/case/open":
                self._complete_case(status, response)
            elif path == "/api/materials/import":
                self._complete_import(status, response)
            elif path == "/api/materials/remove":
                self._complete_remove(status, response)
            elif path in {
                "/api/case/recent",
                "/api/settings",
                "/api/capsules",
                "/api/materials",
                "/api/task/current",
                "/api/tasks",
                "/api/outputs",
                "/api/ocr/jobs",
                "/api/wiki/suggestions",
                "/api/wiki/review",
            }:
                self._complete_get(path, status, response, include_removed)
            else:
                raise Deny("OUT_OF_SCOPE_RESPONSE")
        except (Deny, OSError, ValueError, TypeError, KeyError, AttributeError) as exc:
            failure_code = getattr(exc, "code", type(exc).__name__)
            details = None
            if failure_code == "required_path_missing":
                try:
                    details = self._required_path_diagnostic(exc)
                except Exception:
                    details = None
            self._fail(failure_code)
            if details is not None:
                with self.lock:
                    if (
                        self.failure_code == failure_code
                        and self.protocol_failure_details is None
                    ):
                        self.protocol_failure_details = details
        finally:
            operation = {
                "/api/case/open": "case_open",
                "/api/materials/import": "materials_import",
                "/api/materials/remove": "materials_remove",
            }.get(path)
            with self.lock:
                if operation is not None and self.inflight == operation:
                    self.inflight = None

    def evidence(self) -> dict[str, Any]:
        with self.lock:
            try:
                source_after = self._source_snapshot()
                source_unchanged = source_after == self.source_identity_before
            except (Deny, OSError, ValueError, TypeError):
                source_after = None
                source_unchanged = False
            task_empty = self._task_dir_empty()
            registry_owned = self._own_registry()
            pre_remove_list_buckets_valid = bool(
                set(self.pre_remove_list_results)
                <= {"default", "false", "true"}
                and all(
                    isinstance(rows, list)
                    and len(rows) == len(SCOPE_SOURCE_FILES)
                    for rows in self.pre_remove_list_results.values()
                )
            )
            post_remove_list_buckets_valid = bool(
                set(self.post_remove_list_results)
                <= {"default", "false", "true"}
                and all(
                    isinstance(rows, list)
                    and len(rows)
                    == (
                        len(SCOPE_SOURCE_FILES)
                        if key == "true"
                        else len(SCOPE_SOURCE_FILES) - 1
                    )
                    for key, rows in self.post_remove_list_results.items()
                )
            )
            gui_optin_tombstone_verified = bool(
                post_remove_list_buckets_valid
                and isinstance(
                    self.post_remove_list_results.get("true"), list
                )
                and len(self.post_remove_list_results["true"])
                == len(SCOPE_SOURCE_FILES)
            )
            all_list_variants_verified = bool(
                pre_remove_list_buckets_valid
                and post_remove_list_buckets_valid
                and set(self.pre_remove_list_results)
                == {"default", "false", "true"}
                and set(self.post_remove_list_results)
                == {"default", "false", "true"}
            )
            mixed_materials_verified = bool(
                self.materials_first is not None
                and tuple(
                    item.get("material_id") for item in self.materials_first
                )
                == (CASE_MATERIAL_ID,)
                and self.materials_first[0].get("origin") == "case"
                and self.materials_after is not None
                and tuple(
                    item.get("material_id") for item in self.materials_after
                )
                == EXPECTED_MATERIAL_IDS
                and tuple(
                    item.get("origin") for item in self.materials_after
                )
                == ("case", "ref", "ref")
            )
            protocol_complete = bool(
                self.phase == "done"
                and self.setup_complete
                and self.import_attempts == self.MAX_IMPORTS
                and self.import_ok == self.MAX_IMPORTS
                and self.case_id is not None
                and self.case_open_ok == 1 + self.gui_case_open_ok
                and self.gui_case_open_ok <= 2
                and mixed_materials_verified
                and self.remove_attempts == 1
                and self.remove_ok == 1
                and self.pre_remove_baseline is not None
                and self.post_remove_baseline is not None
                and self.post_remove_baseline.get("remaining_ids")
                == list(REMAINING_MATERIAL_IDS)
                and pre_remove_list_buckets_valid
                and post_remove_list_buckets_valid
                and self.post_remove_list_ok >= 1
                and bool(self.post_remove_list_results)
                and self.native_refs_verified
                and self.native_index_verified
                and self.case_original_copy_verified
                and source_unchanged
                and task_empty
                and registry_owned
                and self.failure_code is None
            )
            return {
                "phase": self.phase,
                "protocol_complete": protocol_complete,
                "all_list_variants_verified": all_list_variants_verified,
                "gui_optin_tombstone_verified": gui_optin_tombstone_verified,
                "failure_code": self.failure_code,
                "auth_denials": self.auth_denials,
                "policy_denials": dict(sorted(self.policy_denials.items())),
                "case_bound": self.case_id is not None,
                "case_id": self.case_id,
                "case_open_attempts": self.case_open_attempts,
                "case_open_ok": self.case_open_ok,
                "gui_case_open_attempts": self.gui_case_open_attempts,
                "gui_case_open_ok": self.gui_case_open_ok,
                "import_attempts": self.import_attempts,
                "import_ok": self.import_ok,
                "setup_complete": self.setup_complete,
                "remove_attempts": self.remove_attempts,
                "remove_ok": self.remove_ok,
                "target_material_id": TARGET_MATERIAL_ID,
                "pre_remove_list_ok": self.pre_remove_list_ok,
                "post_remove_list_ok": self.post_remove_list_ok,
                "pre_remove_list_default_ok": int(
                    "default" in self.pre_remove_list_results
                ),
                "pre_remove_list_false_ok": int(
                    "false" in self.pre_remove_list_results
                ),
                "pre_remove_list_true_ok": int(
                    "true" in self.pre_remove_list_results
                ),
                "post_remove_list_default_ok": int(
                    "default" in self.post_remove_list_results
                ),
                "post_remove_list_false_ok": int(
                    "false" in self.post_remove_list_results
                ),
                "post_remove_list_true_ok": int(
                    "true" in self.post_remove_list_results
                ),
                "read_counts": dict(sorted(self.read_counts.items())),
                "read_ok": dict(sorted(self.read_ok.items())),
                "target_ref_id": self.TARGET_REF_ID,
                "ref_ids": [item[0] for item in REFERENCE_MATERIALS],
                "native_refs_verified": self.native_refs_verified,
                "native_index_verified": self.native_index_verified,
                "case_original_copy_verified": self.case_original_copy_verified,
                "case_original_rel_path": CASE_SOURCE_FILE,
                "task_dir_empty": task_empty,
                "case_registry_owned": registry_owned,
                "source_identity_before": self.source_identity_before,
                "source_identity_after": source_after,
                "source_unchanged": source_unchanged,
                "materials_first": self.materials_first,
                "materials_after": self.materials_after,
                "mixed_materials_verified": mixed_materials_verified,
                "pre_remove": self.pre_remove_baseline,
                "post_remove": self.post_remove_baseline,
                "post_remove_list": self.post_remove_list,
                "post_remove_list_default": self.post_remove_list_results.get(
                    "default"
                ),
                "post_remove_list_false": self.post_remove_list_results.get(
                    "false"
                ),
                "post_remove_list_true": self.post_remove_list_results.get(
                    "true"
                ),
                "material_count": (
                    len(self.post_remove_baseline["remaining_ids"])
                    if isinstance(self.post_remove_baseline, dict)
                    else len(self.materials_after or [])
                ),
            }

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return
        method, path, started = scope["method"], scope["path"], time.monotonic()
        if not self._authorized(scope):
            with self.lock:
                self.auth_denials += 1
            recorded = path if (method, path) in ROUTES else "<denied-route>"
            self._record(method, recorded, 401, "auth_denied", started)
            await _guard_reply(send, 401, "UNAUTHORIZED")
            return
        if (method, path) not in ROUTES:
            self._record(method, "<denied-route>", 403, "route_denied", started)
            await _guard_reply(send, 403, "OUT_OF_SCOPE")
            return
        original = receive
        try:
            body = await _read_body(receive)
        except Deny:
            self._record(method, path, 413, "body_denied", started)
            await _guard_reply(send, 413, "REQUEST_TOO_LARGE")
            return
        if body is None:
            self._record(method, path, None, "disconnected_before_body", started)
            return
        data = None if method == "GET" else _json(body)
        query = scope.get("query_string", b"")
        material_query = (
            self._material_list_query(query)
            if method == "GET" and path == "/api/materials"
            else None
        )
        used = False

        async def replay():
            nonlocal used
            if not used:
                used = True
                return {"type": "http.request", "body": body, "more_body": False}
            return await original()

        receive = replay
        denial = self._policy(
            method,
            path,
            data,
            query,
            body,
            material_query,
        )
        if denial:
            self._record(method, path, 403, denial, started)
            await _guard_reply(send, 403, denial)
            return
        status, captured, overflow = None, bytearray(), False

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
        include_removed = (
            material_query[1] if material_query is not None else None
        )
        self._complete(
            path,
            status,
            bytes(captured),
            overflow,
            include_removed,
        )

    def snapshot(self) -> list[dict[str, Any]]:
        with self.lock:
            return list(self.records)

    def setup_snapshot(self) -> list[dict[str, Any]]:
        with self.lock:
            return list(self.setup_records)


async def _started(server: uvicorn.Server, task: asyncio.Task) -> None:
    deadline = asyncio.get_running_loop().time() + 20
    while not server.started:
        if task.done():
            await task
            raise Deny("server_exited_before_ready")
        if asyncio.get_running_loop().time() > deadline:
            raise Deny("start_timeout")
        await asyncio.sleep(0.02)


def _listener(server: uvicorn.Server) -> socket.socket:
    sockets = [
        sock
        for item in server.servers
        for sock in item.sockets
        if sock.fileno() >= 0
    ]
    if len(sockets) != 1:
        raise Deny("listener_count")
    sock = sockets[0]
    if sock.family != socket.AF_INET or sock.getsockname()[0] != "127.0.0.1":
        raise Deny("listener_not_ipv4_loopback")
    return sock


def _closed(server: uvicorn.Server | None) -> bool:
    if server is None:
        return True
    return all(
        sock.fileno() < 0 for item in server.servers for sock in item.sockets
    )


async def _seed_native_asgi(
    firewall: Firewall,
    lb: Any,
    case: pathlib.Path,
    ready: pathlib.Path,
    host_token: str,
) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {host_token}"}
    source = ready / SCOPE_SOURCE_NAME
    transport = httpx.ASGITransport(app=firewall)
    async with httpx.AsyncClient(
        transport=transport,
        base_url="http://asgi-setup.invalid",
        timeout=60,
    ) as client:
        async def post(path: str, body: dict[str, Any]) -> dict[str, Any]:
            response = await client.post(path, json=body, headers=headers)
            if response.status_code != 200:
                raise Deny(f"setup_http_{path.replace('/', '_')}")
            value = response.json()
            if not (
                isinstance(value, dict)
                and set(value) == {"ok", "value"}
                and value.get("ok") is True
                and isinstance(value.get("value"), dict)
            ):
                raise Deny(f"setup_envelope_{path.replace('/', '_')}")
            return value["value"]

        opened = await post("/api/case/open", {"path": str(case)})
        case_id = opened.get("case_id")
        if (
            not isinstance(case_id, str)
            or CASE_ID.fullmatch(case_id) is None
            or opened.get("created") is not True
        ):
            raise Deny("setup_case_identity")
        case_import = {
            "case_id": case_id,
            "paths": [str(source / CASE_SOURCE_FILE)],
            "target": None,
            "unzip": False,
        }
        reference_import = {
            "case_id": case_id,
            "paths": [
                str(source / file_name)
                for _ref_id, file_name, _material_name, _material_id
                in REFERENCE_MATERIALS
            ],
            "target": None,
            "unzip": False,
            "mode": "ref",
        }
        first = await post("/api/materials/import", case_import)
        second = await post("/api/materials/import", reference_import)
        if (
            first.get("scan")
            != {
                "added": 1,
                "changed": 0,
                "removed": 0,
                "failed": 0,
                "review_needed": True,
            }
            or second.get("scan")
            != {
                "added": 2,
                "changed": 0,
                "removed": 0,
                "failed": 0,
                "review_needed": True,
            }
        ):
            raise Deny("setup_import_scan")
    public = lb.materials.list(case_id)
    firewall.finish_setup(public)
    baseline = firewall.pre_remove_baseline
    if not isinstance(baseline, dict):
        raise Deny("setup_baseline_missing")
    return copy.deepcopy(
        {
            "case_id": case_id,
            "case_material_id": CASE_MATERIAL_ID,
            "reference_material_ids": list(REFERENCE_MATERIAL_IDS),
            "target_ref_id": firewall.TARGET_REF_ID,
            "ref_ids": [item[0] for item in REFERENCE_MATERIALS],
            "material_ids": [
                item["material_id"] for item in baseline["materials"]
            ],
            "target_material_id": TARGET_MATERIAL_ID,
            "case_original_rel_path": CASE_SOURCE_FILE,
            "public_materials": baseline["public_materials"],
            "index": baseline["index"],
            "refs": baseline["refs"],
            "case_copy": baseline["case_copy"],
            "requests": firewall.setup_snapshot(),
        }
    )


async def _serve(
    root: pathlib.Path,
    layout: dict[str, pathlib.Path],
    source_before: dict[str, Any],
    scope_source_manifest: dict[str, Any],
    prepared_sha256: str,
    seconds: int,
    host_port: int,
    host_token: str,
) -> tuple[str, str]:
    guard, started_at = Guard(), datetime.now().astimezone()
    local_count = {"local": 0, "external": 0, "keyring": 0}
    cred_lock = threading.Lock()
    restore = logs = lb = server = task = firewall = None
    net_closed = logs_closed = False
    setup_summary = None
    failure, port = None, None
    ready_path = root / "ready.json"
    final_path = root / "final-metadata.json"

    def local_key():
        with cred_lock:
            local_count["local"] += 1
        return FAKE_LOCAL_KEY

    def external_key():
        with cred_lock:
            local_count["external"] += 1
        return FAKE_EXTERNAL_KEY

    try:
        _scrub_env(layout)
        _install_keyring(local_count, guard, cred_lock)
        platform.uname = lambda: platform.uname_result(
            "Windows", "T31-SYNTHETIC", "", "", ""
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
        firewall = Firewall(
            native,
            case=layout["case"],
            ready=layout["ready"],
            paste=layout["paste"],
            appdata=layout["appdata"],
            ledger=root / "requests.ndjson",
            host_token=host_token,
        )
        guard.phase = "setup_asgi"
        setup_summary = await _seed_native_asgi(
            firewall,
            lb,
            layout["case"],
            layout["ready"],
            host_token,
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
            ready_path,
            {
                "status": "ready",
                "host": "127.0.0.1",
                "port": port,
                "token": host_token,
                "requested_seconds": seconds,
                "pid": os.getpid(),
                "started_at": datetime.now()
                .astimezone()
                .isoformat(timespec="milliseconds"),
                "contract_version": contract_version,
                "fixture_path": str(layout["ready"] / FIXTURE.name),
                "fixture_bytes": FIXTURE_BYTES,
                "fixture_sha256": FIXTURE_SHA256,
                "scope_source": {
                    "path": scope_source_manifest["path"],
                    "file_count": len(scope_source_manifest["files"]),
                    "files": [
                        {
                            "bytes": item["bytes"],
                            "sha256": item["sha256"],
                        }
                        for item in scope_source_manifest["files"]
                    ],
                },
                "case_path": str(layout["case"]),
                "appdata": str(layout["appdata"]),
                "ready_input": str(layout["ready"]),
                "expected_head": EXPECTED_HEAD,
                "prepared_sha256": prepared_sha256,
                "source_sha256": source_before,
                "setup": setup_summary,
                "setup_request_log": str(root / "setup-requests.ndjson"),
                "gui_request_log": str(root / "requests.ndjson"),
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

    guard_state = guard.snapshot()
    requests = firewall.snapshot() if firewall else []
    firewall_state = firewall.evidence() if firewall else {}
    with cred_lock:
        credential_state = {
            "local_getter_calls": local_count["local"],
            "external_getter_calls": local_count["external"],
            "keyring_rejections": local_count["keyring"],
        }
    source_after: dict[str, Any] = {}
    source_unchanged = False
    try:
        source_after = _sources()
        _reviewed_sources(source_after)
        source_unchanged = source_before == source_after
    except (Deny, OSError, ValueError, TypeError) as exc:
        failure = failure or getattr(exc, "code", type(exc).__name__)
    fixture_unchanged = False
    fixture_copy_identity = None
    fixture_copy_unchanged = False
    try:
        fixture_unchanged = (
            FIXTURE.is_file()
            and not _link(FIXTURE)
            and FIXTURE.stat().st_size == FIXTURE_BYTES
            and _sha256(FIXTURE) == FIXTURE_SHA256
        )
        fixture_copy_identity = _file_identity(layout["ready"] / FIXTURE.name)
        fixture_copy_unchanged = (
            fixture_copy_identity["path"]
            == str(layout["ready"] / FIXTURE.name)
            and fixture_copy_identity["canonical"]
            == _norm(layout["ready"] / FIXTURE.name)
            and fixture_copy_identity["bytes"] == FIXTURE_BYTES
            and fixture_copy_identity["sha256"] == FIXTURE_SHA256
        )
    except (Deny, OSError, ValueError) as exc:
        failure = failure or getattr(exc, "code", type(exc).__name__)
    scope_source_after = None
    scope_source_unchanged = False
    try:
        verified_scope_source = _verify_scope_source(
            layout["ready"], scope_source_manifest
        )
        scope_source_after = {
            "file_count": len(verified_scope_source["files"]),
            "files": [
                {
                    "bytes": item["bytes"],
                    "sha256": item["sha256"],
                }
                for item in verified_scope_source["files"]
            ],
        }
        scope_source_unchanged = True
        settings_identity = _file_identity(layout["settings"])
        marker_identity = _file_identity(layout["daily_marker"])
        marker_unchanged = _read_json(layout["daily_marker"]) == {
            "root": str(layout["case"])
        }
    except (Deny, OSError, ValueError) as exc:
        settings_identity = None
        marker_identity = None
        marker_unchanged = False
        failure = failure or getattr(exc, "code", type(exc).__name__)
    if firewall_state.get("failure_code") and failure is None:
        failure = f"protocol:{firewall_state['failure_code']}"
    if not firewall_state.get("protocol_complete") and failure is None:
        failure = "protocol_incomplete"
    task_done = bool(task is not None and task.done())
    listener_closed = _closed(server)
    if (
        guard_state["violations"]
        or any(credential_state.values())
        or not source_unchanged
        or not fixture_unchanged
        or not fixture_copy_unchanged
        or not scope_source_unchanged
        or not marker_unchanged
    ) and failure is None:
        failure = "guard_credential_source_fixture_scope_or_marker_violation"
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
            "Finite mixed-materials backend/guard slice plus separately run "
            "root GUI; not the whole T37, packaging, or production acceptance."
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
        "fixture_source_unchanged": fixture_unchanged,
        "fixture_copy": fixture_copy_identity,
        "fixture_copy_unchanged": fixture_copy_unchanged,
        "scope_source_unchanged": scope_source_unchanged,
        "scope_source_after": scope_source_after,
        "settings_after": settings_identity,
        "daily_marker_after": marker_identity,
        "source_unchanged": source_unchanged,
        "source_pins_sha256": SOURCE_PINS_SHA256,
        "source_before": source_before,
        "source_after": source_after,
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
        "setup": setup_summary,
        "setup_requests": (
            firewall.setup_snapshot() if firewall is not None else []
        ),
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
        "setup_request_log": str(root / "setup-requests.ndjson"),
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
    for name in RUNTIME_ARTIFACTS:
        if os.path.lexists(root / name):
            raise Deny(f"runtime_artifact_exists:{name}")
    host_port, host_token = _host_values(root, layout)
    started_path = root / "started.json"
    _write_json(
        started_path,
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
                source,
                manifest["scope_source"],
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
        description="T37 mixed legacy-copy/reference native HTTP entry"
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--prepare", action="store_true")
    mode.add_argument("--serve", action="store_true")
    parser.add_argument(
        "--root",
        required=True,
        help="new T33-host-YYYYMMDD-HHMMSS direct child of this preparation's runs",
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
