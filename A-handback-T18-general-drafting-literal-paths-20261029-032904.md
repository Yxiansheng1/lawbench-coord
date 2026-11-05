# A 线交回：T18 General Drafting Native 字面路径修正

状态：有界修改完成，正式交回。  
范围结论：本次只修复 `T18GeneralDraftingNative-20261029-025642\literalfixed-inputs.json` 的七个路径字符串；未执行任何产品、消费者、解析器或模型 runtime。  
项目状态：这是 T18 `general-drafting` 既有 canonical fixture card 的数据修正，不是新 scope；`Gate1 full T18 project INCOMPLETE`，Packaging 继续 `HOLD`。

## 交付物

| 类型 | 路径 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| 修正后 manifest | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\literalfixed-inputs.json` | 11651 | `a1751fa2d62c22869092903f32a54b95ed63d57d6a67e6a1faf2b80d6a062464` |
| 新证据说明 | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\literal-paths-20261029-032904.md` | 5782 | `5666c3c328386dda93fda99bf90f29621775e23180908648b8c3e043cebaa85f` |
| 正式交回件 | `D:\Lawbeach\lawbench-coord\A-handback-T18-general-drafting-literal-paths-20261029-032904.md` | 见落盘后 `Get-Item` | 见落盘后 `Get-FileHash` |

## 根因与修正

执行前 manifest 的五份材料、`canonicalTask` 和 `skill` 路径错误地指向协调目录副本。审批文件 `approved-sample-and-skill.json` 中八条记录均已核对；本次按 basename 把七个 manifest 输入路径改为审批文件记录的 `D:\Lawbeach\lawbench-B\...` 原始路径。

| 字段 | 修正后路径 |
| --- | --- |
| `canonicalTask.path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\tests\样本01-借贷催款律师函\_任务说明.md` |
| `skill.path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\SKILL.md` |
| `materials[0].path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\tests\样本01-借贷催款律师函\借条.txt` |
| `materials[1].path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\tests\样本01-借贷催款律师函\微信催款记录.txt` |
| `materials[2].path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\tests\样本01-借贷催款律师函\情况说明.txt` |
| `materials[3].path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\tests\样本01-借贷催款律师函\还款记录.txt` |
| `materials[4].path` | `D:\Lawbeach\lawbench-B\skills\general-drafting\tests\样本01-借贷催款律师函\银行流水.txt` |

七条记录的 `bytes`、`sha256`、`mtime_ns` 均保持原值。审批文件中的第八条 `tests\要点.md` 只参与审批记录，没有加入 case、model 或其他 manifest 输入行。

## 字节级证明

执行前原件在协调输入目录：

```text
D:\Lawbeach\lawbench-coord\T18GeneralDraftingLiteralPathsInput-20261029-032904\literalfixed-inputs.json
```

执行前原件为 11592 字节，SHA-256 为 `92803ebf8351abe641ee48e90a227430b5d774ac876bc3dbf88d0f182a1f6307`。从该只读原件逐项替换七段旧路径为新路径后，得到 11651 字节、SHA-256 `a1751fa2d62c22869092903f32a54b95ed63d57d6a67e6a1faf2b80d6a062464`，与当前 manifest 逐字节相等：

```text
expected-bytes=11651
actual-bytes=11651
expected-sha256=a1751fa2d62c22869092903f32a54b95ed63d57d6a67e6a1faf2b80d6a062464
actual-sha256=a1751fa2d62c22869092903f32a54b95ed63d57d6a67e6a1faf2b80d6a062464
byte-equal=True
```

逐行比较共 14 条差异，恰为七条旧路径和七条新路径，没有其他差异行。当前文件使用 278 个 LF、0 个 CRLF，无 BOM。由此确认除七个路径值外，其余 JSON 字节、字段、数量和顺序未变。

## 保留项

| 对象 | 字节 | SHA-256 | 结论 |
| --- | ---: | --- | --- |
| consumer `native-general-drafting.mts` | 101217 | `8a8347caeb801b3c5053bf22f709631f4302c3f802975c2b87215673003e9f70` | 未变 |
| b-service `b-service-general-drafting.py` | 42251 | `c8bbde139050d1c3728a1631b50a7448614af7c8a1c6ce9334a8b657e84188bc` | 未变 |
| 审批文件 `approved-sample-and-skill.json` | 2130 | `50a9c328e41d5ab52dbe31411c17d13e1b20d537c711cdc38d101a43e866edb6` | 未变 |
| 执行前 manifest 输入副本 | 11592 | `92803ebf8351abe641ee48e90a227430b5d774ac876bc3dbf88d0f182a1f6307` | 未变 |

`approvedInputs.path` 仍为协调目录中的审批文件，其 2130 字节和 `50a9c328...` SHA-256 未变。`sourcePins`、`dependencies`、`compilerPrivate`、`runtimeExecutables`、`consumer`、`bService` 各 identity 行均因逐字节相等证明保持原样。没有修改审批文件、执行前输入副本、consumer、b-service、产品、Skill、fixture、prompt、answers、R、budgets、旧 README、旧主交回件、旧失败 job 或 raw。

## Git 与验证边界

- Git 全程只读。没有执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 常规 `git status --short --branch` 返回 1：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`，随后 submodule `git status --porcelain=2` 失败。没有尝试修复权限、ACL、锁、沙箱或审批设置。
- 使用 `git status --short --branch --ignore-submodules=all` 只读确认 A 线外层已有大量既存 dirty。本次没有触碰或回退这些改动。
- 没有启动 Node、Python、TSX、parser、AST、compile、test、import、prepare、HTTP、model、GUI、SSH、credential、DPAPI 或消费者。runtime 执行次数为 0。
- 没有读取环境变量、Key、provider credential 或任何凭据。
- 没有执行 admission、finite check、实际 model run 或 T18 全项目验收。后续独立 full audit、finite/admission 和 one actual run 仍由 ROOT 负责。

## 非零与拒采记录

1. `C04` 的常规 Git status 返回 1，原因仅是上述既有 submodule 工作树权限拒绝；未修复，未重试改写。
2. `C06` 的一次只读元数据核对命令返回 1。原因为 PowerShell 管道语法错误：`An empty pipe element is not allowed at line 2`。该命令没有文件写入；随后用 `C08` 成功完成同一核对。
3. `C11` 的初版内存逆向核对返回 0，但 PowerShell 嵌套数组展开使输出为 `restored-bytes=11617`、`restored-sha256=131bb503f8e34327d05b9a0dc5f7ed6f6869d484a878e209566e0dc66f2d4e29`。该结果已拒采，未用于交付结论。最终改用协调目录执行前原件做精确替换，并由 `C16` 得到 `byte-equal=True`。

## 命令与写入台账

所有命令均通过以下实际运行器执行，未使用 bash：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
workdir=D:\Lawbeach\lawbench-A
sandbox=managed/use_default
```

| 编号 | 实际命令或脚本 | 返回 | 写入 |
| --- | --- | ---: | --- |
| `C01` | `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-general-drafting-literal-paths-order-20261029-032904.md'` | 0 | 无 |
| `C02` | `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T18GeneralDraftingNativeInput-20261029-025642\approved-sample-and-skill.json'` | 0 | 无 |
| `C03` | `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\literalfixed-inputs.json'` | 0 | 无 |
| `C04` | `git status --short --branch` | 1 | 无 |
| `C05` | `Get-FileHash -Algorithm SHA256 -LiteralPath <manifest>,<approved>` | 0 | 无 |
| `C06` | `$paths = @(...approval paths...); foreach (...) { ... Get-Item ... Get-FileHash ... } \| Format-List`（管道位置语法错误） | 1 | 无 |
| `C07` | `git status --short --branch --ignore-submodules=all` | 0 | 无 |
| `C08` | 分别输出 manifest、approved SHA-256，并 `Test-Path` 检查 `before-approved-source-paths.json` | 0 | 无 |
| `C09` | 逐项 `Get-Item`、`Get-FileHash` 审批文件八个原始路径，输出长度、SHA-256、UTC mtime | 0 | 无 |
| `C10` | `Get-ChildItem -LiteralPath <T18 job directory> -File \| Select-Object Name,Length,LastWriteTimeUtc` | 0 | 无 |
| `C11` | 初版内存字节替换脚本：读取当前 manifest，将七条新路径替换回旧路径，计算 `SHA256` | 0（结果拒采） | 无 |
| `C12` | `rg --files 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18' \| rg 'literalfixed-inputs\.json$'` | 0 | 无 |
| `C13` | 读取文件字节，统计总长度、LF、CRLF、首尾字节 | 0 | 无 |
| `C14` | `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -Recurse -File -Filter 'literalfixed-inputs.json'` | 0 | 无 |
| `C15` | 对五个候选 `literalfixed-inputs.json` 分别输出长度和 SHA-256 | 0 | 无 |
| `C16` | 从协调输入原件 `ReadAllText`，顺序替换七段旧路径为新路径，比较预期与实际字节、长度、SHA-256 | 0 | 无 |
| `C17` | `Compare-Object` 对比执行前原件与当前 manifest 行；并输出 consumer、b-service、approved、执行前 manifest 的保留哈希 | 0 | 无 |
| `C18` | `Select-String` 只读定位 `approvedInputs`、`sourcePins`、`consumer`、`bService`，确认 `要点.md` 不在 manifest | 0 | 无 |
| `C19` | `Get-Item`、`Get-FileHash` 计算新证据说明 `literal-paths-20261029-032904.md` | 0 | 无 |
| `C20` | `apply_patch` 将 manifest 七处 path 字符串替换为审批原始路径 | 0 | 仅写 manifest |
| `C21` | `apply_patch` 新增 `literal-paths-20261029-032904.md` | 0 | 仅新增证据说明 |
| `C22` | `apply_patch` 新增本正式交回件 | 0 | 仅新增 formal |
| `C23` | 本文件落盘后执行最终只读核对：`Get-Item`、`Get-FileHash` manifest/证据说明/formal，并重跑 manifest 从原件经七段替换的字节比较 | 待本文件落盘后执行 | 无 |

没有其他命令、写入或 runtime。

## 最终只读核对命令

`C23` 在 formal 落盘后执行，预期 manifest 仍为 11651 字节和 `a1751fa2d62c22869092903f32a54b95ed63d57d6a67e6a1faf2b80d6a062464`，证据说明仍为 5782 字节和 `5666c3c328386dda93fda99bf90f29621775e23180908648b8c3e043cebaa85f`，formal 存在，且七段替换字节比较仍为真。执行后不再进行其他命令，直接停止并交回。

## 遗留

- 本次交付是静态数据路径修正，不包含 admission、finite check、实际消费者/模型运行或完整 T18 验收。
- 既有 A 线 dirty 保持不变，未由本次执行者暂存、提交或合并。
- 权威后续步骤：ROOT 独立 full audit、finite/admission、一次 actual run；Gate1 全项目仍未完成，Packaging 保持 HOLD。
