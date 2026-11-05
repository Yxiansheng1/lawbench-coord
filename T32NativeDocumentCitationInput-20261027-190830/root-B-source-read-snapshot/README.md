# T32 native document citation entry

状态：本目录是独立 B 线的有界 native fixture，不是 GUI、真实 Host/RPC、
模型、OCR、打包或生产验收。正式根运行完成后，结果只以本目录生成的
`runs/` 原始产物和本文件末节记录为准。

## 任务缺口与边界

当前文稿页 `documents.tsx` 在预览草稿时只调用
`<MarkdownText text={...} />`，没有传入 `citationInlineMarks`。回答面板已有
`citationInlineMarks(citationDepsFor(taskId))`，点击后可用
`material_id + citation + task_id` 打开临时原文页。因此本任务记录的是
“文稿 Markdown 未连接既有出处标记”的疑似缺口，不把它宣称为已确认的运行时
产品缺陷。

本目录不修改 `dsh-ext`、运行时、启动器、旧证据、公共 schema、Skill 或
来源 pin。旧 2026-10-25 的 fake source/wiki、1px 页面和旧 fake GUI 结果
均未复用为通过证据。

## 输入身份

- 当前 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`。
- 冻结的 346 项来源 pin：
  `D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json`，
  53,547 bytes，SHA-256
  `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`。
- 混合材料安全基座：
  `D:\Lawbeach\lawbench-coord\T32NativeDocumentCitationInput-20261027-190830\10-MixedMaterialsGui-20261027-164646-server.py`，
  151,304 bytes，SHA-256
  `a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5`。
- JPEG 身份 fixture：
  `D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg`，
  47,379 bytes，SHA-256
  `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`。

`prepared.json` 的 `source` 是上述冻结 pin 映射加本目录
`entry/server.py` 自身身份；不会生成新的当前源码 pin，也不会补一个伪造的
当前源码映射。

## 有界差异

- `server.py` 在 listener 建立前，以 `httpx.ASGITransport` 对同一个真实
  `lawbench.app.create_app()` 顺序调用六次：创建私有案件、以 `mode=ref`
  导入一份合成的引用 TXT、legacy 无 `request_id` 的 task begin、
  `case_read_material`、带一条确定性出处的 `case_save_draft`、以及
  `aborted / model_calls=0 / tool_calls=2 / elapsed_s=0` 的 task end。
- 案件号、任务号、材料号、引用记录和草稿路径全部从真实 native 响应或真实
  落盘记录取得。没有手写 task/index/result/reads/引用、wiki、history、
  request R、模型消息或门禁日志。
- 合成 TXT 始终留在私有 `input/ready` 中，通过 reference import 登记；
  案件目录中不复制该 TXT。JPEG 只复制到私有 ready 并核对固定身份，不导入、
  不 OCR。引用目标只有这份 owned pure TXT。
- 草稿只有一份：
  `T32NativeCitation-v1.md`。含一条真实出处
  `〔引用材料 第1行〕`，另有一行普通控制文字。真实
  `result.json.citations`、`reads.json`、`citation_check` 和 coverage 均由
  native TaskStore/tool 生成。
- bootstrap 使用 `ASGI-inprocess-no-socket`，不是 TCP，也不是 GUI。TCP
  阶段只开放现有只读 GUI 路由、精确同案 `POST /api/case/open`
  `{path, template:null}`，以及精确 `GET /api/source`。
- `/api/source` 只接受一次完全匹配的
  `case_id + material_id + citation + task_id` 四键 query；缺键、重复键、
  额外键、错案件、错材料、错出处或错任务均在 native 前拒绝。没有通用 source
  proxy。
- 没有开放 GUI save/remove/import/OCR/core/model/settings PUT、WebSocket、
  产品 lifespan、OCR 线程或 Retainer 进程。请求日志只记 method、path、
  status、disposition、channel 和耗时，不记 token、query、材料名、检索词、
  模型输入输出或正文。

## 契约与真实链路

本 fixture 使用当前 B 的 1.6 契约：

- `POST /api/case/open`
- `POST /api/materials/import`，`mode=ref`
- `POST /core/task/begin`
- `POST /core/tool` → `case_read_material`
- `POST /core/tool` → `case_save_draft`
- `POST /core/task/end`
- `GET /api/source` → `service/lawbench/case/source.py`

来源页返回的是实际导入 reference original 的第 1 行文本；TXT 的
`page_png_base64` 必须为 `null`，同一任务记录的版本未变时
`source_changed` 必须为 `false`。

## 根运行命令

以下命令只运行一次有限生命周期。所有 shell 均使用指定原生 pwsh，绝对
路径调用 Python/Node；token 只在进程环境中内存生成，不打印、不写仓库。

```powershell
$pwsh = 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe'
$python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$node = 'E:\node\node.exe'
$here = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDocumentCitationEntry-20261027-190830'
$root = Join-Path $here ('runs\T32-citation-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
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

只有探针退出码为 0 且输出
`PASS T32 native document citation entry (...)`，才算本有限事件链完成。
这不是 GUI 通过。

## 原始证据

预期运行根包含：

- `prepared.json`：私有路径、冻结 pin + own entry 身份、合成输入身份。
- `started.json`、`ready.json`：同一 PID、IPv4 loopback、实际端口。
- `native-calls.ndjson`、`bootstrap-report.json`：六次 real native ASGI
  调用的最小 ledger，以及真实 case/task/material/ref/draft/citation 身份。
- `requests.ndjson`：TCP 预转发拒绝与唯一 native `/api/source` 记录。
- `final-metadata.json`、`loop-closed.json`：自然关闭、source/fixture
  未变、guard、credentials、OCR/Retainer/lifespan 与 cleanup。
- `case/工作区/任务/<task_id>/`：真实 `task.json`、`result.json`、
  `reads.json` 和唯一草稿。

## 清理

默认保留运行根供复核。确认不再需要后，只对本次明确打印的运行根执行：

```powershell
Remove-Item -LiteralPath $root -Recurse -Force
```

不得对本目录、`runs` 上级或旧 T32 证据做递归删除。

## 明确未运行

- 不运行 GUI、真实 Host/RPC、实际桌面启动器、模型、OCR、WPS/Office、
  Python/Node test runner、Vitest、tsc、pytest、collect 或全量测试。
- 不运行旧 T32/T37/T38/T39 探针，不重演旧 MD save、fake source/wiki、
  1px 页面、混合 GUI、14/21/38 绿灯。
- 不生成/修改 wiki、history、模型输出、真实案卷、`.env.local`、Key、
  Keyring、Invoice ledger 或 DSH history。
- 不修改 Git index；不 add、commit、rebase、stash、reset、clean、checkout
  或 push。Packaging 保持 `HOLD`。

## 根运行结果

待正式根运行后按 `final-metadata.json`、`bootstrap-report.json` 和探针
原始输出回填；不以本文件存在代替运行结果。
