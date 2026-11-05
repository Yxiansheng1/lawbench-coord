# Independent C Review: T18 Native Grounding

**Verdict: AMEND**

Scope: source-only review of the cumulative Native grounding target. I did not run source, tests, builds, model calls, Git, or other tools outside the permitted packet. Tests were not executed. Fake reviewer JSON proves only control-flow plumbing, not semantic detection. This is not a factual, legal, semantic, security, runtime, or release PASS.

## Changed-list and contract checks

The packet declares exactly three changed files: `agent/index.ts`, new `agent/grounding-review.ts`, and new `tests/native-grounding-review-20261102-000134.spec.ts`. Comparing the cumulative `index.ts` with its supplied before snapshot found only the declared grounding ingress/injection, WeakMap lifecycle, read/draft capture, prepare/notice, signal plumbing, and `ctx.llm` wiring. The current `task-state.ts` matches its supplied before snapshot. No Git or directory discovery was used.

The public shape is compatible. `types.ts:486-523` explicitly permits identity-free one-shot user inputs, system text, real session identity, cancellation, and no response purpose. `llm/index.ts:1171-1184` exposes `LlmRuntime.stream(options)` through the public `llm/stream` waterfall. `core/agent-loop/src/agent.ts:267-285` and `399-408` append admitted `pre-step` messages as durable user events rather than replacing history.

## Blocking findings

### High - Introduced: terminal finish can bypass iterator cleanup

Current invariant: **"clean timers/iterator all outcomes, no background call."**

Evidence: when a terminal `finish` chunk is observed, `grounding-review.ts:606-609` sets `finished = true`. The next loop iteration can break at `grounding-review.ts:587` because cancellation, replacement, or the deadline fired before another `iterator.next()` is made. The cleanup at `grounding-review.ts:617-622` calls `iterator.return()` only when `!finished`. Thus a finish chunk, which is not the same fact as iterator completion, suppresses `return()` while the underlying async iterator is still suspended at its terminal yield. A malformed chunk after finish has the same path.

Minimal correction: track iterator completion separately when `next.done === true`, and in `finally` call a bounded `iterator.return()` for every iterator that has not reached `done`, regardless of whether a finish chunk was observed. Add a cancellation/replacement case where replacement occurs immediately after the finish chunk and assert prompt iterator closure.

Impact: leaked stream cleanup and potentially continuing provider work after the task is gone.

### Medium - Introduced: end/replacement deletes state but does not cancel an in-flight review

Current invariant: **"Release task-local data on end/replacement."**

Evidence: `GroundingReviewCoordinator.release()` only calls `this.states.delete(state)` at `grounding-review.ts:386-388`. An active `prepare()` already holds the entry and draft/source data by object reference. Its `runOne()` controller at `grounding-review.ts:555-565` listens only to the task signal and its timer; it does not race the `isCurrent` predicate. If the stream is silent during replacement, `grounding-review.ts:587-588` can wait until the 400-second deadline before observing `!isCurrent()`. No wrong notice is injected, and `index.ts:529-537` rechecks current state before injection, but task data and provider work are not released promptly.

Minimal correction: keep a per-entry active `AbortController`; abort it and clear entry data in `release()`/`clear()`, and forward that signal into `runOne()` together with the task signal and timer. Add a test that replaces the task while the reviewer stream is pending, then proves prompt abort/cleanup and no old-task notice.

Impact: replacement can retain old task-local material for hundreds of seconds and delay liveness even though cross-task injection is prevented.

### Medium - Introduced: a reviewer reservation can consume the author's wrap-up notice

Current invariant: **"skip wrap-up/insufficient reserve, preserve all budget/wrap-up semantics."**

Evidence: `grounding-review.ts:545-549` calls mutating `state.beforeModelCall(now)` before checking `reservation.wrapUp`; the deadline check happens afterward at lines 551-553. `canRunBoth`/`canRunReviewer` check the five-minute boundary at lines 514-533 using earlier clock reads. If time crosses that boundary between the guard and `runOne`, or another precondition changes, `beforeModelCall` increments `modelCalls`, sets `wrapUpSent` and `wrapUpNotice`, and returns `wrapUp: true`. `runOne` then discards that result without sending a reviewer. The eventual author call at `index.ts:537` no longer receives `d.wrapUp`, so the final five-minute warning is silently lost while a model-call slot was consumed.

Minimal correction: evaluate every non-mutating reservation precondition, including the wrap-up boundary and minimum deadline, with one captured `now` immediately before mutating `beforeModelCall`, and skip without reserving when it would return `wrapUp`. Preserve any generated wrap-up for the author. Add a boundary test at exactly `(budget.minutes - 5) * 60_000`.

Impact: review accounting can alter wrap-up behavior and spend a call without an actual request.

## Bounded impact / liveness map

- Entry and production reachability: defense-only enablement at `index.ts:495`; actual `ctx.llm.stream` wiring at `index.ts:867` and `896`; injection declared at `index.ts:18`. Source reachability is present, though the new test exercises `LegalAgent` directly rather than invoking `apply()`.
- Read provenance: capture occurs only after Core success and result-contract validation at `index.ts:753-765`, inside an equality check against the exact current `TaskState`. Failed, denied, and stale reads are excluded.
- Draft provenance: `index.ts:770-775` captures only current-task successful saves; `grounding-review.ts:431-447` keeps the first draft, exact supplied title/content, bounded size, and returned coverage. Later saves are ignored.
- Isolation: reviewers are two direct one-shot calls with separate system contexts, no author history, no purpose, no tools, the same provider/model/session/temperature/max-token/thinking snapshot, and real `TaskState.beforeModelCall` accounting (`grounding-review.ts:478-501`, `571-584`).
- Output safety: exact quote/ID/structure validation prevents malformed or fabricated witnesses from becoming a notice, but valid anchors do not establish entailment. Empty findings and the notice text explicitly avoid factual/legal PASS (`grounding-review.ts:323-364`).
- Existing controls: TaskState source is unchanged; tool accounting, route selection, call budgets, and the separate author reservation remain in the existing paths. No schema/contract field was added.

## Runtime work remains Root-owned

Source inspection does not admit proof that the real public LLM route returns semantically useful skepticism, that external/local model behavior is independent in practice, or that cancellation/deadline cleanup is correct under the production iterator. After the three fixes above, Root should run the finite adversarial stream cases covering replacement during a silent stream, cancellation after a finish chunk, exact five-minute/call-boundary reservations, and the actual `apply()` plus `ctx.llm.stream` production wiring. Those are targeted runtime checks, not a request for a new release-wide proof program.
