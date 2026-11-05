# T18 合同审查条号质量审计发现

## 结论

原真实合同审查任务的技术交付仍然成立：真实模型调用、必需问题答复、材料阅读、草稿持久化、原生会话回放和直接 Word 修订导出都有既有实际证据。业务文章质量没有通过，风险 3 把合同第 4.1 条误写为“合同第七条”，原文核对结果仍显示通过。

本轮没有找到可以按本令直接落地的安全源码硬检查。现有核对器的通过只表示数值、日期、引语和出处结构没有必须修改项，不表示整段文章的法条、条款号和结论正确。这个错误属于当前设计明确没有覆盖的文章准确性问题，不能据此指控源码违反既有契约。

本轮的工程判断是：

1. 不新增“第七条对第四条”这一类通用硬门。
2. 不把文章条号塞进 E 类，也不增加新问题类、新存储或解析框架。
3. 不修改草稿、答案、源码、测试、Skill 或冻结 pin。
4. 由主编排决定是否让真实用户在原会话发起一次“出稿前复核 -> 按意见修改”的新任务；这条路线可以保留原任务和原报告，但结果属于模型与律师质量流程，不是工程硬门已经证明未来不再出错。

## 冻结状态核对

| 对象 | 核对值 | 结果 |
|---|---|---|
| B 工作树 HEAD | `dc56a93be4b07dbe7a48863e3135351659817fb5` | 只读读取成功 |
| B source pins 清单 | 346 项、53,548 字节、SHA-256 `2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379` | 清单身份匹配 |
| 346 项 pin 逐项比对 | 路径、字节、SHA-256 | `Mismatches=0` |
| 保存实现 `service/lawbench/tools/drafts.py` | SHA-256 `e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822` | 输入快照与当前树一致 |
| 核对实现 `service/lawbench/checks/citations.py` | SHA-256 `67779ba41e35e2b6780a7b74ebe061e143a79dd5b8c97273329ae91059748758` | 输入快照与当前树一致 |
| 解析实现 `service/lawbench/checks/parse.py` | SHA-256 `3fd25b61a965abe5432b8d301448517dea003d77739f45a0331bbbf07fa123bc` | 输入快照与当前树一致 |
| 合同审查 Skill | SHA-256 `339e3f09001421424c319ef17d9082084b54e6b6d90938afff92a3c7b33575c9` | 输入快照与当前树一致 |
| 实际草稿 | 9,170 字节、SHA-256 `1b095356f48c4a7ae9e94bd171c92377385d70ff3730c59fcb50f26822cba31d` | 输入副本与来源任务 v2 一致 |

执行令中的草稿哈希写成了 `SHA1b095...`，该串比完整值少了首个 `1`。完整身份是 SHA-256 `1b095...`；输入副本和来源 `合同审查意见-v2.md` 实测完全相同。

普通 `git status --short --branch` 因读取
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 被拒而没有完成。改用
`git status --short --branch --ignore-submodules=all` 成功读到：

- 分支为 `line-B`，相对 `origin/line-B` 为 ahead 141、behind 1。
- 工作树原本已有大量修改和未跟踪文件。
- 没有修复权限、不动 writer 锁、不暂存、不提交，现有 dirty 原样保留。

## 实际错误

真实任务的来源任务目录：

`D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/run-fQoiXe/case/工作区/任务/T-20261028234100-6b49/`

实际会话：

`session-1cb28369-3a90-46dc-b047-e64986038394`

实际任务：

`T-20261028234100-6b49`

实际请求：

`60fda87b-25a9-40c1-9abd-1e4893fa7b8b`

实际问题的三项回答在 `report.json` 中记为 `our_party`、`purpose`、`focus`：

- 我方是甲方青禾建材，即采购方。
- 目的是签约前把关，并需要生成修订版。
- 重点是交付与分批到货、验收安排、质量保证金留存、逾期解除，允许直接修改条款。

风险 3 的实际错误位于草稿第 43-44 行：

- 原文引语是“4.1 甲方应于到货后七日内完成验收……”〔采购合同 第23段〕。
- 下一句却写“若按合同第七条执行，甲方在七日内无法完成检测……”。
- 合同材料第 23 段确为 `4.1` 验收条款。
- 合同材料第 33 段才是“第七条　不可抗力”。

所以这是用户可读文章中的明确条款号错误，不是法律观点分歧，也不需要判断合同实体利弊。

原任务结果 `result.json` 同时记录：

- 任务状态为 `completed`。
- 草稿 v1、v2 都在原任务目录。
- `citation_check.passed=true`。
- 统计为 `citations=20`、`must_fix=0`、`hints=11`。
- 11 条提示都是 F 类“含金额或日期但没有出处”，没有条号引用问题。

原始真实运行报告 `report.json` 仍为 `FAILED`，错误是 out-of-scope edit 5 没有写明实际原因；根技术证据记录原报告不可改写、业务质量仍失败。原报告、原任务、原草稿和原答案都保持原样。

根技术证据：

`C:/Users/morel/Documents/Codex/2026-10-21/deepseek-codex-gpt-advisor-reviewer/outputs/T18-genuine-continuations-root-accepted-current.json`

其记录包括：

- 原始模型调用 10 次，HTTP 200 为 10 次。
- 必需 3 个问题有真实回答，材料内部事实引用通过。
- 人工观察者现已根聚焦通过。
- 真实生产会话 JSONL 59 个事件，两次深比较一致。
- 直接生产者 Exporter 应用 5 条、手工 1 条。
- DOCX XML 为 5 个插入、5 个删除、5 个批注。
- 商业质量 `business_quality_PASS=false`，文章错误仍开放。
- 完整 T18 和整个项目仍未通过，Packaging 为 `HOLD`。

## 为什么结构核对会通过

### 数值抽取

`checks/citations.py` 的 `extract()` 只把阿拉伯数字作为普通数值：

- 有 `万`、`亿`、`%` 单位的数字参与比较。
- 没有单位、没有小数点且少于 4 位的整数被跳过，注释明确把页码、段号、人数列为不查对象。
- 中文数字没有通用文章条号抽取。

因此“第七条”不会进入日期或数值集合，“4.1”和“第七条”的差异根本不会形成 A/B/C 问题。

### 段落归属

`_segments()` 按显式〔材料名 位置〕切分。风险 3 第 44 行先有〔采购部内部意见 第7行〕，后半句“若按合同第七条执行……”被切为没有出处的尾段。

即使把“第七条”机械解析成数字，后半句也没有挂到〔采购合同 第23段〕，无法证明它和前面的 4.1 引语必须使用同一合同条号。

### 通过值

`check_text()` 只把 `must_fix=0` 写成 `passed=true`。F、G 类提示不改变通过值。

界面 `ui/format.ts` 的 `citationSummary()` 实际写的是“没有必须修改的问题（核对了 N 处出处，另有 N 条提示）”，它没有宣称全文事实已核验。Spec 9.4 也明确写明：这套核对只能证明数字、日期、引语在所指位置原样存在，不能证明该页支持整句话的结论。

因此，“`passed=true` 但第七条错误”是当前已声明范围与业务文章质量的差异，不是数值/出处结构核对发生了自相矛盾。

## 源码级修复的安全判断

本令要求的安全谓词必须同时排除：

- 有意引用其他条款；
- 建议新增条款时的新条号；
- 引号内被引用的旧条号；
-〔推断〕〔未找到依据〕段落；
- 引用其他文档的条号；
- “若按第七条处理”但真正要讨论的是第七条后果的情形；
- 不同合同模板、跨行、表格、范围条号和中文/阿拉伯数字混写。

现有源码没有提供“这个条号必须等于所引原文条号”的事实字段，也没有合同条目的结构化权威映射。唯一能抓住本案的办法，是把“风险块里的原文条号”和“后文普通叙述条号”视为必须一致；这一假设会把合理交叉引用和新条号建议误判为错误。

可行的粗糙谓词会像下面这样：

1. 只在合同审查、同一风险块内；
2. 找“原文：X…〔同一材料 第N段〕”；
3. 找后文未加引号的“合同第Y条”；
4. 在 X 和 Y 不同时报错。

这仍然不是安全谓词。它无法区分“4.1 是现在的问题，第七条是另一个有意引用的制度”，也无法区分“建议新增第七条”。为了抓住本案而放行所有这类例外，最后只剩硬编码这条草稿的内容，不能成为产品规则。

因此本轮不给出可实施 predicate。也不建议：

- 把条号错误塞进 E 类，因为 E 类定义是出处格式错误；
- 新增 H 类或新结果文件，因为本令不允许新类和新存储；
- 对所有 Skill 加保存硬门，因为会把合同、建议稿、分析稿的合法交叉引用一起拒绝；
- 把中文条号一律补入 A/B/C，因为那会把范围从“数值、日期、引语”扩大到“整篇法律语义”，超出 Spec 9.4。

如果主编排以后仍要工程化，至少需要另行提供有权机关认可的条号结构、合同条目映射、硬失败契约和覆盖正反例的 fixture 集；本令范围内没有这些输入，不能从当前 346 个冻结源码中安全推导。

## 现有真实用户修订入口

### 推荐路线：原会话新用户要求，新任务复核，再新任务修改

现有桌面界面在每轮草稿卡片下有两个入口：

- “选作下一步输入”
- “确认保存…”

界面源码：

`D:/Lawbeach/lawbench-B/dsh-ext/ui/result-cards.tsx`

原稿卡片的“选作下一步输入”会把草稿路径放进当前会话选择；之后律师在同一个原生会话输入新要求。新的用户消息会产生新的请求编号 R，`/core/task/begin` 按当前选择新建执行任务，原任务目录和原报告不改。

入口契约：

- `contracts/api/task_create.schema.json`：同一会话保留当前入口、Skill、输入和参数选择，之后每条消息执行时复制成新任务。
- `contracts/api/task_current.schema.json`：界面每次从服务读取当前选择。
- `contracts/core/task_begin.schema.json`：每轮第一步按当前选择新建执行任务；带 request_id 时原子固定该 R 的材料范围。
- `service/lawbench/case/task.py`：`begin()` 生成新任务；`next_draft_version()` 在同一案件内按标题接续版本号，原稿不被覆盖。
- `dsh-ext/agent/index.ts`：一轮第一步调用 `task/begin`，任务结束调用 `task/end`。

具体生产操作：

1. 在原会话点原草稿卡片的“选作下一步输入”。
2. 真实用户发一条新消息，要求用“出稿前审查”复核这份合同审查意见，重点回读合同原件，核对风险 3 的“合同第七条”和所引 4.1 验收条款，只出问题清单，不改原稿。
3. `skills/pre-issue-check/SKILL.md` 生成“出稿前审查-合同审查意见”，这是新任务、新 R、新草稿和新的真实用户原文，不是伪造历史。
4. 主编排或律师再发起一条新消息，把原草稿和审查问题清单一并选作输入，要求只改风险 3 的错误条号并保存修改稿。
5. `skills/doc-revise/SKILL.md` 只改指定位置，保存“合同审查意见-修改稿”；原稿不受影响。

这条路线的证据身份应是后续真实出现的：

- 原会话 `session-1cb28369-3a90-46dc-b047-e64986038394` 中的新 `user/message`；
- 新任务 `T-*`；
- 新 request_id R；
- 新 `task.json`、`result.json`、`reads.json`；
- 新“出稿前审查”草稿和新修改稿。

现在没有发生这条真实用户修订，不能把拟议步骤写成已经完成，也不能创建没有用户消息的假会话、假答案或假 R。

### 不建议用界面文稿编辑接口代替

`POST /api/documents/save` 和 `service/lawbench/case/documents.py` 会从已结束的来源任务定位草稿，然后用 `tools.drafts._save_locked()` 写新版本。它能保留旧草稿文件，但会更新来源任务自己的 `result.json`，不会产生“新用户消息 -> 新任务 -> 新 request_id”的完整真实修订证据链。

本令要求原报告不变且新修订身份真实，因此不宜用这个接口代替真实聊天修订。

## 证据边界

现有证据能证明：

- 真实模型曾完成一次合同审查任务。
- 草稿确实按真实任务版本保存。
- 数值、日期、引语和显式出处结构通过现有限定核对。
- Word 修订导出本身工作。
- 风险 3 的条款号确实写错。

现有证据不能证明：

- `passed=true` 等于全文条号、结论和业务质量正确。
- correction 已经发生。
- 未来模型会自动改正同类错误。
- T18 已完成、项目可发版或可打包。

## 给主编排的决策题

主编排应选择其中一个下一消费者：

1. **推荐：走真实用户质量返修。** 在同一合成会话选择原 v2 草稿，先做 `pre-issue-check`，再按问题清单做 `doc-revise`；完成后提交新的真实会话、任务、R、reads、草稿和人工判读。它保留原报告，也不能被说成工程代码已解决此类问题。
2. **接受当前质量限制并留作 T18 业务未通过。** 不改源码，不把结构核对“通过”解释成商业正确；继续等待后续质量返修或产品规则决定。
3. **另立有权工程任务。** 只有在有权威条号映射、硬失败契约、正反例 fixture 和明确允许扩大 Spec 9.4 范围时，才讨论源码修复。

不是“只能靠人”。第 1 项可以在现有产品界面由真实用户继续；但这一步会产生模型调用和新的业务判断，必须由主编排明确启动，不能由本只读审计运行器自行模拟。

## 本轮执行边界

执行器为现有 B 冷启动运行器，模型标识为 `deepseek-v4.1-flash-1017/max`，工作目录为 `D:/Lawbeach/lawbench-B`，所有 shell 调用指定 native PowerShell 且 `login=false`。第一个 shell 工具只完整读取正式执行令，没有提前读取源码或运行产品。

截至文件落盘共调用 shell 51 次：44 次退出码 0，7 次非零。

非零明细：

1. 普通 `git status` 因 `dsh` 子模块目录权限被拒，退出码 1。
2. 一次 PowerShell 哈希比较脚本因写法错误被解析器拒绝，未写文件。
3. 5 次工具调用误把 shell 参数设为 `bash`，运行器在启动前拒绝；没有执行 bash，也没有读文件或改变状态。

其中第 3 项是运行器参数错误，已改用指定 native PowerShell 完成余下读取。上述 7 次均未产生产品、测试、Skill、Git 或权限写入。

没有 Node、Python、解析器、AST、import、测试、构建、HTTP、模型、GUI、SSH、Key、DPAPI、环境或凭据运行时。没有执行 Git add、commit、rebase、stash、reset、clean、checkout、push。没有修改沙箱、审批、ACL 或 writer 锁。

模型调用为新任务 0 次。没有更换 API、模型或设置。原真实任务记录的生成上限为 32768 token；本审计没有向该模型发送请求。

写面孔只新增本文件和正式交回件：

- `D:/Lawbeach/lawbench-coord/B-T18-article-quality-findings-20261029-001733.md`
- `D:/Lawbeach/lawbench-coord/B-handback-T18-article-quality-audit-20261029-001733.md`

## 关键依据

- 执行令：
  `D:/Lawbeach/lawbench-coord/B-T18-article-quality-audit-order-20261029-001733.md`
- 实际草稿副本：
  `D:/Lawbeach/lawbench-coord/T18ArticleQualityAuditInput-20261029-001733/actual-final-draft.md`
- 实际输入与来源身份：
  `D:/Lawbeach/lawbench-coord/T18ArticleQualityAuditInput-20261029-001733/genuine-inputs.json`
- 原真实任务：
  `D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/run-fQoiXe/case/工作区/任务/T-20261028234100-6b49/task.json`
- 原任务结果：
  `D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/run-fQoiXe/case/工作区/任务/T-20261028234100-6b49/result.json`
- 原真实会话：
  `D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/run-fQoiXe/sessions/--D-Lawbeach-lawbench-A-docs-plan-evidence-T18-QuestionGateContractWorkflow-20261028-191702-run-fQoiXe-case--/session-1cb28369-3a90-46dc-b047-e64986038394/session.v4.jsonl`
- 原真实运行报告：
  `D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGateContractWorkflow-20261028-191702/run-fQoiXe/report.json`
- 根技术接受证据：
  `C:/Users/morel/Documents/Codex/2026-10-21/deepseek-codex-gpt-advisor-reviewer/outputs/T18-genuine-continuations-root-accepted-current.json`
- Spec 9.4：
  `D:/Lawbeach/lawbench-B/docs/src/Spec.md`
- 现有核对器：
  `D:/Lawbeach/lawbench-B/service/lawbench/checks/citations.py`
- 现有出处解析器：
  `D:/Lawbeach/lawbench-B/service/lawbench/checks/parse.py`
- 现有保存实现：
  `D:/Lawbeach/lawbench-B/service/lawbench/tools/drafts.py`
- 合同审查 Skill：
  `D:/Lawbeach/lawbench-B/skills/contract-review/SKILL.md`
- 出稿前审查 Skill：
  `D:/Lawbeach/lawbench-B/skills/pre-issue-check/SKILL.md`
- 修改稿 Skill：
  `D:/Lawbeach/lawbench-B/skills/doc-revise/SKILL.md`
- 草稿卡片与“选作下一步输入”：
  `D:/Lawbeach/lawbench-B/dsh-ext/ui/result-cards.tsx`
- 核对结果界面文字：
  `D:/Lawbeach/lawbench-B/dsh-ext/ui/format.ts`
- 每轮任务绑定：
  `D:/Lawbeach/lawbench-B/dsh-ext/agent/index.ts`
  `D:/Lawbeach/lawbench-B/service/lawbench/case/task.py`
  `D:/Lawbeach/lawbench-B/contracts/core/task_begin.schema.json`
