"""一次提交（DSH 原生 request_id）的材料范围与任务认领。

持久记录只保存定位和恢复所需的事实：案件/会话/请求/任务编号、材料编号、
材料版本和状态。不保存材料名、路径、正文、检索词或模型输入输出。
"""
from __future__ import annotations

import re
import threading
from datetime import datetime
from pathlib import Path
from typing import Callable

from .. import contracts
from ..errors import ApiError

STORE_FILE = "request-scopes.json"
STORE_SCHEMA = "files/request_scope_store.schema.json"
_MATERIAL_ID = re.compile(r"^M[0-9]{4}$")
_UNAVAILABLE = {"removed", "source_deleted", "missing"}
_ZERO_SHA = "0" * 64


def _now() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


class RequestScopeStore:
    """R 的唯一映射；同 R 的 prepare/release/claim 都在这把锁内完成。"""

    def __init__(self, cases, materials, path: Path | None):
        self.cases = cases
        self.materials = materials
        self.path = Path(path) if path is not None else None
        self._lock = threading.RLock()

    # ---------- 公共接口 ----------

    def handle(self, request: dict) -> dict:
        if request["action"] == "prepare":
            return self.prepare(request)
        if request["action"] == "release":
            return self.release(request)
        raise ApiError("INVALID_ARGUMENT", "request_scope_action")

    def task_scope(self, task: dict) -> dict | None:
        """按持久 R 记录核验任务身份，并返回服务端权威的材料快照。

        ``request_scope`` 不可单独作为权限来源：已有 R 的记录被篡改或缺失时，
        不能因为任务副本里的字段为空就退回全案。真正未 prepare 的原生 R 在
        持久记录里同样没有材料，因此只有任务、会话、案件和认领编号全部吻合
        且权威快照为空时，才返回 ``None``。
        """
        request_id = task.get("request_id")
        actual = task.get("request_scope")
        with self._lock:
            records = self._load()["records"]
            claimed = [
                (rid, item)
                for rid, item in records.items()
                if item["task_id"] == task["task_id"]
            ]
            if request_id is None:
                if claimed or actual is not None:
                    raise ApiError("INTERNAL", "request_scope_task_conflict")
                return None
            record = records.get(request_id)
            if record is None or record["task_id"] is None:
                raise ApiError("INTERNAL", "request_scope_task_missing")
            if (
                len(claimed) != 1
                or claimed[0][0] != request_id
                or record["case_id"] != task["case_id"]
                or record["session_id"] != task["session_id"]
                or record["task_id"] != task["task_id"]
                or record["state"] not in ("claiming", "claimed")
            ):
                raise ApiError("INTERNAL", "request_scope_task_conflict")
            expected = self._scope(request_id, record)
            if actual != expected:
                reason = (
                    "request_scope_task_missing"
                    if actual is None
                    else "request_scope_task_conflict"
                )
                raise ApiError("INTERNAL", reason)
            return expected

    def prepare(self, request: dict) -> dict:
        request_id = request["request_id"]
        case_id = request["case_id"]
        session_id = request["session_id"]
        material_ids = list(request["material_ids"])
        with self._lock:
            data = self._load()
            record = data["records"].get(request_id)
            if record is not None:
                self._assert_identity(record, case_id, session_id)
                self._assert_live_state(record)
                if set(material_ids) != set(self._material_ids(record)):
                    raise self._conflict("request_scope_material_set")
                if record["state"] in ("claiming", "claimed"):
                    return self._prepare_value(request_id, record)

            try:
                snapshot = self._snapshot(case_id, material_ids)
            except ApiError as error:
                if record is None:
                    data["records"][request_id] = self._new_record(
                        case_id, session_id, "rejected", [], None
                    )
                    self._save(data)
                    raise
                if error.reason in (
                    "request_scope_material_unavailable",
                    "request_scope_material_version",
                ):
                    raise ApiError("INPUT_CHANGED", "request_scope_material_changed") from None
                raise

            if record is None:
                record = self._new_record(case_id, session_id, "prepared", snapshot, None)
                data["records"][request_id] = record
                self._save(data)
                return self._prepare_value(request_id, record)

            if record["state"] == "prepared":
                if self._versions(record) != self._versions({"materials": snapshot}):
                    raise ApiError("INPUT_CHANGED", "request_scope_version_changed")
                return self._prepare_value(request_id, record)
            raise self._gone()

    def release(self, request: dict) -> dict:
        request_id = request["request_id"]
        case_id = request["case_id"]
        session_id = request["session_id"]
        with self._lock:
            data = self._load()
            record = data["records"].get(request_id)
            if record is None:
                record = self._new_record(case_id, session_id, "released", [], None)
                data["records"][request_id] = record
                self._save(data)
            else:
                self._assert_identity(record, case_id, session_id)
                # 已开始认领/执行的任务不因 release 改权限；重复 release 也不删材料。
                if record["state"] in ("prepared", "rejected"):
                    record["state"] = "released"
                    record["updated_at"] = _now()
                    self._save(data)
            return {"action": "release", "request_id": request_id, "case_id": case_id,
                    "session_id": session_id}

    def claim_or_replay(
        self,
        request_id: str,
        case_id: str,
        session_id: str,
        task_id_factory: Callable[[], str],
        prepare_task: Callable[[str, dict | None], None],
        activate_task: Callable[[str, dict | None], dict],
    ) -> dict:
        """在持久状态锁内认领，返回已激活或已运行的任务。

        先落 ``claiming`` 和确定性任务编号，再写 pending 任务；写全后才落
        ``claimed``，最后把任务置为 running。任一步失败，同 R 重试都沿本记录
        恢复，不会转成整案，也不会因进程重开把 pending 误标异常。
        """
        with self._lock:
            data = self._load()
            record = data["records"].get(request_id)
            if record is None:
                task_id = task_id_factory()
                record = self._new_record(case_id, session_id, "claiming", [], task_id)
                data["records"][request_id] = record
                self._save(data)
            else:
                self._assert_identity(record, case_id, session_id)
                self._assert_live_state(record)
                if record["state"] == "prepared":
                    self._assert_snapshot_current(record)
                    task_id = task_id_factory()
                    record["state"] = "claiming"
                    record["task_id"] = task_id
                    record["updated_at"] = _now()
                    self._save(data)
                else:
                    task_id = record.get("task_id")
                    if not task_id:
                        raise ApiError("INTERNAL", "request_scope_task_missing")
                    if record["state"] == "claiming" and record["materials"]:
                        self._assert_snapshot_current(record)
                    if record["state"] == "claimed":
                        return activate_task(task_id, self._scope(request_id, record))
                    if record["state"] != "claiming":
                        raise self._gone()

            scope = self._scope(request_id, record)
            prepare_task(task_id, scope)
            record["state"] = "claimed"
            record["updated_at"] = _now()
            self._save(data)

        # activate_task 只碰本任务文件；持久 R 已固定，失败时下一次同 R 会续做。
        return activate_task(task_id, scope)

    # ---------- 快照与比较 ----------

    def _snapshot(self, case_id: str, material_ids: list[str]) -> list[dict]:
        if not material_ids or len(material_ids) != len(set(material_ids)):
            raise ApiError("INVALID_ARGUMENT", "request_scope_material_ids")
        if any(not isinstance(mid, str) or not _MATERIAL_ID.fullmatch(mid) for mid in material_ids):
            raise ApiError("INVALID_ARGUMENT", "request_scope_material_ids")
        index = self.materials.index(case_id)
        by_id = {m["material_id"]: m for m in index["materials"]}
        out: list[dict] = []
        for material_id in material_ids:
            material = by_id.get(material_id)
            if material is None or material.get("status") in _UNAVAILABLE:
                raise ApiError("MATERIAL_NOT_FOUND", "request_scope_material_unavailable")
            sha256 = material.get("sha256")
            if not isinstance(sha256, str) or not re.fullmatch(r"[0-9a-f]{64}", sha256) or sha256 == _ZERO_SHA:
                raise ApiError("MATERIAL_NOT_READY", "request_scope_material_version")
            out.append({"material_id": material_id, "sha256": sha256})
        return out

    def _assert_snapshot_current(self, record: dict) -> None:
        try:
            current = self._snapshot(record["case_id"], self._material_ids(record))
        except ApiError as error:
            if error.reason in (
                "request_scope_material_unavailable",
                "request_scope_material_version",
            ):
                raise ApiError("INPUT_CHANGED", "request_scope_material_changed") from None
            raise
        if self._versions(record) != self._versions({"materials": current}):
            raise ApiError("INPUT_CHANGED", "request_scope_version_changed")

    @staticmethod
    def _material_ids(record: dict) -> list[str]:
        return [m["material_id"] for m in record["materials"]]

    @staticmethod
    def _versions(record: dict) -> dict[str, str]:
        return {m["material_id"]: m["sha256"] for m in record["materials"]}

    @staticmethod
    def _scope(request_id: str, record: dict) -> dict | None:
        if not record["materials"]:
            return None
        return {
            "request_id": request_id,
            "case_id": record["case_id"],
            "kind": "materials",
            "materials": [dict(m) for m in record["materials"]],
        }

    # ---------- 持久记录 ----------

    def _load(self) -> dict:
        if self.path is None:
            raise ApiError("INTERNAL", "request_scope_store_unavailable")
        if not self.path.is_file():
            return {"v": 1, "records": {}}
        try:
            data = contracts.read_json(self.path)
            contracts.validate(STORE_SCHEMA, "", data)
        except (OSError, ValueError, contracts.ContractError):
            raise ApiError("INTERNAL", "request_scope_store_invalid") from None
        return data

    def _save(self, data: dict) -> None:
        contracts.write_json(self.path, data, STORE_SCHEMA)

    def _new_record(
        self,
        case_id: str,
        session_id: str,
        state: str,
        materials: list[dict],
        task_id: str | None,
    ) -> dict:
        return {
            "case_id": case_id,
            "session_id": session_id,
            "state": state,
            "materials": [dict(m) for m in materials],
            "task_id": task_id,
            "updated_at": _now(),
        }

    @staticmethod
    def _prepare_value(request_id: str, record: dict) -> dict:
        return {
            "action": "prepare",
            "request_id": request_id,
            "case_id": record["case_id"],
            "session_id": record["session_id"],
            "material_ids": RequestScopeStore._material_ids(record),
        }

    @staticmethod
    def _assert_identity(record: dict, case_id: str, session_id: str) -> None:
        if record["case_id"] != case_id or record["session_id"] != session_id:
            raise ApiError("OUT_OF_CASE", "request_scope_identity")

    @staticmethod
    def _assert_live_state(record: dict) -> None:
        if record["state"] in ("released", "rejected"):
            raise RequestScopeStore._gone()

    @staticmethod
    def _conflict(reason: str) -> ApiError:
        return ApiError("INVALID_ARGUMENT", reason)

    @staticmethod
    def _gone() -> ApiError:
        return ApiError(
            "TASK_NOT_FOUND",
            "request_scope_gone",
            detail="这次请求的范围已释放或被拒绝，请重新发起提问",
        )
