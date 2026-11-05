# REVIEW-A — T18 V5 explicit-deadline public Node HTTP transport (source-only, independent lane A)

VERDICT: **PASS** (source-only scope). No real new in-scope bug found in the public
`node:http` transport, its Promise lifecycle, event ordering, memory controls, fail-closed
behaviour, or the cumulative V4→V5 protocol delta. Four non-blocking observations (F1–F4)
are recorded below; none is a reachable production defect.

Scope limitation stated up front: index requirement 5 (Root driver / admitter / outer code)
and the frozen network-guard source are **not present in the A view set** (they appear only
in `C_views`), so those sub-items are **NOT cleared by this review**. They remain owned by
the C lane / other independent reviews.

## What was actually read (A views only, full)

- `00-review-consumer.mjs.txt` — full 1426 lines (source lines 1–1424)
- `01-offline-controls.mjs.txt` — full 1181 lines (source lines 1–1179)
- `02-source-manifest.json.txt`, `06-T18-explicit-deadline-http-v5-source-reviewed-current.json.txt`,
  `07-T18-isolated-semantic-pilot-input-provenance-current.json.txt`,
  `08-ORCH-B-T18ExplicitDeadlineHttpV5-20261101-221038.md.txt`
- `review-consumer.mjs.diff.txt`, `offline-controls.mjs.diff.txt` (cumulative delta, used as
  navigation only — full current code was read, not just the diff)

No Node/Python/parser/`--check`/test/build/HTTP/model/Key/probe/GUI run; no Git write of any
kind; no file outside that view set was opened; no peer or older formal was supplied or read.

## Conformance — index requirement 1 (public HTTP transport)

`performRequest` (consumer 1009–1228), single call, single transport:

- Fixed route / POST / exact UTF-8 body / auth / length / agent:false / signal —
  consumer 1209–1218: `http.request(ROUTE, { method:"POST", headers:{Content-Type, Authorization,
  Content-Length}, agent:false, signal })`; `Content-Length` = `Buffer.byteLength(requestBody,"utf8")`
  (1015) and the body actually written is the same bytes as a Buffer (1014, 1223).
- Same deadline, no budget raise: `requestTimeoutForDeadline` (534–537) = `min(400_000, deadline-now)`;
  signal = `AbortSignal.timeout(timeoutMs)` (1013). `timeoutMs <= 0` → `ENTIRE_CALL_CAP_EXCEEDED`
  **before any I/O** (1010–1012); confirmed by controls 1165–1173 (0 requests created).
- No retry / redirect / fallback / global agent / SDK change: exactly one `http.request`
  (1209) and one `end()` (1223) per call; `agent:false` (1216) → a fresh non-keepAlive
  Agent per call, no global-agent pooling/timeout interference and no global mutation;
  `node:http` never follows `Location`, and the `redirect` option is absent (controls 0902
  asserts `undefined`).
- Single settlement: `settled` is set before `resolve` (1077–1085); `end`, request `error`,
  response `error`/`aborted`/`close`, timeout, overflow all route through
  `finishSuccess`/`finishFailure`, and every late event is ignored once settled
  (1126–1139, 1150, 1162, 1186–1197).
- Timeout classification is correct on the real path: the consumer's abort listener is
  registered at 1206 **before** `http.request` at 1209, so on a real 400 s per-call abort the
  consumer's own `onAbort` (1122–1124) wins the race against Node's internal
  abort→request `error` path. `signalTimedOut` (1100–1101) is derived from the signal
  reason's name, so the result is `TIMEOUT`, or `ENTIRE_CALL_CAP_EXCEEDED` when the
  remaining whole budget is below the 400 s per-call bound (1103–1104) — never a
  mislabelled `TRANSPORT_FAILURE`, and never `UND_ERR_HEADERS_TIMEOUT` (undici-only code,
  unreachable through `node:http`).
- Captured prefix + actual status: `responseStatus` is taken from `statusCode` when the
  headers arrive (1141) and is preserved on every failure path (1112); the partial prefix
  is retained on failure (1030, 1113).
- 4 MiB memory control: the overflow chunk is **not** buffered (1152–1155), the prefix is
  kept, `responseOverflow` is returned as `true` with `transportError:null` (1087–1095),
  and the owned response/request/socket are destroyed (1059–1075). `runMain` still fails
  closed on it (consumer 1353–1354 → `RESPONSE_TOO_LARGE`).
- Ownership / destruction / leak control: only objects created by this call are destroyed
  (1059–1075); the request's `error` listener is removed only after the request emits
  `close` (1200–1204 → 1041–1047 → 1049–1053) and the response's `error` listener only
  after the response emits `close` (1174–1178), i.e. error handlers outlive the async
  destroy — no unhandled-`error` window under Node's ordering (`error` precedes `close`
  for a given stream, and a destroyed `ClientRequest` emits no further `error`).
  The abort listener is removed at settle (1055–1057, 1080); `AbortSignal.timeout`'s timer
  is Node-unref'd, so no timer holds the process open.
- Fail-closed + redaction: the diagnostic is a fixed static whitelist
  (964–1007) — name/code/cause-code mapped to enumerated categories, everything else to
  `OTHER`; no message, stack, errno text or secret can reach an artifact (controls
  979–1005, 1075–1141). Synchronous `http.request`/`end` throws are caught and settled
  safely (1207, 1224–1226).
- Result shape preserved: `status/body/capturedBytes/responseOverflow/durationMs/
  transportError/transportDiagnostic` (1087–1095, 1109–1119) are the same fields the V4
  `performRequest` returned; the consumer's main loop (1337–1354) is unchanged.

## Conformance — index requirement 2 (offline controls)

- The controls exercise the **real exported** `performRequest` (import at 0035) with
  `http.request` stubbed (0918–0922) and restored in `finally` (1174–1177). No mirrored
  transport implementation, no loopback server, no URL/route injection, no real socket.
- Covered: complete success (926–947), response error with partial prefix and a **late**
  request error proving settle-once (950–977), unknown/secret error → `OTHER` + redaction
  (979–1005), `aborted` (1007–1028), premature `close` (1030–1050), request error (1052–1073),
  timeout (1075–1094), signal abort (1096–1123), absent errno code (1125–1141), overflow
  with prefix preservation (1143–1163), expired pre-call with zero requests created
  (1165–1173).
- Fake request/response assertions pin the transport contract: exact route, POST, `agent:false`,
  no `redirect` option, `signal` present, exactly the three headers, exact `Content-Length`,
  body delivered once as a Buffer with the exact UTF-8 bytes (0898–0916).
- The pure protocol assertions (controls 1–829: inventory, Stage1 reuse, schema, subset,
  merge, caps, model params, deadlines, redaction) are unchanged versus V4; the diff shows
  the delta is exactly the old fetch-fake block replaced by the `node:http` fake.
- Weakening check: the only changed expectations are the intended ones (overflow now keeps
  the prefix instead of `""`; `redirect:"error"` becomes `redirect===undefined` because
  `node:http` never follows redirects, and a 3xx now surfaces as `HTTP_NON_200` — both fail
  closed). No schema/protocol assertion was relaxed.

## Conformance — index requirement 3/4 (guard, deadlines, cumulative protocol)

- The transport is a plain `node:http` call from the start; no SDK/private-API/global
  dispatcher change; no fallback transport, retry, health probe or endpoint switch.
- Cumulative protocol delta is confined: consumer diff = one import (line 0005) + the whole
  `performRequest` body (1009–1228); everything else — model prompts, fragment inventory,
  Stage1 cache reuse, sharding 183+182, exact ID set, merge, redaction, CLI, credential
  stdin, artifact writing, main loop — is byte-identical to V4. Data pin `e386b2e0…` and
  cache pin `5e4ba4c5…` are the ones the manifest and the source-reviewed json both carry.
- 365 targets / F117 C134 Q114 / shard sizes 183+182 / 2 calls / 400 s per call / 900 s
  whole cap / 4 MiB / `qwen38-27b` / temp 0.6 / 49152 / stream false are all still the
  single declared constants (0007–0020) and are asserted unchanged in the controls
  (0302–0311).

## Non-blocking findings (no reachable production defect)

F1 — stale redirect metadata. Consumer 1280 still writes `redirect: "error"` into
`route.json`, but the transport is now `node:http`, which has no `redirect` option and
never follows `Location`; the artifact asserts a property the code does not set.
Trigger: any run that writes `route.json`. Impact: misleading metadata only; behaviour
is fail-closed (`HTTP_NON_200` for 3xx). Minimal fix: drop or relabel the field.

F2 — offline timeout case cannot reproduce the real diagnostic shape. Controls 1075–1094
assert `transportDiagnostic.errorCode === "ETIMEDOUT"`, but that value comes from a
synthetic `Error` the fake raises. The real path reports the signal reason (consumer
1122–1124 → 1105–1118), and `AbortSignal.timeout`'s reason is a DOMException named
`TimeoutError` whose `code` is not an errno and is not in the static whitelist (0970–0981),
so the real diagnostic is `errorName:"TIMEOUT_ERROR"` with a non-errno `errorCode`, never
`"ETIMEDOUT"`. Trigger: a real 400 s per-call timeout. Impact: the assertion does not
discriminate real Node semantics; the **classification** (`TIMEOUT` vs
`ENTIRE_CALL_CAP_EXCEEDED`) is unaffected because it is derived from the reason's *name*.
Minimal fix: add one case that drives the timeout through the signal-reason path (stub
`AbortSignal.timeout` to a signal aborted with a `{name:"TimeoutError"}` reason) and
assert the real-shape diagnostic instead of an errno.

F3 — two defensive branches are not exercised offline. The late-`response`-after-settle
branch (1126–1139) and the late-`socket` branch (1184–1198) are never entered by the
suite: the fake request never emits `socket`, and `FakeRequest.end` returns early once
`destroyed` (controls 0877–0878). Trigger: server headers arriving after the per-call
abort. Impact: no proven defect — both branches are written defensively and read
correctly — but the offline suite cannot detect a regression there. Minimal fix: one case
that settles first (e.g. request `error`) and then emits `response` and `socket` on the
fake, asserting no unhandled `error` and that the late objects are destroyed.

F4 — credential validation error is funnelled into the transport-failure channel.
`buildAuthorizationHeader` throws `CREDENTIAL_INVALID` at consumer 1208, inside the same
`try` as the request, so it is caught at 1224 and reported as `transportError
"TRANSPORT_FAILURE"` with diagnostic `{errorName:"OTHER", errorCode:"OTHER"}` instead of
the `CREDENTIAL_INVALID` protocol code; `runMain` then fails as `FAIL_TRANSPORT_FAILURE`.
Trigger: a malformed credential. Impact: fail-closed is preserved (no socket, no request
created) and the diagnosis is degraded only. This is **V4-equivalent** (V4's `fetch`
try/catch did the same), i.e. pre-existing rather than introduced by V5. Minimal fix
(optional, outside the transport scope): hoist credential validation above the transport
try/catch so the protocol error propagates.

## Limits of this review

- Source-only. Nothing was executed: no Node run of the consumer or the controls, no
  `--check`, no parser, no test, no build, no HTTP request, no model call, no Key use.
  No runtime, timing, socket, DNS or server-side behaviour was observed.
- Semantic / business / legal: no PASS is implied. Exact 365 canonical IDs, counts and
  refs are not entailment; no model-author expected failure labels were supplied, so no
  factual or self-check judgement was possible. "Root source green is not semantic proof."
- The frozen network guard (which must mediate `http.request` and `net.Socket`) and the
  Root driver / admitter (clean env, 8 pins, anonymous stdin, private env, no proxy,
  preload, exact PID/exe/UTC birth cleanup, own scan) were **not** in the A view set;
  their unchanged-SHA and no-denial-bypass claims are accepted as inputs, not verified here.
- No guarantee is made against a hostile local actor, private-ACL races, whole-machine
  compromise, server-side cancellation, or memory erasure; no environment-level or
  ACL-level claim is made.
- The V4→V5 diff was used as navigation; all conclusions above rest on the full current
  source of both files, not on the diff alone.

