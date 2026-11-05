# Independent T18 Grounding Edge Cumulative Closure Review - B

Verdict: AMEND

Scope: source-only closure review of the current cumulative delta after the 37-pass focused unit run and zero TypeScript errors. I reused the prior complete cumulative review, audited every supplied delta hunk, the current completeness/metadata/stream helper ranges, and the supplied Root result. Old public SDK, TaskState, index, lifecycle, and unchanged tests were not reread or reopened. Git was not written; no test, parser, build, runtime, network, model, or native generation was invoked.

Evidence boundaries:

- Root reports 37 passed, 0 failed, 0 pending, and `source_changes: []`: 20 new-module and 17 original-neighbor tests, not an additive count over the older 33-test run.
- The focused suite and TypeScript exit 0 prove the bounded fixture suite and types. They do not prove native generation, backend producer behavior, semantic source quality, security, legality, or release readiness.
- The positive bounded-read fixture contains the defect below. Its green assertion is not evidence that the intended range invariant closed.

Closure audit:

1. Multi-name per-part evidence: CLOSED for nonempty `more_names`. Each requested and appended name must occur exactly once; missing or mismatched parts remain UNKNOWN.
2. Null part end: CLOSED. Accepted parts require integer `start === 1`, integer `end >= start`, no continuation, and no error.
3. First-part start restoration: CLOSED. A shifted per-part start yields `read_complete: false`.
4. Omitted fully-read identities: CLOSED with an explicit limitation. They count toward the coverage total and produce a separate "identity metadata limited / outside receipts remains UNKNOWN" notice.
5. Metadata and omission accounting: CLOSED. Stored request/receipt/parts metadata is bounded to the 6,000-character aggregate; a fallback that cannot fit is omitted before insertion with an exact omission count.
6. Stream bound and cleanup: CLOSED. Empty-text floods stop at 16,384 consumed chunks, the deadline is checked in-loop, cancellation is observed, and finally performs abort plus bounded iterator cleanup.

Material findings:

1. A bounded request can still be marked fully read when its per-material part ends before the requested end.

   Location: `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:324` and `:347-357`.

   Cause: `request.end` is compared only with top-level `receipt.end`. Each accepted part is checked for `start === 1` and `end >= start`, but never `part.end >= request.end`. A request for 1-2, a top-level receipt ending at 2, and a main part 1-1 therefore return `true`. This is the bounded-fragment ambiguity the prior finding required part-level checking to close. The new positive fixture (`request.end: 2`, both parts ending at 1) currently codifies that false complete result.

   Smallest correction: when `request.end` is an integer and parts exist, require the corresponding main-material part to end at or beyond it; otherwise return `false` for a demonstrably short fragment or `null` when identity cannot establish the requested scope. Make the positive fixture covering and add the short-part negative.

2. A single-name response can use an unrelated part identity and still pass.

   Location: `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:333-345`.

   Cause: identity cardinality is enforced only when `more_names` is nonempty. For a normal single-material request, a clean part for any other name can satisfy the final `parts.every(...)` check; the top-level receipt name is also not compared. Contract-shaped scalar fields can therefore mask mixed identity.

   Smallest correction: whenever parts exist, require the requested main material name exactly once before applying the nonempty `more_names` set check. A mismatch must remain UNKNOWN/false rather than complete.

Accepted unchanged portions:

- Metadata fallback keeps an explicit limitation when it fits; only the exact receipt that cannot fit is omitted.
- Coverage omission is reported separately from range incompleteness and never converts omitted identities into known or passed sources.
- Clock, cancellation, chunk-cap, malformed-stream, and bounded iterator-return paths remain conservative and fail closed.
- Changing the aggregate fixture from 400 to 390 repeated characters does not itself weaken an assertion, but the positive bounded-read fixture must accompany the implementation correction.

Conclusion:

Four closure areas are source-acceptable and the multi-name/null/start checks are materially improved, but cumulative closure is not reached: requested-end evidence can still conflict with the actual main part, and single-name part identity remains unconstrained. These are small corrections inside the existing completeness helper and focused fixtures, not a new framework or policy expansion.
