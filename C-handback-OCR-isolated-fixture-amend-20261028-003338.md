# C 交回：395 独立 OCR 夹具候选有界修正

状态：`AMENDED_NOT_RUN`

本次只按
`D:\Lawbeach\lawbench-coord\C-OCR-isolated-fixture-amend-order-20261028-003338.md`
修正两处已存在的候选源码，并新增根目录修正说明。C 作者没有运行 Python/PowerShell
候选、产品 parser/import/compile、测试、HTTP、SSH、SCP、GPU、模型、自检或安装；没有
生产动作、凭证读取、配置/日志模式/权限/ACL/防火墙变更。没有 Git 提交 SHA，也没有
任何 Git 写操作。

## 1. 输入与既有状态

正式令要求读取的
`D:\Lawbeach\lawbench-coord\OCRIsolatedFixtureAmendInput-20261028-003338.md`
当前不存在，读取返回“找不到路径”。未据此停工：本轮按正式令自身、旧 C 交回件、既有
固定源码、旧成功消费者和 root 只读证据完成有界修正；该缺失在本文明确留痕，没有伪造
输入文件。

全仓 `git status` 仍受既有
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh: Permission denied`
阻碍。没有尝试修权限、锁、审批、沙箱或 ACL。限路径只读状态显示候选目录原有三件仍为
未跟踪，本轮只在该目录新增替代说明；协调目录只新增本文：

```text
?? prep395/deploy/isolated-synthetic-crash-20261028-001334/README.md
?? prep395/deploy/isolated-synthetic-crash-20261028-001334/prepare_isolated_inputs.py
?? prep395/deploy/isolated-synthetic-crash-20261028-001334/root-fixture-amend-20261028-003338.md
?? prep395/deploy/isolated-synthetic-crash-20261028-001334/run-isolated-ocr.ps1
```

旧 `README.md`、旧正式交回、既有原始结果、25 个 outputs、18 个 legacy、E50、产品、
契约、部署基座、config、guard、native、GGUF 和固定哈希均未改。旧 README 的字节与哈希
仍为 10,545 /
`2477e1659a11a9cd96e8fcc0cde1de1b37a8a10b10fc2a14e3312e351be4b910`。

## 2. 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\prepare_isolated_inputs.py` | 11,915 | `34432c4ebfa8585a993ebc90287e2e5b555854be5e372bd37bc36cf317cc0ae0` |
| `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\run-isolated-ocr.ps1` | 36,518 | `da3f0aedeacff49b69050b1414c05362d8824789eb85ee3e56123846b6470bcd` |
| `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\root-fixture-amend-20261028-003338.md` | 8,303 | `15044a2bc5b7cafe2913c12a0963e34708f9e6fee52a11c436582feb7a5b469d` |
| `D:\Lawbeach\lawbench-coord\C-handback-OCR-isolated-fixture-amend-20261028-003338.md` | 本文 | 不预置自哈希 |

## 3. 修正结果

准备脚本已删除 `importlib.util`、`types.ModuleType`、`_lawbench_fixed` 和假
`PDFIUM_LOCK`。B `service` 现在使用正常 `sys.path` 包导入，校验
`lawbench.ocr.render.__file__` 精确等于固定 `render.py`，并确认其 `_PDFIUM` 与
`lawbench.ingest.PDFIUM_LOCK` 是同一真实生产锁对象。固定 render 调用、prep395
预处理语义、Xiaomi 请求体和 source pins 均未改变。

输出目录现在要求：绝对路径、位于当前用户 TEMP 严格子路径、尚不存在、父目录预先存在、
从输出父目录到 TEMP 根全部是普通目录且无 symlink/junction/reparse。`mkdir` 不再创建
任意父链。准备时原图和处理图在 `finally` 关闭，已发送 PNG 的上下文句柄也正常退出；
不会因关闭而新增“实际运行”字段。

PowerShell 候选的 `Split-Path -Parent` 已改为
`System.IO.Path.GetDirectoryName`，并从 stage 逐级检查到 TEMP 根；所有可能产出
0/1/多对象的 `Compare-Object` 和 listener 计数都先包进数组。额外字段拒绝与零 listener
控制保留。`Assert-PropertySet` 在本轮目标场景中应返回零差异、而不是访问空输出的
`Count`；固定对象仍应通过，额外字段仍应拒绝。

Windows PowerShell 5.1 在构造 `HttpClient` 前显式加载内置
`System.Net.Http`。没有安装、PS 升级、ExecutionPolicy/TLS/安全策略变更。

子进程启动成功后先立即创建 stdout/stderr 异步读取，再取得 owned identity。清理只对
这个 `Process` 对象执行一次 PID/path/UTC-birth 复核；身份失败就不 kill，且不按 PID、
端口、名称回退。进程 exit 与两个 stream task 使用已存在的 15 秒技术边界；未完成时
写 `[capture-incomplete]`，记录 `complete=false`、liveness、`streams_closed=false`、
`capture_complete=false` 和具体错误。若此前本来可为 exit 0，则转 exit 21
`OWNED_CLEANUP_INCOMPLETE`。没有无参数 `WaitForExit()`，没有对未完成任务调用
`GetAwaiter().GetResult()`，也没有在 `finally` 伪称自然清理。

预检在进程启动前失败时，不再写入“捕获不完整”的伪进程日志，也不查询未分配端口；
`private_process_cleanup` 仍写出真实 not-started/incomplete metadata。HTTP/response/
content/client 和 Process 句柄均逐项 best-effort 释放，释放错误不改写成 PASS。

替代说明落实了旧 README 的精确取代范围、当前 CLI、固定身份、等待和失败语义。旧
README 被冻结，没有编辑。

## 4. 静态验证

本轮只做以下可复用静态核对，不声称产品红、GPU 红、OCR PASS、根因或生产修复：

- 夹具 47,379 字节 / `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`；
- `app.py` / `backends.py` / `dewatermark.py` / B `render.py` 当前 SHA-256 分别为
  `011cf2e5...cc5f1`、`5cd14465...fc6200`、`1defd385...748a`、
  `600fbb3c...49ae3`，与候选 source pins 一致；
- root 既有只读证据仍固定同一 `llama-server.exe` SHA-256
  `9d7ec1f038329210f6be353a889752ea4a762f9defa80560d37102ccce7b09a06`，同一 model
  1,516,744,960 字节 / `d796fa2c...6a52`，同一 mmproj 207,346,624 字节 /
  `634d6bc9...aec90e`；
- PowerShell 只有一个 `System.Net.Http` 内置程序集加载、一个私有 Process 启动点、
  一个推理 `PostAsync` 和一次 owned `Kill()` 调用；
- 未命中 `Split-Path`、无参数 `WaitForExit()`、旧 `Complete-StreamTask`、自定义 loader/
  假锁，也未命中服务重启、防火墙、计划任务、WebRequest 等生产操作；
- `run-isolated-ocr.ps1` 为纯 ASCII、无 BOM；首三字节 `5B 43 6D`。

## 5. 下一步只属于 root

root 仍需重新审计当前累积源码与全部 setup/finally 路径，随后才可做 PowerShell
parser/compile、纯参数/回调检查，以及 0 网络、0 模型的本地准备。只有这些候选验证完成，
才可把额外 Vulkan/GPU 与共享内存影响提交具体人类资源批准。此前的只读 hash 与本次源码
审计不构成运行授权，也不授权 SSH/SCP/生产端口操作。

## 6. 实际命令与非零

下表按发生顺序列出所有独立 shell 调用；同一并行批次内也逐项列出。长文件列表在表中
缩写成对应完整目标，但每条都有唯一动作，不是按阶段合并。A33 的 PowerShell 单行字节检查
被宿主改写后产生 `ParserError`，没有读取产品代码或产生文件副作用。

| ID | 实际命令/动作 | exit |
|---|---|---:|
| A01 | `Get-Content -Raw` 正式执行令 | 0 |
| A02 | `git status --short --untracked-files=all` | 1：`dsh` chdir Permission denied |
| A03 | `Get-Content -Raw` 指定 amend input | 1：路径不存在 |
| A04 | `Get-ChildItem -Force` 候选目录 | 0 |
| A05 | `Get-Content -Raw` B 旧成功 `consumer.py` | 0；宿主截断显示 |
| A06 | `git status --short ... --` 候选目录 | 0 |
| A07 | `Get-ChildItem -Force` 协调目录 OCR/003338 文件过滤 | 0 |
| A08 | `Get-Content -Raw` 旧 `prepare_isolated_inputs.py` | 0 |
| A09 | `Get-Content -Raw` 旧 `run-isolated-ocr.ps1` | 0 |
| A10 | `Get-Content -Raw` 旧 C 交回件 | 0 |
| A11 | 误把 `shell` 写成 `bash` 读取 B `render.py` | 1：执行前 `Bash/E_ACCESS_DENIED` |
| A12 | `rg -n --fixed-strings "PDFIUM_LOCK"` B service | 0 |
| A13 | `rg -n` 旧 consumer 的 path/import/render 行 | 0 |
| A14 | 原生 pwsh `Get-Content -Raw` B `render.py` | 0 |
| A15 | `Get-Content` consumer 的 OCR 消费片段 | 0 |
| A16 | `rg -n` prep395 `_open_image/_preprocess/close` | 0 |
| A17 | `rg -n` PowerShell `Count/Split/WaitForExit/...` | 0 |
| A18 | `Get-Content` `app.py` 120 行附近 | 0 |
| A19 | `Get-Content -Raw` B `ingest\__init__.py` | 0 |
| A20 | `Get-Content` `backends.py` LlamaServerBackend 片段 | 0 |
| A21 | 误把 `shell` 写成 `bash` 搜索 `backends.py` | 1：执行前 `Bash/E_ACCESS_DENIED` |
| A22 | `Get-Content` PowerShell 220 行附近 | 0 |
| A23 | `Get-Content` PowerShell 320 行附近 | 0 |
| A24 | `Get-Content` PowerShell 455 行附近 | 0 |
| A25 | `Get-Content` PowerShell 508 行附近 | 0 |
| A26 | 误把 `shell` 写成 `bash` 读取 PowerShell 620 行附近 | 1：执行前 `Bash/E_ACCESS_DENIED` |
| A27 | 原生 pwsh 重读 PowerShell 620 行附近 | 0 |
| A28 | `rg -n "\.Count|Split-Path|WaitForExit..."` 修正中脚本 | 0 |
| A29 | `rg -n "importlib|types...|PDFIUM_LOCK|render_png..."` Python 候选 | 0 |
| A30 | `rg -n` 服务控制/外连/代理 token 扫描 | 1：无匹配 |
| A31 | `Get-Content -Raw` 修正中 Python 全文 | 0 |
| A32 | `Get-Content -Raw` 修正中 PowerShell 全文 | 0 |
| A33 | PowerShell 单行字节/非 ASCII/BOM 检查 | 1：命令被宿主改写后 `ParserError` |
| A34 | `rg -n` 全 `.Count/WaitForExit/...` 审计 | 0 |
| A35 | `rg -n` Python 正常导入/锁/close 审计 | 0 |
| A36 | `rg -n` 生产变更/外连 token 扫描 | 1：无匹配 |
| A37 | `Get-Content` PowerShell request/cleanup 片段 | 0 |
| A38 | `Get-FileHash` 两脚本（表格式显示） | 0 |
| A39 | `rg -n "[^\x00-\x7F]"` PowerShell | 1：无非 ASCII |
| A40 | `Format-Hex ... -Count 3` PowerShell | 0：无 BOM |
| A41 | `Get-Item` 两脚本长度/时间 | 0 |
| A42 | `Get-FileHash` 固定 fixture 与四份生产源码 | 0 |
| A43 | `rg -n` Add-Type/Start/POST/Wait/Kill/URI/token | 0 |
| A44 | `rg -n` Python loader/network/key/close/mkdir 审计 | 0 |
| A45 | `Get-Content -Raw` 新 395 model/dewatermark 只读 pin 证据 | 0 |
| A46 | `Get-Content -Raw` 旧 395 SSH 只读证据 | 0 |
| A47 | `rg -n` PropertySet/listener/all Count 审计 | 0 |
| A48 | `rg -n` 已删除结构/服务控制扫描 | 1：无匹配 |
| A49 | `rg -n --fixed-strings` 精确启动/POST/Kill/Add-Type | 0 |
| A50 | `Get-Content -Raw` 旧 README | 0 |
| A51 | `rg -n "runDir"` 检查日志/结果路径 | 0 |
| A52 | `rg -n "runDir|private_process_logs"` 复核 preflight 日志门 | 0 |
| A53 | `Get-FileHash` 两脚本、新说明、旧 README | 0 |
| A54 | `Get-Item` 两脚本、新说明、旧 README | 0 |
| A55 | `rg -n` 删除结构/生产操作终检 | 1：无匹配 |
| A56 | `rg -n --fixed-strings` 添加程序集/有界 task/POST/Kill | 0 |
| A57 | `rg -n "[^\x00-\x7F]"` PowerShell 终检 | 1：无非 ASCII |
| A58 | `Format-Hex ... -Count 3` PowerShell 终检 | 0：无 BOM |
| A59 | `git status --short --untracked-files=all --` 候选目录 | 0 |
| A60 | `Get-Content -Raw` 本交回件终读 | 0 |
| A61 | `Get-FileHash` 本交回件、两脚本、新说明 | 0 |
| A62 | `Get-Item` 本交回件、两脚本、新说明 | 0 |
| A63 | `Get-ChildItem` 协调目录确认本交回件存在 | 0 |

所有非零已逐项列出。A11/A21/A26 均为宿主在启动 Bash 前拒绝，未发生 Bash 执行或文件、
进程、网络、Git 副作用；这三个 shell 参数错误明确交 root 审计。A02 的权限拒绝和 A03
的输入缺失未通过扩权、修锁或伪造文件绕过。A30/A36/A48/A55/A57 的 exit 1 是搜索无命中，
属于预期静态扫描结果。

## 7. 写入面

所有文件写入均通过 `apply_patch`，只触达正式令允许的四个文件：

- 两处已有候选源码；
- 新增 `root-fixture-amend-20261028-003338.md`；
- 新增本交回件。

没有 `git add/commit/rebase/stash/reset/clean/checkout/push`，没有 staging 写入，没有
递归删除/移动，没有改 `.env.local`、Key、密码、ACL、锁、沙箱或审批。

## 8. 停止

本次交付停在 `AMENDED_NOT_RUN`。root 独立复核和批准链完成前，不执行远端或生产资源
动作；C 作者到此停止。
