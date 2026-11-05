# B-T18 必问问题复核交回

- 工单：`B-T18-required-questions-review-20261028-171903`
- 结论：确认产品当前没有程序化“必问项已回答才可写成果”的闸门；原始
  `FAILED` 成立。存在无需新契约/UI 的最小 DSH 插入面：任务开始取现有 Skill questions，
  `tools/pre-execute` 拦草稿/修改清单，`tools/post-execute` 只记录成功的真实 answer IDs，
  并覆盖 `saveUnfinished` 直写旁路。
- 完整 findings：
  `D:\Lawbeach\lawbench-coord\B-T18-required-questions-findings-20261028-171903.md`
- 运行时调用：0。产品/测试/配置/Skill/Git 写入：0。仅新增本交回与上述 findings
  两份协调目录文件。
- 边界：可证明 required key 均收到非空真实回答；尚不能仅凭 key 证明提问措辞语义完整，
  且该最小闸门不跨进程持久化、不服务端权威。未生成或验证修订版 Word。
- 状态：`PACKAGING_HOLD`；全量 T18、Gate1 与项目完成均不由此件改变。
