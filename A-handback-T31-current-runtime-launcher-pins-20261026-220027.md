# A handback: T31 current runtime launcher pins

Status: NOT_RUN  
Date: 2026-10-26

Physical source and evidence are delivered. Changes are limited to the literal data allowed by the execution order:

- `prepare.ps1`: entry bytes/SHA, prepared source-pin SHA, and source count updated.
- `start.ps1`: entry bytes/SHA, prepared source-pin SHA/count, private build root, manifest bytes/SHA, and eight changed private-output pin rows updated.
- `stop.ps1` and `README.md` are unchanged.
- No Git write was attempted.

Evidence: `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\runtime-pins-20261026-220027.md`  
Evidence bytes/SHA-256: 4204 / `5b7e71229b316073e70ae5a6500a0b6d5ce16c9f7517839458e3e6090b589db9`

Final source hashes:

| File | Bytes | SHA-256 |
|---|---:|---|
| `prepare.ps1` | 17105 | `ffce1499169deff1044a61b6f0418edbdf679d7afad5118665d083d31ec9342d` |
| `start.ps1` | 75433 | `b3858153a1592e217e15be851055bb57de3ce277f80d667dc48356869875c6c5` |

Key actual static commands used:

```powershell
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\manifest.json' | Select-Object FullName,Length | Format-List
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\manifest.json' | Select-Object Path,Hash | Format-List
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1' -SimpleMatch -Pattern @('$NativeEntryBytes = 113384','10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4','7c3cf7cda3632f2bb1f05fa69bdebb5b1fa40806bf710bec4e6293d864bdb18e','$SourceCount = 346','$PreparedSourceCount = 346','private-output-20261026-073502','57729','52ebf5cfb50fbe863c4fd183744d374b537693dbdbd387f7425dabdbff0cce42') -Encoding UTF8
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1' | Select-Object @{Name='Name';Expression={Split-Path -Leaf $_.Path}},Hash | Format-Table -AutoSize
```

Observed: entry `113391` / `19862f3388f8b761fcc188dde4614e87e70172f76a9d4399a464a01668e85e4a`; manifest `58186` / `1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae`; old-marker matches `0`; all invoked static commands exited `0`; no command returned nonzero.

Parser, prepare, start, stop, build, test, probe, serve, HTTP, GUI, model, and package operations were not run. No blocker occurred.
