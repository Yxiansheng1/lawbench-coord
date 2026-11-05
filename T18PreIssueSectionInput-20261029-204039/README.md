# T18 pre-issue-check 原生样本 01 预交付检查

## 状态

`AUTHORED_NOT_RUN`。本目录是 B 线作者侧交付，只包含一份新的
pre-issue-check native consumer、其有限 B HTTP service、冻结输入 manifest 和本说明。
consumer、service、Node、Python、TypeScript、模型、HTTP、GUI 和产品测试均未执行。

本交付不构成业务、法律、Gate 1 或完整 T18 通过。主编排须先完整复核源码、命令和
manifest，再决定是否执行一次全新的实际运行。

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
- 输出必须有且只有五个规定的一级小节，且每节非空。
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
  五段输出与关闭重开。
- 人工判读问题清单是否逐项带原件位置、是否区分“通过/问题”、是否列全待补项和
  未核对出处，以及是否误把草稿自身错误出处写成审核清单的新出处。

## 执行纪律偏差

本 session 有若干次 `exec_command` 误传了 `bash` 或短 `pwsh` shell 参数；相关
`bash` 调用均被 MXC 在启动前拒绝，短 `pwsh` 只执行了只读 `Get-Content`。没有一次
误调用执行 Node、Python、测试、模型、Git 写入或产品命令。此后所有有效作者侧命令
均使用指定完整原生 PowerShell 和 `login=false`。该纪律偏差不改变任何文件或证据，
但应由主编排按实际 raw 命令审计。

没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push；没有扩大权限、
改动锁、审批、ACL、全局设置、产品源码、Skill、contracts、测试或旧证据。
