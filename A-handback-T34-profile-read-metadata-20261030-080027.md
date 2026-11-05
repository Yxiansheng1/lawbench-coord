# A 线交回：T34 profile 读取元数据与失败阶段修正

## 结论

静态修正完成，等待根审查器做 full cumulative audit。A 线未运行 Node，未执行任何产品、测试、构建、导入、网络或 GUI 路径；`runtime 0`。

最终候选仍是一个只读、三案、每个 case 依次消费 `loadProfileDirectory`、`readProfilePatches`、`composeEntries` 三 API 的消费者。失败会返回固定 `activeStage`/`activeLabel`，`LOAD` 返回后还可返回安全的 `layersCount`/`skippedCount`。

## 受控修改

只改了执行令点名的两个既有文件：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\README.md`

新增本正式交回件：

- `D:\Lawbeach\lawbench-coord\A-handback-T34-profile-read-metadata-20261030-080027.md`

未改 `literal-inputs.json`、旧 formal、status、raw、产品或测试框架；未新建测试、配置或产品文件。

### 元数据投影

- `targetRowDisabled` 改为 `targetRow.disabled === true`。属性缺省只表示有效的 `false` 语义，不声称原生 schema 声明了该属性。
- `targetConfigProvidersExternal` 删除，改为 `targetHasExternal`：`config.providers` 是非空对象且自有 `external` 键时为 `true`。
- 不再要求 `external` 的值是布尔值，不读取或序列化该值；`external` 缺省和非空对象形式的 `providers` 均允许。
- 两条不成立的默认值类型断言已删除；三案、每案三 API、三层、零跳过、目标名空间恰好一行、HOME patch 不存在、六份输入与四份 primary 的前后 bytes/SHA-256/纳秒 mtime/API 调用和 pin 门槛均保持。

### 失败元数据

- `activeStage` 固定白名单：`INPUT_VALIDATION`、`PRE_PINS`、`IMPORT`、`LOAD`、`READ`、`COMPOSE`、`TARGET`、`POST_PINS`。
- `activeLabel` 固定为 `0`、`1`、`2`、`3`；pin/import/post-pin 阶段为 `0`，逐案阶段按真实 case label。
- `LOAD` 返回后，失败元数据可带非负安全整数 `layersCount`、`skippedCount`。
- `errorName`、`errorCode` 继续使用原窄白名单；未输出 message、stack、reason、路径、配置值或 patch 内容。
- 核心逻辑继续抛原异常对象；操作失败上下文在 post-pin 检查后恢复，post-pin 自身失败仍抛原 pin 异常并保持非零。原有退出码行为未放宽。

## 静态核验

冻结输入 `literal-inputs.json`：

- bytes：`6564`
- SHA-256：`A1BB3B9FEFD0463BC0F782DEB3E6C23FE7AE6795463A2F633C0ECA9A9C3AF871`
- 与新 approved-inputs 的批准值一致；mtime 保持 `2026-10-29T23:57:17.3299524Z`。

最终受控文件：

| 文件 | bytes | SHA-256 | mtime UTC |
| --- | ---: | --- | --- |
| `profile-read-contract.mjs` | 15541 | `53D8E31179F9629062A3965CC8C7154C5C91268F5806CD1EBAB75E94872142D2` | `2026-10-30T00:02:26.5241268Z` |
| `README.md` | 4298 | `65868A2C50D10F22167A9152A4BA6DC0D41CA81A7CDE59492ACCBC161F4AA6BF` | `2026-10-30T00:02:20.8372611Z` |

静态文本核验：

- 旧字段 `targetConfigProvidersExternal` 不存在。
- 两条不成立的布尔类型断言不存在。
- 有效 disabled 投影与 external 键存在投影存在。
- 八个失败阶段字符串全部存在。
- 修改前后 no-index diff 只含上述受控区段；API 实参、`EXPECTED_INPUTS`、原 pin/API/三案门槛未改。

## 状态与 dirty

- 新批准上下文记录原 `source_dirty57`；当前外层工作树另有大量既有修改、未跟踪文件和超长路径告警。A 线未触碰、清理、暂存或改写这些内容。
- 目标三文件在当前 Git 状态中均为 `??`，属于此前未服务的候选目录；A 线未 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 首次全树 `git status` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝返回 1。按令未修锁、未改 ACL、未扩权；改用 `--ignore-submodules=all` 与目标路径过滤完成只读核状态。
- 当前执行器是本次 job 的唯一 writer，不按第二 writer 处理。

## 非零记录

1. 首次全树 `git status --short --untracked-files=all`：exit 1，子模块 `dsh` 工作树路径 `Permission denied`。未尝试修复。
2. 修改前脚本 no-index diff：exit 1，属 `git diff --diff` 发现差异的约定退出码。
3. 修改前 README no-index diff：exit 1，属 `git diff --diff` 发现差异的约定退出码。

没有产品失败、断言弱化或运行失败；以上均不是运行器交付阻碍。

## 全部实际命令

所有 shell 均为绝对 native PowerShell：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

全部使用 `login=false`，工作目录为 `D:\Lawbeach\lawbench-A`。

1. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-profile-read-metadata-order-20261030-080027.md' -Raw`
2. exit 0：`Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027' -Force | Select-Object Mode,Length,LastWriteTimeUtc,FullName | Format-Table -AutoSize`
3. exit 0：`Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027' -Force | ForEach-Object { $_.Name }`
4. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027\approved-inputs.json' -Raw`
5. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027\profile-read-contract.mjs.before' -Raw`
6. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027\README.md.before' -Raw`
7. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027\literal-inputs.json.before' -Raw`
8. exit 0：`Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadInput-20261030-075459' -Force | Select-Object Mode,Length,LastWriteTimeUtc,Name | Format-Table -AutoSize`
9. exit 1：`git -C 'D:\Lawbeach\lawbench-A' status --short --untracked-files=all`
10. exit 0：`Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459' -Force | Select-Object Mode,Length,LastWriteTimeUtc,Name | Format-Table -AutoSize`
11. exit 0：`Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\literal-inputs.json','D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\README.md' | Select-Object Path,Hash | Format-Table -AutoSize`
12. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T34ProfileReadInput-20261030-075459\approved-inputs.json' -Raw`
13. exit 0：`git -C 'D:\Lawbeach\lawbench-A' status --short --ignore-submodules=all --untracked-files=all`；输出有超长路径 warning 并被工具截断。
14. exit 0：`git -C 'D:\Lawbeach\lawbench-A' status --short --ignore-submodules=all --untracked-files=all -- 'docs/plan/evidence/T34/ProfileReadContract-20261030-075459'`
15. exit 0：`Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\literal-inputs.json','D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\README.md' | Select-Object FullName,Length,LastWriteTimeUtc | ConvertTo-Json`
16. 编辑动作：`apply_patch` 修改脚本与 README。
17. 编辑动作：`apply_patch` 修正阶段赋值位置并补 `operationFailure` 声明；在首次静态复读发现，未执行任何 runtime。
18. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs' -Raw`
19. exit 0：`Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\README.md' -Raw`
20. exit 0：`$target = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459'; Get-FileHash -Algorithm SHA256 -LiteralPath "$target\literal-inputs.json","$target\profile-read-contract.mjs","$target\README.md" | ForEach-Object { [pscustomobject]@{ Path = $_.Path; Hash = $_.Hash } } | ConvertTo-Json`
21. exit 0：`$target = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459'; $text = Get-Content -LiteralPath "$target\profile-read-contract.mjs" -Raw; [pscustomobject]@{ OldFieldPresent = $text.Contains('targetConfigProvidersExternal'); UnsupportedDisabledBooleanAssertion = $text.Contains("typeof targetRow.disabled !== 'boolean'"); UnsupportedExternalBooleanAssertion = $text.Contains("typeof targetRow.config.providers.external === 'boolean'"); HasEffectiveDisabledProjection = $text.Contains('const targetRowDisabled = targetRow.disabled === true'); HasExternalKeyPresenceProjection = $text.Contains("Object.hasOwn(targetProviders, 'external')"); HasAllFailureStages = @('INPUT_VALIDATION','PRE_PINS','IMPORT','LOAD','READ','COMPOSE','TARGET','POST_PINS') | ForEach-Object { $text.Contains($_) } | Where-Object { -not $_ } | Measure-Object | Select-Object -ExpandProperty Count } | ConvertTo-Json`
22. exit 0：`git -C 'D:\Lawbeach\lawbench-A' status --short --ignore-submodules=all --untracked-files=all -- 'docs/plan/evidence/T34/ProfileReadContract-20261030-075459'`
23. exit 0：`Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\literal-inputs.json','D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\README.md' | Select-Object FullName,Length,LastWriteTimeUtc | ConvertTo-Json`
24. exit 1：`git -C 'D:\Lawbeach\lawbench-A' diff --no-index -- 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027\profile-read-contract.mjs.before' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs'`
25. exit 1：`git -C 'D:\Lawbeach\lawbench-A' diff --no-index -- 'D:\Lawbeach\lawbench-coord\T34ProfileReadMetadataInput-20261030-080027\README.md.before' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\README.md'`
26. 编辑动作：`apply_patch` 创建本正式交回件，并只修正本文件的命令台账。

## 偏离与处理

首次 patch 曾把阶段赋值表达式误放进 `loadProfileDirectory` 的实参列表。A 线在全文件静态复读时立即发现，第二次 patch 已改为 API 调用前逐项赋值，并补上保存操作失败上下文的 `operationFailure` 声明。未执行该中间态，最终 no-index diff 显示 API 实参、pin 和门槛保持原样。

除此之外无范围偏离。

## 根执行器下一步

1. 对最终源码做 full cumulative audit。
2. 审查通过后，仅在根隔离环境执行一次真实只读三 API 消费者：

```powershell
node .\docs\plan\evidence\T34\ProfileReadContract-20261030-075459\profile-read-contract.mjs
```

3. 收集一行 stdout、实际退出码、前后 pin 结果及 OS 闭包；不要增加 GUI、产品启动或新的 error-classifier 变体。

本交回不宣称契约通过，不宣称已知 origin 拒绝原因被证明或排除。
