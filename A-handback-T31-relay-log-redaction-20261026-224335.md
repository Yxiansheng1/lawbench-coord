# A handback: T31 relay log redaction

Status: `SOURCE_AND_CHECK_DELIVERED` / `RUNTIME_NOT_RUN` / `GUI_NOT_CLAIMED` / `PACKAGING_HOLD`.

## Delivered

- Modified `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1`: added only the pure `Protect-RelayLogLine` helper and routed only the owned stdout log write through it. Existing stderr writing remains unchanged.
- Added `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\RelayLogRedaction-20261026-224335\check_log_redaction.ps1`: default AST-extracted four-case regression; `-EmitSynthetic` emits fixed synthetic stdout/stderr controls without parsing or starting work.
- Added `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\RelayLogRedaction-20261026-224335\README.md`.

## Hashes

- `start.ps1` before: `B3858153A1592E217E15BE851055BB57DE3CE277F80D667DC48356869875C6C5` (75,433 bytes, 1,554 LF).
- `start.ps1` after: `EF9D6A6B15937B5E9715092BF48A1B89F90253750852FD9F33648C9C6E3F4FE0` (75,665 bytes, 1,558 LF, no CRLF/BOM).
- `check_log_redaction.ps1`: `18B351C8CBB8FACB1325E3AAD1C3A5C84E7BA1AFE7ED2B930A24E80B83699E5A` (2,253 bytes, 66 LF).
- `README.md`: `FD9C471F38AB545086490D294D78A9471E12A8E6512759EC09872F0D4D333A96` (2,630 bytes, 41 LF).
- In-memory reverse-patch reconstruction of the edited `start.ps1` produced exactly the before byte count and SHA-256, proving no other source byte changed.

## Commands and nonzero

All `exec` calls used `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe` with `login=false`. Static reads, Git status reads, hashes, byte counts, and in-memory text comparison exited `0`.

Two diagnostics returned `1`. A static byte-statistics pipeline exited `1` because its PowerShell output collection was malformed; it performed no file/runtime action, and the corrected static command exited `0`. A targeted `git status` in `D:\Lawbeach\lawbench-coord` also returned `1` because that directory is not a Git repository; it made no Git write.

The two independent commands remain `NOT_RUN` by the author: the default four-case check and `-EmitSynthetic`. The existing `start.ps1` relay integration with root-owned synthetic launch data is also `NOT_RUN`. No AST parser, test, relay, process launch, probe, HTTP, model, GUI, build/install/prepare/start/stop, or test-log creation was run.

No Git write, staging, commit, lock, permission, credential, security, or API change was made. The source handback remains untracked dirty work.

Root should independently run the exact commands documented in the README, inspect outputs, and decide subsequent runtime admission. Whole-T31 acceptance remains unclaimed.
