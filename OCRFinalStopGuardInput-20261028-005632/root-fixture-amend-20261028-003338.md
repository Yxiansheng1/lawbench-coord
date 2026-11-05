# 395 独立 OCR 夹具修正说明

状态：`AMENDED_NOT_RUN`

本文件只记录 2026-10-28 00:33:38 执行令要求的有界源码修正，是当前候选的运行边界与
CLI 说明。原 `README.md` 保持冻结；凡与本文件冲突的旧条目，以本文件为准，旧 README
本身不修改，也不覆盖其既有证据价值。

## 1. 旧 README 中被替代的内容

- 旧准备脚本中的 `_lawbench_fixed` 包、`types.ModuleType`、
  `importlib.util.spec_from_file_location` 和自建的 `PDFIUM_LOCK` 已全部删除。该实现
  不再存在；生产 `lawbench.ocr.render` 和 `lawbench.ingest.PDFIUM_LOCK` 通过 B 服务
  `sys.path` 正常导入，不使用别名模块、导入钩子或 stub。
- 旧 `--out` 示例把准备结果放进协调目录，已不适用。新准备脚本只接受当前用户
  `TEMP` 下的全新目录，且输出目录各级祖先必须是普通目录、不是 reparse point。
- 旧清理描述未说明异步 stdout/stderr 读取和 `WaitForExit()` 的无限等待风险。当前实现
  以启动后立即读取、共享 15 秒有界等待、精确 owned identity 核对和不误报关闭为准。

旧 README 第 1、2、5、6、9 节的固定事实、安全边界与授权门仍然有效；第 3、4、7、8 节
中与上述三点冲突的具体实现和命令，由本文件替代。

## 2. 本轮精确源码差异

`prepare_isolated_inputs.py`：

- 删除自定义 loader、模块注入和假 PDFIUM 锁；
- 正常导入未改的 B `lawbench.ocr.render`，校验其 `__file__` 精确等于固定源码路径，
  并确认 renderer 持有 `lawbench.ingest.PDFIUM_LOCK` 同一个真实锁对象；
- 仍调用 `_open_image(rendered, 2480)` 和
  `_preprocess(image, do_deskew=True, do_dewatermark=False)`，在 `finally` 中关闭原图与
  处理图；
- 输出根必须尚不存在、位于当前用户 TEMP 之下，所有祖先为普通目录且无 reparse；
- 固定夹具 47,379 字节 / `feeb9faf...59ad`、render 132,843 字节 /
  `6c839956...c40a`、请求体字段与 Xiaomi 模板语义不变；
- 准备阶段仍不创建 app、不启动 lifespan、不实例化 KeyChecker/backend、不读 Key、
  不建立 socket/HTTP、不启动模型。

`run-isolated-ocr.ps1`：

- `Split-Path -Parent` 改为 `System.IO.Path.GetDirectoryName`；从 stage 一直检查到 TEMP
  根，所有组件必须是目录，拒绝 reparse；
- 所有可能为零/单/多结果的 `Compare-Object`、listener pipeline 和数组 count 都已包在
  数组子表达式中；额外字段拒绝与零 listener 检查未放宽；
- Windows PowerShell 5.1 在构造 `HttpClient` 前显式
  `Add-Type -AssemblyName System.Net.Http`；
- 子进程启动成功后立即创建 stdout/stderr 异步读取；之后才探测 owned identity；
- 清理只用当前 `Process` 对象并复核已记录的 PID、可执行路径和 UTC birth，没有按 PID、
  端口或名称回退搜索；
- 进程退出、HTTP 句柄和两个 stream task 都有显式失败记录；stream task 最多共同等待
  15 秒，未完成时写 `[capture-incomplete]`，不读取未完成任务，也不声称流已关闭；
- 预检在启动前失败时不探测未分配的端口，不伪造进程日志；输出仍写真实 preflight
  metadata；
- 除 `System.Net.Http` 内置程序集加载外，不安装组件、不升 PowerShell、不改
  ExecutionPolicy/TLS/ACL/防火墙/服务。

## 3. 固定身份与复用依据

本轮源码修正不改变以下身份：

- 夹具：47,379 字节，SHA-256
  `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`；
- 既有生产 render：132,843 字节，SHA-256
  `6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a`；
- `app.py`：17,514 字节，SHA-256
  `011cf2e510d1ed03fe8dc8b14cc10feef5aa012e1a22e119a819fb6f8fecc5f1`；
- `backends.py`：10,931 字节，SHA-256
  `5cd1446577b7a61b60146d42a56e8778ecda0623dd2a5490b4b27e7138fc6200`；
- `dewatermark.py`：5,347 字节，SHA-256
  `1defd385791fbec594e9b09a9dcd6b6ec06ee0c019554dbc85185398b904748a`；
- B `render.py`：2,892 字节，SHA-256
  `600fbb3c368c6a0dbc71fd173c94ba5455af8518717284b852ccee8b72849ae3`；
- `llama-server.exe`：SHA-256
  `9d7ec1f038329210f6be353a889752ea4a762f9defa80560d37102ccce7b09a06`；
- Xiaomi model：1,516,744,960 字节，SHA-256
  `d796fa2cd211ba39a40f37691fc0046aa49f59c7968ec844eb9e81f2ae476a52`；
- mmproj：207,346,624 字节，SHA-256
  `634d6bc95781ebf4a3f06570a59859fa5082d488db540fd474bc6b4061aec90e`。

模型、mmproj 和远端 `dewatermark.py` 的本次只读复核依据：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\395-readonly-model-preprocess-pins-current.json`

二进制与既有 395 运行事实依据：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\395-SSH-readonly-evidence-current.json`

## 4. 当前精确 CLI

以下命令只供 root 在独立复核后使用；本轮 C 作者没有执行。`python` 的 `--out` 必须在
当前用户 TEMP 下，父目录预先存在；不得复用旧输出或覆盖同名目录。

本地准备（0 网络、0 模型）：

```powershell
$localParent = Join-Path ([System.IO.Path]::GetTempPath()) "lawbench-ocr-isolated-local-20261028-003338"
New-Item -ItemType Directory -Path $localParent
$localOut = Join-Path $localParent "prepared"
python "D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\prepare_isolated_inputs.py" --out $localOut
```

远端目录准备（root 的交互式 SSH 会话；不包含密码）：

```powershell
$remoteBase = "C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-003338"
New-Item -ItemType Directory -Path $remoteBase
New-Item -ItemType Directory -Path (Join-Path $remoteBase "parent")
New-Item -ItemType Directory -Path (Join-Path $remoteBase "stage")
```

只传修正后的候选源码：

```powershell
scp.exe -r "D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334" "pc@10.126.126.3:C:/Users/pc/AppData/Local/Temp/lawbench-ocr-isolated-20261028-003338/parent/candidate"
```

root 审计远端候选后，只传三份纯合成输入：

```powershell
scp.exe "$localOut\manifest.json" "$localOut\preprocessed-page1.png" "$localOut\request.json" "pc@10.126.126.3:C:/Users/pc/AppData/Local/Temp/lawbench-ocr-isolated-20261028-003338/stage/"
```

唯一一次私有实例执行：

```powershell
& "C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-003338\parent\candidate\run-isolated-ocr.ps1" -StageDir "C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-003338\stage"
```

`-ProbeExistingHealth` 仍是可选的额外 loopback 只读 GET，不是 OCR 推断。任何准备目录、
远端 stage 或 run 目录已存在时，root 必须换一个带唯一后缀的路径，不覆盖旧证据。

## 5. 有限等待与失败语义

- readiness 最多 120 秒；每次 health GET 的超时为 3 秒。
- 唯一推理 POST 最多经历产品同形 130 秒客户端边界，只发一次。
- 清理时对 owned `Process` 的最长 `WaitForExit` 为 15 秒；stdout/stderr 两个 task 的
  共同等待也为 15 秒。
- 只有启动后取得且再次核对 PID、路径、UTC birth 均一致，才会调用一次 `Kill()`；
  identity 失败时保留进程，不以 PID/端口/名称寻找替代目标。
- stream 或 exit 确认失败时记录 `private_process_cleanup.complete=false`、具体 liveness、
  `streams_closed`、`capture_complete` 和错误；原成功状态转为 exit 21
  `OWNED_CLEANUP_INCOMPLETE`。
- exit 0 只表示收到私有实例的普通 HTTP 响应，不表示 OCR 质量、根因或生产修复完成。

## 6. 验证边界

本轮 C 作者只做静态源码审计、禁用结构扫描和本地固定文件哈希复核。没有运行 Python
候选、PowerShell 候选、产品 parser/import/compile、测试、HTTP、SSH、SCP、GPU、模型、
自检或安装，也没有取得新的产品红/绿结果。

root 仍需独立完成累积 diff、全部 source/setup/finally、PowerShell parser、纯回调与
0 网络本地准备的验证。只有候选通过这些检查后，才可向人类提出具体 GPU/共享内存资源
批准；本源码修正本身不构成生产运行授权。
