# B 线交回：T18 general-drafting 当前运行 pin 候选

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已交付当前编译器 pin 下的 general-drafting 静态候选：两处 MTS 编译导入切到 ROOT 已准入的新 PrivateBuild，固定输入内嵌 manifest 只更新四条 compiler identity 与 consumer/bService 自身 identity；README 和本交回为新增。 |
| 目标是什么 | 在保留标题修复、提问断言、正文、引用、路径、版本、预算和隐私边界原逻辑的前提下，让候选指向当前已批准的编译器实物。终门是 ROOT 全反审与新编译准入、A 线装配、独立真实模型复跑。 |
| 在等什么 | 等 ROOT 对当前静态候选做全源和全字节反审，确认 BAST/ESM 与准入链，再给出新的编译准入/repin 信号。 |
| 卡在哪 | 本执行者运行权限为 0，不能验证编译或真实行为；Git 状态读取又被子模块权限拒绝。两者均未越权修复。 |

## 写入面

只新建：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingCurrentRuntime-20261029-035529\`
- 该目录下三件冻结输入、`README.md`
- 本信箱文件

没有编辑已服务的 A 消费端、旧 B 候选、产品源码、测试、Skill、contracts、config、runtime、lib、旧正式产物、状态或 pin 文件。没有 Git add/commit/rebase/stash/reset/clean/checkout/push。

## 当前文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-general-drafting.mts` | 101388 | `8da50e45e6c54b78bb3a6e1d2c7c3e736e8534885cb0116c816fcc4aa4439871` |
| `b-service-general-drafting.py` | 42461 | `85a16d5ec6729e608ba32834e189d64be9406fed5043687cb9f477a28827fe07` |
| `literalfixed-inputs.json` | 11691 | `cc96d0a45bdbf6889e1f142f157224bc259ff582fcd65927c494cd3218b12d77` |

README 路径：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingCurrentRuntime-20261029-035529\README.md`

## 精确变更

MTS 只有两处绝对 `file:///` 编译导入从旧 `DocRevisePrivateBuild-20261029-021504/private-output-20261029-021948` 改为新 `GeneralQuestionPrivateBuild-20261029-034531/private-output-20261029-035404` 的 agent/host。入口没有 manifest SHA 常量，本次没有增加。

固定输入的四条 `compilerPrivate` 使用批准数据：

- agent：552599 / `9dd06812701c21408323a3145022b828b23d4cf0a8ce86c6653268fdcbed403f`
- host：902499 / `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`
- package：1257 / `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`
- manifest：58194 / `cc33c0d99bd18b0850d675da62a0944d7be93c3b9acfddca7106eb8e5c8e2e47`

consumer 行使用本目录 MTS 的新路径、字节与 SHA。bService 行只换目录，42461 字节和 SHA 不变。其余 manifest 行、顺序与空白由整文件反向核对确认保持。

## 红绿核对

- 三件输入先按字节复制。原 MTS SHA `9ddafeaa…`，原 bService SHA `85a16d5e…`，原固定输入 SHA `aaf17116…`。
- 四个已批准编译器实物再次只读哈希，均与批准 JSON 一致。
- MTS 精确出现两处新 URI，旧编译目录残留 0；反向替换这两处后逐字恢复原 MTS `9ddafe…`。
- bService 与原输入完全同字节，未改。
- 固定输入只有批准的四条 compiler identity、consumer 三项 identity、bService 路径发生变化；反向恢复这些字段后逐字恢复原文件 `aaf171…`。

这是静态源码/字节核对，不是模型绿测。

## 保留与未做

标题修复原有的完整根因反演、四次实际保存有限检查和三组负例通过记录保留，标题逻辑未改。历史 `run-iOLk2a` 仍是 12 POST / 12 HTTP 200、`ask_user_question` 为 0 后失败；v4 为 2962 字节、SHA `88f4848f…`、`must_fix=0`、`citations=20`、五份材料完整读取。Python 四次 `DRAFT_RESPONSE` 是常量标题比较造成的观察器误报。上述历史事实不构成新模型 PASS。

`AUTHOR_RUNTIME=0`：未运行 Node、Python、解析/导入、检查、编译、测试、构建、prepare、HTTP、模型、GUI、SSH、密钥、DPAPI 或凭据发现，未启动服务。

ROOT 编译记录保留原限制：四个完整 exe/UTC birth 已消失，PID 4200 的 exe/birth 为 null，不能声称五个进程全部闭环；静态辅助进程 OS 身份未单独收集。

`git status --short --untracked-files=all` 因 `lawbench-B-new/modules/dsh` 权限拒绝退出 1；index/权限问题未修。另一次只读 `rg` 误经 bash 调度被拒，未产生写入或执行。

## 接门状态

本候选不是安装包、部署包或真实运行成功。ROOT 仍需全源反审、命令与身份核对、BAST/ESM 审核和新编译准入；随后由 A 线装配并在独立运行中做一次原始 canonical 场景的真实模型验证。

Gate 1：`INCOMPLETE`。完整 T18：`INCOMPLETE`。项目：`INCOMPLETE`。Packaging：`HOLD`。

Response ID：`B-T18-general-current-runtime-pins-20261029-035529`
Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T18-general-current-runtime-pins-20261029-035529.md`
