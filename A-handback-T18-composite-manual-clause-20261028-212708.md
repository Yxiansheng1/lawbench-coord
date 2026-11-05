# A 线交回：T18 复合人工原因子句

状态：`SOURCE_FIX_AUTHORED_NOT_RUN`。本次在授权的 A 线证据目录内完成有界源码更正和测试追加，未执行运行时，也未把源码修正写成实际工作流通过。

## 状态与输入身份

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-composite-manual-clause-order-20261028-212708.md`。
- 当前进程：PID 656，`pwsh`，本次 A 线执行者；没有启动或成为第二 writer。
- A 线工作树原本很脏。默认 `git status --short --branch` 因受保护子模块 `dsh` 的 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-A\modules\dsh` 读取权限拒绝而失败；没有修改权限、ACL、审批、锁或子模块。使用 `--ignore-submodules=all` 只读取得的完整 dirty 清单保持原样。
- 更正前 consumer 与 spec 的 SHA-256 分别为 `d194cc74bc445c9e9fbf0241faaf105d67e770f3bccc4afe646cc1d772df6002`、`e06e554ab46b792bc5aea1ed93ce20a0b8e3a1ee7763936ef1285d0976910a2a`，均与输入目录副本一致。
- 实际输入为 6 条 edits、accepted 5、out_of_scope 1；id 4 注释含 `风险4`、para 39，机器原因与草稿处理方式均为 `find跨越超链接域代码，系统未纳入修改清单`。

## 改动

只改两张授权源码文件：

- `docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts`
  - 改动前 107381 字节，改动后 107447 字节。
  - 新 SHA-256：`4228076465001F210F18D5BC90542F7A1BB6EB0DBD04C424961B4A5C92163CF4`。
  - 共 2691 行，静态逐行比较只有第 1693 行的 `crossBoundaryReasonClause` 变化。
  - 在既有封闭文法中接受复合边界 `超链接域代码` 和对称顺序 `域代码超链接`。
  - 在既有失败状态家族中加入精确状态 `系统未纳入修改清单`。
  - 原有原因正例、状态正例及其他机器原因归一化精确回退均保留。
- `docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\manual-reason-observer.spec.mts`
  - 改动前 12909 字节，改动后 14571 字节。
  - 新 SHA-256：`25ADCBBE8A2A0C061F668FDD23058A3B946D1970639BAA8ADA6775C389D48239`。
  - 原 12909 字节前缀逐字节一致，旧 34 项字面与断言未改。
  - 末尾追加当前真实 id4 草稿加 6 条 edits/结果正例，共 4 项：1 个真实复合子句正例，以及复合原因配成功状态、只有失败状态无原因、复合原因被否定 3 个负例。
  - 累计 authored 38 项；本次未运行，不能报为通过。

必要说明已追加到同目录 `README.md`，旧身份表和历史记录未覆盖。

## 静态核验

已完成的检查仅限文件读取、文本查找、逐行比较和 SHA-256：

- consumer 前后同为 2691 行，变化的 1-based 行号只有 1693。
- spec 新文件以更正前 12909 字节为精确前缀。
- 追加块中真实正例调用 1 次，三个指定负例标签各 1 次。
- 没有调用 Node、Python、TypeScript 解析器、测试、自测、动态导入、collect、build、prepare、HTTP、模型、GUI、GPU、SSH、凭据、DPAPI、环境变量密钥链或真实案卷。
- 没有执行任何 Git 写操作：未 add、commit、rebase、stash、reset、clean、checkout 或 push。

## root 后续硬门

1. 先完成全源反向核对和令内全部命令。
2. 在同一源码身份上运行当前有限 observer 测试；本次 authored 数量不是运行结果。
3. 在 actual model 前完成字面常量编译器检查。
4. 再按正式流程执行实际模型；不得把本次源码修正扩大为整个函数、模型、人工门或发布已通过。

Gate 1、完整 T18、项目完成与 Packaging 均未因此交回改变；Packaging 保持 **HOLD**。
