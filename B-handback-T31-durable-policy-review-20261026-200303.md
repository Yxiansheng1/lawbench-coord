# B handback — T31 durable policy review 20261026-200303

Status: `STATIC_REVIEW_COMPLETE`

Verdict: `PASS_SOURCE_STATIC_WITH_EVIDENCE_GAPS`

No source-level silent downgrade, cross-session spill, Host-invented R, or material metadata spill was found in the compatibility-fixed candidate. This is not runtime or whole-T31 acceptance.

Source identity:

- Snapshot root: `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedQueueCompatReview-root-20261026-195942`
- All seven focused-map files matched recorded byte counts and SHA-256.
- Main candidate hashes:
  - `commands.ts` `3d2a83ca8d888849a17f104f9e8c8f6954fad2b20c630d0e7da1b2d6630a8a6c`
  - `types.ts` `221f869b04c353e77271b95aa9a5b0b15299148710a112ba89f6c08ca1ea7a51`
  - `inbox.ts` `70c07ea75ebcf18df353bbccf7c2aa3ecf6cb0d687b96e3520b675680c29f662`
  - policy test `0b702783ee6c46706a293a3aa2b64532263bc4aa9a41420230d1336d864d135c`
- Complete source map and dependency hashes: `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\DurablePolicyReview-20261026-200303\source-map.json`

Key source result:

- `commands.ts:328-376` validates the closed restriction, blocks restricted steer, creates the optional source on `request.requestId`, and rejects same-R presence mismatch without rewriting.
- `commands.ts:509-543` preserves source on queue edit and rejects restricted steer while allowing unscoped steer.
- `commands.ts:647-675` distinguishes a pure claim removal from `outcome: 'canceled'`; canceled replay is not returned as a claim.
- `types.ts:405-419` keeps old `user-rpc` unchanged and adds required-restriction `user-rpc-restricted`; runtime source remains `{ kind: 'user', rpcId }`.
- `ui-conversation service.ts:356-385` runs final `admit()` after awaits and before the same native prompt; `material-batch.ts:400-428` revalidates exact session/batch/selection and returns `next-turn-only`.

Evidence gaps:

- No direct test of a restricted R claimed, then retried with omitted or matching restriction before `user/message`.
- No direct canceled-restricted-replay identity case.
- Policy replay is a new inbox facade over the same live Session/projection context, not cold disk reload.
- No compiler/declaration-merging check, real Gateway HTTP, real authority, real model, or GUI execution.

NOT_RUN under order: Node, Python, Vitest, pytest, tsc, parser/AST, test listing/collection, build, prepare, serve, real HTTP, model, GUI.

Git: read-only. Branch `line-B`, HEAD `dc56a93be4b07dbe7a48863e3135351659817fb5`. Direct status hit inaccessible submodule metadata; `--ignore-submodules=all` showed the pre-existing dirty worktree. `lawbench-coord` is not a Git repository. No Git write, lock/ACL repair, or submodule repair was attempted.

Execution caveat: four read-only search calls were accidentally issued with `shell=bash`; all were rejected by the runtime with `E_ACCESSDENIED` and executed no command. They are recorded in the findings command log. One PowerShell hash loop and two Git status reads also exited nonzero; neither changed files or Git state. All actual commands are listed in `findings.md`.

Findings: `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\DurablePolicyReview-20261026-200303\findings.md`
