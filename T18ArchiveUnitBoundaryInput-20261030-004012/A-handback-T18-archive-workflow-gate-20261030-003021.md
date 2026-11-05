# 线 A 交回：T18 归档工作流闸门

## 1. 状态与出处

状态：`SOURCE_AND_PREP_COMPLETE / AUTHOR_RUNTIME_0 / ROOT_VERIFICATION_AND_BUILD_NOT_RUN`

执行令：

`D:\Lawbeach\lawbench-coord\A-T18-archive-workflow-gate-order-20261030-003021.md`

仓库内正式交付说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ArchiveWorkflowGate-20261030-003021\README.md`

本轮按执行令复用既有 B 审计、原始 FAILED 运行和 private 25，没有重演开工、安装、调研、模型、HTTP、全量测试或构建。原失败与人工业务问题保持原样。

## 2. 写入面

只写以下授权对象：

| 对象 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 50,557 | `d76bd85184e271ffb7aa10a4e8e1a5a11242aa4ae80850f02f29e94f89e94801` |
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts` | 22,291 | `82121824045eee3e4e816caa5c066152b7e00681c39c207d49f562b399801815` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\archive-workflow-gate-20261030-003021.spec.ts` | 29,358 | `19ba2e9269e5ec84c897a367fd815458d1eabf0994070ac60ad68146c08cbde3` |
| `...\ArchiveWorkflowGate-20261030-003021\build-private.mjs` | 32,121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `...\ArchiveWorkflowGate-20261030-003021\build-config.mjs` | 20,463 | `9516e0f99bf42c9d8525191a2a422ad383f182a5b1dd4ec605db3f17babc9a62` |
| `...\ArchiveWorkflowGate-20261030-003021\README.md` | 9,313 | `80a01c838b924c92bdc196315d655a16f998073d2c65febcab312013ea237e5a` |

本文件是最后一项协调目录写入。没有改 B 的 `service\lawbench\tools\archive.py`、旧测试、Skills、contracts、SDK、Host、UI、endReason、旧 private 25、其他树 pin、legacy 18 或工单集。

Git 只读，没有新增提交，故无提交 SHA。分支 `line-A` 保持 `ahead 93 / behind 1`；既有 tracked/untracked dirty 保留，本轮只新增上述授权对象。

## 3. 产品行为

- 新导出 `ARCHIVE_SKILL='case-archiving'`；必问门只增加这一类，成为第十类。四项问题继续由当前 Host 的 Skill 元数据提供，不可用时 fail closed。
- `TaskState.archiveWorkflow` 默认 `false`，在 `sentenceWorkflow` 后；`begin` 只从实际 `begin.value.skill` 固定。
- `archiveWorkflow && case_archive_match && !materialListConfirmedForReads` 在 `preTool` 和直接 `executeTool` 的 Core 前拒绝。固定提示为：

  `案卷归档必须先调用 case_list_materials 取得本案的真实材料清单，再调用 case_archive_match。`

- 复用既有 `materialListConfirmed`；仅当同一任务的 `case_list_materials` Core 成功且结果契约通过后，为 sentence 或 archive 置位。`await` 前捕获 state，迟到结果只落旧 state。
- `QUESTION_GATED_TOOLS` 仍精确为 `case_save_draft`、`case_save_edit_list` 两项。另一位谓词仅对 archive 任务的 `case_save_archive_plan` 复用 `deliverableWritesAllowed`；`preTool` 与直接执行均覆盖，其他 Skill 不变。
- 没有归档“先问后读”扩展：有限材料读取、LIST、MATCH 可在四问前进行；LIST 仍是 MATCH 前置。

## 4. 新测试

新测试 732 行，使用虚构内存 fixture；真实运行时部分装配已安装的 Cordis、ToolRuntime、UserQuestionService、`ask_user_question` 和生产 `apply` hooks，CoreClient 仅内存 mock，不监听端口、不访问模型或网络。

覆盖：

- 从当前 Host Skill 读取 `catalog/result/jzl_no/fee_settled` 四项机器 ID。
- LIST 前 MATCH 的 `preTool` 与直接执行双路径拒绝；Core 0，工具预算和 `budgetHit` 不变。
- 有限读取、LIST、MATCH 可在联合四问前执行；成功 LIST 只解锁同一任务。
- Core 失败、结果契约失败不置位；旧迟到 LIST、新任务、新会话、不同案件隔离。
- 未知问题 ID 在 provider 与 `pause` 前拒绝。
- 草稿与归档方案都要四项最终非空答案；失败、取消、空答、迟到、错调用、错 token、错会话、错案件全部不计。
- 既有九类、无 Skill、原两项通用写入谓词和诉讼先问后读不变。

这些 fixture 明确不是 actual native history、真实模型结果、业务验收或法律结论。

## 5. 私有构建准备

`build-private.mjs` 是批准输入的逐字节副本，32,121 B、SHA-256 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。

`build-config.mjs` 相对 Sentence 版复制源只有第 10、68、69 行不同：

- 第 10 行 `EVIDENCE_ROOT` 改到本证据目录。
- 第 68 行 agent 树 bytes 改为 `80380`。
- 第 69 行 agent 树 SHA-256 改为 `b0f311fe0102ca38d6a91672ec9a421d20cf6646c577afa72965cde7a5012a3c`。

按 `ordinal-path-tab-size-tab-sha256-lf-v1` 独立用 PowerShell 重算：

`4 files / 80,380 B / b0f311fe0102ca38d6a91672ec9a421d20cf6646c577afa72965cde7a5012a3c`

配置中的 bytes 与 digest 均与现场一致。其他 17 棵树、39 个文件 pin、14 个引用、25 项输出、路径、标志和加载器保持复制源原值。没有导入配置、执行 Node 或创建私有输出根。

旧 private 25 仍为 25 个文件，`manifest.json` 58,195 B、SHA-256 `7f8e4c2b42f81e782034e742f4a46319ee338620c439e844a3223f454f208851`。

## 6. 实际命令、非零与验证边界

所有 exec 均要求完整 `pwsh.exe`、`login=false`。读文件、Hash、只读 Git、树摘要与配置比对均为内存读取或 PowerShell 计算；没有运行 Node、Python、TypeScript、AST/解析器、导入检查、测试、类型检查、构建、HTTP、模型或 GUI。

实际命令按阶段：

1. `Get-Content -Raw` 正式执行令。
2. 只读读取事实索引、B findings、PROJECT-PROFILE、T18 工单、Agent/TaskState/运行时蓝本、Host Skill 与契约样例。
3. `git --no-optional-locks -c submodule.recurse=false status --short --branch --ignore-submodules=all` 及同参数的只读 `diff`。
4. `Get-FileHash`、`Get-Item`、`Get-ChildItem`、`Select-String` 核对源、测试、配置、例子与 private 25。
5. PowerShell 内存算法计算 canonical tree digest。
6. `Copy-Item` 逐字节复制两个准备脚本；`apply_patch` 只改配置授权 3 行并写产品、测试和 README。
7. 最后再次只读计算 digest、配置差异、交付 SHA 与授权写面。

非零共三项：

- 初次默认 `git status --short --branch` 退出 1：子模块路径 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝；随后改用只读禁用子模块递归成功。未修锁、改 ACL、扩权或拆 writer 锁。
- 一次 exec 参数误选 `shell=bash`：环境返回 `E_ACCESSDENIED`，命令未执行，无文件/Git 状态变化；后续全部锁定指定 PowerShell。
- 私有构建准备首次 PowerShell 命令因 `foreach ... } | Format-List` 语法在预解析阶段报 `ParserError`，未建目录、未复制；修正为 `$out=@(...)` 后成功。

没有发现需要修复的 `index.lock`，没有尝试 Git 写入或权限扩展。

`STRICT_NOT_RUN`：测试、类型检查、构建、私有 runtime、消费者恢复、原生观察器、真实模型、实际工作流、业务质量、T23、T18 全卡 PASS、五门和 Packaging。

## 7. 主编排下一跳

1. 独立逐字节反查三个源码/测试文件、两个准备脚本和 agent 4 文件树摘要，并确认其余输入保持固定。
2. 源码反查通过后，在有限窗口运行新测试及必要受影响的旧目标、类型检查。
3. 测试与类型检查通过后，才批准一次 fresh private build；新输出根不得覆盖、复用或服务旧 private 25。
4. 构建后再做 DS 消费者恢复、原生运行和人工业务复核。当前所有后置状态均为 `NOT_RUN`。

本文件落盘后停止。
