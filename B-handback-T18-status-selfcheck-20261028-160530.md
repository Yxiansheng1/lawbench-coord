# B 线 T18 冲突状态与收尾报告局部修订交回

状态：`B_AUTHOR_COMPLETE_CANDIDATE`。源码级局部修订和静态边界核对完成；未做真实模型回归，不构成 `BUSINESS_PASS`。

## 做了什么

只修改 `skills/case-reading-notes/SKILL.md` 的本地模板、自检和最后答复约束：

- 第 44 行要求最终答复把引用核验的 `must_fix` 与 `hints` 按实际类别和数量分报，说明各类实际指向；不同类别不得被统称为同一类型，未逐条处理不得写“全部解决”，原严重程度及修正、读回、重存义务不变。
- 第 71-72 行加入两行通用占位示例：同一 `<同一争议要素>` 分列不同来源/主张，每个相关“来源属性与核对状态”单元格均写来源属性并带【待核实】。
- 第 121 行要求自检逐行检查当前要素汇总实际单元格；其他章节标签不能替代，缺标签必须记问题，不能判为通过。

新增产品文字不含实际测试材料的人名、金额、日期、材料名或预期答案，未作法律实体或证据权重判断。

## 源码身份

- 工作树：`D:\Lawbeach\lawbench-B`，分支 `line-B`。
- before：`14422` 字节，SHA256 `69619488f8cc827db702fed8fa153682bc6874374ac80817b26e4e06bf77b03c`。
- after：`15420` 字节，SHA256 `ef60fbdd8e6e60ff3bd87619d5530e735264864f574c63cc4538d8834c4dfffe`。
- frontmatter：前后 `553` 字节，SHA256 均 `f11f6a0b6a2e03b8fad485407acbdfe64b3676a6b3a25231817d6c3866e77cb2`。
- 共用规则块：前后 `7040` 字节，SHA256 均 `ddd39093b8e07f0f2ea9bcaaa107d4ce40ff8a5d9e170fbcb338123023088a49`。
- 其余 17 个 Skill 对 `skills18-before.json` 全文件 SHA256 对照：`17/17` 一致，差异 `0`。
- CRLF `125`、裸 LF `0`、无 UTF-8 BOM。

## 验证与命令

- 做了改动 diff、全文大小/SHA、frontmatter/共用规则块逐字节哈希、其余 17 Skill 全文件哈希、换行/BOM 和指定范围只读 Git 状态核对。
- 有效读写均用绝对路径原生 `pwsh.exe`、`login=false`。
- 一次输入目录误作文件读取退出 1；首次普通 `git status --short --branch` 因 `dsh` 子模块 Permission denied 退出 1，改用 `--ignore-submodules=all` 的只读探针退出 0，未改权限、锁或审批。
- 两次备用读取误交给不可用的 Bash/MSIX 包装，均被 MXC 拒绝并退出非零，未触达文件；之后全部回到原生 PowerShell。
- `git diff --no-index` 退出 1 仅表示捕获到预期差异；`git diff --check` 退出 0、无空白错误。
- 作者运行时为 0：未运行 Node、Python、导入、解析器、AST、测试、类型检查、构建、prepare、探针、HTTP、模型、GUI、SSH、`build_skills`、`check_examples` 或自检。

## 写入面与证据

- `D:\Lawbeach\lawbench-B\skills\case-reading-notes\SKILL.md`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ReadingQuality-20261028-145704\status-selfcheck-20261028-160530.md`
- 本交回件

既有 dirty 在读取输入前由执行令输入保全，未回退、未清理、未暂存。旧 final draft、最终答复、citation result、root review、README 和旧证据均未改。Git 严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout、push，未碰锁。

下一步由主编排复核全部源码与原命令、更新精确 Skill 哈希，并运行既有 Skill 静态检查及一次受影响的原始原生工作流。当前不宣称 PASS；`Gate1` 未过，完整 T18 与项目未完成，`Packaging=HOLD`。
