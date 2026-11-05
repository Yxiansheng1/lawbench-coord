# A 线交回：T18 刑事申请必问闸门

日期：2026-10-29 15:06:49（Asia/Taipei）

执行令：`D:\Lawbeach\lawbench-coord\A-T18-criminal-application-question-gate-order-20261029-150420.md`

## 结论

状态：`AUTHORED_NOT_RUN / ROOT_REVIEW_REQUIRED`

产品和单测源码已按令写入，实际运行次数为 0。本次静态核对不构成测试通过，也不构成业务验收；原实际根场景的 `FAILED` 结论、报告和原始材料均保持原样。Git 仅读，未暂存、未提交。

## 四问

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在现有 Skill 常量后新增 `CRIMINAL_APPLICATIONS_SKILL`，并把该常量追加到现有必问技能集合；只同步两处说明该集合的既有注释。另按旧质证必问测试的五种结构写了一份刑事申请专项测试，使用真实 Host 技能目录的 `doc_type`、`authority` 两项和来源标记 `false/true`。 |
| 目标是什么 | 让实际返回 `skill=criminal-applications` 的任务进入既有必问闸门，在联合回答前拒绝草稿和修改清单写入；同时不改变空目录合法、自由对话、其他工具、错误文案、预算与持久化逻辑。当前离终门还差主编排源码复核、新测试及类型/全量源码核对、私有树接线和一次新的实际业务运行。 |
| 在等什么 | 等主编排在只读复核后给出源码/测试结论和有限运行结果。信号是这五个测试结构及必要回归均通过；届时才进入新字面量 agent 树、单次 private25 编译、精确 consumer pins 和一次规范实际保存业务运行。若复核发现问题，信号会回到本测试与两处源码修改的定点返修。 |
| 卡在哪 | 本执行者按令不得运行测试、导入、解析器、构建或实际模型，因此没有运行侧结果；业务质量还缺主编排后续实际运行和律师手工复核。普通全仓 `git status` 因 `dsh` 子模块工作树只读权限返回失败，`--ignore-submodules=all` 的只读状态可读取；这不是交付阻碍，未改权限、锁或审批。 |

## 改动与静态证据

| 对象 | 字节 | SHA-256 | 说明 |
|---|---:|---|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 46809 | `ce2493cb60e652195779394bff50819924ceeff64e5bcf63e859928eb2c87294` | 冻结基线 46684 字节，差异仅新增常量、集合末项及两处必问技能注释 |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\criminal-application-question-gate-20261029-150420.spec.ts` | 17714 | `e73983461b33dcb1e141cb5e34859f7baca6faced73b1001d5fde73c93e39540` | 新测试，包含 4 个内存/受控单元结构及 1 个真实 ToolRuntime 接线结构 |
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` | 与冻结快照逐字节一致 |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\cross-exam-question-gate-20261029-121018.spec.ts` | 17345 | `670c9f5573ec8530e088a3735b68aca2c63efbb0a94b3927c825ef24f186870c` | 与协调目录基线逐字节一致，未改旧测试 |
| `D:\Lawbeach\lawbench-coord\T18CriminalApplicationQuestionGateInput-20261029-150420\index.ts` | 46684 | `5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c` | 冻结 agent 基线 |

新测试沿用旧测试的五个运行形态：未答时 Core/预算前拒绝与直接执行守卫；空、未知、重复、漏项、空 ID 或空问题文本拒绝；失败、取消、旧任务晚到结果不解锁且同一任务联合成功结果放行；Host 缺失或目录畸形时失败关闭而显式空目录仍合法；实际 ToolRuntime 先拒写、一次联合问答后放行保存。测试只使用受控 Core、内存观察和实际 ToolRuntime 接线，不包含 Native 会话、模型调用或真实 HTTP。

## 复用与实际失败入口

原实际根场景证据继续引用，不重跑：

`D:\Lawbeach\lawbench-coord\T18CriminalApplicationQuestionGateInput-20261029-150420\T18-criminal-application-actual-root-closed-current.json`

该证据记录的现状仍是实际运行约 67.156 秒、自然语言 1/8、8 次模型 POST 且均 HTTP 200、7 个完成块；工具读取为 1 次技能加载、1 次清单、3 次读取、2 次存稿，联合问答为 0。新源码修复的是该次实际运行暴露的第六个 Skill 未进入既有必问闸门问题，不改旧证据，也不从静态源码推导业务通过。

冻结的 A 线脏项快照：

`D:\Lawbeach\lawbench-coord\T18CriminalApplicationQuestionGateInput-20261029-150420\A-tracked-dirty-pins.json`

本次没有覆盖快照中的既有 dirty。只读状态中本次任务相关的新增变化限于上述 `index.ts` 修改和上述新测试未跟踪文件；其余脏项均保留。

## 依据与验证

- 首件读取了正式执行令，后续所有命令均使用指定原生 PowerShell 绝对路径、`login=false`。
- `git diff --no-index` 对冻结 `index.ts` 与新文件的静态差异只显示：新增常量、集合末项追加、两处既有注释同步。
- `Get-FileHash` 证明 `task-state.ts` 和旧质证测试与协调目录冻结副本一致。
- `git status --short --ignore-submodules=all` 成功；普通 `git status --short` 在 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 处 `Permission denied`。
- 本次共发起 23 次原生 PowerShell `exec_command` 调用；2 次非零，分别是上述只读 Git 状态权限失败，以及只读 `git diff --no-index` 按预期以差异码 1 返回。其余均返回 0。

## 未做与降级

- Node、Python、tsx、TypeScript 解析器、import、类型检查、测试、构建、HTTP、模型、GUI、SSH、Key/DPAPI、进程或端口探测次数均为 0。
- 没有运行新测试或任何旧测试；没有执行全量回归、契约自检、docs/Skill 构建或私有树编译。
- 没有修改产品其他文件、TaskState、类型契约、UI、旧测试、Skill、contracts、SDK、loader、配置、私有 25、agent 树、manifest、默认库或运行时 pin。
- 没有执行 Git `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；没有暂存内容。
- 没有给出语义 NLP、golden matching、prompt 变体、模型预算提升或全业务 `PASS`。
- 未做律师手工业务复核；实际问答和草稿质量仍须后续实际运行后人工判断。

## 下一步建议

主编排先只读复核本次 4 处源码差异和新测试的五个结构，再在获准运行环境执行该测试及必要的类型/全量源码核对。只有这一步通过，才按令批准新字面量 agent 树，随后做一次 private25 编译、精确 consumer pins 和一次规范的实际保存 DPAPI 运行；实际问答与草稿仍由主编排和律师复核。当前不需要本执行者再改权限、锁、审批或 Git 状态。

Response ID: `A-T18-criminal-application-question-gate-20261029-150420`

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T18-criminal-application-question-gate-20261029-150420.md`
