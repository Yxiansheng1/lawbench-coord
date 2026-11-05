# T18 pre-issue-check 输出小节契约修正

## 状态

`SOURCE_ONLY_NOT_RUN`。本目录是 B 线作者侧的小节契约修正交付，包含修正后的
pre-issue-check native consumer、逐字节未变的有限 B HTTP service、冻结输入快照、
有限源码检查器和本说明。consumer、service、Node、Python、TypeScript、VM、模型、
HTTP、GUI 和产品测试均未由作者执行。

本交付不构成业务、法律、Gate 1 或完整 T18 通过。主编排须先完整复核源码、命令和
有限检查器，再决定是否执行有限检查或一次全新的实际运行。

## 唯一源码修正

已确认缺陷是小节数量谓词过严：主 Skill 允许在第五个主小节之后追加“未核对的
出处”等补充小节，也允许节内继续使用中文序号；旧谓词要求数量恰好为五。

本次只将：

```text
hasExactlyFiveNumberedSections: numberedSections.length === 5,
```

改为：

```text
hasExactlyFiveNumberedSections: numberedSections.length >= 5,
```

历史属性名保持不变，以把差异限制为一个源码字符；它现在的含义是“至少五个”
中文序号行。五个指定主标题、标题、顺序、非空、问题清单表格和测试说明排除规则
均未改动。修正后 consumer 的精确身份为：

| 对象 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-pre-issue-check.mts` | 153232 | `86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536` |
| `b-service-pre-issue-check.py` | 53737 | `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924` |

B service 整体字节不变。`literalfixed-inputs.json` 是修正前冻结快照，原样保留；
其中的路径和历史任务名不用于本次有限检查。

## 冻结来源

三份 source 逐字节复制自已通过的 defense 基线：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-defense-opinion.mts` | 148710 | `7d20cbed7b28602f3fd37ca52656440e09eb0651782339be12e0868588369cda` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11741 | `0459c97f81f8a9020a6e655e63e5cae6bc22cdd5aa564198f1c66c1969f8b6f7` |

四个当前私有编译输入逐字节验证后重绑到
`LitigationQuestionPrivateBuild-20261029-193422/private-output-20261029-194043`：

| 对象 | 字节 | SHA-256 |
| --- | ---: | --- |
| `lib/agent.js` | 554518 | `28b1e320fd57c0b07396ad0916c2bb2ad6faacd87f6cee451e74a7368f6fb866` |
| `lib/host.js` | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| `package.json` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| `manifest.json` | 58197 | `79cffb10b40f0f9ba449b7c4087c14cc1869353af305a4b95678adb9fc52b296` |

冻结 `reviewed-b-source-pins-round-citation.json` 的 346 项源码身份全部重新读回并通过。
未构建、未使用旧编译件兜底、未动态接受 pin。

## 有界场景

- 私有 civil 案件只复制四份批准 TXT：借条、银行流水、情况说明、还款记录。
- canonical 上游草稿在 `CaseRegistry` 打开前按原始字节和 mtime 复制到
  `成果/民事起诉状草稿.md`，并通过 `task.inputs` 作为唯一 L1 输入。
- 任务为无请求作用域的 `pre-issue-check`，参数为中思考、128K、32768 max tokens、
  32 次模型调用、48 次工具调用、45 分钟和 1200000 ms 请求超时。
- 输入 manifest 有八条原始行：任务、Skill、四材料、上游草稿、测试要点。
  另有 26 个依赖、四个当前私有编译文件和三个运行时。
- 唯一允许的新成果标题是 `出稿前审查-民事起诉状草稿`；原上游文件不得改动，成果路径
  只能位于本次任务草稿目录。

## 机器边界

consumer 只核对真实结构，不嵌入样本金额、日期、姓名、败诉/胜诉判断或语义关键词：

- 实际联合确认必须恰好一次成功，ID 只能是 `draft`、`doc_type`；回答文件只在合法
  ask 通过结构检查后读取。
- 任一回答前成功读取材料或 Wiki 都使本次实际运行 `FAILED`；生产端精确拒绝按
  “被阻止尝试”记录，不把拒绝正文解析成材料内容。
- 至少一次成功保存必须晚于两项回答；最终 title 和全文必须来自真实
  `case_save_draft` 调用参数。
- 输出必须包含五个规定的有序一级小节，且每节非空；允许其后追加“未核对的出处”
  等补充小节，也允许节内继续使用中文序号。历史属性名
  `hasExactlyFiveNumberedSections` 现表示“至少五个”。
- 任务覆盖率必须对应四份当前材料；每个解析后的 citation 必须回到当前版本
  `source GET`，不得有 A-E 类 citation problem。
- 原四材料、canonical 上游草稿、八条批准输入和私有 JSONL 在运行前后都要保持
  字节、大小和所需 mtime；JSONL 关闭后重开必须与 live event prefix 完全一致。

当前 B 已有的八个产品问答门不包含 `pre-issue-check`，本交付没有增加第九个产品门。
因此若产品允许回答前读取，consumer 会如实把实际先后顺序记为 RED；不得把本文件的
观察器当作产品门已经生效的证明。

## 未执行与需人工复核

作者没有执行模型或材料回读，没有验证七项内容质量、至少十处事实读回、未核对出处
清单、法律依据标记、自检段或总体结论。以下事项留给主编排：

- 一次全新的实际运行，使用匿名 stdin 的现有凭据路径，不复用旧 prompt、模型输出、
  task、case、session、JSONL 或报告。
- 检查两项预填是否对律师展示确认、实际回答和读取顺序、真实引用解析、原稿不变、
  五个规定主段、允许的补充小节与关闭重开。

## 有限检查器

`section-check-finite.mjs` 只供主编排复核后执行。它要求 CLI 提供绝对的
`--source`、`--source-sha`、`--result`，只接受本目录的修正后 MTS 及上述精确
身份，并等待 stdin 单行收据 `ROOT_PREISSUE_SECTION_RECEIPT` 后才读取固定
TypeScript、解析 AST 或启动 VM。

检查器只提取 `CANONICAL_DRAFT_TITLE` 与 `assertDraftMachineChecks` 两个绑定，不执行
consumer 其余顶层代码、import、Agent、Session、SDK、service、模型或凭据路径。
固定 TypeScript 为
`D:\Lawbeach\lawbench-A\dsh\node_modules\typescript\lib\typescript.js`，长度为
9144216 字节，SHA-256 为
`569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39`。

八个有效场景全部使用纯占位小节与表头，不包含原样本事实、材料、历史、事件或模型
消息：五节通过、追加第六节通过、节内第六项通过、缺主标题失败、顺序错误失败、
空主节失败、错误标题失败、缺表失败。另有两个明确标为 controlled-old 的红控，
只用于证明旧“恰好五”谓词会拒绝两种合法补充结构。结果文件只能直接创建在本目录，
拒绝 reparse/symlink 路径，使用 `wx` 确保不覆盖，并在执行前后保持源码字节和哈希。
- 人工判读问题清单是否逐项带原件位置、是否区分“通过/问题”、是否列全待补项和
  未核对出处，以及是否误把草稿自身错误出处写成审核清单的新出处。

## 执行纪律偏差

本续办会话有 3 次 `exec_command` 误传 `shell=bash`；3 次均在 MXC 启动前被拒绝，
没有执行任何命令。其余有效作者侧命令均使用指定完整原生 PowerShell 和
`login=false`。一次顶层 `git status --short --branch` 因只读边界下无法进入子模块
`dsh` 工作树而失败；随后使用 `--ignore-submodules=all` 只读取得顶层状态，没有尝试
修改锁、ACL 或权限。该纪律偏差不改变任何文件或证据，应由主编排按实际 raw 命令审计。

没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push；没有扩大权限、
改动锁、审批、ACL、全局设置、产品源码、Skill、contracts、测试或旧证据。
