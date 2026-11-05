# A 线交回：T34 enabled-route 原生设置写入源码

## 结论

状态：`SOURCE_ONLY_DELIVERED / AUTHOR_RUNTIME_0 / NOT_TESTED`

已按 `A-T34-enabled-route-write-order-20261031-111605.md` 新增一个有界
source-only 消费者，只做一次原生
`ctx.settings.mutate('llm-pi-ai', [set providers.external], undefined)`，
并检查 `lawfirm` 保留。没有运行 Node、Python、测试、类型检查、构建、GUI、
应用、HTTP、模型、网络或凭据访问。没有执行任何 Git 写入。

交回形式是本文件；Git 提交不在本运行器授权内。

## 交付位置

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605`

本目录此前不存在；本次只新建了该目录及以下三个文件。没有修改任何既有源码、
旧证据或工单文件。

## 精确改动

### `native-enabled.mjs`

完整新增文件，关键区间：

- 1-50：切片声明、原生 import、UI 投影对应的 `EXPECTED_EXTERNAL`。
- 66-91：只接受一个全新的绝对 `--root`，已移除全部 `--port` 和 stream 参数。
- 93-198：有界错误、标记计数、物理 patch 字节/SHA、plain-object 检查和原有
  45 + 5 + 2 pin 校验。
- 203-251：只含布尔值、安全计数、描述符/修订数字和 patch 元数据的 result 骨架。
- 260-338：`initProfile`、原始 pinned bundle、初始 patch 仅含合成
  `providers.lawfirm`；保留 T50 内存凭据依赖但不设置/读取/删除凭据。
- 340-388：原始 canonical CLI `runProfile`、私有 root/install anchor/无 home
  overlay/根 Include 检查，以及原始 Settings/ConfigEditor 构造器身份比较。
- 390-412：唯一 live `llm-pi-ai` 描述符检查、写入前 `lawfirm` 仅驻留内存的
  `user`/`value` 快照、写入前物理 patch 元数据。
- 414-426：唯一一次单 op 原生 `settings.mutate`；其兑现值必须为 `void`。
- 428-448：写入后同一 live namespace 检查；UI 写入投影对
  `user.providers.external` 做 `assert.deepStrictEqual`，`user` 与 schema
  解析后的 `value` 两层 `lawfirm` 都保持不变；物理 patch 四个标记各恰一次。
- 449-481：失败有界记录、无条件尝试一次原始
  `shutdown.shutdown(0)`、关闭或断言失败保持非零、单次 `wx` result 写入，
  以及 64 KiB 上限。

设计说明：`describe().value` 是 schema 解析后的 live 视图，会给 provider
补入 schema 默认字段；当前 UI 写入投影的逐字段对象对应
`describe().user.providers.external`。因此精确 `deepStrictEqual` 放在
`user` 层，同时对解析后的 `value` 层做 provider 集合与 `lawfirm` 不变检查。
这避免把 schema 默认字段冒充实测写入值。

### `literal-inputs.json`

使用 PowerShell `Copy-Item` 从以下批准基线机械复制，非手抄：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\literal-inputs.json`

### `README.md`

完整新增说明，明确：

- 切片只是 enabled-route 原生 SET-and-preserve；
- 不宣称 GUI、SystemStore、Agent、模型、完整 T34 或 release PASS；
- 不推断中间写盘次数，不宣称完整重载/重启，不在结束后 unset；
- Root 运行需提供全新绝对 `--root`，并使用冻结 resolver 与 deny-network guard。

## 元数据

以下为本运行唯一一次成功的 `Get-Item` + `Get-FileHash` 盘点结果：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-enabled.mjs` | 16474 | `10C3F7EA642B0AC12E6424624866B68FE8FE9B0A6B8CEDB2B5406FAF2FE0E2FB` |
| `literal-inputs.json` | 25377 | `4E468424F8D316B0000F3C035C810B5399A195CC97D5B51A80CD6FB9A944664C` |
| `README.md` | 3706 | `5B7EABEC59A14F905970DDED043AC8C2DDE6F1AFA89C58F445169986F840E6F1` |

本交回件自身未做第二次元数据盘点，也不冒充上述三个文件的哈希。

## 实际命令

以下为本次实际执行的 shell 命令，按发生顺序归并。所有读命令的正式 shell 均为：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

`login=false`。

1. 读取正式令：

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-enabled-route-write-order-20261031-111605.md' -Raw`

2. 读批准基线与状态：

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-client.mjs' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\literal-inputs.json' -Raw`

   `git status --short --branch`，失败，见下节。

   `rg --files -g 'settings.tsx' -g '*settings*.ts' -g '*settings*.tsx' -g '*schema*' -g '*config*' src app packages 2>$null`，退出 1、无输出。

3. 定位并读取设置源码：

   `rg --files dsh | rg '(^|[\\/])settings\.tsx$|[\\/]settings[\\/](src|lib)[\\/]|[\\/]config-editor[\\/](src|lib)[\\/]|schema'`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\lib\index.js' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\boot\config-editor\lib\index.js' -Raw`

   `rg --files dsh | rg 'settings([^\\/]*)\.tsx$|external.*\.tsx$|Settings.*\.tsx$'`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\src\index.ts' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\src\schema.ts' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\src\types.ts' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\ui\settings.tsx' | Select-Object -Skip 155 -First 73`

   `rg --files dsh/packages/llm/llm-pi-ai/src dsh/packages/llm/llm-pi-ai | rg '(schema|config|types|index)\.ts$'`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\boot\config-editor\src\index.ts' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\src\config.ts' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\src\index.ts' | Select-Object -First 260`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\ui\settings.tsx' | Select-Object -First 155`

4. 读取 profile/pin 必要源码：

   `rg -n "function initProfile|export .*initProfile|initProfile" dsh/packages/boot/app-boot/src`

   `rg -n "profile.*patch|include" dsh/packages/boot/app-boot/src/profile.ts dsh/packages/boot/app-boot/src 2>$null`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\README.md' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\boot\app-boot\src\profile.ts' | Select-Object -Skip 225 -First 90`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\boot\app-boot\src\profile.ts' | Select-Object -Skip 680 -First 70`

   `rg -n "PROFILE_PATCH_TEMPLATE|PROFILE_PATCH_FILENAME" dsh/packages/boot/app-boot/src/profile.ts`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\boot\app-boot\src\profile.ts' | Select-Object -Skip 210 -First 35`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\boot\app-boot\src\profile-context.ts' -Raw`

5. 复用既有证据并核对语义：

   `rg -n "t34-enabled|providers[^\n]*external|settings\.mutate|external_matches|lawfirm" docs/plan/evidence/T34 docs/plan/evidence/T31 docs/plan/evidence/T38 2>$null`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\RequiredPeerContext-20261031-013407\dependency-context.mjs' | Select-Object -Skip 1180 -First 390`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderLayers-20261030-105817\provider-composition.spec.ts' | Select-Object -Skip 60 -First 90`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderLayers-20261030-105817\provider-composition.spec.ts' | Select-Object -First 75`

   `rg --files 'docs/plan/evidence/T34/RequiredPeerContext-20261031-013407' | rg '(result|node-result|README|literal-inputs)'`

   `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\RequiredPeerContext-20261031-013407' -File -Recurse | Select-Object -ExpandProperty FullName`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\RequiredPeerContext-20261031-013407\runs\run-20261031-014039\compiled-boundary-result.json' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\RequiredPeerContext-20261031-013407\runs\run-20261031-014039\dsh-home\profiles\compiled-boundary\cordis.patch.yml' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\RequiredPeerContext-20261031-013407\dependency-context.mjs' | Select-Object -Skip 880 -First 75`

   `rg -n "createSyntheticProfile|syntheticProvider|SYNTHETIC_EXTERNAL_MODEL|SYNTHETIC_LAWFIRM_MODEL" 'docs/plan/evidence/T34/RequiredPeerContext-20261031-013407/dependency-context.mjs'`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionBindingFix-20261030-065353\runs\T34-private-projection-observer-20261030-070426\gui\state\projection-observer.json' -Raw`

   `rg -l --glob '*.json' '"defaultContextWindow"' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34' | Select-Object -First 20`，退出 1、无输出。

   `rg -n "Schema.extend\('object'|function resolveObject|Schema.extend\('dict'" 'D:\Lawbeach\lawbench-A\dsh\vendor\schemastery\src\index.ts'`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\vendor\schemastery\src\index.ts' | Select-Object -Skip 765 -First 105`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\tests\t34-provider-descriptor-state-20261030-115132.spec.ts' | Select-Object -Skip 60 -First 115`

   `rg -n "descriptor\.user|user:" dsh/packages/settings/settings/tests -g '*.ts' | Select-Object -First 120`，退出 1、无匹配。

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\tests\configuration-fixture.ts' -Raw`

6. 新建证据目录与逐字节复制输入：

   `$dest = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605'; if (Test-Path -LiteralPath $dest) { throw 'destination already exists' }; New-Item -ItemType Directory -Path $dest | Out-Null; Copy-Item -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\literal-inputs.json' -Destination (Join-Path $dest 'literal-inputs.json')`

7. 文件内容通过 `apply_patch` 新建：

   - `native-enabled.mjs`
   - `README.md`

   后续只用 `apply_patch` 调整本切片文件，没有 shell 写入既有源码。

8. 静态自审：

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605\native-enabled.mjs' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605\README.md' -Raw`

   `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\vendor\loader\src\config\tree.ts' | Select-Object -First 50`

   `rg -n "assert\.deepEqual|assert\.deepStrictEqual|console\.|stdout|stderr|credentials\.(set|resolve|delete)|llm\.stream|fetch\(|setTimeout|setInterval|worker|child_process" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605\native-enabled.mjs'`

   `rg -n "ctx\.settings\.mutate|operation_count|initialResolvedLawfirm|finalValueProviders|expectedRevision|undefined," 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605\native-enabled.mjs'`

   `rg -n "const EXPECTED_EXTERNAL|function parseArgs|function verifyPins|const result =|profilePatch|runProfile\(|profileContext =|module_identity|initialDescriptor|initialLawfirm|await ctx\.settings\.mutate|finalDescriptor|after\.patch|finally|writeFileSync\(join\(args\.root" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605\native-enabled.mjs'`

   `rg -n -- "--port|ctx\.llm|fetch\(|http\.request|https\.request|credentials\.(set|resolve)|setTimeout|setInterval|Worker|child_process|AbortSignal|stream\(" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledRouteWrite-20261031-111605\native-enabled.mjs'`，初次因 PowerShell 引号转义报 `ParserError`，随后用正确引法重跑，退出 1、无匹配。

   `Get-Content -LiteralPath '...\README.md' | Measure-Object -Line`

   `Get-Content -LiteralPath '...\native-enabled.mjs' | Measure-Object -Line`

   `Get-Content -LiteralPath '...\native-enabled.mjs' | Select-Object -Skip 380 -First 105`

9. 唯一元数据盘点：

   `$ownedPaths = @('...\native-enabled.mjs','...\literal-inputs.json','...\README.md'); $ownedFiles = Get-Item -LiteralPath $ownedPaths; $ownedHashes = Get-FileHash -Algorithm SHA256 -LiteralPath $ownedPaths; $inventory = for (...) { ... }; $inventory | Format-List`

   第一次尝试在 PowerShell 解析阶段失败，未执行 `Get-Item`/`Get-FileHash`；随后同一目标的修正命令成功，结果见上表。未再做第四次盘点。

## 失败、阻碍与偏离

1. `git status --short --branch` 失败：

   `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`

   Git 只读状态因此未能完整确认。按令没有修权限、改 ACL、拆锁、扩权，
   也没有尝试任何 Git 写入。

2. 四次 `rg` 误用了 `bash`：

   - `rg --files 'docs/plan/evidence/T34/RequiredPeerContext-20261031-013407' | rg '(result|node-result|README|literal-inputs)'`
   - `rg -n "const SYNTHETIC_|function syntheticProvider|function createSyntheticProfile" '...dependency-context.mjs'`
   - `rg -n "assert\.deepEqual|...|child_process" '...native-enabled.mjs'`
   - `rg -n -- "--port|ctx\.llm|...|stream\(" '...native-enabled.mjs'`

   四次都被系统以 `Bash/E_ACCESSDENIED` 拒绝，未执行任何文件操作。后续
   同类只读命令均改用指定原生 PowerShell。该偏离已明确记录，不冒充合规
   全绿。

3. 两次只读源码搜索的 shell 元数据误写为旧的
   `dependencies\native-powershell\pwsh.exe` 路径，而不是本令指定的
   `dependencies\native\powershell\pwsh.exe`。命令仅读取源码并成功返回；
   没有 Bash 执行、没有写操作。此后统一使用指定路径。

4. 首次 `Get-Item` + `Get-FileHash` 组合命令有 PowerShell 管道语法错误，
   在执行元数据命令前失败；修正后只成功盘点一次。

5. 由于授权禁止作者运行 Node/JSON parse/byte assertions，本次没有独立
   运行哈希相等检查、JSON 解析、语法检查、类型检查或测试。`Copy-Item`
   只做原字节复制；上表只是目标文件的元数据，不附加未经执行的验证宣称。

## 验证状态

- 作者运行 Node：0
- 作者运行测试：0
- 作者运行类型检查/构建：0
- 作者运行 GUI/应用/HTTP/模型：0
- 作者读取真实 credential/env/Keyring/DPAPI：0
- `node-result.json`：作者未生成，Root 运行时才允许生成
- Git add/commit/rebase/stash/reset/clean/checkout/push：0

本交回只表示“源码与正式说明已写回”，不表示通过、不表示整条 T34 完成。
