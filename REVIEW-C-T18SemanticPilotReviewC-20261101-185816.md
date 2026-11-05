# Independent source-only review - T18 isolated semantic pilot

## Verdict

**AMEND**

The frozen current source is substantially safer than the prior view, but four source-level conditions must be closed before admission. This is not a production, platform-security, completeness, legal, or business PASS.

## Must fix before admission

1. **Fixed-data pin has a check/use race.** `01-review-consumer.mjs.txt:0369-0378` hashes `fixed-data.json` during the pin loop, then reads it again at line 0378 for actual use. Trigger: replacement or mutation between those two reads. The parsed bytes would then not be the bytes that passed the SHA-256 and size pin. Minimal fix: retain the verified buffer returned by the pin check and return/decode that same buffer; do not reopen the file.

2. **The 900-second whole-run cap is not enforced across the requests.** `01-review-consumer.mjs.txt:0471-0520` accepts a fixed 400-second timeout, while the only overall-cap check is immediately before stage 2 at line 0602. There is no cap check before stage 1, and stage 2 can start just below 900 seconds and run another 400 seconds. Trigger: slow startup/artifact I/O or a slow stage-1 response followed by stage 2. Minimal fix: compute the remaining whole-run budget before each request and pass `min(PER_CALL_TIMEOUT_MS, remainingMs)` to that request's abort signal; fail without issuing a request when no budget remains.

3. **A fresh private artifact root is not established.** `01-review-consumer.mjs.txt:0381-0415` uses `mkdir` and `open(..., "wx")` with inherited/default permissions. `descendantPath` is only lexical and cannot prevent a symlink or directory swap under a concurrently writable parent/artifact directory. On Windows, Node mode bits do not supply ACL privacy. Trigger: shared writable parent or an attacker racing a symlink. Minimal fix: require a verified private parent, create the root and artifact directory with owner-only permissions where supported, enforce owner-only output files, reject symlink/identity changes after creation, and require the launcher to establish private ACLs on Windows.

4. **Credential redaction covers the raw literal, but not JSON-escaped renderings in stored response bodies.** `01-review-consumer.mjs.txt:0152-0161` permits printable ASCII including `"` and `\`; `01-review-consumer.mjs.txt:0314-0328` replaces only the exact raw token. `stage1-response.json` and `stage2-response.json` store the received JSON text as a string, where a reflected credential can appear as `\"` or `\\`. Trigger: provider echoes the Authorization value in a JSON error/body and the credential contains an escapable character. Minimal fix: restrict the credential to a safe non-whitespace, non-quote, non-backslash token character set, or redact both raw and JSON-escaped renderings before writing any response artifact.

## Mandatory source-unknown conditions

- `source-manifest.json` is trusted only after it has itself been pinned externally. The local program cannot authenticate the manifest that supplies its own pins. The root admission step must verify the frozen manifest SHA-256 `5f94e6eaab7b440290b0afdec9861bd2ec41eabf1973b8c75570a2e872cfe291` and exact size before execution.
- `fetch(ROUTE, ...)` uses the runtime's default dispatcher. The source does not explicitly disable environment proxy selection or protect against a modified/preloaded runtime. Before real calls, the root must use a known runtime with a sanitized environment and independently establish a direct connection; a default environment or unverified dispatcher does not prove "no proxy".
- Private output storage on the target Windows host remains source-unknown until its ACL and parent-path state are checked by the root.

## Source checks that passed

- Import is offline at source level: top-level code only declares constants/functions; the strict main-module guard gates execution.
- The only request route is the exact required POST URL, with model `qwen38-27b`, temperature `0.6`, `max_tokens: 49152`, `stream: false`, redirect rejection, no retry loop, and a fixed two-request sequence.
- Credential input is stdin-only, never argv/environment/request-body/header artifact, and is converted to `Bearer <raw key>` only at the request boundary. Failure stdout/stderr paths emit codes rather than payloads.
- The API envelope requires exactly one assistant choice, `finish_reason: stop`, nonempty content, and no tool calls. Stage schemas, receipt joins, stage-one candidate joins, exact quote containment, non-200, timeout, length, malformed JSON, empty stage-one facts, and anchored-finding failures are rejected.
- An empty stage-two findings array is retained only as `EMPTY_REVIEW_NOT_QUALITY_PASS`; it is not silently accepted as a business or legal pass. Failure paths write explicit failure artifacts where an output root exists.
- A 4 MiB response cap and reader cancellation are implemented.

No Node, Python, parser, test, build, HTTP, model, GUI, app, Key, or runtime was executed. No previous green result is treated as proof. No product/schema/SDK edits were made. All prior hard bans and old RED findings remain in force; this review does not authorize real-key use, production integration, NativeSession/R activation, completeness claims, or a general security/platform/business PASS.
