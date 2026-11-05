# B 线交回：T18 L0 listing source seq

状态：`SOURCE_AUTHORED_NOT_EXECUTED`

## 唯一改动

新增文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CrossExamFiniteExtraction-20261029-140102\verify-L0-result-seq-20261029-141406.mts`

- 字节数：32649
- SHA-256：`96932989b2dfb0bc3106c910a5ee8419642aea293066577fa38048cb79536058`
- 内容：从 `verify-L0-listing-finite.mts` 整文件复制，仅将第 700 行该处断言
  `firstProvenance.listingSourceSeq` 的期望值由 `19` 改为 `20`。

原文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CrossExamFiniteExtraction-20261029-140102\verify-L0-listing-finite.mts`

- 字节数：32649
- SHA-256：`cbbe9473170a4e1ddf86944a72097f8397cd1ea337d2c338eb2ce546b24b3495`
- 该文件未被修改；无需逆变更恢复，现有整文件哈希仍与开工钉一致。

静态逐字节比较：两文件长度相同，仅 2 个字节不同：

- 偏移 27251：`0x31 ('1') -> 0x32 ('2')`
- 偏移 27252：`0x39 ('9') -> 0x30 ('0')`

因此本次证明的是唯一文本值 `19 -> 20`。未运行逆变更校验，也不声称这是
单字节差异；`19` 和 `20` 的字符串替换在字节层面改变 2 个位置。

## 源码依据

- `verify-L0-listing-finite.mts` 的 `withUnitToolAttempt` 在整数
  `callSeq = 19` 写入 `tool/call`，在 `callSeq + 1 = 20` 写入
  `tool/result`。
- `native-cross-exam.mts` 的 `toolResultRecord` 返回 `result.seq`；
  `observeQuestionCallbacks` 以该 `result.seq` 调用
  `parseScopedToolListing`，成功分支返回 `sourceSeq: resultSeq`，最终赋给
  `listingSourceSeq`。
- 因此 `listingSourceSeq` 表示工具结果事件序号；`first_valid_then_late_valid`
  保留第一个有效结果的来源时，其实际值为 20。

## 未改与复用

未修改构造器、MTS 主源码、观察器、gate、运行时、actual trace、main questions、
prompts、固定输入、归属钉或模型参数；未修改其他用例。

当前固定件核对：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-cross-exam.mts` | 148412 | `0da719ca45ae93dfa87fe4405dc14b0badffe55eabbc2268bab24d1d19c33bfb` |
| `b-service-cross-exam.py` | 48345 | `aa428e97cec0e65dc0b329ba17a5cb8b95add000e407cae5464f82e953bfa22d` |
| `literalfixed-inputs.json` | 12276 | `33103a5a03c00f3854e0d0dc4d813ec2ece3164f20036a3bc69553ce16507058` |
| `verify-task-settlement-finite.mts` | 39559 | `1141f3e4e1c516d355eddd1d9446cbe37caa45ed527608b4cb876c17c133f872` |

旧结算有限测试保持源码钉不变，复用根执行记录
`outputs/T18-cross-exam-Settlement-finite-root-current.json`：24 个实际用例
PASS，耗时 0.7677277s；记录为 Node0、一个完整 Node 可执行件、UTC birth
已消失、forced=false。未使用模型/HTTP/Native Session；`CoreClient.call`
仍是受控内存覆盖，不是基础 fetch。

L0 旧红结果保持并复用根执行记录
`outputs/T18-cross-exam-L0-finite-root-current.json`：耗时 0.7834927s，
记录为 Node1、一个完整 Node 可执行件、UTC birth 已消失、forced=false，
当前 L0 源码钉 `cbbe9473...` 保持不变，运行在第 700 行得到 expected 19、
actual 20。该次 sealed trace、main questions 的正向检查和此前负向检查均在
第 700 行前完成；完整 L0 套件仍不是 PASS。

## 验证边界与阻碍

- 本次作者没有运行 Node、Python、TSX、解析器、AST、导入、类型检查、测试、
  构建、HTTP、模型、GUI、SSH、进程探测或凭据读取；作者运行时为 0。
- 没有重跑旧开工、安装、调研或全量测试；根执行者应立即运行聚焦 L0。
- 只读 `git status --short` 被拒：无法进入
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh`，报
  `Permission denied`。该问题未修复，也未据此扩权、改 ACL、改锁或切换沙箱。
- 严格遵守 Git 只读：未执行 add、commit、rebase、stash、reset、clean、
  checkout 或 push；未暂存、未提交。既有 dirty 状态未触碰。

## 结论

本次仅修正错误期望值，等待根执行者复核后立即运行聚焦 L0。Gate 1、
完整 T18 和项目仍未完成，打包保持 `HOLD`。
