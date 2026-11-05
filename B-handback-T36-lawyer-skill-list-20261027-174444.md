# B 交回件 T36 律师 Skill 清单

状态：候选完成，待根复核。

日期：2026-10-27。

## 交付文件

- 律师文档：`D:\Lawbeach\lawbench-B\docs\guide\连越律所工作台功能清单.md`
- 来源映射：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\LawyerSkillList-20261027-174444\source-map.md`
- 本交回件：`D:\Lawbeach\lawbench-coord\B-handback-T36-lawyer-skill-list-20261027-174444.md`

`targets.json` 只读，未修改。除上述三份新文件和两个新目录外，没有改动 README、中间文件、旧文件、源码、Skill、共用规则、契约、测试、配置、运行文件、锁或历史 T36 报告。

## 交付内容

- 读者文档列出当前 18 项 Skill，逐项写明 Skill ID、源码中文标题、通用或专用分类、用途、准备输入、产出与下一步、使用边界。
- 分类为通用 8 项、专用 10 项；分类依据只表示工作流覆盖范围，不涉及执行提供方或外部模型路由。
- “分析相关功能（保留）”严格只标四项：`contract-review`、`criminal-evidence-review`、`cross-exam-opinion`、`defense-opinion`。
- 四项均保留源码中的审查、证据整理、质证准备或辩护准备步骤，并明确法律结论由律师判断。
- 读者文档写明先保存 Markdown 草稿，再由律师点“确认保存”生成 Word，不先询问输出格式。
- 读者文档写明不提供胜算比例或诉讼策略方案，材料整理和文书流程不替代律师的法律判断。
- 案卷归档、案件 wiki、业务导航等特殊产出按各自步骤描述，没有统一宣称所有功能只输出 Markdown 或 Word。

## 核验

- 18 个当前源码 SHA-256 与固定 `index.json` 全部一致。
- 读者文档表格行 18，Skill ID 18 个且无重复。
- 四项分析标记计数为 4，且只出现于冻结的四个 Skill ID。
- 读者文档黑名单词、句式和感叹号扫描命中 0。
- 来源映射有 18 行源码矩阵、18 个完整 SHA-256、四项原句依据、分类口径、标题差异、命令与非零结果、写面、NOT_RUN 和根复核剩余项。
- 删减轮记录：读者 0 / 槽位 0 / 半句 1 / 重复 6 / 过程 1 / 黑名单 0。
- 作者运行期 0。本清单是 Markdown 文档候选，没有运行模型、HTTP、GUI、构建或全量测试。

## 旧证据复用

当前 18 个 Skill 源码与固定快照哈希一致，因此保留并复用 T36 原始 `build_skills-check.txt` 和 `check_examples.txt` 的源码同步结论；没有重跑旧开工、依赖安装、真 6000D、模型、全量回归或渲染。

## 偏离与阻碍

- 普通 `git status --short` 因子模块 `modules/dsh` 权限拒绝而退出码 1；随后用 `git status --short --ignore-submodules=all` 只读完成根仓库状态核查。既有脏项全部保留。
- 三次文本搜索误填执行器 `shell=bash`，均被 MSIX/E_ACCESSDENIED 拒绝，未读取、未写入、未改动任何源码或文件；之后均改用指定原生 PowerShell 重做。
- 一次 PowerShell 分类统计误用 `.Like()` 字符串方法，得到无效的专用计数 0；文件未变，随后用 `-like` 重做并得到通用 8、专用 10。
- 协调目录不是 Git 仓库，针对交回件的只读 `git status` 返回 “not a git repository”；未初始化仓库，不影响文件交付。
- 未修复子模块权限、index lock、沙箱、审批或 ACL。
- 未执行任何 Git 写操作，没有 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 根复核

请根复核独立读取三份决定、18 个源码、读者文档和来源映射，核对以下硬项：

- 18/18 覆盖，ID、标题、路径和 SHA 一致。
- 通用/专用分类可由源码标题或用途句支撑。
- 四项分析相关功能准确且未扩大。
- 读者文档中的输入、产出和边界没有超出源码。
- 没有删除、隐藏、改配置或替律师决定功能去留。

当前仅完成 T36 律师清单候选。Gate 1 和整个项目仍未完成；PackagingHOLD 继续有效。交付后停止。
