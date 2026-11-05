# 395 独立同二进制定位崩溃候选

状态：`AUTHORED_NOT_RUN`

本目录只服务本次合成材料 OCR 崩溃定位。作者没有启动 Python、模型、HTTP、SSH、
395 生产服务或本候选脚本，也没有执行编译、导入、测试、构建或自检。实际运行必须由 root
独立审计候选、向人类说明生产资源影响并取得批准后再做。

## 1. 固定事实

- 夹具：`D:\Lawbeach\lawbench-B\tests\fixtures\criminal-01\转账截图.jpg`
- 夹具身份：47,379 字节，SHA-256
  `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`
- 既有原始渲染证据：750×1334 PNG，132,843 字节，SHA-256
  `6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a`
- 真实生产记录：纯合成请求收到 HTTP 500 / `ReadError`；同一时段 Windows Application
  1000 记录 `llama-server.exe` 在 `ucrtbase.dll` 以 `c0000409` 退出；当前 OCR
  进程随后启动。精确 native assertion 未保留，根因仍未确认。
- 生产源码哈希与固定快照一致：`app.py` 011cf2e5…c5f1，`backends.py`
  5cd14465…6200，`dewatermark.py` 1defd385…748a，B 的 `render.py`
  600fbb3c…9ae3。

本候选不重做业务质量判断，不把 HTTP 500、native crash、正常响应或输出质量中的任何一种
自称成根因。

## 2. 精确源码调用链

准备脚本逐字校验固定字节数与 SHA-256 后，执行以下未改产品路径：

1. B `render_png(fixture, "image", 1)`：EXIF 摆正、RGB、长边上限 2480、PNG 无 optimize。
2. prep395 `_open_image(rendered, 2480)`：只接受 PNG/JPEG、加载后转 RGB。
3. prep395 `_preprocess(image, deskew=True, dewatermark=False)`：调用生产 `deskew()`，
   不调用去水印，随后以 Pillow `img.save(out, "PNG")` 生成待发送 PNG。
4. 使用生产 `OCR_TEMPLATES["xiaomi-ocr-0"]` 的原文提示词与图前文后顺序，构造
   `LlamaServerBackend._chat()` 同形请求体：模型 `Xiaomi-OCR-0.BF16.gguf`、
   `temperature=0`、`max_tokens=4096`、`stream=false`、
   `chat_template_kwargs.enable_thinking=false`。

准备脚本不调用 `create_app()`、不启动 lifespan、不实例化 KeyChecker 或 backend、
不读业务 Key、不发起网络或模型请求，并禁止 Python 写入字节码文件。

## 3. 候选文件

- `prepare_isolated_inputs.py`：本地一次性准备。输入是固定的纯合成夹具和固定源码；
  输出是渲染 PNG、预处理 PNG、生产请求 JSON 与身份清单。
- `run-isolated-ocr.ps1`：只在 root 批准后于 395 运行。只启动一个私有
  `llama-server.exe`，只向它自己的 `127.0.0.1` 随机端口发一个合成请求。
- `README.md`：本说明。

没有 installer、loader、framework、package、service、daemon、策略、ACL、锁或防火墙改动。

## 4. 本地准备命令

以下命令由 root 审计后自行执行，作者未执行：

```powershell
$localOut = "D:\Lawbeach\lawbench-coord\OCRIsolatedCrashPrepared-20261028-001334\prepared-<unique>"
python "D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\prepare_isolated_inputs.py" --out $localOut
```

`--out` 必须是尚不存在的绝对路径。成功准备只是 `PREPARED_NOT_RUN`，不是 OCR PASS。
脚本会记录实际的预处理 PNG 尺寸/字节数/SHA-256 和请求 JSON 字节数/SHA-256；
这些值以准备输出中的 `manifest.json` 为准，不在本说明里编造。

## 5. 远端 preflight

root 在 395 上必须使用当前用户 `%TEMP%` 下全新的普通、非 reparse 私有目录。
候选只接受这个目录中的：

```text
manifest.json
preprocessed-page1.png
request.json
```

远端脚本会在启动任何模型进程前逐项中止检查：

- 目录在用户 TEMP 下、没有 reparse 组件，输入文件和 manifest 身份一致；
- 请求中图片 data URL 解码后的字节数/SHA-256 与 manifest 一致；
- 请求体没有 credential、password、API key 或业务 Key 字段；
- 二进制固定在 `C:\prep395\llama\llama-server.exe`，SHA-256 必须是
  `9d7ec1f038329210f6be353a889752ea4a762f9defa80560d37102ccce7b09a06`；
- 模型固定为 `C:\prep395\models\Xiaomi-OCR-0.BF16.gguf`，1,516,744,960 字节，
  SHA-256 `D796FA2CD211BA39A40F37691FC0046AA49F59C7968EC844EB9E81F2AE476A52`；
- mmproj 固定为 `C:\prep395\models\Xiaomi-OCR-0.mmproj-bf16.gguf`，207,346,624 字节，
  SHA-256 `634D6BC95781EBF4A3F06570A59859FA5082D488DB540FD474BC6B4061AEC90E`；
- 生产 9000、9101、9102 的 PID、UTC birth、路径和 listen 集合在启动前后保持不变。

任何身份差异都要求中止，不下载、不替换、不复制模型，也不放宽哈希。

## 6. 单实例参数与边界

当前 `install.ps1` 的生产 OCR 参数语义是：

```text
-m <Xiaomi model> --mmproj <Xiaomi mmproj> --port <port> -np 2 -c 32768
--host 127.0.0.1 -ngl 99 --no-webui --log-disable
```

候选保留同一二进制、模型、mmproj、`-np 2`、`-c 32768`、`-ngl 99`、
`--no-webui` 和仅 loopback 绑定。允许且记录的差异只有：

- 随机占用的 loopback 端口，绝不复用 9000、9101、9102；
- 私有工作目录以及每个子进程单独的 `HOME`、`USERPROFILE`、`APPDATA`、
  `LOCALAPPDATA`、`TEMP`、`TMP`；不继承代理变量；
- 为取得 stdout/stderr，候选不传生产参数中的 `--log-disable`；
- 当前固定 `install.ps1` 没有 `--no-warmup`，候选不凭旧记忆增加该参数；
- 不安装服务、不改现有服务 XML、不重启生产、不改日志模式或安全设置。

候选只启动一个独立 `llama-server.exe`。它会额外占用 Vulkan/GPU 资源与共享物理内存，
还可能触发显存分配、驱动或页面文件压力；不得声称“零影响”。root 必须把这一点连同
当前生产正在使用的事实交给人类批准。

私有进程以执行 SSH 会话的当前 Windows 用户身份运行，生产服务则可能使用
`prep395svc` 服务账户。结果会记录 invoking identity；这一身份/ACL 差异必须保留在
审计说明里，不能据此猜成根因，也不能为了“复刻”而改账户或 ACL。

## 7. 有限等待与一次请求

- readiness 只认该私有实例实际 `/health` 的 HTTP 200；每次 health 请求沿用生产
  `LlamaServerBackend.health()` 的 3 秒超时。
- readiness 总窗口取生产 OCR `ocr_timeout_s=120` 秒，作为预检唯一的有限边界；
  它不是模型性能判据。
- 唯一合成推理请求的边界取生产 `LlamaServerBackend(timeout_s=ocr_timeout_s + 10)`
  的 130 秒。只有 readiness 成功后才发送，且最多一次。
- 子进程已经退出时不发请求；请求中途退出时记录自然退出码。
- 成功后也不自动重试，不做第二次请求，不接 6000D Key 校验，不访问真实生产端口。

进程最后若仍存活，脚本只对本次 `Process` 对象停止，并在调用前再次核对 owned PID、
可执行文件路径和 UTC birth。会记录 `forced_stop=true`；不把强制停止称作自然清理。
停止等待 15 秒只是技术清理边界，不参与根因或质量结论。纯合成证据不递归清理。

## 8. root 执行命令

作者不执行 SCP、SSH、PowerShell 脚本或任何远端命令。以下路径就是本候选的精确路径；
实际执行前仍须由 root 独立审计，并把额外 GPU/共享内存影响交人类批准。若同名文件已存在，
root 必须另选唯一目录，不能覆盖旧证据。

本地准备：

```powershell
$localOut = "D:\Lawbeach\lawbench-coord\OCRIsolatedCrashPrepared-20261028-001334\prepared-20261028-001334"
python "D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\prepare_isolated_inputs.py" --out $localOut
```

先在 root 自己的交互式 SSH 会话里建立两个全新的远端目录；该命令不包含密码：

```powershell
ssh.exe pc@10.126.126.3 "powershell -NoProfile -Command \"New-Item -ItemType Directory -Path 'C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-001334\stage'; New-Item -ItemType Directory -Path 'C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-001334\parent'\""
```

只先把候选源码传到 395：

```powershell
scp.exe -r "D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334" "pc@10.126.126.3:C:/Users/pc/AppData/Local/Temp/lawbench-ocr-isolated-20261028-001334/parent/candidate"
```

root 审计远端候选后，把本地产出的三件纯合成输入放进独立 stage：

```powershell
scp.exe "D:\Lawbeach\lawbench-coord\OCRIsolatedCrashPrepared-20261028-001334\prepared-20261028-001334\manifest.json" "D:\Lawbeach\lawbench-coord\OCRIsolatedCrashPrepared-20261028-001334\prepared-20261028-001334\preprocessed-page1.png" "D:\Lawbeach\lawbench-coord\OCRIsolatedCrashPrepared-20261028-001334\prepared-20261028-001334\request.json" "pc@10.126.126.3:C:/Users/pc/AppData/Local/Temp/lawbench-ocr-isolated-20261028-001334/stage/"
```

在 root 的 SSH PowerShell 会话里执行一次：

```powershell
& "C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-001334\parent\candidate\run-isolated-ocr.ps1" -StageDir "C:\Users\pc\AppData\Local\Temp\lawbench-ocr-isolated-20261028-001334\stage"
```

如 root 明确选择额外只读取一次现有生产健康状态，可加 `-ProbeExistingHealth`。该 GET
只记录状态，不推断生产是否稳定，不发送 OCR 请求。

脚本退出码：

| code | 含义 |
|---:|---|
| 0 | 收到私有实例的普通 HTTP 响应；不是质量 PASS |
| 10 | 私有进程在 health 成功前自然退出 |
| 11 | readiness 在 120 秒边界内未成功；owned 进程被技术清理 |
| 12 | 唯一请求期间私有进程自然退出 |
| 13 | 请求异常/超时而进程仍存活 |
| 14 | 私有实例返回非 2xx；原样保留响应 |
| 20 | preflight、身份或生产 listen 基线失败，未启动私有模型 |
| 21 | owned 进程身份核对或技术清理失败 |

所有结果、stdout/stderr、生产前/后只读快照、listen closure、请求响应或异常都只写
root 选择的私有 stage 下。`result.json` 是机器证据，`summary.json` 是简表；
失败原样落盘，不因 `finally` 存在而声称自然恢复。

## 9. 停止条件

候选执行完一次有界诊断并由 root 保存证据后停止。它不升级 llama、不改 GGUF、
不修改生产配置或日志模式、不清理既有文件、不扩展到真实案卷、不重开旧 registry
分支，也不把本候选当成生产修复或 OCR 质量验收。
