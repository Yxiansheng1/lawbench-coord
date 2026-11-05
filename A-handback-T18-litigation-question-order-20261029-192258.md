# T18 诉讼文书“先问后读”交回

时间：2026-10-29  
状态：源码与聚焦测试已交付；按 SOURCEONLY 执行令未执行测试、构建或运行。

## 交付内容

1. `dsh-ext/agent/index.ts`
   - 新增并导出 `LITIGATION_DOCS_SKILL = 'litigation-docs'`，作为第八个既有必问 Skill 接入。
   - 仅在 begin Skill 为 `litigation-docs` 时开启 `questionsBeforeMaterialRead`。
   - `preTool` 与 `executeTool` 在预算、重复调用记录及 Core 调用前共同拒绝未答齐时的 `case_read_material`、`case_read_wiki`。
   - `case_search`、`case_list_materials`、`skill`、`ask_user_question` 仍可先行；既有草稿/修改清单与未完成草稿闸门保持不变。
   - 新增独立读取拒绝提示；原 `questionRequirementDenial` 与 `invalidQuestionAskDenial` 文案未改。
2. `dsh-ext/agent/task-state.ts`
   - 在既有构造参数尾部追加只读布尔 `questionsBeforeMaterialRead = false`；未重排或改变 `draftFeedbackRecovery`。
3. `dsh-ext/tests/litigation-question-order-20261029-192258.spec.ts`
   - 使用实际 Host 四问元数据和真实 `ask_user_question` schema、ToolRuntime、UserQuestionService。
   - 覆盖未答时读取/写入拒绝、零新增 Core 调用、预算不变、检索/清单/Skill 可用、错误结果不解锁、联合四项回答解锁，以及默认关闭、既有七类 Skill、NONE 和目录不可用边界。

## 基线与新哈希

开工时两份正式源钉均匹配：

- `index.ts`：46958 bytes，`442b67e8573f93647c1eac00e4ed810f3820bca7dcd8c4c515287aa94d81d3b1`
- `task-state.ts`：21264 bytes，`fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b`

交回文件：

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`：48102 bytes，`BA30EFF62C89E2969CAFFA37FEB6EEDF5EA4AF6DDEBE5DB426D4DCB3F238E014`
- `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts`：21427 bytes，`B111686981B2B14CCE2EEFDCC721C55C03D2BCC367D20DA343B34953E66D5D3B`
- `D:\Lawbeach\lawbench-A\dsh-ext\tests\litigation-question-order-20261029-192258.spec.ts`：25694 bytes，`58576D67EEFD99D1B40139A0D82AA7B5462D485D4A2017DA134A305108584EBF`

## 验证与限制

- 已完成指定 Skill 根文件全文读取、源钉/dirty 清单核对、源码静态走查和最终 SHA-256 复核。
- 按执行令未运行 Node/Python/tsx、测试、类型检查、构建、导入、HTTP、模型或原生恢复；因此不宣称测试通过，待 Root/DS 在私有配置与冻结构建链中执行。
- 只读 `git status --short --branch` 被拒：`cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。未改权限、锁、审批或 ACL，未执行任何 Git 写操作，故无提交 SHA。
- 过程偏差：两次只读文本探测误将执行 shell 配为 `bash`，运行器均在执行前以 `E_ACCESS_DENIED` 拒绝；未执行命令、未改变文件，随后已用指定原生 `pwsh` 完成静态核对。

## 遗留

- 本轮为 SOURCEONLY；聚焦测试尚未运行，最终运行时证据需由 Root/DS 后续链路产生。
