# T23 genuine-plan archive generation

Status: `SOURCE_ONLY_RUNTIME0_NOT_RUN`

This directory contains the authored helper for root's one finite T23 archive
generation. The author did not run Python, import the product, parse code,
start LibreOffice, send HTTP, use a model, read a key, or create any archive
artifact.

## Inputs

- `literal-inputs.json` is a byte-for-byte copy of the approved descriptor:
  13,920 bytes, SHA-256
  `faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e`.
- It fixes the synthetic source case, all 30 source files, the existing
  `case_id` and `task_id`, the persisted 13-field confirmed plan, 346 B-source
  files, 13 reviewed resources, and the exact LibreOffice executables.
- The plan is an authorized synthetic confirmation, not real lawyer approval.

## Root-only command

Run only after root has completed its full source, typed-API, resource, and
two-binary review. The report path must not exist, and the root must be a new
short path directly under a normal private `%TEMP%` parent.

```powershell
$t23Root = Join-Path $env:TEMP ('lb-t23-' + ([guid]::NewGuid().ToString('N').Substring(0, 8)))
$t23Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$t23Helper = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948\genuine-plan-build.py'
$t23Report = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948\root-run-report.json'
& $t23Python $t23Helper --root $t23Root --report $t23Report
$LASTEXITCODE
```

Run this helper once. A failed attempt is recorded and stopped; do not edit the
approved plan, swap in a PDF or sample output, rerun the old full test suite, or
change API/model/key selection to force a pass.

## What the helper does

1. Verifies `literal-inputs.json`, every reviewed resource hash, both approved
   LibreOffice binary hashes, and all 30 source files' bytes, SHA-256 and
   nanosecond mtime.
2. Creates private `HOME`, `USERPROFILE`, `APPDATA`, `LOCALAPPDATA`, `TEMP` and
   `TMP` directories under `--root`; refuses links/reparse points.
3. Copies exactly the 30 inventoried bytes into a new sibling case directory.
   It does not use `copytree`, does not create a task, and does not fabricate a
   UUID, result, history, session, request or plan.
4. Builds the current B app with `create_app(...)`, a fake in-memory token,
   refusing credential getters, refusing outbound `httpx.MockTransport`, the
   private appdata, B skills/contracts, port `0`, forward port `18765`, and
   response validation enabled.
5. Copies the private default settings, changes only `converter` to
   `libreoffice`, and injects the actual current `OfficeConverter` with the
   approved executable.
6. Uses `httpx.ASGITransport` only. It posts exactly:
   `POST /api/case/open` once, then `POST /api/archive/build` once. There is no
   HTTP listener, lifespan start, OCR start, retainer start, health probe,
   task/model call, or direct `ArchiveBuilder._build` call.
7. Retains both actual requests and responses in `root-run-report.json`.
8. Verifies the real response contract, copied-case identity, page ranges and
   labels, PDF source content, invoice/volume page equality, generated report
   item 15 exactly once, DOCX plan fields and placeholder, temporary-template
   and hand-signature warnings, and md/docx-only outputs index entries.
9. Keeps the copied case and generated outputs for review. It closes the ASGI
   client, network client, logs and materials store, closes an unstarted
   retainer sentinel, and removes only owned environment/temp/profile paths.

## Trust and resource limits

- Source and expected values come only from the approved synthetic descriptor.
  The helper reads no real case, user settings, keyring, `.env`, DPAPI store or
  production credential.
- Python socket connect/bind/listen/TLS operations are denied and counted.
  Product outbound transport and both credential getters are refusing counters.
- LibreOffice child-process network activity is not fully covered by the
  Python socket meter. The current private profile enables
  `BlockUntrustedRefererLinks`, and every input is a trusted synthetic plain
  TXT. No global firewall or proxy policy is changed.
- Each production conversion retains the current 120-second timeout. No
  converter install, update, Word/WPS/COM fallback, printer change, upload or
  real business-window operation is permitted.
- Cleanup is limited to the new `--root` tree's owned temporary/profile paths.
  No broad process kill, real-data deletion, ACL/edit-lock change, or Git write
  is part of this helper.

## Evidence boundary

A successful run proves only that the real current routes generated and the
helper could structurally and textually verify the synthetic archive artifacts.
It does not prove real lawyer approval, legal correctness, full business
quality, visual PDF quality, or complete operating-system process cleanup.
Visual review of the generated PDF remains a separate manual review.
