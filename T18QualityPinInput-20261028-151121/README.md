# T18 原生阅卷工作流

状态：仅完成源码编写和静态清单核对，尚未运行。作者运行时为 0。

## 目标

用一次纯合成业务请求跑过当前生产调用路径：

`NativeSession → SessionCommandController → AgentLoop → LegalAgent/CoreClient → 当前 B HTTP → case_* 工具`

案件只导入以下五份材料，材料名和来源字节固定：

| 材料 | 来源 |
|---|---|
| 借条 | `D:\Lawbeach\lawbench-B\skills\case-reading-notes\tests\样本01-民间借贷\借条.md` |
| 情况说明 | `D:\Lawbeach\lawbench-B\skills\case-reading-notes\tests\样本01-民间借贷\情况说明.txt` |
| 案情摘要 | `D:\Lawbeach\lawbench-B\skills\case-reading-notes\tests\样本01-民间借贷\案情摘要.md` |
| 还款记录 | `D:\Lawbeach\lawbench-B\skills\case-reading-notes\tests\样本01-民间借贷\还款记录.txt` |
| 银行流水 | `D:\Lawbeach\lawbench-B\skills\case-reading-notes\tests\样本01-民间借贷\银行流水.md` |

`_任务说明.md`、`要点.md` 和其他测试答案不导入案件，也不进入模型上下文。用户提示只包含律师原句、纯合成声明和这五份材料的范围确认。

## 入口

主入口是 [native-reading-workflow.mts](native-reading-workflow.mts)。它只接受：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts' --credential-stdin
```

测试 Key 由 root 现有 DPAPI 驱动解密后通过匿名 stdin 管道输入。命令本身、环境变量、文件、命令行参数和证据不得保存明文 Key。

有限 B HTTP 入口是 [b-service.py](b-service.py)。主消费者生成随机本机 token，经子进程 stdin 传入；该入口只监听 `127.0.0.1` 随机端口，关闭 lifespan、OCR、Retainer、转发监听和外部 HTTP transport。

## 真实交互边界

模型只通过已授权的 `http://10.126.126.1:8000/v1/chat/completions` 做真实推理，模型名 `qwen38-27b`。请求参数、预算和 Skill 均来自当前 B 任务单与 LegalAgent 快照。

若模型调用 `ask_user_question`，消费者只会对同时列明五份材料且不含真实案件、删除、移除或覆盖原件字样的范围确认问题作答。答案固定为：

> 确认本次仅处理以下五份合成材料：借条、情况说明、案情摘要、还款记录、银行流水。全部读完，并保存阅卷笔录 Markdown 草稿。

答案经生产 `user-questions/request` waterfall 返回，绑定模型实际生成的 question id。其他问题不代答。再次提问会走未处理路径并使工作流如实失败，不伪造回答。

## 通过条件

主消费者只有同时满足以下条件才写 `PASS`：

1. 当前 B 导入管线恰好复制五份材料，原件字节和 SHA-256 与清单一致，原件区没有任务说明或答案文件。
2. 实际事件链包含 `turn/start → user/message → tool/call… → assistant/message → turn/end`，`user/message` 携带 BrowserSession 生成的原生 UUID R。
3. 请求头锚点来自同一 Session 的权威前缀，且 provider、模型和 `maxTokens` 与当前任务一致。
4. 实际工具事件包含 `skill`、`ask_user_question`、`case_list_materials`、`case_read_material` 和 `case_save_draft`，`skill.name` 为 `case-reading-notes`。
5. 任务状态为 `completed`，`coverage` 显示五份材料全部读完，`citation_check.passed` 为 true。
6. 最新 Markdown 草稿非空，保留李某乙、王某丙、80,000 元、20,000 元和借款日期，并对五份材料都有内联出处。
7. 每条解析后的出处都经当前 `/api/source` 返回非空原文，`source_changed=false`，原件状态不是缺失或删除。
8. B 服务、DSH AgentLoop、模型请求、HTTP client、日志和 JSONL 均正常停止或关闭；关闭后重新打开 JSONL，事件与原生活跃快照一致。
9. 固定输入、已接受的 46 项 native 基线、346 项当前 B source pin 和本次 A 端依赖在运行前后哈希不变。

任何一步不满足都会留下 `FAILED` report，不补造模型回复、工具调用、请求头、序号、事件或草稿。

## 产物

消费者在证据目录下新建唯一的 `run-*` 根目录，保留：

- `report.json`：Session、R、task、模型 POST 状态、工具调用、读取范围、coverage、引用响应和物理 JSONL 身份。
- `case\`：真实导入后的合成案件、任务结果和模型保存的 Markdown 草稿。
- `sessions\`：生产 JSONL 会话记录。
- `appdata\logs\service.log`：当前 B 的仅元数据日志。
- `b-service-final.json`：有限 B 入口的关闭和拒绝计数。

不自动删除 run 根目录，不枚举或回收业务案件。

## 未证明

本轮没有 GUI、安装包、全 T18 18 个 Skill、真实案卷、业务验收或项目完成度声称。root 仍需人工核对争议与当事人主张、金额和日期可追溯性、阅读覆盖与实际草稿质量。

当前 A 工作区已有大量既存修改和未跟踪证据；本轮只新增本目录，没有执行 Git 写入，没有清理或重写既存 dirty 内容。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 1 / 黑名单 0

## 当前编译源限制（20261028-143631）

本轮消费者不再从默认 `dsh-ext/lib/` 加载扩展模块，改为直接加载已验收私编输出中的两个冻结成品文件。默认 `dsh-ext/lib/agent.js` 和 `host.js` 仍是旧表面，仅作为既有固定行保留，不能代表当前已接受编译源。两条动态 import 使用下列绝对文件和固定字节，不做运行时查找、回退或重新编译：

| 角色 | 路径 | 字节 | SHA-256 |
|---|---|---:|---|
| 当前编译 agent | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112\profile-node_modules\lawbench-dsh\lib\agent.js` | 537563 | `0013b9564720a2c68fe2239a36ebfe6f2e80aee35d8e3ade019384b62091135b` |
| 当前编译 host | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112\profile-node_modules\lawbench-dsh\lib\host.js` | 900805 | `84adeef92360e0ef3faddb1b89e6d56a2c66135e2b07283a180049613bce8164` |
| 当前编译包元数据 | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112\profile-node_modules\lawbench-dsh\package.json` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| 已验收私编清单 | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112\manifest.json` | 58195 | `5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f` |

`fixed-inputs.json` 保留原有 58 条固定行，并追加上述四条当前编译依赖。清单自身的新固定 SHA-256 为 `81f2a55fd881f0ac8f8a53e92c3f3b93b08be0b6aef32c6e68bc077cf296c2b3`。该轮只修正冻结成品的选择，不声称默认编译产物、当前源码全量构建或整个 T18 已通过。
