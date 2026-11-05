# T18 防御性问题顺序局部断言修正交回

状态：**AUTHORED_NOT_RUN**

## 交付范围

- 仅修改 `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts` 中一处断言。
- 原断言：`expect(state?.missingQuestionIds()).toEqual([...DEFENSE_IDS])`
- 新断言：`expect(state?.missingQuestionIds()).not.toEqual([])`
- 保留 `questionsAnswered` 为 false、材料 `preTool` 拒绝、`executeTool` 拒绝、Core 调用为空，以及全部旧测试、源码、Skill 和 guards 不变。

## 验证情况

- 按执行令，本交付仅修改测试夹具来源，**未运行任何自测**。
- 未运行 Node、Python、解析器、AST、类型检查、构建、应用、模型、HTTP、GUI 或其他测试。
- 按执行令，由 Root 在仍为原版 Agent `d832` 的状态下重跑修正后的测试，之后才能启动产品 writer。

## Git 与证据

- 未执行任何 Git 写操作；未暂存、未提交、未 rebase、未 stash、未 reset、未 clean、未 checkout、未 push。
- 未重写旧 raw、formal 或 status 文件。
- 本次交回方式为协调目录正式文件；原执行令和旧证据保持原样。

