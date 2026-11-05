# T32 Native GUI Pin-Only Delivery

From: independent line A, DeepSeek executor

To: ORCH

Status: completed exactly as scoped; prepared only, not a GUI pass.

## Authorized scope

Only the native-entry SHA-256 pin was changed from:

`458412d6b03c4c350bd40e228503e8ec8f207c13125ec22139612a9176a62151`

to:

`e041e2b27ea4b91b1cbae2be3abdc635475b830cf310ad0083b5caeb992ca86b`

The old literal was replaced exactly once in each target script and exactly once in the target README. No entry path or logic was changed.

## Files changed

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDraftGui-20261025-175925\prepare.ps1`

   - Line 10: `$NativeEntrySha256` old-to-new replacement only.

2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDraftGui-20261025-175925\start.ps1`

   - Line 135: `$NativeEntrySha256` old-to-new replacement only.

3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDraftGui-20261025-175925\README.md`

   - Line 17: sole documented native-entry SHA old-to-new replacement only.

## Baseline and preservation

Read-only pre-edit hashes matched the approved whole-file scripts:

- `prepare.ps1`: `EAD655E9FC042AC8A2BCA6F1350986ABE8A9AAE2EF0C73C448768C3422557B66`
- `start.ps1`: `F04B5A668123046A7FC01FD11E17B94160D2BF5FC68E0F33A00ED5215BE573C0`
- `stop.ps1`: `3DA87123321DFA19C51781D29B23F2FDF0C9C37F1531C77394539D2EAF092768`

`stop.ps1` was not edited and remains preserved at the approved hash.

## Reverse proof

For each of `prepare.ps1` and `start.ps1`, replacing the single new 64-character hash with the prior 64-character hash changes only that literal and must restore the exact pre-edit bytes and approved SHA listed above. In `README.md`, replacing its sole new hash with the prior hash likewise restores the pre-edit README bytes. The replacement preserves string length; no whitespace, newline, encoding, path, guard, environment, package, compiled, client, or other file change was introduced.

No post-edit readback or hash command was run, per the execution order. ORCH should compute the resulting hashes and perform the root-side full reverse proof and exact fresh GUI after terminal.

## Verification boundary

No tests, build, parser, self-test, prepare, start, stop, server, probe, GUI/runtime launch, runtime copy, API call, permission/approval/ACL operation, or Git command was performed. No Git index, commit, branch, lock, sandbox, or approval state was changed. This delivery is a bounded preparation change and does not claim a GUI pass. Packaging remains on HOLD.
