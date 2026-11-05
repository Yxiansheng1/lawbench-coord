# A 线交回：FullRegressionLiveProvider-20261031-140835

## 结论

已按执行令完成唯一一处测试源码修正，状态为 **source-only / authored / not run**。没有修改产品源码，没有运行测试或自检，没有执行任何 Git 操作，也不声称产品缺陷已修复或现场已转绿。

## 唯一修改

文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\live-writer.spec.ts`

字面替换：

```diff
-  ctx.llm.registerAdapter(['mock'], adapter)
+  ctx.llm.registerAdapter(['mock', 'lawfirm'], adapter)
```

仍使用 `boot` 中同一个已构造的内存 `DelayAdapter`；没有新增适配器、真实 provider、插件、Key 或模型调用。`preStep`、agent options、mock 默认值、local-route fixture、源码 R 行为、全部断言、时序、诊断/error 数组、文件哈希、旧路径写入检查和清理逻辑均保持原样。

## 根因反证

既有红测证据根：`DockFixtureReplay-root-20261031-140740`

诊断中的精确错误包括：

```text
LlmError:no adapter registered for provider "lawfirm"
```

现有主请求路由核对结果：

- `dsh-ext/agent/task-state.ts` 的本地路由 `routeTarget` 固定返回 `{ provider: 'lawfirm', model: 'qwen38-27b' }`。
- `dsh-ext/agent/index.ts` 的 `LegalAgent.request` 使用该 `routeTarget` 覆盖本轮 provider。
- 原测试 `boot` 只注册了 `['mock']`，但实际存在路由中的 provider 是 `lawfirm`。

因此这是测试替身注册不匹配：产品请求路由要求 `lawfirm`，测试假模型却只声明支持 `mock`。不是 missing Key，不是真实模型缺陷，也不据此宣称产品修复。

## 改动范围判断

`live-writer.spec.ts` 的所有相关用例均经同一个 `boot` 注册该同一个 `DelayAdapter`，所以按执行令只改这一处注册白名单，不逐用例修改。

## 既有状态

- 6 个 remote table cases now PASS
- 2 个 live cases FAIL
- 28 filtered
- source held
- 4 full OS gone

以上是从既有证据与执行令接续的状态，不是本次新跑结果。

## 保全与验证边界

- 修改前的原始测试快照已保全于：
  `D:\Lawbeach\lawbench-coord\FullRegressionLiveProviderInput-20261031-140835\before.ts`
- 未修改该快照；未重演旧开工、安装、调研或全量测试。
- 本次未运行任何测试、类型检查、构建、import、AST/parser、自检或应用；仅在命令结束时做一次最终元数据读取。
- 未接触真实模型、Key、环境变量或网络。
- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`，也未处理 `index.lock`、权限或审批。

## 遗留

该修改尚待获授权环境做必要的定向验证及最终回归；本次交回不包含新的红绿结论。
