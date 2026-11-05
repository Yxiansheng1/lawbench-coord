# A Lane Handback: T18 Native Grounding Closure

Date: 2026-11-02
Status: SOURCE AMEND COMPLETE; RUNTIME/TEST VALIDATION NOT RUN BY A

## Scope

Baseline was the frozen source identified by the execution capsule:
- agent/index.ts: 510449d709d63ea95b59676cfb970eba05f753b7a1bd608ea8e9c4daf273a771
- agent/grounding-review.ts: d9e2477db5bade355a3b5ed006b0bca046f9af5ad8fbb169d9267bf4d4e6cd80
- tests/native-grounding-review-20261102-000134.spec.ts: 0ab9facab69127e721fb9307ea1db1ba0ff8900d7db4dcd12175323a8e83e275

Only the following files were edited:
- D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts
- D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts
- D:\Lawbeach\lawbench-A\dsh-ext\tests\native-grounding-review-20261102-000134.spec.ts

Dirty worktree content was preserved. No stash, reset, clean, checkout, add, commit, rebase, push, or other Git write was attempted.

## Exact source fixes

1. TS2722 closure
- runOne now captures and narrows the optional stream locally before any reservation.
- A missing stream returns an honest unavailable result instead of invoking a possibly undefined property.

2. Iterator lifecycle
- Review entries track and promptly abort their owned per-call AbortController.
- runOne tracks iteratorDone separately from receipt of a terminal finish chunk.
- finally always aborts the owned controller, clears the timer and abort listener, and performs a bounded iterator.return for every iterator not confirmed done.
- This covers finish, malformed trailing output, cancellation, replacement, timeout, and stream failure paths.

3. Release and silent-stream liveness
- release(state) immediately aborts the active review, marks the entry disabled, clears source and draft references, and removes the WeakMap entry.
- The per-entry controller, task signal, and bounded deadline all reach the pending next operation.
- A silent stream settles immediately on release/replacement and cannot proceed to a second reviewer or inject notice into the replacement task.

4. Single-clock eligibility
- Every nonmutating guard uses one captured now immediately before beforeModelCall(now).
- Guards cover the exact five-minute boundary, remaining model calls, one reserved author call, wrap-up proximity, minimum reviewer deadline, and the author reserve.
- A skipped reviewer consumes no model call and does not consume the author's wrap-up notification.

5. Root stale decision
- After awaited grounding review, an aborted signal or replaced TaskState now returns a reject decision.
- The replacement TaskState is neither touched nor rewound.

6. Reviewer output caps
- Each reviewer now accepts at most 6 issues and 4 uncertainty items; the two-reviewer totals remain 12 and 8.
- Any defensive over-cap display reports an omitted count instead of silently dropping entries.
- Empty issues are marked UNVERIFIED and are not factual/legal PASS.

7. Production reachability coverage
- Added one source-only apply(ctx) test using the registered agent/pre-step waterfall, registered tools/pre-execute gate, and registered tool execute closures.
- The test drives fake ctx.llm.stream data through real read/save capture and contract validation paths.
- The original seven direct tests remain; stale replacement now also asserts decision kind reject.

8. Route and provenance fidelity
- Reviewer calls preserve the TaskState provider/model, temperature, max tokens, session identity, and original external contextWindowOverride.
- Local thinking uses the existing reasoningEffort helper; no divergent mapping or purpose/route switch was added.
- Reviewer prompts and isolated payload explicitly state that case_read_wiki is a derived, potentially stale summary and cannot alone establish absence or a definitive adverse fact.

## Added source-only checks

- TS2722 static shape is addressed by local stream capture.
- Explicit finish followed by a trailing chunk: abort and iterator.return are observed.
- Explicit finish followed by cancellation while next is pending: prompt abort, reject, and iterator.return are observed.
- Replacement during a silent stream: prompt abort, released iterator, old-task reject, and untouched replacement are observed.
- Exact five-minute boundary with controlled Date.now and real TaskState: no reviewer reservation; only author wrap-up occurs.
- Both reviewers at 6 issues and 4 uncertainty items: identifiable second-reviewer findings remain visible.
- Real apply(ctx) path: registered hooks, real executeTool contract validation, two fake reviewer calls, and external context-window parity.

## Remaining limits

- A did not run Vitest, tsc, Node, Python, parser checks, builds, setup, HTTP, model calls, or the full suite by explicit execution-order boundary.
- Compilation, test passage, runtime cleanup under the real provider iterator, and production route behavior remain unverified until Root runs the finite checks.
- Fake reviewer chunks prove wiring and validation only; they do not prove semantic adverse-fact detection, factual accuracy, legal sufficiency, or model independence.
- Empty findings remain UNVERIFIED. No stub-derived factual, legal, semantic, security, or release PASS is claimed.
- Wiki remains derived evidence and cannot replace actual material receipts.
- No Git SHA, staging, commit, evidence commit, or handback-by-Git claim is made.

## Execution-boundary note

One read-only contract inspection was PREEXEC denied because the launch shell parameter was mistakenly supplied as bash. The command did not execute and changed no state. All subsequent commands used the required native absolute pwsh path with login=false. No setup, legacy-shell switch, sandbox/approval/ACL change, writer-lock release, or lock repair followed.
