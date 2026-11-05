# B 线交回：T18 出稿前检查输出小节契约修正

## 结论

状态：`SOURCE_ONLY_STOPPED_AWAITING_ROOT_FINITE_REVIEW`。

已按主编排确认的单一缺陷，将 `hasExactlyFiveNumberedSections` 的历史谓词
`numberedSections.length === 5` 改为 `numberedSections.length >= 5`。除该谓词外，
consumer 主源码没有其他改动；B service 整体字节不变；产品源码、Skill、contracts、
测试与运行时源码均未修改。

作者侧未执行 consumer、service、Node、Python、TypeScript、VM、模型、HTTP、GUI
或完整测试。未据此宣称消费者、业务、法律、Gate 1 或 T18 通过。

## 新证据目录

根目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-pre-issue-check.mts` | 153232 | `86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536` |
| `b-service-pre-issue-check.py` | 53737 | `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924` |
| `literalfixed-inputs.json` | 13570 | `516092888809b9e06794bd9fa1277a52a236e31b1533999ed7e3dfd2f923c33f` |
| `README.md` | 8120 | `9b70b2079e27889a7de37f871fa20df364f00b2eed2993907fc14622a4b0a6af` |
| `section-check-finite.mjs` | 21089 | `8eaf9e01588d310396883fd4c0bea903c792c0e067b9124b04e37b2a7714229b` |

目录内目前没有结果 JSON。

四个输入件先从协调目录原样复制。随后仅修改 consumer 的一个源码字符以及 README
中与已确认契约冲突的表述。`b-service-pre-issue-check.py` 和
`literalfixed-inputs.json` 与输入逐字节一致。

## 源码差异

输入候选：

- 字节：153233
- SHA-256：`d67d4ee3f79f6654f01e62c38c88b02764e8a6402efd0e164d893d76b7d06430`

输出源码：

- 字节：153232
- SHA-256：`86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536`

只读字符串替换核对结果：`ExactOneReplacement=True`，源文本长度减少 1；旧谓词在
输入中仅出现一次，新谓词在输出中仅出现一次。没有用 AST、Node、TypeScript 或 VM
执行该核对。

## 有限检查器

`section-check-finite.mjs` 已写好但未执行。实现边界包括：

- CLI 仅接受绝对的 `--source`、`--source-sha`、`--result`。
- 只接受本目录的修正后 MTS、153232 字节及上述精确哈希。
- 在 stdin 收到单行 `ROOT_PREISSUE_SECTION_RECEIPT` 后，才读取固定 TypeScript、
  创建 AST 或在私有 VM 中执行。
- 固定 TypeScript 路径、字节及哈希为主编排给定值，无新依赖。
- AST 只提取 `CANONICAL_DRAFT_TITLE` 与 `assertDraftMachineChecks`。
- 不执行 consumer main、import、Agent、Session、SDK、service、模型或凭据路径。
- 8 个有效场景使用纯占位内容：3 个正面、5 个预期失败。
- 另有两个 `controlled-old` 红控，只把提取函数的唯一谓词反向，用于证明旧规则会
  拒绝补充小节与节内中文序号。
- 预期失败只接受私有 VM 抛出的原生 `Error`，并核对
  `pre-issue output machine checks failed:` 后的精确失败键。
- 结果只能直接新建在自身证据根目录，拒绝 reparse/symlink 路径，使用 `flag: 'wx'`
  防止覆盖。
- 执行前后复核源码字节与哈希；进程内拦截 `fetch`、DNS、socket、HTTP(S) 与 TLS，
  不声称整机零网络。

主编排须先完整复核脚本、清理路径和实际命令，再决定是否执行。收据应在外部观察
PID、可执行文件和 UTC 启动时间后发送。

## 既有状态与 Git 边界

顶层 dirty 状态已只读核验并保持原样。普通
`git status --short --branch` 因只读边界下无法进入 `dsh` 子模块工作树而失败，随后用
`--ignore-submodules=all` 取得顶层状态；没有尝试修复权限、改锁、改 ACL 或扩权。

未执行任何 Git 写操作，包括 add、commit、rebase、stash、reset、clean、checkout
或 push。由于本任务禁止提交，本次交回不提供提交 SHA。

旧候选目录 `PreIssueCheckNative-20261029-201144`、旧 raw/status/formal 和协调目录
输入均未修改。输入候选 consumer 与 B service 的哈希在同目录旧证据中仍逐字节一致。

## 主编排给定身份

已只读核验：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `root-approved-entry-identity.json` | 106 | `76d55cdfd35d210c57baab99d9625e907e61b68d4a0a07025fe098c87e685f50` |
| `root-approved-manifest-data.json` | 13579 | `487734032ca411e85e9935f33f69dd3d92744e7139211414d6a52c9d4d5ba4fe` |
| `root-review.json` | 1717 | `bac4ae28d069362b398b52a8833391ecb19955b9f4ac76cad609868638d1ab59` |

没有改用工单或旧 manifest。`literalfixed-inputs.json` 保持输入快照字节，内含旧路径
和历史任务名，仅作冻结来源保留；有限检查器不读取该 JSON，也不据此执行 consumer。

## 偏差与阻碍

- 本续办会话有 3 次 `exec_command` 误传 `shell=bash`，均在 MXC 启动前被拒绝，
  没有执行任何命令。其余有效作者命令均使用指定的完整原生 PowerShell 和
  `login=false`。
- 一次只读 `git status` 因只读边界下子模块工作树权限被拒；未采取修复动作。
- 一次只读哈希清单命令因 PowerShell 管道构造语法错误在解析阶段失败；修正后重跑，
  没有写入文件。
- 最终只读核对中，把协调目录绝对路径交给 B 仓库 Git 时被 Git 以跨仓库路径拒绝；
  在协调目录运行 `git status` 又确认该目录不是 Git 仓库。两项均未执行写入。
- 一次机密模式扫描命令因 PowerShell 引号转义在解析阶段失败；改用无嵌套引号的简单
  模式重跑，结果为空、无匹配。

## 下一步

1. 主编排完整复核 `section-check-finite.mjs`。
2. 在观察 PID、可执行文件和 UTC 启动时间后发送规定收据，执行一次有限检查。
3. 审阅新建结果并取得 `SECTION_CONTRACT_FINITE_PASS`，但这仍不等于消费者或业务通过。
4. 再按令完成 ESM/BAST/作用域绑定及字面量准入，之后才决定是否执行一次原始
   pre-issue actual。

`Packaging: HOLD`。
