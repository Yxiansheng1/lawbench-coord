# B 线交回 · T18 引用回收源码审计

- 工单：T18（引用回收源码审计，有界；未改产品/测试/Skill）
- 状态：`SOURCE_AUDIT_COMPLETE`；不是 `BUSINESS_PASS`
- 源码与证据：`D:\Lawbeach\lawbench-coord\B-T18-citation-recovery-findings-20261028-212043.md`
- 关键结论：当前无程序化机制消费 `citation_check.problems`；真实两次保存均把 12 条 F 提示原样返回给模型，模型把事实来源句误归为拟议措辞。`passed=true` 仅表示 `must_fix=0`，不代表每条事实已引证。
- 最小建议：在 `dsh-ext/agent/index.ts:242-254` 捕获保存结果，在 `task-state.ts` 按问题签名一次性排队，经 `index.ts:167-178` 既有 notice 路径注入显式处置要求；只在 `must_fix>0` 或 `not_fully_read` 非空时把 completed 降为 blocked，F 仍只提示；界面 `format.ts:197-202` 对 hints 显示“待核对”，不得写成质量通过。
- 不可安全自动化的部分：普通事实句是否必须引证无法在不做通用 NLP/样本特判的情况下判定，不能把所有读过的材料、所有 F 提示或所有拟议条款强制要求出处。
- 必问门：本次三项必问在首次草稿前已完成，不属于本问题。
- 边界：未运行 Node/Python/测试/HTTP/模型/GUI/SSH；无 Git 写操作；产品/测试/Skill/runtime 未写；既有 dirty 保全。
- 阻碍：普通 Git 状态读取在既有 `dsh` 子模块 gitdir 权限处退出 1，已用忽略子模块只读状态继续，未修权限。
- 过程偏差：有 5 次误向运行器传 `bash`，均在启动阶段拒绝、退出 1、无写入；其余只读命令使用指定 native PowerShell。详见 findings 第 9 节。
- 根部动作：full review findings 后决定是否实现；实现后做有限单测与同一原始模型/同一样本复测，保留严格内部意见引用断言。
- 全局状态：T18 未完成、项目未完成、Packaging `HOLD`。
