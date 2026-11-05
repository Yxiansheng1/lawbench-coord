# C 独立复核：T32 TaskStore 取消收尾窄修复

状态：`PASS / RUNTIME_NOT_RUN / PACKAGING_HOLD`

结论：当前 `TaskStore._end` 的窄修复没有确认的产品阻断项。它让“范围已失效的非成功收尾”落到真实终态，同时继续拒绝失效范围的 `completed`；本结论只覆盖本次窄复核，不代表完整 T32、GUI、模型或全项目通过。

## 1. 固定输入完整性

以下 9 个快照的字节数和 SHA-256 均与 `index.json` 一致：

| 快照 | bytes | SHA-256 |
|---|---:|---|
| `00-task.py` | 40607 | `7b6ee04ba53f45b1f7e6624d2c9bf60b122dfc68c12e26331431a84eed36bf04` |
| `01-request_scope.py` | 20322 | `9a0bcfe70c7aeedb05f2b6440526ae7cc10d4d3cd5c5edd4a7dc8000680dc405` |
| `02-context.py` | 6409 | `1128f934f13e1f0453be4c73cea1466dd4bf54ede158cd359eedc48a57e4d9ee` |
| `03-core.py` | 2106 | `42d8ef7176d2624ff50f9bffc5d156f4f6a126c293f2f354e6fef7770719e988` |
| `04-result.schema.json` | 2694 | `9b8cb22bfa8b1a529c702f643a2295a2deff2dfce23cc66777ea776bda0f10f8` |
| `05-task.schema.json` | 4155 | `1d291f56a9efe903b3f695654c768c6378b986d0aa62b0ffd1c99611ace06bed` |
| `06-task_end.schema.json` | 2792 | `311dba84568699e59d0d0d94ebceecfe5c51249dd773fdaf3a9d5e17e4c5a066` |
| `07-invalid_scope_cancel_check.py` | 24701 | `35dc7a7e971d3c88da195bb024a14be013f8aeaddf4df64acbd5e863ba3302ca` |
| `08-T32-invalid-scope-cancel-root-accepted-current.json` | 5606 | `088ffd8bfdb3d0337361a1bd0e921d2054deb2faf71716662f76224a791482a6` |

当前 B 产品 `service/lawbench/case/task.py` 也是 40607 bytes、`7b6ee04b...bf04`，与权威快照相同。未索引的固定审阅件另行核对为：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `before-task.py` | 40253 | `80033acb3ae76585f4a44a4582d07068aa48aad433b7bc2a2e09349e5e3341c0` |
| `task-end-exact.diff` | 1057 | `a173cbdb2b724f35977dd0ec5e6e9a273f89b5cb3e1af37c488c8d70afd6109a` |

## 2. 直接审阅的依赖

| 文件 | bytes | SHA-256 |
|---|---:|---|
| B `service/lawbench/case/task.py` | 40607 | `7b6ee04b...bf04` |
| B `service/lawbench/case/request_scope.py` | 20322 | `9a0bcfe7...dc405` |
| B `service/lawbench/case/context.py` | 6409 | `1128f934...4d9ee` |
| B `service/lawbench/case/texts.py` | 6262 | `1f44044b450d6816b1384288391f5a72229b236e8d067a958b424dadae6f85c4` |
| B `service/lawbench/case/materials.py` | 84378 | `0e2a65ec8b98c901b636d176e4aa588a4682376695bf5124194418ae0a9021ac` |
| B `service/lawbench/api/core.py` | 2106 | `42d8ef71...e988` |
| B `service/lawbench/api/ui.py` | 14417 | `a9e9f4dd18cae7869847d56a3a15c992cc618ec3fe242a2e0302a169595ba09c` |
| B `service/lawbench/errors.py` | 3204 | `f580d733d88a15a70df089f8b1bcd6bfffcac6b8a78013532aab61d2d20d33f4` |
| B `service/lawbench/tools/__init__.py` | 2594 | `83fe68104ebf5f8440205b7bc5be12dc52b31a7945bfcc6ca53ba35b30872f5a` |
| B `service/lawbench/tools/inputs.py` | 4428 | `b13f8ac7bdb85d87403531e4a6e9a3eb336623455f7e7a68db9422cf4b1f23ee` |
| B `service/lawbench/tools/materials.py` | 7115 | `9122850f43ca96647fe8c3240c47000c55e395aba983c221e2fc79fcdc476a73` |
| B `service/lawbench/tools/search.py` | 562 | `cc26c032bdaff52283680ef43ce1f5421bf054d42217b4062d3ebef3efa89531` |
| B `contracts/common.schema.json` | 17837 | `46a8ac7b6c7017684d2667f4d622bb65577b29691b3f4121a20de02a6e5cb445` |
| B `dsh-ext/agent/index.ts` | 29056 | `34ce8356ae494ca7467f6a22b5da9b4c8db283adffff67d4e04301659d630863` |
| B `dsh-ext/agent/task-state.ts` | 12674 | `ec52bbd71135727a30f5dd853f9457d9fc0ed5c3777e28de330f1e4d3990d885` |

## 3. 语义核对

1. **成功完成仍拒绝失效范围。** `_end` 在得到 `INPUT_CHANGED/task_scope_version_changed` 后，只有非空范围且映射状态不是 `completed` 才吞掉该错误（`task.py:750-760`）。`END_STATUS` 只有 `completed` 映射到成功状态（`task.py:27-30,746`）。
2. **非成功取消写真实终态。** `aborted -> cancelled`；窄分支只把 `coverage` 置空，随后保存结果并置任务为 `finished`（`task.py:746-773`）。新消费者断言返回/结果均为 `cancelled`、`coverage is None`、`finished_at` 和精确 usage（`07-invalid_scope_cancel_check.py:425-457`）。
3. **范围准入失败关闭。** 持久记录会核验唯一认领、案件、会话、任务和认领状态，任务副本不能自行授权（`request_scope.py:50-92`）。按任务取索引时再次核验范围材料、状态和版本，不符即 `INPUT_CHANGED/task_scope_version_changed`（`task.py:112-134`）。
4. **context 与读取工具失败关闭。** context 先取任务范围索引（`api/core.py:20-22`），构建时按范围裁剪并禁用无法证明材料级同范围的前序成果（`context.py:86-93,123-127`）。工具基类统一经任务范围索引取材料（`tools/__init__.py:25-32`）；列表、读取、搜索均走该入口（`tools/materials.py:16-45`、`tools/search.py:8-14`），`case_read_input` 和案件级 wiki 也显式按范围拒绝或限制（`tools/inputs.py:33-38,52-90`）。新消费者已实际断言 context 和三个材料读取工具都以同一错误失败（`07-invalid_scope_cancel_check.py:354-394`）。
5. **其他错误不被吞。** 捕获类型是 `ApiError`，且只有 code、reason、非空范围、非成功状态四项全部满足才降级覆盖；其他 `ApiError` 重新抛出（`task.py:752-759`）。I/O、契约异常不是该条件命中的目标，不会被这一 `except ApiError` 吸收。任务/结果的读取、校验和写回顺序未改。
6. **任务与范围身份不变。** `_end` 只修改任务 `state`，不改 `request_id`、`request_scope` 或持久认领记录（`task.py:771-773`）。新消费者在终态后逐项断言范围副本、请求编号和持久 `claimed` 记录（`07-invalid_scope_cancel_check.py:433-463`）。
7. **覆盖可空且先失败后落盘。** 结果契约允许 `coverage` 为对象或 `null`（`04-result.schema.json:83-90`），`save_result` 每次写入前仍按该契约校验（`task.py:99-105,611-615`）。成功结束失败发生在草稿移动、`save_result` 和任务终态写入之前；新消费者还断言失败后 `task.json`、`result.json` 字节不变（`07-invalid_scope_cancel_check.py:401-423`）。
8. **重复结束幂等。** 已 `finished` 的任务直接返回既有 `result.status`，不重算、不改写（`task.py:740-743`）。新消费者在 `cancelled` 后用 `completed` 和不同 usage 再结束，仍返回 `cancelled` 且两个文件字节不变（`07-invalid_scope_cancel_check.py:470-484`）。
9. **调用方 reason 语义一致。** 律师停止由 DSH `aborted` 传给 `task/end`；未知结束原因降为 `error`（`dsh-ext/agent/task-state.ts:221-225`、`dsh-ext/tests/confirm-save.spec.ts:136-144`）。调用方两次尝试，第一次已落终态但响应丢失时，第二次可从幂等返回得到成功（`dsh-ext/agent/index.ts:257-271`）。
10. **普通与有效范围没有统一空覆盖。** 新消费者断言未限定任务取消得到活跃材料 `coverage.total=2`，有效限定任务完成得到 `coverage.total=1`（`07-invalid_scope_cancel_check.py:511-563`）。

## 4. 分类

**CONFIRMED BLOCKER：无。**

**INFERRED PRODUCT DEFECT：无。**

**UNRESOLVED PRODUCT BEHAVIOR：无。** 本次按令禁止运行，因此“未运行”不等于未决产品失败，详见下节。

**测试覆盖缺口（不是产品缺陷）：** 新消费者只断言 `task.json` 和 `result.json` 在拒绝成功结束前后不变，没有创建并检查 `草稿/进行中.md`（`07-invalid_scope_cancel_check.py:401-423`）。源码顺序已经证明覆盖计算在草稿移动之前（`task.py:750-770`），所以不构成阻断；若后续允许写测试，最小补测应是预置 `进行中.md`，触发失效范围 `completed`，并断言该文件 SHA、大小、修改时间不变。现有测试也只直接跑 `aborted`，其他非成功 reason 的正确性由同一 `status` 分支、完整映射表和 DSH 调用方源文件交叉核对。

## 5. 运行证据边界

`RUNTIME_NOT_RUN`。本执行者没有运行 Python、测试、import、AST/parser、build、HTTP、GUI、model、selftest 或安装，也没有把根方已接受 JSON 当作独立源码复核的替代。

固定根证据记录 9 个测试、exit 0、产品 SHA 与当前快照一致，并明确 `HTTP=false / GUI=false / whole_T32_pass=false / packaging=HOLD`（`08-...current.json:12-166`）。正式执行令另称当前 scoped HTTP 1 项和 counter finite 21 项已通过；本次未复跑，不把这些切片扩大为完整 T32 或项目通过。

## 6. 实际命令、非零与写面

成功命令只包括：`Get-Content`/`rg` 读取正式令、固定快照、指定源码与契约；`Get-Item`/`Get-FileHash` 核对字节和 SHA；`Test-Path` 确认两个交回目标事先不存在；最后用 `apply_patch` 新建两份指定协调文件。

实际发生 10 次只读非零，均未触及产品文件：

- 6 次把只读命令误配成 `bash.exe`，managed 隔离均返回 `E_ACCESS_DENIED`，命令没有执行。
- 2 次只读文本命令自身写错：1 次 PowerShell 空管道 `ParserError`，1 次 `rg` 正则括号未闭合；均未执行目标查询。
- 1 次窄目录组查询含不存在的 `D:\Lawbeach\lawbench-B\app`，`rg` exit 1；另 1 次 `rg` 在 `packaging/deploy` 无匹配，exit 1。
- 另有 1 次实际执行过宽的 `rg`（范围误落到整个 `service`，输出 924 行），exit 1；只有读取，没有写入，也没有据此替代固定文件审阅。此项是对“不得宽递归输出”要求的流程偏离，已保留记录，后续查询均收窄到明确文件。

没有执行任何 Git 命令；没有 `add/commit/rebase/stash/reset/clean/checkout/push`，没有改 index、锁、权限、审批、ACL、API、Key 或全局配置。产品 dirty 保持原样。

唯一写面：

- `D:\Lawbeach\lawbench-coord\C-findings-T32-cancel-independent-20261027-155013.md`
- `D:\Lawbeach\lawbench-coord\C-handback-T32-cancel-independent-20261027-155013.md`

历史证据未删除、未移动、未覆盖。
