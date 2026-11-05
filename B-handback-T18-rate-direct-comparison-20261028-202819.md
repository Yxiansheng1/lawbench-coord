# T18 直接双比率句式写前保护交回

状态：B 线有界源码与测试修改已落盘，作者侧静态核验完成；未运行任何测试、Python、AST、导入、模型或 HTTP。新源码没有运行绿证据，不能沿用旧源码的通过读数。Gate 1、完整 T18、项目整体仍未完成，Packaging 维持 `HOLD`。

## 根因与范围

正式执行令：

`D:\Lawbeach\lawbench-coord\B-T18-rate-direct-comparison-order-20261028-202819.md`

既有真实失败证据：

- 读数和失败清单：`D:\Lawbeach\lawbench-coord\T18RateDirectComparisonInput-20261028-202819\root-actual-failure.json`
- 实际草稿：`D:\Lawbeach\lawbench-coord\T18RateDirectComparisonInput-20261028-202819\actual-final-draft.md` 第 71 行
- 实际错误句：`逾期交货违约金（千分之一/日）是逾期付款违约金（万分之五/日）的20倍。`
- 精确算术：`(1/1000) ÷ (5/10000) = 2`，草稿声称 20；旧保护只识别“前者/后者”句式。
- 原失败清单 SHA-256：`d4359a992f2c8dea24813b0c3fbc6b806d85240ca69b419915f317cabb6b5190`

本轮只改：

1. `service\lawbench\tools\drafts.py` 的既有纯算术辅助常量与 `_rate_ratio_mismatch()`。
2. 同一专项测试 `service\tests\t18_rate_ratio_20261028_194123.py`。
3. 本交回文件。

保存接缝、API、错误类、引用、任务、Skill、提示、模型提供方、预算、契约及其它源码均未改。`_save_locked()` 中独立的 `INVALID_ARGUMENT / rate_ratio_mismatch` 写前调用保留；本轮没有在其前后加入新字段、新类或新路径。

## 修改内容

保留原来的“前者/后者是/为对方 N 倍”识别。新增同一辅助层中的直接双比率识别：

- 第一项费率后必须由 `是/为` 明确连接到第二项费率；
- 第二项费率后必须紧跟 `的 N 倍`；
- 支持真实句的中文括号、ASCII 括号，以及两个费率直接相连的有限形式；
- 只比较同一断言句中恰好两个、单位一致、非零的费率；
- 始终按第一项除以第二项确定方向，不扫描句中任意“倍”附近的两个数；
- 计算继续使用 `Fraction` / `Decimal`，不使用浮点数；
- 原有引文、代码、引用块、疑问、否定、假设、第三费率、零值、单位不一致、超大/带符号/不支持形式和不明确顺序控制保留。

测试文件保留原有 5 个测试方法及断言，并新增 3 个定向方法。新增覆盖包括：

- 执行令中的真实 20 倍句在版本读取、写入、结果保存和进度删除前拒绝；
- 中文“二十倍”同样拒绝，改正为 2 倍后可保存；
- 模型保存接缝和界面保存接缝都到达实际抽取的 `_save_locked()`，界面红例在任何写前返回；
- 反向主体的 0.5 倍正确方向放行，2 倍错误方向以 `1/2` 拒绝；
- 中文/ASCII 括号和直接费率形式；
- 引文、疑问、假设、否定、第三费率、未绑定主体及单位不一致负例。

## 文件指纹

开工输入副本与本轮开工前工作区逐字节一致：

- `drafts.py`：`7C54C0685EDEC082CEA405E30AD08B38637BDBD1EC3AFEDEB6E3712FBAEBD0AB`
- `test.py`：`F2E79733E08297B682199E9A0CF1ECFAB90F442317F0EC9DBD93B82F45DDDA1E`

本轮最终 SHA-256：

- `D:\Lawbeach\lawbench-B\service\lawbench\tools\drafts.py`：
  `6F7198F626BAD4737AD7F4FDF10F5A5CCB11F4F7CF26C7702617CD5995E6E863`
- `D:\Lawbeach\lawbench-B\service\tests\t18_rate_ratio_20261028_194123.py`：
  `6A2B80C38586817A45F68116CD0A2538BD00A7D7ABBA2511A8C012CBA04DFC63`

## 已做静态核验

- 只读对比输入副本，确认开工前源码和测试哈希与协调目录输入一致。
- 只读读取最终源码、测试和上下文，确认旧 5 个方法、旧 15 项负例及回滚断言仍在。
- `git --no-optional-locks diff --check -- service/lawbench/tools/drafts.py` 无输出。
- 目标测试的尾随空白扫描无命中。
- 开工前后全工作树只读状态均为同一批既有 dirty/未跟踪内容；本轮新增状态仅为 `M service/lawbench/tools/drafts.py` 和 `?? service/tests/t18_rate_ratio_20261028_194123.py`。既有 dirty 未清理、覆盖、暂存或提交。

未执行 Python、Node、测试、selftest、Vitest、pytest、tsc、AST、解析、收集、准备、构建、服务、探测、HTTP、模型、GPU、GUI、SSH、安装或环境配置命令。因此本轮不宣称新源码、8 个测试方法、12 项受影响回归或真实工作流已通过。

## 过程偏差

本运行曾两次把只读辅助命令误交给 `bash` 包装器；两次都在执行前被拒绝，没有产生读取内容、运行结果或文件改动。此后恢复指定原生 `pwsh.exe`、`login=false`。该偏差如实保留，供主编排评估。

未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push；未修锁、扩权、改权限、审批、沙箱、环境变量、凭据或全局配置。未联系其它聊天，未改 API，未创建 Monitor，未改写实际草稿，未伪造运行、历史或模型消息。

## 交主编排

请主编排先审本文件、最终源码和测试哈希，再按执行令对变更后源码运行新有限单测、逆向/控制检查及受影响的 12 项有限回归；通过后刷新准确批准 pin，并以原预算和同一工作流重跑一次真实端到端流程。只有真实模型在新源码上正确拒绝 20、收到精确 2 反馈并完成改正保存，才可讨论后续门禁；本交回不构成运行通过或发版结论。
