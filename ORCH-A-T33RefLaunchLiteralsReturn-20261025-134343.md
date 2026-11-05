# A线真实大文件引用启动脚本交回

结论：两份白名单启动脚本已复制到指定新目录，且只改了三个文字值。静态字节对照与文字值计数均通过。本次没有运行脚本、测试、解析器、哈希、服务或 GUI，启动与验证仍由主编排负责。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已新建 `start.ps1` 和 `stop.ps1`。启动脚本改了两处：原生入口路径和入口校验值；停止脚本改了一处：运行目录。目标文件与“源文件只做这三处替换”的预期内容逐字节一致。 |
| 目标是什么 | 让主编排现成的真实大文件运行目录可由这两份新脚本引用。文件准备已完成；还差主编排启动 GUI、确认界面、执行关闭并核对运行目录。 |
| 在等什么 | 等主编排使用执行令指定的唯一已准备运行目录启动新脚本。收到该动作后，由主编排完成 GUI 与关闭验证并作最终结论。 |
| 卡在哪 | 没有阻碍。本次未运行 GUI 是执行令规定的分工，不是故障；两文件交付不等于 GUI 已通过。 |

## 三个文字值

- `start.ps1` 的原生入口：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py` 改为 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py`。
- `start.ps1` 的入口校验值：`c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca` 改为 `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`。
- `stop.ps1` 的运行目录：`ReadGetEntry-20261025-105313\runs` 改为 `HostEntry-20261025-094816\runs`。

## 依据与验证

- 源启动脚本：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\start.ps1`。
- 源停止脚本：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\stop.ps1`。
- 新启动脚本：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\LargeRefGui-20261025-131300\start.ps1`，文件大小为 43402 字节。
- 新停止脚本：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\LargeRefGui-20261025-131300\stop.ps1`，文件大小为 7123 字节。
- 文件大小读数来自本次文件系统查询：源文件分别为 43405 和 7126 字节；新文件各少 3 字节。原因是两个目录片段各由 `ReadGetEntry` 的 12 个字符变为 `HostEntry` 的 9 个字符；校验值替换前后同为 64 个字符。
- 静态对照来自本次读取的源文件与目标文件字节：两份目标文件均与“源文件只执行上述三处替换”的预期字节完全一致。
- 三组旧文字值在新文件中的出现次数均为 0，三个新文字值的出现次数均为 1；对应位置为 `start.ps1` 第 131、135 行和 `stop.ps1` 第 10 行。
- 执行令给出的源启动脚本校验值为 `a268c51e5df0754edbbcd6ebb154591c48f766948bdb5dfdfafd9a591bdfd232`，源停止脚本校验值为 `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647`。这两项由主编排预先核对，本次按要求未重算。

## 未做与降级

- 未运行这两份脚本。
- 未运行测试、解析器、哈希命令、服务或 GUI。
- 未生成新运行目录，未移动或读取旧大文件。
- 未使用 Git；没有暂存、提交、变基、重置、清理、切换分支或推送，也没有改写白名单以外的文件。
- 未生成交付说明、准备脚本、README 或新框架；正式交回就是本文件。

## 下一步建议

主编排使用 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs\T33-host-20261025-132123` 启动新脚本，随后完成 GUI、关闭和运行目录核对；在主编排给出运行证据前，不应把本次交回视为 GUI 通过。

Response ID: `ORCH-A-T33RefLaunchLiteralsReturn-20261025-134343`

Response log path: `D:\Lawbeach\lawbench-coord\ORCH-A-T33RefLaunchLiteralsReturn-20261025-134343.md`
