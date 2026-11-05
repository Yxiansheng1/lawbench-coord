# A handback — T31 NativeR disk-close-reopen paired consumer

状态：`NOT_RUN / CONSUMER_READY_FOR_ROOT_REVIEW`。已按令新增且仅新增两个目标场景，未运行测试、收集、构建、类型检查、产品运行时、GUI 或网络请求。正式结论仍由 root 的累计夹具/API/断言/全命令复核及实际两测决定。

## 交付

- 新消费者：`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-native-disk-replay.client.spec.ts`
  - SHA-256 `356B8BC5F6F5005584EDC3EFC7C784E4BE362BB923505F997C0A69B5407F9AED`
  - 22800 bytes，595 lines，2 个 test。
- 证据说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeDiskReplay-20261026-220945\README.md`
- 本交回件：`D:\Lawbeach\lawbench-coord\A-handback-T31-native-disk-replay-20261026-220945.md`

## 场景

1. Client `Session.beginSubmission` 产生实际 UUID R；真实 `SessionCommandController.prompt` 将 restricted R 准入 Host Inbox。仅把原 Session 实际生成的事件通过 production JSONL `create/append/flush/close` 写入私有 mkdtemp 根；完全关闭旧 Context 后，以新 backend、SessionStore、Agent、Inbox、Controller 从磁盘 `open/read`，经 `ctx.sessions.prepare/enter/announce` 冷重建。断言同 R 省略限制拒绝、匹配限制幂等且保持原 queue id/source，新 unscoped R 合法放行。
2. 受限 R 经真实 `updateQueue(remove)` 取消，再以实际 restriction 的普通 R 走同一取消路径；两者都通过实际 Session 产生并持久化 insert/canceled-remove 历史。冷重建后断言纯 removal 的 outcome 均为 `canceled` 而非隐式 claim，受限 R 的无标记 steer 拒绝且不进入 turn；普通取消 R 的同 R steer 正常进入 next-step。

两场景均禁止模型发送并断言 `sendCalls===0`、无 turn/user/assistant attempt；不共享旧 Context/backend/store/session/agent/inbox 实例。临时根在删除前经 `realpath`、`relative`、直系子目录和固定前缀校验。

## 静态证据

- 冻结源码图 A 线路径：54 checked，54 SHA-256 match，0 mismatch。
- 新测试静态扫描：`writeFile/appendFile/readFile`、HTTP/WebSocket、子进程、`vi.mock`、直接 `Agent.send` 均为 0 匹配。
- 未改产品、配置、旧测试、P29、source pin、runtime/build/launcher；没有 add/commit/rebase/stash/reset/clean/checkout/push。

## 未运行与非零记录

拟执行但本次明确未运行：

```powershell
Set-Location D:\Lawbeach\lawbench-A\dsh
pnpm exec vitest run packages/api/session-controller/tests/t31-native-disk-replay.client.spec.ts --project thread-safe
```

- `git status --short --branch`：exit 1，`cannot chdir ... .git/worktrees/lawbench-A/modules/dsh: Permission denied`。未修权限、锁、审批或 ACL。
- 四次只读命令的工具参数误选不可用 `bash`，均在执行前以 `BASH/E_ACCESSDENIED` exit 1 返回，无命令执行、无仓库/运行时变更；其余检查均用 native pwsh、`login=false`。

## 交回 root

先复核累计夹具、清理顺序、API/断言与全部实际命令；再执行上述两测。若 fixture gray，先修夹具；若真实产品红，再走原目标产品修复。本消费者不证明 OS 进程重启、GUI 输入或 whole-T31 验收。
