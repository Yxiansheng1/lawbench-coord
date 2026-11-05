# B/T18 Semantic Pilot Actual-Input Closure Handback

Status: `AUTHORED_NOT_RUN`

Runtime executions in this job: `0`.

## Progress

| Item | Status |
|---|---|
| What was done | Made the two authorized input-boundary changes and added their offline controls. Regenerated the source manifest once from .NET file metadata. |
| Goal | Close the two protocol-shape gaps that blocked the real fixed-data input, so the orchestrator can review and rerun the same Root probe. Product semantic behavior remains unchanged. |
| Waiting for | The orchestrator's full review and a fresh execution of the exact same `Root` actual-input probe. That signal decides whether the semantic pilot may proceed. |
| Blocked | No blocker in this authored step. The previous real `Root` probe remains the actual account: it ended with `ORIGINAL_DRAFT_NOT_TEXT`, made 0 model requests, and did not read the Key. |

## Changes

1. `selectPilotInput` now requires `draft.version` to be an exact positive safe integer. Values below 1, non-integers, and the string `"3"` are rejected. No other input field or returned input was changed.
2. `unwrapChatCompletion` now treats missing, `null`, or an empty-array `tool_calls` value as zero tool calls. A non-array value or a non-empty array is rejected as `COMPLETION_TOOL_CALLS_UNSUPPORTED`. This is completion metadata validation only; it adds no tool execution.
3. Offline controls now use integer draft version `3`, reject string version `"3"`, accept an empty `tool_calls` array, retain the existing non-empty-array rejection, and add a non-array rejection.

Only these source artifacts were edited:

- `docs/plan/evidence/T18/T18IsolatedSemanticPilot-20261101-183940/review-consumer.mjs`
- `docs/plan/evidence/T18/T18IsolatedSemanticPilot-20261101-183940/offline-controls.mjs`
- `docs/plan/evidence/T18/T18IsolatedSemanticPilot-20261101-183940/source-manifest.json`

The new handback file is the only coordination-file write.

## Evidence

The manifest was regenerated exactly once after the two source edits using .NET `File.ReadAllBytes` and `SHA256.HashData` only.

```text
consumer: bytes=26655 sha256=a4ea250ed0538381d34cfcce0c4a28af5a23212c59201eded28a49cc40e88717
offline_controls: bytes=13731 sha256=30dc22d7dc3e932d9f0d1a56c713bba0a3dead98ff3f45fa7881b055390744f9
fixed_data: bytes=17427 sha256=e386b2e000f2d9a6bb52169b0ee2a660a273996f13fd73e720ac7ff5bea0bc69
```

The fixed-data byte count and SHA-256 are unchanged from the capsule. The manifest records the same three path, size, and hash entries.

The relevant consumer functions and all new control assertions were read back for static review. No runtime result is claimed for them.

## Verification Boundary

- No Node, Python, parser, test, `--check`, build, preparer, HTTP, model, Key, probe, GUI, or runtime command was executed.
- No Git command or Git write was executed. No add, commit, rebase, stash, reset, clean, checkout, or push occurred.
- Managed sandbox isolation was retained. No setup, legacy fallback, sandbox change, approval change, ACL change, or writer-lock change was attempted.
- No unrelated dirty work was inspected, moved, or rewritten.

## Not Done

The real-input probe was not run. The offline controls were not executed. This handback therefore makes no pass claim, no model-call claim, and no acceptance claim.

Response ID: not issued by this file handback

Response log path: `D:\Lawbeach\lawbench-coord\HANDBACK-B-T18SemanticPilotActualInputClosure-20261101-185537.md`
