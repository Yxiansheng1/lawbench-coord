# T18 自然人工原因交回

状态：源码已交回；运行、合流与验收未做。交回时刻：2026-10-28 20:57:29 +08:00。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 将 `assertOutOfScopeReported` 的原因语法扩展为窄范围自然原因与失败状态；在原测试末尾追加最新实际 id 2 及 10 项正反例；更新 README 的必要说明。 |
| 目标是什么 | 让“原文包含超链接，系统无法自动替换”通过风险、段落和单一处理方式绑定，同时其他机器原因继续精确匹配。距离源码运行通过还差 root 执行 34 项观察测试；距离完整 T18 还差三路验证与实际合同工作流重跑，Packaging 保持 HOLD。 |
| 在等什么 | 等 root 按下列身份复核源码并运行有限 34 项测试。测试通过后，由 root 继续累计复核和实际工作流；失败则按具体新例回派，不扩大语法。 |
| 卡在哪 | 源码交付未卡。A 执行权为 0，故未运行 Node、Python、测试、解析器、HTTP 或模型；Git 写入也被禁止，因此没有提交 SHA，这不属于待修交付阻碍。 |

## 依据与验证

- 新实际输入：`D:\Lawbeach\lawbench-coord\T18NaturalManualReasonInput-20261028-205411\actual-editlist-and-result.json`，7 条修改、6 条接受、唯一越界项为 id 2；草稿对应风险 2、第 39 段和唯一人工处理方式。
- 源函数：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts`，第 1621 行函数，第 1693 行原因子句；107381 字节，SHA-256 `7482f47d2d219a3b7d28dacd58de8c190dde6b6b951946ddb9f05724fd727bbb`。
- 源码机械核对：相对输入快照只替换原因子句一行；风险块、段落、id、单一处理方式、人工标记和其他机器原因回退未改。
- 测试源码：同目录 `manual-reason-observer.spec.mts`，12909 字节，SHA-256 `e06e554ab46b792bc5aea1ed93ce20a0b8e3a1ee7763936ef1285d0976910a2a`。
- 原 24 例保全：原测试 9832 字节前缀与新文件逐字节一致；仅在末尾追加 3077 字节。旧测试输出文字和旧用例未改。
- 新增范围：最新实际输入通过、自然原因/失败状态正例，以及错误边界、否定原因、成功状态、无关后缀、错误风险、其他机器原因负例；其他机器原因仍需原文精确匹配。
- README：同目录 `README.md`，11179 字节，SHA-256 `af6da096f06f11db008d163644323edd21c72abf2b161275a20bdbcb03594144`。
- 证据边界：仅做只读文件核对、哈希、字节前缀比较和只读 Git 状态；没有把待 root 运行的测试源码记为通过。
- 冻结状态：原实跑 `run-lppgD7`、原失败报告、DOCX、JSONL、B 入口、固定输入、其他 consumer 部分和协调目录输入件均未改动。
- Git 状态：目标三文件仍为未跟踪状态 `??`；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 未做与降级

- 未运行 Node、Python、TypeScript 解析器或 AST、导入、收集、准备、构建、服务、自测、聚焦测试、全量测试、HTTP、探针、模型、GPU、GUI 或 SSH。
- 未执行实际合同工作流、redline/OOXML、JSONL 重开、清理、watchdog 或全量 T18。
- 未安装、未改 API、未改预算或提示词、未联系其他聊天、未写第二 writer 锁、未改审批或沙箱。
- 偏离交付令：无源码范围偏离。因禁止 Git 写入，交付以本文件和仓库脏文件为凭证，没有提交 SHA。

## 下一步建议

root 先复核上述三个文件身份，再运行 34 项有限观察测试。有限测试自然通过后，才进入累计复核和原授权实际工作流；在完整三路验证前不得把本交回写成 T18 或发布通过。

删减轮：读者 1 / 槽位 0 / 半句 2 / 重复 1 / 过程 0 / 黑名单 0

Response ID：未提供（本地执行）

Response log path：chat reply
