"""Pure UNIT source for the case_read_material request guard.

This file is delivered as source only. The root reviewer runs it after source
review:

    python read-guard-finite.py <old-before-B.py> <new-B.py>

It extracts the single FiniteFirewall class AST from each source and compiles
that class in a local namespace. It does not import the LawBench service,
construct an app or CaseRegistry, start HTTP, load a model, read a Key, or
write a file.
"""

import ast
import os
import pathlib
from typing import Any


EXPECTED_MATERIAL_NAMES = frozenset(
    {
        "刑事判决书",
        "拘留证",
        "羁押情况证明",
        "起诉意见书",
        "逮捕证",
    }
)
WORKFLOW_TOOLS = frozenset(
    {
        "case_list_materials",
        "case_read_material",
        "case_calc_sentence",
        "case_save_draft",
    }
)

_UNIT_CASE_ID = "case-unit-sentence-read-contract"
_UNIT_TASK_ID = "T-20261029224308-unit"
_SAFE_BUILTINS = {
    "__build_class__": __build_class__,
    "__name__": "finite-firewall-unit",
    "bool": bool,
    "dict": dict,
    "frozenset": frozenset,
    "int": int,
    "isinstance": isinstance,
    "len": len,
    "list": list,
    "object": object,
    "set": set,
    "staticmethod": staticmethod,
    "str": str,
    "tuple": tuple,
}


def _load_finite_firewall(source_path: str) -> type:
    path = pathlib.Path(source_path)
    source = path.read_text(encoding="utf-8")
    tree = ast.parse(source, filename=str(path))
    classes = [
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "FiniteFirewall"
    ]
    if len(classes) != 1:
        raise AssertionError(
            f"{path}: expected exactly one top-level FiniteFirewall class"
        )

    class_module = ast.Module(body=[classes[0]], type_ignores=[])
    ast.fix_missing_locations(class_module)
    namespace = {
        "__builtins__": dict(_SAFE_BUILTINS),
        "__name__": "finite-firewall-unit",
        "Any": Any,
        "EXPECTED_MATERIAL_NAMES": EXPECTED_MATERIAL_NAMES,
        "WORKFLOW_TOOLS": WORKFLOW_TOOLS,
        "os": os,
        "pathlib": pathlib,
    }
    exec(compile(class_module, str(path), "exec"), namespace)
    return namespace["FiniteFirewall"]


def _check(
    firewall_class: type,
    args: Any,
    *,
    task_id: str = _UNIT_TASK_ID,
    context_l1_exact: bool = True,
) -> str | None:
    firewall = object.__new__(firewall_class)
    firewall.case_id = _UNIT_CASE_ID
    firewall.task_id = _UNIT_TASK_ID
    firewall.context_l1_exact = context_l1_exact
    firewall.tool_sequence = []
    return firewall._check_post(
        "/core/tool",
        {
            "task_id": task_id,
            "tool": "case_read_material",
            "args": args,
        },
    )


def _expect(
    cards: list[str],
    name: str,
    actual: str | None,
    expected: str | None,
) -> None:
    if actual != expected:
        cards.append(f"{name}: expected {expected!r}, got {actual!r}")


def main() -> int:
    if len(os.sys.argv) != 3:
        print("usage: python read-guard-finite.py OLD_BEFORE_B.py NEW_B.py")
        return 2

    old_firewall = _load_finite_firewall(os.sys.argv[1])
    new_firewall = _load_finite_firewall(os.sys.argv[2])
    cards: list[str] = []
    expected_old_denial = "GROUPED_READ_ARGS_OR_ORDER"

    actual_four = {
        "name": "刑事判决书",
        "more_names": ["拘留证", "逮捕证", "羁押情况证明"],
    }
    _expect(
        cards,
        "actual-four-old-denied",
        _check(old_firewall, actual_four),
        expected_old_denial,
    )
    _expect(
        cards,
        "actual-four-new-allow",
        _check(new_firewall, actual_four),
        None,
    )
    _expect(
        cards,
        "five-group-new-allow",
        _check(
            new_firewall,
            {
                "name": "刑事判决书",
                "more_names": ["拘留证", "羁押情况证明", "起诉意见书", "逮捕证"],
            },
        ),
        None,
    )
    _expect(
        cards,
        "single-known-new-allow",
        _check(new_firewall, {"name": "逮捕证"}),
        None,
    )
    _expect(
        cards,
        "known-pagination-new-allow",
        _check(
            new_firewall,
            {"name": "刑事判决书", "start": 2, "offset": 0, "max_chars": 1000},
        ),
        None,
    )
    _expect(
        cards,
        "unknown-first-denied",
        _check(new_firewall, {"name": "未登记材料"}),
        "READ_ARGS_OR_OWNERSHIP",
    )
    _expect(
        cards,
        "unknown-secondary-denied",
        _check(
            new_firewall,
            {"name": "刑事判决书", "more_names": ["拘留证", "未登记材料"]},
        ),
        "READ_ARGS_OR_OWNERSHIP",
    )
    _expect(
        cards,
        "path-traversal-first-denied",
        _check(new_firewall, {"name": "../刑事判决书"}),
        "READ_ARGS_OR_OWNERSHIP",
    )
    _expect(
        cards,
        "path-traversal-secondary-denied",
        _check(
            new_firewall,
            {"name": "刑事判决书", "more_names": ["../../拘留证"]},
        ),
        "READ_ARGS_OR_OWNERSHIP",
    )
    _expect(
        cards,
        "malformed-more-not-list-denied",
        _check(new_firewall, {"name": "刑事判决书", "more_names": "拘留证"}),
        "READ_ARGS_OR_OWNERSHIP",
    )
    _expect(
        cards,
        "malformed-more-item-denied",
        _check(new_firewall, {"name": "刑事判决书", "more_names": ["拘留证", 7]}),
        "READ_ARGS_OR_OWNERSHIP",
    )
    _expect(
        cards,
        "wrong-task-denied",
        _check(
            new_firewall,
            {"name": "刑事判决书"},
            task_id="T-20261029224308-other",
        ),
        "TASK_ID_OUTSIDE_RUN",
    )
    _expect(
        cards,
        "context-false-denied",
        _check(new_firewall, {"name": "刑事判决书"}, context_l1_exact=False),
        "CONTEXT_L1_REQUIRED",
    )
    _expect(
        cards,
        "unknown-field-denied",
        _check(new_firewall, {"name": "刑事判决书", "query": "起诉"}),
        "READ_ARGS_OR_OWNERSHIP",
    )

    if cards:
        print(f"UNIT_FAIL_NOT_REAL_MODEL cards={len(cards)}")
        for card in cards:
            print(f"- {card}")
        return 1

    print(
        "UNIT_PASS_NOT_REAL_MODEL "
        "assertions=14 old_actual_four=DENY new_actual_four=ALLOW"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
