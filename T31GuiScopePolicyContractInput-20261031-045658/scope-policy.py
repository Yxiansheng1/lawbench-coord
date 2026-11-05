"""Source-only T31 GUI material-scope ASGI policy."""

from __future__ import annotations

import contextvars
import math
import os
import pathlib
import re
import uuid
from typing import Any
from urllib.parse import parse_qs


_CALL = contextvars.ContextVar("lawbench_scope_policy", default=None)
_SHA = re.compile(r"[0-9a-f]{64}\Z")
_IMPORT = {"case_id", "paths", "target", "unzip", "mode"}
_PREPARE = {"action", "case_id", "session_id", "request_id", "material_ids"}
_RELEASE = {"action", "case_id", "session_id", "request_id"}
_BEGIN = {"session_id", "cwd", "request_id"}
_BODIES = {
    "context": {"task_id"},
    "progress": {"task_id", "text", "model_calls", "tool_calls"},
    "task_end": {"task_id", "reason", "model_calls", "tool_calls", "elapsed_s"},
}


def _path(value):
    return (os.path.normcase(os.path.abspath(os.path.normpath(value)))
            if isinstance(value, str) and value and "\x00" not in value else None)


def _uuid4(value):
    if not isinstance(value, str):
        return False
    try:
        parsed = uuid.UUID(value)
    except (ValueError, AttributeError):
        return False
    return (parsed.version == 4 and parsed.variant == uuid.RFC_4122
            and str(parsed).lower() == value.lower())


def _session(value):
    return isinstance(value, str) and value.startswith("session-") and _uuid4(value[8:])


def _query(query, key):
    try:
        values = parse_qs(query.decode("ascii"), keep_blank_values=True, strict_parsing=True)
    except (UnicodeDecodeError, ValueError):
        return None
    found = values.get(key)
    return found[0] if list(values) == [key] and found is not None and len(found) == 1 else None


def _ok(status, response):
    return status == 200 and isinstance(response, dict) and response.get("ok") is True


def _count(value):
    return isinstance(value, int) and not isinstance(value, bool) and 0 <= value < 2**31


def _number(value):
    return (isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value) and value >= 0)


def _valid_body(route, data):
    if not isinstance(data, dict) or set(data) != _BODIES[route]:
        return False
    if route == "context":
        return True
    counts = _count(data.get("model_calls")) and _count(data.get("tool_calls"))
    if route == "progress":
        return counts and isinstance(data.get("text"), str)
    return counts and isinstance(data.get("reason"), str) and _number(data.get("elapsed_s"))


def make_scope_firewall(BaseFirewall: type, *, source_root, source_sha_by_name):
    root = pathlib.Path(source_root)
    pins = dict(source_sha_by_name)
    if not root.is_absolute() or len(pins) != 3:
        raise ValueError("absolute source_root and exactly three TXT pins are required")
    for name, digest in pins.items():
        if (not isinstance(name, str) or name != os.path.basename(name)
                or not name.lower().endswith(".txt") or not isinstance(digest, str)
                or not _SHA.fullmatch(digest)):
            raise ValueError("source names and lowercase SHA-256 pins are required")

    class ScopeFirewall(BaseFirewall):
        def __init__(self, app, *, root, case, case_id, host_token):
            super().__init__(app, root=root, case=case, case_id=case_id, host_token=host_token)
            self._root_key = _path(str(root)); self._bound = False
            self._materials = (); self._by_id = {}; self._observed = ()
            self._material_verified = False; self._import_calls = self._import_ok = 0
            self._scope = None; self._inflight = {}
            self._prepare_calls = self._prepare_ok = 0
            self._release_calls = self._release_ok = 0
            self._scope_verified = self._released = False
            self._begin_calls = self._begin_ok = 0; self._task = None
            self._task_scope_verified = False
            self._context_calls = self._context_ok = 0
            self._progress_calls = self._progress_ok = 0
            self._end_calls = self._end_ok = 0
            self._failures = []; self._violations = {}

        def bind_materials(self, rows):
            """Record three native index facts; never create IDs."""
            if not isinstance(rows, (list, tuple)) or len(rows) != 3:
                raise ValueError("exactly three native material rows are required")
            parsed, ids, names, hashes = [], set(), set(), set()
            for row in rows:
                if not isinstance(row, dict):
                    raise ValueError("native material rows must be mappings")
                material_id = row.get("material_id", row.get("id"))
                name, sha256 = row.get("name"), row.get("sha256")
                if not all(isinstance(item, str) and item for item in (material_id, name, sha256)):
                    raise ValueError("native material id, name and sha256 are required")
                if material_id in ids or name in names or sha256 in hashes:
                    raise ValueError("duplicate native material facts")
                if name not in pins or sha256 != pins[name]:
                    raise ValueError("native material facts do not match source pins")
                ids.add(material_id); names.add(name); hashes.add(sha256)
                parsed.append({"material_id": material_id, "name": name, "sha256": sha256})
            with self.lock:
                if self._bound:
                    raise RuntimeError("native materials were already bound")
                self._materials = tuple(sorted(parsed, key=lambda row: row["name"]))
                self._by_id = {row["material_id"]: row for row in self._materials}
                self._bound = True; self._check_observation()

        def _violation(self, code):
            self._violations[code] = self._violations.get(code, 0) + 1

        def _failure(self, route, status):
            if len(self._failures) < 128:
                self._failures.append(f"{route}:{status}")
            else:
                self._violation("NATIVE_FAILURE_EVIDENCE_LIMIT")

        def _policy(self, method, path, data, query):
            state = _CALL.get()
            if state is None:
                return super()._policy(method, path, data, query)
            if method == "POST" and path == "/api/materials/import":
                if query or not isinstance(data, dict) or set(data) != _IMPORT:
                    return "IMPORT_BODY_OR_QUERY"
                paths = data.get("paths")
                if (data.get("case_id") != self.case_id or not isinstance(paths, list)
                        or len(paths) != 1 or _path(paths[0]) != self._root_key
                        or data.get("target") is not None or data.get("unzip") is not False
                        or data.get("mode") != "ref"):
                    return "IMPORT_BODY"
                with self.lock:
                    if self._import_calls >= 2:
                        return "IMPORT_LIMIT"
                    self._import_calls += 1
                state["route"] = "materials_import"; return None
            if method == "POST" and path == "/api/request/scope":
                return self._scope_policy(data, query, state)
            if method == "POST" and path == "/core/task/begin":
                if query or not isinstance(data, dict) or set(data) != _BEGIN:
                    return "TASK_BEGIN_BODY_OR_QUERY"
                with self.lock:
                    if self._scope is None or self._released:
                        return "SCOPE_NOT_PREPARED"
                    if (data.get("session_id") != self._scope[1]
                            or data.get("request_id") != self._scope[2]
                            or _path(data.get("cwd")) != _path(str(self.case))):
                        return "TASK_BEGIN_SCOPE"
                    if self._begin_calls >= 2:
                        return "TASK_BEGIN_LIMIT"
                    self._begin_calls += 1; scope = self._scope
                state.update(route="task_begin", scope=scope); return None
            route = {"/core/context": "context", "/core/progress": "progress",
                     "/core/task/end": "task_end"}.get(path)
            if method == "POST" and route is not None:
                if query or not _valid_body(route, data):
                    return f"{route.upper()}_BODY_OR_QUERY"
                return self._bound_task_policy(data, state, route)
            if method == "POST" and path == "/core/tool":
                return "TOOL_DENIED_IN_SCOPE_SLICE"
            denial = super()._policy(method, path, data, query)
            if denial:
                return denial
            if method == "GET" and path == "/api/task/current":
                with self.lock:
                    known = self._scope[1] if self._scope else None
                if known is not None and _query(query, "session_id") != known:
                    return "TASK_CURRENT_SESSION"
            if method == "GET" and path == "/api/materials":
                state["route"] = "materials_list"
            return None

        def _scope_policy(self, data, query, state):
            if query or not isinstance(data, dict):
                return "SCOPE_BODY_OR_QUERY"
            action = data.get("action")
            if action == "prepare":
                ids = data.get("material_ids")
                if not (set(data) == _PREPARE and data.get("case_id") == self.case_id
                        and _session(data.get("session_id")) and _uuid4(data.get("request_id"))
                        and isinstance(ids, list) and len(ids) == 2
                        and all(isinstance(item, str) and item for item in ids) and len(set(ids)) == 2):
                    return "SCOPE_PREPARE_BODY"
                scope = (self.case_id, data["session_id"], data["request_id"], tuple(ids))
                token = object()
                with self.lock:
                    if not self._bound:
                        return "MATERIALS_NOT_BOUND"
                    if not set(scope[3]).issubset(self._by_id):
                        return "SCOPE_MATERIAL_UNKNOWN"
                    if self._scope is not None and self._scope != scope:
                        return "SCOPE_CONFLICT"
                    if any(value != scope for value in self._inflight.values()):
                        return "SCOPE_CONCURRENT_CONFLICT"
                    if self._prepare_calls >= 2:
                        return "SCOPE_PREPARE_LIMIT"
                    self._prepare_calls += 1; self._inflight[token] = scope
                state.update(route="scope_prepare", scope=scope, token=token); return None
            if action == "release":
                if not (set(data) == _RELEASE and data.get("case_id") == self.case_id
                        and _session(data.get("session_id")) and _uuid4(data.get("request_id"))):
                    return "SCOPE_RELEASE_BODY"
                with self.lock:
                    wanted = (self.case_id, data["session_id"], data["request_id"])
                    if self._scope is None or self._scope[:3] != wanted:
                        return "SCOPE_RELEASE_MISMATCH"
                    if self._release_calls >= 2:
                        return "SCOPE_RELEASE_LIMIT"
                    self._release_calls += 1; scope = self._scope
                state.update(route="scope_release", scope=scope); return None
            return "SCOPE_ACTION"

        def _bound_task_policy(self, data, state, route):
            with self.lock:
                if self._task is None or data.get("task_id") != self._task[0]:
                    return "TASK_NOT_BOUND"
                attr = {"context": "_context_calls", "progress": "_progress_calls",
                        "task_end": "_end_calls"}[route]
                if getattr(self, attr) >= 8:
                    return f"{route.upper()}_LIMIT"
                setattr(self, attr, getattr(self, attr) + 1)
            state["route"] = route; return None

        def _scope_response(self, status, response, scope, action):
            if not _ok(status, response) or set(response) != {"ok", "value"}:
                return False
            value = response["value"]; keys = _PREPARE if action == "prepare" else _RELEASE
            if not isinstance(value, dict) or set(value) != keys:
                return False
            if (value.get("action") != action or value.get("case_id") != scope[0]
                    or value.get("session_id") != scope[1] or value.get("request_id") != scope[2]):
                return False
            return action == "release" or value.get("material_ids") == list(scope[3])

        def _find_scope(self, value, depth=0):
            if depth > 3:
                return None
            if isinstance(value, dict):
                if isinstance(value.get("request_scope"), dict):
                    return value["request_scope"]
                children = list(value.values())
            elif isinstance(value, list):
                children = value[:16]
            else:
                return None
            for child in children:
                found = self._find_scope(child, depth + 1)
                if found is not None:
                    return found
            return None

        def _task_scope(self, response, scope):
            found = self._find_scope(response) if isinstance(response, dict) else None
            if not isinstance(found, dict) or (found.get("case_id") != scope[0]
                    or found.get("request_id") != scope[2] or found.get("kind") != "materials"
                    or found.get("session_id", scope[1]) != scope[1]):
                return False
            rows = found.get("materials")
            if isinstance(rows, dict):
                rows = [{"material_id": key, "sha256": value} for key, value in rows.items()]
            if not isinstance(rows, list) or len(rows) != 2:
                return False
            ids = []
            for row in rows:
                material_id = row.get("material_id", row.get("id")) if isinstance(row, dict) else None
                if (not isinstance(material_id, str) or material_id not in self._by_id
                        or row.get("sha256") != self._by_id[material_id]["sha256"]):
                    return False
                ids.append(material_id)
            return len(set(ids)) == 2 and tuple(ids) == scope[3]

        @staticmethod
        def _task_id(response):
            value = response.get("value") if isinstance(response, dict) else None
            candidate = value.get("task_id") if isinstance(value, dict) else None
            if candidate is None and isinstance(value, dict) and isinstance(value.get("task"), dict):
                candidate = value["task"].get("task_id")
            return candidate if isinstance(candidate, str) and 0 < len(candidate) <= 128 else None

        def _collect(self, value, rows, depth=0):
            if depth > 4 or len(rows) >= 128:
                return
            if isinstance(value, dict):
                for key, child in value.items():
                    if key == "materials" and isinstance(child, list):
                        for row in child[:128]:
                            if len(rows) >= 128 or not isinstance(row, dict):
                                break
                            material_id = row.get("material_id", row.get("id"))
                            name, sha256 = row.get("name"), row.get("sha256")
                            if all(isinstance(item, str) and item for item in (material_id, name, sha256)):
                                item = {"material_id": material_id, "name": name, "sha256": sha256}
                                if item not in rows:
                                    rows.append(item)
                    else:
                        self._collect(child, rows, depth + 1)
            elif isinstance(value, list):
                for child in value[:32]:
                    self._collect(child, rows, depth + 1)

        def _check_observation(self):
            actual = {(r["material_id"], r["name"], r["sha256"]) for r in self._observed}
            expected = {(r["material_id"], r["name"], r["sha256"]) for r in self._materials}
            self._material_verified = self._bound and actual == expected

        def _complete(self, method, path, status, response):
            state = _CALL.get(); route = state.get("route") if state else None
            if route in {"scope_prepare", "scope_release", "task_begin", "context", "progress", "task_end"}:
                if not _ok(status, response):
                    with self.lock:
                        self._failure(route, status)
                if route == "scope_prepare":
                    self._complete_prepare(state, status, response)
                elif route == "scope_release":
                    self._complete_release(state, status, response)
                elif route == "task_begin":
                    self._complete_begin(state, status, response)
                elif route == "context":
                    self._complete_context(status, response)
                elif route == "progress" and _ok(status, response):
                    with self.lock:
                        self._progress_ok += 1
                elif route == "task_end" and _ok(status, response):
                    with self.lock:
                        self._end_ok += 1
            elif route in {"materials_import", "materials_list"}:
                rows = []
                if _ok(status, response):
                    self._collect(response, rows)
                    with self.lock:
                        if route == "materials_import":
                            self._import_ok += 1
                        if rows:
                            self._observed = tuple(rows); self._check_observation()
                else:
                    with self.lock:
                        self._failure(route, status)
            super()._complete(method, path, status, response)

        def _complete_prepare(self, state, status, response):
            scope = state.get("scope")
            matched = isinstance(scope, tuple) and self._scope_response(status, response, scope, "prepare")
            with self.lock:
                if matched:
                    if self._scope is None:
                        self._scope = scope
                    if self._scope == scope:
                        self._prepare_ok += 1; self._scope_verified = state["confirmed"] = True
                    else:
                        self._violation("SCOPE_NATIVE_TUPLE_MISMATCH")
                else:
                    self._violation("SCOPE_PREPARE_RESPONSE")

        def _complete_release(self, state, status, response):
            scope = state.get("scope")
            matched = isinstance(scope, tuple) and self._scope_response(status, response, scope, "release")
            with self.lock:
                if matched and scope == self._scope:
                    self._release_ok += 1; self._released = state["confirmed"] = True
                else:
                    self._violation("SCOPE_RELEASE_RESPONSE")

        def _complete_begin(self, state, status, response):
            task_id = self._task_id(response) if _ok(status, response) else None
            scope = state.get("scope")
            if not isinstance(task_id, str) or not isinstance(scope, tuple):
                with self.lock:
                    self._violation("TASK_BEGIN_RESPONSE")
                return
            with self.lock:
                task = (task_id, scope[0], scope[2])
                if self._task is None:
                    self._task = task
                if self._task != task:
                    self._violation("TASK_BEGIN_TUPLE_MISMATCH"); return
                self._begin_ok += 1
                if not self._task_scope(response, scope):
                    self._violation("TASK_BEGIN_SCOPE_RESPONSE"); return
                self._task_scope_verified = state["confirmed"] = True

        def _complete_context(self, status, response):
            with self.lock:
                if not _ok(status, response):
                    return
                self._context_ok += 1
                if self._scope is None or not self._task_scope(response, self._scope):
                    self._violation("CONTEXT_SCOPE_RESPONSE")
                else:
                    self._task_scope_verified = True

        async def __call__(self, scope, receive, send):
            state = {}; token = _CALL.set(state)
            try:
                await super().__call__(scope, receive, send)
            except Exception:
                route = state.get("route", "unknown")
                with self.lock:
                    self._violation("REQUEST_EXCEPTION")
                    self._failure(route, None)
                raise
            finally:
                pending = state.get("token")
                if pending is not None:
                    with self.lock:
                        self._inflight.pop(pending, None)
                _CALL.reset(token)

        def evidence(self):
            base = super().evidence()
            with self.lock:
                denied = dict(base.get("policy_denials", {})); scope = self._scope
                return {
                    **base, "source_only": True, "runtime_allowed": False,
                    "import_attempts": self._import_calls, "import_successes": self._import_ok,
                    "materials_bound": self._bound, "materials": list(self._materials),
                    "material_response_verified": self._material_verified,
                    "observed_materials": list(self._observed[:128]),
                    "scope_tuple": ({"case_id": scope[0], "session_id": scope[1],
                                     "request_id": scope[2], "material_ids": list(scope[3])} if scope else None),
                    "scope_selection": {"count": len(scope[3]) if scope else 0,
                                        "known_out_of": 3 if self._bound else 0},
                    "scope_prepare_attempts": self._prepare_calls,
                    "scope_prepare_successes": self._prepare_ok,
                    "scope_release_attempts": self._release_calls,
                    "scope_release_successes": self._release_ok,
                    "scope_released": self._released,
                    "scope_nativeResponseVerified": self._scope_verified,
                    "task": ({"task_id": self._task[0], "case_id": self._task[1],
                              "request_id": self._task[2]} if self._task else None),
                    "task_begin_attempts": self._begin_calls, "task_begin_successes": self._begin_ok,
                    "task_nativeScopeResponseVerified": self._task_scope_verified,
                    "context_attempts": self._context_calls, "context_successes": self._context_ok,
                    "progress_attempts": self._progress_calls, "progress_successes": self._progress_ok,
                    "task_end_attempts": self._end_calls, "task_end_successes": self._end_ok,
                    "denied_counts": {"auth": base.get("auth_denials", 0),
                                      "policy": sum(denied.values()),
                                      "by_code": dict(sorted(denied.items()))},
                    "violations": dict(sorted(self._violations.items())),
                    "native_failures": list(self._failures),
                    "allowed_write_faces": ["/api/materials/import", "/api/request/scope",
                        "/core/task/begin", "/core/context", "/core/progress", "/core/task/end"],
                    "raw_request_body_persisted": False,
                }

    ScopeFirewall.__name__ = ScopeFirewall.__qualname__ = "GuiScopeFirewall"
    return ScopeFirewall
