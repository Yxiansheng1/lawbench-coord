# A 线交回：T18 criminal-reading-notes 原生链路作者包

## 结论

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-criminal-reading-native-order-20261029-085813.md`
- 作者状态：`CRIMINAL_READING_SOURCE_READY_NOT_RUN`
- 唯一新证据目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalReadingNative-20261029-085813`
- 正式文件：
  `D:\Lawbeach\lawbench-coord\A-handback-T18-criminal-reading-native-20261029-085813.md`
- Git 提交 SHA：不适用。本运行器按令禁止 Git 写入，正式交回是文件，不是 commit。
- Gate 1：`INCOMPLETE`
- 打包：`HOLD`

源码和有限 B 服务已按原 T18 `criminal-reading-notes` 样例 01 完成有界适配。作者没有运行
消费者、admission、ESM 导入、类型/绑定检查、模型、HTTP 或真实链路，因此不能据此宣称
实际链路、业务质量、法律意见、Gate 1、完整 T18 或打包通过。

## 交付身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-criminal-reading.mts` | 121086 | `10ecad8e837ea12f46b077efdc735611ac24cfd842332631449050f521df1fe2` |
| `b-service-criminal-reading.py` | 46172 | `e161fcb0df47bd87f4473022888c0db41c9360daa30599975193bdf48285283c` |
| `literalfixed-inputs.json` | 11707 | `17fe7b58b3af630a722a92e553078d5fa66cad5fd0cf99ebf7467ebea50fcdea` |
| `README.md` | 8574 | `26656cd8ec45dadd06c784fb887eaf14253bac5f03bea7bf65a7a59af9dd8cd5` |

冻结基线为已接受的 tender 三件套：

- consumer 117979 字节，
  `19505d6ff1552b310463cefc6f7ff1d86372e810098e8c8e3b1639b08a8fa83a`；
- B 服务 46017 字节，
  `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc`；
- manifest 11289 字节，
  `9a1b38a7de5a05a2a3ddfc31e6aa11fe12836194bf899dcbb71a5f59ef6faf23`。

## 七项输入

`approved-inputs.json` 为 2706 字节，SHA-256
`7514275a52f7ff840fb5499894e6d9083585615a66e72e3bc3670b56ee3b281f`。七项的当前实际
文件已用只读 PowerShell 复核字节、SHA-256 和 `mtime_ns`：

| 角色 | 文件 | 字节 | SHA-256 | `mtime_ns` |
|---|---|---:|---|---|
| Skill | `criminal-reading-notes\SKILL.md` | 13853 | `0bc8ee2b56b5900fe7d20ce3b6310ec864b8afa789393028f945bf332e291d10` | `1792400314785867900` |
| 材料 | `样本01-张某甲诈骗全卷\起诉意见书.md` | 3033 | `e7679f4ff37a2b3754501a7c9542f40deb3fab105c3513c17600da5916607414` | `1792379578802422600` |
| 材料 | `样本01-张某甲诈骗全卷\讯问笔录.md` | 1454 | `f2949baa0f7f6faddb8f675f550db246e3e2c2d49ca84169040ff0051622ba48` | `1792379578802422600` |
| 材料 | `样本01-张某甲诈骗全卷\现场勘验图文.md` | 396 | `2679d8c0fd896a4c2cae632742aa90134cb825cbced77ba981ea8051e34c070c` | `1792379578802422600` |
| 材料 | `样本01-张某甲诈骗全卷\转账截图.md` | 230 | `8886609975be061cfa20015efea5ead6ba6bf08a461ac316f3c3b0cc5af11b35` | `1792379578802422600` |
| 任务说明 | `样本01-张某甲诈骗全卷\_任务说明.md` | 775 | `76be730e804c3953f7c94f32ee7141da127bc0e74357bd02e98455be67af2d56` | `1792379578801919300` |
| 要点 | `criminal-reading-notes\tests\要点.md` | 10867 | `05534f1d511777d4910103ca53be4f6fe30b9044bfe09f8785784ffcf22d7e02` | `1792379578805930000` |

任务说明只取第一个 `---` 前的公开正文。测试说明、派生说明、评分要点、事实清单和 expected
answer 不进入 model、L1、context 或工具注入。

## 有界修改

1. consumer 切到 `criminal-reading-notes`，新案件使用真实 `CaseRegistry` 的
   `template=criminal`、`kind=criminal`。
2. 模型参数改为 Skill 声明的 `thinking=低`、`window=64K`、`max_tokens=16384`。32 次模型、
   48 次工具、45 分钟、1200000 ms 请求/流超时和 86400000 ms 技术看门狗未放宽。
3. 唯一 synthetic question ID 为 `scope`，`fromMaterials=false`。实际 callback 在模型发出
   真实问题后回答：
   `本次只读全部 4 份材料：起诉意见书、讯问笔录、现场勘验图文、转账截图。`
4. 新增硬顺序门：成功 `case_list_materials` 结果必须先于实际 scope 提问；任何
   `case_read_material` 必须晚于实际回答。保存仍必须在全部回答之后。scope 若成功回答两次
   直接失败。
5. 四份 Markdown 由当前 B 扫描器真实登记为 `type=md`、`unit=line`；静态行数为 42、33、
   5、10。运行时仍以 B 的 `unit_count` 为准，不硬编码读取范围，不伪造 PDF 页或 OCR。
6. 四份材料必须全文覆盖，`parts/ranges/current version` 逐项核对；单读与批量返回均保留
   原有严格检查。
7. 最终草稿须来自真实 `case_save_draft` 参数，标题包含“刑事阅卷笔录”，包含用途、覆盖
   清单、指控事实与证据对应表，并引用四份材料。
8. 引用仍逐项经 `/api/source` 回读，要求当前版本、`source_changed=false`、A-E 类缺席、
   `must_fix=0`，并保留全部 F/G hints。
9. 有限 B 白名单只增加现有工具 `case_suggest_wiki`。成功建议与参数/结果摘要单独记录，
   固定标记 `validatedLawyerFacts=false`、`lawyerConfirmedCard=false`，不生成律师确认卡。
10. 非刑事四 Skill 产品 hard gate 未改，criminal-reading-notes 未被伪装成该门成员。

默认凭据 stdin、拒绝型 B 外连 transport、fetch/finally、BrowserSession、
SessionCommandController、AgentLoop、生产 JSONL、精确 PID/端口/文件所有权、OCR/retainer/
import/forward/release 关闭状态均保持。未新增路由、handler、store、loader、SDK、依赖、
模型、transport、fake wiki、fallback ID、预置 TaskState、假 Native 事件或 assistant 历史。

## 冻结与 admission

manifest 保留 346 项 reviewed B source pins（53548 字节，
`3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`）、其余 25 项既有
依赖、4 个 private compiler objects 和 3 个运行时可执行文件。raw 459 项、legacy 产物、
旧 fixture、private25 和旧运行结果未重跑、未重建、未改写。

旧 admission 的 509 不能沿用。相较 tender 场景增加一份 Markdown 和一条批准输入，主编排
必须在当前源码上重新计算并核对精确 511；作者没有伪造新的 admission 结果。

## 人工复核线索

以下只供主编排真实运行后人工核对，不进入任何模型/工具输入：

- 核对三笔钱、日期、金额和证据对应；第三笔卷内缺外部印证只能如实标缺失。
- 第二笔讯问笔录金额含不可读 `■`，不得补成完整值。
- 第二笔“借款”辩解与“解冻费”指控并列，不作事实取舍。
- 讯问同日拘留、记录人同侦查员、勘验未载见证人只照原文记录，不写违法/无效/排除。
- 退赔 20000 元只见起诉意见书，卷内未见凭证；法律定性须由律师核实。

机器题目措辞不设 literal PASS。主编排须读真实 question text，人工确认它列出任务已给的全部
四份范围；机器只证明真实列材料、提问、回答、读取、保存时序。

## Git 与写入面

- before dirty 快照：
  `D:\Lawbeach\lawbench-coord\T18CriminalReadingNativeInput-20261029-085813\A-dirty-before.txt`
- 开工时普通 `git status` 仍被共享 worktree 子模块 `dsh` 的 `.git` 路径权限拒绝；未修 ACL、
  锁、审批或 worktree。
- 全部 Git 命令只读；没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 本任务写面只有：新建唯一证据目录；复制并改写三个源码/清单副本；新增 README；新增本交回
  文件。既有 dirty 文件、输入目录、B 源、private25、raw 和旧证据均未写。
- 目标目录窄状态只显示四个 untracked 文件；没有 index.lock 问题处理，也没有 writer 锁
  或权限扩展。

## 验证与 runtime

只做只读文本读取、`rg`/`Select-String`、`Get-FileHash`、`Get-Item`、文件复制、
`git status`/`git diff --no-index` 和会话原始调用预算核对。

产品运行期计数全为 0：consumer 0、Agent 0、Session 0、Context 0、Task 0、Case 0、
model request 0、HTTP request 0、ESM/import 0、type/check/test/build 0、DPAPI/Key 0。
没有启动 Node、Python、解析器/AST、HTTP、GUI、SSH、setup 或安装。

## 实际 Shell 调用与阻碍

原始会话日志：
`C:\Users\morel\Documents\Codex\desktop-profiles\deepseek\codex-home\sessions\2026\10\29\rollout-2026-10-29T08-58-22-01a1852a-4562-7be2-91d4-5f63184411e8.jsonl`。
按其中的 `function_call`/`function_call_output` 原始记录核对：

- Shell 调用总数 `97`；
- 指定绝对路径 native PowerShell `87`；
- 短名 PowerShell `3`，均为只读检查；
- bash 选择器 `7`，均在命令启动前被运行器拒绝，未执行命令、未改文件；
- 非零退出 `20`，全部是下列只读/阻碍项，没有产品命令失败。

非零序号与原因：

| 序号 | 退出码 | 原因 |
|---:|---:|---|
| 2 | 1 | 普通只读 Git status 被共享 `dsh` 子模块 `.git` 权限拒绝。 |
| 29、37、38、46、60、70、73 | 1 | 七次 shell 选择器误写为 bash，运行器启动前拒绝。 |
| 50、55、78、82 | 1 | 只读 `rg` 无匹配或模式因引号写法无效；未执行产品命令。 |
| 52 | 1 | 只读 `rg` 中一处 PowerShell 引号导致正则解析错误。 |
| 68、69、71 | 1 | 三次 `git diff --no-index` 确有三块源码/清单差异，按约定退出 1；69 使用短名 PowerShell。 |
| 85 | 1 | 首次只读会话日志列举脚本的 PowerShell 管道语法错误。 |
| 89 | 1 | 首次读取活动中的会话日志因共享占用失败；改用 `Get-Content` 后完成。 |
| 95 | 1 | 证据目录哈希与状态成功；同一命令内把协调目录文件误交给 A 仓库 status，后者退出 1。 |
| 96 | 1 | 协调目录不是 Git worktree；对其单独 status 退出 1。未尝试修复。 |

未发生任何产品、测试、模型、HTTP、凭据或运行时失败。所有实质写入均通过 `apply_patch`
或原生 PowerShell 对唯一目标目录的机械复制完成。

## 主编排后续

主编排须完成：

1. 全文与最小差分复核四个交付文件、七项输入、346 pins、25 个保留依赖、private4、
   executables3、raw459 和 legacy；
2. 静态绑定/setup/finally/ESM 准入，并重新计算 511 admission；
3. 仅在准入通过后，用既有匿名 stdin 与已保存 DPAPI 路径执行一次 actual，采集四次材料
   read、scope 时序、citation hints/source GET、落盘草稿、JSONL close-reopen deepEqual
   和 OS 所有权关闭；
4. 人工判断真实题目是否已列四份范围，以及草稿事实、识别不清、程序信息、法律定性和
   `■` 保全。

作者到此停止。
