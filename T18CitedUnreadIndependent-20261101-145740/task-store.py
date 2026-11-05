"""任务单、读取记录、结果清单（Spec 4.1、9.2、20.3、20.8；契约 files/task、files/reads、files/result、
api/task_create、api/tasks_list、core/task_begin、core/progress、core/task_end）。

目录：<案件>/工作区/任务/<task_id>/ 下 task.json、reads.json、result.json、草稿/。
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import pathlib
import re
import secrets
import threading
import time
from datetime import datetime

from .. import contracts, logs
from ..errors import ApiError
from . import gate, texts
from .registry import CaseRegistry
from .request_scope import STORE_FILE, RequestScopeStore

TASK_DIR = "工作区/任务"
DEFAULT_BUDGET = {"model_calls": 32, "tool_calls": 48, "minutes": 45}  # Spec 9.2（F-RUN-05；2026-10-04 由 8/24 调为 16/24，2026-10-11 用户定 32/48）
END_STATUS = {  # core/task_end 的 reason → result.json 的 status
    "completed": "completed", "aborted": "cancelled", "interrupted": "interrupted",
    "max-tokens": "output_limit", "budget": "budget_stopped", "error": "failed", "blocked": "failed",
}
IN_PROGRESS = "进行中.md"
OUTPUTS_REL = "成果/索引.json"
_VERSIONED = re.compile(r"^(?P<title>.+)-v(?P<n>\d+)\.(md|docx)$")


def now_iso() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def new_task_id(kind: str = "T") -> str:
    return f"{kind}-{datetime.now().strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(2)}"


def sha256_file(path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


class TaskStore:
    def __init__(self, cases: CaseRegistry, settings, materials, *, request_scopes=None):
        self.cases = cases
        self.settings = settings
        self.materials = materials
        settings_path = getattr(settings, "path", None)
        case_registry_path = getattr(cases, "path", None)
        settings_path = pathlib.Path(settings_path) if settings_path is not None else None
        case_registry_path = (
            pathlib.Path(case_registry_path) if case_registry_path is not None else None
        )
        appdata = (
            settings_path.parent
            if settings_path is not None
            else (case_registry_path.parent if case_registry_path is not None else None)
        )
        self.scopes = request_scopes or RequestScopeStore(
            cases, materials, appdata / STORE_FILE if appdata is not None else None
        )
        self._lock = threading.Lock()      # 建单、取单（begin）、作废、add_read
        self._where: dict[str, str] = {}  # task_id → case_id
        # 本进程 begin 过的任务 → begin 的时刻（P1-2：重开案件时不把它们当成上次硬退出留下的；P3-3：用时从这里算）
        self._begun: dict[str, datetime] = {}
        self._task_locks: dict[str, threading.Lock] = {}
        self._guard = threading.Lock()
        # 分段读的进度（N31）：(任务, 材料, 版本, 单元号) → 从 0 起连续读到了第几个字
        self._parts: dict[tuple, int] = {}
        # 每个会话最新写入的选择（F5：同一秒内建两张时以后写的为准）
        self._latest: dict[str, str] = {}

    def task_lock(self, task_id: str) -> threading.Lock:
        """按任务的锁：result.json、草稿版本号的读-改-写都在这把锁里（P1-3、P2-2）。"""
        with self._guard:
            return self._task_locks.setdefault(task_id, threading.Lock())

    # ---------- 路径与读写 ----------

    @staticmethod
    def rel(task_id: str, name: str = "") -> str:
        if not re.fullmatch(r"[TP]-\d{14}-[0-9a-f]{4}", task_id):
            raise ApiError("TASK_NOT_FOUND", "bad_task_id")
        return f"{TASK_DIR}/{task_id}" + (f"/{name}" if name else "")

    def _write(self, root: str, rel: str, data: dict, schema: str) -> None:
        contracts.validate(schema, "", data)
        gate.write_bytes(root, rel, json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"), op="task")

    @staticmethod
    def _read(root: str, rel: str, schema: str) -> dict:
        p = gate.resolve_internal(root, rel, op="task")
        data = contracts.read_json(p)
        if schema == "files/task.schema.json" and isinstance(data, dict):
            data.setdefault("route", "local")  # T38：旧任务单缺字段按本地，内存兼容
        contracts.validate(schema, "", data)
        return data

    def request_scope(self, request: dict) -> dict:
        """POST /api/request/scope：prepare/release 的持久映射入口。"""
        return self.scopes.handle(request)

    def task_scope(self, task: dict) -> dict | None:
        """返回经持久记录核验的任务范围；任务副本不能单独作为权限来源。"""
        return self.scopes.task_scope(task)

    def index_for_task(self, task: dict) -> dict:
        """按持久 R 固定的材料快照裁剪索引；任务副本缺坏时失败关闭。"""
        scope = self.task_scope(task)
        index = self.materials.index(task["case_id"])
        if scope is None:
            return index

        by_id = {m["material_id"]: m for m in index["materials"]}
        scoped: list[dict] = []
        for expected in scope["materials"]:
            material = by_id.get(expected["material_id"])
            if (
                material is None
                or material["status"] in ("source_deleted", "missing", "removed")
                or material.get("sha256") != expected["sha256"]
            ):
                raise ApiError("INPUT_CHANGED", "task_scope_version_changed")
            scoped.append(material)
        return {**index, "materials": scoped}

    def locate(self, task_id: str) -> tuple[str, str, dict]:
        """task_id → (case_id, root, task.json)。"""
        rel = self.rel(task_id, "task.json")
        cid = self._where.get(task_id)
        candidates = [cid] if cid else [c["case_id"] for c in self.cases.recent()]
        for case_id in candidates:
            try:
                root = self.cases.root_of(case_id)
            except ApiError:
                continue
            if gate.resolve_internal(root, rel, op="task").is_file():
                self._where[task_id] = case_id
                return case_id, root, self._read(root, rel, "files/task.schema.json")
        raise ApiError("TASK_NOT_FOUND", "task_not_found")

    # ---------- 参数与输入 ----------

    def default_params(self, skill: str | None) -> dict:
        """优先级：Skill 个人预设 > 全局默认（F-PARAM-03；任务单里律师选的参数在 /api/task 直接给出）。"""
        s = self.settings.get()
        p = copy.deepcopy(s["defaults"])
        if skill and skill in s["skill_presets"]:
            p.update(copy.deepcopy(s["skill_presets"][skill]))
        return p

    def input_refs(self, root: str, paths: list[str]) -> list[dict]:
        """界面选用的前序成果：只能是本案 工作区/任务/<任务>/草稿/ 或 成果/ 下的 md 文件。"""
        refs = []
        for i, rel in enumerate(paths, 1):
            parts = rel.split("/")
            ok = (len(parts) == 2 and parts[0] == "成果") or (
                len(parts) == 5 and parts[:2] == ["工作区", "任务"] and parts[3] == "草稿")
            if not ok or not rel.endswith(".md"):
                raise ApiError("INVALID_ARGUMENT", "input_not_output")
            p = gate.resolve_internal(root, rel, op="task_input")
            if not p.is_file():
                raise ApiError("INVALID_ARGUMENT", "input_missing")
            m = _VERSIONED.match(p.name)
            refs.append({"index": i, "title": m.group("title") if m else p.stem, "path": rel,
                         "version": int(m.group("n")) if m else None, "sha256": sha256_file(p)})
        return refs

    def read_input(self, root: str, ref: dict) -> str:
        """读选用的输入；选用后被改过（sha256 不一致）报 INPUT_CHANGED。路径来自界面、已在写任务单时校验过。"""
        p = gate.resolve_internal(root, ref["path"], op="task_input")
        if not p.is_file() or sha256_file(p) != ref["sha256"]:
            raise ApiError("INPUT_CHANGED", "input_changed")
        return p.read_text(encoding="utf-8")

    # ---------- /api/task、/api/tasks ----------

    def create(self, d: dict) -> dict:
        root = self.cases.root_of(d["case_id"])
        task_id = new_task_id("T")
        task = {"v": 1, "task_id": task_id, "case_id": d["case_id"], "kind": "agent", "session_id": d["session_id"],
                "entry": d["entry"], "skill": d["skill"], "route": d.get("route", "local"), "step": None,
                "inputs": self.input_refs(root, d["inputs"]), "params": d["params"],
                "budget": copy.deepcopy(DEFAULT_BUDGET), "state": "pending", "created_at": now_iso()}
        with self._lock:
            self._void_pending(root, d["case_id"], d["session_id"])
            self._write(root, self.rel(task_id, "task.json"), task, "files/task.schema.json")
            self._where[task_id] = d["case_id"]
            self._latest[d["session_id"]] = task_id
        logs.event("task", "create", case_id=d["case_id"])
        return {"task_id": task_id}

    def outputs(self, case_id: str) -> dict:
        """GET /api/outputs（契约 1.2，N35⑥）：成果/索引.json 的内容；还没有成果时是空列表。"""
        root = self.cases.root_of(case_id)
        p = gate.resolve_internal(root, OUTPUTS_REL, op="outputs")
        if not p.is_file():
            return {"v": 1, "outputs": []}
        data = contracts.read_json(p)
        contracts.validate("files/outputs_index.schema.json", "", data)
        return data

    def current(self, session_id: str) -> dict:
        """GET /api/task/current（契约 1.2）：该会话当前的选择。会话属于哪个案件请求里没有，按最近打开的案件找。"""
        with self._lock:
            best = None
            for c in self.cases.recent():
                try:
                    root = self.cases.root_of(c["case_id"])
                    t = self._pending_for(root, session_id)
                except ApiError:
                    continue
                if t is not None and (best is None or t["created_at"] > best["created_at"]):
                    best = t
        if best is None:
            return {"selection": None}
        return {"selection": {"task_id": best["task_id"], "entry": best["entry"], "skill": best["skill"],
                              "inputs": [r["path"] for r in best["inputs"]], "params": best["params"],
                              "route": best.get("route", "local"), "updated_at": best["created_at"]}}

    def list(self, case_id: str) -> dict:
        root = self.cases.root_of(case_id)
        base = gate.resolve_internal(root, TASK_DIR, op="task")
        out = []
        if base.is_dir():
            for d in sorted(base.iterdir(), key=lambda p: p.name, reverse=True):
                self._close_stale(root, case_id, d.name)
                try:
                    task = self._read(root, self.rel(d.name, "task.json"), "files/task.schema.json")
                    res = self._read(root, self.rel(d.name, "result.json"), "files/result.schema.json")
                except (ApiError, FileNotFoundError, contracts.ContractError, ValueError):
                    continue  # 还没开始执行的任务单（没有 result.json）或损坏的记录不列出
                cc = res["citation_check"]
                out.append({"task_id": task["task_id"], "skill": task["skill"], "status": res["status"],
                            "drafts": res["drafts"], "citation_passed": cc["passed"] if cc else None,
                            "finished_at": res["finished_at"], "coverage": res["coverage"],
                            "citation_check": cc})
        return {"tasks": out}

    def _void_pending(self, root: str, case_id: str, session_id: str) -> None:
        """同一会话里更早的待执行任务单一律作废（执行令 0608，P2-7；调用方持 self._lock）。

        契约没有"已作废"状态，不改契约：把那张还没执行过的任务单目录删掉。删之前核对它确实是待执行、属于同一会话、
        目录里只有 task.json（没有草稿、读取记录、结果清单）；不满足就不删，记一条日志（只记任务编号和原因代号）。
        被删的不会留下 result.json，也就不会出现在 /api/tasks 里（注记 0805）。"""
        base = gate.resolve_internal(root, TASK_DIR, op="task")
        if not base.is_dir():
            return
        for d in base.iterdir():
            try:
                t = self._read(root, self.rel(d.name, "task.json"), "files/task.schema.json")
            except (ApiError, FileNotFoundError, contracts.ContractError, ValueError):
                continue
            if t["state"] != "pending" or t["session_id"] != session_id or t["kind"] != "agent":
                continue
            tid = t["task_id"]
            folder = gate.resolve_internal(root, self.rel(tid), op="task_void")
            if sorted(p.name for p in folder.iterdir()) != ["task.json"]:
                logs.event("task", "void", status="denied", case_id=case_id, error=f"NOT_EMPTY:{tid}")
                continue
            gate.delete_work_file(root, self.rel(tid, "task.json"), op="task_void")
            try:
                os.rmdir(folder)  # 空目录；闸门已核对它在 工作区/任务/ 下、不是链接
            except OSError as e:
                logs.event("task", "void", status="fail", case_id=case_id, error=f"{type(e).__name__}:{tid}")
            self._where.pop(tid, None)
            logs.event("task", "void", case_id=case_id)

    # ---------- /core/task/begin ----------

    def begin(self, session_id: str, cwd: str, request_id: str | None = None) -> dict:
        case_id, root = self.cases.find_by_root(cwd)
        with self._lock:
            if request_id is not None:
                def prepare_task(task_id: str, scope: dict | None) -> None:
                    self._prepare_claimed_task(
                        root, case_id, session_id, task_id, request_id, scope
                    )

                def activate_task(task_id: str, scope: dict | None) -> dict:
                    return self._activate_claimed_task(
                        root, case_id, session_id, task_id, request_id, scope
                    )

                task = self.scopes.claim_or_replay(
                    request_id, case_id, session_id, lambda: self._fresh_task_id(root),
                    prepare_task, activate_task,
                )
                tid = task["task_id"]
            else:
                tid = new_task_id("T")
                task = self._task_for_begin(
                    root, case_id, session_id, tid, None, None, state="running"
                )
                self._begun[tid] = datetime.now().astimezone()
                try:
                    self._write_begin_files(root, session_id, task, None)
                except BaseException:
                    self._begun.pop(tid, None)
                    raise
            self._where[tid] = case_id
        logs.event("task", "begin", case_id=case_id)
        return self._begin_value(task, request_id)

    def _fresh_task_id(self, root: str) -> str:
        for _ in range(100):
            task_id = new_task_id("T")
            target = gate.resolve_internal(root, self.rel(task_id), op="task")
            if not target.exists():
                return task_id
        raise ApiError("INTERNAL", "task_id_collision")

    def _task_for_begin(
        self,
        root: str,
        case_id: str,
        session_id: str,
        task_id: str,
        request_id: str | None,
        scope: dict | None,
        *,
        state: str,
    ) -> dict:
        """从会话当前选择复制任务，不消耗选择；范围只能由本次 R 注入。"""
        sel = self._pending_for(root, session_id)
        if sel is not None:
            task = copy.deepcopy(sel)
            task.pop("request_id", None)
            task.pop("request_scope", None)
            task.update(task_id=task_id, created_at=now_iso())
        else:
            task = {
                "v": 1,
                "task_id": task_id,
                "case_id": case_id,
                "kind": "agent",
                "session_id": session_id,
                "entry": None,
                "skill": None,
                "route": "local",
                "step": None,
                "inputs": [],
                "params": self.default_params(None),
                "budget": copy.deepcopy(DEFAULT_BUDGET),
                "created_at": now_iso(),
            }
        task["state"] = state
        if request_id is not None:
            task["request_id"] = request_id
            task["request_scope"] = copy.deepcopy(scope)
        return task

    def _begin_result(self, task_id: str) -> dict:
        return {
            "v": 1,
            "task_id": task_id,
            "status": "running",
            "usage": {"model_calls": 0, "tool_calls": 0, "elapsed_s": 0},
            "drafts": [],
            "citation_check": None,
            "coverage": None,
            "citations": [],
            "finished_at": None,
        }

    def _write_begin_files(
        self,
        root: str,
        session_id: str,
        task: dict,
        scope: dict | None,
    ) -> None:
        carried = self._carry_reads(root, session_id, scope)
        self._write(root, self.rel(task["task_id"], "task.json"), task, "files/task.schema.json")
        self._write(
            root, self.rel(task["task_id"], "result.json"),
            self._begin_result(task["task_id"]), "files/result.schema.json",
        )
        self._write(
            root, self.rel(task["task_id"], "reads.json"),
            {"v": 1, "task_id": task["task_id"], "reads": carried},
            "files/reads.schema.json",
        )

    def _prepare_claimed_task(
        self,
        root: str,
        case_id: str,
        session_id: str,
        task_id: str,
        request_id: str,
        scope: dict | None,
    ) -> None:
        """claiming 阶段可重复执行；只替换尚未执行过的 pending 任务记录。"""
        task = self._task_for_begin(
            root, case_id, session_id, task_id, request_id, scope, state="pending"
        )
        task_path = gate.resolve_internal(root, self.rel(task_id, "task.json"), op="task")
        if task_path.is_file():
            existing = self._read(root, self.rel(task_id, "task.json"), "files/task.schema.json")
            if (
                existing["state"] != "pending"
                or existing.get("request_id") != request_id
                or existing.get("request_scope") != scope
                or existing["session_id"] != session_id
                or existing["case_id"] != case_id
            ):
                raise ApiError("INTERNAL", "request_scope_task_conflict")
            task = existing
        self._write_begin_files(root, session_id, task, scope)

    def _activate_claimed_task(
        self,
        root: str,
        case_id: str,
        session_id: str,
        task_id: str,
        request_id: str,
        scope: dict | None,
    ) -> dict:
        """pending→running 是 R 认领的最后一步；重复调用只返回同一运行任务。"""
        task_rel = self.rel(task_id, "task.json")
        try:
            path = gate.resolve_internal(root, task_rel, op="task")
        except ApiError:
            raise ApiError("INTERNAL", "request_scope_task_missing") from None
        if not path.is_file():
            raise ApiError("INTERNAL", "request_scope_task_missing")
        task = self._read(root, task_rel, "files/task.schema.json")
        if (
            task["case_id"] != case_id
            or task["session_id"] != session_id
            or task.get("request_id") != request_id
            or task.get("request_scope") != scope
        ):
            raise ApiError("INTERNAL", "request_scope_task_conflict")
        if task["state"] == "running":
            self._begun.setdefault(task_id, datetime.now().astimezone())
            return task
        if task["state"] != "pending":
            raise ApiError(
                "TASK_NOT_FOUND", "request_scope_task_ended",
                detail="这次请求已经结束，不能重复开始；请重新发起提问",
            )

        # pending 阶段尚未交给 Agent；上次若只写完 R/部分文件，重写辅助文件后再激活。
        self._write(
            root, self.rel(task_id, "result.json"), self._begin_result(task_id),
            "files/result.schema.json",
        )
        carried = self._carry_reads(root, session_id, scope)
        self._write(
            root, self.rel(task_id, "reads.json"),
            {"v": 1, "task_id": task_id, "reads": carried},
            "files/reads.schema.json",
        )
        task["state"] = "running"
        self._begun[task_id] = datetime.now().astimezone()
        try:
            self._write(root, task_rel, task, "files/task.schema.json")
        except BaseException:
            self._begun.pop(task_id, None)
            raise
        return task

    @staticmethod
    def _begin_value(task: dict, request_id: str | None) -> dict:
        value = {
            "task_id": task["task_id"],
            "case_id": task["case_id"],
            "skill": task["skill"],
            "route": task.get("route", "local"),
            "params": task["params"],
            "budget": task["budget"],
        }
        if request_id is not None:
            value["request_id"] = request_id
            value["request_scope"] = copy.deepcopy(task.get("request_scope"))
        return value

    def _carry_reads(self, root: str, session_id: str, request_scope: dict | None = None) -> list[dict]:
        """预算到顶后"继续"（第九版待办 26）：律师在同一个对话里接着发，Agent 照常开一个新任务、给一份新预算，
        草稿版本号按标题接着往上加（next_draft_version）。这里补的是读取记录：同一对话里上一个结束的任务是到顶停下的，
        把它的读取记录带过来——那些原文还在这个对话的上下文里，新任务存稿时"没读全"要把它们算上。
        只看同一会话里最新的一个 Agent 任务（待执行的任务单不算）：它是已结束且到顶停下的才带；最新的是异常中断等别的状态，
        就不带，也不越过它去找更早的（复核 rv-B26 P3-3）。它本身带过来的也一并带上，所以连着继续几次是累计的。
        带 R 的任务再按本次固定材料编号和版本过滤，任何旧的全案读取都不会借预算续接进入新范围。"""
        base = gate.resolve_internal(root, TASK_DIR, op="task")
        last, last_key = None, None
        for d in (base.iterdir() if base.is_dir() else []):
            try:
                t = self._read(root, self.rel(d.name, "task.json"), "files/task.schema.json")
                st = d.stat()
            except (ApiError, OSError, contracts.ContractError, ValueError):
                continue
            # 建单时间只到秒；同一秒里的先后按任务目录的创建时间（Windows、macOS 都有）
            key = (t["created_at"], getattr(st, "st_birthtime_ns", None) or st.st_ctime_ns, t["task_id"])
            if t["session_id"] == session_id and t["kind"] == "agent" and t["state"] != "pending" and (
                    last_key is None or key > last_key):
                last, last_key = t, key
        if last is None or last["state"] != "finished":
            return []
        try:
            if self.result(root, last["task_id"])["status"] != "budget_stopped":
                return []
            reads = self._read(root, self.rel(last["task_id"], "reads.json"), "files/reads.schema.json")["reads"]
        except (ApiError, FileNotFoundError, contracts.ContractError, ValueError):
            return []
        if request_scope is None:
            return reads
        allowed = {m["material_id"]: m["sha256"] for m in request_scope["materials"]}
        return [
            r for r in reads
            if allowed.get(r["material_id"]) == r["material_version"]
        ]

    def _pending_for(self, root: str, session_id: str) -> dict | None:
        base = gate.resolve_internal(root, TASK_DIR, op="task")
        if not base.is_dir():
            return None
        best = None
        for d in base.iterdir():
            try:
                t = self._read(root, self.rel(d.name, "task.json"), "files/task.schema.json")
            except (ApiError, FileNotFoundError, contracts.ContractError, ValueError):
                continue
            if t["state"] == "pending" and t["session_id"] == session_id and t["kind"] == "agent":
                if best is None or t["created_at"] > best["created_at"] or (
                        t["created_at"] == best["created_at"] and t["task_id"] == self._latest.get(session_id)):
                    best = t  # 同一秒平局：以本进程最后写入的为准（F5）
        return best

    # ---------- 打开案件：上次硬退出的任务标 abnormal ----------

    def mark_abnormal(self, case_id: str) -> int:
        """上次硬退出留下的执行中任务标"异常中断"。整个过程拿 self._lock：和 begin 互斥（F1）。"""
        with self._lock:
            return self._mark_abnormal(case_id)

    def _mark_abnormal(self, case_id: str) -> int:
        root = self.cases.root_of(case_id)
        base = gate.resolve_internal(root, TASK_DIR, op="task")
        n = 0
        if not base.is_dir():
            return 0
        for d in base.iterdir():
            try:
                t = self._read(root, self.rel(d.name, "task.json"), "files/task.schema.json")
            except (ApiError, FileNotFoundError, contracts.ContractError, ValueError):
                continue
            if t["state"] != "running" or t["task_id"] in self._begun:
                continue  # 本进程 begin 过的正在执行，不是上次硬退出留下的（P1-2）
            t["state"] = "abnormal"
            self._write(root, self.rel(t["task_id"], "task.json"), t, "files/task.schema.json")
            try:
                res = self._read(root, self.rel(t["task_id"], "result.json"), "files/result.schema.json")
                res["status"] = "abnormal"
                self._write(root, self.rel(t["task_id"], "result.json"), res, "files/result.schema.json")
            except (ApiError, FileNotFoundError, contracts.ContractError, ValueError):
                pass
            n += 1
        return n

    # ---------- 读任务列表：没报结束、超过时间预算没有进度的任务收尾 ----------

    def _close_stale(self, root: str, case_id: str, task_id: str) -> None:
        """客户端有的结束路径不报 task/end，result.json 一直是 running，草稿的"确认保存"就一直不能点。
        对话任务最近一次写 result.json（begin、progress、存草稿都会写）距今超过它的 minutes 预算的，
        按"异常中断"收尾；草稿不动。流水线任务在本进程里自己收尾，不在此列。"""
        with self.task_lock(task_id):
            try:
                task = self._read(root, self.rel(task_id, "task.json"), "files/task.schema.json")
                if task["state"] != "running" or task["kind"] != "agent":
                    return
                p = gate.resolve_internal(root, self.rel(task_id, "result.json"), op="task")
                idle = time.time() - p.stat().st_mtime
                if idle <= task["budget"]["minutes"] * 60:
                    return
                res = self._read(root, self.rel(task_id, "result.json"), "files/result.schema.json")
                if res["status"] != "running":
                    return
                res["status"] = "abnormal"
                self._write(root, self.rel(task_id, "result.json"), res, "files/result.schema.json")
                task["state"] = "abnormal"
                self._write(root, self.rel(task_id, "task.json"), task, "files/task.schema.json")
            except (ApiError, OSError, contracts.ContractError, ValueError):
                return
        logs.event("task", "stale", status="fail", case_id=case_id, error="stale")

    def next_draft_version(self, root: str, title: str, ext: str) -> int:
        """草稿版本号在本案件内按标题接着往上加，不分任务（第九版待办 28：律师接着上一次的草稿提修改，
        对话另起了一个任务，新存的稿原来从第 1 版算起）。匹配不分大小写：NTFS 上 Report-v1.md 和 report-v1.md
        是同一个文件。两个任务同时存同一标题时版本号可能重复，文件在各自任务目录里，不会互相覆盖。"""
        base = gate.resolve_internal(root, TASK_DIR, op="save_draft")
        pat = re.compile(re.escape(title.casefold()) + r"-v(\d+)" + re.escape(ext) + "$")
        found = [int(m.group(1)) for d in (base.iterdir() if base.is_dir() else []) if (d / "草稿").is_dir()
                 for p in (d / "草稿").iterdir() if (m := pat.match(p.name.casefold()))]
        return max(found, default=0) + 1

    # ---------- 结果清单、读取记录 ----------

    def result(self, root: str, task_id: str) -> dict:
        return self._read(root, self.rel(task_id, "result.json"), "files/result.schema.json")

    def save_result(self, root: str, res: dict) -> None:
        self._write(root, self.rel(res["task_id"], "result.json"), res, "files/result.schema.json")

    # ---------- 流水线任务（T16；Spec 9.1"任务记录"） ----------

    def begin_pipeline(self, case_id: str, step: str, skill: str, params: dict, budget: dict) -> tuple[str, str]:
        """建一个 P- 任务并直接置为执行中；登记进 _begun，重开案件时不会被当成上次硬退出留下的。"""
        root = self.cases.root_of(case_id)
        tid = new_task_id("P")
        task = {"v": 1, "task_id": tid, "case_id": case_id, "kind": "pipeline", "session_id": None,
                "entry": skill, "skill": skill, "route": "local", "step": step, "inputs": [],
                "params": params, "budget": budget,
                "state": "running", "created_at": now_iso()}
        with self._lock:
            self._begun[tid] = datetime.now().astimezone()
            try:
                self._write(root, self.rel(tid, "task.json"), task, "files/task.schema.json")
                self._write(root, self.rel(tid, "result.json"), {
                    "v": 1, "task_id": tid, "status": "running",
                    "usage": {"model_calls": 0, "tool_calls": 0, "elapsed_s": 0}, "drafts": [],
                    "citation_check": None, "coverage": None, "citations": [], "finished_at": None},
                    "files/result.schema.json")
            except BaseException:
                self._begun.pop(tid, None)
                raise
            self._where[tid] = case_id
        logs.event("pipeline", "begin", case_id=case_id)
        return tid, root

    def end_pipeline(self, root: str, task_id: str, status: str, *, model_calls: int, drafts: list[dict],
                     citation_check: dict | None, citations: list[dict]) -> None:
        """流水线收尾：task.json 置为已结束，result.json 写状态、用量、草稿、核对结果。"""
        with self.task_lock(task_id):
            task = self._read(root, self.rel(task_id, "task.json"), "files/task.schema.json")
            task["state"] = "finished"
            self._write(root, self.rel(task_id, "task.json"), task, "files/task.schema.json")
            res = self.result(root, task_id)
            started = self._begun.get(task_id)
            elapsed = int((datetime.now().astimezone() - started).total_seconds()) if started else 0
            res.update(status=status, usage={"model_calls": model_calls, "tool_calls": 0, "elapsed_s": elapsed},
                       drafts=drafts, citation_check=citation_check, citations=citations, finished_at=now_iso())
            self.save_result(root, res)
        logs.event("pipeline", "end", status="ok" if status == "completed" else "fail", case_id=task["case_id"],
                   error=None if status == "completed" else status)

    def add_read(self, root: str, task_id: str, rec: dict) -> None:
        with self._lock:
            data = self._read(root, self.rel(task_id, "reads.json"), "files/reads.schema.json")
            data["reads"].append(rec)
            self._write(root, self.rel(task_id, "reads.json"), data, "files/reads.schema.json")

    def read_part(self, task_id: str, m: dict, no: int, start: int, end: int, length: int) -> bool:
        """记下读了单元的 [start, end)；从 0 起连续读到单元末尾时返回 True（只返回一次）。"""
        key = (task_id, m["material_id"], m["sha256"], no)
        with self._guard:
            got = self._parts.get(key, 0)
            if got < 0:
                return False           # 已经算读完、记过了
            if start <= got:
                got = max(got, end)
            if got >= length:
                self._parts[key] = -1
                return True
            self._parts[key] = got
            return False

    def coverage(self, root: str, case_id: str, task_id: str) -> dict:
        """按 reads.json 的实际读取记录计算，不采信模型自报（Spec 9.2）。只认当前版本（sha256）的读取。"""
        task = self._read(root, self.rel(task_id, "task.json"), "files/task.schema.json")
        index = self.index_for_task(task)
        reads = self._read(root, self.rel(task_id, "reads.json"), "files/reads.schema.json")["reads"]
        cov = {"total": 0, "fully_read": [], "partially_read": [], "not_read": [], "unreadable": []}
        for m in index["materials"]:
            if m["status"] == "source_deleted":
                continue
            cov["total"] += 1
            if m["status"] == "failed":
                cov["unreadable"].append({"name": m["name"], "reason": m["error"] or "无法处理"})
                continue
            try:
                units = texts.split_units(texts.read_text(root, m), m["unit"])
            except ApiError:
                cov["unreadable"].append({"name": m["name"], "reason": "材料文本不存在"})
                continue
            if units and all(u.text.strip() == texts.PENDING_OCR for u in units):
                # 整份都还没识别：读取工具会拒绝，不是"没有读"（律师反馈"10 份 10 份没读全"的成因，2026-10-07）
                cov["unreadable"].append({"name": m["name"], "reason": "还没识别，读不到文字，请先提交识别"})
                continue
            got: set[int] = set()
            for r in reads:
                if r["material_id"] == m["material_id"] and r["material_version"] == m["sha256"]:
                    got.update(range(r["from"], r["to"] + 1))
            total = texts.total_units(units)
            got &= set(range(1, total + 1))
            got -= {u.no for u in units if u.text.strip() == texts.PENDING_OCR}  # "本页需识别"的占位不算读过（P2-1）
            if total and len(got) >= total:
                cov["fully_read"].append(m["name"])
            elif got:
                cov["partially_read"].append({"name": m["name"], "read_units": len(got), "total_units": total})
            else:
                cov["not_read"].append(m["name"])
        return cov

    # ---------- /core/progress、/core/task/end ----------

    def progress(self, task_id: str, text: str, model_calls: int, tool_calls: int) -> dict:
        """还没 begin 的报 TASK_NOT_FOUND（P3-2）；已结束或异常中断的不写文件、不改用量（P2-4）。"""
        with self.task_lock(task_id):
            case_id, root, task = self.locate(task_id)
            if task["state"] == "pending":
                raise ApiError("TASK_NOT_FOUND", "not_begun")
            if task["state"] != "running":
                return {}
            gate.write_bytes(root, self.rel(task_id, f"草稿/{IN_PROGRESS}"), text.encode("utf-8"), op="task_progress")
            res = self.result(root, task_id)
            res["usage"].update(model_calls=model_calls, tool_calls=tool_calls,
                                elapsed_s=_elapsed(task, self._begun.get(task_id)))
            self.save_result(root, res)
        return {}

    def end(self, task_id: str, reason: str, model_calls: int, tool_calls: int, elapsed_s: int) -> dict:
        """已结束的直接返回已写的状态，不改写（P2-4）；还没 begin 的、已标异常中断的报 TASK_NOT_FOUND
        （契约的返回状态里没有"异常中断"）。"""
        with self.task_lock(task_id):
            return self._end(task_id, reason, model_calls, tool_calls, elapsed_s)

    def _end(self, task_id: str, reason: str, model_calls: int, tool_calls: int, elapsed_s: int) -> dict:
        case_id, root, task = self.locate(task_id)
        if task["state"] == "finished":
            return {"status": self.result(root, task_id)["status"]}
        if task["state"] != "running":
            raise ApiError("TASK_NOT_FOUND", "not_running")
        status = END_STATUS[reason]
        res = self.result(root, task_id)
        res.update(status=status, finished_at=now_iso())
        res["usage"] = {"model_calls": model_calls, "tool_calls": tool_calls, "elapsed_s": elapsed_s}
        try:
            res["coverage"] = self.coverage(root, case_id, task_id)
        except ApiError as error:
            if (
                error.code != "INPUT_CHANGED"
                or error.reason != "task_scope_version_changed"
                or task.get("request_scope") is None
                or status == "completed"
            ):
                raise
            res["coverage"] = None
        if not res["drafts"]:
            # 没存过正式草稿：进行中.md 改名为 未完成-<时间>.md（F-RUN-04），由程序保存，不依赖模型
            src = gate.resolve_internal(root, self.rel(task_id, f"草稿/{IN_PROGRESS}"), op="task_end")
            if src.is_file():
                name = f"未完成-{datetime.now().strftime('%Y%m%d%H%M%S')}.md"
                gate.write_bytes(root, self.rel(task_id, f"草稿/{name}"), src.read_bytes(), op="task_end")
                gate.delete_work_file(root, self.rel(task_id, f"草稿/{IN_PROGRESS}"), op="task_end")
        else:
            # 存过正式草稿：进度文件不再保留（T14 派修）；save_draft 时已删过，这里清掉之后 progress 又写出来的
            gate.delete_work_file(root, self.rel(task_id, f"草稿/{IN_PROGRESS}"), op="task_end")
        self.save_result(root, res)
        task["state"] = "finished"
        self._write(root, self.rel(task_id, "task.json"), task, "files/task.schema.json")
        logs.event("task", "end", case_id=case_id, status="ok" if status == "completed" else "fail",
                   error=None if status == "completed" else status)
        return {"status": status}


def _elapsed(task: dict, begun: datetime | None) -> int:
    """从 begin 算起（P3-3）；本进程没记下 begin 时刻的（不会发生在执行中的任务上）退回建单时间。"""
    try:
        start = begun or datetime.fromisoformat(task["created_at"])
        return max(0, int((datetime.now().astimezone() - start).total_seconds()))
    except ValueError:
        return 0
