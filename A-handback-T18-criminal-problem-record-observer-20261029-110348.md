# A 线交回：T18 问题记录观察器误报修复

## 1. 结论

- 状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`
- 门禁：`INCOMPLETE`
- 打包：`HOLD`
- Git：`STRICT_READ_ONLY_HELD`；无提交 SHA、无暂存、无分支写入
- 本轮作者 Runtime：`0`
- 完整 consumer 实际运行：`NOT_RUN`
- 生产 JSONL 关闭后重开：`NOT_REACHED`
- 历史失败报告：`HELD_IMMUTABLE`
- 人工质量失败：`HELD`

已完成有界源码修改、冻结输入再绑定、39 个焦点断言测试器、README 和本交回件。
主编排完成终端审计后只运行有限测试器一次；本轮作者没有运行 Node、Python、
TypeScript parser/AST/import、check/test/build、HTTP/model/GUI/SSH、Env/Key/DPAPI
或进程探测。

## 2. 根因与不越界结论

旧 `assertDraftMachineChecks` 使用
`text.includes('### 问题 ')`。实际最终正文 `actual-final-v2.md` 有十条完整记录，
但使用二级 ATX 标题，所以旧观察器报
`draft machine checks failed: hasProblemRecords`。这是 consumer 假阴性，不是模型或
6000D 网关红。

实际正文每条都有主 Skill 的五个字段：涉及证据、审查角度、具体情况、可能的影响、建议。
本轮修正只处理标题级别造成的结构误报，不删除字段要求，不放宽为任意子串，不做语义或
golden-facts 检查，也不要求从字段标签推断律师真实立场。

原始已关闭运行仍保持原结论：`run-6EMIFM`、391 秒、11 次模型 POST 均 HTTP 200、
7 个 complete、一个完整 OS 进程最终消失且端口关闭、真实立场和读材前清单成立、
5 次材料读取、2 次保存、最终正文含 28 字节引用、A-E 为 0、15 条 hints、
15 次实际来源 GET 回读当前版本。本轮不重演，不改写生产 JSONL。

## 3. 产物路径与身份

证据目录：

```text
D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalProblemRecordObserver-20261029-110348
```

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-criminal-evidence.mts` | 123270 | `863ce380232a12ae45d38ba544c38cee335ba64af49d4195b1a6e4fc63c1e34f` |
| `b-service-criminal-evidence.py` | 48428 | `c437b9390b2d9c9fbe4afd1ae538c65be30bc4fff6c911ae6e77b69ac236ebdb` |
| `literalfixed-inputs.json` | 12239 | `a0e8272d60fbb872c8099ca5b008fc28eb360b53c6d4558e1fc27bd4f4081da6` |
| `verify-problem-records-finite.mts` | 13921 | `9dff4cf0f70504a2d1e40d7817856c6f84f240f19f3ec78274d01d9ede4b187f` |
| `README.md` | 9933 | `42cb4d80510fe33d2aaaa61a72f77d0a9c4ab6f52c78a60d451511b56a31ed91` |

冻结输入：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `actual-final-v2.md` | 8496 | `59f95a086aba1f39ba90068f759f8d20a5b83f3759b36cf98b1586cc5dcadebc` |
| 冻结 MTS | 120951 | `788b18db4587e0aa44185ab85e8713f4785ca81781dac81589029b9063af2060` |
| 冻结 B 服务 | 48428 | `c437b9390b2d9c9fbe4afd1ae538c65be30bc4fff6c911ae6e77b69ac236ebdb` |
| 冻结 manifest | 12237 | `b1ee91e2f28c1f0f54758119e9f03c43c28049c74c43f021e447f567503ed083` |
| 主 Skill | 13276 | `4405955c130cb7f9ea58c997965f41a62b6d7efcdafbb258d57fbd4028d906d2` |
| 原失败报告 | 31846 | `597aec6c3243e75d5c07ba8ab21caac01c104be1baec815e93379e11acc4ebf9` |

原始输入目录：

```text
D:\Lawbeach\lawbench-coord\T18ProblemRecordObserverInput-20261029-110348
```

## 4. 有界源码修改与全文反向关系

只改顶层 `assertDraftMachineChecks`：

- 标准 1–6 级 ATX 标题，数字问题标签、冒号、非空标题；
- 任意下一 ATX 标题结束当前问题记录；
- 每条记录必须有五个主 Skill 中文字段且内容非空；
- 围栏代码和引用块中的伪标题、伪字段忽略；
- 纯正文、表格、行内字符串、空标题（含 closing hashes）、无编号/无冒号标题不算记录；
- 任一记录或任一字段缺失均失败；
- 标题、矛盾对照、证据链缺口、自检结果、失败项聚合、错误文字与顺序不变。

静态全文反向事实：

```text
OLD_FUNCTION_BYTES 74022..74595
NEW_FUNCTION_BYTES 74022..76872
PREFIX_EXACT=True
SUFFIX_EXACT=True
```

`git diff --no-index` 对冻结 MTS 与新 MTS 只有一个差异块，且限定在该函数。有限测试器
还从两源真实提取该函数，把新函数替换回冻结函数后要求全文精确等于旧源。

所有其他函数、常量、提示词、答案、真实 callback、问题 ID、材料、A-E、预算、fetch、
KEY、finally、JSONL 和引用逻辑保持冻结字节。没有新增产品代码、build、loader、
framework、store、golden prompt 或模块导入。

## 5. B 服务与 manifest

B 服务仅复制，不修改：

```text
B_BYTES_EQUAL=True
B_SHA_EQUAL=True
B_SHA256=c437b9390b2d9c9fbe4afd1ae538c65be30bc4fff6c911ae6e77b69ac236ebdb
```

manifest 只改：

- `consumer`：路径、123270 字节、新 SHA-256；
- `bService.path`：新目录路径；bytes/SHA 保持原值。

对象顺序、缩进、换行和其他组不变。`git diff --no-index` 只出现这两组字段。

## 6. 有限验证器与严格反例

`verify-problem-records-finite.mts` 从冻结/新源各提取真实
`assertDraftMachineChecks`，经现有 TypeScript `transpileModule` 放入锁定能力的
`node:vm`。不 mock agent、不复制重写函数、不导入完整 consumer、不创建 Context/Session、
不取 Key。

39 个断言包括：

- 固定字节/SHA：旧源、新源、实际正文、B 服务、manifest；
- 旧源对实际正文必须精确抛出 `draft machine checks failed: hasProblemRecords`；
- 新源对实际正文只做结构验收，五项检查全真；
- 主 Skill 三级记录控制同时通过旧、新源；
- 1–6 级 ATX 标题均通过新源；
- 五字段逐项缺失均失败；
- 无标题、纯正文、仅标题、空标题、带 closing hashes 的空标题、无冒号、无编号、
  表格、行内字符串、四空格代码失败；
- 反引号围栏、波浪线围栏、引用块伪标题失败；
- 围栏/引用伪字段不能补足真实缺字段；
- 多记录中任一记录缺字段即失败；
- 错标题及三个其他章节缺失时，旧、新错误文字逐字一致。

实际正文 SHA 被固定为
`59f95a086aba1f39ba90068f759f8d20a5b83f3759b36cf98b1586cc5dcadebc`；冻结源固定为
`788b18...af2060`。不存在动态接受新 hash。

唯一执行命令，当前尚未执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalProblemRecordObserver-20261029-110348\verify-problem-records-finite.mts'
```

不需要 stdin、凭据、模型或网络。预期九行 `PASS` 是测试器设计，不是本交回件的通过声明。

## 7. Runtime/raw 与证据状态

| 项目 | 次数/状态 |
|---|---:|
| Node / Python / TypeScript parser/AST/import/transpile/vm | `0` |
| check / test / build / prepare / setup | `0` |
| HTTP / model / GUI / SSH | `0` |
| Env / Key / DPAPI | `0` |
| 进程探测 | `0` |
| Git add/commit/rebase/stash/reset/clean/checkout/push | `0` |
| 作者 raw 测试 stdout/stderr | `NOT_RUN` |
| 完整 consumer 实际运行 | `NOT_RUN` |
| 生产 JSONL reopen | `NOT_REACHED` |

不得把作者文件当作有限测试已绿、完整实际已绿、法律质量通过或打包放行。不得为这个
consumer 谓词修复单独重跑模型；人工身份推断失败仍在。

## 8. 命令与阻碍记录

Git 只读命令：

```powershell
git status --short --untracked-files=all
git -c submodule.recurse=false status --short --untracked-files=all --ignore-submodules=all
git rev-parse --show-toplevel
git rev-parse --abbrev-ref HEAD
git log -1 --format='%H %s'
git diff --no-index --unified=8 -- <冻结MTS> <新MTS>
git diff --no-index --unified=4 -- <冻结manifest> <新manifest>
```

普通 `git status` 首轮因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝退出 1；
未改权限、锁或配置。第二轮忽略 submodule 后成功，见到既有大面积 dirty；多个 Windows
长路径 warning 被保留，未清理、覆盖或暂存任何 dirty。

只读文件核对主要使用：

```powershell
Get-Content -LiteralPath <执行令或冻结输入> -Raw
Get-ChildItem -LiteralPath <目录> -Force
rg --files --hidden -g 'native-criminal-evidence.mts' -g '!.git/**' -g '!node_modules/**' D:\Lawbeach\lawbench-A
Get-FileHash -Algorithm SHA256 -LiteralPath <文件>
$old = Get-Content -LiteralPath <冻结MTS> -Raw
$new = Get-Content -LiteralPath <新MTS> -Raw
$oldStart = $old.IndexOf('function assertDraftMachineChecks(', [StringComparison]::Ordinal)
$newStart = $new.IndexOf('function assertDraftMachineChecks(', [StringComparison]::Ordinal)
$oldEnd = $old.IndexOf('function summarizeNetwork(', [StringComparison]::Ordinal)
$newEnd = $new.IndexOf('function summarizeNetwork(', [StringComparison]::Ordinal)
$old.Substring(0, $oldStart) -ceq $new.Substring(0, $newStart)
$old.Substring($oldEnd) -ceq $new.Substring($newEnd)
```

唯一写操作是三次 `Copy-Item` 复制冻结 MTS/B 服务/manifest，以及通过受控补丁修改函数、
manifest、README、测试器和本交回件。没有 shell 重定向、`cat`、Python 写文件或 Git 写。

有三次共五条只读核对误带 `shell=bash`，被 managed MXC 以 `E_ACCESSDENIED` 拒绝；
五条均未执行、未修改文件。没有重试 bash，没有修改沙箱、审批、ACL 或 writer 锁。
当前 PID 仍为本次唯一 writer。

## 9. 停止条件

作者工作已完成并停止。主编排应在完整终端审计之后决定是否运行唯一有限命令；无论结果，
不得回溯宣称旧实际报告通过、生产 JSONL 已重开或人工质量已转绿。没有调用其他聊天，
没有 API/费用/全局设置/policy 变更。
