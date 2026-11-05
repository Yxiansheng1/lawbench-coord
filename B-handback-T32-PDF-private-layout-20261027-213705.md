# B handback: T32 PDF private-layout correction

State: `READY_FOR_ROOT_REVIEW`

Authorized source-only change completed in:

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\server.py`

Only `_assert_root_inventory` changed. The corrected entry is 79263 bytes with
SHA-256
`94fb02f734a1e08148fbcdf52dd3a477ef3eaa87043b1112b5282f25311eb16a`.
The frozen input is 78926 bytes with SHA-256
`165565761356c1100baf7b101b4a39ff1dbcf668d89321e3b1874bae9246da9f`
and matches the previously observed baseline.

The non-GUI private set remains exactly `home`, `appdata`, `system`, `temp`.
For `has_gui`, the existing `_assert_gui_layout(root)` now runs before private
inventory acceptance; only after it passes, the exact set additionally requires
literal `roaming` and `programdata`. Set equality rejects missing and extra
names, and every accepted private entry is checked as a plain non-link,
non-reparse directory. Existing six-directory GUI checks and the fixed
private-build path are unchanged.

Full formal note, exact forward/inverse diffs, branch audit, boundary record,
and 18-command audit:

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\root-private-layout-correction-20261027-213705.md`

Verification: `NOT_RUN` for all author runtime (`Python`, `Node`, import,
parser, AST, test, prepare, serve, probe, build, HTTP, GUI, trace, model,
Office). Per the execution order, only text reads, SHA-256, and read-only diffs
were performed. Runtime evidence remains for the authorized root follow-up.

Git remained strictly read-only; no staging or commit was attempted. Existing
dirty state was preserved. Initial repository `git status --short` exited 1
because the `dsh` submodule worktree rejected `chdir` with permission denied;
status with submodules ignored showed the untracked target evidence directory
and pre-existing dirty paths. No lock, ACL, permission, sandbox, or approval
change was attempted.

The intended root sequence remains: full source/all-command/inverse audit, then
only the necessary A2 fixed-identity re-pin, fresh prepare, and actual GUI.
This handback is not a runtime or acceptance claim. B stops after this file.
