# ToORCH-A — T32 正式登记 Markdown GUI 启动器交回

**状态：限定产物完成，按要求 STOP。**

本交回只覆盖启动器三件和 README 的准备。没有运行 prepare、start、stop、
service 或 GUI，没有发起模型请求；实际 GUI 路径仍未验收，打包继续
HOLD。

## 交付位置

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDraftGui-20261025-175925\`

- `prepare.ps1`
- `start.ps1`
- `stop.ps1`
- `README.md`

正式协调目录交回件即本文件。按本次执行令，Git 保持只读；没有 add、
commit、rebase、stash、reset、clean、checkout 或 push，因此不存在本次
提交 SHA，也没有把交回描述成 Git 提交。

## 固定哈希

新 native 入口：

- 路径：
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\server.py`
- SHA-256：
  `458412d6b03c4c350bd40e228503e8ec8f207c13125ec22139612a9176a62151`

输出脚本：

| 脚本 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 5545 | `ead655e9fc042ac8a2bca6f1350986abe8a9aae2ef0c73c448768c3422557b66` |
| `start.ps1` | 48354 | `f04b5a668123046a7fc01fd11e17b94160d2bf5fc68e0f33a00ed5215be573c0` |
| `stop.ps1` | 7127 | `3da87123321dfa19c51781d29b23f2fdf0c9c37f1531c77394539d2eaf092768` |

六个冻结库均从当前已批准目录直接复核通过：

| 文件 | SHA-256 |
| --- | --- |
| `agent.js` | `b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b` |
| `client.js` | `a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46` |
| `credentials.js` | `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1` |
| `host.js` | `a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994` |
| `index.js` | `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956` |
| `session-store.js` | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` |

## 字面量、验证与上限

- 精确变更 5 个字面量：prepare 的新入口路径与 SHA、start 的新入口路径与
  SHA、stop 的新 `runs` 父目录。
- 反向逐字节验证通过：将 5 个新值逐一换回旧值后，三份脚本与受控输入
  原件完全一致，包括空白和换行。
- 新入口 hash 匹配；六个冻结库 pin 匹配。
- 新目标根只在确认不存在后创建；写入前已核对既有 dirty，没有覆盖或
  清理任何既有修改。
- scoped 只读 Git 状态只显示新目录为未跟踪；本执行者未改动已有 dirty，
  未拆 writer 锁，未更改沙箱、审批、权限或 ACL。
- 没有自行运行 prepare、start、stop、service、GUI、parser、build、
  Vitest、tsc、pytest、collect、selftest、安装、调研或全量测试。
- GUI 上限保持为：全新根、从启动起的完整行程不超过 600 秒。
- 实际 GUI 仍须读取精确 v1、编辑为 61 字节精确 v2、保存、回读并核对
  版本清洁；model/core/import/OCR 不得进入 UI 路径。
- stop 验收必须核对记录的 PID、可执行文件、创建时间和 native 端口，
  并确认零精确进程残留、端口关闭；forced Python 不得描述为正常、
  优雅或 finally 清理。

过程记录：首次组合写入命令在 PowerShell 解析阶段失败，未执行任何语句，
未创建目录或文件；校正后完成写入与反向校验。无遗留文件级阻碍。

## 根侧下一步

主编排先完整审计本目录源码与累计差异。仅在审计通过后，使用 fresh root
执行 prepare/start；GUI 结束后用同一 root 的 stop 精确收口。本交回不授权
进入打包，`Packaging HOLD` 保持不变。
