# B 交回：T31 真实请求绑定与任务材料过滤

## 1. 原目标、来源与交付边界

- 唯一来源：`D:\Lawbeach\lawbench-coord\T31BackendImplementationOrder-20261026-014815.md` 及同输入目录的 owner scope/work policy、contract pins、A 交回件、四份冻结 schema 和必要样例。
- B 原 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`。本单未产生提交 SHA。
- 目标是把 A 生成的 DSH 原生 R 接到 `/api/request/scope` 与 `/core/task/begin`，在任务开始时固定材料版本，并让同一 task 的 context/L0/L1/wiki/list/read/search/citation/coverage/cache 只访问该范围。
- Git 全程只读：未执行 add、commit、rebase、stash、reset、clean、checkout、push。交回以本文件和协调目录为准。

## 2. 全累计修改

新文件：

- `service/lawbench/case/request_scope.py`
- `contracts/api/request_scope.schema.json`
- `contracts/files/request_scope_store.schema.json`
- `contracts/examples/api_request_scope.req_prepare.json`
- `contracts/examples/api_request_scope.req_release.json`
- `contracts/examples/api_request_scope.res_prepare.json`
- `contracts/examples/api_request_scope.res_release.json`
- `contracts/examples/core_task_begin.req_legacy.json`
- `contracts/examples/core_task_begin.res_legacy.json`
- `contracts/examples/file_task.request_scope.json`
- `contracts/examples/file_request_scope_store.json`
- `docs/plan/evidence/T31/ScopedTaskImplementation-20261026-014815/scoped_task_standalone.py`
- `docs/plan/evidence/T31/ScopedTaskImplementation-20261026-014815/README.md`
- `docs/plan/evidence/T31/ScopedTaskImplementation-20261026-014815/交付说明.md`

修改文件：

- `service/lawbench/case/task.py`
- `service/lawbench/case/context.py`
- `service/lawbench/api/ui.py`
- `service/lawbench/api/core.py`
- `service/lawbench/tools/__init__.py`
- `service/lawbench/tools/inputs.py`
- `service/lawbench/tools/search.py`
- `service/lawbench/tools/drafts.py`
- `service/lawbench/search/fts.py`
- `contracts/common.schema.json`
- `contracts/core/task_begin.schema.json`
- `contracts/files/task.schema.json`
- `contracts/examples/core_task_begin.req.json`
- `contracts/examples/core_task_begin.res.json`
- `contracts/examples/manifest.json`
- `contracts/_build/gen_schemas.py`
- `contracts/_build/gen_examples.py`

四份冻结 schema 未改公共字段，按输入件逐字节合入。`contracts\VERSION` 仍为 `1.6`。

## 3. 持久模型、claim 与恢复

- `/api/request/scope` 的 prepare/release 由 `RequestScopeStore` 处理；记录持久到 `<应用数据>\request-scopes.json`，只含 case/session/request/task/material ID、sha256、state、时间，不含材料名、路径、正文、检索词或模型输入输出。
- 状态为 `prepared`、`claiming`、`claimed`、`released`、`rejected`。release 和拒绝都留墓碑；release 不删除材料，也不改变已 claiming/claimed 任务。
- `TaskStore.begin` 的可恢复顺序是：持久 `claiming + task_id` → 写 pending task/result/reads → 持久 `claimed` → task 置 running。中途失败时同 R 从同一 task_id 继续；pending 不会被 `mark_abnormal` 误标。
- 同 R 在运行中重放返回同一 task/scope；已结束或 abnormal 的任务不重开。不同会话/案件或同 R 改材料集合明确冲突。
- 有 request_id 但没有 prepare 的新 R 首次 begin 时固化为 `request_scope:null`；release/rejected 墓碑不会被当作从未 prepare 后静默放大成整案。

## 4. 权限闭合与旧兼容

- `TaskStore.index_for_task` 是 context 与工具的共同材料视图；固定 material_id 或 sha256 不一致、原件被移除/缺失时统一报 `INPUT_CHANGED`。
- scoped L0 不再注入案件卡片全文，只列固定材料；scoped L1 明确拒绝无法证明同范围的前序成果，`case_read_input` 失败关闭。
- `case_read_wiki` 的 `卡片` 使用受限 L0，案件级整篇 wiki 节明确不返回正文；只允许固定范围内材料的摘要页。
- `case_list_materials`、`case_read_material`（含 `more_names`）、`case_search`、归档/核对/修改清单等经 `ToolContext.index` 的共同入口读取固定快照。
- FTS 在候选 SQL 中先按固定 material_id 过滤，再做命中位置、排序、`max_hits`、total 和 truncated；refresh 使用同一受限 index，不会先取全案 topK 再过滤。
- budget_stopped 续接 reads 只带本次固定材料且版本一致的记录；coverage 只按 scoped index 计算；citation 与界面保存草稿复核使用 scoped index。
- 没有 request_id 的旧调用保持全案、原 route/params/budget 行为；旧任务没有 scope 字段时仍按全案运行。

## 5. 回归源码、静态证据与未验事项

- 回归源码：`docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py`
- 说明：`docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\README.md`
- 覆盖：旧无 R、prepare/claim/release/rejected 墓碑、同 R 重放/并发、结束不重开、跨会话/案件冲突、改集合、扫描后改版/移除、部分写盘后重启恢复、context/L0/L1/wiki/list/read 多名/search/cache/reads/citation/coverage。
- 四份 frozen schema 的 raw SHA-256 已逐项核对通过：
  - `common.schema.json`: `46a8ac7b6c7017684d2667f4d622bb65577b29691b3f4121a20de02a6e5cb445`
  - `core/task_begin.schema.json`: `22b455e37beb880f8272846d3e4f154a2a82e2a75a3e7f601e1dfd1982b16571`
  - `files/task.schema.json`: `1d291f56a9efe903b3f695654c768c6378b986d0aa62b0ffd1c99611ace06bed`
  - `api/request_scope.schema.json`: `67a2d4f51a52f3c8ad8ac0f05bf3e3aec90d12f5f1e2fdaeb1a99901d1365a1c`
- 输入目录九份 T31 样例与 B 对应文件已按 SHA-256 核对为逐字节一致；已有 tracked 白名单文件的 `git diff --check` 通过（仅 common LF/CRLF 提示），新增文件另行做了无尾随空白扫描。
- 作者未运行 unittest、pytest、collect、parser、prepare、serve、HTTP、探针、GUI、网络或模型调用；未运行生成器、build 或安装。不能宣称测试已绿、服务已跑或 T31 已完成。

## 6. 偏离、阻碍、遗留与 root 下一步

- `git status --short --untracked-files=all` 仍因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 元数据 `Permission denied` 提前失败；未修锁、权限、ACL 或审批，未把它当测试结果。既有 dirty 保留件仍存在，本单未清理不明改动。
- 执行器有 16 次只读工具调用误传 `shell=bash`，均被运行时以 `Bash/E_ACCESS_DENIED` 在执行前拒绝；未启动 setup/legacy、未运行命令、未读写、未作为证据。后续均使用指定 PowerShell。
- 本次没有 Git 写入或提交；因此“无提交 SHA”不是待修阻碍。
- root 需全文审查回归源码后执行它，再做 schema/examples 静态校验、API/ASGI 与 DSH native queue/claim 端到端、A UI 边界和真实 attempt/retry 验证。A 的 UI 补回归未并入本判断。
- 当前不能勾完整 T31；未验范围包括实际 HTTP 路由、DSH 并发边界、真实应用 lifespan、A 客户端交互、模型 attempt、重启中的 running 任务异常收尾，以及全量既有回归。
