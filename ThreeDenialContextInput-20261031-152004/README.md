# 三重失败源级观察件

状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`

本目录只包含一个供主编排审核、由主编排决定是否运行的 bootstrap。它由
`SafetyLoggingFix-20261031-133032/bootstrap.py` 整文件复制后做定点观察改造。B 线没有运行它，
没有运行 pytest 或任何其他运行时。三项失败的底因仍为 `UNKNOWN`；本件不是产品修复，不是全量通过声明，
也不是实际根因证明。

历史全量结果保持原样：`1376 = 1308 PASS + 18 FAIL + 8 ERROR + 42 SKIP`。其中 23/26 个
failed/error 行显示 `SafetyBlocked`；仍待观察的三项是：

- `test_archive.py::test_converter_unavailable`
- `test_t5_convert_safety.py::test_timeout_kills_own_tree_and_cleans`
- `test_t5_lo_placement.py::test_crash_exit_code_reason`

## 观察内容

`DenialCounters.hit()` 保留原有锁、计数和抛错顺序，只在计数之后读取最多 32 个栈帧的以下元数据：

- 调用函数名；
- 源码文件 basename；
- 行号；
- 最近的 `test_` 函数名；
- 当直接调用者是本文件内名为 `deny` 的函数时，仅允许读取其固定白名单内的字符串局部变量 `reason`。

不读取、记录或保留参数、命令、路径、源码行、任意局部值、环境变量、token、正文或材料内容，也不保留活帧。
每个 denial 事件仅保留六个标量字段。事件上限为 32；超过上限时增加 `dropped`，不静默丢弃。
`root-summary.json` 的 `safety_denials` 在原有 `total`、`categories` 之外增加 `events` 与 `dropped`，它是唯一输出。

固定 pytest 参数只把原来的整个 tests 目录替换成上述三个原始 node id。测试文件、断言、产品源码、
conftest、契约、SDK、guard 决策函数、环境中转、cleanup、JUnit 与 T37 排除逻辑均未改动。

## 已知边界

- 原生 C 层写入与进程继承无法由 Python audit hook/当前进程观察完整覆盖。
- Windows 拒绝写、子进程继承、临时目录与日志清理限制全部沿用原 bootstrap。
- 不在同一进程内发生的异常、被产品提前转换成 `corrupt` 的异常身份，以及已清理的日志，本观察不能恢复。
- 因此事件可用于主编排交叉判读，不单独构成根因结论。

## 主编排运行门槛

主编排须先完成全文源码审阅、whole inverse 核对与纯内存 observation controls，再决定是否执行一次新鲜的
原样三项测试。运行时须由主编排自证当前 PID、可执行文件、UTC 时间、进程出生信息与运行后清理；
不得新增 guard 版本或放宽 allowlist。若在上述边界内无法观察，应报告精确源码阻碍，不扩权。
