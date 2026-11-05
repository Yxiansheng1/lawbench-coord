# 交回件：C 线独立复核 · T18 QuestionBatch 诊断修复

- 交回件：`HANDBACK-C-T18QuestionBatchIndependentReview-20261101-131100.md`
- 对应执行令：`ORCH-C-T18QuestionBatchIndependentReview-20261101-131100.md`
- 复核性质：**SOURCE REVIEW ONLY（仅源码审阅）**。本执行者 authored-not-run：**runtime = 0**，未运行任何测试、类型检查、构建、服务、HTTP、模型或 GUI 调用。
- 证据处理：既有“8 PASS / types0”按令**直接复用，未重跑**（源码未变、且令明确禁止重演）。
- Git：**严格只读**。未执行 add / commit / rebase / stash / reset / clean / checkout / push；未暂存、未提交。交回以本协调目录文件为唯一正式写动作，未改产品源码、测试或任何其他文件。

## 一、结论

**PASS（执行令要求的全部可核项通过）**，附两条未核限制（见第五节 L1、L2）与一条建议（第六节）。
本次改动确为“仅文案 + 错误映射”两处，未见闸门、ID、pending、final answer、安全或预算面改动。

## 二、旧 / 新产品差异核对（执行令首要项）

逐行比对 `T18QuestionBatchDiagnosticFix-20261101-130700-agent-before.txt`（旧）与当前 `dsh-ext\agent\index.ts`：旧 911 行、现 909 行，差异行恰为 2 处（行数净差 2 = 1 处 3 行换 1 行），无其它差异、无重排。

1. `index.ts:237`　`INVALID_QUESTION_ASK` 常量文案整体替换。
   - 旧：`ask_user_question 必须逐项使用本任务 Skill 声明的必问 ID，覆盖所有尚缺项；不得为空、重复或包含未声明 ID。还缺：`
   - 新：要求“一次调用、在 `questions` 数组内为每个尚缺 ID 分别提供一个对象、至少含 `id` 和 `question`、`options` 若提供也必须为对象数组、不得写成字符串或拆成多次、不得为空/重复/包含未声明 ID”，末尾仍接“必须覆盖：<尚缺 ID 列表>”。
2. `index.ts:583-591`　拒绝分支统一走 `invalidQuestionAskDenial(question.missingIds)`。
   - 旧：`question.reason === 'missing_questions' ? questionRequirementDenial(question.missingIds) : invalidQuestionAskDenial(question.missingIds)`
   - 新：无条件 `invalidQuestionAskDenial(question.missingIds)`（即 `missing_questions` 与 `invalid_question_ask` 两类原因映射到同一张新文案）。

影响面逐项确认：

- **拒绝语义未变**：两条路径仍是 `kind: 'deny'`，只是**拒绝文案**改变；没有任何 allow 路径被打开或关闭。
- **ID 校验未变**：`task-state.ts:302-339` `captureQuestionAsk` 仍只认本轮 Skill 声明 ID；空数组 / 缺 `id` / `question` 空 / 重复 ID / 未声明 ID → `invalid_question_ask`；覆盖不全 → `missing_questions`。尚缺 ID 列表仍由 `missingQuestionIds()` 产出并拼接进文案，信息未丢。
- **闸门与 pending 未变**：`ASK_USER_TOOL` 分支仍在预算、`pause()`、pending 之前返回；`pendingQuestionAsk` 仅在 allow 时写入；`cancelPendingQuestionAsk`（同 callId+token 才清）与 `acceptFinalQuestionAnswers`（taskId/caseId/callId/token 一致、`isError === false`、`answers` 数组结构、`selected` 字符串数组、`custom` 可选字符串、至少一个非空答案才计入）未改。
- **final answer 未变**：`observeToolResult` 只收现行任务 + 现行 callId/token + 成功结构化答案，逻辑未改。
- **安全未变**：拒绝文案只含问题 ID（律师 Skill 声明的必问 ID），不含材料名、检索词、模型输入输出；日志字段未变（仍为 `reason` + `missing` 数量）。无新增外连、无新增凭据读取。
- **预算未变**：`deliverableWriteGated` / `questionRequirementDenial` / `questionsBeforeReadDenial` / `questionRequirementDenial` 触发的写入与读材料闸门分支一行未动；`beforeTool` 计数顺序未动。

## 三、新文案与实际公开 API 的一致性

- 相符项：文案只把 `id` 与 `question` 说成**必需**，对其他字段用“若提供”的条件句，**未把可选字段变成硬要求**；旧文案的“不得为空、重复或包含未声明 ID”三条约束被完整保留；并新增了旧文案缺失的“一次调用 / questions 数组内每个尚缺 ID 各一个对象 / 不得拆成多次提问”的可操作指引；末尾仍附全部尚缺 ID。
- 允许范围内可见的运行时契约（`task-state.ts:309-330`）：问题对象只校验 `id`（非空字符串）与 `question`（trim 非空字符串），**`options` 完全不参与校验**；答案侧（`task-state.ts:365-380`）要求 `answers[].selected` 为字符串数组、`custom` 可选字符串。
- 未核项（不影响本次 PASS 范围，但需主编排收口）：`options` 的真实公开 schema（对象数组 vs 字符串数组）在本次允许读取的 4 处切片中**无任何源可证**。若公开契约中 `options` 实为字符串数组，新文案“options 若提供也必须为对象数组”会把模型引向错误形状。此项属文案层单点风险，不影响 id/question 的必需性判定。

## 四、测试面复核（`defense-question-gate-20261029-172117.spec.ts` 末 70 行）

- 三个 partial ask（`it.each(QUESTIONS)`，每次只声明 1 个 ID）：
  - `partial.isError === true`；
  - 回复正文含 `ask_user_question`、含 `questions`、含**全部**尚缺 ID；
  - 回复**不含**旧前缀 `提交成果前必须先取得律师对必问问题的真实回答。还缺：`（与新代码把 `missing_questions` 改映射到新文案一致）；
  - `env.answerCalls() === 0`（未进入回答回调）、`env.writes()` 为空；
  - 其后 `case_save_draft` 仍 `isError === true` 且 `writes()` 为空 → **写入仍被闸门拒绝**。
- 完整 3 问联合 ask：`isError === false`、`answerCalls() === 1`、`writes()` 仍为空（提问本身不写）；其后再 `case_save_draft` → `isError === false`、`writes()` 长度为 1 且工具名为 `case_save_draft` → **真实回答齐备后写入解锁**。
- “无 preanswered fixture”：在本可见切片内，partial ask 后回调计数为 0、联合 ask 后恰为 1，说明 partial 路径未命中任何已备好的答案；但 fixture 的构造定义位于允许切片之外（见 L2）。

## 五、限制（明确不作超出边界的声明）

- **L1**　本次为源码审阅，runtime = 0：未运行测试、类型检查、构建、collect、解析器、HTTP、模型或 GUI。“8 PASS / types0”属既有证据直接复用，未重跑、未复验。
- **L2**　允许读取仅为：`dsh-ext\agent\index.ts` 全文、旧 before 快照、`task-state.ts` 第 290-365 行、spec 末 70 行。因此 `task-state.ts` 其余部分、spec 前段（含 `structuredQuestions` / `askArgs` / fixture 构造）、`contracts\` 均未读；未做全仓检索或全文件差异，未验证 `options` 的公开 schema 与 fixture 是否预置答案。
- **L3**　不得据此声称“模型循环已修复”或“业务质量问题已解决”。本次可确认的只是**诊断与恢复控制**：错误提示能一次性说清“怎样提问才合法”、列出全部尚缺 ID、保持拒绝与写入闸门不松、并在补齐真实回答后解锁写入。真实模型是否据此一次传对、产出质量是否达标，本次无证据。
- **L4**　未核对外模型轮次（`modelToolsAllowed`）、外部路由与凭据路径；本次差异不触及这些面，仅作“不改动”记录。

## 六、建议（交主编排，非本执行者实施）

1. 用 `contracts\` 侧确认 `ask_user_question.questions[].options` 的公开类型。若非对象数组，仅回退新文案中该半句（其余部分、代码路径、闸门语义无需改动）；若确为对象数组，本文案可原样合流。
2. 除第 1 项外无改动建议：合流可按现状态推进。

---

交回人：C 线独立执行者（DeepSeek）。本文件为正式交回件，随本次运行结束停止；Git 只读，无提交动作。
