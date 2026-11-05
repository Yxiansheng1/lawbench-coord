# A 线交回：T18 Wiki 独立源码复核补报

- 状态：已完成未完成的独立复核报告；结论 **AMEND**。
- 正式报告：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\WikiReviewClose-20261031-194329\review.md`
- 实质问题 A1：缺日期长单元被整段无界追加，随后进入整案 digest 和四篇文章输入，容量风险见 `wiki.py:136-147,151,496-498,579-582`。
- 实质问题 A2：`wiki_update` 对未变材料直接复用旧摘要，新日期保留逻辑不执行，见 `wiki.py:422-435,544-545`。
- 测试缺口：未覆盖 `wiki_update` 回填、超长单元、恶意原文和追加后的 `final_check`。
- 未证事项：Spec/契约正文未在 raw bundle 内；模型语义归属与抗注入不能由源码证明。
- 边界：未改产品代码或测试，未运行 Git、测试、构建、解析器、网络或模型。前序超时 job 的 raw/状态未改动，本件仅补报告。

请 Root 复核本报告；完成后停止。
