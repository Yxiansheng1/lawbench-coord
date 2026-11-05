# HANDBACK — A T18 Native Grounding Review

## Status

Source implementation is complete in the authorized paths.

Runtime verification was not performed because the execution order prohibits Node, Python, parsers, TypeScript checks, Vitest, tests, builds, HTTP, model calls, GUI checks, and Git commands.

No Git write command was attempted. No staging, commit, rebase, stash, reset, clean, checkout, push, lock workaround, approval change, or permission change was performed.

## Changed files

- `dsh-ext/agent/index.ts`
- `dsh-ext/agent/grounding-review.ts`
- `dsh-ext/tests/native-grounding-review-20261102-000134.spec.ts`

All writes are confined to the three authorized code paths and this formal handback.

## Changed functions and dataflow

- `inject` now declares the public `llm` service.
- `Ctx` exposes the public `llm.stream(options)` shape.
- `LegalAgent` accepts an optional review stream dependency at the end of its constructor, preserving old callers.
- `apply` passes production `ctx.llm.stream` into `LegalAgent`.
- `preStep` accepts and forwards the real payload `signal`; it runs review preparation before the ordinary author-call reservation.
- Defense-opinion task creation enables a review entry keyed only by the exact `TaskState` in a `WeakMap`.
- `executeTool` captures material and Wiki receipts only after Core success, result-contract success, and current-state recheck.
- `executeTool` captures only the first successful defense draft, including exact saved title/content and validated coverage snapshot.
- `endTask`, task replacement, movement rejection, and sheet failure release review state.
- `GroundingReviewCoordinator` bounds source and draft storage, excludes failed/denied/stale results, and marks truncation explicitly.
- `prepare` marks the attempt before awaits, reserves each reviewer through the same `TaskState.beforeModelCall`, and starts reviews only when at least one author call and time reserve remain.
- First review performs source-to-draft adverse-fact/omission analysis; second review independently checks claimed support and casewide/only-evidence assertions.
- Both calls use one-shot public streams with exact task session identity, original route/model/temperature/max tokens/thinking, no purpose, no tools, and no durable message ids or sources.
- Calls use bounded deadlines, task-signal cancellation, current-state checks, finite output, strict JSON, and exact draft/source quote validation.
- No reviewer output is treated as factual or legal PASS; empty issues remain explicitly non-PASS.

## Intended review checks

- The production-shaped stream dependency is reachable and its request controls match the task snapshot.
- Two reviewer calls plus the following author call consume the expected model-call count.
- Budget refusal preserves an author call and existing wrap-up behavior.
- Review triggers once for the first successful draft; later drafts are not revalidated.
- Failed, denied, and late reads are excluded.
- Cancellation, replacement, stream error, non-stop finish, malformed JSON, oversized output, and fake anchors produce no usable conclusion.
- Source/draft caps produce explicit incomplete or unavailable notices.
- The saved draft is not rewritten and review does not add save/tool calls.

## Limits

- Source receipt text is capped at 6,000 characters each and 12,000 characters total.
- At most 12 source receipts are retained; omissions are explicit.
- Draft title is capped at 500 characters and draft content at 6,000 characters.
- Review output is capped at 12,000 characters, at most 12 issues, and at most 8 uncertainty entries.
- Each reviewer deadline is at most 400 seconds and always leaves a 60-second author reserve when possible.
- Review is skipped rather than consuming the author reserve when budget or time is insufficient.
- Structural quote/ID/range validation checks authenticity only; it does not establish semantic entailment.
- Missing, unread, partial, truncated, unreadable, or omitted evidence is reported as incomplete or `UNKNOWN`, never as proof of absence.
- Injected model test output validates transport and dataflow, but cannot prove real-model semantic detection quality.

## Blockers

None in the authorized source-only scope.

Runtime checks remain for the root orchestrator after this source-only handback.
