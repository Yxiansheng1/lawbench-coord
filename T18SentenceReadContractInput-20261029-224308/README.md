# T18 刑期计算观察器接续件

## 状态与边界

`STATIC_SOURCE_FIXED_NOT_RUN / SOURCE_ONLY`。本目录按
`D:\Lawbeach\lawbench-coord\B-T18-sentence-observer-fix-order-20261029-222220.md`
接续制作，处置主编排对上一候选的静态拒绝，只改消费者的事件观察层和确证的测试输入。
供主编排后续执行全量反向核验、有限 UNIT 和新的原始实际运行。此次没有执行 Node、
Python、TSX、导入、类型检查、测试、构建、HTTP、模型、GUI、产品路径或全量回归；
没有产生真实模型通过、完整 T18 通过或发车结论。

`b-service-sentence-calc.py` 保持批准快照的逐字节副本。`literalfixed-inputs.json`
采用主编排批准的新清单蓝图，除本消费者最终 `bytes`/`sha256` 外，与蓝图逐行一致；
未复用旧清单中的旧自身路径。私建运行时四项按主编排确认的当前 25 项输出更新，
运行时可执行文件、25 项其余身份、依赖、模型、prompt、三问答案、预算和参数均未改。

## 文件身份

| 文件 | bytes | SHA-256 | 性质 |
| --- | ---: | --- | --- |
| `native-sentence-calc.mts` | 164237 | `f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8` | 有界修改的消费者 |
| `b-service-sentence-calc.py` | 49941 | `eb2179c5dbbab413fd35a91c4e061e999b23d8cb8aa520d204d370eb242835d3` | 冻结快照逐字节副本 |
| `literalfixed-inputs.json` | 12426 | `725d9d888d9621df15b0d5d978f05261064782e51ea5af795f230a42a1627ed9` | 批准蓝图加最终消费者身份 |
| `focused-finite-observer.mts` | 18631 | `cdd661d2a8b62529eedf6beaca4261ddb80cb4ea7201216b15d79f84ae5b1367` | 有限 UNIT 源 |

消费者在接续输入件基础上只做以下有界修改：

1. 从批准 Agent 模块绑定
   `CASE_LIST_BEFORE_SENTENCE_READ_DENIAL` 和既有 `questionRequirementDenial`；
2. 当前请求 R、完整 Native turn、callId/seq 结果配对和重复调用检查；
3. 读前未列清单拒绝单独记录，只有成功 `case_list_materials` 解锁后才接受成功分组读取；
4. 解锁前算期、存稿的精确 `questionRequirementDenial` 单独记录，失败调用不计成功；
5. 实际 callback 次数只等于唯一一次成功 callback；未知 ID 在生产
   `preTool` 阶段被拒绝，不虚增 callback 次数，拒绝调用继续单列；
6. 成功 `case_calc_sentence` 恰好一次，计算后首个成功 Core 调用必须是
   `case_save_draft`；任一成功存稿的 call/result 早于计算结果配对时间线即拒绝；
7. 报告保留拒绝记录、成功保存和首个成功 Core 调用；
8. 四项私建运行时路径、字节与哈希及两处绝对编译模块导入更新到当前批准输出；
9. 有限观察函数导出与 B 协议成功序列复核。

主入口 guard 未改，因此有限脚本导入消费者不会调用 `runNativeSentenceCalc()`、读取
凭据、启动 Agent/Context、加载模型或建立新会话。未新增框架、旁路、store、网络路径、
prompt、答案、预算或产品代码。

## 有限 UNIT 卡组

`focused-finite-observer.mts` 共 16 项：4 项预期绿、12 项预期红。文件只生成进程内事件；
唯一外部读取是旧 `gySbhT` 实际 JSONL，固定只读。旧实际运行仍判红。脚本输出只能是
`UNIT_PASS_NOT_REAL_MODEL`，不能表述为真实模型 PASS。

| 预期 | 场景 | 目的 |
| --- | --- | --- |
| RED | `genuine-gySbhT-baseline` | 旧真实事件流在新契约下仍红 |
| PASS | `valid-ordered-control` | 有序五材料读、三问、一次算期、首存全通 |
| PASS | `denied-read-then-valid-recovery` | 精确读前未列表拒绝后可恢复 |
| PASS | `denied-calc-save-before-ask-then-valid-recovery` | 精确算/存解锁前拒绝可单独留证并恢复 |
| PASS | `unknown-question-id-then-valid-ask-recovery` | 未知问题 ID 精确拒绝后可重问，实际 callback 次数保持 1 |
| RED | `callback-attempts-include-producer-denial` | 将生产拒绝计入 callback 次数即红 |
| RED | `wrong-denial` | 读调用的伪造或错误拒绝不可吞 |
| RED | `wrong-calculator-denial-before-ask` | 算期错误拒绝不可当预期拒绝 |
| RED | `unpaired-result` | 缺配对结果不可通过 |
| RED | `after-unlock-error` | 三问完成后的失败调用仍红 |
| RED | `duplicate-calc` | 成功算期重复即红 |
| RED | `success-before-answers` | 三问前的成功算期/存稿不能伪造解锁 |
| RED | `successful-save-before-calculation-result` | 三问后先成功存稿、再算期、再存稿即红 |
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

旧实际记录的已知顺序失败和新产品拒绝契约未被改写。主编排应以本目录源码完成全量
反向核验和新一轮有限 UNIT，再执行一次新的原始实际运行。任何实际失败仍应保留原报告；
不得通过放宽断言、增旁路或改 prompt/模型来追绿。

## 执行阻碍与纪律

- 默认 `git status` 仍因共享 worktree 的 `dsh` 子模块目录权限拒绝。随后以
  `git -c submodule.recurse=false status --short --branch --ignore-submodules=all` 完成
  只读核对；既有大量 dirty 全部保留。未尝试修复权限、拆锁或扩大审批。
- 本批两条只读诊断调用误填短 shell 配置：其中 `bash` 被 MXC 以
  `Bash/E_ACCESS_DENIED` 在执行前拒绝，另一条产生只读输出；均无写入效果。
  此后命令均使用指定绝对路径的原生 PowerShell、`login=false`，并如实记账。
- 本次严格未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`；未修锁、扩权、改审批/ACL、拆 writer 锁或修改产品源码。
