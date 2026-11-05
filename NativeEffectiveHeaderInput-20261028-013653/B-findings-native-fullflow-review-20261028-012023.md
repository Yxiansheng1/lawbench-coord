# 原生四问与 fork 全流程独立复核

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 对冻结消费者、无 Key 预检原始记录、22 个关键源码快照做了静态复核，并逐条对照当前实际源码。 |
| 目标是什么 | 判断 READY 消费者能否真实完成三问原会话、生产 fork、第四问和 JSONL 重开校验收据。 |
| 在等什么 | 等主编排决定是否允许一次由真人现场提供临时 Key 的完整运行；没有该动作，模型、fork 与持久化不能宣称 PASS。 |
| 卡在哪 | 本次按令不运行，且没有 Key；因此完整模型链是不确定项，不是已证伪项。 |

## 结论

判读：`NO_CONFIRMED_BLOCKING_ACTUAL_SOURCE_DEFECT`。

在当前 22 个关键运行时源码与消费者源码一致的前提下，没有找到会必然阻断消费者完成三问、生产 fork、第四问或重开持久化的源码缺陷。现有原始证据只支持“生产接线与无 Key 预检已通过”，不支持“完整四问 PASS”。`whole_native_conversation_PASS=false` 与 `GUI=false` 的原始口径正确。

有一条已确认但不阻断本次范围的报告缺口，位于网络拒绝审计，见下一节。完整运行仍是唯一能够关闭的验收空档。

## 已确认的阻断级源码缺陷

无。

判定依据来自对以下真实调用关系的逐项核对：BrowserSession 请求号与服务端准入、ReactLoopInbox 与 AgentLoop、凭据引用解析、OpenAI SDK fetch 入口、三问事件窗口、生产 fork seed、第四问、JSONL 关闭排空与重开。核对后没有发现静态矛盾；未运行不能单独构成无缺陷证明。

## 已确认的非阻断源码缺口

### fetch allowlist 拒绝没有进入网络观测

- 消费者 `native-real-conversation.mts:526-547` 在 allowlist 不匹配或 URL 含内嵌凭据时直接抛错。
- 网络观测对象直到 `native-real-conversation.mts:549-564` 才创建并入数组。
- 因此完整模式中一次被 allowlist 拒绝的请求不会出现在 `network`，也不会增加 `closedAttempts`；它只会以抛错或上游失败体现。

实际影响：越界请求仍会在发起网络 I/O 前被拒绝，安全边界成立；报告对“曾尝试但被拒绝”的审计并不完整。当前固定 SDK 路径没有发现其它 fetch 入口，所以这不是已证实的越界连接。

## 推演项与未决运行空档

以下内容只能由一次真人现场输入临时 Key 的完整运行关闭：

| 未决项 | 当前证据 | 为什么仍不能算 PASS |
|---|---|---|
| 6000D 实际可达且接受固定路由 | 配置固定为 `qwen38-27b`、`openai-completions`、所外 HTTP `10.126.126.1:8000/v1`、256 tokens。 | 无 Key 预检没有发出模型请求，原始记录明确为零。端点、模型名和 SSE 响应只能运行验证。 |
| 三问真实记忆 | 消费者具备真实命令、AgentLoop 和事件窗口断言。 | 没有模型输出，不能确认上下文、回答事实和非空 assistant 事件。 |
| 生产 fork 与继承前缀 | 生产 `commands.fork` 会读取实时 Session、生成 seed、创建子 Session。 | 预检只创建了空源 Session，没有执行 fork，也没有继承前缀可验。 |
| fork 后第四问 | 子 Session 和 Agent 的生产创建路径静态相符。 | 没有第四次模型调用或子分支回答。 |
| JSONL 关闭与重开 | JSONL 句柄关闭会反复排空 live buffer，完整测试会在销毁后重新读取。 | 预检没有执行关闭后的四问日志重开。 |
| 完整模式 fetch 覆盖 | OpenAI 构造时读取当前 `globalThis.fetch`，消费者在加载依赖前安装包装器。 | 静态覆盖成立，但实际 zero/非 zero 请求数仍只能从完整运行原始记录获取。 |

超时方面，模型流有固定 300 秒 idle watchdog，`commands.create`、`commands.fork`、`commands.prompt` 与 `whenIdle` 外层有 86,400 秒技术 watchdog。TTY Key 等待本身无技术超时，这是交互式输入的设计选择；`setupProduction`、最终资源销毁和持久化重开不在该技术 watchdog 内。它们没有形成已确认的静态死锁，但完整运行若卡在这些阶段，可能长时间不产出报告。

## 逐条调用链判断

### 1. BrowserSession 请求号与真实 Agent 回合

判断：静态条件相符。

- 消费者 `native-real-conversation.mts:1193-1209` 调用 `BrowserSession.beginSubmission`，把返回请求号传给生产 `commands.prompt`，随后等待真实 Agent 的 `whenIdle()`，再按 Session seq 切本轮事件。
- 当前 `Session.beginSubmission` 在 `session.ts:229-244` 铸造 UUID v4 并登记浏览器本地 echo。
- 生产 `commands.prompt` 在 `commands.ts:320-421` 校验准入，并在 `commands.ts:369-380`、`409-411` 把同一请求号写成原生 `user/message.source.rpcId`，再调用 `agent.followup`。
- `agent.ts:163-164` 把该消息送入 next-turn，`agent.ts:237-242` 的真实 `whenIdle()` 等待驱动收敛。
- 回合事件由实际源码写入：`agent.ts:305` 写 `turn/start`，`agent.ts:404` 写准入后的 `user/message`，`agent.ts:505-511` 写 `assistant/message`，`agent.ts:368` 写 `turn/end`。
- 第二、三问不是误判：持久 surface 代际在 `agent.ts:593-618` 决定写入 `request/header(reason=series)`，因此每问事件窗口内仍可找到固定 header。消费者的 `assertTurn` 还校验请求号、`turn/end(reason.kind=completed)`、非空助手文本及 provider/model/maxTokens。

边界：消费者只用 BrowserSession 生成请求号，没有把浏览器本地 echo 的结算事件回灌给该对象；真正执行路径是生产命令控制器和真实 AgentLoop。它足以验证当前无头生产命令链，不等同于浏览器 RPC 往返测试。

### 2. 凭据引用与无匿名回退

判断：静态条件相符。

- 消费者 `native-real-conversation.mts:951-959` 提供进程内 credentials seam；只对固定引用 `LAWBENCH_6000D_KEY` 返回值，写入和记录读取均拒绝或为空。
- 当前 provider 配置把 `apiKeyEnv` 作为凭据引用验证并保存，见 `config.ts:93-94`、`327-341`、`490-500`。
- 当前 `index.ts:187-204` 明确区分“未命名凭据”和“命名凭据缺失”。命名引用存在时通过 `ctx.credentials.resolve(ref)` 解析；空值抛 `MISSING_CREDENTIAL`，不会回退全局 provider 凭据。
- 自定义非目录 provider 使用 harness API-key 方法，见 `provider.ts:77-84`、`131-134`、`184-190`。
- 实际 key 由 `adapter.ts:357` 解析并作为请求级 `apiKey` 传入 `adapter.ts:389-398`；pi-ai 的显式 key 认证优先于存储记录和环境发现。

边界：没有完整运行，所以只能确认认证路由的静态条件，不能确认提供者接受该 Key。消费者没有把 Key 写入环境、文件、命令行或报告。

### 3. 网络 allowlist 与当前 SDK fetch 覆盖

判断：安全边界充分，完整运行审计仍待实测。

- `native-real-conversation.mts:519-589` 在 Key 未就绪或预检模式直接拒绝 fetch；Key 就绪后只允许目标协议、主机、端口、无内嵌凭据且路径以 `/v1/` 开头，并强制 `redirect:'error'`、`cache:'no-store'`。
- 包装器在 `native-real-conversation.mts:1119` 安装，早于 `setupProduction` 的生产依赖加载。
- 当前 OpenAI `6.40.0` 客户端在构造时取 `options.fetch ?? Shims.getDefaultFetch()`，见 `openai/client.mjs:155-157`；pi-ai 的 OpenAI-compatible 路径在构造时传入请求选项中的 fetch，见 `openai-completions.js:202`、`572-578`。这里没有设置独立 fetch，因此实际使用消费者包装的全局 fetch。
- OpenAI-compatible 路径把 SDK 内重试固定为 0，见 `openai-completions.js:208-217`；适配器还传入 `maxRetries: 0`，见 `adapter.ts:129-130`。消费者没有加载额外的 LLM 重试插件，所以静态成功路径的 HTTP POST 上限为四问各一次。

边界：无 Key 预检测得零请求，不能证明完整模式的响应状态、SSE 解析或四问各一次。allowlist 拒绝未计入观测的问题见上文非阻断缺口。

### 4. 生产四问、fork、继承与重开

判断：静态条件充分。

- 消费者 `native-real-conversation.mts:1225-1230` 依次执行三问并断言合成事实。
- 生产 `commands.fork` 在 `commands.ts:230-313` 从实时 Session 观察最新完成边界，创建生产 seed，设置 `parentSession`、`isSeeded` 与精确 `inheritedEventCount`，再通过真实 Agent 工厂创建子 Session。
- 当前 Session 构造器在 `session/index.ts:598-621` 校验继承计数，并在正确切点写入 `session/end-seed(inherited=true)`。
- 消费者 `native-real-conversation.mts:1251-1286` 校验不同 UUID、父身份、精确前缀、源流不变、子 Session 有继承标记，再执行第四问并再次校验源流不变。
- JSONL 写句柄关闭时会在 `storage.ts:223-258` 反复排空 live buffer；`storage.ts:535-546` 将实时事件和 flush 路由到写句柄。消费者在销毁后重开源与子日志，并对完整事件数组做深比较，见 `native-real-conversation.mts:1288-1311`。

边界：所有静态条件都相符，但无完整运行，不能宣称继承前缀、第四问回答或 JSONL 深比较已经实测通过。

### 5. 错误、秘密输出与资源收尾

判断：主要路径充分，内存擦除说法需降级。

- TTY 读取在 `native-real-conversation.mts:417-517` 使用 raw mode、拒绝非交互输入、限制 4096 字节、支持取消并恢复终端状态。
- 输出重定向在 `native-real-conversation.mts:592-640` 同时包装 stdout/stderr；`safeError` 在 `653-668` 递归净化消息与 cause；报告写盘前再次执行整对象净化和精确 secret 包含检查，见 `1426-1436`。
- `finally` 在 `native-real-conversation.mts:1319-1385` 收集 Session 快照、浏览器 dispose、Agent/session fiber dispose、fetch、环境、stdin、输出重定向的失败；资源错误会令成功状态转为 `FAILED`。
- 完整模式的 `credential` 位于 `native-real-conversation.mts:1170-1315` 的分支作用域；分支结束后报告收尾只保留 `secret` 和输出重定向器中的引用，并在 `1430-1433` 先后清空后写入 `keyCleared=true`。这证明代码级引用清理，不能证明 JavaScript 不可变字符串被内存擦除。完整运行成功后进程退出，该语义边界不阻断一次性测试。
- 原始预检的 `outputRedactionRestored=false` 不矛盾：预检没有 Key，也没有安装输出重定向租约；该字段不参与预检成功门。其它零网络、零 Key、零 prompt 与完整资源销毁条件都在 `1397-1416` 校验。
- 在消费者报告结构、网络观测、错误净化和最终写盘路径中，没有发现 Key 字段或原文落盘条件；完整运行仍应复核实际 `report.json`。

### 6. 生产服务影响

判断：固定成功路径的服务影响有界；绝对请求数仍以完整原始记录为准。

- 合成事实固定在 `native-real-conversation.mts:35-46`，没有真实案卷输入。
- 路由固定在 `native-real-conversation.mts:20-25`、`965-988`，不读取产品异地路由，也不自动切换所内地址。
- 成功的逻辑模型回合固定为三问加 fork 后一问，maxTokens 为 256；SDK 重试为 0。当前消费者不加载额外 LLM 重试插件。
- 加载面只有 Session、Agent、LLM、持久化、查询和生产 Session Controller；没有 SSH、OCR、GPU 或产品服务改配动作。

边界：实际 6000D 资源占用、HTTP 次数和延迟要等完整运行；无 Key 预检只能证明接线未提前触网。

## 原始证据读数

只引用协调目录中的原始记录，不把旧切片重新运行。

- 原始根记录 `native-real-no-key-preflight-root-current.json`：一次成功执行，`exit_code=0`，耗时 2.015 秒，`natural_exit=true`，`forced_stop=false`；初始 4 个进程身份，结束时 `OS_after=[]`。
- 同一记录：46 个固定输入最终未变，消费者 SHA-256 为 `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93`。
- 消费者报告 `report.json`：`turns=0`、`network observations=0`、`modelPostAttempts=0`、`modelPostHttp200=0`、`closedAttempts=0`、`nativeEvents=0`、`promptsSubmitted=0`。
- 根记录：`Key_reads=0`、`HTTP_model_requests=0`、`whole_native_conversation_PASS=false`、`GUI=false`；判词为 setup-only PASS。
- 本次复核执行的产品运行时、解析器、导入、Node、Python、tsx、测试、tsc、HTTP、模型、Key、SSH、GUI、构建和自检次数均为 0。`AUTHOR_RUNTIME=0`。
- 执行令所述的早期 `.ts` CJS 失败与随后同字节 `.mts` ESM 通过，未由本次复核重演；本次只读取其冻结输入与原始结果。

## 源码新鲜度与工作目录

- 起点和终点各核对 22 个关键源码：实际文件 22/22 匹配字节与 SHA-256，协调目录快照 22/22 匹配。
- 消费者为 51,654 字节，SHA-256 与执行令一致；固定输入清单为 14,284 字节，SHA-256 为 `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522`。
- `source-map.json` SHA-256 为 `a8080dfd2e6fc2a44c4d2e25b7495ee320a0e9421bd54fc30686d78d6b5717ae`。
- B 线 dirty 基线 101 行，当前用只读 `git status --porcelain=v1 --branch --ignore-submodules=all` 得到 101 行，差异 0 行。
- 首次不带忽略项的只读 Git 状态进入子模块时被既有权限拒绝，错误为 `cannot chdir ... modules/dsh: Permission denied`。按令未尝试修锁、改 ACL、改审批或扩权；后续只读状态使用忽略子模块模式完成。

## 依据与验证

- 冻结消费者：`D:\Lawbeach\lawbench-coord\NativeFullflowReviewInput-20261028-012023\native-real-conversation.mts`
- 固定输入清单：`D:\Lawbeach\lawbench-coord\NativeFullflowReviewInput-20261028-012023\fixed-inputs.json`
- 关键源码映射：`D:\Lawbeach\lawbench-coord\NativeFullflowReviewInput-20261028-012023\source-map.json`
- 原始预检根记录：`D:\Lawbeach\lawbench-coord\NativeFullflowReviewInput-20261028-012023\native-real-no-key-preflight-root-current.json`
- 原始消费者报告：`D:\Lawbeach\lawbench-coord\NativeFullflowReviewInput-20261028-012023\report.json`
- B 线起始 dirty：`D:\Lawbeach\lawbench-coord\NativeFullflowReviewInput-20261028-012023\B-dirty-before.stdout.txt`
- 当前源码根：`D:\Lawbeach\lawbench-A\dsh\packages\`

## 未做与降级

- 未运行完整模式，未请求或读取 Key。
- 未重演旧预检、旧失败命令或旧全量测试。
- 未验证 Qwen 实际响应、四问真实记忆、生产 fork 运行结果、重开日志深比较或完整网络计数。
- 未读取 DSH 业务历史、缓存、rollout、凭据、环境文件、密钥环或真实案卷。
- 未修改产品、测试、fixture、配置、旧记录或 Git 索引；没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push。

## 下一步建议

若无需要关闭的运行空档，主编排可把本结论作为“源码静态门通过、完整运行未证”的输入，但不能据此发布完整四问 PASS。若决定继续，唯一合适动作是由真人现场提供临时 Key，执行一次已冻结消费者的完整模式，并把原始 `report.json` 与网络、事件、fork、重开断言交给独立复核；不要由本执行者补跑，也不要用预检结果替代。

删减轮：读者 1 / 槽位 0 / 半句 0 / 重复 2 / 过程 1 / 黑名单 7

Response ID: 本次聊天未提供

Response log path: chat reply
