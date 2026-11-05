#!/usr/bin/env python3
"""T31 finite native HTTP material-scope entry, prepared only and not run here.

The prepare phase creates a fresh private root without importing lawbench.  The
serve phase reuses that root, current-B contracts/skills and the current-B
``lawbench.app.create_app`` behind one IPv4 loopback listener.  Product
lifespan remains off; native auth, routes, Gate, Materials and Registry remain
in use.  This is an ASGI wrapper; later consumers make actual TCP loopback HTTP
requests after the preparation is separately reviewed.
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
PREPARED_FORMAT = "T31-scope-http-entry-prepared-v1"
REQUEST_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
CASE_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)
MATERIAL_ID = re.compile(r"^M[0-9]{4}$")
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
        ("GET", "/api/materials"),
        ("POST", "/api/case/open"),
        ("POST", "/api/materials/import"),
        ("POST", "/api/request/scope"),
        ("POST", "/core/task/begin"),
        ("POST", "/core/context"),
        ("POST", "/core/tool"),
        ("POST", "/core/task/end"),
    }
)
RUNTIME_ARTIFACTS = (
    "started.json",
    "ready.json",
    "final-metadata.json",
    "loop-closed.json",
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
        self.host_token = ("Bearer " + host_token).encode("utf-8")
        self.lock = threading.RLock()
        self.records: list[dict[str, Any]] = []
        self.phase = "await_case_open"
        self.failure_code: str | None = None
        self.inflight: str | None = None
        self.case_id: str | None = None
        self.case_attempts = 0
        self.import_attempts = 0
        self.material_list_attempts = 0
        self.material_list_ok = 0
        self.scope_prepare_attempts = 0
        self.scope_prepare_ok = 0
        self.request_id: str | None = None
        self.begin_attempts = 0
        self.begin_ok = 0
        self.task_id: str | None = None
        self.context_attempts = 0
        self.context_ok = 0
        self.tool_attempts = 0
        self.tool_ok = 0
        self.end_attempts = 0
        self.end_ok = False
        self.end_elapsed: int | None = None
        self.task_status: str | None = None
        self.auth_denials = 0
        self.policy_denials: dict[str, int] = {}
        self.index_by_name: dict[str, dict[str, Any]] = {}
        self.list_by_name: dict[str, dict[str, Any]] = {}
        self.scope_in_id: str | None = None
        self.scope_in_sha: str | None = None
        self.scope_out_native_denial = False
        self.tool_results: list[dict[str, Any]] = []
        self.scope_source = _scope_source_manifest(ready)
        self.expected_materials = {
            item["material_name"]: item for item in self.scope_source["files"]
        }
        with open(ledger, "x", encoding="utf-8"):
            pass

    def _record(self, method, path, status, disposition, started) -> None:
        item = {
            "method": method,
            "path": path,
            "status": status,
            "disposition": disposition,
            "elapsed_ms": int((time.monotonic() - started) * 1000),
        }
        with self.lock:
            self.records.append(item)
            with open(self.ledger, "a", encoding="utf-8", newline="\n") as stream:
                stream.write(json.dumps(item, separators=(",", ":")) + "\n")

    @staticmethod
    def _single_query(query: bytes, key: str) -> str | None:
        values = parse_qs(query.decode("latin-1"), keep_blank_values=True)
        if set(values) != {key}:
            return None
        items = values[key]
        return items[0] if len(items) == 1 and items[0] else None

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

    @staticmethod
    def _no_query(query: bytes) -> bool:
        return query == b""

    def _claim_case(self, query: bytes, body: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("CASE_OPEN_QUERY_OR_BODY")
        if not self._exact_keys(data, {"path"}) or not isinstance(data["path"], str):
            return self._deny("CASE_OPEN_BODY")
        try:
            if _norm(data["path"]) != _norm(self.case):
                return self._deny("CASE_OPEN_PATH")
        except (OSError, ValueError, TypeError):
            return self._deny("CASE_OPEN_PATH")
        with self.lock:
            if self.phase != "await_case_open" or self.inflight is not None:
                return self._deny("CASE_OPEN_PHASE")
            if self.case_attempts != 0:
                return self._deny("CASE_OPEN_ALREADY_ATTEMPTED")
            self.case_attempts = 1
            self.inflight = "case_open"
        return None

    def _claim_import(self, query: bytes, data: Any) -> str | None:
        if self.failure_code is not None:
            return self._deny("RUN_FAILED")
        if not self._no_query(query):
            return self._deny("IMPORT_QUERY")
        keys = {"case_id", "paths", "target", "unzip", "mode"}
        if not self._exact_keys(data, keys):
            return self._deny("IMPORT_BODY")
        source = self.ready / SCOPE_SOURCE_NAME
        if not (
            data["case_id"] == self.case_id
            and data["paths"] == [str(source)]
            and data["target"] is None
            and data["unzip"] is False
            and data["mode"] == "copy"
        ):
            return self._deny("IMPORT_SCOPE")
        with self.lock:
            if self.phase != "await_materials_import" or self.inflight is not None:
                return self._deny("IMPORT_PHASE")
            if self.import_attempts != 0 or not self._own_registry():
                return self._deny("IMPORT_ALREADY_ATTEMPTED")
            self.import_attempts = 1
            self.inflight = "materials_import"
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
    ) -> str | None:
        with self.lock:
            if path == "/health":
                if query != b"" or body != b"":
                    return self._deny("HEALTH_QUERY_OR_BODY")
                return None
            if path == "/api/materials":
                return self._claim_material_list(query, body)
            if path == "/api/case/open":
                return self._claim_case(query, body, data)
            if path == "/api/materials/import":
                return self._claim_import(query, data)
            if path == "/api/request/scope":
                return self._claim_scope_prepare(query, data, body)
            if path == "/core/task/begin":
                return self._claim_begin(query, data)
            if path == "/core/context":
                return self._claim_context(query, data)
            if path == "/core/tool":
                return self._claim_tool(query, data)
            if path == "/core/task/end":
                return self._claim_end(query, data)
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
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and isinstance(value, dict)
            and isinstance(value.get("case_id"), str)
            and CASE_ID.fullmatch(value["case_id"]) is not None
            and value.get("name") == self.case.name
            and value.get("created") is True
            and isinstance(value.get("folders_created"), list)
            and value.get("kind") is None
        ):
            raise Deny("CASE_OPEN_RESPONSE")
        self.case_id = value["case_id"]
        if not self._own_registry():
            raise Deny("CASE_REGISTRY_IDENTITY")
        self.phase = "await_materials_import"

    def _complete_import(self, status: int | None, response: Any) -> None:
        value = response.get("value") if isinstance(response, dict) else None
        scan = value.get("scan") if isinstance(value, dict) else None
        if not (
            status == 200
            and isinstance(response, dict)
            and response.get("ok") is True
            and isinstance(value, dict)
            and isinstance(value.get("copied"), list)
            and len(value["copied"]) == len(SCOPE_SOURCE_FILES)
            and value.get("skipped") == []
            and isinstance(scan, dict)
            and scan.get("added") == len(SCOPE_SOURCE_FILES)
            and scan.get("failed") == 0
        ):
            raise Deny("MATERIALS_IMPORT_RESPONSE")
        self._validate_imported_materials()
        _verify_scope_source(self.ready, self.scope_source)
        self.phase = "await_material_list"

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
        self, path: str, status: int | None, body: bytes, overflow: bool
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
            elif path == "/api/materials":
                self._complete_material_list(status, response)
            elif path == "/api/request/scope":
                self._complete_scope_prepare(status, response)
            elif path == "/core/task/begin":
                self._complete_begin(status, response)
            elif path == "/core/context":
                self._complete_context(status, response)
            elif path == "/core/tool":
                self._complete_tool(status, response)
            elif path == "/core/task/end":
                self._complete_end(status, response)
            else:
                raise Deny("OUT_OF_SCOPE_RESPONSE")
        except (Deny, OSError, ValueError, TypeError, KeyError, AttributeError) as exc:
            self._fail(getattr(exc, "code", type(exc).__name__))
        finally:
            operation = {
                "/api/case/open": "case_open",
                "/api/materials/import": "materials_import",
                "/api/materials": "materials_list",
                "/api/request/scope": "scope_prepare",
                "/core/task/begin": "task_begin",
                "/core/context": "context",
                "/core/tool": "tool",
                "/core/task/end": "task_end",
            }.get(path)
            with self.lock:
                if operation is not None and self.inflight == operation:
                    self.inflight = None

    def evidence(self) -> dict[str, Any]:
        with self.lock:
            return {
                "phase": self.phase,
                "protocol_complete": self.phase == "done" and self.end_ok,
                "failure_code": self.failure_code,
                "auth_denials": self.auth_denials,
                "policy_denials": dict(sorted(self.policy_denials.items())),
                "case_bound": self.case_id is not None,
                "case_id": self.case_id,
                "case_open_attempts": self.case_attempts,
                "import_attempts": self.import_attempts,
                "material_list_attempts": self.material_list_attempts,
                "material_list_ok": self.material_list_ok,
                "material_count": len(self.index_by_name),
                "scope_in_material_id": self.scope_in_id,
                "scope_in_sha256": self.scope_in_sha,
                "request_id": self.request_id,
                "scope_prepare_attempts": self.scope_prepare_attempts,
                "scope_prepare_ok": self.scope_prepare_ok,
                "begin_attempts": self.begin_attempts,
                "begin_ok": self.begin_ok,
                "task_id": self.task_id,
                "context_attempts": self.context_attempts,
                "context_ok": self.context_ok,
                "tool_attempts": self.tool_attempts,
                "tool_ok": self.tool_ok,
                "tools": [dict(item) for item in self.tool_results],
                "scope_out_native_denial": self.scope_out_native_denial,
                "scope_authority_verified": self.end_ok,
                "material_current_hash_verified": self.end_ok,
                "task_file_identity_verified": self.end_ok,
                "reads_identity_verified": self.end_ok,
                "task_end_attempts": self.end_attempts,
                "task_end_ok": self.end_ok,
                "task_status": self.task_status,
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
            scope.get("query_string", b""),
            body,
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
        self._complete(path, status, bytes(captured), overflow)

    def snapshot(self) -> list[dict[str, Any]]:
        with self.lock:
            return list(self.records)


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
            "Not GUI, model, whole-T31, packaging, or production acceptance."
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
    parser = argparse.ArgumentParser(description="T31 scoped native HTTP entry")
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
