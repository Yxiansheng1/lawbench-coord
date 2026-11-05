# A 线交回：T32 launcher byte constant recovery

状态：完成唯一授权的数据修正并停止。

- 执行令：`D:\Lawbeach\lawbench-coord\T32-launcher-byte-constant-recovery-order-20261027-153926.md`
- `prepare.ps1`：`141080` -> `141021`，各一次；17122 字节不变；SHA-256 `b3734b026a30673a985c1f32c622afeb6350859e3c1292fdd8b717210705d72a` -> `1c0395f1a8d05749645f3d39823e3cb32ba81e08bdda2d52fe1d51ba535219e5`。
- `start.ps1`：`141080` -> `141021`，各一次；75682 字节不变；SHA-256 `7b057d7fc65f58d907a5911b1b8aa7f11a7d1201452b0e7c828a36ae21e4a6ed` -> `cc802b8023d0b81e90334451187bb38c9a4bef0b2e10cc5021225258311ffcbf`。
- 两份文件均保持无 BOM、纯 LF；内存内反向替换后的 SHA-256 精确回到修改前身份。只读快照与修改前哈希一致。
- `stop.ps1` 仍为 7133 字节，未修改。
- `git status --short --untracked-files=all` 退出码 1，原因是 `modules/dsh` 的 `.git` 目录权限拒绝。没有修复权限、没有改锁，也没有执行任何 Git 写操作。
- 写入面：两份既有脚本、证据文件 `docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\native-byte-constant-recovery-20261027-153926.md`、本交回件。
- 正式证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\RefRemoveOptinGui-20261027-134049\native-byte-constant-recovery-20261027-153926.md`

RUNTIME_NOT_RUN。未运行任何 runtime、测试、构建、安装、准备、探测、HTTP 或 GUI；包装保持 HOLD，全项目仍未完成。
