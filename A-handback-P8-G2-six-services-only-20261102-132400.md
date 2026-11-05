# A 线交回：P8-G2 六服务原始实例化

## 结论

已完成执行令指定的六个现有测试引导文件修改。每个文件只在唯一原锚点
`    await ctx.plugin(AgentRegistry)` 之前插入一行：

```text
    await ctx.plugin(await defaultExport(join(DSH, 'packages', 'llm', 'llm', 'lib', 'index.js')))
```

六个原文件的前像尺寸和 SHA-256 均与令中钉子完全一致。修改仅增加上述
97 字节语句和一个原文件所用 LF，即每个文件增加 98 字节；其余字节未改写。
没有新增辅助文件，没有修改产品、SDK、契约、Skill、配置、preparer 或规格文件。

完成时间：2026-11-02T05:25:09Z（2026-11-02T13:25:09+08:00），早于本阶段
截止时间 2026-11-02T05:57:04Z。

## 修改结果

| 文件 | 前像字节 / SHA-256 | 结果字节 / SHA-256 | 插入偏移 | 插入行 | 原锚点新行 |
|---|---|---:|---:|---:|---:|
| `archive-workflow-gate-20261030-003021.spec.ts` | 29709 / `527c755dcf8f2b9fc411624d96bb9353d3f9b93d47181be07cdf5bd3aa3edf2d` | 29807 / `e03d661ca175fa2d93e73d5de9553808f2ad5b325002bac47a389e1bef873b4c` | 24292 | 593 | 594 |
| `contract-question-gate-runtime.spec.ts` | 15507 / `c5c89d7fbc42eaa70144565d62c27fcaa2559335113c82ec106b25f5810b09ec` | 15605 / `24d0c4ee29e1c1d3c1deae3e50698744e1ba3a1b31b8c3ae7679adf54c7c5e82` | 6096 | 168 | 169 |
| `criminal-application-question-gate-20261029-150420.spec.ts` | 17714 / `e73983461b33dcb1e141cb5e34859f7baca6faced73b1001d5fde73c93e39540` | 17812 / `2230c80245dd92a52215d09e4c5a8138d138084fb718b5948120db1deb6efb12` | 14927 | 392 | 393 |
| `cross-exam-question-gate-20261029-121018.spec.ts` | 17345 / `670c9f5573ec8530e088a3735b68aca2c63efbb0a94b3927c825ef24f186870c` | 17443 / `281eb71709710e03acda4b486bcf853240b39cd3cac7d2f215c8ca9db04d7e13` | 14567 | 381 | 382 |
| `defense-question-gate-20261029-172117.spec.ts` | 22408 / `ff05c2260dfbb01c9466fb019282b276973cdecc9cf8da7192bd0b7d6f344097` | 22506 / `37128ca6413eae3144640389c5b4c635d6440a8d2cd1aa7f4de54e857df3fbe6` | 16030 | 425 | 426 |
| `litigation-question-order-20261029-192258.spec.ts` | 26384 / `5ff6233b54005cfd2795587d4f947aebbff575132b8ee9276042af9880651f0f` | 26482 / `57d4e10a8732c16a1265ec75f82b327f0426d17375740a9ba893ce99dffe17d6` | 21904 | 566 | 567 |

真实 SDK 目标经实际 `DSH` 根复核存在：
`D:\Lawbeach\lawbench-A\dsh\packages\llm\llm\lib\index.js`，104821 字节，
SHA-256 `314204a70152d3bb7efe921fee3078bfe73fb36784829c10aefc49cafe7017c6`。

## 不变范围

- 六个文件修改前均命中令中字节数和 SHA-256；每处原锚点唯一。
- 插入采用原始字节数组和 `.NET Buffer.BlockCopy`，只在锚点起始偏移前放入
  指定语句及其 LF；没有经过文本重写或换行规范化。
- 六个结果文件仍为纯 LF、无 CRLF、无 BOM；唯一加载行分别为 593、168、
  392、381、425、566 行，原 `AgentRegistry` 行均顺延为下一行。
- 所有既有输入、问题、答案、预算、处置和断言均未修改；archive G3
  300-325 行、G1 已冻结改动及 sentence 文件未触碰。
- 复用主编排已给出的六个未变规格基线和既有证据，本执行未重跑基线。
- 未修改 production inject、ToolRuntime、SDK、contracts、skills、config、
  preparer、native specs、global env 或其他任一源码文件。

## 实际命令与非零状态

所有 `exec_command` 均显式使用：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
```

实际只执行了以下原生 PowerShell 阶段，退出码依次均为 0，非零命令数为 0：

1. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\ORCH-A-P8-G2-six-services-only-20261102-132400.md' -Raw -Encoding UTF8` 只读执行令。
2. `Get-Item`、`[IO.File]::ReadAllBytes`、`Get-FileHash` 和逐字节锚点扫描，核对六个前像钉子和 SDK 路径。
3. 内存完成全部前像和锚点前置校验后，以 `[IO.File]::WriteAllBytes` 和
   `[Buffer]::BlockCopy` 一次性写入六个指定文件。
4. `[IO.File]::ReadAllLines`、`[IO.File]::ReadAllBytes`、`Get-FileHash`
   复核结果尺寸、哈希、唯一插入行、顺序、LF 与局部区域。
5. `Get-Date`、`Test-Path` 记录完成时间和确认正式交回文件原先不存在。

一次中间只读探测曾使用错误根目录 `dsh-ext\dsh`，返回
`SDKExists=false`；未写入任何文件。随后按测试内的实际定义
`join(__dirname, '..', '..', 'dsh')` 复核正确路径为真。该误探不是运行失败，
没有重试修改步骤。

## 验证边界

`STRICT_NOT_RUN`：未运行 Node、Python、AST、parser、import、test、Vitest、
tsc、pytest、collect、prepare、serve、probe、HTTP、GUI、build、model、
self-test 或 Git。没有测试通过声明，也没有以静态检查替代运行验证。

未执行任何 Git 命令或 Git 写入，包括 add、commit、rebase、stash、reset、
clean、checkout、push；没有创建暂存、提交 SHA。Dirty 工作树保持原状。
未联系其他聊天，未更换 API，未修改 sandbox、审批、ACL、锁或凭据。

## 遗留

运行验证、全量原始审计、整字节反向核验和有限验证均由主编排按执行令负责。
本线在正式交回后停止。
