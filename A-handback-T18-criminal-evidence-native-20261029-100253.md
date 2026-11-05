# A 线交回：T18 criminal-evidence-review 原生链路

## 1. 目标与结论

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-criminal-evidence-native-order-20261029-100253.md`
- 作者状态：`CRIMINAL_EVIDENCE_SOURCE_READY_FINITE_NOT_RUN`
- Gate 1：`INCOMPLETE`
- 打包：`HOLD`
- 本轮结论：按令完成新 Skill 的有界源码适配、五材料固定清单、README 和本交回件；
  没有执行 finite/model/HTTP、解析器、测试或构建。

这不是实际链路通过、业务质量通过、法律意见通过、完整 T18 通过或发版放行。旧
`criminal-reading-notes` 的 13 次 HTTP 200 与人工复核失败都保持原状；本轮没有把旧答案、
旧 prompt 或旧运行结果转成本 Skill 证据。

## 2. 交付文件

目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalEvidenceNative-20261029-100253`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-criminal-evidence.mts` | 120949 | `2bb831f0a878ecf3c030c39713393aae410229b31205bc1ac0ca28fb2ec2f7db` |
| `b-service-criminal-evidence.py` | 48426 | `19c160b3eabb9210b07557b555dc2bc6d00bb5f95c78fc8c3620056c9a2f3aa9` |
| `literalfixed-inputs.json` | 12223 | `8f785183d000ed08a5e77786d5872195b4c2b71d9dbaa3baf8f493bc01bdca40` |
| `README.md` | 10446 | `5160aade987d2db4dc9cd7395975bf109f91a45d055bc61327450ee52018ed33` |

本文件另存于 `D:\Lawbeach\lawbench-coord\`。由于 Git 写操作被本轮明确禁止，没有提交 SHA；
没有暂存、提交、rebase、reset、clean、checkout 或 push。

## 3. 输入与场景

八项批准输入来自：

`D:\Lawbeach\lawbench-coord\T18CriminalEvidenceNativeInput-20261029-100253\approved-inputs.json`

- 文件 3298 字节，SHA-256
  `782daed01cc78593fc747583362fc77674e8677d8a2345dfb68ef31184e2502b`。
- Skill：`D:\Lawbeach\lawbench-B\skills\criminal-evidence-review\SKILL.md`，13276 字节，
  `4405955c130cb7f9ea58c997965f41a62b6d7efcdafbb258d57fbd4028d906d2`。
- 五份材料均来自 `...\tests\样本03-李某乙盗窃无笔录\`，逐项字节、SHA-256、`mtime_ns`
  已写入固定清单。
- 公开任务只取第一个 `---` 前正文；`要点.md` 只作固定身份核对，不进入模型、材料、
  L0 或 L1。

实际参数改为 Skill 声明的 `thinking=高`、`window=128K`、`max_tokens=32768`。32 次模型、
48 次工具、45 分钟、1200000 ms 请求/流超时和 86400000 ms 技术看门狗不变。

## 4. 有界修改

消费者保留旧冻结运行骨架，只做场景适配：

1. 五份合成 Markdown 复制进全新刑事私有案；真实 `CaseRegistry`、生产文本扫描器、
   Native Session、Host request scope、LegalAgent、AgentLoop 和生产 JSONL 均沿用。
2. 任务输入 `inputs=[]`，没有 prior/L1、合并稿、全案回退或假历史；任何
   `case_read_input` 调用直接失败。
3. 必须先实际加载 `criminal-evidence-review`，再允许实际 `stance` 提问；只接受
   `stance`，未知 ID 失败。
4. 合成律师只在真实回调后返回授权 JSON 的精确文本：

   `我方立场确认：被害人王某丙的诉讼代理方；按该立场审查这五份材料。`

   授权 JSON 为 214 字节，
   `9b0241543323f4eec6fd768a4b2924820d8a383fd702e88968751909041ac6a2`。
   它不是人工回复或业务确认。
5. 实际回答必须早于所有读取/检索和首次成功保存；成功材料清单必须早于所有读取/检索，
   但不额外要求早于提问。清单必须恰好返回五个批准材料名。
6. 五份材料必须全文读取；标题必须精确为 `证据审查意见`；机器只查
   `### 问题 `、`矛盾对照`、`证据链缺口`、`自检结果` 四类模板结构。
7. 至少一条事实引用必须回到五个当前材料版本，所有引用都必须属于这五个版本；不要求每份
   材料都被引用。既有 `/api/source`、`source_changed=false`、A-E 缺席、`must_fix=0`
   和 F/G hints 保留合同不变。
8. `case_suggest_wiki` 仍为既有可选工具；实际成功调用单独记录，但
   `validatedLawyerFacts=false`、`lawyerConfirmedCard=false`。

B 服务只改场景路径、八项输入、五材料计数/身份、参数和报告文字。真实刑事模板后的三个精确
空目录守卫、默认初次复制严格检查、路由白名单、外连/凭据拒绝、lifespan/OCR/retainer
关闭、随机 owned loopback、fetch/finally、Agent/Browser/Context 清理、JSONL 重开相等
和 source GET 均未放宽。未新增路由、store、loader、SDK、transport 或假 wiki。

## 5. 冻结与保全

- reviewed B source pins：346 项、53548 字节、
  `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`。
- A `dsh-ext/agent/index.ts`：`40ab48b82a3bb8b1ae488daa1ba930924d1b8b292aa70114bf317e9a633d5794`。
- A `dsh-ext/agent/task-state.ts`：`fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b`。
- B `service/lawbench/checks/citations.py`：
  `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412`。
- 冻结旧包三文件保持 `2401…` / `d216…` / `0afd…`，未改。
- private 输出目录仍为 25 个文件：manifest `712f…c14` 加 24 个输出。
- 清单其余 25 项依赖、4 个 private compiler objects、3 个运行时可执行文件、459 项 raw、
  legacy 产物和旧运行结果未重建或改写；唯一替换的是末尾 Skill 依赖行。

本轮 admission 未运行。主编排须按当前保留集合重算并核对
`459 + 45 + 8 + 1 = 513`；该算术不是 admission 实测。

## 6. 验证与未运行

作者只做只读文件盘点和静态源码差分：

- 完整读取执行令、Skill、公开任务、五份材料与人工要点；
- 核对八项批准输入现有哈希与固定清单；
- 核对旧三文件、346 pins、A/B 关键对象和 private25 计数；
- 对 MTS、B 服务、清单做逐行差分，确认没有旧场景残留；
- `git diff --no-index --check` 未报 whitespace error；退出码 1 仅表示预期差分。

所有作者执行次数为 0：Node、Python、TypeScript、ESM 导入、解析器/AST、check、test、
build、HTTP、真实模型、GUI、SSH、Env/Key、DPAPI、root driver、process probe。

本轮未运行：

- `finite model: NOT_RUN`
- `raw/source admission: NOT_RUN`
- `B outbound/getter: NOT_RUN`
- `production JSONL reopen: NOT_RUN`
- `types/ESM/test/build: NOT_RUN`
- `reparse negative: NOT_RUN`（沿用既有未运行限制）

## 7. 实际非零与阻碍

- 初始完整 `git status --short --branch` 因 `modules/dsh` 子模块目录权限拒绝而退出 1；
  随后只用 `--ignore-submodules=all` 做只读状态盘点，没有修权限、锁、ACL 或审批。
- 一次错误路径的 `Get-FileHash` 只读了不存在的 B 路径并退出 1；后用正确路径复核。
- 若干只读工具调用误选 bash；运行器在启动前以 `Bash/E_ACCESS_DENIED` 拒绝，没有执行
  bash 或写文件。后续均使用执行令指定的原生 PowerShell。
- 一次只读 `rg` 参数组合被 PowerShell 误解析，输出被截断；没有写文件。

这些均未改变工作树，也没有触发 setup、legacy、权限扩张或 writer 锁处理。

## 8. 人工复核边界

主编排必须读取实际 `question` 原文，确认它展示了任务已给的我方立场，而不是默认辩护方
或无依据的新问题。消费者只保留真实题目文本、哈希和时序，不用关键词/正则推断语义。

主编排还须人工核对：问题与原件关联、原 `要点.md` 的落实、`3,6■0` 和 `02:■3` 等识别
不清字符未补全、法律影响均写“法律依据待律师核实”、未写“应当排除/证据无效”、
未把一方说法写成事实、被害人代理方建议未误写成辩护方案。机器结构通过不等于业务通过。

完整模型命令与写作边界见证据目录 README 第 7、8 节。作者到此停止。
