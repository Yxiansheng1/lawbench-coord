# A 线交回：T18 持久化计数修正

## 结论

已按正式执行令完成源码精度修复，未执行读取器、测试、构建、模型、HTTP、GUI 或任何 Git 写操作。

原读取器在静态阶段被拒绝的判断成立，不是产品运行失败：不可变来源共有 60 个物理行，其中 session header 为 1 行、event 为 59 条、序号为 0..58；原读取器却声明 60 条 event，并把 6 次编辑误报成 6 个已完成任务。

本次仅修正允许的两个工作树文件，并新增本交回件。读取器的身份、事件相等性、序号连续性、header/native request 校验、来源清单校验、setup/close/reopen/finally/cleanup 均未改动。

## 基线

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-persistence-count-correction-order-20261029-000809.md`
- 静态拒绝输入：`D:\Lawbeach\lawbench-coord\T18PersistenceCountInput-20261029-000809\static-rejection.json`
- 拒绝结论：`STATIC_REJECT_BEFORE_RUNTIME`；`runtime_executed=0`；`product_failure=false`
- 修改前 reader SHA-256：`c7df50338b7742a2d2d5e56fd62afe377b238738a2d29685357ce8df66c7c74d`
- 修改前 README SHA-256：`0b12083cbfe67053e528f0da19ee937cbf70e3d09d6553ed391207360ff8509f`
- 不可变物理来源：60 行；第 1 行为 session header；末事件为 `seq:58`；SHA-256 为 `cd40b5df18811adbbe988cf1bea2b739c0a8e25eb2009e36f15935b3d4ace2b5`
- 旧正式交回件：`D:\Lawbeach\lawbench-coord\A-handback-T18-manual-contains-persistence-20261028-235617.md`，SHA-256 为 `767388c4564da632f92386066ba9d840364a28ce22082d74653113d5f9770978`，未覆盖。

## 改动

### `docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\read-genuine-session.mts`

- `EXPECTED_PHYSICAL_EVENTS` 从 `60` 改为 `59`。
- 总物理行断言继续使用 `EXPECTED_PHYSICAL_EVENTS + 1`，现准确要求 60 行；对应错误消息改为 `one header and fifty-nine events`。
- native request 存在性断言的不匹配消息改为 `fifty-nine physical event rows`。
- `priorNativeRun.tasksCompleted` 从错误的 `6` 改为 `1`。
- 新增 `priorNativeRun.editsTotal: 6`；既有 `editsAccepted: 5` 保留，分别表达 6 次编辑、5 次被接受。

对协调输入中的修改前快照执行了只读逐行对照。reader 的差异只位于上述 4 个字面区域（其中任务/编辑区形成一处 diff 块）；所有实际事件 deep equality、字段与序号连续性、header/native request/UUID、来源 inventory/哈希/mtime 身份、两次重开、close/finally 与 cleanup 逻辑均逐字节未变。

### `docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\README.md`

- 将错误读数 `60 条 event / 共 61 行` 修正为 `59 条 event / 共 60 行`。
- 成功判据中的 `physicalEvents`、`firstEventCount`、`secondEventCount` 均改为 `59`。
- 明确区分源码静态声明零值与运行期观测：只有 `globalFetchAttempts` 由 `fetch` 包装器动态计数；`newModelCalls`、`agentCallbacks`、`providerPluginsLoaded`、`credentialValuesRead`、`httpRequests` 是静态声明零值。
- README 不再声称全面网络覆盖，也不声称具备凭据内存访问或凭据读取遥测。
- 风险 3 的条号业务错误、`businessQuality.fullT18BusinessPass=false`、Gate 1 未完成和 Packaging `HOLD` 均保持不变。

## 静态复核

- `rg` 复核后，reader 中不存在 `EXPECTED_PHYSICAL_EVENTS = 60`、`sixty`、`tasksCompleted: 6`。
- reader 当前关键值为 `EXPECTED_PHYSICAL_EVENTS = 59`、`tasksCompleted: 1`、`editsTotal: 6`、`editsAccepted: 5`。
- README 当前成功计数为 `input.physicalEvents: 59`、`productionRead.firstEventCount: 59`、`productionRead.secondEventCount: 59`。
- 修改后 reader SHA-256：`363539a33096616abb361eecf676e5673d7dbd36dddaf6e458b3894c0a4a3721`
- 修改后 README SHA-256：`4425953a39b7c6ca797f1b76325529143a048cc102cfd5c1cb065142fdc89be3`

本任务没有运行任何代码。静态计数修复不等于运行验证通过；真实只读重开的执行与采用仍由主编排另行决定。

## 实际命令、非零与写入面

实际只使用了 PowerShell 读取/哈希、`rg` 只读检索、只读 Git 对照和获准的窄范围文件编辑：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-persistence-count-correction-order-20261029-000809.md'
Get-FileHash -Algorithm SHA256 -LiteralPath '<reader-or-readme-or-source>'
git status --short
git status --short --ignore-submodules=all
rg -n --no-heading '<count-or-telemetry-pattern>' '<reader-or-readme>'
git diff --no-index --unified=3 -- '<coord-snapshot>' '<working-tree-file>'
```

非零结果：

- `git status --short` 退出 1：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。按令未修复锁、权限或 ACL；改以 `git status --short --ignore-submodules=all` 读取父仓状态，退出 0。
- 两次 `git diff --no-index` 均退出 1，因为快照与修复后文件存在预期差异；输出只包含本交回件列出的获准改动。
- 预检新交回路径的组合 `Get-Item` 退出 1，因为该新文件此前不存在；未覆盖任何旧交回件。

写入面仅 3 个路径：

1. 修改 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\read-genuine-session.mts`
2. 修改 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GenuinePersistenceRead-20261028-235617\README.md`
3. 新增本文件 `D:\Lawbeach\lawbench-coord\A-handback-T18-persistence-count-correction-20261029-000809.md`

没有 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，没有暂存，也没有提交 SHA。Git 写入不在本运行器授权内。

## 冻结与遗留

- 未改原始 `actual-native-events.jsonl`、输入清单、B 来源、旧 raw/formal 证据、产品代码、SDK、pins、编译文件、manifest 或其他任务文件。
- 未运行 Node、Python、测试、构建、解析器、模型、provider、HTTP、GUI 或 SSH。
- 未增加 loader、config、prompt、budget、case、history 或任何观测框架。
- 运行时结果仍未知；本次只解除发现的两项静态源码计数/报告错误。
- 原风险 3、全量 T18 未通过和 Packaging `HOLD` 状态不变。
