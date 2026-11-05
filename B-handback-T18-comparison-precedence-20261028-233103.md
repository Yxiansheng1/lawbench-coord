# B 线交回：T18 比较派发优先级修复

状态：`AUTHORED_NOT_RUN`

交回时间：2026-10-28

## 结论

已在现有差倍候选上完成有界源码修复和回归测试追加。旧的前者/后者、直接相邻比较和具名当事人比较恢复为优先路径；“两者相差 N 倍”的歧义诊断仅在旧比较均未形成可支持判断时兜底。作者运行器未执行测试，因此不宣称红绿结果。

## 身份与输入

- 分支：`line-B`；只读状态快照为 `ahead 141, behind 1`。
- 修复前源码 SHA-256：`8424B48289707FB206A2E8FC49D6ABB5AC97C38DA507E557B0404D18DBC853A8`
- 修复前测试 SHA-256：`2BDFC1CCCE1AE520088B79B85E7600CAD13D8BFC8F28CACEA43318E9E477AA80`
- 已复用 root 的 `root-red-probe.json` 与 `root-source-review.json`；未重跑此前 36 条命令、安装、调研或全量测试。
- 未运行模型或新探针。

## 修改

1. `D:\Lawbeach\lawbench-B\service\lawbench\tools\drafts.py`
   - 仅调整 `_rate_ratio_mismatch` 内既有派发顺序。
   - 显式前者/后者比较逻辑保持原样。
   - 直接相邻比较先于具名比较识别。
   - 差倍分支移到最后，只有直接比较和具名比较均未得到可支持判断时进入。
   - 混合语句中的正确差倍声明不再遮蔽旧比较；未扩展为多声明裁决、新 NLP、白名单、提示词或预算。
   - 修复后 SHA-256：`E46C1656ECEA6F151E1CA827AAD2911E45A54B2A14ABC8F1ABFB5DF92D817822`

2. `D:\Lawbeach\lawbench-B\service\tests\t18_two_rate_difference_20261028_232316.py`
   - 保留原 16 个测试方法和全部既有断言；纯 PowerShell 校验旧前缀逐字不变、导入仍为原 14 行。
   - 追加 3 个方法，方法总数由 16 增至 19：
     - `test_existing_named_comparison_precedes_supported_difference_in_both_orders`
     - `test_existing_direct_comparison_precedes_supported_difference`
     - `test_existing_former_latter_comparison_precedes_supported_difference`
   - 覆盖 root 原文中错误 twenty 加正确 difference-two、named 两种子句顺序、direct inline、old former/latter，以及对应显式正确 two 加正确 difference-two 可保存。
   - named 错误声明覆盖 save 与 shared UI：save 在版本/文件/元数据/进度任何动作前拦截；UI 仅取得既有任务锁，无版本、文件、结果或进度变更。
   - 旧诊断保持精确的“按乙方/甲方计算的准确倍数为2倍，草稿表述为20倍”，不使用差倍歧义诊断。
   - 既有 difference-only twenty 拒绝、2/二/1/一/0.5 接受及相关负例仍在原方法中保留。
   - 测试继续抽取实际保护和保存函数；未新增导入、复制实现或完整应用入口。
   - 修复后 SHA-256：`62C4BA868E92F825AB085C517F8E373EB5B80960495A77F5AF42F882E2BC0E2D`

## 作者侧静态核验

- 仅使用纯 PowerShell、`rg`、读取、SHA-256 与只读 Git。
- `git diff --no-index` 证明源码只改派发段，测试只在原内容后追加。
- 旧测试方法顺序、方法体前缀和导入行均保持不变。
- 限定路径的只读状态显示本任务目标仍为：
  - ` M service/lawbench/tools/drafts.py`
  - `?? service/tests/t18_two_rate_difference_20261028_232316.py`
- 完整 `git status` 在子模块 `.git/worktrees/lawbench-B-new/modules/dsh` 遇到权限拒绝；另有一次忽略子模块的状态查询出现超长路径警告。均为只读阻碍，未修复、未扩权、未改 ACL 或锁。
- 未新增 `index.lock` 处理动作。

## 验证禁区遵守

- 作者运行器未运行任何测试，包括新聚焦测试。
- 未运行 Python、Node、解析器、AST、导入、编译、构建、prepare、HTTP、模型、GUI 或 SSH。
- 未执行全帧测试、store 测试或通用管线测试。
- 未改动原始 11 测试、契约、Skill、API、store、其他产品文件、安全策略、审批、全局设置、费用、包、真实案卷或凭据。
- 未使用 Bash 或 `cmd`。

## Git 与 dirty 保全

- 未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 无提交 SHA；本交回通过协调目录正式文件送达。
- 既有 dirty、历史与旧正式材料未清理、未覆盖。除本任务两个目标文件和本交回件外，本运行器未主动写入其他文件。

## 交主编排

请按执行令由 root 做全量源码复核，运行有限的全量 current-copy 加 affected-12，再做 exact data-only pins 和原契约 DOCX/JSONL 真流程。本次不停止 prepare。

当前门禁事实：Gate 1、完整 T18 与项目均未完成；`Packaging HOLD`。只有 root 完整验证通过后才能提升结论。
