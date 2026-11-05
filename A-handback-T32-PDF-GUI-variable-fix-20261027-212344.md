# T32 PDF GUI 固定夹具变量身份更正交回件

状态：`FINITE_STATIC_TEXT_CORRECTION_COMPLETE`

执行令：`D:\Lawbeach\lawbench-coord\A-T32-PDF-GUI-variable-fix-order-20261027-212344.md`

结论：`prepare.ps1` 和 `start.ps1` 已按大小写敏感字面替换，把固定原始 PDF 夹具变量 `$CitationSourcePath` 改为 `$PdfFixtureSourcePath`。ready-copy 的 `$citationSourcePath` 保持原样。没有运行 prepare/start/GUI，也没有触碰产品、测试、runtime、B 入口或旧冻结证据。

## 实际写入

根侧证据目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310`

| 文件 | 状态 | 字节 | SHA-256 |
| --- | --- | ---: | --- |
| `prepare.ps1` | 已改名 | 21840 | `0b18ecc04dbe444b615992611b186577b01661f4cf6794d7910e939f8637f0e7` |
| `start.ps1` | 已改名 | 81190 | `b300937420c5d8659c5e780375551ba93e8cf5d57bb66784d01692867612fa0e` |
| `root-variable-correction-20261027-212344.md` | 新增说明 | 19814 | `35a1cd8d425e353d1e5166540f35d072f45af480abf6a481eee7f03c8e081a3b` |

本交回件：`D:\Lawbeach\lawbench-coord\A-handback-T32-PDF-GUI-variable-fix-20261027-212344.md`

## 前后身份

| 文件 | 修改前 | 修改后 |
| --- | --- | --- |
| `prepare.ps1` | 21824 字节<br>`642145c15714d41806eac14baec071d457bd5886ca7dc5e2698e7bf6d5008132` | 21840 字节<br>`0b18ecc04dbe444b615992611b186577b01661f4cf6794d7910e939f8637f0e7` |
| `start.ps1` | 81176 字节<br>`ac076517e6f9cedb22710875e9bcedcb8fd57d577fe46d5749e0905a400fd862` | 81190 字节<br>`b300937420c5d8659c5e780375551ba93e8cf5d57bb66784d01692867612fa0e` |

旧 `README.md` 仍为 7794 字节、SHA-256 `d0df1eadefffafd0c089375b5d552e7b65ac9a1be4ae4b730974a8234e613881`；`stop.ps1` 仍为 7157 字节、SHA-256 `b87887fe29dc191cbe9237e3111f1ce9d48ab26ac330edc1e06c5804699a9eec`。两者均与冻结输入逐字节一致。

## 验证结果

- `prepare.ps1`：旧大写名 8 处全部替换，小写 ready-copy 名仍为 12 处，新名为 8 处。
- `start.ps1`：旧大写名 7 处全部替换，小写 ready-copy 名仍为 11 处，新名为 7 处。
- 两份脚本均为 UTF-8 无 BOM、纯 LF；`prepare.ps1` 有 462 个 LF，`start.ps1` 有 1653 个 LF。
- 两个只读 `git diff --no-index --unified=0` 各只显示预期的变量改名差异；`--no-index` 检出差异时退出码为 1。
- 将新名按大小写敏感 `String.Replace('$PdfFixtureSourcePath', '$CitationSourcePath')` 逆回后，`prepare.ps1` 与 `start.ps1` 均与 212344 冻结输入逐字节一致，证明没有其他字节变化。
- 原文件、ready-copy、`citation_source`、`pdf_copy`、JPEG、入口、哈希、mtime、路由、source pins、25 秒运行时、600 秒停止、凭据、guard、resolver 和 PDF browser 的原有断言均未删除或放宽。

本次仅为静态文本/哈希/只读差异验证，不构成运行时或 GUI 证据。

## README 计数勘误

旧 `README.md` 第 44 行写成“347 项 reviewed pins 加 `entry/server.py`”，该口径错误。正确口径是：可执行项总数 347，其中 346 项为 reviewed source pins，另有正确的 `entry/server.py`。按要求未重写历史 README；勘误只写入本次新说明。

## 命令、非零与阻碍

完整命令台账、每条退出码、C12/C14/C27 的准确失败原因，以及 C18/C31 两次 shell 参数路径拼写偏差，均记录在：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310\root-variable-correction-20261027-212344.md`

非零没有掩盖：

- 首次完整 `git status --short --untracked-files=all` 因共享子模块 `dsh` 权限拒绝返回 1；忽略子模块的只读状态检查成功。
- 一次 README 检索误设 `shell=bash`，被 managed MXC 拒绝；Bash 未启动，命令未执行，没有 setup 或 legacy 降级。
- 一次字节检查存在 PowerShell 空管道 ParserError；重做成功。
- 一次冻结文件比较存在方法绑定错误；重做成功。
- 两次 `git diff --no-index` 因预期差异返回 1。

这些均未造成计划外文件写入，也不构成正式交付阻碍。

## 边界与未运行

没有运行 prepare、start、stop、serve、probe、HTTP、GUI、PDF parser、bootstrap、Python、Node、import、AST、compile、tests、Vitest、tsc、pytest、collect、build、selftest、模型、Office、安装或打包。

没有发送、保存、删除、选文件、改设置或切模型。没有读取或写 Key/凭据，没有联系其他聊天，没有更换 API。没有修改产品、tests、build pins、runtime、P29、旧 18 项、E50、source 56、B346、B 入口、blueprint、probe 或旧正式文档。

Git 全程只读。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`merge` 或 `push`；未暂存、未提交，既有 dirty 全量保留。没有修改 `.git`、锁、ACL、审批、沙箱或权限。

## 下一步

主编排先做累积 source/raw/inverse 审计和 parser 核对；通过后在全新根实际执行 prepare/start。随后由主编排查看真实 Windows GUI 第 2 页引用图与文字并关闭临时页签。打包状态保持 `HOLD`。

Response ID：`A-T32-PDF-GUI-variable-fix-20261027-212344`

Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T32-PDF-GUI-variable-fix-20261027-212344.md`
