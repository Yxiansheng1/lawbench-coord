# T32 PDF 引用 GUI 启动器交回件

结论：三份 PDF 引用启动器和正式说明已写入新证据目录，交回文件已写入协调目录。`README.md` 状态是 `NOT_RUN`。本次没有运行启动器，也没有产生 GUI、HTTP、模型或 PDF 解析证据。

## 进度汇报

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 从同一个冻结基座复制三份启动器，只适配 PDF 入口、精确 run-root、prepared format、PDF 固定身份和 PDF prepared 校验；新增说明与交回件。 |
| 目标是什么 | 为已完成根侧准入的 PDF 引用入口提供可审计启动器。目标终门仍是主编排以新根实际启动 Windows GUI，查看第 2 页引用图和文字，再正常关闭。 |
| 在等什么 | 等主编排做累积审计并启动新的 600 秒运行。作者不再需要人工输入。 |
| 卡在哪 | 正式交付没有卡点。完整 `git status` 仍被共享子模块权限拒绝，根树 dirty 已用忽略子模块的只读方式核对；Git 写入不在本运行器授权内。 |

## 交付物身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 21824 | `642145c15714d41806eac14baec071d457bd5886ca7dc5e2698e7bf6d5008132` |
| `start.ps1` | 81176 | `ac076517e6f9cedb22710875e9bcedcb8fd57d577fe46d5749e0905a400fd862` |
| `stop.ps1` | 7157 | `b87887fe29dc191cbe9237e3111f1ce9d48ab26ac330edc1e06c5804699a9eec` |
| `README.md` | 7794 | `d0df1eadefffafd0c089375b5d552e7b65ac9a1be4ae4b730974a8234e613881` |

证据目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310`

## 输入与适配

输入目录为 `D:\Lawbeach\lawbench-coord\T32PdfCitationGuiInput-20261027-211310`。三份冻结启动器与蓝图哈希一致。新入口固定为 78926 字节、SHA-256 `165565761356c1100baf7b101b4a39ff1dbcf668d89321e3b1874bae9246da9f` 的 PDF native 入口。

PDF 夹具固定为 57132 字节、SHA-256 `761224e4fd57ae5dee275ee50e31425304a31c44190c872592695d3342c3f191`。prepared format 改为 `T32-native-pdf-citation-entry-prepared-v1`，运行目录前缀改为 `T32-pdf-citation-`。

PDF 校验覆盖 source、copy 和 `citation_source` 的 `bytes`、`sha256`、`mtime_ns`、`path`、`canonical`，并验证 copy 与 citation source 五项身份一致。另验证 ready 两项文件、`input_ready`、第 2 页引用文字形状和 500 字读取上限。实际 prepared 样例没有独立 pages 或 fragments 字段，因此没有虚构这些字段；五页和第 2 页片段仍由已审查 native 入口在 bootstrap 中验证。

旧 safety base、347 项 reviewed source pins、入口自身份、settings、daily marker、空 case、空 private Desktop、runtime artifact 缺席、24 项 runtime 输出、T50 memory-only、凭据禁用、固定 auth、route guard、proxy、absolute DLL resolver 和精确停止清理均保持原有执行逻辑。只读差异没有触及产品源码、B 入口、runtime、API、Key、契约或旧启动器。

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T32-native-PDF-citation-GUI-order-20261027-211310.md`
- 蓝图、三份冻结脚本、prepared、bootstrap report、server review 和根侧准入：`D:\Lawbeach\lawbench-coord\T32PdfCitationGuiInput-20261027-211310`
- 实际 PDF 源身份：`D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\起诉意见书.pdf`
- 实际 prepared 身份包含 M0001/R01、5 页、第 2 页可读 1/5、引用 1 处、模型调用零次；这些是复用输入事实，不是本次 GUI 结果。
- 最终三脚本与 README 哈希见上表；交回后根树 dirty 只新增本证据目录，既有 dirty 清单未变。
- 只读差异显示三份脚本只在允许的固定常量、PDF prepared 校验、run-root prefix 和输出字段处变化。

## 未做与降级

没有运行 prepare、start、stop、GUI、HTTP、probe、模型、Office、安装、打包、Python、Node、测试、构建、parser、AST 或 compile。没有发送、键入、保存、删除、选文件或改设置。没有修改 API、Key、凭据、权限、沙箱、审批、ACL 或锁。没有执行任何 Git 写操作。

非零记录及阻碍：

- 完整 `git status --short --branch` 因共享子模块 worktree 权限拒绝；只读的 `git status --short --branch --ignore-submodules=all` 成功，最终 dirty 增量只有新证据目录。
- 三份 `git diff --no-index` 因存在预期源码差异返回退出码 1。
- 两次只读检索误填 `bash` shell 目标，运行器返回 `Bash/E_ACCESS_DENIED`；没有启动 Bash，也没有执行其中的命令。
- 一次只读存在性检查的呈现命令出现 PowerShell `ParserError`；修正呈现方式后完成核对。

完整命令类别、修改范围、逆回办法和边界见证据目录中的 `README.md`。本交回件不声称 GUI、整条 PDF 引用流程、网络、模型质量或打包通过。

## 下一步

主编排先做完整累积源码、原始写入面、解析器和 PDF 边界审计，再从全新 `T32-pdf-citation-YYYYMMDD-HHMMSS` 根执行 prepare 与 start。GUI 只读核验 native cited draft、第 2 页实际 PDF 图和文字，然后关闭临时页签并执行精确 stop。打包状态保持 `HOLD`。

Response ID：A-T32-native-PDF-citation-GUI-20261027-211310

Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T32-native-PDF-citation-GUI-20261027-211310.md`
