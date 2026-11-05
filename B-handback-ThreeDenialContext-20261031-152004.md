# B 线交回件：三重失败观察器测试上下文修订

- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-ThreeDenialContext-20261031-152004.md`
- 状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`
- 结论：已完成令内定点源码修订，未运行候选或任何测试；三项失败底因仍为 `UNKNOWN`。本件不是 cause `PASS`，也不是产品修复或测试通过声明。

## 修改文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\ThreeDenialObservation-20261031-151555\bootstrap.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\ThreeDenialObservation-20261031-151555\README.md`

原有 guard、既有函数、固定 reason 白名单、三个 selected node id、JUnit/T37 排除与 cleanup 逻辑均保留。

实际改动仅为：

1. `DenialCounters.__init__` 增加 `_active_test = None`；事件在既有 `_lock` 内增加 `active_test`，原栈扫描得到的 `test_function` 继续独立保留。
2. 导入 pytest 后定义局部 `PassiveTestContext`，以 `pytest.hookimpl(hookwrapper=True)` 挂接 `pytest_runtest_protocol`。只在既有锁内把逐字列出的三个测试函数名写入 `_active_test`，其余名称写 `None`；`finally` 在原有锁内清回 `None`。不读取或改写结果、outcome、call、异常、report、options、request、params、marker，也不 monkeypatch 测试。
3. README 修正旧表述：原代码只检查调用者函数名是否为 `deny`，未检查文件身份；固定 reason 白名单仍限制可采集内容。明确原栈 `test_function` 可为 `None`，`active_test` 是白名单协议的当前测试上下文而非直接因果证据，事件字段由六个改为七个。

预编辑字节副本保留于：

- `D:\Lawbeach\lawbench-coord\ThreeDenialContextInput-20261031-152004\bootstrap.py`
- `D:\Lawbeach\lawbench-coord\ThreeDenialContextInput-20261031-152004\README.md`

## 验证边界

- 未运行 bootstrap、pytest、目标三项测试或任何产品运行时。
- 未执行 Python、解析器、AST、导入、自检、类型检查、构建、collect、prepare、App、HTTP、模型、GUI 或环境/Key/凭据/DPAPI 操作。
- 未执行源码比较或断言；只读了正式执行令、两个目标文件，并核对了协调目录预字节目录及交回目标存在性。
- 未执行任何 Git 命令；尤其未执行 add、commit、rebase、stash、reset、clean、checkout、push，也未改锁、审批、ACL 或沙箱。
- 一次只读路径探测命令因 PowerShell 表格表达式解析失败；随后以直接 `Test-Path`/目录列表完成核对。该失败未触碰文件、Git 或运行时，不是交付阻碍。
- 首个候选在运行前发现的 worker-thread 归属缺口已按令以协议级测试上下文补上；该修订本身未经运行时验证，不能升级为根因结论。

## 后续门

仍需主编排完成全文审阅、whole inverse 与纯内存 observation controls，再决定是否执行一次新鲜的三个原样 node id 测试。B 线到此停止。
