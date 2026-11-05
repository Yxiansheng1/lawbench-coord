# A 线交回：T18 源质量静态修订

执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-T18QualityStaticAmend-20261031-173317.md`

状态：有界修改与正式文件交回已完成。

## 已修改

- `dsh-ext/tests/t18-delivery-quality-20261031-173317.spec.ts`
  - 删除两处 `expect(state.deliveryReviewRecovery).toBe(...)`。
  - 对应 `const state = await startTask(...)` 改为 `await startTask(...)`。
  - 保存后提示、保存失败、结果契约失败、任务与会话隔离、预算等可观察期望未改。
- `skills/defense-opinion/SKILL.md`
  - 将两条样例型不利事实规则改为通用规则：材料中与拟提出辩护意见相冲突的全部不利事实，逐项保留精确原始出处，并给出回应或律师风险提示。
  - “不利事实及回应”必需模板章节保留；未确认工作占位、单一陈述归属、七项自检与共用规则未改。
- `dsh-ext/tests/t18-delivery-quality-20261031-173317.spec.ts`
  - 唯一对应的静态模板断言已改为上述通用规则原文。
- `docs/plan/evidence/T18/QualityRepair-20261031-173317/source-review-amendment.md`
  - 新增本次修订说明；原 `README.md` 正式说明原样保留。

## 最终只读核验

- 测试中旧的 `deliveryReviewRecovery` 断言剩余数：0。
- Skill 中旧样例类别剩余数：0。
- 通用规则在 Skill 中：1 处；在对应静态测试中：1 处。
- 修订说明与原正式说明均存在。

## 验证与限制

- 按执行令未运行测试、类型检查、构建、解析、模型、网络或其他运行时验证，不宣称测试通过。
- 未重演开工、安装、调研、全量测试，也未改变旧源码或 `Agent`/`TaskState`。
- 未执行任何 Git 写入：未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 工作树原有 dirty 全部保留。`git status` 在受限 submodule 路径报告只读权限问题；未扩权、未改 ACL、未处理锁或审批。
