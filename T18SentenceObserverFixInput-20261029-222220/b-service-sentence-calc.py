#!/usr/bin/env python3
"""Finite current-B HTTP entry for one T18 sentence-calc native scenario.

The parent Node process creates an empty private run root and supplies a
random loopback-only bearer token on stdin. Before the real CaseRegistry is
opened, this process copies the five approved synthetic criminal TXT files
into the private case, preserving exact bytes and mtimes. The production text
scanner parses those copies; the approved task description, Skill and review
notes are not case materials and are never copied.

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
RUNTIME_SKILL = B_SKILLS / "sentence-calc" / "SKILL.md"
SENTENCE_SAMPLE_DIR = B_SKILLS / "sentence-calc" / "tests" / "样本01-诈骗判决刑期"
SENTENCE_TASK = SENTENCE_SAMPLE_DIR / "_任务说明.md"
SENTENCE_REFERENCE_NOTES = B_SKILLS / "sentence-calc" / "tests" / "要点.md"
EXPECTED_DRAFT_TITLE = "刑期计算表"
SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18RoundCitationRuntimeInput-20261029-105056"
    r"\reviewed-b-source-pins-round-citation.json"
)
SOURCE_PINS_BYTES = 53_548
SOURCE_PINS_SHA256 = "6b07e5773dc77c6b13fd6688e4febca847af250f8a37ce13d3a4af4d581c5205"
SOURCE_PINS_ENTRIES = 346
APPROVED_INPUTS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18SentenceNativeInput-20261029-211228"
    r"\approved-inputs.json"
)
APPROVED_INPUTS_BYTES = 2_095
APPROVED_INPUTS_SHA256 = "2949b22c4e32df779463f793b183271b64c5458292a96991e9c88628848b150c"
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
    "thinking": "低",
    "window": "64K",
    "max_tokens": 16_384,
    "temperature": 0.6,
}
TASK_SKILL = "sentence-calc"
EXPECTED_MATERIAL_NAMES = {
    "刑事判决书",
    "拘留证",
    "羁押情况证明",
    "起诉意见书",
    "逮捕证",
}
WORKFLOW_TOOLS = frozenset(
    {
        "case_list_materials",
        "case_read_material",
        "case_calc_sentence",
        "case_save_draft",
    }
)


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
    if not isinstance(rows, list) or len(rows) != 8:
        raise RuntimeError("approved sample-and-skill literal row count changed")
    selected: list[dict[str, Any]] = []
    skill_rows: list[dict[str, Any]] = []
    task_rows: list[dict[str, Any]] = []
    golden_rows: list[dict[str, Any]] = []
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
        elif path.stem in EXPECTED_MATERIAL_NAMES:
            selected.append(raw)
        else:
            raise RuntimeError(f"approved literal row is outside the scenario: {name}")
    names = {pathlib.Path(row["path"]).stem for row in selected}
    if (
        len(selected) != 5
        or names != EXPECTED_MATERIAL_NAMES
        or len(skill_rows) != 1
        or len(task_rows) != 1
        or len(golden_rows) != 1
    ):
        raise RuntimeError("approved literal files do not form five materials, task, Skill and notes")
    for row in selected:
        path = pathlib.Path(row["path"])
        if (
            path.suffix.lower() != ".txt"
            or path.parent.resolve() != SENTENCE_SAMPLE_DIR.resolve()
            or not ordinary_file(path)
            or path.stat().st_size != row["bytes"]
            or path.stat().st_mtime_ns != int(row["mtime_ns"])
            or sha256(path) != row["sha256"]
        ):
            raise RuntimeError(f"approved material identity changed: {path.name}")
    task_row = task_rows[0]
    task_path = pathlib.Path(task_row["path"])
    if (
        task_path.resolve() != SENTENCE_TASK.resolve()
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
        raise RuntimeError("current B sentence-calc Skill identity changed")
    notes_row = golden_rows[0]
    notes_path = pathlib.Path(notes_row["path"])
    if (
        notes_path.resolve() != SENTENCE_REFERENCE_NOTES.resolve()
        or not ordinary_file(notes_path)
        or notes_path.stat().st_size != notes_row["bytes"]
        or notes_path.stat().st_mtime_ns != int(notes_row["mtime_ns"])
        or sha256(notes_path) != notes_row["sha256"]
    ):
        raise RuntimeError("sentence-calc review notes identity changed")
    return sorted(selected, key=lambda row: row["path"])


def approved_materials() -> list[dict[str, Any]]:
    return approved_case_inputs()


def copy_approved_case(root: pathlib.Path) -> list[dict[str, Any]]:
    case_root = root / "case"
    if os.path.lexists(case_root):
        raise RuntimeError("private case must not exist before the approved five-file copy")
    target = case_root / "02案件材料"
    target.mkdir(mode=0o700, parents=True)
    materials = approved_case_inputs()
    copied: list[dict[str, Any]] = []
    for row in materials:
        source = pathlib.Path(row["path"])
        destination = target / source.name
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
                "relative": f"02案件材料/{source.name}",
                "bytes": row["bytes"],
                "sha256": row["sha256"],
                "mtime_ns": row["mtime_ns"],
            }
        )
    return copied


def verify_private_case(
    root: pathlib.Path,
    *,
    allow_criminal_template: bool = False,
) -> int:
    case_root = root / "case"
    if not ordinary_dir(case_root):
        raise RuntimeError("private case directory changed")
    expected = approved_case_inputs()
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    expected_file_names = {pathlib.Path(row["path"]).name for row in expected}
    criminal_template_dirs = {"会见笔录", "家属沟通", "涉案证据"}
    for row in expected:
        path = case_root / "02案件材料" / pathlib.Path(row["path"]).name
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
    source_dir = case_root / "02案件材料"
    try:
        source_info = os.lstat(source_dir)
        entries = list(source_dir.iterdir())
    except OSError:
        raise RuntimeError("private source area changed") from None
    if not (
        stat.S_ISDIR(source_info.st_mode)
        and not stat.S_ISLNK(source_info.st_mode)
        and not (getattr(source_info, "st_file_attributes", 0) & reparse_flag)
        and source_dir.resolve() == source_dir
    ):
        raise RuntimeError("private source area changed")
    seen_files: set[str] = set()
    seen_template_dirs: set[str] = set()
    for entry in entries:
        if entry.name in expected_file_names:
            seen_files.add(entry.name)
            continue
        if allow_criminal_template and entry.name in criminal_template_dirs:
            try:
                info = os.lstat(entry)
            except OSError:
                raise RuntimeError("private criminal template directory changed") from None
            if (
                not stat.S_ISDIR(info.st_mode)
                or stat.S_ISLNK(info.st_mode)
                or (getattr(info, "st_file_attributes", 0) & reparse_flag)
                or entry.resolve() != entry
                or any(entry.iterdir())
            ):
                raise RuntimeError("private criminal template directory changed")
            seen_template_dirs.add(entry.name)
            continue
        raise RuntimeError("private source area contains an extra file")
    if seen_files != expected_file_names:
        raise RuntimeError("private approved material identity changed")
    expected_template_dirs = criminal_template_dirs if allow_criminal_template else set()
    if seen_template_dirs != expected_template_dirs:
        raise RuntimeError("private criminal template directories changed")
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
    """Allow only the exact fresh-case sentence-calc workflow."""

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
    GET_PATHS = frozenset(
        {"/health", "/api/settings", "/api/materials", "/api/tasks", "/api/source"}
    )

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
        self.calculator_args: list[dict[str, Any]] = []
        self.calculator_results: list[dict[str, Any]] = []
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
                or data.get("template") != "criminal"
                or data.get("kind") != "criminal"
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
            elif tool == "case_read_material":
                expected_more = EXPECTED_MATERIAL_NAMES - {"刑事判决书"}
                more_names = args.get("more_names")
                if (
                    set(args) != {"name", "more_names"}
                    or args.get("name") != "刑事判决书"
                    or not isinstance(more_names, list)
                    or len(more_names) != 4
                    or any(not isinstance(name, str) for name in more_names)
                    or len(set(more_names)) != 4
                    or set(more_names) != expected_more
                ):
                    return "GROUPED_READ_ARGS_OR_ORDER"
            elif tool == "case_calc_sentence":
                if "case_calc_sentence" in self.tool_sequence:
                    return "CALC_ORDER"
            elif tool == "case_save_draft":
                if "case_calc_sentence" not in self.tool_sequence:
                    return "SAVE_BEFORE_CALC"
                if (
                    not self._exact_keys(args, {"title", "content"})
                    or not isinstance(args.get("title"), str)
                    or args["title"] != EXPECTED_DRAFT_TITLE
                    or not isinstance(args.get("content"), str)
                    or not args["content"].strip()
                ):
                    return "DRAFT_ARGS"
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
                or value.get("kind") != "criminal"
            ):
                self.violations.append("CASE_OPEN_RESPONSE")
            else:
                self.case_id = case_id
        elif path == "/api/materials" and isinstance(value, dict):
            rows = value.get("materials")
            if not isinstance(rows, list) or len(rows) != 5:
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
                        or not rel_path.startswith("02案件材料/")
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
                if ids and len(ids) == 5 and set(names.values()) == EXPECTED_MATERIAL_NAMES:
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
                        or len(index_rows) != 5
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
                        if len(index_by_id) == 5 and len(versions) == 5:
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
                or l1.get("truncated") is not False
                or l1.get("toc") != []
                or not isinstance(l1.get("text"), str)
                or l1["text"] != ""
                or l1.get("tokens") != 0
            ):
                self.violations.append("CONTEXT_RESPONSE")
            else:
                self.context_l1_exact = True
        elif path == "/core/tool" and request_tool == "case_calc_sentence" and isinstance(value, dict):
            if not isinstance(request_args, dict):
                self.violations.append("CALCULATOR_ARGS")
            else:
                self.calculator_args.append(dict(request_args))
                self.calculator_results.append(dict(value))
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
            "calculatorArgs": list(self.calculator_args),
            "calculatorResults": list(self.calculator_results),
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
            "materialCount": fixture_count,
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
            failure = failure or "sentence_calc_route_count"
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
            or len(protocol["materialIds"]) != 5
            or len(protocol["calculatorArgs"]) != 1
            or len(protocol["calculatorResults"]) != 1
            or protocol["selectionId"] == protocol["taskId"]
            or not protocol["draftPaths"]
        ):
            failure = failure or "sentence_calc_protocol_incomplete"
        sequence = protocol["toolSequence"]
        if (
            sequence[:2] != ["case_list_materials", "case_read_material"]
            or sequence.count("case_calc_sentence") != 1
            or sequence.count("case_save_draft") < 1
            or sequence.index("case_calc_sentence") != 2
            or sequence.index("case_save_draft") < sequence.index("case_calc_sentence")
        ):
            failure = failure or "sentence_calc_tool_order"
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
        if verify_private_case(root, allow_criminal_template=True) != fixture_count:
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
            "materialCount": fixture_count,
            "fixtureCount": fixture_count,
            "fixtureInputsUnchanged": verify_private_case(root, allow_criminal_template=True) == fixture_count,
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
            "usage: b-service-sentence-calc.py --root <evidence/run-id>",
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
