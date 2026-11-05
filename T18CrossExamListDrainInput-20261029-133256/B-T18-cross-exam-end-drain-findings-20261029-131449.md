# B 线独立复核：T18 质证意见 task/end 排空竞态

日期：2026-10-29 13:14:49（Asia/Taipei）

执行令：`D:\Lawbeach\lawbench-coord\B-T18-cross-exam-end-drain-review-order-20261029-131449.md`

## 1. 结论

Verdict：**CLEANUP_RACE_SOURCE_CONFIRMED; FINITE_PROOF_PENDING; PRODUCT_FIX_SCOPE_IDENTIFIED**

现有代码顺序与实际封闭运行时间线共同支持以下结论：A 线消费者的 `agent.whenIdle()` 只等到 Agent 驱动空闲，不等待由 `session/event` 监听器异步发起的 `/core/progress` 和 `/core/task/end`。消费者随后因测试消费者自身的 `case_list_materials` 断言提前失败，进入 `finally`，在真实 `task/end` 调用完成前关闭 B 服务，导致两次 task/end 都得到 `SERVICE_UNAVAILABLE`。

这不是新的产品崩溃，也不是监听器或进程泄漏。B 服务的七个自有完成 OS 进程均已离场、`Listen0=true`、全部关闭标志为真；失败退出是有限测试 B 的 `cross_exam_route_count`。

本结论目前是“源码路径 + 实际时间线”支持，尚未由本轮写出并执行有限测试。当前执行令禁止运行测试，下一实现必须补该证明。

原始报告必须保持 `FAILED`。清理竞态修好后也不能把它改写为 PASS，也不能据此声称 T18 整体通过。

## 2. 既有事实与完整性

### 2.1 本次复用的事实

- 原始封闭运行：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T18CrossExamRecoveryActualClosed-root-20261029-131218`
- 指向文件：
  `D:\Lawbeach\lawbench-coord\T18CrossExamL0ListingInput-20261029-131449\T18-cross-exam-recovery-cleanup-cause-current.json`
- 实际运行根：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CrossExamCallbackRecovery-20261029-122319\run-zs09S1`
- 独立确认：三问答案 `stance/scope/need_questions` 实际成功；L0 在 seq 5 实际列出当前批五份材料；primary Skill 的步骤 1 允许 L0 或材料清单。
- 消费者把 `case_list_materials` 设为无条件必需，是消费者假阴性。因此原始错误：
  `actual tool loop lacks case_list_materials`
  不能升级为产品崩溃或模型失败。

### 2.2 源码与证据哈希

| 对象 | SHA-256 |
|---|---|
| A `dsh-ext\agent\index.ts` | `5366f8454189cbfeecd5d71142c026549fe010e9853b1d9a119a461cc1fd630c` |
| A `dsh-ext\agent\task-state.ts` | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |
| A `dsh-ext\shared\core-client.ts` | `5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50` |
| 冻结消费者 `native-cross-exam.mts` | `6ab1f2e564c7f4b1691308fdcfdb0d315b5e7057f6e0b8710f1684fc26607454` |
| 实际有限 B `b-service-cross-exam.py` | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| 实际 Native Session JSONL | `adbca9d61673e8d4768446905d61c0c8da79c74651e0426d2cdb3437596f5f29` |

实际消费者、实际 B 服务哈希与冻结清单一致，复用的是原始证据，不是新源码。

### 2.3 Git 只读核对结果

- B 当前 HEAD：`dc56a93`。
- `git -C D:\Lawbeach\lawbench-A rev-parse/status`：被文件系统拒绝，`cannot change to 'D:\Lawbeach\lawbench-A': Permission denied`。
- B `git status`：进入子模块 `modules/dsh` 时被拒绝，`Permission denied`。
- 没有尝试提权、修复权限、删除锁、setup、切 legacy 或任何 Git 写入。
- A 当前 dirty 哈希以既有 `A-tracked-dirty-pins.json` 为准确认；上述 A 源文件哈希与 pin 一致。

这些只读阻碍不影响本源码审计交付，也绝不是需要修改 `index.lock`、ACL 或审批的理由。

## 3. 实际时间线与闭合事实

关键 UTC 时间：

| 时间 | 事实 |
|---|---|
| `05:02:06.119` | Native `turn/end`，seq 47，reason `completed` |
| 约 `05:02:06.1` 起 | 消费者已进入提前失败后的清理路径，B 收到 stop 并开始退出 |
| `05:02:06.142` | A 的 `/core/progress` 尝试已不可达 |
| `05:02:06.292` | B `b-service-final.json` 完成；监听器已关闭 |
| `05:02:06.737` | A 第一次 `/core/task/end`，不可达 |
| `05:02:06.742` | A 第二次 `/core/task/end`，不可达 |

实际结果：

- `09-task.json`：`state=running`
- B protocol：`POST /core/task/end=0`
- B 失败：`cross_exam_route_count`
- Agent 日志：两次 `agent.task_end_failed / SERVICE_UNAVAILABLE / reason=completed`
- B final：listener/log/netClient/retainer 均关闭，outbound 与凭据访问均为 0
- `sourceGET=0`，production JSONL reopen 未到达

时间线不是产品进程崩溃后的资源残留；它精确落在消费者提前失败和 B stop 之间。

## 4. 因果源码链

### 4.1 `whenIdle` 的语义边界

`D:\Lawbeach\lawbench-A\dsh\packages\core\agent-loop\src\agent.ts`

- 237-242：`whenIdle()` 只等待 `activityDone`，并跟踪它是否被替换；没有等待外部 session observer 的异步副作用。
- 296-371：`turn()` 在 finally 中同步追加 `turn/end`；之后驱动才进入 idle。

因此，`turn/end` 已经出现在 Session 中，并不等于 A 的 `onSessionEvent` 里的 Core HTTP 调用已经完成。

### 4.2 session event 是 observe-only、fire-and-forget

`D:\Lawbeach\lawbench-A\dsh\packages\core\session\src\index.ts`

- 395-419：observer 被调用后，返回 Promise 只挂 `.catch`，不进入任何可等待队列。
- 722-765：`append()` 同步写入事件并调用 observer；`invokeContainedSessionObservers()` 明确不返回、不等待。

`D:\Lawbeach\lawbench-A\dsh\vendor\cordis\src\events.ts`

- 183-196：`emit()` 同步调用监听器并丢弃返回值；`parallel()` 才会等待。
- 288-301：`ctx.on()` 注册普通 emit 监听器。

这是 DSH 有意采用的 observe-only 隔离，不应通过把关卡改成 `session.append` 全局异步来修。

### 4.3 A 产品监听器又显式丢弃 Promise

`D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`

- 599-615：`onSessionEvent()` 自己会 `await` progress、`finishLoop()` 和 `endTask()`。
- 714-716：

```ts
ctx.on('session/event', ((session, event) => {
  void agent.onSessionEvent(session.id, event).catch(...)
}) as never)
```

- 542-551：`endTask()` 先按精确 `TaskState` 组装 body，最多尝试 2 次；只有 `r.ok` 才返回 true。
- 557-563：Agent idle 的兜底只处理“任务仍挂在 tasks map”的情况；正常 `endTask()` 一开始已从 map 删除任务，所以它不能排空在途 Promise。
- 706-716：idle 监听器的 2 秒兜底与此竞态无直接修复作用。

因此：

1. `void onSessionEvent(...)` 没有可等待句柄。
2. `agent.whenIdle()` 不可能等它。
3. 消费者在 `finally` 再调用一次 `whenIdle()` 也不会补上这个等待。

### 4.4 精确的 case/session/task 绑定已经在 TaskState

`dsh-ext\agent\index.ts`

- 271-328：task/begin 成功后，用真实 `task_id`、`case_id`、agent/session id 建立 `TaskState`。
- `dsh-ext\agent\task-state.ts` 113-131：TaskState 保存 `taskId/caseId/sessionId`。
- `dsh-ext\agent\index.ts` 542-548：`task/end` body 只使用该精确 TaskState 的 `task_id`；不是重新猜任务，也不是另造提交器。

注意：`endTask()` 在发起 HTTP 前从 `tasks` map 删除状态。新的 drain 台账必须在删除前捕获该精确任务对象或 task id，不能在清理结束后再读 `tasks.get(...)`。

### 4.5 消费者关闭顺序

冻结消费者 `native-cross-exam.mts`：

- 2664-2670：提交 prompt，然后 `await agent.whenIdle()`。
- 2709-2718：消费者自身的 missing-tool 断言失败；这是原始主错误，不是产品错误。
- 3297-3334：`finally` 再次 cancel/whenIdle，然后立即 `service.stop()`；这里没有等待 `onSessionEvent` 返回 Promise。
- 3215-3225：成功主路径也会在分析后直接 `service.stop()`，同样没有专门的 task-end 排空。
- 3318-3334：B stop 是清理顺序中即将关闭监听器的时间点。

`startBService()` 1280-1288 写 `stop` 并等子进程；实际 B `b-service-cross-exam.py`：

- 1012-1020：收到 stop 后设置 `server.should_exit`。
- 1045-1049：服务退出后关闭 socket。
- 1068-1078：最终要求 `/core/task/end` 恰好 1 次。

这就是两条 task/end `SERVICE_UNAVAILABLE` 的直接关闭窗口。

## 5. `NetworkObservation` 为什么不能作为结束成功证据

冻结消费者 `native-cross-exam.mts` 1113-1175：

- 1166：等待 `fetch` 返回 Response，通常只到响应头。
- 1167-1169：随后立即把 `status/outcome=completed/finishedAt` 写入 observation。
- 此时 JSON body 尚未被 `CoreClient` 消费，更没有 `ok` 或响应契约确认。

`dsh-ext\shared\core-client.ts` 24-72：

- 46-55：fetch 使用 60 秒 `AbortSignal.timeout`。
- 57-71：之后才 `res.json()`、读响应体、校验契约并返回 `CoreResult`。

所以：

- `NetworkObservation.completed` 只能证明 HTTP 头返回；
- 不能证明 `task/end` body 已读、`ok=true`、后端已落终态。

真正的 task-end 成功证据必须是 `CoreClient.call('task/end').ok === true` 之后的结果，或随后只读 `GET /api/tasks?case_id=` 看到的精确任务行已离开 `running`。

## 6. 推荐的最小产品修复

### 6.1 修复位置

首选只改 A 产品插件 `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`，再由消费者调用排空接口；不要改 Cordis session 核心的 observe-only 语义。

原因是 `LegalAgent` 自己拥有：

- session → TaskState 的精确对应；
- `endTask()` 的一次性和两次重试；
- progress、错误码和 reason 语义；
- idle 兜底。

### 6.2 最小改动形状

1. 在 `LegalAgent` 内增加按 session id 串行化的 event-effect tail/ledger。
2. `ctx.on('session/event', ...)` 仍可立即返回，但必须把 `onSessionEvent()` Promise 放入 tail，而不是只写 `void`。
3. `onSessionEvent()` 的 turn/end 分支保留原逻辑，并返回或记录：
   - 精确 `taskId`
   - `caseId`
   - `sessionId`
   - `endTaskOk`
   - 是否存在未完成的 Core 副作用
4. 增加一个窄排空方法，例如：

```ts
async settleSessionEvents(sessionId: string): Promise<SessionEventSettlement>
```

它循环等待当前 session 的 tail，直到调用时的所有已入队事件副作用完成。新事件不应被无界追等；消费者只在唯一 turn 已结束时调用。

5. 通过 Cordis 现有 `ctx.provide('lawbenchAgent', agent)` 暴露该内部服务。消费者用 `production.live.get('lawbenchAgent')` 取其排空方法。

不要把 `LegalAgent` 对象直接作为 `apply()` 返回值：Cordis 把函数插件返回对象视作 effect，可能触发 `Invalid effect`。`provide` 是现有服务机制，不增加路由或存储。

### 6.3 消费者清理顺序

成功主路径和失败主路径都使用同一个幂等排空函数：

1. 如果已经创建了 session/agent 且曾进入 turn：
   - 取消尚 running 的 agent；
   - `await agent.whenIdle()`；
   - 读取 A 的内部 `lawbenchAgent` 服务；
   - `await withWatchdog(lawbenchAgent.settleSessionEvents(sessionId))`；
   - 确认返回的 task/case/session 与本次消费者已知身份一致；
   - 确认 `endTaskOk === true`；
   - 需要时再只读调用已有 `GET /api/tasks?case_id=`，确认同一 `task_id` 不再为 `running`。
2. 以上完成后才：
   - 还原 fetch；
   - dispose BrowserSession；
   - dispose Context；
   - `service.stop()`。
3. 成功路径在 `native-cross-exam.mts` 3215 的 `service.stop()` 前执行同一个排空函数。
4. 失败路径在 3318 的 B stop 前执行同一个排空函数。

消费者现有 `apiRoute('tasksList')` 已在 1728 定义，B 也允许 `GET /api/tasks`：

- 有限 B 防火墙：450-452、490-493；
- B `tasks_list`：`service/lawbench/case/task.py` 230-247；
- B `task/end` 在同一锁内先写 `result.json`、再写 `task.json`，最后返回状态：740-776。

`tasksList` 只作为后端落盘后置条件，不作为排空本身。不要注入 `task/end`，不要用列表查询伪造完成。

### 6.4 超时、重试与错误传播

- 沿用现有 `withWatchdog`。不要新造 10 秒或其它任意上限。
- 现有 CoreClient 单次 60 秒、endTask 最多 2 次是事实；排空必须等待这两次全部结算，而不是看到第一次失败就结束。
- 若排空自身失败或超时：
  - 保留原始主错误，例如 `actual tool loop lacks case_list_materials`；
  - 在 `secondaryErrors`/清理失败中记录 `task_end_drain_failed` 或 `task_end_drain_timeout`；
  - 不得把状态改成 PASS；
  - 仍执行服务、Context、fetch、环境清理。
- 若 task/end 两次都非 200、JSON `ok=false` 或契约失败：排空返回失败，不把 `NetworkObservation.completed` 当成成功。
- 不增加第三次重试，不更换 reason，不弱化 B 的 route count、firewall、TaskState 或 product default。

### 6.5 迟到任务与交叉任务

- drain ledger 以 session id 为键，并在入队时捕获 TaskState 对象身份。
- `task/end` 只用该对象已有的 `taskId/caseId/sessionId`；完成后按 `taskId` 核对。
- 若 session 已开始新任务，旧 drain 只等待旧 taskId，不能消费或结束新任务。
- 若出现旧 task/end、另一 session、另一 case、另一 request id，应忽略或明确失败；不能以其 200 解除当前 drain。
- 若以后为了更强测试证据增加 fetch 观测，只允许窄记录 `task/begin` 的 session_id/request_id + 响应 task_id，以及 `task/end` 的 task_id + 已解析 body；不得新建通用捕获框架，不得保存材料文本或模型输入输出。

## 7. 有限、无模型证明

下一实现新增测试文件，建议：

`D:\Lawbeach\lawbench-A\dsh-ext\tests\t18-core-task-end-drain-20261029131449.spec.ts`

测试边界：

- 使用真实 `CoreClient`、真实 `LegalAgent`、真实 Cordis `ctx.on('session/event')` 路径。
- 可复用现有 `t34-tools-capability.spec.ts` 的真实 AgentLoop 测试装配；LLM 用确定性 in-memory adapter，禁止真实模型、API Key、案件、历史 Session、真实 UUID 和网络。
- Core 用本测试自己的 in-memory HTTP/mock transport，严格返回实际契约形状；这不是 fake NativeAgent，而是被允许的 transport 替身。
- 测试不读取或复制真实案卷、不生成真实证据 R、不调用产品生产路径之外的提交器。

至少覆盖四个场景：

1. **提前消费者失败 + 延迟 task/end**
   - 完成一个无工具文本 turn；
   - `whenIdle()` 后立即抛出模拟的 early consumer failure；
   - Core mock 延迟第一次 progress/task-end 响应；
   - 断言 service stop 尚未发生；
   - 释放响应后，断言 progress 与 task/end 均结算，随后才 stop；
   - 原主错误保持不变。
2. **第一次 task/end 失败、第二次成功**
   - 第一次返回非 200 或 `ok=false`；
   - 第二次返回契约合法 `ok=true`；
   - 断言恰好两次、retry 不并发、drain 只在第二次完成；
   - 无 TASK_END_FAILED。
3. **两次 task/end 都失败**
   - 断言 drain 返回失败而非超时挂死；
   - 原主错误仍在；
   - 清理失败是次级错误；
   - 不得 PASS。
4. **迟到旧任务/交叉 session**
   - 注入旧 task_id 或另一 session 的 task/end 响应；
   - 断言不解除当前任务 drain，也不结束新任务。

安全 setup/cleanup：

- 所有 mock server、Agent、Cordis fiber 在 `finally` 中有限等待并 dispose。
- 仅用系统临时目录，不写真实案件和冻结证据。
- 测试失败也必须释放计时器和监听器。
- 禁止真实模型、真实 6000D/395、凭据读取、全量回归和 GUI。

## 8. 写面清单

下一实现建议只触及：

1. `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
   - event tail/ledger、settle 方法、现有 `ctx.provide` 暴露。
2. 新消费者源码或其新版本
   - 成功与失败共用 task-end drain，调整 stop/fetch/context 顺序。
3. `D:\Lawbeach\lawbench-A\dsh-ext\tests\t18-core-task-end-drain-20261029131449.spec.ts`
   - 上述有限无模型测试。

不需要改：

- B `service\lawbench\case\task.py`
- B `service\lawbench\api\core.py`
- contracts
- TaskState 默认/字段
- product default/model/provider/budget
- 实际冻结消费者、原始报告和本次实际运行证据

## 9. 确认、推断与未决

### 确认

- `whenIdle()` 不等待 session observer 的异步副作用。
- A 监听器当前用 `void` 丢弃 `onSessionEvent()` Promise。
- `onSessionEvent()` 内部确实等待 Core 调用。
- 消费者在 source read、JSONL reopen 前因自身断言失败而停止 B。
- B 在 task/end 到达前关闭监听器。
- 原始证据的进程、监听器、日志、网络客户端均已关闭。

### 强支持但尚未有限证明

- 在实际调度下，A 调度的延迟足以让 B stop 先执行，进而造成两次 `SERVICE_UNAVAILABLE`。
- 该竞态可通过局部 event-effect ledger 和消费者 drain 消除。

### 未决

- 是否由 A 线实现 event ledger，还是只由有限消费者用别的等价屏障实现。推荐前者，因为只有 LegalAgent 掌握精确 TaskState 和 endTask 的两次重试。
- 修复后原始消费者对 `case_list_materials` 的无条件要求如何处理，需另立修复；不得用清理修复把它误判为 PASS。
- 本轮不执行测试，不产生新的 Green 证明。

## 10. 最终状态

- 原报告：`FAILED`，不可改写。
- T18：未整体 PASS。
- Packaging：`HOLD`。
- 清理竞态：源码方向已确认，有限测试待下一实现。
- 本轮产品代码、测试、fixtures、实际运行证据：未改。
- 本轮 Git：只读尝试；未 add/commit/rebase/stash/reset/clean/checkout/push。
