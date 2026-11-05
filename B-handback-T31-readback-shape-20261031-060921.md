# B-T31 原生回读形状源码交回

## 状态

- 任务：T31 原生回读消费者形状有界修正。
- 状态：**源码交付；未运行**。
- 结论：只完成批准的静态源码修正，不声称运行时通过、验收通过或证据复现成功。
- 阻碍：无。

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiNativeReadbackShape-20261031-060921\readback.mjs`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiNativeReadbackShape-20261031-060921\literal-inputs.json`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiNativeReadbackShape-20261031-060921\README.md`
- `D:\Lawbeach\lawbench-coord\B-handback-T31-readback-shape-20261031-060921.md`

## 实际形状计数

- 物理行：17。
- 事件：16。
- 批准材料：2，均含材料 ID 与 SHA。
- 真实用户消息：1；请求 ID 为批准的 `afbc784d-4238-419f-a10a-756fe8be0418`。
- `lawbench-context` 消息：1；`案件卡片（L0）` 分节：1。
- L0 文本含 `scope-a（已解析）`、`scope-b（已解析）`，不含 `scope-c`、`M0003`，不含材料 SHA。

## 五类修正

1. 扁平批准输入与旧输入逐字节一致；任务范围改查 `task.request_scope`，并校验完整范围、空 `inputs`、顶层 `session_id`、`request_id`、`case_id`。
2. 修正用户与上下文的原生 `event.data` 形状：只认真实用户来源及其 `rpcId`；上下文为唯一 `lawbench-context` 消息，直接校验唯一 L0 名称和文本；移除通用材料递归提取器。报告记录 `shape.task_scope`、`shape.rpc`、`shape.context` 三个直接布尔结果。
3. `node:module` 使用 `syncBuiltinESMExports`，在全部守卫安装后和恢复后同步；子进程边界增加 `execFile`、`spawnSync`、`execSync`、`execFileSync`。负向守卫仍在 SDK 动态导入前安装。
4. 报告为 `source_only: false`、`read_only_actual: true`；`read_count` 按实际两次读取布尔值求和，部分失败也据实反映；关闭、上下文释放和守卫恢复路径保持不变。
5. 物理头去掉 `type` 后与 `handle.header` 比较，物理事件与两次回读结果仍做全量深比较；SDK 钉值、Cordis 解析锚点、单插件、只读 mode、禁止建新会话/写入/fork、隐私错误和 stdout 输出均保留。

## 验证边界

- 已做：读取批准清单、实际原生形状和旧源码；写入本交付。
- 未做：Node/Python、import、AST/静态解析、测试、构建、GUI、HTTP、模型、Key/SSH、探测、运行第二 writer 或任何运行时验证。
- 未改：旧源码、物理案件/会话文件、SDK、配置、其他证据与旧正式文件。
- Git：严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout、push。

下游消费者应从当前 20682 字节、SHA-256 前缀 `19c473...` 的既有记录只读重开验证；不得把本文件当作已经运行过。
