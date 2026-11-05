# HANDBACK B / T18 litigation list causal audit

状态：源码只读审计完成，等待主编排决定需求语义。

审计正文：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\LitigationListCausalAudit-20261031-192929\review.md`

## 结论

**UNKNOWN / NO_PROVEN_CAUSE。**

- 原始严格断言 `actual tool loop lacks case_list_materials` 保持不变，未豁免。
- 诉讼当前没有“先列清单再读”的显式源码硬前置；先列后读只存在于刑期计算和归档。
- 诉讼当前只有“必问问题答齐前不得读材料/Wiki”的 Agent 闸门。
- L0 在同一任务材料范围内输出规范 `name` 和 `status`，不输出 `material_id`；读取工具只接受 `name`，与 L0 使用同一个 `index_for_task` 索引，因此未截断的 L0 名称可直接解析。
- 没有发现确定性的名称映射、任务范围或 B 线读取解析缺口。
- 共用规则“照抄 `case_list_materials` 返回的 name”与诉讼流程直接要求 `case_read_material` 之间存在来源措辞/顺序歧义；这解释严格测试失败，但不足以判断实际模型语义通过或失败。
- 正式令未提供逐材料生产对照，本次没有读取/重演 JSONL、cases、final answers 或 oracle，因此不主张实际语义 PASS。

## 候选实现

无。现有源码不能唯一推出“诉讼必须先列清单”的产品修复；增加硬闸门会改变当前调用顺序，属于主编排需求决策，不应由 B 线自行实现。

若主编排决定严格测试代表产品要求，应另行明确修改 Spec/Skill/Agent 中的哪一个契约层，并给出对应验收；本次不改消费者断言。

## 源码审查范围

- `D:\Lawbeach\lawbench-A\skills\litigation-docs\SKILL.md`
- `D:\Lawbeach\lawbench-A\skills\_shared\共用规则.md`
- `D:\Lawbeach\lawbench-A\docs\src\Spec.md`
- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
- `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts`
- `D:\Lawbeach\lawbench-A\dsh-ext\persona.md`
- `D:\Lawbeach\lawbench-A\contracts\tools\case_list_materials.schema.json`
- `D:\Lawbeach\lawbench-A\contracts\tools\case_read_material.schema.json`
- `D:\Lawbeach\lawbench-A\contracts\common.schema.json`
- `D:\Lawbeach\lawbench-B\service\lawbench\api\core.py`
- `D:\Lawbeach\lawbench-B\service\lawbench\case\task.py`
- `D:\Lawbeach\lawbench-B\service\lawbench\case\context.py`
- `D:\Lawbeach\lawbench-B\service\lawbench\tools\__init__.py`
- `D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py`

既有证据只复用了：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\LitigationQuestionObserverFix-20261029-194948\README.md`

未重演旧 observer，不读取或改写大型会话/案件/最终答案/oracle。

## 边界

- 未修改产品、测试、fixture、guard、Skill、Spec、契约或现有证据。
- 未运行运行时、测试、build、import、HTTP、模型、GUI、凭据或 Git。
- 未 add/commit/rebase/stash/reset/clean/checkout/push。
- 既有 dirty 未触碰；只新增审计正文与本交回件。
- 两次 shell 元数据误写为 `bash` 均被运行器拒绝，未执行命令，未启动 setup/legacy，未改沙箱、审批或 ACL。

正式文件交回完成。请停止后续 B 执行，待主编排决定是否把该严格断言提升为明确产品契约。
