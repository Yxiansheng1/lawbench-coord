# A | T31 源码模式专用 Vitest 配置交回

状态：**源码交付完成，未运行，停在交回门。**

执行依据：

- 正式执行令：`D:\Lawbeach\lawbench-coord\T31ScopeHttpSourceConfigOrder-20261026-041638.md`
- 执行令 SHA256：`6d74242d8777b3dde653745176192d80d3ea54da31d78dfb503ba48c8f00b228`
- Shell：绝对路径原生 pwsh，`login=false`；未使用 bash。
- MXC 保持 managed 隔离；未申请扩权，未更改审批、ACL 或沙箱。

## 交付物

1. 新增专用测试配置：
   `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scope-http.config.mjs`
   SHA256：`63e364b2060ab4dd830930afbac06f31c1418c673298be1d58516c976c6559cc`
2. 本交回件：
   `D:\Lawbeach\lawbench-coord\A-交回-T31ScopeHttpSourceConfig-20261026-041638.md`

授权范围内只新增上述两个文件。没有改源码、consumer、生命周期测试、产品/native/P29/schemas、现有 Vitest/DSH 配置、tsconfig、package/lock/node_modules。没有执行 Git 写入、暂存或提交。

## 配置组合

- 只读导入现有 `dsh-ext/vitest.config.mjs`，保留其 `lawbench:contracts` 插件、persistence 指向插件和全部现有别名；没有用 JSON fixture 覆盖契约。
- 以 `D:\Lawbeach\lawbench-A\dsh\package.json` 为 `createRequire` 根，通过标准包解析取得 `vite-tsconfig-paths`，没有写死 pnpm 版本路径。
- 配置以绝对路径
  `D:\Lawbeach\lawbench-A\dsh\tsconfig.base.json`
  调用 `tsconfigPaths({ projects: [nativeTsconfig] })`，让 native 包名先映射到 DSH 源码，而不是默认落到网关浏览器 `lib/client.js`。
- 复用 `D:\Lawbeach\lawbench-A\dsh\vitest.shared.ts` 导出的 `standardDecoratorPlugin()`；没有复制或新造通用 resolver/loader。
- 测试只包含 `tests/t31-native-scope-http.spec.ts`，环境为 `node`，`globals: true`，继承现有 `testTimeout`。
- 未在配置中设置缓存或并行度；`maxWorkers=1`、`no file parallelism`、`no cache` 仍由主编排运行命令约束。
- 未导入完整 DSH 配置，未引入其 pwsh probe、setup files 或全量 suite inventory。

## 既有失败与冻结边界

- 原始失败证据：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\HTTP-real-20261026-041229\test.stderr.txt`
  SHA256：`09d9d6b780cd34b96d273099ee0b956e4488a021de8012638112cb625350956c`
- 该证据为导入期 `ReferenceError: window is not defined`，0 tests；没有产生 HTTP 成功证据。
- 冻结 consumer 的既有 SHA256 为 `055d65ba57fa6e625fcc59d44a791c76c58f3e2889d65adf9aa11edc15b69eb1`；本次未编辑或重测它。
- 未加入 `window`/DOM/ModuleLoader stub，未 mock remote error、RPC 或业务分支，未跳过测试或弱化断言。

## 输入哈希

| 输入 | SHA256 |
|---|---|
| 现有 `dsh-ext/vitest.config.mjs` | `1fb762d371771ba626b2053545abb33d424d4edf0f2902385afba0258e0dc567` |
| `dsh/vitest.shared.ts` | `3e8900b7471bffab582974b3a0a6413140d8143d41f62f19a348c41ad3a316a0` |
| `dsh/tsconfig.base.json` | `2526f3bfc40abc15e30e9b6a94386ba234686028cafb3fbcbd215eb842325e2e` |
| 已安装 `vite-tsconfig-paths/dist/index.js` | `dcd2c32c2691d142b5362b01160369091e25e493144dbe1e2bf04e011e3f48e6` |

## 未执行与证据等级

作者侧**未执行**配置加载、collection/import-only、tsc/parser、Vitest/pytest、构建、prepare、serve、probe、HTTP、GUI、模型或自验证。因此本次不宣称路径解析已实测、consumer 已加载或 HTTP 已通过；这些只能由主编排的新运行产生。

主编排剩余顺序仍为：

1. 全量审计配置入口与副作用；
2. 用不匹配的 `testNamePattern` 做仅导入/收集的依赖证明（跳过不等于功能 PASS）；
3. 启动全新的真实 consumer 运行，不复用旧 serve；
4. 以新运行结果判定源码解析与 HTTP 行为。

## 只读 Git 与遗留

- 按要求使用 `git --no-optional-locks status --short --branch --ignore-submodules=all` 只读核对；原有大量 dirty 状态保持不变。
- 首次递归状态读取在 `dsh` worktree 的 `.git/modules/dsh` 遇到权限拒绝；随即按执行令改为忽略 submodule 的只读读取，成功。该权限限制未通过扩权、改 ACL、删锁或 Git 写入规避，也不是本交付阻碍。
- 未接触 writer lock。无授权范围内的已知遗留；运行时成败留给主编排的新运行。
