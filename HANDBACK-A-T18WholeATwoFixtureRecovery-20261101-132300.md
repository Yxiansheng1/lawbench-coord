# T18 WholeA 两测试恢复交回

- 执行线：A
- 交回时间：2026-11-01
- 验证等级：`AUTHORED_NOT_RUN`
- 本次运行时测试数：`0`
- 状态：有界修改已落盘，按令停止；未运行 Node、Python、解析器、检查、测试、构建、收集、HTTP、模型、GUI 或凭据操作。

## 交付

1. `D:\Lawbeach\lawbench-A\dsh-ext\tests\material-remove.spec.ts`
   - 将契约版本测试标题中的 `1.6` 改为 `1.7`。
   - 将严格相等中的期望值 `1.6` 改为 `1.7`。
   - 保留 `CONTRACT_VERSION` 与仓库 `contracts\VERSION` 的严格比对；已只读确认 VERSION 为 `1.7`。

2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\session-delete.spec.ts`
   - 只修改“原版自动事件批量落盘”fixture，并新增该观察器所需的 `AutoFlushHandle` 类型。
   - 复用 `instrumentedJsonl`，在原始 backend 的 `create` 返回时捕获 raw handle。
   - 等 router 的 `create` 返回、`observeWrites` 已安装后，被动包装 raw handle 的 `drainLive`：保存并使用已由 router 包装的原函数，透传 `this`、参数、返回和错误。
   - 调用原函数前记录 `buffered` 是否非空；仅在非空批次对应的原始 `drainLive` 成功返回后才置完成，不用空 drain 或人工 flush 伪造完成。
   - 在移动子记录前，用原有上界的 `expect.poll(..., { timeout: 2000 })` 等待真实自动排空完成。
   - 保留原有子记录移动、关闭、删除拒绝、不回收及缓存归属断言。
   - 在 dispose 前恢复 raw handle 的原 `drainLive`。

## 原因依据

原始 JSONL 的 `enqueueLive()` 会安排自动 `drainLive()`；`drainLive()` 单飞，`drainBuffered()` 逐批等待 `persistContiguous()`，后者在 `persistBatch()` 完成物化或追加后才成功。写锁/物化前置步骤可先建立记录目录，因此旧 fixture 只等待记录目录存在时，目录可能早于真实批次提交。旧断言继续关闭后就可能得到空会话路径并产生 `RECORD_UNREADABLE` 与实际 `[]` 的差异。路由的 `observeWrites()` 只在原 `drainLive` 成功返回（非空批次）后认可落盘，故本次仅在测试侧观察同一完成点。

## 修改边界与旧字节保全

- 修改前对两份目标文件执行只读 `git diff`，结果为空。
- 修改后只读 `git diff --numstat`：
  - `material-remove.spec.ts`：`2` 行新增、`2` 行删除。
  - `session-delete.spec.ts`：`27` 行新增、`2` 行删除。
- 除上述两个版本字面量、一个类型及自动落盘 fixture 的有界前置观察器/恢复外，未改其他既有测试体。
- 未改产品、router、SDK、契约、配置、断言强度、测试名模式或过滤条件；未增 sleep、延迟、人工 flush、模拟落盘标志或伪造事件。
- 沿用执行令中的既有 WholeA 结果与原始证据，未重演旧开工、安装、调研或全量测试。

## 目标文件指纹

| 文件 | 字节数 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\material-remove.spec.ts` | 14832 | `6CEEC42D439C30982F9155325569893C4A1776FF4AB26FDA7738DD0E34492A0B` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\session-delete.spec.ts` | 29687 | `E0BFD80E2A0D821B4D6412931390494DED77EA4429C2665EF696EF833FE01C62` |

## Git 与验证限制

- Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 只读 `git status --short` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而失败。按令未尝试修权限、改 ACL、改锁、扩权或切换沙箱。
- 按令未运行测试或任何动态检查，因此不宣称两份测试通过；本交回只是 authored change 与静态范围记录，运行时测试数为 `0`。
- 未联系其他聊天，未更换 API，未启动第二 writer。
