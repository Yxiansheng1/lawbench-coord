# T18 contract-draft 原生链路作者包

## 状态

- 作者态：`AUTHORED_NOT_RUN`。
- 本包不是运行证据，不声称模型已调用、业务质量已通过、Gate 1 已通过或可打包。
- 作者没有运行 Node、Python、测试、构建、HTTP、模型、GUI、Key/DPAPI、环境探测或生产操作。
- 运行成功时终点只能是 `TECHNICAL_PASS_REVIEW_REQUIRED`；合同事实、金额、冲突取舍和文本质量仍由主编排人工复核。

## 输入与复用

| 项 | 固定来源 |
|---|---|
| 冻结原生蓝图 | `native-general-drafting.mts`，`9dc27eb332b0aedfbc520929b80ed88654d260f6aa0f6e24e109f4cf626c3b40` |
| 冻结 B 服务蓝图 | `b-service-general-drafting.py`，`85a16d5ec6729e608ba32834e189d64be9406fed5043687cb9f477a28827fe07` |
| 冻结输入清单蓝图 | `literalfixed-inputs.json`，`c56df90760ec5d80698de3b733d275e1164aca0d02e91a64b0a086bd01e31b17` |
| 私有构建清单 | `cc33c0d99bd18b0850d675da62a0944d7be93c3b9acfddca7106eb8e5c8e2e47` |
| 当前编译 agent/host/package/manifest | `9dd068…`、`ca849d…`、`3d6bca…`、`cc33c0…`，均按冻结清单复用 |
| 已批准原始行 | `approved-sample-and-skill.json`，5 行，1286 bytes |
| 实际 Skill | `D:\Lawbeach\lawbench-B\skills\contract-draft\SKILL.md` |
| 实际任务说明 | 同目录样本下的 `_任务说明.md`，1200 bytes |

实际案件材料只取 `报价单.md`（775 bytes，`516f30…`）和
`询价往来邮件.txt`（712 bytes，`14392e…`）。两份原件在 `CaseRegistry.open`
之前按 bytes 与 mtime 复制进全新私有案件原件区，再由当前 B 文本扫描器解析。
任务说明、Skill 和 `要点.md` 均不进入案件材料；`要点.md` 原路径当前不存在，
但它在唯一种子身份源中仍作为被排除行保留，不作为成功条件。

## 本次有界适配

- Skill、任务名、材料名和材料数改为 `contract-draft` 的两材料场景。
- 模型参数使用 Skill 声明的 `thinking=中`、`window=128K`、`max_tokens=49152`；
  模型调用 32、工具调用 48、任务 45 分钟、请求和流超时 1200000 ms 保持不变。
- Host 当前必问门只覆盖 `contract-review/doc-revise/general-drafting`；本包不扩门。
  运行器从当前主 Skill 目录读取并核对 `our_party/doc_scope/deal_terms` 三个机器 ID，
  同时核对 `fromMaterials` 为 false/false/true。
- 合成回答只针对模型实际请求的已知 ID：`our_party`、`doc_scope`、`deal_terms`。
  额外问题只记录为 `unsupportedQuestionIds`，不补答、不把额外提问判成产品失败。
  三个已知回答必须全部先于第一次成功 `case_save_draft`。
- 两份材料必须由真实 `case_read_material` 全文覆盖并先于最终成功保存；随后所有
  `case_save_draft` 参数与实际落盘正文一致，标题非空但不硬编码期望标题。
- 引用必须 `must_fix=0`、A-E 类为 0，所有实际报告的引用都经当前 `/api/source`
  回读且 `source_changed=false`。引用数和去重数按本次实际结果记录，不借用旧次数。
- JSONL 只使用本次真实创建/写入的文件；关闭和重开事件做深比较，事件数和物理字节数
  均动态读取，不复制旧 header、cwd、消息、历史或旧计数。
- `contextDisposed` 后跳过空注册表清理的既有 accepted guard 保留；B 服务、浏览器、
  Context、环境、网络封锁和密钥脱敏的 finally 清理路径保留。

## 人工复核边界

机器检查只覆盖非空合同正文、真实双方名称和两份材料的引用覆盖。以下内容由主编排
读草稿和原件后人工判断，既不写进提示词作为答案，也不由本包自动判业务通过：

- 300 吨、单价 4200、总价 1260000 及两种规格各 150 吨；
- 交货地点、5 月 10 日和 5 月 20 日分批；
- 报价单不含运费与邮件二供方承担运费的后续变化；
- 付款 60 日对 30 日、质保金 5% 对 3% 尚未谈妥，不得任选其一或补造默认值。

## 作者静态审计

- 已按冻结清单核对本轮编译 agent、host、package 和 manifest 四个路径及摘要；
- 已核对批准 JSON、实际任务、实际 Skill、两份材料及固定 B source-pin 文件身份；
- 已核对 manifest 只含两份材料，任务与 Skill 指向实际 B 路径，不含 `要点.md`；
- 已检查 B 服务只放行本场景 route/tool、监听随机 `127.0.0.1`、lifespan off、
  OCR/retainer/import/ledger/redline/release 和 B 外连关闭；
- 已检查 native 只允许 6000D 固定模型 POST 与本次 loopback API，SSE、
  `redirect:error`、凭据仅内存 stdin、输出脱敏和全 finally 路径保留；
- 已检查最终清单、服务、native 和无密钥文档路径范围，没有修改产品、Host、
  TaskState、SDK、lib、runtime、Skill、test、config 或旧证据。

## 未执行与已知阻碍

- 按本次特别禁区，未执行任何运行、语法解析、类型检查、测试或构建。类型契约和
  副作用由主编排在全量条件允许时验证。
- 普通 `git status` 被 `dsh` 子模块 worktree 权限和超长证据路径拒绝；作者保持
  Git 只读，没有修 ACL、lock、审批或沙箱。既有 dirty 未清理、未暂存、未提交。
- 八次只读检索/查看调用误设了禁止的 bash 启动参数；均在实际命令
  启动前被 launcher 权限拒绝，未执行命令、未改文件。其后均使用指定原生 PowerShell。
- 本目录只有源包和本说明；真正的 `report.json`、服务终态、草稿、JSONL 都由主编排
  在受控运行后产生。

## 作者包摘要

- `native-contract-draft.mts`：106165 bytes，
  `69b6865b676e764adde099767a4eed8c17115e9ccb8cf50fa7708000e9adf0a3`。
- `b-service-contract-draft.py`：45166 bytes，
  `eeae98dd0cd8905b7e8d3272127686ab404033dc5c580b136732e877acd31221`。
- `literalfixed-inputs.json`：10709 bytes，
  `bd99e4b52a98ddb033643b61a379bc2abeb23ebde9a8f8eff3a21b16fd78bfd2`。

## 交回

正式交回件：
`D:\Lawbeach\lawbench-coord\A-handback-T18-contract-draft-native-20261029-042331.md`。
运行器入口为 `native-contract-draft.mts --credential-stdin`。作者到此停止。
