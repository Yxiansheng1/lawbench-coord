# A 线交回：T18 人工状态范围文法

状态：`SOURCE_FIX_AUTHORED_NOT_RUN`。本次只完成有界源码修改、测试编写和静态文件核验，没有执行测试，也没有把源码修正写成运行通过。

## 目标与输入身份

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-manual-status-scope-order-20261028-232316.md`。
- 当前执行者：PID 44324，native `pwsh`；该 PID 是本次执行者，不是第二 writer。
- 输入目录：`D:\Lawbeach\lawbench-coord\T18ManualStatusScopeInput-20261028-232316\`。
- 冻结 consumer 和输入副本的 SHA-256 均为 `B9390A6876256A00C5217D7DFFD43FF12E33735EB5E91C7497593A855061D266`。
- 真实草稿为 8919 字节，SHA-256 为 `2d7660b092eb6a8452d1ecc46d04a9d84660e238eecb55487905774c6e93377b`。
- 真实编辑清单为 4046 字节，SHA-256 为 `24121688dfc9d25eed41ce1ddc443da2e978a8fdddf7f102c471a0605c7f7d8b`。
- 真实编辑清单有 8 条 edits、accepted 7、out-of-scope 1；缺口是 `id 4 / 风险4 / para 39`，机器原因为 `find 跨越域代码或超链接`，草稿处理方式为 `该条需人工修改（find跨越超链接，系统修改清单未收下）`。
- 旧真实工作流 `run-Vet7pA` 的原始 FAILED 状态、旧证据和旧文件均未重跑、未覆盖。

## 有界改动

只创建或修改以下三张授权文件：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts`

   只改 `assertOutOfScopeReported` 内的 `crossBoundaryReasonClause` 一行，1-based 行号 1704。改前 117363 字节、SHA-256 `B9390A6876256A00C5217D7DFFD43FF12E33735EB5E91C7497593A855061D266`；改后 117382 字节、SHA-256 `1A1ED4C7B1B29E175C82D2A474F172B2A4C16F3D99C168A31B6CEFFE34D679C1`。

   新增 STATUS 语义恰好是 `系统 + 可选“修改清单” + 未收下/未接受`，即 `系统(?:修改清单)?(?:未收下|未接受)`。它保留原有 `系统未收下`、`系统未接受`、无法自动替换、不能自动替换、未能应用、应用未成功、系统未纳入修改清单等状态，以及全部原有 cause 分支。

   机器原因判定、非跨边界原因的严格归一化回退、risk/id/comment 风险标记/para/唯一处理方式/人工修改标记均未改。没有增加普遍 contains、忽略整段、改写草稿、提示词或任意状态后缀。

2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-status-scope-20261028-232316.spec.mts`

   新文件 18462 字节，SHA-256 `AE77BBF28D1B5CB857E4BDACDCCAD254DC26879704895844A567A13C755ADB1F`。它从冻结 manual38 整文件复制；相对旧文件的静态差异只有新增 `node:crypto` 导入和尾部追加块。原有 38 个用例体、断言、当前安全 AST/VM 提取方式均保留。

   尾部追加了真实资源字面 SHA/字节断言、真实草稿加真实编辑清单正例、`系统修改清单未接受`范围状态正例，以及 6 个负例：错误原因、成功状态、无关后缀、错绑实际 ID、段号错位、评论风险错位。该测试未运行。

3. `D:\Lawbeach\lawbench-coord\A-handback-T18-manual-status-scope-20261028-232316.md`

   本交回件。

## 冻结与静态核验

- 旧 manual38 未改、未跑，SHA-256 仍为 `25ADCBBE8A2A0C061F668FDD23058A3B946D1970639BAA8ADA6775C389D48239`。
- 旧问题顺序观察器未改、未跑，SHA-256 仍为 `830AF8C618B5DA7632135C475D16D4CDC57FCB17ED18BF0A20C6A589759DE885`。
- 旧问题状态观察器未改、未跑，SHA-256 仍为 `61B17DF2E15533A33656D992CA4EC7DD48B145E843754D89EA59622A84FBA076`。
- README、固定输入、B entry 和 B pins 未改、未刷新；已读哈希仍分别为 README `6CCFFC636408D8A4A5FBCC29A543730E66627DD3EB0B67792E793F5394DFDADA`、fixed inputs `BD26B55780DB28D3EEB9D47ADC60034EDF76A340A9111EB18D93FB5AF94D253E`、B entry `AC7CCB2607FFC52C55C1E29BA84E3D6A5F8294937C3F93F3339988762649AB84`、B pins `CCB030E6A47D2ECD61852085A990459F0C02ECA982D748F17F00563A4E0C3B5B`。
- 已用只读逐文件差分确认：consumer 相对输入副本只有一行变化；新测试相对 manual38 只有一处导入新增和文件尾部追加。
- 已完成的操作仅限文件读取、文本查找、只读逐文件差和 SHA-256。没有运行新测试、旧测试、Node、tsx、Python、TypeScript 解析器、AST/VM 执行、导入、编译、构建、prepare、HTTP、服务、探针、模型、GUI、SSH 或真实案卷。

## Git 与阻碍

- 默认只读 `git status --short --branch` 因受保护子模块 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-A\modules\dsh` 权限拒绝而失败。没有修权限、ACL、锁或审批，也没有拆 writer 锁。
- Git 严格只读；没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push，因此没有提交 SHA。
- 既有 296816 字节 `A-dirty-before.txt` 作为 dirty 保全入口保留；未覆盖其中任何旧状态或正式证据。
- 执行偏差：四次只读命令的 shell 参数误填为 `bash`，运行器均在启动前返回 `ACCESS_DENIED`，没有执行命令、没有改变文件；后续命令均使用正式执行令指定的 native `pwsh`。

## Root 后续硬门与结论

1. Root 先完整阅读新测试源码和本次全部命令，再做源码反向核对。
2. Root 在本次源码身份上运行新 focused test；本交回不能代替该运行结果。
3. 若通过，再按 Root 的正式流程处理真实工作流复跑；不把本次修正扩大为完整 T18、红绿盲测、DOCX/JSONL 重开或发布通过。

Gate 1、完整 T18 和项目完成状态未因本次交回改变；Packaging 继续 **HOLD**。
