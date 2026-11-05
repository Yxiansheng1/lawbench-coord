# A 线交回：X7 参数夹具修正

日期：2026-10-31  
执行者：A 线 `deepseek-v4.1-flash-1017`（原生 MXC，managed 隔离）  
性质：SOURCE ONLY / test-fixture-only / authored-not-run

## 1. 入口、边界与既有证据

- 本次唯一入口为 `ORCH-A-FullRegressionX7Params-20261031-134154.md`，并只核对了相关测试源码、`contracts/common.schema.json` 与 `contracts/api/task_current.schema.json`。
- 沿用既有原始证据，不重演开工、安装、调研或全量测试：original 135 项为 133 PASS、2 FAIL、0 待定、类型错误 0，`source_changes` 为空。本次没有产生新的运行证据。
- 编辑前，`dsh-ext/tests/dock-review.spec.ts` 与指定快照 `FullRegressionX7ParamsInput-20261031-134154/before.ts` 的字节长度及 SHA-256 一致；未覆盖快照，未触碰其他 dirty 内容。
- 契约依据：`task_current.selection.params` 引用 `common.schema.json#/$defs/params`，该定义要求对象且不接纳 `null`；X7 原 mock 的 `params: null` 是纯夹具构造问题，不能据此认定生产缺陷。

## 2. 唯一源码改动

只修改 `dsh-ext/tests/dock-review.spec.ts` 的 X7 另一窗口 `svc.create` 调用：

```text
params: null
```

改为：

```text
params: svc.cur('S1')!.params
```

该值来自同一用例先前 `pick(A)` 并等待 600 ms 后已保存的规范化参数，因此同时保留合法对象参数，只改变另一窗口场景中的入口/技能为 B。其他 `svc.create` 调用、断言、时序、ROW 诊断、运行/拦下行为、测试 ID、产品或契约均未修改。

## 3. 声称与验证状态

- 已做：源码与契约只读核对、编辑前快照一致性核对、授权单字段文本修改。
- 未做：未运行测试、类型检查、构建、测试收集、自检、应用或 Runtime；未执行任何 Git 命令或 Git 写操作，因此没有提交 SHA。
- 不声称测试转绿、不声称全量通过、不声称存在生产修复。本交回只交付测试夹具修正源码和本文件。
- 后续 Root 应做 whole-byte inverse 核对，然后只重跑 X7 的两个既有用例，期望与原断言完全不变。若拒绝或无法执行，应准确记录为未运行，不启动 setup、不切 legacy、不扩权。

## 4. 文件清单

- 源码：`D:\Lawbeach\lawbench-A\dsh-ext\tests\dock-review.spec.ts`
- 原始快照：`D:\Lawbeach\lawbench-coord\FullRegressionX7ParamsInput-20261031-134154\before.ts`
- 交回：`D:\Lawbeach\lawbench-coord\A-handback-FullRegressionX7Params-20261031-134154.md`

Git 严格只读：未 add、commit、rebase、stash、reset、clean、checkout 或 push。
