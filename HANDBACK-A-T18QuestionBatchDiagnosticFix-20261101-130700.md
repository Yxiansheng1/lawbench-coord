# HANDBACK-A T18 Question Batch Diagnostic Fix

状态：完成（仅改源码；authored-not-run；runtime=0）

## 交付范围

仅修改以下两个目标文件，保持原有 dirty 工作树和既有来源不变。

### 1. `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`

精确两处产品补丁：

1. `INVALID_QUESTION_ASK` 的值替换为执行令给定的、使用 JS Unicode 转义的精确运行时中文字符串；未增加换行。
2. `preTool` 的 `ask_user_question` 参数无效拒绝分支删除 `question.reason === 'missing_questions' ? questionRequirementDenial(...) : ...` 三元映射，改为无条件：

   ```ts
   reason: invalidQuestionAskDenial(question.missingIds),
   ```

未修改 `captureQuestionAsk`、`TaskState`、谓词、required IDs、pending、最终答复校验、预算、读写闸门、SDK、end helper 或 Skill。此次补丁只修诊断提示，不放行 partial ask，也不允许伪造答案。

### 2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-question-gate-20261029-172117.spec.ts`

仅补回追加用例的显式 TypeScript 参数类型，运行时、测试体与断言均未改变：

```ts
async (provided: (typeof QUESTIONS)[number]) =>
```

原正文与追加的三组诊断用例保留。

## 验证与禁区

- 未运行 Node、Python、TypeScript parser、测试、check、build、collect。
- 未调用模型、HTTP、GUI 或凭据。
- 未执行任何 Git 命令，未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未修改沙箱、审批、ACL 或 writer lock。
- 因而这是 `authored-not-run`，运行时结果数：0。

## 最终目标文件标识

```text
D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts	59842	0A4679589F407164E04675D97749F7671541B440315102A9BFFBB22367D54178
D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-question-gate-20261029-172117.spec.ts	22408	FF05C2260DFBB01C9466FB019282B276973CDECC9CF8DA7192BD0B7D6F344097
```

SHA-256 为大写；第二列为字节数。

## 说明

正式执行令将测试目标简写为 `test`。依据执行令允许读取测试末 70 行，目标定位为 `dsh-ext\tests\defense-question-gate-20261029-172117.spec.ts`；其末段正是追加的三组 `it.each` 真实 ToolRuntime 诊断用例，与执行令所述“same3 body”和缺显式类型一致。
