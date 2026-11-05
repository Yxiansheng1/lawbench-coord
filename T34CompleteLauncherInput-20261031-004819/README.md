# T34 launcher-boundary source handoff

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN`

本目录只准备一次由根执行器运行的 launcher 边界证据。它针对完整桌面启动路径中
已发现的具体缺口：

- 复制的 `dsh` 包声明了 `@deepseek-ai/dsh/profile-boot`，但导出目标
  `lib/profile-boot.js` 不存在；
- 冻结 resolver 会把这一缺失裸导入回退到工作区 CLI；
- 工作区 CLI 的 profile-boot chunk 从工作区解析 `appBoot`，而后续
  `PluginPackages` 可能把 `appBoot` 与 config-editor 解析到复制的 E50 运行树。

这些问题尚未被证明为原生桌面失败的根因。本件不修 SDK、resolver、classifier 或产品，
只让实际 `runProfile` 在同一个受控合成 profile 上运行一次，并记录有限的身份与物理写入
证据。

## 基线与有界差异

`launcher-boundary.mjs` 从已批准的
`CopiedContext-20261031-001709/copied-context.mjs`（27,901 bytes，
SHA-256 `b250189589ee5fba098e832bc281b0c2d92cc511e5b8baada6a00a7e381d91a2`）
完整复制后修改。九个复制 E50 模块与未修改观察器的路径、字节数和 SHA-256 保持原批准值。

同时新增并逐字核对三个 launcher 输入：

1. 工作区 CLI `lib/profile-boot.js`：310 bytes；
2. 工作区 CLI `lib/profile-boot-BZ2ZjNWi.js`：12,593 bytes；
3. 工作区 compiled `launch-environment/lib/index.js`：2,991 bytes。

另以批准的工作区 `appBoot` 路径建立同字节 pin，用于身份诊断。全部 14 个 pin 在任何
DSH 模块导入前完成字节数与 SHA-256 核对。源码 pin 通过只表示输入未变化，不表示目标
运行通过。

## 启动路径

1. 复制版 `appBoot` 仍只用于读取实际 profile 的只读解析基线和创建本次独占的合成
   profile。合成 profile 写入后，再用
   `loadProfileDirectory('dsh', synthetic.profileDir, actual_install_anchor)` 读取它；
   不启动完整业务 profile，不读取案卷、`.env` 或 Key。
2. 在任何 `runProfile` 前，通过真实内部 `ModuleLoader.fromInternal()` 执行：

   ```text
   ModuleLoader.import(
     '@deepseek-ai/dsh/profile-boot',
     fileURL(actual_desktop_host_entry),
     {}
   )
   ```

   这走现有冻结 resolver 的实际缺失导出回退，不把工作区 profile-boot 强换成
   launcher 的 `file:` 导入。内部 loader 若提供 `resolve` 函数，只记录该 API 是否
   存在；因没有可确认的只读调用契约，不额外调用 resolver，路径字段固定为
   `NOT_RECORDED`，避免把 pin 路径冒充实际解析路径。
3. `launch-environment` 只从已核准的 compiled module file URL 导入。传给
   `runProfile` 的是 `createLaunchEnvironmentSnapshot([])`；本件不调用
   `loadLayeredEnv`，不读取 `process.env`、`.env` 或 Key。
4. 实际调用的唯一 boot 入口是：

   ```text
   runProfile({
     environment: createLaunchEnvironmentSnapshot([]),
     profile: 'compiled-boundary',
     resolvedProfile: { profile: loadedSynthetic, installAnchor: actual_install_anchor },
     patchFiles: [],
     args: []
   })
   ```

   `runProfile` 自己计算最小 profile 解析、安装一次 `PluginPackages`、提供
   `profileContext`/context、推进 cmdline 与 app-ready。本件不再手工调用
   `appBoot.boot`，也不手工安装第二份 `PluginPackages`。
5. 返回的 context 是后续唯一 context。先读取根归属、实际
   `ctx.get('pluginPackages').packageOf('@deepseek-ai/dsh-app-boot', ...)` 的只读
   package 归属，再从实际 config-editor file URL 导入内部 `appBoot`，分别记录：

   - 常规工作区 `appBoot` 对内部 `appBoot` 的三函数身份；
   - 复制 E50 `appBoot` 对内部 `appBoot` 的三函数身份。

   这里的身份不一致是诊断证据，不再硬中断；只有真实 import/API 失败才记失败。
6. precondition 仍要求唯一活动 `llm-pi-ai` entry、一个 descriptor，且
   `lawfirm` 与 `external` 都由当前 context 持有。只有 ready 才执行一次且仅一次
   `settings.mutate` unset `providers.external`；没有重试、回退或第二个 mutation。
7. 关闭只调用本次返回的真实 `runProfile.shutdown.shutdown(0)` 一次，保留产品自身
   5 秒关闭上限。没有直接 `process.exit`，没有伪造 shutdown controller，也不退回
   裸 fiber dispose。启动被 `runProfile` 拒绝时，只记录其内部 cleanup 路径，不声称
   未返回的完整 context 已关闭。
8. 观察器在 `shutdown(0)` 完成后才读取，输出上限仍是自有结果目录内 16 KiB。
   错误只保留固定名称、错误码和已知 primary message 标签，不记录原始消息、堆栈、
   配置正文、材料名、检索词、模型输入输出或 Key。

## 根侧运行边界

harness 只接受：

```text
--root <ABSOLUTE_FRESH_PATH_UNDER_THIS_EVIDENCE_DIR/runs>
```

根侧必须先创建本证据目录下的 `runs`。root 必须尚不存在，其已有父路径不得是
reparse/symlink。除该 root 内的合成 profile、bundle、观察器文件和结果外，harness
不写其他路径。结果固定写入 root 内 `compiled-boundary-result.json`。

建议启动关系如下；实际执行必须使用根侧既有批准的 Electron Node mode、冻结 resolver
和冻结 network guard：

```powershell
<root-approved Electron Node mode executable> --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --require "D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LauncherBoundary-20261031-003543\launcher-boundary.mjs" `
  --root "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LauncherBoundary-20261031-003543\runs\<fresh-owned-name>"
```

根侧完整 raw 证据、source/delta、setup/cleanup 和 OS 闭合只允许一次，外部总时限固定
45 秒且必须有限、精确归属、无自动重试。非零退出、超时或结果文件异常都应保留当时
stage 并停止。

退出码：

- `0`：唯一的 mutation fulfilled，且真实 shutdown fulfilled；
- `1`：pin、import、合成 profile、launcher boot 或 harness 前置失败；
- `2`：唯一 mutation rejected；
- `3`：namespace precondition rejected；
- `4`：真实 `runProfile` shutdown rejected。

## 作者侧状态与阻碍

- 本轮首个工具只读取正式执行令
  `A-T34-launcher-boundary-source-order-20261031-003543.md`。随后只读取批准输入、
  三份既有结果、相关已批准源码和现有 dirty 状态。
- Node、Python、import、check、test、build、prepare、app、GUI、HTTP、模型、SSH、
  DPAPI 与 process probe 的作者运行次数均为 0；新 target 为 `NOT_RUN`。没有运行
  语法检查器或 JSON parser，因此本件只声称源码已准备，不声称语法或目标通过。
- Git 写操作数为 0。未执行 add、commit、rebase、stash、reset、clean、checkout
  或 push。
- 只读 `git status --short --untracked-files=all` 在
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 遇到
  `Permission denied`；未修改锁、权限、ACL、沙箱或审批，也未拆 writer 锁。
- 一次工具调用在预执行阶段被 Bash 访问拒绝，Bash 进程与命令均未执行。一次
  `New-Item -LiteralPath` 因该 PowerShell 宿主不支持此参数而在创建目标前失败，
  随后使用固定绝对 PowerShell 的可支持参数创建同一授权目录。一次
  `Select-String` 正则参数错误在读源前失败，随后用 simple-match 完成只读检查。
- 未修改工单集、SDK、产品、测试、旧证据、观察器或其他 dirty 文件。

## 不能声称

本件没有运行目标，不能声称 profile-boot 回退成功、`runProfile` boot 成功、
`PluginPackages` 解析到复制树、身份不一致是原生桌面根因、观察器 fulfilled、设置
unset 持久化、GUI 已修复或 T34 已完成。只有根侧一次实际运行及其外部闭合证据可以
回答这些事实。
