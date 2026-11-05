# A 线交回：T34 launcher-boundary

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN / GIT_READ_ONLY`

## 执行入口

- 首个工具只读取正式执行令
  `D:\Lawbeach\lawbench-coord\A-T34-launcher-boundary-source-order-20261031-003543.md`。
- 随后完整读取批准输入、三份既有结果（compiled component 原始 PASS、copied-context
  原始 PASS、native full Desktop FAIL）及 27,901-byte copied-context 基线。
- 没有重演旧开工、安装、调研或全量测试；没有联系其他聊天，没有更换 API。

## 交付文件

只在授权的新目录写入三个源件：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LauncherBoundary-20261031-003543\launcher-boundary.mjs`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LauncherBoundary-20261031-003543\literal-inputs.json`
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LauncherBoundary-20261031-003543\README.md`

本正式交回件是协调目录中的第四份文件。没有修改工单集、SDK、产品、测试、旧证据、
观察器或其他 dirty 文件。

## 有界修改

- 基线为 `CopiedContext-20261031-001709` 的 27,901-byte `copied-context.mjs`。
- 九个复制 E50 模块与未修改观察器保持原路径、字节数和 SHA-256 pin。
- 新增三个批准 launcher pin：工作区 CLI `profile-boot.js`、实际 chunk
  `profile-boot-BZ2ZjNWi.js`、compiled `launch-environment/lib/index.js`。
  另以批准的工作区 `appBoot` 建立身份诊断 pin；全部 14 个 pin 在任何 DSH import
  前核对。
- 复制版 `appBoot` 只用于读取实际 profile 的只读解析基线、创建并读取本次独占的
  合成 profile；不启动完整业务 profile，不读取案卷、`.env` 或 Key。
- 实际 launcher 通过真实内部 `ModuleLoader.fromInternal().import(
  '@deepseek-ai/dsh/profile-boot', fileURL(actual_desktop_host_entry), {})`
  导入，走现有冻结 resolver 的原始回退；没有把工作区 profile-boot 强换成
  额外 `file:` launcher fallback，也没有另造 resolver。
- 没有可确认只读契约时不调用 `ModuleLoader.resolve`；结果中实际解析路径固定为
  `NOT_RECORDED`，不把 pin 路径冒充实际路径。
- 唯一 boot 入口是实际 `runProfile(...)`，参数使用
  `createLaunchEnvironmentSnapshot([])`、合成 profile、
  `actual_install_anchor`、空 `patchFiles` 与空 `args`。没有
  `loadLayeredEnv`、`process.env`、`.env` 或 Key 读取。
- `runProfile` 自己安装一次 `PluginPackages` 并提供 context/cmdline；
  没有手工调用旧 `appBoot.boot`，没有第二份 `PluginPackages`。
- 唯一 context 来自 `runProfile` 返回值。仅执行一次 unset
  `providers.external`；precondition 和物理 marker 检查保留。
- 运行后比较工作区 `appBoot` 与内部 `appBoot`、复制 E50 `appBoot` 与内部
  `appBoot` 的三函数身份。身份不一致只写入诊断证据，不再硬中断唯一 mutation。
- 关闭只调用返回的真实 `runProfile.shutdown.shutdown(0)` 一次；没有直接
  `process.exit`、伪造 controller 或裸 fiber dispose。启动拒绝时不声称完整
  context 已关闭。
- 观察器仍在真实 shutdown 后读取，自有输出上限保持 16 KiB。错误字段仍只含
  固定名称、错误码和已知消息标签，不记录原始消息、堆栈、配置正文、材料名、
  检索词或模型输入输出。

## 验证边界

- 作者侧 Node、Python、import、check、test、build、prepare、app、GUI、HTTP、
  模型、SSH、DPAPI 与 process probe 均为 0。
- 没有运行语法检查器、JSON parser、resolver 或目标。源码 pin 通过只表示输入
  未变化，不是 test PASS，也不表示原生桌面已修复。
- 结果文件仍固定为 root 内 `compiled-boundary-result.json`。
- 根侧完整 raw/source/delta/setup/cleanup 只允许一次，总时限 45 秒，必须使用
  原批准 Electron Node mode、冻结 resolver 与冻结 network guard。不得自动重试。

## 阻碍与操作计数

- Git 严格只读。Git 写操作 `0`；未执行 add、commit、rebase、stash、reset、
  clean、checkout 或 push。
- `git status --short --untracked-files=all` 在
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 返回
  `Permission denied`。未修复权限、锁、沙箱、审批或 ACL，未拆 writer 锁。
- 一次 Bash 调用在预执行阶段被拒绝，Bash 进程与命令未执行。
- 一次 `New-Item -LiteralPath` 因该宿主 PowerShell 不支持此参数，在目录创建前
  失败；随后用固定绝对 PowerShell 和受支持参数创建同一授权目录。
- 一次 `Select-String` 正则语法错误在读源前失败；随后以 simple-match 完成只读
  检查。
- 正式计数：工具命令尝试 `29`，成功启动的 native PowerShell 调用 `28`，
  Bash 预执行拒绝 `1`，最终只读 metadata check 计划 `1`。
- 该最终检查只核对四份授权文件存在、非空和预期文件名；不运行目标。若结果不符
  即停止，不重试。

## 根侧下一步

仅请根执行器按 README 的已批准启动关系运行一次 fresh 45 秒实验，并保存完整
raw/source/delta/setup/cleanup 证据。本线在源件交回后停止，不在本运行器执行任何
runtime；不据此宣称 `runProfile`、`PluginPackages`、observer、持久化、GUI 或
T34 整体通过。
