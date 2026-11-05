# B handback: T31 current scoped HTTP source pins

Status: DONE_PHYSICALLY_SAVED; runtime `NOT_RUN`; packaging `HOLD`.

## Delivered files

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py`
  - size: 92,339 bytes
  - SHA-256: `8777c7d75479dfdd62b433f5c4cc04f0cf4bed12e3da1ff14f14c00c90f45793`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\current-source-pins-20261026-235127.md`
- `D:\Lawbeach\lawbench-coord\B-handback-T31-current-scoped-http-pins-20261026-235127.md`

Only two literals in `server.py` changed:

1. `SOURCE_PINS` now points to
   `D:\Lawbeach\lawbench-coord\T31BEntrySourcePinsInput-20261026-214139\reviewed-source-pins.json`.
2. `SOURCE_PINS_SHA256` is now
   `da2763bc9e723bb31baced46c608b70dc696b57ae3f426c0be6580af4e6b906f`.

The referenced pins file hashes to the new pin. Its current-source delta is the
changed `service/lawbench/case/request_scope.py` and added
`contracts/files/request_scope_intent.schema.json`; their disk hashes match the
pins. The preparer did not rerun the consumer or any test/HTTP/build/GUI/model
operation. No runtime pass is claimed.

## Actual commands and exit status

All commands used the required
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
with `login=false`, except one explicitly listed mismatched-shell attempt.

```text
EXIT 0: Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-current-scoped-http-pins-order-20261026-235127.md'
EXIT 0: Select-String -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py' -Pattern 'SOURCE_PINS' -Context 1,1 | ForEach-Object { $_.ToString() }
EXIT 0: Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py' | Select-Object FullName,Length,LastWriteTime; Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py'
EXIT 0: Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T31BEntrySourcePinsInput-20261026-214139\reviewed-source-pins.json'
EXIT 1: git status --short --untracked-files=all
NONZERO CAUSE: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
EXIT 0: Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py' | Format-List Algorithm,Hash,Path
EXIT 0: Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T31BEntrySourcePinsInput-20261026-214139\reviewed-source-pins.json' | Format-List Algorithm,Hash,Path
EXIT 1: Select-String -LiteralPath 'D:\Lawbeach\lawbench-coord\T31BEntrySourcePinsInput-20261026-214139\reviewed-source-pins.json' -Pattern 'service/lawbench/case/request_scope.py','contracts/files/request_scope_intent.schema.json' -Context 0,2 | ForEach-Object { $_.ToString() }
NONZERO CAUSE: mismatched shell `bash`; environment returned Bash/E_ACCESSDENIED. No write or retry.
EXIT 0: Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json' | Select-Object Path,Hash; Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json' | Select-Object FullName,Length
EXIT 0: Select-String -LiteralPath 'D:\Lawbeach\lawbench-coord\T31BEntrySourcePinsInput-20261026-214139\reviewed-source-pins.json' -Pattern 'service/lawbench/case/request_scope.py','contracts/files/request_scope_intent.schema.json' -Context 0,2 | ForEach-Object { $_.ToString() }
EXIT 0: Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py' | Format-List Hash; Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json' | Format-List Hash
EXIT 0: Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py' | Select-Object FullName,Length; Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py' | Format-List Hash
EXIT 0: Select-String -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeHttpEntry-20261026-031523\server.py' -Pattern 'SOURCE_PINS =','SOURCE_PINS_SHA256 =' -Context 0,2 | ForEach-Object { $_.ToString() }
```

Tool-level write actions were `apply_patch`: first exactly the two authorized
server literals, then creation of the two authorized Markdown files.

No Git write, permission/ACL/lock/sandbox change, setup, installation, test,
runtime, parser, build, GUI, model, HTTP, packaging, commit, merge, push, or
deployment action was attempted. Existing dirty state was left in place. The
`git status` and wrong-shell failures were recorded and not repaired.
