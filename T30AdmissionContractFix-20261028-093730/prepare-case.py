"""Create one genuine synthetic case with the installed B-line CaseRegistry.

This helper is intentionally narrow.  It creates only ``<run>/case`` and
``<run>/appdata`` under a fresh root prepared by ``admission.mts``.  It does
not import the HTTP application, touch model/network services, or delete data.
"""

from __future__ import annotations

import hashlib
import json
import os
import pathlib
import sys


B_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
B_SERVICE = B_ROOT / "service"
B_CONTRACTS = B_ROOT / "contracts"

FIXED_FILES = {
    B_SERVICE / "lawbench" / "__init__.py":
        "fa1e967e87f9167961c9d7ff8c219d87faf3047a6bd45f7ae28df26cca54c1d3",
    B_SERVICE / "lawbench" / "contracts.py":
        "e667373c84d3622a2b33bdfaad21cfafc6a2a919fe8937b95d8f872dc939a9e3",
    B_SERVICE / "lawbench" / "logs.py":
        "7576265fd8bf4967d9d99b7b67c22607af36fc640ccd8333602ba4ff15bdcdc6",
    B_SERVICE / "lawbench" / "errors.py":
        "f580d733d88a15a70df089f8b1bcd6bfffcac6b8a78013532aab61d2d20d33f4",
    B_SERVICE / "lawbench" / "case" / "__init__.py":
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    B_SERVICE / "lawbench" / "case" / "registry.py":
        "05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21",
    B_SERVICE / "lawbench" / "case" / "gate.py":
        "cfed621cd2729d595c61f600c6eea88903de867d5647911881314104171a482e",
    B_CONTRACTS / "case_db.sql":
        "18513849ca3dde0cdf333682983c77561ad597744c29da23c75a2544ae2c4703",
    B_CONTRACTS / "files" / "cases.schema.json":
        "22ef6aa3f4d14c0b0d8414a6bcb449f264d413459c53ee40c78cb0a88c10a8d3",
}


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def verify_fixed_files() -> None:
    for path, expected in FIXED_FILES.items():
        if path.is_symlink() or not path.is_file():
            raise RuntimeError("fixed_case_source_missing_or_link")
        if sha256_file(path) != expected:
            raise RuntimeError("fixed_case_source_changed")


def within(root: pathlib.Path, target: pathlib.Path) -> bool:
    try:
        target.resolve().relative_to(root.resolve())
        return True
    except ValueError:
        return False


def write_json_exclusive(path: pathlib.Path, value: dict) -> None:
    encoded = json.dumps(
        value, ensure_ascii=False, indent=2, sort_keys=True
    ).encode("utf-8") + b"\n"
    with path.open("xb") as stream:
        stream.write(encoded)
        stream.flush()
        os.fsync(stream.fileno())


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: prepare-case.py <fresh-run-root>", file=sys.stderr)
        return 2

    run_root = pathlib.Path(sys.argv[1]).resolve()
    if run_root.is_symlink() or not run_root.is_dir():
        print("prepare-case failed: run_root_invalid", file=sys.stderr)
        return 1
    case_root = run_root / "case"
    appdata = run_root / "appdata"
    if case_root.exists() or appdata.exists():
        print("prepare-case failed: root_not_fresh", file=sys.stderr)
        return 1
    if not within(run_root, case_root) or not within(run_root, appdata):
        print("prepare-case failed: path_escape", file=sys.stderr)
        return 1

    try:
        verify_fixed_files()
        sys.path.insert(0, os.fspath(B_SERVICE))
        from lawbench import contracts
        from lawbench.case.registry import CaseRegistry

        contracts.set_contracts_dir(B_CONTRACTS)
        appdata.mkdir(mode=0o700)
        case_root.mkdir(mode=0o700)

        registry = CaseRegistry(appdata, B_CONTRACTS / "case_db.sql")
        opened = registry.open(os.fspath(case_root), None, None, "daily")
        recent = registry.recent()
        matches = [row for row in recent if row.get("case_id") == opened["case_id"]]
        if (
            opened.get("created") is not True
            or len(matches) != 1
            or os.path.normcase(matches[0].get("root", ""))
            != os.path.normcase(os.fspath(case_root))
            or matches[0].get("exists") is not True
        ):
            raise RuntimeError("case_registration_not_genuine")

        case_db = case_root / "工作区" / "case.db"
        session_root = case_root / "工作区" / "会话"
        if case_db.is_symlink() or not case_db.is_file():
            raise RuntimeError("case_db_missing")
        if session_root.is_symlink() or not session_root.is_dir():
            raise RuntimeError("case_session_root_missing")

        report = {
            "format": "lawbench-t30-genuine-case-registration-v1",
            "source": "installed B-line CaseRegistry.open",
            "created": True,
            "caseRoot": os.fspath(case_root),
            "appdata": os.fspath(appdata),
            "caseId": opened["case_id"],
            "kind": matches[0].get("kind"),
            "caseDbSha256": sha256_file(case_db),
            "casesJsonSha256": sha256_file(appdata / "cases.json"),
            "sessionRoot": os.fspath(session_root),
            "networkImports": 0,
            "modelCalls": 0,
        }
        write_json_exclusive(run_root / "case-registration.json", report)
    except Exception as error:  # noqa: BLE001 - only a type name crosses this boundary
        print(f"prepare-case failed: {type(error).__name__}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
