# B-T18 刑事申请输出规则专项审计

日期：2026-10-29  
执行角色：独立 B 线 DeepSeek 执行者  
结论：实际失败成立；已完成一个有界修复。`case_save_draft` 和界面
`save_document_ui` 共用的保存入口，现在会在“任务明确使用
`criminal-applications`、材料不是全部不可读、正文缺少固定说明
`法律依据待律师核实`”时返回一条既有契约格式的 G 类 `must_fix` 问题。
草稿仍然保存，模型可按同一标题再存新版；没有改契约、接口、存储、UI、
提示词或运行器。

这不是法律结论正确性检查。直接检查的对象只是一个固定字符串是否存在；
通过也不证明事实、证据、申请理由或法律适用成立。

## 1. 执行边界与状态保全

- 唯一任务入口：
  `D:\Lawbeach\lawbench-coord\B-T18-criminal-application-output-rule-audit-order-20261029-153305.md`
- 原始证据副本：
  `D:\Lawbeach\lawbench-coord\T18CriminalApplicationOutputRuleAuditInput-20261029-153305\`
- B 线当前 HEAD（只读查询）：
  `dc56a93be4b07dbe7a48863e3135351659817fb5`
- 按令没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`。既有 dirty 工作树原样保留。
- 没有启动服务，没有调用模型、HTTP、GUI、SSH、凭据读取或进程探测，
  没有运行 Python、Node、tsx、AST、导入、检查、测试或构建。
- 只修改了产品源码
  `service\lawbench\tools\drafts.py`，另按令新增本发现件和正式交回件。

开工前 8 个 pin 的字节数、mtime 和 SHA-256 均与
`source-pins.json` 完全一致。修改后只有 `drafts.py` 变化；其余 7 个 pin
仍保持原哈希：

| 源码 | 开工/当前 SHA-256 |
|---|---|
| `service\lawbench\checks\citations.py` | `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412` |
| `service\lawbench\checks\parse.py` | `56f6ac85636eb5260db117067397fe5bad8cd1376360a1be8c52b92203b9db83` |
| `service\lawbench\case\task.py` | `7b6ee04ba53f45b1f7e6624d2c9bf60b122dfc68c12e26331431a84eed36bf04` |
| `contracts\common.schema.json` | `46a8ac7b6c7017684d2667f4d622bb65577b29691b3f4121a20de02a6e5cb445` |
| `skills\criminal-applications\SKILL.md` | `535591d51956174f4820d0cb31b7249f98eb8f9819609b120a5923c608c11754` |
| A 线 `dsh-ext\agent\index.ts` | `ce2493cb60e652195779394bff50819924ceeff64e5bcf63e859928eb2c87294` |
| A 线 `dsh-ext\agent\task-state.ts` | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |

`drafts.py` 修改前为
`e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822`，
修改后为
`d11c360b8ac017d7c273b4be6b46cbaeb440756a7c84fadcb38aadf3f19c21ca`。
相对开工快照仅增加 41 行。

原始正式草稿始终未改：
`取保候审申请书-v2.md` 仍为 2630 字节、SHA-256
`8b1c9229926999e68722044942b5de90c36776df6d8a54aa75854c9ed97535cc`、
UTC mtime `2026-10-29T07:25:47`。

## 2. 实际失败事实

原始 canonical 运行 `run-cCkNwx` 用时 64.828 秒，11 次模型请求均为
HTTP 200；新必问闸门已实际通过：一次仅有 `authority` 的部分提问被
生产代码按 `doc_type`、`authority` 两项缺失拒绝，随后一次联合提问收到
两项回答，第一次成功存稿发生在其后。最终任务已结束为
`finished/completed`，B 服务核验通过，外连 0、凭据 getter 0、监听已关闭。

业务失败没有被第六道必问闸门解决：

1. 最终草稿 v2 的 `citation_check.passed=true`，`must_fix=0`、
   `hints=1`，但正文没有固定字符串 `法律依据待律师核实`。
2. 正文写了“取得被害人部分谅解，社会矛盾有所化解”，三份合成材料只能
   证明退赔 20,000 元，没有任何谅解意思表示。这是独立的内容/出处语义问题。
3. 受理机关问题正文已有正确机关名，但没有主 Skill 第 1 步要求的正式
   材料位置出处。这是独立的问题预填溯源问题。
4. 最终聊天答复也没有法律核验说明，并缺少主 Skill 要求的逐项自检。
5. 正文还写了“事实已基本查清，证据已基本固定”“能够确保……不致发生
   社会危险性”等判断，未按主 Skill 要求标为律师核实事项或分析意见。

第 1 项是本件确认的产品结构检查缺口；第 2–5 项不是本次授权修复的
语义 NLI 问题。尤其不能用关键词把“退赔”猜成“谅解”，也不能自动确认
申请理由是否成立。

## 3. 现行调用链

### 3.1 Agent 保存

- `service\lawbench\tools\__init__.py:43` 把 `case_save_draft` 映射到
  `drafts.save_draft`；第 55–65 行校验参数和返回契约。
- `service\lawbench\tools\drafts.py:364-380` 的 `save_draft` 在任务锁内
  重新读 `task.json` 并核对 `state=running`，随后调用 `_save_locked`。
- `drafts.py:383-415` 的 `_save_locked` 计算本案同标题下一版；写新文件后
  才执行 `check_fn` 和 `coverage_fn`，再更新 `result.json`。元数据阶段任一步
  抛错，会删除本次新文件并保留旧版本。

### 3.2 界面保存

- `service\lawbench\api\ui.py:85-87` 把 `POST /api/documents/save` 接到
  `save_document_ui`。
- `drafts.py:418-433` 的 `save_document_ui` 先按登记找回来源，再在来源
  任务锁内重核稳定来源，最后也调用同一个 `_save_locked`。
- `service\lawbench\case\documents.py:95-97` 核对案件、根目录和来源任务；
  `101-141` 再次核对来源任务已结束、结果不是 running、草稿登记唯一、
  路径属于该任务且不是链接。

因此新检查自动覆盖 Agent 保存和律师界面改稿，不另建第二套规则。

### 3.3 现有核对与本件插入点

- `drafts.py:303-309` 的 `_citation_check` 按任务 Skill 的 `kind` 调用
  `checks.check_text`。
- `checks\citations.py:215-262` 只核对出处格式以及金额、日期、引语是否
  在所标位置，并按 A–G 生成问题；G 在 `draft` 下原本只是 hint。
- `contracts\common.schema.json:337-427` 的现有 `problem` 和
  `citation_check` 结构允许 `must_fix` 并规定有 `must_fix` 时
  `passed=false`，无需增加字段或新问题类。
- `case\task.py:599-607` 负责案件内同标题版本递增；
  `734-776` 负责任务结束状态。两者对文件覆盖和结束原因的处理均未改变。
- A 线 `dsh-ext\agent\index.ts:515-535` 把服务返回的完整结构化结果交给
  模型；第 87–93 行只在 `problems` 非空时记录待处理状态。

本件最小插入点是共享的 `_save_locked`：在现有出处核验和覆盖清单都算完、
`result.json` 尚未更新时，追加一个结果规范化函数，不改变文件写入位置。

## 4. 已实施的有界修改

文件：`service\lawbench\tools\drafts.py`

- 第 21–22 行增加固定 Skill 名和固定正文标记常量。
- 第 317–352 行增加
  `_with_criminal_application_marker_check`：
  - 只有 `task["skill"] == "criminal-applications"` 才检查；
  - 正文已经含有固定标记时完全返回原结果；
  - 全部所选材料都不可读时不追加本问题，保留 Skill 要求的回退说明草稿；
  - 其余缺少标记的保存追加一条 G 类 `must_fix`，重新计算
    `passed`、`must_fix`、`hints`，原出处数和已有问题全部保留。
- 第 401 行在共享 `_save_locked` 中调用该函数，因此 Agent 和界面保存
  都走同一规则。

没有新增契约字段、问题类、API、存储、UI、结束原因、依赖或模型提示。
没有把所有法律 Skill 一并套用，也没有按标题判断是否为“未完成”。

## 5. 方案比较

### 写前硬拒绝

优点是缺少固定标记的版本完全不会入库。缺点是会直接破坏两个既有合法
路径：预算到顶时程序代存最后答复，以及全部材料不可读或尚待识别时必须
留下的说明草稿。它也会让模型拿不到可修订版本，增大上下文丢失风险。

### 写后结构化问题（本次采用）

草稿先保留，返回 `passed=false` 和一条可执行的修复说明；现有锁、版本、
回滚语义不变。模型能看见问题并按同一标题重新保存，律师也能看到未过状态。
代价是首次保存仍会留下一个带 `must_fix` 的版本，不能仅凭产品保存成功
宣称申请书已符合交付规则；同时 G 类被用于这条输出结构规则，是现有七类
枚举内的复用，不改变 Schema，但不是新的语义分类标准。

## 6. 灰区处理

| 场景 | 处理 |
|---|---|
| 全部所选材料不可读 | `total>0` 且 `unreadable` 数等于 `total` 时豁免，回退说明草稿可保存 |
| 预算到顶程序代存 | 不按标题或“未完成”别名区分；检查仍返回问题但不抛错，草稿照常保存 |
| 律师界面改稿 | 与 Agent 共用 `_save_locked`，同样得到问题；来源任务已完成、草稿登记唯一等绑定不变 |
| 其他 Skill / 自由对话 | 因 Skill 固定名不等于 `criminal-applications`，不追加问题 |
| 没有法律正文但在该 Skill 下保存短说明 | 可能得到非致命问题；当前 typed 数据无法可靠区分“成品申请”与任意短说明，因此不做猜测 |
| 材料原文或律师话里已有固定短语 | 只按字符串存在性通过，不判断该短语是否真正覆盖每项法律适用 |
| 大小写、标题别名、申请类型关键词 | 不使用；避免把标题或措辞猜成合法回退或法律结论 |
| 案件、会话、任务绑定 | 未改；仍由任务锁、职责范围快照和来源重核控制 |
| 取消、重试、并发保存 | 未改；仍使用原任务锁和 state 检查 |
| 重复版本、覆盖文件 | 未改；仍使用本案同标题版本递增和加新文件 |
| 写后核对/元数据失败 | 未改；仍删除本次新文件，不覆盖旧版本 |
| 原件和材料清单 | 未改任何原件、材料索引或读取记录 |

仍有两个明确边界：

- 最终聊天答复不是 `case_save_draft` 的内容，本次没有在最终答复层强制
  自检或法律核验说明。
- `POST /api/outputs/confirm` 会另行调用普通 `checks.check_text` 记录
  `citation_passed`，本次没有扩展确认导出路径。保存结果会显示新问题，
  但“确认导出”是否也必须收紧，属于下一项产品决定，不能据本件声称已覆盖。

## 7. Spec 边界

`docs\src\Spec.md:913-920` 固定法律内容缺少律师提供依据时写
“法律依据待律师核实”（F-CITE-04）。

`docs\src\Spec.md:923-945` 同时明确：出处核对只能证明数字、日期、引语在
所标材料位置原样存在，不能证明那一页支持整句结论；界面名称也只是
“数值与出处位置核对”。因此本修复只完成固定输出规则的可见结构校验，
不把 `citation_check.passed=false` 或修复后 `passed=true` 当作法律真伪认证。

## 8. 静态验证与尚未执行的验证

已执行：

- 8 个源 pin 的开工哈希核对：全部一致。
- 修改后其余 7 个 pin 的复核：全部未变。
- `git diff --check -- service/lawbench/tools/drafts.py`：退出码 0。
- 开工快照到当前文件的只读 diff：`1 file changed, 41 insertions(+)`；
  `git diff --no-index` 因存在差异按工具约定退出 1，不是测试失败。
- 原始正式草稿再次哈希：仍为原 2630 字节和原 SHA-256。
- 全程只读 Git 查询；工作树仍 dirty，没有暂存或提交。

按本运行器禁区和令的“不运行 Python/import/check/test”要求，未执行
pytest、编译、导入、契约程序校验、服务启动或模型复跑。因此没有“红绿
已跑”结论，当前等级是源码审计加静态改动核对，不是任务门通过。

下一轮获准运行测试时，最小红绿边界应为：

1. `criminal-applications` + 可读材料 + 无固定标记：保存成功，
   `passed=false`，新增恰一条 G/`must_fix`，其他 `citations`、`hints`
   计数正确。
2. 同一内容加入固定标记：不新增问题。
3. 其他 Skill 或无 Skill：不新增问题。
4. `total>0` 且全部 `unreadable`：不新增本问题，回退草稿能保存。
5. 已有 A–F 问题时：原问题不丢，`must_fix`/`hints` 正确重算。
6. `drafts.save_draft` 与界面 `save_document_ui` 均命中同规则。
7. `tasks.save_result` 抛错时仍删除本次新文件、旧版本不变。

## 9. 确认、推断与未解决

**确认**

- 原始失败是真实业务失败，不是消费者对主 Skill 的误报。
- 现行出处核对没有固定法律核验标记检查。
- 两个保存入口共用 `_save_locked`，本修复会同时到达。
- 新规则不会硬性阻断保存；全材料不可读回退不会被追加本问题。
- 原件、其余 pin、原草稿和既有 dirty 均未被改。

**推断**

- 原始模型在第一次得到 3 条 `must_fix` 后实际修改并二次存稿，因此
  `passed=false` 加明确修复说明很可能触发同类修复；但本轮禁止模型复跑，
  不能把该推断写成实测通过。
- A 线会收到完整结果 JSON；额外的下一轮草稿反馈提醒目前只启用给
  `contract-review` 和 `contract-draft`，不是本修复的一部分。

**未解决**

- 无模型复跑，未证明修正后的真实输出一定保留固定说明。
- “取得部分谅解”的无依据事实、受理机关问题缺正式位置出处、
  证据固定/社会危险性判断未区分分析意见、最终答复自检缺失，均需另行
  设计有来源依据的修复；本次禁止用关键词或 NLI 猜测。
- 无法仅靠 typed Skill、读取状态和草稿文本可靠区分“完成申请”、
  “预算中断的部分申请”和“同 Skill 下的普通短说明”。当前采用非致命
  结构化提示，既保留草稿，也不宣称已做语义分类。
- 最终聊天答复和确认导出路径未扩展，见第 6 节。

## 10. 实际命令与偏离

主要只读命令：

- `Get-Content` 读取正式执行令、source pins、当前 Skill、Spec、契约、
  源码、原始 canonical 报告、最终草稿、最终会话事件和三份合成材料文本。
- `Get-ChildItem` 列举输入证据与运行产物。
- `Get-FileHash`/`Get-Item` 核对 pin 和原草稿的 SHA、大小、mtime。
- `rg -n` 追调用链、Spec 9.4、冻结状态和测试路径。
- `git status`、`git diff`、`git diff --check`、`git rev-parse`、
  `git diff --no-index --stat`，均为只读 Git。
- 唯一写产品文件的操作是 `apply_patch`。

过程偏离已如实记录：有 3 次 `rg` 调用误把执行器 `shell` 参数写成了
`bash`；本机预检直接返回 `Bash/E_ACCESS_DENIED`，没有执行命令、没有读取
结果，也没有启动 bash。随后同一查询全部用指定的原生 `pwsh.exe` 重做。
没有更改沙箱、审批、ACL、锁或 writer 身份。
