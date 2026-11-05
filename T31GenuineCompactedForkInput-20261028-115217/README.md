# T31 原生真实合成对话与 fork 消费器

状态：`AUTHORED_NOT_RUN`。作者本阶段没有启动 Node、TypeScript、测试、HTTP 或模型。

## 目标

这个独立进程用当前生产源码完成一条受控的真实对话：

1. 生产 Session Controller 创建一个新的普通 Session，身份由生产代码生成。
2. 生产 `Session.beginSubmission()` 生成每条请求的 R。
3. 三个短提示经 `SessionCommandController.prompt()`、真实 `AgentLoop` 和未改动的 `llm-pi-ai` 路由发往 6000D 的 `qwen38-27b`。
4. 第四个提示发往生产 fork 操作生成的子 Session，检查 `LB-SYN-FORK-27`、林岚、2700 元三个固定合成事实是否继承。
5. 关闭 Agent、Session、持久化和进程内观测资源后，重新只读打开同一 JSONL 根，核对源会话与子分支的完整事件相同。

这里只证明普通会话和 fork。没有 GUI、压缩、案件工具、OCR、395、打包、部署或费用动作。

## 固定输入

- 输入快照：`D:\Lawbeach\lawbench-coord\NativeRealConversationInput-20261028-000823\source-inputs.json`
- 六个基准文件：字节和 SHA-256 均与快照一致，核对时间为 2026-10-28。
- Node：`E:\node\node.exe`，manifest 记录 `v24.21.0`，93,580,104 字节。
- Loader：`D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs`，120,402 字节。
- 模型：`http://10.126.126.1:8000/v1`，`qwen38-27b`，请求默认 `max_tokens=256`。
- 持久化：生产 JSONL writer，`compression: none`。
- 工具：`ToolRuntime` 已挂载，但注册表为空。

## 调用链

源码入口都在 `D:\Lawbeach\lawbench-A\dsh` 内。

| 步骤 | 生产源码 |
|---|---|
| 组装 Context 与 LLM seam | `packages/llm/llm/src/index.ts`、`packages/llm/llm-pi-ai/src/index.ts` |
| 创建普通 Session/Agent | `packages/api/session-controller/src/agent.ts` 的 `ApiSessionAgentController` |
| 发送与 fork | `packages/api/session-controller/src/commands.ts` 的 `SessionCommandController.prompt()` 和 `.fork()` |
| 生成 R | `packages/api/session-controller/src/client/sessions/session.ts` 的 `beginSubmission()` |
| 真实 Agent 循环 | `packages/core/agent-loop/src/index.ts`、`packages/core/agent-loop/src/agent.ts` |
| Session 与 fork seed | `packages/core/session/src/index.ts`、`packages/core/session/src/fork.ts` |
| 实际持久化 | `packages/session/session-persistence-jsonl/src/index.ts` |

`beginSubmission()` 只用来取得生产代码生成的真实 R。Host 端仍由生产 `SessionCommandController.prompt()` 创建并落盘用户消息；消费器没有直接 append 任何历史、消息、seq、R 或 frame。

fork 调用的是生产 `SessionCommandController.fork()`。它读取最新完整轮次，使用 `buildForkSeed()`，再由 `ctx.agents.create()` 发布子 Session。消费器没有构造假 Agent，也没有用 `Agent.send` 哨兵。

## 凭据和网络

凭据只从交互式 TTY stdin 读取，读入时关闭终端回显；不接受命令行、环境变量、文件、管道、Keyring 或配置。

消费者在模型调用前安装进程内网络守卫：

- 只允许 `http://10.126.126.1:8000/v1/*`。
- 强制 `redirect: "error"`。
- 删除进程内的 HTTP/HTTPS/ALL proxy 变量，并关闭 Node env proxy。
- 记录时间、方法、URL、状态，不记录请求头、请求体、响应体或凭据。
- 在模块加载前把 HOME、USERPROFILE、APPDATA、LOCALAPPDATA、TEMP、TMP、DSH_HOME 指向新运行根。

`llm-pi-ai` 的 OpenAI-compatible 路径使用 OpenAI SDK；其 `internal/shims.mjs` 默认取全局 `fetch`，所以本次守卫覆盖实际模型传输入口。最终仍以 root 的运行观察为准。

stdout/stderr 在密钥读入后安装精确字符串遮蔽器。错误对象、报告和最终摘要均先遮蔽再输出；报告写入前还会再次检查完整 JSON 不含原始凭据。

## Root 启动

先由 root 审阅本文件全部源码。完整通过后，在已提供的交互式输出窗口中执行以下命令；命令不接收额外参数，也不承载 Key。

```powershell
Set-Location 'D:\Lawbeach\lawbench-A\dsh'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts'
```

启动后会提示输入 6000D 测试 Key。输入窗口必须保持 TTY；重定向 stdin 会被拒绝。

每次运行在证据目录下新建空的 `run-<随机后缀>`：

- `run-*/sessions/`：生产 writer 写出的合成 Session JSONL。
- `run-*/workspace/`：普通 Agent Session 的私有工作区。
- `run-*/report.json`：状态、进程元数据、四个 R、实际事件与 seq、网络观察、fork 血缘、持久化重开和清理结果。

运行器不会删除该运行根，便于 root 复核；所有模型、Agent、Context、writer、TTY 和观测器在报告前已自然关闭。

## 判定

只有以下条件同时满足，`report.json` 才写 `status: "PASS"`：

- 源 Session 和子 Session 的身份均为生产生成的不同 UUID。
- 四个 R 均为不同 UUID v4，且每个 `user/message.source.rpcId` 与对应 R 相同。
- 每轮都有原生 `turn/start`、`user/message`、`assistant/message`、`turn/end`。
- 每轮 `turn/end.reason.kind` 为 `completed`，请求头为固定 provider/model，`maxTokens=256`，无工具调用。
- 第二轮回答含合成代码，第三轮含虚构化名和金额。
- fork 子会话的 `parentSession` 指向源会话，`isSeeded=true`，继承前缀逐事件相同，源会话未被修改。
- 子分支回答同时含合成代码、虚构化名和金额。缺失或答错直接失败，不使用替换答案。
- 关闭后重新打开 JSONL，源会话与子会话事件均与关闭前完整相等。
- 至少观察到四个成功的 6000D 请求；每次请求都拒绝了重定向。
- 所有清理动作成功。

## 仍未验证

本作者阶段未执行上述命令，因此没有真实模型答案、真实请求计数、真实持久化重开或真实 fork 继承结果。不要据本 README 声称 T31 完成、GUI 可用、压缩分支可用或工具工作流通过。

删减轮：读者 4 / 槽位 2 / 半句 3 / 重复 1 / 过程 1 / 黑名单 0
