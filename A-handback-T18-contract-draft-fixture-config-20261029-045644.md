# A 线交回：T18 合同起草旧夹具身份修正与新配置

执行者：独立 A 线 DeepSeek 执行者。

执行目录：`D:\Lawbeach\lawbench-A`。

正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-contract-draft-fixture-config-order-20261029-045644.md`，4614 字节，SHA-256 `0c7ec323df143c37e1ec64314ea8581146827fd34ac4414548ba6adebff99e7c`。

## 交回结论

已完成执行令允许的有界文件工作：新增一个有 5 项测试的旧夹具身份修正副本，新增一份冻结构建器原样副本和一份 data-only 新配置，并形成证据说明。作者阶段没有运行测试、类型检查、编译、构建或产品代码；新配置尚未获构建准入。完整 T18、Gate 1 与 Packaging 均未完成，Packaging 仍为 `HOLD`。

## 交付物

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\doc-revise-question-current-other-20261029-045644.spec.ts` | 12425 | `f7316921de8230db89b83fe548ff551099e193dba5de338bb5ed05211b17b3c3` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftQuestionPrivateBuild-20261029-045644\build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftQuestionPrivateBuild-20261029-045644\build-config.mjs` | 20477 | `57801da5f9de7fe0cfb71efa89a52af3b80ab8c3b57494a21690552e32747815` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftQuestionPrivateBuild-20261029-045644\README.md` | 5344 | `6e4f3c86b133796bd9264f5e1b4ddbb05a20795ad621f20723c0050ff604c4c7` |

## 测试副本

输入旧测试：12428 字节，SHA-256 `5ad9d9a049be0a323089b5d4c1c4a4967a6b9119ac1c47811b8437a15d19dd40`。

新副本对旧文件整字节复制，只把唯一一次 `['contract-draft', null]` 改为 `['other-skill', null]`。字节级反变换结果与旧文件 `SequenceEqual=True`；旧元组在新副本中出现 0 次，新元组出现 1 次。五个测试体、断言、辅助函数和 import 均保持旧字节。

旧测试、产品源码和既有当前新 7 项测试均未改写：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `dsh-ext\tests\doc-revise-question-gate.spec.ts` | 12428 | `5ad9d9a049be0a323089b5d4c1c4a4967a6b9119ac1c47811b8437a15d19dd40` |
| `dsh-ext\agent\index.ts` | 46547 | `40ab48b82a3bb8b1ae488daa1ba930924d1b8b292aa70114bf317e9a633d5794` |
| `dsh-ext\agent\task-state.ts` | 21264 | `fa246725b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |
| `dsh-ext\tests\contract-draft-question-recovery.spec.ts` | 18087 | `cb70095abd6d1b216e9d9a2011c587c26054f6ff6e5576fdad9b0f03cd517928` |

## 配置与构建器

冻结构建器输入 SHA-256 为 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`；证据目录副本与之逐字节相等。

配置输入为 20471 字节、SHA-256 `6e015d6dacab16fde555775bf5c638e66b97b1f8696cd2b74c15c99693730d6e`。新配置只改三处 data：

1. `EVIDENCE_ROOT` 指向新的 `ContractDraftQuestionPrivateBuild-20261029-045644` 绝对目录。
2. `lawbench-agent-source` 文件字节数由 75167 改为 75343。
3. 同一树摘要由 `a13b0857f9f8ff04b0b3669f65a73ab4b0b263735e9c58ea1b487888838df85e` 改为 `5d82166456def0ccaf783af8b3e2b4e43f1d7760d2267b5d7f06101d7e19fc23`。

对这三个片段做反变换后，新配置与输入配置逐字节相等。其余 18 个 tree pin、39 个 file pin、14 个 reference pin 及所有构建/输出设置保持原字节。

当前 agent 树为 4 个文件、75343 字节；按冻结器的 UTF-8 字节序路径摘要规则复算为 `5d82166456def0ccaf783af8b3e2b4e43f1d7760d2267b5d7f06101d7e19fc23`，与批准 after 值一致。没有动态接受安装库摘要。

## 复用证据与失败限定

原始 `unit-original-results.json` 为 22114 字节、SHA-256 `2d5d86ce83fe2e221ded9a6c7498fb6a586e2fd2e95a80f830fa2869a9d24e4c`：51 个测试中 50 通过、1 失败；类型检查退出 0。原始失败包为 2862 字节、SHA-256 `65248248cd665928945ea822e98d2a970be805a0ce046fd5a6a131a8db892ec7`，未被覆盖。

唯一失败为旧 `doc-revise-question-gate.spec.ts` 最后一项：旧负控制把 `contract-draft` 当作任意其它 Skill，期望 resolver 不加载；该身份现在是已确认的必问 Skill，因此产品正确 fail closed。该失败不能算产品回归，也不能靠放宽生产闸门或改旧断言处理。

已完成的 46 项不重叠当前源码绿色结果继续复用。旧 50 项绿色包含该 `doc-revise` 文件中的 4 项，因此不能写成 50+5；新副本实际 5 项通过后才与 46 项构成等效 51 项。既有 `contract-draft-question-recovery.spec.ts` 的 7 项通过结果继续引用，未由本作业重跑。

## 运行边界与异常记录

作者阶段产品运行时为 0：未执行 Node、Python、TypeScript、vitest、类型检查、构建、准备脚本、HTTP、模型、GUI、环境密钥、DPAPI 或 SSH；未安装包，未改设置、沙箱、审批、ACL、writer 锁或非目标产品/测试/fixture。

实际使用的只读/文件命令均通过指定的原生 `pwsh.exe` 和 PowerShell 执行。主要非零或异常：

- 首次 `git status --short --branch` 在已存在的 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-A\modules\dsh` 处收到 `Permission denied`；没有尝试修锁、权限或 ACL。
- 只读 `git status` 对部分超长证据路径报告 `Filename too long` 警告；未执行任何 Git 写操作。
- 首次落盘命令把 `New-Item` 与不支持的 `-LiteralPath` 组合使用，证据目录未创建；同命令已生成测试副本。随后只补齐缺失证据目录和两份脚本，没有重写测试或生成额外测试变体。
- 一次 `Get-CimInstance Win32_Process` 父进程只读核查被环境拒绝；不影响任务，也未通过扩权绕过。

Git 严格只读：没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push` 或暂存操作。交回以本文件和文件 SHA-256 为准。

## 主编排下一步

1. 复核四个交付文件，尤其核对测试副本反变换和配置反变换。
2. 完成累计审计后，ROOT 再实际运行新副本 5 项与类型检查；失败时保留结果，不放宽断言。
3. 只有审计接受后，才由 ROOT 决定用冻结构建器执行一次 private25 编译。
4. 编译被接受后，另派新的 DeepSeek 消费者完成四份运行时 pin、两个 import、manifest SHA 和源码绑定，再单独进行真实模型复测。

旧真实模型运行 `run-yB8LvP` 仍为失败历史（53.313 秒、5 次 HTTP 200、`ask_user_question=0`、`hints=21`）。本交回没有改提示、答案、断言、预算或质量结论。
