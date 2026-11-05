# T31 材料范围意图丢失修复交回

结论：源码修复和窄边界回归源码已落盘，可在独立根复核后运行；作者验证为
`NOT_RUN`，本轮没有任何红绿、HTTP、GUI、产品、契约自检或验收结论。Git
全程只读，没有提交 SHA。

## 进度四问

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 为 scoped prepare 增加独立持久意图；意图先于主记录落盘，主记录单独丢失时同请求失败关闭且不建任务。另写了七个窄边界方法、说明、进度件和本交回件。 |
| 目标是什么 | 合法新 R 仍保留全案控制路径；已固定材料范围的 R 不因 `request-scopes.json` 的持久行单独消失而变成新的全案任务。 |
| 在等什么 | 等独立根做完整复核，再运行冻结双例、本轮新增边界及受影响的现有 native scope 回归；信号是实际退出码、用例计数、失败详情和 `.t31-scoped-task-*` 残留检查。 |
| 卡在哪 | 当前源码交回不卡。首轮无参数 `git status` 因 `modules/dsh` 子模块目录权限拒绝而失败；改用 `--ignore-submodules=all` 后只读取得状态。按令没有处理权限、锁、审批、沙箱或 ACL。 |

## 决策完成度

| 已合流可见 | 在飞 | 已裁未派工 | 候 owner |
|---|---|---|---|
| 0 | 1：本轮源码交回等待独立根复核和实际运行 | 0 | 0 |

本表只说明交付位置，不表示范围修复已通过验证。

## 实际改动

1. `D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py`

   增加独立意图的读取、原子写入、身份核验和主记录兼容回填；调整
   `prepare`、`release`、`claim_or_replay`、`task_scope` 的失败顺序。

2. `D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json`

   本轮唯一新增私有结构。只含请求、案件、会话、材料编号/摘要、意图状态和
   时间；不含材料名、路径、正文、检索词、模型输入输出、Key 或密码。

3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py`

   新增七个作者未执行的窄边界方法，复用冻结 fixture 和真实
   `TaskStore`/`Materials`/`CaseRegistry` 源码路径。

4. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md`

   记录状态顺序、兼容策略、真实故障假设、测试用途和根运行入口。

5. `D:\Lawbeach\lawbench-coord\B-progress-T31-scope-intent-fix-20261026-152026.md`

   协调目录进度件。

6. `D:\Lawbeach\lawbench-coord\B-handback-T31-scope-intent-fix-20261026-152026.md`

   本交回件。

`service\lawbench\case\task.py` 在本轮开工时已是脏文件；本轮没有写它。其
文件长度保持 `40253` 字节，最后修改时刻保持
`2026-10-25 19:02:04 UTC`。没有改现有公开四 schema、旧测试、冻结 fixture、
入口、guard、路由、resolver、PDF、配置、运行时或依赖。

## 实现与失败顺序

每个 scoped R 的独立凭据位于应用数据目录：

`request-scope-intents\<sha256(request_id)>.json`

成功 prepare 的顺序：

1. 按真实材料索引生成材料编号和摘要快照。
2. 原子写 `pending` 意图。
3. 原子写原 `request-scopes.json` 的 `prepared` 行。
4. 原子把意图升为 `prepared`。
5. 全部成功后才返回 prepare 成功体。

意图写失败时，主行不会落盘。主行写失败时，`pending` 意图保留；同请求可
重试完成，不能直接 claim。主行成功但意图升级失败时，本次 prepare 不返回
成功；重试先完成升级。

claim 的规则：

- 主行有材料时，独立意图必须存在，且请求、案件、会话、材料编号、摘要、
  顺序和主行一致。
- 主行缺失而意图存在时，不调用任务编号工厂、不写 pending task、不创建任务：
  - `prepared` 意图直接报原生 `ApiError`；
  - `pending` 意图也报原生 `ApiError`，必须先重做 prepare。
- 意图损坏、不可读、不是普通文件、材料编号重复或与主行冲突时，claim 前
  失败。
- 新 R 既无主行也无意图时，仍按合法未 prepare 请求创建 `null` 范围任务和
  全案视图。

release 在主行丢失而意图完好时，只用意图固定材料重建 `released` 主行，
不创建任务。重复 release 幂等；之后同 R 的 begin 仍按 released tombstone
返回 `TASK_NOT_FOUND` / `request_scope_gone`。

## 兼容策略

升级前的有效主行没有独立意图。主行仍在、身份和材料版本完整时，服务把这份
主行当作可用的历史权威证据，在 prepare 或 claim 前原子回填一份
`prepared` 意图。如果回填写失败，操作失败且不创建任务。

如果主行已经丢失，该 R 的独立意图也从未写入或同时丢失，系统无法从其余
合法数据区分“曾经 scoped prepare 的 R”和“全新未 prepare 的 R”。为保留
合法未知 R 的全案控制语义，本修复不宣称防住“主行与该 R 的独立意图同时
丢失”。它保护执行令给出的故障：只移除 `request-scopes.json` 中的持久行，
该 R 的独立意图仍存在。

如果意图单独丢失而主行仍完整，本轮从主行回填。这是明确的旧记录兼容策略，
不是“两份证据同时丢失仍可判定”的声明。

## 精确源码影响

| 路径 | 本轮影响 |
|---|---|
| `service/lawbench/case/request_scope.py` | scoped prepare、release、claim/replay、task scope 的持久证据顺序变化 |
| `contracts/files/request_scope_intent.schema.json` | 新增私有意图结构，不改变公开请求/返回 |
| `docs/plan/evidence/T31/EvidenceFix-20261026-152026/scope_intent_edges.py` | 新增源码回归，作者未执行 |
| `docs/plan/evidence/T31/EvidenceFix-20261026-152026/README.md` | 新增设计与运行说明 |

当前文件 SHA256：

```text
9a0bcfe70c7aeedb05f2b6440526ae7cc10d4d3cd5c5edd4a7dc8000680dc405  service/lawbench/case/request_scope.py
cb8a2cb8459120f1bfed4ba3eac94052bef342a85d33f2fc3f637c1a11e732fe  contracts/files/request_scope_intent.schema.json
c24418b43bd3b9b9e86d8b9e20cad4386e9cce755dde99facf727c959c11bc8b  docs/plan/evidence/T31/EvidenceFix-20261026-152026/scope_intent_edges.py
36b9bfc65427ae73caba67b8a661dd953219da3872505e1741d2815e220f07fe  docs/plan/evidence/T31/EvidenceFix-20261026-152026/README.md
```

## 冻结与复用证据

冻结范围丢失双例 SHA256 与执行令一致：

```text
5bf34cdd65be170754ba4faa1f40ef312045f4ffc160983ff15a0e0d61f69af2  docs/plan/evidence/T31/ReviewRegression-20261026-150412/scope_loss_check.py
```

当前只读哈希：

```text
1898c4d4208919b274f8e0cbc0f04bf6c874aa571f155e7b3dcab790a777a21c  docs/plan/evidence/T31/ScopedTaskImplementation-20261026-014815/scoped_task_standalone.py
7d061c4d436e1a86e1f550e87ff66597caf650946d2c552a3a4e2d1072ec1a4a  docs/plan/evidence/T31/ScopedTaskImplementation-20261026-014815/scoped_task_boundaries.py
b236a1072e9f35332df27cafd0fad5fb827e4277845d8b361f382546a3cacec2  docs/plan/evidence/T31/ScopedSubmissionEdges-20261026-104202/scoped_submission_edges.py
67a2d4f51a52f3c8ad8ac0f05bf3e3aec90d12f5f1e2fdaeb1a99901d1365a1c  contracts/api/request_scope.schema.json
e8b40898e8f4af1ac21a66bda79213ae37031b842d05c309e1c645c83cd2a477  contracts/files/request_scope_store.schema.json
1d291f56a9efe903b3f695654c768c6378b986d0aa62b0ffd1c99611ace06bed  contracts/files/task.schema.json
22b455e37beb880f8272846d3e4f154a2a82e2a75a3e7f601e1dfd1982b16571  contracts/core/task_begin.schema.json
```

上述文件在本轮没有写入。它们在开工时已属于既有脏状态或既有未跟踪证据。

执行令所载的原始实证明细仍只作修复前缺陷依据：产品断言 4/4 红；配对两例
一例合法未 scoped 控制通过，另一例 prepared 行丢失后错误接受 `null` 范围
和全案三份材料。因为本轮已改被测源码，这组旧结果不能当作修复后的绿证。
旧 14 项 HTTP 与当前入口 pin 也没有被冒用为当前源码切片证据。

## 根运行入口

以下命令不得由作者代跑；根应先完整审阅当前源码、schema、fixture 和新增
用例，再按顺序实际执行并保留原始输出与退出码：

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py' -v
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py' -v
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py' -v
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py' -v
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedSubmissionEdges-20261026-104202\scoped_submission_edges.py' -v
```

运行后只读检查：

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B' -Force -Directory -Filter '.t31-scoped-task-*'
```

预期为空；若解释器硬崩溃留下目录，根需先按精确字面路径核对来源，再做受控
处理。正常 unittest 路径由既有 fixture 清理私有临时目录。

## 未做与剩余限制

- 作者没有运行 Python、Node、产品、测试、解析器、AST、Vitest、pytest、
  契约自检、服务器、HTTP、GUI、模型、OCR、Office、构建、打包或部署命令。
- 没有新测试的输出、通过数、失败数或残留检查结果；所有行为判断来自源码静态
  回看，不能当实测结果。
- 新 schema 由契约注册表按目录加载。按本次执行令只新增该私有文件，没有改
  `_build` 生成器、公开 schema、样例 manifest、契约版本或 `Spec.md`。
- 应用数据卷整体丢失，或同一 R 的主行与独立意图同时丢失时，无法区分曾经
  scoped 与全新未 scoped；这是本修复的真实故障假设。
- 本机多进程同时写同一应用数据目录不在本轮证明范围；现有结构按单 writer
  和进程内 `RLock` 复用。
- Git 未暂存、未提交、未 rebase、未 stash、未 reset、未 clean、未 checkout、
  未 push；`line-B` 的 HEAD 只读观察为
  `dc56a93be4b07dbe7a48863e3135351659817fb5`，本报告不提供修复提交 SHA。

## 全部 Shell 命令台账

所有命令都使用 `login=false`。除下列明确标出的纪律偏差外，shell 均为
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`。

### 执行令与工作树

```powershell
01  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-scope-intent-fix-order-20261026-152026.md' -Raw -Encoding UTF8
02  git status --short --branch
03  git log -1 --format='%H%n%s%n%ad' --date=iso-strict
04  Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31' -Recurse -File | Select-Object FullName,Length,LastWriteTimeUtc
05  Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py' | Select-Object FullName,Length,LastWriteTimeUtc
06  git status --short --branch --ignore-submodules=all
07  git diff --name-status --ignore-submodules=all
```

02 退出 1：`fatal: cannot chdir ... modules/dsh: Permission denied`。没有修
权限。04 成功但输出很长并被工具截断，没有据此删除或改写任何东西。

### 必读材料与基线源码

```powershell
08  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\PROJECT-PROFILE.md' -Raw -Encoding UTF8
09  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\lawbench-关键事实索引-20260928.md' -Raw -Encoding UTF8
10  rg -n -C 45 'T31|scope|作用域|准备态|prepared' 'docs\plan\lawbench-工单集-第一版开发-20260928.md'
11  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py' -Raw -Encoding UTF8
12  rg -n -C 8 'request_scope|prepared|prepare|release|claim|admit|admission|scope' 'service\lawbench\case\task.py'
13  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\files\request_scope_store.schema.json','D:\Lawbeach\lawbench-B\contracts\examples\file_request_scope_store.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\README.md' -Raw -Encoding UTF8
14  rg -n -C 12 'def write_json|def read_json|def validate|atomic|replace|fsync|lock' 'service\lawbench\contracts.py' 'contracts\check_examples.py' 'service\lawbench\case\gate.py'
15  rg -n -C 12 'def _write|write_json|atomic|replace|resolve_internal|def rel|def _read' 'service\lawbench\case\task.py'
16  rg -n -C 10 'prepare\(|release\(|claim_or_replay|request_scope|released|rejected|claiming|claimed' 'docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py' 'docs\plan\evidence\T31\ScopedSubmissionEdges-20261026-104202\scoped_submission_edges.py' 'docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py'
17  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\errors.py','D:\Lawbeach\lawbench-B\contracts\api\request_scope.schema.json' -Raw -Encoding UTF8
18  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py' -Encoding UTF8; $lines[51..320] -join "`n"
19  rg -n -C 10 'def _write|def rel|contracts\.write_json|atomic_write' 'service\lawbench\case\task.py'
20  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py' -Encoding UTF8; $lines[160..330] -join "`n"
```

15 和 17 两次误把 shell 写成 `bash`，均在启动前被拒绝，未读取或执行任何
脚本，退出均为 1。其余命令成功。

### 结构、旧测试与契约

```powershell
21  rg -n 'RequestScopeStore\(' 'service' 'docs\plan\evidence\T31'
22  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedSubmissionEdges-20261026-104202\scoped_submission_edges.py' -Encoding UTF8; $lines[0..319] -join "`n"
23  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\contracts.py' -Encoding UTF8; $lines[0..160] -join "`n"
24  rg -n -C 8 'request_scope|request-scopes|请求范围|材料批次|T31|1\.6' 'docs\src\Spec.md' 'docs\src\PRD.md'
25  rg -n -C 8 'schema.json|examples|manifest|files/' 'contracts\check_examples.py'
26  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\examples\manifest.json' -Raw -Encoding UTF8
27  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\README.md' -Raw -Encoding UTF8
28  rg -n 'request_scope_store|files/request_scope|request-scopes' 'contracts' 'service' 'docs\plan\evidence\T31'
29  rg -n -C 8 'appdata|iterdir|listdir|rglob|glob|request-scopes|临时|cleanup|no.*file|not.*file' 'docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py'
30  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py' -Encoding UTF8; $lines[0..159] -join "`n"
31  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py' -Encoding UTF8; $lines[300..430] -join "`n"
32  git diff --numstat --ignore-submodules=all -- service/lawbench/case/task.py service/lawbench/case/request_scope.py contracts/files/request_scope_store.schema.json contracts/api/request_scope.schema.json
```

25 至 28 这四次执行把 shell 写成短名 `pwsh`，虽然与完整路径是同一只读
PowerShell、均成功且没有副作用，仍属本执行令“每次必须完整路径”的纪律偏差。

### 开工哈希与目标存在性

```powershell
33  Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py' | Select-Object Path,Hash
34  Get-Item -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T31-scope-intent-fix-20261026-152026.md','D:\Lawbeach\lawbench-coord\B-progress-T31-scope-intent-fix-20261026-152026.md' -ErrorAction SilentlyContinue | Select-Object FullName,Length,LastWriteTimeUtc
35  Test-Path -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json'; Test-Path -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026'
```

34 退出 1，原因是两个协调文件当时都不存在，符合首次交回。35 返回两个
`False`，随后由 `apply_patch` 新建；该命令内部有两个 PowerShell 语句。

### 写后静态复核

```powershell
36  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py' -Raw -Encoding UTF8
37  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py' -Raw -Encoding UTF8
38  Get-Content -LiteralPath 'C:\Users\morel\.agents\skills\formal-report\SKILL.md' -Raw -Encoding UTF8
39  Get-Content -LiteralPath 'C:\Users\morel\.agents\skills\human-explain\SKILL.md' -Raw -Encoding UTF8
40  rg -n '"(time|sha256|request_id|case_id|session_id|material_id)"\s*:' 'contracts\common.schema.json'
41  Select-String -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md' -Pattern '[ \t]+$' | Select-Object Path,LineNumber,Line
42  Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py' | ForEach-Object { '{0}  {1}' -f $_.Hash.ToLowerInvariant(), $_.Path }
43  git status --short --ignore-submodules=all -- 'service/lawbench/case/request_scope.py' 'service/lawbench/case/task.py' 'contracts/files/request_scope_intent.schema.json' 'contracts/files/request_scope_store.schema.json' 'contracts/api/request_scope.schema.json' 'docs/plan/evidence/T31/ReviewRegression-20261026-150412/scope_loss_check.py' 'docs/plan/evidence/T31/EvidenceFix-20261026-152026/'
44  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py' -Encoding UTF8; $lines[86..235] -join "`n"
45  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py' -Encoding UTF8; $lines[285..405] -join "`n"
46  Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\task.py' | Select-Object FullName,Length,LastWriteTimeUtc | Format-List
47  Get-Date -Format 'yyyy-MM-ddTHH:mm:ss.fffffffK'
48  Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py' | ForEach-Object { '{0}  {1}' -f $_.Hash.ToLowerInvariant(), $_.Path }
49  Select-String -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md','D:\Lawbeach\lawbench-coord\B-progress-T31-scope-intent-fix-20261026-152026.md' -Pattern '[ \t]+$' | Select-Object Path,LineNumber,Line
50  Get-Item -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\request_scope.py','D:\Lawbeach\lawbench-B\contracts\files\request_scope_intent.schema.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md','D:\Lawbeach\lawbench-coord\B-progress-T31-scope-intent-fix-20261026-152026.md','D:\Lawbeach\lawbench-B\service\lawbench\case\task.py' | Select-Object FullName,Length,LastWriteTimeUtc
51  git status --short --ignore-submodules=all -- 'service/lawbench/case/request_scope.py' 'service/lawbench/case/task.py' 'contracts/files/request_scope_intent.schema.json' 'docs/plan/evidence/T31/EvidenceFix-20261026-152026/' 'docs/plan/evidence/T31/ReviewRegression-20261026-150412/scope_loss_check.py'
52  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\README.md' -Raw -Encoding UTF8
53  $lines = Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py' -Encoding UTF8; $lines[0..120] -join "`n"
54  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedSubmissionEdges-20261026-104202\README.md' -Raw -Encoding UTF8
55  Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\api\request_scope.schema.json','D:\Lawbeach\lawbench-B\contracts\files\request_scope_store.schema.json','D:\Lawbeach\lawbench-B\contracts\files\task.schema.json','D:\Lawbeach\lawbench-B\contracts\core\task_begin.schema.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py','D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedSubmissionEdges-20261026-104202\scoped_submission_edges.py' | ForEach-Object { '{0}  {1}' -f $_.Hash.ToLowerInvariant(), $_.Path }
56  Select-String -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T31-scope-intent-fix-20261026-152026.md','D:\Lawbeach\lawbench-coord\B-progress-T31-scope-intent-fix-20261026-152026.md' -Pattern '[ \t]+$' | Select-Object Path,LineNumber,Line
57  Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T31-scope-intent-fix-20261026-152026.md' -Encoding UTF8 | Measure-Object -Line -Character
58  Select-String -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T31-scope-intent-fix-20261026-152026.md' -Pattern '^## |^Response ID|^Response log path' | Select-Object LineNumber,Line
```

53 和 54 两次又把 shell 写成短名 `pwsh`，均只读成功且无副作用，仍属纪律
偏差。41 和 49 的尾部空白检查无输出。43 显示 `task.py` 保持既有 `M`，
本轮新增项为目标源码、schema 和证据目录；没有据此做 Git 写操作。

## 非零退出与异常事件

| 事件 | 结果 | 是否处理 |
|---|---|---|
| 02 无参数 `git status` | 退出 1；`modules/dsh` 权限拒绝 | 未修权限；用 `--ignore-submodules=all` 只读取状态 |
| 15 shell 误填 `bash` | 退出 1；PowerShell 启动前访问拒绝 | 没有脚本执行；后续恢复完整 PowerShell |
| 17 shell 误填 `bash` | 退出 1；PowerShell 启动前访问拒绝 | 没有脚本执行；后续恢复完整 PowerShell |
| 25-28 shell 短名 `pwsh` | 均退出 0、只读 | 无文件影响；记为纪律偏差 |
| 34 协调文件预检 | 退出 1；两个文件尚不存在 | 后续用 `apply_patch` 新建 |
| 53-54 shell 短名 `pwsh` | 均退出 0、只读 | 无文件影响；记为纪律偏差 |

没有 `index.lock` 事件。没有尝试修锁、扩权、改审批、改 ACL 或拆 writer 锁。

## 下一步建议

独立根先按“源码影响表”完整审阅 `request_scope.py` 的状态顺序和兼容策略，
再执行“根运行入口”的五个脚本并记录实际退出码与原始输出。当前不需要额外
owner 决策；如果实际运行暴露新的协议缺口，再把具体失败证据交给根裁决，不
在这条修复线邻近扩展框架。

Response ID：`root-t31-scope-intent-handback-20261026-152026`

Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T31-scope-intent-fix-20261026-152026.md`
