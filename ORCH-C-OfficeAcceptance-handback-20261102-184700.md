# C line handback: Office acceptance source kit

Task: `D:\Lawbeach\lawbench-coord\ORCH-C-OfficeAcceptance-source-20261102-184700.md`

Status: source preparation complete. No fixture, Office converter, parser, test, build, model, GUI, HTTP client, or self-test was executed. No acceptance result is claimed.

## Actual writes

Created under `D:\Lawbeach\lawbench-C\docs\plan\evidence\DemandClosure\OfficeAcceptance-20261102-184700\`:

| File | Bytes | SHA-256 |
|---|---:|---|
| `create-fixtures.py` | 8491 | `BDC816597FC874E8DA4A2911C8B30686767431A83207F8DDB2D106B4B20A197D` |
| `run-kit.mjs` | 6479 | `23B7E9FB769529A3BD124B5CB7F3AE39A0EA7117E23747C344F8DB3A7AAC7D3F` |
| `README.md` | 2954 | `83687B4346DBE58817755C66890C21D4E329831D62FBF40CA2BC7EBB8BEA68F3` |

Created this handback at `D:\Lawbeach\lawbench-coord\ORCH-C-OfficeAcceptance-handback-20261102-184700.md`.

The pre-existing `admission.json` was read only. The acceptance sandbox `D:\Lawbeach\_acceptance\Office-20261102-184700` was not created by this source pass.

## Source scope

- `create-fixtures.py` accepts only the exact sandbox root and revision 1 or 2, uses exclusive new-file creation, and does not delete or overwrite. Revision 1 creates the DOCX plus `input.xlsx`; revision 2 creates only its DOCX.
- The fixture is synthetic, uses Microsoft YaHei at 11 pt, A4 with explicit margins, a PAGE footer field, three data rows plus header and total row, and amounts 700/60/1500. The workbook formula is `=SUM(B2:B4)` in `B5`.
- Revision 1 has manual page breaks after the heading and before the signature. Revision 2 removes those breaks and applies paragraph `keep_with_next`.
- `run-kit.mjs` imports only the installed kit through the required absolute file URL. It uses the exact converter options, requires `backend === "native"`, calls only `render`, `renderImages`, or `recalculate`, disposes in `finally`, rejects non-fresh outputs, writes separate mode/revision JSON, preserves error code/message, and exits 1 on failure.
- `README.md` gives the exact unexecuted PowerShell commands using the installed Python 3.12 and `E:\node\node.exe`, including the mandatory revision 1 PNG observation gate before revision 2.

Only text-level inspection was performed for source verification. No syntax execution or runtime evidence exists.

## Read-only failures and worktree state

- Initial `git status --short --untracked-files=all` exited 1 with `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh': Permission denied`. The submodule, `.git`, locks, permissions, and approval state were not modified.
- An initial executable-existence PowerShell inspection used an invalid empty pipe after a `foreach` block and exited 1 with a PowerShell parser error. It was rerun read-only with a simple form and confirmed the installed Python 3.12 and `E:\node\node.exe` paths.
- `git status --short --untracked-files=all --ignore-submodules=all` succeeded read-only and showed the pre-existing dirty/untracked worktree plus the source files above. No existing dirty content was altered.
- No fixture or kit command was attempted; therefore there is no engine error, rendered pixel observation, or acceptance conclusion to report.

No Git add, commit, rebase, stash, reset, clean, checkout, or push was run.
