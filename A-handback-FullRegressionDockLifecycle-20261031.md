# A 线交回：dock 生命周期夹具边界修正与 X7 诊断

日期：2026-10-31  
执行者：A 线 `deepseek-v4.1-flash-1017`（原生 MXC，managed 隔离）  
性质：SOURCE ONLY / authored-not-run

## 1. 边界与既有证据

- 本次唯一入口为 `ORCH-A-FullRegressionDockLifecycle-20261031-133215.md`；已完整读取 `A-handback-FullRegressionDockRemainingAudit-20261031-132046.md`、相关 `ui/dock.tsx`、Host `sheetHold` / `TurnNotices` 调用链及两个原测试夹具。
- 沿用既有证据：original focused 135 项为 127 过、8 败、0 待定、类型错误 0；`source_changes=[]`。本次没有重跑测试，没有产生新的运行证据。
- 编辑前已将两个目标文件与 `FullRegressionDockLifecycleInput-20261031-133215` 的原始快照逐字核对，两者一致。工作区其他 dirty 内容未触碰。
- 本次只改 `dsh-ext/tests/dock.spec.ts`、`dsh-ext/tests/dock-review.spec.ts` 和本交回文件。产品、SDK、测试 helper、契约、其他测试用例字节均未修改。

## 2. 精确源码改动

### 2.1 `dsh-ext/tests/dock.spec.ts`

- `restart`：明确为完整软件 / Host 重启边界；保留原卸载、app store 清理和重挂时序，保留服务中已保存的选择；新增调用既有 `forgetDockSyncs()`，并清空 Host-only 的 `svc.holds`。
- R3 / R3b 快速连改：写选择仍在途时，发送期望由旧 `A.id` 改为精确 `'被拦下'`；同步改正旧注释。600 ms 后的 B 状态和发送期望未改。
- R11 发送与改选并发：标题改为“那条被拦下；之后按新的”，发送期望由旧 `A.id` 改为精确 `'被拦下'`；600 ms 后的 B 发送期望未改。
- 写到一半又改：新选择写仍在途时的发送期望由旧 `A.id` 改为精确 `'被拦下'`；2000 ms 后的 B 状态和发送期望未改。

### 2.2 `dsh-ext/tests/dock-review.spec.ts`

- `restart`：明确为完整软件 / Host 重启边界；保留既有 `forgetDockSyncs()`、app store 清理、卸载和重挂时序，保留服务 `pending` 中已保存的选择；新增 Host-only `svc.notices = new TurnNotices()`，使进程内 holds 随完整重启清空。
- X7 两种挂载模式：把既有第二次 `row()` 返回值保存为局部 `verdict`，再用 `expect(verdict, rows.at(-1)).toBe('一致')` 将既有 ROW 带入失败消息。操作、时序和原期望均未改变。

## 3. 验证与结论

- 仅做源码级快照差异核对，结果只包含上述授权改动；没有运行 Vitest、类型检查、构建、测试收集、产品应用、HTTP、模型或凭据操作，也没有任何源码自检。
- 未执行 Git 命令，未 add、commit、rebase、stash、reset、clean、checkout 或 push；因此没有 Git 提交 SHA。
- 完整重启 helper 只服务真正软件 / Host 重启用例。仅输入区卸载重挂、Host 仍存活的行为仍为 `NOT_VERIFIED`，没有顺手改变产品或通用 helper。
- 本次不宣称任何测试转绿，不宣称修复完成或全项目通过。后续由 Root 执行整体逆向核对和一次 original 135-case replay。
