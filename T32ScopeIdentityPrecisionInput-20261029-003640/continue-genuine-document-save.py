#!/usr/bin/env python3
"""Exercise one genuine completed-task document save through production code.

This is the finite T32 boundary continuation.  It:

* verifies and reuses the owner-reviewed T18 input inventory and helper;
* copies the completed case to a fresh short owned root;
* manually changes exactly one known wrong article number in v2;
* calls production ``lawbench.tools.drafts.save_document_ui`` directly;
* proves the response, v3 bytes, registration, preservation, and cleanup facts.

It does not start an ASGI server or the product lifespan.  It does not call a
model, create a session or task, start OCR, forward HTTP, read credentials, or
use the real retainer.  The model's article-number error and every earlier
business/full-flow failure remain open and false.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import pathlib
import shutil
import sys
import traceback
from datetime import datetime, timezone
from typing import Any

import httpx


EVIDENCE_DIR = pathlib.Path(__file__).resolve().parent
B_REPO_ROOT = pathlib.Path(r"D:\Lawbeach\lawbench-B")
HELPER_PATH = (
    B_REPO_ROOT
    / "docs"
    / "plan"
    / "evidence"
    / "T18"
    / "GenuineExporterContinuation-20261028-235617"
    / "continue-genuine-exporter.py"
)
HELPER_SHA256 = "382b3d6d28da3a228c452effc42fdbf482746071132d3ba4bbbb47a3f05880d6"
HELPER_BYTES = 43816

FIXED_INPUT_DIR = pathlib.Path(
    r"D:\Lawbeach\lawbench-coord\T32GenuineSaveInput-20261029-002334"
)
ORIGINAL_APP_DATA = pathlib.Path(
    r"D:\Lawbeach\lawbench-A\docs\plan\evidence\T18"
    r"\QuestionGateContractWorkflow-20261028-191702\run-fQoiXe\appdata"
)
REQUEST_SCOPE_STORE = ORIGINAL_APP_DATA / "request-scopes.json"
REQUEST_SCOPE_INTENT = (
    ORIGINAL_APP_DATA
    / "request-scope-intents"
    / "79da42833363c82ccf62c502d1df47d9a99cffd900910137df4d510d0f1d167d.json"
)
REQUEST_SCOPE_STORE_SHA256 = "15425c85634ff41379d2b9c3003c1b88c352c99a1dca5a17dcb7f25e38e226fd"
REQUEST_SCOPE_INTENT_SHA256 = "3cda63fed3e1896ed90b1206a2bb42fbea7929317c791481a80924382a5ba6c2"
SERVICE_ROOT = B_REPO_ROOT / "service"
CONTRACTS_DIR = B_REPO_ROOT / "contracts"
SKILLS_DIR = B_REPO_ROOT / "skills"

TASK_ID = "T-20261028234100-6b49"
CASE_ID = "9d535ab5-f14c-42cc-bd99-a2f669ff6200"
SESSION_ID = "session-1cb28369-3a90-46dc-b047-e64986038394"
REQUEST_ID = "60fda87b-25a9-40c1-9abd-1e4893fa7b8b"
SOURCE_DRAFT_REL = f"工作区/任务/{TASK_ID}/草稿/合同审查意见-v2.md"
EXPECTED_NEW_REL = f"工作区/任务/{TASK_ID}/草稿/合同审查意见-v3.md"
WRONG_TEXT = "合同第七条"
CORRECT_TEXT = "合同第4.1条"
CONTRACT_PARAGRAPH_23 = (
    "【第23段】\n"
    "4.1 甲方应于到货后七日内完成验收，逾期未提出书面异议的，视为验收合格。"
)

FIXED_SOURCE_FILES = {
    "contracts/api/documents_save.schema.json": {
        "sha256": "7ea0ec0282e9b218410385a3c41e77bfe3cba5a9599bdb09e99ebb244ed8d4c4",
        "bytes": 3705,
    },
    "service/lawbench/case/documents.py": {
        "sha256": "33630da98073e41795b825feedc007ba04742d7eadc99b51b78db6b8fc15eaa8",
        "bytes": 5696,
    },
    "service/lawbench/tools/drafts.py": {
        "sha256": "e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822",
        "bytes": 20481,
    },
}
EXPECTED_UI_IDENTITY = {
    "sha256": "a9e9f4dd18cae7869847d56a3a15c992cc618ec3fe242a2e0302a169595ba09c",
    "bytes": 14417,
}


class ValidationError(RuntimeError):
    """The actual run did not satisfy the finite T32 boundary."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValidationError(message)


def error_metadata(error: BaseException) -> dict[str, Any]:
    data: dict[str, Any] = {"name": type(error).__name__, "message": str(error)}
    code = getattr(error, "code", None)
    reason = getattr(error, "reason", None)
    if isinstance(code, str):
        data["code"] = code
    if isinstance(reason, str):
        data["reason"] = reason
    return data


def load_reviewed_helper() -> Any:
    """Load the exact immutable helper as a normal file module."""
    raw = HELPER_PATH.read_bytes()
    require(len(raw) == HELPER_BYTES, "helper byte count changed")
    require(hashlib.sha256(raw).hexdigest() == HELPER_SHA256, "helper hash changed")

    spec = importlib.util.spec_from_file_location("t18_reviewed_export_helper", HELPER_PATH)
    require(spec is not None and spec.loader is not None, "helper loader unavailable")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    require(module.__name__ != "__main__", "helper executed as main")
    require(module.EVIDENCE_DIR == HELPER_PATH.parent, "helper evidence path changed")
    require(module.REPO_ROOT.resolve() == B_REPO_ROOT.resolve(), "helper repo root changed")
    after = HELPER_PATH.read_bytes()
    require(after == raw, "helper bytes changed while importing")
    return module


def verify_fixed_sources(helper: Any) -> dict[str, Any]:
    """Verify the coord input package and byte-identical B production files."""
    results: dict[str, Any] = {}
    for relative, expected in FIXED_SOURCE_FILES.items():
        package_path = FIXED_INPUT_DIR / pathlib.Path(relative)
        production_path = B_REPO_ROOT / pathlib.Path(relative)
        package_identity = helper.file_identity(package_path)
        production_identity = helper.file_identity(production_path)
        require(package_identity["bytes"] == expected["bytes"], f"package size: {relative}")
        require(package_identity["sha256"] == expected["sha256"], f"package hash: {relative}")
        require(production_identity["bytes"] == expected["bytes"], f"production size: {relative}")
        require(production_identity["sha256"] == expected["sha256"], f"production hash: {relative}")
        require(package_path.read_bytes() == production_path.read_bytes(), f"package differs: {relative}")
        results[relative] = {
            "package": str(package_path),
            "production": str(production_path),
            "bytes": expected["bytes"],
            "sha256": expected["sha256"],
            "byteIdentical": True,
        }

    ui_path = B_REPO_ROOT / "service" / "lawbench" / "api" / "ui.py"
    ui_identity = helper.file_identity(ui_path)
    require(ui_identity["bytes"] == EXPECTED_UI_IDENTITY["bytes"], "ui.py size")
    require(ui_identity["sha256"] == EXPECTED_UI_IDENTITY["sha256"], "ui.py hash")
    results["service/lawbench/api/ui.py"] = {
        "production": str(ui_path),
        **EXPECTED_UI_IDENTITY,
        "directCallMatchesRoute": True,
        "routeLine": 86,
    }
    return results


def result_field_delta(before: dict[str, Any], after: dict[str, Any]) -> dict[str, Any]:
    keys = sorted(set(before) | set(after))
    changed = {
        key: {"before": before.get(key), "after": after.get(key)}
        for key in keys
        if before.get(key) != after.get(key)
    }
    return {
        "changedFields": sorted(changed),
        "unchangedFields": sorted(set(keys) - set(changed)),
        "changes": changed,
    }


def citation_key(citation: dict[str, Any]) -> str:
    return (
        str(citation["material_id"])
        + "|"
        + json.dumps(citation["loc"], ensure_ascii=False, sort_keys=True)
    )


def citation_delta(before: list[dict[str, Any]], after: list[dict[str, Any]]) -> dict[str, Any]:
    before_map = {citation_key(item): item for item in before}
    after_map = {citation_key(item): item for item in after}
    return {
        "beforeCount": len(before),
        "afterCount": len(after),
        "addedKeys": sorted(set(after_map) - set(before_map)),
        "removedKeys": sorted(set(before_map) - set(after_map)),
        "changedValues": {
            key: {"before": before_map[key], "after": after_map[key]}
            for key in sorted(set(before_map) & set(after_map))
            if before_map[key] != after_map[key]
        },
    }


def fresh_owned_root(value: str) -> pathlib.Path:
    path = pathlib.Path(value)
    if not path.is_absolute():
        path = EVIDENCE_DIR / path
    path = path.resolve(strict=False)
    require(path.parent == EVIDENCE_DIR.resolve(), "owned root is not a direct evidence child")
    require(len(path.name) <= 16, "owned root name must remain short")
    require(not os.path.lexists(path), "owned root already exists")
    return path


def prepare_request_scope_evidence(
    helper: Any,
    appdata: pathlib.Path,
    source_inventory: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    """Copy the exact genuine request-scope metadata needed by task_scope."""
    source_store = helper.file_identity(REQUEST_SCOPE_STORE)
    source_intent = helper.file_identity(REQUEST_SCOPE_INTENT)
    require(source_store["sha256"] == REQUEST_SCOPE_STORE_SHA256, "request-scope store hash")
    require(source_intent["sha256"] == REQUEST_SCOPE_INTENT_SHA256, "request-scope intent hash")

    store = helper.read_json(REQUEST_SCOPE_STORE)
    intent = helper.read_json(REQUEST_SCOPE_INTENT)
    require(store["v"] == 1 and intent["v"] == 1, "request-scope version")
    require(list(store["records"]) == [REQUEST_ID], "request-scope store identity")
    record = store["records"][REQUEST_ID]
    require(record["case_id"] == CASE_ID, "request-scope case")
    require(record["session_id"] == SESSION_ID, "request-scope session")
    require(record["task_id"] == TASK_ID, "request-scope task")
    require(record["state"] == "claimed", "request-scope state")
    require(intent["request_id"] == REQUEST_ID, "request-scope intent id")
    require(intent["case_id"] == CASE_ID, "request-scope intent case")
    require(intent["session_id"] == SESSION_ID, "request-scope intent session")
    require(intent["state"] == "prepared", "request-scope intent state")
    require(intent["materials"] == record["materials"], "request-scope material mismatch")
    expected_materials = [
        {
            "material_id": "M0001",
            "sha256": source_inventory["02案件材料/采购合同.docx"]["sha256"],
        },
        {
            "material_id": "M0002",
            "sha256": source_inventory["02案件材料/采购部内部意见.txt"]["sha256"],
        },
    ]
    require(record["materials"] == expected_materials, "request-scope material versions")

    appdata.mkdir(mode=0o700)
    copied_store = appdata / "request-scopes.json"
    copied_intent = appdata / "request-scope-intents" / REQUEST_SCOPE_INTENT.name
    copied_intent.parent.mkdir(mode=0o700)
    shutil.copy2(REQUEST_SCOPE_STORE, copied_store, follow_symlinks=False)
    shutil.copy2(REQUEST_SCOPE_INTENT, copied_intent, follow_symlinks=False)
    require(helper.file_identity(copied_store) == source_store, "copied request-scope store changed")
    require(helper.file_identity(copied_intent) == source_intent, "copied request-scope intent changed")
    return {
        "sourceStore": {"path": str(REQUEST_SCOPE_STORE), **source_store},
        "sourceIntent": {"path": str(REQUEST_SCOPE_INTENT), **source_intent},
        "copiedStore": {"path": str(copied_store), **helper.file_identity(copied_store)},
        "copiedIntent": {"path": str(copied_intent), **helper.file_identity(copied_intent)},
        "requestId": REQUEST_ID,
        "taskId": TASK_ID,
        "caseId": CASE_ID,
        "sessionId": SESSION_ID,
        "materials": record["materials"],
        "exactGenuineMetadataCopiedOnly": True,
        "sourceCasesRegistryCopied": False,
        "sourceLogsCopied": False,
    }


def run(
    owned_root: pathlib.Path,
    helper: Any,
    context: dict[str, Any],
    fixed_before: dict[str, Any],
) -> dict[str, Any]:
    manifest = context["manifest"]
    source_case = context["source_case"]
    source_inventory = context["source_case_inventory"]

    owned_root.mkdir(mode=0o700)
    copied_case = owned_root / "case"
    appdata = owned_root / "appdata"
    shutil.copytree(source_case, copied_case, copy_function=shutil.copy2, symlinks=False)
    copied_before = helper.tree_inventory(copied_case)
    require(copied_before == source_inventory, "copied case identity changed")

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
    sentinel: Any | None = None
    imported_contracts: Any | None = None
    imported_logs: Any | None = None
    net_closed = False
    logs_closed = False
    failure: BaseException | None = None

    opened: dict[str, Any] | None = None
    task_before: dict[str, Any] | None = None
    result_before: dict[str, Any] | None = None
    result_after: dict[str, Any] | None = None
    response: dict[str, Any] | None = None
    copied_after: dict[str, dict[str, Any]] | None = None
    new_identity: dict[str, Any] | None = None
    preservation_after: dict[str, Any] | None = None
    fixed_after: dict[str, Any] | None = None
    request_scope_evidence: dict[str, Any] | None = None
    original_retainer_type: str | None = None
    registered_title: str | None = None
    result_citation: list[dict[str, Any]] = []
    reads_before: dict[str, Any] | None = None
    task_file_before: dict[str, Any] | None = None
    edit_file_before: dict[str, Any] | None = None

    source_draft_path = copied_case / pathlib.Path(SOURCE_DRAFT_REL)
    source_draft_before = helper.file_identity(source_draft_path)
    require(source_draft_before["sha256"] == manifest["draft"]["sha256"], "source v2 hash")
    require(source_draft_before["bytes"] == manifest["draft"]["bytes"], "source v2 size")
    v2_bytes = source_draft_path.read_bytes()
    old_bytes = WRONG_TEXT.encode("utf-8")
    new_bytes = CORRECT_TEXT.encode("utf-8")
    require(v2_bytes.count(old_bytes) == 1, "wrong prose literal is not exactly once")
    require(v2_bytes.count(new_bytes) == 0, "correct prose literal unexpectedly pre-exists")
    edit_offset = v2_bytes.index(old_bytes)
    expected_v3_bytes = (
        v2_bytes[:edit_offset]
        + new_bytes
        + v2_bytes[edit_offset + len(old_bytes):]
    )
    inverse_bytes = (
        expected_v3_bytes[:edit_offset]
        + old_bytes
        + expected_v3_bytes[edit_offset + len(new_bytes):]
    )
    require(inverse_bytes == v2_bytes, "manual edit is not invertible to whole v2 bytes")
    require(
        expected_v3_bytes[:edit_offset] == v2_bytes[:edit_offset]
        and expected_v3_bytes[edit_offset + len(new_bytes):]
        == v2_bytes[edit_offset + len(old_bytes):],
        "manual edit changed bytes outside the one occurrence",
    )
    expected_v3_text = expected_v3_bytes.decode("utf-8")

    contract_text_rel = "工作区/材料/文本/02案件材料/采购合同.docx.md"
    contract_text_path = copied_case / pathlib.Path(contract_text_rel)
    contract_text = contract_text_path.read_text(encoding="utf-8")
    require(
        contract_text.count(CONTRACT_PARAGRAPH_23) == 1,
        "contract paragraph 23 proof is not exact and unique",
    )
    require(WRONG_TEXT in v2_bytes.decode("utf-8"), "original wrong prose missing from v2")

    try:
        request_scope_evidence = prepare_request_scope_evidence(
            helper, appdata, source_inventory
        )
        sys.path.insert(0, str(SERVICE_ROOT))
        from lawbench import contracts as imported_contracts
        from lawbench import logs as imported_logs
        from lawbench.app import create_app
        from lawbench.config import Config
        from lawbench.tools.drafts import save_document_ui

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
        sentinel = helper.DisabledRetainer()
        lb.retainer = sentinel

        opened = lb.cases.open(str(copied_case), template=None, kind=None)
        require(opened["case_id"] == CASE_ID, "copied case UUID changed")
        registry = helper.read_json(appdata / "cases.json")
        require(len(registry["cases"]) == 1, "private registry must contain one case")
        require(registry["cases"][0]["case_id"] == CASE_ID, "private registry UUID")
        require(
            pathlib.Path(registry["cases"][0]["root"]).resolve() == copied_case.resolve(),
            "private registry root changed",
        )
        require(not (copied_case / "cases.json").exists(), "case received product registry")

        located_case, located_root, task_before = lb.tasks.locate(TASK_ID)
        require(located_case == CASE_ID, "completed task located in wrong case")
        require(pathlib.Path(located_root).resolve() == copied_case.resolve(), "task root mismatch")
        require(task_before["state"] == "finished", "source task is not finished")
        require(task_before["case_id"] == CASE_ID, "source task case mismatch")
        require(task_before["task_id"] == TASK_ID, "source task id mismatch")
        require(task_before["session_id"] == SESSION_ID, "source task session mismatch")
        require(task_before["request_id"] == REQUEST_ID, "source task request mismatch")

        result_before = lb.tasks.result(copied_case, TASK_ID)
        require(result_before == context["result"], "copied completed result changed")
        require(result_before["status"] == "completed", "completed result was not retained")
        require(len(result_before["drafts"]) == 2, "expected both old draft registrations")
        matching = [item for item in result_before["drafts"] if item["path"] == SOURCE_DRAFT_REL]
        require(len(matching) == 1, "v2 registration is not unique")
        require(matching[0]["version"] == 2, "v2 registration version changed")
        registered_title = matching[0]["title"]
        require(registered_title == manifest["draft"]["title"], "registered title changed")

        reads_path = copied_case / "工作区" / "任务" / TASK_ID / "reads.json"
        task_path = copied_case / "工作区" / "任务" / TASK_ID / "task.json"
        edit_path = copied_case / pathlib.Path(manifest["edit_list"])
        reads_before = helper.file_identity(reads_path)
        task_file_before = helper.file_identity(task_path)
        edit_file_before = helper.file_identity(edit_path)
        result_citation = [
            item
            for item in result_before["citations"]
            if item["material_id"] == "M0001" and item["loc"] == {"unit": "para", "from": 23}
        ]
        require(len(result_citation) == 1, "contract paragraph 23 citation is not unique")
        require(
            result_citation[0]["material_version"]
            == source_inventory["02案件材料/采购合同.docx"]["sha256"],
            "citation material version differs from source contract",
        )

        request = {
            "case_id": CASE_ID,
            "path": SOURCE_DRAFT_REL,
            "content": expected_v3_text,
        }
        require(
            not imported_contracts.errors(
                "api/documents_save.schema.json", "#/$defs/request", request
            ),
            "save request violates API contract",
        )
        require(set(request) == {"case_id", "path", "content"}, "request has spoofable fields")

        response = save_document_ui(
            lb.tasks,
            lb.materials,
            [SKILLS_DIR],
            request,
        )
        require(isinstance(response, dict), "save response is not an object")
        imported_contracts.validate(
            "api/documents_save.schema.json",
            "#/$defs/response",
            {"ok": True, "value": response},
        )
        require(response["task_id"] == TASK_ID, "save response task mismatch")
        require(response["version"] == 3, "save response did not create version 3")
        require(response["path"] == EXPECTED_NEW_REL, "save response path mismatch")
        require(
            response["path"].startswith(f"工作区/任务/{TASK_ID}/草稿/{registered_title}-v3.md"),
            "new path does not use registered title",
        )
        expected_not_fully = [
            item["name"] for item in response["coverage"]["partially_read"]
        ] + response["coverage"]["not_read"]
        require(response["not_fully_read"] == expected_not_fully, "not_fully_read mismatch")

        new_path = copied_case / pathlib.Path(response["path"])
        require(new_path.resolve(strict=False).is_relative_to(copied_case.resolve()), "v3 escaped case")
        require(new_path.is_file(), "production save did not create v3")
        new_identity = helper.file_identity(new_path)
        v3_bytes = new_path.read_bytes()
        require(v3_bytes == expected_v3_bytes, "v3 bytes differ from the one manual edit")
        require(v3_bytes.decode("utf-8") == expected_v3_text, "v3 text differs")
        require(
            v3_bytes[:edit_offset] == v2_bytes[:edit_offset]
            and v3_bytes[edit_offset + len(new_bytes):]
            == v2_bytes[edit_offset + len(old_bytes):],
            "v3 changed bytes outside the one manual occurrence",
        )
        require(
            v3_bytes[:edit_offset] + old_bytes + v3_bytes[edit_offset + len(new_bytes):]
            == v2_bytes,
            "v3 is not the exact inverse manual edit of v2",
        )

        result_after = lb.tasks.result(copied_case, TASK_ID)
        require(result_after["status"] == "completed", "save changed completed status")
        require(len(result_after["drafts"]) == 3, "save did not append exactly one draft")
        require(
            result_after["drafts"][:2] == result_before["drafts"],
            "save altered the two old draft registrations",
        )
        new_registration = result_after["drafts"][2]
        require(
            new_registration
            == {"title": registered_title, "path": response["path"], "version": 3},
            "new draft registration differs from registration-derived binding",
        )
        require(
            result_after["citation_check"] == response["citation_check"],
            "result citation_check differs from production response",
        )
        require(
            result_after["coverage"] == response["coverage"],
            "result coverage differs from production response",
        )
        allowed_result_fields = {"drafts", "citation_check", "coverage", "citations"}
        changed_result_fields = {
            key
            for key in set(result_before) | set(result_after)
            if result_before.get(key) != result_after.get(key)
        }
        require(
            changed_result_fields.issubset(allowed_result_fields),
            f"result fields changed beyond production save: {sorted(changed_result_fields)}",
        )
        for stable in ("v", "task_id", "status", "usage", "finished_at"):
            require(result_after[stable] == result_before[stable], f"stable result field changed: {stable}")
        require(
            helper.file_identity(task_path) == task_file_before,
            "task.json changed during save",
        )
        require(
            helper.file_identity(reads_path) == reads_before,
            "reads.json changed during save",
        )
        require(
            helper.file_identity(edit_path) == edit_file_before,
            "edit list changed during save",
        )
        located_again = lb.tasks.locate(TASK_ID)
        require(
            located_again[0] == CASE_ID
            and pathlib.Path(located_again[1]).resolve() == copied_case.resolve()
            and located_again[2]["state"] == "finished",
            "task binding/status changed after save",
        )

        copied_after = helper.tree_inventory(copied_case)
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

    try:
        fixed_after = verify_fixed_sources(helper)
        require(fixed_after == fixed_before, "fixed source package changed during run")
        require(
            helper.file_identity(REQUEST_SCOPE_STORE)
            == request_scope_evidence["sourceStore"],
            "source request-scope store changed",
        )
        require(
            helper.file_identity(REQUEST_SCOPE_INTENT)
            == request_scope_evidence["sourceIntent"],
            "source request-scope intent changed",
        )
    except BaseException as error:
        failure = failure or error
    try:
        preservation_after = helper.audit_originals(context)
        require(preservation_after["allUnchanged"], "one or more immutable originals changed")
    except BaseException as error:
        failure = failure or error
    if copied_after is None:
        try:
            copied_after = helper.tree_inventory(copied_case)
        except BaseException as error:
            failure = failure or error

    delta = (
        helper.changed_files(copied_before, copied_after)
        if copied_after is not None
        else {"added": [], "modified": [], "removed": []}
    )
    try:
        require(delta["added"] == [EXPECTED_NEW_REL], "unexpected copied-case additions")
        allowed_modified = {
            f"工作区/任务/{TASK_ID}/result.json",
            "工作区/case.db",
            "工作区/case.db-shm",
            "工作区/case.db-wal",
        }
        allowed_removed = {"工作区/case.db-shm", "工作区/case.db-wal"}
        require(set(delta["modified"]).issubset(allowed_modified), "unexpected copied-case modification")
        require(set(delta["removed"]).issubset(allowed_removed), "unexpected copied-case removal")
        changed_or_removed = set(delta["modified"]) | set(delta["removed"])
        for relative, identity in copied_before.items():
            if relative not in changed_or_removed:
                require(
                    copied_after.get(relative) == identity,
                    f"pre-existing copied file changed: {relative}",
                )
        require(
            copied_after[SOURCE_DRAFT_REL] == copied_before[SOURCE_DRAFT_REL],
            "copied v2 changed",
        )
        v1_rel = f"工作区/任务/{TASK_ID}/草稿/合同审查意见-v1.md"
        require(copied_after[v1_rel] == copied_before[v1_rel], "copied v1 changed")
        require(
            copied_after["02案件材料/采购合同.docx"]
            == copied_before["02案件材料/采购合同.docx"],
            "copied source contract changed",
        )
        for relative in copied_before:
            if relative.startswith("工作区/材料/"):
                require(
                    copied_after.get(relative) == copied_before[relative],
                    f"copied material metadata changed: {relative}",
                )
    except BaseException as error:
        failure = failure or error

    result_delta = (
        result_field_delta(result_before, result_after)
        if result_before is not None and result_after is not None
        else None
    )
    citations_delta = (
        citation_delta(result_before["citations"], result_after["citations"])
        if result_before is not None and result_after is not None
        else None
    )
    after_source_draft = (
        copied_after.get(SOURCE_DRAFT_REL) if copied_after is not None else None
    )
    after_v1 = (
        copied_after.get(f"工作区/任务/{TASK_ID}/草稿/合同审查意见-v1.md")
        if copied_after is not None
        else None
    )
    after_contract = (
        copied_after.get("02案件材料/采购合同.docx")
        if copied_after is not None
        else None
    )

    report = {
        "format": "t32-genuine-completed-document-save-continuation-v1",
        "status": "PASS" if failure is None else "FAILED",
        "scope": "ONE_GENUINE_COMPLETED_TASK_MANUAL_SYNTHETIC_DOCUMENT_SAVE_BOUNDARY",
        "startedAtUtc": context.get("started_at_utc"),
        "finishedAtUtc": utc_now(),
        "error": (
            None
            if failure is None
            else {
                **error_metadata(failure),
                "traceback": traceback.format_exception_only(type(failure), failure),
            }
        ),
        "claims": {
            "genuineCompletedTaskManualSyntheticSaveValidated": failure is None,
            "manualEditOnly": True,
            "modelArticleErrorOpen": True,
            "modelQualityPASS": False,
            "fullT18PASS": False,
            "wordGUI": False,
            "packaging": "HOLD",
            "originalReportStatus": "FAILED",
        },
        "sourceIdentity": {
            "helper": {
                "path": str(HELPER_PATH),
                "bytes": HELPER_BYTES,
                "sha256": HELPER_SHA256,
                "loadedAsFileModule": True,
                "mainOrRunWithContextCalled": False,
            },
            "fixedProductionSources": fixed_before,
            "requestScopeEvidence": request_scope_evidence,
            "inputManifest": {
                "path": str(helper.INPUT_MANIFEST),
                "sha256": helper.INPUT_MANIFEST_SHA,
            },
            "originalReport": {
                "path": manifest["original_report"],
                "sha256": manifest["original_report_sha"],
                "status": context["report"]["status"],
            },
            "sourceCaseCount": len(source_inventory),
            "sourceSessionCount": len(context["source_session_inventory"]),
            "sourcePinCount": context["source_pin_count"],
            "taskId": TASK_ID,
            "caseId": CASE_ID,
            "sessionId": SESSION_ID,
            "requestId": REQUEST_ID,
        },
        "articleProof": {
            "contractTextPath": contract_text_rel,
            "paragraph23": CONTRACT_PARAGRAPH_23,
            "paragraph23Occurrences": contract_text.count(CONTRACT_PARAGRAPH_23),
            "citedOriginalArticle": "4.1",
            "citationParagraph": 23,
            "citationMaterialVersion": (
                result_citation[0]["material_version"]
                if len(result_citation) == 1
                else None
            ),
            "wrongProse": WRONG_TEXT,
            "correctedProse": CORRECT_TEXT,
            "wrongOccurrencesInV2": v2_bytes.count(old_bytes),
            "correctOccurrencesBeforeSave": v2_bytes.count(new_bytes),
            "legalMeritsChanged": False,
        },
        "manualEdit": {
            "sourcePath": SOURCE_DRAFT_REL,
            "sourceIdentity": source_draft_before,
            "replacementOffsetUtf8": edit_offset,
            "oldBytes": len(old_bytes),
            "newBytes": len(new_bytes),
            "expectedV3Bytes": len(expected_v3_bytes),
            "expectedV3Sha256": hashlib.sha256(expected_v3_bytes).hexdigest(),
            "inverseRestoresWholeV2": inverse_bytes == v2_bytes,
            "outsideEditedSpanHeld": True,
            "sourceGeneratedByModel": True,
            "editPerformedByModel": False,
            "editWasManualSynthetic": True,
        },
        "production": {
            "entry": "lawbench.tools.drafts.save_document_ui",
            "matchesUiRoute": "service/lawbench/api/ui.py:86",
            "caseOpen": "CaseRegistry.open(copycase, template=None, kind=None)",
            "sourceLookup": "lawbench.case.documents.locate_source/recheck_stable_source",
            "write": "lawbench.tools.drafts._save_locked",
            "requestFields": ["case_id", "path", "content"],
            "clientTitleOrTaskSupplied": False,
            "registeredTitle": registered_title,
            "asgiServer": False,
            "lifespanEntered": False,
            "httpServer": False,
            "forwardListener": False,
            "ocrStarted": False,
            "modelCalls": 0,
            "sessionCreated": False,
            "taskCreated": False,
            "originalRetainerType": original_retainer_type,
            "originalRetainerStarted": False,
            "originalRetainerClosed": False,
            "disabledRetainerSentinel": type(sentinel).__name__ if sentinel else None,
        },
        "caseOpen": opened,
        "taskBefore": task_before,
        "resultBefore": result_before,
        "saveResponse": response,
        "v3": (
            None
            if new_identity is None
            else {
                "path": EXPECTED_NEW_REL,
                "identity": new_identity,
                "exactManualBytes": True,
                "exactManualText": True,
                "registrationTitle": registered_title,
                "registeredToSameCompletedTask": True,
            }
        ),
        "resultAfter": result_after,
        "resultFieldDelta": result_delta,
        "citationMetadataDelta": citations_delta,
        "copyFileDelta": {
            **delta,
            "newFileIdentity": new_identity,
            "unexpectedWrites": False,
        },
        "preservation": {
            **(preservation_after or {}),
            "v1Before": copied_before.get(
                f"工作区/任务/{TASK_ID}/草稿/合同审查意见-v1.md"
            ),
            "v1After": after_v1,
            "v2Before": copied_before.get(SOURCE_DRAFT_REL),
            "v2After": after_source_draft,
            "contractBefore": copied_before.get("02案件材料/采购合同.docx"),
            "contractAfter": after_contract,
            "taskJsonIdentityBefore": task_file_before,
            "taskJsonIdentityAfter": (
                helper.file_identity(copied_case / "工作区" / "任务" / TASK_ID / "task.json")
                if copied_case.is_dir()
                else None
            ),
            "readsIdentityBefore": reads_before,
            "readsIdentityAfter": (
                helper.file_identity(copied_case / "工作区" / "任务" / TASK_ID / "reads.json")
                if copied_case.is_dir()
                else None
            ),
            "editListIdentityBefore": edit_file_before,
            "editListIdentityAfter": (
                helper.file_identity(copied_case / pathlib.Path(manifest["edit_list"]))
                if copied_case.is_dir()
                else None
            ),
        },
        "runtimeGuards": {
            "outbound": outbound,
            "credentials": credentials,
            "netClientClosed": net_closed,
            "logsClosed": logs_closed,
            "retainerSentinelClosed": bool(sentinel and sentinel.closed),
            "mockTransportInstalled": True,
            "genuineRequestScopeMetadataOnly": True,
            "scope": "ACTUAL_GETTER_AND_TRANSPORT_COUNTS_ONLY_NOT_FULL_NETWORK_ERASURE",
        },
        "ownedRoot": {
            "path": str(owned_root),
            "freshAtStart": True,
            "casePath": str(copied_case),
            "appdataPath": str(appdata),
            "retainedAsEvidence": True,
            "cleanup": "close only owned net client, product logs, and disabled sentinel",
        },
    }
    helper.write_json_exclusive(owned_root / "continuation-report.json", report)
    print(
        json.dumps(
            {
                "status": report["status"],
                "report": str(owned_root / "continuation-report.json"),
                "v3": report["v3"],
                "error": report["error"],
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )
    if failure is not None:
        raise failure
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--owned-root",
        required=True,
        help="fresh short child of this evidence directory, for example r001",
    )
    args = parser.parse_args(argv)
    started_at = utc_now()
    try:
        owned_root = fresh_owned_root(args.owned_root)
        helper = load_reviewed_helper()
        fixed_before = verify_fixed_sources(helper)
        context = helper.immutable_originals()
        context["started_at_utc"] = started_at
        report = run(owned_root, helper, context, fixed_before)
        return 0 if report["status"] == "PASS" else 1
    except BaseException as error:
        print(
            json.dumps(
                {
                    "status": "FAILED",
                    "error": error_metadata(error),
                },
                ensure_ascii=False,
                sort_keys=True,
            ),
            file=sys.stderr,
        )
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
