# T18 运行时注入测试修复交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 只修改运行时测试源码三处：导入实际生产 `inject` 元数据并传入现有插件启动对象，以及为 Core 调用替身的 `command`、`body` 补显式类型。 |
| 目标是什么 | 修复 8 个集成测试在实际提问体前因测试启动夹具漏传注入元数据而失败的问题，并消除两处 `TS7006`。 |
| 在等什么 | 等主控执行该运行时测试与类型检查。预期信号是实际测试输出与类型输出；本线不根据静态差异冒充绿灯。 |
| 卡在哪 | 没有交付卡点。执行令禁止作者运行时，因此测试和类型检查未跑，这是验证边界，不是环境故障。 |

## 依据

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-question-runtime-inject-order-20261028-184948.md`
- 根代理原始结果：`D:\Lawbeach\lawbench-coord\T18QuestionRuntimeInjectInput-20261028-184948\actual-test-results.json`
- 根代理原始类型输出：`D:\Lawbeach\lawbench-coord\T18QuestionRuntimeInjectInput-20261028-184948\actual-types.txt`
- dirty 保全快照：`D:\Lawbeach\lawbench-coord\T18QuestionRuntimeInjectInput-20261028-184948\A-dirty-before.txt`
- 精确修复说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractQuestionGate-20261028-174016\运行时注入测试修复-20261028-184948.md`

## 有界改动

唯一修改的源码文件是 `D:\Lawbeach\lawbench-A\dsh-ext\tests\contract-question-gate-runtime.spec.ts`。

```diff
   apply as applyLegalAgent,
+  inject as legalAgentInject,
   name as legalAgentName,

-  const coreCall = vi.spyOn(CoreClient.prototype, 'call').mockImplementation(async (command, body) => {
+  const coreCall = vi.spyOn(CoreClient.prototype, 'call').mockImplementation(async (command: string, body: Record<string, unknown>) => {

-    await ctx.plugin({ name: legalAgentName, apply: applyLegalAgent }, {
+    await ctx.plugin({ name: legalAgentName, inject: legalAgentInject, apply: applyLegalAgent }, {
```

没有改产品代码、SDK、提示词、预算、参数、技能、契约、消费方、旧测试断言、测试问题体或测试数量；没有加入 `as any`、忽略指令、跳过设置或断言放宽。

## 文件身份与原位可逆性

| 文件与状态 | 字节 | SHA-256 |
|---|---:|---|
| 协调目录保留的修复前测试副本 | 15307 | `474839258f5e4dc3436482824ae9574acceb46471a26e7a1e3ae1c25a35da85c` |
| 当前测试源码 | 15396 | `3708c9d262970124e2f2776cc60a761ec9a50b32d6b3cdcc0c652e6933807050` |
| `dsh-ext/agent/index.ts` 修复前与修复后 | 44666 | `4f652150927692c5230bd7ec5d517fdec2f45e35839fefd017d3e6d0aa3c922c` |

修复前测试副本原样保留，将该副本换回当前测试路径即可按字节恢复修复前状态。产品 Agent 文件修复前后字节和哈希完全一致；本任务没有其他源码增量。

## 静态验证

- `git diff --no-index` 仅显示上述三个表达式，所有测试正文与断言保持原样。
- 对危险类型/跳过模式、行尾空白的只读扫描均无匹配；对应 `rg` 退出 `1` 为预期负向结果。
- 目标路径只读 Git 状态中，`agent/index.ts` 仍是既有 `M`，测试文件仍是既有 `??`；没有新增产品文件改动。
- 只读 `HEAD`：`a23271abee333a9a256fd46a3141da16975c2380`。
- 没有产生提交 SHA；Git 写入不在本运行授权内，严格只读。

## 运行与写入面

Node、Python、Vitest、tsc、parser、AST、import、prepare、serve、probe、HTTP、模型、GUI、SSH、build、selftest 全部未运行。作者运行时调用为 **0**。

本任务只写：

- `dsh-ext/tests/contract-question-gate-runtime.spec.ts`
- 本执行目录下的 `运行时注入测试修复-20261028-184948.md`
- 本交回件

未改旧 README、旧返修说明、原始结果、类型输出、dirty 快照或其他聊天状态。未接触凭据、环境密钥、DPAPI、真实案卷，未改沙箱、审批、ACL、Git 锁或 writer。

## 遗留

主控仍需执行 `contract-question-gate-runtime.spec.ts` 与类型检查，并以实际输出判断修复是否成立。当前状态为 `TEST_SOURCE_FIXED / RUNTIME_NOT_RUN / PACKAGING_HOLD`；不宣称 8 个集成测试通过、类型检查通过、T18 全量通过或可发版。Gate1 与全项目未完成。
