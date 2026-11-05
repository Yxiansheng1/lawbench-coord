# Independent T18 Grounding Final Source Review - B

Verdict: AMEND

Scope: cumulative source-only review of the current defense-opinion first-save review path. I reviewed the three current changed files, the original `index.before.ts`, the original order, the relevant public LLM interfaces and agent-loop request path, TaskState, the read contracts/examples, and the supplied Root finite result. Git was not modified, tests were not rerun, and no source or coordination artifact was changed except this formal.

Evidence reused:

- Root finite result reports 33 focused tests passed and TypeScript passed, with no source changes during that run: `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T18-native-grounding-green-unit-current.json`.
- Current changed-file pins are the packet pins: `index.ts` 62098 bytes / `6d8d7704...`, `grounding-review.ts` 35554 bytes / `052b9609...`, and the new test 39741 bytes / `441890fe...`.
- Public `GenerateOptions` accepts identity-free user inputs and `LlmRuntime.stream(options)` dispatches by the supplied provider/model. The current apply path reaches `ctx.llm.stream`, passes the real session identity, omits tools/purpose, and leaves the one-shot options unfrozen.

Findings:

1. Material: a bounded material request can be marked complete even when the returned receipt ends before the requested end.

   Location: `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:315-331`, especially the checks at lines 324-325.

   Cause: `materialReadComplete` checks that the requested start is at most 1 and that `has_more`, `next_start`, and `next_offset` are clear, but it never compares the requested `request.end` with `receipt.end`. For example, a request for units 1-10 can receive a valid contract-shaped receipt for unit 1 only and still produce `read_complete: true`. The next author then receives neither the fragment limitation nor an unknown-scope limitation.

   Smallest correction: when `request.end` is an integer, require the cleared top-level receipt's `end` to cover that requested end; otherwise return `readComplete: false` for a demonstrably bounded fragment or `null` when range completeness cannot be established. Apply the corresponding requested-range check to the first returned part when `parts` is present.

2. Material: `more_names` can lose appended-material evidence without being marked incomplete.

   Location: `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:266-271`, with the vacuous `parts.every(...)` path at lines 326-331.

   Cause: absent `parts` is currently treated as structurally complete regardless of the request. A contract-shaped result may omit the optional `parts` field. When the request contains `more_names`, the appended names therefore have no per-material receipt, yet completeness can still be computed from only the top-level first receipt and marked true.

   Smallest correction: pass the request into the parts/completeness check. If `more_names` is nonempty, require `parts` to contain the requested first name plus each appended name exactly once and require each corresponding part to be a clean read; absent or mismatched `parts` must set `readComplete` to `false` or `null` and remain explicitly UNKNOWN.

3. Material: a part marked `read: true` can have a null `end` and still support a complete receipt.

   Location: `D:\Lawbeach\lawbench-A\dsh-ext\agent\grounding-review.ts:291-300` and `:326-331`.

   Cause: the part mapper preserves nullable ranges, while `materialReadComplete` requires only `read`, `start === 1`, cleared continuation, and a null error. It does not require a successfully read part to have an integer `end >= start`. The current contract permits null fields structurally, so schema validation alone does not close this range invariant.

   Smallest correction: for every part with `read === true`, require a non-null integer `end` at least equal to its start before treating the part as complete; otherwise mark the overall read scope incomplete or unavailable.

Accepted current invariants:

- The review is task-scoped through a WeakMap keyed by the exact `TaskState`; it is enabled only for `defense-opinion` and is attempted once after the first successful saved draft.
- Successfully validated current-task material/wiki results, frozen first-save title/content, and bounded saved coverage are separated in the payload. Omitted, truncated, metadata-limited, and unavailable data remain explicit limitations rather than pass evidence.
- The two reviewer requests use distinct system prompts, fresh one-message user contexts, the task route/model/temperature/max-token/thinking settings, the real session ID, and no tools or purpose. The notice does not claim factual or legal PASS.
- Reviewer accounting uses the same `TaskState.beforeModelCall`, reserves an author call, avoids reviewer-generated wrap-up state, and is bounded by the task signal, remaining time, and a timer no greater than 400 seconds.
- Cancellation, replacement, stream failure, malformed output, false anchors, and non-stop termination produce bounded shutdown or an honest unavailable result. Draft saving is not blocked or rewritten.

Conclusion:

The lifecycle, injection, independence, disclosure, and no-auto-PASS structure are source-level acceptable. The receipt-scope validator is not yet complete: it can label a bounded or partially evidenced read as complete in three contract-shaped cases above. These are direct fixes inside the existing completeness logic, not a new framework or policy expansion.

This is not a semantic, legal, security, release, or production-readiness PASS. Root's 33 green tests remain useful evidence for the unchanged surrounding behavior, but the new range/multi-name cases need targeted tests after correction.
