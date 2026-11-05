# A 交回：T18 QuestionGate 私有构建候选

**结论：候选准备完成，未执行。**

已在 A 线指定目录生成 `build-private.mjs`、`build-config.mjs`、`README.md`。builder 与旧文件逐字节一致；config 相对旧文件只改 9 个字面字段；没有执行构建、Node、Python、Vitest、tsc、parser、AST、配置导入、自检、prepare、serve、HTTP、模型、GUI 或 SSH，也没有创建 `private-output-*`。

本交回只证明候选文件及其静态身份成立。它不证明编译通过、原生加载通过、GUI 通过、完整 T18 通过或项目通过。Gate 1、完整 T18、项目验收仍未完成；Packaging 为 **HOLD**，不是发版包。

## 1. 产物

根目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGatePrivateBuild-20261028-190358`

| 文件 | 字节 | SHA-256 | 状态 |
| --- | ---: | --- | --- |
| `build-private.mjs` | `32121` | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 从旧 builder 逐字节复制 |
| `build-config.mjs` | `20468` | `d4a4ea44ec126f8329e5d9109d017d89647d5b3ad68f3b0fe0d5e1c51a2e5402` | 旧 config 只改 9 字面字段 |
| `README.md` | `8659` | `76024809a0e8ce67963a1d19baa02465c70ab70bc09ba8b6d1a227a2e2ac1987` | 候选说明 |

builder 原文件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs`

builder 的逻辑、loader、resolver、参数、guard、输出定义均未改。旧 config 为 `20463` 字节，SHA-256 为 `4f86aad968ebcd72e238f767b71cad80dd89446bef89ea473ad8600cd634dae6`。

旧 T31 路径、`private-output-20261027-194112`、旧 `lib`、E50 runtime、18 棵 legacy 树和 Node/SDK/toolchain 固定输入均未覆盖、删除或冒充当前构建产物。

## 2. 精确 9 字段差与逆向字节相等

| 字段 | 旧值 | 新值 |
| --- | --- | --- |
| `EVIDENCE_ROOT` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGatePrivateBuild-20261028-190358` |
| `lawbench-agent-source.bytes` | `57829` | `72301` |
| `lawbench-agent-source.sha256` | `a0c25295daed8ca444c989d24d51d6a5ed6196703d3a3b6f3a68d22313a8b745` | `8378b6a90d85afea4c0c866bdf7678fdbcc166ac46dfc43a78b93513d960e78c` |
| `lawbench-host-source.bytes` | `184127` | `186034` |
| `lawbench-host-source.sha256` | `33bb54cc2cca639080747e0985bdf83740ad806aac8740fc1ff9ae31cb2619f6` | `e946b4618f02b90154205d5794db077a6e0da6dc31727b611bf61e5e9ce19a80` |
| `lawbench-shared-source.bytes` | `33915` | `34130` |
| `lawbench-shared-source.sha256` | `0f7805f79e4d93d8bb7730ed652053bd3723cca8703f172ca358f6db8dba3b77` | `a4182a25056dc5e91587966184b63a19305cb982a988c3bafa3b3c7bae22de2b` |
| `lawbench-ui-source.bytes` | `637026` | `637497` |
| `lawbench-ui-source.sha256` | `605ff86d3e3587c99a8e2ac5d742461d811d81602d6f1d8ef81e6e4914fa7dc9` | `16453fdee71df01f487d95f1b5afed87203d7a5191150cea63930b9f62b743a1` |

四棵树的 `root`、`selector` 和文件数 `4/20/9/92` 未改。用 PowerShell 在内存中把上述 9 个新值精确逆替换为旧值后，得到 `20463` 字节，与旧 config **长度相等且逐字节完全相等**。因此除这 9 个字段外，没有其他配置字节变化。

## 3. 固定输入与 legacy 资格

静态计数复核为：

- `TREE_PINS`：18
- `FILE_PINS`：39
- `REFERENCE_PINS`：14
- 文件与引用针合计：53
- `INTENDED_OUTPUTS`：25

README 第 3 节逐项列出全部 18 棵树的当前文件数、字节数和 SHA-256，值来自 root 提供的 `root-all18-trees-current.json` 的 `after` 字面数据；本次没有另行运行 Node/Python/hash helper 重算。

18 棵 legacy 树的资格如下：只更新 root 批准的 4 棵树，其余 14 棵树保留原 pin；树算法仍为 `ordinal-path-tab-size-tab-sha256-lf-v1`；39 个文件针、14 个引用针、25 个预期输出、Node `v24.21.0`、tsx `4.22.4`、esbuild `0.28.1`、TypeScript/Windows 原生 binding 和全部已冻结 guard 均未改。没有动态计算哈希、`acceptCurrent` helper、链接放宽、源码 allowlist、升级或新 SDK。

root 已审的 6 个批准产品文件只作为输入，本轮未改。Skill、B346、旧 T18 consumer `005889a8`、B service、manifest、模型参数、预算和测试断言均未改。原源码失败、fixture 灰证和旧历史记录保留，没有改写成通过。

## 4. 安全检查与当前阻碍

- 创建前已核对目标目录不存在。
- 最终目录只有三个要求文件；`Test-Path private-output-*` 为 `False`。
- builder 与旧字节逐字节相等。
- 新 config 的 9 个新字面值全部存在，缺少数量为 `0`。
- Git 只读检查只显示目标目录下三个新文件为未跟踪；没有 `add/commit/rebase/stash/reset/clean/checkout/push`，没有处理任何锁、ACL、审批或沙箱设置。
- 首次全仓 `git status` 因既有巨量 dirty 和过长路径警告而输出截断，但退出码为 `0`，未写 Git。开工 dirty 快照仍保留在输入目录 `A-dirty-before.txt`（`265028` 字节）。

后续实际消费仍需要真实 Host `skillQuestions` 的手动能力接线，以及基于新实际编译产物生成、审查新的字面输入。这两项不属于本轮候选准备，不能由本交回替代。

## 5. 实际工具账

作者使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，全部 `exec_command` 均显式 `login=false`，工作目录为 `D:\Lawbeach\lawbench-A`，未使用 Bash 包装。共 28 个 shell 命令，24 个退出 `0`，4 个非零；另有两个 `apply_patch` 写动作。

| # | 实际命令或动作 | 结果 |
| ---: | --- | --- |
| 1 | `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-question-gate-private-build-order-20261028-190512.md' -Raw` | 0；完整读取执行令 |
| 2 | `git status --short --untracked-files=all --ignore-submodules=all` | 0；输出截断，仅有既有 dirty/长路径警告 |
| 3 | `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18QuestionGateBuildInput-20261028-190358' -Force` | 0 |
| 4 | 协调目录根文件按 `root-blueprint|approved-six-product-sources|root-all18-trees-current|194112` 的 `Get-ChildItem ... | Where-Object` 只读筛选 | 0；无根文件匹配 |
| 5 | `Get-Content ...\root-blueprint.json -Raw` | 0 |
| 6 | `Get-Content ...\approved-six-product-sources.json -Raw` | 0 |
| 7 | 对旧 builder、config 的 `Get-FileHash -Algorithm SHA256` | 0；两个旧 SHA 吻合执行令 |
| 8 | `Select-String ...\build-config.mjs` 检索 root、pin、输出、Node/toolchain 上下文 | 0 |
| 9 | `Get-Content ...\root-all18-trees-current.json -TotalCount 120` | 0 |
| 10 | `Select-String ...\root-all18-trees-current.json` 检索四棵变更树及上下文 | 0 |
| 11 | 对 `A-dirty-before.txt` 的 `Get-Item` | 0 |
| 12 | `Get-ChildItem ...\PrivateRuntimeBuild-20261026-043910 -Force` | 0 |
| 13 | `Get-Content ...\PrivateRuntimeBuild-20261026-043910\README.md -Raw` | 0 |
| 14 | `Select-String ...\root-all18-trees-current.json` 检索全部 `"id"` | 非零 `255`；shell 选择错误，命令实际落入非 PowerShell，只读且未写 |
| 15 | config 计数命令（`configPath`、`Select-String`、`Measure-Object`） | 非零 `1`；同上，命令实际落入非 PowerShell，只读且未写 |
| 16 | `Select-String ...\config-data-before.json` 检索固定输入上下文 | 非零 `255`；同上，只读且未写 |
| 17 | 重跑 #14 的全树 `"id"` 只读提取 | 0 |
| 18 | 重跑 #15 的 config 静态计数 | 0；当时整文件粗计含输出对象 id，不作为最终 18/53/25 结果 |
| 19 | 重跑 #16 的 `config-data-before.json` 只读提取 | 0 |
| 20 | `Get-ChildItem ...\lawbench-coord -Recurse -File -Filter '*194112*'` | 0；无匹配 |
| 21 | 协调目录根 `*.md` 按 9/literal/nine/九字段等词执行 `Select-String` | 0 |
| 22 | `Get-ChildItem ...\private-output-20261027-194112 -Force` | 0 |
| 23 | 以数组区间复核 TREE/FILE/REFERENCE/OUTPUT 计数 | 非零 `1`；PowerShell 区间表达式语法错误，命令未执行成功，无写 |
| 24 | 目标目录 `Test-Path` | 0；创建前不存在 |
| 25 | `New-Item` 创建目标目录；`Copy-Item` 从输入目录复制 builder、config | 0；写面为新建目标目录及两个文件 |
| 26 | PowerShell 读新 config、执行 9 值内存逆替换、与旧 config 逐字节比较，并取 builder/config SHA | 0；`InverseBytesExact=True` |
| 27 | 数组区间静态复核 TREE=18、FILE=39、REF=14、合计 53、OUTPUT=25，并核对 Node/tsx/esbuild/TypeScript pin | 0 |
| 28 | 最终只读检查 builder 字节相等、9 新字面齐全、五项计数、`private-output-*` 不存在、三文件大小/SHA 和目标 Git status | 0；`BuilderExactBytes=True`、缺字面 `0`、三项均为未跟踪 |

两个 `apply_patch`：

1. 修改新 `build-config.mjs` 的 9 个字面字段，不触碰其他内容。
2. 新增新目录 `README.md`。

没有其他写动作。没有 Git 写入。没有改动协调目录既有文件。
