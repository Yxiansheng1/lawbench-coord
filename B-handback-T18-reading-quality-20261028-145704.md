# B 线 T18 阅卷质量局部修订交回

状态：`B_AUTHOR_COMPLETE_CANDIDATE`。源码级局部修订已完成，静态边界核对通过；尚未做真实模型回归，不构成 `BUSINESS_PASS`。

## 1. 接续状态与既有结论

- 工作树：`D:\Lawbeach\lawbench-B`，分支 `line-B`，只读 HEAD `dc56a93be4b07dbe7a48863e3135351659817fb5`。
- 开工前 dirty 与 18 个 Skill 哈希已在读取 inputs 前保全；既有 dirty 未回退、未清理、未暂存。
- 沿用执行令既有状态：B prior `012023` terminal `103/75`；all A `218/201` terminal；实际原生流程 `11` 次 6000D POST 均 HTTP 200，总耗时 `367.718s`，自然退出，未留 7 个相关进程。
- 旧流程技术范围仍按其历史 PASS 保留；本次不重演旧开工、安装、调研、全量测试或旧灰测。
- 既有业务判词仍为 `FAIL_CURRENT_BUSINESS_OUTPUT_WITH_TECHNICAL_WORKFLOW_PASS`。v6 终稿 SHA256 仍为 `ca43c948413746b37250ceadcdcfb88cfb62bb19db72c3cf224b7854f1200f96`，原失败草稿和判词均未改。

## 2. 写入面与新哈希

产品写入只有：

- `D:\Lawbeach\lawbench-B\skills\case-reading-notes\SKILL.md`
  - 旧：`12604` bytes，SHA256 `b9f93c88ce85e68cbd331c38006e6416573c47cfc4e31ea6ed61f4a4c50936c0`
  - 新：`14421` bytes，SHA256 `a46d70e2c4bb507edb53739f8db52017b7a33c1bcca80e0b902ec1b4ed3101c1`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ReadingQuality-20261028-145704\README.md`
  - `1386` bytes，SHA256 `5f2324d4e8fcbf125b4b95ca3c78e7bf268b82b2d5fedba076c43d7cde47cbea`
- 本交回件为协调目录新增文件。

新 Skill 的 frontmatter SHA256 新旧均为 `e4f8f08fb98bc3dbb458af121a54e79f93dfb4f4c151d109583f4630de99627f`。共用规则块（含首尾标记）SHA256 新旧均为 `ddd39093b8e07f0f2ea9bcaaa107d4ce40ff8a5d9e170fbcb338123023088a49`。

插入/替换仅落在旧第 `54-61`、`64`、`109` 行附近；共用规则块旧第 `80-104` 行、新第 `88-112` 行未变。新文件中单份材料模板、要素汇总、自检清单分别始于第 `48`、`65`、`114` 行。

## 3. 候选修订内容

- 单份材料把“材料记载”“当事人陈述”“分类争议”分列；当事人陈述每条保留说话人，当事人自己出具、讲述或主张的内容不得归入“材料记载”。
- 要素汇总增加“来源属性与核对状态”；冲突款项分来源并列原话与出处，标记【待核实】，不按摘要、汇总表或会计标签静默定为本金、利息或已还本金。
- 日期、月份、金额及款项性质按原文保留；不得仅凭时间线纠正、替换或宣告原文笔误。必要计算须单列〔推断〕并写明假设和不确定性。
- 无律师确认立场时，“对本方的影响”只写【待律师判断】；不评价证据资格、证明力、可信度，不称“核心证据”。
- 自检清单新增逐份与汇总的来源属性、冲突并列、推断边界和影响字段检查，禁止把实际矛盾自动勾成通过。

修订未加入样例姓名、日期、金额、案件答案、测试正则或宽泛提示框架。原失败草稿与本候选均不能替代真实回归和人工审阅。

## 4. 身份核对

18 个 Skill 中只有 `case-reading-notes` 改变；其余 17 个均与 `skills18-before.json` 逐字节一致：

```text
d4a562da3125f6c5f0f86ba47d9348c575a79ad9d9169197487ae91ba301748e  bid-drafting
7ede544356b715f4aae7e4ebd54eb8e07ef4c7c6038590c47ad2a440c4caa7dd  case-archiving
739f3cf6a62546dba9c43ff2f1bcd9c3a5913f59fcafcf3ed7a1c32ee9b6ad20  case-wiki-build
bfd44f5e3e970d95fe961df3d7298b67b9dc6f37cd5de7f825ea902c889b4012  contract-draft
339e3f09001421424c319ef17d9082084b54e6b6d90938afff92a3c7b33575c9  contract-review
535591d51956174f4820d0cb31b7249f98eb8f9819609b120a5923c608c11754  criminal-applications
4405955c130cb7f9ea58c997965f41a62b6d7efcdafbb258d57fbd4028d906d2  criminal-evidence-review
0bc8ee2b56b5900fe7d20ce3b6310ec864b8afa789393028f945bf332e291d10  criminal-reading-notes
03615deb739515c516b84fb7b3536f6b8a130d2fb7d71189e2a4a9d8ba387b1a  cross-exam-opinion
e49d280e4f09f2a2aeeb94bef8f188aca7ce84a773fab410703d59d59a4da04a  defense-opinion
9107ea54962a12521f4d4a0b824c494100359fb3a0a9968a3db1cf86c65fe1f7  doc-revise
2a167b44f4da3cde768834d9a476f2a252c8cf3138cba61f48d99bbf7214fe31  general-drafting
46639190956bdd517742ef89a5f598e9e7a0a2466ad92e4a5190169c90a3c25f  legal-workflow
3a97dae221b074c79c35f5a99ee035de220ae04aba6489e273bee034f47a86d8  litigation-docs
81be87f93b4114df6b644789f66379cbde9c4d143e41c542bbda4a7229818243  pre-issue-check
3f280837b8b424443a03fe55729293f8112e36b98a6f44dd48c7f66b5a017d43  sentence-calc
a7f19dc17bac500bb66e2dc7eb2bfe07653c6165d3c452e40b996649966ccdf6  tender-review
```

`skills\_shared\共用规则.md` 当前 SHA256 为 `ebb19fe3584185971e989a87580d1e0f2f5ec1c83cc1c965c9958cbb8aec8b45`，范围状态未显示修改。共享规则、其他 Skill、脚本、契约、运行时、库、配置、样例与测试材料均未改。

## 5. 静态验证

- `git diff --check -- skills/case-reading-notes/SKILL.md`：exit 0，无 whitespace error。
- frontmatter 与共用规则块逐字节哈希对照：均相等。
- 18 Skill 对照：17 个未变，唯一变化为 `case-reading-notes`。
- 原 `actual-final-draft.md` 大小和 mtime 未变，SHA256 仍为 `ca43c948413746b37250ceadcdcfb88cfb62bb19db72c3cf224b7854f1200f96`。
- `root-quality-review.json` 大小和 mtime 未变，SHA256 为 `9d7836676b41d8dc790f02f38620831c98edcac1d455500c36258aa4df776948`。

## 6. 实际命令与退出状态

所有 Shell 均为绝对路径原生 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，`login=false`；未用 Bash。以下按一次 Shell 调用编号：

1. `Get-Content` 正式执行令：0
2. `git status --short --ignore-submodules=all`：0
3. `Get-ChildItem` + `Get-FileHash` 18 Skill：0
4. `git rev-parse --abbrev-ref HEAD`：0
5. `Get-ChildItem` 协调目录 inputs 文件前缀：0
6. `Get-ChildItem` 协调目录 inputs 路径前缀：0
7. `Get-ChildItem` inputs 目录文件清单：0
8. `Get-Content inputs.json`：0
9. `Get-Content` 当前 `case-reading-notes/SKILL.md`：0
10. `Get-Content` 共用规则：0
11. `Get-Content` 实际终稿：0
12. `Get-Content` 根质量判词：0
13. `Get-ChildItem` 样本目录：0
14. `Get-Item` 根证明 + 3 个 `Get-FileHash`：0
15. `Get-Content` 根实际证明：0
16. `Get-Content` 样本任务说明：0
17. `Get-Content` 样本案情摘要：0
18. `Get-Content` 样本情况说明：0
19. `Get-Content` 样本还款记录：0
20. `Get-Content` 样本借条：0
21. `Get-Content` 样本银行流水：0
22. `Get-Content` 主构建脚本：0
23. PowerShell 内存截取 + `SHA256` 旧共用块/frontmatter：0
24. `Select-String` 旧模板/共用块/自检行号：0
25. PowerShell 只读快照结构核对：0
26. `Get-Content skills18-before.json`：0
27. 第一次 `git diff --check -- skills/case-reading-notes/SKILL.md`：0
28. `git diff -- skills/case-reading-notes/SKILL.md`：0
29. Skill 中间态 `Get-FileHash` + 共用块/frontmatter：0
30. PowerShell 18 Skill 快照比对：0
31. `Get-Content` Skill 输出模板和自检段：0
32. `Get-ChildItem` T18 evidence 目录：0
33. `Get-Item` 检查交回件是否已存在：exit 1；文件当时不存在，这是预期只读检查
34. `git status` 指定范围：0
35. 第二次 `git diff --check`：0
36. `New-Item` 创建唯一新证据目录：0
37. `Get-Item` + `Get-FileHash` 目标 Skill/README/共用规则：0
38. 共用规则块/frontmatter 最终逐字哈希核对：0
39. 18 Skill 最终快照比对：0
40. `Select-String` 最终模板/共用块/自检行号：0
41. `git diff --check` + 指定范围 `git status`：0
42. `git rev-parse --abbrev-ref HEAD` + `git rev-parse HEAD`：0
43. 目标 Skill/README/共用规则完整 SHA256 输出：0
44. `git diff --unified=0` 最终局部差异：0
45. `Select-String` 旧模板/共用块/自检行号：0
46. `Get-ChildItem` 新证据目录：0
47. 旧终稿/判词大小、mtime、SHA256：0
48. 本交回件写入后只读回读 `Get-Content`、`Get-FileHash` 和指定范围 `git status`：见执行者最终回报

`apply_patch` 共四次：两次修订目标 Skill 本地段落、一次新增 README、一次新增本交回件。未运行构建、测试、契约检查、Skill 检查、Python、Node、HTTP、模型、GUI、SSH 或自测。

## 7. 权限、隔离与遗留

- Git 严格只读：未执行 add、commit、rebase、stash、reset、clean、checkout、push；未碰 index lock。
- 未改沙箱、审批、ACL、权限、writer lock 或环境策略；未启动安装、升级、构建或打包。
- 未读取模型历史、JSONL、rollout、环境密钥、DPAPI、其他凭证、真实案卷或发票历史；未联系其他聊天或代理。
- 本执行者作者运行时为 0。`build_skills`、`check_examples` 及完整安全检查按执行令留给主编排。
- 后续由主编排单独更新真实 Skill 字面哈希与清单，再用原材料、原提示条件、真实 R、原预算和原引用/覆盖/质量标准执行一次真实回归并人工审阅；不得把旧 pin 或旧 PASS 当新 Skill 证据。
- `Gate1` 未过，项目未完成，`Packaging=HOLD`。本次完成后停止。
