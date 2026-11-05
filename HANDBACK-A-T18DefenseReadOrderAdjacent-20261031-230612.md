# HANDBACK-A — T18 辩护先问后读相邻测试契约

状态：AUTHORED_NOT_RUN

## 精确变更

1. `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts`
   - 仅在 `partial`、`wrong`、`empty`、`error`、`cancel` 共用测试分支中，将材料读取拒绝断言由 `questionsBeforeReadDenial(DEFENSE_IDS)` 改为 `questionsBeforeReadDenial(state!.missingQuestionIds())`。
   - 将紧邻的非空缺项断言缩进从 2 个空格修正为同块既有的 6 个空格。
   - 保留 `questionsAnswered === false`、缺项非空、`preTool` 拒绝、直调拒绝及零 Core 调用断言。
2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\litigation-question-order-20261029-192258.spec.ts`
   - 将唯一的通用文书条件改为 `skill === GENERAL_DRAFTING_SKILL || skill === DEFENSE_OPINION_SKILL`，让现有 true 与双拒绝精确原因分支覆盖辩护意见。
   - 测试标题补入“辩护意见”，并将“通用”后的连接词调整为“、”。
   - 未删除、跳过或放宽任何断言。

## 验证状态

未运行运行时、测试、类型检查、构建或其它自测。测试契约已按执行令完成修改，运行时结果待主编排按既有授权流程验证。

## 边界声明

产品源码、Skills、SDK、guard、旧原始证据与状态文件均未改动。未执行任何 Git 写操作，也未创建提交。
