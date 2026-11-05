# A 交回：T31 默认本批材料真实请求接线

## 1. 原目标与来源

正式来源：`D:\Lawbeach\lawbench-coord\T31SourceImplementationOrder-20261026-004410.md` 及同输入目录四份边界文件。

目标是把输入区本次导入文件/目录的真实当前 `material_ids` 作为下一条提问的默认范围，允许律师取消/改选；导入不自动发送。必须沿 DSH 原生 `Session.beginSubmission()` 唯一 R 和 queue/claim/attempt 生命周期，不另造 Host requestId，不写进用户正文或任务 `inputs`；任务开始后固定范围，服务侧 context/list/search/read/wiki/cache 必须共同服从，不能只有 UI/提示词。

HEAD：`a23271abee333a9a256fd46a3141da16975c2380`。本单无提交 SHA；Git add/commit/rebase/stash/reset/clean/checkout/push 均未执行。

## 2. 全累计修改

### A 输入区与批次

- 新增 `dsh-ext\ui\material-batch.ts`：引用登记后读真实 `materialsList`，按本次所选文件/目录根当前成员建批；重复根仍取当前全量成员；批次按 session、带 case；默认全选；支持逐份改选/全选/取消；用原生 R 做 prepare/accepted/failed，失败 release 并保留批次供重试，accepted 只清自己的 `batch_id`。
- 新增 `dsh-ext\ui\material-batch.tsx`：显示本批材料、待识别/失败提示和取消/改选控件。
- 修改 `dsh-ext\ui\intake.ts`：使用 DSH 已透传的目录集合，文件/目录根统一走现有引用确认；原生提交观察点缺失时拒绝输入区文件，绝不降级成聊天附件。
- 修改 `dsh-ext\ui\cases.ts`：`startImport/runRefImport` 传会话与根信息；成功登记后再从真实清单建批；失败/无明确成员不伪造。
- 修改 `dsh-ext\ui\dialogs.tsx`：引用确认框等导入与清单完成后关闭，避免空窗里下一问绕过尚未建立的批次。
- 修改 `dsh-ext\ui\state.ts`、`dock.tsx`、`index.tsx`：内存批次状态、输入区显示、原生提交钩子注册。

### 原生请求身份

- 修改 DSH 固定提交工作树中的：
  - `packages/client/ui-conversation/src/client/apply.ts`
  - `src/client/index.ts`
  - `src/client/service.ts`
  - `tests/service-orchestration.client.spec.ts`
- 新增 `conversationSubmission` 观察点：`beginSubmission()` 产生 R 后立即交给钩子，`prompt(...)` 继续用同一 R；输入框 `sendSession` 在附件序列化前捕获批次，序列化失败也 release；`conversation.send` 同样先走原生 `beginSubmission()`。
- 补丁与登记：
  - `dsh-patches\P-29-request-submission-scope.patch`
  - `dsh-patches\P-29-request-submission-ordering.patch`
  - `dsh-patches\P-29-request-submission-scope-test.patch`
  - `dsh-patches\PATCHES.md`

### Agent 与精确契约

- `dsh-ext\agent\index.ts`：只从已 claim 用户消息的 `source.rpcId` 取最后一条 R，随 `POST /core/task/begin` 传递；要求响应回指同 R/同案件；`request_scope:null` 才是明确整案，缺字段按 `REQUEST_SCOPE_UNAVAILABLE` blocked 拒绝。
- `dsh-ext\shared\api-routes.ts`：`requestScope -> POST /api/request/scope`。
- `dsh-ext\shared\turn-notices.ts` / `dock.tsx`：错误提示码与中文说明。
- 新增 `contracts\api\request_scope.schema.json`：prepare/release、幂等/冲突/生命周期。
- 修改 `contracts\core\task_begin.schema.json`：可选 `request_id` 输入及 `request_scope` 响应。
- 修改 `contracts\files\task.schema.json`：任务持久化 `request_id + request_scope`。
- 修改 `contracts\common.schema.json`：DSH 原生 R 定义。
- 同步 `contracts\_build\gen_schemas.py`、`gen_examples.py`、examples/manifest，并保留旧请求/响应样例；`contracts\VERSION` 仍为 `1.6`。
- 未改 `docs\src\Spec.md`（不在本令允许写入范围）；Spec 20.12 条目应由 root/main 按合并流程补。

### 新回归源码

- `dsh-ext\tests\material-batch.spec.tsx`：真实登记后建批、重复根当前成员、过滤、目录拖入、会话/案件隔离、取消/改选、同 R prepare/release、失败保留、新批不被旧 accepted 误清、无批不发 scope、steer 不扩大已开始任务、原生观察点缺失时失败关闭。
- `dsh-ext\tests\agent.spec.ts`：R 来源、task/begin 同 R、缺 scope 拒绝且不取 context、scope 回指校验。
- DSH `service-orchestration.client.spec.ts`：send/sendSession 的 R 同传、prepare 失败不 prompt、accepted/failed 同 R。

## 3. 未运行验证与 root 建议

作者按执行令**未运行** Vitest、tsc、pytest、collect、parser、prepare、build、GUI、Electron、服务、HTTP、探针或模型调用；未重跑旧 17 绿或全量测试。不能声称测试绿、功能全通、可打包。

建议 root 仅做：

1. 审 A 契约和三个 P-29 补丁。
2. 只跑 `material-batch.spec.tsx`、`agent.spec.ts` 的 T31 新断言，以及 DSH `service-orchestration.client.spec.ts` 的两个新增用例和受影响 send 断言。
3. 静态校验 `request_scope` 与 task_begin 新旧样例。
4. B 实现后再做 native queue/claim、重试、换会话/案件、并发新批、取消改选和 wiki/cache 旁路的端到端核对；此前不勾 T31 整卡。

## 4. 原始证据

- 仓库交付说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ActualImplementation-20261026-004410\交付说明.md`
- 静态审计：同目录 `static-audit.md`
- 源码落点：同目录 `source-diff-map.md`
- 文件哈希：同目录 `sha256.txt`
- root 预保全：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247`（含 before 树和 tracked patch/status）
- 既有原始证据仅作背景，不冒充本单新结果：
  - `docs\plan\evidence\T31\input-entry-20261025-012126\交付说明.md`
  - `docs\plan\evidence\T31\input-test-20261025-014649\验证记录.md`
  - `docs\plan\evidence\T31\输入区接线核对-20261021-211301\接线核对.md`
- 阻碍：完整 `git status` 被子模块 worktree 元数据权限拒绝（`cannot chdir ... modules/dsh: Permission denied`）；未修锁/权限/ACL/审批。多次误传 `shell=bash` 的只读调用均在执行前被拒，未读写或启动命令，未当测试通过；没有遇到或处理 `index.lock`。

## 5. 精确契约/生命周期说明（从真实代码所得）

1. `dsh/packages/client/ui-conversation/src/client/service.ts` 的 `sendSession` 调用 `Session.beginSubmission()`，得到唯一 `submission.requestId`，之后 `Session.prompt(..., submission.requestId)`。
2. `dsh/packages/api/session-controller/src/client/sessions/session.ts` 的 `beginSubmission` 生成 R；`prompt` 把它原样发出。服务端 `commands.ts` 把同一 R 放进用户消息 `source.rpcId`。
3. Agent `agent/pre-step` 已 claim 用户消息，所以 A 在 `pre-step` 取该 `rpcId`；不使用提示词、消息正文或自行生成的 ID。
4. A 的输入框在 R 生成后调用 `requestScope(prepare)`；成功才允许 prompt。prompt 拒绝/异常用同 R release。prepare 只绑准备记录，不触发模型。
5. Agent 将 R 带给 `/core/task/begin`。服务必须在任务开始时原子 claim 准备的 R；同 R 重放返回同任务/同 scope；不同 R、会话、案件不得借用。
6. 固定 scope 为 `{request_id, case_id, kind:"materials", materials:[{material_id, sha256}]}`。`task.json` 持久保存；无批时返回 `request_scope:null`。
7. 任务工具仍只携带 `task_id + tool + args`，scope 不由模型参数传入。B 必须按 task 的固定快照统一过滤 context、列表、检索、读取、wiki 与 cache；模型不能通过名字或全案索引旁路。
8. 准备记录在队列等待时可保留；未被某 R claim 的记录不能作用于其他 R。释放只允许未 claim 记录，不能破坏已经开始任务的固定 scope。

## 6. B 必要依赖与剩余范围

- 实现 `/api/request/scope` prepare/release，验证 case 与材料当前存在性，按 `(session_id, request_id)` 唯一、幂等、冲突检测，并持久化以跨 queue 等待/进程重启恢复。
- 改造 `TaskStore.begin(session_id, cwd, request_id?)`：同 R 原子 claim；同 R 重放同 task/scope；不同输入冲突；无 request_id 旧调用保持全案兼容。
- 将 `request_id/request_scope` 写入 task.json，并在 task_begin 响应返回；带 R 必须有 `request_scope`（null 或对象）。
- 把固定 scope 接入 L0/L1/wiki、`case_list_materials`、`case_read_material`、`case_search`、检索索引与所有缓存 key；禁止全案旁路。
- 保持模型调用 attempt 内同 task/scope；模型重试不带新权限；新队列项 R 不继承前一 R。
- root 后续职责：审核/有限验证 A、派 B、做真实 native 端到端、更新 Spec 20.12/工单台账。A 尚不能独立宣称整张 T31 完成。

