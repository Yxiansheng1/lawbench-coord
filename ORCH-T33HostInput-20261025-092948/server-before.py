#!/usr/bin/env python3
"""T33 native HTTP isolation entry; prepared only, not run during preparation.

After root review, this runs current-B ``create_app`` behind one IPv4 loopback
listener. Product auth, contracts, routes, Materials, Registry and Gate stay
native. Its lifespan is never started, and no web/forward listener is created.
"""
from __future__ import annotations

import argparse
import asyncio
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
RUN_NAME = re.compile(r"^T33-http-[0-9]{8}-[0-9]{6}$")
FAKE_TOKEN = "T33-fixture-token-never-real-0123456789abcdef"
FAKE_LOCAL_KEY = "T33-fixture-local-key-never-real"
FAKE_EXTERNAL_KEY = "T33-fixture-external-key-never-real"
DEFAULT_SECONDS, MAX_SECONDS, MAX_BODY = 60, 90, 64 * 1024
REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
SERVERS = {
    "llm_base_url": "http://127.0.0.1:65001/v1",
    "prep_base_url": "http://127.0.0.1:65002",
    "llm_alt_base_url": "http://127.0.0.1:65003/v1",
    "prep_alt_base_url": "http://127.0.0.1:65004",
}
EXTERNAL_OFF = {
    "enabled": False, "base_url": None, "model": None,
    "context_window": None, "supports_tools": True,
}
ROUTES = frozenset({
    ("GET", "/health"), ("GET", "/api/case/recent"), ("GET", "/api/settings"),
    ("GET", "/api/capsules"), ("GET", "/api/materials"),
    ("POST", "/api/case/open"), ("POST", "/api/materials/scan"),
    ("POST", "/api/materials/import"),
})
CASE_ROUTES = frozenset({"/api/materials", "/api/materials/scan", "/api/materials/import"})


class Deny(RuntimeError):
    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


def _norm(path: str | os.PathLike[str]) -> str:
    """Reviewed T33 rule: only normalize standard drive/UNC long-path aliases."""
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
    return stat.S_ISLNK(info.st_mode) or bool(getattr(info, "st_file_attributes", 0) & REPARSE)


def _no_reparse(path: pathlib.Path, *, allow_missing_tail: bool = True) -> None:
    current = pathlib.PureWindowsPath(path).parts[0]
    for part in pathlib.PureWindowsPath(path).parts[1:]:
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


def _write_json(path: pathlib.Path, value: Any, mode: str = "x") -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, mode, encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")


def _validate_root(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute() or _norm(root.parent) != _norm(RUNS_ROOT):
        raise Deny("root_must_be_direct_child_of_runs")
    if not RUN_NAME.fullmatch(root.name):
        raise Deny("bad_run_name")
    if os.path.lexists(root):
        raise Deny("root_exists")
    _no_reparse(root)
    return root


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
            outbound = sum(self.counts.get(name, 0) for name in (
                "socket.connect", "socket.connect_ex",
                "socket.create_connection", "httpx_mock_transport",
            ))
            return {"counts": dict(sorted(self.counts.items())),
                    "violations": list(self.events),
                    "unexpected_outbound_violations": outbound}


def _install_keyring(counts: dict[str, int], guard: Guard, lock: threading.Lock) -> None:
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

    socket.socket.connect, socket.socket.connect_ex = no_connect, no_connect_ex
    socket.create_connection, socket.socketpair = no_create, counted_pair
    threading.Thread.start, subprocess.Popen, os.system = guarded_thread, no_popen, no_system

    def restore() -> None:
        socket.socket.connect, socket.socket.connect_ex = socket_connect, connect_ex
        socket.create_connection, socket.socketpair = create_connection, socketpair
        threading.Thread.start, subprocess.Popen, os.system = thread_start, popen, system

    return restore


def _private_env(root: pathlib.Path) -> dict[str, pathlib.Path]:
    private = {name: root / "private" / name
               for name in ("home", "appdata", "system", "temp")}
    for path in private.values():
        path.mkdir(parents=True, exist_ok=False)
    for name in list(os.environ):
        upper = name.upper()
        if upper.startswith("LB_") or any(word in upper for word in ("KEY", "TOKEN", "PASSWORD", "SECRET")):
            os.environ.pop(name, None)
    for name in ("OneDrive", "OneDriveCommercial", "OneDriveConsumer"):
        os.environ.pop(name, None)
    os.environ.update({
        "HOME": str(private["home"]), "USERPROFILE": str(private["home"]),
        "APPDATA": str(private["appdata"]), "LOCALAPPDATA": str(private["appdata"]),
        "TEMP": str(private["temp"]), "TMP": str(private["temp"]),
        "TMPDIR": str(private["temp"]), "PYTHONDONTWRITEBYTECODE": "1",
        "PYTHONPATH": str(SERVICE_DIR),
    })
    sys.dont_write_bytecode = True
    return private


def _settings() -> dict[str, Any]:
    return {
        "v": 1, "servers": dict(SERVERS),
        "defaults": {"thinking": "中", "window": "64K", "max_tokens": 16384, "temperature": 0.6},
        "skill_presets": {}, "templates": {"文书": None, "合同": None},
        "ocr_fallback_llm": False, "profile": {"lawyer_name": None},
        "office": {"dir": None, "invoice_buyer": None}, "converter": "auto",
        "external_llm": dict(EXTERNAL_OFF),
    }


def _prepare_files(root: pathlib.Path, appdata: pathlib.Path) -> dict[str, Any]:
    case_path, ready = root / "case", root / "input" / "ready"
    case_path.mkdir(parents=True, exist_ok=False)
    ready.mkdir(parents=True, exist_ok=False)
    settings_path = appdata / "settings.json"
    _write_json(settings_path, _settings())
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
    return {"case": case_path, "ready": ready, "copy": copy, "settings": settings_path,
            "fixture": {"source_path": str(FIXTURE), "source_bytes": source_bytes,
                        "source_sha256": source_sha, "copy_path": str(copy),
                        "copy_bytes": FIXTURE_BYTES, "copy_sha256": FIXTURE_SHA256}}


def _sources() -> dict[str, Any]:
    result = {}
    for base in (SERVICE_DIR, CONTRACTS_DIR):
        for path in sorted(base.rglob("*")):
            if (path.is_file() and "__pycache__" not in path.parts and
                    path.suffix.lower() in {".py", ".json", ".sql", ".toml"}):
                relative = path.relative_to(PRODUCT_ROOT).as_posix()
                result[relative] = {"sha256": _sha256(path), "bytes": path.stat().st_size}
    entry = pathlib.Path(__file__).resolve()
    result["entry/server.py"] = {"sha256": _sha256(entry), "bytes": entry.stat().st_size}
    return result


def _targets(servers: dict[str, str]) -> set[tuple[str, int]]:
    return {(urlsplit(value).hostname or "", urlsplit(value).port or 80)
            for value in servers.values()}


def _assert_wiring(lb: Any, appdata: pathlib.Path) -> None:
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
    body = json.dumps({"error": {"code": code, "message": "outside T33 reviewed boundary"}},
                      separators=(",", ":")).encode()
    await send({"type": "http.response.start", "status": status,
                "headers": [(b"content-type", b"application/json"),
                            (b"content-length", str(len(body)).encode())]})
    await send({"type": "http.response.body", "body": body, "more_body": False})


class Firewall:
    def __init__(self, app, *, case: pathlib.Path, ready: pathlib.Path,
                 ledger: pathlib.Path) -> None:
        self.app, self.case, self.ready, self.ledger = app, case, ready, ledger
        self.lock, self.records, self.case_id = threading.Lock(), [], None
        with open(ledger, "x", encoding="utf-8"):
            pass

    def _record(self, method, path, status, disposition, started) -> None:
        item = {"method": method, "path": path, "status": status,
                "disposition": disposition,
                "elapsed_ms": int((time.monotonic() - started) * 1000)}
        with self.lock:
            self.records.append(item)
            with open(self.ledger, "a", encoding="utf-8", newline="\n") as stream:
                stream.write(json.dumps(item, separators=(",", ":")) + "\n")

    def _policy(self, path: str, data: Any, query: bytes) -> str | None:
        if path == "/api/case/open" and isinstance(data, dict) and isinstance(data.get("path"), str):
            try:
                if _norm(data["path"]) != _norm(self.case):
                    return "OPEN_PATH_OUTSIDE_RUN"
            except (OSError, ValueError, TypeError):
                return "OPEN_PATH_OUTSIDE_RUN"
        if path == "/api/materials/import" and isinstance(data, dict) and isinstance(data.get("paths"), list):
            for value in data["paths"]:
                if isinstance(value, str):
                    if not _within(self.ready, value):
                        return "IMPORT_PATH_OUTSIDE_RUN"
                    try:
                        _no_reparse(pathlib.Path(value))
                    except Deny:
                        return "IMPORT_PATH_REPARSE"
        if path in CASE_ROUTES:
            if path == "/api/materials":
                values = parse_qs(query.decode("latin-1"), keep_blank_values=True).get("case_id", [])
                if len(values) > 1:
                    return "CASE_ID_AMBIGUOUS"
                value = values[0] if values else None
            else:
                value = data.get("case_id") if isinstance(data, dict) else None
            if isinstance(value, str) and (self.case_id is None or value != self.case_id):
                return "CASE_ID_OUTSIDE_RUN"
        return None

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
                self._record(method, path, None, "disconnected_before_body", started)
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
            elif message["type"] == "http.response.body" and path == "/api/case/open":
                captured.extend(message.get("body", b"")[:max(0, MAX_BODY - len(captured))])
            await send(message)

        try:
            await self.app(scope, receive, observed)
        finally:
            self._record(method, path, status, "native_app", started)
        if path == "/api/case/open" and status == 200:
            response = _json(bytes(captured))
            if isinstance(response, dict) and response.get("ok") is True:
                value = response.get("value")
                if isinstance(value, dict) and isinstance(value.get("case_id"), str):
                    self.case_id = value["case_id"]

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
    sockets = [sock for item in server.servers for sock in item.sockets if sock.fileno() >= 0]
    if len(sockets) != 1:
        raise Deny("listener_count")
    sock = sockets[0]
    if sock.family != socket.AF_INET or sock.getsockname()[0] != "127.0.0.1":
        raise Deny("listener_not_ipv4_loopback")
    return sock


def _closed(server: uvicorn.Server | None) -> bool:
    if server is None:
        return True
    return all(sock.fileno() < 0 for item in server.servers for sock in item.sockets)


async def _serve(root: pathlib.Path, seconds: int) -> tuple[str, str]:
    guard, started_at = Guard(), datetime.now().astimezone()
    local_count = {"local": 0, "external": 0, "keyring": 0}
    cred_lock = threading.Lock()
    restore = logs = lb = server = task = firewall = None
    private, prepared, source_before = {}, {}, {}
    net_closed = logs_closed = False
    failure, port = None, None
    ready_path, final_path = root / "ready.json", root / "final-metadata.json"

    def local_key():
        with cred_lock:
            local_count["local"] += 1
        return FAKE_LOCAL_KEY

    def external_key():
        with cred_lock:
            local_count["external"] += 1
        return FAKE_EXTERNAL_KEY

    try:
        private = _private_env(root)
        prepared = _prepare_files(root, private["appdata"])
        source_before = _sources()
        _install_keyring(local_count, guard, cred_lock)
        platform.uname = lambda: platform.uname_result("Windows", "T33-SYNTHETIC", "", "", "")

        guard.phase = "product_import"
        restore = _install_guards(guard)
        sys.path.insert(0, str(SERVICE_DIR))
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
        # Isolate unrelated host discovery; Gate, Materials, Registry and parsing stay native.
        gate_module._registry_onedrive_folders = lambda: []
        lo_module.find_soffice = lambda: None

        def no_convert(*_args, **_kwargs):
            guard.deny("office_conversion")
            raise Deny("office_conversion")

        materials_module.Converter.convert = no_convert
        guard.phase = "app_create"
        config = Config(token=FAKE_TOKEN, appdata=private["appdata"], port=0,
                        forward_port=65005, skills_dirs=[SKILLS_DIR],
                        contracts_dir=CONTRACTS_DIR, validate_responses=True)

        def refuse(_request):
            guard.deny("httpx_mock_transport")
            raise Deny("httpx_mock_transport")

        native = create_app(config, key_getter=local_key, external_key_getter=external_key,
                            transport=httpx.MockTransport(refuse))
        lb = native.state.lb
        _assert_wiring(lb, private["appdata"])
        with cred_lock:
            if local_count["local"] or local_count["external"]:
                raise Deny("credential_getter_at_startup")
        firewall = Firewall(native, case=prepared["case"], ready=prepared["ready"],
                            ledger=root / "requests.ndjson")
        server = uvicorn.Server(uvicorn.Config(
            app=firewall, host="127.0.0.1", port=0, workers=1, lifespan="off",
            ws="none", loop="asyncio", http="h11", access_log=False,
            log_level="warning", log_config=None, server_header=False,
            date_header=False, proxy_headers=False,
        ))
        guard.phase = "server_start"
        task = asyncio.create_task(server.serve())
        await _started(server, task)
        port = int(_listener(server).getsockname()[1])
        _write_json(ready_path, {
            "status": "ready", "host": "127.0.0.1", "port": port,
            "pid": os.getpid(),
            "started_at": datetime.now().astimezone().isoformat(timespec="milliseconds"),
            "fixture_path": str(prepared["copy"]), "fixture_bytes": FIXTURE_BYTES,
            "fixture_sha256": FIXTURE_SHA256, "case_path": str(prepared["case"]),
            "ready_input": str(prepared["ready"]), "fake_token": FAKE_TOKEN,
            "expected_head": EXPECTED_HEAD, "source_sha256": source_before,
        })
        guard.phase = "serving"
        deadline = asyncio.get_running_loop().time() + seconds
        while asyncio.get_running_loop().time() < deadline:
            if task.done():
                await task
                raise Deny("server_exited_early")
            await asyncio.sleep(min(0.25, max(0.0, deadline - asyncio.get_running_loop().time())))
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

    guard_state, requests = guard.snapshot(), firewall.snapshot() if firewall else []
    with cred_lock:
        credential_state = {
            "local_getter_calls": local_count["local"],
            "external_getter_calls": local_count["external"],
            "keyring_rejections": local_count["keyring"],
        }
    source_measured = bool(source_before)
    source_after = _sources() if source_measured else {}
    source_unchanged = source_before == source_after if source_measured else None
    fixture_unchanged = (
        FIXTURE.is_file() and FIXTURE.stat().st_size == FIXTURE_BYTES
        and _sha256(FIXTURE) == FIXTURE_SHA256
    ) if prepared else None
    task_done = bool(task is not None and task.done())
    listener_closed = _closed(server)
    if (guard_state["violations"] or any(credential_state.values()) or
            source_unchanged is False or fixture_unchanged is False) and failure is None:
        failure = "guard_credential_or_source_violation"
    if task is not None and not (task_done and listener_closed and net_closed and logs_closed) and failure is None:
        failure = "cleanup_incomplete"
    finished = datetime.now().astimezone()
    final = {
        "outcome": "COMPLETED_FOR_ROOT_REVIEW" if failure is None else "FAILED_FOR_ROOT_REVIEW",
        "not_acceptance": "Not GUI, Host, OCR, model, packaging or T33 acceptance.",
        "root": str(root), "expected_head": EXPECTED_HEAD,
        "started_at": started_at.isoformat(timespec="milliseconds"),
        "finished_at": finished.isoformat(timespec="milliseconds"),
        "requested_seconds": seconds,
        "elapsed_seconds": round((finished - started_at).total_seconds(), 3),
        "failure_code": failure, "private_paths": {k: str(v) for k, v in private.items()},
        "fixture": prepared.get("fixture"), "fixture_source_unchanged": fixture_unchanged,
        "source_unchanged": source_unchanged,
        "listener": {"host": "127.0.0.1", "requested_port": 0, "actual_port": port,
                     "ipv4_only": True, "websocket": False, "forward_listener": False},
        "native_app": {"factory": "lawbench.app.create_app(Config(...))",
                       "lifespan": "off", "auth": "native middleware",
                       "routes_contracts": "native", "materials_registry_gate": "native",
                       "allowed_routes": sorted([list(item) for item in ROUTES])},
        "credentials": credential_state, "guard": guard_state, "requests": requests,
        "lifecycle": {
            "ocr_threads": len(getattr(getattr(lb, "ocr", None), "_threads", [])),
            "ocr_start_called": False, "ocr_stop_called": False,
            "retainer_process_started": getattr(getattr(lb, "retainer", None), "_proc", None) is not None,
            "retainer_close_called": False, "product_lifespan_started": False,
        },
        "cleanup": {"server_should_exit": True,
                    "server_task_done": task_done,
                    "listener_closed": listener_closed, "net_client_closed": net_closed,
                    "product_logs_closed": logs_closed,
                    "event_loop_closed": "updated after loop.close()", "root_retained": True},
        "service_log": str((private.get("appdata") or root / "private" / "appdata")
                           / "logs" / "service.log"),
        "request_log": str(root / "requests.ndjson"),
    }
    _write_json(final_path, final)
    return str(final_path), failure or ""


def _mark_loop_closed(path: pathlib.Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    data["cleanup"]["event_loop_closed"] = True
    pending = path.with_name(path.name + ".pending")
    _write_json(pending, data)
    os.replace(pending, path)


def main() -> int:
    parser = argparse.ArgumentParser(description="T33 bounded native HTTP entry")
    parser.add_argument("--root", required=True, help="new direct child of this preparation's runs")
    parser.add_argument("--seconds", type=int, default=DEFAULT_SECONDS)
    args = parser.parse_args()
    if not 1 <= args.seconds <= MAX_SECONDS:
        parser.error(f"--seconds must be 1..{MAX_SECONDS}")
    root = _validate_root(args.root)
    root.mkdir(parents=True, exist_ok=False)
    loop = asyncio.new_event_loop()  # Proactor channel exists before product/guards.
    asyncio.set_event_loop(loop)
    final_path, failure = None, ""
    try:
        name, failure = loop.run_until_complete(_serve(root, args.seconds))
        final_path = pathlib.Path(name)
    except BaseException as exc:
        failure = getattr(exc, "code", type(exc).__name__)
        _write_json(root / "run-error.json", {
            "outcome": "FAILED_FOR_ROOT_REVIEW", "exception_type": type(exc).__name__,
            "guard_code": getattr(exc, "code", None), "root_retained": True,
        })
    finally:
        try:
            loop.run_until_complete(loop.shutdown_asyncgens())
        except BaseException:
            pass
        loop.close()
        asyncio.set_event_loop(None)
    if final_path and final_path.is_file():
        _mark_loop_closed(final_path)
        print(final_path)
    return 0 if not failure else 2


if __name__ == "__main__":
    raise SystemExit(main())
