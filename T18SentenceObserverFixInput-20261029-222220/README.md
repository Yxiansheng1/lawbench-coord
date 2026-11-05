# T18 刑期计算观察器接续件

## 状态与边界

`AUTHORED_NOT_RUN / SOURCE_ONLY`。本目录按
`D:\Lawbeach\lawbench-coord\B-T18-sentence-gate-observer-order-20261029-221007.md`
制作，只改消费者的事件观察层，供主编排后续运行有限 UNIT、更新私建运行时身份并执行新的
真实运行。此次没有执行 Node、Python、TSX、导入、类型检查、测试、构建、HTTP、模型、
GUI、产品路径或全量回归；没有产生真实模型通过、完整 T18 通过或发车结论。

`b-service-sentence-calc.py` 和 `literalfixed-inputs.json` 均为批准快照的逐字节副本。
旧八项编译运行时身份、四项运行时可执行文件、私建 25 项、依赖、模型、prompt、三问答案、
预算和参数均未改。`literalfixed-inputs.json` 中消费者和最终运行时身份仍待主编排在私建
接受后按令更新；本批没有伪造新身份。

## 文件身份

| 文件 | bytes | SHA-256 | 性质 |
| --- | ---: | --- | --- |
| `native-sentence-calc.mts` | 164029 | `3c24628f0f4b894bf308c98f8a7467ad4fad4f660c89ca4c93ef3850b71f57f4` | 唯一有界修改的消费者 |
| `b-service-sentence-calc.py` | 49941 | `eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3` | 冻结快照逐字节副本 |
| `literalfixed-inputs.json` | 12432 | `96849e75b71af571e5f144b74a2534d85169e978e9efb2ffe2d1ff93cbba253e` | 固定清单逐字节副本 |
| `focused-finite-observer.mts` | 16610 | `7a123c852173304960e6e72e5a0b7afe3091e96155de34447667d92b185da1c9` | 新增有限 UNIT 源 |

消费者起点为旧快照 151508 字节、
`4ae328eca562a3fc021981cb7bd17cfde16968c97e9f05dd5dbc0bc0261ab55d`。
改动只包括：

1. 从批准 Agent 模块绑定
   `CASE_LIST_BEFORE_SENTENCE_READ_DENIAL` 和既有 `questionRequirementDenial`；
2. 当前请求 R、完整 Native turn、callId/seq 结果配对和重复调用检查；
3. 读前未列清单拒绝单独记录，只有成功 `case_list_materials` 解锁后才接受成功分组读取；
4. 解锁前算期、存稿的精确 `questionRequirementDenial` 单独记录，失败调用不计成功；
5. 成功 `case_calc_sentence` 恰好一次，且计算后首个成功 Core 调用必须是
   `case_save_draft`；
6. 报告保留拒绝记录、成功保存和首个成功 Core 调用；
7. 有限观察函数导出与 B 协议成功序列复核。

主入口 guard 未改，因此有限脚本导入消费者不会调用 `runNativeSentenceCalc()`、读取
凭据、启动 Agent/Context、加载模型或建立新会话。未新增框架、旁路、store、网络路径、
prompt、答案、预算或产品代码。

## 有限 UNIT 卡组

`focused-finite-observer.mts` 共 14 项：4 项预期绿、10 项预期红。文件只生成进程内事件；
唯一外部读取是旧 `gySbhT` 实际 JSONL，固定只读。旧实际运行仍判红。脚本输出只能是
`UNIT_PASS_NOT_REAL_MODEL`，不能表述为真实模型 PASS。

| 预期 | 场景 | 目的 |
| --- | --- | --- |
| RED | `genuine-gySbhT-baseline` | 旧真实事件流在新契约下仍红 |
| PASS | `valid-ordered-control` | 有序五材料读、三问、一次算期、首存全通 |
| PASS | `denied-read-then-valid-recovery` | 精确读前未列表拒绝后可恢复 |
| PASS | `denied-calc-save-before-ask-then-valid-recovery` | 精确算/存解锁前拒绝可单独留证并恢复 |
| PASS | `unknown-question-id-then-valid-ask-recovery` | 未知问题 ID 精确拒绝后可重问，不合成答案 |
| RED | `wrong-denial` | 读调用的伪造或错误拒绝不可吞 |
| RED | `wrong-calculator-denial-before-ask` | 算期错误拒绝不可当预期拒绝 |
| RED | `unpaired-result` | 缺配对结果不可通过 |
| RED | `after-unlock-error` | 三问完成后的失败调用仍红 |
| RED | `duplicate-calc` | 成功算期重复即红 |
| RED | `success-before-answers` | 三问前的成功算期/存稿不能伪造解锁 |
| RED | `read-before-list` | 成功读取早于成功列表即红 |
| RED | `missing-ask` | 缺联合三问即红 |
| RED | `wrong-current-request` | 错 R 即红 |

这些卡组只证明观察器的红绿分支，不替代主编排的全量反向检查、typed contracts、
setup/cleanup、blind actual、JSONL 重开、OS 监听/进程关闭或人工业务判读。

## 复用与后续

可复用的旧证据保持在：

- `docs\plan\evidence\T18\SentenceApiObservation-20261029-214710\run-gySbhT\`
- `docs\plan\evidence\T18\SentenceCalcNative-20261029-211228\`
- 协调目录下三份批准快照与根静态发现

旧实际记录的已知顺序失败和新产品拒绝契约未被改写。主编排应先用本目录源码完成静态
全字节反向核验和新一轮有限 UNIT；有限绿后，按令以私建 25 项更新运行时身份并只执行
一次新的原始实际运行。任何实际失败仍应保留原报告；不得通过放宽断言、增旁路或改
prompt/模型来追绿。

## 执行阻碍与纪律

- 默认 `git status` 因共享 worktree 的 `dsh` 子模块目录权限拒绝。随后以
  `git -c submodule.recurse=false status --short --ignore-submodules=all` 完成只读核对；
  既有大量 dirty 全部保留。
- 本批三条误填 `bash` 的读取命令均被 MXC 以 `Bash/E_ACCESS_DENIED` 在执行前拒绝，
  没有读取、写入或修改状态；其余有效命令均使用指定绝对路径的原生 PowerShell、
  `login=false`。
- 本次严格未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`；未修锁、扩权、改审批/ACL、拆 writer 锁或修改产品源码。
