# C 线交回：真实合成识别私有 Key 输入启动器

状态：**AUTHORED_NOT_RUN**

## 交付物

- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\launch.ps1`
  - 18427 bytes
  - SHA-256：`CAAFC75762B608633F0D53437025B2C784BDAE59600DA46BF574B60D258B650C`
- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\README.md`
  - 7285 bytes
  - SHA-256：`224388C882AA7FCC4BC432A8B1B85F7704EBE4AF0EBB58650A59DD8D7732C76A`
- 本交回件：`D:\Lawbeach\lawbench-coord\C-handback-real-synthetic-secure-input-20261027-225913.md`

上述文件哈希记录于 `2026-10-27T23:04:07.320+08:00`。

## 实现摘要

- `launch.ps1` 是单用途私有启动器，固定 PowerShell、Python、B consumer 路径和
  `ocr/refine/cancel` 顺序；没有任意程序或 consumer 开关。
- 必需参数为 `-Parent`、`-ConsumerSha256`。Parent 必须位于本目录 `runs\` 下的新鲜
  空运行根；脚本不覆盖、清空、递归清理或删除任何内容。
- 固定 consumer 哈希参数必须为 64 位十六进制，并与运行时文件哈希逐字相等；未用
  动态自有哈希替代 Root 固定 pin。
- 全部静止路径和哈希检查通过后才显示精确控制台标题并调用一次
  `Read-Host -AsSecureString`。Key 只经私有进程内存与每个子进程的一次 stdin 行传递。
- 子进程使用 `ProcessStartInfo.ArgumentList`、异步 stdout/stderr 读取；未设置父进程
  强制终止期限。stdout/stderr 在控制台或落盘前精确替换当前 Key 为 `[REDACTED]`。
- 实际退出码逐 phase 保留。退出 `3` 立即停止且不重试 Key；`2/5` 记录后继续独立
  phase；`4/6/其他非零`停止。整体任一 phase 非零即非零。
- `finally` 调用 `ZeroFreeBSTR`、`SecureString.Dispose` 并置空 Key 变量；README
  明示这只是最佳努力，不保证取证级内存清零。

## 当前前置条件

当前 B consumer 草稿尚未实现 `--key-stdin`。Root 必须先等 B 交回并完成该最小适配，
再重新审读 consumer、确定新的字面固定哈希、审计本启动器全文和全部命令，之后才可
在可见控制台启动。作者没有假装该 CLI 已实现。

## 验证与禁区执行

- **实际结果：NOT_RUN。**
- 未运行 `launch.ps1`、`Read-Host`、consumer、Python、Node、HTTP、模型、测试、构建、
  GUI 或自检；未做 PowerShell parser/静态解析。
- 只做了正式执行令、`targets.json`、既有 consumer 草稿和 dirty 状态的只读核对，以及
  交付文件的文件大小/SHA-256 元数据采集。
- 未读取 Key，未使用 `.env`、Keyring、凭据、真实案卷、发票、DSH cache/history、
  rollout、SSH 或后端管理接口；未联系其他聊天或更换 API。
- 未启动 setup，未切换 legacy，未修改沙箱、审批、ACL、锁或全局环境。
- 全程使用指定的原生 PowerShell 绝对路径、`login=false`，未用 bash 包装。

## Git 与工作树

- Git 严格只读；未执行 `add`、`commit`、`rebase`、`checkout`、`stash`、`reset`、
  `clean`、`merge` 或 `push`。
- 普通 `git status --short --branch` 因受限的
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh` 读权限失败；没有尝试
  修锁、扩权或改 ACL。使用 `--ignore-submodules=all` 的只读状态确认了既有 dirty
  内容仍在，并且本次仅新增获准目录下两个文件。
- 未遇到或处理 `index.lock`；Git 写入不在本运行器授权范围，因此没有提交 SHA。
- 本次交回是协调目录文件，不是 Git 提交。

## 遗留

- 保留既有 dirty 内容和当前未适配 consumer 不动。
- Root 需在 B 修订后完成 consumer 全量审读、固定哈希 pin、启动器 parser/命令审计，
  再决定是否进行获授权的可见交互测试。
