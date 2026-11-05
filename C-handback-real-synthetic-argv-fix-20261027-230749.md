# C 线交回：T32 实机合成测试 CLI 参数纠偏

状态：完成有界修改，等待 root 验收。

## 交付

- 修改：`D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\launch.ps1`
- 纠偏说明：`D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\root-argv-correction-20261027-230749.md`
- 本交回件：`D:\Lawbeach\lawbench-coord\C-handback-real-synthetic-argv-fix-20261027-230749.md`

## 实际改动

仅删除 `--parent` 值与 `--phase` 之间第一次出现的孤立行：

```powershell
$processInfo.ArgumentList.Add($phase)
```

`--phase` 后的第二个 phase 值参数以及其余安全输入、脱敏、进程、清理和错误处理均保持原样。

修改前目标与冻结副本 SHA-256 均为：

`CAAFC75762B608633F0D53437025B2C784BDAE59600DA46BF574B60D258B650C`

修改后目标 SHA-256：

`2E61BC17534DF1218244CBCC06032368B09ED209AD0E38786FE6308C7AB446D2`

## 验证

- 从 18,427 字节变为 18,381 字节，恰好删除 46 字节。
- 冻结副本中目标文本有两次匹配，偏移为 9,819 和 9,914；已确认删除第一处。
- 文件保持 LF、无 BOM。
- 仅从冻结副本内存移除首个匹配及其 LF 后，与当前文件逐字节比较结果为 `True`，两者 SHA-256 相同。

未运行作者启动器、解析器、消费者、Python、Node、HTTP、Key、GUI、模型、自测或 mock。未修改 B 线消费者、契约、README、旧正式文件或其他生产/配置文件。

## Git 与现场

Git 仅只读。普通状态检查因受管环境无法进入 `dsh` 子模块而报权限拒绝；使用 `--ignore-submodules=all` 的只读检查已确认原有多项 dirty/untracked 文件仍在，未覆盖或清理。未执行 add、commit、rebase、stash、reset、clean、checkout、push，也未改锁、权限或审批。

交回完成，C 线停止。
