# B 线交回：T32 cancel entry shape fix

结论：`PREPARED_FOR_ROOT_AUDIT_ONLY` / `RUNTIME_NOT_RUN`。

正式报告：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\root-entry-shape-fix-20261027-161656.md`

目标 `server.py` 已按令仅做两处精确替换：

- 精确任务键白名单补入 `"route",`，集合相等与 local-route 断言保持不变。
- `begin_attempts` 改回 `self.begin_attempts`，独立
  `replay_begin_attempts` 保持不变。

字节结果：`116705` 字节，SHA-256
`33992711026ac5835ae23ce20e209da6366c908193f6faa3a72229cac8f96a96`。
内存反向还原两块后为改前 `116713` 字节、SHA-256
`882665196dfef16f895a5b50755fdac6b1608734fd4cb47698a68c8a46337437`，
且与 `server-before.py` 逐字节相同；old 块零出现，new 块各一次。

实际只读命令及输出已写入正式报告。全量 `git status` 沿用已知子模块权限阻碍，
退出 `128`；`--ignore-submodules=all` 的只读状态成功并确认既有 dirty 全部保留。
未改锁、ACL、权限或审批。

写入面仅：目标 `server.py`、上述正式报告、本交回件。没有 Git 写入，没有产品/
schema/旧入口/A consumer/测试/配置修改。作者未运行 Python、Node、parser、测试、
prepare、serve、HTTP、GUI、模型、构建或 selftest；不主张运行时或整个 T32 通过，
旧绿证据不沿用作本次运行证明。打包继续 `HOLD`。

root 下一步：独立审计两处替换与正式报告后，执行一次全新的实际集成运行。
