# T18 Native Grounding Cumulative Closure - Independent C Source Review

## Verdict

SOURCE_ONLY_AMEND_REQUIRED__NO_RELEASE_AUTHORITY

The cumulative implementation closes the previously identified TypeScript narrowing, lifecycle,
cancellation/replacement, shared-budget, stale-result, output-merge, external-window, and
production-apply-path causes. Three remaining source defects still violate the current receipt
completeness or exact-draft binding contract.

## Evidence examined

- Full current `index.ts`, `grounding-review.ts`, and native grounding test.
- Full current `task-state.ts`, public LLM types/runtime, AgentLoop, and the pinned read/save contracts.
- Original and closure orders, the immutable packet, the line-level cumulative `index.ts` comparison,
  and the supplied Root finite 13-pass/types-0 result.
- The Root result is offline synthetic evidence only. It does not prove model entailment, a real
  provider call, a production case, or cross-platform behavior.

## Material findings

1. P1 - Partial read receipts are not made explicit to the author.

   `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:368` treats a receipt as complete when
   its text and `parts` array were copied structurally. `partsComplete` only validates the array shape;
   it does not account for `part.read === false`, `part.has_more`, or `part.error`. Top-level
   `has_more`, `next_start`, and `next_offset` are likewise copied but omitted from the limitation test.
   This violates the invariant that partial, unread, truncated, or missing source content be explicit
   and treated as UNKNOWN. Smallest correction: persist a receipt-level read-completeness boolean from
   the validated result (including all returned parts), use it both in the isolated payload and in
   `noticeFor`, and add a finite test for a successful bounded read with `has_more` and one unread part.

2. P2 - Exact title anchors are rejected even though the title is part of the reviewed draft.

   `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:239` checks `draft_quote` only against
   `draft.content`. The payload and saved-draft snapshot also contain the exact title, but a reviewer
   quoting a title claim causes the whole valid result to become unavailable. This violates exact
   saved-title/content binding. Smallest correction: accept a draft quote found in either the title or
   content (or search a clearly separated title-plus-content value), then add one title-only anchor test.

3. P2 - Receipt metadata is not covered by the promised finite-size cap.

   `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:122` clones whole request values, while
   `materialReceipt` and material parts copy their strings without a bound. The saved draft path at
   `grounding-review.ts:460` is also copied unbounded. A valid successful receipt can therefore enlarge
   the isolated payload or author notice far beyond the source-text caps. This violates the fixed
   receipt/draft review-data boundary. Smallest correction: impose per-field and aggregate bounds on
   request, receipt, part, and path metadata; mark the receipt incomplete or the review unavailable
   when a bound is exceeded, and test overlong metadata.

## Closed causes

- The optional stream is narrowed once before use, so the former TS2722 cause is closed at source level.
- Task cancellation, replacement, deadline expiry, malformed output, and non-done completion converge
  through timer/listener cleanup, controller abort, and bounded iterator return.
- Review calls reserve through the same `TaskState.beforeModelCall` clock and preserve an author call
  and the existing wrap-up boundary.
- Stale read/save results cannot enter the current task's review state.
- Per-reviewer and merged output limits are consistent, so the second reviewer's capped findings are
  not silently discarded.
- The production apply path, external context-window override, original gates, and original direct
  assertions remain reachable and were preserved by the cumulative comparison.

## Limits

No source change was made by this reviewer. No Node, test, build, parser, model, provider, HTTP, Git,
or runtime command was used. A real model may still reason incorrectly, and exact IDs/quotes/schema do
not establish semantic entailment. This source-only verdict is not release acceptance.
