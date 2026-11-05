# A 线交回：T31 Scope HTTP consumer continuation

## 结论

本次按 `T31ScopeHttpConsumerContinueOrder-20261026-034439.md` 完成了有界源码交回：

- 新增唯一 HTTP 消费测试 `dsh-ext/tests/t31-native-scope-http.spec.ts`；
- 在既有未跟踪测试 `dsh-ext/tests/t31-agent-scope-lifecycle.spec.ts` 的第 93、128 行仅增加两处精确元组参数类型；
- 本文件是本次正式交回。

本次没有运行测试、TypeScript 编译、解析器、Vitest、pytest、collect、构建、prepare、serve、探针、HTTP、GUI 或模型。"源码已交付"不等于"测试已通过"。

## 实际文件与身份

| 文件 | 本次动作 | SHA-256 |
|---|---|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\t31-native-scope-http.spec.ts` | 新增 | `9862D3FC63B019364BC00A0C5F62BD291671491051D4F3A0564ED5AC208DE2A3` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\t31-agent-scope-lifecycle.spec.ts` | 仅改两处类型注解 | `8DBDD93982225E96EC4ED858CB1A7A6A7D9A903ACD7983CB2DA2EA6246E4202C` |
| `D:\Lawbeach\lawbench-coord\A-交回-T31ScopeHttpConsumerContinue-20261026-034439.md` | 新增正式交回 | 不适用 |

第 93、128 行分别只把：

```ts
([command]) => command
```

改为：

```ts
([command]: [string]) => command
```

原有调用、断言和测试语义均未改动；没有 `ts-ignore`、`ts-expect-error`、裸 `any` 或断言弱化。该文件在本次开工前就是未跟踪用户改动，本次没有把它转成 Git 跟踪或提交。

## 新消费测试的实现事实

- 从本次 run 的 `prepared.json` 读取实际 `paths.case.path`、`paths.ready.path`、`paths.appdata.path`，并核对这些路径及 `paths.root.path` 位于严格命名的 `T33-host-YYYYMMDD-HHMMSS` run 根内；没有猜 `ready.root`。
- 强制要求 `LB_SCOPE_HTTP_ROOT`、`LB_SCOPE_HTTP_PORT`、`LB_SCOPE_HTTP_TOKEN`，缺失即失败，不跳过。token 只在内存中用作请求头，并断言最终元数据、请求账本和产品日志不包含它。
- 健康检查通过实际 `requestJson`，要求 `status: "ok"`、`contract_version: "1.6"`。
- 经实际 `LawbenchRemote.callApi` 和 `API_ROUTES` 调用 `caseOpen`、`materialsImport`、`materialsList`、`requestScope`；只克隆路由以设置 `5000ms` 测试超时，路径、请求契约和产品实现不变。
- 通过实际 `CoreClient` 的默认契约校验，并且只连 `127.0.0.1`；没有 mock/fetch 替换、插件服务启动或旁路服务器。
- 原生 R 来自真实 `Session` 构造和一次 `beginSubmission`，随后原样用于两次 Host prepare 和两次 Core begin；测试不自行生成或替换 R。
- 正式顺序为：health 一次、case open 一次、materials import 一次、materials list 一次、scope prepare 两次、task begin 两次、context 一次、四个精确工具请求各一次、task end 一次。
- 三次正向工具结果分别按真实 `case_list_materials`、`case_read_material`、`case_search` result schema 校验。第四次 `scope-out` 必须是 HTTP 200 的原生 `MATERIAL_NOT_FOUND` 业务失败，并按公共 fail schema 校验；不接受守卫伪 403，也不接受正文泄漏。
- 结束请求固定为 `reason: "aborted"`、`model_calls: 0`、`tool_calls: 4`、`elapsed_s` 为本次计时得到的 `0..120` 整数。
- 结束后的只读断言覆盖唯一任务目录、`task.json` 的 finished/同一 R/scope、`result.json` 的 cancelled/零模型调用/四工具尝试/空草稿、`reads.json` 的唯一 scope-in 读取、实际材料索引和副本哈希，以及 `request-scopes.json` 中同一 R 的 `claimed` 记录。
- 等待实际 `final-metadata.json` 最长 45 秒，再等待 `loop-closed.json`；核对协议完成、监听与清理、凭证 getter/Keyring、outbound guard、OCR、Retainer、lifespan 和三份 TXT 的大小/哈希/mtime 不变。

## 原生依赖与导入

使用的实际原生源码为：

- `dsh/packages/api/session-controller/src/client/sessions/session.ts`：`Session` 真实构造与 `beginSubmission`；
- `dsh/packages/api/session-controller/tests/remote/session.client.ts`：既有空会话 `sessionWorld`；
- `dsh/packages/test-support/remote-mock/src/remote-mock.ts`：既有 in-process `RemoteMock`；
- `dsh/packages/core/session/src/index.ts`：`SessionId`。

通过相对源码导入使用上述依赖。`finally` 会执行 pending handle 的 `abandon`、`nativeSession.dispose()`，并结束 mock 的 `$events`/会话流。本次静态核对未发现必须安装、换 API、加 loader、改契约或复制产品代码的未决依赖；真实模块解析和编译结论须由 root 在准入后的允许阶段给出。

## Git、dirty 与验证边界

- Git 全程只读，没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 全量 `git status --short` 在 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 因宿主权限被拒绝；随后只用只读 `git status --short --ignore-submodules=all` 完成主工作树核对。没有尝试修权限、改 ACL、改锁或扩权。
- 主工作树原本已有大量 dirty；本次除上述两个允许的测试文件外没有改动其他文件。两份目标文件在 Git 中都保持未跟踪状态，因此没有本次提交 SHA。
- 本次未触碰 `.env`、真实案卷、Keyring、writer 锁、审批、沙箱、全局 API 或其他聊天。
- 前次续接任务 `T31ScopeHttpConsumerContinue...032947` 的已核事实是该次没有实际文件变更、没有正式交回；本文件不回填、不冒充该次交付，也不声称旧任务完成。

## 执行偏差记录

指定绝对 native `pwsh.exe`、`login=false` 是本次后续所有 Shell 的标准。静态核对过程中曾出现两次误设 `shell=bash` 的只读命令，二者都在启动前被运行器以 `BASH/E_ACCESS_DENIED` 拒绝，未执行；另有两读取命令使用了短名 `pwsh`，均为只读且无状态写入。此后已恢复绝对路径 native `pwsh.exe`、`login=false`。这些偏差没有改动文件、Git、锁、权限或测试对象。

## 交接给 root

B 入口仍在修复中且未被准入；本 A 源码只按双方已冻结的 T31 协议编写，不等待或联系 B，也不把 B 的草稿当作已通过证据。root 应在 B 修复完成并全审、A 源码全审后，才在全新的 `T33-host-YYYYMMDD-HHMMSS` run 中执行本次有限消费测试。不得把本交回扩大解释为完整 T31、GUI、模型、打包或生产验收。
