# T34 compiled-module boundary source handoff

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / ROOT_TARGET_NOT_RUN`

本目录只准备一次由根执行器运行的有限证据。它不修改 SDK、产品、测试、默认库或旧的
served 件，也不主张 T34 已完成。上一轮 GUI 的 `settings/rejected` 仍是事实；
`bootstrapIncludes` 缺少 root Include 登记只是本次待检验的假设，根侧运行前没有把它写成
原因。

## 固定输入

`literal-inputs.json` 原样保存批准输入的 9 个实际编译模块、11 个 primary 源/契约句柄、
2 个冻结 runtime 文件和旧实际失败指针。9 个编译模块均在 harness 首次导入 DSH 模块前按
字面字节数与 SHA-256 核对；任一不等即停止，不使用候选模块或 fallback。

批准桌面锚点是：

`D:\Lawbeach\lawbench-A\dsh\apps\desktop-host\package.json`

冻结 resolver 与 network guard 的路径、字节数和哈希保持不变；根执行器的原启动选项不改。

## harness 边界

`compiled-boundary.mjs` 只接受：

```text
--root <ABSOLUTE_FRESH_PATH_UNDER_THIS_EVIDENCE_DIR/runs>
```

根目录必须是本目录 `runs` 下尚不存在的独占目录；其已存在的父路径不得是 reparse/symlink，
harness 用非递归 `mkdir` 取得独占所有权。`runs` 本身须由根侧预先创建。除该 root 内的
合成 profile、bundle 和结果文件外，harness 不写任何路径。

启动链全部使用实际编译件：

- `appBoot.initProfile`、`appBoot.readProfilePatches`、`appBoot.boot`；
- 真实 root Include，由 `boot()` 自己创建和登记；
- bundle 中按生产裸名加载 `config-editor`、`settings`、`llm`、`llm-pi-ai`、`timer`、
  `hmr`；
- `hmr` 固定为 `root: [], ignored: [], debounce: 0`；
- profile 内只有 `lawfirm` 与 `external` 两个合成 literal-URL provider，每个只有一个
  text model、`contextWindow: 2048` 和 `apiKeyEnv` 引用标签。harness 不读取该环境值，
  不调用模型，`baseURL` 固定为 `http://127.0.0.1:1/v1`。

不使用 fake API、fake settings、fake loader、fake config editor 或 fake appBoot 方法；
不种 `bootstrapIncludes`，不直接调用 config editor 的私有路径。应用就绪对象只复现既有
`configurationFixture` 的最小 `onReady` 契约。

DSH 编译模块导入后、boot 前，harness 拒绝本进程的 HTTP、HTTPS、net、TLS、fetch、
WebSocket、child_process 和 Worker 启动，并保留固定类别计数。若真实启动路径需要其中
任一能力，运行会失败并如实记录，不绕过。

## 唯一目标动作

boot 后先要求恰好一个 active `llm-pi-ai` entry 和恰好一个同名 settings descriptor，
且其 `providers` 自有 `lawfirm` 与 `external`。前置条件不成立时不调用 mutation。
满足后只调用一次：

```js
ctx.settings.mutate('llm-pi-ai', [
  { op: 'unset', path: ['providers', 'external'] },
])
```

成功、拒绝都原样进入结果；拒绝不会改写成 PASS。之后记录 profile patch 中固定的
lawfirm/external model marker、label marker、literal URL 和 API-key-reference marker
计数，不记录 patch 原文。最后对 boot 返回的 `ctx.fiber` 只调用一次 `dispose()`；若它挂起，
由根侧外部 watchdog 终止，harness 不声称 finally 已清理。

## 根侧运行

根执行器先审计本目录源码，再由其原始启动器用原冻结 resolver/network guard 选项启动：

```powershell
node --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\compiled-boundary.mjs" `
  --root "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\runs\<fresh-owned-name>"
```

总预算 45 秒；`node` 是唯一允许的根侧 target。退出码：0 表示 mutation fulfilled，
1 表示 harness/boot/source 前置失败，2 表示 mutation rejected，3 表示 namespace 前置
拒绝，4 表示 dispose rejected。非零不自动说明产品根因。

结果文件固定为 root 内的 `compiled-boundary-result.json`。它只记固定 stage、布尔值、
allowlist error name/code、与 primary literal error 的精确比较结果和固定 marker 计数，
不记原始配置、消息、stack、材料、凭据或环境值。

## 作者侧实际状态

- runtime 0：作者没有启动 Node、Python、import、check、test、build、prepare、app、HTTP、
  GUI、模型、SSH、DPAPI 或 process probe。
- harness 退出码与 `compiled-boundary-result.json`：`NOT_RUN`。
- 唯一一次最终只读原生 PowerShell 核对：批准 JSON 核心逐字一致，9/9 编译模块字节数与
  SHA-256 吻合；harness 为 21,779 bytes / SHA-256
  `439beebd757c533307b83c0f093613436f1829b55cd3a933e0ba91271b2caa9b`。
- harness 内的 `imports_verified`、实际 boot、`settings.mutate`、物理 marker 与 dispose：
  `NOT_RUN`。
- Git 写操作 0：没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 只读 `git status --short --branch` 在 `dsh` 子模块入口遇到
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied；
  未修复权限或锁。`git status --short --branch --ignore-submodules=all` 已确认主工作树
  原有 dirty 很多，本交付只新增本目录和协调目录交回件，其他 dirty 全部保留。
- 只读检查阶段有 6 次工具调用误把 shell 设为不可用的 Bash；均在执行前以
  `Bash/E_ACCESS_DENIED` 拒绝，未执行命令、未读写仓库。另有 1 次 PowerShell 管道写法
  在解析阶段报错；没有执行表达式。

## 不能声称

本交付没有运行目标，因此不能声称 root Include 已创建、配置被接受、设置写入成功、
SDK 根因已知、E2E 通过或整条 T34 PASS。根侧运行后的实际 stage、错误 allowlist 与物理
marker 计数才是下一步证据；源码作者不据此提出产品修补。
