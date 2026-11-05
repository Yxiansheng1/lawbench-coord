#!/usr/bin/env python3
"""Finite source verification for the criminal-template private-case guard.

This script does not start HTTP, an app, an Agent, a Session, or a model. It
loads the frozen old B author copy and the revised new copy, creates one fresh
owned case with the real B CaseRegistry, and exercises only local verification
negatives. Each negative is restored from its owned in-memory bytes or exact
rename before the next assertion.
"""
from __future__ import annotations

import argparse
import contextlib
import importlib.util
import json
import os
import pathlib
import stat
import sys
import tempfile
from datetime import datetime, timezone
from types import ModuleType
from typing import Any, Iterator


HERE = pathlib.Path(__file__).resolve().parent
OLD_SERVICE = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18CriminalTemplateGuardInput-20261029-094640"
    r"\b-service-criminal-reading.py"
)
NEW_SERVICE = HERE / "b-service-criminal-reading.py"
B_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
B_SERVICE = B_ROOT / "service"
B_CONTRACTS = B_ROOT / "contracts"
CASE_SQL = B_CONTRACTS / "case_db.sql"
PRIMARY_SCAFFOLD_LITERAL = ("会见笔录", "家属沟通", "涉案证据")
OLD_EXTRA_ERROR = "private source area contains an extra file"
STASK_REPARSE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def require_absolute_existing_dir(raw: str, label: str) -> pathlib.Path:
    path = pathlib.Path(raw)
    if not path.is_absolute() or not path.is_dir():
        raise RuntimeError(f"{label} must be an existing absolute directory")
    return path.resolve()


def load_module(name: str, path: pathlib.Path) -> ModuleType:
    spec = importlib.util.spec_from_file_location(name, path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"cannot load module: {path.name}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@contextlib.contextmanager
def isolated_environment(root: pathlib.Path) -> Iterator[None]:
    values = {
        "HOME": root / "home",
        "USERPROFILE": root / "home",
        "APPDATA": root / "appdata",
        "LOCALAPPDATA": root / "localappdata",
        "TEMP": root / "temp",
        "TMP": root / "temp",
    }
    for path in values.values():
        path.mkdir(parents=True, exist_ok=True)
    original = {key: os.environ.get(key) for key in values}
    try:
        for key, path in values.items():
            os.environ[key] = str(path)
        yield
    finally:
        for key, value in original.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


def primary_criminal_scaffold(templates: dict[str, list[str]]) -> tuple[str, ...]:
    found: list[str] = []
    for relative in templates["criminal"]:
        parts = pathlib.PurePosixPath(relative).parts
        if len(parts) == 2 and parts[0] == "02案件材料" and parts[1] not in found:
            found.append(parts[1])
    return tuple(found)


def source_layout(source_dir: pathlib.Path) -> tuple[list[str], list[str], list[str]]:
    files: list[str] = []
    directories: list[str] = []
    unexpected: list[str] = []
    for entry in sorted(source_dir.iterdir(), key=lambda path: path.name):
        info = os.lstat(entry)
        reparse = bool(getattr(info, "st_file_attributes", 0) & STASK_REPARSE)
        if stat.S_ISREG(info.st_mode) and not stat.S_ISLNK(info.st_mode) and not reparse:
            files.append(entry.name)
        elif stat.S_ISDIR(info.st_mode) and not stat.S_ISLNK(info.st_mode) and not reparse:
            directories.append(entry.name)
        else:
            unexpected.append(entry.name)
    return files, directories, unexpected


def assert_layout(
    source_dir: pathlib.Path,
    file_names: set[str],
    scaffold: tuple[str, ...],
) -> None:
    files, directories, unexpected = source_layout(source_dir)
    if set(files) != file_names or tuple(directories) != scaffold or unexpected:
        raise AssertionError("owned source layout is not exact four files plus three scaffold dirs")
    for name in scaffold:
        if any((source_dir / name).iterdir()):
            raise AssertionError("approved scaffold directory is not empty")


def expect_runtime_error(
    module: ModuleType,
    run_root: pathlib.Path,
    *,
    allow_criminal_template: bool,
    expected_message: str | None = None,
) -> str:
    try:
        module.verify_private_case(
            run_root,
            allow_criminal_template=allow_criminal_template,
        )
    except RuntimeError as error:
        if expected_message is not None and str(error) != expected_message:
            raise AssertionError(
                f"unexpected verification message: expected {expected_message!r}, got {str(error)!r}"
            ) from error
        return str(error)
    raise AssertionError("verification unexpectedly accepted the negative case")


def finish_case(
    new_module: ModuleType,
    run_root: pathlib.Path,
    source_dir: pathlib.Path,
    file_names: set[str],
    scaffold: tuple[str, ...],
) -> None:
    if new_module.verify_private_case(run_root, allow_criminal_template=True) != len(file_names):
        raise AssertionError("post-restore verification count changed")
    assert_layout(source_dir, file_names, scaffold)


def run_negatives(
    new_module: ModuleType,
    run_root: pathlib.Path,
    source_dir: pathlib.Path,
    file_names: set[str],
    scaffold: tuple[str, ...],
) -> dict[str, str]:
    results: dict[str, str] = {}

    unexpected_file = source_dir / "unexpected-owned-file.txt"
    unexpected_file.write_bytes(b"owned negative\n")
    try:
        results["unexpectedFile"] = expect_runtime_error(
            new_module,
            run_root,
            allow_criminal_template=True,
        )
    finally:
        unexpected_file.unlink()
    finish_case(new_module, run_root, source_dir, file_names, scaffold)

    unexpected_dir = source_dir / "unexpected-empty-dir"
    unexpected_dir.mkdir()
    try:
        results["unexpectedEmptyDir"] = expect_runtime_error(
            new_module,
            run_root,
            allow_criminal_template=True,
        )
    finally:
        unexpected_dir.rmdir()
    finish_case(new_module, run_root, source_dir, file_names, scaffold)

    nested_content = source_dir / scaffold[0] / "owned-nested.txt"
    nested_content.write_bytes(b"owned nested negative\n")
    try:
        results["nonEmptyKnownScaffold"] = expect_runtime_error(
            new_module,
            run_root,
            allow_criminal_template=True,
        )
    finally:
        nested_content.unlink()
    finish_case(new_module, run_root, source_dir, file_names, scaffold)

    missing_dir = source_dir / scaffold[1]
    missing_shadow = run_root / "owned-missing-scaffold-shadow"
    os.rename(missing_dir, missing_shadow)
    try:
        results["missingKnownScaffold"] = expect_runtime_error(
            new_module,
            run_root,
            allow_criminal_template=True,
        )
    finally:
        os.rename(missing_shadow, missing_dir)
    finish_case(new_module, run_root, source_dir, file_names, scaffold)

    changed_material = source_dir / sorted(file_names)[0]
    original_info = changed_material.stat()
    original_bytes = changed_material.read_bytes()
    changed_material.write_bytes(original_bytes + b"\n")
    try:
        results["alteredLiteralMarkdown"] = expect_runtime_error(
            new_module,
            run_root,
            allow_criminal_template=True,
        )
    finally:
        changed_material.write_bytes(original_bytes)
        os.utime(
            changed_material,
            ns=(original_info.st_atime_ns, original_info.st_mtime_ns),
        )
    finish_case(new_module, run_root, source_dir, file_names, scaffold)

    reparse_target = source_dir / scaffold[2]
    reparse_shadow = run_root / "owned-reparse-shadow"
    os.rename(reparse_target, reparse_shadow)
    link_created = False
    try:
        try:
            os.symlink(reparse_shadow, reparse_target, target_is_directory=True)
            link_created = True
        except OSError as error:
            results["reparse"] = f"NOT_RUN:{type(error).__name__}"
        else:
            results["reparse"] = expect_runtime_error(
                new_module,
                run_root,
                allow_criminal_template=True,
            )
    finally:
        if link_created and os.path.lexists(reparse_target):
            os.unlink(reparse_target)
        os.rename(reparse_shadow, reparse_target)
    finish_case(new_module, run_root, source_dir, file_names, scaffold)
    return results


def execute(parent: pathlib.Path) -> dict[str, Any]:
    if not (B_SERVICE / "lawbench" / "case" / "registry.py").is_file():
        raise RuntimeError("current B service registry is unavailable")
    if not CASE_SQL.is_file():
        raise RuntimeError("current B case SQL is unavailable")
    old_module = load_module("t18_criminal_guard_old", OLD_SERVICE)
    new_module = load_module("t18_criminal_guard_new", NEW_SERVICE)
    run_root = pathlib.Path(
        tempfile.mkdtemp(prefix="t18-criminal-template-guard-", dir=parent)
    ).resolve()
    case_root = run_root / "case"
    copied = new_module.copy_approved_case(run_root)
    if len(copied) != 4:
        raise AssertionError("approved copy did not produce exactly four files")
    if old_module.verify_private_case(run_root) != 4:
        raise AssertionError("old verifier rejected the exact initial four-file copy")
    if new_module.verify_private_case(run_root) != 4:
        raise AssertionError("new verifier rejected the exact initial four-file copy")

    with isolated_environment(run_root):
        if str(B_SERVICE) not in sys.path:
            sys.path.insert(0, str(B_SERVICE))
        from lawbench.case.registry import CaseRegistry, TEMPLATES

        scaffold = primary_criminal_scaffold(TEMPLATES)
        if scaffold != PRIMARY_SCAFFOLD_LITERAL:
            raise AssertionError("primary criminal template names changed")
        registry = CaseRegistry(run_root / "appdata", CASE_SQL)
        opened = registry.open(
            str(case_root),
            "criminal",
            None,
            "criminal",
        )
    if opened.get("kind") != "criminal":
        raise AssertionError("real CaseRegistry did not record the criminal kind")

    source_dir = case_root / "02案件材料"
    file_names = {pathlib.PurePosixPath(row["relative"]).name for row in copied}
    assert_layout(source_dir, file_names, scaffold)
    old_after_open = expect_runtime_error(
        old_module,
        run_root,
        allow_criminal_template=False,
        expected_message=OLD_EXTRA_ERROR,
    )
    if new_module.verify_private_case(run_root, allow_criminal_template=True) != 4:
        raise AssertionError("new verifier rejected the primary criminal template")

    negatives = run_negatives(
        new_module,
        run_root,
        source_dir,
        file_names,
        scaffold,
    )
    final_files, final_dirs, final_unexpected = source_layout(source_dir)
    status = "PASS_WITH_REPARSE_NOT_RUN" if negatives["reparse"].startswith("NOT_RUN:") else "PASS"
    return {
        "format": "lawbench-t18-criminal-template-guard-finite-v1",
        "status": status,
        "finishedAtUtc": utc_now(),
        "runRoot": str(run_root),
        "caseRoot": str(case_root),
        "sourceDir": str(source_dir),
        "primaryScaffold": list(scaffold),
        "initialCopy": {
            "fileCount": 4,
            "oldVerifier": "PASS",
            "newDefaultVerifier": "PASS",
            "copiedSha256": {
                pathlib.PurePosixPath(row["relative"]).name: row["sha256"]
                for row in copied
            },
        },
        "realCaseRegistryOpen": {
            "count": 1,
            "template": "criminal",
            "kind": opened.get("kind"),
            "reportedKind": opened.get("kind"),
        },
        "afterOpen": {
            "oldVerifierRuntimeError": old_after_open,
            "newVerifierWithAllowance": "PASS",
            "emptyDirectories": list(scaffold),
        },
        "negatives": negatives,
        "finalLayout": {
            "files": final_files,
            "directories": final_dirs,
            "unexpectedEntries": final_unexpected,
            "newVerifierWithAllowance": "PASS",
        },
        "counts": {
            "moduleImports": 2,
            "realRegistryImports": 1,
            "caseRegistryOpens": 1,
            "freshOwnedRoots": 1,
            "initialCopies": 1,
            "negativeCases": 6,
            "negativeCasesRejected": 5 if negatives["reparse"].startswith("NOT_RUN:") else 6,
            "httpRequests": 0,
            "modelRequests": 0,
            "keyAccesses": 0,
            "httpServersStarted": 0,
            "agentsStarted": 0,
            "sessionsStarted": 0,
            "childServicesStarted": 0,
            "builds": 0,
        },
        "writeFaces": [
            "new mkdtemp root only",
            "explicit --report path only",
        ],
        "limitations": [
            "This is local guard verification, not a full T18 run.",
            "Old outbound, credential, getter, model, and production JSONL behavior is not re-run.",
            "A reparse probe is marked NOT_RUN when native creation is unavailable; no ACL, UAC, or policy change is attempted.",
        ],
    }


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--root",
        required=True,
        help="existing absolute directory in which one fresh owned root is created",
    )
    parser.add_argument(
        "--report",
        required=True,
        help="explicit absolute JSON report path",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(sys.argv[1:] if argv is None else argv)
    report_path = pathlib.Path(args.report)
    if not report_path.is_absolute():
        raise SystemExit("--report must be absolute")
    parent = require_absolute_existing_dir(args.root, "--root")
    try:
        report = execute(parent)
        status = 0
    except BaseException as error:
        report = {
            "format": "lawbench-t18-criminal-template-guard-finite-v1",
            "status": "FAILED",
            "finishedAtUtc": utc_now(),
            "failureType": type(error).__name__,
            "failure": str(error),
            "counts": {
                "httpRequests": 0,
                "modelRequests": 0,
                "keyAccesses": 0,
                "httpServersStarted": 0,
                "agentsStarted": 0,
                "sessionsStarted": 0,
                "childServicesStarted": 0,
                "builds": 0,
            },
            "limitations": ["Failed before a complete finite result; no full T18 claim."],
        }
        status = 1
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, ensure_ascii=False, sort_keys=True))
    return status


if __name__ == "__main__":
    raise SystemExit(main())
