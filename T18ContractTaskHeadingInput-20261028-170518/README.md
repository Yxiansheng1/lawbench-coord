# T18 原生合同审查与修订版工作流

状态：`AUTHORED_NOT_RUN`。有限消费者与测试入口已完成源码收尾和静态核对；本轮作者没有运行 Node、Python、编译器、测试、HTTP、模型或 GUI。

## 目标

用一次纯合成请求走通当前生产调用路径：

`Native Session → SessionCommandController → AgentLoop → LegalAgent/CoreClient → 当前 B HTTP → contract-review Skill → 修改清单 → /api/redline`

案件只导入两份固定材料：

| 材料 | 字节 | SHA-256 |
|---|---:|---|
| `采购合同` | 39994 | `16ea49cb8e539ed2d3485673ac9eef76184248a6b75edbf8fd7de3179fd4181a` |
| `采购部内部意见` | 823 | `3c40461cdeebad0c3fda4cda07824e901196a5bcdd149b11edfbdc1ade90e040` |

`_任务说明.md` 只取第一个分隔线前的律师原句，不导入案件。`要点.md` 不进入模型上下文，不向模型注入预期风险、修改或答案。

## 入口

主消费者是 [native-contract-workflow.mts](native-contract-workflow.mts)：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeContractWorkflow-20261028-163202\native-contract-workflow.mts' --credential-stdin
```

凭据只由主编排现有驱动解密后经匿名 stdin 输入。本目录、命令参数、环境变量和报告不保存明文 Key。

有限 B HTTP 入口是 [b-service.py](b-service.py)。它只监听 `127.0.0.1` 随机端口，关闭 lifespan、OCR 启动、Retainer、转发监听和外部 HTTP transport；源码与材料在启动前后均按固定哈希校验。

## 固定身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-workflow.mts` | 103328 | `099a5388d4faa8596335e4b2b9984d757774ae728b2964d96122238af1c7b4c3` |
| `b-service.py` | 30607 | `4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f` |
| `fixed-inputs.json` | 17136 | `63f2da57aedf9165a50e7b356224c37ca4b8918abf3ceb9e4b839ff8773b8e6d` |

消费者内的清单固定 SHA-256 已绑定为 `63f2da57aedf9165a50e7b356224c37ca4b8918abf3ceb9e4b839ff8773b8e6d`。

## 通过条件

消费者只有同时满足下列条件才写 `PASS`：

1. 两份材料经当前 B 导入和解析，原字节、SHA-256 和 mtime 不变，原件区没有任务说明或判分答案。
2. 原生事件包含真实 `Session`、`BrowserSession` UUID R、`turn/start`、`user/message`、模型与工具事件、`assistant/message` 和正常完成的 `turn/end`。
3. `request/header` 来自同一 Session 的权威事件前缀，provider、模型和 `maxTokens` 与当前生产任务一致。
4. 模型实际加载 `contract-review`，两次材料均完整读取，必问项覆盖我方立场、审查目的和关注点，且在首版风险稿前完成。
5. 审查意见与修改清单都来自真实模型工具参数和结果；修改清单至少有一条实际接受的范围外判定，清单六字段与 B 契约一致。
6. 有 `out_of_scope` 时，模型必须在收到该工具结果后重新保存审查意见，并写明每条需人工修改项。
7. redline 只使用本任务、本案件的修改清单；至少应用一条真实接受修改。manual 条目不得重复或越出真实清单，并覆盖全部 `out_of_scope` 条目。
8. 修订版 DOCX 的 `w:ins`、`w:del`、批注数与实际应用条目一致；表格、超链接和外部关系保留；原始 DOCX 的字节、SHA-256 和 mtime 不变。
9. B 服务、Agent、Browser Session、Context、fetch、环境、凭据和 JSONL 均按支持路径关闭或恢复。关闭后重开 JSONL，事件与活跃快照一致。
10. 固定材料、46 项 native 基线、346 项 B source pin、当前编译依赖和有限入口在运行前后保持不变。

任何条件不满足都保留 `FAILED` 报告，不伪造模型回复、工具结果、事件、历史、UUID R 或 Word 修改。

## 产物

实跑时在证据目录下新建唯一 `run-*` 根目录，保留：

- `report.json`：Session、R、任务、网络观察、工具调用、问答、读取范围、审查稿、修改清单、redline、OOXML、持久化和清理结果。
- `case/`：当前 B 导入的合成案件、模型保存的 Markdown 审查稿、修改清单、修订版 DOCX。
- `sessions/`：当前生产 JSONL 会话记录。
- `appdata/logs/service.log`：当前 B 的仅元数据日志。
- `b-service-final.json`：有限入口的拒绝计数、端口关闭和清理结果。

不自动删除 run 根目录。

## 未证明

本轮没有实际运行、编译、语法检查、模型调用、GUI、安装包、业务质量或全 T18 验收。主编排仍需完整审计命令、固定 pin、setup/finally，再用现有保存 Key 驱动匿名 stdin 执行。

静态审读不等于真实模型质量。上一轮独立阅卷质量失败仍单列，不随本合同工作流源码收尾改变。Packaging HOLD，项目未完成。

删减轮：读者 4 / 槽位 2 / 半句 2 / 重复 1 / 过程 1 / 黑名单 0
