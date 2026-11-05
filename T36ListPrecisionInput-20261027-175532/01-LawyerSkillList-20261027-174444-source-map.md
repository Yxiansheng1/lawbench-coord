# T36 律师 Skill 清单来源映射

## 1. 交付候选与边界

- 读者文档：`D:\Lawbeach\lawbench-B\docs\guide\连越律所工作台功能清单.md`
- 来源映射：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\LawyerSkillList-20261027-174444\source-map.md`
- 正式交回件：`D:\Lawbeach\lawbench-coord\B-handback-T36-lawyer-skill-list-20261027-174444.md`
- 作者运行期：0。
- 交付性质：事实性新文档候选，不是发布、安装、提交或测试结论。

本卡只写上述三份新文件；`targets.json` 只读。未修改任何 Skill、Shared Rule、契约、测试、配置、运行文件、历史 T36 报告或其他工作区文件。Git 全程只读，未暂存、提交、变基或清理。

## 2. 冻结需求与输入

固定需求记录为 `D:\Lawbeach\lawbench-coord\T36LawyerSkillListInput-20261027-174444\19-lawbench-coord-ORCH-第二期新需求记录-20261019.md`。

- 第 12 行，决定 1：“18 个 Skill 中合同审查、刑事证据审查、质证意见、辩护词四个偏分析，1.0 不删不藏，发布时给律师一份清单标出，由律师定去留”。
- 第 53 行，决定 17：“发布时附 18 个 Skill 清单（第 1 条）供律师取舍”。
- 第 54 行，决定 18：清单区分“通用（委托手续、案件跟进、安全阅卷等，不常更新）与专用（领域分析，交线上模型或单独维护）”。
- 上轮交付 `20-T36-交付说明.md` 第 5 节第 3 项明确记录：“第 1 条定论②……不在本卡步骤里，没有做”。本卡补齐该缺口。

读者文档中的“分析相关功能（保留）”严格只用于决定 1 点名的四项。源码 `kind: analysis` 的范围更宽，`legal-workflow`、`pre-issue-check`、`sentence-calc`、`tender-review` 也具有分析字段，但没有被扩张解释为这四个保留标记。

写作约束来自 `D:\Lawbeach\lawbench-coord\T36LawyerSkillListInput-20261027-174444\writing-style.md`。读者文档只保留律师选择工作流所需的标题、用途、输入、产出、下一步和边界；工程命令、哈希、分支、验证和删除记录只留本文件。

## 3. 当前源码一致性

固定索引列出的 18 个源码文件均重新只读计算 SHA-256；18 个当前哈希与 `index.json` 记录一致。当前源码同时仍包含 `skills\_shared\共用规则.md` 的以下依据：

- 第 4 行：每条事实要有出处。
- 第 7 行：涉及法律适用时写“法律依据待律师核实”。
- 第 14 行：起草类草稿只放交付正文。
- 第 21 行：工作台做材料整理、汇总、抽取、脱敏、文书生成修改；同条明确“本 Skill 步骤里规定要写的审查意见、质证意见、辩护观点照步骤写，不受这一条限制”。
- 第 22 行：先保存 Markdown 草稿，右侧“确认保存”后生成 Word。

## 4. 四项分析相关功能

| Skill ID | 源码标题与位置 | 保留理由的原句 |
|---|---|---|
| `contract-review` | `合同审查意见`，`skills\contract-review\SKILL.md:3` | 第 18 行：“一份逐条可落地的审查意见。律师拿去就能改合同、和对方谈。” |
| `criminal-evidence-review` | `证据审查意见`，`skills\criminal-evidence-review\SKILL.md:3` | 第 18 行：“只指出问题和线索，法律上是否排除、是否影响定罪由律师判断。” |
| `cross-exam-opinion` | `质证意见`，`skills\cross-exam-opinion\SKILL.md:3` | 第 18 行：“逐项的质证意见表，律师拿到庭上可以直接对照使用。” |
| `defense-opinion` | `辩护词`，`skills\defense-opinion\SKILL.md:3` | 第 18 行：“辩护方向由律师定，模型不替律师选。” |

四项都保留审查、证据整理、质证准备或辩护准备的现有步骤。读者文档把它们写成律师核验和文书准备的辅助功能，没有写成自动法律结论。

## 5. 18 项来源矩阵

源码根目录为 `D:\Lawbeach\lawbench-B\`。标题取源码 frontmatter 的 `title` 字段；“通用/专用”只表示工作流覆盖范围，不表示执行提供方、外部模型路由或质量等级。

| # | Skill ID | 精确源码路径 | SHA-256 | 源码标题 | 分类与依据 | 句子依据 |
|---|---|---|---|---|---|---|
| 1 | `bid-drafting` | `skills\bid-drafting\SKILL.md` | `d4a562da3125f6c5f0f86ba47d9348c575a79ad9d9169197487ae91ba301748e` | 投标文件起草 | 专用。标题和第 4 行均限定为按招标文件起草投标响应内容。 | 第 18 行：“本 Skill 只起草文字，不编造资质、业绩、人员和价格。” |
| 2 | `case-archiving` | `skills\case-archiving\SKILL.md` | `7ede544356b715f4aae7e4ebd54eb8e07ef4c7c6038590c47ad2a440c4caa7dd` | 案卷归档 | 通用。第 4 行描述结案后的跨案件归档流程，未限定法律领域。 | 第 53 行：“办案结果绝不自行判断”。 |
| 3 | `case-reading-notes` | `skills\case-reading-notes\SKILL.md` | `b9f93c88ce85e68cbd331c38006e6416573c47cfc4e31ea6ed61f4a4c50936c0` | 阅卷笔录 | 通用。第 4 行面向民事案件材料整理，可跨具体案由使用。 | 第 18 行：“给律师一份能逐条点回原文核对的阅卷笔录。宁可少写，不可编造。” |
| 4 | `case-wiki-build` | `skills\case-wiki-build\SKILL.md` | `739f3cf6a62546dba9c43ff2f1bcd9c3a5913f59fcafcf3ed7a1c32ee9b6ad20` | 案件 wiki | 通用。第 4 行面向所有案件材料，产出供其他任务使用的卡片和分节。 | 第 14 行：“本 Skill 是**流水线**：由程序控制步骤，模型只写每一步的内容”；第 81 行：“没有法律判断类内容”。 |
| 5 | `contract-draft` | `skills\contract-draft\SKILL.md` | `bfd44f5e3e970d95fe961df3d7298b67b9dc6f37cd5de7f825ea902c889b4012` | 合同初稿 | 专用。第 4 行限定合同、框架协议、补充协议和条款起草。 | 第 18 行：“一份结构完整、可以直接修改使用的合同初稿”；第 4 行要求缺失商业信息标待补充。 |
| 6 | `contract-review` | `skills\contract-review\SKILL.md` | `339e3f09001421424c319ef17d9082084b54e6b6d90938afff92a3c7b33575c9` | 合同审查意见 | 专用，且属于决定 1 点名的分析相关功能。第 4、6 行分别限定合同审查及 `analysis` 类型。 | 第 18 行：“一份逐条可落地的审查意见。律师拿去就能改合同、和对方谈。” |
| 7 | `criminal-applications` | `skills\criminal-applications\SKILL.md` | `535591d51956174f4820d0cb31b7249f98eb8f9819609b120a5923c608c11754` | 刑事申请书 | 专用。第 4 行限定取保候审、审查逮捕等刑事申请文书。 | 第 101 行：“文书类型来自律师（任务说明或对必问问题的回答），没有自行猜测。” |
| 8 | `criminal-evidence-review` | `skills\criminal-evidence-review\SKILL.md` | `4405955c130cb7f9ea58c997965f41a62b6d7efcdafbb258d57fbd4028d906d2` | 证据审查意见 | 专用，且属于决定 1 点名的分析相关功能。第 4、6 行限定刑事证据审查及 `analysis` 类型。 | 第 18 行：“只指出问题和线索，法律上是否排除、是否影响定罪由律师判断。” |
| 9 | `criminal-reading-notes` | `skills\criminal-reading-notes\SKILL.md` | `0bc8ee2b56b5900fe7d20ce3b6310ec864b8afa789393028f945bf332e291d10` | 刑事阅卷笔录 | 专用。第 4 行限定刑事案件卷宗。 | 第 18 行：“只摘录和整理，不下法律结论。” |
| 10 | `cross-exam-opinion` | `skills\cross-exam-opinion\SKILL.md` | `03615deb739515c516b84fb7b3536f6b8a130d2fb7d71189e2a4a9d8ba387b1a` | 质证意见 | 专用，且属于决定 1 点名的分析相关功能。第 4 行限定公诉机关证据和庭审质证。 | 第 18 行：“逐项的质证意见表，律师拿到庭上可以直接对照使用。” |
| 11 | `defense-opinion` | `skills\defense-opinion\SKILL.md` | `e49d280e4f09f2a2aeeb94bef8f188aca7ce84a773fab410703d59d59a4da04a` | 辩护词 | 专用，且属于决定 1 点名的分析相关功能。第 4 行限定辩护词和辩护意见。 | 第 18 行：“辩护方向由律师定，模型不替律师选。” |
| 12 | `doc-revise` | `skills\doc-revise\SKILL.md` | `9107ea54962a12521f4d4a0b824c494100359fb3a0a9968a3db1cf86c65fe1f7` | 修改稿 | 通用。第 4 行描述按律师意见修改已有文稿，不限定领域。 | 第 39 行：“**只改要求改的地方**，以及因此必须连带修改的地方”。 |
| 13 | `general-drafting` | `skills\general-drafting\SKILL.md` | `2a167b44f4da3cde768834d9a476f2a252c8cf3138cba61f48d99bbf7214fe31` | 通用法律文书 | 通用。第 4 行列律师函、法律意见书、分析报告等多种跨场景文书。 | 第 18 行：“结构规范、事实有据、语气得体的文书初稿。” |
| 14 | `legal-workflow` | `skills\legal-workflow\SKILL.md` | `46639190956bdd517742ef89a5f598e9e7a0a2466ad92e4a5190169c90a3c25f` | 业务导航 | 通用。第 4 行说明它面向流程选择，不限定案件领域。 | 第 4 行：“只做指引，不直接产出文书。” |
| 15 | `litigation-docs` | `skills\litigation-docs\SKILL.md` | `3a97dae221b074c79c35f5a99ee035de220ae04aba6489e273bee034f47a86d8` | 诉讼文书起草 | 通用。第 4 行覆盖民事文书及部分刑事文书，按文书流程而不是单一法律领域组织。 | 第 25 行：“结构规范、请求明确、每项事实有出处的文书初稿”；第 48 行要求不自行计算利息。 |
| 16 | `pre-issue-check` | `skills\pre-issue-check\SKILL.md` | `81be87f93b4114df6b644789f66379cbde9c4d143e41c542bbda4a7229818243` | 出稿前审查 | 通用。第 4 行列明适用于辩护词、合同、律师函等多种文书。 | 第 18 行：“只出问题清单，不改原稿，要改用 doc-revise。” |
| 17 | `sentence-calc` | `skills\sentence-calc\SKILL.md` | `3f280837b8b424443a03fe55729293f8112e36b98a6f44dd48c7f66b5a017d43` | 刑期计算 | 专用。第 4 行限定刑期、羁押折抵及量刑分析。 | 第 21 行：“日期一律由 `case_calc_sentence` 用程序计算，模型不心算日期。” |
| 18 | `tender-review` | `skills\tender-review\SKILL.md` | `a7f19dc17bac500bb66e2dc7eb2bfe07653c6165d3c452e40b996649966ccdf6` | 招标文件审查 | 专用。第 4 行限定招标、比选、询价文件审查。 | 第 36 行：“我方身份不从材料推断”；我方身份须由律师确认。 |

## 6. 分类口径

- 通用 8 项：`case-archiving`、`case-reading-notes`、`case-wiki-build`、`doc-revise`、`general-drafting`、`legal-workflow`、`litigation-docs`、`pre-issue-check`。
- 专用 10 项：`bid-drafting`、`contract-draft`、`contract-review`、`criminal-applications`、`criminal-evidence-review`、`criminal-reading-notes`、`cross-exam-opinion`、`defense-opinion`、`sentence-calc`、`tender-review`。
- 通用项的共同依据是跨具体案由复用；专用项的共同依据是标题或用途句明确限定合同、刑事、招投标或特定文书类型。
- 分类只帮助律师选择入口；没有据此删除、隐藏、改配置或判定任何功能去留。

## 7. 标题差异与争议文本

- `contract-draft` 的 frontmatter 标题是“合同初稿”，正文一级标题是“合同起草”；读者文档采用 frontmatter 标题，并保留 Skill ID。
- `case-wiki-build` 的 frontmatter 标题是“案件 wiki”，正文一级标题是“案件 wiki 生成与更新”；读者文档采用 frontmatter 标题。
- `criminal-applications` 的 frontmatter 标题是“刑事申请书”，正文一级标题是“刑事申请类文书”；读者文档采用 frontmatter 标题。
- 源码 `kind: analysis` 不等于冻结决定中的四项“偏分析”标记。读者文档严格只标四项，未扩大范围。
- 本轮没有发现需要改变 Skill、契约或决定表的源码冲突。

## 8. 实际执行、非零结果与写面

除下文三次误填 `shell=bash` 且被运行器拒绝的调用外，每次 `exec_command` 均使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，`login=false`，工作目录 `D:\Lawbeach\lawbench-B`。

只读命令：

- `Get-Content -Raw`：读取正式执行令、`index.json`、`writing-style.md`、18 个固定 Skill 快照、共用规则快照、决定记录快照、上轮 T36 交付说明和 `targets.json`。
- `Test-Path`：确认读者文档的前序目标、映射和交回件原不存在。
- `Get-ChildItem`：确认 `docs\guide` 和新映射目录原不存在，并列出旧 T36 证据目录。
- `Get-Item`：确认目标读者文档原不存在。
- `Get-Item`：最终确认三份交付文件均存在并读取字节数。
- `Get-FileHash -Algorithm SHA256`：读取 18 个当前源码 SHA-256。
- `Select-String`：只读提取标题、描述、用途、边界和决定行位置，并检查读者文档的 18 行、18 个唯一 ID、8 项通用、10 项专用、四项标记和黑名单词。
- `git status --short --ignore-submodules=all`：退出码 0；显示既有脏项，均未改动。
- `git status --short --ignore-submodules=all -- <两个新文件>`：退出码 0；两个新文件均为未跟踪状态，没有暂存。

非零结果：

- `git status --short`：退出码 1。子模块路径 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限拒绝。未修权限、未改锁、未改审批。
- 三次文本搜索误把执行器的 `shell` 参数写成 `bash`：第一次是 `rg`，第二次和第三次是 `Select-String`。三次均被运行器以 MSIX/E_ACCESSDENIED 拒绝，未读取、未写入、未改动任何源码或文件；随后均改用指定原生 PowerShell 重做。
- 一次 PowerShell 分类统计误用 `.Like()` 字符串方法，发出非终止 `InvalidOperation`，得到无效的专用计数 0；文件未变，随后用 `-like` 重做并得到通用 8、专用 10。
- 协调目录 `D:\Lawbeach\lawbench-coord` 不是 Git 仓库；对其交回件运行只读 `git status` 返回“not a git repository”。不影响文件交付，未初始化仓库。
- 创建前对 `docs\guide`、新映射目录和两个目标文件的 `Get-ChildItem`/`Get-Item` 因目标尚不存在而退出码非零；这是预期的“尚未创建”检查。
- 读者文档首稿有 6 处重复的“可接着做出稿前审查”、一处流程填充和一处“帮助”赘词，删减轮已实际删除。

写面：

- `New-Item -ItemType Directory`：新建 `docs\guide` 和 `docs\plan\evidence\T36\LawyerSkillList-20261027-174444`。
- `apply_patch`：新建并删改读者文档；新建本来源映射；随后新建正式交回件。
- 没有修改 Git index、锁、沙箱、审批或 ACL。

## 9. 删减轮记录

删减轮：读者 0 / 槽位 0 / 半句 1 / 重复 6 / 过程 1 / 黑名单 0。

黑名单扫描覆盖 `writing-style.md` 第 3 节所列词、句式和标点；读者文档当前命中为 0。读者文档保留 18 行，所有表格槽位均由当前源码支持，没有为填槽补造内容。

## 10. 旧证据复用与未运行项

旧 T36 原始证据 `build_skills-check.txt`、`check_examples.txt`、`pytest.txt` 保留在 `docs\plan\evidence\T36\`。由于当前 18 个源码哈希与固定索引一致，本轮复用其“共用规则和 Skill 同步已通过”的历史结论，仅用于说明源码未变；本清单是 Markdown 文档，不新增运行时代码。

NOT_RUN：

- 未重跑 `build_skills.py`、`check_examples.py`、pytest、Vitest、tsc、测试收集或全量测试。
- 未运行 Python、Node、解析器、AST、导入、构建、prepare、serve、HTTP、探测、GUI、模型、6000D、安装或自检脚本。
- 未做 Markdown 渲染或打包；本任务明确不需要。
- 未读取真实案卷、历史会话、缓存、rollout、环境文件、Keyring 或发票账本。
- 未执行任何 Git 写操作，未联系其他会话，未换 API。

## 11. 根复核剩余项

- 根复核独立读取读者文档、三份固定决定、18 个源码和本映射，确认 18/18 覆盖、ID/标题/路径/哈希一致。
- 根复核确认“分析相关功能（保留）”只出现于四个冻结 ID。
- 根复核确认读者文档中的输入、产出和边界没有超出源码。
- 根复核做最终法务可读性和保留范围判断。

当前仅完成 T36 律师清单候选。Gate 1 和整个项目仍未完成；PackagingHOLD 继续有效。
