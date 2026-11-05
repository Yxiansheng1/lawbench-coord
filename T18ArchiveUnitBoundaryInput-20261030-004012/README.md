# T18 归档工作流闸门准备

日期：2026-10-30  
状态：`SOURCE_AND_PREP_COMPLETE / AUTHOR_RUNTIME_0 / VERIFICATION_NOT_RUN`  
执行身份：线 A 独立 DeepSeek 执行者  
执行令：`D:\Lawbeach\lawbench-coord\A-T18-archive-workflow-gate-order-20261030-003021.md`

## 1. 结论与边界

已按执行令完成三项有界源码修改和一份有限测试：

1. `case-archiving` 成为第十类机器必问问题门，四项 ID 仍从当前 Host 的真实 `SKILL.md` 读取，没有硬编码问题文本或答案。
2. 归档任务在调用 `case_archive_match` 前，必须先由同一任务收到 Core 成功且结果通过契约校验的 `case_list_materials`；`preTool` 与直接 `executeTool` 都在 Core 和预算副作用前拒绝。
3. 归档任务的 `case_save_archive_plan` 与其他成果一样受四项最终非空答案控制；通用 `QUESTION_GATED_TOOLS` 仍是原来的草稿和修改清单两项，其他九类与无 Skill 的语义没有扩展。

本文件只证明源码与准备数据已完成。没有运行 Node、Python、测试、类型检查、解析器、导入检查、构建、HTTP、模型、GUI 或原始工作流，不宣称任务门、真实模型、原生运行、DSL 观察器、业务质量或 Packaging 通过。

## 2. 复用事实

直接复用以下既有只读结论和原始证据，没有重演模型运行、安装、调研或全量测试：

- 线 B 审计：`D:\Lawbeach\lawbench-coord\B-T18-archive-order-findings-20261030-001559.md`。
- 原始实际运行：FAILED，68.156 秒，9/9 次模型 POST 均为 HTTP 200，53 个事件，`case_list_materials=0`。
- 原始运行封存包 SHA-256：`6bf29136200e908150a3f9a616c266a4e01438ef0850230ccaaebe67ef9fe571`。
- 既有 private 25：`docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752\private-output-20261029-221202`；本次复核仍为 25 个文件，`manifest.json` 58,195 B，SHA-256 `7f8e4c2b42f81e782034e742f4a46319ee338620c439e844a3223f454f208851`。

原失败保持原样，不因新增门或内存测试改写。既有人工问题中的已提取信息展示、单份 TXT 委托合同补盖章 PDF 提示、可见逐项自检和法律专业判断，仍不由本卡自动认证。

## 3. 写入面与文件 PIN

本轮主树写入面精确为：

| 文件 | 字节 | SHA-256 | 性质 |
|---|---:|---|---|
| `dsh-ext\agent\index.ts` | 50,557 | `d76bd85184e271ffb7aa10a4e8e1a5a11242aa4ae80850f02f29e94f89e94801` | 修改 |
| `dsh-ext\agent\task-state.ts` | 22,291 | `82121824045eee3e4e816caa5c066152b7e00681c39c207d49f562b399801815` | 修改 |
| `dsh-ext\tests\archive-workflow-gate-20261030-003021.spec.ts` | 29,358 | `19ba2e9269e5ec84c897a367fd815458d1eabf0994070ac60ad68146c08cbde3` | 新增 |
| 本目录 `build-private.mjs` | 32,121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | 原样复制 |
| 本目录 `build-config.mjs` | 20,463 | `9516e0f99bf42c9d8525191a2a422ad383f182a5b1dd4ec605db3f17babc9a62` | 复制后只改 3 行 |

档案正式交回件另写：

`D:\Lawbeach\lawbench-coord\A-handback-T18-archive-workflow-gate-20261030-003021.md`

没有改 B 线 `service\lawbench\tools\archive.py`、旧测试、Skills、contracts、SDK、Host、UI、endReason、旧 private 25、其他 18 棵树、39 个文件 pin、14 个引用、53 个运行时对象或 legacy 18。

## 4. 产品修改

### 4.1 第十类必问门

- 新增导出 `ARCHIVE_SKILL = 'case-archiving'`。
- `REQUIRED_QUESTION_SKILLS` 只增加 `case-archiving`，现为十类。
- `TaskState.archiveWorkflow` 默认 `false`，位置在 `sentenceWorkflow` 之后；`begin` 从实际 `begin.value.skill` 固定。
- 机器问题仍由 `ctx.lawbenchCore.skillQuestions()` 从当前 Host Skill 目录读取；不可用时继续 fail closed，没有硬编码答案或问题正文。

### 4.2 LIST 先于 MATCH

- 复用唯一 `TaskState.materialListConfirmed` 位，没有新增 Map、store 或通用状态框架。
- 固定拒绝字面量：

  `案卷归档必须先调用 case_list_materials 取得本案的真实材料清单，再调用 case_archive_match。`

- `preTool` 在 `beforeTool`、工具预算、重复调用和收尾判断前拒绝。
- 直接 `executeTool` 在 CoreClient 调用前抛同一错误。
- 只有 `case_list_materials` 的 Core 返回 `ok=true` 且 `$defs/result` 契约校验通过后，才在 `sentenceWorkflow || archiveWorkflow` 的同一任务状态上置位。
- 旧 `await` 前捕获的 `state` 继续指向旧任务；迟到成功不会写新任务、新会话或新案件。
- 这不是 `tools/result` post-policy 投递保证，也不替原生观察器承诺最终成功。

### 4.3 归档方案写入

- 保留 `QUESTION_GATED_TOOLS = { case_save_draft, case_save_edit_list }` 两项不变。
- 新增一个本地谓词，把 `archiveWorkflow && case_save_archive_plan` 接到同一个 `deliverableWritesAllowed` 判定。
- `preTool` 与直接 `executeTool` 都在 Core 前使用该谓词。
- 其他 Skill 调用 `case_save_archive_plan` 的行为不变。

## 5. 测试覆盖

新增测试共 732 行，使用虚构数据和内存 Core；其中真实 DSH 部分装配已安装的 Cordis、ToolRuntime、UserQuestionService、`ask_user_question` 和生产 `apply` hooks。

覆盖：

- 当前 Host Skill 的四项机器 ID。
- 未 LIST 的 MATCH 在 `preTool` 与直接 `executeTool` 两条路径均拒绝，Core 0、工具预算和 `budgetHit` 不变。
- 有限材料读取、MATCH 和四问前 LIST 仍可先行；不存在归档“先问后读”扩展。
- Core 清单失败、契约失败不置位；成功清单只解锁同一任务。
- 旧任务迟到 LIST、新任务、新会话、不同案件相互隔离。
- 未知问题 ID 在 UserQuestion provider 与 `pause` 前拒绝。
- 草稿和归档方案都需四项最终非空真实回答；失败、取消、空答、迟到、错调用、错 token、错会话、错案件都不计。
- 既有九类、无 Skill、草稿/修改清单两项通用门和诉讼先问后读不变。
- 真实运行时接线完成 0 LIST/MATCH 拒绝、成功 LIST 后 MATCH、四问后草稿与方案放行。

该测试中的案例、回答、工具结果和任务均为内存 fixture，明确不是 actual native history、真实模型、业务验收或法律结论。

## 6. 私有构建准备

`build-private.mjs` 与批准输入逐字节一致，32,121 B、SHA-256 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。

`build-config.mjs` 相对复制源只有三处差异：

1. 第 10 行 `EVIDENCE_ROOT` 改为本目录。
2. 第 68 行 `lawbench-agent-source.bytes` 改为 `80380`。
3. 第 69 行该树 SHA-256 改为 `b0f311fe0102ca38d6a91672ec9a421d20cf6646c577afa72965cde7a5012a3c`。

`lawbench-agent-source` 按声明的 `ordinal-path-tab-size-tab-sha256-lf-v1` 重算为 4 个普通文件、80,380 B：

| 相对路径 | 字节 | SHA-256 |
|---|---:|---|
| `README.md` | 66 | `18dad2a97b4860934be8e15e007c3bb435c222aeaf0113cb1fe9adfaee9eda32` |
| `index.ts` | 50,557 | `d76bd85184e271ffb7aa10a4e8e1a5a11242aa4ae80850f02f29e94f89e94801` |
| `repetition.ts` | 7,466 | `e21e2cb7f0d05e82ea2fae37224296188e70c9930521e8474f0992ba0593b323` |
| `task-state.ts` | 22,291 | `82121824045eee3e4e816caa5c066152b7e00681c39c207d49f562b399801815` |

其他 17 棵树、39 个文件 pin、14 个引用、输出 25 项、路径、构建标志和加载器均保持复制源原值。作者没有导入配置、运行构建或创建 private 输出根。

## 7. Git、dirty 与阻碍

- Git 全程只读；没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 默认 `git status --short --branch` 退出 1，仅因受限子模块路径 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝；未修锁、改 ACL、扩权或拆 writer 锁。随后使用只读 `git --no-optional-locks -c submodule.recurse=false status --short --branch --ignore-submodules=all` 成功。
- 当前分支为 `line-A`，相对 `origin/line-A` 为 ahead 93 / behind 1；既有大量 tracked/untracked dirty 保留，本轮只新增上表授权文件。
- 一次 exec 参数误选 `shell=bash`，被环境以 `E_ACCESSDENIED` 拒绝，命令未执行，无文件或 Git 变化；之后所有 exec 均使用指定完整 `pwsh.exe`、`login=false`。
- 私有构建准备首次 PowerShell 命令发生管道语法 `ParserError`，在预解析阶段失败，未建目录或复制；修正后目标目录才被创建。
- 未发现需要修复的 `index.lock`，也没有尝试 Git 写入或权限扩展。

## 8. 主编排下一跳

1. 对三个源码/测试文件、两个准备脚本、整个 `lawbench-agent-source` 树摘要和其余固定输入做独立逐字节反查。
2. 源码反查通过后，在一个有限窗口运行本新增测试，并补跑必要受影响的旧目标与类型检查；不得用作者自验替代。
3. 测试与类型检查通过后，才由主编排明确批准并执行一次 fresh private build；新的 private 根不得覆盖、复用或对外提供旧 25 项。
4. 私有产物再走消费者恢复、原生观察器、实际运行与人工业务复核；当前所有这些状态均为 `NOT_RUN`。

停止点：本 README 与协调目录交回件写完后停止，不执行测试、构建或 Git 写入。
