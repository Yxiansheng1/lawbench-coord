"""T18 合同审查比率倍数写前保护的有限独立回归测试。

只抽取 drafts.py 中的实际保护和保存函数，在私有临时目录里用桩验证；
不启动应用、不导入完整 tools 包、不访问模型或网络。
"""
from __future__ import annotations

import ast
import contextlib
import copy
import json
import re
import sys
import tempfile
import types
import unittest
from decimal import Decimal, InvalidOperation
from fractions import Fraction
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SERVICE_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = SERVICE_ROOT.parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from lawbench.errors import ApiError  # noqa: E402

CASE_ID = "11111111-1111-4111-8111-111111111111"
TASK_ID = "T-20261028194123-b18b"
TITLE = "比率回归"
COVERAGE = {
    "total": 1, "fully_read": [], "partially_read": [],
    "not_read": ["合成材料"], "unreadable": [],
}
CHECK = {"passed": True, "problems": [], "stats": {"citations": 1, "must_fix": 0, "hints": 0}}
RED_CONTENT = (
    "- 问题：乙方逾期交货违约金为千分之一/日，甲方逾期付款违约金为万分之五/日，"
    "前者是后者的二十倍，双方权利义务明显不对等。"
)
DIRECT_RED_CONTENT = (
    "- 问题：逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍。"
    "虽然对我方（采购方）有利，但可能被对方主张显失公平。"
)


def _temporary_directory() -> tempfile.TemporaryDirectory[str]:
    """managed MXC 下把测试私有文件限制在仓库内短路径。"""
    return tempfile.TemporaryDirectory(prefix=".t18-rate-ratio-", dir=REPO_ROOT)


def _load_drafts():
    """只编译比率辅助函数、引用合并与 _save_locked，不导入 tools 包。"""
    source = (SERVICE_ROOT / "lawbench" / "tools" / "drafts.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    function_names = {
        "_exact_number", "_rate_unit", "_segment_rates", "_fraction_text",
        "_rate_ratio_mismatch", "merge_citations", "_save_locked", "save_document_ui",
    }
    constant_names = {
        "_CN_DIGITS", "_RATE_TOKEN_RE", "_PERCENT_TOKEN_RE", "_RATIO_CLAIM_RE",
        "_DIRECT_RATIO_BRIDGE_RE", "_DIRECT_RATIO_CLAIM_RE",
        "_NONASSERTION_QUOTE_RE",
    }
    body = [node for node in tree.body
            if isinstance(node, ast.ImportFrom) and node.module == "__future__"]
    body += [
        node for node in tree.body
        if isinstance(node, ast.FunctionDef) and node.name in function_names
    ]
    body += [
        node for node in tree.body
        if isinstance(node, ast.Assign)
        and any(isinstance(target, ast.Name) and target.id in constant_names
                for target in node.targets)
    ]
    module = ast.Module(body=body, type_ignores=[])
    ast.fix_missing_locations(module)
    namespace = {
        "__name__": "t18_extracted_drafts",
        "json": json,
        "re": re,
        "Fraction": Fraction,
        "Decimal": Decimal,
        "InvalidOperation": InvalidOperation,
        "ApiError": ApiError,
        "IN_PROGRESS": "进行中.md",
    }
    loaded = types.ModuleType("t18_extracted_drafts")
    loaded.__dict__.update(namespace)
    exec(compile(module, "service/lawbench/tools/drafts.py", "exec"), loaded.__dict__)
    return loaded


DRAFTS = _load_drafts()


class FakeGate:
    def __init__(self, root: Path):
        self.root = root
        self.events: list[tuple] = []

    def resolve_write(self, _root: str, rel: str, *, op: str) -> Path:
        self.events.append(("resolve_write", rel, op))
        return self.root / rel

    def write_bytes(self, _root: str, rel: str, data: bytes, *, op: str) -> Path:
        self.events.append(("write", rel, op))
        path = self.root / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
        return path

    def delete_work_file(self, _root: str, rel: str, *, op: str) -> None:
        self.events.append(("delete", rel, op))
        path = self.root / rel
        if path.exists():
            path.unlink()


class FakeTasks:
    def __init__(self):
        self.events: list[tuple] = []
        self.result_data = {
            "drafts": [],
            "citations": [],
            "citation_check": {"passed": False, "problems": [], "stats": {}},
            "coverage": copy.deepcopy(COVERAGE),
        }
        self.fail_save_result = False

    def rel(self, task_id: str, kind: str) -> str:
        self.events.append(("rel", task_id, kind))
        return f"工作区/任务/{task_id}/{kind}"

    def next_draft_version(self, _root: str, _title: str, _suffix: str) -> int:
        self.events.append(("next_version",))
        return 2

    def result(self, _root: str, task_id: str) -> dict:
        self.events.append(("result", task_id))
        return copy.deepcopy(self.result_data)

    def save_result(self, _root: str, result: dict) -> None:
        self.events.append(("save_result",))
        if self.fail_save_result:
            raise OSError("injected metadata failure")
        self.result_data = copy.deepcopy(result)

    def coverage(self, _root: str, _case_id: str, _task_id: str) -> dict:
        self.events.append(("coverage",))
        return copy.deepcopy(COVERAGE)

    @contextlib.contextmanager
    def task_lock(self, task_id: str):
        self.events.append(("lock", task_id))
        yield

    def index_for_task(self, _task: dict) -> dict:
        return {"materials": []}


class Environment:
    def __init__(self, skill: str = "contract-review"):
        self.temp = _temporary_directory()
        self.root = Path(self.temp.name)
        self.task = {
            "task_id": TASK_ID,
            "case_id": CASE_ID,
            "skill": skill,
            "state": "running",
        }
        self.tasks = FakeTasks()
        self.gate = FakeGate(self.root)
        DRAFTS.gate = self.gate
        DRAFTS.documents = types.SimpleNamespace(
            locate_source=self._locate_source,
            recheck_stable_source=self._recheck_source,
        )
        DRAFTS.contracts = types.SimpleNamespace(errors=lambda *_args: False)
        DRAFTS._citation_check = lambda *_args: (copy.deepcopy(CHECK), [])
        DRAFTS.logs = types.SimpleNamespace(event=lambda *_args, **_kwargs: None)

    def _locate_source(self, _tasks, case_id: str, path: str) -> dict:
        return {
            "case_id": case_id,
            "task_id": TASK_ID,
            "title": TITLE,
            "version": 1,
            "path": path,
            "kind": "draft",
        }

    def _recheck_source(self, _tasks, _source: dict) -> tuple[str, dict]:
        return str(self.root), self.task

    def save(self, content: str) -> dict:
        return DRAFTS._save_locked(
            self.tasks, str(self.root), CASE_ID, self.task, TITLE, content,
            check_fn=lambda: (copy.deepcopy(CHECK), []),
            coverage_fn=lambda: copy.deepcopy(COVERAGE),
        )

    def save_ui(self, content: str) -> dict:
        return DRAFTS.save_document_ui(
            self.tasks, object(), (), {
                "case_id": CASE_ID,
                "path": f"工作区/任务/{TASK_ID}/草稿/{TITLE}-v1.md",
                "content": content,
            },
        )

    def cleanup(self) -> None:
        self.temp.cleanup()


class RateRatioGuardTests(unittest.TestCase):
    def environment(self, skill: str = "contract-review") -> Environment:
        env = Environment(skill)
        self.addCleanup(env.cleanup)
        return env

    def assert_blocked(self, env: Environment, content: str) -> None:
        with self.assertRaises(ApiError) as raised:
            env.save(content)
        self.assertEqual((raised.exception.code, raised.exception.reason),
                         ("INVALID_ARGUMENT", "rate_ratio_mismatch"))
        detail = raised.exception.detail or ""
        self.assertIn("1/1000/日", detail)
        self.assertIn("1/2000/日", detail)
        self.assertIn("准确倍数为2倍", detail)
        self.assertIn("草稿表述为20倍", detail)
        self.assertLessEqual(len(detail), 240)

    def test_actual_reported_sentence_is_rejected_before_any_save_mutation(self) -> None:
        env = self.environment()
        self.assert_blocked(env, RED_CONTENT)
        self.assertEqual(env.tasks.events, [])
        self.assertEqual(env.gate.events, [])
        self.assertFalse((env.root / "工作区").exists())
        print("CASE actual-red rejected=true exact=1/1000,5/10000,2,20 side-effects=false")

    def test_actual_direct_subject_sentence_is_rejected_before_save_and_ui(self) -> None:
        env = self.environment()
        self.assert_blocked(env, DIRECT_RED_CONTENT)
        self.assertEqual(env.tasks.events, [])
        self.assertEqual(env.gate.events, [])
        self.assertFalse((env.root / "工作区").exists())

        chinese = self.environment()
        self.assert_blocked(chinese, DIRECT_RED_CONTENT.replace("的20倍", "的二十倍"))
        self.assertEqual(chinese.tasks.events, [])
        self.assertEqual(chinese.gate.events, [])

        corrected = self.environment()
        saved = corrected.save(DIRECT_RED_CONTENT.replace("的20倍", "的2倍"))
        self.assertEqual(saved["version"], 2)
        self.assertIn(("save_result",), corrected.tasks.events)

        ui = self.environment()
        with self.assertRaises(ApiError) as raised:
            ui.save_ui(DIRECT_RED_CONTENT)
        self.assertEqual(raised.exception.reason, "rate_ratio_mismatch")
        self.assertFalse(any(event[0] in {"next_version", "resolve_write", "write", "save_result"}
                             for event in ui.tasks.events + ui.gate.events))
        print("CASE direct-actual rejected=true chinese20=true corrected2=saved "
              "save-ui-before-mutation=true")

    def test_direct_subject_direction_and_bracket_variants_use_exact_positions(self) -> None:
        corrected = self.environment()
        reversed_correct = (
            "- 逾期付款违约金（万分之五/日）是逾期交货违约金（千分之一/日）的0.5倍。"
        )
        saved = corrected.save(reversed_correct)
        self.assertEqual(saved["version"], 2)

        ascii_brackets = self.environment()
        saved = ascii_brackets.save(
            "- 逾期交货违约金 (千分之一/日) 是逾期付款违约金 (万分之五/日) 的2倍。"
        )
        self.assertEqual(saved["version"], 2)

        direct_rates = self.environment()
        saved = direct_rates.save("- 千分之一/日 为 万分之五/日 的2倍。")
        self.assertEqual(saved["version"], 2)

        reversed_wrong = self.environment()
        with self.assertRaises(ApiError) as raised:
            reversed_wrong.save(
                "- 逾期付款违约金（万分之五/日）是逾期交货违约金（千分之一/日）的2倍。"
            )
        self.assertEqual((raised.exception.code, raised.exception.reason),
                         ("INVALID_ARGUMENT", "rate_ratio_mismatch"))
        detail = raised.exception.detail or ""
        self.assertIn("准确倍数为1/2倍", detail)
        self.assertIn("草稿表述为2倍", detail)
        self.assertLessEqual(len(detail), 240)
        print("CASE direct-direction exact=true reversed-correct=accepted "
              "reversed-wrong=rejected ascii-brackets=accepted direct-rates=accepted")

    def test_direct_subject_nonassertions_and_unbound_rates_are_not_blocked(self) -> None:
        controls = (
            ("quoted", "- 原文：「逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍。」"),
            ("question", "- 逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍？"),
            ("hypothetical", "- 如果逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍。"),
            ("negation", "- 并非逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍。"),
            ("third-rate", "- 逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）另约万分之三/日，"
                           "前两项为20倍。"),
            ("unmatched-subject", "- 逾期交货违约金（千分之一/日），逾期付款违约金（万分之五/日），"
                                  "合同金额为20倍。"),
            ("unit-mismatch", "- 逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/月）的20倍。"),
        )
        for label, content in controls:
            with self.subTest(label=label):
                env = self.environment()
                saved = env.save(content)
                self.assertEqual(saved["version"], 2)
                self.assertIn(("save_result",), env.tasks.events)
        print("CASE direct-negative-controls quote,question,hypothetical,negation,"
              "third-rate,unmatched-subject,unit-mismatch=unchanged")

    def test_corrected_ratio_other_skill_and_ui_share_the_write_seam(self) -> None:
        env = self.environment()
        saved = env.save(RED_CONTENT.replace("二十倍", "二倍"))
        self.assertEqual(saved["version"], 2)
        self.assertEqual(env.tasks.result_data["drafts"][0]["title"], TITLE)
        self.assertIn(("write", f"工作区/任务/{TASK_ID}/草稿/{TITLE}-v2.md", "save_draft"),
                      env.gate.events)
        self.assertIn(("save_result",), env.tasks.events)
        self.assertIn(("delete", f"工作区/任务/{TASK_ID}/草稿/进行中.md", "save_draft"),
                      env.gate.events)

        other = self.environment(skill="litigation-docs")
        other_saved = other.save(RED_CONTENT)
        self.assertEqual(other_saved["version"], 2)
        self.assertIn(("save_result",), other.tasks.events)

        ui = self.environment()
        with self.assertRaises(ApiError) as raised:
            ui.save_ui(RED_CONTENT)
        self.assertEqual(raised.exception.reason, "rate_ratio_mismatch")
        self.assertNotIn("next_version", [event[0] for event in ui.tasks.events])
        self.assertFalse(any(event[0] in {"resolve_write", "write"} for event in ui.gate.events))

        ui_positive = self.environment()
        ui_saved = ui_positive.save_ui(RED_CONTENT.replace("二十倍", "二倍"))
        self.assertEqual(ui_saved["task_id"], TASK_ID)
        self.assertEqual(ui_saved["version"], 2)
        self.assertIn(("write", f"工作区/任务/{TASK_ID}/草稿/{TITLE}-v2.md", "save_draft"),
                      ui_positive.gate.events)
        self.assertIn(("save_result",), ui_positive.tasks.events)
        print("CASE corrected=save other-skill=unchanged ui-shared=guard-before-write ui-corrected=saved")

    def test_exact_arabic_percentage_chinese_and_reversed_ratio_are_accepted(self) -> None:
        cases = (
            "- 前者为0.1%，后者为0.05%，前者是后者的2倍。",
            "- 前者百分之十，后者百分之五，前者是后者的两倍。",
            "- 前者万分之五/日，后者千分之一/日，后者为前者的二倍。",
        )
        for index, content in enumerate(cases):
            with self.subTest(index=index):
                env = self.environment()
                saved = env.save(content)
                self.assertEqual(saved["version"], 2)
                self.assertIn(("save_result",), env.tasks.events)
        print("CASE exact-percent arabic,chinese reversed=accepted")

    def test_quotes_code_ambiguity_question_negation_units_and_unsupported_forms_are_not_blocked(self) -> None:
        controls = (
            ("quoted", "- 原文：「前者千分之一/日，后者万分之五/日，前者是后者的二十倍。」"),
            ("inline-code", "- 示例：`前者千分之一/日，后者万分之五/日，前者是后者的二十倍。`"),
            ("fence", "```text\n前者千分之一/日，后者万分之五/日，前者是后者的二十倍。\n```"),
            ("blockquote", "> 前者千分之一/日，后者万分之五/日，前者是后者的二十倍。"),
            ("third-rate", "前者千分之一/日，后者万分之五/日，另约万分之三/日，前者是后者的二十倍。"),
            ("question", "前者千分之一/日，后者万分之五/日，前者是后者的二十倍？"),
            ("negation", "前者千分之一/日，后者万分之五/日，前者不是后者的二十倍。"),
            ("hypothetical", "如果前者千分之一/日，后者万分之五/日，前者是后者的二十倍。"),
            ("unit-mismatch", "前者千分之一/日，后者万分之五/月，前者是后者的二十倍。"),
            ("zero-rate", "前者千分之零/日，后者万分之五/日，前者是后者的二十倍。"),
            ("unsupported-chinese", "前者千分之一百/日，后者万分之五/日，前者是后者的二十倍。"),
            ("unsupported-embedded-rate", "前者千分之一/日，后者十万分之一/日，前者是后者的二十倍。"),
            ("oversized-percent", "前者0.1%/日，后者1234567%/日，前者是后者的二十倍。"),
            ("signed-percent", "前者0.1%/日，后者-0.05%/日，前者是后者的二十倍。"),
            ("claim-before-rates", "前者是后者的二十倍，前者千分之一/日，后者万分之五/日。"),
        )
        for label, content in controls:
            with self.subTest(label=label):
                env = self.environment()
                saved = env.save(content)
                self.assertEqual(saved["version"], 2)
                self.assertIn(("save_result",), env.tasks.events)
        print("CASE negative-controls quoted,code,blockquote,ambiguous,question,negation,"
              "hypothetical,units,zero,unsupported,embedded,oversized,signed,order=unchanged")

    def test_existing_metadata_rollback_semantics_remain(self) -> None:
        env = self.environment()
        env.tasks.fail_save_result = True
        rel = f"工作区/任务/{TASK_ID}/草稿/{TITLE}-v2.md"
        with self.assertRaises(OSError):
            env.save(RED_CONTENT.replace("二十倍", "二倍"))
        self.assertIn(("write", rel, "save_draft"), env.gate.events)
        self.assertIn(("delete", rel, "save_draft_rollback"), env.gate.events)
        self.assertFalse((env.root / rel).exists())
        self.assertNotIn(("delete", f"工作区/任务/{TASK_ID}/草稿/进行中.md", "save_draft"),
                         env.gate.events)
        print("CASE metadata-failure rollback=true progress-untouched=true")


if __name__ == "__main__":
    unittest.main(verbosity=2)
