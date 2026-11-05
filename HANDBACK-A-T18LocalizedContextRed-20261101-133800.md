# A 线交回：T18 localized complete question-context

状态：`AUTHORED_NOT_RUN`  
Runtime 命令数：`0`  
预期 Root 判定：Red 2（本执行者未运行，不声称已观测）

## 修改范围

- 仅追加：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts`
- 新增一个测试块：`T18 localized complete question-context`
- 原有 12,552 字节前缀及既有 15 个测试保持不变
- 未修改产品代码、既有断言、Spec、契约或其他文件

## 新增断言

- 使用既有 `started`、`answerDefenseQuestions`、`runSearch`、`readReplyFor`、`MemoryCore` 辅助器。
- 合成材料名为 `借条`，请求精确为 `{ name: "借条", start: 14, end: 18 }`。
- `it.each` 覆盖两条路径，共 2 个用例：
  1. `preTool` 返回 `allow` 后调用 `executeTool`；
  2. 直接调用 `executeTool`。
- 两条路径均先完成真实合成必问回答，并使合成 `case_search` 成功。
- `MemoryCore.readReply` 使用同一 `start: 14`、`end: 18` 的合成响应。
- 断言只转发一次精确 `14..18` 参数，不发生缺省读取整份材料。
- 断言返回对象与提供的合成 `readReply` 完全相同，包含未变的 14..18 原文。

这里的 `MemoryCore` 是既有测试替身，不代表真实文件系统材料已交付。

## 目标冻结信息

- 路径：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts`
- SizeBytes：`14244`
- SHA256：`BA3DA406F1135059159C79C64A7B9E1981B0364B957F3CB31736736A9E50D2E9`

## 运行与 Git

按令禁止 Node、Python、解析器、测试、检查、构建、收集、模型、HTTP、GUI、凭据及 runtime，因此未产生运行日志或截图。Git 仅按只读边界处理，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
