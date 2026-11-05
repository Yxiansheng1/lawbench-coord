# A 线原生真实合成对话执行交回

## 四处回答

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 写成一个单进程 headless 消费器和启动说明。它用生产 Session Controller、真实 AgentLoop、生产 fork、真实 `llm-pi-ai` 路由和 JSONL writer，覆盖三次源对话、一次新分支追问、持久化重开。作者没有运行它。 |
| 目标是什么 | 让 root 在完整审阅后用一次真实运行得到四个 R、原生事件与 seq、不同源/子 UUID、fork 血缘、四个真实模型回答和 JSONL 重开一致性。 |
| 在等什么 | 等 root 审完全部候选源码后，在交互式 TTY 中启动固定命令并输入 Key；产物 `report.json` 出现后按其中事件、R、继承和清理字段判读。若门禁拒绝，停止并交回原命令与错误。 |
| 卡在哪 | 当前没有源码级阻塞。作者阶段按令禁止 Node、TypeScript、HTTP、模型和测试，所以真实结果尚不存在。只读 `git status` 被共享工作树子模块权限拒绝，但不影响交付，未尝试改锁或扩权。 |

## 依据与验证

- 唯一执行令：`D:\Lawbeach\lawbench-coord\A-native-real-conversation-order-20261028-000823.md`
- 输入快照：`D:\Lawbeach\lawbench-coord\NativeRealConversationInput-20261028-000823\source-inputs.json`
- 六个基准文件逐项重算：6/6 字节数及 SHA-256 与快照一致。
- 基准源码哈希：
  - AgentLoop `src/index.ts`：`853e76aef2eecafe5526a5267c3d386780b5c59e3c79c2448532fada7285a605`
  - AgentLoop `src/agent.ts`：`486662e133184cfbc8b816b445339ab0b75200fd771dba1af1562b28d8e7bdc5`
  - Agent Registry `src/index.ts`：`9979fdae64fd0a342067981c39de9cde2da7066d28f8506a501fd51e8f9068b9`
  - Session fork `src/fork.ts`：`de80ecbf0e6a7961c096a2d7f0304bc6f6c83f897268304e28352357da06bfb0`
  - 编译会话 finite fixture：`6ba19f6c3eb71a9ab08ee815ef1c2d9583a00b30a1dfef1661e268445ec9bb4e`
  - finite Vitest config：`c4df61b6e2d308e227841609ce70832d774c7ae65b89b8cf77f807769b234f1a`
- 消费器：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts`
  - 39,711 bytes
  - SHA-256 `24D9458AA87F07F35BF9C7851BC0104E01BE4B05372D12A66B0DF5C4ECCC8C73`
- 启动说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\README.md`
  - 6,259 bytes
  - SHA-256 `5E9537AEF53E9471E8FF277AB261F2BB0FA9DB3EEA77FBA04A1444746F7F514D`
- 固定启动器：`E:\node\node.exe` 与 `D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs`，均只读核对存在和字节数。
- 生产调用点均按实际源码路径读取，未猜测 `src/host`：
  - `packages/api/session-controller/src/agent.ts`
  - `packages/api/session-controller/src/commands.ts`
  - `packages/api/session-controller/src/client/sessions/session.ts`
  - `packages/core/agent-loop/src/index.ts`
  - `packages/core/agent-loop/src/agent.ts`
  - `packages/core/session/src/index.ts`
  - `packages/core/session/src/fork.ts`
  - `packages/session/session-persistence-jsonl/src/index.ts`
  - `packages/llm/llm/src/index.ts`
  - `packages/llm/llm-pi-ai/src/index.ts`
- R 由未改动的生产 `Session.beginSubmission()` 生成；消费器只把返回的 R 交给生产 `SessionCommandController.prompt()`。没有直接 append 用户消息、助手消息、turn、frame、seq 或 R。
- fork 由未改动的生产 `SessionCommandController.fork()` 发起，内部调用 `buildForkSeed()` 和生产 `ctx.agents.create()`。没有假 Agent、`Agent.send` 哨兵或模拟 provider。
- 模型固定为 `http://10.126.126.1:8000/v1`、`qwen38-27b`、`max_tokens=256`；工具注册表为空，未挂 OCR、395、标题、压缩、Keyring 或应用 lifespan。
- 网络守卫只放行 6000D 的 `/v1/*`，强制禁止重定向，删除进程内代理变量。底层 `@earendil-works/pi-ai` 的 OpenAI-compatible 路径经 OpenAI SDK `internal/shims.mjs` 默认使用全局 `fetch`，静态源码已核对。
- 凭据只接受 TTY stdin，关闭回显；拒绝环境变量、文件、命令行和重定向 stdin。stdout/stderr、错误对象和最终报告在写入前都有精确遮蔽检查。
- 私有运行根为证据目录下新建的 `run-<随机后缀>`；先确认非 reparse、为空，再将 HOME、APPDATA、TEMP、DSH_HOME 和持久化目录限制在其中。

## 运行阶段会核对

- 源 Session 与 fork Session 是生产生成的不同 UUID。
- 四个 R 是不同的 UUID v4，并与四轮原生 `user/message.source.rpcId` 相同。
- 每轮都有 `turn/start`、`user/message`、`assistant/message`、`turn/end`，结束原因为 `completed`。
- 第二、第三和 fork 追问分别命中固定合成代码、化名和金额；不命中即失败。
- 子会话 `parentSession` 指向源会话，继承前缀逐事件相等，源会话在子回答后不变。
- 关闭 writer 后重新只读打开 JSONL，源与子的完整事件和关闭前相等。
- 至少四次 6000D 请求成功且全部没有重定向；任何越界 URL 在发起前被拒绝。
- Agent、Context、Session writer、TTY 和观测器均结束，报告保留私有运行根供审计。

## 未做与降级

- 未运行 Node、TypeScript、tsx、Vitest、tsc、导入、解析、编译、测试、HTTP、GUI 或模型。
- 没有真实模型答案、真实持久化重开、真实 fork 继承结果；交回状态仅为 `AUTHORED_NOT_RUN`。
- 没有 GUI、压缩分支、案件工具、OCR、395、B 侧 scope、LegalAgent、打包、部署或费用动作。
- 没有改产品源码、旧测试、配置、source pin、runtime、18 legacy、E50、guard、patch 或 build。
- Git 全程只读；没有 add、commit、rebase、stash、reset、clean、checkout 或 push，也没有提交 SHA。
- 决策完成度四态：已合流可见 0；在飞 1（源码候选）；已裁未派工 0；候 owner 0。

## 命令与阻碍台账

- 作者实际执行的全部命令均为 `Get-Content`、`rg`、`Get-ChildItem`、`Get-Item`、`Get-FileHash` 等只读检查；没有状态写入命令。
- 非零 1：`git status --short` 返回 1，原文为共享工作树 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 的 `Permission denied`。按令未重试、未改锁、未扩权。
- 非零 2：一次只读哈希命令因 PowerShell 管道写法错误返回 ParserError；随后用同一只读范围修正为结果 6/6 匹配。
- 非零 3：若干只读工具调用误把 `shell` 参数写成 bash，均在 MXC 入口被拒绝，未执行任何命令；随后均改用固定原生 pwsh 重跑。
- 偏差：一条只读命令误用了同为绝对路径的 `native-powershell\pwsh.exe`，没有执行 bash、没有改变文件或状态。正式运行命令仍按执行令使用 `native\powershell\pwsh.exe`。

## 下一步建议

root 先逐行审阅消费器，尤其 `finally` 关闭顺序、输出遮蔽、私有根、网络守卫、生产 fork 和持久化重开断言。审阅通过后，按 README 的固定命令在 TTY 中输入本人的测试 Key；得到 `run-*/report.json` 后再决定此场景是否通过。若 root 门禁拒绝启动或输入，直接保留原错误并停止。

Response ID: `A-native-real-conversation-20261028-000823`
Response log path: chat reply
