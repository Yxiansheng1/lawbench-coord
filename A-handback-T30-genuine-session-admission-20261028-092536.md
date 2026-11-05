# A 线交回 T30 真实会话有界准入

状态：`SOURCE_HANDED_BACK / AUTHOR_RUNTIME_ZERO / ROOT_RUN_REQUIRED`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新增有限合成案件登记、真实 JSONL 原字节准入、路由/持久化/父前缀/删除预检消费者，并完成静态审读。 |
| 目标是什么 | 验证一份已验收真实会话能进入私有合成案件的会话存储，并在删除预检前止步。 |
| 在等什么 | 等主编排审计后执行一次 README 命令。收到新报告 `PASS` 或带现场失败信号后，再决定进入 GUI 或回修。 |
| 卡在哪 | 作者运行由执行令禁止；Git 子模块状态读取受权限拒绝，按令未修，均不阻断源码交回。 |

## 依据与验证

- 入口与命令：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\README.md`
- 完整交付说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\交付说明.md`
- 固定清单：`fixed-inputs.json`，32 项，SHA-256
  `3ce2e0193d228d4a8083ad243ebdbf9065f539aef80bd63e969c5c6a7a373c3a`
- 消费者：`admission.mts`，31,617 bytes，SHA-256
  `73a12a0803ffe35bbe371d2487a7e815ed871043d92cf06e838b6cc7d3698a95`
- 案件 helper：`prepare-case.py`，5,548 bytes，SHA-256
  `f47b4750660d72a4cfd493dc0ed080fb72d44821811fd0b4889d185193141392`
- 两个输入日志保持 12,059/16,235 bytes 与原 SHA；源码只读，未产生提交 SHA。

## 未做与降级

- 作者没有执行 Node、Python、tsx、测试、HTTP、模型或 GUI；没有任何已执行
  PASS 结论。
- 未做删除、停会话、release、回收站移动或 U 盘拒绝。
- 未提供固定已编译 GUI 包兼容性结论；当前只交源码准入入口。
- 完整命令、四次 shell 通道偏差、一次 PowerShell 选错和全部写入面已在
  `交付说明.md` 逐项列出。

## 下一步建议

主编排先审完消费者、helper 和清单，再按 README 运行一次。需要的是新的
`run-*/admission-report.json`；该报告 PASS 后再谈 GUI，失败则保留报告并在
真实阻断处处置。

Response ID：平台未暴露  
Response log path：chat reply
