# HANDBACK-B: T18 Explicit-Deadline Public Node HTTP V5

Status: `AUTHORED_NOT_RUN`

## Delivery

The source-only V5 package is at:

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18ExplicitDeadlineHttpV5-20261101-221038\`

It contains exactly the five required files with the original filenames:

- `review-consumer.mjs`
- `fixed-data.json`
- `offline-controls.mjs`
- `stage1-assessments.json`
- `source-manifest.json`

`fixed-data.json` and `stage1-assessments.json` are byte-held copies. The consumer changes only the public transport import and the `performRequest` implementation. The controls change only the old `globalThis.fetch` fake section and imports. Model prompts, inventory, Stage1 reuse, sharding/merge, payloads, limits, redaction, artifacts, main-loop flow, import guard, and the lower network guard remain unchanged.

## Transport Repair

`performRequest(stage, requestBody, credential, deadline)` now uses one public `node:http` request from the start:

- fixed `ROUTE`, `POST`, JSON content type
- existing `buildAuthorizationHeader`
- exact UTF-8 `Content-Length`
- `agent: false`
- one request-owned `AbortSignal.timeout(requestTimeoutForDeadline(Date.now(), deadline))`
- no retry, redirect following, endpoint fallback, SDK/global-agent/default-library change
- pre-I/O exhaustion still fails as `ENTIRE_CALL_CAP_EXCEEDED`
- actual status, captured partial prefix, static diagnostic whitelist, and existing TIMEOUT / ENTIRE_CALL_CAP_EXCEEDED / TRANSPORT_FAILURE categories are preserved
- response completion, request error, response error/aborted/premature close, timeout, and overflow settle exactly once
- overflow skips the oversized chunk, preserves the prefix, sets `responseOverflow: true`, and destroys the call-owned response/request/socket
- success and failure close/dispose call-owned objects; late events are ignored safely

The existing 400-second per-call limit and 900-second whole-run limit are unchanged. No deadline, model token, temperature, or request budget was raised.

## Offline Controls

`offline-controls.mjs` is source-only and was not executed. Its fake replaces only public `http.request` with EventEmitter-style in-memory request/response objects. It asserts route, POST, authorization, content type, exact content length, `agent: false`, signal, and exact body bytes. It covers success, partial-prefix response error, response abort/premature close, request error, abort, timeout classification, overflow, pre-call expiry, late events, exact-once settlement, owned destruction, static unknown-code fallback, and credential redaction. No loopback server, real HTTP, timer wait, route injection, or mirrored transport is used.

## Final Source Pins

`source-manifest.json` uses `sha256` with these final values:

- consumer: 53968 bytes, `166fedcd07bc31e4a3b2c09d73aa1f23ccbde19189dcd3e30315e1e387667c31`
- fixed_data: 17427 bytes, `e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69`
- offline_controls: 40367 bytes, `adc91fa3c58362ef5fa05e4dbc621c8787283821ad27b7203e2af8c71fd1c3d3`
- stage1_assessments: 10015 bytes, `5e4ba4c51aa23b29b8625174c595d940628bbb7910ef6e9afcd4f777d5712fc1`

The two reused data pins exactly match the prior immutable values.

## Verification Boundary

Per the V5 execution order, this author performed no syntax check, test, Node/Python execution, build, HTTP probe, model admission, environment/Key handling, runtime setup, GUI action, or Git write. No readback or second hash loop was performed after final source authorship. No product, SDK, default-library, Skill, Native, Host, global configuration, policy, ACL, package, or lock change was made.

The closed V4 actual run established only that its first 183-target call ended in a client `UND_ERR_HEADERS_TIMEOUT` at 304655 ms with no headers or body, and that the second shard was never sent. This handback makes no server-outage, model-temperature, Key, or causal claim beyond that observed client headers timeout.

Root must complete full setup/cleanup review, affected offline controls, and independent review before any new Key/model call. Packaging remains `HOLD`.
