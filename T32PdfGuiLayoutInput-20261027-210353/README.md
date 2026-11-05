# T32 native PDF citation entry

状态：`AUTHORED_NOT_RUN / PREPARED_FOR_ROOT_AUDIT_ONLY / PACKAGING_HOLD`。

本目录只提交一份新的有限 fixture 源码：实际文字版 PDF 的引用导入、
第 2 页读取、带页级出处的草稿保存、零模型调用中止，以及一次只读 TCP
`GET /api/source`。预期该请求返回实际第 2 页文本和真实 PDF 第 2 页 PNG。
作者没有运行这些代码，因此本文件不代表红、绿、GUI、Host/RPC、模型、OCR、
打包或生产结论。

## 输入身份

- 固定 PDF：`D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\起诉意见书.pdf`，
  57,132 bytes，SHA-256
  `761224e4fd57ae5dee275ee50e31425304a31c44190c872592695d3342c3f191`。
- 固定 JPEG 控制件：
  `D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg`，
  47,379 bytes，SHA-256
  `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`。
- 固定 TXT 基座快照
  `D:\Lawbeach\lawbench-coord\T32NativePdfCitationInput-20261027-204736\00-server.py`，
  67,862 bytes，SHA-256
  `ec4e15f047f3ae6264dc25ad582cb2191ce085e9bc7c5add4bb5df0212ba0dd8`。
- 固定探针快照
  `D:\Lawbeach\lawbench-coord\T32NativePdfCitationInput-20261027-204736\01-probe.mjs`，
  26,101 bytes，SHA-256
  `b981e58b4863821fb31a7cf7e73120e3d1323f803cb0b7034bcf05d2a55f2e0c`。
- 来源 pins：
  `D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json`，
  53,547 bytes，SHA-256
  `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`；
  仍为 346 项，加本入口自身共 347 项。
- 安全基座：
  `D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830\10-MixedMaterialsGui-20261027-164646-server.py`，
  151,304 bytes，SHA-256
  `a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5`。

本目录新文件当前静态身份：

- `server.py`：76,898 bytes，SHA-256
  `bada298eb3e018f36ca0c4bf3ddb4d15da61a0e9aed399f2919e2f65a6a85e0e`。
- `probe.mjs`：32,525 bytes，SHA-256
  `766c0e1a3c1a81f0569efc429eda0d983030341a72cacadffa185697641ddf6f`。

固定快照到新文件的只读 diff 为：`server.py` 增 301 行、删 60 行；
`probe.mjs` 增 213 行、删 42 行。没有修改固定快照或产品源码。

## 有界改动

`server.py`：

- 1-105：改为 `T32-pdf-citation-*` 根名、PDF 固定输入、页 2 引用、
  `T32NativePdfCitation` 草稿和 `max_chars=500` 的页 2 读取常量。
- 348-479：保留 JPEG 严格身份；新增 PDF 原始/ready 副本身份、根目录
  inventory、恰好“JPEG + 一个 PDF”的 ready inventory、五页派生文本检查，
  以及 source PNG 的 canonical base64、PNG magic、IHDR、尺寸上限和非 1x1
  检查。
- 482-703：prepare 复制固定 JPEG 控制件和固定 PDF，不再写 TXT；manifest
  分别记录 JPEG source/copy 与 PDF source/copy，serve 前置检查根清单和
  运行时产物为零。
- 753-1195：真实 native bootstrap 以 `mode=ref` 登记 ready 中的 PDF；
  断言 PDF 原件没有被复制进案件、索引使用预期虚拟路径、派生文本确有五页、
  `pages_need_ocr=[]`、读记录为 `page/2..2`、出处为
  `{"unit":"page","from":2}`、覆盖为“1 份材料中已读 1/5 页”。
- 1217-1587：source authority 改为页 2；唯一 native source 返回必须含
  `经依法侦查查明`、`126,500`，不含首页标记
  `虚构市公安局虚构区分局`，并含结构正确的非空 PNG。
- 1589-1987：保留五参数 `platform.uname` 修复、内存占位凭据、零 OCR/
  Lifespan/Retainer/Office、自然关闭；最终元数据增加 PDF 原件与 ready 副本
  前后未变、页 2 PNG 元数据。
- 2101 起：仅把未来根名帮助文本改为 `T32-pdf-citation-*`。

`probe.mjs`：

- 24-47：固定 PDF/JPEG 身份、页 2 引用与读取常量。
- 91-147：派生五页文本检查与严格 PNG 解码/IHDR 检查。
- 214-565：manifest、六次 bootstrap、实际 ref、页 2 读记录、1/5 覆盖、
  真实 result/draft/index/reads/引用登记和“案件内无 PDF 原件副本”。
- 749-875：保留 401/403、精确 query、唯一一次 source、同案 reopen 与
  13 路由集合；实际 source 必须返回页 2 文本和 PNG。PNG 由响应 base64
  直接解码后以独占创建写入本次 run 根的 `probe-page2.png`，供 root 目检。
- 915-1047：自然关闭、source/fixture/PDF/settings/marker 不变、凭据为 0、
  listener/route/cleanup 边界、PNG 身份和日志不泄露正文。

## 未来 root 唯一有限命令

以下命令没有被作者执行。root 应先完成全套源码/probe/setup 审计，再在一个
全新的 run 根执行一次 20 秒有限事件；不得复用旧根。

```powershell
$pwsh = 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe'
$python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$node = 'E:\node\node.exe'
$here = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736'
$root = Join-Path $here ('runs\T32-pdf-citation-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$port = Get-Random -Minimum 49152 -Maximum 65000
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$tokenBytes = New-Object byte[] 32
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$token = [Convert]::ToHexString($tokenBytes).ToLowerInvariant()

$env:LB_PORT = [string]$port
$env:LB_TOKEN = $token
$env:LB_APPDATA = Join-Path $root 'private\appdata'
$env:LB_NATIVE_CITATION_ROOT = $root
$env:LB_NATIVE_CITATION_PORT = [string]$port
$env:LB_NATIVE_CITATION_TOKEN = $token

& $python (Join-Path $here 'server.py') --prepare --root $root
if ($LASTEXITCODE -ne 0) { throw 'prepare refused' }

$serve = Start-Process -FilePath $python `
    -ArgumentList @((Join-Path $here 'server.py'), '--serve', '--seconds', '20', '--root', $root) `
    -PassThru -WindowStyle Hidden

try {
    $limit = (Get-Date).AddSeconds(15)
    while (-not (Test-Path -LiteralPath (Join-Path $root 'ready.json'))) {
        if ($serve.HasExited) { throw 'fixture server exited before ready' }
        if ((Get-Date) -gt $limit) { throw 'fixture server ready timeout' }
        Start-Sleep -Milliseconds 200
    }
    & $node (Join-Path $here 'probe.mjs')
    $probeExit = $LASTEXITCODE
    Wait-Process -Id $serve.Id -Timeout 35 -ErrorAction SilentlyContinue
    if ($probeExit -ne 0) { throw 'probe failed' }
} finally {
    if (-not $serve.HasExited) { Stop-Process -Id $serve.Id -Force }
}
```

只有 future probe 退出 0、打印
`PASS T32 native PDF citation entry (...)`，并留下实际
`runs\T32-pdf-citation-...\probe-page2.png`，才可作为这一有限事件链的
候选证据；仍不等于 GUI 或产品验收。未来 GUI 必须由 root 使用自己的
`<=600s` 全新根和固定 GUI 基座
`D:/Lawbeach/lawbench-A/docs/plan/evidence/T32/NativeDocumentCitationGui-20261027-194505`
执行，不能复用 serve 根。

## 预期原始证据与人工检查

- `prepared.json`：JPEG 控制件和 PDF 原件/ready 副本分别有
  `sha256/bytes/mtime_ns`，初始案件目录为空。
- `bootstrap-report.json`：六次 ASGI native 调用；材料为 ref、
  `type=pdf`、`unit=page`、`unit_count=5`、`pages_need_ocr=[]`；
  读第 2 页，草稿只有一条第 2 页出处，`model_calls=0`。
- `ready.json`、`requests.ndjson`：IPv4 loopback、13 条只读路由集合、
  一次 exact source；所有 auth/policy 拒绝仍在 native 之前。
- `final-metadata.json`：PDF 原件与 ready 副本的 SHA、大小和
  `mtime_ns` 前后不变；JPEG 控制件同样不变；凭据 getter 为 0；无 OCR/
  Lifespan/Retainer/Office；listener、server task、net client 和日志自然关闭。
- `probe-page2.png`：必须由该 run 中实际 source 响应的
  `page_png_base64` 直接写出，不能替换、拼接或复用旧图。root 需目检它是
  起诉意见书第 2 页。

覆盖字段要按产品真实语义读：`coverage.total=1` 是材料数；
`partially_read[0].read_units=1`、`total_units=5` 才是页覆盖。保存草稿时
`not_fully_read=["起诉意见书"]` 是预期，不代表出处核对失败。

## 作者命令、静态检查与非零

作者只读并搜索了本执行令、两个固定清单、固定 server/probe 全文、夹具
说明/生成/校验、source/render/pdf、材料读取/草稿/覆盖实现和旧 README/
旧交回原文。实际 shell 目标为这些文件的绝对路径；搜索使用 `rg` 查询
`case_read_material|case_save_draft|not_fully_read|fully_read|partially_read`、
`T32*|PDF*|page_png*|source*|fixture*` 及旧 TXT 残留词。没有读取真实案卷、
`.env`、Keyring、凭据、发票、历史、缓存或 rollout。

写入只有：

- `New-Item` 创建本目标目录；
- 两次 `Copy-Item` 把固定 `00-server.py`、`01-probe.mjs` 复制成本目录
  新文件；
- `apply_patch` 只编辑本目录 `server.py`、`probe.mjs`，新建本
  `README.md`，并新建协调目录交回件。

静态身份/差异命令为 `Get-Item`、`Get-FileHash -Algorithm SHA256`、
`Test-Path`、`Get-ChildItem`、`rg -n`，以及两次全文
`git diff --no-index --unified=3` 和两次 `--numstat`。四次
`git diff --no-index` 均按预期 exit 1（有差异），另一次普通
`git status --short` 因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh`
权限拒绝而 exit 1；未修复、未扩权、未绕过。

交回前另以 `Get-Item`、`Get-FileHash -Algorithm SHA256` 和
`Get-ChildItem` 只读核验交回件与目标目录；在 B 仓工作目录对协调目录绝对
路径调用 `git status --short --ignore-submodules=all` 时，Git 因目标
`outside repository` exit 1，未改文件或 Git 状态。

通道偏差如实记录：六次只读 `Get-Content`/`rg`/`Get-FileHash` 请求误填
`shell=bash`，均在启动层被 `Bash/E_ACCESSDENIED` 拒绝，命令未执行、
未读取、未写入；一次只读调用误写长了 PowerShell 依赖目录，退出 0 但命令
仍为只读；四次只读查询使用短名 `pwsh`，退出 0。之后均恢复执行令指定的
完整原生 PowerShell 绝对路径。未运行 setup、未切 legacy、未改沙箱/审批/
ACL、未拆 writer 锁。当前 PID 是本次唯一执行者，不是第二 writer。

## 明确 NOT_RUN

作者没有运行 Python、Node、import、parser/AST、compile、Vitest、tsc、
pytest、collect、test、build、prepare、serve、probe、HTTP、GUI、trace、
Office、模型或 selftest，也没有执行 README 示例。故：

- 没有 PYTHON/JS 语法通过声明；
- 没有 PDF 解析、页 2 文本、PNG、HTTP、自然关闭或 GUI 通过声明；
- 没有作者侧红绿结果，所有运行结论均为 `NOT_RUN`；
- 没有真实案卷、模型调用、OCR、外部网络、凭据或 Office 动作。

本目录不修改产品、旧入口、旧探针、helper、来源 pins、schema、25 runtime、
E50、18 legacy、guard、resolver、PDF browser origin/5 assets、启动器或
打包。Git 全程只读，没有 `add/commit/rebase/stash/reset/clean/checkout/
merge/push`；没有提交 SHA，index、锁和既有 dirty 均未触动。Packaging
保持 `HOLD`。

## 历史证据保持原样

旧 2026-10-25 的 fake source/wiki、1px 页面和旧 fake GUI 结果均未复用为
通过证据。

先前 B main 的旧作者在 hard runtime ban 下重复启动未授权运行时，属于明确违规；其 existing raw/job/roots/README 保持原样，不能作为本轮作者 runtime proof。没有据此声称 main“未运行”。

root 仍需按执行令完成全字节反向核对和实际新鲜有限运行，随后再做 GUI
验证。在 root 独立收货前，本交回件不主张产品运行结论，也不进入打包、安装
或发布。

## 清理

默认保留未来运行根供复核。确认不再需要后，只对本次命令明确显示的
`$root` 执行：

```powershell
Remove-Item -LiteralPath $root -Recurse -Force
```

不得对本目录、`runs` 上级、旧 T32 证据或任何共享路径做递归删除。
