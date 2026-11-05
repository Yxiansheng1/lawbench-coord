# HANDBACK — B lane — T18 Semantic Pilot Response Closure (2026-11-01)

Execution order: `D:\Lawbeach\lawbench-coord\ORCH-B-T18SemanticPilotResponseClosure-20261101-192423.md`
Capsule: `D:\Lawbeach\lawbench-coord\T18SemanticPilotResponseClosure-20261101-192423-capsule.json`
Capsule root (only location read and written):
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18IsolatedSemanticPilot-20261101-183940`
Lane: B (`D:\Lawbeach\lawbench-B`, branch `line-B`, HEAD `dc56a93be4b07dbe7a48863e3135351659817fb5`, read-only Git)

## 1. Status

- Runtime status: **AUTHORED_NOT_RUN**, runtime **0**.
- No Node, Python, parser, `--check`, test, build, prepare, probe, HTTP, model, or GUI execution was
  performed. The offline controls were authored and source-reviewed only; the order assigns the
  control run to root after source review.
- No other file, skill, Git write, discovery, metadata, environment, or credential read was made.
  Reads were limited to: the order, the capsule JSON, and the three capsule-root files
  (`review-consumer.mjs`, `offline-controls.mjs`, `source-manifest.json`) plus a `fixed-data.json`
  pin measurement and a read-only `git status` of `docs/plan/evidence/T18`.
- No API was changed, no other chat was contacted.

## 2. Files written (exactly three, all inside the capsule root)

| File | Before bytes | After bytes | After sha256 |
| --- | --- | --- | --- |
| `review-consumer.mjs` | 27921 | 28483 | `e4284da357bcf7b9d37f61a7f31dc23e3be1e9d84d5470e484fae6b7e3035ee6` |
| `offline-controls.mjs` | 16290 | 21443 | `b7b7722ff8b745911b023fc1bc699e26ad5be257b31173cfe7e001c917bd6cac` |
| `source-manifest.json` | 523 | 523 | regenerated (3 pins) |

`fixed-data.json` was **not** modified: 17427 bytes, sha256
`e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69` (matches the capsule
`data_pin` exactly).

`source-manifest.json` after regeneration (consumer and offline_controls pins changed; fixed_data
pin unchanged):

```json
{
  "algorithm": "sha256",
  "consumer": {
    "path": "review-consumer.mjs",
    "bytes": 28483,
    "sha256": "e4284da357bcf7b9d37f61a7f31dc23e3be1e9d84d5470e484fae6b7e3035ee6"
  },
  "fixed_data": {
    "path": "fixed-data.json",
    "bytes": 17427,
    "sha256": "e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69"
  },
  "offline_controls": {
    "path": "offline-controls.mjs",
    "bytes": 21443,
    "sha256": "b7b7722ff8b745911b023fc1bc699e26ad5be257b31173cfe7e001c917bd6cac"
  }
}
```

The three pins were regenerated **once**, as the final source change, and were then re-measured
read-only: bytes and sha256 match the manifest for all three entries (`True`/`True` on each).

## 3. Fix 1 — response evidence preservation, reader terminal path, timeout classification

File: `review-consumer.mjs`. Three hunks, no other consumer logic touched.

### Hunk 1.1 — `performRequest` signature export (per order: exporting the existing function is
allowed solely so the controls exercise the SAME implementation)

```diff
-async function performRequest(stage, requestBody, credential, deadline) {
+export async function performRequest(stage, requestBody, credential, deadline) {
```

### Hunk 1.2 — state hoisted outside `try`; signal kept; reader cancel on the error path;
signal-based timeout detection; evidence preserved in the failure return

```diff
   if (timeoutMs <= 0) fail(stage, "ENTIRE_CALL_CAP_EXCEEDED");
+  const signal = AbortSignal.timeout(timeoutMs);
+  let responseStatus = null;
+  const chunks = [];
+  let capturedBytes = 0;
+  let overflow = false;
   try {
     const response = await fetch(ROUTE, {
       method: "POST",
       redirect: "error",
       headers: { Authorization: buildAuthorizationHeader(credential), "Content-Type": "application/json" },
       body: requestBody,
-      signal: AbortSignal.timeout(timeoutMs),
+      signal,
     });
-    const chunks = [];
-    let capturedBytes = 0;
-    let overflow = false;
+    responseStatus = response.status;
     if (response.body) {
       const reader = response.body.getReader();
+      let streamFailed = false;
       try {
         while (true) {
           ...
         }
+      } catch (error) {
+        streamFailed = true;
+        throw error;
       } finally {
+        if (streamFailed) {
+          try {
+            await reader.cancel();
+          } catch {
+            // Cancel errors are swallowed only for a stream that already failed.
+          }
+        }
         reader.releaseLock();
       }
     }
     return { status: response.status, body: ..., capturedBytes, responseOverflow: overflow, ... };
   } catch (error) {
-    const wholeDeadlineExpired = Date.now() >= deadline ||
-      (error && error.name === "TimeoutError" && timeoutMs < PER_CALL_TIMEOUT_MS);
+    const signalTimedOut = signal.aborted === true &&
+      signal.reason && signal.reason.name === "TimeoutError";
+    const timedOut = (error && error.name === "TimeoutError") || signalTimedOut;
+    const wholeDeadlineExpired = Date.now() >= deadline ||
+      (timedOut && timeoutMs < PER_CALL_TIMEOUT_MS);
     return {
-      status: null,
-      body: "",
-      capturedBytes: 0,
-      responseOverflow: false,
+      status: responseStatus,
+      body: Buffer.concat(chunks).toString("utf8"),
+      capturedBytes,
+      responseOverflow: overflow,
       durationMs: Date.now() - startedAt,
       transportError: wholeDeadlineExpired
         ? "ENTIRE_CALL_CAP_EXCEEDED"
-        : error && error.name === "TimeoutError" ? "TIMEOUT" : "TRANSPORT_FAILURE",
+        : timedOut ? "TIMEOUT" : "TRANSPORT_FAILURE",
     };
   }
 }
```

Resulting behaviour:

- `responseStatus`, `chunks`, `capturedBytes`, `overflow` live outside `try`, so a post-header
  reader failure returns the preserved status, the exact captured text, the captured byte count and
  the overflow flag **alongside** the failure classification (`TRANSPORT_FAILURE`), instead of
  discarding partial evidence.
- The reader is cancelled on every incomplete/error path. The `cancel()` error is swallowed **only**
  for a stream that already failed; `reader.releaseLock()` is still executed on every path
  (success, overflow, and error).
- A request-signal timeout is detected through `signal.aborted` / `signal.reason.name === "TimeoutError"`
  even when the body error name differs, so the whole-deadline vs per-call classification is
  preserved (`ENTIRE_CALL_CAP_EXCEEDED` vs `TIMEOUT`).
- No retry, no parser repair, no prompt change was introduced.

### Hunk 1.3 — `stageN-response.json` is stored immediately after the response returns, before the
post-response deadline failure; the deadline failure itself is unchanged and no expired result is
ever accepted

```diff
     const stage1Response = await performRequest("stage1", stage1Body, credential, deadline);
-    if (Date.now() >= deadline) fail("stage1", "ENTIRE_CALL_CAP_EXCEEDED");
     await writeArtifact(artifactsDir, "stage1-response.json", { ... }, credential);
+    if (Date.now() >= deadline) fail("stage1", "ENTIRE_CALL_CAP_EXCEEDED");
```

```diff
     const stage2Response = await performRequest("stage2", stage2Body, credential, deadline);
-    if (Date.now() >= deadline) fail("stage2", "ENTIRE_CALL_CAP_EXCEEDED");
     await writeArtifact(artifactsDir, "stage2-response.json", { ... }, credential);
+    if (Date.now() >= deadline) fail("stage2", "ENTIRE_CALL_CAP_EXCEEDED");
```

Partial/boundary response evidence is therefore persisted before the deadline verdict fires; the
run still fails in that situation, and no error is waived or downgraded.

## 4. Fix 2 — non-ASCII redaction marker

File: `review-consumer.mjs`, one line:

```diff
-const REDACTION = "[REDACTED_CREDENTIAL]";
+const REDACTION = "\u2588";
```

The marker is a single full-block character (U+2588). The credential validator
(`buildAuthorizationHeader` and the stdin reader) admits printable ASCII only (code points 33–126),
and U+2588 lies outside that set both as a raw character and as its JSON-escaped form, so the
marker can never itself be an admitted raw or JSON-escaped credential, and it separates the
neighbouring text. The existing longest-first replacement of the raw and the JSON-escaped
renderings is unchanged.

`[REDACTED_CREDENTIAL]` no longer appears anywhere in `review-consumer.mjs` or
`offline-controls.mjs` (verified by read-only search: zero hits; the only `u2588` sites are
consumer line 22 and controls lines 25 and 176).

Controls for the marker (file `offline-controls.mjs`):

- The controls now use the **same** marker (`const REDACTION_MARKER = "\u2588";`) for every
  expected string.
- Marker property asserted: every character of the marker and of its JSON-escaped rendering has
  code point > 126, and the marker equals `"\u2588"`.
- A fake **one-character** credential `R` is exercised in raw text, in an error string, in a JSON
  body string, as an object key, and as a nested value; the transformed values are asserted equal
  to the expected block marker and asserted to contain no raw credential.
- The previous long-credential cases (exact raw + JSON-escaped, quote/backslash sentinel, raw key,
  escaped key, nested values) were rewritten to expect the same marker and keep their assertions.

Limit explicitly not claimed: this does **not** prove the absence of a short token from unrelated
JSON syntax or data, and it makes no claim about all encodings or any machine guarantee. No real
credential was probed and the credential validator was not changed.

## 5. Fix 3 — offline controls for the actual response path

File: `offline-controls.mjs`, appended block at the end (before the final stdout line), plus the
`performRequest` import and the marker constant.

- No network, no app, no real timers/sleeps, no model call. `globalThis.fetch` is replaced by an
  in-memory fake and restored in a `finally` block (`globalThis.fetch = originalFetch;`).
- The exported `performRequest` from the consumer is exercised directly — the same implementation,
  no new optional transport configuration and no new framework.
- **Control A — partial response with reader failure.** The fake reader yields one prefix chunk
  (`{"partial_prefix":`) and then throws. Asserted: returned `status === 200`, body exactly equals
  the captured prefix, `capturedBytes` equals the prefix byte length, `responseOverflow === false`,
  `transportError === "TRANSPORT_FAILURE"`, reader `cancel` attempted once, `releaseLock` called
  once, and the fetch call carried `POST` / `redirect: "error"` / `Bearer <fake>` / a signal.
- **Control B — complete response control.** Two chunks then `done`. Asserted: `status === 200`,
  body `"{\"ok\":true}"`, matching `capturedBytes`, `responseOverflow === false`,
  `transportError === null`, no `cancel` call, `releaseLock` called once.
- **Control C — already-expired deadline negative control.** `deadline` in the past. Asserted: the
  call rejects with code `ENTIRE_CALL_CAP_EXCEEDED` and the fake fetch call count is `0`.
- Only a fake, non-secret credential is used (`OFFLINE_FAKE_CREDENTIAL_SENTINEL`); no actual HTTP
  request, no fetch dispatcher, no network, no denial was attempted.
- The existing frozen network guard source was not modified, and no external request was made.

## 6. Everything else kept exact

Model `qwen38-27b`, `temperature 0.6`, `max_tokens 49152`, `stream false`, route
`http://10.126.126.1:8000/v1/chat/completions`, `MAX_SEQUENTIAL_CALLS = 2`, per-call timeout
400000 ms, entire-call cap 900000 ms, response cap 4 MiB, source pins, the same verified input
buffer, input schemas, candidate anchors, both stage message sets, stage isolation, the single
outer fence, root-path rules, and the credential stdin logic are unchanged. The only consumer
changes are the three hunks listed in section 3 and the one-line marker change in section 4.
No production, non-pilot, schema, SDK, ACL, or global-policy file was touched.

## 7. Git state

Git was strictly read-only. No `add`, `commit`, `rebase`, `stash`, `reset`, `clean`, `checkout`, or
`push` was executed; nothing was staged. The pre-existing dirty worktree was preserved as-is. The
capsule directory `docs/plan/evidence/T18/T18IsolatedSemanticPilot-20261101-183940/` was already
untracked before this job and remains untracked; no commit SHA exists for these changes, by
instruction. No index lock, permission denial, or ACL issue arose.

## 8. Residual / next step for root

1. Root reviews the three hunks in `review-consumer.mjs` and the appended control block.
2. Root runs `offline-controls.mjs` (node) after that review — the controls are authored and
   source-checked here but deliberately **not run** by this job.
3. Root confirms the three manifest pins against the files as shipped in this handback.
