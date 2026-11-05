# A 线交回：T18 General 先问后读 RED

状态：`TEST_SOURCE_COMPLETE / DELIVERY_READY / NOT_EXECUTED`

## 产物

- 新测试：`D:\Lawbeach\lawbench-A\dsh-ext\tests\general-read-question-order-20261030-163023.spec.ts`
  - 14,107 bytes；377 行；SHA-256 `AD772E1629D2A1F4C048403A03F135E6707F355659CBA6B02D8CDBD0572979E3`
- 正式交回：本文件
- 产品、旧测试、Skill、契约、库、参数和证据目录均未由本任务改写。

## 既有状态与证据复用

- 已读取批准输入快照，并核对 source pins；六份指定源码的 SHA-256 均与批准值一致：
  - `dsh-ext\agent\index.ts`：`E78789E20DC9E015664D41CEBC1B55097C6A70BA6E85CE221006D5D06A23BBEC`
  - `dsh-ext\agent\task-state.ts`：`82121824045EEE3E4E816CAA5C066152B7E00681C39C207D49F562B399801815`
  - `general-drafting-question-gate.spec.ts`：`C14BCE581CFE033AB7A4CC6192AB8A3920C402094F16BF1B0F0A1445A499076A`
  - `litigation-question-order-20261029-192258.spec.ts`：`58576D67EEFD99D1B40139A0D82AA7B5462D485D4A2017DA134A305108584EBF`
  - A 线 General Skill：`A7BE13FD93BE6F6FE5FF97606CB6018F9F1B2795D4F700C00AE1930383B52F9A`
  - B 线 General Skill：`2A167B44F4DA3CDE768834D9A476F2A252C8CF3138CBA61F48D99BBF7214FE31`
- 复用已批准的实际失败审计：Actual/Native 63 events、64 rows 中，五次材料读取 seq 18/20/22/24/26 早于有效提问 seq 36/回答 seq 37；保存 seq 31 被拒，四份有效保存 seq 41/46/51/56 均发生在回答之后。既有证据未重跑、未覆盖。
- A/B 两份实际 `general-drafting` Skill 的必问项均为 `doc_type`、`recipient`、`goal`，`fromMaterials` 均为 `false/true/false`。

## 新测试覆盖

1. 从 A、B 两处实际 Skill 目录读取同一个 General 必问答案集。
2. General 未答齐时：
   - `case_read_material`、`case_read_wiki` 的 `preTool` 均拒绝；
   - 直接 `executeTool` 亦拒绝；
   - 不进入 Core，不增加工具/模型调用数，不触发预算。
3. 未答齐时，`case_search`、`case_list_materials`、`skill`、`ask_user_question` 仍允许。
4. 既有草稿写入闸门保持：草稿和修改清单在回答前仍拒绝。
5. 只接受当前任务、当前会话、当前 `callId/token` 的成功最终答案；三项非空回答齐全后，材料、Wiki 和写入同时解锁。
6. 部分回答、错误 ID、空白回答、错误结果、取消后迟到结果均不解锁。
7. 旧任务迟到结果、跨会话结果、被新 `TaskState` 替换后的旧状态均不解锁新任务。
8. `litigation-docs` 仍为先问后读；`contract-review`、NONE 和 `TaskState` 默认值不被全局扩张。

测试只使用既有的 `LegalAgent`、`TaskState`、`observeToolResult` 最终结果观察接口和实际 Host 的 `skillQuestions` 解析；Core 是显式的合成内存替身，未伪造 Native、HTTP 服务、Key 或 GUI。

## 对未修改产品的预期 RED

当前 `dsh-ext\agent\index.ts` 的 `TaskState` 构造参数把 `questionsBeforeMaterialRead` 固定为仅 `litigation-docs` 为真。General 虽已有实际三项必问和草稿写入闸门，但未启用材料/Wiki 读取闸门。

因此新测试在 General 未答齐时预期 `preTool`/直调拒绝；在未修改的 source pin 上会失败，且 General 的读取会放行并到达合成 Core。这不是只断言构造表达式，而是直接观察双入口行为、Core 调用和预算是否保持不变。

后续最小修复保持不变：在现有构造布尔值中加入 `GENERAL_DRAFTING_SKILL`，与 `LITIGATION_DOCS_SKILL` 并列；无需 TaskState、API、Host、UI、SDK、store、参数或闸门框架改动。

## 验证边界

- 本任务严格按令未运行 tests；未运行 Node、Python、import、AST/parser、check、build、setup、HTTP、model、GUI、Key/credential、Native 或任何全量验证。
- 旧 General 写入测试和诉讼测试未重跑，故本次不能声称它们已 GREEN；其源文件 SHA-256 与本令批准值一致，待 root 在修复后一并跑聚焦 GREEN/types。
- Git 只做只读检查，零 `add`、零提交、零 rebase、零 stash、零 reset、零 clean、零 checkout、零 push。
- 首次 `git status --short --branch` 因父仓子模块 `dsh` 目录权限被拒绝；随后用 `--ignore-submodules=all` 只读确认工作树存在大量既有 dirty 修改/未跟踪项，本任务未触碰。未修复权限、锁、审批或 ACL。
- 两次辅助读取误把 `exec_command` 的 shell 参数设为 `bash`；均在启动阶段被 managed MXC/sandbox 拒绝（一次 access denied、一次 packaged-app restriction），未读取、未执行、未写入。之后所有命令均显式使用指定原生 PowerShell。

## 待 root

1. 对 source pin `e787...` 运行本新测试，取得 bounded focused RED。
2. 只加入上述一个 General 条件。
3. 重跑本测试、既有 General 写入测试和诉讼测试，并做 types/GREEN。
