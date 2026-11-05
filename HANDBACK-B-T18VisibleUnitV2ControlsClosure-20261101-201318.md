# T18 Visible Unit V2 Controls Closure - B Handback

Status: `AUTHORED_NOT_RUN`

Runtime executions: 0.

## Files

- `docs/plan/evidence/T18/T18VisibleUnitSemanticPilotV2-20261101-195816/review-consumer.mjs`
- `docs/plan/evidence/T18/T18VisibleUnitSemanticPilotV2-20261101-195816/offline-controls.mjs`
- `docs/plan/evidence/T18/T18VisibleUnitSemanticPilotV2-20261101-195816/source-manifest.json`
- `D:/Lawbeach/lawbench-coord/HANDBACK-B-T18VisibleUnitV2ControlsClosure-20261101-201318.md`

`fixed-data.json` was preserved as an unmodified byte copy.

## Changes

- `buildVisibleUnits` now requires the exact existing display-type label `receipt.unit === "line"` and rejects page or other labels with `UNIT_LABEL_INVALID`.
- `validateStage2Result` keeps generic nonempty-string issue validation. An issue whose prose is `PASS` is retained only as recorded model data; it does not alter the fixed output status.
- Offline controls now target the current V2 exports. Synthetic numbered source units cover header, blank, and independent-detail units, exact slices, full reassembly, ID multiplicity, span references, stage isolation, canonical quote return, and structural rejection of verdict-like fields or enums.
- Existing credential, redaction, model-envelope, deadline, partial-response, complete-response, response-cap, cancellation, and expired-deadline checks remain offline and in-memory against the same exported implementation.

## Protocol and limits

- Route: `http://10.126.126.1:8000/v1/chat/completions`
- Model: `qwen38-27b`
- Parameters: `temperature: 0.6`, `max_tokens: 49152`, `stream: false`
- Calls: exactly two bounded POST stages
- Per-call timeout: 400000 ms
- Entire-call cap: 900000 ms
- Response cap: 4194304 bytes
- Business status: `UNIT_REVIEW_COMPLETE_REQUIRES_ROOT_MANUAL_JUDGMENT`; never `PASS`

## Verification boundary

Per the closure order, this run did not execute Node, Python, parsers, checks, tests, builds, requests, models, GUI, Git discovery, or Git writes. The source manifest is generated once after the final source and handback edits by reading and hashing the consumer, unchanged data, and controls bytes. Runtime remains zero.
