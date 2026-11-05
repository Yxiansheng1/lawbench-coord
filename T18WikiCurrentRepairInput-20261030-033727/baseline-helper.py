#!/usr/bin/env python3
"""Run one genuine current-B case-wiki pipeline on canonical synthetic sample02.

This source-only helper is for the root-controlled execution.  It:

* creates a private root and copies only the five approved TXT files;
* starts the actual B application without lifespan, OCR, retainer, forwarding,
  or a network listener;
* drives the real case-open, scan, pipeline-run, status, and source routes
  through httpx.ASGITransport;
* permits outbound HTTP only for GET /v1/models and
  POST /v1/chat/completions on the fixed approved 6000D host and port;
* keeps only request/response metadata, never authorization headers or bodies;
* calls the production pipeline exactly once and preserves its final checker,
  task, result, call record, material versions, citations, and file inventory;
* writes one new atomic root-run-report.json in the new private root.

The credential is read once from anonymous stdin as one bounded printable-ASCII
line.  It is never accepted from argv, environment variables, files, a keyring,
or a terminal.  The root owns the OS-level process/socket-handle audit.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import pathlib
import re
import secrets
import shutil
import stat
import sys
import threading
import time
from datetime import datetime, timezone
from typing import Any

import httpx


EVIDENCE_ROOT = pathlib.Path(__file__).resolve().parent
B_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
B_SERVICE = B_ROOT / "service"
B_CONTRACTS = B_ROOT / "contracts"
B_SKILLS = B_ROOT / "skills"
APPROVED_INPUTS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18CurrentWikiPipelineInput-20261030-031059"
    r"\approved-inputs.json"
)
SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18ArchiveWarningBSourcePins-20261030-003710.json"
)

APPROVED_INPUTS_BYTES = 5_207
APPROVED_INPUTS_SHA256 = (
    "80adbfce60c9bf55d8318a783f6a38647730827045d26af8e34f1cf690e870bf"
)
APPROVED_INPUTS_MTIME_NS = "1793301059153612300"

SOURCE_PINS_BYTES = 53_548
SOURCE_PINS_SHA256 = (
    "5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098"
)
SOURCE_PINS_MTIME_NS = "1793291870124255000"
SOURCE_PINS_ENTRIES = 346

TARGET_BASE = "http://10.126.126.1:8000/v1"
TARGET_HOST = "10.126.126.1"
TARGET_PORT = 8000
MODEL = "qwen38-27b"
STEP = "wiki_build"
PARAMS = {"thinking": "关闭", "window": "64K", "max_tokens": 16_384}
PIPELINE_SKILL = "case-wiki-build"
MAX_CREDENTIAL_BYTES = 4_096
PIPELINE_WAIT_SECONDS = 50 * 60
PIPELINE_JOIN_SECONDS = 60
STATUS_POLL_SECONDS = 0.5
RUN_NAME = re.compile(r"^run-[A-Za-z0-9_-]{6,64}$")
TASK_ID = re.compile(r"^P-[0-9]{14}-[0-9a-f]{4}$")
MATERIAL_ID = re.compile(r"^M[0-9]{4,}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
MAX_OWNED_ENTRIES = 2_000

EXPECTED_ORIGINALS = [
    {
        "path": r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\SKILL.md",
        "bytes": 10_884,
        "sha256": "739f3cf6a62546dba9c43ff2f1bcd9c3a5913f59fcafcf3ed7a1c32ee9b6ad20",
        "mtime_ns": "1792400314796479800",
    },
    {
        "path": r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\流水线提示词.md",
        "bytes": 10_092,
        "sha256": "8481c5b92559914774d71fc071361ce3b6091fd3f507bec94d81e20ab7cc9ebb",
        "mtime_ns": "1792379578783315800",
    },
    {
        "path": (
            r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\tests"
            r"\样本02-民间借贷\_任务说明.md"
        ),
        "bytes": 395,
        "sha256": "5125f728583360618fdf994eaea44f64654be1ea8d243165d1735f8e647fefb5",
        "mtime_ns": "1792379578780311200",
    },
    {
        "path": r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\tests\样本02-民间借贷\借条.txt",
        "bytes": 195,
        "sha256": "172cabc0716a4e4cf14bae35b401ddd97ba54c0dccad1fdbde37f1f7bdb948e5",
        "mtime_ns": "1792379578780311200",
    },
    {
        "path": (
            r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\tests"
            r"\样本02-民间借贷\微信聊天记录.txt"
        ),
        "bytes": 614,
        "sha256": "7da7fd82516e236aa0f5d2665eb88db0a9039a55548c063014845360b4e14b5a",
        "mtime_ns": "1792379578780311200",
    },
    {
        "path": (
            r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\tests"
            r"\样本02-民间借贷\民事答辩状.txt"
        ),
        "bytes": 529,
        "sha256": "57e7d5e75db4f05d310c1829c966599b1df4d1aa444331d1a4fdd762db0006fe",
        "mtime_ns": "1792379578780311200",
    },
    {
        "path": (
            r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\tests"
            r"\样本02-民间借贷\民事起诉状.txt"
        ),
        "bytes": 731,
        "sha256": "997395431a70af57f87aec3602a706db8e926f3e265f550f2998c3962319b99f",
        "mtime_ns": "1792379578780311200",
    },
    {
        "path": (
            r"D:\Lawbeach\lawbench-B\skills\case-wiki-build\tests"
            r"\样本02-民间借贷\银行转账记录.txt"
        ),
        "bytes": 495,
        "sha256": "9a14fcbee25a6426ff15cc6bb066282d1666a9befdf6f5c9fa897eef0df7f887",
        "mtime_ns": "1792379578781316200",
    },
]

EXPECTED_MATERIALS = {
    "借条.txt",
    "微信聊天记录.txt",
    "民事答辩状.txt",
    "民事起诉状.txt",
    "银行转账记录.txt",
}
EXPECTED_MATERIAL_NAMES = {
    "借条",
    "微信聊天记录",
    "民事答辩状",
    "民事起诉状",
    "银行转账记录",
}
WIKI_SECTIONS = {"当事人", "时间线", "争议焦点", "概览", "材料清单"}
CIVIL_TEMPLATE_DIRS = {
    "01委托手续",
    "02案件材料",
    "03一审",
    "03一审/我方文件",
    "03一审/我方证据",
    "03一审/对方文件",
    "03一审/对方证据",
    "03一审/庭审准备",
    "03一审/法院文书",
    "04二审",
    "04二审/我方文件",
    "04二审/我方证据",
    "04二审/对方文件",
    "04二审/对方证据",
    "04二审/庭审准备",
    "04二审/法院文书",
    "05执行",
    "05执行/执行申请",
    "05执行/财产线索",
    "05执行/法院文书",
    "06法律研究",
}


class RunFailure(RuntimeError):
    """A deliberately sanitized helper failure."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def ordinary_file(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except OSError:
        return False
    return (
        stat.S_ISREG(info.st_mode)
        and not stat.S_ISLNK(info.st_mode)
        and _not_reparse(info)
    )


def ordinary_dir(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except OSError:
        return False
    return (
        stat.S_ISDIR(info.st_mode)
        and not stat.S_ISLNK(info.st_mode)
        and _not_reparse(info)
        and path.resolve() == path
    )


def _not_reparse(info: os.stat_result) -> bool:
    return not (
        getattr(info, "st_file_attributes", 0)
        & getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    )


def file_identity(path: pathlib.Path) -> dict[str, Any]:
    info = os.lstat(path)
    if (
        not stat.S_ISREG(info.st_mode)
        or stat.S_ISLNK(info.st_mode)
        or not _not_reparse(info)
    ):
        raise RunFailure("identity_target_is_not_an_ordinary_file")
    return {
        "path": str(path),
        "bytes": info.st_size,
        "sha256": sha256_file(path),
        "mtime_ns": str(info.st_mtime_ns),
    }


def validate_new_root(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute():
        raise RunFailure("root_must_be_absolute")
    try:
        parent = root.parent.resolve()
    except OSError:
        raise RunFailure("root_parent_unreadable") from None
    if parent != EVIDENCE_ROOT:
        raise RunFailure("root_must_be_direct_child_of_evidence_directory")
    if RUN_NAME.fullmatch(root.name) is None:
        raise RunFailure("root_name_must_be_run_prefix")
    if os.path.lexists(root):
        raise RunFailure("root_must_be_new")
    return root


def assert_existing_root(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute() or root.parent.resolve() != EVIDENCE_ROOT:
        raise RunFailure("root_outside_evidence_directory")
    if RUN_NAME.fullmatch(root.name) is None or not ordinary_dir(root):
        raise RunFailure("root_is_not_an_ordinary_run_directory")
    return root


def read_credential() -> str:
    if sys.stdin is None or sys.stdin.isatty():
        raise RunFailure("credential_stdin_must_be_a_pipe")
    line = sys.stdin.buffer.readline(MAX_CREDENTIAL_BYTES + 2)
    if not line.endswith(b"\n"):
        raise RunFailure("credential_line_is_incomplete")
    raw = line[:-1]
    if raw.endswith(b"\r"):
        raw = raw[:-1]
    if not raw:
        raise RunFailure("credential_is_blank")
    if len(raw) > MAX_CREDENTIAL_BYTES:
        raise RunFailure("credential_is_oversize")
    if any(byte < 0x21 or byte > 0x7E for byte in raw):
        raise RunFailure("credential_is_not_bounded_printable_ascii")
    return raw.decode("ascii")


def scrub_environment(root: pathlib.Path) -> None:
    preserve = {
        name: os.environ[name]
        for name in ("SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT")
        if os.environ.get(name)
    }
    os.environ.clear()
    os.environ.update(preserve)
    for name, rel in (
        ("HOME", "home"),
        ("USERPROFILE", "home"),
        ("APPDATA", "appdata"),
        ("LOCALAPPDATA", "localappdata"),
        ("TEMP", "temp"),
        ("TMP", "temp"),
        ("TMPDIR", "temp"),
    ):
        path = root / rel
        path.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.environ[name] = str(path)
    os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
    os.environ["PYTHONUTF8"] = "1"
    os.environ["PATH"] = str(pathlib.Path(sys.executable).parent)


def sanitize_message(error: BaseException, credential: str) -> str:
    text = str(error)
    if credential:
        text = text.replace(credential, "[credential_redacted]")
    text = "".join(ch if ch >= " " and ch != "\x7f" else " " for ch in text)
    text = text.strip().replace("\n", " ")
    return text[:500]


def checked_identity_row(
    raw: Any,
    expected: dict[str, Any],
    label: str,
) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise RunFailure(f"{label}_row_is_not_an_object")
    fields = ("path", "bytes", "sha256", "mtime_ns")
    if any(raw.get(field) != expected.get(field) for field in fields):
        raise RunFailure(f"{label}_identity_changed")
    path = pathlib.Path(expected["path"])
    if not ordinary_file(path):
        raise RunFailure(f"{label}_is_not_an_ordinary_file")
    actual = file_identity(path)
    if any(actual[field] != expected[field] for field in fields):
        raise RunFailure(f"{label}_observed_identity_changed")
    return actual


def load_approved_inputs() -> tuple[dict[str, Any], dict[str, Any]]:
    if not ordinary_file(APPROVED_INPUTS):
        raise RunFailure("approved_inputs_missing")
    approved_identity = file_identity(APPROVED_INPUTS)
    expected_identity = {
        "path": str(APPROVED_INPUTS),
        "bytes": APPROVED_INPUTS_BYTES,
        "sha256": APPROVED_INPUTS_SHA256,
        "mtime_ns": APPROVED_INPUTS_MTIME_NS,
    }
    if approved_identity != expected_identity:
        raise RunFailure("approved_inputs_identity_changed")
    try:
        data = json.loads(APPROVED_INPUTS.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        raise RunFailure("approved_inputs_are_not_valid_json") from None
    if not isinstance(data, dict):
        raise RunFailure("approved_inputs_root_is_not_an_object")
    if data.get("b_root") != str(B_ROOT):
        raise RunFailure("approved_inputs_b_root_changed")
    pin_row = data.get("b_source_pins")
    if pin_row != {
        "path": str(SOURCE_PINS),
        "bytes": SOURCE_PINS_BYTES,
        "sha256": SOURCE_PINS_SHA256,
        "mtime_ns": SOURCE_PINS_MTIME_NS,
    }:
        raise RunFailure("approved_source_pin_row_changed")
    if (
        data.get("model") != MODEL
        or data.get("model_base") != TARGET_BASE
        or data.get("step") != STEP
        or data.get("use_prep") is not False
        or data.get("params") != PARAMS
        or data.get("source_only") is not True
        or data.get("author_runtime") != 0
        or data.get("author_must_not_read_or_copy_manual_notes") is not True
    ):
        raise RunFailure("approved_pipeline_literals_changed")

    originals = data.get("original_sources")
    if not isinstance(originals, list) or len(originals) != len(EXPECTED_ORIGINALS):
        raise RunFailure("approved_original_count_changed")
    by_path = {
        str(pathlib.Path(row["path"])): row
        for row in originals
        if isinstance(row, dict) and isinstance(row.get("path"), str)
    }
    if len(by_path) != len(originals):
        raise RunFailure("approved_original_paths_are_not_unique")
    for index, expected in enumerate(EXPECTED_ORIGINALS, start=1):
        raw = by_path.get(expected["path"])
        if raw is None:
            raise RunFailure(f"approved_original_{index}_is_missing")
        checked_identity_row(raw, expected, f"approved_original_{index}")

    materials = data.get("material_sources")
    if not isinstance(materials, list) or len(materials) != len(EXPECTED_MATERIALS):
        raise RunFailure("approved_material_count_changed")
    material_by_name: dict[str, dict[str, Any]] = {}
    for raw in materials:
        if not isinstance(raw, dict) or not isinstance(raw.get("path"), str):
            raise RunFailure("approved_material_row_is_invalid")
        path = pathlib.Path(raw["path"])
        if path.name in material_by_name or path.name not in EXPECTED_MATERIALS:
            raise RunFailure("approved_material_name_changed")
        canonical = by_path.get(raw["path"])
        if canonical is None or canonical != raw:
            raise RunFailure("approved_material_is_not_an_original")
        material_by_name[path.name] = canonical
    if set(material_by_name) != EXPECTED_MATERIALS:
        raise RunFailure("approved_material_set_changed")

    schema_row = data.get("schema")
    schema_expected = {
        "path": str(B_CONTRACTS / "api" / "pipeline_run.schema.json"),
        "bytes": 2_083,
        "sha256": "2f98e90edf9ee523901e24eaeb3f7b385477d42b48a004a1764bc9199dd313e4",
        "mtime_ns": "1792682285557911700",
    }
    checked_identity_row(schema_row, schema_expected, "pipeline_run_schema")

    python_row = data.get("python")
    python_expected = {
        "path": r"C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe",
        "bytes": 104_952,
        "sha256": "4d6f5f81a4bca11191c4c7c6b43632694d0a4ce74e068619d8fdc161d469859a",
        "mtime_ns": "1744088256000000000",
    }
    checked_identity_row(python_row, python_expected, "approved_python")

    if data.get("reader_only_manual_notes") != str(
        B_SKILLS / "case-wiki-build" / "tests" / "要点.md"
    ):
        raise RunFailure("reader_only_manual_notes_path_changed")
    return data, approved_identity


def source_pin_snapshot(strict: bool) -> dict[str, Any]:
    result: dict[str, Any] = {
        "pinFile": None,
        "entryCount": SOURCE_PINS_ENTRIES,
        "entries": [],
        "mismatches": [],
    }
    try:
        pin_identity = file_identity(SOURCE_PINS)
    except OSError as error:
        if strict:
            raise RunFailure("source_pin_file_unreadable") from error
        result["pinFile"] = {"errorType": type(error).__name__}
        return result
    result["pinFile"] = pin_identity
    expected_pin_identity = {
        "path": str(SOURCE_PINS),
        "bytes": SOURCE_PINS_BYTES,
        "sha256": SOURCE_PINS_SHA256,
        "mtime_ns": SOURCE_PINS_MTIME_NS,
    }
    if pin_identity != expected_pin_identity:
        result["mismatches"].append({"path": str(SOURCE_PINS), "kind": "pin_file"})
        if strict:
            raise RunFailure("source_pin_file_identity_changed")
    try:
        pins = json.loads(SOURCE_PINS.read_text(encoding="utf-8"))
    except (OSError, ValueError) as error:
        if strict:
            raise RunFailure("source_pin_file_invalid") from error
        result["mismatches"].append({"path": str(SOURCE_PINS), "kind": "json"})
        return result
    if not isinstance(pins, dict) or len(pins) != SOURCE_PINS_ENTRIES:
        if strict:
            raise RunFailure("source_pin_row_count_changed")
        result["mismatches"].append({"path": str(SOURCE_PINS), "kind": "row_count"})
        return result
    entries: list[dict[str, Any]] = []
    for relative in sorted(pins):
        expected = pins[relative]
        if not isinstance(relative, str) or not isinstance(expected, dict):
            if strict:
                raise RunFailure("source_pin_row_invalid")
            result["mismatches"].append({"path": str(relative), "kind": "row"})
            continue
        pure = pathlib.PurePosixPath(relative)
        if pure.is_absolute() or ".." in pure.parts:
            if strict:
                raise RunFailure("source_pin_path_escapes_repository")
            result["mismatches"].append({"path": relative, "kind": "path"})
            continue
        path = B_ROOT.joinpath(*pure.parts)
        try:
            actual = file_identity(path)
        except OSError as error:
            if strict:
                raise RunFailure(f"source_pin_target_unreadable:{relative}") from error
            result["mismatches"].append(
                {"path": relative, "kind": type(error).__name__}
            )
            continue
        expected_fields = {
            "path": str(path),
            "bytes": expected.get("bytes"),
            "sha256": expected.get("sha256"),
        }
        observed = {field: actual[field] for field in expected_fields}
        row = {
            "relativePath": relative,
            "bytes": actual["bytes"],
            "sha256": actual["sha256"],
            "mtime_ns": actual["mtime_ns"],
        }
        entries.append(row)
        if observed != expected_fields:
            result["mismatches"].append({"path": relative, "kind": "identity"})
            if strict:
                raise RunFailure(f"source_pin_identity_changed:{relative}")
    result["entries"] = entries
    return result


def expected_input_snapshot() -> list[dict[str, Any]]:
    return [file_identity(pathlib.Path(row["path"])) for row in EXPECTED_ORIGINALS]


def copy_approved_materials(
    root: pathlib.Path,
    approved: dict[str, Any],
) -> tuple[pathlib.Path, list[dict[str, Any]]]:
    case_root = root / "case"
    if os.path.lexists(case_root):
        raise RunFailure("private_case_already_exists")
    case_root.mkdir(mode=0o700)
    rows = approved["material_sources"]
    copied: list[dict[str, Any]] = []
    for row in sorted(rows, key=lambda item: pathlib.Path(item["path"]).name):
        source = pathlib.Path(row["path"])
        destination = case_root / source.name
        shutil.copy2(source, destination, follow_symlinks=False)
        observed = file_identity(destination)
        expected = {
            "path": str(destination),
            "bytes": row["bytes"],
            "sha256": row["sha256"],
            "mtime_ns": row["mtime_ns"],
        }
        if observed != expected:
            raise RunFailure(f"copied_material_identity_changed:{source.name}")
        copied.append(
            {
                "name": source.name,
                "source": str(source),
                "destination": str(destination),
                "bytes": row["bytes"],
                "sha256": row["sha256"],
                "mtime_ns": row["mtime_ns"],
            }
        )
    return case_root, copied


def inspect_original_area(case_root: pathlib.Path) -> dict[str, Any]:
    if not ordinary_dir(case_root):
        raise RunFailure("private_case_is_not_an_ordinary_directory")
    expected_files = EXPECTED_MATERIALS
    seen_files: set[str] = set()
    seen_dirs: set[str] = set()
    stack = [case_root]
    entries_seen = 0
    while stack:
        directory = stack.pop()
        for entry in directory.iterdir():
            entries_seen += 1
            if entries_seen > MAX_OWNED_ENTRIES:
                raise RunFailure("private_case_tree_is_too_large")
            relative = entry.relative_to(case_root).as_posix()
            if directory == case_root and entry.name in {"工作区", "成果"}:
                continue
            info = os.lstat(entry)
            if stat.S_ISLNK(info.st_mode) or not _not_reparse(info):
                raise RunFailure(f"private_case_contains_link_or_reparse:{relative}")
            if stat.S_ISDIR(info.st_mode):
                seen_dirs.add(relative)
                stack.append(entry)
            elif stat.S_ISREG(info.st_mode):
                if entry.name.startswith("."):
                    raise RunFailure(f"private_case_contains_hidden_file:{relative}")
                seen_files.add(relative)
            else:
                raise RunFailure(f"private_case_contains_non_ordinary_entry:{relative}")
    if seen_files != expected_files:
        raise RunFailure("private_case_original_file_set_changed")
    if seen_dirs != CIVIL_TEMPLATE_DIRS:
        raise RunFailure("private_case_original_directory_set_changed")
    for expected in EXPECTED_ORIGINALS:
        path = pathlib.Path(expected["path"])
        if path.name not in EXPECTED_MATERIALS:
            continue
        destination = case_root / path.name
        if file_identity(destination) != {
            "path": str(destination),
            "bytes": expected["bytes"],
            "sha256": expected["sha256"],
            "mtime_ns": expected["mtime_ns"],
        }:
            raise RunFailure(f"private_original_identity_changed:{path.name}")
    return {
        "fileCount": len(seen_files),
        "files": sorted(seen_files),
        "directoryCount": len(seen_dirs),
        "directories": sorted(seen_dirs),
    }


class SafeOutboundTransport(httpx.BaseTransport):
    """A shared real HTTPTransport with exact-route admission and metadata only."""

    def __init__(self) -> None:
        self._inner = httpx.HTTPTransport(trust_env=False, retries=0)
        self._lock = threading.Lock()
        self._closed = False
        self._attempts = 0
        self._denied = 0
        self._close_calls = 0
        self._owner_close_calls = 0
        self._records: list[dict[str, Any]] = []
        self._owners: list[Any] = []

    @property
    def closed(self) -> bool:
        return self._closed

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        return self._dispatch(request, self._inner)

    def owner(self) -> "ObservedClientTransport":
        with self._lock:
            if self._closed:
                raise RunFailure("cannot_create_transport_owner_after_shutdown")
            owner = ObservedClientTransport(self)
            self._owners.append(owner)
            return owner

    def _owner_closed(self, owner: "ObservedClientTransport") -> None:
        with self._lock:
            self._owner_close_calls += 1

    def _dispatch(
        self,
        request: httpx.Request,
        inner: httpx.BaseTransport,
    ) -> httpx.Response:
        with self._lock:
            self._attempts += 1
            sequence = self._attempts
            closed = self._closed
        if closed:
            raise httpx.ConnectError("shared outbound transport already closed", request=request)

        method = request.method.upper()
        path = request.url.path
        host = (request.url.host or "").lower()
        port = request.url.port or 80
        allowed = (
            request.url.scheme == "http"
            and host == TARGET_HOST
            and port == TARGET_PORT
            and (
                (method == "GET" and path == "/v1/models")
                or (method == "POST" and path == "/v1/chat/completions")
            )
        )
        metadata: dict[str, Any] = {
            "sequence": sequence,
            "startedAtUtc": utc_now(),
            "method": method,
            "path": path,
            "host": host,
            "port": port,
            "model": None,
            "maxTokens": None,
            "thinking": None,
            "sessionHeaderPresent": request.headers.get("x-session-id") is not None,
            "status": None,
            "elapsedMs": None,
            "errorType": None,
            "denied": not allowed,
            "redirect": False,
        }
        if method == "POST":
            try:
                payload = json.loads(request.content)
            except (ValueError, UnicodeError):
                payload = None
            if isinstance(payload, dict):
                metadata["model"] = payload.get("model")
                metadata["maxTokens"] = payload.get("max_tokens")
                options = payload.get("chat_template_kwargs")
                if isinstance(options, dict):
                    if options.get("enable_thinking") is False:
                        metadata["thinking"] = "OFF"
                    elif options.get("enable_thinking") is True:
                        metadata["thinking"] = options.get("reasoning_effort") or "ON"
                    else:
                        metadata["thinking"] = "UNSPECIFIED"
        if not allowed:
            with self._lock:
                self._denied += 1
                self._records.append(dict(metadata))
            raise httpx.ConnectError("outbound route denied", request=request)

        started = time.monotonic()
        try:
            response = inner.handle_request(request)
        except BaseException as error:
            metadata["elapsedMs"] = round((time.monotonic() - started) * 1_000, 1)
            metadata["errorType"] = type(error).__name__
            with self._lock:
                self._records.append(dict(metadata))
            raise
        metadata["status"] = response.status_code
        metadata["elapsedMs"] = round((time.monotonic() - started) * 1_000, 1)
        metadata["redirect"] = bool(response.is_redirect or 300 <= response.status_code < 400)
        with self._lock:
            self._records.append(dict(metadata))
        return response

    def close(self) -> None:
        """Per-request production clients may close this shared wrapper safely."""
        with self._lock:
            self._close_calls += 1

    def shutdown(self) -> None:
        with self._lock:
            if self._closed:
                return
            self._closed = True
            owners = list(self._owners)
        self._inner.close()
        for owner in owners:
            owner.close()

    def __enter__(self) -> "SafeOutboundTransport":
        return self

    def __exit__(self, exc_type, exc, traceback) -> bool:
        return False

    def evidence(self) -> dict[str, Any]:
        with self._lock:
            records = [dict(item) for item in self._records]
            close_calls = self._close_calls
            denied = self._denied
            attempts = self._attempts
            closed = self._closed
            owner_close_calls = self._owner_close_calls
            owners = list(self._owners)
        attempts_by_route: dict[str, int] = {}
        for item in records:
            key = f"{item['method']} {item['path']} {item['host']}:{item['port']}"
            attempts_by_route[key] = attempts_by_route.get(key, 0) + 1
        return {
            "attempts": attempts,
            "denied": denied,
            "attemptsByRoute": dict(sorted(attempts_by_route.items())),
            "perRequestCloseCalls": close_calls,
            "ownerClientCloseCalls": owner_close_calls,
            "ownerCount": len(owners),
            "ownersClosed": sum(1 for owner in owners if owner.closed),
            "wrapperShutdown": closed,
            "records": records,
        }


class ObservedClientTransport(httpx.BaseTransport):
    """One real connection pool for one production per-request client."""

    def __init__(self, shared: SafeOutboundTransport) -> None:
        self._shared = shared
        self._inner = httpx.HTTPTransport(trust_env=False, retries=0)
        self._lock = threading.Lock()
        self._closed = False

    @property
    def closed(self) -> bool:
        return self._closed

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        with self._lock:
            if self._closed:
                raise httpx.ConnectError("per-request transport is closed", request=request)
        return self._shared._dispatch(request, self._inner)

    def close(self) -> None:
        with self._lock:
            if self._closed:
                return
            self._closed = True
        self._inner.close()
        self._shared._owner_closed(self)

    def __enter__(self) -> "ObservedClientTransport":
        return self

    def __exit__(self, exc_type, exc, traceback) -> bool:
        self.close()
        return False


def loc_text(loc: dict[str, Any]) -> str:
    unit = loc.get("unit")
    if unit in {"page", "para", "line"}:
        word = {"page": "页", "para": "段", "line": "行"}[unit]
        start = loc.get("from")
        end = loc.get("to")
        if not isinstance(start, int) or isinstance(start, bool) or start < 1:
            raise RunFailure("citation_loc_start_invalid")
        if end is None or end == start:
            return f"第{start}{word}"
        if not isinstance(end, int) or isinstance(end, bool) or end < start:
            raise RunFailure("citation_loc_end_invalid")
        return f"第{start}-{end}{word}"
    if unit == "cell":
        sheet = loc.get("sheet")
        ref = loc.get("ref")
        if not isinstance(sheet, str) or not isinstance(ref, str):
            raise RunFailure("citation_cell_invalid")
        return f"{sheet}!{ref}"
    raise RunFailure("citation_loc_unit_unsupported")


def citation_text(citation: dict[str, Any]) -> str:
    name = citation.get("name")
    loc = citation.get("loc")
    if not isinstance(name, str) or not name or " " in name or "〔" in name or "〕" in name:
        raise RunFailure("citation_material_name_unsupported")
    if not isinstance(loc, dict):
        raise RunFailure("citation_loc_missing")
    return f"〔{name} {loc_text(loc)}〕"


def walk_owned_files(base: pathlib.Path) -> dict[str, dict[str, Any]]:
    if not ordinary_dir(base):
        raise RunFailure(f"owned_directory_missing:{base}")
    files: dict[str, dict[str, Any]] = {}
    stack = [base]
    entries_seen = 0
    while stack:
        directory = stack.pop()
        for entry in directory.iterdir():
            entries_seen += 1
            if entries_seen > MAX_OWNED_ENTRIES:
                raise RunFailure(f"owned_directory_too_large:{base.name}")
            relative = entry.relative_to(base).as_posix()
            info = os.lstat(entry)
            if stat.S_ISLNK(info.st_mode) or not _not_reparse(info):
                raise RunFailure(f"owned_path_contains_link_or_reparse:{relative}")
            if stat.S_ISDIR(info.st_mode):
                stack.append(entry)
            elif stat.S_ISREG(info.st_mode):
                files[relative] = {
                    "path": relative,
                    "bytes": info.st_size,
                    "sha256": sha256_file(entry),
                    "mtime_ns": str(info.st_mtime_ns),
                }
            else:
                raise RunFailure(f"owned_path_contains_non_ordinary_entry:{relative}")
    return files


def read_json_path(path: pathlib.Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_report_atomic_new(path: pathlib.Path, value: dict[str, Any]) -> None:
    if os.path.lexists(path):
        raise RunFailure("root_run_report_already_exists")
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    with temporary.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())
    try:
        os.link(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


async def execute(
    root: pathlib.Path,
    credential: str,
) -> tuple[int, dict[str, Any]]:
    started_at = utc_now()
    report: dict[str, Any] = {
        "format": "lawbench-t18-current-wiki-pipeline-run-v1",
        "kind": "actual-production-pipeline",
        "task": "B-T18-current-wiki-pipeline-20261030-031059",
        "startedAtUtc": started_at,
        "finishedAtUtc": None,
        "status": "FAILED",
        "exception": None,
        "root": str(root),
        "protocol": {
            "caseWikiPipeline": True,
            "nativeAgent": False,
            "nativeSessionUuid": None,
            "lifespanStarted": False,
            "forwardListener": False,
            "usePrep": False,
            "ocrStarted": False,
            "retainerStarted": False,
            "questionsAsked": 0,
        },
        "inputs": {},
        "service": {
            "requestCounts": {},
            "settingsTarget": TARGET_BASE,
            "validateResponses": True,
            "authenticationExercised": True,
        },
        "credential": {
            "source": "anonymous-stdin",
            "accepted": True,
            "persistedByHelper": False,
            "environmentKeyUsed": False,
            "fileKeyUsed": False,
            "keyringUsed": False,
        },
        "materials": {},
        "pipeline": {},
        "task": {},
        "result": {},
        "record": {},
        "wiki": {},
        "citations": {},
        "outbound": {},
        "cleanup": {},
        "checks": {},
    }
    approved: dict[str, Any] | None = None
    approved_identity_before: dict[str, Any] | None = None
    source_before: dict[str, Any] | None = None
    originals_before: list[dict[str, Any]] | None = None
    case_root: pathlib.Path | None = None
    safe_transport: SafeOutboundTransport | None = None
    app: Any | None = None
    lb: Any | None = None
    logs_module: Any | None = None
    contracts_module: Any | None = None
    asgi_client: httpx.AsyncClient | None = None
    app_token = ""
    case_id: str | None = None
    task_id: str | None = None
    pipeline_terminal = False
    status_history: list[dict[str, Any]] = []
    request_counts: dict[str, int] = {}
    functional_error: BaseException | None = None
    timeout_failure = False
    cancel_transport: str | None = None
    cancel_requested = False
    pipeline_join_seconds_used = 0
    cleanup_failures: list[dict[str, str]] = []
    external_key_calls = 0

    async def api(
        method: str,
        path: str,
        *,
        payload: Any | None = None,
        query: dict[str, str] | None = None,
    ) -> dict[str, Any]:
        nonlocal asgi_client
        if asgi_client is None:
            raise RunFailure("asgi_client_unavailable")
        key = f"{method.upper()} {path}"
        request_counts[key] = request_counts.get(key, 0) + 1
        response = await asgi_client.request(
            method,
            path,
            json=payload,
            params=query,
        )
        try:
            body = response.json()
        except ValueError:
            raise RunFailure(f"non_json_service_response:{method}:{path}") from None
        if response.status_code != 200:
            raise RunFailure(f"service_http_status:{method}:{path}:{response.status_code}")
        if not isinstance(body, dict) or body.get("ok") is not True:
            code = body.get("error", {}).get("code") if isinstance(body, dict) else None
            raise RunFailure(f"service_failure:{method}:{path}:{code or 'UNKNOWN'}")
        value = body.get("value")
        if not isinstance(value, dict):
            raise RunFailure(f"service_value_not_object:{method}:{path}")
        return value

    try:
        source_before = source_pin_snapshot(strict=True)
        approved, approved_identity_before = load_approved_inputs()
        originals_before = expected_input_snapshot()
        report["inputs"] = {
            "approvedInputsBefore": approved_identity_before,
            "sourcePinsBefore": source_before,
            "source8Before": originals_before,
            "readerOnlyManualNotesRead": False,
            "publicTaskUsedAsPrompt": False,
            "goldenOrExpectedFactsRead": False,
        }
        case_root, copied = copy_approved_materials(root, approved)
        report["inputs"]["copiedMaterials"] = copied
        scrub_environment(root)

        sys.path.insert(0, str(B_SERVICE))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench import net as imported_net
        from lawbench.app import create_app
        from lawbench.config import Config

        contracts_module = imported_contracts
        logs_module = imported_logs
        report["service"]["contractVersion"] = contracts_module.version()

        def key_getter() -> str:
            return credential

        def refuse_external_key() -> str:
            nonlocal external_key_calls
            external_key_calls += 1
            raise RunFailure("external_key_getter_must_not_be_called")

        safe_transport = SafeOutboundTransport()
        app_token = secrets.token_urlsafe(48)
        app = create_app(
            Config(
                token=app_token,
                appdata=root / "appdata",
                port=0,
                forward_port=0,
                skills_dirs=[B_SKILLS],
                contracts_dir=B_CONTRACTS,
                validate_responses=True,
            ),
            key_getter=key_getter,
            external_key_getter=refuse_external_key,
            transport=safe_transport,
        )
        lb = app.state.lb

        def own_client() -> httpx.Client:
            """Match Net.own_client while giving each close its own pool."""
            return httpx.Client(
                follow_redirects=False,
                trust_env=False,
                transport=safe_transport.owner(),
                verify=imported_net._ssl_context(),
                timeout=httpx.Timeout(
                    imported_net.REQUEST_TIMEOUT,
                    connect=imported_net.CONNECT_TIMEOUT,
                ),
                event_hooks={
                    "request": [lambda request: lb.net.allow.check(request.url)],
                    "response": [imported_net._check_redirect],
                },
            )

        lb.net.own_client = own_client
        asgi_client = httpx.AsyncClient(
            transport=httpx.ASGITransport(app=app),
            base_url="http://lawbench.test",
            headers={
                "Authorization": f"Bearer {app_token}",
                "Accept": "application/json",
            },
            timeout=httpx.Timeout(30.0, connect=5.0),
        )

        settings = await api("GET", "/api/settings")
        servers = dict(settings.get("servers") or {})
        servers.update(
            {
                "llm_base_url": TARGET_BASE,
                "llm_alt_base_url": TARGET_BASE,
                "prep_base_url": TARGET_BASE,
                "prep_alt_base_url": TARGET_BASE,
            }
        )
        settings["servers"] = servers
        await api("PUT", "/api/settings", payload=settings)

        opened = await api(
            "POST",
            "/api/case/open",
            payload={
                "path": str(case_root),
                "template": "civil",
                "kind": "civil",
            },
        )
        case_id = opened.get("case_id")
        if not isinstance(case_id, str):
            raise RunFailure("case_open_did_not_return_case_id")
        report["materials"]["caseOpen"] = opened

        scan = await api("POST", "/api/materials/scan", payload={"case_id": case_id})
        report["materials"]["scan"] = scan
        if (
            scan.get("added") != len(EXPECTED_MATERIALS)
            or scan.get("changed") != 0
            or scan.get("removed") != 0
            or scan.get("failed") != 0
        ):
            raise RunFailure("material_scan_summary_not_exact_five_successes")

        listed = await api("GET", "/api/materials", query={"case_id": case_id})
        listed_rows = listed.get("materials")
        if not isinstance(listed_rows, list) or len(listed_rows) != len(EXPECTED_MATERIALS):
            raise RunFailure("material_response_set_changed")
        observed_names = {
            row.get("name")
            for row in listed_rows
            if isinstance(row, dict)
        }
        if observed_names != EXPECTED_MATERIAL_NAMES:
            raise RunFailure("material_response_names_changed")
        expected_versions = {
            pathlib.Path(row["path"]).stem: row["sha256"]
            for row in EXPECTED_ORIGINALS
            if pathlib.Path(row["path"]).name in EXPECTED_MATERIALS
        }
        version_by_name: dict[str, str] = {}
        ids_by_name: dict[str, str] = {}
        for row in listed_rows:
            if not isinstance(row, dict):
                raise RunFailure("material_response_row_invalid")
            name = row.get("name")
            material_id = row.get("material_id")
            if (
                row.get("status") != "parsed"
                or row.get("error") is not None
                or row.get("type") != "txt"
                or row.get("is_ocr") != "none"
                or not isinstance(row.get("unit_count"), int)
                or isinstance(row.get("unit_count"), bool)
                or row["unit_count"] < 1
                or not isinstance(material_id, str)
                or MATERIAL_ID.fullmatch(material_id) is None
            ):
                raise RunFailure("material_response_row_not_parsed")
            index = lb.materials.index(case_id)
            indexed = next(
                (
                    item
                    for item in index.get("materials", [])
                    if item.get("material_id") == material_id
                ),
                None,
            )
            if (
                not isinstance(indexed, dict)
                or indexed.get("name") != name
                or indexed.get("type") != "txt"
                or indexed.get("status") != "parsed"
                or indexed.get("sha256") != expected_versions.get(name)
            ):
                raise RunFailure("material_index_version_identity_changed")
            version_by_name[name] = indexed["sha256"]
            ids_by_name[name] = material_id
        if set(version_by_name) != EXPECTED_MATERIAL_NAMES:
            raise RunFailure("material_index_name_set_changed")
        originals_after_scan = inspect_original_area(case_root)
        report["materials"].update(
            {
                "caseRoot": str(case_root),
                "listed": listed_rows,
                "idsByName": dict(sorted(ids_by_name.items())),
                "versionsByName": dict(sorted(version_by_name.items())),
                "originalArea": originals_after_scan,
            }
        )

        run_body = {
            "case_id": case_id,
            "step": STEP,
            "use_prep": False,
            "params": dict(PARAMS),
        }
        run_response = await api("POST", "/api/pipeline/run", payload=run_body)
        task_id = run_response.get("task_id")
        if not isinstance(task_id, str) or TASK_ID.fullmatch(task_id) is None:
            raise RunFailure("pipeline_run_did_not_return_p_task")
        report["pipeline"] = {
            "requestBody": run_body,
            "runRequestCount": 1,
            "taskId": task_id,
            "statusHistory": status_history,
            "waitLimitSeconds": PIPELINE_WAIT_SECONDS,
            "timedOut": False,
        }

        deadline = time.monotonic() + PIPELINE_WAIT_SECONDS
        last_status: str | None = None
        while True:
            status_value = await api(
                "GET",
                f"/api/pipeline/{task_id}",
            )
            status = status_value.get("status")
            if not isinstance(status, str):
                raise RunFailure("pipeline_status_value_invalid")
            if status != last_status:
                status_history.append(
                    {
                        "atUtc": utc_now(),
                        "status": status,
                        "stepIndex": status_value.get("step_index"),
                        "stepTotal": status_value.get("step_total"),
                        "current": status_value.get("current"),
                        "queueWaitMs": status_value.get("queue_wait_ms"),
                        "notice": status_value.get("notice"),
                    }
                )
                last_status = status
            if status != "running":
                pipeline_terminal = True
                break
            if time.monotonic() >= deadline:
                timeout_failure = True
                raise RunFailure("pipeline_wait_timed_out")
            await asyncio.sleep(STATUS_POLL_SECONDS)

        join_started = time.monotonic()
        lb.pipelines.wait(task_id, PIPELINE_JOIN_SECONDS)
        pipeline_join_seconds_used = round(time.monotonic() - join_started, 3)

        task_path = case_root / "工作区" / "任务" / task_id / "task.json"
        result_path = case_root / "工作区" / "任务" / task_id / "result.json"
        record_path = case_root / "工作区" / "任务" / task_id / "运行记录.json"
        task_data = read_json_path(task_path)
        contracts_module.validate("files/task.schema.json", "", task_data)
        result_data = lb.tasks.result(str(case_root), task_id)
        if not isinstance(result_data, dict):
            raise RunFailure("task_result_is_not_an_object")
        if task_data.get("task_id") != task_id or task_data.get("case_id") != case_id:
            raise RunFailure("task_identity_changed")
        if (
            task_data.get("kind") != "pipeline"
            or task_data.get("session_id") is not None
            or task_data.get("skill") != PIPELINE_SKILL
            or task_data.get("entry") != PIPELINE_SKILL
            or task_data.get("step") != STEP
            or task_data.get("params") != PARAMS
            or task_data.get("state") != "finished"
        ):
            raise RunFailure("pipeline_task_metadata_changed")
        budget = task_data.get("budget")
        if (
            not isinstance(budget, dict)
            or budget.get("tool_calls") != 1
            or budget.get("minutes") != 45
            or not isinstance(budget.get("model_calls"), int)
            or isinstance(budget.get("model_calls"), bool)
            or budget["model_calls"] < 1
        ):
            raise RunFailure("pipeline_budget_not_production_wiki_budget")

        record_data: dict[str, Any] | None = None
        if ordinary_file(record_path):
            raw_record = read_json_path(record_path)
            if isinstance(raw_record, dict):
                record_data = raw_record
        if record_data is None:
            raise RunFailure("pipeline_run_record_missing")
        calls = record_data.get("调用")
        if not isinstance(calls, list):
            raise RunFailure("pipeline_call_record_invalid")
        if result_data.get("task_id") != task_id:
            raise RunFailure("result_task_identity_changed")
        if not isinstance(result_data.get("status"), str):
            raise RunFailure("result_status_missing")

        final_check = result_data.get("citation_check")
        if final_check is None:
            final_check_status = "UNAVAILABLE"
        elif not isinstance(final_check, dict) or not isinstance(final_check.get("passed"), bool):
            raise RunFailure("production_final_check_invalid")
        elif final_check["passed"]:
            final_check_status = "PASS"
        else:
            final_check_status = "FAILED"

        after_pipeline_list = await api(
            "GET",
            "/api/materials",
            query={"case_id": case_id},
        )
        after_rows = after_pipeline_list.get("materials")
        if not isinstance(after_rows, list):
            raise RunFailure("post_pipeline_material_response_invalid")
        current_index = lb.materials.index(case_id)
        current_input_versions = {
            row.get("name"): row.get("sha256")
            for row in current_index.get("materials", [])
            if isinstance(row, dict)
        }
        if (
            current_input_versions != version_by_name
            or current_input_versions != expected_versions
        ):
            raise RunFailure("material_versions_changed_during_pipeline")

        wiki_base = case_root / "工作区" / "wiki"
        wiki_files = walk_owned_files(wiki_base)
        material_files = {f"材料/{material_id}.md" for material_id in ids_by_name.values()}
        expected_wiki_files = {
            "case.json",
            "index.md",
            "log.md",
            *{f"案件/{section}.md" for section in WIKI_SECTIONS},
            *material_files,
        }
        if result_data.get("status") == "completed" and set(wiki_files) != expected_wiki_files:
            raise RunFailure("wiki_file_inventory_is_not_finite_expected_set")
        case_card_path = wiki_base / "case.json"
        if result_data.get("status") == "completed":
            case_card = read_json_path(case_card_path)
            contracts_module.validate("files/case_card.schema.json", "", case_card)
            if (
                case_card.get("case_id") != case_id
                or case_card.get("generated_by") != task_id
                or {
                    item.get("material_id"): item.get("sha256")
                    for item in case_card.get("materials_at_generation", [])
                    if isinstance(item, dict)
                }
                != expected_versions
            ):
                raise RunFailure("case_card_identity_or_material_versions_changed")

        task_base = case_root / "工作区" / "任务" / task_id
        task_files = walk_owned_files(task_base)
        draft_paths = {
            item.get("path")
            for item in result_data.get("drafts", [])
            if isinstance(item, dict)
        }
        task_prefix = f"工作区/任务/{task_id}/"
        expected_task_files = {"task.json", "result.json", "运行记录.json"}
        for draft_path in draft_paths:
            if not isinstance(draft_path, str) or not draft_path.startswith(task_prefix):
                raise RunFailure("task_draft_path_invalid")
            expected_task_files.add(draft_path[len(task_prefix):])
        if set(task_files) != expected_task_files:
            raise RunFailure("task_file_inventory_is_not_finite_expected_set")

        citations = result_data.get("citations")
        if not isinstance(citations, list):
            raise RunFailure("result_citations_invalid")
        deduped: dict[tuple[str, str], dict[str, Any]] = {}
        for item in citations:
            if not isinstance(item, dict):
                raise RunFailure("result_citation_row_invalid")
            material_id = item.get("material_id")
            loc = item.get("loc")
            if not isinstance(material_id, str) or not isinstance(loc, dict):
                raise RunFailure("result_citation_identity_invalid")
            key = (material_id, json.dumps(loc, ensure_ascii=False, sort_keys=True))
            deduped[key] = item

        source_results: list[dict[str, Any]] = []
        source_failures: list[dict[str, Any]] = []
        for item in deduped.values():
            try:
                citation = citation_text(item)
            except RunFailure as error:
                source_failures.append(
                    {"materialId": item.get("material_id"), "kind": str(error)}
                )
                continue
            request_counts["GET /api/source"] = request_counts.get("GET /api/source", 0) + 1
            response = await asgi_client.get(
                "/api/source",
                params={
                    "case_id": case_id,
                    "material_id": item["material_id"],
                    "citation": citation,
                    "task_id": task_id,
                },
            )
            try:
                body = response.json()
            except ValueError:
                body = None
            if (
                response.status_code != 200
                or not isinstance(body, dict)
                or body.get("ok") is not True
                or not isinstance(body.get("value"), dict)
            ):
                source_failures.append(
                    {
                        "materialId": item.get("material_id"),
                        "citation": citation,
                        "httpStatus": response.status_code,
                        "errorCode": (
                            body.get("error", {}).get("code")
                            if isinstance(body, dict)
                            else None
                        ),
                    }
                )
                continue
            value = body["value"]
            text = value.get("text")
            if value.get("name") != item.get("name") or value.get("loc") != item.get("loc"):
                source_failures.append(
                    {
                        "materialId": item.get("material_id"),
                        "citation": citation,
                        "kind": "response_identity_mismatch",
                    }
                )
                continue
            source_results.append(
                {
                    "materialId": item["material_id"],
                    "materialVersion": item.get("material_version"),
                    "name": value.get("name"),
                    "loc": value.get("loc"),
                    "sourceChanged": value.get("source_changed"),
                    "originalStatus": value.get("original_status"),
                    "textChars": len(text) if isinstance(text, str) else None,
                    "textSha256": sha256_text(text) if isinstance(text, str) else None,
                    "pagePngPresent": value.get("page_png_base64") is not None,
                }
            )

        report["task"] = {
            "taskJson": task_data,
            "taskJsonSha256": sha256_file(task_path),
            "resultJsonSha256": sha256_file(result_path),
            "recordJsonSha256": sha256_file(record_path),
            "files": task_files,
            "pipelineJoinSecondsUsed": pipeline_join_seconds_used,
        }
        report["result"] = {
            "status": result_data.get("status"),
            "usage": result_data.get("usage"),
            "drafts": result_data.get("drafts"),
            "citationCheck": final_check,
            "productionFinalCheckStatus": final_check_status,
            "coverage": result_data.get("coverage"),
            "citations": citations,
            "finishedAt": result_data.get("finished_at"),
        }
        report["record"] = {
            "content": record_data,
            "callCount": len(calls),
            "budget": budget,
        }
        report["materials"]["currentAfterPipeline"] = after_rows
        report["materials"]["currentVersionsByName"] = dict(
            sorted(current_input_versions.items())
        )
        report["materials"]["originalAreaAfterPipeline"] = inspect_original_area(case_root)
        report["wiki"] = {
            "base": str(wiki_base),
            "files": wiki_files,
            "fileCount": len(wiki_files),
        }
        report["citations"] = {
            "producedCount": len(citations),
            "deduplicatedCount": len(deduped),
            "sourceEndpointExercisedForP": bool(deduped),
            "sourceEndpointSupportedForP": (
                None
                if not deduped
                else (
                    False
                    if any(failure.get("httpStatus") == 404 for failure in source_failures)
                    else bool(source_results)
                )
            ),
            "resolvedCount": len(source_results),
            "failedCount": len(source_failures),
            "resolutions": source_results,
            "failures": source_failures,
        }

        if result_data.get("status") == "completed":
            execution_status = (
                "COMPLETED_FINAL_CHECK_PASSED"
                if final_check_status == "PASS"
                else "COMPLETED_FINAL_CHECK_FAILED"
            )
        else:
            execution_status = f"PIPELINE_{str(result_data.get('status')).upper()}"
            raise RunFailure(f"pipeline_terminal_without_completion:{result_data.get('status')}")
        report["status"] = execution_status
    except BaseException as error:  # report every functional failure, including timeouts
        functional_error = error
        report["exception"] = {
            "type": type(error).__name__,
            "message": sanitize_message(error, credential),
        }
    finally:
        report["service"]["requestCounts"] = dict(sorted(request_counts.items()))
        if isinstance(report.get("pipeline"), dict):
            report["pipeline"]["timedOut"] = timeout_failure
        if lb is not None and task_id is not None and not pipeline_terminal:
            try:
                if asgi_client is not None:
                    try:
                        await api("POST", f"/api/pipeline/{task_id}/cancel")
                        cancel_transport = "api"
                    except BaseException:
                        lb.pipelines.cancel(task_id)
                        cancel_transport = "production_store"
                else:
                    lb.pipelines.cancel(task_id)
                    cancel_transport = "production_store"
                cancel_requested = True
                join_started = time.monotonic()
                lb.pipelines.wait(task_id, PIPELINE_JOIN_SECONDS)
                pipeline_join_seconds_used = round(time.monotonic() - join_started, 3)
            except BaseException as error:
                cleanup_failures.append(
                    {"resource": "pipeline_cancel_or_join", "type": type(error).__name__}
                )

        asgi_closed = False
        if asgi_client is not None:
            try:
                await asgi_client.aclose()
                asgi_closed = bool(asgi_client.is_closed)
            except BaseException as error:
                cleanup_failures.append(
                    {"resource": "asgi_client", "type": type(error).__name__}
                )
        net_client_closed = False
        retainer_close_returned = False
        if lb is not None:
            try:
                lb.net.client.close()
                net_client_closed = bool(lb.net.client.is_closed)
            except BaseException as error:
                cleanup_failures.append(
                    {"resource": "net_primary_client", "type": type(error).__name__}
                )
            try:
                lb.retainer.close()
                retainer_close_returned = True
            except BaseException as error:
                cleanup_failures.append(
                    {"resource": "retainer", "type": type(error).__name__}
                )
        transport_shutdown = False
        if safe_transport is not None:
            try:
                safe_transport.shutdown()
                transport_shutdown = safe_transport.closed
            except BaseException as error:
                cleanup_failures.append(
                    {
                        "resource": "safe_outbound_transport",
                        "type": type(error).__name__,
                    }
                )
        logs_close_returned = False
        if logs_module is not None:
            try:
                logs_module.close()
                logs_close_returned = True
            except BaseException as error:
                cleanup_failures.append(
                    {"resource": "logs", "type": type(error).__name__}
                )

        report["outbound"] = (
            safe_transport.evidence()
            if safe_transport is not None
            else {
                "attempts": 0,
                "denied": 0,
                "attemptsByRoute": {},
                "perRequestCloseCalls": 0,
                "wrapperShutdown": False,
                "records": [],
            }
        )
        all_owner_transports_closed = (
            report["outbound"].get("ownerCount")
            == report["outbound"].get("ownersClosed")
        )
        report["cleanup"] = {
            "cancelRequested": cancel_requested,
            "cancelTransport": cancel_transport,
            "pipelineJoinSecondsUsed": pipeline_join_seconds_used,
            "asgiClientClosed": asgi_closed,
            "netPrimaryClientClosed": net_client_closed,
            "retainerCloseReturned": retainer_close_returned,
            "outboundTransportShutdown": transport_shutdown,
            "allOwnerTransportsClosed": all_owner_transports_closed,
            "logsCloseReturned": logs_close_returned,
            "ocrStarted": False,
            "ocrStopInvoked": False,
            "materialsCloseInvoked": False,
            "privateRootPreserved": True,
            "recursiveDeleteInvoked": False,
            "globalProcessKillInvoked": False,
            "persistentSqliteHandleInventory": (
                "not_probed_by_helper; root must capture OS handles"
            ),
            "failures": cleanup_failures,
        }
        report["service"]["requestCounts"] = dict(sorted(request_counts.items()))

        owned_root_ok = False
        try:
            owned_root_files = walk_owned_files(root)
            report["ownedRoot"] = {
                "base": str(root),
                "files": owned_root_files,
                "fileCount": len(owned_root_files),
                "note": "root-run-report.json is created only after this inventory",
            }
            owned_root_ok = True
        except BaseException as error:
            report["ownedRoot"] = {
                "base": str(root),
                "files": {},
                "fileCount": None,
                "note": "root inventory failed",
                "errorType": type(error).__name__,
            }

        source_after: dict[str, Any] | None = None
        originals_after: list[dict[str, Any]] | None = None
        approved_identity_after: dict[str, Any] | None = None
        try:
            source_after = source_pin_snapshot(strict=False)
        except BaseException as error:
            source_after = {
                "pinFile": None,
                "entries": [],
                "mismatches": [{"kind": type(error).__name__}],
            }
        try:
            originals_after = expected_input_snapshot()
        except BaseException:
            originals_after = None
        try:
            approved_identity_after = file_identity(APPROVED_INPUTS)
        except BaseException:
            approved_identity_after = None

        report["inputs"].update(
            {
                "approvedInputsAfter": approved_identity_after,
                "sourcePinsAfter": source_after,
                "source8After": originals_after,
            }
        )
        source_unchanged = bool(
            source_before
            and source_after
            and source_before.get("pinFile") == source_after.get("pinFile")
            and source_before.get("entries") == source_after.get("entries")
            and not source_before.get("mismatches")
            and not source_after.get("mismatches")
        )
        originals_unchanged = bool(
            originals_before is not None
            and originals_after is not None
            and originals_before == originals_after
        )
        approved_unchanged = approved_identity_before == approved_identity_after
        exact_requests = (
            request_counts.get("POST /api/pipeline/run") == 1
            and request_counts.get("POST /api/case/open") == 1
            and request_counts.get("POST /api/materials/scan") == 1
            and request_counts.get("GET /api/settings") == 1
            and request_counts.get("PUT /api/settings") == 1
            and request_counts.get("GET /api/materials") == 2
        )
        unexpected_route_calls = any(
            key.startswith(
                (
                    "POST /api/ocr",
                    "POST /api/retainer",
                    "POST /api/prompt",
                    "POST /api/ledger",
                    "POST /api/invoice",
                    "POST /api/request/scope",
                    "POST /api/task",
                    "POST /core/",
                )
            )
            for key in request_counts
        )
        outbound_denied = int(report["outbound"].get("denied") or 0)
        outbound_redirects = sum(
            1 for item in report["outbound"].get("records", []) if item.get("redirect")
        )
        source_resolutions = report.get("citations", {}).get("resolutions", [])
        source_resolutions_valid = (
            not report.get("citations", {}).get("failures")
            and all(
                item.get("sourceChanged") is False
                and item.get("originalStatus") == "ok"
                and item.get("textChars") is not None
                for item in source_resolutions
                if isinstance(item, dict)
            )
        )
        checks = {
            "sourcePinsUnchanged": source_unchanged,
            "source8Unchanged": originals_unchanged,
            "approvedInputsUnchanged": approved_unchanged,
            "exactOnePipelineRun": request_counts.get("POST /api/pipeline/run") == 1,
            "exactOneCaseOpen": request_counts.get("POST /api/case/open") == 1,
            "exactOneMaterialScan": request_counts.get("POST /api/materials/scan") == 1,
            "privateSettingsWrittenOnce": request_counts.get("PUT /api/settings") == 1,
            "noForbiddenServiceRoute": not unexpected_route_calls,
            "noDeniedOutbound": outbound_denied == 0,
            "outboundRedirectCount": outbound_redirects,
            "noOutboundRedirect": outbound_redirects == 0,
            "sourceResolutionsValid": source_resolutions_valid,
            "externalKeyGetterCalls": external_key_calls,
            "noExternalKeyGetterCalls": external_key_calls == 0,
            "nativeAgentAbsent": True,
            "nativeSessionUuidAbsent": True,
            "questionsAskedZero": True,
            "timedOut": timeout_failure,
            "exactServiceRequestSet": exact_requests,
            "ownedRootInventoryOk": owned_root_ok,
        }
        cleanup_ok = (
            not cleanup_failures
            and asgi_closed
            and net_client_closed
            and retainer_close_returned
            and transport_shutdown
            and all_owner_transports_closed
            and logs_close_returned
        )
        checks["cleanupOk"] = cleanup_ok
        boundary_ok = all(
            checks[key]
            for key in (
                "sourcePinsUnchanged",
                "source8Unchanged",
                "approvedInputsUnchanged",
                "exactOnePipelineRun",
                "exactOneCaseOpen",
                "exactOneMaterialScan",
                "exactServiceRequestSet",
                "privateSettingsWrittenOnce",
                "noForbiddenServiceRoute",
                "noDeniedOutbound",
                "noOutboundRedirect",
                "noExternalKeyGetterCalls",
                "sourceResolutionsValid",
                "ownedRootInventoryOk",
            )
        )
        checks["boundaryOk"] = boundary_ok
        report["checks"] = checks

        result_status = report.get("result", {}).get("status")
        if functional_error is not None:
            report["status"] = "FAILED"
        elif result_status != "completed":
            report["status"] = f"PIPELINE_{str(result_status).upper()}"
        elif not boundary_ok or not cleanup_ok:
            report["status"] = "FAILED_BOUNDARY_OR_CLEANUP"
        elif report.get("result", {}).get("productionFinalCheckStatus") == "PASS":
            report["status"] = "COMPLETED_FINAL_CHECK_PASSED"
        elif report.get("result", {}).get("productionFinalCheckStatus") == "UNAVAILABLE":
            report["status"] = "COMPLETED_FINAL_CHECK_UNAVAILABLE"
        else:
            report["status"] = "COMPLETED_FINAL_CHECK_FAILED"

        functional_ok = functional_error is None and result_status == "completed"
        exit_code = 0 if functional_ok and boundary_ok and cleanup_ok else 1
        report["executionPassed"] = functional_ok
        report["boundaryPassed"] = boundary_ok
        report["cleanupPassed"] = cleanup_ok
        report["exitCode"] = exit_code
        report["finishedAtUtc"] = utc_now()
        report["protocol"]["nativeSessionUuid"] = None
        report["protocol"]["lifespanStarted"] = False
        report["protocol"]["forwardListener"] = False
        report["protocol"]["ocrStarted"] = False
        report["protocol"]["retainerStarted"] = False
        report["protocol"]["perRequestTransportOwnership"] = (
            "shared observer plus one real HTTPTransport owner per production request client"
        )
        app_token = ""
        credential = ""

    write_report_atomic_new(root / "root-run-report.json", report)
    return int(report["exitCode"]), report


def failure_report(
    raw_root: str,
    error: BaseException,
    credential: str,
    started_at: str | None = None,
) -> dict[str, Any]:
    return {
        "format": "lawbench-t18-current-wiki-pipeline-run-v1",
        "kind": "actual-production-pipeline",
        "task": "B-T18-current-wiki-pipeline-20261030-031059",
        "startedAtUtc": started_at or utc_now(),
        "finishedAtUtc": utc_now(),
        "status": "FAILED",
        "exception": {
            "type": type(error).__name__,
            "message": sanitize_message(error, credential),
        },
        "root": raw_root,
        "executionPassed": False,
        "boundaryPassed": False,
        "cleanupPassed": False,
        "exitCode": 1,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    parser.add_argument("--credential-stdin", action="store_true", required=True)
    args = parser.parse_args()
    started_at = utc_now()
    credential = ""
    root: pathlib.Path | None = None
    try:
        root = validate_new_root(args.root)
        credential = read_credential()
        root.mkdir(mode=0o700)
        code, report = asyncio.run(execute(root, credential))
        print(
            json.dumps(
                {
                    "status": report.get("status"),
                    "exitCode": code,
                    "taskId": report.get("pipeline", {}).get("taskId"),
                    "report": str(root / "root-run-report.json"),
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return code
    except BaseException as error:
        if root is None:
            try:
                root = validate_new_root(args.root)
                root.mkdir(mode=0o700)
            except BaseException:
                root = None
        if root is not None:
            try:
                report = failure_report(args.root, error, credential, started_at)
                write_report_atomic_new(root / "root-run-report.json", report)
            except BaseException:
                pass
        print("current wiki pipeline helper failed before a complete report", file=sys.stderr)
        return 1
    finally:
        credential = ""


if __name__ == "__main__":
    raise SystemExit(main())
