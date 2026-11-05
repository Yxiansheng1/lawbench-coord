# T15 原生 Markdown 成果确认入口

状态：`PREPARED_ONLY`。本目录提供由已审 T32 GUI 草稿入口全文复制后形成的
有限 native server、只读 TCP 探针和运行说明。B 线没有运行 prepare、serve、
probe、HTTP、GUI、Word、模型、OCR 或测试，因此这里的交付不是运行通过，
也不是 T15、实际 Host/RPC、GUI、Word 导出、打包或模型整链验收。

## 文件与边界

- `server.py`：完整沿已审 `base-server.py`（77,868 bytes，SHA-256
  `e041e2b27ea4b91b1cbae2be3abdc635475b830cf310ad0083b5caeb992ca86b`）
  复制，只移除 `POST /api/documents/save`，换入
  `POST /api/outputs/confirm`；总路由仍为 16 条。
- `probe.mjs`：只使用 Node 内建模块，只读运行产物，向
  `127.0.0.1` 发起真实 HTTP；不写文件、不 spawn、不 mock、不输出 token。
- 新 confirmation 分支在 policy/claim 之前只接受一个
  `Authorization` 头，且值必须与内存中的 Host token 精确相等。两个头的
  bad/good、good/bad 两种顺序都返回 401。
- confirmation claim 只接受精确五字段：
  `case_id/task_id/draft/formats/template`；只接受 bootstrap 实际产生的
  case/task、v1 路径、`formats: ["md"]` 和 `template: null`。
- 原生 `Exporter.confirm` 仍是唯一成果写入者。探针验证成果目录仅含
  `成果/T32SyntheticDraft-v1.md` 与 `成果/索引.json`，Markdown 为原 v1
  的 54 bytes/原 SHA，索引恰一条且 task/inputs/draft 与唯一原生 task 一致。

## 主编排运行

以下命令只由主编排执行。token 只用 PowerShell 内存变量写入子进程环境，
不写盘、不打印；`LB_PORT`/`LB_TOKEN`/`LB_APPDATA` 供 server，
`LB_NATIVE_GUI_ROOT`/`LB_NATIVE_GUI_PORT`/`LB_NATIVE_GUI_TOKEN` 供 probe。

```powershell
$here = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmMdEntry-20261025-212409'
$root = Join-Path $here ('runs\T33-host-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
$port = Get-Random -Minimum 49152 -Maximum 65000
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$tokenBytes = New-Object byte[] 32
$rng.GetBytes($tokenBytes)
$rng.Dispose()
$token = [Convert]::ToHexString($tokenBytes).ToLowerInvariant()

$env:LB_PORT = [string]$port
$env:LB_TOKEN = $token
$env:LB_APPDATA = Join-Path $root 'private\appdata'
$env:LB_NATIVE_GUI_ROOT = $root
$env:LB_NATIVE_GUI_PORT = [string]$port
$env:LB_NATIVE_GUI_TOKEN = $token

python (Join-Path $here 'server.py') --prepare --root $root
if ($LASTEXITCODE -ne 0) { throw 'prepare refused' }

$serve = Start-Process -FilePath 'python' `
    -ArgumentList @((Join-Path $here 'server.py'), '--serve', '--seconds', '20', '--root', $root) `
    -PassThru -WindowStyle Hidden

try {
    $limit = (Get-Date).AddSeconds(10)
    while (-not (Test-Path -LiteralPath (Join-Path $root 'ready.json'))) {
        if ($serve.HasExited) { throw 'fixture server exited before ready' }
        if ((Get-Date) -gt $limit) { throw 'fixture server ready timeout' }
        Start-Sleep -Milliseconds 200
    }

    $probeLog = Join-Path $root 'probe-output.txt'
    & 'E:\node\node.exe' (Join-Path $here 'probe.mjs') 2>&1 |
        Tee-Object -FilePath $probeLog
    $probeExit = $LASTEXITCODE
    Wait-Process -Id $serve.Id -Timeout 30 -ErrorAction SilentlyContinue
    if ($probeExit -ne 0) { throw 'probe failed' }
}
finally {
    if (-not $serve.HasExited) { Stop-Process -Id $serve.Id -Force }
    Remove-Item Env:LB_TOKEN, Env:LB_NATIVE_GUI_TOKEN -ErrorAction SilentlyContinue
}
```

`server.py --serve` 的有限运行是 20 秒。probe 只把短摘要写到标准输出，
不生成独立通过报告；主编排把标准输出重定向到该 run 的
`probe-output.txt`。探针等待 `final-metadata.json` 与
`loop-closed.json` 自然出现，25 秒上限、5 秒轮询。

## 失败时看什么

原始证据都留在本次 `$root`：

- `prepared.json`、`started.json`、`bootstrap-report.json`、`ready.json`；
- `requests.ndjson`、`final-metadata.json`、`loop-closed.json`；
- 若启动或运行异常，检查 `run-error.json`；
- `private\appdata\logs\service.log` 与 `probe-output.txt`。

任何 prepare、ASGI bootstrap、TCP probe、成果/索引核对、自然关闭或
source pin 失败都必须按原始产物判失败，不因本说明存在而降级。合法
confirmation 成功后才允许写成果；`confirm_failed` 粘住，不重试。

## 未运行与未覆盖

B 线只完成执行令输入读取和白名单文件准备，没有运行任何 prepare、HTTP、
GUI、Word、OCR、模型、Vitest、tsc、pytest、collect、parser、compile、
build 或自测。既有 dirty 未触碰，Git 全程只读，没有 add、commit、rebase、
stash、reset、checkout、clean 或 push。本次 prepared 不证明 HTTP/GUI/
Word/模型整链通过，Packaging 继续保持 `HOLD`。
