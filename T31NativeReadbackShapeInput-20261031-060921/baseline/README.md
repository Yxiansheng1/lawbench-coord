# T31 原生 JSONL 回读消费者

状态：源码已交回，**NOT RUN**。本目录不宣称 T31 全量通过；它只提供一个由根编排执行的一次性只读回读消费者。

## 事实边界

- 原始 GUI 证据的既有物理计数为 17 行、16 个事件；本源码交付未重新执行 GUI，也未重新验证该计数。
- `literal-inputs.json` 是批准输入的逐字快照；未自哈希，不能替代根编排对源根与真实日志的独立校验。
- 根编排须在导入前固定依赖上下文，并在消费者前后独立核对实际会话根整树的 SHA、大小与时间。

## 消费者范围

`readback.mjs` 从原 SDK 包的 `package.json` 锚点解析真实 Cordis，再仅加载原编译 `JsonlPersistence`。上下文中只安装这一个插件，以 `read` 访问已批准会话两次，分别关闭句柄，再与原始 JSONL 的首行 header 和事件行做严格比较。

消费者还会核对：

- 物理行数与事件数为 17/16。
- header 为未 seeded 的真实会话 ID。
- 唯一 `user/message` 的 `source.rpcId` 等于批准 request ID。
- 唯一 `context/l0` 仅含批准的两个材料 ID 与 SHA，不含 scope-c。
- `task.json` 的 scope 与批准 scope 完全一致。
- 双次 `open/read/close` 均有独立标志和计数。

运行前拦截网络、TLS、HTTP(S)、spawn/exec/fork 和 Worker；若出现调用，固定记录后立即失败。所有句柄在 `finally` 中关闭，上下文随后 dispose，守卫最后恢复。失败时退出非零，不伪造通过。

## 未做事项

本交付未执行 Node、导入 SDK、解析实际日志、测试、构建、GUI 或全量回归；未写真实会话根；未修改 Git 索引、锁、审批或沙箱。
