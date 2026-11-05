# Independent C Review - T18 Visible Unit V2

## Verdict

**PASS (source-only, qualified).** No in-scope source blocker was found in the supplied C views.

## Source Basis

| Area | Exact current lines and observed control | Result |
|---|---|---|
| Full-unit inventory | `review-consumer.mjs:96-152` accepts only `unit: "line"`, requires the exact numbered-display marker framing, consecutive lines agreeing with `start`/`end`, and retains every raw slice. It explicitly fails on missing/mismatched framing, sequence, range, count, unit ID, or reassembly. Blank/header slices are retained without trim, filter, or dedup. | Covered |
| Lossless text spans | `review-consumer.mjs:155-173` slices draft and self-check text at LF boundaries, preserves CR/LF and empty lines, and verifies concatenation against the original string. | Covered |
| Stage isolation and full-ID schemas | `review-consumer.mjs:234-264` sends only source units in stage 1 and the same units plus validated assessments, both span tables, and coverage in stage 2. `363-383` and `405-454` require exact one-record-per-unit sets, reject unknown/duplicate/missing IDs and invalid span refs, and reject `ADDRESSED` without a draft ref. | Covered |
| Machine-derived anchors | Model output in `review-consumer.mjs:413-448` may contain IDs but cannot override source, draft, or self-check text; quote text is joined from the original unit/span tables. | Covered |
| Non-claims | `review-consumer.mjs:488-490` returns only `UNIT_REVIEW_COMPLETE_REQUIRES_ROOT_MANUAL_JUDGMENT`; `825-832` marks the result protocol-only and not a legal/business pass. Empty issues do not change that status. | Covered |
| HTTP boundary | `review-consumer.mjs:6-16` fixes the route, model, parameters, 2-call maximum, 400-second per-call deadline, 900-second overall cap, and 4 MiB response cap. `267-323` builds/validates the exact model request/response shape. `621-693` uses one POST with redirects rejected, deadline-derived abort, response-size cancellation, reader release/cancel, and no retry/fallback. | Covered |
| Own writes | `review-consumer.mjs:493-566` requires an absolute non-root path, rejects an existing output root, creates a fresh descendant tree, requires a simple JSON name, checks descendant containment, and writes with `wx` to prevent overwrite. | Covered |
| Credential and redaction | `review-consumer.mjs:457-477` redacts both raw and JSON-escaped credential spellings. `569-618` accepts only non-TTY printable-ASCII stdin and does not place the credential in argv or environment. `run-visible-unit-semantic-pilot-v2-saved-key-root-admin.py:64-103` enforces the Root gate before DPAPI use, passes the key by anonymous stdin, checks child identity, applies a watchdog, redacts captured output, and scans UTF-8 files under the owned root for raw and escaped spellings. | Covered |
| Admission and process cleanup | `admit-visible-unit-semantic-pilot-v2-reviewed-runtime-root-admin.py:27-34` fixes the known Node, PowerShell, driver, source, data, and manifest set as seven pins and creates a one-use admission. `run-visible-unit-semantic-pilot-v2-saved-key-root-admin.py:24-52` rechecks admission/pins and uses a clean proxy-free environment; `120-180` records PID/exe/UTC birth identities, enforces the watchdog, and performs exact-identity cleanup after every outcome. | Covered |
| Source/synthetic scope | `source-manifest.json:2-17` pins consumer, data, and controls. `T18-isolated-semantic-pilot-input-provenance-current.json.txt:2-34` identifies the material as the approved synthetic fixture despite real Native execution. `T18-isolated-semantic-pilot-data-origin-root-adjudication-current.json.txt:2-40` records the same Root disposition and publication hold. | Covered |

No blocker trigger therefore required a minimal source fix. The offline controls at `offline-controls.mjs:109-446` and `667-791` exercise the intended parser, schema, redaction, cap, partial-reader, complete-reader, and expired-deadline cases by authored assertions; this review did not execute them.

## Mandatory Qualifications

- This is source-only review. No Node/Python execution, parser or test run, HTTP/model call, credential/DPAPI read, GUI, runtime admission, or product integration was performed. Authored offline controls and previously claimed offline results are not runtime proof.
- Source and offline-green evidence is not semantic proof. Exact unit counting, complete ID coverage, empty issues, and the completion status do not establish factual completeness, correct wording, legal sufficiency, or that V2 actually detects the original omission/corrupted-quote defect. Root manual semantic judgment remains mandatory.
- The data boundary is an approved synthetic fixture. Physical Native execution and an original Native draft do not make it a real case.
- Security is bounded to the current user and existing Codex/workspace trust model with a shared writable parent. Owner-only ACLs, protection from a hostile local actor, full-machine or full-memory key absence, and full-platform security are not proven. The owned-root scan skips non-UTF-8 files and claims only the exact owned-root scope.
- A source manifest cannot authenticate itself. Root external admission, the seven external pins, and Root review remain mandatory.
- This result is not a Native workflow, Native Session/R/history, product, legal, business, quality, production, or release pass. Packaging remains **HOLD**.
