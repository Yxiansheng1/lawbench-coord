# T34 copied-context source handoff

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN`

本目录只准备一次由根执行器运行的复制上下文证据，不修改 SDK、产品、测试、默认库、
旧证据或观察器。上一轮实际 GUI 的 `settings/rejected` 仍是失败事实；完整原生 GUI
是否成功不在本件作者授权内，本件也不把旧的组件测试结果改写成 GUI PASS。

## 本版边界

`copied-context.mjs` 从已通过批准的
`CompiledBoundary-20261030-234705/compiled-boundary.mjs`
（21,850 bytes，SHA-256 `9998a4fda4947a71e106d8fde6860764c72e6d1676dad4eca4ec5c49ee7d4cb6`）
完整复制，只做以下有界差异：

1. 九个 DSH 模块改为批准的实际 E50 复制件路径。九个文件仍以批准字节数与 SHA-256
   逐一核对，且核对发生在任何 DSH 模块导入前。桌面锚点改为批准的实际
   `dsh-desktop-host/package.json`，裸模块基址从该锚点推导。
2. 原未修改观察器作为一个额外模块 pin。观察器加载前先核对 20,058 bytes 与 SHA-256
   `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac`。
   合成 bundle 只增加第七行 `t34-projection-observer`：

   - `stateDir` 是本次独占的新 root；
   - `outputPath` 精确为 `join(root, 'projection-observer.json')`；
   - `configEditorModuleUrl` 与 `settingsModuleUrl` 是实际复制服务模块的 file URL。

   观察器源码不改，不另做 classifier、wrapper 或候选插件。

3. boot 前用实际复制的 `loadProfileDirectory('dsh', approved_actual_profile_dir,
   actual_install_anchor)` 和 `createRuntimeResolution({
   installAnchor: actual_install_anchor, profile: loadedActualProfile,
   home: actual_dsh_home })` 计算只读运行时解析。实际冻结 profile 只作为读取输入；
   不启动完整业务 profile，不读取案卷、`.env` 或 Key。
4. 在原有 `boot()` prepare 回调中，先提供 `profileContext` 与 `appReady`，再按生产
   `profile-boot.ts` 的顺序执行
   `await hostCtx.plugin(PluginPackages, { resolution })`。该服务只安装进程内模块解析
   和线程环境数据，不启动 Worker，不修全局策略；既有网络、子进程和 Worker 启动拒绝
   在 profile 元数据和 boot 前保持生效。
5. boot 后只读取三个真实属性布尔值：

   - `ctx.root === ctx`；
   - `ctx.configEditor.ownerContext.root === ctx.root`；
   - `ctx.settings.ownerContext.root === ctx.root`。

   随后以实际 config-editor file URL 为内部导入基址，比较常规复制 `appBoot` 与内部
   `appBoot` 的 `boot`、`mountRootInclude`、`reconcileProfilePatches` 函数身份。
   这只是有界元数据，不操作模块缓存，不做分类启发式。

6. mutation、precondition、物理 marker 计数、网络/进程/Worker 守卫和 dispose catch
   保持原路径。成功时仍只执行一次
   `ctx.settings.mutate('llm-pi-ai', [{ op: 'unset', path: ['providers', 'external'] }])`，
   不重试、不回退。观察器故障不影响原始 mutation 结论。
7. dispose 后只从本次自有 root 读取未修改观察器的最终
   `projection-observer.json`。结果保留其 counts、bindings 与 events 元数据，不读取
   原始材料或配置正文；文件超过 16 KiB、缺失或不可解析时只记录失败原因。

## 根侧运行边界

harness 只接受：

```text
--root <ABSOLUTE_FRESH_PATH_UNDER_THIS_EVIDENCE_DIR/runs>
```

`runs` 必须由根侧预先创建；root 必须尚不存在，其已有父路径不得是 reparse/symlink。
除该 root 内的合成 profile、bundle、观察器文件和结果外，harness 不写其他路径。

根执行器仍需使用原批准 Electron Node mode、冻结 resolver preload 与冻结 network
guard。建议启动关系：

```powershell
<root-approved Electron Node mode executable> --expose-internals `
  --import "file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T50/20261023-211421/runtime/resolve-from-dsh.mjs" `
  --require "D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\runtime\network-guard.cjs" `
  "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CopiedContext-20261031-001709\copied-context.mjs" `
  --root "D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CopiedContext-20261031-001709\runs\<fresh-owned-name>"
```

外部总时限固定 45 秒，并以根侧精确 own PID、executable path、UTC birth 建立守卫和闭合
确认。非零退出或超时不得自动重试。结果文件固定为 root 内的
`compiled-boundary-result.json`。

退出码仍是：

- `0`：唯一 mutation fulfilled；
- `1`：harness、源 pin、解析、boot、身份或结果前置失败；
- `2`：唯一 mutation rejected；
- `3`：namespace precondition rejected；
- `4`：dispose rejected。

## 作者侧状态

- 本轮 Node、Python、import、check、test、build、prepare、app、GUI、HTTP、模型、
  SSH、DPAPI 与 process probe 均为 0；新 target 为 `NOT_RUN`。
- 本轮没有产品修复。底层 native write 原因仍为 `UNKNOWN`，直到根侧拿到实际 stage、
  观察器事件与物理计数。
- Git 写操作为 0。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 只读根层 `git status` 在 `dsh` 子模块入口遇到
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` Permission denied；
  未修复权限、锁、沙箱或 ACL。`--ignore-submodules=all` 已确认主工作树原有 dirty
  很多，本件只在授权目录新增三份源件和协调目录一份正式交回件。
- 本轮有 2 次 Bash 预执行拒绝，均未启动 Bash 进程、未执行命令；1 次
  `New-Item -LiteralPath` PowerShell 参数错误，在目录和文件写入前失败。随后用精确
  PowerShell 路径创建同一目标并完成复制，未接触其他 dirty 文件。

## 不能声称

本件没有运行目标，所以不能声称实际解析已成功、PluginPackages 已安装、观察器已绑定、
设置写入成功、桌面 GUI 已修复、底层根因已知或 T34 已完成。只有根侧一次实际运行及
外部闭合证据可以回答这些事实。
