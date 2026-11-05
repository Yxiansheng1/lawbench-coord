# A 线交回：全量回归胶囊期望面修正

## 状态

已按执行令完成单处源码字面修正。仅编写，未运行；不声称测试通过，也不声称全量绿灯。

## 改动

文件：`dsh-ext/tests/dock-capsules.spec.ts`

- 仅修改既有的“选第一层‘刑事’：第二层换成刑事的业务项”用例。
- 在该用例唯一的目标 ID 期望数组末尾追加 `case-wiki-criminal`。
- 原有 5 个 ID `case-analysis`、`sentence-calc`、`bail-application`、`defense-opinion`、`cross-exam` 及顺序全部保留。
- 修改后目标数组为：

```text
['case-analysis', 'sentence-calc', 'bail-application', 'defense-opinion', 'cross-exam', 'case-wiki-criminal']
```

- 未修改其他测试体、断言策略、helpers、夹具、产品源码、冻结 v2、旧全量结果或快照。

## 验证与复用边界

- 按令复用既有结论，不重演诊断或全量回归。最新正式全量结果仍为：1345 项，1324 PASS，3 FAIL，18 pending，types 0。
- 既有根环境结论：原失败用例仅因刑事组当前第 6 个胶囊 `case-wiki-criminal` 未被旧 5 项字面数组覆盖；根环境已完成一次原红测复跑并将其作为接受依据。本次未重复该复跑，也不扩大为全量通过结论。
- 按令未运行测试、类型检查、构建、收集、准备、应用、HTTP、模型、GUI、自检或源码比对。
- 修改前快照保留于：`D:\Lawbeach\lawbench-coord\FullRegression-capsule-wiki-expectation-before-20261031-142535\before.txt`，未改动。

## 工作区与 Git 纪律

- 保全现有 dirty 工作区、旧结果和快照；本次除上述测试字面外未改仓库内其他路径。
- 全程未执行 Git 写入或其他 Git 命令，未 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，未暂存、未提交。
- 未修改锁、权限、审批、沙箱或 ACL，未启动 setup，未切换运行器或沙箱模式。

## 遗留事项

无执行令范围内的遗留修改事项。后续是否复跑、合并及最终验收由主编排决定。
