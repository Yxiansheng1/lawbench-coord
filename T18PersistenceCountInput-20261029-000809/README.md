# T18 真实已完成会话的只读持久化续证

本目录只证明一件事：已完成真实会话的持久化 JSONL 可以由当前 A 线原生 DSH 消费者再次以只读方式打开，并且读出的 60 条 native events 与不可变物理来源逐事件深等。

它不是新的模型运行，不是修订 DOCX 或反馈导出的证明，也不构成 T18 全量业务通过。历史真实运行 `run-fQoiXe` 仍保留风险 3 的条号业务错误：原文条号为 4.1，草稿正文写成“合同第七条”。因此 `business_quality_PASS=false`、Gate 1 未完成、Packaging 保持 `HOLD`。

## 不可变输入

- 清单：[`genuine-inputs.json`](D:/Lawbeach/lawbench-coord/T18GenuineArtifactContinuationInput-20261028-235617/genuine-inputs.json)
- 清单 SHA-256：`e776968f25602af1640987ec08245af911e1f60713eef12fcc6b9a95ace24ab1`
- native session：`session-1cb28369-3a90-46dc-b047-e64986038394`
- native request：`60fda87b-25a9-40c1-9abd-1e4893fa7b8b`
- 物理 JSONL：一行 session header、60 条 event，共 61 个物理行
- 原始来源和 `actual-native-events.jsonl` 均为 240391 字节，SHA-256 为 `cd40b5df18811adbbe988cf1bea2b739c0a8e25eb2009e36f15935b3d4ace2b5`

入口在开始和结束时都会核对来源 case 与 sessions 的文件集合、字节数、SHA-256 和 `mtime_ns`。原始来源只读，不作为运行时持久化根。

## 入口行为

[`read-genuine-session.mts`](read-genuine-session.mts) 只接受一个由主编排传入的全新、空的、自有工作根。入口在该根下复制整个 case 与 sessions 树，并确认复制文件逐字节一致。随后严格复用当前 A 线已通过的消费者装配：

1. `Cordis.Context`
2. `LlmRuntime`
3. `SessionStore`
4. `ProjectionRegistry`
5. `SystemPrompt`
6. `ToolRuntime`
7. `AgentRegistry`
8. `installModelSelectionProjection`
9. `JsonlPersistence`，`compression: 'none'`
10. `AgentLoop`，`agents: []`
11. `sessionPersistence.open(realSessionId, 'read')`
12. `handle.read()`、`handle.close()`、`Context.fiber.dispose()`

第一次读取关闭并释放后，入口再执行第二次独立只读重开。两次事件必须与不可变物理来源的全部 60 条 event 深等；复制后的 JSONL 在两次读取前后必须字节不变。入口不追加事件、不恢复会话、不发送消息、不创建 agent、不加载 provider、不读取凭据。

全局 `fetch` 在入口运行期被替换为拒绝并计数的函数。成功报告中的 `globalFetchAttempts` 必须为 0，并且 `newModelCalls`、`agentCallbacks`、`providerPluginsLoaded`、`credentialValuesRead`、`httpRequests` 均应为 0。

入口只清理本次在工作根中创建的 `case` 和 `sessions` 副本；清理前会核对目标位于传入工作根之下且是普通目录。它不删除工作根本身。

## 主编排执行条件

当前阶段只完成源码编写与静态检查。执行必须由主编排在完整复核源码、装配和清理逻辑后进行，并传入一个新鲜空目录。示例命令只作为复核后的入口格式，不表示本阶段已经运行：

```powershell
$runRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\run-<fresh-owned>'
New-Item -ItemType Directory -Path $runRoot
node .\read-genuine-session.mts $runRoot
```

执行者需先确认 `$runRoot` 不存在或为空，且不在原始 case、原始 sessions 或协调输入目录内。入口会在运行前再次验证。

## 成功判据

只读入口成功时，stdout 报告必须包含：

- `verdict: "READONLY_GENUINE_SESSION_REPLAY_PASS"`
- `input.physicalEvents: 60`
- `productionRead.firstEventCount: 60`
- `productionRead.secondEventCount: 60`
- `productionRead.allEventsDeepEqualPhysicalSource: true`
- `productionRead.firstEqualsSecond: true`
- `productionRead.copiedJsonlBytesUnchangedAcrossBothReads: true`
- 两次 `readerClosed` 和 `contextDisposed` 均为 `true`
- `source.inventoryBeforeEqualsAfter: true`
- `thisReadOnlyRun` 的全部新模型、agent、provider、凭据和 HTTP 计数为 0
- `cleanup.removedOnlyCreatedCopies: true`
- `cleanup.workRootEmptyAfterCleanup: true`

即使以上全部通过，报告仍必须保留：

- `businessQuality.risk3ArticleReferenceErrorOpen: true`
- `businessQuality.fullT18BusinessPass: false`
- `businessQuality.gate1ProjectComplete: false`
- `businessQuality.packaging: "HOLD"`

## 未在本阶段执行

- 未运行 `read-genuine-session.mts`
- 未运行新旧任何 `.spec.mts`
- 未调用模型或 provider
- 未发起 HTTP
- 未读取或写入凭据
- 未启动 GUI
- 未生成 redline、DOCX 或反馈 JSONL
