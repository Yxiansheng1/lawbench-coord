# B Review: T18 Native Grounding Review

Scope: source-only review of the cumulative target supplied in the shared packet.
No tests, runtime, model, HTTP, build, Git write, or external functionality was executed.

## Findings

### BLOCKING / INTRODUCED: iterator cleanup is skipped after a terminal finish

Evidence: `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:606`
sets `finished = true` on a `finish` chunk. The next loop checks any following
chunk and marks it malformed (`:591-593`), but cleanup is conditional:
`if (!finished && iterator?.return) { ... }` (`:620-622`).

Violated current invariant: the implementation order requires
"clean timers/iterator all outcomes, no background call." A noncompliant or
racing stream that emits `finish` followed by a trailing text/tool/unknown chunk,
or that remains open after `finish`, takes the malformed/timeout path while
leaving the iterator open. A compliant stream that closes immediately after
`finish` is unaffected.

Minimal correction: track `iteratorDone` separately from `finished`, set it on
`next.done`, and always call the bounded `iterator.return()` in `finally` when
`iteratorDone` is false. Add a synthetic test with `finish` followed by a
trailing chunk that asserts `return()` is called and no usable notice is emitted.

### LOW / INTRODUCED TEST GAP: production `ctx.llm.stream` wiring is not exercised

Evidence: the test asserts only `expect(inject).toContain('llm')`
(`:271`) and then injects the fake stream directly through the final
`LegalAgent` constructor argument (`:151-165`). The production branch
`ctx.llm ? (options) => ctx.llm!.stream(options) : undefined`
(`index.ts:896`) is never driven by a fake plugin context.

Violated current requirement: tests must make the "actual production stream
injection reachable." The current assertions prove the constructor path and the
declared dependency, not the `apply(ctx)` wiring that production uses.

Minimal correction: add one focused `apply`-level test with synthetic `ctx`,
where a fake `ctx.llm.stream` records the request and returns fake chunks during
one configured review. Do not duplicate the full integration matrix.

## Bounded Impact / Liveness

| Area | Source evidence | Bounded result |
|---|---|---|
| Defense-only first-save trigger | `index.ts:495,774`; `grounding-review.ts:425-457` | Enabled only for `defense-opinion`; first validated successful draft is captured; later saves are not re-reviewed and the notice says so. |
| Public one-shot calls | `index.ts:867,896`; `types.ts:486-552`; `agent.ts:663-670` | Identity-free user input, real session id, no purpose/tools, unfrozen options, and the snapshotted provider/model/temperature/max-token/thinking controls are represented. |
| Isolation and replacement | `grounding-review.ts:369-388`; `index.ts:531-536,760-776,786-789` | WeakMap key is the exact `TaskState`; stale reads/saves and replacement notices are rejected by current-state checks; release occurs on task end/rejection paths reviewed. |
| Budget and cancellation | `grounding-review.ts:514-565`; `index.ts:529-558` | At most two reviewer reservations occur before the author reservation; one author call is retained; task signal, deadline, and 400-second cap are combined; no automatic retry. |
| Evidence fidelity | `grounding-review.ts:91-288,390-447`; pinned read/save contracts | Receipts are copied after core success and result validation, source/draft text is bounded, missing/truncated data is UNKNOWN, and no draft rewrite or extra save is issued. |
| Output authenticity | `grounding-review.ts:189-365` | Strict keys/types/IDs and exact substring anchors fail closed; empty issues are explicitly not factual/legal PASS. Source schema success is not treated as semantic entailment. |
| Liveness limit | `grounding-review.ts:562-630` | Normal cancellation and timeout settle within the per-call deadline and bounded iterator return, except the post-finish cleanup defect above. |

`task-state.ts` text-compared identically with the before snapshot. The packet
identifies exactly the three changed files; no SDK, TaskState, Host, contract,
schema, or library modification is claimed.

## Source-Only Runtime Boundary

The source shows the intended dataflow but does not prove that the real provider
returns useful model prose, that the two prompts detect adverse facts or
semantic entailment, or that fake JSON exercises model semantics. Root still
must run the admitted finite checks with the actual public `ctx.llm.stream`
wiring and real route controls, verify malformed/cancelled stream cleanup and
budget counters, and treat runtime/semantic/security/release status separately.

## Verdict

AMEND. The cumulative design is directionally sound and preserves the reviewed
contracts, but the post-finish iterator cleanup must be corrected before this
source-only target is accepted. No runtime, semantic, security, or release PASS
is asserted.
