# HANDBACK-A T18 Defense Search Fixture Order

状态：`AUTHORED_NOT_RUN/staticorderingfix.90s`

执行依据：

- `D:\Lawbeach\lawbench-coord\ORCH-A-T18DefenseSearchFixtureOrder-20261101-030039.md`
- 目标文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts`

## 改动

仅移动一个既有调用行，未增删其中的表达、断言、夹具或测试：

```ts
await agent.executeTool(SESSION, 'case_search', { query: '合成辩护事实' })
```

该调用现位于正例 `三项真实最终回答齐全后才解锁当前任务的材料、Wiki 与既有写入闸门` 中首个 `case_read_material` 的 `preTool` 允许断言之前。当前顺序为：

1. `case_search` 成功执行；
2. `case_read_material` 的 `preTool` 允许断言；
3. `case_read_wiki` 的 `preTool` 允许断言；
4. 依次执行 `case_read_material`、`case_read_wiki`。

除上述单行位置外，没有修改产品源码、测试夹具、测试数量或其他断言。

## 验证

- 已静态回读目标正例，确认移动后的顺序与执行令一致。
- 按令未运行 Node、Python、解析器、AST、测试、构建、应用、模型、HTTP、GUI、环境变量或凭据操作。
- 本交回件属于静态顺序修复证据，不代表测试已运行或已通过。

## Git 与工作区

- Git 仅执行一次只读的最终测试文件对象 SHA 计算：`git hash-object -- dsh-ext/tests/defense-read-question-order-20261031-224957.spec.ts`。
- 最终测试文件对象 SHA：`c4d6efdccfb84d95f0bbc1ce6e1177574c45a0e0`
- 未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存、未提交、未修改索引、未拆 writer 锁。
- 既有 dirty 状态只按令对上述测试文件作单行移动，其他既有改动均未处置。

## 阻碍

无。按令在正式交回后停止。
