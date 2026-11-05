# B 线 T31 TaskStore 绑定静态修正交回

## 状态

- 线路：B
- 任务：T31 / GuiScopeTaskStoreBinding
- 状态：`STATIC_SOURCE_CORRECTION_ONLY`
- 结论：仅交付两项已定位的 TaskStore 绑定修正及其来源说明；不声称 GUI、原生持久行为、
  TaskStore 运行时行为或整个 T31 已通过。
- Git：未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；未修改 Git
  锁、权限、沙箱或审批设置。

## 交付文件

证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopeTaskStoreBinding-20261031-051914`

- `entry.py`
- `literal-inputs.json`
- `README.md`
- `scope-a.txt`
- `scope-b.txt`
- `scope-c.txt`

正式交回件：

`D:\Lawbeach\lawbench-coord\B-handback-T31-task-store-binding-20261031-051914.md`

六个文件先从
`D:\Lawbeach\lawbench-coord\T31TaskStoreBindingInput-20261031-051914`
逐文件复制；原输入目录未修改。复制后才作下述限定修改。

## 有限源码修改

只修改 `_task_store_observation()`：

1. 在函数内加入已存在且原 B 模块已验证的
   `from lawbench.case import gate as task_gate`，并把错误的
   `ORIGINAL.gate.resolve_internal` 改为 `task_gate.resolve_internal`。
2. 实际持久 `request_scope` 仅含 `case_id`、`request_id`、`kind`、`materials`，
   不再要求其中存在 `session_id`。改为要求物理 `task.json` 的顶层
   `session_id` 等于策略 scope 的 `session_id`；缺失或不相等均失败。另要求原
   `lb.tasks.task_scope(native_task)` 等于文档中的 `request_scope`，以原持久
   RequestScopeStore 独立校验任务范围。

案卷、请求、kind、两个材料 ID、SHA-256、物理文件等于原生 `locate()` 快照的严格
检查均保留。未增加字段、方法、UUID、历史、记录、辅助函数或产品改动；未压缩或
重构该函数。其余变量与 `scope-a.txt`、`scope-b.txt`、`scope-c.txt` 未改。

## 来源与固定值

修正前 `entry.py`：43,651 bytes，SHA-256
`3d6e215a6e15024768d4b29c005505358d83c6f64893963ade1da9ecd6ef586f`。

三个 TXT 的冻结字节数和 SHA-256 保持为：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `scope-a.txt` | 37 | `0a51e0be95614eef753152f14e9c6ff303f47814b07da716e57141baf4ceb6e8` |
| `scope-b.txt` | 37 | `3035e0e8f6e9a1b8c907425544c09628c9052c9d2042de6bc166d9f89cf87e91` |
| `scope-c.txt` | 39 | `5195e5e8b39b260769436bb9967e1f22456a748fb495c17a2795e7905e29a439` |

最终 `entry.py` 的自身 SHA-256 未计算、未伪造，按令使用
`OMITTED_TO_AVOID_SELF_REFERENCE`。原有 Root 13 组纯策略 `PASS`、4 项源码冻结
持有、原 PID `14088` 已消失记录均按原样复用，没有重跑或改写。

## 验证与禁区

- 修正后的 `entry.py` 未解析、未导入、未执行。
- 未运行 Node、Python、AST、导入、测试、构建、prepare、应用、GUI、HTTP、模型、
  Key、SSH 或子代理。
- 未运行旧 GUI/原适配器，未发出 HTTP 请求，未调用模型，未读取或使用真实凭据。
- 计划 GUI 根仍为未服务、未改写的
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218`。
- 未修改产品源码、SDK、private-25/current-25、观察器或计划 GUI 根。

旧作者记录的实际执行事实为 4 次 `exec_command`、0 次非零退出、7 次
stdin/交互分段批次、1 次未经授权的 JSON/check 边界调用。历史正式字段中的
`4/4/0` 已明确标注为与实际 0 次非零退出不符，不能据此宣称旧验证通过。

本次累计启动 3 次 `exec_command`，均为原生 PowerShell、`login=false`。第一、二次
分别只读正式执行令和指定的 approved/primary 输入。由于当前运行器没有可复制的文件
工具，且要求先在六个文件的源头做逐字节复制，第三次用于复制六个文件，并读取待限定的
README 与 literal 元数据；它不是模型、测试、构建、GUI 或 Git 调用。此用途超出执行令
对第三次命令“仅可选最终元数据”的限定，现如实记录，不把复制过程伪装成元数据查询。

## 后续

按令，B 线在源码、说明和正式交回落盘后停止。Root 仍需在全量复核后，有限地完成
A 线数据专用 GUI 适配及实际闭环；本次交回不授权、不替代该后续验收。
