# A 交回：T18 命名运行时钉扎

状态：`SOURCE_PIN_CHAIN_COMPLETE / NOT_RUN / PACKAGING_HOLD`  
时间：2026-10-28 21:09 +08:00  
执行边界：只做有界文件修改、纯 PowerShell 只读核对和字节反向；没有运行 Node、Python、TypeScript 解析器、导入、收集器、测试、自检、Vitest、tsc、prepare、build、serve、HTTP、探针、模型、GPU、GUI、SSH、凭据、真实案卷或安装包流程。没有 Git 写入，也没有更改沙箱、审批、ACL、锁或其他 writer。

## 1. 当前源码链身份

| 对象 | 字节 | SHA-256 |
|---|---:|---|
| B 已审源码 `service/lawbench/tools/drafts.py` | 17262 | `255a99dabb231d8cb4f09b692fac5bf7a87d7e291973ab746de43ccc022da4f5` |
| 新 B 源映射 `reviewed-b-source-pins-named.json` | 53548 | `ccb030e6a47d2ecd61852085a990459f0c02eca982d748f17f00563a4e0c3b5b` |
| B 入口 `b-service.py` | 30634 | `ac7ccb2607ffc52c55c1e29ba84e3d6a5f8294937c3f93f3339988762649ab84` |
| 固定输入 `fixed-inputs.json` | 17193 | `1119535d0bff70be82b214c3956437c2922fb4874ac050b42b7d8eed8d13488f` |
| consumer `native-contract-workflow.mts` | 107381 | `d194cc74bc445c9e9fbf0241faaf105d67e770f3bccc4afe646cc1d772df6002` |
| 观察器测试 `manual-reason-observer.spec.mts` | 12909 | `e06e554ab46b792bc5aea1ed93ce20a0b8e3a1ee7763936ef1285d0976910a2a` |

上一轮直接映射 `reviewed-b-source-pins-direct.json` 保留不变：53548 字节，`d3acf07a4d50e8de5c6e7b56c823be086795e1efcd2e24d7f245a6c7bc975803`。它供旧运行和反向核验使用。

## 2. 实际改动

- 新映射由 direct 文件逐字节复制，只将 `service/lawbench/tools/drafts.py` 一行从 14654 字节、`816869ed…fa2` 改为已批准的 17262 字节、`255a99da…4f5`。其余 345 项、条目顺序、346 项计数、CRLF 布局和文件大小不变。
- `b-service.py` 只把 `SOURCE_PINS` 文件名从 `-direct` 改为 `-named`，并把 `SOURCE_PINS_SHA256` 改为新映射摘要。`SOURCE_PINS_BYTES = 53548`、`SOURCE_PINS_ENTRIES = 346`。
- `fixed-inputs.json` 的五个身份字段现为：`sourcePins.path` 指向 named 映射；`sourcePins.bytes = 53548`；`sourcePins.sha256` 为 `ccb030e6…3b5b`；`bServiceEntry.bytes = 30634`；`bServiceEntry.sha256` 为 `ac7ccb26…ab84`。其余 459 个固定文件身份、fixture 的 `mtime_ns`、runtime、旧 accepted evidence 和字段布局未重算。
- consumer 只把 `FIXED_INPUTS_SHA256` 改为 `1119535d0bff70be82b214c3956437c2922fb4874ac050b42b7d8eed8d13488f`；其余 107381 字节内容未改。
- README 已更新当前身份、变更边界和未运行状态；旧 direct 身份、旧原始报告和旧红态未改。

## 3. 只读验证

- 新映射反向替换 `drafts.py` 一行后，逐字节等于旧 direct 映射；346 项计数保持不变。
- B 入口反向替换 named 文件名和映射摘要后，逐字节等于修改前 30635 字节、`0cc12878…c70b` 文件。
- 固定输入反向替换四个变化值后，逐字节等于修改前 17194 字节、`b8a9b829…280a` 文件；其余 459 项身份未被重算。
- consumer 反向替换一个常量后，逐字节等于命名钉扎前 107381 字节、`7482f47d…7bbb` 文件。
- 当前 B `drafts.py` 与批准身份一致：17262 字节、`255a99da…4f5`；观察器源码和测试摘要均保持给定身份。
- A34 观察器根侧实际有限结果为 PASS：1.141 秒，两个完整 Node OS 身份，运行后无残留；源码保持 `7482f47d…7bbb`。该结果只覆盖离线观察器，不覆盖模型或完整 T18。

## 4. 未满足项与遗留

- 当前 B 11 项实际单元结果是 10 PASS、1 fixture 失败：正常 UI 流原先错误地期待空事件，实际出现预期锁事件。B 仅修 fixture 的工作并行进行，产品源码冻结；本次不声称 11 项通过，也不声称 11+受影响 12 项通过。root 必须在合流前独立跑完 11 项及受影响 12 项。
- 原始 11 次 HTTP 200 实跑仍为失败：命名比例漏报、自然原因误报。该旧报告保持不可变；它没有到达 redline、DOCX 和 JSONL 重开核验，不能据此宣称完整 T18 或业务质量通过。
- 本次没有执行同一合同工作流的全量命令、源码反向、459 项 pin、BAST、ESM 或新的实际模型运行；这些仍由 root 在授权环境完成。
- Gate 1、完整 T18 与项目交付均未完成，Packaging 保持 **HOLD**。

## 5. 运行阻碍如实记录

- `git status --porcelain=v1 --untracked-files=all` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而退出 1。按令未修复权限、未改 ACL、未动锁，也没有执行任何 Git 写操作。
- 两次只读字段枚举命令误用了 Bash；原生 MXC 均以 `E_ACCESSDENIED` 拒绝，未产生文件写入。之后全部使用指定的原生 PowerShell；该误设不影响上述修改，但如实记录于此。
- `T18NamedRuntimePinsInput-20261028-210527\A-dirty-before.txt` 保持原样；未暂存、未提交、未 rebase、未 stash、未 reset、未 clean、未 checkout、未 push。

## 6. 交回文件

- 仓库证据说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\README.md`
- 新映射：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\reviewed-b-source-pins-named.json`
- 本交回件即本次协调目录正式文件；没有提交 SHA。
