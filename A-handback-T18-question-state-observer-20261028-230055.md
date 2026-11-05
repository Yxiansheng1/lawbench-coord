# T18 问题状态观察器交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 落定三处有界源码修正和新独立测试；真实 70、59、95 行回放均通过。 |
| 目标是什么 | 保留唯一真实回答、完整三 ID 和答案、成功持久化及严格答前草稿顺序，同时去掉失败尝试文案造成的误拒。 |
| 在等什么 | 等 ORCH 复核。收到接受信号后，由根任务决定是否进入其全量验证和真实合同复跑。 |
| 卡在哪 | 实现与测试未卡。Git 只读状态在子模块 `dsh` 被权限拒绝；本运行器禁止 Git 写入，所以无提交 SHA。 |

## 交付

- 修改后消费者：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts`
- 新测试：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\question-state-observer.spec.mts`
- 测试日志：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\question-state-observer.txt`
- 交付说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\问题状态观察器-交付说明-20261028-230055.md`
- 提交 SHA：无。Git 写入不在本运行器授权内。

## 验证

`PASS question-state-observer: immutable actual 70-, 59-, and 95-row replays; 7 positive order/result cases; 3 callback header assertions; 18 negative controls; retired 1 artificial unknown-error-ask negative`

旧 830a 测试未改、未跑，哈希保持 `830af8c618b5da7632135c475d16d4cdc57fcb17ed18bf0a20c6a589759de885`。未运行运行时、模型、HTTP、Python、全量、构建、打包、redline、DOCX、JSONL 重开或 GUI。

整张 T18 尚未过门，Packaging 保持 HOLD。

执行偏差：收尾文本扫描的一次 shell 参数误写为 `bash`，运行器返回 `ACCESS_DENIED`，该命令没有执行；随后命令均使用指定的 native PowerShell。

删减轮：读者 1 / 槽位 1 / 半句 2 / 重复 2 / 过程 1 / 黑名单 0

Response ID: chat reply
Response log path: D:\Lawbeach\lawbench-coord\A-handback-T18-question-state-observer-20261028-230055.md
