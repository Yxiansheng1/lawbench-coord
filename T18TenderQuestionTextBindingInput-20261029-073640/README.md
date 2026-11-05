# T18 tender-review 原生链路作者包

## 1. 状态

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-tender-observation-contract-order-20261029-072238.md`
- 作者状态：`OBSERVATION_CONTRACT_SOURCE_READY_NOT_RUN`
- 本目录只准备观察契约修正后的 tender-review 原生消费者源码，不运行消费者。
- 这不是 tender-review 实际链路通过、业务质量通过、Gate 1 通过、完整 T18 通过或打包放行。

本包从已接受的 `9d5aeab…` 合同起草消费者和配套有限 B 服务作同生产骨架适配。未新建框架、安装器、SDK、加载器、存储或测试目录。

## 2. 文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-tender-review.mts` | 117885 | `b043c3644723edabc51deebe412769e40ad0603ceb2aec97ed10958d02255732` |
| `b-service-tender-review.py` | 46017 | `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` |
| `literalfixed-inputs.json` | 11289 | `53136c596eb7fbd8ef3815d9a4fa596b480f1d1242b096fcef99bcfc342911be` |

本目录源码路径：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewObservationContract-20261029-072238\native-tender-review.mts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewObservationContract-20261029-072238\b-service-tender-review.py`

冻结适配基线：

| 输入 | 字节 | SHA-256 |
|---|---:|---|
| `T18TenderNativeInput-20261029-070224\native-contract-draft.mts` | 115024 | `9d5aeab699479e3db0c4c951f66fb1c407e28846804da6315ccb3ce18fbaab25` |
| `T18TenderNativeInput-20261029-070224\b-service-contract-draft.py` | 45468 | `2f25915f5cd549ae373d187b8e49f9b8d0f1af7fb81e249c2f46043de723c164` |
| `T18TenderNativeInput-20261029-070224\literalfixed-inputs.json` | 10775 | `f559caac973fbe7c6b797563f9d3a0418c7c97d0c041b01deb1e625280a4c9aa` |

## 3. 六个批准输入

`approved-inputs.json`：2184 字节，SHA-256
`0939aebc1e1d3c611cccb641261809eee6e0c1a3ffc16f27d0aef1c62e001e5d`。
以下六项的字节、SHA-256 和 `mtime_ns` 已用只读 PowerShell 逐项核对一致；消费者和有限 B
服务也各自保留运行期复核。

| 角色 | 实际路径 | 字节 | SHA-256 | `mtime_ns` |
|---|---|---:|---|---|
| Skill | `D:\Lawbeach\lawbench-B\skills\tender-review\SKILL.md` | 13036 | `a7f19dc17bac500bb66e2dc7eb2bfe07653c6165d3c452e40b996649966ccdf6` | `1792400314792388400` |
| 材料 | `D:\Lawbeach\lawbench-B\skills\tender-review\tests\样本01-智慧法院投标\招标文件.txt` | 2646 | `298a4e0def9269d670a17c4455999940ba1b5a53d11021901f3b7b303f4f0a6d` | `1792379578844630200` |
| 材料 | `D:\Lawbeach\lawbench-B\skills\tender-review\tests\样本01-智慧法院投标\补充通知.txt` | 554 | `cd01f666a0122787ce48a122d32de8962fef003a9c3c91f9b89bc898cd4519f7` | `1792379578844630200` |
| 材料 | `D:\Lawbeach\lawbench-B\skills\tender-review\tests\样本01-智慧法院投标\投标人情况.txt` | 1058 | `04976f7bc442a52e07cb4408da65be95bb22e9d9f85607d23bbc1c2757e69411` | `1792379578844630200` |
| 任务说明 | `D:\Lawbeach\lawbench-B\skills\tender-review\tests\样本01-智慧法院投标\_任务说明.md` | 766 | `0f741ddc16d477740673ed9ba9370124baf57a8857d5fc9885877451664fd36d` | `1792379578844630200` |
| 要点 | `D:\Lawbeach\lawbench-B\skills\tender-review\tests\要点.md` | 10509 | `a84387d199f03da4f8bdce84919ec3fb12c78b88a193a4340c7f73fcbf27bc25` | `1792379578846133600` |

任务说明只取首个 `---` 分隔前的公开任务正文。其后的测试说明、要点和其他评分材料不进入
模型、案件材料、请求上下文或工具结果。

## 4. 冻结运行时与源

| 对象 | 字节 | SHA-256 |
|---|---:|---|
| 346 项 B 源 pin 文件 | 53548 | `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97` |
| A `dsh-ext\agent\index.ts` | 46547 | `40ab48b82a3bb8b1ae488daa1ba930924d1b8b292aa70114bf317e9a633d5794` |
| A `dsh-ext\agent\task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |
| B `service\lawbench\checks\citations.py` | 19642 | `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412` |
| 私有 manifest | 58200 | `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14` |
| 编译 agent | 552781 | `f0b3f4c9bdc77c4b6c6de6eb7355c179a23568d7a15a8716a5f45683d7ee1f2f` |
| 编译 host | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| 编译 package | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |

四份编译对象仍从已接受的 `ContractDraftQuestionPrivateBuild-20261029-045644`
私有输出读取，但本次没有导入、加载、重建或运行它们。`literalfixed-inputs.json`
保留同一套依赖、四个编译对象和三个运行时可执行文件身份。

## 5. 最小适配块

消费者相对合同基线有 77 行净增量，主要变化如下：

1. 标识从 `contract-draft` 改为 `tender-review`；任务、报告、服务文件名同步改变。
2. `max_tokens` 从 49152 降为新 Skill 声明的 32768。32 次模型、48 次工具、45 分钟、
   1200000 ms 请求/流超时和 86400000 ms 技术看门狗均未增加。
3. 清单增加 `referenceNotes`，六个批准输入均逐一检查 SHA-256、字节数和 `mtime_ns`；
   要点只做身份核对，不进入模型或案件。
4. 材料由两项改为三项，并硬限定为 `txt`、类型 `txt`、单位 `line`；三项必须全文覆盖。
5. 必问项改为 `side/focus`，来源标志均为 false；只回答实际请求的这两个 ID。未知 ID
   一旦到达回调立即失败。消费者不再用“投标人资格”“合同条款”等字符串谓词判断题目
   措辞是否合格；实际题目文本仍保存在事件记录和题目文本数组中，由根控人工确认其是否
   覆盖原任务已给的本方身份与资格/合同重点，不能把已有信息当成缺项重问。机器不得据此
   宣称题目语义确认通过。语义契约为
   `side = We represent the bidder as stated in the original task.`、
   `focus = Focus on bidder qualification and contract clauses as stated in the original task.`；
   实际回调使用对应中文无新增事实值：“我们代表原任务所述投标人。”和
   “重点审查原任务所述投标人资格和合同条款。”
6. 在首次成功 `case_save_draft` 前必须已取得完整实际回答；无问题、缺问题、晚回答或
   错误回答均直接失败。保存正文必须与模型实际工具参数、落盘文件和结果记录一致。
7. 引用检查以 `must_fix=0` 和 problems 中不存在 A-E 类为双重硬门；F/G 等 `hint`
   不致命，并在报告中保留全部 problems 和 qualityHints。修正前的基线 A-E 条件本就
   排除 F/G，本次把 A-E 缺失谓词恢复为不依赖生产者 severity 映射的独立检查。实际引用
   的三项材料都必须通过 `/api/source` 解析。
8. 输出机器检查只核 Skill 规定的审查意见骨架和三项引用覆盖，不核法律结论或业务答案。
9. B 服务只复制三项真实 TXT；任务、Skill、要点均不进案件。OCR、retainer、导入、
   request-scope release、转发监听和 B 外连继续关闭。

有限 B 服务净增 13 行，只改 Skill/样例路径、批准输入 pin、32768、三项材料与 TXT/line
断言以及相应报告字段；原有有限路由、拒绝型 transport、凭据拒绝、资源关闭和 finally
保持。

## 6. 严格运行期断言

实际消费者保留并要求：

- 真实 `CaseRegistry`、文本扫描器、全新 Native Session UUID、Host、生产 JSONL、
  `SessionCommandController`、`AgentLoop` 和匿名 stdin 凭据路径。
- 真实 `skill` 工具加载 `tender-review`，三项材料在私有案件内、案件外原件身份不变。
- 任务、请求、案件和 Session 绑定一致；provider、model、32768 与 128K 窗口一致。
- `side/focus` 成功回答先于首个成功保存，回调计数、序号、结果摘要和预执行拒绝分开记录；
  实际题目文本写入事件记录和数组，字符串措辞留给根控人工审查，不设机器语义通过门。
- `case_read_material` 的单读和批量返回形状分别核验，保存全部 parts 状态和三项全文覆盖。
- 落盘体与 `case_save_draft` 参数、最终草稿记录逐字节一致；标题按 Skill 保存为
  “招标文件审查意见”。
- 引用 `must_fix=0` 且无 A-E 类问题，全部 hints 被报告；三项材料版本都出现在引用中，并逐项经
  `/api/source` 回读且 `source_changed=false`。
- 关闭并重开 JSONL 后，物理事件与实时 Native Session 深度相等；输入原件在 finally
  后仍保持 SHA-256、字节数和 `mtime_ns`。
- 自有 Agent、BrowserSession、Context、B HTTP 服务和本地资源全部结束，Key 清空，
  fetch/环境恢复，无外连拒绝、无 credential getter 命中。

## 7. 实际链路预期但仍未运行

主编排仍须在完整源码、依赖、类型、setup/finally 和逐字节反向审阅后，另行决定并执行：

1. 全文审阅本消费者、配套 B 服务、六个输入、全部 dependencies、四个编译对象和三个
   运行时可执行文件；对三份新源码作最小差分与整文件反向核对，确认六个批准输入的
   SHA-256、字节数和 `mtime_ns` 未变。
2. 在既有完整授权环境完成词法/类型、变量绑定、setup/finally 静态反例检查，再作有限
   admission 和 ESM 导入准入；不得重跑或新建 private25。
3. 仅准入通过后，才用现有专用凭据的匿名 stdin、既有保存 DPAPI 路径运行一次本命令；
   消费实际 questions、saves、source GET、citations/hints、JSONL 重开和 OS 关闭结果。

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' `
  'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewObservationContract-20261029-072238\native-tender-review.mts' `
  --credential-stdin
```

该命令只是根控实际运行入口说明，本次没有执行。实际运行还需按既有专用授权方式从匿名
stdin 提供凭据；不得由作者读取凭据管理器或环境。

本次未执行：Node、Python、TypeScript 解析/类型检查、import、测试、构建、准备脚本、
HTTP、模型、GUI、SSH、DPAPI、Key/环境读取、进程探测或安装。

## 8. 根控人工审查清单

以下事实只供根控在真实运行后人工对照，未写入提示词、未作为工具假响应、未作为机器通过
条件，也不构成法律意见：

- 投标截止时间：原招标文件 2026-10-20 09:30，补充通知改为 2026-10-27 09:30。
- 金额：预算 380 万元，最高限价 3,750,000 元。
- 四条★要求：有效期 90 日、保证金 5 万元、工期 180 日、质保不少于三年。
- 资质证书有效期至 2026-10-15，早于新截止日。
- 拟组联合体，但招标文件明确不接受联合体。
- 付款 30%/40%/25%/5%；逾期违约金每日合同总价千分之二。

根控仍需人工判断草稿是否完整摘录、是否处理补充通知优先关系、是否如实保留识别不清与
未提供材料、是否标“法律依据待律师核实”，并独立复核实际题目措辞、全部引用行号和
输出质量。题目语义确认是 `ROOTMANUAL`，没有机器 PASS。

## 9. 未执行与阻碍

- 作者的产品运行期计数全为 0：consumer 0、Agent 0、Session 0、Context 0、Task 0、
  Case 0、model request 0、HTTP request 0。Counter 0 只描述产品运行期，不是 CLI
  子进程或脚手架遥测；本轮没有启动 Node/Python/解析器/导入/测试/构建。
- 普通 `git status` 仍被共享 worktree 中 `dsh` 子模块外部 `.git` 路径权限拒绝；没有修
  ACL、锁或审批。带 `--ignore-submodules=all` 的只读状态可正常完成，并只显示本目录为
  untracked。
- 本次没有 Git 写入，没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 作者过程中有 6 次非 PowerShell 选择器请求在启动前被运行器拒绝，命令未执行、文件未
  变化；另有少量只读核对命令误用了短名 `pwsh` 而非绝对路径，未产生写入。其余按令使用
  指定 native PowerShell。
- 当前只有作者包，不能据此宣称 tender-review 实际链路、Gate 1、完整 T18、业务或打包
  通过。
