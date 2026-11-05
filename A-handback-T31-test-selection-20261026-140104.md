# A 交回：T31 普通/有限回归选择边界

状态：`SOURCE_COMPLETE`；选择器与文档 `NOT_RUN`；等待根侧独立复核和实际匹配/运行；`NOT_GUI`；`PACKAGING_HOLD`。

本单没有 Git 写入，因此没有提交 SHA。按执行令，Git 只做了只读状态与差异检查，未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`，也未检查或修改锁、权限、ACL 或审批配置。

## 精确改动

1. `D:\Lawbeach\lawbench-A\dsh-ext\vitest.config.mjs` 第 33 行新增且只新增：

```js
    exclude: ['**/node_modules/**', '**/.git/**', 'tests/t31-native-scope-http.spec.ts', 'tests/t31-ui-host-batch-http.spec.ts'],
```

`include`、插件、别名、全局、环境、超时和其余行保持不变。

2. `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scope-http.config.mjs` 第 43 行新增且只新增：

```js
    exclude: ['**/node_modules/**', '**/.git/**'],
```

继续展开 `baseConfig.test`，`include` 仍只有 `tests/t31-native-scope-http.spec.ts`；既有 source-mode decorator、tsconfig paths、aliases、plugins 和其余字节未改。

3. 新增 `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-ui-host-batch-http.config.mjs`，完整内容为：

```js
import baseConfig from './vitest.config.mjs'

export default {
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['tests/t31-ui-host-batch-http.spec.ts'],
    exclude: ['**/node_modules/**', '**/.git/**'],
  },
}
```

没有新增依赖、helper、loader、plugin、alias、environment shim 或 package script；测试文件的 `jsdom` pragma 未改。

4. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\UiHostBatchHttp-20261026-132736\README.md`：

- 第 3、5、6 行把既有运行证据与本次选择器状态分开：既有旧基础配置运行记为 `PASS`（1/5 HTTP），新选择器为 `NOT_RUN`。
- 第 20、22、24、25、27 行记录普通配置精确保留两项默认排除，并精确排除两条有限测试；目标 109 路径，等待根侧匹配。
- 第 29、31、32、34 行记录两个专项配置各只选一条自己的测试，缺口强制失败，不跳过、不伪造环境，通过也是 `NOT_GUI`。
- 第 85 行要求根侧复核两个专项配置。
- 第 115 行批次根命令改为：

```powershell
node ..\dsh\node_modules\vitest\vitest.mjs run --config vitest.t31-ui-host-batch-http.config.mjs tests\t31-ui-host-batch-http.spec.ts
```

- 第 118 行说明旧 scope 也只以 `--config vitest.t31-scope-http.config.mjs` 单文件显式执行；既有通过来自旧基础配置，不等于新批次选择器已通过。
- 第 140、145、146 行把原作者未运行说明标为历史，保留既有 PASS，未用新的 `NOT_RUN` 覆盖它。

允许范围外没有本单写入。两条 consumer 测试源码、产品/UI/Host/nativehooks/Bentry/auth/13routes/sourcepins/probe/E50/18frozen/private25outputs/privatebuilder/config/package manifests 均未改。

## 静态事实

根侧预检 `root-before-selection.json` 记录：

- 基础 `include` 为 `tests/**/*.spec.ts`、`tests/**/*.spec.tsx`。
- 默认 `exclude` 为 `**/node_modules/**`、`**/.git/**`。
- 安装的 Vitest 4.1.8 `globFiles/tinyglobby` 在改动前选中 111 条普通路径，两条有限测试均被选中。
- 缺失环境变量时两条 consumer 会在 `it()` 内失败，不能跳过或伪造。

静态源码核对：

- `tests/t31-native-scope-http.spec.ts` 第 45 行定义 `requiredEnv()`；第 52、65、194 行分别要求 `LB_SCOPE_HTTP_ROOT`、`LB_SCOPE_HTTP_PORT`、`LB_SCOPE_HTTP_TOKEN`；第 191 行有唯一 `it()`。
- `tests/t31-ui-host-batch-http.spec.ts` 第 54 行定义 `requiredEnv()`；第 61、74、82 行分别要求 `LB_BATCH_HTTP_ROOT`、`LB_BATCH_HTTP_PORT`、`LB_BATCH_HTTP_TOKEN`；第 267 行有唯一 `it()`。
- 冻结测试当前 SHA-256 分别为 `055D65BA57FA6E625FCC59D44A791C76C58F3E2889D65ADF9AA11EDC15B69EB1` 和 `69CC1C7D89DE7174012E579A5B8950064B701CA664EBB213160C4027070D5032`；本单没有目标写入这两份文件。

改后文件 SHA-256：

- `vitest.config.mjs`：`62E4D81D88C1500F03805C4E76D030A9837065E960D1EFE7935A039DA91B3FBF`
- `vitest.t31-scope-http.config.mjs`：`CA433F29E9D5A7228EDA2CC70447EEED23E8947BC6224E69274AB4C38079F629`
- `vitest.t31-ui-host-batch-http.config.mjs`：`136AF4471728CB82B0F3CE2863EBAD64F56A6EAD887368E3C1673100CF13FAC5`
- `README.md`：`C224302B73423F02EA230DB791FFDFBDFCCFFFB7136EA7F8C37BE46961D71A12`

`git diff --check --ignore-submodules=all -- dsh-ext/vitest.config.mjs` 退出 0，无输出。

## 根侧待验证

以下均为待验证目标，不是作者已观测结果：

- 普通匹配恰为 109 条，且不含两条有限测试。
- 旧 scope 专项恰选 1 条 `tests/t31-native-scope-http.spec.ts`。
- 新批次专项恰选 1 条 `tests/t31-ui-host-batch-http.spec.ts`。
- 其余 109 条普通路径与改动前逐路径相同。
- 根侧使用安装的 Vitest `filesOnly/list` 语义验证选择，再以新显式批次配置做一次新有限运行。

## 验证与证据边界

- 作者未运行测试、Vitest/list/collect、`tsc`、parser/AST、Python、prepare、服务、probe、HTTP、GUI、build、model、install 或 selfcheck。
- 本次选择器改动为 `NOT_RUN`；不得写成已通过。
- 既有 `PASS`（1/5 HTTP）来自旧基础配置直接指定测试文件的运行，只证明既有源码接线切片，不是新选择器证明，也不代表 GUI。
- 没有全量回归、旧 14 HTTP slice、旧 26/types 业务、模型、GUI 或安装包重跑。
- 本轮没有只读命令报错、权限拒绝或 `index.lock` 阻碍。
