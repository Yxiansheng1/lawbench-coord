# B 交回件 质证意见同稿表述校正

状态：候选完成，待根复核；打包保持暂停。

日期：2026-10-27。

| 项目 | 内容 |
|---|---|
| 做了什么 | 只把读者文档第 10 行 `cross-exam-opinion` 的“产出与下一步”改为：保存质证意见草稿；律师需要庭审发问提纲时，将发问提纲列入同一份草稿。另写修订说明和本交回件。 |
| 目标是什么 | 让文档与真实 Skill 的单次保存流程一致，不再暗示另存第二份草稿。 |
| 在等什么 | 等根复核反向比较该单元格、其余字节、当前精确源文件和 18 行覆盖。 |
| 卡在哪 | 本轮没有需要修复的交付阻碍。普通 `git status` 因 `dsh` 子模块权限报错；改用忽略子模块的只读状态检查，未修复或改动权限。 |

## 交付文件

- 读者文档：`D:\Lawbeach\lawbench-B\docs\guide\连越律所工作台功能清单.md`
- 修订说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\LawyerSkillListSingleDraft-20261027-180122\correction.md`
- 本交回件：`D:\Lawbeach\lawbench-coord\B-handback-T36-single-draft-wording-20261027-180122.md`

## 原依据

`cross-exam-opinion` 固定快照第 41 行只在律师需要时要求列出庭审发问提纲；第 42 行只调用一次 `case_save_draft` 保存质证意见正文；第 44 行起的输出模板把可选发问提纲列在同一份草稿内容内。源文件 SHA-256 仍为 `03615deb739515c516b84fb7b3536f6b8a130d2fb7d71189e2a4a9d8ba387b1a`。

本件取代旧修订说明和旧交回件中“另保存发问提纲草稿”的推断。旧修订说明、旧交回件及其他旧 raw/terminal 文件均未改动。

## 验证与保留

- 读者文档从 9082 字节变为 9088 字节，新 SHA-256 为 `350ddad1e9019368e658f23d800b41efa313e124ed52bd4811f27768a454189a`。
- 把快照中的唯一旧单元格替换为新单元格后，期望字节流与当前文件逐字节相等；实际只有第 20 个文本行变化。
- 仍为 33 行、LF 32 个、CRLF 0 个、无 BOM；18 个编号行、通用 8、专用 10、4 个分析相关标记均保持。
- 第 4、17 行逐字符不变；18 个 Skill ID、标题和其他单元格未改。
- `git diff --no-index` 只显示第 10 行一个差异块，退出码 1 为预期差异结果。
- Git 严格只读；既有 dirty 原样保留，没有 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 未做

未运行 Python、Node、解析器、AST、导入、测试、测试收集、构建、prepare、serve、探测、HTTP、GUI、模型、安装或自检脚本；未渲染、打包、发布或部署。未读取真实案卷、历史会话、缓存、环境文件或密钥材料，未联系其他会话，未更换 API。

关键路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\LawyerSkillListSingleDraft-20261027-180122\correction.md`
