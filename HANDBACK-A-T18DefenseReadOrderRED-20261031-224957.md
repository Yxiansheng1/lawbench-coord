# A 线交回件：T18 防御意见先问后读 RED

- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-T18DefenseReadOrderRED-20261031-224957.md`
- 状态：**AUTHORED_NOT_RUN**
- 分支/提交：未创建、未提交。按本执行令完成的是协调目录正式交回，不是 Git 提交。
- 产品代码：未修改。
- 旧测试与契约示例：未修改。
- Git：严格只读且未执行任何 Git 写操作；未运行 add、commit、rebase、stash、reset、clean、checkout、push。

## 新增测试

文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts`

- 大小：15180 字节
- SHA-256：`412890229AC493F56C994B2BA20AC9E8FC9AA1425710A8715C611E145374F672`
- 测试数：5
- 基线结构：沿用 `general-read-question-order-20261030-163023.spec.ts` 的真实 `LegalAgent`、A/B `Host.skillQuestions` 和 `MemoryCore` 拦截模式。
- 目标 Skill：`defense-opinion`，必问 ID 固定为 `direction`、`stage`、`key_points`。
- 隔离数据：案件、会话、其他会话和任务编号均为本次执行令专用合成值；未使用真实案卷、网络、密钥或产品持久化。

## 五个测试覆盖

1. 真实 A/B Skill 返回三个准确 ID，`fromMaterials` 依次为 `false,true,false`；最终回答前，材料与 Wiki 的 `preTool` 和直接 `executeTool` 均在 Core 调用及预算计数前拒绝。`case_read_input`、搜索、材料清单、Skill 和合法的 `ask_user_question` 保持可用；保存闸门仍拒绝。
2. 同一身份、token 对应的三项真实最终回答被接受后，当前任务的材料、Wiki 和保存动作解锁；断言真实内存 Core 收到三次预期工具调用及一次写入。
3. 部分、错误 ID、空白、错误结果、取消后迟到结果五类回答均不能解锁读取或保存路径。
4. 旧任务迟到结果、跨会话结果及旧 `TaskState` 不能解锁新任务的读取。
5. 诉讼文书和通用文书原有先问后读闸门仍为真；合同审查、`NONE` 和裸 `TaskState` 默认值仍为假，普通材料与 Wiki 读取保持允许。`general-drafting` 仅作为边界回归引用。

测试通过真实 `preStep`、`preTool`、`executeTool`、`observeToolResult` 路径驱动；没有另写一套实现镜像谓词。

## 运行与验证状态

本执行令要求 source-only 新测试并明确禁止本轮执行 selftest、tsc、Vitest、SDK import 或替代验证。因此：

- 新测试未运行。
- 未运行全量回归、构建、运行器或真实模型。
- 本交回件不声称新测试已红或已绿。
- 根编排需按令在旧源码上先行执行 RED，确认 T18 防御意见先问后读回归后再决定产品修复。

## 已核输入

- `T18DefenseReadOrderInput-20261031-224957\approved.json`
- `dsh-ext\tests\general-read-question-order-20261030-163023.spec.ts`
- `dsh-ext\agent\index.ts`
- `D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md`

仅完成上述限定读取；未另做目录盘点、Git 状态、环境、凭据或配置探测。

## 留给根编排

1. 使用旧源码执行新增测试的 RED 验证，并封存输出。
2. 若 RED 成立，再在独立产品修复边界内处理 `defense-opinion` 的读取闸绑定。
3. 产品修复后以同一测试完成 GREEN，并补跑本批要求的回归。
