# C progress — T31 evidence-fix independent review

Status: HANDED_BACK_SOURCE_ONLY
Started: 2026-10-26T15:44:18.3904611+08:00
Executor: independent C line / DeepSeek
Order: `D:\Lawbeach\lawbench-coord\T31-evidence-fix-independent-review-order-20261026-154418.md`

## Boundary

- Source-only review. No product, test, parser, AST, collector, build, model, GUI, HTTP, network, or self-check was run.
- All verification outcomes are `NOT_RUN`; this review cannot establish GUI/full-card PASS.
- Git was inspected read-only. No add, commit, rebase, stash, reset, clean, checkout, push, lock repair, ACL/permission change, sandbox/approval change, or writer-lock split was attempted.
- The pre-existing C worktree is dirty and remains preserved.

## Completed

- Read the full order.
- Read the pinned manifest and independently hashed all five current snapshots. All five sizes and SHA-256 values match.
- Compared A before/current and B before/current.
- Traced A capture ownership, cancel, newer-import ordering, prepare response recheck, release, accepted/failed cleanup, and the two necessary unchanged lifecycle call sites.
- Traced B prepare/release/claim/replay/task-scope, independent intent persistence/reconstruction/backfill/conflict paths, atomic JSON writes, and the relevant schema/common definitions.
- Reviewed the supplied A race spec and B regression source without executing them.
- Confirmed the five live A/B source/test files matched their pinned snapshots at review time.
- Wrote the formal findings, source map, and handback.

## Nonzero events preserved

1. A read-only hash command exited 1 because of a PowerShell `foreach ... |` parser error. It read no files and changed nothing.
2. A read-only Git status command exited 1 because the existing submodule metadata path was inaccessible (`D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh: Permission denied`). No Git write or permission repair was attempted. Top-level status was then read with submodules ignored and optional locks disabled.
3. A read-only target-existence command exited 1 for the same PowerShell parser mistake. It read no target files and changed nothing.
4. A read-only `rg` command exited 1 because it was mistakenly invoked with shell `bash` and was denied by the runner. No source was read and no product/test command ran. Every later command used the mandated `pwsh.exe` with `login=false`.
5. One read-only manifest hash command used an incorrect `native-powershell` path spelling. It returned only the hash and changed nothing, but the call did not meet the exact-shell-path discipline and is preserved as an execution-boundary error.
6. One final source-map patch did not match its target context and wrote nothing. The patch was retried with the actual file text and is preserved as a write-attempt event.

## Source conclusion

- One source-confirmed A residual defect remains open around submission-hook disposal while a capture is in flight. The exact line, trigger, consequence, and smallest directed regression are in the formal findings.
- No source-confirmed B scope-widening defect found in the reviewed repair paths. Runtime behavior and the explicitly open post-prepare/prompt and queued-R2/steer/R1 intervals remain unverified and are not PASS evidence.

## Files

- Findings: `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\FixReview-20261026-154418\findings.md`
- Source map: `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\FixReview-20261026-154418\source-map.json`
- Formal handback: `D:\Lawbeach\lawbench-coord\C-handback-T31-evidence-fix-independent-review-20261026-154418.md`

Artifact identities: findings 10428 bytes, SHA-256 `bcb0823d56dcc53d0319972cff025b89faf4c254f2f9332acec49fcf71283b7f`; source map 17020 bytes, SHA-256 `7fa0fb35b98a862037524d4837c418e81f1f6e8fba5fa79bbbbbf47524d0524a`; handback 5788 bytes, SHA-256 `1d8a3a00fbfb1b0b2d9a17c5ec7cef3c1641d742ce074de4bc29bddc96b57efc`.

No product source or test was changed. No Git write was performed. No runtime result is claimed.
