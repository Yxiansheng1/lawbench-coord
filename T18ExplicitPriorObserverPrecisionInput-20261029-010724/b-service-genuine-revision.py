#!/usr/bin/env python3
"""Finite current-B HTTP entry for the explicit prior-input T18 workflow.

The parent Node process supplies a random local-only bearer token on stdin.
This process starts the current B ASGI application on a random 127.0.0.1
port with product lifespan disabled, a refusing outbound HTTP transport, and
no credential, OCR, retainer, material-import, request-scope, or redline
operation. It admits exactly two ordinary Native tasks on the copied genuine
case: pre-issue-check with the original v2 draft, then doc-revise with the
original draft plus the first task's checklist. The copied session header keeps
its original cwd; the guard rewrites only the task-begin cwd to the private
copy, so every product case read and write remains inside that copy.

Before ``create_app`` it copies exactly the two genuine request-scope appdata
records named by the execution order. It reads no credential and exits only
after a parent ``stop`` line, stdin EOF, or a service failure.
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
import time
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
SOURCE_PINS = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18GenuineRevisionInput-20261029-002747"
    r"\reviewed-b-source-pins-two-rate.json"
)
SOURCE_PINS_BYTES = 53_548
SOURCE_PINS_SHA256 = "2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379"
SOURCE_PINS_ENTRIES = 346
RUN_NAME = re.compile(r"^run-[A-Za-z0-9_-]{6,64}$")
MAX_TOKEN_BYTES = 4096
MAX_REQUEST_BODY = 4 * 1024 * 1024
MAX_RESPONSE_CAPTURE = 4 * 1024 * 1024
FIXTURE_IDENTITIES = (
    (
        B_ROOT / "tests" / "fixtures" / "contract-01" / "采购合同.docx",
        39_994,
        "16ea49cb8e539ed2d3485673ac9eef76184248a6b75edbf8fd7de3179fd4181a",
        1_792_379_578_857_675_200,
    ),
    (
        B_ROOT
        / "skills"
        / "contract-review"
        / "tests"
        / "样本01-钢材采购"
        / "采购部内部意见.txt",
        823,
        "3c40461cdeebad0c3fda4cda07824e901196a5bcdd149b11edfbdc1ade90e040",
        1_792_379_578_787_315_800,
    ),
)
FIXTURE_PATHS = tuple(str(row[0]) for row in FIXTURE_IDENTITIES)
ORIGINAL_RUN = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T18"
    r"\QuestionGateContractWorkflow-20261028-191702\run-fQoiXe"
)
ORIGINAL_SESSION_CWD = str(ORIGINAL_RUN / "case")
EXPECTED_CASE_ID = "9d535ab5-f14c-42cc-bd99-a2f669ff6200"
EXPECTED_SESSION_ID = "session-1cb28369-3a90-46dc-b047-e64986038394"
ORIGINAL_DRAFT = "工作区/任务/T-20261028234100-6b49/草稿/合同审查意见-v2.md"
TASK_PARAMS = {
    "thinking": "中",
    "window": "128K",
    "max_tokens": 32_768,
    "temperature": 0.6,
}
TASK_STAGES = (
    {
        "skill": "pre-issue-check",
        "inputs": (ORIGINAL_DRAFT,),
    },
    {
        "skill": "doc-revise",
        "inputs": (ORIGINAL_DRAFT, None),
    },
)
APP_DATA_IDENTITIES = (
    (
        ORIGINAL_RUN / "appdata" / "request-scopes.json",
        "request-scopes.json",
        638,
        "15425c85634ff41379d2b9c3003c1b88c352c99a1dca5a17dcb7f25e38e226fd",
        1_793_202_060_773_185_300,
    ),
    (
        ORIGINAL_RUN
        / "appdata"
        / "request-scope-intents"
        / "79da42833363c82ccf62c502d1df47d9a99cffd900910137df4d510d0f1d167d.json",
        "request-scope-intents/79da42833363c82ccf62c502d1df47d9a99cffd900910137df4d510d0f1d167d.json",
        526,
        "3cda63fed3e1896ed90b1206a2bb42fbea7929317c791481a80924382a5ba6c2",
        1_793_202_060_700_810_100,
    ),
)
TASK_ID = re.compile(r"^T-[0-9]{14}-[0-9a-f]{4}$")


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


def assert_private_root(raw: str) -> pathlib.Path:
    root = pathlib.Path(raw)
    if not root.is_absolute() or root.parent.resolve() != EVIDENCE_ROOT:
        raise RuntimeError("private run root must be a direct child of the evidence directory")
    if RUN_NAME.fullmatch(root.name) is None:
        raise RuntimeError("private run root has an invalid name")
    info = os.lstat(root)
    if not stat.S_ISDIR(info.st_mode) or stat.S_ISLNK(info.st_mode):
        raise RuntimeError("private run root is not an ordinary directory")
    if root.resolve() != root:
        raise RuntimeError("private run root resolves through a reparse point")
    return root


def verify_source_pins() -> int:
    if not ordinary_file(SOURCE_PINS):
        raise RuntimeError("reviewed B source pins file is missing or redirected")
    if SOURCE_PINS.stat().st_size != SOURCE_PINS_BYTES:
        raise RuntimeError("reviewed B source pins byte count changed")
    if sha256(SOURCE_PINS) != SOURCE_PINS_SHA256:
        raise RuntimeError("reviewed B source pins SHA-256 changed")
    pins = json.loads(SOURCE_PINS.read_text(encoding="utf-8"))
    if not isinstance(pins, dict) or len(pins) != SOURCE_PINS_ENTRIES:
        raise RuntimeError("reviewed B source pin count changed")
    for relative, expected in pins.items():
        if not isinstance(relative, str) or not isinstance(expected, dict):
            raise RuntimeError("reviewed B source pin row is invalid")
        pure = pathlib.PurePosixPath(relative)
        if pure.is_absolute() or ".." in pure.parts:
            raise RuntimeError("reviewed B source pin path escapes B")
        path = B_ROOT.joinpath(*pure.parts)
        if not ordinary_file(path):
            raise RuntimeError(f"reviewed B source is missing or redirected: {relative}")
        if path.stat().st_size != expected.get("bytes") or sha256(path) != expected.get("sha256"):
            raise RuntimeError(f"reviewed B source identity changed: {relative}")
    return len(pins)


def verify_fixture_inputs() -> int:
    for path, expected_bytes, expected_sha, expected_mtime_ns in FIXTURE_IDENTITIES:
        if not ordinary_file(path):
            raise RuntimeError("fixed contract input is missing or redirected")
        info = path.stat()
        if (
            info.st_size != expected_bytes
            or info.st_mtime_ns != expected_mtime_ns
            or sha256(path) != expected_sha
        ):
            raise RuntimeError("fixed contract input identity changed")
    return len(FIXTURE_IDENTITIES)


def verify_appdata_sources() -> int:
    for source, _relative, expected_bytes, expected_sha, expected_mtime_ns in APP_DATA_IDENTITIES:
        if not ordinary_file(source):
            raise RuntimeError("genuine request-scope appdata input is missing or redirected")
        info = source.stat()
        if (
            info.st_size != expected_bytes
            or info.st_mtime_ns != expected_mtime_ns
            or sha256(source) != expected_sha
        ):
            raise RuntimeError("genuine request-scope appdata input identity changed")
    return len(APP_DATA_IDENTITIES)


def copy_genuine_appdata(root: pathlib.Path) -> list[dict[str, Any]]:
    """Copy only the two selected non-secret records before creating the app."""
    appdata = root / "appdata"
    appdata.mkdir(mode=0o700, parents=True, exist_ok=True)
    if any(appdata.iterdir()):
        raise RuntimeError("private appdata must be empty before the exact two-file copy")
    copied: list[dict[str, Any]] = []
    for source, relative, expected_bytes, expected_sha, expected_mtime_ns in APP_DATA_IDENTITIES:
        pure = pathlib.PurePosixPath(relative)
        if pure.is_absolute() or ".." in pure.parts or not pure.parts:
            raise RuntimeError("genuine appdata destination escapes private root")
        destination = root.joinpath("appdata", *pure.parts)
        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
        shutil.copy2(source, destination, follow_symlinks=False)
        info = destination.lstat()
        if (
            not ordinary_file(destination)
            or info.st_size != expected_bytes
            or info.st_mtime_ns != expected_mtime_ns
            or sha256(destination) != expected_sha
        ):
            raise RuntimeError("copied genuine appdata identity is not byte-and-mtime exact")
        copied.append(
            {
                "source": str(source),
                "destination": str(destination),
                "relative": relative,
                "bytes": expected_bytes,
                "sha256": expected_sha,
                "mtime_ns": str(expected_mtime_ns),
            }
        )
    return copied


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
    keep = {}
    for name in ("SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT"):
        value = os.environ.get(name)
        if value:
            keep[name] = value
    os.environ.clear()
    os.environ.update(keep)
    dirs = {
        "HOME": root / "home",
        "USERPROFILE": root / "home",
        "APPDATA": root / "appdata",
        "LOCALAPPDATA": root / "localappdata",
        "TEMP": root / "temp",
        "TMP": root / "temp",
        "TMPDIR": root / "temp",
        "PYTHONDONTWRITEBYTECODE": "1",
        "PYTHONUTF8": "1",
    }
    for name, path in dirs.items():
        if name.startswith("PYTHON"):
            os.environ[name] = path
        else:
            path.mkdir(mode=0o700, parents=True, exist_ok=True)
            os.environ[name] = str(path)
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
    """Reject every route and identity transition outside the two stages."""

    POST_PATHS = frozenset(
        {
            "/api/case/open",
            "/api/task",
            "/core/task/begin",
            "/core/context",
            "/core/tool",
            "/core/progress",
            "/core/task/end",
        }
    )
    GET_PATHS = frozenset(
        {
            "/health",
            "/api/settings",
            "/api/materials",
            "/api/tasks",
            "/api/source",
        }
    )
    WORKFLOW_TOOLS = frozenset(
        {
            "case_list_materials",
            "case_read_material",
            "case_read_input",
            "case_search",
            "case_read_wiki",
            "case_save_draft",
        }
    )

    def __init__(self, app: Any, case_root: pathlib.Path):
        self.app = app
        self.case_root = os.path.normcase(os.path.realpath(case_root))
        self.case_id: str | None = None
        self.task_id: str | None = None
        self.session_id: str | None = None
        self.request_id: str | None = None
        self.material_ids: set[str] = set()
        self.task_ids: list[str] = []
        self.request_ids: list[str] = []
        self.selection_ids: list[str] = []
        self.selection_inputs: list[list[str]] = []
        self.begin_cwds: list[str] = []
        self.cwd_aliases: list[dict[str, str]] = []
        self.stage1_checklist_path: str | None = None
        self.stage_drafts: list[list[str]] = [[], []]
        self.stage_closed: list[bool] = [False, False]
        self.stage_begun: list[bool] = [False, False]
        self.counts: dict[str, int] = {}
        self.denials: dict[str, int] = {}
        self.violations: list[str] = []
        self._active_stage: int | None = None

    def _count(self, key: str) -> None:
        self.counts[key] = self.counts.get(key, 0) + 1

    def _deny(self, code: str) -> None:
        self.denials[code] = self.denials.get(code, 0) + 1

    def _check_get(self, path: str, query: list[tuple[str, str]]) -> str | None:
        values: dict[str, list[str]] = {}
        for key, value in query:
            values.setdefault(key, []).append(value)
        if path == "/health":
            return None if not query else "HEALTH_QUERY"
        if path == "/api/settings":
            return None if not query else "SETTINGS_QUERY"
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
                if values.get("task_id", [self.task_id])[0] not in self.task_ids:
                    return "TASK_ID_OUTSIDE_RUN"
            return None
        return "QUERY_NOT_ALLOWED"

    @staticmethod
    def _exact_keys(value: dict[str, Any], required: set[str], optional: set[str] | None = None) -> bool:
        allowed = required | (optional or set())
        return required.issubset(value) and set(value).issubset(allowed)

    def _check_post(self, path: str, data: Any) -> str | None:
        if not isinstance(data, dict):
            return "BODY_OBJECT"
        if path == "/api/case/open":
            if self.case_id is not None:
                return "CASE_OPEN_LIMIT"
            if (
                not self._exact_keys(data, {"path", "template"}, {"kind"})
                or data.get("template") != "civil"
                or data.get("kind") != "civil"
                or not isinstance(data.get("path"), str)
                or os.path.normcase(os.path.realpath(data["path"])) != self.case_root
            ):
                return "CASE_OPEN_BODY"
            return None
        if self.case_id is None:
            return "CASE_NOT_BOUND"
        if path == "/api/task":
            stage = self.counts.get("POST /api/task", 0)
            if stage >= len(TASK_STAGES):
                return "TASK_SELECTION_LIMIT"
            if stage == 0 and self.stage_begun[0]:
                return "TASK_SELECTION_AFTER_BEGIN"
            if stage == 1 and not self.stage_closed[0]:
                return "STAGE1_NOT_CLOSED"
            expected = TASK_STAGES[stage]
            requested_inputs = data.get("inputs")
            expected_inputs = list(expected["inputs"])
            if stage == 1:
                if self.stage1_checklist_path is None:
                    return "STAGE1_CHECKLIST_MISSING"
                expected_inputs[1] = self.stage1_checklist_path
            params = data.get("params")
            if (
                not self._exact_keys(data, {"case_id", "session_id", "entry", "skill", "inputs", "params"})
                or data.get("case_id") != self.case_id
                or not isinstance(data.get("session_id"), str)
                or data.get("entry") is not None
                or data.get("skill") != expected["skill"]
                or requested_inputs != expected_inputs
                or not isinstance(params, dict)
                or params != TASK_PARAMS
            ):
                return "TASK_SELECTION_BODY"
            if self.session_id is None:
                self.session_id = data["session_id"]
            elif data["session_id"] != self.session_id:
                return "SESSION_CHANGED"
            self._active_stage = stage
            self.selection_inputs.append(list(requested_inputs))
            return None
        if path == "/core/task/begin":
            stage = self.counts.get("POST /core/task/begin", 0)
            if stage >= len(TASK_STAGES) or self._active_stage != stage:
                return "TASK_BEGIN_STAGE"
            if self.stage_begun[stage]:
                return "TASK_BEGIN_LIMIT"
            if (
                not self._exact_keys(data, {"session_id", "cwd", "request_id"})
                or data.get("session_id") != self.session_id
                or not isinstance(data.get("request_id"), str)
                or data.get("request_id") in self.request_ids
                or not isinstance(data.get("cwd"), str)
                or data.get("cwd") != ORIGINAL_SESSION_CWD
            ):
                return "TASK_BEGIN_BODY"
            self.begin_cwds.append(data["cwd"])
            self.cwd_aliases.append({"from": data["cwd"], "to": str(self.case_root)})
            self.request_id = data["request_id"]
            data["cwd"] = str(self.case_root)
            return None
        if self.task_id is None:
            return "TASK_NOT_BOUND"
        if data.get("task_id") != self.task_id:
            return "TASK_ID_OUTSIDE_RUN"
        if path == "/core/tool":
            if (
                not self._exact_keys(data, {"task_id", "tool", "args"})
                or not isinstance(data.get("tool"), str)
                or data.get("tool") not in self.WORKFLOW_TOOLS
                or not isinstance(data.get("args"), dict)
            ):
                return "TOOL_BODY"
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
        key = f"{method} {path}"
        query = parse_qsl(scope.get("query_string", b"").decode("utf-8", "strict"), keep_blank_values=True)
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
                chunks.append(message.get("body", b""))
                size += len(chunks[-1])
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
            denial = "METHOD_OR_PATH" if path not in self.GET_PATHS else self._check_get(path, query)
        elif method == "POST":
            denial = "METHOD_OR_PATH" if path not in self.POST_PATHS else self._check_post(path, data)
        else:
            denial = "METHOD_OR_PATH"
        if denial:
            self._deny(denial)
            await self._deny_reply(send, denial)
            return

        if path == "/core/task/begin":
            body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self._count(key)
        request_tool = data.get("tool") if path == "/core/tool" and isinstance(data, dict) else None
        request_args = data.get("args") if path == "/core/tool" and isinstance(data, dict) else None
        request_task_id = data.get("task_id") if isinstance(data, dict) else None
        status: int | None = None
        captured = bytearray()
        overflow = False

        async def observed_send(message: dict[str, Any]) -> None:
            nonlocal status, overflow
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
                or case_id != EXPECTED_CASE_ID
                or value.get("created") is not False
            ):
                self.violations.append("CASE_OPEN_RESPONSE")
            else:
                self.case_id = case_id
        elif path == "/api/materials" and isinstance(value, dict):
            rows = value.get("materials")
            if not isinstance(rows, list) or len(rows) != 2:
                self.violations.append("MATERIAL_LIST_RESPONSE")
            else:
                ids = {
                    row.get("material_id")
                    for row in rows
                    if isinstance(row, dict)
                }
                if len(ids) != 2 or not all(isinstance(item, str) for item in ids):
                    self.violations.append("MATERIAL_ID_RESPONSE")
                else:
                    self.material_ids = set(ids)
        elif path == "/api/task" and isinstance(value, dict):
            task_id = value.get("task_id")
            if not isinstance(task_id, str) or TASK_ID.fullmatch(task_id) is None:
                self.violations.append("TASK_SELECTION_RESPONSE")
            else:
                self.selection_ids.append(task_id)
        elif path == "/core/task/begin" and isinstance(value, dict):
            task_id = value.get("task_id")
            if (
                not isinstance(task_id, str)
                or TASK_ID.fullmatch(task_id) is None
                or value.get("case_id") != self.case_id
                or value.get("request_id") != self.request_id
                or "request_scope" not in value
                or value["request_scope"] is not None
                or value.get("skill") != TASK_STAGES[self._active_stage]["skill"]
                or value.get("params") != TASK_PARAMS
            ):
                self.violations.append("TASK_BEGIN_RESPONSE")
            else:
                assert self._active_stage is not None
                if task_id in self.task_ids:
                    self.violations.append("TASK_ID_REUSED")
                    return
                self.task_id = task_id
                self.task_ids.append(task_id)
                self.request_ids.append(self.request_id)
                self.stage_begun[self._active_stage] = True
                self.stage_closed[self._active_stage] = False
        elif path == "/core/tool" and request_tool == "case_save_draft" and isinstance(value, dict):
            draft_path = value.get("path")
            title = request_args.get("title") if isinstance(request_args, dict) else None
            stage = self._active_stage
            if (
                stage is None
                or not isinstance(draft_path, str)
                or not isinstance(title, str)
                or not draft_path.startswith(f"工作区/任务/{self.task_id}/草稿/")
                or not draft_path.endswith(".md")
            ):
                self.violations.append("DRAFT_RESPONSE")
            else:
                self.stage_drafts[stage].append(draft_path)
                if stage == 0 and title == "出稿前审查-合同审查意见":
                    if (
                        re.fullmatch(
                            rf"^工作区/任务/{re.escape(self.task_id)}/草稿/"
                            rf"出稿前审查-合同审查意见-v[1-9][0-9]*\.md$",
                            draft_path,
                        )
                        is None
                    ):
                        self.violations.append("CHECKLIST_PATH")
                    else:
                        self.stage1_checklist_path = draft_path
                elif stage == 1 and title != "合同审查意见-修改稿":
                    self.violations.append("REVISION_TITLE")
        elif path == "/core/task/end" and isinstance(value, dict):
            stage = self._active_stage
            if (
                stage is None
                or request_task_id != self.task_id
                or value.get("status") != "completed"
            ):
                self.violations.append("TASK_END_RESPONSE")
            else:
                self.stage_closed[stage] = True

    def evidence(self) -> dict[str, Any]:
        return {
            "caseBound": self.case_id is not None,
            "sessionBound": self.session_id is not None,
            "taskBound": self.task_id is not None,
            "materialIdCount": len(self.material_ids),
            "selectionIds": list(self.selection_ids),
            "taskIds": list(self.task_ids),
            "requestIds": list(self.request_ids),
            "selectionInputs": [list(row) for row in self.selection_inputs],
            "beginCwds": list(self.begin_cwds),
            "cwdAliases": list(self.cwd_aliases),
            "stage1ChecklistPath": self.stage1_checklist_path,
            "stageDrafts": [list(row) for row in self.stage_drafts],
            "stageBegun": list(self.stage_begun),
            "stageClosed": list(self.stage_closed),
            "counts": dict(sorted(self.counts.items())),
            "denials": dict(sorted(self.denials.items())),
            "violations": list(self.violations),
        }


async def run_service(root: pathlib.Path, token: str) -> tuple[int, dict[str, Any]]:
    source_pin_count = verify_source_pins()
    fixture_count = verify_fixture_inputs()
    appdata_source_count = verify_appdata_sources()
    sock: socket.socket | None = None
    lb: Any | None = None
    imported_logs: Any | None = None
    retainer: DisabledRetainer | None = None
    try:
        copied_appdata = copy_genuine_appdata(root)
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
            raise RuntimeError("model credential access is disabled in the finite B entry")

        def refuse_external_key() -> str:
            credentials["externalKeyGetter"] += 1
            raise RuntimeError("external credential access is disabled in the finite B entry")

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
            "fixtureCount": fixture_count,
            "forwardListener": False,
            "ocrStarted": False,
            "retainerStarted": False,
        }
        print(json.dumps(ready, ensure_ascii=False, sort_keys=True), flush=True)
        await service_task
        if not server.started or server.should_exit is not True:
            raise RuntimeError("B HTTP service did not stop through its supported stop path")
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
        if (
            len(protocol["selectionIds"]) != 2
            or len(set(protocol["selectionIds"])) != 2
            or len(protocol["taskIds"]) != 2
            or len(protocol["requestIds"]) != 2
            or len(set(protocol["requestIds"])) != 2
            or protocol["stageBegun"] != [True, True]
            or protocol["stageClosed"] != [True, True]
            or protocol["stage1ChecklistPath"] is None
            or not protocol["stageDrafts"][0]
            or not protocol["stageDrafts"][1]
        ):
            failure = failure or "two_stage_protocol_incomplete"
        if any(
            key.startswith("POST /api/materials/import")
            or key.startswith("POST /api/request/scope")
            or key.startswith("POST /api/redline")
            for key in protocol["counts"]
        ):
            failure = failure or "forbidden_route_count"
        if not listener_closed:
            failure = failure or "listener_not_closed"
        if outbound["attempts"] or any(credentials.values()):
            failure = failure or "outbound_or_credential_access"
        if verify_fixture_inputs() != fixture_count:
            failure = failure or "fixture_inputs_changed"
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
            "fixtureCount": fixture_count,
            "fixtureInputsUnchanged": verify_fixture_inputs() == fixture_count,
            "appdataSourceCount": appdata_source_count,
            "appdataSourcesUnchanged": verify_appdata_sources() == appdata_source_count,
            "copiedAppdata": copied_appdata,
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
        print("usage: b-service-genuine-revision.py --root <evidence/run-id>", file=sys.stderr)
        return 2
    root = assert_private_root(sys.argv[2])
    token = read_local_token()
    scrub_environment(root)
    try:
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
            write_json_exclusive(root / "b-service-final.json", failure)
        except BaseException:
            pass
        print(f"finite B service failed: {type(error).__name__}", file=sys.stderr)
        return 1
    finally:
        token = ""


if __name__ == "__main__":
    raise SystemExit(main())
