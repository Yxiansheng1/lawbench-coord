# 交回 · 线 B → ORCH · 成果分家与导出格式（回执行令 20261008-1321；第七版待办 11、12）

基于 origin/main `722b872`，没有打包（按广播 1258）。

## A. 输出分家（`bdad679`，`T18:`）
- **共用规则**：
  - 加"起草类草稿只放交付正文"。列明 8 个 Skill（合同起草、诉讼文书、律师函与通用文书、取保候审/不予逮捕申请、辩护词、质证意见、投标文件、修改稿，正是 `kind: draft` 那 8 个）：草稿就是文书本身，标题就是文件名；起草说明、待补事实、待确认选择、修改说明、自检结果都写在答复里。答复末尾固定写"草稿《X》已保存，点右侧'确认保存'即可生成 Word。"
  - 原来那条"成果末尾写自查结果"改为：起草类写在答复里，阅卷、审查、分析类照旧写在成果末尾。
  - 加草稿格式：空行分段、条内直接换行、表格用标准 Markdown、不用破折号画表。
- **各 Skill 模板**：
  - contract-draft：草稿 = 合同正文；答复写四节（起草说明 / 待补事实清单 / 需要律师确认的条款选择 / 自检结果）加确认保存提示。
  - cross-exam-opinion：自检结果移到答复。
  - doc-revise：草稿 = 修改后全文；修改说明表写在答复里。
  - litigation-docs、general-drafting、criminal-applications、defense-opinion、bid-drafting：模板本来就只有文书，各加一行说明。
  - 阅卷类没动。build_skills、check_examples 过。
- **真跑 contract-draft**（`evidence\T18\read-coverage\第二轮\`，`1fb27a6`）：草稿只有合同正文；答复依次是四节和确认保存那句。
  - **偏离**：令里写"用 rc-ocr 同样材料"，但那是刑事和结案卷材料，起草合同没有意义。改用 contract-draft 样本 01（钢材采购）的案件 `contract-draft-2`。

## B. 导出格式（`8d6ee5a`，`T15:`）
- `pandoc.py` 输入加 `+hard_line_breaks`：块内单换行变成段内换行，不再并成一段；`strip_workspace_links` 不受影响。
- **样式**：按合同、文书两个模板核对，导出用到的段落样式（BodyText、Compact、FirstParagraph、Heading1）模板里都有，没有造新样式。
- **用例**：按律师借款合同的结构造了虚构样本，结果 5 段、第四条段内 4 个换行（户名、开户行、账号）、1 张 3 列表格；去掉 `+hard_line_breaks` 时红。export、redline、archive 共 87 例过。
- **真草稿导出**：contract-draft-3 的草稿导出 docx（证据目录里），条款 md 11 条、docx 11 条，各自成段。
- **律师原稿**：你说可以提供原文，若给我，我按同一用例的方法再跑一次。现在用的是同结构的虚构样本。
