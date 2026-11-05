# B 线交回：T18 具名费率测试夹具与锁事件期望修正

## 结论

有界夹具修正已完成。本次只修改
`D:\Lawbeach\lawbench-B\service\tests\t18_rate_ratio_20261028_194123.py`
中的两处新增测试期望：UI 保护路径只允许既有的首个任务锁事件；14 个具名比较
负向控制句补充“问题：”引导，使解析器能够到达各自的真实歧义条件。产品源码、
既有 8 个测试方法和其余 3 个新增测试方法未改。

按正式执行令，本执行者保持 runtime 0，没有运行 Python、测试、AST、导入、
收集、构建、服务、HTTP、模型、GUI、ssh、Key 或真实案卷。因此本交回只声明
静态精确核对通过，不声明测试转绿；全 T18 仍不完整，Packaging 仍为 HOLD。

## 既有证据复用

- 复用最新实际有限验证：11 个测试方法中 10 PASS、1 FAIL，1.703 秒，1 个
  Python OS 进程已结束，TEMP 已清理，源文件保持受控。本次未重跑。
- 实际命名句与 UI 两次 `ApiError` 均已到达正确的
  `rate_ratio_mismatch`，详情为真实 `2` 倍对草稿 `20` 倍。
- 失败点是新测试第 434 行要求 `ui.tasks.events == []`，而既有生产 UI
  在写前保护之前会先获取任务锁，实际唯一事件为 `('lock', TASK_ID)`。
  加锁不是版本、路径、写入、result 或 progress 变更，故不删除产品锁。
- 原始失败 JSON、旧正式交回、dirty 快照及输入源码/测试副本全部保留未改。

## 修改与静态核对

修改后的测试文件 SHA-256：

`E3C79975A31DE5838C5693E6F25DAF7CD0A220A0755F5B752A0E2165106D3D74`

相对输入快照，使用 PowerShell 逐行精确比较，变化仅为 15 行被替换：

1. UI 断言改为
   `self.assertEqual(ui.tasks.events, [("lock", TASK_ID)])`，位于
   `ApiError.reason` 和 `detail` 断言之后。该测试仍要求 gate 事件为空、
   工作区不存在，且不出现版本、写入、result 或 progress 效果。
2. 仅 14 个新增具名歧义控制句的行首从 `- ...` 改为 `- 问题：...`；
   引用控制句保留 `原文：「...」`，最终为 `- 问题：原文：「...」`。
   标签、数量与缺失/同方/未介绍/第三方/第三费率/顺序/单位/引用/否定/
   假设/泛化/重复/缺右项语义均保留。

PowerShell 结构核对结果：

- 目标 UI 锁断言：1 处；
- 目标 UI 空事件断言：0 处；
- 14 个控制句均已带“问题：”引导，未带该引导的控制句为 0；
- 全部逐行差异均限于上述具名测试区域。

产品源码冻结哈希复核未变：

`255A99DABB231D8CB4F09B692FAC5BF7A87D7E291973AB746DE43CCC022DA4F5`

输入包原件哈希保持为：

- `drafts.py`：`255A99DABB231D8CB4F09B692FAC5BF7A87D7E291973AB746DE43CCC022DA4F5`
- `test.py`：`12EA5B4CE2BF26B71F5260BD00AD72C091F0557A9E03D404A67026301A3E99F1`
- `previous-formal.md`：`44A87B55DDF740F2BB6C1B9E9673C2F95CDC8B7DBF0B097F55BD3D81E9A48B09`
- `root-finite-failure.json`：`4EA158BE6ED53ECE38473E4AA6FB33E5BE2A0EE543C03A8E6C1BD9067637294E`
- `B-dirty-before.txt`：`4304FE91A77A35DA9CF5579316C17D60D8AB6C925352B1C4999AB6C47CA9679E`

## Dirty、Git 与权限

- 修改前 dirty/untracked 基线仍为输入包的 `B-dirty-before.txt`，共 5615 行；
  `drafts.py` 和本测试文件在基线中的既有状态分别保留。
- 本次工作区只改上述测试文件；没有删除、移动、清理或整理任何既有 dirty。
- 全程未运行 Git 命令，未执行 `add/commit/rebase/stash/reset/clean/checkout/push`，
  未改暂存区、锁、ACL、审批、沙箱或策略；交回不依赖 Git 提交。
- 未重演安装、调研、旧 44 项、全量测试、同一工作流或任何被禁止的验证。

## 根会话后续门

根会话可在完整累计复核后，运行新的 11 个方法及受影响的 12 项；全部通过后
刷新精确的 ONE row pin，再运行一次同一工作流。在此之前，不得宣称本夹具修正、
全 T18、全项目或 Packaging 已通过。
