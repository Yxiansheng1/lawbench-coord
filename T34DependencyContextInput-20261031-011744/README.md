# T34 complete-launcher source handoff

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN / FULL_TEST_NOT_RUN`

本目录是一次由根侧执行器运行的有界试验源码。它只修复原 launcher 边界件中已证实的
测试镜像缺口：复制的 `dsh` 包缺少其 package exports 指向的 CLI compiled payload。
修复方式是新增一个完全属于本次结果 root 的最小运行时，把 approved 的 99 个原始文件
逐字复制进去，使 `profile-boot` 和 config-editor 最终共享同一个 `appBoot` 模块。

这不是产品修复，也没有修改 SDK、冻结 resolver、网络 guard、观察器或任何业务 profile。

## 输入与最小差异

`complete-launcher.mjs` 从已批准的
`LauncherBoundary-20261031-003543/launcher-boundary.mjs`（34,469 bytes，
SHA-256 `b395e67f0bbb9e08644cff62bf18297615517fda5e0db0888fc4ba33d15d0050`）
完整复制后修改。`literal-inputs.json` 的核心是 approved
`approved-inputs.json` 的原样内容，仅追加本件 handoff 元数据。

新增的 `COPY_INPUTS` 与 approved 的 `copy_inputs` 逐字一致，共 99 个文件、
1,357,214 bytes。范围仅为九个 E50 SDK package 的原始 `package.json`/`lib` 文件、
复制 desktop-host 的 package 与入口、以及 workspace CLI 的两个 compiled 文件和
其 E50 `dsh/package.json`。没有目录遍历、依赖安装、SDK 升级或动态 hash。

原 14 个 source pin 保持原值：十个批准 DSH/observer 模块、三个 launcher 输入和
一个 workspace `appBoot` 诊断 pin。观察器仍是 approved original source，不复制、
不修改。

## 执行顺序

1. 在根目录尚不存在时建立独占 `--root`，并断言路径属于本证据目录的 `runs`。
2. 在任何 DSH import 前核对原 14 个 pin 和全部 99 个复制输入的 bytes/SHA-256。
3. 安装同一组 8 类网络/进程 guard。
4. 在 root 内创建 `complete-runtime`，只按 `COPY_INPUTS` 的字面相对路径写文件；
   每次使用 `wx` 独占写入，并立即回读 bytes/SHA-256。
5. 从新运行时导入九个 E50 模块；`createLaunchEnvironmentSnapshot([])` 仍来自
   approved 的 workspace compiled module。
6. 旧 profile 仅以 approved old install anchor 读取只读解析元数据。新合成 profile
   的 install anchor、全部 plugin URL 和 desktop-host parent entry 均指向新运行时。
7. 使用真实内部 loader 执行
   `import('@deepseek-ai/dsh/profile-boot', fileURL(newRuntimeDesktopHostEntry), {})`
   后，调用一次真实 `runProfile`。`runProfile` 自己创建并持有 boot context、
   `PluginPackages`、readiness 和 shutdown。
8. 只有唯一 `llm-pi-ai` entry 与 descriptor ready 时才执行一次
   `settings.mutate` 的 `unset providers.external`，没有重试或备用路径。
9. 比较常规 workspace `appBoot` 与内部 `appBoot`，以及新运行时 `appBoot` 与同一
   内部 `appBoot` 的三函数身份；第一组预期为 false，第二组预期为 true，二者都是
   诊断证据而非单独验收条件。
10. 一次真实 `shutdown(0)` 后读取原观察器输出。结果仍写入
    `compiled-boundary-result.json`。

## 根侧运行

根侧应使用既有批准的 Electron Node mode、冻结 resolver 和冻结 network guard。只运行
一次，外部总时限固定在 45 秒以内，不自动重试：

```powershell
<approved Electron Node mode executable> --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --require "D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompleteLauncher-20261031-004819\complete-launcher.mjs" `
  --root "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompleteLauncher-20261031-004819\runs\<fresh-owned-name>"
```

退出码：

- `0`：唯一 mutation fulfilled，且真实 shutdown fulfilled。
- `1`：pin、copy、import、profile、launcher boot 或 harness 前置失败。
- `2`：唯一 mutation rejected。
- `3`：namespace precondition rejected。
- `4`：真实 `runProfile` shutdown rejected。

验收只看一次实际运行的闭合事实：唯一 unset fulfilled、物理 patch 中 external 为
0 且 lawfirm 为 1、source/copy bytes 与 SHA-256 仍成立、八类 guard 拦截非零尝试为
0、唯一完整 context 已关闭、45 秒外壳闭合。若仍出现 `root_include_missing`，保留
该已知原始标签并停止，不改 classifier、不重试。

## 作者侧边界

- 本轮未运行 Node、Python、任何 import/check/test/build/prepare、boot、应用、GUI、
  HTTP、模型、SSH、DPAPI 或 process probe。
- 新 target 和全量测试均为 `NOT_RUN`；本件只声称源码与输入已准备，不能声称实际
  `runProfile`、mutation、观察器、GUI 或 T34 已通过。
- PowerShell 只用于批准输入的读取、基线复制、字面片段拼装和源码/文件元数据检查；
  没有启动 JSON/JS parser，也没有执行产品或 SDK 代码。
- Git 写操作为 0。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 一次只读 `git status` 在既有 `dsh` 子模块入口返回 permission denied；未改权限、
  ACL、锁、沙箱或审批，也未拆 writer 锁。
- 一次被禁用的 Bash 工具请求在预执行阶段拒绝，Bash 进程和命令均未启动；随后未重试
  该命令，所有实际源码读取均由显式绝对路径的原生 PowerShell 完成。

## 不能声称

本件没有运行目标，因此不能声称新运行时能自然解析 complete CLI payload、真实
`runProfile` 会 boot、设置 unset 会 fulfilled、观察到一次有效写入、应用会关闭、
原生桌面问题已修复或 T34 已完成。只有根侧唯一一次实际运行及其完整外壳证据可以回答
这些问题。
