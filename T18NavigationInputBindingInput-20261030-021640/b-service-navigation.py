#!/usr/bin/env python3
"""Finite current-B HTTP entry for one T18 legal-workflow navigation scenario.

The parent Node process creates an empty private run root and supplies a
random loopback-only bearer token on stdin. Before the real CaseRegistry is
opened, this process copies the five approved synthetic civil TXT files into
the private case, preserving the approved names, exact bytes and
mtimes. The production text scanner parses the copies it accepts; the approved
task description, Skill and review notes are not case materials and are never
copied.

The process hosts only the explicit API/core routes needed by the consumer.
It starts the current B app with lifespan off, a refusing outbound transport,
and disabled credential, OCR, retainer, import, and request-scope operations.
It exits only on the parent ``stop`` line, stdin EOF, or failure.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import os
import pathlib
import re
import shutil
import socket
import stat
import sys
import threading
from datetime import datetime, timezone
from typing import Any
from urllib.parse import parse_qsl

import httpx
import uvicorn


EVIDENCE_ROOT = pathlib.Path(__file__).resolve().parent
B_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
B_SERVICE = B_ROOT / "service"
B_CONTRACTS = B_ROOT / "contracts"
B_SKILLS = B_ROOT / "skills"
RUNTIME_SKILL = B_SKILLS / "legal-workflow" / "SKILL.md"
TASK_SKILL = "legal-workflow"
ARCHIVE_SAMPLE_DIR = B_SKILLS / "case-archiving" / "tests" / "样本01-买卖合同调解"
ARCHIVE_TASK = ARCHIVE_SAMPLE_DIR / "_任务说明.md"
ARCHIVE_REFERENCE_NOTES = B_SKILLS / "case-archiving" / "tests" / "要点.md"
ARCHIVE_MATCH_SCHEMA = B_CONTRACTS / "tools" / "case_archive_match.schema.json"
ARCHIVE_PLAN_SCHEMA = B_CONTRACTS / "tools" / "case_save_archive_plan.schema.json"
ARCHIVE_SCHEMA_INPUTS = {
    ARCHIVE_MATCH_SCHEMA.resolve(),
    ARCHIVE_PLAN_SCHEMA.resolve(),
}
EXPECTED_DRAFT_TITLE = "归档核对表"
SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord"
    r"\T18ArchiveWarningBSourcePins-20261030-003710.json"
)
SOURCE_PINS_BYTES = 53_548
SOURCE_PINS_SHA256 = "5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098"
SOURCE_PINS_ENTRIES = 346
APPROVED_INPUTS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18NavigationNativeInput-20261030-020000"
    r"\approved-inputs.json"
)
APPROVED_INPUTS_BYTES = 2_132
APPROVED_INPUTS_SHA256 = "e759fe53b62165faf8ab680b5d28e59b51dc2e8f4c77cbbe6094ae3871b13a20"
RUN_NAME = re.compile(r"^run-[A-Za-z0-9_-]{6,64}$")
UUID_V4 = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
NATIVE_SESSION_ID = re.compile(
    r"^session-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$",
    re.IGNORECASE,
)
TASK_ID = re.compile(r"^T-[0-9]{14}-[0-9a-f]{4}$")
MATERIAL_ID = re.compile(r"^M[0-9]{4}$")
SHA256 = re.compile(r"^[0-9a-f]{64}$")
MAX_TOKEN_BYTES = 4096
MAX_REQUEST_BODY = 4 * 1024 * 1024
MAX_RESPONSE_CAPTURE = 4 * 1024 * 1024
TASK_PARAMS = {
    "thinking": "关闭",
    "window": "32K",
    "max_tokens": 4_096,
    "temperature": 0.6,
}
EXPECTED_REGISTERED_MATERIAL_NAMES = {
    "案情摘要",
    "还款记录",
    "借条",
    "情况说明",
    "银行流水",
}
EXPECTED_SOURCE_RELATIVES = {
    "案情摘要.txt",
    "还款记录.txt",
    "借条.txt",
    "情况说明.txt",
    "银行流水.txt",
}
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
WORKFLOW_TOOLS: frozenset[str] = frozenset()


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def ordinary_file(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except OSError:
        return False
    return stat.S_ISREG(info.st_mode) and not stat.S_ISLNK(info.st_mode)


def ordinary_dir(path: pathlib.Path) -> bool:
    try:
        info = os.lstat(path)
    except OSError:
        return False
    return (
        stat.S_ISDIR(info.st_mode)
        and not stat.S_ISLNK(info.st_mode)
        and path.resolve() == path
    )


def assert_private_root(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute() or root.parent.resolve() != EVIDENCE_ROOT:
        raise RuntimeError("private run root must be a direct child of the evidence directory")
    if RUN_NAME.fullmatch(root.name) is None or not ordinary_dir(root):
        raise RuntimeError("private run root is not an ordinary named directory")
    return root


def verify_source_pins() -> int:
    if (
        not ordinary_file(SOURCE_PINS)
        or SOURCE_PINS.stat().st_size != SOURCE_PINS_BYTES
        or sha256(SOURCE_PINS) != SOURCE_PINS_SHA256
    ):
        raise RuntimeError("reviewed B source pin file identity changed")
    pins = json.loads(SOURCE_PINS.read_text(encoding="utf-8"))
    if not isinstance(pins, dict) or len(pins) != SOURCE_PINS_ENTRIES:
        raise RuntimeError("reviewed B source pin count changed")
    for relative, expected in pins.items():
        if not isinstance(relative, str) or not isinstance(expected, dict):
            raise RuntimeError("reviewed B source pin row is invalid")
        pure = pathlib.PurePosixPath(relative)
        if pure.is_absolute() or ".." in pure.parts:
            raise RuntimeError("reviewed B source pin escapes B")
        path = B_ROOT.joinpath(*pure.parts)
        if (
            not ordinary_file(path)
            or path.stat().st_size != expected.get("bytes")
            or sha256(path) != expected.get("sha256")
        ):
            raise RuntimeError(f"reviewed B source identity changed: {relative}")
    return len(pins)


def approved_case_inputs() -> list[dict[str, Any]]:
    if (
        not ordinary_file(APPROVED_INPUTS)
        or APPROVED_INPUTS.stat().st_size != APPROVED_INPUTS_BYTES
        or sha256(APPROVED_INPUTS) != APPROVED_INPUTS_SHA256
    ):
        raise RuntimeError("approved sample-and-skill literal input identity changed")
    rows = json.loads(APPROVED_INPUTS.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or len(rows) != 15:
        raise RuntimeError("approved archive literal row count changed")
    selected: list[dict[str, Any]] = []
    skill_rows: list[dict[str, Any]] = []
    task_rows: list[dict[str, Any]] = []
    golden_rows: list[dict[str, Any]] = []
    schema_rows: list[dict[str, Any]] = []
    for raw in rows:
        if not isinstance(raw, dict):
            raise RuntimeError("approved literal row is invalid")
        raw_path = raw.get("path")
        raw_bytes = raw.get("bytes")
        raw_sha = raw.get("sha256")
        raw_mtime = raw.get("mtime_ns")
        if (
            not isinstance(raw_path, str)
            or not pathlib.Path(raw_path).is_absolute()
            or not isinstance(raw_bytes, int)
            or isinstance(raw_bytes, bool)
            or raw_bytes < 1
            or not isinstance(raw_sha, str)
            or SHA256.fullmatch(raw_sha) is None
            or not isinstance(raw_mtime, str)
            or not raw_mtime.isdigit()
        ):
            raise RuntimeError("approved literal metadata row is invalid")
        path = pathlib.Path(raw_path)
        name = path.name
        if (
            not ordinary_file(path)
            or path.stat().st_size != raw_bytes
            or path.stat().st_mtime_ns != int(raw_mtime)
            or sha256(path) != raw_sha
        ):
            raise RuntimeError("approved literal fixture identity changed")
        if name == "SKILL.md":
            skill_rows.append(raw)
        elif name == "_任务说明.md":
            task_rows.append(raw)
        elif name == "要点.md":
            golden_rows.append(raw)
        elif path.suffix.lower() == ".txt" and path.resolve().is_relative_to(ARCHIVE_SAMPLE_DIR):
            relative = path.resolve().relative_to(ARCHIVE_SAMPLE_DIR).as_posix()
            if relative not in EXPECTED_SOURCE_RELATIVES:
                raise RuntimeError(f"approved material path is outside the archive fixture: {relative}")
            selected.append({**raw, "relativePath": relative})
        elif path.resolve() in ARCHIVE_SCHEMA_INPUTS:
            schema_rows.append(raw)
        else:
            raise RuntimeError(f"approved literal row is outside the scenario: {name}")
    names = {pathlib.Path(row["path"]).stem for row in selected}
    relative_names = {row["relativePath"] for row in selected}
    if (
        len(selected) != len(EXPECTED_SOURCE_RELATIVES)
        or relative_names != EXPECTED_SOURCE_RELATIVES
        or {
            name for name in names
            if not name.startswith("~$")
        } != EXPECTED_REGISTERED_MATERIAL_NAMES
        or len(skill_rows) != 1
        or len(task_rows) != 1
        or len(golden_rows) != 1
        or len(schema_rows) != 2
        or {
            pathlib.Path(row["path"]).resolve()
            for row in schema_rows
        } != ARCHIVE_SCHEMA_INPUTS
    ):
        raise RuntimeError(
            "approved literal files do not form ten materials, task, Skill, notes and two schemas"
        )
    for row in selected:
        path = pathlib.Path(row["path"])
        relative = pathlib.Path(row["relativePath"])
        if (
            path.suffix.lower() != ".txt"
            or path.resolve() != (ARCHIVE_SAMPLE_DIR / relative).resolve()
            or not ordinary_file(path)
            or path.stat().st_size != row["bytes"]
            or path.stat().st_mtime_ns != int(row["mtime_ns"])
            or sha256(path) != row["sha256"]
        ):
            raise RuntimeError(f"approved material identity changed: {path.name}")
    task_row = task_rows[0]
    task_path = pathlib.Path(task_row["path"])
    if (
        task_path.resolve() != ARCHIVE_TASK.resolve()
        or not ordinary_file(task_path)
        or task_path.stat().st_size != task_row["bytes"]
        or task_path.stat().st_mtime_ns != int(task_row["mtime_ns"])
        or sha256(task_path) != task_row["sha256"]
    ):
        raise RuntimeError("approved task identity changed")
    skill_row = skill_rows[0]
    if (
        pathlib.Path(skill_row["path"]).resolve() != RUNTIME_SKILL.resolve()
        or not ordinary_file(RUNTIME_SKILL)
        or RUNTIME_SKILL.stat().st_size != skill_row["bytes"]
        or RUNTIME_SKILL.stat().st_mtime_ns != int(skill_row["mtime_ns"])
        or sha256(RUNTIME_SKILL) != skill_row["sha256"]
    ):
        raise RuntimeError("current B case-archiving Skill identity changed")
    notes_row = golden_rows[0]
    notes_path = pathlib.Path(notes_row["path"])
    if (
        notes_path.resolve() != ARCHIVE_REFERENCE_NOTES.resolve()
        or not ordinary_file(notes_path)
        or notes_path.stat().st_size != notes_row["bytes"]
        or notes_path.stat().st_mtime_ns != int(notes_row["mtime_ns"])
        or sha256(notes_path) != notes_row["sha256"]
    ):
        raise RuntimeError("case-archiving review notes identity changed")
    return sorted(selected, key=lambda row: row["path"])


def approved_navigation_inputs() -> list[dict[str, Any]]:
    if (
        not ordinary_file(APPROVED_INPUTS)
        or APPROVED_INPUTS.stat().st_size != APPROVED_INPUTS_BYTES
        or sha256(APPROVED_INPUTS) != APPROVED_INPUTS_SHA256
    ):
        raise RuntimeError("approved navigation literal input identity changed")
    raw = json.loads(APPROVED_INPUTS.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or (
        raw.get("format") != "lawbench-t18-navigation-native-inputs-v1"
        or raw.get("task") != "B-T18-navigation-native-20261030-020000"
        or raw.get("hashAlgorithm") != "sha256"
    ):
        raise RuntimeError("approved navigation literal header changed")

    def checked(row: Any, label: str) -> dict[str, Any]:
        if not isinstance(row, dict):
            raise RuntimeError(f"approved navigation {label} row is invalid")
        path_value = row.get("path")
        byte_count = row.get("bytes")
        digest = row.get("sha256")
        mtime = row.get("mtime_ns")
        if (
            not isinstance(path_value, str)
            or not pathlib.Path(path_value).is_absolute()
            or not isinstance(byte_count, int)
            or isinstance(byte_count, bool)
            or byte_count < 1
            or not isinstance(digest, str)
            or SHA256.fullmatch(digest) is None
            or not isinstance(mtime, str)
            or mtime.isdigit() is False
        ):
            raise RuntimeError(f"approved navigation {label} metadata is invalid")
        path = pathlib.Path(path_value)
        if (
            not ordinary_file(path)
            or path.stat().st_size != byte_count
            or path.stat().st_mtime_ns != int(mtime)
            or sha256(path) != digest
        ):
            raise RuntimeError(f"approved navigation {label} identity changed")
        return row

    task = checked(raw.get("canonicalTask"), "task")
    skill = checked(raw.get("skill"), "Skill")
    notes = checked(raw.get("referenceNotes"), "reference notes")
    if (
        pathlib.Path(task["path"]).resolve()
        != (B_SKILLS / "legal-workflow" / "tests" / "样本02-借贷案代理词无wiki" / "_任务说明.md").resolve()
        or pathlib.Path(skill["path"]).resolve() != RUNTIME_SKILL.resolve()
        or pathlib.Path(notes["path"]).resolve()
        != (B_SKILLS / "legal-workflow" / "tests" / "要点.md").resolve()
        or task.get("bytes") != 376
        or task.get("sha256") != "50d2a2c26ca7a27ca3258f214729722f6d732d836a5cbb56737512c3a5228b50"
        or skill.get("bytes") != 14_878
        or skill.get("sha256") != "46639190956bdd517742ef89a5f598e9e7a0a2466ad92e4a5190169c90a3c25f"
    ):
        raise RuntimeError("navigation task, Skill, or notes path is not approved")
    materials_raw = raw.get("materials")
    if not isinstance(materials_raw, list) or len(materials_raw) != 5:
        raise RuntimeError("navigation material count is not five")
    materials: list[dict[str, Any]] = []
    expected_dir = B_SKILLS / "legal-workflow" / "tests" / "样本02-借贷案代理词无wiki"
    for index, material in enumerate(materials_raw, start=1):
        row = checked(material, f"material {index}")
        path = pathlib.Path(row["path"])
        relative = path.relative_to(expected_dir).as_posix()
        if (
            path.resolve().parent != expected_dir.resolve()
            or path.suffix.lower() != ".txt"
            or relative not in EXPECTED_SOURCE_RELATIVES
            or path.stem not in EXPECTED_REGISTERED_MATERIAL_NAMES
        ):
            raise RuntimeError(f"navigation material path is not approved: {relative}")
        materials.append({**row, "relativePath": relative})
    if (
        {row["relativePath"] for row in materials} != EXPECTED_SOURCE_RELATIVES
        or {pathlib.Path(row["path"]).stem for row in materials}
        != EXPECTED_REGISTERED_MATERIAL_NAMES
    ):
        raise RuntimeError("navigation materials do not preserve the approved five TXT files")
    return sorted(materials, key=lambda row: row["path"])


def approved_materials() -> list[dict[str, Any]]:
    return approved_navigation_inputs()


def copy_approved_case(root: pathlib.Path) -> list[dict[str, Any]]:
    case_root = root / "case"
    if os.path.lexists(case_root):
        raise RuntimeError("private case must not exist before the approved five-file copy")
    case_root.mkdir(mode=0o700)
    materials = approved_navigation_inputs()
    copied: list[dict[str, Any]] = []
    for row in materials:
        source = pathlib.Path(row["path"])
        relative = pathlib.Path(row["relativePath"])
        destination = case_root / relative
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        shutil.copy2(source, destination, follow_symlinks=False)
        info = destination.lstat()
        if (
            not ordinary_file(destination)
            or info.st_size != row["bytes"]
            or info.st_mtime_ns != int(row["mtime_ns"])
            or sha256(destination) != row["sha256"]
        ):
            raise RuntimeError("copied approved material is not byte-and-mtime exact")
        copied.append(
            {
                "source": str(source),
                "destination": str(destination),
                "relative": row["relativePath"],
                "bytes": row["bytes"],
                "sha256": row["sha256"],
                "mtime_ns": row["mtime_ns"],
            }
        )
    return copied


def verify_private_case(
    root: pathlib.Path,
    *,
    allow_civil_template: bool = False,
) -> int:
    case_root = root / "case"
    if not ordinary_dir(case_root):
        raise RuntimeError("private case directory changed")
    expected = approved_navigation_inputs()
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    expected_files = {
        row["relativePath"]
        for row in expected
    }
    for row in expected:
        path = case_root / pathlib.Path(row["relativePath"])
        try:
            info = os.lstat(path)
        except OSError:
            raise RuntimeError("private approved material identity changed") from None
        if not (
            stat.S_ISREG(info.st_mode)
            and not stat.S_ISLNK(info.st_mode)
            and not (getattr(info, "st_file_attributes", 0) & reparse_flag)
            and path.stat().st_size == row["bytes"]
            and path.stat().st_mtime_ns == int(row["mtime_ns"])
            and sha256(path) == row["sha256"]
        ):
            raise RuntimeError("private approved material identity changed")
    seen_files: set[str] = set()
    seen_dirs: set[str] = set()
    stack = [case_root]
    while stack:
        directory = stack.pop()
        try:
            entries = list(directory.iterdir())
        except OSError:
            raise RuntimeError("private case tree changed") from None
        for entry in entries:
            relative = entry.relative_to(case_root).as_posix()
            if relative.startswith("."):
                raise RuntimeError("private case contains a hidden entry")
            if directory == case_root and entry.name in {"工作区", "成果"}:
                continue
            try:
                info = os.lstat(entry)
            except OSError:
                raise RuntimeError("private case tree changed") from None
            if (
                stat.S_ISLNK(info.st_mode)
                or (getattr(info, "st_file_attributes", 0) & reparse_flag)
            ):
                raise RuntimeError("private case contains a reparse entry")
            if stat.S_ISDIR(info.st_mode):
                seen_dirs.add(relative)
                stack.append(entry)
            elif stat.S_ISREG(info.st_mode):
                seen_files.add(relative)
            else:
                raise RuntimeError("private case contains a non-ordinary entry")
    if seen_files != expected_files:
        raise RuntimeError("private approved material identity changed")
    allowed_dirs: set[str] = set()
    for relative in expected_files:
        parent = pathlib.PurePosixPath(relative).parent
        while str(parent) != ".":
            allowed_dirs.add(str(parent))
            parent = parent.parent
    if allow_civil_template:
        allowed_dirs |= CIVIL_TEMPLATE_DIRS
    if not seen_dirs.issubset(allowed_dirs):
        raise RuntimeError("private case contains an unreviewed directory")
    return len(expected)


def read_local_token() -> str:
    if sys.stdin is None or sys.stdin.isatty():
        raise RuntimeError("local B token must arrive on a non-interactive stdin pipe")
    line = sys.stdin.buffer.readline(MAX_TOKEN_BYTES + 2)
    if not line.endswith(b"\n"):
        raise RuntimeError("local B token line is incomplete")
    raw = line[:-1]
    if raw.endswith(b"\r"):
        raw = raw[:-1]
    if not raw or len(raw) > MAX_TOKEN_BYTES:
        raise RuntimeError("local B token has an invalid length")
    if any(byte < 0x21 or byte > 0x7E for byte in raw):
        raise RuntimeError("local B token is not printable ASCII")
    return raw.decode("ascii")


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
        path.mkdir(mode=0o700, parents=True, exist_ok=True)
        os.environ[name] = str(path)
    os.environ["PYTHONDONTWRITEBYTECODE"] = "1"
    os.environ["PYTHONUTF8"] = "1"
    os.environ["PATH"] = str(pathlib.Path(sys.executable).parent)
    os.environ["NODE_USE_ENV_PROXY"] = "0"


def write_json_exclusive(path: pathlib.Path, value: dict[str, Any]) -> None:
    if os.path.lexists(path):
        raise RuntimeError(f"refusing to overwrite {path.name}")
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


class DisabledRetainer:
    closed = False

    def close(self) -> None:
        self.closed = True


class FiniteFirewall:
    """Allow only the exact fresh-case navigation workflow."""

    POST_PATHS = frozenset(
        {
            "/api/case/open",
            "/api/materials/scan",
            "/api/task",
            "/core/task/begin",
            "/core/context",
            "/core/tool",
            "/core/progress",
            "/core/task/end",
        }
    )
    GET_PATHS = frozenset({"/health", "/api/settings", "/api/materials", "/api/tasks"})

    def __init__(self, app: Any, case_root: pathlib.Path):
        self.app = app
        self.case_root = os.path.normcase(os.path.realpath(case_root))
        self.case_id: str | None = None
        self.session_id: str | None = None
        self.request_id: str | None = None
        self.material_ids: set[str] = set()
        self.material_versions: dict[str, str] = {}
        self.material_names: dict[str, str] = {}
        self.selection_id: str | None = None
        self.task_id: str | None = None
        self.request_scope_none = False
        self.context_l1_exact = False
        self.context_calls = 0
        self.tool_sequence: list[str] = []
        self.archive_match_args: list[dict[str, Any]] = []
        self.archive_match_results: list[dict[str, Any]] = []
        self.archive_plan_args: list[dict[str, Any]] = []
        self.archive_plan_results: list[dict[str, Any]] = []
        self.draft_paths: list[str] = []
        self.draft_saves: list[dict[str, Any]] = []
        self.counts: dict[str, int] = {}
        self.denials: dict[str, int] = {}
        self.violations: list[str] = []

    def _count(self, key: str) -> None:
        self.counts[key] = self.counts.get(key, 0) + 1

    def _deny(self, code: str) -> None:
        self.denials[code] = self.denials.get(code, 0) + 1

    @staticmethod
    def _exact_keys(
        value: dict[str, Any], required: set[str], optional: set[str] | None = None
    ) -> bool:
        return required.issubset(value) and set(value).issubset(required | (optional or set()))

    def _check_get(self, path: str, query: list[tuple[str, str]]) -> str | None:
        values: dict[str, list[str]] = {}
        for key, value in query:
            values.setdefault(key, []).append(value)
        if path in {"/health", "/api/settings"}:
            return None if not query else "STATIC_QUERY"
        if path in {"/api/materials", "/api/tasks"}:
            if set(values) != {"case_id"} or len(values["case_id"]) != 1:
                return "CASE_URI_EXACT"
            return None if values["case_id"][0] == self.case_id else "CASE_ID_OUTSIDE_RUN"
        if path == "/api/source":
            if (
                not {"case_id", "material_id", "citation"}.issubset(values)
                or not set(values).issubset({"case_id", "material_id", "citation", "task_id"})
                or any(len(items) != 1 for items in values.values())
            ):
                return "SOURCE_URI_EXACT"
            if values["case_id"][0] != self.case_id:
                return "CASE_ID_OUTSIDE_RUN"
            if values["material_id"][0] not in self.material_ids:
                return "MATERIAL_ID_OUTSIDE_RUN"
            if values.get("task_id", [self.task_id])[0] != self.task_id:
                return "TASK_ID_OUTSIDE_RUN"
            return None
        return "QUERY_NOT_ALLOWED"

    def _check_post(self, path: str, data: Any) -> str | None:
        if not isinstance(data, dict):
            return "BODY_OBJECT"
        if path == "/api/case/open":
            if self.case_id is not None:
                return "CASE_OPEN_LIMIT"
            if (
                not self._exact_keys(data, {"path", "template", "kind"})
                or data.get("template") != "civil"
                or data.get("kind") != "civil"
                or not isinstance(data.get("path"), str)
                or os.path.normcase(os.path.realpath(data["path"])) != self.case_root
            ):
                return "CASE_OPEN_BODY"
            return None
        if self.case_id is None:
            return "CASE_NOT_BOUND"
        if path == "/api/materials/scan":
            if self.counts.get("POST /api/materials/scan", 0) != 0:
                return "MATERIAL_SCAN_LIMIT"
            return None if self._exact_keys(data, {"case_id"}) and data["case_id"] == self.case_id else "SCAN_BODY"
        if path == "/api/task":
            if self.selection_id is not None:
                return "TASK_SELECTION_LIMIT"
            selection_session_id = data.get("session_id")
            if (
                not self._exact_keys(
                    data, {"case_id", "session_id", "entry", "skill", "inputs", "params"}
                )
                or data.get("case_id") != self.case_id
                or not isinstance(selection_session_id, str)
                or NATIVE_SESSION_ID.fullmatch(selection_session_id) is None
                or data.get("entry") is not None
                or data.get("skill") != TASK_SKILL
                or data.get("inputs") != []
                or data.get("params") != TASK_PARAMS
            ):
                return "TASK_SELECTION_BODY"
            if self.session_id is None:
                self.session_id = selection_session_id
            elif selection_session_id != self.session_id:
                return "SESSION_CHANGED"
            return None
        if path == "/core/task/begin":
            request_id = data.get("request_id")
            if (
                self.selection_id is None
                or not self._exact_keys(data, {"session_id", "cwd", "request_id"})
                or data.get("session_id") != self.session_id
                or not isinstance(request_id, str)
                or UUID_V4.fullmatch(request_id) is None
                or not isinstance(data.get("cwd"), str)
                or os.path.normcase(os.path.realpath(data["cwd"])) != self.case_root
            ):
                return "TASK_BEGIN_BODY"
            if self.request_id is None:
                self.request_id = request_id
            elif request_id != self.request_id:
                return "REQUEST_CHANGED"
            return None
        if self.task_id is None:
            return "TASK_NOT_BOUND"
        if data.get("task_id") != self.task_id:
            return "TASK_ID_OUTSIDE_RUN"
        if path == "/core/tool":
            if not self.context_l1_exact:
                return "CONTEXT_L1_REQUIRED"
            if (
                not self._exact_keys(data, {"task_id", "tool", "args"})
                or data.get("tool") not in WORKFLOW_TOOLS
                or not isinstance(data.get("args"), dict)
            ):
                return "TOOL_BODY"
            tool = data.get("tool")
            args = data.get("args")
            if tool == "case_list_materials":
                if args != {}:
                    return "LIST_ARGS_OR_ORDER"
            elif tool == "case_archive_match":
                if (
                    not self._exact_keys(args, {"catalog"})
                    or args.get("catalog") != "民事行政卷"
                ):
                    return "ARCHIVE_MATCH_ARGS"
            elif tool == "case_read_material":
                name = args.get("name")
                more_names = args.get("more_names")
                if (
                    not self._exact_keys(
                        args,
                        {"name"},
                        {"more_names", "start", "offset", "max_chars"},
                    )
                    or not isinstance(name, str)
                    or name not in EXPECTED_REGISTERED_MATERIAL_NAMES
                    or (
                        "more_names" in args
                        and (
                            not isinstance(more_names, list)
                            or any(
                                not isinstance(extra_name, str)
                                or extra_name not in EXPECTED_REGISTERED_MATERIAL_NAMES
                                for extra_name in more_names
                            )
                        )
                    )
                ):
                    return "READ_ARGS_OR_OWNERSHIP"
            elif tool == "case_save_draft":
                if (
                    not self._exact_keys(args, {"title", "content"})
                    or not isinstance(args.get("title"), str)
                    or args["title"] != EXPECTED_DRAFT_TITLE
                    or not isinstance(args.get("content"), str)
                    or not args["content"].strip()
                ):
                    return "DRAFT_ARGS"
            elif tool == "case_save_archive_plan":
                if not args:
                    return "ARCHIVE_PLAN_ARGS"
            self.tool_sequence.append(str(tool))
            return None
        if path == "/core/context":
            return None if self._exact_keys(data, {"task_id"}) else "CONTEXT_BODY"
        if path == "/core/progress":
            return None if self._exact_keys(
                data, {"task_id", "text", "model_calls", "tool_calls"}
            ) else "PROGRESS_BODY"
        if path == "/core/task/end":
            return None if self._exact_keys(
                data, {"task_id", "reason", "model_calls", "tool_calls", "elapsed_s"}
            ) else "TASK_END_BODY"
        return "POST_NOT_ALLOWED"

    @staticmethod
    async def _deny_reply(send: Any, code: str) -> None:
        body = json.dumps(
            {"ok": False, "error": {"code": "INVALID_ARGUMENT", "message": code}},
            separators=(",", ":"),
        ).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": 403,
                "headers": [(b"content-type", b"application/json")],
            }
        )
        await send({"type": "http.response.body", "body": body, "more_body": False})

    async def __call__(self, scope: dict[str, Any], receive: Any, send: Any) -> None:
        if scope.get("type") != "http":
            self._deny("NON_HTTP_SCOPE")
            return
        method = str(scope.get("method", ""))
        path = str(scope.get("path", ""))
        query = parse_qsl(
            scope.get("query_string", b"").decode("utf-8", "strict"),
            keep_blank_values=True,
        )
        body = b""
        data: Any = None
        if method == "POST":
            chunks: list[bytes] = []
            size = 0
            while True:
                message = await receive()
                if message["type"] != "http.request":
                    self._deny("REQUEST_DISCONNECTED")
                    return
                chunk = message.get("body", b"")
                chunks.append(chunk)
                size += len(chunk)
                if size > MAX_REQUEST_BODY:
                    self._deny("REQUEST_BODY_TOO_LARGE")
                    await self._deny_reply(send, "REQUEST_BODY_TOO_LARGE")
                    return
                if not message.get("more_body", False):
                    break
            body = b"".join(chunks)
            try:
                data = json.loads(body)
            except Exception:
                self._deny("BODY_JSON")
                await self._deny_reply(send, "BODY_JSON")
                return
            original_receive = receive
            replayed = False

            async def replay_receive() -> dict[str, Any]:
                nonlocal replayed
                if not replayed:
                    replayed = True
                    return {"type": "http.request", "body": body, "more_body": False}
                return await original_receive()

            receive = replay_receive

        if method == "GET":
            denial = (
                "METHOD_OR_PATH"
                if path not in self.GET_PATHS
                else self._check_get(path, query)
            )
        elif method == "POST":
            denial = (
                "METHOD_OR_PATH"
                if path not in self.POST_PATHS
                else self._check_post(path, data)
            )
        else:
            denial = "METHOD_OR_PATH"
        if denial:
            self._deny(denial)
            await self._deny_reply(send, denial)
            return

        if path == "/core/task/begin":
            body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        key = f"{method} {path}"
        self._count(key)
        request_tool = data.get("tool") if path == "/core/tool" and isinstance(data, dict) else None
        request_args = data.get("args") if path == "/core/tool" and isinstance(data, dict) else None
        request_task_id = data.get("task_id") if isinstance(data, dict) else None
        captured = bytearray()
        status: int | None = None
        overflow = False

        async def observed_send(message: dict[str, Any]) -> None:
            nonlocal overflow, status
            if message["type"] == "http.response.start":
                status = int(message["status"])
            elif message["type"] == "http.response.body":
                chunk = message.get("body", b"")
                room = max(0, MAX_RESPONSE_CAPTURE - len(captured))
                if len(chunk) > room:
                    overflow = True
                captured.extend(chunk[:room])
            await send(message)

        await self.app(scope, receive, observed_send)
        if overflow:
            self.violations.append("RESPONSE_CAPTURE_OVERFLOW")
            return
        if status != 200:
            return
        try:
            response = json.loads(bytes(captured))
        except Exception:
            self.violations.append("RESPONSE_NOT_JSON")
            return
        if not isinstance(response, dict) or response.get("ok") is not True:
            return
        value = response.get("value")
        if path == "/api/case/open" and isinstance(value, dict):
            case_id = value.get("case_id")
            if (
                not isinstance(case_id, str)
                or value.get("created") is not True
                or value.get("kind") != "civil"
            ):
                self.violations.append("CASE_OPEN_RESPONSE")
            else:
                self.case_id = case_id
        elif path == "/api/materials" and isinstance(value, dict):
            rows = value.get("materials")
            if not isinstance(rows, list) or len(rows) != len(EXPECTED_REGISTERED_MATERIAL_NAMES):
                self.violations.append("MATERIAL_LIST_RESPONSE")
            else:
                ids: set[str] = set()
                names: dict[str, str] = {}
                for row in rows:
                    if not isinstance(row, dict):
                        self.violations.append("MATERIAL_ROW_RESPONSE")
                        continue
                    material_id = row.get("material_id")
                    name = row.get("name")
                    rel_path = row.get("rel_path")
                    if (
                        not isinstance(material_id, str)
                        or MATERIAL_ID.fullmatch(material_id) is None
                        or not isinstance(name, str)
                        or not isinstance(rel_path, str)
                        or rel_path not in EXPECTED_SOURCE_RELATIVES
                        or pathlib.PurePosixPath(rel_path).stem != name
                        or pathlib.PurePosixPath(rel_path).suffix.lower() != ".txt"
                        or row.get("status") != "parsed"
                        or row.get("error") is not None
                        or row.get("unit") != "line"
                        or not isinstance(row.get("unit_count"), int)
                        or row.get("type") != "txt"
                    ):
                        self.violations.append("MATERIAL_ID_RESPONSE")
                        continue
                    ids.add(material_id)
                    names[material_id] = name
                if (
                    ids
                    and len(ids) == len(EXPECTED_REGISTERED_MATERIAL_NAMES)
                    and set(names.values()) == EXPECTED_REGISTERED_MATERIAL_NAMES
                ):
                    index = self.app.state.lb.materials.index(self.case_id)
                    index_rows = index.get("materials") if isinstance(index, dict) else None
                    expected_sources = {
                        pathlib.Path(row["path"]).stem: row["sha256"]
                        for row in approved_materials()
                    }
                    if (
                        not isinstance(index, dict)
                        or index.get("v") != 1
                        or index.get("case_id") != self.case_id
                        or not isinstance(index_rows, list)
                        or len(index_rows) != len(EXPECTED_REGISTERED_MATERIAL_NAMES)
                    ):
                        self.violations.append("MATERIAL_INDEX_RESPONSE")
                    else:
                        index_by_id = {
                            row.get("material_id"): row
                            for row in index_rows
                            if isinstance(row, dict)
                        }
                        versions: dict[str, str] = {}
                        for material_id, name in names.items():
                            indexed = index_by_id.get(material_id)
                            ui_row = next(row for row in rows if row.get("material_id") == material_id)
                            if (
                                not isinstance(indexed, dict)
                                or any(
                                    indexed.get(field) != ui_row.get(field)
                                    for field in (
                                        "name", "rel_path", "type", "unit", "unit_count", "status"
                                    )
                                )
                                or not isinstance(indexed.get("sha256"), str)
                                or SHA256.fullmatch(indexed["sha256"]) is None
                                or indexed["sha256"] != expected_sources.get(name)
                            ):
                                self.violations.append("MATERIAL_INDEX_IDENTITY")
                                continue
                            versions[material_id] = indexed["sha256"]
                        if (
                            len(index_by_id) == len(EXPECTED_REGISTERED_MATERIAL_NAMES)
                            and len(versions) == len(EXPECTED_REGISTERED_MATERIAL_NAMES)
                        ):
                            self.material_ids = ids
                            self.material_names = names
                            self.material_versions = versions
                        else:
                            self.violations.append("MATERIAL_INDEX_SET")
                else:
                    self.violations.append("MATERIAL_SET_RESPONSE")
        elif path == "/api/task" and isinstance(value, dict):
            selection_id = value.get("task_id")
            if not isinstance(selection_id, str) or TASK_ID.fullmatch(selection_id) is None:
                self.violations.append("TASK_SELECTION_RESPONSE")
            else:
                self.selection_id = selection_id
        elif path == "/core/task/begin" and isinstance(value, dict):
            task_id = value.get("task_id")
            if (
                not isinstance(task_id, str)
                or TASK_ID.fullmatch(task_id) is None
                or value.get("case_id") != self.case_id
                or value.get("request_id") != self.request_id
                or value.get("skill") != TASK_SKILL
                or value.get("params") != TASK_PARAMS
                or "request_scope" not in value
                or value.get("request_scope") is not None
            ):
                self.violations.append("TASK_BEGIN_RESPONSE")
            else:
                self.task_id = task_id
                self.request_scope_none = True
        elif path == "/core/context" and isinstance(value, dict):
            self.context_calls += 1
            l0 = value.get("l0")
            l1 = value.get("l1")
            if (
                self.task_id is None
                or not isinstance(l0, dict)
                or not isinstance(l1, dict)
                or not isinstance(l0.get("text"), str)
                or not l0["text"].startswith("# 案件卡片")
                or "还没有生成 wiki" not in l0["text"]
                or any(
                    name not in l0["text"]
                    for name in EXPECTED_REGISTERED_MATERIAL_NAMES
                )
                or l1.get("truncated") is not False
                or l1.get("toc") != []
                or not isinstance(l1.get("text"), str)
                or l1["text"] != ""
                or l1.get("tokens") != 0
            ):
                self.violations.append("CONTEXT_RESPONSE")
            else:
                self.context_l1_exact = True
        elif path == "/core/tool" and request_tool == "case_archive_match" and isinstance(value, dict):
            if not isinstance(request_args, dict):
                self.violations.append("ARCHIVE_MATCH_ARGS")
            else:
                self.archive_match_args.append(dict(request_args))
                self.archive_match_results.append(dict(value))
        elif path == "/core/tool" and request_tool == "case_save_draft" and isinstance(value, dict):
            draft_path = value.get("path")
            title = request_args.get("title") if isinstance(request_args, dict) else None
            content = request_args.get("content") if isinstance(request_args, dict) else None
            version = value.get("version")
            if (
                not isinstance(draft_path, str)
                or not isinstance(title, str)
                or title != EXPECTED_DRAFT_TITLE
                or not isinstance(content, str)
                or not content.strip()
                or not isinstance(version, int)
                or isinstance(version, bool)
                or version < 1
                or not draft_path.startswith(f"工作区/任务/{self.task_id}/草稿/")
                or not draft_path.endswith(".md")
            ):
                self.violations.append("DRAFT_RESPONSE")
            else:
                self.draft_paths.append(draft_path)
                self.draft_saves.append(
                    {
                        "path": draft_path,
                        "version": version,
                        "titleLength": len(title),
                        "contentLength": len(content),
                        "contentSha256": hashlib.sha256(content.encode("utf-8")).hexdigest(),
                    }
                )
        elif path == "/core/tool" and request_tool == "case_save_archive_plan" and isinstance(value, dict):
            plan_path = value.get("path")
            missing_required = value.get("missing_required")
            warnings = value.get("warnings")
            if (
                not isinstance(request_args, dict)
                or not isinstance(plan_path, str)
                or not plan_path.startswith(f"工作区/任务/{self.task_id}/")
                or pathlib.PurePosixPath(plan_path).name != "归档方案.json"
                or not isinstance(missing_required, list)
                or not isinstance(warnings, list)
            ):
                self.violations.append("ARCHIVE_PLAN_RESPONSE")
            else:
                self.archive_plan_args.append(dict(request_args))
                self.archive_plan_results.append(dict(value))
        elif path == "/core/task/end" and isinstance(value, dict):
            if (
                request_task_id != self.task_id
                or value.get("status") != "completed"
            ):
                self.violations.append("TASK_END_RESPONSE")

    def evidence(self) -> dict[str, Any]:
        return {
            "caseBound": self.case_id is not None,
            "sessionBound": self.session_id is not None,
            "requestBound": self.request_id is not None,
            "taskBound": self.task_id is not None,
            "requestScopeNone": self.request_scope_none,
            "requestScopePrepareCalls": self.counts.get("POST /api/request/scope", 0),
            "contextL1Exact": self.context_l1_exact,
            "contextCalls": self.context_calls,
            "selectionId": self.selection_id,
            "taskId": self.task_id,
            "requestId": self.request_id,
            "toolSequence": list(self.tool_sequence),
            "archiveMatchArgs": list(self.archive_match_args),
            "archiveMatchResults": list(self.archive_match_results),
            "archivePlanArgs": list(self.archive_plan_args),
            "archivePlanResults": list(self.archive_plan_results),
            "materialIds": sorted(self.material_ids),
            "materialNames": dict(sorted(self.material_names.items())),
            "materialVersions": dict(sorted(self.material_versions.items())),
            "draftPaths": list(self.draft_paths),
            "draftSaves": list(self.draft_saves),
            "counts": dict(sorted(self.counts.items())),
            "denials": dict(sorted(self.denials.items())),
            "violations": list(self.violations),
        }


async def run_service(root: pathlib.Path, token: str) -> tuple[int, dict[str, Any]]:
    source_pin_count = verify_source_pins()
    copied_materials = copy_approved_case(root)
    fixture_count = verify_private_case(root)
    registered_material_count = len(EXPECTED_REGISTERED_MATERIAL_NAMES)
    sock: socket.socket | None = None
    lb: Any | None = None
    imported_logs: Any | None = None
    retainer: DisabledRetainer | None = None
    try:
        sys.path.insert(0, str(B_SERVICE))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench.app import create_app
        from lawbench.config import Config

        appdata = root / "appdata"
        outbound: dict[str, int] = {"attempts": 0, "denied": 0}
        credentials: dict[str, int] = {"keyGetter": 0, "externalKeyGetter": 0}

        def refuse_transport(request: httpx.Request) -> httpx.Response:
            outbound["attempts"] += 1
            outbound["denied"] += 1
            raise RuntimeError(f"outbound B HTTP denied: {request.method}")

        def refuse_key() -> str:
            credentials["keyGetter"] += 1
            raise RuntimeError("model credential access is disabled in finite B")

        def refuse_external_key() -> str:
            credentials["externalKeyGetter"] += 1
            raise RuntimeError("external credential access is disabled in finite B")

        native = create_app(
            Config(
                token=token,
                appdata=appdata,
                port=0,
                forward_port=18_765,
                skills_dirs=[B_SKILLS],
                contracts_dir=B_CONTRACTS,
                validate_responses=True,
            ),
            key_getter=refuse_key,
            external_key_getter=refuse_external_key,
            transport=httpx.MockTransport(refuse_transport),
        )
        if imported_contracts.version() != "1.6":
            raise RuntimeError("current B contract version is not 1.6")
        lb = native.state.lb
        retainer = DisabledRetainer()
        lb.retainer = retainer
        firewall = FiniteFirewall(native, root / "case")

        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(("127.0.0.1", 0))
        sock.listen(128)
        sock.set_inheritable(False)
        port = int(sock.getsockname()[1])
        server = uvicorn.Server(
            uvicorn.Config(
                app=firewall,
                host="127.0.0.1",
                port=port,
                lifespan="off",
                loop="asyncio",
                http="h11",
                ws="none",
                proxy_headers=False,
                access_log=False,
                log_level="error",
                log_config=None,
                server_header=False,
                date_header=False,
                workers=1,
            )
        )

        def watch_parent_stdin() -> None:
            try:
                for line in sys.stdin:
                    if line.strip().lower() == "stop":
                        break
            except Exception:
                pass
            server.should_exit = True

        threading.Thread(target=watch_parent_stdin, name="finite-b-stop", daemon=True).start()
        started_at = utc_now()
        service_task = asyncio.create_task(server.serve(sockets=[sock]))
        while not server.started:
            if service_task.done():
                await service_task
                raise RuntimeError("B HTTP listener exited before readiness")
            await asyncio.sleep(0.01)
        ready = {
            "status": "ready",
            "pid": os.getpid(),
            "executable": os.path.realpath(sys.executable),
            "startedAtUtc": started_at,
            "host": "127.0.0.1",
            "port": port,
            "contractVersion": imported_contracts.version(),
            "lifespan": "off",
            "sourcePinCount": source_pin_count,
            "materialCount": registered_material_count,
            "fixtureCount": fixture_count,
            "forwardListener": False,
            "ocrStarted": False,
            "retainerStarted": False,
        }
        print(json.dumps(ready, ensure_ascii=False, sort_keys=True), flush=True)
        await service_task
        if not server.started or server.should_exit is not True:
            raise RuntimeError("B HTTP service did not stop through its supported path")
        sock.close()
        listener_closed = sock.fileno() == -1

        failure: str | None = None
        net_closed = False
        logs_closed = False
        try:
            lb.net.client.close()
            net_closed = bool(lb.net.client.is_closed)
        except Exception:
            failure = "net_close_failed"
        try:
            imported_logs.close()
            logs_closed = True
        except Exception:
            failure = failure or "logs_close_failed"
        lb.retainer.close()
        protocol = firewall.evidence()
        if protocol["denials"] or protocol["violations"]:
            failure = failure or "request_protocol_violation"
        expected_counts = {
            "POST /api/case/open": 1,
            "POST /api/materials/scan": 1,
            "GET /api/materials": 1,
            "POST /api/task": 1,
            "POST /core/task/begin": 1,
            "POST /core/task/end": 1,
        }
        if any(protocol["counts"].get(key) != value for key, value in expected_counts.items()):
            failure = failure or "navigation_route_count"
        if protocol["requestScopePrepareCalls"] != 0:
            failure = failure or "unexpected_request_scope_prepare"
        if (
            not protocol["caseBound"]
            or not protocol["sessionBound"]
            or not protocol["requestBound"]
            or not protocol["taskBound"]
            or not protocol["requestScopeNone"]
            or not protocol["contextL1Exact"]
            or protocol["contextCalls"] != 1
            or len(protocol["materialIds"]) != registered_material_count
            or protocol["archiveMatchArgs"]
            or protocol["archiveMatchResults"]
            or protocol["archivePlanArgs"]
            or protocol["archivePlanResults"]
            or protocol["selectionId"] == protocol["taskId"]
            or protocol["draftPaths"]
            or protocol["draftSaves"]
        ):
            failure = failure or "navigation_protocol_incomplete"
        sequence = protocol["toolSequence"]
        if sequence:
            failure = failure or "navigation_tool_calls"
        if any(
            key.startswith("POST /api/materials/import")
            or key.startswith("POST /api/ledger")
            or key.startswith("POST /api/redline")
            or key.startswith("POST /api/ocr")
            or key.startswith("POST /api/retainer")
            or key.startswith("POST /api/request/scope")
            for key in protocol["counts"]
        ):
            failure = failure or "forbidden_route_count"
        if not listener_closed or not net_closed or not logs_closed or not retainer.closed:
            failure = failure or "resource_not_closed"
        if outbound["attempts"] or any(credentials.values()):
            failure = failure or "outbound_or_credential_access"
        if verify_private_case(root, allow_civil_template=True) != fixture_count:
            failure = failure or "private_materials_changed"
        final = {
            "status": "STOPPED" if failure is None else "FAILED",
            "pid": os.getpid(),
            "executable": ready["executable"],
            "startedAtUtc": started_at,
            "finishedAtUtc": utc_now(),
            "failure": failure,
            "host": "127.0.0.1",
            "port": port,
            "listenerClosed": listener_closed,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "retainerClosed": retainer.closed,
            "sourcePinCount": source_pin_count,
            "sourcePinsUnchanged": verify_source_pins() == source_pin_count,
            "materialCount": registered_material_count,
            "fixtureCount": fixture_count,
            "fixtureInputsUnchanged": verify_private_case(root, allow_civil_template=True) == fixture_count,
            "copiedMaterials": copied_materials,
            "outbound": outbound,
            "credentials": credentials,
            "protocol": protocol,
            "lifespan": "off",
            "ocrStarted": False,
            "retainerStarted": False,
            "forwardListener": False,
            "passed": failure is None,
        }
        write_json_exclusive(root / "b-service-final.json", final)
        return (0 if final["passed"] else 1), final
    finally:
        if sock is not None:
            sock.close()
        if lb is not None:
            try:
                lb.net.client.close()
            except Exception:
                pass
        if imported_logs is not None:
            try:
                imported_logs.close()
            except Exception:
                pass
        if retainer is not None:
            retainer.close()


def main() -> int:
    if len(sys.argv) != 3 or sys.argv[1] != "--root":
        print(
            "usage: b-service-navigation.py --root <evidence/run-id>",
            file=sys.stderr,
        )
        return 2
    try:
        root = assert_private_root(sys.argv[2])
        token = read_local_token()
        scrub_environment(root)
        code, _ = asyncio.run(run_service(root, token))
        return code
    except BaseException as error:
        failure = {
            "status": "FAILED",
            "failure": type(error).__name__,
            "finishedAtUtc": utc_now(),
            "passed": False,
        }
        try:
            root = assert_private_root(sys.argv[2])
            write_json_exclusive(root / "b-service-final.json", failure)
        except BaseException:
            pass
        print(f"finite B service failed: {type(error).__name__}", file=sys.stderr)
        return 1
    finally:
        token = ""


if __name__ == "__main__":
    raise SystemExit(main())
