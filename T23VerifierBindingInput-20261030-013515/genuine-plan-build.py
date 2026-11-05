#!/usr/bin/env python3
"""One finite T23 genuine-plan archive generation for root execution only.

The author of this helper must not run it. Root supplies one new short root and
one new report path. The helper copies the exact approved 30-file synthetic
case into the private root, opens the copied case through the real in-process
ASGI route, and calls the real archive-build route once with the approved
13-field confirmed plan. It never creates a task, session, model request,
credential access, TCP listener, or outbound HTTP request.
"""
from __future__ import annotations

import sys

sys.dont_write_bytecode = True

import argparse
import asyncio
import contextlib
import copy
import hashlib
import json
import os
import pathlib
import re
import secrets
import shutil
import socket
import ssl
import stat
import zipfile
from datetime import datetime, timezone
from typing import Any, Awaitable, Callable
from xml.etree import ElementTree as ET

import httpx
import docx as pydocx
from pypdf import PdfReader


EVIDENCE_DIR = pathlib.Path(__file__).resolve().parent
HELPER_PATH = pathlib.Path(__file__).resolve()
LITERAL_INPUTS = EVIDENCE_DIR / "literal-inputs.json"
LITERAL_INPUTS_BYTES = 13_920
LITERAL_INPUTS_SHA256 = "faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e"

B_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
B_SERVICE = B_ROOT / "service"
B_SKILLS = B_ROOT / "skills"
B_CONTRACTS = B_ROOT / "contracts"
ORDER_PATH = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord"
    r"\B-T23-genuine-plan-build-order-20261030-011948.md"
)

ROOT_NAME = re.compile(r"^lb-t23-[0-9a-f]{8}$")
CASE_ID = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
TASK_ID = re.compile(r"^T-[0-9]{14}-[0-9a-f]{4}$")
REPARSE_FLAG = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
MAX_REQUEST_BODY = 4 * 1024 * 1024
MAX_RESPONSE_BODY = 8 * 1024 * 1024
PAGE_LABEL = re.compile(r"第(\d+)页共(\d+)页")
WHITESPACE = re.compile(r"\s+")
DOCX_EXTERNAL_PREFIXES = ("http:", "https:", "ftp:", "file:", "\\\\")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def is_reparse(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except FileNotFoundError:
        return False
    if stat.S_ISLNK(info.st_mode):
        return True
    return bool(getattr(info, "st_file_attributes", 0) & REPARSE_FLAG)


def ordinary_file(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except OSError:
        return False
    return (
        stat.S_ISREG(info.st_mode)
        and not stat.S_ISLNK(info.st_mode)
        and not (getattr(info, "st_file_attributes", 0) & REPARSE_FLAG)
    )


def ordinary_dir(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except OSError:
        return False
    return (
        stat.S_ISDIR(info.st_mode)
        and not stat.S_ISLNK(info.st_mode)
        and not (getattr(info, "st_file_attributes", 0) & REPARSE_FLAG)
    )


def assert_plain_path_chain(path: pathlib.Path) -> None:
    current = path
    while True:
        if is_reparse(current):
            raise RuntimeError(f"reparse component refused: {current.name}")
        if current.parent == current:
            return
        current = current.parent


def normalized_rel(path: pathlib.Path, root: pathlib.Path) -> str:
    return path.relative_to(root).as_posix()


def normalized_text(text: str) -> str:
    return WHITESPACE.sub("", text)


def snapshot_files(root: pathlib.Path) -> dict[str, dict[str, Any]]:
    if not ordinary_dir(root):
        raise RuntimeError("inventory root is not an ordinary directory")
    assert_plain_path_chain(root)
    rows: dict[str, dict[str, Any]] = {}
    stack = [root]
    while stack:
        directory = stack.pop()
        try:
            entries = list(os.scandir(directory))
        except OSError:
            raise RuntimeError("inventory directory is unreadable") from None
        for entry in entries:
            path = pathlib.Path(entry.path)
            try:
                info = entry.stat(follow_symlinks=False)
            except OSError:
                raise RuntimeError("inventory entry is unreadable") from None
            if stat.S_ISLNK(info.st_mode) or (
                getattr(info, "st_file_attributes", 0) & REPARSE_FLAG
            ):
                raise RuntimeError("inventory contains a link or reparse point")
            if stat.S_ISDIR(info.st_mode):
                stack.append(path)
            elif stat.S_ISREG(info.st_mode):
                relative = normalized_rel(path, root)
                rows[relative] = {
                    "bytes": info.st_size,
                    "sha256": sha256_file(path),
                    "mtime_ns": str(info.st_mtime_ns),
                }
            else:
                raise RuntimeError("inventory contains a non-ordinary entry")
    return rows


def compare_inventory(
    actual: dict[str, dict[str, Any]],
    expected_rows: list[dict[str, Any]],
    label: str,
) -> None:
    expected: dict[str, dict[str, Any]] = {}
    for row in expected_rows:
        relative = row.get("rel_path")
        if (
            not isinstance(relative, str)
            or not relative
            or relative in expected
            or pathlib.PurePosixPath(relative).is_absolute()
            or ".." in pathlib.PurePosixPath(relative).parts
        ):
            raise RuntimeError(f"{label} inventory descriptor is invalid")
        expected[relative] = row
    if set(actual) != set(expected):
        raise RuntimeError(f"{label} has missing or unknown files")
    for relative, wanted in expected.items():
        got = actual[relative]
        if (
            got["bytes"] != wanted.get("bytes")
            or got["sha256"] != wanted.get("sha256")
            or got["mtime_ns"] != wanted.get("mtime_ns")
        ):
            raise RuntimeError(f"{label} identity changed: {relative}")


def verify_literal_inputs() -> dict[str, Any]:
    if (
        not ordinary_file(LITERAL_INPUTS)
        or LITERAL_INPUTS.stat().st_size != LITERAL_INPUTS_BYTES
        or sha256_file(LITERAL_INPUTS) != LITERAL_INPUTS_SHA256
    ):
        raise RuntimeError("literal-inputs.json is not the approved descriptor")
    data = json.loads(LITERAL_INPUTS.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise RuntimeError("approved descriptor is not an object")
    if data.get("model_or_Key_required") is not False:
        raise RuntimeError("approved descriptor unexpectedly requires a model or key")
    if data.get("production_code_changes_allowed") is not False:
        raise RuntimeError("approved descriptor unexpectedly allows product edits")
    rows = data.get("source_case_inventory")
    if not isinstance(rows, list) or len(rows) != 30:
        raise RuntimeError("approved source inventory is not exactly 30 files")
    if data.get("B_source_count") != 346 or len(data.get("resources", [])) != 13:
        raise RuntimeError("approved resource counts changed")
    return data


def verify_resources(descriptor: dict[str, Any]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for row in descriptor["resources"]:
        path = pathlib.Path(row["path"])
        if (
            not ordinary_file(path)
            or path.stat().st_size != row["bytes"]
            or sha256_file(path) != row["sha256"]
            or str(path.stat().st_mtime_ns) != row["mtime_ns"]
        ):
            raise RuntimeError(f"reviewed resource changed: {path.name}")
        records.append(
            {
                "path": str(path),
                "bytes": row["bytes"],
                "sha256": row["sha256"],
            }
        )
    return records


def verify_source_pin_manifest(descriptor: dict[str, Any]) -> dict[str, Any]:
    row = descriptor["source_pin_file"]
    path = pathlib.Path(row["path"])
    if (
        not ordinary_file(path)
        or path.stat().st_size != row["bytes"]
        or sha256_file(path) != row["sha256"]
        or str(path.stat().st_mtime_ns) != row["mtime_ns"]
    ):
        raise RuntimeError("reviewed B source-pin manifest identity changed")
    pins = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(pins, dict) or len(pins) != descriptor["B_source_count"]:
        raise RuntimeError("reviewed B source-pin count changed")
    return {
        "path": str(path),
        "bytes": row["bytes"],
        "sha256": row["sha256"],
        "entries": len(pins),
    }


def verify_binaries(descriptor: dict[str, Any]) -> dict[str, Any]:
    records: dict[str, Any] = {}
    for name in ("soffice", "soffice_bin"):
        row = descriptor[name]
        path = pathlib.Path(row["path"])
        if (
            not ordinary_file(path)
            or path.stat().st_size != row["bytes"]
            or sha256_file(path) != row["sha256"]
            or str(path.stat().st_mtime_ns) != row["mtime_ns"]
        ):
            raise RuntimeError(f"approved LibreOffice binary changed: {name}")
        records[name] = {
            "path": str(path),
            "bytes": row["bytes"],
            "sha256": row["sha256"],
        }
    return records


def prepare_root(raw: str) -> dict[str, pathlib.Path]:
    root = pathlib.Path(raw)
    if not root.is_absolute() or ROOT_NAME.fullmatch(root.name) is None:
        raise RuntimeError("--root must be an absolute fresh lb-t23-<8 hex> path")
    if os.path.lexists(root):
        raise RuntimeError("--root must not exist")
    if not ordinary_dir(root.parent):
        raise RuntimeError("--root parent must be an ordinary directory")
    assert_plain_path_chain(root.parent)
    if os.path.normcase(os.path.realpath(root.parent)) != os.path.normcase(str(root.parent.resolve())):
        raise RuntimeError("--root parent resolves through an alias")
    root.mkdir(mode=0o700)
    directories = {
        "root": root,
        "case": root / "case",
        "appdata": root / "appdata",
        "home": root / "home",
        "localappdata": root / "localappdata",
        "temp": root / "temp",
    }
    for name in ("appdata", "home", "localappdata", "temp"):
        path = directories[name]
        path.mkdir(mode=0o700)
        if not ordinary_dir(path):
            raise RuntimeError("private root directory is not ordinary")
    return directories


def scrub_environment(root: pathlib.Path) -> None:
    keep = {
        name: os.environ[name]
        for name in ("SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT")
        if os.environ.get(name)
    }
    os.environ.clear()
    os.environ.update(keep)
    directories = {
        "HOME": root / "home",
        "USERPROFILE": root / "home",
        "APPDATA": root / "appdata",
        "LOCALAPPDATA": root / "localappdata",
        "TEMP": root / "temp",
        "TMP": root / "temp",
        "TMPDIR": root / "temp",
    }
    for name, path in directories.items():
        if not ordinary_dir(path):
            raise RuntimeError("private environment directory changed")
        os.environ[name] = str(path)
    os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
    os.environ["PYTHONUTF8"] = "1"
    os.environ["PYTHONIOENCODING"] = "utf-8"
    os.environ["PATH"] = str(pathlib.Path(sys.executable).parent)
    os.environ["NODE_USE_ENV_PROXY"] = "0"


def assert_report_path(raw: str) -> pathlib.Path:
    path = pathlib.Path(raw)
    if not path.is_absolute() or path.parent.resolve() != EVIDENCE_DIR:
        raise RuntimeError("--report must be a direct child of this evidence directory")
    if path.suffix.lower() != ".json" or path.name in {"literal-inputs.json"}:
        raise RuntimeError("--report must be a new JSON report file")
    if os.path.lexists(path) or not ordinary_dir(path.parent):
        raise RuntimeError("--report must not already exist")
    return path


def write_json_exclusive(path: pathlib.Path, value: dict[str, Any]) -> None:
    if os.path.lexists(path):
        raise RuntimeError(f"refusing to overwrite {path.name}")
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


def inspect_plan_and_task(
    descriptor: dict[str, Any],
    source_root: pathlib.Path,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    case_id = descriptor.get("case_id")
    task_id = descriptor.get("task_id")
    plan_rel = descriptor.get("plan_rel")
    if not isinstance(case_id, str) or CASE_ID.fullmatch(case_id) is None:
        raise RuntimeError("approved case_id is invalid")
    if not isinstance(task_id, str) or TASK_ID.fullmatch(task_id) is None:
        raise RuntimeError("approved task_id is invalid")
    if not isinstance(plan_rel, str) or not plan_rel.endswith("/归档方案.json"):
        raise RuntimeError("approved plan path is invalid")
    plan_path = source_root.joinpath(*pathlib.PurePosixPath(plan_rel).parts)
    plan_info = descriptor["plan"]
    if (
        not ordinary_file(plan_path)
        or plan_path.stat().st_size != plan_info["bytes"]
        or sha256_file(plan_path) != plan_info["sha256"]
        or str(plan_path.stat().st_mtime_ns) != plan_info["mtime_ns"]
    ):
        raise RuntimeError("actual approved plan file identity changed")
    plan = json.loads(plan_path.read_text(encoding="utf-8"))
    if plan != descriptor["confirmed_synthetic_plan"]:
        raise RuntimeError("approved plan object and descriptor differ")
    if plan.get("result") is None:
        raise RuntimeError("approved plan is not confirmed")

    task_path = source_root / "工作区" / "任务" / task_id / "task.json"
    if not ordinary_file(task_path):
        raise RuntimeError("actual task.json is missing")
    task = json.loads(task_path.read_text(encoding="utf-8"))
    if (
        task.get("task_id") != task_id
        or task.get("case_id") != case_id
        or task.get("session_id") != descriptor.get("native_source_session")
        or task.get("request_id") != descriptor.get("request_id")
    ):
        raise RuntimeError("actual task identity differs from the approved descriptor")
    return plan, task, {
        "path": plan_rel,
        "bytes": plan_info["bytes"],
        "sha256": plan_info["sha256"],
        "mtime_ns": plan_info["mtime_ns"],
    }


def verify_plain_sources(descriptor: dict[str, Any], source_root: pathlib.Path) -> int:
    count = 0
    expected = sum(
        1
        for row in descriptor["source_case_inventory"]
        if row["rel_path"].lower().endswith(".txt")
    )
    for row in descriptor["source_case_inventory"]:
        relative = row["rel_path"]
        if not relative.lower().endswith(".txt"):
            continue
        path = source_root.joinpath(*pathlib.PurePosixPath(relative).parts)
        data = path.read_bytes()
        if b"\x00" in data:
            raise RuntimeError("approved canonical TXT contains NUL")
        try:
            text = data.decode("utf-8")
        except UnicodeDecodeError:
            raise RuntimeError("approved canonical TXT is not UTF-8") from None
        head = text.lstrip().lower()
        if head.startswith(("<!doctype", "<html", "<?xml", "{\\rtf", "<svg")):
            raise RuntimeError("approved canonical TXT is not plain text")
        count += 1
    if count != expected:
        raise RuntimeError("canonical TXT count differs from the approved inventory")
    return count


def copy_approved_case(root: dict[str, pathlib.Path], descriptor: dict[str, Any]) -> None:
    source_root = pathlib.Path(descriptor["source_case_root"])
    case_root = root["case"]
    if os.path.lexists(case_root):
        raise RuntimeError("private case target must not exist before exact copy")
    case_root.mkdir(mode=0o700)
    for row in sorted(descriptor["source_case_inventory"], key=lambda item: item["rel_path"]):
        relative = pathlib.PurePosixPath(row["rel_path"])
        source = source_root.joinpath(*relative.parts)
        destination = case_root.joinpath(*relative.parts)
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        assert_plain_path_chain(destination.parent)
        if (
            not ordinary_file(source)
            or source.stat().st_size != row["bytes"]
            or sha256_file(source) != row["sha256"]
            or str(source.stat().st_mtime_ns) != row["mtime_ns"]
        ):
            raise RuntimeError(f"source file changed before copy: {row['rel_path']}")
        with source.open("rb") as src, destination.open("xb") as dst:
            for block in iter(lambda: src.read(1024 * 1024), b""):
                dst.write(block)
            dst.flush()
            os.fsync(dst.fileno())
        os.utime(destination, ns=(int(row["mtime_ns"]), int(row["mtime_ns"])))
        if (
            not ordinary_file(destination)
            or destination.stat().st_size != row["bytes"]
            or sha256_file(destination) != row["sha256"]
            or str(destination.stat().st_mtime_ns) != row["mtime_ns"]
        ):
            raise RuntimeError(f"private copied file is not exact: {row['rel_path']}")


def protected_case_snapshot(case_root: pathlib.Path) -> dict[str, dict[str, Any]]:
    protected = snapshot_files(case_root)
    return {
        relative: row
        for relative, row in protected.items()
        if not relative.startswith("工作区/case.db")
    }


def verify_protected_case(
    case_root: pathlib.Path,
    protected: dict[str, dict[str, Any]],
) -> bool:
    current = snapshot_files(case_root)
    for relative, wanted in protected.items():
        got = current.get(relative)
        if got != wanted:
            raise RuntimeError(f"protected copied case file changed: {relative}")
    return True


class RefusalCounters:
    def __init__(self) -> None:
        self.outbound: list[str] = []
        self.key_getter = 0
        self.external_key_getter = 0
        self.python_network: dict[str, int] = {
            "connect": 0,
            "connect_ex": 0,
            "create_connection": 0,
            "bind": 0,
            "listen": 0,
            "ssl_wrap_socket": 0,
        }


class RetainerSentinel:
    def __init__(self) -> None:
        self.closed = False

    def close(self) -> None:
        self.closed = True


@contextlib.contextmanager
def deny_python_network(counters: RefusalCounters):
    original_connect = socket.socket.connect
    original_connect_ex = socket.socket.connect_ex
    original_bind = socket.socket.bind
    original_listen = socket.socket.listen
    original_create_connection = socket.create_connection
    original_wrap_socket = ssl.SSLContext.wrap_socket

    def denied(name: str):
        def reject(*_args, **_kwargs):
            counters.python_network[name] += 1
            raise RuntimeError(f"Python network operation denied: {name}")
        return reject

    socket.socket.connect = denied("connect")
    socket.socket.connect_ex = denied("connect_ex")
    socket.socket.bind = denied("bind")
    socket.socket.listen = denied("listen")
    socket.create_connection = denied("create_connection")
    ssl.SSLContext.wrap_socket = denied("ssl_wrap_socket")
    try:
        yield
    finally:
        socket.socket.connect = original_connect
        socket.socket.connect_ex = original_connect_ex
        socket.socket.bind = original_bind
        socket.socket.listen = original_listen
        socket.create_connection = original_create_connection
        ssl.SSLContext.wrap_socket = original_wrap_socket


class GuardedAsgi:
    def __init__(self, app: Any, expected: tuple[tuple[str, str], ...]) -> None:
        self.app = app
        self.expected = expected
        self.index = 0
        self.denied = 0
        self.records: list[dict[str, Any]] = []

    async def _deny(self, send: Callable[[dict[str, Any]], Awaitable[None]], reason: str) -> None:
        self.denied += 1
        body = json.dumps(
            {"ok": False, "error": {"code": "INVALID_ARGUMENT"}, "guard": reason},
            ensure_ascii=False,
            separators=(",", ":"),
        ).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": 403,
                "headers": [
                    (b"content-type", b"application/json; charset=utf-8"),
                    (b"content-length", str(len(body)).encode("ascii")),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body, "more_body": False})

    async def __call__(self, scope, receive, send):
        if scope.get("type") != "http":
            await self._deny(send, "non_http_scope")
            return
        method = scope.get("method")
        path = scope.get("path")
        if self.index >= len(self.expected) or (method, path) != self.expected[self.index]:
            await self._deny(send, "method_or_path")
            return
        record: dict[str, Any] = {
            "sequence": self.index + 1,
            "method": method,
            "path": path,
            "request_chunks": 0,
            "request_bytes": 0,
            "response_chunks": 0,
            "response_bytes": 0,
            "authorization_present": False,
        }
        self.records.append(record)
        request_parts: list[bytes] = []
        response_parts: list[bytes] = []

        async def capture_receive():
            message = await receive()
            if message.get("type") == "http.request":
                body = message.get("body", b"")
                record["request_chunks"] += 1
                record["request_bytes"] += len(body)
                if record["request_bytes"] > MAX_REQUEST_BODY:
                    raise RuntimeError("guarded request body is too large")
                request_parts.append(body)
            return message

        async def capture_send(message):
            if message.get("type") == "http.response.start":
                record["status"] = message.get("status")
                record["response_headers"] = [
                    [bytes(name).decode("latin-1"), bytes(value).decode("latin-1")]
                    for name, value in message.get("headers", [])
                    if bytes(name).lower() != b"set-cookie"
                ]
            elif message.get("type") == "http.response.body":
                body = message.get("body", b"")
                record["response_chunks"] += 1
                record["response_bytes"] += len(body)
                if record["response_bytes"] > MAX_RESPONSE_BODY:
                    raise RuntimeError("guarded response body is too large")
                response_parts.append(body)
            await send(message)

        record["authorization_present"] = any(
            bytes(name).lower() == b"authorization" for name, _value in scope.get("headers", [])
        )
        try:
            await self.app(scope, capture_receive, capture_send)
        except BaseException as error:
            record["exception_type"] = type(error).__name__
            raise
        finally:
            request_body = b"".join(request_parts)
            response_body = b"".join(response_parts)
            record["request_sha256"] = sha256_bytes(request_body)
            record["response_sha256"] = sha256_bytes(response_body)
            if request_body:
                try:
                    record["request_json"] = json.loads(request_body.decode("utf-8"))
                except (UnicodeDecodeError, ValueError):
                    record["request_json"] = None
            if response_body:
                try:
                    record["response_json"] = json.loads(response_body.decode("utf-8"))
                except (UnicodeDecodeError, ValueError):
                    record["response_json"] = None
            self.index += 1


def relation_xml_has_external(path: pathlib.Path) -> bool:
    with zipfile.ZipFile(path, "r") as archive:
        names = archive.namelist()
        if any("vbaproject" in name.lower() or name.lower().endswith(".bin") for name in names):
            raise RuntimeError("generated DOCX contains a macro-like part")
        content_types = archive.read("[Content_Types].xml").decode("utf-8", "strict")
        if "macroEnabled" in content_types or "vbaProject" in content_types:
            raise RuntimeError("generated DOCX content types declare macros")
        for name in names:
            if not name.endswith(".rels"):
                continue
            root = ET.fromstring(archive.read(name))
            for relation in root:
                if relation.attrib.get("TargetMode") == "External":
                    return True
                target = relation.attrib.get("Target", "").strip().lower()
                if target.startswith(DOCX_EXTERNAL_PREFIXES):
                    return True
    return False


def docx_text(path: pathlib.Path) -> tuple[str, list[list[list[str]]]]:
    document = pydocx.Document(str(path))
    paragraphs = [paragraph.text for paragraph in document.paragraphs]
    tables: list[list[list[str]]] = []
    for table in document.tables:
        tables.append([[cell.text for cell in row.cells] for row in table.rows])
    return "\n".join(paragraphs), tables


def response_file_map(body: dict[str, Any]) -> dict[str, str]:
    value = body.get("value")
    files = value.get("files") if isinstance(value, dict) else None
    if not isinstance(files, list):
        raise RuntimeError("archive response has no file list")
    mapped: dict[str, str] = {}
    for row in files:
        kind = row.get("kind")
        path = row.get("path")
        if (
            not isinstance(kind, str)
            or not isinstance(path, str)
            or kind in mapped
            or pathlib.PurePosixPath(path).name in ("", ".", "..")
        ):
            raise RuntimeError("archive response file row is invalid or duplicated")
        mapped[kind] = path
    return mapped


def source_materials(
    case_root: pathlib.Path,
    plan: dict[str, Any],
    material_index: dict[str, Any],
) -> dict[str, str]:
    by_name = {row["name"]: row for row in material_index["materials"]}
    out: dict[str, str] = {}
    for item in plan["items"]:
        for name in item["materials"]:
            row = by_name.get(name)
            if row is None:
                raise RuntimeError(f"plan material is absent from the actual index: {name}")
            source = case_root.joinpath(*pathlib.PurePosixPath(row["rel_path"]).parts)
            if not ordinary_file(source):
                raise RuntimeError(f"actual material original is missing: {name}")
            out[name] = source.read_text(encoding="utf-8")
    return out


def page_owner(
    page_text: str,
    names: list[str],
    materials: dict[str, str],
) -> tuple[str | None, dict[str, int]]:
    page = normalized_text(page_text)
    scores: dict[str, int] = {}
    for name in names:
        score = 0
        for line in materials[name].splitlines():
            probe = normalized_text(line)
            if len(probe) >= 4 and probe in page:
                score += len(probe)
        scores[name] = score
    ranked = sorted(scores.items(), key=lambda row: row[1], reverse=True)
    if not ranked or ranked[0][1] <= 0:
        return None, scores
    if len(ranked) > 1 and ranked[1][1] == ranked[0][1]:
        raise RuntimeError("a converted page cannot be assigned to one source material")
    return ranked[0][0], scores


def strip_page_label(text: str) -> str:
    compact = normalized_text(text)
    return PAGE_LABEL.sub("", compact)


def verify_unplanned_absent(
    case_root: pathlib.Path,
    descriptor: dict[str, Any],
    plan: dict[str, Any],
    material_index: dict[str, Any],
    page_texts: list[str],
) -> dict[str, Any]:
    planned_names = {
        name
        for item in plan["items"]
        for name in item["materials"]
    }
    planned_text = "\n".join(
        row.read_text(encoding="utf-8")
        for row in (
            case_root.joinpath(*pathlib.PurePosixPath(indexed["rel_path"]).parts)
            for indexed in material_index["materials"]
            if indexed["name"] in planned_names
        )
        if ordinary_file(row)
    )
    normalized_planned = normalized_text(planned_text)
    all_volume = normalized_text("\n".join(strip_page_label(text) for text in page_texts))
    index_rel_paths = {
        row["rel_path"]
        for row in material_index["materials"]
    }
    unplanned_sources: list[pathlib.Path] = []
    for row in material_index["materials"]:
        if row["name"] in planned_names or row.get("status") in ("missing", "source_deleted", "removed"):
            continue
        path = case_root.joinpath(*pathlib.PurePosixPath(row["rel_path"]).parts)
        if ordinary_file(path):
            unplanned_sources.append(path)
    for row in descriptor["source_case_inventory"]:
        relative = row["rel_path"]
        if relative in index_rel_paths or not relative.lower().endswith(".txt"):
            continue
        path = case_root.joinpath(*pathlib.PurePosixPath(relative).parts)
        if ordinary_file(path):
            unplanned_sources.append(path)

    unique_probes: list[str] = []
    for path in unplanned_sources:
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            raise RuntimeError("unplanned canonical TXT is not UTF-8") from None
        for line in text.splitlines():
            probe = normalized_text(line)
            if len(probe) >= 6 and probe not in normalized_planned:
                unique_probes.append(probe)
    leaked = next((probe for probe in unique_probes if probe in all_volume), None)
    if leaked is not None:
        raise RuntimeError("an unplanned material or temporary file entered the volume")
    return {
        "unplannedSourcesChecked": len(unplanned_sources),
        "unplannedUniqueContentAbsent": True,
    }


def verify_pdfs(
    case_root: pathlib.Path,
    plan: dict[str, Any],
    body: dict[str, Any],
    files: dict[str, str],
    material_index: dict[str, Any],
    generated_codes: list[dict[str, Any]],
) -> dict[str, Any]:
    value = body["value"]
    ranges = value.get("page_ranges")
    if not isinstance(ranges, list) or not ranges:
        raise RuntimeError("archive response has no page ranges")
    parsed_ranges: dict[int, tuple[int, int]] = {}
    previous_to = 0
    for row in ranges:
        code = row.get("code")
        start = row.get("from")
        end = row.get("to")
        if (
            not isinstance(code, int)
            or isinstance(code, bool)
            or not isinstance(start, int)
            or not isinstance(end, int)
            or code in parsed_ranges
            or start != previous_to + 1
            or end < start
        ):
            raise RuntimeError("archive page ranges are not unique and sequential")
        parsed_ranges[code] = (start, end)
        previous_to = end

    volume_path = case_root.joinpath(
        *pathlib.PurePosixPath(files["卷宗"]).parts
    )
    invoice_path = case_root.joinpath(
        *pathlib.PurePosixPath(files["发票"]).parts
    )
    if not ordinary_file(volume_path) or not ordinary_file(invoice_path):
        raise RuntimeError("volume or invoice PDF is missing")
    volume = PdfReader(str(volume_path))
    invoice = PdfReader(str(invoice_path))
    if volume.is_encrypted or invoice.is_encrypted:
        raise RuntimeError("generated PDF is encrypted")
    page_texts = [page.extract_text() or "" for page in volume.pages]
    invoice_texts = [page.extract_text() or "" for page in invoice.pages]
    total = len(page_texts)
    if total == 0 or previous_to != total:
        raise RuntimeError("archive ranges do not cover the actual volume page count")
    labels: list[dict[str, int]] = []
    for index, text in enumerate(page_texts, 1):
        match = PAGE_LABEL.search(normalized_text(text))
        if match is None or int(match.group(1)) != index or int(match.group(2)) != total:
            raise RuntimeError("volume page label is missing or incorrect")
        labels.append({"page": index, "total": int(match.group(2))})

    plan_codes = {item["code"] for item in plan["items"]}
    generated_here = {
        item["code"]
        for item in generated_codes
        if item["code"] in parsed_ranges
    }
    if set(parsed_ranges) != plan_codes | generated_here:
        raise RuntimeError("actual page-range codes differ from the confirmed plan and catalog")
    if generated_here != {item["code"] for item in generated_codes}:
        raise RuntimeError("a generated catalog item is absent from the archive")

    materials = source_materials(case_root, plan, material_index)
    material_pages: dict[str, list[int]] = {name: [] for name in materials}
    material_page_counts: dict[str, int] = {}
    code_details: dict[str, Any] = {}
    for item in sorted(plan["items"], key=lambda row: row["code"]):
        start, end = parsed_ranges[item["code"]]
        names = list(item["materials"])
        for page_no in range(start, end + 1):
            owner, _scores = page_owner(
                strip_page_label(page_texts[page_no - 1]),
                names,
                materials,
            )
            if owner is None:
                raise RuntimeError("a planned material page contains no source content")
            material_pages[owner].append(page_no)
        for name in names:
            pages = material_pages[name]
            if not pages:
                raise RuntimeError(f"planned material did not appear in its code range: {name}")
            joined = normalized_text(
                "\n".join(
                    strip_page_label(page_texts[page_no - 1])
                    for page_no in pages
                )
            )
            missing_lines = [
                line
                for line in materials[name].splitlines()
                if len(normalized_text(line)) >= 4
                and normalized_text(line) not in joined
            ]
            if missing_lines:
                raise RuntimeError(f"actual source content is incomplete: {name}")
            material_page_counts[name] = len(pages)
        if sum(material_page_counts[name] for name in names) != end - start + 1:
            raise RuntimeError("material PDF page counts do not equal the actual code range")
        code_details[str(item["code"])] = {
            "from": start,
            "to": end,
            "pages": end - start + 1,
            "materials": {
                name: len(material_pages[name])
                for name in names
            },
        }

    for item in generated_codes:
        start, end = parsed_ranges[item["code"]]
        joined = normalized_text(
            "\n".join(
                strip_page_label(page_texts[page_no - 1])
                for page_no in range(start, end + 1)
            )
        )
        required_values = [
            plan["client"],
            plan["opponent"] or "无",
            plan["cause"],
            plan["summary"],
            plan["opinion"],
            plan["result"],
        ]
        if any(normalized_text(value) not in joined for value in required_values):
            raise RuntimeError("generated report page is absent from its actual range")
        code_details[str(item["code"])] = {
            "from": start,
            "to": end,
            "pages": end - start + 1,
            "generated": item["name"],
        }

    invoice_code = next(
        (
            item["code"]
            for item in plan["items"]
            if "收费发票" in item["name"]
        ),
        None,
    )
    if invoice_code is None:
        raise RuntimeError("invoice code is not derivable from the confirmed plan")
    invoice_start, invoice_end = parsed_ranges[invoice_code]
    invoice_range = invoice_end - invoice_start + 1
    if len(invoice_texts) != invoice_range:
        raise RuntimeError("invoice PDF page count differs from the actual invoice range")
    for offset, invoice_text in enumerate(invoice_texts):
        volume_text = page_texts[invoice_start - 1 + offset]
        if strip_page_label(invoice_text) != strip_page_label(volume_text):
            raise RuntimeError("invoice page differs from its volume page")

    unplanned_evidence = verify_unplanned_absent(
        case_root,
        descriptor,
        plan,
        material_index,
        page_texts,
    )

    return {
        "volume": {
            "path": files["卷宗"],
            "bytes": volume_path.stat().st_size,
            "sha256": sha256_file(volume_path),
            "pages": total,
        },
        "invoice": {
            "path": files["发票"],
            "bytes": invoice_path.stat().st_size,
            "sha256": sha256_file(invoice_path),
            "pages": len(invoice_texts),
            "matches_volume_code": invoice_code,
        },
        "ranges": code_details,
        "page_labels": labels,
        "material_page_counts": dict(sorted(material_page_counts.items())),
        "sequential_total": total,
        "unplanned": unplanned_evidence,
    }


def verify_documents_and_index(
    case_root: pathlib.Path,
    descriptor: dict[str, Any],
    plan: dict[str, Any],
    task: dict[str, Any],
    body: dict[str, Any],
    files: dict[str, str],
    catalog: dict[str, Any],
    contract_module: Any,
) -> dict[str, Any]:
    generated_codes = [row for row in catalog["items"] if row.get("generated")]
    if len(generated_codes) != 1:
        raise RuntimeError("current catalog does not have exactly one generated report")
    generated_code = generated_codes[0]["code"]
    generated_name = generated_codes[0]["name"]
    if any(item["code"] == generated_code for item in plan["items"]):
        raise RuntimeError("confirmed plan already contains the generated report item")

    required_kinds = {"卷宗", "发票", "立卷申请书", "结案报告", "归档目录"}
    if set(files) != required_kinds:
        raise RuntimeError("archive file kinds differ from the actual complete-plan case")
    if any(
        pathlib.PurePosixPath(path).suffix.lower() == ".pdf"
        and kind == "立卷申请书"
        for kind, path in files.items()
    ):
        raise RuntimeError("application was incorrectly replaced by a PDF")

    application_path = case_root.joinpath(
        *pathlib.PurePosixPath(files["立卷申请书"]).parts
    )
    report_path = case_root.joinpath(
        *pathlib.PurePosixPath(files["结案报告"]).parts
    )
    catalog_path = case_root.joinpath(
        *pathlib.PurePosixPath(files["归档目录"]).parts
    )
    if (
        not ordinary_file(application_path)
        or not ordinary_file(report_path)
        or not ordinary_file(catalog_path)
    ):
        raise RuntimeError("generated DOCX or markdown output is missing")
    if relation_xml_has_external(application_path):
        raise RuntimeError("application DOCX has an external relationship")
    if relation_xml_has_external(report_path):
        raise RuntimeError("report DOCX has an external relationship")

    application_text, application_tables = docx_text(application_path)
    application_code_cells = [
        cells[0].strip()
        for table in application_tables
        for cells in table[1:]
        if cells
    ]
    if application_code_cells.count(str(generated_code)) != 1:
        raise RuntimeError("generated report row is not inserted exactly once")
    if "经办律师（签字）：______________" not in application_text:
        raise RuntimeError("manual signature line is missing or prefilled")

    report_text, _report_tables = docx_text(report_path)
    if "【待填写】" not in report_text:
        raise RuntimeError("actual null lawyer placeholder was not preserved")
    required_report_values = [
        plan["client"],
        plan["opponent"] or "无",
        plan["entrust_date"],
        plan["close_date"],
        plan["cause"],
        plan["summary"],
        plan["opinion"],
        plan["result"],
    ]
    if any(value not in report_text for value in required_report_values):
        raise RuntimeError("a genuine plan field is absent from the report DOCX")

    catalog_text = catalog_path.read_text(encoding="utf-8")
    generated_needle = f"| {generated_code} | {generated_name} |"
    if catalog_text.count(generated_needle) != 1:
        raise RuntimeError("generated report row is absent or duplicated in markdown catalog")
    for item in plan["items"]:
        if f"| {item['code']} |" not in catalog_text or item["name"] not in catalog_text:
            raise RuntimeError("confirmed plan row is absent from markdown catalog")

    lowered_catalog = catalog_text.lower()
    if any(
        forbidden in lowered_catalog
        for forbidden in ("http://", "https://", "ftp://", "file://", "javascript:")
    ):
        raise RuntimeError("generated markdown catalog contains an external target")

    manual = body["value"].get("manual")
    if not isinstance(manual, list) or not all(isinstance(row, str) for row in manual):
        raise RuntimeError("archive response manual warnings are invalid")
    required_manual = [
        "结案报告为临时模板，待律所模板到位后替换",
        "立卷申请书为临时版式，待律所模板到位后替换",
        "结案报告由 libreoffice 转成 PDF，请在 Word / WPS 中核对是否为一页",
        "立卷申请书须打印 → 经办律师手签 → 扫描为 PDF 后上传金助理，不得代签、不得电子签",
    ]
    if any(warning not in manual for warning in required_manual):
        raise RuntimeError("a required manual/template/signature warning is absent")

    index_path = case_root / "成果" / "索引.json"
    if not ordinary_file(index_path):
        raise RuntimeError("outputs index is missing")
    outputs_index = json.loads(index_path.read_text(encoding="utf-8"))
    contract_module.validate("files/outputs_index.schema.json", "", outputs_index)
    result_path = case_root / "工作区" / "任务" / descriptor["task_id"] / "result.json"
    if not ordinary_file(result_path):
        raise RuntimeError("the copied task result is missing")
    task_result = json.loads(result_path.read_text(encoding="utf-8"))
    citation_check = task_result.get("citation_check")
    expected_citation_passed = bool(
        isinstance(citation_check, dict)
        and citation_check.get("passed")
    )
    if (
        outputs_index.get("v") != 1
        or not isinstance(outputs_index.get("outputs"), list)
        or len(outputs_index["outputs"]) != 1
    ):
        raise RuntimeError("outputs index is not the single actual archive record")
    record = outputs_index["outputs"][0]
    folder_title = body["value"]["folder"].rsplit("/", 1)[-1]
    if (
        record.get("title") != folder_title
        or record.get("task_id") != descriptor["task_id"]
        or record.get("inputs") != task.get("inputs")
        or not isinstance(record.get("citation_passed"), bool)
        or record.get("citation_passed") != expected_citation_passed
        or "confirmed_at" not in record
    ):
        raise RuntimeError("outputs index archive metadata differs from the actual task")
    index_files = record.get("files")
    if not isinstance(index_files, list):
        raise RuntimeError("outputs index has no file entries")
    expected_index_paths = {
        path
        for path in files.values()
        if pathlib.PurePosixPath(path).suffix.lower() in (".md", ".docx")
    }
    actual_index_paths = {
        row.get("path")
        for row in index_files
        if row.get("format") in ("md", "docx")
    }
    if (
        len(index_files) != len(expected_index_paths)
        or actual_index_paths != expected_index_paths
        or any(
            pathlib.PurePosixPath(row.get("path", "")).suffix.lower() not in (".md", ".docx")
            for row in index_files
        )
    ):
        raise RuntimeError("outputs index contains non-actual or non-md/docx entries")
    for row in index_files:
        target = case_root.joinpath(*pathlib.PurePosixPath(row["path"]).parts)
        if not ordinary_file(target):
            raise RuntimeError("indexed output file is missing")

    return {
        "generatedCode": generated_code,
        "generatedName": generated_name,
        "application": {
            "path": files["立卷申请书"],
            "bytes": application_path.stat().st_size,
            "sha256": sha256_file(application_path),
            "generatedRowCount": application_code_cells.count(str(generated_code)),
            "manualSignatureLine": True,
            "externalRelationships": False,
            "macroLikeParts": False,
        },
        "report": {
            "path": files["结案报告"],
            "bytes": report_path.stat().st_size,
            "sha256": sha256_file(report_path),
            "placeholderPreserved": True,
            "allPlanFieldsPresent": True,
            "externalRelationships": False,
            "macroLikeParts": False,
        },
        "catalog": {
            "path": files["归档目录"],
            "bytes": catalog_path.stat().st_size,
            "sha256": sha256_file(catalog_path),
            "generatedRowOnce": True,
            "externalTargets": False,
        },
        "index": {
            "path": "成果/索引.json",
            "bytes": index_path.stat().st_size,
            "sha256": sha256_file(index_path),
            "entries": len(outputs_index["outputs"]),
            "onlyMdDocx": True,
        },
        "manualWarningsPreserved": True,
    }


def remove_owned_tree(root: pathlib.Path, target: pathlib.Path) -> bool:
    if target == root or not os.path.lexists(target):
        return not os.path.lexists(target)
    root_real = os.path.normcase(os.path.realpath(root))
    target_real = os.path.normcase(os.path.realpath(target))
    try:
        if os.path.commonpath([root_real, target_real]) != root_real:
            raise RuntimeError("cleanup target escaped the private root")
    except ValueError:
        raise RuntimeError("cleanup target is on another volume") from None
    assert_plain_path_chain(target)
    if not ordinary_dir(target):
        raise RuntimeError("cleanup target is not an ordinary directory")
    shutil.rmtree(target)
    return not os.path.lexists(target)


def clean_owned_runtime(
    root: dict[str, pathlib.Path],
    lo_base: pathlib.Path,
) -> dict[str, Any]:
    case_temp = root["case"] / "工作区" / "临时"
    temp_children = []
    unknown_temp = []
    if ordinary_dir(case_temp):
        for child in list(case_temp.iterdir()):
            if child.name.startswith(("归档-", "lo-")):
                temp_children.append(child.name)
                remove_owned_tree(root["root"], child)
            else:
                unknown_temp.append(child.name)
    if temp_children or unknown_temp:
        raise RuntimeError("production case temporary directory was not fully cleaned")

    lo_children_before = [
        child.name
        for child in lo_base.iterdir()
    ] if ordinary_dir(lo_base) else []
    lo_removed = remove_owned_tree(root["root"], lo_base)
    env_cleanup = {}
    for name in ("temp", "home", "localappdata"):
        target = root[name]
        env_cleanup[name] = remove_owned_tree(root["root"], target)
    return {
        "caseTempChildren": temp_children,
        "caseTempGone": not temp_children and not unknown_temp,
        "loResidualChildren": lo_children_before,
        "loBaseGone": lo_removed,
        "privateEnvironmentDirectoriesRemoved": env_cleanup,
        "caseAndEvidenceRetained": ordinary_dir(root["case"]),
    }


async def execute(
    root: dict[str, pathlib.Path],
    descriptor: dict[str, Any],
    plan: dict[str, Any],
    task: dict[str, Any],
    protected: dict[str, dict[str, Any]],
    report: dict[str, Any],
) -> dict[str, Any]:
    report["phase"] = "product_import"
    if str(B_SERVICE) not in sys.path:
        sys.path.insert(0, str(B_SERVICE))

    from lawbench import contracts
    from lawbench import logs
    from lawbench.app import create_app
    from lawbench.case import gate
    from lawbench.config import Config
    from lawbench.ingest import libreoffice
    from lawbench.office.convert import OfficeConverter, TIMEOUT as CONVERT_TIMEOUT

    report["phase"] = "app_construction"
    counters = RefusalCounters()

    def refuse_outbound(request: httpx.Request) -> httpx.Response:
        counters.outbound.append(request.method)
        raise RuntimeError("outbound HTTP is disabled for T23")

    def refuse_key() -> str:
        counters.key_getter += 1
        raise RuntimeError("model key access is disabled for T23")

    def refuse_external_key() -> str:
        counters.external_key_getter += 1
        raise RuntimeError("external key access is disabled for T23")

    token = "T23-fake-" + secrets.token_hex(32)
    appdata = root["appdata"]
    try:
        application = create_app(
            Config(
                token=token,
                appdata=appdata,
                skills_dirs=[B_SKILLS],
                contracts_dir=B_CONTRACTS,
                port=0,
                forward_port=18_765,
                validate_responses=True,
            ),
            key_getter=refuse_key,
            external_key_getter=refuse_external_key,
            transport=httpx.MockTransport(refuse_outbound),
        )
    except BaseException as app_error:
        report["appConstructionFailureExceptionType"] = type(app_error).__name__
        logs_closed = False
        try:
            logs.close()
            logs_closed = True
        except Exception:
            pass
        try:
            report["cleanup"] = clean_owned_runtime(root, appdata / "临时" / "lo")
        except Exception as cleanup_error:
            report["cleanup"] = {
                "exceptionType": type(cleanup_error).__name__,
                "caseAndEvidenceRetained": ordinary_dir(root["case"]),
            }
        report["shutdown"] = {
            "asgiClientClosed": True,
            "netClientClosed": False,
            "logsClosed": logs_closed,
            "materialsClosed": False,
            "retainerSentinelClosed": True,
            "retainerStarted": False,
        }
        raise
    lb = application.state.lb
    sentinel = RetainerSentinel()
    lo_base = appdata / "临时" / "lo"
    try:
        report["phase"] = "private_settings"
        original_retainer = lb.retainer
        if getattr(original_retainer, "_proc", None) is not None:
            raise RuntimeError("configured retainer was unexpectedly started")
        lb.retainer = sentinel
        original_settings = lb.settings.get()
        updated_settings = copy.deepcopy(original_settings)
        updated_settings["converter"] = "libreoffice"
        lb.settings.put(updated_settings)
        saved_settings = lb.settings.get()
        if saved_settings["converter"] != "libreoffice":
            raise RuntimeError("private converter setting was not persisted")
        without_converter_original = copy.deepcopy(original_settings)
        without_converter_saved = copy.deepcopy(saved_settings)
        without_converter_original.pop("converter")
        without_converter_saved.pop("converter")
        if without_converter_original != without_converter_saved:
            raise RuntimeError("private settings changed beyond converter")

        report["phase"] = "converter_injection"
        converter = OfficeConverter(
            lo_base=lo_base,
            soffice=descriptor["soffice"]["path"],
        )
        if type(converter) is not OfficeConverter:
            raise RuntimeError("converter is not the actual current OfficeConverter")
        lb.archive.converter = converter
        profile_probe = lo_base / "12345678" / "p"
        if len(str(profile_probe.resolve())) > libreoffice.MAX_PROFILE_PATH:
            raise RuntimeError("private LibreOffice profile path exceeds the product limit")
        if libreoffice.TIMEOUT != 120 or CONVERT_TIMEOUT != 120:
            raise RuntimeError("production conversion timeout is not the reviewed 120 seconds")
        report["settings"] = {
            "changedFields": ["converter"],
            "converter": "libreoffice",
            "otherFieldsUnchanged": True,
            "loBase": str(lo_base),
            "profilePathProbeLength": len(str(profile_probe.resolve())),
            "profilePathLimit": libreoffice.MAX_PROFILE_PATH,
            "conversionTimeoutSeconds": CONVERT_TIMEOUT,
            "neverUsedGlobalSettings": True,
        }
    except BaseException as setup_error:
        report["setupFailureExceptionType"] = type(setup_error).__name__
        net_closed = False
        logs_closed = False
        materials_closed = False
        try:
            lb.net.client.close()
            net_closed = bool(lb.net.client.is_closed)
        except Exception:
            pass
        try:
            logs.close()
            logs_closed = True
        except Exception:
            pass
        try:
            lb.materials.close()
            materials_closed = True
        except Exception:
            pass
        sentinel.close()
        report["shutdown"] = {
            "asgiClientClosed": True,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "materialsClosed": materials_closed,
            "retainerSentinelClosed": sentinel.closed,
            "retainerStarted": False,
        }
        try:
            report["cleanup"] = clean_owned_runtime(root, lo_base)
        except Exception as cleanup_error:
            report["cleanup"] = {
                "exceptionType": type(cleanup_error).__name__,
                "caseAndEvidenceRetained": ordinary_dir(root["case"]),
            }
        raise

    case_root = root["case"]
    case_id = descriptor["case_id"]
    task_id = descriptor["task_id"]
    plan_rel = descriptor["plan_rel"]
    confirmed = copy.deepcopy(descriptor["confirmed_synthetic_plan"])
    contracts.validate("files/task.schema.json", "", task)
    contracts.validate(
        "tools/case_save_archive_plan.schema.json",
        "#/$defs/plan",
        confirmed,
    )

    open_request = {"path": str(case_root), "template": None}
    archive_request = {
        "case_id": case_id,
        "task_id": task_id,
        "plan": plan_rel,
        "confirmed": confirmed,
    }
    expected_routes = (
        ("POST", "/api/case/open"),
        ("POST", "/api/archive/build"),
    )
    guarded = GuardedAsgi(application, expected_routes)
    transport = httpx.ASGITransport(app=guarded, raise_app_exceptions=True)
    headers = {
        "authorization": f"Bearer {token}",
        "content-type": "application/json",
    }
    async_client: httpx.AsyncClient | None = None
    try:
        async_client = httpx.AsyncClient(
            transport=transport,
            base_url="http://lawbench.inprocess",
            follow_redirects=False,
            trust_env=False,
            timeout=httpx.Timeout(1_800.0),
        )
        with deny_python_network(counters):
            report["phase"] = "case_open_route"
            opened = await async_client.post(
                "/api/case/open",
                content=json.dumps(
                    open_request,
                    ensure_ascii=False,
                    separators=(",", ":"),
                ).encode("utf-8"),
                headers=headers,
            )
            opened_body = opened.json()
            contracts.validate(
                "api/case_open.schema.json",
                "#/$defs/response",
                opened_body,
            )
            if (
                opened.status_code != 200
                or opened_body.get("ok") is not True
                or opened_body["value"].get("case_id") != case_id
                or opened_body["value"].get("created") is not False
                or opened_body["value"].get("folders_created") != []
            ):
                raise RuntimeError("actual case-open route did not open the copied case")
            located_case_id, located_root, located_task = lb.tasks.locate(task_id)
            if (
                located_case_id != case_id
                or os.path.normcase(os.path.realpath(located_root))
                != os.path.normcase(os.path.realpath(case_root))
                or located_task.get("task_id") != task_id
                or located_task.get("case_id") != case_id
            ):
                raise RuntimeError("actual TaskStore.locate did not resolve the copied task")

            report["phase"] = "archive_build_route"
            archived = await async_client.post(
                "/api/archive/build",
                content=json.dumps(
                    archive_request,
                    ensure_ascii=False,
                    separators=(",", ":"),
                ).encode("utf-8"),
                headers=headers,
            )
            archive_body = archived.json()
            contracts.validate(
                "api/archive_build.schema.json",
                "#/$defs/response",
                archive_body,
            )
            if archived.status_code != 200 or archive_body.get("ok") is not True:
                raise RuntimeError("actual archive-build route did not succeed")
            if archive_body["value"].get("converter") != "libreoffice":
                raise RuntimeError("archive route did not actually use LibreOffice")

        if guarded.index != 2 or guarded.denied != 0:
            raise RuntimeError("guarded ASGI route count or order is incorrect")
        if len(guarded.records) != 2:
            raise RuntimeError("actual request/response record count is not two")
        if (
            guarded.records[0].get("request_json") != open_request
            or guarded.records[1].get("request_json") != archive_request
            or guarded.records[0].get("response_json") != opened_body
            or guarded.records[1].get("response_json") != archive_body
        ):
            raise RuntimeError("retained actual request or response differs from decoded body")
        if counters.outbound or counters.key_getter or counters.external_key_getter:
            raise RuntimeError("model, credential, or outbound access was attempted")
        if any(counters.python_network.values()):
            raise RuntimeError("a denied Python network or listener operation was attempted")

        report["phase"] = "artifact_verification"
        files = response_file_map(archive_body)
        folder = archive_body["value"].get("folder")
        if not isinstance(folder, str) or not folder.startswith("成果/归档/"):
            raise RuntimeError("archive response folder is outside the archive output root")
        folder_prefix = folder.rstrip("/") + "/"
        if any(
            not path.startswith(folder_prefix)
            or pathlib.PurePosixPath(path).is_absolute()
            or ".." in pathlib.PurePosixPath(path).parts
            for path in files.values()
        ):
            raise RuntimeError("an archive response file is outside the actual output folder")
        folder_path = gate.resolve_internal(case_root, folder, op="t23_verify_archive")
        if not ordinary_dir(folder_path):
            raise RuntimeError("actual archive output folder is missing")
        resolved_outputs = {
            kind: gate.resolve_internal(case_root, path, op="t23_verify_archive")
            for kind, path in files.items()
        }
        if any(path.parent != folder_path for path in resolved_outputs.values()):
            raise RuntimeError("an archive response file resolved outside the actual folder")
        folder_entries = list(folder_path.iterdir())
        if any(not ordinary_file(path) for path in folder_entries):
            raise RuntimeError("actual archive folder contains a non-ordinary entry")
        actual_names = {path.name for path in folder_entries}
        response_names = {
            path.name
            for path in resolved_outputs.values()
        }
        if actual_names != response_names:
            raise RuntimeError("actual archive folder contains extra or missing files")
        material_index = lb.materials.index(case_id)
        catalog_path = B_SKILLS / "case-archiving" / "catalogs" / f"{plan['catalog']}.json"
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
        generated_codes = [row for row in catalog["items"] if row.get("generated")]
        pdf_evidence = verify_pdfs(
            case_root,
            plan,
            archive_body,
            files,
            material_index,
            generated_codes,
        )
        document_evidence = verify_documents_and_index(
            case_root,
            descriptor,
            plan,
            task,
            archive_body,
            files,
            catalog,
            contracts,
        )

        report["phase"] = "immutability_verification"
        if not verify_protected_case(case_root, protected):
            raise RuntimeError("protected copied case verification failed")
        source_after = snapshot_files(pathlib.Path(descriptor["source_case_root"]))
        compare_inventory(source_after, descriptor["source_case_inventory"], "source")
        resource_after = verify_resources(descriptor)
        binary_after = verify_binaries(descriptor)

        report["routes"] = {
            "state": "IN_PROCESS_ASGI_HTTP",
            "actualTcpListener": False,
            "asgiLifespanStarted": False,
            "productResponseValidationEnabled": True,
            "helperResponseContractValidation": True,
            "guardedExpectedRoutes": [
                {"method": method, "path": path}
                for method, path in expected_routes
            ],
            "successfulRoutes": 2,
            "guardDenied": guarded.denied,
            "records": guarded.records,
        }
        report["refusals"] = {
            "outboundAttempts": counters.outbound,
            "modelKeyGetterCalls": counters.key_getter,
            "externalKeyGetterCalls": counters.external_key_getter,
            "pythonSocketOperations": counters.python_network,
        }
        report["artifacts"] = {
            "folder": folder,
            "folderAbsolute": str(folder_path),
            "files": {
                kind: {
                    "path": path,
                    "bytes": case_root.joinpath(
                        *pathlib.PurePosixPath(path).parts
                    ).stat().st_size,
                    "sha256": sha256_file(
                        case_root.joinpath(*pathlib.PurePosixPath(path).parts)
                    ),
                }
                for kind, path in files.items()
            },
            "pdf": pdf_evidence,
            "documents": document_evidence,
        }
        report["immutability"] = {
            "sourceFiles": 30,
            "sourceUnchanged": True,
            "protectedCopiedFiles": len(protected),
            "protectedCopiedFilesUnchanged": True,
            "reviewedResources": len(resource_after),
            "resourcesUnchanged": resource_after == report["resourcesBefore"],
            "sofficeBinariesUnchanged": binary_after == report["binariesBefore"],
        }
        if not report["immutability"]["resourcesUnchanged"]:
            raise RuntimeError("reviewed resource identity changed during generation")
        if not report["immutability"]["sofficeBinariesUnchanged"]:
            raise RuntimeError("LibreOffice binary identity changed during generation")
        return {
            "case_root": case_root,
            "lo_base": lo_base,
            "lb": lb,
            "logs": logs,
            "sentinel": sentinel,
            "async_client": async_client,
            "opened_body": opened_body,
            "archive_body": archive_body,
        }
    finally:
        report["phase"] = "resource_shutdown"
        client_closed = False
        net_closed = False
        logs_closed = False
        materials_closed = False
        if async_client is not None:
            await async_client.aclose()
            client_closed = bool(async_client.is_closed)
        try:
            lb.net.client.close()
            net_closed = bool(lb.net.client.is_closed)
        except Exception as error:
            report["netCloseExceptionType"] = type(error).__name__
        try:
            logs.close()
            logs_closed = True
        except Exception as error:
            report["logsCloseExceptionType"] = type(error).__name__
        try:
            lb.materials.close()
            materials_closed = True
        except Exception as error:
            report["materialsCloseExceptionType"] = type(error).__name__
        sentinel.close()
        report["shutdown"] = {
            "asgiClientClosed": client_closed,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "materialsClosed": materials_closed,
            "retainerSentinelClosed": sentinel.closed,
            "retainerStarted": False,
        }
        report["cleanup"] = clean_owned_runtime(root, lo_base)
        if not all(
            (
                client_closed,
                net_closed,
                logs_closed,
                materials_closed,
                sentinel.closed,
            )
        ):
            raise RuntimeError("one or more owned resources did not close")
        if not (
            report["cleanup"]["caseTempGone"]
            and report["cleanup"]["loBaseGone"]
            and all(report["cleanup"]["privateEnvironmentDirectoriesRemoved"].values())
            and report["cleanup"]["caseAndEvidenceRetained"]
        ):
            raise RuntimeError("owned production temporary paths were not fully cleaned")


def build_base_report(
    descriptor: dict[str, Any],
    root: dict[str, pathlib.Path] | None,
    resources: list[dict[str, Any]] | None,
    binaries: dict[str, Any] | None,
) -> dict[str, Any]:
    return {
        "schema": "t23-genuine-plan-build-report-v1",
        "orderPath": str(ORDER_PATH),
        "state": "IN_PROCESS_ASGI_HTTP",
        "startedAtUtc": utc_now(),
        "finishedAtUtc": None,
        "phase": "initialization",
        "passed": False,
        "failure": None,
        "authorRuntime": "SOURCE_ONLY_NOT_RUN",
        "actualGenerationStarted": False,
        "helper": {
            "path": str(HELPER_PATH),
            "bytes": HELPER_PATH.stat().st_size,
            "sha256": sha256_file(HELPER_PATH),
        },
        "approvedInput": {
            "path": str(LITERAL_INPUTS),
            "bytes": LITERAL_INPUTS.stat().st_size,
            "sha256": sha256_file(LITERAL_INPUTS),
        },
        "process": {
            "pid": os.getpid(),
            "executable": os.path.realpath(sys.executable),
            "rootExternalProcessBirthCaptureRequired": True,
        },
        "source": {
            "caseRoot": descriptor["source_case_root"],
            "caseId": descriptor["case_id"],
            "taskId": descriptor["task_id"],
            "planRel": descriptor["plan_rel"],
            "fileCount": len(descriptor["source_case_inventory"]),
            "sourcePins": descriptor["source_pin_file"],
            "modelOrKeyRequired": False,
            "realLawyerConfirmation": False,
        },
        "root": {
            "root": str(root["root"]) if root else None,
            "caseRoot": str(root["case"]) if root else None,
            "appdata": str(root["appdata"]) if root else None,
        },
        "resourcesBefore": resources or [],
        "binariesBefore": binaries or {},
        "qualifications": [
            "The confirmed plan is an authorized synthetic confirmation, not real lawyer approval.",
            "This run verifies route-level generation and generated artifact structure/content; it does not certify business or legal correctness.",
            "PDF visual review remains a separate manual review after the actual artifacts exist.",
            "LibreOffice child-process network activity is not fully covered by the Python socket meter; inputs are trusted synthetic plain text and the current private LO profile enables BlockUntrustedRefererLinks.",
            "No complete operating-system process sweep is claimed; resources explicitly created by this helper are closed and owned temporary paths are checked.",
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--report", required=True)
    args = parser.parse_args()

    report_path: pathlib.Path | None = None
    descriptor: dict[str, Any] | None = None
    root: dict[str, pathlib.Path] | None = None
    report: dict[str, Any] | None = None
    try:
        report_path = assert_report_path(args.report)
        descriptor = verify_literal_inputs()
        resources = verify_resources(descriptor)
        source_pin_manifest = verify_source_pin_manifest(descriptor)
        binaries = verify_binaries(descriptor)
        root = prepare_root(args.root)
        report = build_base_report(descriptor, root, resources, binaries)
        report["sourcePinManifestBefore"] = source_pin_manifest
        report["phase"] = "source_inventory"
        source_root = pathlib.Path(descriptor["source_case_root"])
        source_before = snapshot_files(source_root)
        compare_inventory(source_before, descriptor["source_case_inventory"], "source")
        plan, task, plan_info = inspect_plan_and_task(descriptor, source_root)
        plain_txt_count = verify_plain_sources(descriptor, source_root)
        report["plan"] = {
            "path": plan_info["path"],
            "bytes": plan_info["bytes"],
            "sha256": plan_info["sha256"],
            "mtime_ns": plan_info["mtime_ns"],
            "exactConfirmedPlan": plan,
            "fieldCount": len(plan),
            "resultNonNull": plan["result"] is not None,
        }
        report["rawInputs"] = {
            "canonicalPlainTxtFiles": plain_txt_count,
            "inputPdfFiles": 0,
            "sourceFilesExactBeforeCopy": True,
        }

        report["phase"] = "exact_case_copy"
        copy_approved_case(root, descriptor)
        copied_after = snapshot_files(source_root)
        compare_inventory(copied_after, descriptor["source_case_inventory"], "source")
        protected = protected_case_snapshot(root["case"])
        report["copy"] = {
            "mode": "explicit_inventory_copy_not_copytree",
            "files": 30,
            "bytesAndMtimeExact": True,
            "sourceUnchangedAfterCopy": True,
            "protectedNonDbFiles": len(protected),
        }

        report["phase"] = "environment_isolation"
        scrub_environment(root["root"])
        report["environment"] = {
            "HOME": os.environ["HOME"],
            "USERPROFILE": os.environ["USERPROFILE"],
            "APPDATA": os.environ["APPDATA"],
            "LOCALAPPDATA": os.environ["LOCALAPPDATA"],
            "TEMP": os.environ["TEMP"],
            "TMP": os.environ["TMP"],
        }
        report["actualGenerationStarted"] = True
        report["phase"] = "actual_generation"
        result = asyncio.run(
            execute(
                root,
                descriptor,
                plan,
                task,
                protected,
                report,
            )
        )
        del result
        report["phase"] = "final_source_and_resource_check"
        source_after = snapshot_files(source_root)
        compare_inventory(source_after, descriptor["source_case_inventory"], "source")
        verify_resources(descriptor)
        report["sourcePinManifestAfter"] = verify_source_pin_manifest(descriptor)
        verify_binaries(descriptor)
        report["source"]["unchangedAfterRun"] = True
        report["source"]["sourcePinManifestUnchanged"] = (
            report["sourcePinManifestAfter"] == report["sourcePinManifestBefore"]
        )
        if not report["source"]["sourcePinManifestUnchanged"]:
            raise RuntimeError("source-pin manifest identity changed during generation")
        report["resourcesAfter"] = verify_resources(descriptor)
        report["binariesAfter"] = verify_binaries(descriptor)
        report["passed"] = True
        report["phase"] = "complete"
        report["status"] = "ACTUAL_ROUTE_GENERATION_AND_ARTIFACT_VERIFICATION_PASS"
        return 0
    except BaseException as error:
        if report is None and descriptor is not None:
            report = build_base_report(descriptor, root, None, None)
        if report is not None:
            report["failure"] = type(error).__name__
            report["status"] = "FAILED"
            report["passed"] = False
            if descriptor is not None:
                try:
                    final_source = snapshot_files(
                        pathlib.Path(descriptor["source_case_root"])
                    )
                    compare_inventory(
                        final_source,
                        descriptor["source_case_inventory"],
                        "source after failure",
                    )
                    report["sourceAfterFailureUnchanged"] = True
                except BaseException as source_error:
                    report["sourceAfterFailureUnchanged"] = False
                    report["sourceAfterFailureCheckExceptionType"] = type(source_error).__name__
            if root is not None:
                try:
                    report["cleanupAfterFailure"] = clean_owned_runtime(
                        root,
                        root["appdata"] / "临时" / "lo",
                    )
                except BaseException as cleanup_error:
                    report["cleanupAfterFailure"] = {
                        "exceptionType": type(cleanup_error).__name__,
                        "caseAndEvidenceRetained": ordinary_dir(root["case"]),
                    }
        return 1
    finally:
        if report is not None:
            report["finishedAtUtc"] = utc_now()
            if report_path is not None:
                try:
                    write_json_exclusive(report_path, report)
                except BaseException as write_error:
                    print(
                        f"report write failed: {type(write_error).__name__}",
                        file=sys.stderr,
                    )
                    return 1


if __name__ == "__main__":
    raise SystemExit(main())
