#!/usr/bin/env python3
"""T33 Host-compatible native entry, prepared only and not run in this job.

The prepare phase creates a fresh private root without importing lawbench.  The
serve phase reuses that root, current-B contracts/skills and the current-B
``lawbench.app.create_app`` behind one IPv4 loopback listener.  Product
lifespan remains off; native auth, routes, Gate, Materials and Registry remain
in use.
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
FIXTURE = pathlib.Path(r"D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg")
FIXTURE_BYTES = 47379
FIXTURE_SHA256 = "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad"
RUN_NAME = re.compile(r"^T33-host-[0-9]{8}-[0-9]{6}$")
PREPARED_FORMAT = "T33-host-entry-prepared-v1"
PASTE_NAME = re.compile(
    r"^粘贴-[0-9]{14}-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-"
    r"[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg)$"
)
PASTE_MAX_BYTES = 20 * 1024 * 1024
FAKE_LOCAL_KEY = "T33-fixture-local-key-never-real"
FAKE_EXTERNAL_KEY = "T33-fixture-external-key-never-real"
DEFAULT_SECONDS, MAX_SECONDS, MAX_BODY = 600, 600, 64 * 1024
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
        ("POST", "/api/case/open"),
        ("POST", "/core/task/begin"),
        ("POST", "/core/tool"),
        ("POST", "/core/task/end"),
        ("POST", "/api/documents/save"),
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
TASK_EMPTY_ROUTES = frozenset({"/api/task/current", "/api/tasks"})
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
    """Reviewed T33 rule: normalize only standard drive/UNC long-path aliases."""
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
    source = _sources()
    manifest = {
        "format": PREPARED_FORMAT,
        "not_service_registration": True,
        "not_case_id_or_session": True,
        "created_at": datetime.now().astimezone().isoformat(timespec="milliseconds"),
        "expected_head": EXPECTED_HEAD,
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
        {"error": {"code": code, "message": "outside T33 reviewed boundary"}},
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
    DRAFT_DIRECTORY = "草稿"
    DRAFT_TITLE = "T32SyntheticDraft"
    DRAFT_CONTENT = "# T32 synthetic draft\n\nSynthetic local document only.\n"
    REVISION_CONTENT = (
        "# T32 synthetic draft\n\nSynthetic revision for local UI save.\n"
    )
    DRAFT_SHA256 = "cabff0ec4478c1eab2800d1d5df1d5139d6c245bfc08f3762092443155d8f0ae"
    REVISION_SHA256 = (
        "7d090ef6fbda9e38b17f1befe5e1c4a2bb8f6db2c2bf45031eb70e52e19a22cc"
    )
    DRAFT_LIMIT = 4 * 1024
    FILE_LIMIT = 64 * 1024
    SPARSE = 0x200
    CAPTURED_ROUTES = frozenset(
        {
            "/api/case/open",
            "/core/task/begin",
            "/core/tool",
            "/core/task/end",
            "/api/documents/save",
        }
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
    ) -> None:
        self.app = app
        self.case = case
        self.ready = ready
        self.paste = paste
        self.registry = appdata / "cases.json"
        self.ledger = ledger
        self.lock = threading.Lock()
        self.records: list[dict[str, Any]] = []
        self.case_id: str | None = None
        self.case_claimed = self.case_failed = False
        self.begin_claimed = self.begin_failed = False
        self.begin_task_id: str | None = None
        self.tool_claimed = self.tool_failed = False
        self.tool_complete = False
        self.tool_task_id: str | None = None
        self.end_claimed = self.end_failed = False
        self.end_complete = False
        self.document_claimed = self.document_failed = False
        self.document_complete = False
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

    def _paste_source(self, value: str) -> bool:
        try:
            path = pathlib.Path(value)
            if not path.is_absolute() or _norm(path.parent) != _norm(self.paste):
                return False
            if not PASTE_NAME.fullmatch(path.name):
                return False
            _no_reparse(path)
            info = os.lstat(path)
            return stat.S_ISREG(info.st_mode) and 0 < info.st_size <= PASTE_MAX_BYTES
        except (OSError, ValueError, TypeError):
            return False

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

    def _claim_case(self, data: Any) -> str | None:
        if not self._exact_keys(data, {"path"}) or not isinstance(data["path"], str):
            return "CASE_OPEN_BODY"
        try:
            if _norm(data["path"]) != _norm(self.case):
                return "CASE_OPEN_PATH"
        except (OSError, ValueError, TypeError):
            return "CASE_OPEN_PATH"
        with self.lock:
            if self.case_claimed or self.case_failed or self.case_id is not None:
                return "CASE_OPEN_ALREADY_ATTEMPTED"
            self.case_claimed = True
        return None

    def _claim_begin(self, data: Any) -> str | None:
        if not self._exact_keys(data, {"session_id", "cwd"}):
            return "TASK_BEGIN_BODY"
        if data["session_id"] != self.SESSION_ID:
            return "TASK_BEGIN_SESSION"
        if not isinstance(data["cwd"], str):
            return "TASK_BEGIN_CWD"
        try:
            if _norm(data["cwd"]) != _norm(self.case):
                return "TASK_BEGIN_CWD"
        except (OSError, ValueError, TypeError):
            return "TASK_BEGIN_CWD"
        if self._bound_case() is None or not self._own_registry():
            return "TASK_BEGIN_CASE_REGISTRY"
        if not self._task_dir_empty():
            return "TASK_BEGIN_DIR_NOT_EMPTY"
        with self.lock:
            if self.begin_claimed or self.begin_failed or self.begin_task_id is not None:
                return "TASK_BEGIN_ALREADY_ATTEMPTED"
            self.begin_claimed = True
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

    def _checked_plain_file(self, path: pathlib.Path, limit: int) -> bytes:
        _no_reparse(path)
        info = os.lstat(path)
        if (
            not stat.S_ISREG(info.st_mode)
            or _link(path)
            or getattr(info, "st_nlink", 0) != 1
            or getattr(info, "st_file_attributes", 0) & self.SPARSE
            or info.st_size > limit
        ):
            raise Deny("draft_file_not_plain_small")
        with open(path, "rb") as stream:
            data = stream.read(limit + 1)
        if len(data) > limit:
            raise Deny("draft_file_grew")
        return data

    def _clear_citation(self, value: Any) -> bool:
        return (
            self._exact_keys(value, {"passed", "problems", "stats"})
            and value["passed"] is True
            and value["problems"] == []
            and isinstance(value["stats"], dict)
        )

    def _empty_coverage(self, value: Any) -> bool:
        return (
            self._exact_keys(
                value,
                {"total", "fully_read", "partially_read", "not_read", "unreadable"},
            )
            and self._is_int(value["total"], 0, 0)
            and value["fully_read"] == []
            and value["partially_read"] == []
            and value["not_read"] == []
            and value["unreadable"] == []
        )

    def _draft_rel(self, task_id: str, version: int) -> str:
        return (
            f"工作区/任务/{task_id}/{self.DRAFT_DIRECTORY}/"
            f"{self.DRAFT_TITLE}-v{version}.md"
        )

    def _task_snapshot(self, task_id: str, phase: str = "initial") -> str | None:
        if phase not in {"initial", "drafted", "ended", "saved"}:
            return "TASK_SNAPSHOT_PHASE"
        drafted = phase != "initial"
        ended = phase in {"ended", "saved"}
        expected_drafts = (
            []
            if phase == "initial"
            else [
                {
                    "title": self.DRAFT_TITLE,
                    "path": self._draft_rel(task_id, 1),
                    "version": 1,
                }
            ]
        )
        if phase == "saved":
            expected_drafts.append(
                {
                    "title": self.DRAFT_TITLE,
                    "path": self._draft_rel(task_id, 2),
                    "version": 2,
                }
            )
        base = self.case / "工作区" / "任务"
        try:
            _no_reparse(self.case)
            _no_reparse(base)
            if _link(base) or not base.is_dir():
                return "TASK_BASE_NOT_DIRECTORY"
            with os.scandir(base) as entries:
                folders = list(entries)
            if len(folders) != 1:
                return "TASK_DIR_COUNT"
            folder = folders[0]
            if (
                folder.name != task_id
                or not folder.is_dir(follow_symlinks=False)
                or _link(folder.path)
            ):
                return "TASK_DIR_IDENTITY"
            task_dir = pathlib.Path(folder.path)
            _no_reparse(task_dir)
            with os.scandir(task_dir) as entries:
                files = list(entries)
            if (
                {item.name for item in files}
                != self.TASK_FILES | ({self.DRAFT_DIRECTORY} if drafted else set())
                or any(
                    (
                        item.name not in self.TASK_FILES
                        or not item.is_file(follow_symlinks=False)
                    )
                    if not drafted or item.name != self.DRAFT_DIRECTORY
                    else (
                        not item.is_dir(follow_symlinks=False)
                        or _link(item.path)
                    )
                    for item in files
                )
            ):
                return "TASK_FILES_IDENTITY"
            task = self._checked_file(task_dir / "task.json")
            result = self._checked_file(task_dir / "result.json")
            reads = self._checked_file(task_dir / "reads.json")
            if not isinstance(task, dict) or not (
                task.get("task_id") == task_id
                and task.get("case_id") == self._bound_case()
                and task.get("session_id") == self.SESSION_ID
                and task.get("kind") == "agent"
                and task.get("route") == "local"
                and task.get("skill") is None
                and task.get("state") == ("finished" if ended else "running")
            ):
                return "TASK_JSON_IDENTITY"
            usage = result.get("usage") if isinstance(result, dict) else None
            if not isinstance(result, dict) or not (
                result.get("task_id") == task_id
                and result.get("status") == ("cancelled" if ended else "running")
                and isinstance(usage, dict)
                and self._is_int(usage.get("model_calls"), 0, 0)
                and self._is_int(
                    usage.get("tool_calls"), 1 if ended else 0, 1 if ended else 0
                )
                and self._is_int(
                    usage.get("elapsed_s"), 0, 60 if ended else 0
                )
                and result.get("drafts") == expected_drafts
                and result.get("citations") == []
                and (
                    result.get("finished_at") is not None
                    if ended
                    else result.get("finished_at") is None
                )
            ):
                return "TASK_RESULT_IDENTITY"
            if phase == "initial":
                if (
                    result.get("citation_check") is not None
                    or result.get("coverage") is not None
                ):
                    return "TASK_RESULT_INITIAL"
            elif not (
                self._clear_citation(result.get("citation_check"))
                and self._empty_coverage(result.get("coverage"))
            ):
                return "TASK_RESULT_DRAFT"
            if not isinstance(reads, dict) or not (
                reads.get("task_id") == task_id and reads.get("reads") == []
            ):
                return "TASK_READS_IDENTITY"
            if drafted:
                draft_dir = task_dir / self.DRAFT_DIRECTORY
                _no_reparse(draft_dir)
                with os.scandir(draft_dir) as entries:
                    drafts = list(entries)
                versions = {1} if phase != "saved" else {1, 2}
                expected_names = {
                    f"{self.DRAFT_TITLE}-v{version}.md" for version in versions
                }
                if (
                    {item.name for item in drafts} != expected_names
                    or any(
                        not item.is_file(follow_symlinks=False) or _link(item.path)
                        for item in drafts
                    )
                ):
                    return "TASK_DRAFT_FILES"
                for version in versions:
                    draft = self._checked_plain_file(
                        draft_dir / f"{self.DRAFT_TITLE}-v{version}.md",
                        self.DRAFT_LIMIT,
                    )
                    expected = (
                        self.DRAFT_CONTENT
                        if version == 1
                        else self.REVISION_CONTENT
                    ).encode("utf-8")
                    expected_sha = (
                        self.DRAFT_SHA256
                        if version == 1
                        else self.REVISION_SHA256
                    )
                    if (
                        draft != expected
                        or hashlib.sha256(draft).hexdigest() != expected_sha
                    ):
                        return (
                            "TASK_DRAFT_CONTENT"
                            if version == 1
                            else "TASK_REVISION_CONTENT"
                        )
        except (Deny, OSError, ValueError, TypeError):
            return "TASK_SNAPSHOT_DENIED"
        return None

    def _claim_tool(self, data: Any) -> str | None:
        if not self._exact_keys(data, {"task_id", "tool", "args"}):
            return "TOOL_BODY"
        with self.lock:
            task_id = self.begin_task_id
            already_attempted = (
                self.tool_claimed
                or self.tool_failed
                or self.tool_complete
                or self.tool_task_id is not None
            )
        if task_id is None or data["task_id"] != task_id:
            return "TOOL_ID"
        if data["tool"] != "case_save_draft":
            return "TOOL_NAME"
        args = data["args"]
        if not self._exact_keys(args, {"title", "content"}) or (
            args["title"] != self.DRAFT_TITLE
            or args["content"] != self.DRAFT_CONTENT
        ):
            return "TOOL_ARGS"
        if not self._own_registry():
            return "TOOL_CASE_REGISTRY"
        denial = self._task_snapshot(task_id, "initial")
        if denial:
            return denial
        with self.lock:
            if already_attempted or self.tool_claimed or self.tool_failed:
                return "TOOL_ALREADY_ATTEMPTED"
            if self.begin_task_id != task_id:
                return "TOOL_ID"
            self.tool_claimed = True
        return None

    def _claim_end(self, data: Any) -> str | None:
        keys = {"task_id", "reason", "model_calls", "tool_calls", "elapsed_s"}
        if not self._exact_keys(data, keys):
            return "TASK_END_BODY"
        with self.lock:
            task_id = self.tool_task_id
            tool_complete = self.tool_complete
        if task_id is None or data["task_id"] != task_id:
            return "TASK_END_ID"
        if (
            not tool_complete
            or
            data["reason"] != "aborted"
            or not self._is_int(data["model_calls"], 0, 0)
            or not self._is_int(data["tool_calls"], 1, 1)
            or not self._is_int(data["elapsed_s"], 0, 60)
        ):
            return "TASK_END_VALUES"
        if not self._own_registry():
            return "TASK_END_CASE_REGISTRY"
        denial = self._task_snapshot(task_id, "drafted")
        if denial:
            return denial
        with self.lock:
            if self.end_claimed or self.end_failed or self.end_complete:
                return "TASK_END_ALREADY_ATTEMPTED"
            if not self.tool_complete or self.tool_task_id != task_id:
                return "TASK_END_TOOL"
            self.end_claimed = True
        return None

    def _claim_document(self, data: Any) -> str | None:
        if not self._exact_keys(data, {"case_id", "path", "content"}):
            return "DOCUMENT_SAVE_BODY"
        with self.lock:
            case_id = self.case_id
            task_id = self.tool_task_id
            end_complete = self.end_complete
            already_attempted = (
                self.document_claimed
                or self.document_failed
                or self.document_complete
            )
        if not end_complete or case_id is None or task_id is None:
            return "DOCUMENT_SAVE_STATE"
        if data["case_id"] != case_id or data["path"] != self._draft_rel(task_id, 1):
            return "DOCUMENT_SAVE_SOURCE"
        if data["content"] != self.REVISION_CONTENT:
            return "DOCUMENT_SAVE_CONTENT"
        if not self._own_registry():
            return "DOCUMENT_SAVE_CASE_REGISTRY"
        denial = self._task_snapshot(task_id, "ended")
        if denial:
            return denial
        with self.lock:
            if already_attempted or self.document_claimed or self.document_failed:
                return "DOCUMENT_SAVE_ALREADY_ATTEMPTED"
            if not self.end_complete or self.case_id != case_id:
                return "DOCUMENT_SAVE_STATE"
            if self.tool_task_id != task_id:
                return "DOCUMENT_SAVE_SOURCE"
            self.document_claimed = True
        return None

    def _policy(self, path: str, data: Any, query: bytes) -> str | None:
        if path == "/api/case/open":
            return self._claim_case(data)
        if path == "/core/task/begin":
            return self._claim_begin(data)
        if path == "/core/tool":
            return self._claim_tool(data)
        if path == "/core/task/end":
            return self._claim_end(data)
        if path == "/api/documents/save":
            return self._claim_document(data)
        return None

    def _failed(self, path: str) -> None:
        with self.lock:
            if path == "/api/case/open":
                self.case_failed = True
            elif path == "/core/task/begin":
                self.begin_failed = True
            elif path == "/core/tool":
                self.tool_failed = True
            elif path == "/core/task/end":
                self.end_failed = True
            elif path == "/api/documents/save":
                self.document_failed = True

    def _complete(self, path: str, status: int | None, body: bytes) -> None:
        response = _json(body)
        if path == "/api/case/open":
            value = response.get("value") if isinstance(response, dict) else None
            if (
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and isinstance(value, dict)
                and isinstance(value.get("case_id"), str)
                and value["case_id"]
            ):
                with self.lock:
                    self.case_id = value["case_id"]
            else:
                self._failed(path)
            return
        if path == "/core/task/begin":
            value = response.get("value") if isinstance(response, dict) else None
            if (
                status == 200
                and isinstance(response, dict)
                and response.get("ok") is True
                and isinstance(value, dict)
                and isinstance(value.get("task_id"), str)
                and self.TASK_ID.fullmatch(value["task_id"]) is not None
                and value.get("case_id") == self._bound_case()
                and value.get("route") == "local"
                and value.get("skill") is None
                and isinstance(value.get("params"), dict)
                and isinstance(value.get("budget"), dict)
            ):
                with self.lock:
                    self.begin_task_id = value["task_id"]
            else:
                self._failed(path)
            return
        if path == "/core/tool":
            value = response.get("value") if isinstance(response, dict) else None
            with self.lock:
                task_id = self.begin_task_id
            if not (
                status == 200
                and task_id is not None
                and self._exact_keys(response, {"ok", "value"})
                and response.get("ok") is True
                and self._exact_keys(
                    value,
                    {
                        "path",
                        "version",
                        "citation_check",
                        "coverage",
                        "not_fully_read",
                    },
                )
                and value["path"] == self._draft_rel(task_id, 1)
                and self._is_int(value["version"], 1, 1)
                and self._clear_citation(value["citation_check"])
                and self._empty_coverage(value["coverage"])
                and value["not_fully_read"] == []
                and self._task_snapshot(task_id, "drafted") is None
            ):
                self._failed(path)
            else:
                with self.lock:
                    self.tool_task_id = task_id
                    self.tool_complete = True
            return
        if path == "/core/task/end":
            value = response.get("value") if isinstance(response, dict) else None
            if not (
                status == 200
                and self._exact_keys(response, {"ok", "value"})
                and response.get("ok") is True
                and self._exact_keys(value, {"status"})
                and value["status"] == "cancelled"
                and self.tool_task_id is not None
                and self._task_snapshot(self.tool_task_id, "ended") is None
            ):
                self._failed(path)
            else:
                with self.lock:
                    self.end_complete = True
            return
        if path == "/api/documents/save":
            value = response.get("value") if isinstance(response, dict) else None
            with self.lock:
                case_id = self.case_id
                task_id = self.tool_task_id
            if not (
                status == 200
                and case_id is not None
                and task_id is not None
                and self._exact_keys(response, {"ok", "value"})
                and response.get("ok") is True
                and self._exact_keys(
                    value,
                    {
                        "task_id",
                        "path",
                        "version",
                        "citation_check",
                        "coverage",
                        "not_fully_read",
                    },
                )
                and value["task_id"] == task_id
                and value["path"] == self._draft_rel(task_id, 2)
                and self._is_int(value["version"], 2, 2)
                and self._clear_citation(value["citation_check"])
                and self._empty_coverage(value["coverage"])
                and value["not_fully_read"] == []
                and self._task_snapshot(task_id, "saved") is None
            ):
                self._failed(path)
            else:
                with self.lock:
                    self.document_complete = True

    async def __call__(self, scope, receive, send) -> None:
        if scope["type"] != "http":
            return
        method, path, started = scope["method"], scope["path"], time.monotonic()
        if (method, path) not in ROUTES:
            self._record(method, "<denied-route>", 403, "route_denied", started)
            await _guard_reply(send, 403, "OUT_OF_SCOPE")
            return
        body, data = None, None
        if method == "POST":
            original = receive
            try:
                body = await _read_body(receive)
            except Deny:
                self._record(method, path, 413, "body_denied", started)
                await _guard_reply(send, 413, "REQUEST_TOO_LARGE")
                return
            if body is None:
                self._record(
                    method, path, None, "disconnected_before_body", started
                )
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
        denial = self._policy(path, data, scope.get("query_string", b""))
        if denial:
            self._record(method, path, 403, denial, started)
            await _guard_reply(send, 403, denial)
            return
        status, captured = None, bytearray()

        async def observed(message):
            nonlocal status
            if message["type"] == "http.response.start":
                status = int(message["status"])
            elif (
                message["type"] == "http.response.body"
                and path in self.CAPTURED_ROUTES
            ):
                captured.extend(
                    message.get("body", b"")[: max(0, MAX_BODY - len(captured))]
                )
            await send(message)

        try:
            await self.app(scope, receive, observed)
        except BaseException:
            if path in self.CAPTURED_ROUTES:
                self._failed(path)
            raise
        finally:
            self._record(method, path, status, "native_app", started)
        if path in self.CAPTURED_ROUTES:
            self._complete(path, status, bytes(captured))

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
            "Windows", "T33-SYNTHETIC", "", "", ""
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
                "case_path": str(layout["case"]),
                "appdata": str(layout["appdata"]),
                "paste_path": str(layout["paste"]),
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
    with cred_lock:
        credential_state = {
            "local_getter_calls": local_count["local"],
            "external_getter_calls": local_count["external"],
            "keyring_rejections": local_count["keyring"],
        }
    source_after = _sources()
    source_unchanged = source_before == source_after
    fixture_unchanged = (
        FIXTURE.is_file()
        and not _link(FIXTURE)
        and FIXTURE.stat().st_size == FIXTURE_BYTES
        and _sha256(FIXTURE) == FIXTURE_SHA256
    )
    try:
        fixture_copy_identity = _file_identity(layout["ready"] / FIXTURE.name)
        settings_identity = _file_identity(layout["settings"])
        marker_identity = _file_identity(layout["daily_marker"])
        marker_unchanged = _read_json(layout["daily_marker"]) == {
            "root": str(layout["case"])
        }
    except (Deny, OSError, ValueError) as exc:
        fixture_copy_identity = None
        settings_identity = None
        marker_identity = None
        marker_unchanged = False
        failure = failure or getattr(exc, "code", type(exc).__name__)
    task_done = bool(task is not None and task.done())
    listener_closed = _closed(server)
    if (
        guard_state["violations"]
        or any(credential_state.values())
        or not source_unchanged
        or not fixture_unchanged
        or not marker_unchanged
    ) and failure is None:
        failure = "guard_credential_source_or_marker_violation"
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
            "Not GUI, actual Host/RPC, OCR, model, packaging or T33 acceptance."
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
        "settings_after": settings_identity,
        "daily_marker_after": marker_identity,
        "source_unchanged": source_unchanged,
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
            "auth": "native middleware",
            "routes_contracts": "native",
            "materials_registry_gate": "native",
            "allowed_routes": sorted([list(item) for item in ROUTES]),
        },
        "credentials": credential_state,
        "guard": guard_state,
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
    del manifest
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
            "paste_path": str(layout["paste"]),
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
    parser = argparse.ArgumentParser(description="T33 Host-compatible native entry")
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
