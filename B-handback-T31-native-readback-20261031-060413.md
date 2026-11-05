# B 线交回：T31 原生 JSONL 回读源码

## 状态

- 结论：指定三个源码/说明文件已写入，**NOT RUN**。
- 本条交回只覆盖“原始 SDK JSONL 回读消费者”源码交付；不宣称 GUI 或 T31 全量通过。
- Git 严格只读：未 add、commit、rebase、stash、reset、clean、checkout 或 push；未暂存，未提交。

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiNativeReadback-20261031-060413\readback.mjs`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiNativeReadback-20261031-060413\literal-inputs.json`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiNativeReadback-20261031-060413\README.md`

## 已核对事实

- 已完整读取正式执行令及三份批准输入。
- 原始 SDK 类型明确：句柄提供 `header`、`read().events` 与 `close()`；消费者据此读取。
- 既有 GUI 物理证据记录为 17 行、16 个事件；本次没有重演 GUI，也没有重跑消费者。
- 实际会话只会被 `read` 打开；禁止 create、write、fork、迁移、修复和重建历史。
- 消费者仅安装原 `JsonlPersistence`，双开双读双关；包含网络/进程/Worker 守卫、独立清理标志和失败非零退出。

## 待根编排执行

1. 执行前独立固定真实 Cordis 解析上下文，并记录实际会话根整树 SHA、大小、时间。
2. 用批准 Node 运行一次 `readback.mjs`，把有界 stdout 重定向到本目录外。
3. 执行后再次核对实际会话根整树 SHA、大小、时间；任何变化均按红处理。
4. 依据 stdout 的 `passed`、双读/双关标志、事件计数、header ID、request ID 和守卫计数终裁。

## 阻碍与边界

- 普通 `git status --short` 在只读子模块 `dsh` 处报 `cannot chdir ... Permission denied`；未尝试修锁、改权限或扩权。`--ignore-submodules=all` 的只读状态检查可用，既有 dirty 未改动。
- 未执行 Node 或测试，因此当前没有任何新增运行时 PASS 证据。
