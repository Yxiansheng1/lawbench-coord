# C Independent Final Cumulative Source Review

Verdict: **AMEND**

Scope: source-only review of the exact pinned current `index.ts`,
`grounding-review.ts`, and native-review test; against `index.before.ts`,
the public LLM stream contract, agent-loop request construction, `TaskState`,
the read contracts/examples, and the root finite result. No runtime, model,
test, build, Git write, or external call was performed by this review.

## Material findings

1. **The per-review deadline is not robustly finite against a chunk-flood
   stream.** `grounding-review.ts:819-851` has no maximum chunk count or
   wall-clock check in the consumption loop. Only accumulated text length is
   bounded. A stream that repeatedly returns immediately-resolved
   `usage`/lifecycle chunks, or zero-length `text-delta` chunks, never grows the
   text, never becomes malformed, and can starve the timer callback while the
   promise/microtask chain continues. This defeats the intended <=400 s
   deadline and cancellation liveness. Smallest correction: impose a fixed
   consumed-chunk limit and check the deadline/current-task/signal on every
   iteration; on excess, abort/close the iterator and return `unavailable`.

2. **Saved coverage is reported incomplete when only names were capped.**
   `grounding-review.ts:334-347` counts `omitted.fully_read` in `accounted`,
   but then requires `omitted.fully_read === 0`. With ten fully read materials,
   a snapshot containing eight names, `omitted.fully_read = 2`, and
   `total = 10` proves the full-read category, yet `coverage_complete` becomes
   false and `noticeFor` says saved coverage is incomplete. This conflates
   omitted names with partial/unreadable saved coverage and weakens the required
   distinction. Smallest correction: derive completeness from the actual
   category counts, keep the omitted-name count separately visible as UNKNOWN
   identity metadata, and avoid describing that case as incomplete coverage.

3. **The aggregate metadata cap can be exceeded by its own fallback marker.**
   At `grounding-review.ts:623-652`, if the bounded fallback
   `{ unavailable: true }` still does not fit `usedMetadata`, the code still
   pushes the source and records the over-cap metadata length; later sources
   repeat the same path. Thus `MAX_TOTAL_SOURCE_METADATA_CHARS` is not an actual
   aggregate bound. Smallest correction: reserve enough room for the fallback
   marker before accepting a receipt; if even that cannot fit, omit that receipt
   and increment `omittedSources` rather than exceeding the cap.

## Invariants checked as upheld

- Only a validated, successful, current-task defense-opinion first-save draft
  is snapshotted; failed, denied, stale, and superseded results are excluded.
- Reviewer state is keyed by the exact `TaskState`; replacement/end cleanup
  aborts the active stream and prevents old notices from entering a new task.
- Two contexts are isolated from author history and from each other, use the
  original route/model/session and generation settings, omit tools/purpose,
  and cannot create an automatic factual or legal PASS.
- Each reviewer reservation uses the shared `beforeModelCall` budget and skips
  when an author call or normal wrap-up semantics cannot be preserved.
- Read text, per-receipt read scope, and saved coverage are separately exposed;
  truncation, missing scope, stale/derived Wiki evidence, and omissions are
  rendered as limitations rather than proof of absence.
- Draft title and content anchors are validated independently; cross-field
  concatenations, fabricated source anchors, malformed JSON, extra output,
  tool-call deltas, non-stop finishes, and output overruns fail closed.
- The reviewed paths do not rewrite source bodies, saved draft bodies, tool
  authority, SDK/runtime guards, or the shared task lifecycle.

The root finite result establishes the author's focused unit/type run at this
source pin, but is not independent semantic evidence. This review is
SOURCE_ONLY and carries no release, legal, or security approval.
