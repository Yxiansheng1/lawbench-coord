"""T31 paired scope-loss regression for the current native-backend lifecycle.

The two request identifiers below are explicit synthetic UUIDs. They exercise
the backend lifecycle shape only and are not claimed to have been emitted by a
real NativeSession. No real case, history, model, network, OCR, Office, or
default-app input is used.
"""
from __future__ import annotations

import importlib.util
import pathlib
import unittest

REPO_ROOT = pathlib.Path(__file__).resolve().parents[5]
FIXTURE_PATH = (
    REPO_ROOT
    / "docs"
    / "plan"
    / "evidence"
    / "T31"
    / "ScopedTaskImplementation-20261026-014815"
    / "scoped_task_standalone.py"
)

SESSION_ID = "s_t31_scope_loss_native"
CONTROL_R = "6c2f0f41-4d37-4a64-8b2f-202610261504"
FAULT_R = "7d3f1a52-5e48-4b75-9c30-202610261505"


def _load_safe_fixture():
    if not FIXTURE_PATH.is_file():
        raise RuntimeError(f"safe fixture missing: {FIXTURE_PATH}")
    spec = importlib.util.spec_from_file_location(
        "_t31_scope_loss_safe_fixture", FIXTURE_PATH
    )
    if spec is None or spec.loader is None:
        raise RuntimeError(f"safe fixture cannot be loaded: {FIXTURE_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


# The module object deliberately does not expose the fixture's old TestCase at
# this module's top level. This new file is run directly and contains only the
# two paired tests below; importing the fixture does not run its old suite.
FIXTURE = _load_safe_fixture()
contracts = FIXTURE.contracts


class ScopeLossRegressionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.fixture = FIXTURE.ScopedTaskStandaloneTest(methodName="runTest")
        # Register cleanup before setUp so a partial fixture setup cannot leave
        # its owned private temporary directory or converter patch behind.
        self.addCleanup(self._cleanup_fixture)
        self.fixture.setUp()
        self.store_path = self.fixture.appdata / "request-scopes.json"
        self.full_material_ids = {
            item["material_id"]
            for item in self.fixture.materials.index(self.fixture.case_id)["materials"]
        }

    def _cleanup_fixture(self) -> None:
        fixture = self.fixture
        try:
            if hasattr(fixture, "_tmp"):
                fixture.tearDown()
        finally:
            fixture.doCleanups()

    def _task_ids(self) -> set[str]:
        base = self.fixture.case_root / FIXTURE.TASK_DIR
        if not base.is_dir():
            return set()
        return {entry.name for entry in base.iterdir() if entry.is_dir()}

    def _read_store(self) -> dict:
        value = contracts.read_json(self.store_path)
        contracts.validate("files/request_scope_store.schema.json", "", value)
        return value

    def _abort_if_running(self, task_id: str) -> dict:
        _, _, task = self.fixture.tasks.locate(task_id)
        if task["state"] == "running":
            return self.fixture.tasks.end(task_id, "aborted", 0, 0, 0)
        return {"status": task["state"]}

    def test_unscoped_new_request_control_is_accepted_and_ended(self) -> None:
        self.assertEqual(self._task_ids(), set())

        begun = self.fixture.tasks.begin(
            SESSION_ID, str(self.fixture.case_root), CONTROL_R
        )
        self.addCleanup(self._abort_if_running, begun["task_id"])

        # Capture every observation first. The task is then ended before any
        # assertion can fail outside this method's registered cleanup.
        _, _, persisted = self.fixture.tasks.locate(begun["task_id"])
        context = self.fixture.task_context(begun["task_id"])
        visible_material_ids = {
            item["material_id"] for item in context.index()["materials"]
        }
        store_before_end = self._read_store()
        ended = self.fixture.tasks.end(begun["task_id"], "completed", 0, 0, 0)
        _, _, finished = self.fixture.tasks.locate(begun["task_id"])

        contracts.validate(
            "core/task_begin.schema.json", "#/$defs/value", begun
        )
        contracts.validate("files/task.schema.json", "", persisted)
        contracts.validate("files/task.schema.json", "", finished)

        self.assertEqual(len(self.full_material_ids), 3)
        self.assertEqual(begun["request_id"], CONTROL_R)
        self.assertIsNone(begun["request_scope"])
        record = store_before_end["records"][CONTROL_R]
        self.assertEqual(record["state"], "claimed")
        self.assertEqual(record["materials"], [])
        self.assertEqual(record["task_id"], begun["task_id"])
        self.assertIsNone(persisted["request_scope"])
        self.assertEqual(visible_material_ids, self.full_material_ids)
        self.assertEqual(ended["status"], "completed")
        self.assertEqual(finished["state"], "finished")

    def test_lost_prepared_row_must_not_become_unscoped_full_case(self) -> None:
        subset = [
            self.fixture.internal["material_id"],
            self.fixture.external["material_id"],
        ]
        prepared = self.fixture.prepare(
            FAULT_R, subset, session_id=SESSION_ID
        )
        self.assertEqual(prepared["material_ids"], subset)

        before_fault = self._read_store()
        prepared_record = before_fault["records"][FAULT_R]
        self.assertEqual(prepared_record["case_id"], self.fixture.case_id)
        self.assertEqual(prepared_record["session_id"], SESSION_ID)
        self.assertEqual(prepared_record["state"], "prepared")
        self.assertIsNone(prepared_record["task_id"])
        self.assertEqual(
            [item["material_id"] for item in prepared_record["materials"]],
            subset,
        )
        self.assertEqual(len(self.full_material_ids), 3)
        self.assertLess(len(subset), len(self.full_material_ids))

        # Deliberate test-only persistence fault: remove exactly FAULT_R from
        # the fixture-owned store. Task, material, and session-history files
        # are not fabricated or edited.
        expected_records = {
            request_id: record
            for request_id, record in before_fault["records"].items()
            if request_id != FAULT_R
        }
        faulted_store = {"v": before_fault["v"], "records": expected_records}
        contracts.write_json(
            self.store_path,
            faulted_store,
            "files/request_scope_store.schema.json",
        )
        after_fault = self._read_store()
        self.assertEqual(after_fault, faulted_store)
        self.assertNotIn(FAULT_R, after_fault["records"])

        fault_evidence = {
            "store_path": str(self.store_path.resolve()),
            "before_keys": sorted(before_fault["records"]),
            "removed_state": prepared_record["state"],
            "removed_task_id": prepared_record["task_id"],
            "removed_material_ids": [
                item["material_id"] for item in prepared_record["materials"]
            ],
            "after_keys": sorted(after_fault["records"]),
        }

        before_task_ids = self._task_ids()
        failure: Exception | None = None
        outcome: dict | None = None
        try:
            outcome = self.fixture.tasks.begin(
                SESSION_ID, str(self.fixture.case_root), FAULT_R
            )
        except Exception as exc:  # Assert the actual class only after cleanup.
            failure = exc

        after_task_ids = self._task_ids()
        new_task_ids = after_task_ids - before_task_ids
        if outcome is not None:
            new_task_ids.add(outcome["task_id"])
            self.addCleanup(self._abort_if_running, outcome["task_id"])

        unexpected: dict | None = None
        observation_error: Exception | None = None
        if outcome is not None:
            try:
                _, _, persisted = self.fixture.tasks.locate(outcome["task_id"])
                authoritative_scope = self.fixture.tasks.task_scope(persisted)
                visible_ids = {
                    item["material_id"]
                    for item in self.fixture.tasks.index_for_task(persisted)["materials"]
                }
                unexpected = {
                    "returned_request_scope": outcome.get("request_scope"),
                    "persisted_request_scope": persisted.get("request_scope"),
                    "authoritative_scope": authoritative_scope,
                    "visible_material_ids": sorted(visible_ids),
                }
            except Exception as exc:
                observation_error = exc

        cleanup: dict[str, str] = {}
        cleanup_errors: dict[str, str] = {}
        for task_id in sorted(new_task_ids):
            try:
                cleanup[task_id] = self._abort_if_running(task_id)["status"]
            except Exception as exc:
                cleanup_errors[task_id] = f"{type(exc).__name__}: {exc}"

        message = (
            f"fault={fault_evidence}; begin_outcome={outcome!r}; "
            f"begin_failure={failure!r}; new_task_ids={sorted(new_task_ids)}; "
            f"unexpected={unexpected!r}; observation_error={observation_error!r}; "
            f"cleanup={cleanup!r}; cleanup_errors={cleanup_errors!r}"
        )

        # A missing owned prepared row is fail-closed only if begin rejects it
        # and creates no task. The exception code is intentionally not guessed.
        self.assertIsNotNone(failure, message)
        self.assertIsInstance(failure, FIXTURE.ApiError, message)
        self.assertEqual(new_task_ids, set(), message)


if __name__ == "__main__":
    unittest.main(verbosity=2)
