#!/usr/bin/env python3
"""Static finite check for the single synthetic Settings PUT admission."""
from __future__ import annotations

import argparse
import ast
import copy
import json
import pathlib
import threading
from types import SimpleNamespace
from typing import Any


POLICY_GLOBALS = ("READ_ONLY_ROUTES", "CASE_QUERY_ROUTES", "NO_QUERY_ROUTES")


class FiniteFailure(Exception):
    pass


def canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def selected_module(source: str, names: tuple[str, ...]) -> ast.Module:
    tree = ast.parse(source)
    body: list[ast.stmt] = []
    found: set[str] = set()
    for node in tree.body:
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in names:
            body.append(node)
            found.add(node.name)
        elif isinstance(node, ast.Assign) and any(
            isinstance(target, ast.Name) and target.id in POLICY_GLOBALS
            for target in node.targets
        ):
            body.append(node)
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id in POLICY_GLOBALS:
                    found.add(target.id)
    missing = set(names).union(POLICY_GLOBALS) - found
    if missing:
        raise FiniteFailure("selected_source_missing")
    module = ast.Module(body=body, type_ignores=[])
    return ast.fix_missing_locations(module)


def selected_policy(source: str) -> ast.FunctionDef:
    tree = ast.parse(source)
    matches = [
        node
        for node in tree.body
        if isinstance(node, ast.ClassDef) and node.name == "Firewall"
    ]
    if len(matches) != 1:
        raise FiniteFailure("firewall_class_count")
    methods = [
        node
        for node in matches[0].body
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
        and node.name == "_policy"
    ]
    if len(methods) != 1 or not isinstance(methods[0], ast.FunctionDef):
        raise FiniteFailure("policy_method_count")
    method = copy.deepcopy(methods[0])
    method.name = "settings_policy"
    return method


def load_target(entry_path: pathlib.Path, approved: dict[str, Any]) -> tuple[Any, Any]:
    source = entry_path.read_text(encoding="utf-8")
    namespace: dict[str, Any] = {"Any": Any}
    exec(compile(selected_module(source, ("expected_saved_settings",)), str(entry_path), "exec"), namespace)
    expected_helper = namespace["expected_saved_settings"]
    independent = approved["expected_saved_settings"]
    if canonical(expected_helper()) != canonical(independent):
        raise FiniteFailure("helper_mismatch")

    policy_module = ast.Module(
        body=[
            ast.Import(names=[ast.alias(name="json", asname=None)]),
            selected_policy(source),
        ],
        type_ignores=[],
    )
    policy_namespace: dict[str, Any] = {"Any": Any}
    exec(compile(ast.fix_missing_locations(policy_module), str(entry_path), "exec"), policy_namespace)
    return expected_helper, policy_namespace["settings_policy"]


def fresh_firewall() -> SimpleNamespace:
    return SimpleNamespace(lock=threading.RLock(), settings_put_attempts=0)


def expect_rejected(policy: Any, name: str, data: Any, query: bytes = b"", method: str = "PUT", path: str = "/api/settings") -> None:
    firewall = fresh_firewall()
    denial = policy(firewall, method, path, data, query)
    if denial is None or firewall.settings_put_attempts != 0:
        raise FiniteFailure("negative_admission:" + name)


def run(approved_path: pathlib.Path, entry_path: pathlib.Path) -> tuple[int, int]:
    approved = json.loads(approved_path.read_text(encoding="utf-8"))
    expected_helper, policy = load_target(entry_path, approved)
    independent = approved["expected_saved_settings"]

    positive = fresh_firewall()
    body = copy.deepcopy(independent)
    if policy(positive, "PUT", "/api/settings", body, b"") is not None:
        raise FiniteFailure("positive_denied")
    if positive.settings_put_attempts != 1:
        raise FiniteFailure("positive_attempt_count")
    if policy(positive, "PUT", "/api/settings", copy.deepcopy(body), b"") != "SETTINGS_PUT_LIMIT":
        raise FiniteFailure("repeat_not_limited")
    if positive.settings_put_attempts != 1:
        raise FiniteFailure("repeat_consumed_budget")
    if canonical(expected_helper()) != canonical(independent):
        raise FiniteFailure("helper_changed")

    def changed(mutator) -> dict[str, Any]:
        value = copy.deepcopy(independent)
        mutator(value)
        return value

    negatives = 0
    cases = [
        ("local_server", changed(lambda value: value["servers"].__setitem__("llm_base_url", "http://127.0.0.1:65006/v1"))),
        ("external_url", changed(lambda value: value["external_llm"].__setitem__("base_url", "http://127.0.0.1:65006/v1"))),
        ("model", changed(lambda value: value["external_llm"].__setitem__("model", "t34-other-synthetic"))),
        ("enabled", changed(lambda value: value["external_llm"].__setitem__("enabled", False))),
        ("supports_tools", changed(lambda value: value["external_llm"].__setitem__("supports_tools", False))),
        ("window", changed(lambda value: value["defaults"].__setitem__("window", "32K"))),
        ("default_max_tokens", changed(lambda value: value["defaults"].__setitem__("max_tokens", 8192))),
        ("unknown_extra_key", changed(lambda value: value.__setitem__("unexpected", True))),
        ("credential_field", changed(lambda value: value["external_llm"].__setitem__("api_key", "synthetic-not-a-key"))),
        ("missing_field", changed(lambda value: value["external_llm"].pop("supports_tools"))),
        ("bool_as_int", changed(lambda value: value["external_llm"].__setitem__("enabled", 1))),
        ("v_as_float", changed(lambda value: value.__setitem__("v", 1.0))),
    ]
    for name, value in cases:
        expect_rejected(policy, name, value)
        negatives += 1

    for name, value in (
        ("non_dict_list", []),
        ("non_dict_null", None),
        ("non_dict_string", "settings"),
    ):
        expect_rejected(policy, name, value)
        negatives += 1

    expect_rejected(policy, "query_present", copy.deepcopy(independent), b"?unexpected=1")
    negatives += 1

    for name, method, path in (
        ("wrong_method_post", "POST", "/api/settings"),
        ("wrong_path_put", "PUT", "/api/settings/other"),
    ):
        expect_rejected(policy, name, copy.deepcopy(independent), method=method, path=path)
        negatives += 1

    get_firewall = fresh_firewall()
    if policy(get_firewall, "GET", "/api/settings", None, b"") is not None:
        raise FiniteFailure("legitimate_get_denied")
    if get_firewall.settings_put_attempts != 0:
        raise FiniteFailure("get_consumed_budget")

    return 1, negatives


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--approved", required=True, type=pathlib.Path)
    parser.add_argument("--entry", required=True, type=pathlib.Path)
    args = parser.parse_args()
    try:
        positive, negative = run(args.approved, args.entry)
    except Exception:
        print("firewall-finite:FAIL")
        return 1
    print(f"firewall-finite:PASS positive={positive} negative={negative}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
