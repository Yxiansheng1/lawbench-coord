# 独立 A 线交回：T33 启动器预检定点修复

有界修改已落盘，未执行准备、启动、停止、测试、构建、服务或 GUI。旧失败根保留，供主编排审查后决定一次新的准备与运行。

## 状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正唯一特殊来源标签 `entry/server.py` 的错误拼接，并为六个已固定的运行时库增加同值哈希断言 |
| 目标是什么 | 启动器只按既有固定输入完成预检；未知标签仍无例外，任何哈希不符仍终止 |
| 在等什么 | 主编排审查本交回并决定新的准备根；新根程序发布 `prepared.json` 后，再决定一次正式启动 |
| 卡在哪 | 本次没有停摆。Git 工作区状态检查受既有子模块目录权限拒绝；未改权限、锁或审批 |

## 精确改动

| 文件 | 修改前 SHA-256 | 修改后 SHA-256 | 精确行 |
|---|---|---|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\start.ps1` | `4b111e4c2e3e884906519ae466c34c095bc264f3276618a507a0f238a2d1111d` | `6be946e31b74fea79f07a25f4e79910655ac78151fef84d26834e8921f159b4c` | 321-326、343-347 |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\README.md` | `2cad88e00c0d27fed7403520aecf087f7e76e65ba8343e03be72ff1364e6a76b` | `ebdfc9bfb6795fcfa7eccd263937db0c06d31690640a63db1fc3683e1f3f4915` | 9-19 |

`start.ps1` 当前 892 行，净增 10 行，未重写生命周期、环境、路径发现、超时、清理、令牌或路由。

- 321-326：新增六个 `Assert-Sha256`，位置均为已准备项目的 `node_modules\lawbench-dsh\lib`。
- 343-347：仅当清单键精确等于 `entry/server.py` 时使用 `$NativeEntry`；其余 334 个标签继续拼到 `$BProductRoot`，逐项哈希检查未放宽。
- README 9-19：记录已复现的失败、定点修复、六项运行时校验、失败根保留及打包暂停。

修改前完整快照保留在：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T33-gui-pin-before-20261025-102039\start.ps1`

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T33-gui-pin-before-20261025-102039\README.md`

修改后完整源码保留在原路径，SHA-256 见上表。

## 依据与验证

- 失败现场：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs\T33-host-20261025-101940\gui\state\launch-error.json`，SHA-256 `5a6a23d0f23aaa21115a942a93b78f1dc34fe94f22733abc2c26a165c4d5f428`；原文报错仍是 `native prepared source entry/server.py missing: D:\Lawbeach\lawbench-B\entry\server.py`。
- 已准备清单：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs\T33-host-20261025-101940\prepared.json`，SHA-256 `687ec20f8ef5e2adc8f74350513f796719cdd9f903c64d73ffe39d8aa3fb34b5`；335 个来源标签中仅 1 个是 `entry/server.py`，其余 334 个 B 相对路径均存在。
- 失败根保留：`started.json`、`ready.json`、`handoff.json`、`stop-request.json`、`stop-report.json` 均不存在；未改写、删除、移动或重跑该根。
- 未改动脚本：`prepare.ps1` SHA-256 仍为 `186b268691deacaa78fd03d56711706b2554dc9a1202ac0b3c49bf759088a77f`；`stop.ps1` 仍为 `09adeef6710c1da24ecb9ec2e75f16727b66009dfe4202559f962c2c25e4c7a0`。
- Git：HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

六个运行时对照文件的登记值：

| 完整路径 | SHA-256 |
|---|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\agent.js` | `3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\client.js` | `e26b9f922b1c57a88d3e209fe1b0119d0e4f6381f02759afa23f629ebe5f8661` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\credentials.js` | `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\host.js` | `4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\index.js` | `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\lib\session-store.js` | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` |

## 未做与降级

- 按执行令未运行 PowerShell 启动器脚本、Python、Node、测试、AST 自检、构建、准备、启动、停止、服务或 GUI。
- 未启动新准备根，因此没有新的 `prepared.json`、运行结果或 GUI 证据。
- 原工作区包含大量既有 dirty 变更；仅编辑上述两个白名单文件，并新增本交回文件。
- 首次普通 `git status` 因 `lawbench-A` 所引用的工作树子模块目录权限拒绝而无结果；随后使用 `--ignore-submodules=all` 完成只读状态核对。未修复该权限问题。
- 执行偏差：一次只读目录列举误将 shell 设为 `bash`，命令返回访问拒绝且未执行任何操作；其余命令均使用指定原生 `pwsh.exe`、`login=false`。

## 下一步建议

请主编排先审阅上述两处局部改动和六条固定哈希，再决定是否新建一个准备根并执行一次正式启动。当前不得进入 GUI 验收或打包，当前状态仍按失败根与未经新运行验证处理。

Response ID: `ORCH-A-T33GuiPinFixReturn-20261025-102039`  
Response log path: `D:\Lawbeach\lawbench-coord\ORCH-A-T33GuiPinFixReturn-20261025-102039.md`

删减轮：读者 2 / 槽位 1 / 半句 2 / 重复 2 / 过程 0 / 黑名单 1
