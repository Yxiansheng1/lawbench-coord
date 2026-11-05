# A 线交回：T18 Wiki 修订复核

状态：完成。结论 **PASS**，A1/A2 均支持关闭。

复核报告：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\WikiAmendmentReview-20261031-200150\review.md`

核验依据：B 当前 `wiki.py` 哈希 `53efe4409f0dc7ac9df4636c563638c30ec2c879fb6e52cfb8532fb483a64529`；旧 RED 结果 exit 1，当前 GREEN exit 0，stdout 为 15 passed；测试哈希 `4b6f42a3f759bc1ca91a51925c31b73da529bc1fc12cff33b028a5673bd20be3` 不变。旧 RED 是修订前预期失败，未将测试失败误作当前结果。

A1：新增追加连同换行、标题、出处和围栏受既有 8000 字 `CHUNK_CHARS` 上限约束，超限抛既有 `OUTPUT_TRUNCATED`，不是静默截断。该结论不延伸为全部案卷输入、既有摘要或内存分配有全局上限。

A2：缓存保留项中表格路径不变；非表格路径从当前原单元补日期，仅在实际变化时调用既有 `_write_material`/`_write`。未见新摘要模型调用或契约、SDK、NLP、预算、提示词改动。

证据边界：只读源码与既有实际结果，未重跑测试；Python 控制流结论不等同真实 OS 原子性、原生网络隔离或模型语义安全证明。

Git：按执行令全程只读，未 add/commit/rebase/stash/reset/clean/checkout/push，亦未暂存。
