# T18 案卷归档原生链路源码交回

## 状态

`SOURCE_ONLY / BOUNDED_ADAPTATION / AUTHORED_NOT_RUN`

本目录按
`D:\Lawbeach\lawbench-coord\B-T18-archive-native-order-20261029-231046.md`
制作。作者只完成源码、批准清单和说明，没有运行 Node、Python、TSX、导入、类型检查、
测试、构建、HTTP、模型、GUI、产品路径或全量回归。因此本目录没有真实模型通过、
归档方案通过、T18 通过、发车或业务质量结论。

## 文件

| 文件 | 性质 |
| --- | --- |
| `native-archive.mts` | 从已接受的冻结消费者适配出的归档原生消费者 |
| `b-service-archive.py` | 从已接受的冻结 B 服务适配出的有限归档服务 |
| `literalfixed-inputs.json` | 归档批准输入清单；除任务名、格式和本目录两个新文件身份外，保持批准蓝图原数据 |
| `README.md` | 本说明 |

冻结基线来自
`docs\plan\evidence\T18\SentenceReadContract-20261029-224308`：

- `native-sentence-calc.mts`：164237 字节，SHA-256
  `f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8`；
- `b-service-sentence-calc.py`：50285 字节，SHA-256
  `d22b23a29b0a6f438f393fcbf755f9ca578cd17afc0e567995aa95eac70de82f`。

新文件最终身份：

- `native-archive.mts`：169674 字节，SHA-256
  `b104d5989303d27f3db1c767e061b81cddbc186774659fdfaabbfb406a2de89d`；
- `b-service-archive.py`：54372 字节，SHA-256
  `fd9d874bf1abecd9ffa75082b1fa3e68db276bbe9ddc7db36bf670dc553bd0d0`；
- `literalfixed-inputs.json`：15120 字节，SHA-256
  `dce4a3676468683a5d6e7128e1a0736353919c2227db8113dd76b4f63cfe860c`。

## 有界适配

消费者保留已接受的生产组装、Native Session、AgentLoop、真实 Host/Core、UUID
请求标识、参数、fetch 白名单、Key stdin、输出脱敏、服务停止、JSONL 关闭与重开
逻辑。只将场景接缝改为：

- `case-archiving` 原 Skill、民事测试案件和批准的任务说明；
- 10 个 TXT 原件按原三级相对目录复制，真实扫描登记 9 个材料，`~$起诉状.txt`
  由生产扫描器忽略；
- 实际工具顺序为 `case_list_materials` → `case_archive_match` → 至少一次有限
  `case_read_material` → 一次性四问确认 → `case_save_draft` →
  `case_save_archive_plan`；
- 四问 ID 为 `catalog`、`result`、`jzl_no`、`fee_settled`；
- 合成答案只在真实提问回调发生后从批准文件读取，不作为预填或伪造历史；
- 保存方案后重新读取 `工作区/任务/<任务ID>/归档方案.json`，并与模型实际调用参数
  做深度相等比较；
- 逐项引用通过真实 `GET /api/source` 回到当前材料版本核验；
- 报告保留原名、日期、映射、忽略项、方向、完整性及自检的人工验收栏。

没有要求读完全部 10 个原件，没有加入各材料读取次数、固定当事人、固定日期或固定
归档项的机器通过条件。程序只验证结构、来源绑定、顺序、真实回答和落盘一致性；
内容质量仍须主编排人工审阅。

B 有限服务只允许当前案件、任务、会话、请求下这五个契约工具：
`case_list_materials`、`case_archive_match`、`case_read_material`、
`case_save_draft`、`case_save_archive_plan`。材料名只接受真实登记集合；案件使用
民事默认目录；不启用 OCR、委托材料、默认应用 lifespan、外部 Key 或其他出站访问。

## 真实性与边界

- 不给模型看测试说明、要点或批准清单。
- 不手工创建 task/result/index、归档方案或 Native 历史。
- 不调用 T23 归档生成、归档面板、Word、GUI 或业务文件生成。
- 不读取、使用或写入真实案卷；本场景仅使用批准虚构 TXT。
- 不修改产品 A/B、Skills、contracts、tests、SDK、现有私有构建或现有产品源码。
- 不运行所内/所外服务探测，也不使用任何 API Key。

## 静态核验

作者只执行了只读检查和文件哈希计算。已完成：

- 核对批准输入的字节数与 SHA-256；
- `ConvertFrom-Json` 解析批准清单并核对 10 个材料、10 个相对路径、28 个依赖、
  4 个私有编译文件和 3 个运行时可执行文件；
- 将清单的全部批准字段与主编排蓝图逐字段比较，均为相等；
- 对新消费者和新 B 服务的最终 bytes/SHA 与清单自钉身份做相等比较；
- 对两份脚本做括号数量和尾随空白静态检查；
- 用只读 Git diff 确认变更只落在本证据目录允许的新文件中。

`STRICT_NOT_RUN`：没有执行解释器、类型检查、导入、单元测试、构建、HTTP、模型、
GUI 或真实流程。

## 主编排后续

1. 审阅本目录两份脚本、清单反向差异和全部命令面；
2. 重新运行批准清单校验，执行一次新的真实原生归档流程；
3. 原样保留失败，不通过改 prompt、放宽观察器或换答案追绿；
4. 对归档核对表、当事人/日期出处、匹配与忽略项、办案结果、缺失项、引用和逐项
   自检做人工验收；
5. 只有真实流程通过后才继续归档生成审计，本目录不主张 T23 或完整 T18 已通过。

## Git 与偏差

Git 只读状态检查先被共享 worktree 的 `dsh` 子模块权限拒绝，随后以
`--ignore-submodules=all` 查看了主仓 dirty；没有修改权限、ACL、锁或 Git 索引。
本线未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`
或 `push`，因此没有提交 SHA。

执行中有多次命令被误填为 `bash`，均由 MXC 在执行前拒绝，没有读写效果；一次
`New-Item -LiteralPath` 因该 PowerShell 运行时不支持该参数而失败，随后改用
`-Path` 完成目录创建；一次只读 PowerShell 汇总表达式出现解析错误，未写文件。
这些偏差不作为任何通过证据。其他命令均使用指定绝对路径
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
且 `login=false`。
