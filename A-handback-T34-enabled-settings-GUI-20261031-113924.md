# A 线交回：T34 enabled SETTINGS GUI

## 结论

状态：`SOURCE_ONLY_HANDOFF_WITH_STATIC_PREFLIGHT_BLOCKER_NOT_RUN`。

批准的 11 个证据文件已落到新目录；四个脚本只应用了
`approved-inputs.json` 中的原始字面 old/new 对，五个冻结 helper 原样复制。
README 已改写为本场景边界。模板中的字节数和 SHA-256 占位符已用实际新文件
元数据填充，其余元数据保持原文字面。

本次没有任何 GUI、settings read、prepare、admit、start、stop、模型、HTTP、
Key、隐私、SystemStore 或测试结果。`allT34`、`realKey`、
`privacyConsent`、`SystemStore`、model 与 Send 均未 PASS。

## 交付位置

- 证据目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledSettingsGUI-20261031-113924`
- 已填清单：
  `D:\Lawbeach\lawbench-coord\T34EnabledSettingsGUIInput-20261031-113924\manifest.expected-template.json`
- 基线目录未写入：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CurrentUIExactGUI-20261031-102438`

证据目录只含白名单 11 个文件，没有复制 `runs`，没有写旧证据目录。

## 实际变更

- `prepare.ps1`：自身证据根改为新目录；private-native 初始 settings 改为
  enabled synthetic。
- `entry.py`：自身证据根改为新目录；初始 settings 改为 enabled synthetic。
- `start.ps1`：自身证据根改为新目录；settings 与 settingsProof 使用批准的四项
  exact enabled guards；错误文本改为批准字面；`NativeEntrySha256` 填入新
  `entry.py` 实际 SHA-256。
- `stop.ps1`：自身 runs 根改为新目录。
- `README.md`：只说明 enabled SETTINGS 投影范围，明确旧 required-unset seed
  只是初始私有 native 路由，并要求 UI 将其覆盖为
  `t34-enabled-ui-synthetic`；不主张旧前缀保持。
- `literal-inputs.json` 和五个 frozen helpers 原样复制。
- 当前 compiled client `8d9cea` / source `00cb7` 未改，未 build。

变更 5 文件的最终元数据：

| 文件 | bytes | sha256 |
|---|---:|---|
| `prepare.ps1` | 13603 | `f6a0494a7bd132377be92645ed019037b8de3cea99ccc27c8fff106b10b433bc` |
| `entry.py` | 88697 | `07585906523b39d5cd8aabf0bd51c33ef1e420e2f54a2910a0166862557bad83` |
| `start.ps1` | 96147 | `aa4d12b3134a2bac159a9c5e6190a7cb61c99cfbd88c42cd5eda366ff45e594a` |
| `stop.ps1` | 7178 | `9f431e92a1c8949c1ed716d6f59690322a36b8eb5b2353f71f28c60c08a3eb2e` |
| `README.md` | 2601 | `f2d547324ef4b3c275a7ec32195cfd7942fad6a4b26189485640814c3bf082d2` |

## 静态预检阻碍

批准规则把新的 `entry.py` 变为 88697 bytes，但 `start.ps1` 仅获准替换
`NativeEntrySha256`，没有获准修改原有的
`$NativeEntryBytes = 88651`。`start.ps1` 的既有预检会比较实际长度和该固定值，
因此按本交回的严格字面产物，fresh GUI 会在
`pinned native entry byte count mismatch` 处停止，无法进入 settings 页面。

按“no other source edit”和“不自行拍板”，本执行者没有改这个字节数，也没有
运行 GUI 猜测后续行为。ROOT 需要先裁决这一批准数据缺口。

## 实际命令

所有 shell 均为显式 native `pwsh.exe`、`login=false`；未用 Bash/cmd。

1. `Get-Content -LiteralPath '<本执行令>' -Raw`
2. `Get-Content -LiteralPath '<approved-inputs.json>' -Raw`
3. `Get-Content -LiteralPath '<manifest.expected-template.json>' -Raw`
4. `Get-ChildItem -LiteralPath '<baseline>' -Force | Select-Object Name,Length,LastWriteTime,Attributes | Format-Table`
5. `Select-String` 只读定位 `prepare.ps1` 的两个批准旧块。
6. `Select-String` 只读定位 `entry.py` 的两个批准旧块。
7. `Select-String` 只读定位 `start.ps1` 的全部批准旧块。
8. `Select-String` 只读定位 `stop.ps1` 的旧根。
9. `Get-Content -LiteralPath '<baseline>\README.md' -Raw`
10. `Test-Path` 确认新目标不存在、基线存在。
11. `Select-String` 只读确认 `$NativeEntryBytes` 的旧值和比较位置，发现上述矛盾。
12. `[IO.Directory]::CreateDirectory` 后按显式 11 名 `Copy-Item`，随后
    `Get-ChildItem -File` 核对外层文件名。
13. `prepare.ps1`：`[IO.File]::ReadAllText` / ordinal `String.Replace` 应用两个
    批准旧/新对 / `WriteAllText` UTF-8 no BOM。
14. `entry.py`：同法应用两个批准旧/新对。
15. `start.ps1`：同法应用自身根、两组 guards、错误文本和 SHA 占位符对。
16. `stop.ps1`：同法应用自身根对。
17. 对 `entry.py` 执行一次 `Get-FileHash -Algorithm SHA256`，小写化后替换
    `start.ps1` 的 `__ENTRY_SHA256__`。
18. `Get-ChildItem` 只读列出批准输入目录。
19. 一次元数据命令因 PowerShell 自身 `foreach` 管道语法写错而 exit 1；
    未读写文件，错误为 empty pipe element。
20. 修正为 `$rows=foreach (...) {...}; $rows | Format-Table`，只对
    changed-five 执行 `Get-Item` / `Get-FileHash`。
21. 对清单模板执行 `[IO.File]::ReadAllText`、十个精确占位符
    `String.Replace`、`WriteAllText`；未用 `ConvertFrom-Json` 或 JSON 序列化。
22. 最后对白名单 11 文件各执行一次 `Get-Item` / `Get-FileHash` 元数据清单。

另以 `apply_patch` 重写 README，并写本交回文件。

## 计数与未运行项

- `exec_command`：22；exit 0：21；exit 1：1（上述 PowerShell 语法错误）。
- PS parser/syntax non-zero：1；未发生 bash 拒绝记录。
- Git reads：0；Git writes：0；没有 add/commit/rebase/stash/reset/clean/
  checkout/push。
- target runtime scripts：0；Node/Python：0；parser/AST/import/check/test/
  build：0；GUI/HTTP/model/process probe：0。
- credential/DSH-home 读取：0。
- `prepare`、`admit`、`start`、`GUI`、`stop`：全部 `NOT RUN`。
- 完整 T34：`NOT PASS`；Packaging：`HOLD`。
