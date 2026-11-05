# HAND BACK: T18 Grounding Review Bounded Edges

Status: bounded source implementation and authored tests complete.

Scope:
- Modified only `dsh-ext/agent/grounding-review.ts`.
- Modified only `dsh-ext/tests/native-grounding-review-20261102-000134.spec.ts`.
- Added only this formal hand-back in the coordination directory.
- Existing dirty worktree content was preserved.

Implementation:
- A requested integer end beyond the receipt end is no longer complete.
- Nonempty request more_names now require the first name and every additional
  name to appear exactly once in the parts list, by exact identity.
- Every read part now requires an integer start and end with end >= start >= 1;
  a null end cannot make a read part complete.
- Omitted fully-read names no longer make coverage partial. They remain counted
  against total, and are disclosed separately as an identity-metadata limitation
  with sources outside actual receipts treated as UNKNOWN.
- A fallback metadata value that still exceeds the remaining 6000-character
  aggregate now increments omittedSources before any source is pushed.
- Each review stream loop now checks cancellation, current-task state, the fixed
  16384 consumed-chunk cap, and the elapsed deadline before awaiting or processing
  another chunk. Existing abort forwarding, iterator cleanup, budget, author
  reserve, and two-review-call behavior remain in place.

Tests:
- Added four grouped test blocks.
- Covered bounded request/part ranges and exact more_names identity.
- Covered omitted fully-read names without false partial-coverage reporting.
- Covered the aggregate metadata boundary and pre-push omission.
- Covered immediate empty-chunk flooding and iterator cleanup.
- Preserved the original sixteen blocks, original assertions, and real apply path.
- Tests were authored but intentionally not run under this order.

Verification and Git:
- No tests, tsc, build, prepare, HTTP, model, parser, or custom scripts were run.
- No Git write operation was attempted, including add, commit, rebase, stash,
  reset, clean, checkout, or push.
- No sandbox, approval, ACL, lock, or writer configuration was changed.

Residual limitation:
- Compilation and runtime verification remain for the orchestrator under the
  governing validation boundary. This hand-back does not claim a test pass.
