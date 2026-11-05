#!/usr/bin/env python3
"""Finite real-service consumer for the synthetic T32 OCR/refine/cancel audit.

This file is authored evidence tooling. It is deliberately not a product module,
not a test-discovery entry point, and not a reusable service. Run exactly one
explicit phase against one fresh private root.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import importlib.abc
import json
import os
import pathlib
import re
import socket
import struct
import sys
import threading
import time
import unicodedata
from datetime import datetime, timezone


ARTIFACT_SCHEMA = "lawbench-real-synthetic-ocr-refine-consumer/1"
SERVICE_DIR = pathlib.Path(r"D:\Lawbeach\lawbench-B\service")
COORD_INPUT_DIR = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\RealSyntheticOCRRefineInput-20261027-225347"
)
TARGETS_PATH = COORD_INPUT_DIR / "targets.json"
FIXED_INPUTS_PATH = COORD_INPUT_DIR / "fixed-inputs.json"
AUTHORIZATION_PATH = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\OWNER-合成案卷真实识别模型测试授权-20261027-224859.md"
)

# The two coord-file hashes fix the complete input order and fixture manifest.
TARGETS_SHA256 = "bc260b869b6d2cf10245d1b4801b9f50722aef19c6edc1747ec378c20ffe6a38"
TARGETS_BYTES = 1131
FIXED_INPUTS_SHA256 = "42ab9180796fc45f7609c5ae5ec15800658277719804a6c07418293a97b18437"
FIXED_INPUTS_BYTES = 4465
AUTHORIZATION_SHA256 = "ef02628397b72f14cd5feea6d9900fb5051465b6bec00bd2ea0fc3cf4c28bb66"
AUTHORIZATION_BYTES = 971

EXPECTED_TARGETS = {
    "destination": r"D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347",
    "authorization": str(AUTHORIZATION_PATH),
    "health_evidence": r"C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\real-synthetic-services-health-current.json",
    "service_path": str(SERVICE_DIR),
    "fixture": r"D:\Lawbeach\lawbench-B\tests\fixtures\criminal-01\转账截图.jpg",
    "fixture_bytes": 47379,
    "fixture_sha256": "feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad",
    "llm_url": "http://10.126.126.1:8000/v1",
    "prep_url": "http://10.126.126.3:9000",
    "llm_model": "qwen38-27b",
    "ocr_model_health": "Xiaomi-OCR-0.BF16.gguf",
    "public_nonsecret_marker": "lawbench-synthetic-no-secret-acceptance",
    "output_fields": ["张某甲", "吴某", "80000", "0417", "20250310"],
    "synthetic_prompt": "请按转账截图整理吴某于2025年3月10日向张某甲转账80000元的时间线。",
}

PUBLIC_MARKER = EXPECTED_TARGETS["public_nonsecret_marker"]
SYNTHETIC_PROMPT = EXPECTED_TARGETS["synthetic_prompt"]
FIXED_MATERIAL_NAME = "转账截图"

ALLOWED_DESTINATIONS = frozenset(
    {("10.126.126.1", 8000), ("10.126.126.3", 9000)}
)

EXIT_PASS = 0
EXIT_ASSERTION = 2
EXIT_AUTH_BLOCKED = 3
EXIT_SETUP = 4
EXIT_NOT_EXERCISED = 5
EXIT_INTERNAL = 6

WATCHDOG_SECONDS = 86400.0
PRIVATE_ENV_KEYS = ("HOME", "USERPROFILE", "APPDATA", "LOCALAPPDATA", "TEMP", "TMP")
FORBIDDEN_MODULE_PREFIXES = (
    "lawbench.app",
    "lawbench.api",
    "lawbench.ocr.queue",
    "lawbench.retainer",
    "lawbench.office",
)
FORBIDDEN_STATE_NAMES = frozenset(
    {"case", "cases", "task", "tasks", "history", "rollout", "session", "sessions"}
)


class SetupError(Exception):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


class _ArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise SetupError("ARGUMENTS_INVALID")


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _is_link(path: pathlib.Path) -> bool:
    junction = getattr(os.path, "isjunction", lambda _p: False)
    return path.is_symlink() or bool(junction(path))


def _ordinary_file(path: pathlib.Path) -> bool:
    return path.is_file() and not _is_link(path)


def _read_fixed_file(path: pathlib.Path, expected_bytes: int, expected_sha: str) -> bytes:
    if not _ordinary_file(path):
        raise SetupError("FIXED_INPUT_NOT_ORDINARY_FILE")
    try:
        data = path.read_bytes()
    except OSError:
        raise SetupError("FIXED_INPUT_NOT_READABLE") from None
    if len(data) != expected_bytes or _sha256_bytes(data) != expected_sha:
        raise SetupError("FIXED_INPUT_IDENTITY_MISMATCH")
    return data


def _validate_root(raw: str) -> pathlib.Path:
    requested = pathlib.Path(raw)
    if not requested.is_absolute():
        raise SetupError("PARENT_NOT_ABSOLUTE")
    root = requested.resolve(strict=False)
    if root.exists():
        if _is_link(root) or not root.is_dir():
            raise SetupError("PARENT_NOT_ORDINARY_DIRECTORY")
        try:
            if any(root.iterdir()):
                raise SetupError("PARENT_NOT_EMPTY")
        except OSError:
            raise SetupError("PARENT_NOT_READABLE") from None
    else:
        probe = root.parent
        while True:
            if probe.exists() and _is_link(probe):
                raise SetupError("PARENT_CHAIN_IS_LINK")
            if probe.parent == probe:
                break
            probe = probe.parent
        try:
            root.mkdir(parents=True, exist_ok=False)
        except OSError:
            raise SetupError("PARENT_CREATE_FAILED") from None
    if not root.is_dir() or _is_link(root):
        raise SetupError("PARENT_NOT_ORDINARY_DIRECTORY")
    return root


def _validate_fixed_inputs() -> tuple[dict, list[dict]]:
    targets_bytes = _read_fixed_file(TARGETS_PATH, TARGETS_BYTES, TARGETS_SHA256)
    fixed_bytes = _read_fixed_file(
        FIXED_INPUTS_PATH, FIXED_INPUTS_BYTES, FIXED_INPUTS_SHA256
    )
    _read_fixed_file(AUTHORIZATION_PATH, AUTHORIZATION_BYTES, AUTHORIZATION_SHA256)
    try:
        targets = json.loads(targets_bytes.decode("utf-8"))
        manifest = json.loads(fixed_bytes.decode("utf-8"))
    except (OSError, UnicodeDecodeError, json.JSONDecodeError):
        raise SetupError("FIXED_INPUT_NOT_VALID_JSON") from None
    if targets != EXPECTED_TARGETS:
        raise SetupError("TARGETS_DO_NOT_MATCH_EXACT_ORDER")
    if not isinstance(manifest, list) or len(manifest) != 15:
        raise SetupError("FIXED_INPUT_COUNT_MISMATCH")

    rows: list[dict] = []
    for item in manifest:
        if not isinstance(item, dict):
            raise SetupError("FIXED_INPUT_ENTRY_INVALID")
        try:
            live = pathlib.Path(item["path"])
            snapshot = pathlib.Path(item["snapshot"])
            expected_n = int(item["bytes"])
            expected_sha = str(item["sha256"]).lower()
        except (KeyError, TypeError, ValueError):
            raise SetupError("FIXED_INPUT_ENTRY_INVALID") from None
        if not _ordinary_file(live) or not _ordinary_file(snapshot):
            raise SetupError("SOURCE_NOT_ORDINARY_FILE")
        try:
            live_bytes = live.read_bytes()
            snapshot_bytes = snapshot.read_bytes()
        except OSError:
            raise SetupError("SOURCE_NOT_READABLE") from None
        live_sha = _sha256_bytes(live_bytes)
        snapshot_sha = _sha256_bytes(snapshot_bytes)
        ok = (
            len(live_bytes) == expected_n
            and len(snapshot_bytes) == expected_n
            and live_sha == expected_sha
            and snapshot_sha == expected_sha
        )
        rows.append(
            {
                "path": str(live),
                "snapshot": str(snapshot),
                "bytes": len(live_bytes),
                "sha256": live_sha,
                "expected_bytes": expected_n,
                "expected_sha256": expected_sha,
                "snapshot_sha256": snapshot_sha,
                "matches": ok,
            }
        )
        if not ok:
            raise SetupError("SOURCE_BASELINE_MISMATCH")
    fixture = pathlib.Path(targets["fixture"])
    fixture_row = next((row for row in rows if row["path"] == str(fixture)), None)
    if fixture_row is None:
        raise SetupError("FIXTURE_NOT_IN_BASELINE")
    health = pathlib.Path(targets["health_evidence"])
    if not _ordinary_file(health):
        raise SetupError("HEALTH_EVIDENCE_NOT_ORDINARY_FILE")
    expected_consumer_dir = pathlib.Path(targets["destination"]).resolve(strict=False)
    if pathlib.Path(__file__).resolve(strict=False).parent != expected_consumer_dir:
        raise SetupError("CONSUMER_NOT_IN_FIXED_DESTINATION")
    return targets, rows


class PrivateEnvironment:
    def __init__(self, root: pathlib.Path):
        private = root / "private"
        self.paths = {
            "home": private / "home",
            "appdata": private / "appdata" / "roaming",
            "localappdata": private / "appdata" / "local",
            "temp": private / "temp",
        }
        self._previous: dict[str, str | None] = {}
        self.restored = False

    def __enter__(self) -> "PrivateEnvironment":
        for path in self.paths.values():
            path.mkdir(parents=True, exist_ok=True)
            if _is_link(path):
                raise SetupError("PRIVATE_PATH_IS_LINK")
        self._previous = {name: os.environ.get(name) for name in PRIVATE_ENV_KEYS}
        values = {
            "HOME": self.paths["home"],
            "USERPROFILE": self.paths["home"],
            "APPDATA": self.paths["appdata"],
            "LOCALAPPDATA": self.paths["localappdata"],
            "TEMP": self.paths["temp"],
            "TMP": self.paths["temp"],
        }
        for name, path in values.items():
            os.environ[name] = str(path)
        return self

    def __exit__(self, exc_type, exc, tb) -> None:
        for name, previous in self._previous.items():
            if previous is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = previous
        self.restored = True


class BlockedImportFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path=None, target=None):
        if fullname == "keyring" or fullname.startswith("keyring."):
            raise ImportError("keyring is blocked for this finite consumer")
        return None


class BlockerState:
    def __init__(self):
        self.original_popen_init = None
        self.original_system = None
        self.original_startfile = None
        self.finder: BlockedImportFinder | None = None
        self.installed = False

    def install(self) -> None:
        import subprocess

        if any(isinstance(f, BlockedImportFinder) for f in sys.meta_path):
            raise SetupError("IMPORT_BLOCKER_ALREADY_INSTALLED")
        self.finder = BlockedImportFinder()
        sys.meta_path.insert(0, self.finder)

        def denied_popen(_self, *args, **kwargs):
            raise RuntimeError("subprocess spawn is blocked")

        self.original_popen_init = subprocess.Popen.__init__
        subprocess.Popen.__init__ = denied_popen
        self.original_system = os.system
        os.system = lambda *_a, **_k: (_ for _ in ()).throw(
            RuntimeError("os.system is blocked")
        )
        if hasattr(os, "startfile"):
            self.original_startfile = os.startfile
            os.startfile = lambda *_a, **_k: (_ for _ in ()).throw(
                RuntimeError("os.startfile is blocked")
            )
        self.installed = True

    def restore(self) -> None:
        if not self.installed:
            return
        import subprocess

        if self.finder is not None:
            sys.meta_path[:] = [f for f in sys.meta_path if f is not self.finder]
        if self.original_popen_init is not None:
            subprocess.Popen.__init__ = self.original_popen_init
        if self.original_system is not None:
            os.system = self.original_system
        if self.original_startfile is not None:
            os.startfile = self.original_startfile
        self.installed = False


class SocketAudit:
    def __init__(self):
        self.allowed = ALLOWED_DESTINATIONS
        self._lock = threading.Lock()
        self.attempts = collections.Counter()
        self.successes = collections.Counter()
        self.failures = collections.Counter()
        self.denied = collections.Counter()
        self.first_connected = threading.Event()
        self._thread_connections: dict[int, threading.Event] = {}
        self._connected_threads: set[int] = set()
        self._original_connect = None
        self._original_connect_ex = None
        self._original_getaddrinfo = None
        self.installed = False

    @staticmethod
    def _destination(address):
        if not isinstance(address, tuple) or len(address) < 2:
            return ("INVALID", 0)
        host, port = address[0], address[1]
        if not isinstance(host, str):
            return ("INVALID", 0)
        try:
            return (host, int(port))
        except (TypeError, ValueError):
            return ("INVALID", 0)

    @staticmethod
    def _key(destination) -> str:
        host, port = destination
        return f"{host}:{port}"

    def _deny(self, destination) -> None:
        key = self._key(destination)
        with self._lock:
            self.denied[key] += 1
        raise PermissionError("outbound destination is not in the finite allowlist")

    def connection_event(self, ident: int | None) -> threading.Event:
        key = int(ident or 0)
        with self._lock:
            return self._thread_connections.setdefault(key, threading.Event())

    def _mark_connected(self) -> None:
        ident = threading.get_ident()
        with self._lock:
            event = self._thread_connections.setdefault(ident, threading.Event())
            self._connected_threads.add(ident)
        event.set()
        self.first_connected.set()

    def install(self) -> None:
        if self.installed:
            raise SetupError("SOCKET_GUARD_ALREADY_INSTALLED")
        self._original_connect = socket.socket.connect
        self._original_connect_ex = socket.socket.connect_ex
        self._original_getaddrinfo = socket.getaddrinfo

        def guarded_connect(sock, address):
            destination = self._destination(address)
            key = self._key(destination)
            with self._lock:
                self.attempts[key] += 1
            if destination not in self.allowed:
                self._deny(destination)
            try:
                result = self._original_connect(sock, address)
            except BaseException:
                with self._lock:
                    self.failures[key] += 1
                raise
            with self._lock:
                self.successes[key] += 1
            self._mark_connected()
            return result

        def guarded_connect_ex(sock, address):
            destination = self._destination(address)
            key = self._key(destination)
            with self._lock:
                self.attempts[key] += 1
            if destination not in self.allowed:
                self._deny(destination)
            result = self._original_connect_ex(sock, address)
            if result == 0:
                with self._lock:
                    self.successes[key] += 1
                self._mark_connected()
            else:
                with self._lock:
                    self.failures[key] += 1
            return result

        def guarded_getaddrinfo(host, port, *args, **kwargs):
            destination = self._destination((host, port))
            if destination not in self.allowed:
                self._deny(destination)
            return self._original_getaddrinfo(host, port, *args, **kwargs)

        socket.socket.connect = guarded_connect
        socket.socket.connect_ex = guarded_connect_ex
        socket.getaddrinfo = guarded_getaddrinfo
        self.installed = True

    def restore(self) -> None:
        if not self.installed:
            return
        socket.socket.connect = self._original_connect
        socket.socket.connect_ex = self._original_connect_ex
        socket.getaddrinfo = self._original_getaddrinfo
        self.installed = False

    def evidence(self) -> dict:
        with self._lock:
            return {
                "scope": "process_local_consumer_socket_guard",
                "allowlist": sorted(self._key(x) for x in self.allowed),
                "attempts": dict(sorted(self.attempts.items())),
                "successes": dict(sorted(self.successes.items())),
                "failures": dict(sorted(self.failures.items())),
                "denied": dict(sorted(self.denied.items())),
                "no_denied_attempts": not self.denied,
                "connected_thread_idents": sorted(self._connected_threads),
            }


class Runtime:
    def __init__(self, httpx):
        self.httpx = httpx


def _recording_transport_class(httpx):
    """Build the real BaseTransport subclass only after fixed-input validation."""

    class RecordingTransport(httpx.BaseTransport):
        """Call-through transport that records request/response metadata only."""

        def __init__(self, runtime: Runtime, on_chat_dispatch=None):
            super().__init__()
            self.runtime = runtime
            self.inner = runtime.httpx.HTTPTransport()
            self.records: list[dict] = []
            self.request_threads: list[threading.Thread] = []
            self.chat_dispatch = threading.Event()
            self.on_chat_dispatch = on_chat_dispatch
            self._lock = threading.Lock()
            self._closed = False

        def handle_request(self, request):
            path = request.url.path
            is_chat = request.method == "POST" and path.endswith("/chat/completions")
            thread = threading.current_thread()
            record = {
                "method": request.method,
                "scheme": request.url.scheme,
                "host": request.url.host,
                "port": request.url.port or 80,
                "path": path,
                "query_present": bool(request.url.query),
                "thread_name": thread.name,
                "thread_ident": thread.ident,
                "status": None,
                "error_type": None,
            }
            with self._lock:
                self.records.append(record)
                if thread not in self.request_threads:
                    self.request_threads.append(thread)
            if is_chat:
                self.chat_dispatch.set()
                if self.on_chat_dispatch is not None:
                    self.on_chat_dispatch(thread)
            try:
                response = self.inner.handle_request(request)
            except BaseException as exc:
                record["error_type"] = type(exc).__name__
                raise
            record["status"] = response.status_code
            return response

        def close(self) -> None:
            with self._lock:
                if self._closed:
                    return
                self._closed = True
            self.inner.close()

        def evidence(self) -> list[dict]:
            with self._lock:
                return [dict(record) for record in self.records]

        def request_thread_evidence(self) -> list[threading.Thread]:
            with self._lock:
                return list(self.request_threads)

    return RecordingTransport


def _new_net(net_cls, runtime: Runtime, on_chat_dispatch=None) -> tuple:
    private_server_config = {
        "llm_base_url": "http://10.126.126.1:8000/v1",
        "prep_base_url": "http://10.126.126.3:9000",
        "llm_alt_base_url": None,
        "prep_alt_base_url": None,
    }
    transport_class = _recording_transport_class(runtime.httpx)
    transport = transport_class(runtime, on_chat_dispatch=on_chat_dispatch)
    try:
        net = net_cls(private_server_config, transport=transport)
    except BaseException:
        transport.close()
        raise
    return net, transport


def _close_client(client) -> str | None:
    if client is None:
        return None
    try:
        client.close()
        return None
    except BaseException as exc:
        return type(exc).__name__


def _thread_snapshot() -> dict:
    names = collections.Counter(thread.name for thread in threading.enumerate())
    return {
        "count": int(sum(names.values())),
        "names": dict(sorted(names.items())),
    }


def _join_threads(threads, watchdog_seconds: float = WATCHDOG_SECONDS) -> list[dict]:
    deadline = time.monotonic() + watchdog_seconds
    rows = []
    seen = set()
    for thread in threads:
        if thread is None or id(thread) in seen or thread is threading.current_thread():
            continue
        seen.add(id(thread))
        remaining = max(0.0, deadline - time.monotonic())
        if thread.is_alive():
            thread.join(remaining)
        rows.append(
            {
                "name": thread.name,
                "ident": thread.ident,
                "was_alive_after_join": thread.is_alive(),
                "joined_or_already_unwound": not thread.is_alive(),
            }
        )
    return rows


def _compact_value(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text)
    return "".join(ch for ch in normalized if not ch.isspace())


def _amount_found(text: str) -> bool:
    return re.search(r"(?<!\d)(?:¥)?80,?000(?:\.00)?(?!\d)", _compact_value(text)) is not None


def _refine_amount_found(text: str) -> bool:
    compact = _compact_value(text)
    return _amount_found(text) or "8万元" in compact


def _date_found(text: str) -> bool:
    pattern = r"(?:2025[-./年]0?3[-./月]10日?|20250310)"
    return re.search(pattern, _compact_value(text)) is not None


def _png_identity(blob: bytes) -> dict:
    if len(blob) < 33 or blob[:8] != b"\x89PNG\r\n\x1a\n" or blob[12:16] != b"IHDR":
        raise ValueError("rendered bytes are not a PNG")
    width, height, bit_depth, color_type = struct.unpack(">IIBB", blob[16:26])
    return {
        "bytes": len(blob),
        "sha256": _sha256_bytes(blob),
        "width": width,
        "height": height,
        "bit_depth": bit_depth,
        "color_type": color_type,
    }


def _ocr_checks(markdown: str) -> dict:
    compact = _compact_value(markdown)
    checks = {
        "name_zhang": {
            "expected": "张某甲",
            "found": "张某甲" in compact,
        },
        "name_wu": {
            "expected": "吴某",
            "found": "吴某" in compact,
        },
        "amount": {
            "expected": "80000 (80,000.00 accepted after separator normalization)",
            "found": _amount_found(markdown),
        },
        "tail": {
            "expected": "0417",
            "found": "0417" in compact,
        },
        "date": {
            "expected": "2025-03-10 / 2025年3月10日",
            "found": _date_found(markdown),
        },
    }
    checks["all_values_found"] = all(item["found"] for item in checks.values())
    return checks


def _refine_checks(returned: dict) -> dict:
    text = returned.get("text") if isinstance(returned, dict) else ""
    if not isinstance(text, str):
        text = ""
    compact = _compact_value(text)
    checks = {
        "refined_true": returned.get("refined") is True if isinstance(returned, dict) else False,
        "text_nonempty": bool(text.strip()),
        "different_from_input": bool(text.strip()) and text.strip() != SYNTHETIC_PROMPT.strip(),
        "preserve_name_zhang": "张某甲" in compact,
        "preserve_name_wu": "吴某" in compact,
        "preserve_amount": _refine_amount_found(text),
        "preserve_date": _date_found(text),
        "no_failure_reason": isinstance(returned, dict) and "reason" not in returned,
    }
    checks["all_required"] = all(checks.values())
    return checks


def _audit_isolation(root: pathlib.Path, modules: set[str]) -> dict:
    forbidden_modules = sorted(
        name
        for name in modules
        if any(name == prefix or name.startswith(prefix + ".") for prefix in FORBIDDEN_MODULE_PREFIXES)
        or name == "lawbench.send"
        or name.startswith("lawbench.send.")
        or "NativeSession" in name
    )
    forbidden_paths = []
    for path in root.rglob("*"):
        rel = path.relative_to(root)
        lowered_parts = {part.lower() for part in rel.parts}
        if lowered_parts & FORBIDDEN_STATE_NAMES:
            forbidden_paths.append(rel.as_posix())
        elif path.is_file() and path.suffix.lower() in {".db", ".sqlite", ".sqlite3"}:
            forbidden_paths.append(rel.as_posix())
    return {
        "forbidden_modules": forbidden_modules,
        "forbidden_paths": sorted(forbidden_paths),
        "no_app_native_session_case_task_or_history": not forbidden_modules and not forbidden_paths,
    }


def _log_audit(log_file: pathlib.Path, sensitive_synthetic_values: list[str]) -> dict:
    if not log_file.is_file():
        return {
            "exists": False,
            "bytes": 0,
            "sha256": None,
            "contains_raw_synthetic_input_or_output": False,
            "metadata_only_observed": True,
        }
    data = log_file.read_bytes()
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        text = ""
    leaked = any(value and value in text for value in sensitive_synthetic_values)
    return {
        "exists": True,
        "bytes": len(data),
        "sha256": _sha256_bytes(data),
        "contains_raw_synthetic_input_or_output": leaked,
        "metadata_only_observed": not leaked,
    }


def _json_bytes(value: dict) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    ).encode("utf-8")


def _status_exit(code: str) -> tuple[str, int]:
    mapping = {
        "PASS": ("PASS", EXIT_PASS),
        "OCR_QUALITY_FAIL": ("FAIL_ACTUAL_ASSERTION", EXIT_ASSERTION),
        "REFINE_SAMPLE_FAIL": ("FAIL_ACTUAL_ASSERTION", EXIT_ASSERTION),
        "RUNTIME_FAIL": ("FAIL_ACTUAL_ASSERTION", EXIT_ASSERTION),
        "BLOCKED_AUTH_REQUIRED": ("BLOCKED_AUTH_REQUIRED", EXIT_AUTH_BLOCKED),
        "SETUP_ERROR": ("SETUP_ERROR", EXIT_SETUP),
        "CANCEL_NOT_EXERCISED": ("CANCEL_NOT_EXERCISED", EXIT_NOT_EXERCISED),
        "UNEXPECTED_ERROR": ("UNEXPECTED_ERROR", EXIT_INTERNAL),
    }
    return mapping.get(code, ("UNEXPECTED_ERROR", EXIT_INTERNAL))


def _run_ocr(context: dict) -> tuple[str, dict, dict]:
    from lawbench.ocr.client395 import Busy, Cancelled, KeyInvalid, Offline, PageRejected, PageSender, ServerError
    from lawbench.ocr.render import render_png

    runtime: Runtime = context["runtime"]
    net_cls = context["net_cls"]
    fixture: pathlib.Path = context["fixture"]
    root: pathlib.Path = context["root"]
    before_threads = _thread_snapshot()
    net = transport = sender = None
    close_errors = []
    started = time.monotonic()
    returned = None
    exception_type = None
    sender_released = False
    png = render_png(fixture, "image", 1)
    png_info = _png_identity(png)

    try:
        net, transport = _new_net(net_cls, runtime)
        sender = PageSender(net, lambda: PUBLIC_MARKER)
        returned = sender.send(png)
    except KeyInvalid:
        exception_type = "KeyInvalid"
    except (Busy, Offline, PageRejected, ServerError, Cancelled) as exc:
        exception_type = type(exc).__name__
    finally:
        sender_released = bool(sender is not None and getattr(sender, "_client", None) is None)
        if net is not None:
            error = _close_client(getattr(net, "client", None))
            if error:
                close_errors.append({"client": "net.client", "error_type": error})
        if transport is not None:
            error = _close_client(transport)
            if error:
                close_errors.append({"client": "transport", "error_type": error})

    elapsed_ms = round((time.monotonic() - started) * 1000, 3)
    http_records = transport.evidence() if transport is not None else []
    post_rows = [
        r for r in http_records if r["method"] == "POST" and r["path"] == "/v1/ocr/page"
    ]
    health_rows = [
        r for r in http_records if r["method"] == "GET" and r["path"] == "/health"
    ]
    auth_status = any(r.get("status") in (401, 403) for r in http_records)
    checks = _ocr_checks(returned.get("markdown", "") if isinstance(returned, dict) else "")
    checks["exactly_one_ocr_post"] = len(post_rows) == 1
    checks["default_query_shape"] = len(post_rows) == 1 and not post_rows[0]["query_present"]
    checks["http_status_200"] = len(post_rows) == 1 and post_rows[0].get("status") == 200
    checks["returned_unclear_nonnegative"] = (
        isinstance(returned, dict)
        and isinstance(returned.get("unclear"), int)
        and returned["unclear"] >= 0
    )
    checks["sender_released_transient_client"] = sender_released
    isolation = _audit_isolation(root, set(sys.modules))

    actual = {
        "ocr_returned": returned,
        "measured_phase_elapsed_ms": elapsed_ms,
        "rendered_png": png_info,
        "fixture": {
            "path": str(fixture),
            "bytes": fixture.stat().st_size,
            "sha256": _sha256_bytes(fixture.read_bytes()),
            "mtime_ns": fixture.stat().st_mtime_ns,
        },
        "http_metadata": http_records,
        "http_counts": {
            "prep_health_get": len(health_rows),
            "prep_ocr_post": len(post_rows),
            "indirect_server_keycheck": "not_locally_measurable; 395 may POST max_tokens=1 to 6000D",
        },
        "server_reported_elapsed_ms": None,
        "server_reported_elapsed_note": "unchanged PageSender returns only markdown and unclear",
        "exception_type": exception_type,
        "close_errors": close_errors,
        "isolation": isolation,
        "threads_before": before_threads,
        "threads_final": _thread_snapshot(),
    }
    failure = exception_type is not None or not all(
        value for key, value in checks.items() if key != "all_values_found"
    ) or not checks["all_values_found"] or not isolation["no_app_native_session_case_task_or_history"]
    if auth_status or exception_type == "KeyInvalid":
        status = "BLOCKED_AUTH_REQUIRED"
    elif failure:
        status = "OCR_QUALITY_FAIL" if exception_type is None else "RUNTIME_FAIL"
    else:
        status = "PASS"
    return status, {"assertions": checks, "actual": actual}, {
        "http_records": http_records,
        "sensitive_synthetic_values": [
            SYNTHETIC_PROMPT,
            returned.get("markdown", "") if isinstance(returned, dict) else "",
        ],
    }


def _run_refine(context: dict) -> tuple[str, dict, dict]:
    from lawbench.pipeline.refine import refine

    runtime: Runtime = context["runtime"]
    before_threads = _thread_snapshot()
    net = transport = None
    close_errors = []
    started = time.monotonic()
    returned = None
    exception_type = None
    try:
        net, transport = _new_net(context["net_cls"], runtime)
        returned = refine(
            net,
            lambda: PUBLIC_MARKER,
            [],
            SYNTHETIC_PROMPT,
            None,
            [FIXED_MATERIAL_NAME],
        )
    except BaseException as exc:
        exception_type = type(exc).__name__
    finally:
        if net is not None:
            error = _close_client(getattr(net, "client", None))
            if error:
                close_errors.append({"client": "net.client", "error_type": error})
        if transport is not None:
            error = _close_client(transport)
            if error:
                close_errors.append({"client": "transport", "error_type": error})

    elapsed_ms = round((time.monotonic() - started) * 1000, 3)
    http_records = transport.evidence() if transport is not None else []
    post_rows = [
        r
        for r in http_records
        if r["method"] == "POST" and r["path"].endswith("/chat/completions")
    ]
    models_rows = [
        r
        for r in http_records
        if r["method"] == "GET" and r["path"].endswith("/models")
    ]
    checks = _refine_checks(returned if isinstance(returned, dict) else {})
    checks["exactly_one_stream_post"] = len(post_rows) == 1
    checks["http_status_200"] = len(post_rows) == 1 and post_rows[0].get("status") == 200
    checks["one_model_probe"] = len(models_rows) == 1
    isolation = _audit_isolation(context["root"], set(sys.modules))
    checks["no_app_native_session_case_task_or_history"] = isolation[
        "no_app_native_session_case_task_or_history"
    ]
    auth_status = any(r.get("status") in (401, 403) for r in http_records)
    returned_reason = returned.get("reason") if isinstance(returned, dict) else None

    actual = {
        "refine_returned": returned,
        "measured_phase_elapsed_ms": elapsed_ms,
        "http_metadata": http_records,
        "http_counts": {
            "llm_models_get": len(models_rows),
            "llm_stream_post": len(post_rows),
        },
        "exception_type": exception_type,
        "close_errors": close_errors,
        "isolation": isolation,
        "threads_before": before_threads,
        "threads_final": _thread_snapshot(),
    }
    if auth_status or returned_reason == "KEY_INVALID":
        status = "BLOCKED_AUTH_REQUIRED"
    elif exception_type is not None:
        status = "RUNTIME_FAIL"
    elif not all(checks.values()):
        status = "REFINE_SAMPLE_FAIL"
    else:
        status = "PASS"
    return status, {"assertions": checks, "actual": actual}, {
        "http_records": http_records,
        "sensitive_synthetic_values": [SYNTHETIC_PROMPT, returned.get("text", "") if isinstance(returned, dict) else ""],
    }


def _run_cancel(context: dict) -> tuple[str, dict, dict]:
    from lawbench.pipeline.llm import Cancelled, LLM

    runtime: Runtime = context["runtime"]
    net_cls = context["net_cls"]
    before_threads = _thread_snapshot()
    cancel_event = threading.Event()
    condition = threading.Condition()
    watch_state = {
        "dispatch": False,
        "stop": False,
        "connected_before_cancel": False,
        "chat_thread_ident": None,
    }
    close_errors = []
    net = transport = recovery_net = recovery_transport = None
    cancellation_record = None
    cancel_exception = None
    product_reply = None
    recovery_reply = None
    recovery_exception = None
    watcher = None
    request_threads = []
    recovery = None
    http_records = []

    def on_chat_dispatch(thread):
        with condition:
            watch_state["dispatch"] = True
            watch_state["chat_thread_ident"] = thread.ident
            condition.notify_all()

    def cancel_watcher():
        with condition:
            while not watch_state["dispatch"] and not watch_state["stop"]:
                condition.wait()
            if watch_state["stop"]:
                return
            connection_event = context["socket_audit"].connection_event(
                watch_state["chat_thread_ident"]
            )
            watch_state["connected_before_cancel"] = connection_event.is_set()
            if not watch_state["stop"]:
                cancel_event.set()

    try:
        net, transport = _new_net(net_cls, runtime, on_chat_dispatch=on_chat_dispatch)
        request_threads.extend(transport.request_thread_evidence())
        watcher = threading.Thread(
            target=cancel_watcher,
            name="owned-cancel-watch",
            daemon=False,
        )
        watcher.start()
        llm = LLM(net, lambda: PUBLIC_MARKER, cancel_event)
        params = {
            "max_tokens": 512,
            "temperature": 0.0,
            "thinking": "关闭",
            "window": "32K",
        }
        try:
            product_reply = llm.chat(
                "你是合成数据连接测试助手。不要回答业务问题。",
                "请只回复：取消测试请求已到达。",
                params,
                "refine-real-synthetic-cancel",
            )
        except Cancelled:
            cancel_exception = "Cancelled"
        except BaseException as exc:
            cancel_exception = type(exc).__name__
        finally:
            with condition:
                watch_state["stop"] = True
                condition.notify_all()
            if watcher is not None:
                watcher.join(WATCHDOG_SECONDS)
        request_threads.extend(transport.request_thread_evidence())
        request_join = _join_threads(request_threads)
        for row in request_join:
            if row["name"] == "pipeline-request":
                cancellation_record = row
                break

        http_records = transport.evidence()
        actual_cancel = (
            cancel_exception == "Cancelled"
            and watch_state["dispatch"]
        )
        recovery = None
        if actual_cancel:
            recovery_started = time.monotonic()
            recovery_event = threading.Event()
            recovery_net, recovery_transport = _new_net(net_cls, runtime)
            recovery_llm = LLM(recovery_net, lambda: PUBLIC_MARKER, recovery_event)
            try:
                recovery_reply = recovery_llm.chat(
                    "你是合成数据连接测试助手。",
                    "请只回复：恢复成功。",
                    {
                        "max_tokens": 16,
                        "temperature": 0.0,
                        "thinking": "关闭",
                        "window": "32K",
                    },
                    "refine-real-synthetic-recovery",
                )
            except BaseException as exc:
                recovery_exception = type(exc).__name__
            recovery_http = recovery_transport.evidence()
            recovery_threads = _join_threads(recovery_transport.request_thread_evidence())
            recovery = {
                "reply": (
                    {
                        "text": recovery_reply.text,
                        "finish_reason": recovery_reply.finish_reason,
                        "elapsed_s": recovery_reply.elapsed_s,
                        "prompt_tokens": recovery_reply.prompt_tokens,
                        "completion_tokens": recovery_reply.completion_tokens,
                    }
                    if recovery_reply is not None
                    else None
                ),
                "exception_type": recovery_exception,
                "measured_phase_elapsed_ms": round(
                    (time.monotonic() - recovery_started) * 1000, 3
                ),
                "http_metadata": recovery_http,
                "request_threads": recovery_threads,
                "threads_clean": all(
                    row["joined_or_already_unwound"] for row in recovery_threads
                ),
            }
        final_threads = _thread_snapshot()
    finally:
        if net is not None:
            error = _close_client(getattr(net, "client", None))
            if error:
                close_errors.append({"client": "cancel-net.client", "error_type": error})
        if transport is not None:
            error = _close_client(transport)
            if error:
                close_errors.append({"client": "cancel-transport", "error_type": error})
        if recovery_net is not None:
            error = _close_client(getattr(recovery_net, "client", None))
            if error:
                close_errors.append({"client": "recovery-net.client", "error_type": error})
        if recovery_transport is not None:
            error = _close_client(recovery_transport)
            if error:
                close_errors.append({"client": "recovery-transport", "error_type": error})

    http_records = transport.evidence() if transport is not None else []
    dispatch_rows = [
        r
        for r in http_records
        if r["method"] == "POST" and r["path"].endswith("/chat/completions")
    ]
    auth_status = any(r.get("status") in (401, 403) for r in http_records)
    recovery_auth_status = bool(
        recovery
        and any(
            r.get("status") in (401, 403)
            for r in recovery.get("http_metadata", [])
        )
    )
    request_thread_clean = bool(
        cancellation_record and cancellation_record["joined_or_already_unwound"]
    )
    recovery_ok = bool(
        recovery
        and recovery["exception_type"] is None
        and isinstance(recovery["reply"], dict)
        and bool(str(recovery["reply"].get("text") or "").strip())
        and recovery["threads_clean"]
    )
    dispatch_observed = watch_state["dispatch"] and len(dispatch_rows) == 1
    chat_thread_ident = watch_state.get("chat_thread_ident")
    request_thread_connected = bool(
        chat_thread_ident is not None
        and context["socket_audit"].connection_event(chat_thread_ident).is_set()
    )
    connected_before_cancel = bool(watch_state["connected_before_cancel"])
    if cancel_exception == "Cancelled" and dispatch_observed:
        cancellation_outcome = (
            "CANCELLED_AFTER_REQUEST_DISPATCH_AND_CONNECT"
            if request_thread_connected
            else "CANCELLED_AFTER_REQUEST_DISPATCH_CONNECTION_NOT_OBSERVED"
        )
    elif cancel_exception is None and product_reply is not None:
        cancellation_outcome = "NOT_EXERCISED_NATURAL_COMPLETION"
    elif dispatch_observed:
        cancellation_outcome = "REQUEST_ENDED_WITHOUT_CANCEL_OBSERVED"
    else:
        cancellation_outcome = "NOT_EXERCISED_NO_CHAT_DISPATCH"
    checks = {
        "one_natural_chat_post_attempted": len(dispatch_rows) == 1,
        "request_dispatch_observed": dispatch_observed,
        "product_raised_cancelled": cancel_exception == "Cancelled",
        "cancellation_started_after_request_dispatch": cancellation_outcome.startswith(
            "CANCELLED_AFTER_REQUEST_DISPATCH"
        ),
        "request_thread_joined_or_unwound": request_thread_clean,
        "watcher_thread_joined": watcher is not None and not watcher.is_alive(),
        "recovery_request_ok": recovery_ok,
        "no_daemon_forget_claim": request_thread_clean,
    }
    isolation = _audit_isolation(context["root"], set(sys.modules))
    checks["no_app_native_session_case_task_or_history"] = isolation[
        "no_app_native_session_case_task_or_history"
    ]
    actual = {
        "cancellation_outcome": cancellation_outcome,
        "request_exception_type": cancel_exception,
        "request_dispatch_observed": dispatch_observed,
        "chat_socket_connected_before_cancel": connected_before_cancel,
        "chat_socket_connected_by_unwind": request_thread_connected,
        "product_reply_before_cancel": (
            {
                "text": product_reply.text,
                "finish_reason": product_reply.finish_reason,
                "elapsed_s": product_reply.elapsed_s,
            }
            if product_reply is not None
            else None
        ),
        "request_thread": cancellation_record,
        "recovery": recovery,
        "http_metadata": http_records,
        "close_errors": close_errors,
        "isolation": isolation,
        "threads_before": before_threads,
        "threads_final": final_threads if "final_threads" in locals() else _thread_snapshot(),
        "server_side_499_or_vllm_abort_claimed": False,
    }
    assertion = {"assertions": checks, "actual": actual}
    audit = {
        "http_records": http_records,
        "sensitive_synthetic_values": [
            "请只回复：取消测试请求已到达。",
            "请只回复：恢复成功。",
            product_reply.text if product_reply is not None else "",
            recovery_reply.text if recovery_reply is not None else "",
        ],
    }
    if auth_status or recovery_auth_status:
        return "BLOCKED_AUTH_REQUIRED", assertion, audit
    if cancel_exception not in (None, "Cancelled"):
        return "RUNTIME_FAIL", assertion, audit
    if cancellation_outcome in {"NOT_EXERCISED_NATURAL_COMPLETION", "NOT_EXERCISED_NO_CHAT_DISPATCH"}:
        return "CANCEL_NOT_EXERCISED", assertion, audit
    if cancellation_outcome == "REQUEST_ENDED_WITHOUT_CANCEL_OBSERVED" or not request_thread_clean:
        return "RUNTIME_FAIL", assertion, audit
    if not recovery_ok:
        return "RUNTIME_FAIL", assertion, audit
    if not all(checks.values()):
        return "RUNTIME_FAIL", assertion, audit
    return "PASS", assertion, audit


def _artifact_payload(status: str, phase: str, result: dict, error_code: str | None = None) -> dict:
    state, exit_code = _status_exit(status)
    return {
        "artifact_schema": ARTIFACT_SCHEMA,
        "phase": phase,
        "status": state,
        "exit_code": exit_code,
        "error_code": error_code,
        "assertion_passed": state == "PASS",
        "result": result,
    }


def main() -> int:
    parser = _ArgumentParser(add_help=True)
    parser.add_argument("--parent", required=True)
    parser.add_argument("--phase", required=True, choices=("ocr", "refine", "cancel"))
    try:
        args = parser.parse_args()
        root = _validate_root(args.parent)
        targets, baseline = _validate_fixed_inputs()
    except SetupError as exc:
        phase = getattr(locals().get("args", None), "phase", None)
        summary = {
            "artifact_schema": ARTIFACT_SCHEMA,
            "phase": phase,
            "status": "SETUP_ERROR",
            "exit_code": EXIT_SETUP,
            "error_code": exc.code,
            "assertion_passed": False,
            "assertions": {},
            "artifacts": ["result.json", "summary.json", "metadata.json"],
        }
        result = {
            "artifact_schema": ARTIFACT_SCHEMA,
            "phase": phase,
            "status": "SETUP_ERROR",
            "exit_code": EXIT_SETUP,
            "error_code": exc.code,
            "assertion_passed": False,
            "result": {"assertions": {}, "actual": {}},
        }
        metadata = {
            "artifact_schema": ARTIFACT_SCHEMA,
            "phase": phase,
            "status": "SETUP_ERROR",
            "exit_code": EXIT_SETUP,
            "error_code": exc.code,
            "started_at_utc": _utc_now(),
            "ended_at_utc": _utc_now(),
            "baseline_before": [],
            "baseline_after": [],
            "source_final_ok": False,
            "fixture_unchanged": False,
            "environment_restored": True,
            "blockers_restored": True,
            "socket_guard_restored": True,
            "logs_closed": True,
            "observations": [
                "Fixed-input/setup validation stopped before product import and network access."
            ],
        }
        if "root" in locals() and isinstance(root, pathlib.Path) and root.is_dir():
            result_bytes = _json_bytes(result)
            summary_bytes = _json_bytes(summary)
            metadata["artifact_sha256"] = {
                "result.json": _sha256_bytes(result_bytes),
                "summary.json": _sha256_bytes(summary_bytes),
            }
            (root / "result.json").write_bytes(result_bytes)
            (root / "summary.json").write_bytes(summary_bytes)
            (root / "metadata.json").write_bytes(_json_bytes(metadata))
        sys.stdout.write(json.dumps(summary, ensure_ascii=False, sort_keys=True) + "\n")
        return EXIT_SETUP

    started_at = _utc_now()
    private = PrivateEnvironment(root)
    blockers = BlockerState()
    socket_audit = SocketAudit()
    runtime = None
    net_cls = None
    logs = None
    log_dir = None
    log_file = root / "private" / "appdata" / "roaming" / "logs" / "service.log"
    fixture = pathlib.Path(targets["fixture"])
    fixture_before = {
        "bytes": fixture.stat().st_size,
        "sha256": _sha256_bytes(fixture.read_bytes()),
        "mtime_ns": fixture.stat().st_mtime_ns,
    }
    status = "UNEXPECTED_ERROR"
    error_code = None
    phase_result = {"assertions": {}, "actual": {}}
    audit_values: list[str] = [SYNTHETIC_PROMPT]
    thread_before: dict | None = None
    close_errors: list[dict] = []
    environment_restored = False
    blockers_restored = False
    blockers_installed = False
    socket_guard_restored = False
    socket_guard_installed = False
    logs_closed = False
    try:
        private.__enter__()
        blockers.install()
        blockers_installed = True
        socket_audit.install()
        socket_guard_installed = True
        sys.path.insert(0, str(SERVICE_DIR))

        import httpx  # noqa: E402
        from lawbench import logs as lawbench_logs  # noqa: E402
        from lawbench.net import Net  # noqa: E402

        logs = lawbench_logs
        runtime = Runtime(httpx)
        net_cls = Net
        log_dir = logs.setup(private.paths["appdata"])
        log_file = pathlib.Path(log_dir) / "service.log"
        thread_before = _thread_snapshot()
        context = {
            "runtime": runtime,
            "net_cls": net_cls,
            "root": root,
            "fixture": fixture,
            "socket_audit": socket_audit,
        }
        runners = {"ocr": _run_ocr, "refine": _run_refine, "cancel": _run_cancel}
        status, phase_result, phase_audit = runners[args.phase](context)
        audit_values.extend(phase_audit.get("sensitive_synthetic_values", []))
    except SetupError as exc:
        status = "SETUP_ERROR"
        error_code = exc.code
    except BaseException as exc:
        status = "UNEXPECTED_ERROR"
        error_code = type(exc).__name__
    finally:
        if logs is not None:
            try:
                logs.close()
                logs_closed = True
            except BaseException as exc:
                close_errors.append({"client": "logs", "error_type": type(exc).__name__})
        socket_audit.restore()
        socket_guard_restored = socket_guard_installed and not socket_audit.installed
        blockers.restore()
        blockers_restored = blockers_installed and not blockers.installed
        try:
            private.__exit__(None, None, None)
            environment_restored = private.restored
        except BaseException as exc:
            close_errors.append({"client": "environment", "error_type": type(exc).__name__})

    try:
        fixture_after = {
            "bytes": fixture.stat().st_size,
            "sha256": _sha256_bytes(fixture.read_bytes()),
            "mtime_ns": fixture.stat().st_mtime_ns,
        }
    except BaseException as exc:
        fixture_after = {
            "error_type": type(exc).__name__,
            "unchanged": False,
        }
    try:
        _, baseline_after = _validate_fixed_inputs()
        source_final_ok = all(row["matches"] for row in baseline_after)
        fixed_input_final_ok = True
    except SetupError as exc:
        baseline_after = []
        source_final_ok = False
        fixed_input_final_ok = False
        close_errors.append({"client": "final_baseline", "error_type": exc.code})

    log_audit = _log_audit(log_file, audit_values)
    if status == "PASS" and (
        not source_final_ok
        or not fixed_input_final_ok
        or not environment_restored
        or not blockers_restored
        or not socket_guard_restored
        or not logs_closed
        or fixture_after != fixture_before
        or not log_audit["metadata_only_observed"]
        or close_errors
    ):
        status = "RUNTIME_FAIL"

    final_state, exit_code = _status_exit(status)
    result_artifact = _artifact_payload(status, args.phase, phase_result, error_code)
    summary = {
        "artifact_schema": ARTIFACT_SCHEMA,
        "phase": args.phase,
        "status": final_state,
        "exit_code": exit_code,
        "error_code": error_code,
        "assertion_passed": final_state == "PASS",
        "assertions": phase_result.get("assertions", {}),
        "artifacts": ["result.json", "summary.json", "metadata.json"],
    }
    metadata = {
        "artifact_schema": ARTIFACT_SCHEMA,
        "phase": args.phase,
        "status": final_state,
        "exit_code": exit_code,
        "started_at_utc": started_at,
        "ended_at_utc": _utc_now(),
        "targets_sha256": TARGETS_SHA256,
        "fixed_inputs_sha256": FIXED_INPUTS_SHA256,
        "authorization_sha256": AUTHORIZATION_SHA256,
        "baseline_before": baseline,
        "baseline_after": baseline_after,
        "source_final_ok": source_final_ok,
        "fixture_before": fixture_before,
        "fixture_after": fixture_after,
        "fixture_unchanged": fixture_after == fixture_before,
        "private_paths": {
            key: path.relative_to(root).as_posix() for key, path in private.paths.items()
        },
        "environment_restored": environment_restored,
        "blockers_restored": blockers_restored,
        "blocked_keyring_and_subprocess_spawn": blockers_installed and blockers_restored,
        "socket_guard_installed": socket_guard_installed,
        "socket_guard_restored": socket_guard_restored,
        "socket_audit": socket_audit.evidence(),
        "logs_closed": logs_closed,
        "product_log": log_audit,
        "close_errors": close_errors,
        "threads_before_phase_imports": thread_before,
        "forbidden_module_prefixes_absent": sorted(FORBIDDEN_MODULE_PREFIXES),
        "observations": [
            "HTTP metadata excludes headers, bodies, credentials, and tokens.",
            "OCR server-side keycheck and cancel server-side outcome are not locally measurable.",
            "The PUBLIC marker is synthetic test data, not proof of credential validity or security acceptance.",
        ],
    }
    result_bytes = _json_bytes(result_artifact)
    summary_bytes = _json_bytes(summary)
    metadata["artifact_sha256"] = {
        "result.json": _sha256_bytes(result_bytes),
        "summary.json": _sha256_bytes(summary_bytes),
    }
    metadata_bytes = _json_bytes(metadata)
    (root / "result.json").write_bytes(result_bytes)
    (root / "summary.json").write_bytes(summary_bytes)
    (root / "metadata.json").write_bytes(metadata_bytes)
    sys.stdout.write(json.dumps(summary, ensure_ascii=False, sort_keys=True) + "\n")
    return exit_code


if __name__ == "__main__":
    raise SystemExit(main())
