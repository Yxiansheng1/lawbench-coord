# A 线 T34 copied-context 正式交回

交回时间：2026-10-31

状态：`SOURCE_HANDOFF_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN / PRODUCT_CAUSE_UNKNOWN`

本交回由当前执行器作为唯一 writer 完成；未派子代理，也没有把当前 PID 当作第二 writer。
作者阶段按令不读取或探测 PID。

执行令：
`D:\Lawbeach\lawbench-coord\A-T34-copied-context-source-order-20261031-001709.md`

授权输入：
`D:\Lawbeach\lawbench-coord\T34CopiedContextInput-20261031-001709\approved-inputs.json`

## 交付位置

源码与说明位于：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CopiedContext-20261031-001709\`

正式交回只新增以下三份证据文件和本文件；未改工单集、观察器、SDK、产品、测试、默认库、
旧 served 件或其他 dirty 内容：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `copied-context.mjs` | 27,901 | `b250189589ee5fba098e832bc281b0c2d92cc511e5b8baada6a00a7e381d91a2` |
| `literal-inputs.json` | 11,406 | `5f3250a5ed696b7b7399e7369b03d77c52f4d0066f5c5974a8d86c30b5b83587` |
| `README.md` | 6,166 | `d0ce39351194585744098c27f8e7b2da5d9662de0261b64bd7f2d8f8a0b8e3c0` |

以上大小与哈希来自本运行唯一的最终原生 PowerShell 只读 pin/self-metadata 核对。该核对
没有启动目标，也没有执行源码。

## 实际修改

1. 从原批准基线完整复制
   `CompiledBoundary-20261030-234705/compiled-boundary.mjs`
   （21,850 bytes / `9998a4fda4947a71e106d8fde6860764c72e6d1676dad4eca4ec5c49ee7d4cb6`），
   仅按执行令做有界差异。
2. 九个 DSH 模块全部指向批准的实际 E50 复制件；字节数和 SHA-256 均与原工作区九个
   模块一致。桌面锚点改为实际 `dsh-desktop-host/package.json`，裸模块基址由该锚点
   推导。
3. 原未修改观察器新增为第十个模块 pin：
   20,058 bytes / `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac`。
   十个模块 pin 都在任何 DSH 导入前核对。
4. 合成 profile 只增加第七行 `t34-projection-observer`。其 `stateDir` 为本次独占新
   root，`outputPath` 精确为 `join(root, 'projection-observer.json')`，两个模块 URL
   均指向实际复制服务。观察器源码零修改。
5. boot 前调用实际复制的 `loadProfileDirectory('dsh', approved_profile_dir,
   approved_install_anchor)` 和 `createRuntimeResolution({ installAnchor,
   profile: loadedActualProfile, home: approved_dsh_home })`。冻结 profile 只读，不写回，
   不读案卷、`.env` 或 Key，也不 boot 完整业务 profile。
6. 在 prepare 中按生产顺序先提供 `profileContext`、`appReady`，再执行
   `await hostCtx.plugin(PluginPackages, { resolution })`。这是真实 root context 内的
   进程局部服务安装；没有全局 OS 策略或 SDK hook 修改。
7. boot 后只记录三个真实属性布尔值：`ctx.root === ctx`、
   `ctx.configEditor.ownerContext.root === ctx.root`、
   `ctx.settings.ownerContext.root === ctx.root`。随后以实际 config-editor file URL 为
   内部导入基址，比较常规复制与内部 `appBoot` 的三个函数身份。无模块缓存操作。
8. 网络、子进程和 Worker 启动拒绝仍在 profile 元数据计算与 boot 前安装并保持。唯一
   mutation、precondition、物理 marker 计数、错误 allowlist 与 dispose catch 路径保留。
   成功时仍只有一次 `settings.mutate`，没有自动重试或 fallback。
9. dispose 后只从本次自有 root 读取未修改观察器的最终 JSON，保留其 counts、bindings
   和 events 元数据。读取失败、超限或不可解析只记 observation 状态，不改变原 mutation
   结论。

## 最终只读核对

按令只执行了一次最终原生 PowerShell 只读命令。

已确认：

- 15/15 个批准 pin 的字节数和 SHA-256 全部吻合，包括基线、九个复制模块、观察器、
  冻结实际 profile 两份文件和两个安装锚点；
- 3/3 份新交付文件存在并取得 bytes/SHA-256；
- 9 个关键源码边界标记为 true：观察器 pin、第七行、实际 profile 读取、运行时解析、
  prepare 中 PluginPackages、三个根归属比较、实际 config-editor 内部导入基址、
  dispose 后观察器读取、唯一 mutation。

核对命令退出码为 1，唯一原因是第 10 个辅助文本断言
`copiedAppBootPath=false`：PowerShell 检查字符串使用了单个反斜杠，而 `.mjs` 中的
Windows 路径按源码语法含有双反斜杠；这不是 pin、哈希或源码执行失败。该路径已在先前
只读静态复核中直接见到。按“一次最终核对、失败不重试”的执行令，没有重跑或改写该结果。

## 命令计数与偏离

本轮共发生 33 次工具命令调用：

- 原生 PowerShell 共 31 次，其中 28 次成功、3 次返回非零；全部使用
  `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
  且 `login=false`；
- Bash 调用尝试 2 次，均在预执行阶段被拒绝，Bash 进程和命令均未启动；
- 总计 33 = 31 次原生 PowerShell 尝试 + 2 次 Bash 预执行拒绝。

非零事实：

1. 只读 `git status --short` 在 `dsh` 子模块入口遇到
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied。
   `--ignore-submodules=all` 的只读检查成功，确认主工作树原有 dirty 很多。没有修权限、
   锁、沙箱、审批或 ACL。
2. 首次创建目录使用当前 PowerShell 不支持的 `New-Item -LiteralPath`，在目标目录和
   文件生成前失败。随后用精确 `-Path` 重新创建同一固定路径并复制两份批准基线；没有
   触碰其他路径。
3. 最终只读核对的单个辅助字面量断言错误导致退出 1；15 个真实 pin 和 3 份自身元数据
   均已成功输出，未重试。

运行计数：Node 0、Python 0、import 0、check 0、test 0、build 0、prepare 0、app 0、
HTTP 0、GUI 0、模型 0、SSH 0、DPAPI 0、process probe 0。新 headless target 为
`NOT_RUN`。

Git 写操作 0：没有 add、commit、rebase、stash、reset、clean、checkout 或 push；没有
暂存任何文件。交回通过本协调目录文件完成。

## 不能声称

本交回只准备下一次根侧实际运行所需的有界源码，不主张实际运行时解析成功、
PluginPackages 已安装、观察器已绑定、设置写入成功、完整 Desktop GUI 已修复、底层
native cause 已知或 T34 PASS。

根侧下一步应按执行令只做一次 headless copied-context 实际运行：使用原批准 Electron
Node mode 与冻结 resolver/network guard，fresh root，外部总预算 45 秒，以精确 own
PID、executable path 和 UTC birth 建立守卫与闭合确认；失败不重试。随后读取该次
原始输出、源码、差量、setup/cleanup 和观察器 counts/bindings/events，再做 closure/seal，
只提出证据支持的下一源码原因。未获得新的实际证据前不得提出产品修补。
