#!/usr/bin/env python3
"""Exercise the checked-in archive fixture functions without production imports.

This is intentionally a local fixture unit. It loads only the named fixture
functions and their direct constants from the actual B service source, verifies
all fifteen approved input identities first, then exercises the real copy and
inventory validators in fresh caller-owned roots. It never imports application
modules and never starts the scanner, HTTP service, Agent, or model.
"""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import os
import pathlib
import re
import shutil
import stat
import sys
import typing
from typing import Any


FUNCTION_NAMES = (
    "ordinary_file",
    "ordinary_dir",
    "sha256",
    "approved_case_inputs",
    "copy_approved_case",
    "verify_private_case",
)
CONSTANT_NAMES = (
    "B_ROOT",
    "B_CONTRACTS",
    "B_SKILLS",
    "RUNTIME_SKILL",
    "ARCHIVE_SAMPLE_DIR",
    "ARCHIVE_TASK",
    "ARCHIVE_REFERENCE_NOTES",
    "ARCHIVE_MATCH_SCHEMA",
    "ARCHIVE_PLAN_SCHEMA",
    "ARCHIVE_SCHEMA_INPUTS",
    "APPROVED_INPUTS",
    "APPROVED_INPUTS_BYTES",
    "APPROVED_INPUTS_SHA256",
    "SHA256",
    "EXPECTED_REGISTERED_MATERIAL_NAMES",
    "EXPECTED_SOURCE_RELATIVES",
    "CIVIL_TEMPLATE_DIRS",
)


def file_sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def extract_selected(source_path: pathlib.Path) -> tuple[list[ast.stmt], list[ast.FunctionDef]]:
    source = source_path.read_bytes().decode("utf-8")
    module = ast.parse(source, filename=str(source_path))
    constants: dict[str, ast.Assign] = {}
    functions: dict[str, ast.FunctionDef] = {}
    for node in module.body:
        if isinstance(node, ast.Assign):
            if len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                name = node.targets[0].id
                if name in CONSTANT_NAMES:
                    if name in constants:
                        raise RuntimeError(f"duplicate selected constant: {name}")
                    constants[name] = node
        elif isinstance(node, ast.FunctionDef) and node.name in FUNCTION_NAMES:
            if node.name in functions:
                raise RuntimeError(f"duplicate selected function: {node.name}")
            functions[node.name] = node
    missing_constants = sorted(set(CONSTANT_NAMES) - set(constants))
    missing_functions = sorted(set(FUNCTION_NAMES) - set(functions))
    if missing_constants or missing_functions:
        raise RuntimeError(
            f"selected source is incomplete: constants={missing_constants}, "
            f"functions={missing_functions}"
        )
    return (
        [constants[name] for name in CONSTANT_NAMES],
        [functions[name] for name in FUNCTION_NAMES],
    )


def validate_fifteen(namespace: dict[str, Any]) -> None:
    approved = namespace["APPROVED_INPUTS"]
    if (
        not isinstance(approved, pathlib.Path)
        or not approved.is_absolute()
        or not approved.is_file()
        or approved.stat().st_size != namespace["APPROVED_INPUTS_BYTES"]
        or file_sha256(approved) != namespace["APPROVED_INPUTS_SHA256"]
    ):
        raise RuntimeError("approved input manifest identity changed")
    rows = json.loads(approved.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or len(rows) != 15:
        raise RuntimeError("approved input pin count is not fifteen")
    paths: set[str] = set()
    reparse_flag = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
    for row in rows:
        if not isinstance(row, dict):
            raise RuntimeError("approved input pin row is invalid")
        raw_path = row.get("path")
        raw_bytes = row.get("bytes")
        raw_sha = row.get("sha256")
        raw_mtime = row.get("mtime_ns")
        if (
            not isinstance(raw_path, str)
            or not pathlib.Path(raw_path).is_absolute()
            or not isinstance(raw_bytes, int)
            or isinstance(raw_bytes, bool)
            or raw_bytes < 1
            or not isinstance(raw_sha, str)
            or namespace["SHA256"].fullmatch(raw_sha) is None
            or not isinstance(raw_mtime, str)
            or not raw_mtime.isdigit()
        ):
            raise RuntimeError("approved input pin metadata is invalid")
        path = pathlib.Path(raw_path)
        key = os.path.normcase(os.path.abspath(path))
        if key in paths:
            raise RuntimeError("approved input pin path is duplicated")
        paths.add(key)
        try:
            info = os.lstat(path)
        except OSError:
            raise RuntimeError("approved input pin does not exist") from None
        if (
            not stat.S_ISREG(info.st_mode)
            or stat.S_ISLNK(info.st_mode)
            or (getattr(info, "st_file_attributes", 0) & reparse_flag)
            or info.st_size != raw_bytes
            or info.st_mtime_ns != int(raw_mtime)
            or file_sha256(path) != raw_sha
        ):
            raise RuntimeError("approved input pin identity changed")


def expect_rejected(verify: Any, root: pathlib.Path, reason: str) -> None:
    try:
        verify(root)
    except RuntimeError:
        return
    raise RuntimeError(f"negative fixture was not rejected: {reason}")


def run(source_path: pathlib.Path, output_root: pathlib.Path) -> dict[str, Any]:
    if not source_path.is_absolute() or not source_path.is_file():
        raise RuntimeError("actual B source must be an absolute ordinary file")
    if not output_root.is_absolute() or os.path.lexists(output_root):
        raise RuntimeError("fixture output root must be an absolute fresh path")

    constants, functions = extract_selected(source_path)
    namespace: dict[str, Any] = {
        "__builtins__": __builtins__,
        "os": os,
        "pathlib": pathlib,
        "json": json,
        "hashlib": hashlib,
        "shutil": shutil,
        "stat": stat,
        "re": re,
        "Any": typing.Any,
    }
    exec(
        compile(ast.Module(body=constants, type_ignores=[]), str(source_path), "exec"),
        namespace,
    )
    validate_fifteen(namespace)
    exec(
        compile(ast.Module(body=functions, type_ignores=[]), str(source_path), "exec"),
        namespace,
    )

    output_root.mkdir(mode=0o700)
    approved = namespace["approved_case_inputs"]()
    approved_relatives = {row["relativePath"] for row in approved}

    positive_root = output_root / "positive"
    positive_root.mkdir(mode=0o700)
    copied = namespace["copy_approved_case"](positive_root)
    fixture_count = namespace["verify_private_case"](positive_root)
    if fixture_count != 10 or len(copied) != 10:
        raise RuntimeError("positive fixture did not preserve exactly ten materials")
    if {row["relative"] for row in copied} != approved_relatives:
        raise RuntimeError("copied fixture relative paths differ from approved paths")
    positive_case = positive_root / "case"
    if os.path.lexists(positive_case / "02案件材料"):
        raise RuntimeError("fixture unexpectedly retained the 02案件材料 wrapper")
    for row in copied:
        source = pathlib.Path(row["source"])
        destination = pathlib.Path(row["destination"])
        if (
            destination != positive_case / pathlib.Path(row["relative"])
            or source.stat().st_size != destination.stat().st_size
            or source.stat().st_mtime_ns != destination.stat().st_mtime_ns
            or file_sha256(source) != file_sha256(destination)
        ):
            raise RuntimeError("positive fixture is not source-byte-and-mtime exact")

    negative_file_root = output_root / "negative-file"
    negative_file_root.mkdir(mode=0o700)
    namespace["copy_approved_case"](negative_file_root)
    extra_file = negative_file_root / "case" / "03一审" / "unapproved.txt"
    extra_file.write_bytes(b"synthetic negative fixture file\n")
    expect_rejected(
        namespace["verify_private_case"],
        negative_file_root,
        "unapproved ordinary file",
    )

    negative_dir_root = output_root / "negative-dir"
    negative_dir_root.mkdir(mode=0o700)
    namespace["copy_approved_case"](negative_dir_root)
    extra_dir = negative_dir_root / "case" / "03一审" / "unapproved-directory"
    extra_dir.mkdir()
    expect_rejected(
        namespace["verify_private_case"],
        negative_dir_root,
        "unapproved ordinary directory",
    )

    return {
        "status": "PASS",
        "classification": "LOCAL_FIXTURE_UNIT_NOT_MODEL_OR_SCANNER",
        "actualSource": str(source_path),
        "approvedPinCount": 15,
        "positive": {
            "fixtureCount": fixture_count,
            "relativePaths": sorted(approved_relatives),
            "wrapper02案件材料": False,
            "sourceByteShaMtimeExact": True,
        },
        "negative": {
            "unapprovedOrdinaryFileRejected": True,
            "unapprovedOrdinaryDirectoryRejected": True,
        },
        "scannerNine": "NOT_RUN",
        "coreToolHttpModel": "NOT_RUN",
        "credentials": "NOT_RUN",
        "retainedRoots": [
            str(positive_root),
            str(negative_file_root),
            str(negative_dir_root),
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--root", required=True)
    args = parser.parse_args()
    report = run(
        pathlib.Path(args.source),
        pathlib.Path(args.root),
    )
    print(json.dumps(report, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
