# B 线交回：三项 denial 源级观察

交回状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`

## 结论

已按正式执行令完成有界源码改造，未运行任何测试、Python、Node、应用、HTTP 或模型调用。
当前三项失败的底因是 `UNKNOWN`，本件不是产品修复、不是全量 PASS，也不是实际根因证明。

历史红盘保持原文口径：`1376 = 1308 PASS + 18 FAIL + 8 ERROR + 42 SKIP`。目标仍是以下三项：

- `test_archive.py::test_converter_unavailable`
- `test_t5_convert_safety.py::test_timeout_kills_own_tree_and_cleans`
- `test_t5_lo_placement.py::test_crash_exit_code_reason`

最小主源码核对显示，`service/lawbench/case/materials.py` 第 711-716 行会把非 `ApiError` 异常统一
落为 `REASONS["corrupt"]`，日志只保留异常类名。这解释缺失的下层异常身份，但不证明三项失败的实际原因。

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\ThreeDenialObservation-20261031-151555\bootstrap.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\ThreeDenialObservation-20261031-151555\README.md`
- 本交回件

输入快照保留在：

- `D:\Lawbeach\lawbench-coord\ThreeDenialObservationInput-20261031-151555\bootstrap.py`

## 改动边界

- 从 `SafetyLoggingFix-20261031-133032/bootstrap.py` 整文件复制。
- 增加 `inspect` 导入，以及 `DenialCounters` 的有限事件记录；原计数锁、增量与原始 `SafetyBlocked` 抛错顺序保留。
- 事件最多 32 条，固定记录 category、直接调用函数、源码 basename、行号、最近 `test_` 函数与受限 `reason`；
  超限写入 `dropped`。不保留活帧，不记录参数、命令、路径、源码行、任意局部值或材料内容。
- `snapshot()` 在原有锁内复制 `events`、`dropped`，保留 `total` 与 `categories`。
- pytest 参数只把整个 tests 目录替换为执行令指定的三个原始 node id；其余选项不变。
- 原 guard 决策函数、环境/setup/cleanup、私有根、JUnit、T37 排除、产品、测试、断言、conftest、契约与 SDK 未改。

## 未证明与继承限制

本件没有实际事件，也没有 PASS/FAIL 新结果。原生 C 写入、进程继承、Windows 拒绝写与子进程清理边界沿用原 bootstrap；
被产品提前统一转换成 `corrupt` 或随临时日志清理掉的异常身份不能由本观察恢复。

## 主编排接手门槛

主编排须先进行全文源码审阅、whole inverse 核对和纯内存 observation controls，全部通过后，才可决定用本件执行
**一次新鲜的原样三项测试**，并自行记录 PID、可执行文件、UTC 时间、进程出生信息和运行后清理。
不得新增 guard 版本或改动 allowlist。若受上述边界阻挡，应报告精确源码阻碍，不扩权、不改锁、不绕隔离。
