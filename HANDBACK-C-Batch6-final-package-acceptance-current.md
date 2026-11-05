# C 线交回：Batch6 最终包四项验收（源码）

状态：**源码交回，未执行验收**。

本会话只按 `ORCH-C-Batch6-最终包四项验收-source-current.md` 准备源码。
没有运行安装包、产品或验收脚本，没有跑测试、解析器、模型、OCR、GUI、
EasyTier 启停、驱动、网卡、路由或防火墙操作，也没有读取真实发票、真实
台账、案卷、凭据管理器或接入码。

## 交付文件

基目录：

`D:\Lawbeach\lawbench-C\docs\plan\evidence\Batch6\FinalPackageAcceptance-20261103\`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `prepare_acceptance.py` | 38537 | `19ed8056e0e36a18d1eea8ea3a1bc38c70661905fce65d419028dbdc543230bf` |
| `office_acceptance.mjs` | 14007 | `b84230507f90242ab02aadbf5e8ee520550798d8e2e4b37e33a6d30d5c3d6b34` |
| `README.md` | 4563 | `060e0e07741b3129b0847ee9fab5a2d6251670f54ea3790d8a13aa034affc683` |

除此之外只新增本交回件。

## 已实现的有界内容

- 强制最终安装器文件名
  `连越律所AI工作台-0.9.0-win-x64.exe`，并读取 Windows 产品版本核对
  `0.9.0`。
- 强制由最终包 `<install-root>\python\python.exe` 执行，并确认
  `lawbench.invoice.runner`、`lawbench.remote`、`lawbench.net` 均来自该
  最终安装树。
- 发票使用批准虚构样本
  `发票01-办公用品.pdf`（README 定价 356.00 元，购买方为
  `某某虚构律师事务所`）。样本 SHA-256 固定为
  `8144e715e9eb13c3c729ded69923cd9f584f0673aeca681a2f38713a4878bfb3`。
  先复制到私有沙箱，再走最终 `InvoiceRunner` 的 `env_check`、本地计划与
  导入；退出码 2 只记 `ATTENTION_NOT_PASS`，绝不记成 0 或 PASS。
- 发票结果同时核对最终 XLSX 台账、审计 JSON、提取记录和独立 pypdf 文本，
  记录行数、金额、票号、扫描事实、原始输出、退出码、耗时和物理文件哈希。
- Office 用最终 Python 生成虚构 DOCX/XLSX；DOCX→PDF 调用最终包
  `worker.mjs`，PDF→PNG 和 XLSX 重算调用最终包 LibreOffice Kit。
  `A3=SUM(A1:A2)` 的公式文本由 openpyxl 独立读取，缓存值必须为 `5`。
- 页数由最终包 pypdf 读取，PNG 尺寸由 Pillow 读取；不把 worker 自报当结论。
- EasyTier 只观察已存在且可执行路径精确等于最终包 core 的产品进程，并从
  该进程命令行提取产品自己的回环转发。只有已存在
  `10.126.126.3:9000` 的产品回环转发时才做 `GET /health`，且必须实际
  HTTP 200。没有该条件就明确 `NOTRUN`，不拿 TCP 连通冒充 HTTP 200。
- 不请求 `/v1/models`、对话补全或任何付费模型健康接口。
- HOME、APPDATA、LOCALAPPDATA、TEMP、TMP、TMPDIR 和缓存全部落到本次
  私有验收根；不继承 Key、代理或产品凭据。
- 单子命令上限 165–175 秒，总验收预算 14 分钟加末段观察，满足执行令的
  180 秒/15 分钟上限。

## Root 后续命令

先完成唯一一次最终包构建与解包/安装，再把下面三个尖括号值替换为实际最终
路径；`$AcceptanceRoot` 必须尚不存在。

```powershell
$Source = 'D:\Lawbeach\lawbench-C\docs\plan\evidence\Batch6\FinalPackageAcceptance-20261103'
$InstallRoot = '<final-installed-payload-root>'
$AcceptanceRoot = '<fresh-private-acceptance-root>'
$Installer = '<final-package-folder>\连越律所AI工作台-0.9.0-win-x64.exe'
$InvoiceFixture = 'D:\Lawbeach\lawbench-B\tests\fixtures\invoices-01\发票01-办公用品.pdf'
$OfficeRuntime = Join-Path $InstallRoot 'office-runtime'
$NodeExecutable = Join-Path $InstallRoot '连越律所AI工作台.exe'

& "$InstallRoot\python\python.exe" -I -B `
  "$Source\prepare_acceptance.py" `
  --install-root $InstallRoot `
  --acceptance-root $AcceptanceRoot `
  --installer $Installer `
  --invoice-fixture $InvoiceFixture `
  --office-runtime $OfficeRuntime `
  --node-executable $NodeExecutable
```

主结果为 `$AcceptanceRoot\acceptance-report.json`；另有
`office-result.json`、Node stdout/stderr 和 EasyTier 只读进程观察文件。

## 待 Root 处理的事实差异

执行令要求查询“fresh SQLite count/scanned facts”。核对现有已验收发票实现
后，其权威存储是 `发票主台账.xlsx` 加 `_审计\*.json`，当前实现没有 SQLite。
脚本没有伪造 SQLite：若最终包确实生成 `.db`，脚本只读查询表名与行数；若
没有，报告明确写 `NOT_APPLICABLE_CURRENT_ENGINE_XLSX`。发票事实仍由新鲜
XLSX、审计 JSON、提取记录和独立 PDF 文本四路核对。

EasyTier 若当前没有已经运行的产品自有回环转发，报告会是 `NOTRUN` 并给出
确切缺失条件。脚本不会启动或停止任何东西，是否由 Root 执行最终原生产品
流以建立该前提，留 Root 决定。

## Git 与工作树

Git 操作严格只读。没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、
`clean`、`checkout` 或 `push`；没有暂存或提交。

开工时 C 线原有多处已修改和未跟踪文件，均未覆盖或清理。`git status`
另因受保护子模块 `dsh` 的 `chdir` 权限报错；按执行令没有尝试修锁、改 ACL、
扩权或换成旧执行方式。本交回只需要协调目录落盘，不依赖 Git 提交。
