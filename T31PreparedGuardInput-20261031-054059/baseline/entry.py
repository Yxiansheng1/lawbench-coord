#!/usr/bin/env python3
"""T31 source-only GUI scope service adapter.

The adapter executes the pinned original canonical entry unchanged and composes
it with the pinned source-only scope policy.  It does not replace the original
guard, layout, admission, app, material, task, or forwarder implementation.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import pathlib
import re
import stat
import sys
import threading
import types
from typing import Any

import httpx
import uvicorn


SELF_ROOT = pathlib.Path(__file__).resolve().parent
PLANNED_GUI_ROOT = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T31"
    r"\GuiScopeSubmission-20261031-050218"
)
CANONICAL_PATH = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T34"
    r"\CanonicalOriginalGUI-20261031-022702\entry.py"
)
CANONICAL_BYTES = 88654
CANONICAL_SHA256 = (
    "aa42c2aa1e9f0b3e5b84b1ba20b9bdd26ac35a1552a491f7f3d67ed266001f64"
)
POLICY_PATH = pathlib.Path(
    r"D:\Lawbeach\lawbench-B\docs\plan\evidence\T31"
    r"\GuiScopePolicyContract-20261031-045658\scope-policy.py"
)
POLICY_BYTES = 24402
POLICY_SHA256 = (
    "4bb9918cf8f61e6292e1a9200ebfba42b1cdc9b9c51502b962502d79966af1fb"
)
EXPECTED_MATERIALS = {
    "scope-a.txt": (
        37,
        "0a51e0be95614eef753152f14e9c6ff303f47814b07da716e57141baf4ceb6e8",
    ),
    "scope-b.txt": (
        37,
        "3035e0e8f6e9a1b8c907425544c09628c9052c9d2042de6bc166d9f89cf87e91",
    ),
    "scope-c.txt": (
        39,
        "5195e5e8b39b260769436bb9967e1f22456a748fb495c17a2795e7905e29a439",
    ),
}
SCOPE_SOURCE_NAME = "scope-source"
SCOPE_SOURCE_SHA_BY_NAME = {
    name: pin[1] for name, pin in EXPECTED_MATERIALS.items()
}
PROTECTED_WRITE_ROUTES = {
    "/api/request/scope",
    "/core/task/begin",
    "/core/context",
    "/core/progress",
    "/core/task/end",
    "/core/tool",
}
MATERIAL_ROUTES = {"/api/materials/import", "/api/materials"}
MAX_SECONDS = 600
MAX_JSON_BYTES = 1_048_576


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _file_bytes(path: pathlib.Path) -> bytes:
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_JSON_BYTES:
        raise RuntimeError("unexpected_source_file")
    return path.read_bytes()


def _verified_file(
    path: pathlib.Path, expected_bytes: int, expected_sha256: str
) -> bytes:
    data = _file_bytes(path)
    if len(data) != expected_bytes or _sha256(data) != expected_sha256:
        raise RuntimeError("pinned_source_identity")
    return data


def _load_canonical() -> types.ModuleType:
    source = _verified_file(CANONICAL_PATH, CANONICAL_BYTES, CANONICAL_SHA256)
    module = types.ModuleType("_t31_canonical_original_private")
    module.__file__ = str(CANONICAL_PATH)
    module.__package__ = None
    exec(compile(source, str(CANONICAL_PATH), "exec"), module.__dict__)
    module.EVIDENCE_ROOT = SELF_ROOT
    module.RUNS_ROOT = SELF_ROOT / "runs"
    if module.__dict__.get("__name__") == "__main__":
        raise RuntimeError("canonical_main_executed_at_load")
    return module


ORIGINAL = _load_canonical()


def _require_planned_root() -> None:
    if SELF_ROOT.resolve() != PLANNED_GUI_ROOT.resolve():
        raise ORIGINAL.Deny("entry_not_in_planned_gui_root")


def _fixture_state() -> dict[str, dict[str, Any]]:
    result: dict[str, dict[str, Any]] = {}
    for name, (size, digest) in EXPECTED_MATERIALS.items():
        data = _verified_file(SELF_ROOT / name, size, digest)
        result[name] = {"bytes": len(data), "sha256": _sha256(data)}
    return result


def _scope_files(root: pathlib.Path) -> dict[str, dict[str, Any]]:
    scope_root = root / SCOPE_SOURCE_NAME
    if not scope_root.is_dir() or scope_root.is_symlink():
        raise RuntimeError("scope_source_missing")
    if sorted(path.name for path in scope_root.iterdir()) != sorted(
        EXPECTED_MATERIALS
    ):
        raise RuntimeError("scope_source_shape")
    result: dict[str, dict[str, Any]] = {}
    for name, (size, digest) in EXPECTED_MATERIALS.items():
        data = _verified_file(scope_root / name, size, digest)
        result[name] = {"bytes": len(data), "sha256": _sha256(data)}
    return result


def _copy_scope_sources(raw_root: str) -> pathlib.Path:
    _require_planned_root()
    root = ORIGINAL._validate_root(raw_root)
    admission = ORIGINAL._admit(raw_root)
    if admission != root / "admission.json":
        raise ORIGINAL.Deny("original_admission_path")
    fixture_before = _fixture_state()
    target = root / SCOPE_SOURCE_NAME
    target.mkdir(mode=0o700, parents=False, exist_ok=False)
    for name in sorted(EXPECTED_MATERIALS):
        data = _verified_file(
            SELF_ROOT / name, EXPECTED_MATERIALS[name][0], EXPECTED_MATERIALS[name][1]
        )
        with (target / name).open("xb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
    if _scope_files(root) != fixture_before or _fixture_state() != fixture_before:
        raise ORIGINAL.Deny("scope_copy_identity")
    return admission


def _capture_host_values(
    root: pathlib.Path, appdata: pathlib.Path
) -> tuple[int, int, str]:
    port_text = os.environ.get("LB_PORT")
    forward_text = os.environ.get("LB_FORWARD_PORT")
    token = os.environ.get("LB_TOKEN")
    host_appdata = os.environ.get("LB_APPDATA")
    if port_text is None or re.fullmatch(r"[0-9]+", port_text) is None:
        raise ORIGINAL.Deny("invalid_LB_PORT")
    if forward_text is None or re.fullmatch(r"[0-9]+", forward_text) is None:
        raise ORIGINAL.Deny("invalid_LB_FORWARD_PORT")
    if token is None or re.fullmatch(r"[0-9a-f]{64}", token) is None:
        raise ORIGINAL.Deny("invalid_LB_TOKEN")
    if host_appdata is None or ORIGINAL._norm(host_appdata) != ORIGINAL._norm(appdata):
        raise ORIGINAL.Deny("LB_APPDATA_not_prepared")
    host_port, forward_port = int(port_text, 10), int(forward_text, 10)
    if not 1 <= host_port <= 65535:
        raise ORIGINAL.Deny("LB_PORT_out_of_range")
    if not 10000 <= forward_port <= 65535:
        raise ORIGINAL.Deny("LB_FORWARD_PORT_out_of_range")
    if forward_port == host_port:
        raise ORIGINAL.Deny("LB_FORWARD_PORT_matches_host")
    if 65001 <= forward_port <= 65005 or forward_port == 18765:
        raise ORIGINAL.Deny("LB_FORWARD_PORT_reserved")
    if not root.is_dir():
        raise ORIGINAL.Deny("root_missing")
    return host_port, forward_port, token


class RefusingModelTransport(httpx.BaseTransport, httpx.AsyncBaseTransport):
    """Record requested model calls and refuse before any socket can open."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._count = 0
        self._methods: dict[str, int] = {}
        self._paths: dict[str, int] = {}
        self._close_calls = 0
        self._aclose_calls = 0

    def _record(self, request: httpx.Request) -> None:
        method = request.method.upper()[:16]
        path = request.url.path[:160]
        with self._lock:
            self._count += 1
            self._methods[method] = self._methods.get(method, 0) + 1
            self._paths[path] = self._paths.get(path, 0) + 1

    def _refuse(self, request: httpx.Request) -> None:
        self._record(request)
        raise httpx.ConnectError("T31 expected model boundary refusal", request=request)

    def handle_request(self, request: httpx.Request) -> httpx.Response:
        self._refuse(request)

    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:
        self._refuse(request)

    def close(self) -> None:
        with self._lock:
            self._close_calls += 1

    async def aclose(self) -> None:
        with self._lock:
            self._aclose_calls += 1

    def evidence(self) -> dict[str, Any]:
        with self._lock:
            return {
                "classification": "EXPECTED_MODEL_BOUNDARY_REFUSALS",
                "count": self._count,
                "methods": dict(sorted(self._methods.items())),
                "paths": dict(sorted(self._paths.items())),
                "closeCalls": self._close_calls,
                "acloseCalls": self._aclose_calls,
                "fullMachineClosed": "NOT_CLAIMED",
            }


class PortOwnership:
    def __init__(self, host_port: int, forward_port: int) -> None:
        self.host_port = host_port
        self.forward_port = forward_port
        self.host_listener = False
        self.forward_listener = False

    @property
    def both(self) -> bool:
        return self.host_listener and self.forward_listener

    def evidence(self) -> dict[str, Any]:
        return {
            "apiPort": self.host_port,
            "forwardPort": self.forward_port,
            "apiListenerOwned": self.host_listener,
            "forwardListenerOwned": self.forward_listener,
            "bothOwned": self.both,
            "loopbackOnly": True,
        }


def _load_policy_module() -> types.ModuleType:
    source = _verified_file(POLICY_PATH, POLICY_BYTES, POLICY_SHA256)
    module = types.ModuleType("_t31_approved_scope_policy_private")
    module.__file__ = str(POLICY_PATH)
    module.__package__ = None
    exec(compile(source, str(POLICY_PATH), "exec"), module.__dict__)
    if not callable(module.__dict__.get("make_scope_firewall")):
        raise ORIGINAL.Deny("approved_scope_policy_factory")
    return module


def _make_firewall(
    native: Any,
    *,
    root: pathlib.Path,
    case: pathlib.Path,
    host_token: str,
    lb: Any,
    ownership: PortOwnership,
) -> Any:
    policy_module = _load_policy_module()
    scope_source_root = root / SCOPE_SOURCE_NAME
    policy_base = policy_module.make_scope_firewall(
        ORIGINAL.Firewall,
        source_root=scope_source_root,
        source_sha_by_name=SCOPE_SOURCE_SHA_BY_NAME,
    )

    class ScopeEvidenceFirewall(policy_base):
        def __init__(self, app, *, root, case, case_id, host_token):
            super().__init__(
                app, root=root, case=case, case_id=case_id, host_token=host_token
            )
            self._adapter_lb = lb
            self._adapter_ownership = ownership
            self._adapter_run_root = pathlib.Path(root).resolve()
            self._adapter_scope_source_root = scope_source_root
            self._adapter_case_root = pathlib.Path(case).resolve()
            self._adapter_lock = threading.RLock()
            self._adapter_bound = False
            self._adapter_bound_rows: list[dict[str, Any]] = []
            self._adapter_imports: list[dict[str, Any]] = []
            self._adapter_preimport_get_empty = False
            self._adapter_failure: str | None = None
            self._adapter_publish_error: str | None = None

        def _record_failure(self, code: str) -> None:
            with self._adapter_lock:
                self._adapter_failure = self._adapter_failure or code

        def _policy(self, method, path, data, query):
            if method == "POST" and path in PROTECTED_WRITE_ROUTES:
                with self._adapter_lock:
                    ready = self._adapter_bound and self._adapter_ownership.both
                if not ready:
                    self._deny("SCOPE_BINDING_NOT_READY")
                    return "SCOPE_BINDING_NOT_READY"
            return super()._policy(method, path, data, query)

        def _index_rows(self) -> list[dict[str, Any]]:
            index = self._adapter_lb.materials.index(ORIGINAL.EXPECTED_CASE_ID)
            rows = index.get("materials") if isinstance(index, dict) else None
            if not isinstance(rows, list) or not all(
                isinstance(row, dict) for row in rows
            ):
                raise ORIGINAL.Deny("NATIVE_MATERIAL_INDEX_SHAPE")
            return rows

        def _resolved_native_materials(self) -> list[dict[str, Any]]:
            rows = self._index_rows()
            if len(rows) != 3:
                raise ORIGINAL.Deny("NATIVE_MATERIAL_INDEX_COUNT")
            resolved: list[dict[str, Any]] = []
            source_root = self._adapter_scope_source_root.resolve()
            for row in rows:
                material_id = row.get("material_id")
                display_name = row.get("name")
                row_sha = row.get("sha256")
                if not all(
                    isinstance(value, str) and value
                    for value in (material_id, display_name, row_sha)
                ):
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_ROW_FIELDS")
                if row.get("status") != "parsed" or row.get("origin") != "ref":
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_ROW_STATE")
                if not isinstance(row.get("ref_id"), str) or not row["ref_id"]:
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_REFERENCE")
                path, state = self._adapter_lb.materials.original_path(
                    ORIGINAL.EXPECTED_CASE_ID,
                    material_id,
                    op="materials_original",
                )
                if state != "ok" or not isinstance(path, pathlib.Path):
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_ORIGINAL_PATH")
                if path.is_symlink():
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_ORIGINAL_FILE")
                actual = path.resolve()
                if actual.parent != source_root or actual.name not in EXPECTED_MATERIALS:
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_ORIGINAL_ROOT")
                if not actual.is_file():
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_ORIGINAL_FILE")
                size, expected_sha = EXPECTED_MATERIALS[actual.name]
                data = _verified_file(actual, size, expected_sha)
                if row_sha != expected_sha or _sha256(data) != expected_sha:
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_SHA")
                resolved.append(
                    {
                        "material_id": material_id,
                        "name": actual.name,
                        "sha256": expected_sha,
                        "native_display_name": display_name,
                        "status": "parsed",
                        "origin": "ref",
                        "ref_id": row["ref_id"],
                    }
                )
            if (
                {row["material_id"] for row in resolved} != {
                    row["material_id"] for row in rows
                }
                or len({row["material_id"] for row in resolved}) != 3
                or {row["name"] for row in resolved} != set(EXPECTED_MATERIALS)
            ):
                raise ORIGINAL.Deny("NATIVE_MATERIAL_IDENTITY_SET")
            return sorted(resolved, key=lambda row: row["name"])

        def _bind_native_materials(self) -> None:
            resolved = self._resolved_native_materials()
            bind_rows = [
                {
                    "material_id": row["material_id"],
                    "name": row["name"],
                    "sha256": row["sha256"],
                }
                for row in resolved
            ]
            super().bind_materials(bind_rows)
            with self._adapter_lock:
                if self._adapter_bound:
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_BIND_REPEATED")
                self._adapter_bound_rows = resolved
                self._adapter_bound = True

        def _verify_native_materials(self) -> None:
            resolved = self._resolved_native_materials()
            with self._adapter_lock:
                expected = {
                    (row["material_id"], row["name"], row["sha256"])
                    for row in self._adapter_bound_rows
                }
                actual = {
                    (row["material_id"], row["name"], row["sha256"])
                    for row in resolved
                }
                if not self._adapter_bound or actual != expected:
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_BINDING_CHANGED")

        def _record_import(self, status: int | None, response: Any) -> None:
            try:
                if status != 200 or not isinstance(response, dict) or not response.get("ok"):
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_IMPORT_FAILURE")
                value = response["value"]
                scan = value["scan"]
                added = scan["added"]
                if not isinstance(added, int) or isinstance(added, bool):
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_IMPORT_SCAN")
                with self._adapter_lock:
                    phase = "second" if self._adapter_bound else "first"
                    self._adapter_imports.append({"phase": phase, "added": added})
                if self._adapter_bound:
                    self._verify_native_materials()
                else:
                    self._bind_native_materials()
            except Exception as exc:
                self._record_failure(
                    getattr(exc, "code", "NATIVE_MATERIAL_IMPORT_FAILURE")
                )

        def _record_material_list(self, status: int | None, response: Any) -> None:
            try:
                if status != 200 or not isinstance(response, dict) or not response.get("ok"):
                    raise ORIGINAL.Deny("NATIVE_MATERIAL_LIST_FAILURE")
                if self._adapter_bound:
                    self._verify_native_materials()
                else:
                    rows = self._index_rows()
                    if rows:
                        raise ORIGINAL.Deny("NATIVE_MATERIAL_PREIMPORT_NONEMPTY")
                    with self._adapter_lock:
                        self._adapter_preimport_get_empty = True
            except Exception as exc:
                self._record_failure(
                    getattr(exc, "code", "NATIVE_MATERIAL_LIST_FAILURE")
                )

        def _complete(self, method, path, status, response):
            super()._complete(method, path, status, response)
            if method == "POST" and path == "/api/materials/import":
                self._record_import(status, response)
            elif method == "GET" and path == "/api/materials":
                self._record_material_list(status, response)
            if path in MATERIAL_ROUTES or path in PROTECTED_WRITE_ROUTES:
                self._publish_scope_evidence()

        def adapter_evidence(self) -> dict[str, Any]:
            policy = super().evidence()
            count_names = (
                "import_attempts",
                "import_successes",
                "scope_prepare_attempts",
                "scope_prepare_successes",
                "scope_release_attempts",
                "scope_release_successes",
                "task_begin_attempts",
                "task_begin_successes",
                "context_attempts",
                "context_successes",
                "progress_attempts",
                "progress_successes",
                "task_end_attempts",
                "task_end_successes",
            )
            with self._adapter_lock:
                rows = [dict(row) for row in self._adapter_bound_rows]
                imports = [dict(item) for item in self._adapter_imports]
                bound = self._adapter_bound
                preimport_empty = self._adapter_preimport_get_empty
                failure = self._adapter_failure
                publish_error = self._adapter_publish_error
            return {
                "scope_tuple": policy.get("scope_tuple"),
                "task": policy.get("task"),
                "materials": rows,
                "scope_nativeResponseVerified": bool(
                    policy.get("scope_nativeResponseVerified")
                ),
                "task_nativeScopeResponseVerified": bool(
                    policy.get("task_nativeScopeResponseVerified")
                ),
                "counts": {name: policy.get(name, 0) for name in count_names},
                "denials": policy.get("denied_counts"),
                "violations": policy.get("violations"),
                "native_failures": policy.get("native_failures"),
                "nativeIndexBindingVerified": bound,
                "preimportGetEmpty": preimport_empty,
                "importScans": imports,
                "adapterFailure": failure,
                "evidencePublishError": publish_error,
            }

        def _publish_scope_evidence(self) -> None:
            document = {
                "format": "lawbench-t31-direct-gui-scope-evidence-v1",
                "caseId": ORIGINAL.EXPECTED_CASE_ID,
                "scopeSourceRoot": str(self._adapter_scope_source_root),
                "policyEvidence": self.adapter_evidence(),
            }
            try:
                ORIGINAL._write_json(
                    self._adapter_run_root / "scope-evidence.json", document
                )
                with self._adapter_lock:
                    self._adapter_publish_error = None
            except Exception as exc:
                with self._adapter_lock:
                    self._adapter_publish_error = getattr(
                        exc, "code", "SCOPE_EVIDENCE_PUBLISH"
                    )

    return ScopeEvidenceFirewall(
        native,
        root=root,
        case=case,
        case_id=ORIGINAL.EXPECTED_CASE_ID,
        host_token=host_token,
    )


def _task_store_observation(
    lb: Any,
    case_root: pathlib.Path,
    scope_evidence: dict[str, Any],
) -> dict[str, Any]:
    from lawbench.case import gate as task_gate

    task_identity = scope_evidence.get("task")
    if not isinstance(task_identity, dict) or not task_identity.get("task_id"):
        return {
            "status": "NOT_REACHED",
            "reason": "NO_ACTUAL_POLICY_TASK",
            "rewritten": False,
        }
    scope = scope_evidence.get("scope_tuple")
    materials = scope_evidence.get("materials")
    if not isinstance(scope, dict) or not isinstance(materials, list):
        raise ORIGINAL.Deny("TASK_SCOPE_EVIDENCE_MISSING")

    task_id = task_identity["task_id"]
    located_case_id, located_root, native_task = lb.tasks.locate(task_id)
    if (
        located_case_id != scope.get("case_id")
        or pathlib.Path(located_root).resolve() != case_root.resolve()
        or not isinstance(native_task, dict)
        or native_task.get("task_id") != task_id
    ):
        raise ORIGINAL.Deny("TASK_STORE_LOCATE_MISMATCH")

    rel = lb.tasks.rel(task_id, "task.json")
    path = task_gate.resolve_internal(located_root, rel, op="task").resolve()
    if case_root.resolve() not in path.parents:
        raise ORIGINAL.Deny("TASK_STORE_PATH")
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_size > MAX_JSON_BYTES:
        raise ORIGINAL.Deny("TASK_STORE_FILE")
    data = path.read_bytes()
    document = json.loads(data.decode("utf-8"))
    if document != native_task:
        raise ORIGINAL.Deny("TASK_STORE_NATIVE_SNAPSHOT_MISMATCH")

    request_scope = document.get("request_scope")
    if not isinstance(request_scope, dict):
        raise ORIGINAL.Deny("TASK_STORE_REQUEST_SCOPE")
    if (
        document.get("case_id") != scope.get("case_id")
        or request_scope.get("case_id") != scope.get("case_id")
        or request_scope.get("request_id") != scope.get("request_id")
        or request_scope.get("kind") != "materials"
    ):
        raise ORIGINAL.Deny("TASK_STORE_SCOPE_IDENTITY")
    session_id = scope.get("session_id")
    if (
        not isinstance(session_id, str)
        or not session_id
        or document.get("session_id") != session_id
    ):
        raise ORIGINAL.Deny("TASK_STORE_SESSION")
    if lb.tasks.task_scope(native_task) != request_scope:
        raise ORIGINAL.Deny("TASK_STORE_SCOPE_AUTHORITY")

    sha_by_id = {
        row["material_id"]: row["sha256"]
        for row in materials
        if isinstance(row, dict)
    }
    rows = request_scope.get("materials")
    if not isinstance(rows, list) or len(rows) != 2:
        raise ORIGINAL.Deny("TASK_STORE_MATERIALS")
    selected_ids: list[str] = []
    for row in rows:
        if not isinstance(row, dict):
            raise ORIGINAL.Deny("TASK_STORE_MATERIAL_ROW")
        material_id, digest = row.get("material_id"), row.get("sha256")
        if (
            not isinstance(material_id, str)
            or not isinstance(digest, str)
            or sha_by_id.get(material_id) != digest
        ):
            raise ORIGINAL.Deny("TASK_STORE_MATERIAL_BINDING")
        selected_ids.append(material_id)
    if tuple(selected_ids) != tuple(scope.get("material_ids", ())):
        raise ORIGINAL.Deny("TASK_STORE_MATERIAL_SELECTION")

    return {
        "status": "VERIFIED",
        "taskId": task_id,
        "caseId": located_case_id,
        "relativePath": rel,
        "bytes": len(data),
        "finalFileSha256": _sha256(data),
        "physicalEqualsNativeSnapshot": True,
        "requestScopeVerified": True,
        "sessionId": session_id,
        "requestId": scope.get("request_id"),
        "selectedMaterialIds": selected_ids,
        "rewritten": False,
    }


def _inventory(root: pathlib.Path) -> dict[str, tuple[int, str]]:
    rows = ORIGINAL._tree_files(root)
    return {row["relativePath"]: (row["bytes"], row["sha256"]) for row in rows}


def _failure_code(exc: BaseException) -> str:
    code = getattr(exc, "code", None)
    if isinstance(code, str) and re.fullmatch(r"[A-Za-z0-9_.:-]{1,96}", code):
        return code
    return "unexpected_exception"


async def _serve(root: pathlib.Path, seconds: int) -> tuple[str, str]:
    manifest, _admission, layout = ORIGINAL._verify_admission(root)
    host_port, forward_port, host_token = _capture_host_values(
        root, layout["appdata"]
    )
    fixture_before = _fixture_state()
    scope_before = _scope_files(root)
    target_logs_before = ORIGINAL._target_log_identity(layout["case"])
    target_inventory_before = _inventory(layout["case"])
    started_path = root / "started.json"
    ORIGINAL._write_json(
        started_path,
        {
            "status": "started",
            "pid": os.getpid(),
            "started_at": ORIGINAL._now(),
            "root": str(root),
            "case_id": ORIGINAL.EXPECTED_CASE_ID,
            "host_port": host_port,
            "forward_port": forward_port,
            "requested_seconds": seconds,
        },
    )

    guard = ORIGINAL.BASE.Guard()
    credential_counts = {"local": 0, "external": 0, "keyring": 0}
    credential_lock = threading.Lock()
    transport = RefusingModelTransport()
    ownership = PortOwnership(host_port, forward_port)
    forward_lifecycle = {"startup_complete": False, "shutdown_complete": False}
    restore = logs = lb = firewall = None
    api_server = forward_server = api_task = forward_task = None
    api_port = forward_listener_port = None
    net_closed = logs_closed = transport_closed = False
    failure: str | None = None
    task_store: dict[str, Any] = {"status": "NOT_REACHED"}
    started_at = ORIGINAL._now()

    def local_key() -> str:
        with credential_lock:
            credential_counts["local"] += 1
        return "T31-direct-gui-fake-local-token"

    def external_key() -> str:
        with credential_lock:
            credential_counts["external"] += 1
        return "T31-direct-gui-fake-external-token"

    try:
        ORIGINAL._scrub_env(layout)
        ORIGINAL._install_keyring(credential_counts, guard, credential_lock)
        ORIGINAL._assert_b_sources()
        guard.phase = "product_import"
        restore = ORIGINAL._install_guards(guard)
        sys.path.insert(0, str(ORIGINAL.B_SERVICE))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench.app import create_app
        from lawbench.case import gate as gate_module
        from lawbench.case import materials as materials_module
        from lawbench.config import Config
        from lawbench.ingest import libreoffice as lo_module
        from lawbench.net import forward_app as original_forward_app

        logs = imported_logs
        module_file = pathlib.Path(sys.modules["lawbench"].__file__).resolve()
        if module_file.parents[2] != ORIGINAL.B_PRODUCT_ROOT.resolve():
            raise ORIGINAL.Deny("product_root_not_current_b")
        gate_module._registry_onedrive_folders = lambda: []
        lo_module.find_soffice = lambda: None

        def no_convert(*_args: Any, **_kwargs: Any):
            guard.deny("office_conversion")
            raise ORIGINAL.Deny("office_conversion")

        materials_module.Converter.convert = no_convert
        guard.phase = "app_create"
        config = Config(
            token=host_token,
            appdata=layout["appdata"],
            port=host_port,
            forward_port=forward_port,
            skills_dirs=[ORIGINAL.SKILLS_DIR],
            contracts_dir=ORIGINAL.B_CONTRACTS,
            validate_responses=True,
        )
        native = create_app(
            config,
            key_getter=local_key,
            external_key_getter=external_key,
            transport=transport,
        )
        lb = native.state.lb
        ORIGINAL._assert_wiring(lb, layout["appdata"], host_port, host_token)
        lb.retainer = ORIGINAL.DisabledRetainer()

        def no_recycle(*_args: Any, **_kwargs: Any):
            guard.deny("recycle")
            raise ORIGINAL.Deny("recycle")

        lb.materials.can_recycle = no_recycle
        lb.materials.recycle = no_recycle
        with credential_lock:
            if credential_counts["local"] or credential_counts["external"]:
                raise ORIGINAL.Deny("credential_getter_at_startup")

        firewall = _make_firewall(
            native,
            root=root,
            case=layout["case"],
            host_token=host_token,
            lb=lb,
            ownership=ownership,
        )
        original_forward = original_forward_app(
            lb.net,
            transport=transport,
            external_policy=lb.external,
            external_key_getter=external_key,
        )

        async def observed_forward(scope, receive, send):
            if scope.get("type") != "lifespan":
                await original_forward(scope, receive, send)
                return

            async def observed_send(message):
                message_type = message.get("type")
                if message_type == "lifespan.startup.complete":
                    forward_lifecycle["startup_complete"] = True
                elif message_type == "lifespan.shutdown.complete":
                    forward_lifecycle["shutdown_complete"] = True
                await send(message)

            await original_forward(scope, receive, observed_send)

        api_server = uvicorn.Server(
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
        forward_server = uvicorn.Server(
            uvicorn.Config(
                app=observed_forward,
                host="127.0.0.1",
                port=forward_port,
                workers=1,
                lifespan="on",
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
        api_task = asyncio.create_task(api_server.serve())
        await ORIGINAL._started(api_server, api_task)
        forward_task = asyncio.create_task(forward_server.serve())
        await ORIGINAL._started(forward_server, forward_task)
        api_port = int(ORIGINAL._listener(api_server).getsockname()[1])
        forward_listener_port = int(
            ORIGINAL._listener(forward_server).getsockname()[1]
        )
        if api_port != host_port or forward_listener_port != forward_port:
            raise ORIGINAL.Deny("listener_port_mismatch")
        ownership.host_listener = True
        ownership.forward_listener = True
        if not ownership.both:
            raise ORIGINAL.Deny("listener_ownership_incomplete")
        if imported_contracts.version() != "1.6":
            raise ORIGINAL.Deny("contract_version_not_1_6")
        ORIGINAL._write_json(
            root / "ready.json",
            {
                "status": "ready",
                "host": "127.0.0.1",
                "port": api_port,
                "forwardPort": forward_listener_port,
                "pid": os.getpid(),
                "started_at": ORIGINAL._now(),
                "contract_version": "1.6",
                "case_path": str(layout["case"]),
                "case_id": ORIGINAL.EXPECTED_CASE_ID,
                "sourceRoot": str(root / SCOPE_SOURCE_NAME),
                "scopeSourceFiles": scope_before,
                "ownership": ownership.evidence(),
                "sourcePins": {
                    "canonical": {
                        "bytes": CANONICAL_BYTES,
                        "sha256": CANONICAL_SHA256,
                    },
                    "policy": {"bytes": POLICY_BYTES, "sha256": POLICY_SHA256},
                },
            },
        )
        guard.phase = "serving"
        deadline = asyncio.get_running_loop().time() + seconds
        while asyncio.get_running_loop().time() < deadline:
            if (root / "stop.request").is_file():
                break
            if api_task.done():
                await api_task
                raise ORIGINAL.Deny("api_server_exited_early")
            if forward_task.done():
                await forward_task
                raise ORIGINAL.Deny("forward_server_exited_early")
            remaining = deadline - asyncio.get_running_loop().time()
            await asyncio.sleep(min(0.25, max(0.0, remaining)))
    except asyncio.CancelledError:
        failure = "cancelled"
    except Exception as exc:
        failure = _failure_code(exc)
    finally:
        guard.phase = "shutdown"
        for server in (api_server, forward_server):
            if server is not None:
                server.should_exit = True
        for task in (api_task, forward_task):
            if task is None:
                continue
            try:
                await asyncio.wait_for(asyncio.shield(task), timeout=15)
            except asyncio.TimeoutError:
                failure = failure or "graceful_shutdown_timeout"
            except Exception:
                failure = failure or "server_shutdown_exception"
        if firewall is not None:
            try:
                task_store = _task_store_observation(
                    lb, layout["case"], firewall.adapter_evidence()
                )
            except Exception as exc:
                failure = failure or _failure_code(exc)
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
        try:
            transport.close()
            transport_closed = transport.evidence()["closeCalls"] > 0
        except Exception:
            transport_closed = False
        if restore is not None:
            restore()

    source_case_unchanged = False
    target_logs_unchanged = False
    fixture_unchanged = False
    scope_unchanged = False
    target_inventory_after: dict[str, tuple[int, str]] = {}
    try:
        source_case_unchanged = ORIGINAL._row_map(
            ORIGINAL._tree_files(ORIGINAL.SOURCE_CASE_ROOT)
        ) == ORIGINAL._row_map(ORIGINAL._expected_rows())
        target_logs_unchanged = (
            ORIGINAL._target_log_identity(layout["case"]) == target_logs_before
        )
        fixture_unchanged = _fixture_state() == fixture_before
        scope_unchanged = _scope_files(root) == scope_before
        target_inventory_after = _inventory(layout["case"])
    except Exception as exc:
        failure = failure or _failure_code(exc)

    policy_state = firewall.adapter_evidence() if firewall is not None else {}
    if policy_state.get("adapterFailure"):
        failure = failure or str(policy_state["adapterFailure"])
    if not policy_state.get("nativeIndexBindingVerified"):
        failure = failure or "native_index_binding_missing"
    guard_state = guard.snapshot()
    if guard_state.get("violations") or any(credential_counts.values()):
        failure = failure or "guard_or_credential_violation"
    if not source_case_unchanged:
        failure = failure or "source_case_changed"
    if not target_logs_unchanged:
        failure = failure or "old_target_logs_changed"
    if not fixture_unchanged or not scope_unchanged:
        failure = failure or "scope_fixture_changed"
    api_done = bool(api_task is not None and api_task.done())
    forward_done = bool(forward_task is not None and forward_task.done())
    api_closed = ORIGINAL._closed(api_server)
    forward_closed = ORIGINAL._closed(forward_server)
    cleanup_proven = all(
        (
            api_done,
            forward_done,
            api_closed,
            forward_closed,
            net_closed,
            logs_closed,
            transport_closed,
            forward_lifecycle["startup_complete"],
            forward_lifecycle["shutdown_complete"],
        )
    )
    if not cleanup_proven:
        failure = failure or "cleanup_not_verified"

    final = {
        "outcome": "COMPLETED_FOR_ROOT_REVIEW" if failure is None else "FAILED_FOR_ROOT_REVIEW",
        "root": str(root),
        "startedAt": started_at,
        "finishedAt": ORIGINAL._now(),
        "requestedSeconds": seconds,
        "failureCode": failure,
        "caseId": ORIGINAL.EXPECTED_CASE_ID,
        "sourceCaseUnchanged": source_case_unchanged,
        "oldTargetLogsUnchanged": target_logs_unchanged,
        "fixtureSourcesUnchanged": fixture_unchanged,
        "scopeCopiesUnchanged": scope_unchanged,
        "scopeSourceRoot": str(root / SCOPE_SOURCE_NAME),
        "sourcePins": {
            "canonical": {"bytes": CANONICAL_BYTES, "sha256": CANONICAL_SHA256},
            "policy": {"bytes": POLICY_BYTES, "sha256": POLICY_SHA256},
            "fixtures": scope_before,
        },
        "targetInventoryBefore": target_inventory_before,
        "targetInventoryAfter": target_inventory_after,
        "targetInventoryMayChangeThroughNativeProduct": True,
        "taskStore": task_store,
        "scopeEvidence": policy_state,
        "modelBoundary": transport.evidence(),
        "actualModelUpstreamPosts": 0,
        "credentials": dict(credential_counts),
        "credentialsDisabled": True,
        "guard": guard_state,
        "servers": {
            "api": {"host": "127.0.0.1", "port": api_port, "lifespan": "off"},
            "forward": {
                "host": "127.0.0.1",
                "port": forward_listener_port,
                "lifespan": "on",
            },
            "pid": os.getpid(),
            "ownership": ownership.evidence(),
        },
        "forwardLifespanObserved": dict(forward_lifecycle),
        "cleanup": {
            "apiServerTaskDone": api_done,
            "forwardServerTaskDone": forward_done,
            "apiListenerClosed": api_closed,
            "forwardListenerClosed": forward_closed,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "transportCloseObserved": transport_closed,
            "forwardStartupCompleteObserved": forward_lifecycle["startup_complete"],
            "forwardShutdownCompleteObserved": forward_lifecycle["shutdown_complete"],
            "forcedPythonFinally": False,
            "rootRetained": True,
        },
        "ocrStarted": False,
        "retainerStarted": False,
        "notAcceptance": (
            "Source/service evidence only. Root must independently review the "
            "native import, two-of-three selection, task/session scope, JSONL, "
            "OS/Windows behavior, model refusal, full packet, and whole T31."
        ),
    }
    ORIGINAL._write_json(root / "final-metadata.json", final)
    return str(root / "final-metadata.json"), failure or ""


def _serve_checked(raw_root: str, seconds: int) -> tuple[pathlib.Path, str, str]:
    _require_planned_root()
    root = ORIGINAL._validate_root(raw_root)
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    final_path = failure = ""
    try:
        final_path, failure = loop.run_until_complete(_serve(root, seconds))
    except BaseException as exc:
        failure = _failure_code(exc)
        try:
            ORIGINAL._write_json(
                root / "run-error.json",
                {
                    "outcome": "FAILED_FOR_ROOT_REVIEW",
                    "exceptionType": type(exc).__name__,
                    "guardCode": getattr(exc, "code", None),
                    "rootRetained": True,
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
    try:
        ORIGINAL._write_json(
            root / "loop-closed.json",
            {
                "closedAt": ORIGINAL._now(),
                "eventLoopClosed": True,
                "finalMetadataWritten": bool(
                    final_path and pathlib.Path(final_path).is_file()
                ),
            },
        )
    except BaseException:
        failure = failure or "loop_close_evidence_failed"
    return root, failure, final_path


def main() -> int:
    parser = argparse.ArgumentParser(description="T31 direct GUI scope service")
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--admit", action="store_true")
    mode.add_argument("--serve", action="store_true")
    parser.add_argument("--root", required=True)
    parser.add_argument("--seconds", type=int, default=600)
    args = parser.parse_args()
    try:
        _require_planned_root()
    except BaseException as exc:
        print(f"entry refused: {_failure_code(exc)}", file=sys.stderr)
        return 2
    if args.admit:
        try:
            report = _copy_scope_sources(args.root)
        except BaseException as exc:
            print(f"admit refused: {_failure_code(exc)}", file=sys.stderr)
            return 2
        print(report)
        return 0
    if not 1 <= args.seconds <= MAX_SECONDS:
        parser.error(f"--seconds must be 1..{MAX_SECONDS}")
    try:
        _, failure, final_path = _serve_checked(args.root, args.seconds)
    except BaseException as exc:
        print(f"serve refused: {_failure_code(exc)}", file=sys.stderr)
        return 2
    if final_path:
        print(final_path)
    if failure:
        print(f"serve failed: {failure}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
