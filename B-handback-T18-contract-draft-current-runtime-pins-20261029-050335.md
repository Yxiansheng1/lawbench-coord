# B 线交回：T18 contract-draft 当前运行 pin 候选

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已交付当前编译器 pin 下的 contract-draft 静态候选：两处 MTS 编译导入切到 ROOT 已准入的新 PrivateBuild，固定输入内嵌 manifest 只更新四条 compiler identity 与 consumer/bService 自身 identity；README 和本交回为新增。 |
| 目标是什么 | 在保留提问恢复、材料读取、正文保存、引用、事件、预算和隐私边界原逻辑的前提下，让候选指向当前已批准的编译器实物。终门是 ROOT 全反审与新编译准入、A 线装配、独立真实模型复跑。 |
| 在等什么 | 等 ROOT 对当前静态候选做全源和全字节反审，确认全部命令与身份、BAST/ESM 及准入链，再给出新的编译准入/repin 信号。 |
| 卡在哪 | 本执行者运行权限为 0，不能验证编译或真实行为；标准 Git 状态读取又被子模块权限拒绝。两者均未越权修复。 |

## 写入面

只新建：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCurrentRuntime-20261029-050335\`
- 该目录下三件冻结输入、`README.md`
- 本信箱文件

没有编辑已服务的 A 消费端、旧 B 候选、产品源码、测试、Skill、contracts、config、runtime、lib、旧正式产物、guard、frozen 文件、状态或 pin 文件。没有 Git add/commit/rebase/stash/reset/clean/checkout/push。

## 当前文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-contract-draft.mts` | 106224 | `e971e95930f1325e79278f60c0bf2ca076c1225d56f2a1038d25cb3520767854` |
| `b-service-contract-draft.py` | 45447 | `a9316a37e7b6396ab098dbbe0ab95398148ff03b0b9a60e8447b4b225b5aa418` |
| `literalfixed-inputs.json` | 10786 | `cbee8addce5e3ec760bbb0c65cc4ab57a85c91bf8d3a5ed18cde99ebe35e8464` |

README 路径：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCurrentRuntime-20261029-050335\README.md`

## 精确变更

MTS 只有两处绝对 `file:///` 编译导入从旧 `GeneralQuestionPrivateBuild-20261029-034531/private-output-20261029-035404` 改为新 `ContractDraftQuestionPrivateBuild-20261029-045644/private-output-20261029-050141` 的 agent/host。入口没有 manifest SHA 常量，本次没有增加。

固定输入的四条 `compilerPrivate` 使用批准数据：

- agent：552781 / `f0b3f4c9bdc77c4b6c6de6eb7355c179a23568d7a15a8716a5f45683d7ee1f2f`
- host：902499 / `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`
- package：1257 / `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`
- manifest：58200 / `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14`

consumer 行使用本目录 MTS 的新路径、106224 字节与 SHA `e971e959…7854`。bService 行只换目录，45447 字节和 SHA 不变。其余 manifest 行、顺序与空白由整文件反向核对确认保持。

## 红绿核对

- 三件输入先按字节复制。原 MTS 106212 / `b878312a…8197`，原 bService 45447 / `a9316a37…a418`，原固定输入 10710 / `0d4f8a56…01bc7`。
- 四个已批准编译器实物再次只读哈希，均与批准 JSON 一致。
- MTS 精确出现两处新 URI，旧编译目录残留 0；反向替换这两处后逐字恢复原 MTS 106212 字节 / `b878312a…8197`。
- bService 与原输入完全同字节，未改。
- 固定输入只有批准的四条 compiler identity、consumer 三项 identity、bService 路径发生变化；反向恢复这些字段后逐字恢复原文件 10710 字节 / `0d4f8a56…01bc7`。
- 五条 B 原件、1286 字节批准样本与 53548 字节 / 346 条 source pins 的当前身份均与登记一致。

这是静态源码/字节核对，不是模型绿测。

## 保留与未做

原 contract-draft 真实运行 `run-yB8LvP` 仍是 53.313s、5 次模型 POST、5 次 HTTP 200、提问 0、保存 1、引用 0、提示 21 的真实失败；该目录存在且未改。本次保留原失败，不把静态候选写成模型 PASS。

ROOT 先前记录继续有效：新契约 7 PASS；受影响原始 51 项为 50 PASS、1 个 stale `OTHER` 控制失败；其余 46 项与 5 项副本构成等价 51 项，副本 5 PASS、types 0，1.441s / 3.364s；批准新构建 exit 0、15.349s、5 个完整观测 exe/UTC birth 已消失、无强制停止，68 schema AST / source 258、91、42 / 静态 25 项已接受；单元 15 个完整 OS 身份已消失。基线 459 raw 与 `5e53 -> d21 -> b2e -> 40ab` 显式 row 链未改。

`AUTHOR_RUNTIME=0`：未运行 Node、Python、tsx、解析/导入、检查、编译、测试、构建、prepare、HTTP、模型、GUI、SSH、密钥、DPAPI 或凭据发现，未启动服务。

标准 `git status` 因 `lawbench-B-new/modules/dsh` 权限拒绝退出 1；带 `--ignore-submodules=all` 的只读状态可读。未修锁、扩权、改 ACL 或执行 Git 写入。

## 接门状态

本候选不是安装包、部署包或真实运行成功。ROOT 仍需全源反审、全部命令与身份核对、BAST/ESM 审核和新编译准入；随后由 A 线装配，并用已保存凭据经匿名 stdin 在独立运行中完成一次原 canonical 场景真实模型验证，覆盖真实提问、材料读取、保存、引用、正文人工检查、JSONL、密钥扫描和 OS/端口关闭；不得停在 prepare/launch。

Gate 1：`INCOMPLETE`。完整 T18：`INCOMPLETE`。项目：`INCOMPLETE`。Packaging：`HOLD`。

Response ID：`B-T18-contract-draft-current-runtime-pins-20261029-050335`
Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T18-contract-draft-current-runtime-pins-20261029-050335.md`
