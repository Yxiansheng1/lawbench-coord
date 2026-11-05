# A 线交回：T18 当前运行时针脚修订

**状态：`AUTHORED_NOT_RUN / RUNTIME_NOT_RUN / PACKAGING_HOLD`**

## 1. 结论

按唯一执行令 `A-T18-doc-revise-runtime-pins-order-20261029-022210.md`，已完成有界的数据修订和静态核验，交付供 root 独立复审：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocReviseCurrentRuntime-20261029-022210\continue-genuine-doc-revise.mts`
- 同目录 `b-service-doc-revise.py`
- 同目录 `literalfixed-inputs.json`
- 同目录 `README.md`
- 本正式交回件

目标目录没有 `run-*`、运行时输出、私有 profile 或模型结果。旧 `run-Jwpm24` 的 `FAILED`、`ask=0`、`saved=1` 和“七项变四项”仍作为唯一旧失败事实保留。没有执行本次真实 `doc-revise`，所以不能宣称新问题门在模型中生效、四文件运行时已通过或业务正文满足 4.1 规则。

## 2. 文件与可逆差异

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `continue-genuine-doc-revise.mts` | 123980 | `a6164ab06a15ec0254ccc31dde9ea6ad286186d323899fdfa8b147a25c7e46dc` |
| `b-service-doc-revise.py` | 38290 | `20fe78e454fd5fe23fd5cb63350dd8d2df659bdce9637782c902982861e85987` |
| `literalfixed-inputs.json` | 23161 | `1d8a43a8c76b7fe79eee5e489bd0c79ca85ac3719b5a723d7fbbc1702aeba74f` |

冻结前值分别为 123988 / `df38e976...`、38290 / `20fe78e4...`、23187 / `6f80266d...`。

消费脚本保持 3177 行，只改第 1274、1275 行的 `agent.js` 与 `host.js` 动态 `file:///` 路径。精确逆替换两条新 URI 后，生成的内存字节与冻结输入逐字节比较结果为 `CONSUMER_REVERSE_WHOLE_BYTES_EQUAL=True`，差异数 0。

固定输入保持 457 行，只变 14 行既有字段：四条编译制品路径/字节/哈希、消费者目标路径/字节/哈希、B 服务目标路径。精确逆替换这些字段后，生成的内存字节与冻结输入逐字节比较结果为 `LITERAL_REVERSE_WHOLE_BYTES_EQUAL=True`，差异数 0。没有新增、删除或重排数组记录。

`b-service-doc-revise.py` 保持 38290 字节且逐字节未改；其冻结前 SHA 和新目录条目 SHA 均为 `20fe78e454fd5fe23fd5cb63350dd8d2df659bdce9637782c902982861e85987`。

## 3. 当前编译四针

固定输入中四个既有 `current-compiled-*` 记录全部指向：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocRevisePrivateBuild-20261029-021504\private-output-20261029-021948`

| 角色 | 相对路径 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| `current-compiled-agent` | `profile-node_modules\lawbench-dsh\lib\agent.js` | 552453 | `0e73a0e95b4d1248142f8a579a503f055eda11539f7ddf1614d8e1888e9d3329` |
| `current-compiled-host` | `profile-node_modules\lawbench-dsh\lib\host.js` | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| `current-compiled-package` | `profile-node_modules\lawbench-dsh\package.json` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| `current-compiled-manifest` | `manifest.json` | 58196 | `3d60e0330055795f456080f8fb4dd74ca1d8446a1cb5124301836cc1adbc272e` |

上表由只读 `Get-Item`、`Get-FileHash` 对实际文件复核，并与 `approved-current-runtime-four.json` 一致。旧 pin 没有用于新库。消费脚本没有字面私有 manifest SHA 常量；manifest 身份只存在于固定输入，未虚构源码常量。旧 raw A agent 记录不在本窄 manifest，未新增或改写。

## 4. 保留项

以下均保持冻结输入原字节和语义：

- `STAGE2_PROMPT`、38 项问题/答案与原有提示；
- `qwen38-27b` 路由、32 次模型预算、48 次工具预算、45 分钟预算；
- 实际 115 事件、23 个案件文件、两份实际输入、原 Native Session 身份；
- 单次真实 `doc-revise`、首次成功保存前 `draft` 与 `opinions` 回答、材料 `4.1` 读取；
- 风险 3 中原“第七条”的汉字“七”改 ASCII `4.1`、其余正文逐字节不变；
- JSONL 关闭重开与 115 事件前缀、安全检查、错误脱敏、`finally` 和单 writer 边界。

没有编辑旧 served consumer、旧 `run-Jwpm24`、旧失败 raw、冻结 13b6/46/resource 基线、新 generic framework 或任何产品/测试/Skill/契约/fixture 文件。没有改原 root 459 historical baseline；root 后续应依据已接受产品 `d21dd7...` 与本次 before/after 逆变更独立替换唯一有效检查行。

## 5. 可复用资格与限制

可复用的既有资格为：产品消费者 `d21dd7be6bc1fcb561063f259c2ad2e8d8714679f57982608823f5a896b1a5b0`、测试 `5ad9d9a049be0a323089b5d4c1c4a4967a6b9119ac1c47811b8437a15d19dd40`、32 项单测通过和类型错误 0。私有构建已实际自然成功，builder `347ae0...`、新 config `4bc9a7...`，当前 agent 为 `0e73a0...`。本轮按令不重跑这些旧证据。

既有 OS 记录中五个完整观察的构建进程身份已结束；一个快速退出子进程 PID 38212 的 exe/birth identity 为 NULL，故只能声称 `5 COMPLETE + 1 NOT_PROVEN`，不得声称六进程完整清理或 OS 世界身份闭合。静态 AST 辅助进程 OS 身份未收集。公开数字固定为 `full_OS_identity_proof=false`。

## 6. 验证边界与操作账

本轮只使用 PowerShell 的只读文件枚举、`Get-Content`、`Select-String`、`Get-Item`、`Get-FileHash`、内存逆替换及逐字节比较。没有运行 Node、Python、tsx、配置导入、代码解析器、AST、测试、编译、构建、prepare、serve、HTTP、模型、GUI、Key、DPAPI、SSH 或任何产品运行时。

实际写入仅为本目录三份复制后的目标文件和 `README.md`，以及本交回件。`A-dirty-before.txt` 为 316383 字节、SHA-256 `549ed666a68b413b4447344c577025d1cabf8a14517856f3ad6cf62b4cf6e363`，只作 dirty 保全。

有一次非零只读检查：`git status --short --untracked-files=all` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而无法完成。按执行令未修权限、锁或 ACL，也未尝试任何 Git 写入。目标目录首次枚举在创建前返回不存在，然后按令先新建并复制三份冻结文件，再做修改。

Git 全程只读；没有 add、commit、rebase、stash、reset、clean、checkout 或 push，也没有 index、锁、审批、ACL 变更。无提交 SHA 是明确交回事实，不是遗留动作。

## 7. 剩余门

root 应独立审阅本交回、目标文件、完整逆变更、当前四针和 ESM 可达路径，再由 root 决定是否执行唯一一次真实剩余 `doc-revise`。该次运行仍须使用实际 Bf3ztJ 115 事件状态、实际两份输入和一次匿名 stdin 凭据，不得用 `run-Jwpm24` 的失败状态重跑替换，不得预填正文、更换提示或抬高预算。

Gate 1、完整 T18、项目验收与 Packaging 均未完成；Packaging 保持 `HOLD`。
