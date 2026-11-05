# A 线交回：T34 compiled-module boundary

状态：`SOURCE_HANDOFF_READY / AUTHOR_RUNTIME_ZERO / ROOT_TARGET_NOT_RUN`

## 1. 目标与出处

依据 `D:\Lawbeach\lawbench-coord\A-T34-compiled-boundary-source-order-20261030-234705.md`，
本交回只提供一次新的 headless actual-compiled 边界证据源，不修 SDK、产品、测试、默认库、
旧 served 件，也不重演 GUI/classifier/provider 变体。上一轮实际 GUI 失败仍是事实；root
Include 未进入 `bootstrapIncludes` 仅为待验假设，当前原因仍记为 `UNKNOWN`。

固定来源为 `D:\Lawbeach\lawbench-coord\T34CompiledBoundaryInput-20261030-234705\approved-inputs.json`。
其中 9 个编译模块、桌面锚点与冻结 runtime 均按原字面值保留，未沿用等价 GUI 结果。

## 2. 改动清单与提交 SHA

本次只新增：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\compiled-boundary.mjs`
- 同目录 `literal-inputs.json`
- 同目录 `README.md`
- 本交回件

没有修改任何既有产品、测试、SDK、默认库、old served、契约或工单文件。Git 严格只读：
没有 add、commit、rebase、stash、reset、clean、checkout 或 push。因此没有交付提交 SHA；
这是本次执行令明确允许的交回方式。

## 3. 红绿验证

红/绿目标执行：`NOT_RUN`。作者没有启动 Node、Python、import、check、test、build、
prepare、app、HTTP、GUI、模型、SSH、DPAPI 或 process probe。

计划由根执行器执行的唯一 target 是源内 `compiled-boundary.mjs` 的一次 fresh-root boot：

- 先核对 9 个实际编译模块的字面字节数与 SHA-256；
- 用实际 `appBoot.boot` 创建真实 root Include；
- 通过桌面锚点裸名加载六个真实编译插件；
- 只执行一次 `settings.mutate('llm-pi-ai', [{ op: 'unset', path: ['providers', 'external'] }])`；
- 保留 fulfilled/rejected 的实际结果和固定 marker 计数；
- 对实际 `ctx.fiber.dispose()` 只调用一次，最多由根侧 45 秒 watchdog 外控。

没有 finite PASS、GUI PASS、设置写入成功或 T34 PASS 声明。

作者侧非零/异常记录：

- `git status --short --branch` 因
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied 返回非零；
  未修锁/权限。用 `--ignore-submodules=all` 只读确认 dirty 后，本交付未覆盖任何原有改动。
- 只读检查期间有 6 次工具调用误设不可用 Bash，均在执行前以 `Bash/E_ACCESS_DENIED`
  拒绝；没有命令执行，也没有仓库读写。
- 有 1 次 PowerShell 管道写法在解析阶段报错；表达式未执行。
- 唯一一次最终只读原生 PowerShell 字面钉检查通过：批准 JSON 核心逐字一致，9/9 编译
  模块 bytes/SHA-256 全吻合；harness 自身为 21,779 bytes / SHA-256
  `439beebd757c533307b83c0f093613436f1829b55cd3a933e0ba91271b2caa9b`。

## 4. 测试证据路径

- Harness 源：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\compiled-boundary.mjs`
- 固定输入：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\literal-inputs.json`
- 运行与边界说明：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompiledBoundary-20261030-234705\README.md`
- 根侧未来结果文件（当前不存在）：
  `...\CompiledBoundary-20261030-234705\runs\<fresh-owned-name>\compiled-boundary-result.json`

## 5. 契约或文档摘要

没有改契约或 `docs\src\*.md`，因此无需运行契约自检或文档生成。合成 profile 只在 root
内创建，provider URL 固定为 `http://127.0.0.1:1/v1`；`apiKeyEnv` 只是引用标签，不读取
环境值。输入和输出均不承载真实案卷、Key、密码或模型消息。

## 6. 自检与遗留、模糊条款摘录

源码审阅覆盖：路径闸门、独占新 root、9-pin 预导入核对、桌面锚点、真实 root Include、
真实 plugins、单次 mutation、拒绝不转成功、单次 dispose、网络/子进程/Worker 主动拒绝，
以及 error name/code/primary-message 的 allowlist。作者未执行语法/import 检查；根侧负责
完整审计和唯一一次运行。

模糊点按执行令保留原意：执行令要求以“approved desktoppackage”为 production-style bare
import anchor，approved JSON 的 `desktop_anchor` 是
`D:\Lawbeach\lawbench-A\dsh\apps\desktop-host\package.json`，因此 harness 原样使用它，
不自行改成其他 workspace package。若根侧真实运行在此解析边界失败，应记录该 exact
sourceissue，不回退 builtin/fake/classifier。

下一责任全在根侧：完整 review 后运行一次 bounded target，按实际 stage、error allowlist、
物理 marker 与 OS closure 判断；源码作者到此停止，不提交、不改锁、不提出推测性产品补丁。
