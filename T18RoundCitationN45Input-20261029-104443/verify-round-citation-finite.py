"""T18 圆括号出处格式缺口：旧快照基线与新源码有限验证。

只使用 checks 的 parse/check_text/MaterialSet；不启动应用、任务、模型或网络。
本脚本由主编排复核源码后运行。
"""
from __future__ import annotations

import hashlib
import importlib.util
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent
SNAPSHOT = Path(r"D:\Lawbeach\lawbench-coord\T18RoundCitationInput-20261029-103639")
SNAPSHOT_HASHES = {
    "parse.py": "3fd25b61a965abe5432b8d301448517dea003d77739f45a0331bbbf07fa123bc",
    "citations.py": "6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412",
}
ACTUAL_E = {
    "（价格认定结论书 第8行）",
    "（扣押清单 第7行）",
    "（被告人李某乙讯问笔录（第一次） 第18行、被告人李某乙讯问笔录（第二次） 第14行）",
    "（被告人李某乙讯问笔录（第一次） 第14行）",
    "（被告人李某乙讯问笔录（第二次） 第10行）",
    "（监控视频截图说明 第7行、第8行）",
    "（被告人李某乙讯问笔录（第一次） 第16行）",
    "（被告人李某乙讯问笔录（第二次） 第12行）",
}


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec is not None and spec.loader is not None, path
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


def _old_checks():
    """在当前进程里仅替换 checks.parse 后加载冻结 citations，再恢复新模块。"""
    import lawbench.checks as package

    current_parse = sys.modules["lawbench.checks.parse"]
    old_parse = _load_module("lawbench.checks.parse", SNAPSHOT / "parse.py")
    package.parse = old_parse
    try:
        old_citations = _load_module("lawbench.checks.citations_snapshot", SNAPSHOT / "citations.py")
    finally:
        sys.modules["lawbench.checks.parse"] = current_parse
        package.parse = current_parse
    return old_parse, old_citations


def _materials(material_set_class, names: list[str]):
    return material_set_class.from_texts([
        {"name": name, "material_id": f"M{i:04d}", "sha256": f"{i:064x}",
         "unit": "line", "text": None}
        for i, name in enumerate(names, 1)
    ])


def _e(check: dict) -> list[dict]:
    return [problem for problem in check["problems"] if problem["class"] == "E"]


def _non_e(check: dict) -> list[tuple]:
    return [
        (p["class"], p["severity"], p["excerpt"], p["citation"], p["message"])
        for p in check["problems"] if p["class"] != "E"
    ]


def _expect_e(check: dict, raws: set[str]) -> None:
    problems = _e(check)
    assert {p["citation"] for p in problems} == raws, problems
    assert len(problems) == len(raws), problems
    assert all(p["severity"] == "must_fix" for p in problems), problems
    assert not check["passed"], check


def main() -> None:
    for filename, expected in SNAPSHOT_HASHES.items():
        actual = _sha256(SNAPSHOT / filename)
        assert actual == expected, f"{filename}: {actual} != {expected}"

    repo = next(p for p in HERE.parents if (p / "service" / "lawbench").is_dir())
    sys.path.insert(0, str(repo / "service"))

    from lawbench.checks.citations import check_text as new_check_text
    from lawbench.checks.parse import MaterialSet as NewMaterialSet

    old_parse, old_citations = _old_checks()
    actual_names = [
        "价格认定结论书",
        "扣押清单",
        "被告人李某乙讯问笔录（第一次）",
        "被告人李某乙讯问笔录（第二次）",
        "监控视频截图说明",
    ]
    body = (SNAPSHOT / "actual-final-v3.md").read_text(encoding="utf-8")
    old_body_check, old_body_cites = old_citations.check_text(
        body, _materials(old_parse.MaterialSet, actual_names), "analysis"
    )
    new_body_check, new_body_cites = new_check_text(
        body, _materials(NewMaterialSet, actual_names), "analysis"
    )

    assert old_body_check["problems"] and not _e(old_body_check), old_body_check
    assert old_body_check["stats"]["citations"] == 16, old_body_check["stats"]
    assert new_body_check["stats"]["citations"] == 16, new_body_check["stats"]
    assert old_body_cites == new_body_cites
    assert _non_e(old_body_check) == _non_e(new_body_check)
    _expect_e(new_body_check, ACTUAL_E)

    boundary_names = ["笔录", "转写", "笔录（第一次）", "京政发〔2024〕1号（试行）"]
    materials = _materials(NewMaterialSet, boundary_names)

    round_text = (
        "2026年10月29日：金额6000元(笔录 第1页)，另见（转写 第2段），"
        "并载(笔录（第一次） 第3行、转写 第4段)，另见（笔录 第5行、第6行）。"
    )
    round_check, round_cites = new_check_text(round_text, materials, "analysis")
    _expect_e(round_check, {
        "(笔录 第1页)",
        "（转写 第2段）",
        "(笔录（第一次） 第3行、转写 第4段)",
        "（笔录 第5行、第6行）",
    })
    assert not round_cites and round_check["stats"]["citations"] == 0

    valid_text = "6000元〔笔录（第一次） 第1行、京政发〔2024〕1号（试行） 第2行〕。"
    valid_check, valid_cites = new_check_text(valid_text, materials, "analysis")
    assert valid_check["passed"] and not valid_check["problems"], valid_check
    assert valid_check["stats"]["citations"] == 2
    assert [c["name"] for c in valid_cites] == ["笔录（第一次）", "京政发〔2024〕1号（试行）"]

    quoted_check, _ = new_check_text(
        "“材料（笔录 第1行）”和“(转写 第2行)”是原文。", materials, "analysis"
    )
    assert not _e(quoted_check), quoted_check

    ordinary_check, _ = new_check_text(
        "（2025年3月12日）；（2025）京0105民初123号；（图1：现场照片）；（待补充）。",
        materials,
        "analysis",
    )
    assert not _e(ordinary_check), ordinary_check

    markdown_check, _ = new_check_text(
        "[材料一](笔录 第1行) [材料二](转写 第2行 \"材料 第3行\")。",
        materials,
        "analysis",
    )
    assert not _e(markdown_check), markdown_check

    skipped_check, _ = new_check_text(
        "# 材料(笔录 第1行)\n```\n(转写 第2行)\n```\n", materials, "analysis"
    )
    assert not _e(skipped_check), skipped_check

    lenticular_check, _ = new_check_text("6000元【笔录 第1行】。", materials, "analysis")
    _expect_e(lenticular_check, {"【笔录 第1行】"})

    print("old_actual_E=0")
    print("new_actual_E=8")
    print("actual_structured_citations_old=16")
    print("actual_structured_citations_new=16")
    print("boundary_cases=7")
    print("boundary_expected_E=5")
    print("PASS")


if __name__ == "__main__":
    main()
