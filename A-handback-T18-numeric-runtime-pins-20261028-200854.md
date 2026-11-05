# T18 数字运行时钉扎交回

状态：`READY_FOR_ROOT_REVIEW`

工单：T18 numeric runtime pins。

执行令：`D:\Lawbeach\lawbench-coord\A-T18-numeric-runtime-pins-order-20261028-200854.md`。

执行者：A 线独立 DeepSeek 执行者。

基面：分支 `line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`。本次没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push；暂存区未产生改动。

## 已交付

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\reviewed-b-source-pins.json` | 53548 | `3a6615c7eae3d8f977910cc13ac455d43f8e1e7d135eab88bcb2f1dca65cfb31` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\b-service.py` | 30628 | `c78d249fa0303281534e82e5b957c566d90a60f853879917a0d393fbdc577e05` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\fixed-inputs.json` | 17187 | `7bd20304f3a2622e37e7631a7067f9ed889126aac8908017ff14e53ab6a372bc` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts` | 107162 | `f9490c16259e98eab221a1215bbe98459587a479fb50ba64be08ef4b0fb8ee49` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\README.md` | 10602 | `2902bfd5ab52bc5a307ce219c59f1b99caca071ce8383dafe15d3b92902ba253` |

新 B 映射由旧 reviewed 映射逐字节复制。旧文件保持 53547 字节、`5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`。新文件只修改 `service/lawbench/tools/drafts.py` 一项：

```text
旧：6779 / 119d3ceacee730523b6192c540c063dd36aaec4b3c91814efe57194896ef2f2a
新：13437 / 7c54c0685edec082cea405e30ad08b38637bdbd1ec3afedeb6e3712fbaebd0ab
```

其余 345 项、346 项总数、顺序和 JSON 布局未变。新值取自 `approved-one-source-row.json`，不是从 B 当前树批量重算。

`b-service.py` 只改 `SOURCE_PINS` 路径、字节和 SHA 三个数据字段；`SOURCE_PINS_ENTRIES` 仍为 346。`fixed-inputs.json` 只改 `sourcePins.path/bytes/sha256` 与 `bServiceEntry.bytes/sha256`。consumer 只改一个 `FIXED_INPUTS_SHA256` 常量。

## 只读验证

以下检查均由显式绝对路径的 native PowerShell 执行，登录态关闭，退出码均为 0：

1. 修改前映射、B 入口、固定输入和 consumer 的字节数与 SHA-256 再次核对，均与执行令输入一致。
2. 新 B 映射共 346 项。逐项读取 B 工作树文件并计算 SHA-256：原 345 项全部一致；`drafts.py` 只匹配批准的新身份。
3. 新 B 映射、B 入口、固定输入和 consumer 分别对指定字段作精确反向替换，均可逐字节还原各自 before 文件。
4. `fixed-inputs.json` 的本地路径/字节/SHA 三元组为 67 项，所引 native 基线为 46 项，B source pin 为 346 项，合计 459 个固定身份。
5. `fixed-inputs.json` 中的映射路径、映射摘要、B 入口路径、B 入口字节和 B 入口摘要均与磁盘实际文件一致。
6. consumer 中的 `FIXED_INPUTS_SHA256` 只出现一次，等于当前 `fixed-inputs.json` 的实际摘要。
7. `manual-reason-observer.spec.mts` 仍为 7386 字节、`1455f9e3bd683b0ce10b41ce1bf3f315c304bb39d9a537ece12a89c6322da890`。

## 已有根侧读数

- 当前 B 数字 guard 的 rate-unit 为 5 项通过，耗时 1.719 秒，自然完成，1 个 Python 身份取得完整 OS 起止信息，运行后无残留。当前 `drafts.py` 在运行前后摘要一致。
- 旧受影响 12 项为 8 项通过、4 项错误。4 项均因测试替身 `ExtractedTaskStore` 缺少 `index_for_task`；该缺口在 guard 前文件 `119d3cea…` 中已经存在，不是本次 guard 回归。
- 原 observer 为 16 项通过，耗时 1.141 秒，自然完成，2 个 Node 身份取得完整 OS 起止信息，运行后无残留。源码和测试摘要未变。
- 原始 actual QuestionGate 已通过。旧数学比例结果仍为红。
- Concurrent B 只准备新的 12 项测试副本，没有产品修改；该副本的根侧结果仍待产生。

上述均为已有证据读数，本次没有重跑。当前状态不得写成完整 T18 通过，Packaging 保持 `HOLD`。

## 未运行与边界

本次没有运行 Node、Python、TypeScript 解析器、import、collect、测试、自测、prepare、运行时、构建、服务、HTTP、模型、GPU、GUI、SSH、凭据、环境变量、DPAPI、Keyring 或安装包流程；没有启动 consumer、模型或真实合同流程；没有连接其他聊天；没有更换 API。

没有修改产品 A6、B guard、测试、SDK、编译器25、Skill、prompts、callback、律师答案、模型参数、预算、`MAX32768`、high、128K、NativeSessionUUIDR、tool order、read coverage、draft edit list、redline、OOXML、JSONL、finally、watchdog 或 `run-Pa9aqb` 中的原始证据。

root 后续仍需完成完整命令复核、源反向审计、459 个固定身份复核、setup/cleanup、BAST/ESM，并在当前受影响有限集转绿后执行一次同一合同流程的新实跑。

## 阻碍记录

一条验证调用误将 `shell` 指定为 bash，运行器以 `E_ACCESSDENIED` 拒绝，命令未执行。该调用没有改变文件、Git、沙箱、审批、ACL 或运行时。随后恢复为执行令指定的绝对路径 native PowerShell，完成全部只读验证。

本 job 原生 MXC 保持 managed 隔离；没有启动 setup、切换 legacy、修改沙箱或审批、拆分 writer 锁，也没有尝试修复 Git 权限或 index.lock。

删减轮：读者 2 / 槽位 1 / 半句 1 / 重复 2 / 过程 0 / 黑名单 1。
