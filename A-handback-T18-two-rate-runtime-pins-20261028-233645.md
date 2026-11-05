# A 线正式交回：T18 两速率运行时 pins（20261028-233645）

结论：`DATA_ONLY_BINDING_AUTHORED_NOT_RUN`。A 线只完成授权数据绑定和字节级核验；实际模型执行次数为 0，没有把本次绑定写成运行通过。完整 T18 与项目完成状态未改变，Packaging 继续 HOLD。

正式执行令：

`D:\Lawbeach\lawbench-coord\A-T18-two-rate-runtime-pins-order-20261028-233645.md`

输入目录：

`D:\Lawbeach\lawbench-coord\T18TwoRateRuntimePinsInput-20261028-233645\`

执行者 PID 40144，使用指定 native `pwsh`、`login=false`。该 PID 是本次执行者，不是第二 writer。

## 写入面

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `reviewed-b-source-pins-two-rate.json` | 53,548 | `2c2b32e8b0d026b057eaf6c26a43b5b6580581ba9ed2b859192a6734c3c6a379` |
| `b-service.py` | 30,637 | `9b2bf386f26c969471baf3c19eab2772cda49aeead473d7c27de1c7dbfaef3d0` |
| `fixed-inputs.json` | 17,200 | `13b6c8333dbf6f3fef9fbb0d9e7761449b6fab7bb0ca127950f59b3480e15b01` |
| `native-contract-workflow.mts` | 117,382 | `d42e96e5d424be27954a04b485d9f5768104fdd5001df90dcfc2de634ceca1f2` |

上述四个文件均位于：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\`

新增必要说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\T18-two-rate-runtime-pins-20261028-233645.md`

本交回件亦为本次新增文件。除上述五份文件外，未修改任何文件。

## 绑定内容

NEW map 从旧 named map 原样复制，只改 `service/lawbench/tools/drafts.py` 一行：

- 旧：17,262 字节，`255a99dabb231d8cb4f09b692fac5bf7a87d7e291973ab746de43ccc022da4f5`
- 新：20,481 字节，`e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822`

该值来自当前输入目录的 approved 单行，没有从旧 map 或运行时动态刷新。其余 345 行、顺序、布局和 346 项计数不变；1386 个 CRLF 保持，裸 LF 为 0。旧 named map 未改，仍为 53,548 字节，SHA-256 `ccb030e6a47d2ecd61852085a990459f0c02eca982d748f17f00563a4e0c3b5b`。

B entry 只改 `SOURCE_PINS` 文件名和 `SOURCE_PINS_SHA256`。`SOURCE_PINS_BYTES = 53_548`、`SOURCE_PINS_ENTRIES = 346` 及 guard、fixtures、token、stop、lifespan、OCR、Retainer、outbound 等其余字节保持。

固定 manifest 只改 `sourcePins.path`、`sourcePins.sha256`、`bServiceEntry.bytes` 和 `bServiceEntry.sha256`；B entry bytes 从 30,634 改为 30,637。459 行、计数、顺序、46 baseline、A raw 2、private 4、`sourceResourcePins`、fixtures `mtime_ns` 字面值、runtime 和 accepted proofs 均保持。

consumer 只改唯一 `FIXED_INPUTS_SHA256`。没有改 assertions、quality gates、compiled imports、README、tests、product、compiled 输出、SDK、native、answers、prompts、model params、budgets、redline、OOXML、JSONL、setup/finally 或旧 status/raw/formal。

## 红绿核验

- 读取 NEW map，将唯一目标新行逆向替换为旧行后，与旧 named map 字节完全相等。
- B entry 的两处替换逆向恢复后，与输入副本字节完全相等。
- 固定 manifest 的四处替换逆向恢复后，与输入副本字节完全相等。
- consumer 的单条 SHA 常量逆向恢复后，与输入副本字节完全相等。
- 四个输入副本与写前目标逐一同哈希，证明替换基线没有漂移。
- NEW map 计数为 346，新源码 SHA 命中 1 次，旧源码 SHA 剩余 0 次。

本次未运行新的 focused test、旧测试、Node、Python、parser/AST、import、compile、build、prepare、HTTP、probe、model、GUI 或 SSH。没有实际模型运行，因此没有 current wiring 后的绿结果。

## Root 既有证据

以下证据均沿用执行令，不由本次运行重复：

- `run-Vet7pA` 原始结果保持 FAILED，238.640 秒、12 次 model-200；问题 3 在前三次保存前 PASS，最终内部意见引用 PASS，但 ratio-20 v2 hard error 与 manual status false-positive 仍使原记录 FAILED。原始证据不可变，redline 0、DOCX 0、reopen 未达到。
- manual 修正后的 terminal 结果仍为 45/38/runtime 0；旧 consumer 为 117,382 字节，SHA-256 `1a1ed4c7b1b29e175c82d2a474f172b2a4c16f3d99c168a31b6ceffe34d679c1`。
- Root 既有 current 19 tests PASS 3.265 秒与 affected 12 PASS 3.609 秒，以及 2 个 complete Python 进程的 UTC birth 消失、forced false、source held、无 Temp 残留；这些结果早于本次 wiring。
- Root 已核定的 precedence 修正源码为 20,481 字节，SHA-256 `e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822`；其 25 份 compiled 输出不变，无需新构建。

## 后续与阻碍

Root 仍需在完整审阅后，做 full source/data whole inverse、459、BAST、legacy18 和 ESM 核对，然后再执行一次相同原合同、保存 DPAPI 匿名 stdin 的完整 DOCX/JSONL 路径。

首次默认 `git status --short --untracked-files=all` 退出 1，原因是受保护子模块 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-A\modules\dsh` 权限拒绝；没有修权限、ACL、锁或审批。忽略子模块的只读状态命令成功。既有 296,932 字节 `A-dirty-before.txt` 为 dirty 保全入口，SHA-256 `59f827c2405326c1ad6df3f7e3a1eae2e045e5ba26364e356013f7bfa39c3fb1`，未覆盖。

Git 严格只读；没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push，因此没有提交 SHA。
