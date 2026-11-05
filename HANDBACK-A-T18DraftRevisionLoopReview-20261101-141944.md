# T18 草稿修订循环源码复核交回

AUTHORED_REVIEW_ONLY / runtime0

## 结论

发现有效的结构性缺口，但没有足够证据把本次 7 次保存的唯一原因归给某一段源码。仅凭本令指定源码，无法安全地实现“同一标题最多两轮修正”的强制契约；建议先由主编排批准口径，再落有界修复。未改产品代码、测试或运行任何程序，Git 全程只读。

## 源码事实

1. `lawbench-B/docs/src/Spec.md` 9.2 规定：返回 A–E、G 类问题或有未读材料时，修正后用同一标题再保存，“最多 2 轮”。据此，首存后允许两次修正、总计最多三次成功保存，是与原文相容的合理解释，但原文没有把计数对象定义成机器硬闸。

2. `lawbench-A/dsh-ext/agent/task-state.ts` 的 `beforeTool` 和 `beforeSameCall` 明确把 `case_save_draft` 排除在工具预算与同调用重复限制之外；`DRAFT_FEEDBACK_NOTICE` 路径由 `noteDraftFeedback`/`takeDraftFeedbackNotice` 控制，`draftFeedbackSent` 保证每个任务只提示一次。第一次保存和收尾代存因此安全，但不存在“首存 + 两次修正”的计数或终止状态。

3. `agent/index.ts` 的 `hasDraftCitationProblems` 只判断 `problems.length > 0`，不区分规范列明的 A–E、G 与仅需律师复核的 F 提示。`executeTool` 每次成功保存都会再次调用 `noteDraftFeedback`，但已提示过的任务不会再发提示，模型仍可从保存结果里看到剩余问题并继续同标题保存。

4. `tests/draft-feedback-recovery.spec.ts` 把“F 提示触发一次反馈、随后多次同标题保存不再提示”写成既有行为；`tests/budget-wrapup.spec.ts` 守住 `case_save_draft` 在最后一次模型调用、工具预算耗尽时仍放行，以及无草稿时程序代存。`lawbench-B/skills/_shared/共用规则.md` 要求处理全部 `citation_check.problems` 后同标题重存，却未写次数。

## 最小修复判断

候选修复应只用结果契约中的结构化字段：把“修正轮”限定为 A–E、G 或未读材料；对同一标题记录成功保存次数，首存后最多计两轮，并在提示中显示剩余轮次。计数属于修正轮状态，不改变 `case_save_draft` 的工具预算豁免，也不影响首次保存和 `saveUnfinished` 应急代存。

不能把“第四次保存一律拒绝”单独当作完整方案：`case_save_draft` 仍豁免重复调用限制，拒绝后模型可继续发起相同调用，最终只能消耗模型调用预算；还可能因不产生最终答复而留下更差结果。要形成硬闸，必须同时批准“达到轮次后如何要求模型交付现稿、未决问题如何披露”的终止策略，不能用自动放弃或质量 PASS 代替。本令未授权该策略，且源码审阅不能证明其不会造成新的死循环。

## 建议的有界 RED 测试

先写三张小测试，均不接模型或服务：

1. 同一标题首存及两次修正后，第四次保存应被确定性拒绝；旧源码会放行，因此可先见 RED。
2. 仅返回 F 提示时，不应开启“修正轮”计数或再次要求改稿；旧源码会开启提示。
3. 工具预算耗尽后首次保存仍成功，到顶无稿时 `saveUnfinished` 仍可代存；守住既有安全边界。

这些测试只能证明闸门计数，不足以证明真实模型一定终止于可见答复；后者需获批硬闸后另做集成验证。
