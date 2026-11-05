#!/usr/bin/env python3
"""One-shot, offline native llama-mtmd-cli OCR counterfactual.

This file is source-only until root completes admission review and executes it
with the pre-existing C:/prep395/python/python.exe. It never starts a server,
uses HTTP, reads credentials, or retries inference.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import stat
import subprocess
import sys
import time
from pathlib import Path
from typing import Any


ADMISSION_SCHEMA = "lawbench-native-cli-counterfactual-admission/1"
RESULT_SCHEMA = "lawbench-native-cli-counterfactual-result/1"
ADMISSION_VERDICT = "ADMITTED_ONE_NATIVE_CLI_COUNTERFACTUAL_NO_HTTP"
MAX_TOTAL_SECONDS = 300.0
POST_CHILD_RESERVE_SECONDS = 45.0
IDENTITY_QUERY_SECONDS = 10.0
FINAL_STOP_WAIT_SECONDS = 15.0

RUN_BASE = r"C:\Users\PC\AppData\Local\Temp"
RUN_NAME_RE = re.compile(r"^lb-ocr-native-[A-Za-z0-9][A-Za-z0-9._-]{0,95}$")

CLI_PATH = r"C:\prep395\llama\llama-mtmd-cli.exe"
MODEL_PATH = r"C:\prep395\models\Xiaomi-OCR-0.BF16.gguf"
MODEL_BYTES = 1_516_744_960
MODEL_SHA256 = "d796fa2cd211ba39a40f37691fc0046aa49f59c7968ec844eb9e81f2ae476a52"
MMPROJ_PATH = r"C:\prep395\models\Xiaomi-OCR-0.mmproj-bf16.gguf"
MMPROJ_BYTES = 207_346_624
MMPROJ_SHA256 = "634d6bc95781ebf4a3f06570a59859fa5082d488db540fd474bc6b4061aec90e"
IMAGE_PATH = (
    r"C:\Users\morel\Documents\Codex\2026-10-21"
    r"\deepseek-codex-gpt-advisor-reviewer\outputs"
    r"\OCRIsolatedLocalPrepare-root-20261028-005149\private\temp\prepared"
    r"\preprocessed-page1.png"
)
IMAGE_BYTES = 132_843
IMAGE_SHA256 = "6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a"

XIAOMI_OCR_PROMPT = (
    "Extract all information from the main body of the document image and represent it "
    "in markdown format, ignoring headers and footers. Tables should be expressed in OTSL "
    "format, formulas in the document should be represented using LATEX format, and the "
    "parsing should be organized according to the reading order."
)

SOURCE_PINS: dict[str, tuple[int, str]] = {
    (
        r"C:\Users\morel\Documents\Codex\2026-10-21"
        r"\deepseek-codex-gpt-advisor-reviewer\outputs"
        r"\OCR-395-human-auth-readonly-current.json"
    ): (
        3_415,
        "ded48e494b1b98485afd1ff70608c9629557291bf85464ee2bac0254def4f5a7",
    ),
    (
        r"C:\Users\morel\Documents\Codex\2026-10-21"
        r"\deepseek-codex-gpt-advisor-reviewer\outputs"
        r"\OCR-human-WER-crash-metadata-current.json"
    ): (
        1_104,
        "a1cda1d8d778e54886af02ef19cf757c39473cd3cd2cb057213a0192700aa683",
    ),
    (
        r"C:\Users\morel\Documents\Codex\2026-10-21"
        r"\deepseek-codex-gpt-advisor-reviewer\outputs"
        r"\OCR-human-diagnostic-window-current.json"
    ): (
        1_219,
        "02f71ec6150cec089f9fef25182b9af29b19cc9987deb06e03157b089878abfd",
    ),
    (
        r"C:\Users\morel\Documents\Codex\2026-10-21"
        r"\deepseek-codex-gpt-advisor-reviewer\outputs"
        r"\OCR-isolated-final-candidate-root-current.json"
    ): (
        2_334,
        "5bfd8002c0238769de01d839bc3f8d26d097fe5abb4e942b41d09d57fd45c59f",
    ),
    r"D:\Lawbeach\lawbench-C\prep395\prep395\backends.py": (
        10_931,
        "5cd1446577b7a61b60146d42a56e8778ecda0623dd2a5490b4b27e7138fc6200",
    ),
    (
        r"D:\Lawbeach\lawbench-C\prep395\deploy"
        r"\isolated-synthetic-crash-20261028-001334\run-isolated-ocr.ps1"
    ): (
        37_041,
        "eb92b2877ed181946d3dac74a3c10994474d0071dca594ccd7db4d3d0cada8e8",
    ),
}

PIN_KEYS = {"path", "bytes", "sha256"}
ADMISSION_KEYS = {
    "schema",
    "verdict",
    "run_dir",
    "cli",
    "model",
    "mmproj",
    "image",
    "argv",
    "source_pins",
}
REPARSE_ATTRIBUTE = getattr(stat, "FILE_ATTRIBUTE_REPARSE_POINT", 0x400)
CREATE_NO_WINDOW = getattr(subprocess, "CREATE_NO_WINDOW", 0)


class AdmissionError(RuntimeError):
    pass


class TimeBudgetExceeded(RuntimeError):
    pass


def normalized_path(value: str) -> str:
    return os.path.normcase(os.path.normpath(os.path.abspath(value)))


def same_path(left: str, right: str) -> bool:
    return normalized_path(left) == normalized_path(right)


def literal_same_path(left: str, right: str) -> bool:
    return os.path.normcase(os.path.normpath(left)) == os.path.normcase(
        os.path.normpath(right)
    )


def exact_keys(value: Any, expected: set[str], label: str) -> dict[str, Any]:
    if type(value) is not dict:
        raise AdmissionError(f"{label} must be a JSON object")
    actual = set(value)
    if actual != expected:
        raise AdmissionError(
            f"{label} fields differ: missing={sorted(expected - actual)} "
            f"unexpected={sorted(actual - expected)}"
        )
    return value


def require_string(value: Any, label: str) -> str:
    if type(value) is not str or not value or "\x00" in value:
        raise AdmissionError(f"{label} must be a non-empty string without NUL")
    return value


def require_bytes(value: Any, label: str) -> int:
    if type(value) is not int or value < 0:
        raise AdmissionError(f"{label} must be a non-negative integer")
    return value


def require_sha256(value: Any, label: str) -> str:
    text = require_string(value, label)
    if re.fullmatch(r"[0-9a-fA-F]{64}", text) is None:
        raise AdmissionError(f"{label} must be a 64-digit SHA-256")
    return text.lower()


def parse_pin(value: Any, label: str) -> dict[str, Any]:
    pin = exact_keys(value, PIN_KEYS, label)
    path = require_string(pin["path"], f"{label}.path")
    if not os.path.isabs(path):
        raise AdmissionError(f"{label}.path must be absolute")
    return {
        "path": path,
        "bytes": require_bytes(pin["bytes"], f"{label}.bytes"),
        "sha256": require_sha256(pin["sha256"], f"{label}.sha256"),
    }


def assert_existing_path_has_no_reparse(path: str, label: str) -> None:
    current = os.path.abspath(path)
    while True:
        if os.path.lexists(current):
            item = os.lstat(current)
            if getattr(item, "st_file_attributes", 0) & REPARSE_ATTRIBUTE:
                raise AdmissionError(f"{label} traverses a reparse point: {current}")
        parent = os.path.dirname(current)
        if parent == current:
            return
        current = parent


def validate_admission(value: Any) -> dict[str, Any]:
    admission = exact_keys(value, ADMISSION_KEYS, "admission")
    if admission["schema"] != ADMISSION_SCHEMA:
        raise AdmissionError("admission.schema is not the required literal")
    if admission["verdict"] != ADMISSION_VERDICT:
        raise AdmissionError("admission.verdict is not the required literal")

    run_dir = require_string(admission["run_dir"], "admission.run_dir")
    if not os.path.isabs(run_dir):
        raise AdmissionError("admission.run_dir must be absolute")
    run_dir = os.path.abspath(run_dir)
    if os.path.normcase(os.path.dirname(run_dir)) != os.path.normcase(RUN_BASE):
        raise AdmissionError(f"admission.run_dir must be directly under {RUN_BASE}")
    if RUN_NAME_RE.fullmatch(os.path.basename(run_dir)) is None:
        raise AdmissionError(
            "admission.run_dir basename must be lb-ocr-native-<fresh-id>"
        )
    if os.path.lexists(run_dir):
        raise AdmissionError("admission.run_dir already exists; a new directory is required")
    if not os.path.isdir(os.path.dirname(run_dir)):
        raise AdmissionError("admission.run_dir parent does not exist")
    assert_existing_path_has_no_reparse(run_dir, "admission.run_dir")

    cli = parse_pin(admission["cli"], "admission.cli")
    model = parse_pin(admission["model"], "admission.model")
    mmproj = parse_pin(admission["mmproj"], "admission.mmproj")
    image = parse_pin(admission["image"], "admission.image")

    if not literal_same_path(cli["path"], CLI_PATH):
        raise AdmissionError(f"admission.cli.path must be exactly {CLI_PATH}")
    expected_fixed = (
        (model, MODEL_PATH, MODEL_BYTES, MODEL_SHA256, "model"),
        (mmproj, MMPROJ_PATH, MMPROJ_BYTES, MMPROJ_SHA256, "mmproj"),
        (image, IMAGE_PATH, IMAGE_BYTES, IMAGE_SHA256, "image"),
    )
    for pin, path, byte_count, digest, label in expected_fixed:
        if not literal_same_path(pin["path"], path):
            raise AdmissionError(f"admission.{label}.path is not the frozen path")
        if pin["bytes"] != byte_count or pin["sha256"] != digest:
            raise AdmissionError(f"admission.{label} identity is not the frozen identity")

    source_pins_value = admission["source_pins"]
    if type(source_pins_value) is not list or len(source_pins_value) != len(SOURCE_PINS):
        raise AdmissionError("admission.source_pins must contain exactly six pins")
    source_pins: dict[str, dict[str, Any]] = {}
    for index, raw_pin in enumerate(source_pins_value):
        pin = parse_pin(raw_pin, f"admission.source_pins[{index}]")
        key = normalized_path(pin["path"])
        if key in source_pins:
            raise AdmissionError("admission.source_pins contains a duplicate path")
        source_pins[key] = pin
    expected_sources = {normalized_path(path): (path, pin) for path, pin in SOURCE_PINS.items()}
    if set(source_pins) != set(expected_sources):
        raise AdmissionError("admission.source_pins does not match the six frozen sources")
    for key, (_, expected) in expected_sources.items():
        pin = source_pins[key]
        if pin["bytes"] != expected[0] or pin["sha256"] != expected[1]:
            raise AdmissionError(f"admission.source_pins identity differs: {pin['path']}")

    argv = admission["argv"]
    if type(argv) is not list or not all(type(item) is str for item in argv):
        raise AdmissionError("admission.argv must be a string array")
    expected_argv = [
        "-m",
        model["path"],
        "--mmproj",
        mmproj["path"],
        "--image",
        image["path"],
        "-p",
        XIAOMI_OCR_PROMPT,
        "-n",
        "4096",
        "-c",
        "32768",
        "-ngl",
        "99",
        "--temp",
        "0",
    ]
    if argv != expected_argv:
        raise AdmissionError("admission.argv is not the single fixed approved argv")

    all_paths = [
        cli["path"],
        model["path"],
        mmproj["path"],
        image["path"],
        *[pin["path"] for pin in source_pins.values()],
    ]
    normalized = [normalized_path(path) for path in all_paths]
    if len(normalized) != len(set(normalized)):
        raise AdmissionError("admission input/source paths must be distinct")

    return {
        "run_dir": run_dir,
        "cli": cli,
        "model": model,
        "mmproj": mmproj,
        "image": image,
        "argv": argv,
        "source_pins": [source_pins[key] for key in sorted(source_pins)],
    }


def load_admission(path: str) -> tuple[dict[str, Any], str]:
    admission_path = require_string(path, "admission path")
    if not os.path.isabs(admission_path):
        raise AdmissionError("admission path must be absolute")
    admission_path = os.path.abspath(admission_path)
    if not os.path.isfile(admission_path):
        raise AdmissionError("admission path is missing or is not a regular file")
    assert_existing_path_has_no_reparse(admission_path, "admission path")

    def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, item in pairs:
            if key in result:
                raise AdmissionError(f"admission JSON contains duplicate key: {key}")
            result[key] = item
        return result

    try:
        with open(admission_path, "r", encoding="utf-8", newline="") as handle:
            raw = json.load(handle, object_pairs_hook=reject_duplicate_keys)
    except (OSError, UnicodeError, json.JSONDecodeError) as exc:
        raise AdmissionError(
            f"admission JSON could not be read strictly as UTF-8 JSON: {type(exc).__name__}"
        ) from exc
    return validate_admission(raw), admission_path


def remaining_seconds(deadline: float) -> float:
    return deadline - time.monotonic()


def fingerprint(path: str, deadline: float) -> dict[str, Any]:
    assert_existing_path_has_no_reparse(path, "input")
    before = os.lstat(path)
    if not stat.S_ISREG(before.st_mode):
        raise AdmissionError(f"input is not a regular file: {path}")
    digest = hashlib.sha256()
    byte_count = 0
    with open(path, "rb", buffering=0) as handle:
        while True:
            if remaining_seconds(deadline) <= 0:
                raise TimeBudgetExceeded("300-second diagnostic budget exhausted while hashing input")
            chunk = handle.read(1024 * 1024)
            if not chunk:
                break
            digest.update(chunk)
            byte_count += len(chunk)
    after = os.lstat(path)
    if (
        before.st_size != after.st_size
        or before.st_mtime_ns != after.st_mtime_ns
        or byte_count != after.st_size
    ):
        raise AdmissionError(f"input changed while it was being fingerprinted: {path}")
    return {
        "path": path,
        "bytes": byte_count,
        "sha256": digest.hexdigest(),
        "mtime_ns": after.st_mtime_ns,
    }


def verify_expected(record: dict[str, Any], pin: dict[str, Any]) -> None:
    if record["bytes"] != pin["bytes"] or record["sha256"] != pin["sha256"]:
        raise AdmissionError(
            f"actual input identity differs from admission: {pin['path']}"
        )


def compare_fingerprints(
    before: dict[str, dict[str, Any]], deadline: float
) -> tuple[bool, list[dict[str, Any]], list[dict[str, Any]]]:
    records: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []
    try:
        for key in sorted(before):
            current = fingerprint(before[key]["path"], deadline)
            records.append(current)
            prior = before[key]
            for field in ("bytes", "sha256", "mtime_ns"):
                if current[field] != prior[field]:
                    errors.append(
                        {
                            "type": "InputChanged",
                            "path": current["path"],
                            "field": field,
                            "before": prior[field],
                            "after": current[field],
                        }
                    )
    except TimeBudgetExceeded as exc:
        errors.append({"type": "PostValidationTimeBudgetExceeded", "message": str(exc)})
        return False, records, errors
    except (AdmissionError, OSError) as exc:
        errors.append(
            {
                "type": type(exc).__name__,
                "message": str(exc),
            }
        )
        return False, records, errors
    return not errors, records, errors


def make_environment(run_dir: str) -> tuple[dict[str, str], dict[str, str]]:
    private_dirs = {
        "HOME": os.path.join(run_dir, "home"),
        "USERPROFILE": os.path.join(run_dir, "profile"),
        "APPDATA": os.path.join(run_dir, "appdata"),
        "LOCALAPPDATA": os.path.join(run_dir, "localappdata"),
        "TEMP": os.path.join(run_dir, "temp"),
        "TMP": os.path.join(run_dir, "temp"),
    }
    for path in sorted(set(private_dirs.values())):
        os.mkdir(path)
        if os.path.islink(path) or (
            getattr(os.lstat(path), "st_file_attributes", 0) & REPARSE_ATTRIBUTE
        ):
            raise AdmissionError(f"private environment directory became a reparse point: {path}")

    environment: dict[str, str] = {}
    for name in ("SystemRoot", "SystemDrive", "ComSpec", "PATHEXT", "PATH", "WINDIR"):
        value = os.environ.get(name)
        if value:
            environment[name] = value
    environment.update(private_dirs)
    drive, tail = os.path.splitdrive(private_dirs["USERPROFILE"])
    environment["HOMEDRIVE"] = drive
    environment["HOMEPATH"] = tail

    identity_environment = dict(environment)
    system_root = environment.get("SystemRoot", r"C:\Windows")
    identity_environment["PSModulePath"] = os.path.join(
        system_root, "System32", "WindowsPowerShell", "v1.0", "Modules"
    )
    return environment, identity_environment


def query_processes(
    filter_name: str,
    filter_value: int,
    timeout_seconds: float,
    identity_environment: dict[str, str],
) -> dict[str, Any]:
    if filter_name not in {"ProcessId", "ParentProcessId"}:
        raise AdmissionError("unapproved CIM filter")
    if type(filter_value) is not int or filter_value <= 0:
        raise AdmissionError("invalid PID for fixed readonly CIM query")
    if timeout_seconds <= 0:
        return {
            "ok": False,
            "items": [],
            "error": "no time remains for fixed readonly CIM query",
        }

    powershell = r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
    if not os.path.isfile(powershell):
        return {
            "ok": False,
            "items": [],
            "error": "fixed Windows PowerShell identity-query executable is absent",
        }
    assert_existing_path_has_no_reparse(powershell, "identity-query executable")
    command = (
        f"$items = @(Get-CimInstance Win32_Process -Filter "
        f"'{filter_name} = {filter_value}' | ForEach-Object "
        "{ [pscustomobject]@{ pid = [int]$_.ProcessId; "
        "exe = [string]$_.ExecutablePath; "
        "birth_utc = ([datetime]$_.CreationDate).ToUniversalTime().ToString('o') } }); "
        "ConvertTo-Json -InputObject $items -Compress"
    )
    bounded_timeout = max(0.5, min(timeout_seconds, IDENTITY_QUERY_SECONDS))
    try:
        completed = subprocess.run(
            [
                powershell,
                "-NoLogo",
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                command,
            ],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=bounded_timeout,
            check=False,
            env=identity_environment,
            creationflags=CREATE_NO_WINDOW,
        )
    except (OSError, subprocess.TimeoutExpired) as exc:
        return {
            "ok": False,
            "items": [],
            "error": f"fixed readonly CIM query failed: {type(exc).__name__}",
        }
    if completed.returncode != 0:
        return {
            "ok": False,
            "items": [],
            "error": f"fixed readonly CIM query returned {completed.returncode}",
        }
    try:
        text = completed.stdout.decode("utf-8-sig", errors="strict").strip()
        decoded = json.loads(text if text else "[]")
    except (UnicodeError, json.JSONDecodeError) as exc:
        return {
            "ok": False,
            "items": [],
            "error": f"fixed readonly CIM output was invalid: {type(exc).__name__}",
        }
    if type(decoded) is not list:
        return {
            "ok": False,
            "items": [],
            "error": "fixed readonly CIM output was not an array",
        }
    items: list[dict[str, Any]] = []
    for item in decoded:
        if type(item) is not dict:
            return {
                "ok": False,
                "items": [],
                "error": "fixed readonly CIM output contained a non-object",
            }
        items.append(
            {
                "pid": item.get("pid"),
                "exe": item.get("exe"),
                "birth_utc": item.get("birth_utc"),
            }
        )
    return {"ok": True, "items": items, "error": None}


def identity_matches(item: dict[str, Any], pid: int, exe: str, birth_utc: str) -> bool:
    item_pid = item.get("pid")
    item_exe = item.get("exe")
    item_birth = item.get("birth_utc")
    return (
        type(item_pid) is int
        and item_pid == pid
        and type(item_exe) is str
        and type(item_birth) is str
        and same_path(item_exe, exe)
        and item_birth == birth_utc
    )


def get_exact_identity(
    pid: int, deadline: float, identity_environment: dict[str, str]
) -> dict[str, Any]:
    available = remaining_seconds(deadline)
    if available <= 0:
        return {
            "ok": False,
            "items": [],
            "error": "no time remains for exact identity query",
        }
    query = query_processes(
        "ProcessId",
        pid,
        min(IDENTITY_QUERY_SECONDS, available),
        identity_environment,
    )
    matches = [
        item
        for item in query["items"]
        if type(item.get("pid")) is int and item["pid"] == pid
    ]
    return {**query, "items": matches}


def return_code_record(return_code: int | None) -> dict[str, Any]:
    if return_code is None:
        return {"python_return_code": None, "unsigned_hex": None, "signed_value": None}
    unsigned = return_code & 0xFFFFFFFF
    signed = unsigned - 0x100000000 if unsigned >= 0x80000000 else unsigned
    return {
        "python_return_code": return_code,
        "unsigned_hex": f"0x{unsigned:08X}",
        "signed_value": signed,
    }


def summarize_log(path: str) -> dict[str, Any]:
    try:
        size = os.path.getsize(path)
        with open(path, "rb") as handle:
            data = handle.read(4 * 1024 * 1024)
        text = data.decode("utf-8", errors="replace")
    except OSError as exc:
        return {
            "bytes": None,
            "sha256": None,
            "summary_complete": False,
            "error": type(exc).__name__,
            "safe_lines": [],
        }
    selected: list[str] = []
    pattern = re.compile(
        r"(?i)(assert|exception|error|fatal|abort|fail|c0000409|ntstatus|"
        r"\.dll|\.exe|offset|stack)"
    )
    seen: set[str] = set()
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or not pattern.search(line):
            continue
        safe = line[:500]
        if safe not in seen:
            seen.add(safe)
            selected.append(safe)
        if len(selected) >= 20:
            break
    digest = hashlib.sha256()
    try:
        with open(path, "rb") as handle:
            while True:
                chunk = handle.read(1024 * 1024)
                if not chunk:
                    break
                digest.update(chunk)
    except OSError:
        digest_value = None
    else:
        digest_value = digest.hexdigest()
    assertion_lines = [
        line for line in selected if re.search(r"(?i)\bassert", line)
    ][:10]
    modules = sorted(
        {
            match.group(0)
            for line in selected
            for match in re.finditer(r"(?i)[A-Za-z0-9_.-]+\.(?:dll|exe)", line)
        }
    )[:20]
    offsets = sorted(
        {
            match.group(0)
            for line in selected
            for match in re.finditer(r"(?i)0x[0-9a-f]{4,16}", line)
        }
    )[:20]
    return {
        "bytes": size,
        "sha256": digest_value,
        "summary_complete": size <= len(data),
        "summary_scope_bytes": len(data),
        "safe_lines": selected,
        "assertion_lines": assertion_lines,
        "modules": modules,
        "offsets": offsets,
    }


def write_json_exclusive(path: str, value: dict[str, Any]) -> None:
    payload = json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    with open(path, "x", encoding="utf-8", newline="\n") as handle:
        handle.write(payload)
        handle.flush()
        os.fsync(handle.fileno())


def run_diagnostic(
    admission: dict[str, Any],
    admission_path: str,
    deadline: float,
) -> tuple[dict[str, Any], int]:
    run_dir = admission["run_dir"]
    os.mkdir(run_dir)
    if getattr(os.lstat(run_dir), "st_file_attributes", 0) & REPARSE_ATTRIBUTE:
        raise AdmissionError("new run directory is a reparse point")

    result: dict[str, Any] = {
        "artifact_schema": RESULT_SCHEMA,
        "status": "PREFLIGHT",
        "counterfactual_only": True,
        "causal_proof": False,
        "quality_verdict": "NOT_ASSESSED",
        "http_used": False,
        "server_started": False,
        "inference_attempt_limit": 1,
        "inference_attempts": 0,
        "time_budget_seconds": MAX_TOTAL_SECONDS,
        "started_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "run_dir": run_dir,
        "admission_path": admission_path,
        "argv": admission["argv"],
        "argv_sha256": hashlib.sha256(
            json.dumps(admission["argv"], ensure_ascii=False, separators=(",", ":")).encode(
                "utf-8"
            )
        ).hexdigest(),
        "inputs_before": [],
        "inputs_after": [],
        "inputs_unchanged": False,
        "child": {},
        "forced_stop": False,
        "forced_stop_note": "No stop was attempted.",
        "errors": [],
    }
    process: subprocess.Popen[bytes] | None = None
    child_pid: int | None = None
    initial_identity: dict[str, Any] | None = None
    initial_identity_verified = False
    stdout_handle = None
    stderr_handle = None
    stdout_path = os.path.join(run_dir, "child.stdout.log")
    stderr_path = os.path.join(run_dir, "child.stderr.log")
    identity_environment: dict[str, str] | None = None

    try:
        child_environment, identity_environment = make_environment(run_dir)

        pins = [
            admission["cli"],
            admission["model"],
            admission["mmproj"],
            admission["image"],
            *admission["source_pins"],
        ]
        admission_pin = {
            "path": admission_path,
            "bytes": None,
            "sha256": None,
        }
        before_by_path: dict[str, dict[str, Any]] = {}
        for pin in pins:
            record = fingerprint(pin["path"], deadline)
            verify_expected(record, pin)
            before_by_path[normalized_path(pin["path"])] = record
        admission_record = fingerprint(admission_path, deadline)
        admission_record["expected_bytes"] = admission_pin["bytes"]
        admission_record["expected_sha256"] = admission_pin["sha256"]
        before_by_path[normalized_path(admission_path)] = admission_record
        result["inputs_before"] = [
            before_by_path[key] for key in sorted(before_by_path)
        ]

        if remaining_seconds(deadline) <= POST_CHILD_RESERVE_SECONDS:
            raise TimeBudgetExceeded(
                "insufficient time remains for one child attempt plus attribution checks"
            )

        result["status"] = "STARTING_ONE_NATIVE_CLI_CHILD"
        stdout_handle = open(stdout_path, "xb", buffering=0)
        stderr_handle = open(stderr_path, "xb", buffering=0)
        process = subprocess.Popen(
            [admission["cli"]["path"], *admission["argv"]],
            stdin=subprocess.DEVNULL,
            stdout=stdout_handle,
            stderr=stderr_handle,
            cwd=run_dir,
            env=child_environment,
            shell=False,
            close_fds=True,
            creationflags=CREATE_NO_WINDOW,
        )
        result["inference_attempts"] = 1
        child_pid = process.pid
        result["child"] = {
            "pid": child_pid,
            "process_handle_held": True,
            "startup_identity_verified": False,
            "startup_identity_query": None,
            "natural_exit": None,
            "waited": False,
            "wait_timed_out": False,
            "exact_identity_absence_verified": False,
            "identity_absence_query": None,
            "descendants_complete": False,
            "descendants": [],
            "descendant_query": None,
            "process_handle_poll": None,
            "return_code": return_code_record(None),
        }

        initial_identity = get_exact_identity(
            child_pid, deadline, identity_environment
        )
        result["child"]["startup_identity_query"] = initial_identity
        if initial_identity["ok"] and len(initial_identity["items"]) == 1:
            candidate = initial_identity["items"][0]
            birth_utc = candidate.get("birth_utc")
            exe = candidate.get("exe")
            if (
                type(birth_utc) is str
                and birth_utc
                and type(exe) is str
                and same_path(exe, admission["cli"]["path"])
            ):
                initial_identity_verified = True
                result["child"]["startup_exact_identity"] = candidate
                result["child"]["startup_identity_verified"] = True
            else:
                result["child"]["startup_identity_mismatch"] = candidate
        elif initial_identity["ok"] and len(initial_identity["items"]) == 0:
            result["child"]["startup_identity_note"] = (
                "child exited or disappeared before exact PID/exe/UTC-birth could be established"
            )
        else:
            result["child"]["startup_identity_note"] = (
                "startup identity query failed; no stop is authorized"
            )

        child_wait = remaining_seconds(deadline) - POST_CHILD_RESERVE_SECONDS
        child_wait = max(0.5, child_wait)
        try:
            process.wait(timeout=child_wait)
            result["child"]["waited"] = True
            result["child"]["natural_exit"] = True
        except subprocess.TimeoutExpired:
            result["child"]["waited"] = True
            result["child"]["natural_exit"] = False
            result["child"]["wait_timed_out"] = True
            if initial_identity_verified and process.poll() is None:
                fresh = get_exact_identity(
                    child_pid, deadline, identity_environment
                )
                result["child"]["stop_identity_query"] = fresh
                if (
                    fresh["ok"]
                    and len(fresh["items"]) == 1
                    and identity_matches(
                        fresh["items"][0],
                        child_pid,
                        admission["cli"]["path"],
                        result["child"]["startup_exact_identity"]["birth_utc"],
                    )
                    and process.poll() is None
                ):
                    result["forced_stop"] = True
                    result["forced_stop_note"] = (
                        "Popen.kill was invoked only after a fresh exact "
                        "PID/exe/UTC-birth match."
                    )
                    try:
                        process.kill()
                    except OSError as exc:
                        result["errors"].append(
                            {
                                "phase": "bounded_stop",
                                "type": type(exc).__name__,
                                "message": str(exc),
                            }
                        )
                    final_wait = max(
                        0.1,
                        min(FINAL_STOP_WAIT_SECONDS, remaining_seconds(deadline)),
                    )
                    try:
                        process.wait(timeout=final_wait)
                    except subprocess.TimeoutExpired:
                        result["child"]["post_stop_wait_timed_out"] = True
                else:
                    result["forced_stop"] = False
                    result["forced_stop_note"] = (
                        "Timeout encountered, but fresh exact identity was not proven; "
                        "no stop was attempted."
                    )
            else:
                result["forced_stop"] = False
                result["forced_stop_note"] = (
                    "Timeout encountered without verified ownership; no stop was attempted."
                )

        if stdout_handle is not None:
            stdout_handle.flush()
            os.fsync(stdout_handle.fileno())
            stdout_handle.close()
            stdout_handle = None
        if stderr_handle is not None:
            stderr_handle.flush()
            os.fsync(stderr_handle.fileno())
            stderr_handle.close()
            stderr_handle = None

        return_code = process.poll()
        result["child"]["return_code"] = return_code_record(return_code)
        result["child"]["process_handle_poll"] = return_code

        absence_query = get_exact_identity(
            child_pid, deadline, identity_environment
        )
        result["child"]["identity_absence_query"] = absence_query
        exact_identity_present = (
            initial_identity_verified
            and absence_query["ok"]
            and len(absence_query["items"]) == 1
            and identity_matches(
                absence_query["items"][0],
                child_pid,
                admission["cli"]["path"],
                result["child"]["startup_exact_identity"]["birth_utc"],
            )
        )
        result["child"]["exact_identity_absence_verified"] = (
            absence_query["ok"] and not exact_identity_present
        )

        descendant_query = query_processes(
            "ParentProcessId",
            child_pid,
            min(IDENTITY_QUERY_SECONDS, remaining_seconds(deadline)),
            identity_environment,
        )
        result["child"]["descendant_query"] = descendant_query
        result["child"]["descendants"] = descendant_query["items"]
        result["child"]["descendants_complete"] = (
            descendant_query["ok"] and len(descendant_query["items"]) == 0
        )

        inputs_unchanged, after_records, input_errors = compare_fingerprints(
            before_by_path, deadline
        )
        result["inputs_after"] = after_records
        result["inputs_unchanged"] = inputs_unchanged
        result["errors"].extend(
            {"phase": "input_recheck", **error} for error in input_errors
        )

        result["logs"] = {
            "stdout": {
                "path": stdout_path,
                **summarize_log(stdout_path),
            },
            "stderr": {
                "path": stderr_path,
                **summarize_log(stderr_path),
            },
        }

        if process.poll() is None:
            resource_not_closed = True
        else:
            resource_not_closed = not result["child"]["exact_identity_absence_verified"]

        result["cleanup_complete"] = (
            not resource_not_closed
            and initial_identity_verified
            and result["child"]["descendants_complete"]
        )

        if resource_not_closed:
            status = "RESOURCE_NOT_CLOSED"
            exit_code = 21
        elif not inputs_unchanged:
            status = "INPUT_CHANGED_OR_RECHECK_NOT_PROVEN"
            exit_code = 23
        elif not initial_identity_verified:
            status = "CHILD_IDENTITY_NOT_PROVEN"
            exit_code = 22
        elif not result["child"]["descendants_complete"]:
            status = "NOT_PROVEN_DESCENDANTS_PRESENT_OR_UNVERIFIED"
            exit_code = 22
        elif result["forced_stop"]:
            status = "FORCED_STOP_AFTER_BOUND"
            exit_code = 12
        elif return_code == 0:
            status = "COUNTERFACTUAL_COMPLETED_ZERO_NOT_QUALITY_PASS"
            exit_code = 0
        else:
            status = "COUNTERFACTUAL_NONZERO_EXIT"
            exit_code = 10
        result["status"] = status
        result["exit_code"] = exit_code
        result["ended_at_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        result["elapsed_ms"] = int((MAX_TOTAL_SECONDS - remaining_seconds(deadline)) * 1000)
        result["time_budget_exhausted"] = remaining_seconds(deadline) <= 0
        return result, exit_code
    except Exception as exc:
        result["status"] = "BLOCKED_OR_INCOMPLETE"
        result["errors"].append(
            {
                "phase": "runtime",
                "type": type(exc).__name__,
                "message": str(exc),
            }
        )
        if process is not None and child_pid is not None and process.poll() is None:
            if initial_identity_verified and identity_environment is not None:
                fresh = get_exact_identity(
                    child_pid, deadline, identity_environment
                )
                birth_utc = result["child"]["startup_exact_identity"]["birth_utc"]
                if (
                    fresh["ok"]
                    and len(fresh["items"]) == 1
                    and identity_matches(
                        fresh["items"][0],
                        child_pid,
                        admission["cli"]["path"],
                        birth_utc,
                    )
                    and process.poll() is None
                ):
                    result["forced_stop"] = True
                    result["forced_stop_note"] = (
                        "Exception cleanup used Popen.kill only after fresh exact identity match."
                    )
                    try:
                        process.kill()
                    except OSError:
                        pass
                    try:
                        process.wait(
                            timeout=max(
                                0.1,
                                min(FINAL_STOP_WAIT_SECONDS, remaining_seconds(deadline)),
                            )
                        )
                    except subprocess.TimeoutExpired:
                        pass
            else:
                result["forced_stop_note"] = (
                    "Exception cleanup found no verified ownership; no stop was attempted."
                )
        for handle in (stdout_handle, stderr_handle):
            if handle is not None:
                try:
                    handle.flush()
                    os.fsync(handle.fileno())
                    handle.close()
                except OSError:
                    pass
        if os.path.isfile(stdout_path) or os.path.isfile(stderr_path):
            result["logs"] = {
                name: {"path": path, **summarize_log(path)}
                for name, path in (("stdout", stdout_path), ("stderr", stderr_path))
                if os.path.isfile(path)
            }
        result["exit_code"] = 20
        result["ended_at_utc"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        result["elapsed_ms"] = int((MAX_TOTAL_SECONDS - remaining_seconds(deadline)) * 1000)
        result["time_budget_exhausted"] = remaining_seconds(deadline) <= 0
        return result, 20


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="One-shot offline native llama-mtmd-cli counterfactual"
    )
    parser.add_argument("--admission", required=True, help="absolute root admission JSON")
    arguments = parser.parse_args(argv)
    deadline = time.monotonic() + MAX_TOTAL_SECONDS

    if os.name != "nt":
        print(
            json.dumps(
                {
                    "status": "BLOCKED_BEFORE_RUN_DIR",
                    "error": "Windows is required",
                },
                ensure_ascii=False,
            )
        )
        return 20

    try:
        admission, admission_path = load_admission(arguments.admission)
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "BLOCKED_BEFORE_RUN_DIR",
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 20

    try:
        result, exit_code = run_diagnostic(admission, admission_path, deadline)
        result_path = Path(admission["run_dir"]) / "diagnostic-result.json"
        write_json_exclusive(str(result_path), result)
        print(
            json.dumps(
                {
                    "status": result["status"],
                    "exit_code": exit_code,
                    "result": str(result_path),
                    "quality_verdict": "NOT_ASSESSED",
                    "causal_proof": False,
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return exit_code
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "RESULT_ARTIFACT_FAILURE",
                    "error_type": type(exc).__name__,
                    "error": str(exc),
                    "run_dir": admission["run_dir"],
                },
                ensure_ascii=False,
                sort_keys=True,
            )
        )
        return 20


if __name__ == "__main__":
    sys.exit(main())
