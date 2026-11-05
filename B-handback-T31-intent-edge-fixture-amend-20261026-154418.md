# B 交回：T31 边界夹具会话绑定修正

状态：`HANDOFF_READY / SOURCE_ONLY / NOT_RUN`

## 结论

已按正式执行令完成有界修正：`scope_intent_edges.py` 的 8 处
`fixture.prepare` 调用均显式传入 `session_id=SESSION_ONE`，使其绑定
`s_t31_intent_edges_one`，不再落到冻结 fixture 的默认
`s_t31_one`。未改产品源码、私有 schema、冻结 fixture、旧测试、配置、
断言、预期失败码/计数、材料或持久化检查；`SESSION_TWO` 的故意错会话
断言保留。

原问题在本文件运行前由根静态发现，历史状态保留为
`STATIC_FIXTURE_MISMATCH_NOT_RUN`。本交回没有运行修正后的边界文件，
不能报告红绿、产品通过或 GUI/HTTP/模型结论。

## 修改文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py`
  - 修正前 SHA256：
    `c24418b43bd3b9b9e86d8b9e20cad4386e9cce755dde99facf727c959c11bc8b`
  - 修正后 SHA256：
    `cd3090f4c1b51e797d71439fb325d2544c3815c5e1b838d186ebe3843cb60307`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md`
  - 修正前 SHA256：
    `36b9bfc65427ae73caba67b8a661dd953219da3872505e1741d2815e220f07fe`
  - 修正后 SHA256：
    `167992b2835921d5d3abead18efa98e533dc68e1c5fb6ec2ec9064d8ce105cf6`

README 已补记错绑原因、8 处修正范围、历史 `NOT_RUN` 状态及修正前后哈希。

## 只读核验

- 对冻结 before 源码执行 `git diff --no-index` 后，源码差异仅为 8 处
  `prepare` 调用新增 `session_id=SESSION_ONE`。
- 最终静态度量：`prepare` 调用 8；显式
  `session_id=SESSION_ONE` 8；旧双参数同行形式 0。
- 对照冻结 before，关键文本计数未变：
  `assertEqual` 41/41、`assertRaises` 9/9、`assertNotIn` 3/3、
  `assertFalse` 1/1、`SESSION_TWO` 2/2、`reason` 6/6。
- 只读差异曾发现本次改写最后一处调用缩进少 4 个空格，会改变
  `assertRaises(OSError)` 覆盖范围；已在交回前修正。最终差异核对显示该覆盖
  范围复原。上述修正后哈希对应该最终版本。

## 冻结文件哈希

以下最终实测值均与
`D:\Lawbeach\lawbench-coord\T31FixReviewInput-20261026-154418\manifest.json`
一致：

| 文件 | SHA256 |
| --- | --- |
| `lawbench-A\dsh-ext\ui\material-batch.ts` | `38328dc0b4b1a568772729e5310677657e48247c1713d65f0cde6028fea4cd01` |
| `lawbench-B\service\lawbench\case\request_scope.py` | `9a0bcfe70c7aeedb05f2b6440526ae7cc10d4d3cd5c5edd4a7dc8000680dc405` |
| `lawbench-B\contracts\files\request_scope_intent.schema.json` | `cb8a2cb8459120f1bfed4ba3eac94052bef342a85d33f2fc3f637c1a11e732fe` |
| `lawbench-A\dsh-ext\tests\material-batch-races.spec.tsx` | `29ed5d6d556c7bbc810c7e57e658e6abfc666862aebc60b4977ebe26efa7c653` |
| `lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py` | `5bf34cdd65be170754ba4faa1f40ef312045f4ffc160983ff15a0e0d61f69af2` |

未重跑或改写旧 paired2、currentA、raw60/59 命令源作业或既有原始证据。

## 验证边界

本执行者未运行 Python、Node、产品、测试、解析器、AST、Vitest、tsc、
pytest、list/collect/prepare、serve、probe、GUI、HTTP、构建、模型、
selfcheck 或其他运行时检查。故本交回全部运行态结论均为 `NOT_RUN`。

请根复核本交回后独立运行修正版边界夹具并判读实际结果；不得把本次静态
核对写成红绿、全卡或产品验收通过。

## 阻碍与非零事件

- 初始目录级 `git status` 因 `dsh` 子模块工作树权限拒绝而非零。未尝试修复、
  提权、改 ACL/沙箱/审批或拆 writer 锁；改用目标路径、忽略子模块的只读
  Git 查询完成状态核对。
- 首次只读哈希命令因 PowerShell 管道/对象构造解析错误而非零，未写入文件；
  随后以无管道写法重试成功。
- `git diff --no-index` 因文件确有差异而返回 1，这是该命令的预期差异状态，
  不是测试结果。

## Git 与写入边界

- 分支状态：`line-B...origin/line-B [ahead 141, behind 1]`。
- 四个既有目标相关路径仍显示未跟踪：
  `request_scope_intent.schema.json`、`request_scope.py`、
  本次边界夹具及其 README。未清理或改写 dirty 状态。
- Git 全程只读；没有 `add`、`commit`、`rebase`、`stash`、`reset`、
  `clean`、`checkout` 或 `push`。
- 本执行者只写了正式执行令允许的两个 B 证据文件和两个协调目录文件。
  未更改 API、模型、权限、ACL、沙箱、审批或锁。
- 本交回是协调目录文件交回，不是 Git 提交，也没有可报告的提交 SHA。

## 根下一步

1. 核对最终源码哈希
   `cd3090f4c1b51e797d71439fb325d2544c3815c5e1b838d186ebe3843cb60307`。
2. 根独立运行修正后的 `scope_intent_edges.py` 并保存实际输出/退出码。
3. 根按自身权限决定是否另行复核 frozen paired2/currentA；B 不冒用其旧结果，
   也不把本次 `SOURCE_ONLY / NOT_RUN` 升级为 PASS。
