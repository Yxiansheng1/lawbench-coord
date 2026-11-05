# B 交回：T18 条款号段首误报

- 状态：`AUTHOR_COMPLETE_ROOT_FINITE_PENDING`
- 线：B，工作目录 `D:\Lawbeach\lawbench-B`
- 时间：2026-10-28T21:47:21Z
- 任务来源：`D:\Lawbeach\lawbench-coord\B-T18-citation-clause-prefix-order-20261029-054255.md`
- 结论：目标源码最小补丁和独立有限验证脚本已交付；作者按令没有执行脚本、导入生产包或运行任何 Python 测试。是否转绿、能否进入新 B346 审批，等待根侧有限验证与复核。`Gate 1`、完整 T18、全项目验收仍为 `INCOMPLETE`，打包仍为 `HOLD`。

## 1. 既有状态核认

原 T18 真实链路 RAW 仍为失败，不能改写为 PASS：

- 运行：`docs\plan\evidence\T18\ContractDraftCitationRuntime-20261029-052404\run-kiVD2B`
- 耗时 224.281 秒；自然结束 1/7；模型 HTTP 200 7/7；consumer `FAILED`。
- B 侧严格 completed-only guard 因 `TASK_END_RESPONSE` 终止，随后清理关闭；该派生失败不等于业务断言全绿。
- 首份成功保存前已有 3 个真实必答答案（序号 26）；此前 `payment_terms`、`dispute_resolution` 两次不支持问题被拒，随后从材料恢复，不是伪造答案，也不是“缺 3 个必答问题”。`root aggregate=false` 的既有原因是 unsupported IDs，不能据此宣称额外提问导致了终止。
- 真实 v3 草稿 3097 字节，SHA-256 为 `8032d01a46ec4528c3732ffad4864958c2a632ace2ca13ac2510d763e7728161`；实际 5 条 must-fix 都是条款号被当作数值。
- 原运行结束后 owned OS 为空、端口 50277 的 Listen 数为 0、`forced_stop=false`；不得重新打开原始 JSONL 或声明历史原始证据成功。
- 既有根累计 4199 条命令、3657 成功、542 非零，以及历史 runtime 违规 5 项保持不变；本次作者运行未并入该累计。既往 Skill raw-source clarity 40/35/5、一次公开 TEMP 前置产物和一次 Bash 预执行拒绝已存在记录；本次未重复 TEMP、Bash 或策略绕行。

5 条实际 must-fix 原文：

1. `1.2 合同总价为人民币1,260,000`，`〔报价单 第11行〕`，误报 C。
2. `2.1 产品执行国家现行标准`，`〔报价单 第15行〕`，误报 C。
3. `2.2 卖方随货提供产品质量证明书`，`〔报价单 第15行〕`，误报 C。
4. `3.1 交货地点：虚构市虚构区不存在大道100号青禾建材一号仓库`，`〔询价往来邮件 第2行〕`，误报 C。
5. `3.3 运费`，`〔询价往来邮件 第7行〕`，误报 C。

纯合成合同中的 1,260,000 本身是真实金额，不能连同条款号一起忽略。条款号 1.2 若配错误金额 1,260,001，仍必须报 C。

## 2. 源码前后身份与 delta

修改前生产源码与输入快照完全一致：

- 路径：`D:\Lawbeach\lawbench-B\service\lawbench\checks\citations.py`
- 输入快照：`D:\Lawbeach\lawbench-coord\T18CitationClausePrefixInput-20261029-054255\citations.py`
- 修改前：18609 字节，SHA-256 `67779ba41e35e2b6780a7b74ebe061e143a79dd5b8c97273329ae91059748758`
- 修改后：19642 字节，SHA-256 `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412`

delta 只有两处：

1. 在日期/金额常量后增加 `_GAP_UNITS` 和 `_CLAUSE_PREFIX`。
2. 在 `extract()` 完成既有归一化后，仅当 `source=False` 时调用一次 `_CLAUSE_PREFIX.sub(..., count=1)`。

结构边界：

- 必须是文本最前端、首层 1–2 位数字、第二层 1 位数字，例如 `1.2`、`2.1`、`10.1`。
- 条款号后必须至少有一个横向空白，随后接汉字。
- 常见金额、百分比、日期、重量、长度、面积、件数等单位被排除，因此 `1.2万元`、`1.2 万元`、`1.2元`、`1.2 元`、`1.2%`、`1.2 %`、`1.2吨`、`1.2 吨` 继续抽取。
- `source=True` 分支没有任何变化，材料原文段首 1.2 仍保留。
- 只删除命中的条款号前缀，不删整段、不屏蔽金额、日期、百分比、地点或其他数值；旧 A/B/C/E/F 路径不变。
- 模糊形式宁可持续报，不做宽泛豁免：无空白、正文内小数、三位小数，以及后接单位词的段首小数都不剥。
- 已知保守边界：二级条款号若为两位小数（如 `1.23 合同……`）不会剥；条款号后没有空白也不会剥。这会保留误报，但不会把真实小数静默放过。

## 3. 本次文件

| 文件 | 字节 | SHA-256 | 状态 |
|---|---:|---|---|
| `service\lawbench\checks\citations.py` | 19642 | `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412` | 目标源码 M |
| `docs\plan\evidence\T18\CitationClausePrefix-20261029-054255\finite.py` | 9395 | `e76fd35d7430f4bf37ec9aea8554716fdb5de87cedb4eaec8628ccd917e1f4de` | 新有限脚本，未执行 |
| `docs\plan\evidence\T18\CitationClausePrefix-20261029-054255\README.md` | 1979 | `ffa745735e77e808b004d3cc14edbf0ab98543abdeac3020c5d9619f620f165f` | 新运行/边界说明 |
| `D:\Lawbeach\lawbench-coord\B-handback-T18-citation-clause-prefix-20261029-054255.md` | 本文件 | — | 协调目录交回 |

没有修改契约、旧测试、Skill、提示词、guard、端状态、UI、预算、provider、SDK、默认配置、全局环境或其他 dirty 文件。

## 4. 有限验证脚本

`finite.py` 是私有合成材料的单进程消费者，只导入实际生产包：

- `lawbench.checks.citations.extract`
- `lawbench.checks.citations.check_text`
- `lawbench.checks.parse.MaterialSet`

脚本在导入前设置 `sys.dont_write_bytecode=True`；不读案件、AgentSession、模型、历史、R 消息或凭据，不联网，不写仓库，不使用 loader、`exec`、`eval` 或源码副本。`--out` 必须由根执行者预先创建且为空；可选 `--ready`/`--go` 必须都在该输出根内，等待上限默认 30 秒，缺失 `go` 即失败。

8 个有限检查覆盖：

1. 实际 5 条 prefix 全绿，且 clause 1.2 配 1,260,001 仍报 C。
2. 草稿排除实际段首形式；材料侧 `source=True` 保留 1.2 与 1260000。
3. 全角空白分隔剥条款号；无空白和正文内小数保留。
4. 真实段首万元、元、百分比、吨、独立小数、正文小数继续检查。
5. 金额、日期、比例、地点正确匹配保持绿。
6. 错误比例、日期、地点分别保留 C/B。
7. OCR A、正确/错误引语、格式 E、缺出处 F 保留。
8. excerpt/analysis 的 G 分级保持原行为。

预期成功为 8/8，但作者未运行，故当前只能写“待根侧验证”，不能写 PASS。根侧运行命令和信号用法见 README；运行时应捕获完整 PID、exe 与 UTC 出生时间，随后创建 `go.signal`。根侧执行后只认实际 `result.json` 和退出码。

## 5. 本次命令与运行时

作者执行的全部命令均为原生 PowerShell 只读检查：

- `Get-Content -Raw`：执行令、项目事实、PROFILE、T18 原卡、Spec 9.4/20.2、`citations.py`、`parse.py`、`evidence.py`、`normalize.py`、旧 `test_checks.py`、实际关闭件与合成材料文本。
- `rg` / `Select-String`：定位 T18、引用依赖、旧断言、5 条误报以及实际合成材料行文。
- `Get-FileHash`、`Get-Item`、`[System.IO.File]::ReadAllBytes/ReadAllText`：前后 SHA/字节/行尾静态核对。
- `git status --short --branch`：首次因共享 `dsh` 子模块 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-B-new\modules\dsh` 的 chdir 权限拒绝，返回 1；没有修复、扩权或重试子模块。
- `git status --short --branch --ignore-submodules=all`：成功列出全部既存 dirty，均保留。
- `git status --short --ignore-submodules=all -- <目标路径>`：成功，只显示目标源码 M 和新证据目录。
- `git diff -- service\lawbench\checks\citations.py`：成功，精确 delta 如第 2 节。
- `git diff --check -- service\lawbench\checks\citations.py`：退出 0。
- 一次文件行数/行尾统计 PowerShell 管道因 `foreach (...) { ... } | Format-Table` 的空管道语法返回 1；随后拆成变量赋值只读重跑成功，与产品代码无关。

未执行 Python、pytest、导入、编译、parser/AST、test/build、HTTP、模型、GUI、SSH、Key/DPAPI、TEMP、Node 或 Bash。作者产品运行时为 0.000 秒，helper 执行次数为 0。

Git 全程只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，未改 writer 锁、ACL、审批或沙箱。子模块权限拒绝不是本交付需要修复的阻碍。

## 6. 遗留与根侧下一动作

1. 根侧先审完整源码、脚本、命令与清理边界，再新建独立空输出目录执行有限验证。
2. 根侧按受影响范围选择旧 `test_checks.py` 的有限回归；作者未跑全量，也不主张旧测试全绿。
3. 只有根侧有限验证红绿结果和复核完成，才决定是否创建新 B346 exact source row；本次未创建、未绑定、未动态接受新 pin。
4. 完整 T18、Gate 1、项目验收、打包仍不因本补丁转绿。

