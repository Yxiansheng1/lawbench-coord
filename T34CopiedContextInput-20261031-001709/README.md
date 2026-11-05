# T34 compiled-module boundary source handoff

状态：`SOURCE_CORRECTION_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN`

本目录只准备一次由根执行器运行的有限证据。它不修改 SDK、产品、测试、默认库或旧的
served 件，也不主张 T34 已完成。上一轮 GUI 的 `settings/rejected` 仍是事实；
`bootstrapIncludes` 缺少 root Include 登记只是本次待检验的假设，根侧运行前没有把它写成
原因。

本版按 2026-10-31 的新执行令只修正 `syntheticBundlePatch` 的六处插件导入身份。根侧既有
实际运行已证明编译目标能够 boot，常规与内部 `appBoot` 三个导出身份全部一致，root 已
dispose；但在未安装完整 `runProfile` runtime-resolution 层的最小 harness 中，六个生产
裸插件名发生 import 失败。六处因此改为九个已 pin 编译模块中的精确 file URL，范围仅限
原编译组件管线，不代表完整 Desktop resolution 或 GUI。底层 native write 原因仍为
`UNKNOWN`，本修正不归因 resolver、SDK、bootstrap 或 WeakMap。

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
- bundle 中只以 `pathToFileURL(MODULES.<approvedKey>.path).href` 加载六个 pin 的原始
  编译插件：`config-editor`、`settings`、`llm`、`llm-pi-ai`、`timer`、`hmr`；
- `hmr` 固定为 `root: [], ignored: [], debounce: 0`；
- profile 内只有 `lawfirm` 与 `external` 两个合成 literal-URL provider，每个只有一个
  text model、`contextWindow: 2048` 和 `apiKeyEnv` 引用标签。harness 不读取该环境值，
  不调用模型，`baseURL` 固定为 `http://127.0.0.1:1/v1`。

六处替换逐项来自批准 `pairs`，每项只出现一次；没有 fallback、import retry 或 runtime
variant。九组编译模块仍在任何 DSH 导入前按原批准字节数与 SHA-256 全部核对。既有真实
`internalLoader`、Settings、ConfigEditor、root Include、单次 mutation 与 dispose 保持
不变。

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

根执行器先审计本目录源码，再由其精确 pin 的原始 Electron Node mode 启动，保留
`--expose-internals`；冻结 resolver 以 file URL `--import` 预载，冻结 guard 以
`--require` 预载。下面是原启动器的参数关系示意，不授权新的 runtime：

```powershell
<根侧原 Electron Node mode executable> --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --require "D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\compiled-boundary.mjs" `
  --root "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\runs\<fresh-owned-name>"
```

总预算 45 秒；根侧原启动器是唯一 target，不新增作者 runtime。退出码：0 表示 mutation
fulfilled，1 表示 harness/boot/source 前置失败，2 表示 mutation rejected，3 表示
namespace 前置拒绝，4 表示 dispose rejected。非零不自动说明产品根因。

结果文件固定为 root 内的 `compiled-boundary-result.json`。它只记固定 stage、布尔值、
allowlist error name/code、与 primary literal error 的精确比较结果和固定 marker 计数，
不记原始配置、消息、stack、材料、凭据或环境值。

## 作者侧实际状态

- 本轮 source correction runtime 0：Node 0、Python 0、import 0、check 0、test 0、build 0、
  prepare 0、app 0、HTTP 0、GUI 0、模型 0、SSH 0、DPAPI 0、process probe 0。
- 既有根侧实际结果保留在
  `runs\run-20261030-235822\compiled-boundary-result.json`：9/9 编译 pin 吻合，常规与
  内部 `appBoot` 的 `boot`、`mountRootInclude`、`reconcileProfilePatches` 全部为 true；
  `precondition.checked` false，mutation 未开始，网络/进程/Worker 尝试均为 0，dispose
  为 `FULFILLED`，总 outcome 为 `HARNESS_ERROR`。该结果不转写为产品根因或 T34 PASS。
- 根侧另有一份首次 preload 的 Windows URL 解析错误记录，发生在 harness import 之前；
  它作为独立旧事实保留。根侧只修了 launcher，没有把它写成产品原因。
- 修正后 harness 为 21,850 bytes / SHA-256
  `9998a4fda4947a71e106d8fde6860764c72e6d1676dad4eca4ec5c49ee7d4cb6`；新 target
  运行：`NOT_RUN`。
- 交付件落盘后只执行一次原生 PowerShell 最终只读核对：六组 old/new 精确逆关系、
  批准快照外无其他源码改动，以及 `literal-inputs.json` 的 source bytes/SHA 元数据。
  核对的通过或拒绝由执行者回执，不重跑 target。
- Git 写操作 0：没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 只读 `git status --short --branch` 在 `dsh` 子模块入口遇到
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied；
  未修复权限或锁。`git status --short --branch --ignore-submodules=all` 已确认主工作树
  原有 dirty 很多；本交付只修正本目录三份源件并在协调目录新增一份交回件，其他 dirty
  全部保留。
- 前一轮只读检查实际有 5 次 Bash 预执行拒绝，均未执行命令、未读写仓库；旧正式交回中
  记作 6 次，以可核对的原始记录为准。另有 1 次 PowerShell 管道写法在解析阶段报错；
  没有执行表达式。本轮不再使用 Bash。

## 不能声称

本交付没有运行目标，因此不能声称 root Include 已创建、配置被接受、设置写入成功、
SDK 根因已知、E2E 通过或整条 T34 PASS。根侧运行后的实际 stage、错误 allowlist 与物理
marker 计数才是下一步证据；源码作者不据此提出产品修补。
