# T33 relocate entry draft

状态：仅准备给 root 审阅和执行，尚未由作者运行。不是 GUI、API、OCR、模型或 T33 验收。

## 固定边界

- 新建 run 必须是 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\runs` 的直接子目录，名称严格为 `T33-host-YYYYMMDD-HHMMSS`。
- 固定私有源：`<run>\input\ready\relocation-source.jpg`，47379 字节，SHA-256 `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`。
- 固定新位置：`<run>\input\ready\relocation-moved.jpg`。
- `source-stage.py` 只接受 `--root` 与 `--create`、`--move`、`--verify` 中恰好一个 stage；没有任意 source/dest、覆盖或递归删除参数。
- 本目录不提供 GUI launcher。launcher 必须等 root 审完本目录 `server.py` 的 SHA 与改动后另派。

## 1. 新建、创建、创建态验证

在 PowerShell 中先取一个全新时间戳。不要复用已有 run。

```powershell
Set-Location 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639'
$t33RunRoot = Join-Path 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\runs' ('T33-host-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
py -3.12 -B -X utf8 .\server.py --prepare --root $t33RunRoot
py -3.12 -B -X utf8 .\source-stage.py --root $t33RunRoot --create
py -3.12 -B -X utf8 .\source-stage.py --root $t33RunRoot --verify
```

第三步应输出 `OK: state=create`。若任一步失败，保留整个 root 和准确 `GUARD:` 原因后停下；不要删根、重跑 create 或改 sidecar。

create 的副作用仅有：

- 写入固定私有副本 `relocation-source.jpg`。
- 新增 `<run>\relocation-source.json`，记录 root、固定源/目标路径、原 `prepared.json` 与原 JPEG 的字节/hash/mtime，以及新源字节/hash/mtime。
- 不改 `prepared.json`、原 `转账截图.jpg`、case、服务或 GUI。

## 2. root 审阅与真实服务

root 先审 `server.py`，至少确认 `ROUTES`/`CASE_ROUTES` 只新增
`POST /api/materials/relocate`，relocate 分支只接受已绑定 case 的 `R01` 与固定目标路径，
并要求旧 `relocation-source.jpg` 用 `lexists` 判断为不存在。审阅后记录其 SHA-256：

```powershell
Get-FileHash -LiteralPath .\server.py -Algorithm SHA256
```

真实 launcher/environment 必须由 root 后续按获批 literal 方式提供，并注入 `LB_PORT`、64 位十六进制 `LB_TOKEN` 和准确的 `LB_APPDATA`。不要把 token 写进本目录、日志或命令历史。root 审完后启动当前 B 的真实产品 app：

```powershell
$env:LB_APPDATA = Join-Path $t33RunRoot 'private\appdata'
py -3.12 -B -X utf8 .\server.py --serve --seconds 600 --root $t33RunRoot
```

`LB_PORT`、`LB_TOKEN` 必须由上述获批 launcher 环境提供。`--serve` 启动真实 `lawbench.app.create_app`，lifespan 为 off，OCR 不启动，Retainer 不启动/不关闭，产品网络拒出站，监听仅 `127.0.0.1`。

root 自己核对 `<run>\started.json` 的真实 PID，再确认真实 GUI 的
`<run>\gui\state\current.json` 为：

```json
{"runRoot":"<同一个 run 的绝对路径>","phase":"running"}
```

本文件不提供或替代真实 GUI launcher。

## 3. 真实登记 R01、移动、原生重新定位

先经真实 app 打开 `<run>\case`，再经真实 app 以 `mode=ref` 登记固定源。请求字段必须是契约形状：

```json
{
  "case_id": "<真实 case/open 返回值>",
  "paths": ["<run>\\input\\ready\\relocation-source.jpg"],
  "target": null,
  "unzip": false,
  "mode": "ref"
}
```

这条 import 必须由产品 app 真实执行；`source-stage.py` 不伪造 API 响应、case、材料、DB、会话或 history。登记后 `case\工作区\材料\引用.json` 应有唯一的 `R01`，path 指向上述固定源，kind 为 `file`、status 为 `ok`；`index.json` 应有 origin 为 `ref`、ref_id 为 `R01`、rel_path 为
`工作区/引用/R01/relocation-source.jpg`、SHA-256 为固定值的 `needs_ocr` 材料。

只有同时满足以下条件后，root 才运行 move：

- root 已核对 `started.json` 中的真实 PID。
- 真实 GUI current 的 `runRoot` 是同一 run，`phase` 是 `running`。
- 上述 R01 与材料身份都来自真实 app，不是手写记录。

```powershell
py -3.12 -B -X utf8 .\source-stage.py --root $t33RunRoot --move
```

move 会在同一 `ready` 目录把 `relocation-source.jpg` 用 `os.rename` 改为
`relocation-moved.jpg`，不覆盖目标，并新增 `<run>\relocation-move.json`。它不修改 case、`引用.json`、`index.json`、原 JPEG、`prepared.json` 或 `relocation-source.json`。哈希、大小和 mtime 必须在改名前后相同。若 move 失败，立即停下并保留证据，不得自动重复。

随后在真实 GUI 重新扫描，确认 R01 与材料进入 `missing`；由用户通过原生选择器选定固定新位置
`<run>\input\ready\relocation-moved.jpg`，再走真实
`POST /api/materials/relocate`。服务端准入请求体为：

```json
{"case_id":"<已绑定真实 case>","ref_id":"R01","path":"<run>\\input\\ready\\relocation-moved.jpg"}
```

该 JSON 只用于核对字段；不能拿伪造响应替代真实 GUI 选择与产品保存。

## 4. 终态只读验证

```powershell
py -3.12 -B -X utf8 .\source-stage.py --root $t33RunRoot --verify
```

终态应输出 `OK: state=move`。verify 只读，检查 create/move 两种已声明状态、源或目标的字节/hash/mtime、原 JPEG 与 `prepared.json` 未变、两个 sidecar 相互一致。它不会把 `OK` 冒充 GUI 成功或 T33 验收。

`--serve` 的 `--seconds` 上限是 600；到时由入口自身关闭 listener、net client、产品日志和 event loop，并写 `final-metadata.json` 与 `loop-closed.json`。本单脚本不启动、停止或清理服务。root 应保留整个 run；不得删除证据、改权限、改锁或拆 writer 锁。
