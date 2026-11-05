# A 线交回：T34 compiled import fix

状态：`SOURCE_CORRECTION_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN`

## 1. 依据与范围

依据：
`D:\Lawbeach\lawbench-coord\A-T34-compiled-import-fix-order-20261031-000033.md`。

本次只修正
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705`
下三份尚未正式交付的源产物，并新增本交回件。没有修改产品、SDK、测试、默认库、契约、
工单、旧 served 件、旧正式交回、旧状态或旧 raw 结果。

范围仅限原始编译组件管线，不是完整 Desktop runtime-resolution，也不是 GUI 验证。底层
native write 原因仍为 `UNKNOWN`；本次不归因 resolver、SDK、bootstrap 或 WeakMap。

## 2. 有界源码修正

只修改 `compiled-boundary.mjs` 的 `syntheticBundlePatch()`。六组 old/new 严格来自
`T34CompiledImportFixInput-20261031-000033\approved-fix.json`，每项 old 出现次数为 0，
new 出现次数为 1：

- `@deepseek-ai/dsh-config-editor` ->
  `pathToFileURL(MODULES.configEditor.path).href`
- `@deepseek-ai/dsh-settings` ->
  `pathToFileURL(MODULES.settings.path).href`
- `@deepseek-ai/dsh-llm` ->
  `pathToFileURL(MODULES.llm.path).href`
- `@deepseek-ai/dsh-llm-pi-ai` ->
  `pathToFileURL(MODULES.llmPiAi.path).href`
- `@deepseek-ai/cordis-plugin-timer` ->
  `pathToFileURL(MODULES.timer.path).href`
- `@deepseek-ai/dsh-hmr` ->
  `pathToFileURL(MODULES.hmr.path).href`

没有增加 fallback、import retry 或 runtime variant。九个批准编译模块及其 bytes/SHA-256、
导入前核对、真实 `internalLoader`、真实 Settings/ConfigEditor 插件、root Include、
网络/进程/Worker 守卫、唯一一次实际 mutation 和目标 dispose 均保持原语义。

修正后 source：

- path：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\compiled-boundary.mjs`
- bytes：`21850`
- SHA-256：
  `9998a4fda4947a71e106d8fde6860764c72e6d1676dad4eca4ec5c49ee7d4cb6`

## 3. 既有根侧事实

既有真实运行已经到达编译目标 boot，不是“完全未运行”：

- 9/9 编译模块 pin 的 bytes 与 SHA-256 检查通过；
- 常规与内部 `appBoot` 的 `boot`、`mountRootInclude`、
  `reconcileProfilePatches` 身份全部为 true；
- 在未安装完整 `runProfile` runtime-resolution 层的最小 harness 中，六个生产裸插件名
  发生 import 失败；
- mutation 未开始，模型、网络、HTTP、子进程、Worker 尝试均为 0；
- 实际 root dispose 为 `FULFILLED`；
- 根侧既有结果总 outcome 为 `HARNESS_ERROR`，不据此声称产品根因或 T34 PASS。

根侧首次 preload 的 Windows URL 解析错误发生在 harness import 之前，作为独立旧事实
保留；根侧只修 launcher。不能把该错误或最小 harness 的解析缺口写成产品原因。

既有结果路径：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\runs\run-20261030-235822\compiled-boundary-result.json`

## 4. 修改后的交回产物

- `compiled-boundary.mjs`：六处批准 file URL 导入；
- `literal-inputs.json`：批准输入核心、九个模块和冻结 runtime 原样保留；只更新
  `handoff.source` 的 bytes/SHA，并增加有界 `source_correction` 元数据；
- `README.md`：改写原 production-bare、Node-only 和示例措辞，记录六 pin file URL 组件
  范围，以及根侧精确 pin 的原 Electron Node mode `--expose-internals`、冻结 resolver
  的 file URL `--import` 与冻结 guard 的 `--require`；
- 本正式交回件。

## 5. 验证边界与实际计数

本轮作者 runtime 全部为 0：

`node=0, python=0, imports=0, checks=0, tests=0, builds=0, prepare=0, apps=0,
http=0, gui=0, models=0, process_probes=0`

未启动现有 target，也未运行新 target。没有更换 API，没有调用模型，没有 GUI、Key、
DPAPI、网络探测或第二 writer。所有 Shell 均为原生 PowerShell，未使用 Bash/cmd。

Git 严格只读：add、commit、rebase、stash、reset、clean、checkout、push 均为 0。
没有尝试修复 `index.lock`、权限、ACL、审批或沙箱，也没有拆分 writer 锁。因此没有提交
SHA；本交回文件就是正式交付。

本文件及全部交付件落盘后，只执行一次原生 PowerShell 最终只读核对。核对内容是批准
六组 old/new 的精确逆关系、对原快照除六个目标行外无源码字节变化，以及 source bytes/SHA
交回元数据。该检查不重跑 target；执行结果由本次回执报告，不再改写本文件。

## 6. 下一责任与停止点

根侧仍需完整审阅六个目标行之外的全部源码、输入 manifest 与 setup/cleanup，然后只执行
一次新的 fresh-root 编译组件 mutation。不得扩成 GUI、真实 Key、真实模型或完整 Desktop
resolution 声明。

源码修正与正式交回已完成，本执行者在此停止。
