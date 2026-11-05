# B 交回：T18 contract-draft 依赖身份修复

日期：2026-10-29

执行线：B

状态：`AUTHORED_NOT_RUN`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 只修改固定输入清单三处字面值：重复 `contract-draft-skill` 依赖行的字节数/SHA-256，以及 `bService.bytes`。按对象边界反演可逐字节恢复交来快照，并同步更新本目录 README。 |
| 目标是什么 | 让固定清单的重复 Skill 依赖和 bService 自身身份都与当前源码一致，供 ROOT 继续全源复核与准入。 |
| 在等什么 | 等 ROOT 按执行令复核完整命令、源码、反演及 ESM，再处理后续批准、pins/private 身份和一次同 canonical 实际运行。 |
| 卡在哪 | 本轮工作没有停摆。整体 Git 状态仍被既有子模块路径权限拒绝；按令不修锁、不改 ACL、不扩权，也不执行任何 Git 写操作。 |

## 依据

正式执行令：

`D:\Lawbeach\lawbench-coord\B-T18-contract-citation-dependency-fix-order-20261029-052932.md`

交来快照目录：

`D:\Lawbeach\lawbench-coord\T18ContractCitationDependencyFixInput-20261029-052932\`

证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCitationRuntime-20261029-052404\`

原交回件 `B-handback-T18-contract-draft-citation-runtime-20261029-052404.md` 未改动。

## 当前身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `literalfixed-inputs.json` | 10764 | `f95d9914a0731cbedf5dc74337c7ad4309c9cf85bdd1c8aa4f07b20f4974fc70` |
| `README.md` | 9652 | `29b920b9e942da46d0f0649c0bda746d969adbc973f2a2a093e70d5a21266ef6` |
| `native-contract-draft.mts` | 106236 | `bf32c30e5db712b47562777fbdf53609870c2082ac0bff5ebc6aa0678ce9edbc` |
| `b-service-contract-draft.py` | 45459 | `3f27074c34033b03c38b3d97d6534f600de12fdfac690ce9e391c4a3feeba34e` |
| `skills\contract-draft\SKILL.md` | 13469 | `92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912` |
| 批准输入 `approved-sample-and-skill-current.json` | 1286 | `1266d329ae41e193f81b2ae0ae6cbd94ee285ad1444db5e03c738de3cb7a7b49` |

交来快照中的三份文件与当前 MTS、服务及修改前清单身份一致。当前 MTS 和服务的身份也分别保持 `bf32c30e…edbc`、`45459/3f27074c…ea34e`。

## 三处精确改动

只编辑：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCitationRuntime-20261029-052404\literalfixed-inputs.json`

依赖数组中 role 为 `contract-draft-skill` 的同一行：

| 字段 | 修改前 | 修改后 |
|---|---|---|
| `bytes` | 12866 | 13469 |
| `sha256` | `bfd44f5e3e970d95fe961df3d7298b67b9dc6f37cd5de7f825ea902c889b4012` | `92bd83d9fcd18a05584595292bd56828835d347a2862353259816ca66213b912` |

该行 path、role、位置均未变，重复行和断言未删除。顶层 `skill` 本来就是 13469/`92bd83d9…b912`，因此不能按新值全局替换。

`bService`：

| 字段 | 修改前 | 修改后 |
|---|---:|---:|
| `bytes` | 45447 | 45459 |

`bService` path 和 SHA-256 原本已与实际服务一致。服务源码没有发生字节变化；这里只修正清单对服务自身大小的错误描述。

以下内容未改：批准输入对象、顶层 `skill`、consumer、source pins、两份 materials、四条 compilerPrivate、runtime executables、其他依赖、参数、提示词、断言、预算、运行配置和产品源码。

## 反演证据

交来清单快照为 10764 字节、SHA-256 `342038ae51a38f68aabc639b69eff8ea82d8bbb2277afa62c77e527f57e22fdf`。

最终清单仍为 10764 字节，当前 SHA-256 为 `f95d9914a0731cbedf5dc74337c7ad4309c9cf85bdd1c8aa4f07b20f4974fc70`。在内存中按 `contract-draft-skill` 对象和 `bService` 对象边界反向替换三处字面值后，结果为：

- 逐字节等于交来快照：`TRUE`。
- 恢复字节数：10764。
- 恢复 SHA-256：`342038ae51a38f68aabc639b69eff8ea82d8bbb2277afa62c77e527f57e22fdf`。

早期一次诊断尝试按新值全局反向替换，因顶层 `skill` 与依赖行同值而不能恢复；该尝试被明确否决，没有作为证据。正式反演改用完整对象边界，已逐字节通过。

## 验证边界

`AUTHOR_RUNTIME=0`。本轮没有执行产品源码、Node、Python、tsx、解析、导入、AST、检查、测试、构建、prepare、ESM 运行、HTTP、模型或 GUI；没有访问 SSH、Key、环境凭据或 DPAPI；没有启动或关闭服务；没有写临时文件。

只使用原生 PowerShell 做 UTF-8 文本读取、字节计数、SHA-256 计算和内存字符串反演。

标准 `git status` 在旧 `lawbench-B-new/modules/dsh` 子模块路径遇到 `Permission denied`。按路径查询显示当前清单和 README 为未跟踪文件；这一事实只记录，不修锁、不改 ACL、不扩权。没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 完整命令台账

本任务含生成后的只读回读，共 29 次工具调用：

1. 原生 PowerShell 全文只读正式执行令。
2. 读取当前 `literalfixed-inputs.json`，记录 10764/`342038…fdf` 并显示全文。
3. 列出运行目录，读取当时的 README。
4. 尝试只读 ROOT 审核 JSON和交来快照；PowerShell 引号解析失败，未产生文件或运行行为。
5. 只读 Git 状态、分支和 HEAD；整体状态因既有子模块权限失败，未做写操作。
6. 完整读取 ROOT 引用澄清审核 JSON，2975/`32b784…bc0d`。
7. 列出交来快照目录的三个文件及身份。
8. 只读实际 Skill 和 bService，确认 13469/`92bd83…b912`、45459/`3f2707…ea34e`。
9. 只读路径限定 Git diff/status，未显示差异。
10. 只读当前 MTS、bService、清单身份。
11. 只读交来快照三文件身份，并确认与当前对应文件一致。
12. 做初版内存差异诊断；退出码为 0，但全局反演方法被判定无效，不作为验证结果。
13. 用精确 patch 修改清单三处字面值。
14. 按对象边界做内存反演，并读取路径限定 Git 状态；反演逐字节通过，路径为未跟踪。
15. 只读确认目标交回件尚不存在。
16. 只读列出既有 B 交回件，确认旧正式交回件存在。
17. 只读读取上一份 T18 contract-draft 运行时交回件。
18. 只读读取上一份 T18 contract-draft 运行时交回件。
19. 用精确 patch 更新当前 README 的清单身份、重复依赖行和 bService 校正。
20. 只读校验依赖行和 bService 对象的目标字段各命中一次，记录清单 10764/`f95d99…fc70`。
21. 只读复核 MTS、服务、Skill、批准输入和 ROOT 审核 JSON 的身份。
22. 只读检索 README；发现其中仍有前一轮四对象描述和旧 bService 字节，未作为最终证据。
23. 只读复核交来快照仍为 10764/`342038…fdf`，目录源码身份未变。
24. 只读读取 README 相关行，定位待清理的前轮措辞。
25. 用精确 patch 清理 README 的前轮四对象与旧 bService 描述，并写清三字面值反演范围。
26. 最终只读校验：清单 10764/`f95d99…fc70`，README 9652/`29b920…6ef6`，目标值各命中一次，路径限定 Git 状态为两项未跟踪。
27. 创建本正式交回件。
28. 用精确 patch 校正本台账的调用编号和总数。
29. 生成后只读回读本交回件，核对路径、关键身份和状态文字。

## 后续门

本轮只完成有界身份修复，不宣称模型通过、部署包或真实场景成功。ROOT 仍需复核完整命令、全部源码、反演和 ESM；按执行令处理新 5 字面值批准 `45918B`、346 pins、25 private 身份，然后由 A 线执行同一 canonical 实际运行直至闭包，不得停在 prepare 或 launch。

Gate 1：`INCOMPLETE`。完整 T18：`INCOMPLETE`。项目：`INCOMPLETE`。Packaging：`HOLD`。

Response ID：`B-T18-contract-citation-dependency-fix-20261029-052932`

Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T18-contract-citation-dependency-fix-20261029-052932.md`
