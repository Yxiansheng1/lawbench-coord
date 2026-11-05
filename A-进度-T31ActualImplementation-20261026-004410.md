# A 进度：T31 默认本批材料真实请求接线

更新时间：2026-10-26（Asia/Taipei）

## 已核状态

- 已完整读取正式执行令及四份边界输入；未重开旧 job、未安装、未调研重演、未跑旧测试。
- 产品源为 `D:\Lawbeach\lawbench-A`，只读 Git HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`，与执行令一致。
- 外层 dirty 含既有成果，未清理、覆盖、暂存或提交。
- 完整 `git status` 仍在 `dsh` 子模块 worktree 元数据处被权限拒绝：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。未修锁、权限、ACL 或审批。
- root 已保全 dirty 位于 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247`。

## 核对时判断（已作为修改依据）

- 原生真实身份链已确认：`Session.beginSubmission()` 生成唯一 R，`Session.prompt(..., R)` 原样送到 Host；服务把同一 R 写进用户消息 `source.rpcId`，Agent 的 `agent/pre-step` 能读到该身份。
- 当前 A 侧导入只到引用登记；`materials_import.registered` 只有引用根，不是本批 `material_ids`。需从真实材料列表按本次所选根解析当前成员。
- 当前 `core/task/begin` 只带 `session_id/cwd`，无法把 R 与固定材料快照绑定；Agent 工具只带 `task_id`，适合由服务端按固定任务 scope 统一约束 context/list/search/read/wiki/cache。

## 已完成的实际改动

- A 输入槽已增加 `material-batch.ts/.tsx`：从真实 `materialsList` 取所选根当前成员，按会话/案件形成批次，支持逐份改选、全选、取消；导入仍只走既有引用确认，不自动发送。
- 原生 DSH 已加最小提交观察点：`beginSubmission()` 生成 R 后在 prompt 前调用 prepare，prompt 接受/失败后通知同一 R；已形成 `P-29` 主补丁与测试补丁并登记 `PATCHES.md`。
- `conversation.send` 与输入框 `sendSession` 两条路都使用同一原生 R。
- Agent 已从已 claim 用户消息 `source.rpcId` 取 R，随 `task/begin` 传递；缺同 R/同案件 scope 时 blocked 拒绝，不猜全案。
- 契约已增补 `api/request_scope.schema.json`、`task_begin` 的 R/scope 字段、任务文件的固定 scope、旧参数/新参数样例；VERSION 保持 1.6。
- 新回归源码已覆盖真实登记后建批、重复根、路径过滤、会话/案件隔离、取消/改选、同 R prepare/release、新批不被旧回调误清、Agent R 来源和缺 scope 失败。

## 当前阶段与下一依赖

- A 产品源码、契约与回归源码已完成；最终静态审计与正式交回文件已落盘。
- 验证仍按执行令未运行；不声称测试绿。
- 下一真实依赖是 root 审核后派 B 实现持久 prepare、`task/begin` 原子 claim、固定 scope 及 context/list/search/read/wiki/cache 统一过滤。
- 正式交回：`D:\Lawbeach\lawbench-coord\A-交回-T31ActualImplementation-20261026-004410.md`。

## 阻碍

- 完整 Git status 仍被 `dsh` 子模块 worktree 元数据权限拒绝；未修锁、权限、ACL、审批，也未执行任何 Git 写操作。
- 有多次只读命令误传 `shell=bash`，运行器均在执行前拒绝，没有读取/写入或启动命令；不当作验证通过。

