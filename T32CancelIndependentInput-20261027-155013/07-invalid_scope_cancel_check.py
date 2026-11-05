"""T32 invalid scoped-task cancellation lifecycle.

BACKEND UNIT ONLY. This is not an HTTP, NativeSession, AgentLoop, model, GUI,
or full T31/T32 acceptance run.

Run from the repository root:

    python -B -X utf8 docs\\plan\\evidence\\T32\\InvalidScopeCancelFix-20261027-144659\\invalid_scope_cancel_check.py -v

The single scenario uses production CaseRegistry, Materials(mode=ref),
SettingsStore, TaskStore, context.build, and tools.run on three synthetic TXT
references. The only runtime uuid4 values are explicitly marked backend-unit
request IDs; no DSH, HTTP, or native-session submission exists here.
"""
from __future__ import annotations

import hashlib
import json
import os
import pathlib
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
import uuid
from unittest import mock


REPO_ROOT = pathlib.Path(__file__).resolve().parents[5]
SERVICE_ROOT = REPO_ROOT / "service"
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from lawbench import contracts, tools  # noqa: E402
from lawbench.case import context as case_context  # noqa: E402
from lawbench.case.materials import Materials  # noqa: E402
from lawbench.case.registry import CaseRegistry  # noqa: E402
from lawbench.case.task import TaskStore  # noqa: E402
from lawbench.errors import ApiError  # noqa: E402
from lawbench.settings import SettingsStore  # noqa: E402
from lawbench.tools import ToolContext  # noqa: E402


TEMP_PREFIX = ".t32-invalid-scope-cancel-"
TARGET_MARKER = "T32CANCELTARGETC8D15A"
ACTIVE_MARKER = "T32CANCELACTIVEF2E6B4"


def _deny_dangerous(*_args, **_kwargs):
    raise AssertionError("forbidden external side effect reached")


def _file_state(path: pathlib.Path) -> tuple[str, int, int]:
    data = path.read_bytes()
    info = path.stat()
    return hashlib.sha256(data).hexdigest(), info.st_size, info.st_mtime_ns


def _read_json(path: pathlib.Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise AssertionError(f"expected JSON object: {path.name}")
    return data


def _backend_unit_request_id() -> str:
    # BACKEND_UNIT_UUID_NOT_NATIVE_SESSION: no DSH submission exists here.
    return str(uuid.uuid4())


class InvalidScopeCancelLifecycleCheck(unittest.TestCase):
    def _assert_api_error(self, action, code: str, reason: str) -> None:
        with self.assertRaises(ApiError) as caught:
            action()
        self.assertEqual(caught.exception.code, code)
        self.assertEqual(caught.exception.reason, reason)

    def test_invalid_scope_non_success_end_finishes_without_widening_scope(self) -> None:
        owned = pathlib.Path(tempfile.mkdtemp(prefix=TEMP_PREFIX))
        try:
            with (
                mock.patch.object(socket.socket, "connect", _deny_dangerous),
                mock.patch.object(socket, "create_connection", _deny_dangerous),
                mock.patch.object(urllib.request, "urlopen", _deny_dangerous),
                mock.patch.object(subprocess, "Popen", _deny_dangerous),
                mock.patch.object(subprocess, "run", _deny_dangerous),
            ):
                self._exercise(owned)
        finally:
            owned_real = owned.resolve()
            expected_parent = pathlib.Path(tempfile.gettempdir()).resolve()
            self.assertEqual(owned_real.parent, expected_parent)
            self.assertTrue(owned_real.name.startswith(TEMP_PREFIX))
            if owned_real.exists():
                shutil.rmtree(owned_real)

    def _exercise(self, owned: pathlib.Path) -> None:
        appdata = owned / "appdata"
        source_dir = owned / "reference-source"
        case_root = owned / "synthetic-case"
        lo_base = owned / "lo"
        blocked_home = owned / "blocked-home"
        blocked_system = owned / "blocked-system"
        for path in (
            appdata,
            source_dir,
            case_root,
            lo_base,
            blocked_home,
            blocked_system,
        ):
            path.mkdir(parents=True)

        source_text = {
            "01-active.txt": (
                f"虚构活跃材料甲。唯一共同标记 {ACTIVE_MARKER}。\n"
                "这份文本仅用于本地后端单元验证。\n"
            ),
            "02-target.txt": (
                f"虚构目标材料。移除前唯一标记 {TARGET_MARKER}。\n"
                "这份文本仅用于本地后端单元验证。\n"
            ),
            "03-third.txt": (
                f"虚构活跃材料乙。唯一共同标记 {ACTIVE_MARKER}。\n"
                "这份文本仅用于本地后端单元验证。\n"
            ),
        }
        for name, text in source_text.items():
            (source_dir / name).write_text(text, encoding="utf-8")

        cases: CaseRegistry | None = None
        materials: Materials | None = None
        tasks: TaskStore | None = None
        source_states_before: dict[pathlib.Path, tuple[str, int, int]] = {}
        controls_before: dict[str, bytes] = {}
        started_tasks: list[tuple[str, float]] = []
        tool_calls: dict[str, int] = {}

        def registry() -> CaseRegistry:
            return CaseRegistry(
                appdata,
                REPO_ROOT / "contracts" / "case_db.sql",
                ref_home=blocked_home,
                ref_appdata=appdata,
                ref_system_dirs=(str(blocked_system),),
            )

        try:
            cases = registry()
            opened = cases.open(os.fspath(case_root), None, None, "daily")
            case_id = opened["case_id"]
            root = os.fspath(case_root)
            materials = Materials(cases, lo_base, ref_context=cases.ref_context_for)
            materials.recycle = _deny_dangerous
            materials.can_recycle = _deny_dangerous
            self.assertIsNone(materials.before_remove)
            self.assertIsNone(materials.after_render)

            imported = materials.import_(
                case_id,
                [os.fspath(source_dir)],
                None,
                False,
                mode="ref",
            )
            self.assertEqual(len(imported["registered"]), 1)
            self.assertEqual(imported["scan"]["failed"], 0)

            index_path = case_root / "工作区" / "材料" / "index.json"
            scope_store_path = appdata / "request-scopes.json"
            self.assertTrue(index_path.is_file())
            self.assertTrue((case_root / "工作区" / "材料" / "引用.json").is_file())
            self.assertTrue((case_root / "工作区" / "case.db").is_file())

            baseline = materials.index(case_id)
            self.assertEqual(len(baseline["materials"]), 3)
            by_file = {
                row["rel_path"].rsplit("/", 1)[-1]: row
                for row in baseline["materials"]
            }
            self.assertEqual(sorted(by_file), sorted(source_text))
            self.assertTrue(all(row["status"] == "parsed" for row in by_file.values()))
            self.assertTrue(all(row.get("origin") == "ref" for row in by_file.values()))

            target_before = by_file["02-target.txt"]
            active_before = [by_file["01-active.txt"], by_file["03-third.txt"]]
            target_id = target_before["material_id"]
            active_ids = {row["material_id"] for row in active_before}
            all_ids = {row["material_id"] for row in baseline["materials"]}
            self.assertEqual(all_ids, active_ids | {target_id})
            self.assertNotIn(target_id, active_ids)

            native_originals: dict[str, pathlib.Path] = {}
            for material_id in sorted(all_ids):
                original, original_status = materials.original_path(
                    case_id, material_id
                )
                self.assertEqual(original_status, "ok")
                self.assertIsNotNone(original)
                native_originals[material_id] = pathlib.Path(original)
            source_states_before = {
                path: _file_state(path)
                for path in sorted(native_originals.values())
            }
            self.assertEqual(len(source_states_before), 3)

            target_derived = case_root.joinpath(
                *target_before["text_path"].split("/")
            )
            control_derived = {
                row["material_id"]: case_root.joinpath(*row["text_path"].split("/"))
                for row in active_before
            }
            self.assertTrue(target_derived.is_file())
            self.assertTrue(all(path.is_file() for path in control_derived.values()))
            controls_before = {
                material_id: path.read_bytes()
                for material_id, path in control_derived.items()
            }

            settings = SettingsStore(appdata)
            tasks = TaskStore(cases, settings, materials)

            session_c = "backend-unit-session-invalid-c"
            session_u = "backend-unit-session-unscoped"
            session_v = "backend-unit-session-valid-control"
            request_c = _backend_unit_request_id()
            request_v = _backend_unit_request_id()

            prepared_c = tasks.request_scope(
                {
                    "action": "prepare",
                    "request_id": request_c,
                    "case_id": case_id,
                    "session_id": session_c,
                    "material_ids": [target_id],
                }
            )
            self.assertEqual(prepared_c["material_ids"], [target_id])
            begun_c = tasks.begin(session_c, root, request_c)
            task_c = begun_c["task_id"]
            started_tasks.append((task_c, time.monotonic()))
            tool_calls[task_c] = 0
            _, _, claimed_task_c = tasks.locate(task_c)
            expected_target_scope = [
                {"material_id": target_id, "sha256": target_before["sha256"]}
            ]
            self.assertEqual(
                claimed_task_c["request_scope"]["materials"],
                expected_target_scope,
            )
            scope_c_before = json.loads(
                json.dumps(claimed_task_c["request_scope"], ensure_ascii=False)
            )
            self.assertEqual(
                [row["material_id"] for row in tasks.index_for_task(claimed_task_c)["materials"]],
                [target_id],
            )

            begun_u = tasks.begin(session_u, root, None)
            task_u = begun_u["task_id"]
            started_tasks.append((task_u, time.monotonic()))
            tool_calls[task_u] = 0
            _, _, unscoped_task_u = tasks.locate(task_u)
            self.assertIsNone(unscoped_task_u.get("request_id"))
            self.assertIsNone(unscoped_task_u.get("request_scope"))

            active_control_id = active_before[0]["material_id"]
            expected_active_scope = [
                {
                    "material_id": active_control_id,
                    "sha256": active_before[0]["sha256"],
                }
            ]
            prepared_v = tasks.request_scope(
                {
                    "action": "prepare",
                    "request_id": request_v,
                    "case_id": case_id,
                    "session_id": session_v,
                    "material_ids": [active_control_id],
                }
            )
            self.assertEqual(prepared_v["material_ids"], [active_control_id])
            begun_v = tasks.begin(session_v, root, request_v)
            task_v = begun_v["task_id"]
            started_tasks.append((task_v, time.monotonic()))
            tool_calls[task_v] = 0
            _, _, valid_task_v = tasks.locate(task_v)
            self.assertEqual(
                valid_task_v["request_scope"]["materials"],
                expected_active_scope,
            )

            invalid_context_c = ToolContext(
                root=root,
                case_id=case_id,
                task=claimed_task_c,
                tasks=tasks,
                materials=materials,
            )
            unscoped_context_u = ToolContext(
                root=root,
                case_id=case_id,
                task=unscoped_task_u,
                tasks=tasks,
                materials=materials,
            )

            def run_task_tool(
                task_id: str,
                ctx: ToolContext,
                tool_name: str,
                args: dict,
            ) -> dict:
                tool_calls[task_id] += 1
                return tools.run(ctx, tool_name, args)

            removed = materials.remove(case_id, [target_id])
            contracts.validate(
                "api/materials_remove.schema.json",
                "#/$defs/response",
                {"ok": True, "value": removed},
            )
            self.assertEqual(removed["removed"], [target_id])
            self.assertEqual(removed["already_removed"], [])
            self.assertEqual(removed["failed"], [])
            self.assertFalse(target_derived.exists())

            raw_after = {
                row["material_id"]: row
                for row in _read_json(index_path)["materials"]
            }
            self.assertEqual(raw_after[target_id]["status"], "removed")
            self.assertEqual(
                {material_id: raw_after[material_id] for material_id in active_ids},
                {row["material_id"]: row for row in active_before},
            )
            self.assertEqual(
                {
                    path: _file_state(path)
                    for path in sorted(source_states_before)
                },
                source_states_before,
            )
            for material_id, path in control_derived.items():
                self.assertTrue(path.is_file())
                self.assertEqual(path.read_bytes(), controls_before[material_id])

            self._assert_api_error(
                lambda: case_context.build(
                    root,
                    claimed_task_c,
                    tasks.index_for_task(claimed_task_c),
                    tasks.read_input,
                ),
                "INPUT_CHANGED",
                "task_scope_version_changed",
            )
            self._assert_api_error(
                lambda: run_task_tool(
                    task_c,
                    invalid_context_c,
                    "case_list_materials",
                    {},
                ),
                "INPUT_CHANGED",
                "task_scope_version_changed",
            )
            self._assert_api_error(
                lambda: run_task_tool(
                    task_c,
                    invalid_context_c,
                    "case_read_material",
                    {"name": target_before["name"]},
                ),
                "INPUT_CHANGED",
                "task_scope_version_changed",
            )
            self._assert_api_error(
                lambda: run_task_tool(
                    task_c,
                    invalid_context_c,
                    "case_search",
                    {"query": ACTIVE_MARKER},
                ),
                "INPUT_CHANGED",
                "task_scope_version_changed",
            )
            self.assertEqual(tool_calls[task_c], 3)
            print(
                "STAGE remove_and_fail_closed "
                f"target_status={raw_after[target_id]['status']} "
                "context=INPUT_CHANGED invalid_tools=3 active_controls=2"
            )

            task_path_c = case_root / "工作区" / "任务" / task_c / "task.json"
            result_path_c = case_root / "工作区" / "任务" / task_c / "result.json"
            task_c_before_bad_complete = _file_state(task_path_c)
            result_c_before_bad_complete = _file_state(result_path_c)
            self._assert_api_error(
                lambda: tasks.end(
                    task_c,
                    reason="completed",
                    model_calls=0,
                    tool_calls=tool_calls[task_c],
                    elapsed_s=7,
                ),
                "INPUT_CHANGED",
                "task_scope_version_changed",
            )
            _, _, task_c_still_running = tasks.locate(task_c)
            self.assertEqual(task_c_still_running["state"], "running")
            self.assertEqual(tasks.result(root, task_c)["status"], "running")
            self.assertEqual(_file_state(task_path_c), task_c_before_bad_complete)
            self.assertEqual(
                _file_state(result_path_c),
                result_c_before_bad_complete,
            )

            cancelled_c = tasks.end(
                task_c,
                reason="aborted",
                model_calls=0,
                tool_calls=tool_calls[task_c],
                elapsed_s=7,
            )
            self.assertEqual(cancelled_c, {"status": "cancelled"})
            _, _, finished_task_c = tasks.locate(task_c)
            result_c = tasks.result(root, task_c)
            self.assertEqual(finished_task_c["state"], "finished")
            self.assertEqual(result_c["status"], "cancelled")
            self.assertIsNone(result_c["coverage"])
            self.assertIsNotNone(result_c["finished_at"])
            self.assertEqual(
                result_c["usage"],
                {"model_calls": 0, "tool_calls": 3, "elapsed_s": 7},
            )
            self.assertEqual(
                finished_task_c["request_scope"],
                scope_c_before,
            )
            self.assertEqual(finished_task_c["request_id"], request_c)
            contracts.validate(
                "files/task.schema.json",
                "",
                _read_json(task_path_c),
            )
            contracts.validate(
                "files/result.schema.json",
                "",
                _read_json(result_path_c),
            )

            scope_store = _read_json(scope_store_path)
            scope_record_c = scope_store["records"][request_c]
            self.assertEqual(scope_record_c["state"], "claimed")
            self.assertEqual(scope_record_c["task_id"], task_c)
            self.assertEqual(scope_record_c["materials"], expected_target_scope)
            print(
                "STAGE invalid_cancel "
                "completed=INPUT_CHANGED aborted=cancelled coverage=null "
                "scope_versions=preserved authoritative_record=claimed"
            )

            task_c_after_terminal = _file_state(task_path_c)
            result_c_after_terminal = _file_state(result_path_c)
            repeated_c = tasks.end(
                task_c,
                reason="completed",
                model_calls=99,
                tool_calls=99,
                elapsed_s=99,
            )
            self.assertEqual(repeated_c, {"status": "cancelled"})
            self.assertEqual(_file_state(task_path_c), task_c_after_terminal)
            self.assertEqual(
                _file_state(result_path_c),
                result_c_after_terminal,
            )

            task_base = case_root / "工作区" / "任务"

            def task_dirs() -> list[str]:
                return sorted(
                    path.name for path in task_base.iterdir() if path.is_dir()
                )

            dirs_before_replay = task_dirs()
            self._assert_api_error(
                lambda: tasks.begin(session_c, root, request_c),
                "TASK_NOT_FOUND",
                "request_scope_task_ended",
            )
            self.assertEqual(task_dirs(), dirs_before_replay)
            self.assertEqual(_file_state(task_path_c), task_c_after_terminal)
            self.assertEqual(
                _file_state(result_path_c),
                result_c_after_terminal,
            )
            print(
                "STAGE terminal_replay "
                "idempotent_end=bytes_unchanged same_request=TASK_NOT_FOUND "
                "task_dirs=unchanged"
            )

            post_remove_u = run_task_tool(
                task_u,
                unscoped_context_u,
                "case_list_materials",
                {},
            )
            self.assertEqual(post_remove_u["total"], 2)
            self.assertEqual(
                {row["material_id"] for row in post_remove_u["materials"]},
                active_ids,
            )
            cancelled_u = tasks.end(
                task_u,
                reason="aborted",
                model_calls=0,
                tool_calls=tool_calls[task_u],
                elapsed_s=5,
            )
            self.assertEqual(cancelled_u, {"status": "cancelled"})
            result_u = tasks.result(root, task_u)
            self.assertEqual(result_u["status"], "cancelled")
            self.assertEqual(result_u["coverage"]["total"], 2)
            self.assertEqual(
                result_u["coverage"]["not_read"],
                [row["name"] for row in active_before],
            )
            self.assertEqual(result_u["usage"]["tool_calls"], 1)

            completed_v = tasks.end(
                task_v,
                reason="completed",
                model_calls=0,
                tool_calls=0,
                elapsed_s=4,
            )
            self.assertEqual(completed_v, {"status": "completed"})
            _, _, finished_task_v = tasks.locate(task_v)
            result_v = tasks.result(root, task_v)
            self.assertEqual(finished_task_v["state"], "finished")
            self.assertEqual(result_v["status"], "completed")
            self.assertEqual(result_v["coverage"]["total"], 1)
            self.assertEqual(
                result_v["coverage"]["not_read"],
                [active_before[0]["name"]],
            )
            self.assertEqual(
                finished_task_v["request_scope"]["materials"],
                expected_active_scope,
            )
            print(
                "STAGE normal_controls "
                "unscoped_cancel_coverage=2 valid_scope_completed_coverage=1"
            )
        finally:
            active_failure = sys.exc_info()[0] is not None
            cleanup_errors: list[str] = []
            if tasks is not None:
                for task_id, started_at in reversed(started_tasks):
                    try:
                        tasks.end(
                            task_id,
                            reason="aborted",
                            model_calls=0,
                            tool_calls=tool_calls.get(task_id, 0),
                            elapsed_s=max(
                                0,
                                int(time.monotonic() - started_at),
                            ),
                        )
                    except Exception as error:
                        cleanup_errors.append(
                            f"{task_id}:{type(error).__name__}:"
                            f"{getattr(error, 'code', '')}:"
                            f"{getattr(error, 'reason', '')}"
                        )

            source_preserved = False
            if source_states_before:
                try:
                    source_preserved = (
                        {
                            path: _file_state(path)
                            for path in sorted(source_states_before)
                        }
                        == source_states_before
                    )
                except OSError as error:
                    cleanup_errors.append(f"source:{type(error).__name__}")
            controls_preserved = False
            if controls_before:
                try:
                    controls_preserved = all(
                        path.is_file()
                        and path.read_bytes() == controls_before[material_id]
                        for material_id, path in control_derived.items()
                    )
                except OSError as error:
                    cleanup_errors.append(
                        f"controls-derived:{type(error).__name__}"
                    )
            print(
                "STAGE cleanup "
                f"source_preserved={source_preserved} "
                f"controls_derived_preserved={controls_preserved} "
                f"task_end_errors={cleanup_errors or 'none'}"
            )
            if not active_failure:
                self.assertTrue(source_preserved)
                self.assertTrue(controls_preserved)
                self.assertEqual(cleanup_errors, [])


def load_tests(loader, standard_tests, pattern):
    del standard_tests, pattern
    return loader.loadTestsFromTestCase(InvalidScopeCancelLifecycleCheck)


if __name__ == "__main__":
    unittest.main(verbosity=2)
