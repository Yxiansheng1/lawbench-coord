"""T32 文稿版本保存桥接的独立 stdlib 验证。

直接运行：python service\tests\t32_document_save_standalone.py -v
不导入真实 tools 包、TaskStore 模块、Materials/ingest/registry/search/app/config 实例，
不启动产品 lifespan 或服务，不访问任何网络。
"""
from __future__ import annotations

import ast
import copy
import hashlib
import json
import os
import sys
import tempfile
import threading
import types
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest import mock

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SERVICE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVICE_ROOT.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from lawbench import contracts  # noqa: E402
from lawbench.api import ui  # noqa: E402
from lawbench.case import documents, gate  # noqa: E402
from lawbench.errors import ApiError  # noqa: E402

CASE_A = "11111111-1111-4111-8111-111111111111"
CASE_B = "22222222-2222-4222-8222-222222222222"
TASK_A = "T-20261022040100-aaaa"
TASK_B = "T-20261022040200-bbbb"
NOW = "2026-10-22T04:10:00+08:00"
PARAMS = {"thinking": "中", "window": "64K", "max_tokens": 16384, "temperature": 0.6}
BUDGET = {"model_calls": 32, "tool_calls": 48, "minutes": 45}
OLD_CHECK = {"passed": True, "problems": [], "stats": {"citations": 9, "must_fix": 0, "hints": 0}}
OLD_COV = {
    "total": 1, "fully_read": [], "partially_read": [],
    "not_read": ["旧未读材料"], "unreadable": [],
}
NEW_COV = {
    "total": 2, "fully_read": ["新已读材料"],
    "partially_read": [{"name": "新部分材料", "read_units": 1, "total_units": 2}],
    "not_read": ["新未读材料"], "unreadable": [],
}


def _temporary_directory() -> tempfile.TemporaryDirectory[str]:
    """managed MXC 下使用仓库父目录内的独立临时根。"""
    return tempfile.TemporaryDirectory(prefix=".t32-document-save-", dir=REPO_ROOT)


def _file_state(path: Path) -> tuple[str, int, int]:
    info = path.stat()
    return hashlib.sha256(path.read_bytes()).hexdigest(), info.st_mtime_ns, info.st_size


def _run_sync_coroutine(coro):
    """所有 await 都指向立即完成的桩；managed MXC 禁止事件循环创建本地 socket。"""
    try:
        coro.send(None)
    except StopIteration as stopped:
        return stopped.value
    coro.close()
    raise RuntimeError("coroutine_suspended_without_event_loop")


def _load_draft_functions():
    """只编译 tools/drafts.py 中本次实际复用的函数，不导入真实 tools 包。"""
    source = (SERVICE_ROOT / "lawbench" / "tools" / "drafts.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    wanted = {"_citation_check", "merge_citations", "save_draft", "_save_locked", "save_document_ui"}
    body = [node for node in tree.body if isinstance(node, ast.ImportFrom) and node.module == "__future__"]
    body += [node for node in tree.body if isinstance(node, ast.FunctionDef) and node.name in wanted]
    module = ast.Module(body=body, type_ignores=[])
    ast.fix_missing_locations(module)

    class FakeMaterialSet:
        @staticmethod
        def from_case(_root, index):
            return index

    class Checks:
        @staticmethod
        def skill_kind(_dirs, _skill):
            return "analysis"

        @staticmethod
        def check_text(content, _materials, _kind):
            passed = content.startswith("PASS")
            return {
                "passed": passed,
                "problems": [],
                "stats": {"citations": 0, "must_fix": 0, "hints": int(not passed)},
            }, []

    Checks.MaterialSet = FakeMaterialSet

    class Logs:
        events: list[dict] = []

        @classmethod
        def event(cls, module, event, **fields):
            cls.events.append({"module": module, "event": event, **fields})

    namespace = {
        "__name__": "t32_extracted_drafts",
        "json": json,
        "time": __import__("time"),
        "gate": gate,
        "documents": documents,
        "checks": Checks,
        "logs": Logs,
        "contracts": contracts,
        "ApiError": ApiError,
        "IN_PROGRESS": "进行中.md",
    }
    exec(compile(module, "service/lawbench/tools/drafts.py", "exec"), namespace)
    namespace["Logs"] = Logs
    return types.SimpleNamespace(**namespace)


def _load_task_store_class():
    """从真实 task.py 提取保存路径需要的 TaskStore 方法；coverage 在用例内明确替换。"""
    source = (SERVICE_ROOT / "lawbench" / "case" / "task.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    task_class = next(node for node in tree.body if isinstance(node, ast.ClassDef) and node.name == "TaskStore")
    wanted = {
        "_write", "_read", "locate", "outputs", "list", "_close_stale",
        "next_draft_version", "result", "save_result", "task_lock", "rel",
    }
    methods = [node for node in task_class.body if isinstance(node, ast.FunctionDef) and node.name in wanted]
    extracted = ast.ClassDef(
        name="ExtractedTaskStore",
        bases=[],
        keywords=[],
        body=methods,
        decorator_list=[],
        type_params=[],
    )
    module = ast.Module(body=[extracted], type_ignores=[])
    ast.fix_missing_locations(module)

    class Logs:
        @staticmethod
        def event(*_args, **_kwargs):
            return None

    namespace = {
        "__name__": "t32_extracted_taskstore",
        "gate": gate,
        "contracts": contracts,
        "ApiError": ApiError,
        "re": __import__("re"),
        "os": os,
        "json": json,
        "time": __import__("time"),
        "threading": threading,
        "logs": Logs,
        "TASK_DIR": "工作区/任务",
        "OUTPUTS_REL": "成果/索引.json",
        "_VERSIONED": __import__("re").compile(r"^(.+)-v(\d+)\.(md|docx)$"),
    }
    exec(compile(module, "service/lawbench/case/task.py", "exec"), namespace)
    return namespace["ExtractedTaskStore"]


EXTRACTED_TASK_STORE = _load_task_store_class()
DRAFTS = _load_draft_functions()


class FakeCases:
    def __init__(self):
        self.roots: dict[str, str] = {}

    def add(self, case_id: str, root: Path) -> None:
        self.roots[case_id] = str(root)

    def recent(self) -> list[dict]:
        return [{"case_id": case_id} for case_id in self.roots]

    def root_of(self, case_id: str) -> str:
        if case_id not in self.roots:
            raise ApiError("CASE_NOT_FOUND", "case_not_found")
        return self.roots[case_id]


class ContractCase(unittest.TestCase):
    def setUp(self) -> None:
        self._temp = _temporary_directory()
        self.base = Path(self._temp.name)
        self.cases = FakeCases()
        self.store = object.__new__(EXTRACTED_TASK_STORE)
        self.store.cases = self.cases
        self.store._where = {}
        self.store._begun = {}
        self.store._task_locks = {}
        self.store._guard = threading.Lock()
        self.store._lock = threading.Lock()
        self.store.coverage_value = copy.deepcopy(NEW_COV)

        def coverage(_root, _case_id, _task_id):
            return copy.deepcopy(self.store.coverage_value)

        self.store.coverage = coverage

    def tearDown(self) -> None:
        self._temp.cleanup()

    def case(self, case_id: str, name: str) -> Path:
        root = self.base / name
        root.mkdir()
        self.cases.add(case_id, root)
        return root

    def write_json(self, root: Path, rel: str, data: dict, schema: str) -> None:
        contracts.validate(schema, "", data)
        gate.write_bytes(root, rel, json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"),
                         op="t32_seed")

    def seed_task(self, root: Path, task_id: str, case_id: str, state: str, status: str,
                  drafts: list[dict], *, usage=None) -> tuple[Path, Path]:
        task = {
            "v": 1, "task_id": task_id, "case_id": case_id, "kind": "agent",
            "session_id": "s_01HT32", "entry": None, "skill": "litigation-docs",
            "step": None, "inputs": [], "params": dict(PARAMS), "budget": dict(BUDGET),
            "state": state, "created_at": NOW,
        }
        result = {
            "v": 1, "task_id": task_id, "status": status,
            "usage": usage or {"model_calls": 4, "tool_calls": 7, "elapsed_s": 12},
            "drafts": copy.deepcopy(drafts), "citation_check": copy.deepcopy(OLD_CHECK),
            "coverage": copy.deepcopy(OLD_COV), "citations": [],
            "finished_at": NOW if state == "finished" else None,
        }
        task_rel = f"工作区/任务/{task_id}/task.json"
        result_rel = f"工作区/任务/{task_id}/result.json"
        self.write_json(root, task_rel, task, "files/task.schema.json")
        self.write_json(root, result_rel, result, "files/result.schema.json")
        return gate.resolve_internal(root, task_rel), gate.resolve_internal(root, result_rel)

    def write_source(self, root: Path, rel: str, content: str) -> Path:
        return gate.write_bytes(root, rel, content.encode("utf-8"), op="t32_source")

    def seed_output(self, root: Path, task_id: str, title: str, rel: str, version: int) -> Path:
        data = {
            "v": 1,
            "outputs": [{
                "title": title, "version": version,
                "files": [{"format": "md", "path": rel}],
                "task_id": task_id, "inputs": [], "citation_passed": True,
                "confirmed_at": NOW,
            }],
        }
        self.write_json(root, "成果/索引.json", data, "files/outputs_index.schema.json")
        return gate.resolve_internal(root, rel)

    def _materials(self):
        return types.SimpleNamespace(index=lambda _case_id: {"materials": []})

    def save(self, case_id: str, path: str, content: str) -> dict:
        return DRAFTS.save_document_ui(
            self.store, self._materials(), (), {"case_id": case_id, "path": path, "content": content})

    def test_two_sources_new_versions_and_old_state_preserved(self) -> None:
        root = self.case(CASE_A, "case-a")
        t1_rel = f"工作区/任务/{TASK_A}/草稿/登记标题-v1.md"
        t2_rel = f"工作区/任务/{TASK_A}/草稿/登记标题-v2.md"
        old1 = self.write_source(root, t1_rel, "OLD-V1")
        old2 = self.write_source(root, t2_rel, "OLD-V2")
        drafts = [
            {"title": "登记标题", "path": t1_rel, "version": 1},
            {"title": "登记标题", "path": t2_rel, "version": 2},
        ]
        task_json, result_json = self.seed_task(root, TASK_A, CASE_A, "finished", "completed", drafts)
        task_before = task_json.read_bytes()
        old_states = {old1: _file_state(old1), old2: _file_state(old2)}
        result_before = json.loads(result_json.read_text(encoding="utf-8"))

        first = self.save(CASE_A, t1_rel, "NEW-NOT-CHECKED")

        self.assertEqual(first["task_id"], TASK_A)
        self.assertEqual(first["version"], 3)
        self.assertEqual(first["path"], f"工作区/任务/{TASK_A}/草稿/登记标题-v3.md")
        self.assertFalse(first["citation_check"]["passed"])
        self.assertEqual(first["coverage"], NEW_COV)
        self.assertEqual(first["not_fully_read"], ["新部分材料", "新未读材料"])
        contracts.validate("api/documents_save.schema.json", "#/$defs/value", first)
        self.assertEqual(old_states[old1], _file_state(old1))
        self.assertEqual(old_states[old2], _file_state(old2))
        self.assertEqual(task_json.read_bytes(), task_before)
        result = self.store.result(str(root), TASK_A)
        self.assertEqual(result["drafts"][:2], result_before["drafts"])
        self.assertEqual(result["status"], result_before["status"])
        self.assertEqual(result["usage"], result_before["usage"])
        self.assertEqual(result["finished_at"], result_before["finished_at"])

        output_rel = "成果/成果登记标题-v1.md"
        output = self.write_source(root, output_rel, "CONFIRMED-MD")
        index = self.seed_output(root, TASK_A, "成果登记标题", output_rel, 1)
        output_file_state = _file_state(output)
        index_before = index.read_bytes()

        second = self.save(CASE_A, output_rel, "PASS output edit")

        self.assertEqual(second["task_id"], TASK_A)
        self.assertEqual(second["version"], 1)
        self.assertEqual(second["path"], f"工作区/任务/{TASK_A}/草稿/成果登记标题-v1.md")
        self.assertTrue(second["citation_check"]["passed"])
        self.assertEqual(output_file_state, _file_state(output))
        self.assertEqual(index_before, index.read_bytes())
        self.assertEqual(task_json.read_bytes(), task_before)
        print("CASE sources=draft-nonlatest,confirmed-output title-from-registry=true old-preserved=true")

    def test_running_pending_abnormal_and_result_running_have_no_side_effects(self) -> None:
        root = self.case(CASE_A, "unstable")
        rows = [
            (TASK_A, "running", "running"),
            ("T-20261022040300-cccc", "pending", "running"),
            ("T-20261022040400-dddd", "abnormal", "abnormal"),
            ("T-20261022040500-eeee", "finished", "running"),
        ]
        for tid, state, status in rows:
            with self.subTest(task_id=tid, state=state, status=status):
                rel = f"工作区/任务/{tid}/草稿/不稳定-v1.md"
                source = self.write_source(root, rel, "UNCHANGED")
                self.seed_task(root, tid, CASE_A, state, status,
                               [{"title": "不稳定", "path": rel, "version": 1}])
                before = _file_state(source)
                with self.assertRaises(ApiError) as raised:
                    self.save(CASE_A, rel, "MUST-NOT-WRITE")
                self.assertEqual(raised.exception.code, "TASK_NOT_FOUND")
                self.assertEqual(before, _file_state(source))
                self.assertFalse(any((root / "工作区" / "任务" / tid / "草稿").glob("不稳定-v2.md")))
        print("CASE unstable-states running,pending,abnormal,result-running rejected=true side-effects=false")

    def test_source_locate_never_closes_an_unrelated_expired_task(self) -> None:
        scenarios = (
            ("finished", f"工作区/任务/{TASK_A}/草稿/正常来源-v1.md"),
            ("unregistered", f"工作区/任务/{TASK_A}/草稿/未登记-v1.md"),
        )
        for label, path in scenarios:
            with self.subTest(label=label):
                root = self.case(CASE_A, f"readonly-locate-{label}")
                if label == "finished":
                    self.write_source(root, path, "OLD")
                    self.seed_task(root, TASK_A, CASE_A, "finished", "completed",
                                   [{"title": "正常来源", "path": path, "version": 1}])

                stale_rel = f"工作区/任务/{TASK_B}/草稿/无关运行稿-v1.md"
                self.write_source(root, stale_rel, "RUNNING-UNCHANGED")
                stale_task, stale_result = self.seed_task(
                    root, TASK_B, CASE_A, "running", "running", [])
                os.utime(stale_result, (946684800, 946684800))
                stale_task_before = stale_task.read_bytes()
                stale_result_before = stale_result.read_bytes()
                stale_files_before = sorted(p.name for p in stale_task.parent.rglob("*"))

                if label == "finished":
                    saved = self.save(CASE_A, path, "PASS new")
                    self.assertEqual(saved["task_id"], TASK_A)
                else:
                    with self.assertRaises(ApiError) as raised:
                        self.save(CASE_A, path, "MUST-NOT-WRITE")
                    self.assertEqual(raised.exception.code, "INVALID_ARGUMENT")

                self.assertEqual(stale_task.read_bytes(), stale_task_before)
                self.assertEqual(stale_result.read_bytes(), stale_result_before)
                self.assertEqual(json.loads(stale_result.read_text(encoding="utf-8"))["status"], "running")
                self.assertEqual(json.loads(stale_task.read_text(encoding="utf-8"))["state"], "running")
                self.assertEqual(sorted(p.name for p in stale_task.parent.rglob("*")), stale_files_before)
        print("CASE readonly-locate finished-save,unregistered-reject=true unrelated-expired-unchanged=true")

    def test_draft_path_task_must_match_its_registered_result(self) -> None:
        for state, status in (("running", "running"), ("finished", "completed")):
            with self.subTest(path_task_state=state):
                root = self.case(CASE_A, f"binding-{state}")
                a_rel = f"工作区/任务/{TASK_A}/草稿/甲稿-v1.md"
                b_rel = f"工作区/任务/{TASK_B}/草稿/乙稿-v1.md"
                a_source = self.write_source(root, a_rel, "A-OLD")
                b_source = self.write_source(root, b_rel, "B-OLD")
                a_task, a_result = self.seed_task(
                    root, TASK_A, CASE_A, "finished", "completed",
                    [{"title": "甲稿", "path": a_rel, "version": 1},
                     {"title": "乙稿", "path": b_rel, "version": 1}])
                b_task, b_result = self.seed_task(
                    root, TASK_B, CASE_A, state, status, [])
                before = {
                    "task_a": a_task.read_bytes(), "result_a": a_result.read_bytes(),
                    "task_b": b_task.read_bytes(), "result_b": b_result.read_bytes(),
                    "source_a": _file_state(a_source), "source_b": _file_state(b_source),
                    "files_a": sorted(p.name for p in a_task.parent.rglob("*")),
                    "files_b": sorted(p.name for p in b_task.parent.rglob("*")),
                }

                with self.assertRaises(ApiError) as raised:
                    self.save(CASE_A, b_rel, "MUST-NOT-WRITE")

                self.assertEqual(raised.exception.code, "INVALID_ARGUMENT")
                self.assertEqual(a_task.read_bytes(), before["task_a"])
                self.assertEqual(a_result.read_bytes(), before["result_a"])
                self.assertEqual(b_task.read_bytes(), before["task_b"])
                self.assertEqual(b_result.read_bytes(), before["result_b"])
                self.assertEqual(_file_state(a_source), before["source_a"])
                self.assertEqual(_file_state(b_source), before["source_b"])
                self.assertEqual(sorted(p.name for p in a_task.parent.rglob("*")), before["files_a"])
                self.assertEqual(sorted(p.name for p in b_task.parent.rglob("*")), before["files_b"])
        print("CASE draft-binding path-task=registered-task=true running,finished-rejected side-effects=false")

    def test_lock_recheck_rejects_path_task_disagreement(self) -> None:
        root = self.case(CASE_A, "binding-lock")
        a_rel = f"工作区/任务/{TASK_A}/草稿/甲稿-v1.md"
        b_rel = f"工作区/任务/{TASK_B}/草稿/乙稿-v1.md"
        self.write_source(root, a_rel, "A-OLD")
        b_source = self.write_source(root, b_rel, "B-OLD")
        a_task, a_result = self.seed_task(
            root, TASK_A, CASE_A, "finished", "completed",
            [{"title": "乙稿", "path": b_rel, "version": 1}])
        b_task, b_result = self.seed_task(root, TASK_B, CASE_A, "finished", "completed", [])
        snapshot = {
            "task_a": a_task.read_bytes(), "result_a": a_result.read_bytes(),
            "task_b": b_task.read_bytes(), "result_b": b_result.read_bytes(),
            "source_b": _file_state(b_source),
            "files_a": sorted(p.name for p in a_task.parent.rglob("*")),
            "files_b": sorted(p.name for p in b_task.parent.rglob("*")),
        }
        forged_source = {
            "case_id": CASE_A, "kind": "draft", "task_id": TASK_A,
            "title": "乙稿", "version": 1, "path": b_rel, "root": str(root),
        }

        with self.store.task_lock(TASK_A):
            with self.assertRaises(ApiError) as raised:
                documents.recheck_stable_source(self.store, forged_source)

        self.assertEqual((raised.exception.code, raised.exception.reason),
                         ("INVALID_ARGUMENT", "source_changed"))
        self.assertEqual(a_task.read_bytes(), snapshot["task_a"])
        self.assertEqual(a_result.read_bytes(), snapshot["result_a"])
        self.assertEqual(b_task.read_bytes(), snapshot["task_b"])
        self.assertEqual(b_result.read_bytes(), snapshot["result_b"])
        self.assertEqual(_file_state(b_source), snapshot["source_b"])
        self.assertEqual(sorted(p.name for p in a_task.parent.rglob("*")), snapshot["files_a"])
        self.assertEqual(sorted(p.name for p in b_task.parent.rglob("*")), snapshot["files_b"])
        print("CASE lock-recheck forged-source-task rejected=true side-effects=false")

    def test_invalid_cross_case_and_unregistered_sources_are_rejected(self) -> None:
        root_a = self.case(CASE_A, "shape-a")
        root_b = self.case(CASE_B, "shape-b")
        rel_b = f"工作区/任务/{TASK_B}/草稿/乙案-v1.md"
        self.write_source(root_b, rel_b, "B")
        self.seed_task(root_b, TASK_B, CASE_B, "finished", "completed",
                       [{"title": "乙案", "path": rel_b, "version": 1}])

        bad_paths = [
            "D:/案件/x.md",
            "工作区\\任务\\x.md",
            f"工作区/任务/{TASK_A}/草稿/../x.md",
            "成果/子目录/x.md",
            f"工作区/任务/{TASK_A}/草稿/x.json",
            "工作区/wiki/x.md",
            "原件/借条.md",
            f"工作区/任务/{TASK_A}/草稿/未登记.md",
            rel_b,
        ]
        for path in bad_paths:
            with self.subTest(path=path):
                with self.assertRaises(ApiError) as raised:
                    self.save(CASE_A, path, "x")
                self.assertEqual(raised.exception.code, "INVALID_ARGUMENT")

        missing_rel = f"工作区/任务/{TASK_A}/草稿/登记但缺失-v1.md"
        self.seed_task(root_a, TASK_A, CASE_A, "finished", "completed",
                       [{"title": "伪装来源", "path": missing_rel, "version": 1}])
        with self.assertRaises(ApiError) as raised:
            self.save(CASE_A, missing_rel, "x")
        self.assertEqual((raised.exception.code, raised.exception.reason),
                         ("INVALID_ARGUMENT", "source_not_file"))
        print("CASE invalid-source cross-case,shapes,unregistered,missing rejected=true")

    def test_ai_finished_guard_and_ui_lock_boundary(self) -> None:
        root = self.case(CASE_A, "guards")
        rel = f"工作区/任务/{TASK_A}/草稿/已结束-v1.md"
        source = self.write_source(root, rel, "OLD")
        task = self.seed_task(root, TASK_A, CASE_A, "finished", "completed",
                              [{"title": "已结束", "path": rel, "version": 1}])[0]
        task_data = self.store.locate(TASK_A)[2]
        ctx = types.SimpleNamespace(
            root=str(root), case_id=CASE_A, task=task_data, tasks=self.store,
            materials=self._materials(), skills_dirs=(),
            index=lambda: {"materials": []},
        )
        before = sorted(path.name for path in source.parent.iterdir())

        with self.assertRaises(ApiError) as raised:
            DRAFTS.save_draft(ctx, {"title": "AI迟到", "content": "x"})

        self.assertEqual((raised.exception.code, raised.exception.reason),
                         ("TASK_NOT_FOUND", "not_running"))
        self.assertEqual(sorted(path.name for path in source.parent.iterdir()), before)
        self.assertTrue(task.exists())
        print("CASE ai-finished rejected=true ui-finished-allowed-by-separate-path=true no-write=true")

    def test_same_task_concurrent_saves_get_distinct_versions(self) -> None:
        root = self.case(CASE_A, "concurrent")
        rel = f"工作区/任务/{TASK_A}/草稿/并发-v1.md"
        source = self.write_source(root, rel, "V1")
        _, result_path = self.seed_task(root, TASK_A, CASE_A, "finished", "completed",
                                        [{"title": "并发", "path": rel, "version": 1}])
        before = _file_state(source)

        with ThreadPoolExecutor(max_workers=2) as pool:
            futures = [
                pool.submit(self.save, CASE_A, rel, f"PASS concurrent-{index}")
                for index in range(2)
            ]
            saved = [future.result() for future in futures]

        self.assertEqual(sorted(item["version"] for item in saved), [2, 3])
        self.assertEqual(len({item["path"] for item in saved}), 2)
        self.assertEqual(before, _file_state(source))
        result = json.loads(result_path.read_text(encoding="utf-8"))
        self.assertEqual(sorted(d["version"] for d in result["drafts"]), [1, 2, 3])
        print("CASE concurrency same-task saves=2 versions=2,3 collision=false old-preserved=true")

    def test_write_and_metadata_failures_never_return_success_or_remove_old(self) -> None:
        root = self.case(CASE_A, "failures")
        rel = f"工作区/任务/{TASK_A}/草稿/失败-v1.md"
        source = self.write_source(root, rel, "OLD")
        _, result_path = self.seed_task(root, TASK_A, CASE_A, "finished", "completed",
                                        [{"title": "失败", "path": rel, "version": 1}])
        old_state = _file_state(source)
        old_result = result_path.read_bytes()
        expected = gate.resolve_write(root, f"工作区/任务/{TASK_A}/草稿/失败-v2.md", op="t32_probe")

        with mock.patch.object(gate, "write_bytes", side_effect=OSError("injected write failure")):
            with self.assertRaises(OSError):
                self.save(CASE_A, rel, "PASS new")
        self.assertFalse(expected.exists())
        self.assertEqual(old_state, _file_state(source))
        self.assertEqual(old_result, result_path.read_bytes())

        with mock.patch.object(self.store, "save_result", side_effect=OSError("injected metadata failure")):
            with self.assertRaises(OSError):
                self.save(CASE_A, rel, "PASS new")
        self.assertFalse(expected.exists())
        self.assertEqual(old_state, _file_state(source))
        self.assertEqual(old_result, result_path.read_bytes())
        print("CASE failures write,metadata propagated=true new-rolled-back=true old-preserved=true")

    def test_contracts_and_examples_reject_unknown_fields(self) -> None:
        req = {
            "case_id": CASE_A,
            "path": f"工作区/任务/{TASK_A}/草稿/契约-v1.md",
            "content": "正文",
        }
        res = {
            "ok": True,
            "value": {
                "task_id": TASK_A,
                "path": f"工作区/任务/{TASK_A}/草稿/契约-v2.md",
                "version": 2,
                "citation_check": OLD_CHECK,
                "coverage": NEW_COV,
                "not_fully_read": ["新部分材料", "新未读材料"],
            },
        }
        self.assertFalse(contracts.errors("api/documents_save.schema.json", "#/$defs/request", req))
        self.assertFalse(contracts.errors("api/documents_save.schema.json", "#/$defs/response", res))
        self.assertTrue(contracts.errors("api/documents_save.schema.json", "#/$defs/request",
                                         {**req, "task_id": TASK_A}))
        self.assertTrue(contracts.errors("api/documents_save.schema.json", "#/$defs/request",
                                         {"case_id": CASE_A, "path": req["path"]}))
        contracts.validate("api/documents_save.schema.json", "#/$defs/response", res)
        print("CASE contracts request,response,examples valid=true unknown-field-rejected=true")

    def test_real_ui_route_asgi_with_fake_state(self) -> None:
        calls: list[dict] = []
        value = {
            "task_id": TASK_A,
            "path": f"工作区/任务/{TASK_A}/草稿/路由-v2.md",
            "version": 2,
            "citation_check": OLD_CHECK,
            "coverage": NEW_COV,
            "not_fully_read": ["新部分材料", "新未读材料"],
        }

        def fake_save(_tasks, _materials, _skills, data):
            calls.append(copy.deepcopy(data))
            return copy.deepcopy(value)

        package = types.ModuleType("lawbench.tools")
        package.__path__ = []
        module = types.ModuleType("lawbench.tools.drafts")
        module.save_document_ui = fake_save
        package.drafts = module
        st = types.SimpleNamespace(
            config=types.SimpleNamespace(validate_responses=True, skills_dirs=()),
            tasks=object(), materials=object(),
        )

        class FakeRequest:
            path_params: dict = {}

            def __init__(self, payload: dict):
                self.payload = payload

            async def body(self) -> bytes:
                return json.dumps(self.payload, ensure_ascii=False).encode("utf-8")

        async def direct_threadpool(fn, data):
            return fn(data)

        sys.modules["lawbench.tools"] = package
        sys.modules["lawbench.tools.drafts"] = module
        try:
            route = next(route for route in ui.routes(st) if route.path == "/api/documents/save")

            valid = {
                "case_id": CASE_A,
                "path": f"工作区/任务/{TASK_A}/草稿/路由-v1.md",
                "content": "PASS via route",
            }
            with mock.patch.object(ui, "run_in_threadpool", direct_threadpool):
                response = _run_sync_coroutine(route.endpoint(FakeRequest(valid)))
                self.assertEqual(response.status_code, 200)
                self.assertEqual(json.loads(response.body), {"ok": True, "value": value})
                with self.assertRaises(ApiError) as raised:
                    _run_sync_coroutine(route.endpoint(FakeRequest({**valid, "unknown": True})))
            self.assertEqual(raised.exception.code, "INVALID_ARGUMENT")
            self.assertEqual(calls, [valid])
        finally:
            sys.modules.pop("lawbench.tools.drafts", None)
            sys.modules.pop("lawbench.tools", None)
        print("CASE ui-route endpoint=_endpoint Route=true fakeState=true contract=true "
              "unknown-rejected=true event-loop=false(mxc-denied)")

    def test_import_boundary_has_no_forbidden_products(self) -> None:
        forbidden = (
            "lawbench.tools", "lawbench.case.task", "lawbench.checks",
            "lawbench.case.materials", "lawbench.ingest", "lawbench.case.registry",
            "lawbench.search", "lawbench.app",
        )
        loaded = [name for name in forbidden if name in sys.modules]
        self.assertEqual(loaded, [])
        print("CASE import-boundary forbidden=0 lifespan=false network=false")


if __name__ == "__main__":
    unittest.main(verbosity=2)
