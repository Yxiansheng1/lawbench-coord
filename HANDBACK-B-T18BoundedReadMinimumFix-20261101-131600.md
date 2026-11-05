# B 线交回件：T18 bounded read 最小值修复

## 结论

已按批准映射完成唯一有界修改。`case_read_material` 的 `end_present` 分支现在会在 `start < 1` 时返回现有 `INVALID_ARGUMENT/start_invalid`，不再把零或负起始单元视为合法输入。

## 修改

- 文件：`D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py`
- 原语句：`if isinstance(start, bool) or not isinstance(start, int):`
- 新语句：`if isinstance(start, bool) or not isinstance(start, int) or start < 1:`
- 修改范围：仅上述一处；未增加新错误码、字段、分支或测试，未改动无 `end` 的兼容路径及 `more_names` 路径。

## 既有事实与证据复用

- 真实文件系统基线：15 个案例中 RED 2、minimum FAIL 1、PASS 13，拒答数为 0，源码保持未变。
- C 场景的 F1 失败已由既有证据证明；本批直接复用该原始证据，不重演安装、调研或全量测试。
- 本次只改变上述单一条件，故未宣称旧回归结果可直接视为修改后的运行结果。

## 验证状态

- 正式状态：`AUTHORED_NOT_RUN`
- 本执行者运行次数：`0`
- 未运行 Python、Node、解析器、检查、测试、收集、构建、准备、模型、HTTP、GUI 或运行时。
- 遵守本次特别验证禁区；源码编辑后未执行任何动态验证。

## Git 与工作树

- Git 全程只读要求已遵守：未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 本次未写入 Git 元数据，未暂存，未提交。
- 既有 dirty 工作树已保全；修改仅为上述目标文件及本交回件。

## 遗留

- 由主编排按其验证流程决定后续检查与合流。
