# A 线交回：T34 save guard finalizer

状态：有界源修改与对应清单元数据更新已完成；未运行目标脚本，不作 PASS 或验收通过声明。

## 修改

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314\start.ps1`
  - 第 393 行仅将 `$settings.external_llm.base_url` guard 的 URL 改为 `https://t34-settings-save.invalid/v1`。
  - 第 1056 行仅将 `$settingsProof.external_llm.base_url` guard 的 URL 改为 `https://t34-settings-save.invalid/v1`。
  - 未替换 `$literalLine`、T50 seed/lawfirm 65005、`T50_LLM_PORT` 65005，未改其他 guard 或函数。
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314\literal-inputs.json`
  - 仅更新 `handoff_source_files` 中 `start.ps1` 的 `bytes` 与 `sha256`。
  - `start.ps1` 新元数据：bytes `96169`，sha256 `8c9ae2ced964edcef0de38acc9abe933a633d836dd500c40bb29f0e06e267b5b`。
- 快照 `D:\Lawbeach\lawbench-coord\T34SaveGuardFinalizerInput-20261031-121628` 未修改。
- 同目录其余 11 个文件（含 `README.md`）未修改。

## 实际命令与结果

Shell 均为指定的原生 PowerShell，`login=false`；未使用 Bash、cmd 或其他 shell。

1. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-save-guard-finalizer-order-20261031-121628.md' -Raw` — exit 0。
2. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314\start.ps1' -Raw` — exit 0。
3. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T34SaveGuardFinalizerInput-20261031-121628\DESTliteral-inputs.json' -Raw` — exit 1；该拼合路径不存在。非零结果据实保留，后续按目标证据目录与不可变快照的目录清单定位。
4. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T34SaveGuardFinalizerInput-20261031-121628' -Force | Select-Object FullName,PSIsContainer,Length` — exit 0。
5. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T34SaveGuardFinalizerInput-20261031-121628' -Recurse -File -Filter 'DESTliteral-inputs.json' | Select-Object -ExpandProperty FullName` — exit 0，无匹配。
6. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314' -Force | Select-Object Name,PSIsContainer,Length` — exit 0。
7. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PolicyValidSaveGUI-20261031-121314\literal-inputs.json' -Raw` — exit 0。
8. `Select-String` 核对两条指定旧 guard — exit 0；命中第 393、1056 行，各一处。
9. `[IO.File]::ReadAllBytes` 读取本文件元数据 — exit 0；编辑前 96,147 bytes、无 BOM、LF。
10. 编辑 `start.ps1`：仅替换两条指定 guard。
11. `Get-Item` / `Get-FileHash` 读取本文件元数据 — exit 0；编辑后 96,169 bytes、SHA-256 `8c9ae2ced964edcef0de38acc9abe933a633d836dd500c40bb29f0e06e267b5b`。
12. 编辑目标 `literal-inputs.json`：仅更新 `start.ps1` 的 bytes/SHA。

## 计数

- target runtime invocations：0
- target runtime seconds：0
- GUI / HTTP / model / credential / process probes：0
- checks / compare / assert / tests / build / prepare / app：0
- Git reads：0
- Git writes：0
- shell nonzero results：1（上述错误 `DESTliteral-inputs.json` 路径）
- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

## 遗留与边界

- 按执行令特别禁区，未做自检、比较、断言、其他文件哈希、语法检查、测试、构建或运行。
- 本交回不声称功能验证、独立验收或 PASS；仅证明指定字节修改与对应元数据更新完成。
