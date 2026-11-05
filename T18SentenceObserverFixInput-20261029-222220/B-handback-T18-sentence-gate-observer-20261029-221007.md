# 线 B 交回：T18 刑期计算观察器接续件

## 结论

工单：`B-T18-sentence-gate-observer-20261029-221007`

状态：`SOURCE_ONLY / AUTHORED_NOT_RUN`。

本批只改刑期计算消费者的读/算/存观察层，并新增有限 UNIT 源。未运行 Node、Python、
TSX、导入、类型检查、测试、构建、HTTP、模型、GUI、产品路径或全量回归；因此不是
真实模型 PASS，不是完整 T18 PASS，也不是 Gate 1、发车或业务质量结论。

## 产物

仓库证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceGateObserver-20261029-221007\`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `native-sentence-calc.mts` | 164029 | `3c24628f0f4b894bf308c98f8a7467ad4fad4f660c89ca4c93ef3850b71f57f4` |
| `b-service-sentence-calc.py` | 49941 | `eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3` |
| `literalfixed-inputs.json` | 12432 | `96849e75b71af571e5f144b74a2534d85169e978e9efb2ffe2d1ff93cbba253e` |
| `focused-finite-observer.mts` | 16610 | `7a123c852173304960e6e72e5a0b7afe3091e96155de34447667d92b185da1c9` |
| `README.md` | 已写 | 说明、卡组和边界 |

消费者旧起点为 151508 字节、
`4ae328eca562a3fc021981cb7bd17cfde16968c97e9f05dd5dbc0bc0261ab55d`。
`b-service-sentence-calc.py` 与 `literalfixed-inputs.json` 均与批准快照逐字节相同。

## 改动

1. 从批准 Agent 模块绑定
   `CASE_LIST_BEFORE_SENTENCE_READ_DENIAL` 和既有 `questionRequirementDenial`。
2. 由既有 Native 当前请求 R 和完整 turn 边界约束所有相关 call/result；保持唯一 callId、
   结果 seq 后随和重复检测。
3. 读前未列表的精确生产者拒绝单独记录；成功列表恰一次，成功五文件分组读取恰一次、
   无分页参数、先于联合三问。
4. 三问解锁前的算期/存稿精确 `questionRequirementDenial` 单独记录；失败调用不再计入
   成功 Core 调用。解锁后任意失败、错误原因、错 R、重复或伪造成功均红。
5. 成功验算恰一次且先于首存；计算后首个成功 Core 调用必须是 `case_save_draft`。
6. 主报告保留拒绝记录和成功保存/首成功 Core 记录；B 协议只按成功 Core 序列核对。
7. 主入口 guard、prompt、模型、provider、三问答案、参数、预算、fetch、JSONL、setup/
   cleanup、四项编译运行时、私建 25 项和依赖均未改。没有新增框架、store 或旁路。

`literalfixed-inputs.json` 的消费者和最终运行时身份仍保持旧批准值。按令，待新私建运行
时验收后，由主编排做 data-only 的 4 运行时 + 2 compiled import + manifest SHA 更新；
本批没有伪造这些新身份。

## 有限 UNIT

`focused-finite-observer.mts` 共 14 项：4 项预期绿、10 项预期红。全部事件在进程内生成；
唯一外部读取为旧 `gySbhT` 实际 JSONL，固定只读。输出上限只能是
`UNIT_PASS_NOT_REAL_MODEL`。

预期绿：

- 有序五材料列表/分组读取/三问/算期/首存；
- 精确读前未列表拒绝后恢复；
- 精确算期与存稿解锁前拒绝后恢复；
- 未知问题 ID 精确拒绝后合法重问，不合成答案。

预期红：

- 真实旧 `gySbhT` 基线；
- 错误读拒绝；
- 错误算期拒绝；
- 缺配对结果；
- 解锁后错误；
- 重复成功算期；
- 三问前成功；
- 先读后列清单；
- 缺联合三问；
- 错当前请求 R。

这些数量是源码卡组计数，不是本轮已运行结果；须由主编排用批准运行时执行并留输出。

## 复用证据与后续

旧实际与源码证据保持只读复用：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceApiObservation-20261029-214710\run-gySbhT\`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\`
- `D:\Lawbeach\lawbench-coord\T18SentenceGateObserverInput-20261029-221007\`

旧 `gySbhT` 的顺序失败仍原样判红，不因新观察器而改绿。建议主编排下一步只做：

1. 本目录全字节反向核验和有限 UNIT；
2. 有限绿后，以新私建 25 项接受结果做 data-only 运行时/消费者/清单身份更新；
3. 用原 prompt、模型、参数、预算执行一次新的原始实际运行；
4. 维持原成功硬门，并人工判读实际报告、JSONL、草稿、监听与进程关闭。

## 执行阻碍

- 默认 `git status` 在共享 worktree 的 `dsh` 子模块目录因权限被拒；随后用
  `git -c submodule.recurse=false status --short --ignore-submodules=all` 完成只读核对。
  `index.lock` 或权限拒绝未修，未扩权、未改审批/ACL、未拆 writer 锁。既有 dirty 全保留。
- 本批三次误填 `bash` 的读取命令均被 MXC 以 `Bash/E_ACCESS_DENIED` 在执行前拒绝；
  没有读取、写入或状态变化。其余有效命令均使用指定绝对路径原生 PowerShell、
  `login=false`。
- 未联系其他聊天，未更换 API，未提交。Git 严格只读，未执行 `add`、`commit`、`rebase`、
  `stash`、`reset`、`clean`、`checkout` 或 `push`。本交回件即正式交回。
