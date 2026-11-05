# B source-only handback: T18FragmentBidirectionalV3

Status: `AUTHORED_NOT_RUN`

## Delivery

Authored exactly five files under:

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18FragmentBidirectionalV3-20261101-211508\`

- `review-consumer.mjs`
- `offline-controls.mjs`
- `fixed-data.json`
- `stage1-assessments.json`
- `source-manifest.json`

The fixed data and actual Stage1 assessment cache were copied byte-for-byte with .NET. Their delivered identities are:

- `fixed-data.json`: 17427 bytes, `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`
- `stage1-assessments.json`: 10015 bytes, `5e4ba4c51aa23b29b8625174c595d940628bbb7910ef6e9afcd4f777d5712fc1`
- `review-consumer.mjs`: 41790 bytes, `a9e8398643f8139aa6b9a36ba1daca7940a8c4b3d1e4dc6057441e25bd120d1a`
- `offline-controls.mjs`: 25223 bytes, `13ac577aacb787d3fb290a0a389f110bab55339cbac52cb11f1c9fb43ca1f1cf`

`source-manifest.json` uses the exact `sha256` record schema for `consumer`, `fixed_data`, `offline_controls`, and `stage1_assessments`; it does not self-pin.

## Source changes

The visible-unit scanner, range/header validation, blank reassembly, `selectPilotInput`, Stage1 prompt/builders/validator, response transport, authorization, credential stdin handling, redaction, fresh-root artifact writing, failure handling, and main-import guard remain in place.

The V3 consumer now:

- reuses the pinned Stage1 cache bytes through the original validator and records `reusedStage1` plus source-cache identity;
- builds lossless F/C/Q targets from the specified literal delimiter runs, with exact UTF-16 offsets, full parent tables, source headers, explicit empty-body targets, and deterministic target ids;
- enforces the 400-target cap before reading the credential or making a request;
- emits one fresh-context Stage2 request covering the exact target set and enforces exact records, family-specific enums, cross-family refs, positive-treatment refs, a 160-UTF-16 assessment bound, and no model quote/kind/PASS overrides;
- machine-joins canonical target/ref text by id after validation and always reports protocol completion requiring Root manual judgment, never a legal or factual PASS.

The offline controls are source-only. They cover lossless reconstruction, punctuation and emoji offsets, leading/trailing delimiter runs, blank and explicit-empty parents, exact target/ref obligations, Stage1 cache/pin failures, response limits, deadline behavior, and public completion. They were not executed.

## Network and credentials

The route, model, temperature, token limit, non-streaming mode, 400-second per-request timeout, 900-second total cap, 4 MiB response cap, redirect rejection, and fail-closed handling are unchanged. The request upper bound is now one Stage2 request. No health call, retry, fallback, Stage1 HTTP request, API call, model call, probe, or credential read was performed.

No product, SDK, Skill, TaskState, host, old root driver, preparer, admission, sandbox, approval, ACL, or writer lock was changed. No Git mutation, test, parser, build, Node, Python, HTTP, or runtime action was performed. The delivery is through the coordination directory, not Git.

## Limitations and required gates

This handback asserts source authorship only. It does not assert syntax acceptance, offline-control success, actual target counts, request size, model behavior, semantic adequacy, factual support, or business capability. Root must perform the finite offline run, full source review, and independent review before any new real request. Fragment boundaries are syntax only; all Stage2 opinions remain provisional and require Root manual judgment.

Process note: one auxiliary read-only identifier scan was rejected for an incorrect non-PowerShell shell parameter before executing anything. All substantive commands used the required absolute `pwsh`, `login=false`; no setup, privilege, sandbox, or lock change was attempted.
