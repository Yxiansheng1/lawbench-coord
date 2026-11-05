# Independent source-only review: T18 semantic pilot

## Verdict

**AMEND**

The current source implements the intended two-request shape, but several explicit protocol conditions are not enforced. The defects are localized and do not require a framework or a broader production design change.

## Blocking findings

1. **The fixed input is verified and then read again, so the pinned bytes are not the bytes consumed.**  
   `01-review-consumer.mjs.txt` L0356-L0375 verifies every pinned file, but L0378 rereads `fixed-data.json` and returns that later read. A replacement between verification and the second read bypasses the size/SHA check.  
   Trigger: the fixed-data path changes after the first read and before L0378.  
   Minimal fix: retain the verified `fixed_data` bytes while iterating the pins, parse that buffer directly, and delete the second read. Add a negative control for this handoff if the control harness can express it without filesystem side effects.

2. **Markdown fences are accepted even though the contract requires one JSON object and the order bans fallbacks.**  
   `01-review-consumer.mjs.txt` L0197-L0208 strips ```` ``` ```` or ```` ```json ```` fences before `JSON.parse`; both stages use this path at L0596-L0599 and L0622-L0628. This is a parser fallback, not strict JSON handling.  
   Trigger: model content is a fenced JSON document rather than a bare JSON object.  
   Minimal fix: apply `JSON.parse` directly to trimmed content and fail fenced or otherwise wrapped content as `MALFORMED_JSON`; change the corresponding offline control to expect that failure.

3. **`ENTIRE_CALL_CAP_MS` is checked only before stage 2 and is not an enforced request deadline.**  
   `01-review-consumer.mjs.txt` L0602 checks elapsed time once, then L0610 calls a request whose only deadline is the independent 400-second per-call timeout at L0471-L0480. `runStartedAt` also predates source verification and credential acquisition at L0546-L0562.  
   Trigger: sufficient pre-request delay followed by a long stage-2 body read can finish after the 900-second cap.  
   Minimal fix: establish one overall deadline and pass `min(PER_CALL_TIMEOUT_MS, remainingOverallMs)` into each request; fail before issuing a request with no remaining budget and recheck the deadline after completion. Keep the two-call maximum unchanged.

4. **The API envelope is not bound to the requested model.**  
   `01-review-consumer.mjs.txt` L0144-L0149 sends `qwen38-27b`, while `unwrapChatCompletion` at L0163-L0195 never checks the response's `model` field. A successful response from another model would be accepted and represented as this pilot's output.  
   Trigger: a non-200-free envelope with one valid assistant choice but a missing or different `model`.  
   Minimal fix: require the exact expected response model before extracting content and fail missing or mismatched model values. Add offline positive and negative completion envelopes.

5. **An omission finding can identify a candidate whose exact quote is still present in the draft.**  
   `01-review-consumer.mjs.txt` L0283-L0309 validates candidate identity but treats every `draft_quote: null` plus candidate id as an omission, without checking the candidate's exact quote against the draft.  
   Trigger: stage 2 returns `draft_quote: null` for a candidate whose `quote` occurs verbatim in the original draft.  
   Minimal fix: for the omission branch, require the joined candidate's exact quote not to occur in `context.draft`. This is an exact-text guard, not a semantic classifier or completeness claim. Add a negative control for the present-in-draft case.

6. **The fixed-data reader accepts any positive draft version rather than the required old v3 draft.**  
   `01-review-consumer.mjs.txt` L0091-L0097 checks only `version >= 1`; it does not require `version === 3`, and L0102-L0106 forwards only the content. The current packet's external pin identifies the expected v3 source, but the runtime protocol itself does not enforce that exact condition.  
   Trigger: a matching-format packet carrying another positive version, including under a replaced manifest/source set.  
   Minimal fix: require the exact fixed draft version, add a version-mismatch negative control, and pass the validated title/version identity into the stage-2 envelope if the protocol needs that identity while discussing the draft.

## Nonblocking and source-unknown conditions

- `01-review-consumer.mjs.txt` L0230-L0232 treats whitespace-only ids, quotes, issues, and descriptions as nonempty. Minimal hardening is to reject strings whose trimmed value is empty, without altering exact-substring comparison.
- `01-review-consumer.mjs.txt` L0381-L0396 provides exclusive creation and lexical descendant writes, but it does not create an explicitly private root or prove restrictive platform ACLs. Filesystem privacy is therefore a missing condition: it depends on the caller-supplied parent and host defaults. Actual Windows ACL behavior was not tested in this source-only job.
- The runtime pin verifies files against a colocated manifest, but the manifest has no self-authenticating trust anchor. Integrity against simultaneous replacement of the manifest and all pinned files remains a root pre-admission condition; this review can establish only that the supplied packet hashes match the supplied index.
- `03-offline-controls.mjs.txt` uses synthetic sentinels and contains no fetch, credential, child-process, or file-write path. It exercises envelope extraction, malformed output, candidate joins, quote mismatches, and no-pass status. It lacks the specific negative controls called out above, and no control was executed in this source-only review.

## Source observations accepted without runtime proof

The source keeps stage 1 limited to evidence receipts and stage 2 limited to evidence, parsed candidates, draft content, visible self-check, and coverage (`01-review-consumer.mjs.txt` L0110-L0141). It wraps the stdin root credential as a Bearer value at L0152-L0161, does not place it in request bodies, rejects retries by construction, requires non-200 and timeout failure, caps response bytes, validates exact stage-1 schemas and receipt/material/unit/quote joins, and never emits a quality, legal, or business PASS (L0315-L0343, L0563-L0642). The main-module guard is import-safe (L0664-L0681), subject to the source-integrity conditions above.

No source files, product code, schemas, SDKs, keys, Git state, or runtime state were changed. No model, Node, parser, test, build, network, probe, GUI, or runtime command was executed.
