# A 线交回：T32 PDF 入口身份重钉

状态：`STATIC_REPIN_COMPLETE_NOT_RUN`

已在 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310\prepare.ps1` 和同目录 `start.ps1` 中，各精确改写两处入口身份字面量：78926 改为 79263，旧 SHA 改为 `94fb02f734a1e08148fbcdf52dd3a477ef3eaa87043b1112b5282f25311eb16a`。每份脚本改后旧值 0 处、新值 1 处，长度和 LF 行数不变。

| 文件 | 改前字节 / SHA-256 | 改后字节 / SHA-256 |
| --- | --- | --- |
| `prepare.ps1` | 21840 / `0b18ecc04dbe444b615992611b186577b01661f4cf6794d7910e939f8637f0e7` | 21840 / `0f76e9216ec9b29941e0fa7f0e6bd82496d9cd36cbda3aef8f5740079ccf9f58` |
| `start.ps1` | 81190 / `b300937420c5d8659c5e780375551ba93e8cf5d57bb66784d01692867612fa0e` | 81190 / `c1f33da5c4dfb35b278315541fc47f2d7c4d943728ee8c6b2b068a49f099c0b0` |

改前三份启动器与冻结输入逐字节一致。B 线输入副本和实际入口均为 79263 字节、SHA-256 `94fb02f734a1e08148fbcdf52dd3a477ef3eaa87043b1112b5282f25311eb16a`。当前字节与“冻结原文只替换两处”的期望字节逐字节一致；内存反向替换后精确回到两份冻结原文和原 SHA。

详细记录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310\root-entry-identity-repin-20261027-214141.md`

`NOT_RUN`：未运行 Python、Node、import、源码 parser/AST/compile、测试、build、prepare、serve、probe、HTTP、GUI、trace、模型、Office、安装或 selftest；未做实际新启动、PDF 第 2 页真机图像/文字检查或临时页签关闭。未改 API、Key、凭据、权限、沙箱、审批、ACL 或锁。Git 严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout、merge 或 push。打包状态为 `HOLD`。

本次原生 PowerShell `exec_command` 原始调用共 20 次，非零 4 次：共享子模块权限拒绝导致根级 `git status` 失败 1 次，PowerShell 引号解析失败 1 次，两处预期差异的只读 `git diff --no-index` 各返回 1 次。原始运行器保留完整命令文本。

交回后停止，等待主编排全量审计和后续实际新 GUI 验证。
