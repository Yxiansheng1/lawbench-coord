# B 线交回：T18 contract manifest 路径修正

交回时间：2026-10-29 05:10（Asia/Taipei）  
执行者：独立 B 线 DeepSeek 执行者，`deepseek-v4.1-flash-1017` / `max`  
正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-contract-manifest-path-fix-order-20261029-051034.md`  
执行令身份：2658 字节 / SHA-256 `55cdb7f15fcaf19f30733e04560f1fc1d6ee7ea87f3e717df0c8748dd3738c10`

## 结论

有界修正已完成。`literalfixed-inputs.json` 中 `current-compiled-manifest` 的唯一错误路径已从不存在嵌套目录改为批准数组指定的根 manifest。四条 `compilerPrivate` 现已按全部字段与批准 private 数组逐项一致。当前目标 README 已更新新文件哈希，并明确撤回此前“已匹配批准路径”的错误声明。

本次没有运行产品、运行时、模型或验证框架。Gate 1：`INCOMPLETE`；完整 T18：`INCOMPLETE`；项目：`INCOMPLETE`；Packaging：`HOLD`。

## 修正结果

修正文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCurrentRuntime-20261029-050335\literalfixed-inputs.json`

修正前：10786 字节 / SHA-256 `cbee8addce5e3ec760bbb0c65cc4ab57a85c91bf8d3a5ed18cde99ebe35e8464`  
修正后：10750 字节 / SHA-256 `690a88654f53ac5b17d75afad472ea1fff4af064ff29713ce589352c992496e4`

当前 manifest 路径：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftQuestionPrivateBuild-20261029-045644\private-output-20261029-050141\manifest.json`

批准根 manifest 实际存在：58200 字节 / SHA-256 `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14`。原错误路径 `private-output-20261029-050141\profile-node_modules\lawbench-dsh\manifest.json` 实际不存在。

批准文件：

`D:\Lawbeach\lawbench-coord\T18ContractDraftCurrentRuntimeInput-20261029-050335\approved-current-runtime-four.json`

四行按完整对象逐项比较为 4/4 一致，覆盖 `role`、`path`、`bytes`、`sha256`：

| 角色 | 字节 | SHA-256 |
|---|---:|---|
| current-compiled-agent | 552781 | `f0b3f4c9bdc77c4b6c6de6eb7355c179a23568d7a15a8716a5f45683d7ee1f2f` |
| current-compiled-host | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| current-compiled-package | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| current-compiled-manifest | 58200 | `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14` |

四个批准文件均实际存在，实物字节/SHA 与上表一致。对最终文件仅将正确 manifest 路径反向替换为修正前错误路径一次，内存结果精确恢复 10786 字节 / SHA-256 `cbee8addce5e3ec760bbb0c65cc4ab57a85c91bf8d3a5ed18cde99ebe35e8464`，证明本次差异只有这一条路径。

## 保全与 README

既有快照：

`D:\Lawbeach\lawbench-coord\T18ContractManifestPathFixInput-20261029-051034\`

快照在修改前已存在，且三个副本与修改前目标逐字节一致：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| literalfixed-inputs.json | 10786 | `cbee8addce5e3ec760bbb0c65cc4ab57a85c91bf8d3a5ed18cde99ebe35e8464` |
| native-contract-draft.mts | 106224 | `e971e95930f1325e79278f60c0bf2ca076c1225d56f2a1038d25cb3520767854` |
| b-service-contract-draft.py | 45447 | `a9316a37e7b6396ab098dbbe0ab95398148ff03b0b9a60e8447b4b225b5aa418` |
| B-dirty-before.txt | 742926 | `06aed7072f293f698e0b23f55ab3cea2871c20320f3bc5f3cc66e94f592b2512` |

条目 `native-contract-draft.mts` 与伴随文件 `b-service-contract-draft.py` 修改后仍分别为 106224 字节 / `e971e95930f1325e79278f60c0bf2ca076c1225d56f2a1038d25cb3520767854` 和 45447 字节 / `a9316a37e7b6396ab098dbbe0ab95398148ff03b0b9a60e8447b4b225b5aa418`，与快照逐字节一致。

只更新了当前目录 README：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ContractDraftCurrentRuntime-20261029-050335\README.md`

README 已登记新输入文件身份并撤回旧批准路径匹配声明。旧正式交回件保持原样，未改。

原 A 侧 served、`run-yB8LvP`、旧 formal、products、tests、Skill、runtime、25 个 outputs、source pins、guard 与 config 均未修改。本执行没有新增框架、prompt、assertion 或参数；无工程上限，86400 技术看门狗事实不变。

## 执行边界

- Runtime：0。未运行 Node、Python、tsx、源码/JSON 解析器、模块导入、检查、编译、测试、构建、prepare、HTTP、模型、GUI、SSH、密钥、DPAPI 或凭据发现。
- 原生 shell：25 次实际执行；严格 raw 非零 1 次，即第一次完整只读 `git status` 因 `lawbench-B-new/modules/dsh: Permission denied` 退出 1。另有 1 次工具调度参数校验在命令执行前拒绝，未启动进程，不计为命令。
- 该 permission denial 不是本次交付阻碍；未修锁、未扩权、未改 ACL、未拆 writer 锁。
- Git 严格只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。带 `--ignore-submodules=all` 的目标路径只读状态显示两个预期文件均为未跟踪 `??`。

## 下一门

本交回只关闭批准 manifest 路径修正这一有界问题，不代表源码、ESM、准入或真实运行通过。根侧仍需完成全源反审、反向验证、ESM 审核与新编译准入，再执行实际 canonical 模型验证；不得把本静态修正写成模型通过。

Gate 1：`INCOMPLETE`。完整 T18：`INCOMPLETE`。项目：`INCOMPLETE`。Packaging：`HOLD`。
