# OCR 日志维护控制器

本目录是 2026-10-30 五门授权下的源码准备件，不是可直接泛化的服务框架。

## 范围与硬边界

- 只控制现有的 `prep395` 和 `prep395-ocr` 两个 Windows 服务；`prep395-llm9b` 只做身份前后核对，绝不控制它。
- 从第一次停服派发前一刻到恢复结束只有一个 300 秒窗口。主维护阶段最多 180 秒，另留至少 120 秒用于恢复。计时用的是同一个 monotonic 时钟，清理阶段不重置。
- 只向 `http://127.0.0.1:9101/v1/chat/completions` 发送一次冻结请求，不重试、不跟随重定向、不读代理环境变量、不更换模型或模板。
- API 健康检查固定为 `10.126.126.3:9000/health`。395 的 API 进程从不绑定 `127.0.0.1:9000`；实测监听是 `192.168.8.124:9000`（所内）和 `10.126.126.3:9000`（同一台主机的所外 VPN 地址），两个都由 API Python 进程持有。启停检查和恢复检查用同一个固定端点，不回落到别的地址、端口或默认值。
- 停服前必须保存 XML 原始字节并完成身份、哈希、路径链和运行状态预检。任何主阶段异常、超时、断连或 HTTP 500 都进入恢复。
- XML 的维护写和恢复写都在**原文件内部**完成：只以 `r+b` 方式打开已存在的文件，写入、截断、flush、fsync，写前后核对是同一个文件对象（卷序列号 + 文件索引）。全程没有 `os.replace`、rename、unlink、chmod 或任何安全描述符 API，所以文件身份和它原有的安全描述符都不变。控制器的自有输出（`result.json` 等）仍用原来的原子写。
- 恢复流程包在 `finally` 里，从第一次停服派发一直到那一次 POST 都覆盖得到；`BaseException` 和控制流错误同样会触发恢复。诊断写失败不会阻止服务或配置恢复，每一步恢复各自记录自己的错误并继续往下走。
- 每次计划启动服务之前，先在既有的有界等待内证明该服务上一代被捕获的进程身份确实已经消失；证明不了就不启动第二个进程，也不强杀任何东西。
- 派发启停前先做服务名白名单检查，白名单只有 `prep395` 和 `prep395-ocr`；`prep395-llm9b` 只能查询。
- 恢复必须写回原始 XML 字节，再启动 OCR、等待其健康检查，再启动 API、等待其健康检查；只有原 XML 精确、两个服务运行且健康、9B 身份未变、旧的自有诊断身份已消失，才可记为恢复通过。
- 不执行旧 policy-refused isolated-server PS helper，也不内联、转写或移植它。本次是现有服务维护，不是新原生服务、GPU 实例、策略变更或新 helper。旧 helper 的当前状态是 `NOTRUN`，没有绕过任何拒绝。
- 不读取凭据、环境变量、DPAPI、真实案卷、旧生产日志或 dump；不执行进程强杀、任务计划命令或 shell。
- 控制器不联系、检查或改变 6000D。人与执行令确认维护期没有真实案件任务。

## 源码输入

`literal-inputs.json` 是本次人工可读的冻结索引，供根执行者在完整审阅源码时对照。它不是运行时 admission，也不替代运行前身份核对。五项原始证据、`request.json` 与停服前 dirty 快照位于协调目录的 `OCRMaintenanceInput-20261030-202123`；本源码准备阶段没有改写这些输入。

固定值包括：

- XML：`C:\prep395\services\prep395-ocr.xml`，738 字节，SHA256 `6f38260bf02c49b6e8a64fe9c4deae7bdf3a08970719b456e372e516ed02bc98`。
- 请求：177698 字节，SHA256 `0b04102960d29ce77935b5a2d7efd5d1fc616aab9770e5260fc893183cfef0d5`。
- 原 Python：`C:\prep395\python\python.exe`，91648 字节，SHA256 `4796bc182e858e4440f638fe5dab250d6172745ddec84e41c6afbc192a3198f9`。
- 原原生程序：`C:\prep395\llama\llama-server.exe`，9216 字节，SHA256 `9d7ec1f038329210f6be353a89752ea4a762f9defa80560d37102ccce7b09a06`。

## 根执行前的冷启动 stage

根执行者必须在完整审阅源码、SCM ctypes 原型、XML 语义逆变换和有限失败路径后，新建一个唯一目录：

```text
C:\Users\PC\AppData\Local\Temp\lb-ocr-maint-<16位小写十六进制freshid>
```

该目录开始只允许有以下三个文件，且 `run` 必须不存在：

```text
maintenance-controller.py
request.json
admission.json
```

`request.json` 必须逐字节复制协调目录中已冻结的请求。控制器会再次核对大小和 SHA，并把同一组字节作为唯一一次 POST 的实体。

`admission.json` 由根在停服前自行核对并冻结，必须显式包含以下语义；其中服务 PID、exe 与 creation FILETIME 必须来自根独立预检，不接受控制器的动态默认值：

```json
{
  "verdict": "ADMITTED_ONE_EXISTING_OCR_MAINTENANCE_RESTORE_REQUIRED",
  "fresh_id": "<16位小写十六进制>",
  "stage_root": "C:\\Users\\PC\\AppData\\Local\\Temp\\lb-ocr-maint-<freshid>",
  "outage_seconds": 300,
  "restore_required": true,
  "no_real_case_traffic": true,
  "authorized_services": ["prep395", "prep395-ocr"],
  "controller": {
    "path": "C:\\Users\\PC\\AppData\\Local\\Temp\\lb-ocr-maint-<freshid>\\maintenance-controller.py",
    "bytes": 0,
    "sha256": "<最终控制器字节数与SHA>"
  },
  "request": {
    "path": "C:\\Users\\PC\\AppData\\Local\\Temp\\lb-ocr-maint-<freshid>\\request.json",
    "bytes": 177698,
    "sha256": "0b04102960d29ce77935b5a2d7efd5d1fc616aab9770e5260fc893183cfef0d5"
  },
  "python": {
    "path": "C:\\prep395\\python\\python.exe",
    "bytes": 91648,
    "sha256": "4796bc182e858e4440f638fe5dab250d6172745ddec84e41c6afbc192a3198f9"
  },
  "server": {
    "path": "C:\\prep395\\llama\\llama-server.exe",
    "bytes": 9216,
    "sha256": "9d7ec1f038329210f6be353a89752ea4a762f9defa80560d37102ccce7b09a06"
  },
  "xml": {
    "path": "C:\\prep395\\services\\prep395-ocr.xml",
    "bytes": 738,
    "sha256": "6f38260bf02c49b6e8a64fe9c4deae7bdf3a08970719b456e372e516ed02bc98"
  },
  "log": {
    "parent": "C:\\prep395\\logs",
    "directory": "C:\\prep395\\logs\\lb-ocr-maint-<freshid>"
  },
  "services": {
    "prep395": {
      "pid": 0,
      "exe": "<根预检所得服务进程exe>",
      "creation_filetime": 0
    },
    "prep395-ocr": {
      "pid": 0,
      "exe": "<根预检所得服务进程exe>",
      "creation_filetime": 0
    },
    "prep395-llm9b": {
      "pid": 0,
      "exe": "<根预检所得服务进程exe>",
      "creation_filetime": 0
    }
  },
  "direct_processes": [
    {
      "role": "api-python",
      "pid": 0,
      "exe": "<根预检所得Python进程exe>",
      "creation_filetime": 0
    },
    {
      "role": "ocr-native",
      "pid": 0,
      "exe": "<根预检所得OCR原生进程exe>",
      "creation_filetime": 0
    },
    {
      "role": "llm9b-native",
      "pid": 0,
      "exe": "<根预检所得9B原生进程exe>",
      "creation_filetime": 0
    }
  ],
  "native_dlls": [
    {
      "name": "ggml-base.dll",
      "bytes": 800768,
      "sha256": "28a14ca75b4383616c44fbfabb4000260845891905be3e243f6d48249f8f495b"
    }
  ]
}
```

`native_dlls` 在真实 admission 中必须是五项证据里的完整 30 项清单，不能只放上面的示例项。`creation_filetime` 使用 Kernel32 `GetProcessTimes` 的 64 位十进制 FILETIME。服务进程 PID/exe/FILETIME 是 SCM 包装进程身份；`direct_processes` 是独立核对到的 API、OCR 原生和 9B 进程身份。若 direct PID 与包装 PID 不同，控制器要求它出现在该服务 PID 的 Toolhelp32 后代快照中。

控制器还固定要求 direct PID 分别为 API Python `2932`、OCR 原生 `36704`、9B 原生 `9652`，并要求 exe 分别为冻结的 Python 路径和原生程序路径。SCM 包装 PID 由根在 preflight 时独立冻结；这些 direct 身份在停服前再次由 Kernel32 核对。任何一项不匹配都在第一次停服前失败。

## 有界生命周期

1. 拒绝不再是冷启动的 stage、`run`、日志目录或路径链中的 reparse point。
2. 核对 admission、自身、请求、Python、原生程序、30 个 DLL、XML 和三项运行时身份；记录控制器自身 PID/exe/creation FILETIME。
3. 再次核对 XML 原始大小与 SHA，把原始字节保存为 `run/original-ocr.xml`，同时记下原文件的 atime/mtime。备份和第一份证据写不成功就在停服前中止。
4. 只允许两个服务初始为 RUNNING；在第一次停服派发**之前一刻**启动 300 秒 monotonic 计时。
5. 正常停止 `prep395`，再停止 `prep395-ocr`；不调用任何强杀。
6. 新建唯一日志目录，把参数里的唯一 `--log-disable` 替换为：

   ```text
   --log-verbosity 1 --log-prefix --log-timestamps --log-colors off
   ```

   追加 `logpath`，并把 `none` 设为 `roll-by-size`、`sizeThreshold=1024`、`keepFiles=2`。其余 XML 字段、属性、文本和顺序必须在语义上不变；不添加 `--verbose`、`--trace`、提示词日志或 `--log-file`。新内容写回原 XML 文件内部（见上），不替换文件。
7. 证明上一代 OCR 身份已消失后启动 OCR，等待 RUNNING 与 `/health`；再对 API 做同样的事。
8. 使用原生 HTTP，把冻结请求字节作为一个 POST 发出。该阶段在总预算内还受 70 秒上限约束；即使响应头之后断连，也先保存已获得的 status、headers 和部分 raw body，再进入恢复。
9. 不论 2xx、HTTP 500、超时、断连或异常，最终都停止 API、再停止 OCR，写回原始 XML，启动 OCR、API 并做最终核对。恢复阶段没有删除或清理动作。
10. 停服派发本身失败时，只观察真实状态和配置，不启停任何服务，避免把失败伪装成一次停服。

HTTP 200 只表示一次接口样本成功，不能证明此前 HTTP 根因已被观察到。HTTP 500、模型侧失败与恢复失败在结果中分开记录。Toolhelp32 无法覆盖或已消失的后代明确记为 `PARTIAL_NOTPROVEN`，不外推为完整证明。

## 输出

所有新输出只在新建的 `run` 和本次唯一日志目录内：

- `run/original-ocr.xml`：精确原始配置备份，保留到结果交付。
- `run/modified-ocr.xml`：写入 XML 前的精确维护配置副本，供根审阅本次语义增量。
- `run/http-raw-response.bin`：唯一 POST 的原始响应体。
- `run/result.json`：阶段、预算、SCM 状态、wrapper/direct 身份、HTTP、变更后 XML 哈希、错误、恢复步骤与最终判定。
- 日志目录只收集本次维护自有文件的名称、大小和 SHA；整个控制器所有日志哈希读取的累计总量上限是 4 MiB，不读取旧生产日志。

只有恢复核对全部通过时 `cleanup.status` 才是 `PASS`。否则明确为 `RESTORE_FAILED`。控制器不删除 stage、run、备份、新日志或错误现场。

进程身份按“代”跟踪：每服务每一代各自登记 wrapper 和当时捕获到的原生/Python 子进程。最终核对要求原始代和所有中间代都已消失，当前活着的那一代单独核对。捕获失败或缺失的记录为 `PARTIAL_NOTPROVEN`，不外推为整棵树已证明。

## 本目录的当前状态

本目录当前是**源码件，尚未运行**（`NOT_RUN`）。这里的 Python 从未被执行过，因此没有可报告的 Python 退出码、服务控制次数、HTTP 结果或 GPU 运行次数。
