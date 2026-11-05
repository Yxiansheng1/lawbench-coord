#!/usr/bin/env python3
"""Continue the genuine T18 task through the production B redline exporter.

This script is intentionally a finite, in-process continuation:

* preflight the immutable genuine T18 inputs;
* copy the completed case byte-for-byte into a caller-supplied fresh root;
* register and open only that copied case in a private appdata directory;
* load the already-completed task and its real model edit list;
* call ``Exporter.redline`` directly, without ASGI startup or HTTP;
* inspect the DOCX independently and audit source/copy preservation.

It never starts the product lifespan, OCR, retainer, network forwarding, a
model, or an ASGI server. The original failed report and the business-quality
failure are reported as immutable facts, never repaired or relabelled.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import json
import os
import pathlib
import shutil
import stat
import sys
import traceback
import zipfile
from collections import Counter
from datetime import datetime, timezone
from typing import Any
from xml.etree import ElementTree as ET

import httpx


EVIDENCE_DIR = pathlib.Path(__file__).resolve().parent
REPO_ROOT = EVIDENCE_DIR.parents[4]
SERVICE_ROOT = REPO_ROOT / "service"
CONTRACTS_DIR = REPO_ROOT / "contracts"
SKILLS_DIR = REPO_ROOT / "skills"

INPUT_DIR = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T18GenuineArtifactContinuationInput-20261028-235617"
)
INPUT_MANIFEST = INPUT_DIR / "genuine-inputs.json"
INPUT_MANIFEST_SHA = "e776968f25602af1640987ec08245af911e1f60713eef12fcc6b9a95ace24ab1"

EXPECTED_TASK_ID = "T-20261028234100-6b49"
EXPECTED_CASE_ID = "9d535ab5-f14c-42cc-bd99-a2f669ff6200"
EXPECTED_SESSION = "session-1cb28369-3a90-46dc-b047-e64986038394"
EXPECTED_REQUEST = "60fda87b-25a9-40c1-9abd-1e4893fa7b8b"
EXPECTED_SOURCE_PINS_SHA = "2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379"
EXPECTED_FIXED_INPUTS_SHA = "13b6c8333dbf6f3fef9fbb0d9e7761449b6fab7bb0ca127950f59b3480e15b01"

W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
W = f"{{{W_NS}}}"


class PreflightError(RuntimeError):
    """An immutable input does not match the continuation order."""


class ValidationError(RuntimeError):
    """The production result failed an independent preservation or XML check."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def sha256_file(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def file_identity(path: pathlib.Path) -> dict[str, Any]:
    if path.is_symlink() or not path.is_file():
        raise PreflightError(f"not a regular file: {path}")
    info = path.stat(follow_symlinks=False)
    if not stat.S_ISREG(info.st_mode):
        raise PreflightError(f"not a regular file: {path}")
    return {
        "bytes": info.st_size,
        "sha256": sha256_file(path),
        "mtime_ns": info.st_mtime_ns,
    }


def tree_inventory(root: pathlib.Path) -> dict[str, dict[str, Any]]:
    if not root.is_dir():
        raise PreflightError(f"directory missing: {root}")
    result: dict[str, dict[str, Any]] = {}
    for current, dirnames, filenames in os.walk(root, followlinks=False):
        base = pathlib.Path(current)
        dirnames.sort()
        filenames.sort()
        for dirname in dirnames:
            candidate = base / dirname
            if candidate.is_symlink() or (
                hasattr(candidate, "is_junction") and candidate.is_junction()
            ):
                raise PreflightError(f"linked directory rejected: {candidate}")
        for filename in filenames:
            path = base / filename
            if path.is_symlink() or (
                hasattr(path, "is_junction") and path.is_junction()
            ):
                raise PreflightError(f"linked file rejected: {path}")
            result[path.relative_to(root).as_posix()] = file_identity(path)
    return result


def read_json(path: pathlib.Path) -> Any:
    with path.open("r", encoding="utf-8") as stream:
        return json.load(stream)


def write_json_exclusive(path: pathlib.Path, value: Any) -> None:
    if os.path.lexists(path):
        raise ValidationError(f"refusing to overwrite {path.name}")
    with path.open("x", encoding="utf-8", newline="\n") as stream:
        json.dump(value, stream, ensure_ascii=False, indent=2, sort_keys=True)
        stream.write("\n")
        stream.flush()
        os.fsync(stream.fileno())


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValidationError(message)


def require_preflight(condition: bool, message: str) -> None:
    if not condition:
        raise PreflightError(message)


def declared_inventory(entries: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    expected: dict[str, dict[str, Any]] = {}
    for entry in entries:
        relative = entry["relative"].replace("\\", "/")
        require_preflight(relative not in expected, f"duplicate inventory entry: {relative}")
        expected[relative] = {
            "bytes": int(entry["bytes"]),
            "sha256": str(entry["sha256"]).lower(),
            "mtime_ns": int(entry["mtime_ns"]),
        }
    return expected


def verify_tree_inventory(
    root: pathlib.Path, entries: list[dict[str, Any]], label: str
) -> dict[str, dict[str, Any]]:
    actual = tree_inventory(root)
    expected = declared_inventory(entries)
    require_preflight(set(actual) == set(expected), f"{label}: file set changed")
    for relative, wanted in expected.items():
        require_preflight(actual[relative] == wanted, f"{label}: changed {relative}")
    return actual


def verify_source_pins() -> int:
    pins_path = pathlib.Path(
        r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T18"
        r"\QuestionGateContractWorkflow-20261028-191702"
        r"\reviewed-b-source-pins-two-rate.json"
    )
    require_preflight(sha256_file(pins_path) == EXPECTED_SOURCE_PINS_SHA, "source pins hash")
    pins = read_json(pins_path)
    require_preflight(isinstance(pins, dict), "source pins shape")
    require_preflight(len(pins) == 346, "source pin count")
    repo = REPO_ROOT.resolve()
    for relative, wanted in pins.items():
        path = (REPO_ROOT / relative).resolve()
        require_preflight(path.is_relative_to(repo), f"source pin escaped repo: {relative}")
        require_preflight(path.is_file(), f"source pin missing: {relative}")
        identity = file_identity(path)
        require_preflight(identity["bytes"] == wanted["bytes"], f"source pin size: {relative}")
        require_preflight(
            identity["sha256"] == str(wanted["sha256"]).lower(),
            f"source pin hash: {relative}",
        )
    return len(pins)


def immutable_originals() -> dict[str, Any]:
    require_preflight(sha256_file(INPUT_MANIFEST) == INPUT_MANIFEST_SHA, "input manifest hash")
    manifest = read_json(INPUT_MANIFEST)
    require_preflight(
        manifest.get("format") == "genuine-t18-completed-artifact-continuation-v1",
        "input manifest format",
    )
    require_preflight(manifest["task_id"] == EXPECTED_TASK_ID, "task id")
    require_preflight(manifest["case_id"] == EXPECTED_CASE_ID, "case id")
    require_preflight(manifest["native_session"] == EXPECTED_SESSION, "native session")
    require_preflight(manifest["native_request"] == EXPECTED_REQUEST, "native request")

    report_path = pathlib.Path(manifest["original_report"])
    report = read_json(report_path)
    require_preflight(sha256_file(report_path) == manifest["original_report_sha"], "report hash")
    require_preflight(report["status"] == "FAILED", "original report must remain FAILED")
    require_preflight(report["authoredStatus"] == "AUTHORED_NOT_RUN", "authored status")
    require_preflight(report["taskId"] == EXPECTED_TASK_ID, "report task id")
    require_preflight(report["case"]["caseId"] == EXPECTED_CASE_ID, "report case id")
    require_preflight(report["nativeSessionId"] == EXPECTED_SESSION, "report session")
    require_preflight(report["requestId"] == EXPECTED_REQUEST, "report request")
    require_preflight(report["modelPosts"]["attempts"] == 10, "model post count")
    require_preflight(report["bService"]["final"]["passed"] is True, "prior B service pass")
    require_preflight(
        report["bService"]["final"]["protocol"]["redlinePath"] is None,
        "prior redline must be absent",
    )
    claims = report["claims"]
    require_preflight(claims["productionRedlineArtifact"] is False, "prior redline claim")
    require_preflight(claims["fullT18"] is False, "prior full T18 claim")
    require_preflight(claims["businessAcceptance"] is False, "prior business claim")
    require_preflight(claims["packaging"] is False, "prior packaging claim")

    failure_proof_path = pathlib.Path(manifest["original_failure_proof"])
    failure_proof = read_json(failure_proof_path)
    failure_bundle = read_json(INPUT_DIR / "actual-failure.json")
    require_preflight(failure_proof["task_status"] == "completed", "failure task status")
    require_preflight(failure_proof["business_quality_PASS"] is False, "business quality")
    require_preflight(failure_proof["manual_observer_false_negative"] is True, "manual false negative")
    require_preflight(failure_proof["matching_edit_id"] == 5, "manual edit id")
    require_preflight(failure_proof["redline_POST"] == 0, "prior redline POST")
    require_preflight(failure_proof["revised_DOCX"] == 0, "prior revised DOCX")
    require_preflight(failure_bundle["task_status"] == failure_proof["task_status"], "failure proof status")
    require_preflight(
        failure_bundle["business_quality_PASS"] == failure_proof["business_quality_PASS"],
        "failure proof quality",
    )

    source_case = pathlib.Path(manifest["source_case"])
    source_case_inventory = verify_tree_inventory(
        source_case, manifest["case_files"], "source case"
    )
    source_sessions = pathlib.Path(manifest["source_sessions"])
    source_session_inventory = verify_tree_inventory(
        source_sessions, manifest["session_files"], "source sessions"
    )

    task_root = source_case / "工作区" / "任务" / EXPECTED_TASK_ID
    task = read_json(task_root / "task.json")
    result = read_json(task_root / "result.json")
    edit_list = read_json(source_case / manifest["edit_list"])
    edit_bundle = read_json(INPUT_DIR / "actual-edits.json")
    require_preflight(task["task_id"] == EXPECTED_TASK_ID, "task json id")
    require_preflight(task["case_id"] == EXPECTED_CASE_ID, "task json case")
    require_preflight(task["session_id"] == EXPECTED_SESSION, "task json session")
    require_preflight(task["request_id"] == EXPECTED_REQUEST, "task json request")
    require_preflight(task["state"] == "finished", "task json must be finished")
    require_preflight(result["status"] == "completed", "result must remain completed")
    require_preflight(len(result["drafts"]) == 2, "two pre-existing drafts")
    require_preflight(edit_bundle["arguments"] == edit_list, "copied edit list vs actual model arguments")
    require_preflight(
        manifest["actual_edit_arguments"] == edit_list, "manifest edit arguments"
    )
    require_preflight(
        manifest["actual_edit_result"] == edit_bundle["result"], "manifest edit result"
    )
    require_preflight(edit_bundle["result"]["accepted"] == 5, "accepted edit count")
    require_preflight(len(edit_list["edits"]) == 6, "actual edit count")
    require_preflight(
        edit_bundle["result"]["out_of_scope"] == [{"id": 5, "reason": "find 跨越域代码或超链接"}],
        "manual out-of-scope identity",
    )

    native_events_path = INPUT_DIR / "actual-native-events.jsonl"
    matching_calls: list[dict[str, Any]] = []
    native_session_ids: list[str] = []
    with native_events_path.open("r", encoding="utf-8") as stream:
        for line in stream:
            if not line.strip():
                continue
            event = json.loads(line)
            if event.get("type") == "session":
                native_session_ids.append(event.get("id"))
            data = event.get("data") or {}
            if event.get("type") == "tool/call" and data.get("name") == "case_save_edit_list":
                arguments = json.loads(data["arguments"])
                matching_calls.append(
                    {
                        "call_id": data.get("callId"),
                        "arguments": arguments,
                    }
                )
    require_preflight(native_session_ids == [EXPECTED_SESSION], "native session header")
    require_preflight(len(matching_calls) == 1, "exactly one model edit-list call")
    require_preflight(matching_calls[0]["arguments"] == edit_list, "native model edit arguments")

    final_draft = source_case / manifest["draft"]["path"]
    final_draft_identity = file_identity(final_draft)
    require_preflight(final_draft_identity["bytes"] == manifest["draft"]["bytes"], "draft bytes")
    require_preflight(final_draft_identity["sha256"] == manifest["draft"]["sha256"], "draft hash")
    final_text = final_draft.read_text(encoding="utf-8")
    require_preflight("该条需人工修改" in final_text, "final draft manual caveat")
    require_preflight("合同第七条" in final_text, "article-number business defect retained")

    fixed_inputs_path = pathlib.Path(manifest["current_fixed_inputs"])
    require_preflight(
        sha256_file(fixed_inputs_path) == EXPECTED_FIXED_INPUTS_SHA, "fixed inputs hash"
    )
    fixed_inputs = read_json(fixed_inputs_path)
    fixtures = fixed_inputs["fixtures"]
    require_preflight(len(fixtures) == 2, "fixture count")
    for fixture in fixtures:
        identity = file_identity(pathlib.Path(fixture["path"]))
        require_preflight(identity["bytes"] == fixture["bytes"], f"fixture bytes: {fixture['id']}")
        require_preflight(identity["sha256"] == fixture["sha256"], f"fixture hash: {fixture['id']}")
        require_preflight(identity["mtime_ns"] == int(fixture["mtime_ns"]), f"fixture mtime: {fixture['id']}")
        copied_original = source_case / "02案件材料" / fixture["id"]
        if fixture["id"] == "采购合同":
            copied_original = copied_original.with_suffix(".docx")
        else:
            copied_original = copied_original.with_suffix(".txt")
        require_preflight(file_identity(copied_original) == identity, f"source case fixture: {fixture['id']}")

    source_pin_count = verify_source_pins()
    watched = {
        "input_manifest": file_identity(INPUT_MANIFEST),
        "input_actual_edits": file_identity(INPUT_DIR / "actual-edits.json"),
        "input_actual_failure": file_identity(INPUT_DIR / "actual-failure.json"),
        "input_native_events": file_identity(native_events_path),
        "original_report": file_identity(report_path),
        "original_failure_proof": file_identity(failure_proof_path),
        "source_pins": file_identity(
            pathlib.Path(manifest["B_source_pins"])
        ),
        "fixed_inputs": file_identity(fixed_inputs_path),
    }
    return {
        "manifest": manifest,
        "report": report,
        "failure_proof": failure_proof,
        "source_case": source_case,
        "source_sessions": source_sessions,
        "source_case_inventory": source_case_inventory,
        "source_session_inventory": source_session_inventory,
        "fixtures": fixtures,
        "task": task,
        "result": result,
        "edit_list": edit_list,
        "native_call": matching_calls[0],
        "final_draft": final_draft,
        "final_draft_identity": final_draft_identity,
        "source_pin_count": source_pin_count,
        "watched": watched,
    }


def audit_originals(context: dict[str, Any]) -> dict[str, Any]:
    checks: dict[str, bool] = {}
    errors: list[str] = []
    try:
        checks["sourceCaseUnchanged"] = (
            tree_inventory(context["source_case"]) == context["source_case_inventory"]
        )
    except BaseException as error:
        checks["sourceCaseUnchanged"] = False
        errors.append(f"sourceCase:{type(error).__name__}")
    try:
        checks["sourceSessionsUnchanged"] = (
            tree_inventory(context["source_sessions"])
            == context["source_session_inventory"]
        )
    except BaseException as error:
        checks["sourceSessionsUnchanged"] = False
        errors.append(f"sourceSessions:{type(error).__name__}")
    fixture_results: dict[str, bool] = {}
    for fixture in context["fixtures"]:
        try:
            fixture_results[fixture["id"]] = file_identity(pathlib.Path(fixture["path"])) == {
                "bytes": fixture["bytes"],
                "sha256": fixture["sha256"],
                "mtime_ns": int(fixture["mtime_ns"]),
            }
        except BaseException as error:
            fixture_results[fixture["id"]] = False
            errors.append(f"fixture:{fixture['id']}:{type(error).__name__}")
    checks["sourceFixturesUnchanged"] = all(fixture_results.values())
    watched_results: dict[str, bool] = {}
    for label, identity in context["watched"].items():
        path = {
            "input_manifest": INPUT_MANIFEST,
            "input_actual_edits": INPUT_DIR / "actual-edits.json",
            "input_actual_failure": INPUT_DIR / "actual-failure.json",
            "input_native_events": INPUT_DIR / "actual-native-events.jsonl",
            "original_report": pathlib.Path(context["manifest"]["original_report"]),
            "original_failure_proof": pathlib.Path(context["manifest"]["original_failure_proof"]),
            "source_pins": pathlib.Path(context["manifest"]["B_source_pins"]),
            "fixed_inputs": pathlib.Path(context["manifest"]["current_fixed_inputs"]),
        }[label]
        try:
            watched_results[label] = file_identity(path) == identity
        except BaseException as error:
            watched_results[label] = False
            errors.append(f"input:{label}:{type(error).__name__}")
    checks["watchedInputsUnchanged"] = all(watched_results.values())
    try:
        source_pin_count = verify_source_pins()
        checks["sourcePinsUnchanged"] = source_pin_count == context["source_pin_count"]
    except BaseException as error:
        source_pin_count = None
        checks["sourcePinsUnchanged"] = False
        errors.append(f"sourcePins:{type(error).__name__}")
    return {
        **checks,
        "sourcePinCount": source_pin_count,
        "fixtureChecks": fixture_results,
        "watchedInputChecks": watched_results,
        "errors": errors,
        "allUnchanged": all(checks.values()),
    }


class DisabledRetainer:
    """The exact finite-run sentinel used by the prior B service."""

    closed = False

    def close(self) -> None:
        self.closed = True


def canonical_elements(root: ET.Element, tag: str) -> Counter[str]:
    values: list[str] = []
    for element in root.iter(tag):
        payload = ET.tostring(element, encoding="unicode")
        values.append(ET.canonicalize(payload))
    return Counter(values)


def relation_entries(root: ET.Element) -> set[tuple[str, str, str, str]]:
    return {
        (
            element.attrib.get("Id", ""),
            element.attrib.get("Type", ""),
            element.attrib.get("Target", ""),
            element.attrib.get("TargetMode", ""),
        )
        for element in root.findall(f"{{{REL_NS}}}Relationship")
    }


def element_text(element: ET.Element, child_tag: str) -> str:
    return "".join(
        child.text or "" for child in element.iter(f"{W}{child_tag}")
    )


def inspect_docx(
    source_path: pathlib.Path,
    output_path: pathlib.Path,
    edits: list[dict[str, Any]],
    manual: list[dict[str, Any]],
    response_applied: int,
) -> dict[str, Any]:
    manual_ids = {item["id"] for item in manual}
    applied = [edit for edit in edits if edit["id"] not in manual_ids]
    require(manual == [{"id": 5, "reason": "find 跨越域代码或超链接"}], "manual set is not actual id 5")
    require(response_applied == len(applied), "applied count is not actual accepted count")
    require(response_applied > 0, "production exporter did not apply any edit")
    require(len(applied) + len(manual) == len(edits), "edit accounting")

    expected_ins = Counter(edit["text"] for edit in applied if edit["action"] in ("replace", "insert_after"))
    expected_del = Counter(edit["find"] for edit in applied if edit["action"] in ("replace", "delete"))
    expected_comments = Counter(edit["comment"] for edit in applied)

    with zipfile.ZipFile(source_path) as source_zip, zipfile.ZipFile(output_path) as out_zip:
        source_names = set(source_zip.namelist())
        out_names = set(out_zip.namelist())
        require(source_names.issubset(out_names), "source DOCX parts removed")
        source_doc = ET.fromstring(source_zip.read("word/document.xml"))
        out_doc = ET.fromstring(out_zip.read("word/document.xml"))

        ins_nodes = list(out_doc.iter(f"{W}ins"))
        del_nodes = list(out_doc.iter(f"{W}del"))
        ins_texts = Counter(element_text(node, "t") for node in ins_nodes)
        del_texts = Counter(element_text(node, "delText") for node in del_nodes)
        require(ins_texts == expected_ins, "inserted revision text/count mismatch")
        require(del_texts == expected_del, "deleted revision text/count mismatch")
        require(len(ins_nodes) == sum(expected_ins.values()), "inserted revision element count")
        require(len(del_nodes) == sum(expected_del.values()), "deleted revision element count")

        starts = list(out_doc.iter(f"{W}commentRangeStart"))
        ends = list(out_doc.iter(f"{W}commentRangeEnd"))
        references = list(out_doc.iter(f"{W}commentReference"))
        require(len(starts) == len(applied), "comment range start count")
        require(len(ends) == len(applied), "comment range end count")
        require(len(references) == len(applied), "comment reference count")

        rel_name = "word/_rels/document.xml.rels"
        source_rels = relation_entries(ET.fromstring(source_zip.read(rel_name)))
        out_rels = relation_entries(ET.fromstring(out_zip.read(rel_name)))
        require(source_rels.issubset(out_rels), "source relationships not preserved")
        source_external = {
            item for item in source_rels if item[3].casefold() == "external"
        }
        output_external = {
            item for item in out_rels if item[3].casefold() == "external"
        }
        require(source_external == output_external, "external relationship strings changed")

        source_tables = canonical_elements(source_doc, f"{W}tbl")
        output_tables = canonical_elements(out_doc, f"{W}tbl")
        source_hyperlinks = canonical_elements(source_doc, f"{W}hyperlink")
        output_hyperlinks = canonical_elements(out_doc, f"{W}hyperlink")
        require(source_tables == output_tables, "table XML changed")
        require(source_hyperlinks == output_hyperlinks, "hyperlink XML changed")

        comment_name = "word/comments.xml"
        require(comment_name in out_zip.namelist(), "comments part missing")
        comments_root = ET.fromstring(out_zip.read(comment_name))
        comment_nodes = list(comments_root.findall(f"{W}comment"))
        require(len(comment_nodes) == len(applied), "comment element count")
        comments = Counter(element_text(node, "t") for node in comment_nodes)
        require(comments == expected_comments, "comment text/count mismatch")

        source_ids = {
            node.attrib[f"{W}id"] for node in starts
        }
        output_comments = {
            node.attrib[f"{W}id"] for node in comment_nodes
        }
        require(source_ids == output_comments, "comment range/comment id mismatch")

        allowed_changed = {
            "word/document.xml",
            "word/_rels/document.xml.rels",
            "[Content_Types].xml",
            comment_name,
        }
        for name in sorted(source_names - allowed_changed):
            require(source_zip.read(name) == out_zip.read(name), f"unrelated DOCX part changed: {name}")

        return {
            "zipPartsSource": len(source_names),
            "zipPartsOutput": len(out_names),
            "insertedElements": len(ins_nodes),
            "deletedElements": len(del_nodes),
            "commentRangeStarts": len(starts),
            "commentRangeEnds": len(ends),
            "commentReferences": len(references),
            "comments": len(comment_nodes),
            "insertedTextMatchesApplied": True,
            "deletedTextMatchesApplied": True,
            "commentTextMatchesApplied": True,
            "tables": sum(source_tables.values()),
            "hyperlinks": sum(source_hyperlinks.values()),
            "tablesPreserved": True,
            "hyperlinksPreserved": True,
            "sourceRelationships": len(source_rels),
            "externalRelationships": len(source_external),
            "sourceRelationshipsPreserved": True,
            "externalRelationshipStringsPreserved": True,
            "externalRelationshipsFollowed": False,
        }


def changed_files(
    before: dict[str, dict[str, Any]], after: dict[str, dict[str, Any]]
) -> dict[str, list[str]]:
    return {
        "added": sorted(set(after) - set(before)),
        "removed": sorted(set(before) - set(after)),
        "modified": sorted(
            key for key in set(before) & set(after) if before[key] != after[key]
        ),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--owned-root",
        required=True,
        help="fresh empty child of this continuation evidence directory",
    )
    args = parser.parse_args(argv)
    owned_root = pathlib.Path(args.owned_root).resolve(strict=False)
    started_at = utc_now()
    try:
        context = immutable_originals()
        context["started_at_utc"] = started_at
        report = run_with_context(owned_root, context)
        return 0 if report["status"] == "PASS" else 1
    except BaseException as error:
        print(
            json.dumps(
                {
                    "status": "FAILED",
                    "error": {"name": type(error).__name__, "message": str(error)},
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 1


def run_with_context(
    owned_root: pathlib.Path, preflight_context: dict[str, Any]
) -> dict[str, Any]:
    """Run using a preflight context created by main.

    Kept separate so a preflight failure cannot create an owned root.
    """
    context = preflight_context
    manifest = context["manifest"]
    source_case = context["source_case"]

    if owned_root.parent.resolve() != EVIDENCE_DIR:
        raise ValidationError("owned root must be a direct fresh child of the continuation evidence directory")
    if not owned_root.parent.is_dir():
        raise ValidationError("continuation evidence directory is missing")
    if os.path.lexists(owned_root):
        raise ValidationError("owned root must not exist")

    owned_root.mkdir(mode=0o700)
    copied_case = owned_root / "case"
    appdata = owned_root / "appdata"
    shutil.copytree(source_case, copied_case, copy_function=shutil.copy2, symlinks=False)
    copied_before = tree_inventory(copied_case)
    require(
        copied_before == context["source_case_inventory"],
        "copied case is not byte/size/mtime identical",
    )

    outbound = {"attempts": 0, "denied": 0}
    credentials = {"keyGetter": 0, "externalKeyGetter": 0}

    def refuse_transport(request: httpx.Request) -> httpx.Response:
        outbound["attempts"] += 1
        outbound["denied"] += 1
        raise RuntimeError(f"outbound HTTP denied: {request.method}")

    def refuse_key() -> str:
        credentials["keyGetter"] += 1
        raise RuntimeError("model credential access disabled")

    def refuse_external_key() -> str:
        credentials["externalKeyGetter"] += 1
        raise RuntimeError("external credential access disabled")

    lb: Any | None = None
    sentinel: DisabledRetainer | None = None
    imported_contracts: Any | None = None
    imported_logs: Any | None = None
    create_app: Any | None = None
    Config: Any | None = None
    net_closed = False
    logs_closed = False
    failure: BaseException | None = None
    exported: dict[str, Any] | None = None
    copied_after: dict[str, dict[str, Any]] | None = None
    result_before: dict[str, Any] | None = None
    result_after: dict[str, Any] | None = None
    output_path: pathlib.Path | None = None
    output_identity: dict[str, Any] | None = None
    xml_audit: dict[str, Any] | None = None
    opened: dict[str, Any] | None = None
    original_retainer_type: str | None = None

    try:
        sys.path.insert(0, str(SERVICE_ROOT))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench.app import create_app
        from lawbench.config import Config

        app = create_app(
            Config(
                token="finite-continuation-unused-token",
                appdata=appdata,
                port=0,
                forward_port=18_765,
                skills_dirs=[SKILLS_DIR],
                contracts_dir=CONTRACTS_DIR,
                validate_responses=True,
            ),
            key_getter=refuse_key,
            external_key_getter=refuse_external_key,
            transport=httpx.MockTransport(refuse_transport),
        )
        lb = app.state.lb
        original_retainer_type = type(lb.retainer).__name__
        sentinel = DisabledRetainer()
        lb.retainer = sentinel

        opened = lb.cases.open(str(copied_case), template=None, kind=None)
        require(opened["case_id"] == EXPECTED_CASE_ID, "copied case UUID changed")

        registry = read_json(appdata / "cases.json")
        require(len(registry["cases"]) == 1, "private registry must contain exactly one case")
        require(registry["cases"][0]["case_id"] == EXPECTED_CASE_ID, "private registry case UUID")
        require(
            pathlib.Path(registry["cases"][0]["root"]).resolve() == copied_case.resolve(),
            "private registry points outside copied case",
        )
        require(
            not (copied_case / "cases.json").exists(),
            "case directory unexpectedly received a registry",
        )

        located_case, located_root, located_task = lb.tasks.locate(EXPECTED_TASK_ID)
        require(located_case == EXPECTED_CASE_ID, "task located in wrong case")
        require(pathlib.Path(located_root).resolve() == copied_case.resolve(), "task root mismatch")
        require(located_task["state"] == "finished", "copied task state changed before export")
        result_before = lb.tasks.result(copied_case, EXPECTED_TASK_ID)
        require(result_before["status"] == "completed", "copied task is not completed")
        require(result_before == context["result"], "copied old result differs before export")

        exported = lb.exporter.redline(
            {
                "case_id": EXPECTED_CASE_ID,
                "task_id": EXPECTED_TASK_ID,
                "edit_list": manifest["edit_list"],
            }
        )
        output_path = copied_case.joinpath(*exported["path"].split("/"))
        expected_output_prefix = f"工作区/任务/{EXPECTED_TASK_ID}/草稿/"
        require(exported["path"].startswith(expected_output_prefix), "new output path prefix")
        require(
            output_path.resolve(strict=False).is_relative_to(copied_case.resolve()),
            "new output escaped copied case",
        )
        require(output_path.parent.name == "草稿", "new output not in task drafts")
        require(
            output_path.parent.parent.name == EXPECTED_TASK_ID,
            "new output not in original task",
        )
        require(output_path.is_file(), "production exporter did not create DOCX")
        output_identity = file_identity(output_path)

        result_after = lb.tasks.result(copied_case, EXPECTED_TASK_ID)
        expected_result = copy.deepcopy(result_before)
        expected_result["drafts"].append(
            {
                "title": "采购合同-修订版",
                "path": exported["path"],
                "version": 1,
            }
        )
        require(result_after == expected_result, "result.json changed beyond DOCX registration")
        require(result_after["status"] == "completed", "task status changed by export")
        located_again = lb.tasks.locate(EXPECTED_TASK_ID)
        require(located_again[0] == EXPECTED_CASE_ID, "DOCX registered to another case")
        require(located_again[2]["state"] == "finished", "task state changed by export")

        xml_audit = inspect_docx(
            copied_case / "02案件材料" / "采购合同.docx",
            output_path,
            context["edit_list"]["edits"],
            exported["manual"],
            exported["applied"],
        )
        copied_after = tree_inventory(copied_case)
        delta = changed_files(copied_before, copied_after)
        allowed_removed = {
            "工作区/case.db-shm",
            "工作区/case.db-wal",
        }
        require(
            set(delta["removed"]).issubset(allowed_removed),
            f"protected copied-case files disappeared: {delta['removed']}",
        )
        require(delta["added"] == [exported["path"]], "unexpected copied-case additions")
        allowed_modified = {
            "工作区/case.db",
            "工作区/case.db-shm",
            "工作区/case.db-wal",
            f"工作区/任务/{EXPECTED_TASK_ID}/result.json",
        }
        require(
            set(delta["modified"]).issubset(allowed_modified),
            f"unexpected copied-case modifications: {delta['modified']}",
        )
        for unchanged in (
            context["final_draft"].relative_to(source_case).as_posix(),
            manifest["edit_list"],
            f"工作区/任务/{EXPECTED_TASK_ID}/reads.json",
            f"工作区/任务/{EXPECTED_TASK_ID}/task.json",
            "02案件材料/采购合同.docx",
            "02案件材料/采购部内部意见.txt",
        ):
            require(
                copied_before[unchanged] == copied_after[unchanged],
                f"copied old artifact changed: {unchanged}",
            )
        require(
            copied_after["02案件材料/采购合同.docx"]
            == context["source_case_inventory"]["02案件材料/采购合同.docx"],
            "copied contract source bytes changed",
        )
    except BaseException as error:
        failure = error
    finally:
        if lb is not None:
            try:
                lb.net.client.close()
                net_closed = bool(lb.net.client.is_closed)
            except BaseException as error:
                failure = failure or error
        if imported_logs is not None:
            try:
                imported_logs.close()
                logs_closed = True
            except BaseException as error:
                failure = failure or error
        if sentinel is not None:
            try:
                sentinel.close()
            except BaseException as error:
                failure = failure or error

    if sentinel is None or not sentinel.closed:
        failure = failure or ValidationError("disabled retainer sentinel not closed")
    if not net_closed:
        failure = failure or ValidationError("owned net client was not closed")
    if not logs_closed:
        failure = failure or ValidationError("product logs were not closed")
    if outbound["attempts"] != 0 or outbound["denied"] != 0:
        failure = failure or ValidationError("outbound transport was attempted")
    if any(credentials.values()):
        failure = failure or ValidationError("credential getter was invoked")

    preservation_after = {
        "sourceCaseUnchanged": False,
        "sourceSessionsUnchanged": False,
        "sourceFixturesUnchanged": False,
        "watchedInputsUnchanged": False,
        "sourcePinsUnchanged": False,
        "sourcePinCount": None,
        "errors": [],
        "allUnchanged": False,
    }
    try:
        preservation_after = audit_originals(context)
        require(preservation_after["allUnchanged"], "one or more original inputs changed")
    except BaseException as error:
        failure = failure or error

    if copied_after is None:
        try:
            copied_after = tree_inventory(copied_case)
        except BaseException as error:
            failure = failure or error

    delta = (
        changed_files(copied_before, copied_after)
        if copied_after is not None
        else {"added": [], "removed": [], "modified": []}
    )
    report = {
        "format": "t18-genuine-production-exporter-continuation-v1",
        "status": "PASS" if failure is None else "FAILED",
        "scope": "TECHNICAL_ARTIFACT_VALIDATION_ONLY",
        "startedAtUtc": context.get("started_at_utc"),
        "finishedAtUtc": utc_now(),
        "error": (
            None
            if failure is None
            else {
                "name": type(failure).__name__,
                "message": str(failure),
                "traceback": traceback.format_exception_only(type(failure), failure),
            }
        ),
        "claims": {
            "technicalArtifactValidated": failure is None,
            "fullT18PASS": False,
            "businessQualityPASS": False,
            "wordGUI": False,
            "legalAcceptance": False,
            "packaging": "HOLD",
            "originalReportStatus": "FAILED",
            "articleNumberQualityErrorRetained": True,
            "manualObserverFalseNegative": True,
            "actualRateGuardTriggered": False,
            "businessQualityError": context["failure_proof"].get(
                "article_number_quality_error"
            ),
        },
        "original": {
            "reportPath": manifest["original_report"],
            "reportSha256": manifest["original_report_sha"],
            "reportStatus": context["report"]["status"],
            "failureError": context["report"]["error"],
            "taskId": EXPECTED_TASK_ID,
            "taskStatus": context["result"]["status"],
            "caseId": EXPECTED_CASE_ID,
            "nativeSession": EXPECTED_SESSION,
            "nativeRequest": EXPECTED_REQUEST,
            "caseFileCount": len(context["source_case_inventory"]),
            "sessionFileCount": len(context["source_session_inventory"]),
            "editCount": len(context["edit_list"]["edits"]),
            "acceptedEditCount": context["failure_proof"]["edit_list_result"]["accepted"],
            "outOfScope": context["failure_proof"]["edit_list_result"]["out_of_scope"],
            "finalDraft": {
                "path": context["manifest"]["draft"]["path"],
                "sha256": context["final_draft_identity"]["sha256"],
                "bytes": context["final_draft_identity"]["bytes"],
            },
            "modelEditCallId": context["native_call"]["call_id"],
        },
        "sourceIdentity": {
            "inputManifest": {
                "path": str(INPUT_MANIFEST),
                "sha256": INPUT_MANIFEST_SHA,
            },
            "originalFailureProof": {
                "path": manifest["original_failure_proof"],
                "sha256": context["watched"]["original_failure_proof"]["sha256"],
            },
            "sourceCase": {
                "path": str(source_case),
                "files": context["source_case_inventory"],
            },
            "sourceSessions": {
                "path": str(context["source_sessions"]),
                "files": context["source_session_inventory"],
            },
            "fixtures": [
                {
                    "id": fixture["id"],
                    "path": fixture["path"],
                    "bytes": fixture["bytes"],
                    "sha256": fixture["sha256"],
                    "mtime_ns": fixture["mtime_ns"],
                }
                for fixture in context["fixtures"]
            ],
            "sourcePins": {
                "path": manifest["B_source_pins"],
                "sha256": manifest["B_source_pins_sha"],
                "count": context["source_pin_count"],
            },
            "nativeEvents": {
                "path": str(INPUT_DIR / "actual-native-events.jsonl"),
                "sha256": context["watched"]["input_native_events"]["sha256"],
            },
        },
        "production": {
            "entry": "lawbench.app.create_app",
            "caseOpen": "CaseRegistry.open",
            "taskRead": "TaskStore.result/locate",
            "exporter": "Exporter.redline",
            "contractsVersion": (
                imported_contracts.version() if imported_contracts is not None else None
            ),
            "originalRetainerType": original_retainer_type,
            "originalRetainerStarted": False,
            "originalRetainerClosed": False,
            "disabledRetainerSentinel": type(sentinel).__name__ if sentinel else None,
            "lifespan": "off",
            "lifespanEntered": False,
            "asgiServer": False,
            "httpServer": False,
            "forwardListener": False,
            "ocrStarted": False,
            "modelCalls": 0,
        },
        "ownRoot": {
            "path": str(owned_root),
            "freshAtStart": True,
            "casePath": str(copied_case),
            "appdataPath": str(appdata),
        },
        "caseOpen": opened,
        "export": exported,
        "output": (
            None
            if output_path is None or output_identity is None
            else {
                "path": exported["path"],
                "absolutePath": str(output_path),
                "sha256": output_identity["sha256"],
                "bytes": output_identity["bytes"],
                "registeredInResult": result_after is not None,
            }
        ),
        "xmlAudit": xml_audit,
        "preservation": {
            **preservation_after,
            "copiedCaseDeltaBeforePostAudit": delta,
            "copiedContractOriginalUnchanged": (
                copied_after is not None
                and copied_after.get("02案件材料/采购合同.docx")
                == context["source_case_inventory"]["02案件材料/采购合同.docx"]
            ),
        },
        "runtimeGuards": {
            "outbound": outbound,
            "credentials": credentials,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "retainerSentinelClosed": bool(sentinel and sentinel.closed),
            "mockTransportInstalled": True,
        },
    }
    write_json_exclusive(owned_root / "continuation-report.json", report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "report": str(owned_root / "continuation-report.json"),
                "output": report["output"],
                "error": report["error"],
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    if failure is not None:
        raise failure
    return report


if __name__ == "__main__":
    raise SystemExit(main())
