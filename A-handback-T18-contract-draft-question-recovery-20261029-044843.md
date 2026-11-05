# A 线交回：T18 合同起草必问与保存反馈回收

状态：**A 线有界实现与定向测试已交回；未运行、未提交；等待新 agent 树负责人验证。**

## 工单与结果

- 任务入口：`D:\Lawbeach\lawbench-coord\A-T18-contract-draft-question-recovery-order-20261029-044843.md`。
- 结果：现有必问闸门和保存反馈回收已以最小差异扩展到 `contract-draft`；产品运行时 0，未执行测试、类型检查、构建、HTTP、模型或 GUI。
- 提交：无。Git 严格只读，未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 交付说明与完整命令/哈希/边界：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftQuestionRecovery-20261029-044843\README.md`。

## 文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 46547 | `40AB48B82A3BB8B1AE488DAA1BA930924D1B8B292AA70114BF317E9A633D5794` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\contract-draft-question-recovery.spec.ts` | 18087 | `CB70095ABD6D1B216E9D9A2011C587C26054F6FF6E5576FDAD9B0F03CD517928` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftQuestionRecovery-20261029-044843\README.md` | 9422 | `E9B6F2C66843B37DED722FBFABE9CC82873F077C4C3F0C76EBFA2A293821C033` |

`index.ts` 相对开工固定输入只新增 `CONTRACT_DRAFT_SKILL`、加入既有 `REQUIRED_QUESTION_SKILLS`、把既有 `draftFeedbackRecovery` 快照条件扩为 `contract-review || contract-draft`，并同步三处注释。`DRAFT_FEEDBACK_NOTICE` 文本逐行一致，SHA-256 两侧均为 `0ED416EBC61B4D7A07BEFC718BB988DDDCBEC329FC19028BDD4B0C8C76EF8E00`。

`task-state.ts`、Host、B、UI、旧测试、两版 Skill、结束原因、引用分类、全局设置和运行参数均未改。开工 dirty 快照保留在输入包，未清理。

## 新增测试覆盖

`dsh-ext\tests\contract-draft-question-recovery.spec.ts` 含 7 个定向用例，覆盖：

- 当前 Host 实际机器目录返回 `our_party`、`doc_scope`、`deal_terms`，flags 为 `false/false/true`，并原样绑定 `TaskState`。
- 回答前草稿和修改清单被拒且不写 Core；三项非空结构化答案后解锁。
- 错问、取消、旧任务迟到结果不能解锁新任务。
- Host 能力不可用时 fail closed。
- 校验成功的非空 `problems` 在下一次预算允许 pre-step 只提示一次；重复同题、换问题、换版本不重排。
- 干净、失败、无效结果不误提示；预算拒绝不消费提示、不增加 Core 或模型调用。
- 旧任务迟到保存不污染新任务；其它 Skill 不受影响。

测试通过现有 typed fake Core、契约样例和真实 Host 目录解析，无真实网络或服务。

## 阻碍与遗留

- `git status --short --branch` 因外层 worktree 子模块路径权限被拒，退出码 1；未修锁、权限或 ACL。
- 一次 shell 选择器误写为非 PowerShell，环境在命令执行前拒绝，未执行命令或改状态；其余命令均用指定 `pwsh`。
- 原始真实 run 仍是 `FAILED`：`ask_user_question=0`，21 条 hints 未处理并重存；业务质量仍需人工复核。
- 本作业未做新 agent 树准入、private25 构建、static 25 source bindings、新编译候选或真实模型复测；不得把这些步骤视为已完成。
- 本次只核当前 B Skill 的三项机器键和 flags，不声称覆盖完整 Skill 正文；两版 Skill 未同步。
- Gate 1、完整 T18、整个项目和 Packaging 均未因本交回变为通过；Packaging 仍为 HOLD。
