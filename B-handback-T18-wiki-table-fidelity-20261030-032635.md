# 案件 wiki 表格日期与类别保真源码交回

## 进度汇报

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已完成两个窄修：表格日期优先读原有主列，空缺时读普通日期列；只有原始摘要确为转账且对方像自然人时才进入人员转账聚合。新增了针对既有虚构样本的纯 helper 测试，并完成两处表达式的全模块逆向哈希校验。 |
| 目标是什么 | 目标是在表格进入模型前，不再丢掉已入选取现和转账行的原有日期，也不再把真实消费说成转账。源码候选已交，离可用还差根线独立运行验证、源码准入和消费端重新绑定。 |
| 在等什么 | 等根线运行新增测试与既有纯引用范围测试，并给出源码准入结论。信号到达后，根线按既定流程单独处理消费端字面重钉；源码未准入前不重试模型。 |
| 卡在哪 | 实现没有卡住。完整 Git 状态查询被共享工作树子目录权限拒绝，按要求没有修权限或锁；源码哈希与 diff 仍可只读核对。 |

## 依据与验证

- 工程证据：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\WikiTableFidelity-20261030-032635\README.md`
- 产品源码：`D:\Lawbeach\lawbench-B\service\lawbench\pipeline\steps\wiki.py`，修改后 SHA-256 `96698902e8e0925376b742074fb7076edb41cf94f7ba83e0682d6c601607ef13`
- 唯一新增测试：`D:\Lawbeach\lawbench-B\service\tests\test_wiki_table_fidelity_20261030_032635.py`，SHA-256 `e46607d3f88bd31f499e41090849355a9dfd508c3c153c98aa761cc1593a0cfb`
- 批准旧源码 SHA-256：`aa1614baf9c2d28939b133f47cb5d3c86ac3f6003ed3c392298421ceb80ca76a`
- 全模块逆向校验：在两处新表达式上逐字还原后，内存结果 SHA-256 精确回到批准旧源码值。
- 旧测试未改：SHA-256 仍为 `de11f80bd12ae2b4c7845647db864c0abe64569526d777029a0bcf6948e86a88`。
- Git diff：源码只增 2 行、删 2 行；没有第三处产品修改。定向状态仅显示源码 M 与新增测试 `??`。

## 未做与降级

作者没有运行新增测试或既有纯引用范围测试，没有跑全量、默认 collect、旧服务、应用、真实模型或真实 pipeline。作者运行 Python/Node 为 0，模型、产品网络、转换器、OCR、原生调用均为 0。

本轮是协调目录文件交回，不是 Git 提交；没有执行任何 Git 写操作，因此没有新 commit SHA。旧 dirty、旧证据、契约、Skill、五份 TXT、消费者和 B346 映射均原样保留。

## 下一步建议

根线审核源码和测试后，只运行新增文件与既有纯引用范围测试；通过后再独立决定新源码哈希准入及 B346 字面重钉。作者在本回件后停止，不再推进验证、重钉或模型重试。

Response ID: B-T18-wiki-table-fidelity-20261030-032635

Response log path: D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\WikiTableFidelity-20261030-032635\README.md
