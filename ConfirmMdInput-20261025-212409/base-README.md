# T32 registered native draft GUI entry

状态：`PREPARED_ONLY`。本目录只提供待主编排独立运行的 native GUI fixture
入口与只读探针。B 线没有启动服务、没有执行 HTTP、GUI、模型、OCR、测试或
探针，因此这里不是通过结论，也不是 T32、实际 Host/RPC、GUI 或打包验收。

## 身份与输入

- 当前 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`。
- 完整基座输入：`ORCH-T32GuiEntryInput-20261025-172934/server-before.py`，
  67,606 bytes，SHA-256
  `30dc704d919bf8a242d3a4e5a75f19866da66dcbff8cee8c57ae754cca3cd62f`。
- 原始谱系基座：`ORCH-T32NativeDraftInput-20261025-165327/server-before.py`，
  SHA-256
  `2e9d542ff0449fe5041f0cc6869a5470f610ed4ee7b5cd477332efc5f5bfd4cd`。
- 本目录 `server.py`：`77868` bytes，SHA-256
  `e041e2b27ea4b91b1cbae2be3abdc635475b830cf310ad0083b5caeb992ca86b`。
- 已读取的其余直接输入：`native-pass-README.md`、
  `ReadGet-original-context.txt`、`httpx-ASGITransport.py`、`core-api.py`、
  `drafts.py`。

`server.py` 由上述 30dc 基座整文件复制后做有界修改。准备、源码 pin、
环境隔离、鉴权、出站阻断、Keyring 拒绝、OCR/Retainer/lifespan 关闭、
cleanup 和 600 秒上限均沿用基座。

## 有界差异

- 路由只并集为本任务指定的 16 项：11 个 GET、`POST /api/case/open`、
  `begin/tool/end` 三个原生 core 路由，以及
  `POST /api/documents/save`。没有导入、OCR、上下文、进度、设置写入、
  document-read、模型、WebSocket 或其他 HTTP 路由。
- 防火墙在 listener 建立前，用 `httpx.ASGITransport` 对同一个原生 app
  顺序发起恰好四次真实调用：打开私有案件、固定协议 session 的 begin、
  固定 `T32SyntheticDraft` 的 `case_save_draft`、以及
  `aborted / model_calls=0 / tool_calls=1 / elapsed_s=0` 的 end。
- ASGI 客户端使用内存中的 Host bearer token，全部四调用共用一个
  `asyncio.wait_for(..., 10)`。它直接调用 ASGI app，不创建 socket
  HTTP 连接，也不触发 lifespan。
- 四次调用经过真实原生 middleware、契约和 handler，并由 TaskStore 与
  tool 写入案件。案件号、任务号和 v1 路径只从真实响应取得，没有手工
  构造 task/result、seed JSON、history 或索引。
- bootstrap 后再次严格核对 finished/cancelled、0 模型调用、1 工具调用、
  唯一原生 v1（54 bytes）与案件登记，然后才标记 GUI 阶段。
- `bootstrap-report.json` 只记 transport 标签、实际案件/任务、v1 相对
  路径和哈希、四次调用的方法/路径/状态与时间，不记 token、正文或完整
  响应。
- GUI 阶段三个 core 路由始终 403。同案 `case/open` 最多允许四次，计数在
  await 前原子增加；bootstrap 只接受精确 `{path}`，GUI 阶段额外接受精确
  `{path, template: null}`，其他键或非 null template 均拒绝；返回案件号
  必须与 bootstrap 原值一致，失败粘住。
- 11 个 GET 只在 bootstrap 完成且任务为严格 finished/cancelled、登记为
  唯一 v1 或 v1+v2 时放行。案件查询只接受捕获的 `case_id`；
  health/recent/settings/capsules 不接受额外 query；current 只接受单个
  非空、长度不超过 128 的 `session_id`。实际 UI session 与协议固定 UUID
  不同，因此原生 current 必须返回 `null`，没有 seed 或 override。
- documents save 只接受 bootstrap 返回的原生 v1 相对路径和固定 v2 正文。
  成功后必须是真实 v2/version 2，v1 不变；第二次保存 403。探针不引用
  Host filesystem readDocument，也不新增 `/api/documents/read`。

## ASGI、TCP、GUI 的边界

- ASGI in-process：证明同一原生 app 的真实 auth/contract/handler/
  TaskStore/tool 写入链；它不是 socket HTTP。
- TCP probe：只在 `ready.json` 之后由主编排用本目录 `probe.mjs` 发起，
  验证路由与会话边界，并把 `requests.ndjson` 的前四条 ASGI ledger 记录与
  后续 TCP 记录按 bootstrap report/ready 时间边界分开。
- GUI/真实 Host：仍完全未覆盖。Host filesystem RPC、真实桌面 session、
  new launcher、打包、模型、OCR 和权限行为都必须由根侧下一阶段独立准入。

## 主编排根运行

以下命令只由主编排执行；B 线不执行。探针只使用 Node 内建模块，不生成
dependency、不 spawn 子进程、不写文件。根命令负责 prepare、启动一个
20 秒 fixture 服务并运行探针。token 只在进程环境内存中生成，不打印。

```powershell
$here = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934'
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
    & 'E:\node\node.exe' (Join-Path $here 'probe.mjs')
    $probeExit = $LASTEXITCODE
    Wait-Process -Id $serve.Id -Timeout 30 -ErrorAction SilentlyContinue
    if ($probeExit -ne 0) { throw 'probe failed' }
} finally {
    if (-not $serve.HasExited) { Stop-Process -Id $serve.Id -Force }
}
```

探针退出码 0 且输出
`PASS T32 native GUI draft entry fixture (...)` 才表示这一有界根运行通过。
它仍不表示实际 GUI、Host、new launcher、模型或打包通过。

## 已验证与未验证

本 B 线只做了直接输入的完整读取、源码有界差异旁证、哈希和交付文件静态
核对。按执行令，没有运行 author test/parser/build/prepare/serve/probe/GUI/
Vitest/tsc/pytest/collect/selftest。任何 prepare、bootstrap、TCP、cleanup、
source pin 或 cleanup 失败都必须按根运行原始产物判失败，不能把本文件
存在解释为通过。

Git 全程只读；未 add、commit、rebase、stash、reset、checkout、clean 或
push。既有 dirty 保持不变。Packaging 继续保持 `HOLD`。
