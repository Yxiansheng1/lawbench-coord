# B 进度：T31 边界夹具会话绑定修正

状态：`HANDOFF_READY / SOURCE_ONLY / NOT_RUN`

- 已完整读取正式执行令。
- 已核对协调目录 5 文件清单，当前哈希全部一致：
  - `material-batch.ts`：`38328dc0b4b1a568772729e5310677657e48247c1713d65f0cde6028fea4cd01`
  - `request_scope.py`：`9a0bcfe70c7aeedb05f2b6440526ae7cc10d4d3cd5c5edd4a7dc8000680dc405`
  - `request_scope_intent.schema.json`：`cb8a2cb8459120f1bfed4ba3eac94052bef342a85d33f2fc3f637c1a11e732fe`
  - `material-batch-races.spec.tsx`：`29ed5d6d556c7bbc810c7e57e658e6abfc666862aebc60b4977ebe26efa7c653`
  - `scope_loss_check.py`：`5bf34cdd65be170754ba4faa1f40ef312045f4ffc160983ff15a0e0d61f69af2`
- 待修 `scope_intent_edges.py` 与冻结 before 的哈希均为
  `c24418b43bd3b9b9e86d8b9e20cad4386e9cce755dde99facf727c959c11bc8b`。
- README 与冻结 before 的哈希均为
  `36b9bfc65427ae73caba67b8a661dd953219da3872505e1741d2815e220f07fe`。
- 静态核对到 8 处 `self.fixture.prepare(REQUEST_ONE, ids)` 未显式传
  `session_id`，与执行令点名的会话错绑一致。
- 目标文件路径的只读 Git 查询显示当前分支
  `line-B...origin/line-B [ahead 141, behind 1]`，四个目标相关路径均未跟踪；
  按要求不 rebase、不暂存、不提交。
- 目录级 `git status` 首次因 `dsh` 子模块工作树权限拒绝而非零；会保留该事件，
  不修权限、锁、沙箱或审批。
- 一次只读哈希命令因 PowerShell 管道/对象构造解析失败而非零，未写入文件；
  随后以无管道写法重试成功。

下一步：仅在这 8 处向冻结 fixture 的 `prepare` 显式传
`session_id=SESSION_ONE`，并在同目录 README 记录本次精确修正。不得执行
Python、测试、产品、解析、构建、模型、HTTP 或 GUI 验证。

## 完成里程碑

- 8 处 `self.fixture.prepare` 均已显式传入
  `session_id=SESSION_ONE`；旧双参数调用为 0。
- 对照冻结 before 副本的只读差异显示，源码差异只发生在这 8 处调用。
- 修正中曾出现最后一处调用缩进少 4 个空格，已由只读差异比对发现并在交回前
  修正；最终差异恢复原 `assertRaises(OSError)` 覆盖范围。
- 关键文本计数保持：`assertEqual` 41/41、`assertRaises` 9/9、
  `assertNotIn` 3/3、`assertFalse` 1/1、`SESSION_TWO` 2/2、`reason` 6/6。
- 修正后 `scope_intent_edges.py` SHA256：
  `cd3090f4c1b51e797d71439fb325d2544c3815c5e1b838d186ebe3843cb60307`。
- 修正后 `README.md` SHA256：
  `167992b2835921d5d3abead18efa98e533dc68e1c5fb6ec2ec9064d8ce105cf6`。
- 5 个冻结产品/基准文件最终哈希再次核对，全部与协调清单一致；未重跑旧
  paired2、currentA 或任何旧证据。
- 未执行 Python、Node、产品、测试、解析器、AST、Vitest、tsc、pytest、
  list/collect/prepare、serve、probe、GUI、HTTP、构建、模型或 selfcheck。
  本交回只能报告 `SOURCE_ONLY / NOT_RUN`，不能据此声明红绿或产品通过。
- Git 全程只读；未 add、commit、rebase、stash、reset、clean、checkout 或
  push。目标路径仍为原有未跟踪 dirty 状态，分支仍为
  `line-B...origin/line-B [ahead 141, behind 1]`。

正式交回件：
`D:\Lawbeach\lawbench-coord\B-handback-T31-intent-edge-fixture-amend-20261026-154418.md`
