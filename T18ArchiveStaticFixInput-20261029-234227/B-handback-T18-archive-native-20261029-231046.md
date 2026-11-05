# B 交回：T18 案卷归档原生链路源码

## 状态与结论边界

`SOURCE_ONLY / BOUNDED_ADAPTATION / AUTHORED_NOT_RUN`

本线按 `B-T18-archive-native-order-20261029-231046.md` 完成源码制作并停止。
作者没有运行 Node、Python、TSX、导入、类型检查、测试、构建、HTTP、模型、GUI、
产品路径或全量回归，因此不声称真实模型通过、归档方案通过、T23 通过或完整 T18
通过。下一步是由主编排审阅并执行一次真实原生流程。

正式交付是文件交回，不是 Git 提交。本线未执行任何 Git 写操作，没有提交 SHA。

## 新文件

目录：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveNative-20261029-231046\`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-archive.mts` | 169674 | `b104d5989303d27f3db1c767e061b81cddbc186774659fdfaabbfb406a2de89d` |
| `b-service-archive.py` | 54372 | `fd9d874bf1abecd9ffa75082b1fa3e68db276bbe9ddc7db36bf670dc553bd0d0` |
| `literalfixed-inputs.json` | 15120 | `dce4a3676468683a5d6e7128e1a0736353919c2227db8113dd76b4f63cfe860c` |
| `README.md` | - | 见文件 |

冻结基线：

- MTS：164237 字节，`f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8`
- B 服务：50285 字节，`d22b23a29b0a6f438f393fcbf755f9ca578cd17afc0e567995aa95eac70de82f`

基线均取自
`docs\plan\evidence\T18\SentenceReadContract-20261029-224308`，与执行令指定的
当前接受版本字节和哈希一致。

## 完成内容

消费者继续使用现有生产组装、Native SessionController/AgentLoop、真实 Host/Core、
真实任务 UUID、真实 B CaseRegistry、JSONL 关闭重开和资源清理，只把场景接缝改为
`case-archiving` 与民事测试案件。

批准原件为 10 个 TXT，复制时保留原相对三级目录，包括
`03一审/我方文件/~$起诉状.txt` 和
`03一审/我方证据/微信图片_20260301.txt`。真实扫描器预期登记 9 个材料，临时文件
由生产扫描器忽略；匹配器再按自身规则决定微信图片的忽略。

真实流程验收顺序为：

1. `case_list_materials`；
2. `case_archive_match(catalog="民事行政卷")`；
3. 至少一次有限的 `case_read_material`；
4. 一次性真实 `ask_user_question`，精确回答
   `catalog/result/jzl_no/fee_settled`；
5. `case_save_draft` 保存“归档核对表”；
6. `case_save_archive_plan` 保存 13 字段归档方案；
7. 重读 `工作区/任务/<任务ID>/归档方案.json`；
8. 用真实 `GET /api/source` 核验草稿引用的当前材料与位置。

四问的 `result=调解` 只来自批准合成答案，不是新的人类回复。答案文件仅在真实提问
回调完成后读取；没有预填、伪造历史或直接写任务状态。

归档方案参数与落盘文件做深度相等比较；材料名必须来自实际
`case_list_materials` 返回集合，归档项编号必须来自真实匹配结果。没有要求读完全部
10 个材料，没有按固定当事人、日期、归档项或法条关系追绿。原名、日期、匹配、
忽略项、结果立场、缺失项、引用和逐项自检保留为主编排人工验收项。

## 请求与安全面

B 有限服务只挂现有路由，限放当前案件/会话/任务/R 下的五个工作流工具：

- `case_list_materials`
- `case_archive_match`
- `case_read_material`
- `case_save_draft`
- `case_save_archive_plan`

材料读取名只接受真实登记的 9 个名称；未知名称、跨任务、额外字段和路由外请求在
Core 前拒绝。案件使用 `civil` 模板和 `civil` 类型，只创建民事默认目录。未启用
OCR、委托材料、默认应用 lifespan、外部 Key 或其他出站访问。

没有增加通用管线、存储、归档生成、HTTP 端点、prompt 变体或业务文件副作用。未
调用 T23 归档生成、Word、GUI、真实案卷或真实发票。

## 公共实现保持

MTS 中未改的公共装配与安全函数包括 `isolateProcessFiles`、
`readCredentialFromStdin`、`installOutputRedaction`、`installFetchAllowlist`、
`startBService`、`settleOwnedCoreTask`、`createTaskSettlement`、
`requestHeaderAtBoundary`、事件/工具结果读取、环境恢复和服务清理。两个既有绝对
编译导入路径原样保留。

B 服务中的 token stdin、环境清理、loopback socket、lifespan off、禁用 Key/外连、
资源 finally 清理、JSONL/日志关闭等公共代码保持不变。实际改动的函数仅为：

- `approved_case_inputs` / `copy_approved_case` / `verify_private_case`：归档原件、
  9 个登记名和民事目录；
- `FiniteFirewall._check_post` / `_check_get` / 响应记录 / `evidence`：五个归档工具
  与真实 match/plan 观察；
- `run_service` / `main`：场景计数、停止成功条件和用法文字。

## 清单审计

`literalfixed-inputs.json` 从主编排蓝图复制。以下批准字段与蓝图逐项 JSON 相等：

- `approvedInputs`
- `sourcePins`
- `authorizedSyntheticAnswers`
- `canonicalTask`
- `skill`
- `materials`
- `referenceNotes`
- `dependencies`
- `compilerPrivate`
- `runtimeExecutables`

只改了格式名和任务名，并更新本目录消费者/B 服务的 bytes/SHA。清单计数为 10 个
材料、28 个依赖、4 个现有私有编译文件、3 个运行时可执行文件。当前私有 4 项仍为
`7f8e…`，两个既有绝对编译导入路径未改。

## 执行命令与静态核验

所有成功执行的 shell 命令均使用执行令指定绝对路径原生 PowerShell 且
`login=false`。完整命令面按以下模板记录（同一命令对多个路径重复时用路径组表示）：

- `Get-Content -Raw -LiteralPath <执行令/Skill/契约/Core源码/基线>`
- `$lines = Get-Content -LiteralPath <工单/长源码>; $lines[<起>..<止>] -join "\`n"`
- `Get-ChildItem -LiteralPath <批准样本或证据树> ... | Get-FileHash`
- `rg -n <模式> <service/contracts/skills/A dsh-ext/coord>`
- `git status --short --branch`（失败）与
  `git status --short --branch --ignore-submodules=all`（只读成功）
- `New-Item -ItemType Directory -Path <本新证据目录>; Copy-Item -LiteralPath
  <两份冻结基线> -Destination <本新证据目录内目标>`
- `Get-Item ... | Select-Object FullName,Length` 与
  `Get-FileHash -Algorithm SHA256 -LiteralPath ...`
- `Get-Content -Raw ... | ConvertFrom-Json` 及只读对象计数/字段比较
- `git diff --no-index --stat|--check -- <冻结基线> <本新对应文件>`
- PowerShell `[regex]::Matches`：括号/方括号/大括号和制表符静态计数
- `apply_patch`：只写本新证据目录四个文件及本交回件

没有写产品文件、锁、ACL、Git 索引或生产目录。

未运行验证项目统称：`STRICT_NOT_RUN`。包括 Node、Python、TSX、AST/Python 导入、
类型检查、单元测试、契约运行、构建、HTTP、模型、GUI、全量回归和真实流程。

## 偏差与阻碍

- 初次 `git status` 因共享 worktree 的 `dsh` 子模块目录权限拒绝。随后使用
  `--ignore-submodules=all` 只读核对，不修 index.lock、权限、ACL、审批或 writer 锁。
- 初次 `New-Item -LiteralPath` 因该 PowerShell 构建不支持该参数而失败，未创建文件；
  改用 `-Path` 成功。
- 执行中多次将只读命令的 shell 误填为 `bash`。这些调用均由 MXC 在执行前拒绝，
  没有读取、写入或状态变化；此后恢复指定绝对 `pwsh.exe`。
- 一次只读 PowerShell 汇总表达式因空管道元素解析失败，未执行、未写文件。

## 主编排下一步

1. 全文审阅新消费者、B 服务、批准清单反向差异和命令面；
2. 运行清单/类型/依赖准入后，只执行一次新的真实归档原生流程；
3. 原样保留失败，不以改 prompt、放宽观察器、换答案或重跑同源追绿；
4. 人工核验原名、日期出处、逐项匹配、忽略项、办案结果、缺失项、引用和自检；
5. 再于独立范围审计 T23 生成。本交回件不主张 T23 或完整 T18 已通过。
