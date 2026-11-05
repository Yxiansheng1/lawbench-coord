# A线请求头消费修正已交回

状态：`CONSUMER_AMEND_READY_NOT_RUN`。

唯一修改源码：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts`

- 字节：54,690
- SHA-256：`3c82c230a9b4f803163e48c9c7eff91f0522cdf89e13de8912324777053d9b68`
- 旧 `.ts` 未改：51,654 字节，SHA-256 `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93`
- 固定清单未改：SHA-256 `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522`

## 改动

消费者的有效请求头不再要求本回合新写头。它从同一原生 Session 的 `0..afterSeq` 事件前缀取最后一个真实 `request/header`，并保留会话、前后边界、源序号、源类型与 `session-prefix/current-turn` 来源范围。

若此前没有头，首回合仍必须出现当前原生头。后续稳定回合可复用前缀头；头变化时最新真实头自然成为校验对象。provider、model、maxTokens=256 的原检查保留。没有注入预期配置、追加事件、改历史、伪造 Agent 或新增全局映射。

源码依据：

- `core/session/src/surface.ts:572-582`
- `core/agent-loop/src/agent.ts:267-285`
- `core/agent-loop/src/agent.ts:592-618`
- `core/agent-loop/src/runtime-context.ts:88-102`
- `core/session/src/index.ts:780-797`
- `core/session/src/request-header.ts:63-68`

## 验证

- 六个根依赖当前字节与 SHA-256：6/6 匹配，`ALL_MATCH=True`。
- 旧 `.ts`、固定清单、旧 README：哈希未变。
- `.ts` 与 `.mts` 的只读 `--no-index` 差异只有请求头类型、边界观察器和断言接线。
- 四个提示、装配、TTY、fetch、源 pin、finally，以及 UUID、R、消息、完成态、工具禁用、provider/model/256、四次 HTTP 200、合成事实、fork 前缀、源不变、JSONL 深比较均保留。
- dirty 基线 195 行，结束时只读状态 195 行，集合差异 0。
- 本执行者未运行 Node、tsx、TypeScript、解析器、导入、测试、自检、HTTP、模型、Key、SSH、GUI 或构建。

## 非阻断限制

- `keyCleared` 不是内存擦除。
- fetch allowlist 拒绝路径可能未计入网络观测；本令禁止在本次扩展修复。
- 普通 `git status` 因 `dsh` 子模块目录权限返回非零；未修权限、ACL、审批或锁。
- 两次只读命令的工具 shell 参数误填 `native-powershell`。其中一次返回 `$p` 不被识别，一次文本检查成功；均未用 Bash，未改文件。

## 交回

正式报告：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-effective-header-20261028-013653.md`

报告内附全部实际命令、非零原因、四次 `apply_patch` 写动作及降级项。

root 下一步：独立核对上述报告和新 `.mts` 字节/哈希，再执行受控的有限编译检查。未完成该核验和后续完整四问前，不构成模型、fork、JSONL 或 T31 PASS。

没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push。
