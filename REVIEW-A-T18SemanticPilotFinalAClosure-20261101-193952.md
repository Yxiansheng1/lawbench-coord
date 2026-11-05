# Independent source-only protocol review — A line, T18 Semantic Pilot final A closure

Scope of this document: independent **source-only** judgement on the frozen packet described by
`T18SemanticPilotFinalAClosure-20261101-193952-capsule.json` (current consumer, current controls,
and the two precise response-hunk diffs). The prior deadline job is immutable and was **not**
reopened; no unchanged-green re-run was performed. In this job I did not touch source, tests,
product, schema or SDK, and I ran no Node, no test, no preparer, no model, no probe, no HTTP, no
Git write. The only artifact I produced is this file.

## Verdict: PASS (source-only, qualified by the runtime limits in section 5)

I found **no in-scope blocker** in the current source against the enumerated requirements. The
verdict covers protocol/source conformance only — not model behaviour, not evidence quality, and
not any business or legal pass. Root adjudicates; I do not force PASS on any point I could not
confirm, and the qualifications below are the ones I could not confirm from source alone.

### 1. Requirement conformance

**(a) Two fresh contexts, evidence-only first, then evidence + candidates + old draft + self-check
+ actual coverage; no model actions, no completeness, no business PASS.**
Stage 1 carries only receipts (`buildStage1Envelope` 0110-0112, `buildStage1Messages` 0124-0132);
the draft, self-check and coverage are absent from stage 1 and their absence is asserted by the
controls (0118-0120). Stage 2 carries receipts, stage-1 candidates, original draft, visible
self-check and actual coverage (`buildStage2Envelope` 0114-0122) and receives no stage-1
transcript, asserted at 0139. Both requests are fresh two-message system+user turns, so stage 2
does not inherit stage 1's context. The stage-1 prompt forbids completeness, legal conclusion and
pass/fail (0033); the stage-2 prompt forbids inventing absent material, repairing the draft,
deciding a legal outcome and returning an overall pass (0046).

**(b) Exact route/model/0.6/49152/max 2 calls/400 s per call/900 s remaining; no retry, no
redirect; exact model envelope; one outer fence; genuine quotes and candidate joins, not a
semantic classifier.**
Route `http://10.126.126.1:8000/v1/chat/completions` (0006), model `qwen38-27b` (0007),
`temperature 0.6` / `max_tokens 49152` / `stream false` frozen in `PARAMETERS` (0008-0012) and
reproduced verbatim in the payload (0144-0150). `MAX_SEQUENTIAL_CALLS = 2` (0013),
`PER_CALL_TIMEOUT_MS = 400_000` (0014), `ENTIRE_CALL_CAP_MS = 900_000` (0015). The single outer
fence is `deadline = runStartedAt + ENTIRE_CALL_CAP_MS` (0584-0585); each call timeout is clamped
to `min(400 s, deadline-now)` (0163-0166, 0487). `redirect: "error"` (0498) and no retry exists
anywhere: exactly two `performRequest` call sites (0621, 0651), no loop around them, and any
timeout aborts the run (0631-0637, 0661-0667). The model envelope is checked strictly
(`envelope.model !== MODEL` → `COMPLETION_MODEL_MISMATCH`, 0177; `finish_reason !== "stop"` →
`COMPLETION_NOT_FINISHED`, 0188; `tool_calls` non-empty → `COMPLETION_TOOL_CALLS_UNSUPPORTED`,
0192-0196). Anchoring is exact-substring and exact-equality, never semantic: stage-1 quote must
be a substring of the referenced receipt and `material_id`/`unit` must equal the receipt's
(0265-0269); stage-2 `evidence_quote` must be a receipt substring (0300), `draft_quote` a draft
substring (0303), `selfcheck_quote` a self-check substring (0309), and a supplied
`stage1_candidate_id` must bind to exactly that candidate's `receipt_id` and `quote`
(0289-0299).

**(c) Same verified fixed-data buffer consumed; positive-integer schema; external pinning of the
actual v3 data.**
`verifyPinnedSources` reads `fixed-data.json` once into bytes, verifies byte count and sha256
against `source-manifest.json` for all three files (consumer, fixed_data, offline_controls) and
returns **that same buffer** (0368-0393); `runMain` parses exactly this string (0591-0597) and
both stages derive from the single resulting `input` object (0598, 0614, 0644). Schema is
positive-integer and generic, not fixture-specific: `format` tag, non-empty evidence array with
string receipt fields, `draft` with string `content`/`title` and `Number.isSafeInteger(version)
&& version >= 1`, string `visible_selfcheck`, plain-object `coverage` (0074-0108). The identity
of the actual v3 data is *not* asserted in code — it comes from the external manifest pin, which
is the correct boundary.

**(d) Response path: partial status/body preservation; response artifact written before a late
deadline failure; reader cancel + release; raw and JSON-escaped redaction with a non-ASCII
marker outside the admitted ASCII set; same-implementation in-memory fake controls, no real
network.**
The catch path preserves the partial state: `status: responseStatus` (0502, 0548), the
concatenated partial body, `capturedBytes` and `responseOverflow` (0534-0537, 0549-0552). The
deadline check moved **after** the response artifact write in both stages (0621-0629, 0651-0659),
so a late-deadline failure still leaves the response artifact on disk — this is exactly the
diff hunk under review. The reader is cancelled and the lock released: cancel on overflow
(0511-0515), cancel in the `finally` when the stream failed (0522-0529), `releaseLock()` always
(0530). Redaction covers both the raw credential and its JSON-escaped rendering
(`JSON.stringify(credential).slice(1,-1)`, 0322-0328), longest rendering first, and the marker is
`"\u2588"` (0022), which is outside the printable-ASCII set admitted by the credential validator
(0152-0159, 0449-0453) — so the marker itself can never be an admitted raw or escaped credential
(asserted at 0174-0176). The controls exercise the **same exported implementation**
(`performRequest` is now exported, 0485) by replacing `globalThis.fetch` in memory and restoring
it in `finally` (0551-0620): a stream-failure case asserting partial body preservation, one
`cancel` and one `releaseLock` (0553-0584); a complete-response case (0586-0605); and an
expired-deadline case asserting zero fetch attempts (0607-0617). No real network, no sleeps, no
model call.

**(e) Empty findings are not a quality PASS; every finding needs Root judgement; no lexical
quote-presence omission filter; no hardcoded fixture version or keywords; no ACL framework.**
`outputStatusForFindings` returns `EMPTY_REVIEW_NOT_QUALITY_PASS` or
`REVIEW_FINDINGS_REQUIRE_ROOT_MANUAL_JUDGMENT` (0351-0355) and never `PASS`; the controls assert
the negative (0373-0374). `final-report.json` always carries
`protocol_capability_only: true` and `legal_or_business_pass: false` (0674-0685). The source
contains no omission-by-quote-presence logic — quote presence is used only as an *anchor*
requirement for each finding (0315) — no fixture version is hardcoded (version check is
`>= 1`, 0094-0096) and no keyword-driven classifier. No access-control/ACL framework exists in
either file.

### 2. Non-blocking observations (recorded, not blocking; no change required to close)

**OB-1 — `MAX_SEQUENTIAL_CALLS` is declarative, not enforced.** 0013; surfaced in `route.json`
(0607) but never used as a runtime counter. The two-call limit currently holds *structurally*
(two hardcoded call sites 0621/0651, no retry loop). Trigger: a later edit adds a third call and
no guard fires. Minimal fix: keep a call counter in `runMain` and fail with a stage code when
the count would exceed `MAX_SEQUENTIAL_CALLS`.

**OB-2 — deadline-oblivious error attribution.** 0545-0546: `wholeDeadlineExpired` is true
whenever `Date.now() >= deadline`, so a *non-timeout* transport error that happens at/after the
900 s fence is reported as `ENTIRE_CALL_CAP_EXCEEDED` instead of `TRANSPORT_FAILURE`. Trigger:
connection reset arriving at the fence. Minimal fix: attribute the cap code only to
timeout/abort-signal paths and keep `TRANSPORT_FAILURE` otherwise (or record both fields).

**OB-3 — control coverage gaps.** The response-path controls cover stream failure, success and
expired deadline (0553-0617), but not the `RESPONSE_CAP_BYTES` overflow branch (0511-0515), not
the abort/timeout classification (0542-0546), and the stage-2 validator's
`SELFCHECK_QUOTE_MISMATCH` (0310) and `FINDING_QUOTE_MISSING` (0315) branches are unexercised.
Trigger: a regression in those paths ships green. Minimal fix: add an in-memory fake-reader
overflow case and a stubbed `TimeoutError` rejection case; add the two stage-2 negative cases.

**OB-4 — omission findings may omit the `draft_quote` key instead of setting it null.**
0314-0315: a finding with a valid `stage1_candidate_id` but no `draft_quote`/`selfcheck_quote`
is accepted as an omission, whereas `STAGE2_SYSTEM` (0044) asks for `draft_quote: null`.
Trigger: the model omits the key. Minimal fix: require `draft_quote === null` when the finding
is not anchored by a draft or self-check quote.

### 3. What this PASS does not cover

- No execution of any kind in this job: no Node, no offline-controls run, no preparer, no
  manifest/hash verification of my own, no model call, no key, no HTTP, no GUI, no Git write. The
  judgement is static reading of the four frozen views only.
- The view headers carry the current SHAs of the consumer and the controls, which agree with the
  capsule's `current_pins`; I did not independently re-hash them (forbidden by the order), and I
  rely on that agreement.
- I did not read any other independent review verdict, and I did not re-audit the already-closed
  Root launcher scope.

### 4. Trust boundary — the one thing that can invalidate this PASS at runtime

The consumer's own manifest check (0368-0393) is **self-verification, not authentication**: the
manifest sits next to the consumer and is pinned by nothing, so anyone able to write that
directory could rewrite `fixed-data.json` and the manifest together and pass the internal check.
The genuine anchor must be Root-side and external: Root independently verifies the same three
pins (consumer, fixed_data, offline_controls) against a Root-held manifest, runs the consumer
under a known Node and a clean environment, and owns the explicit trust boundary. The source is
consistent with that design — it enforces structure and integrity but deliberately asserts no
self-identity — so PASS transfers to runtime **only if** Root performs that independent
verification. If Root does not, the correct runtime state is "unverified input", not PASS.

### 5. Runtime and semantic limits to carry into the decision

- Fixed-data identity (the "actual v3 data") is asserted only by the external manifest; the code
  enforces the format tag and a positive integer `version >= 1` (0075, 0092-0097) and nothing
  about the specific revision.
- Redaction covers the raw credential and its JSON-escaped rendering only (0322-0328); other
  escaping forms are not handled, and the marker is safe only because it lies outside the
  admitted printable-ASCII range.
- Response-path behaviour is proven against an in-memory fake `fetch` (0551-0620), i.e. branch
  behaviour of the same implementation, not real transport behaviour, real proxying, or real
  timeout scheduling.
- Anchoring is exact-substring only. A quote that is byte-identical but irrelevant still
  validates, and a legitimate paraphrase the model produces will be rejected. Both are Root's
  manual judgement, not something the source can decide.
- `EMPTY_REVIEW_NOT_QUALITY_PASS` means *no findings were produced*, not *the draft is sound*;
  every finding requires Root manual judgement (0351-0355). No path in the source can emit a
  quality or business PASS (0674-0685).

### 6. Bottom line

Independent source-only verdict: **PASS**, with no in-scope blocker and four non-blocking
observations (OB-1…OB-4) and the trust-boundary condition in section 4. The protocol shape
matches the required two-fresh-context, exact-envelope, exact-quote-anchored, redaction-safe,
artifact-preserving design, and the empty-findings status is explicitly not a quality PASS.
Root adjudicates whether to proceed to the actual consumer/model/Key run under an independently
verified manifest.
