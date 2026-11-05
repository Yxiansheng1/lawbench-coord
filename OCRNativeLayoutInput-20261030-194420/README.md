# Native CLI OCR counterfactual

状态：`SOURCE_READY_AWAITING_ROOT_ADMISSION`。作者运行次数为 0；尚未执行
Python、CLI、帮助、模型、测试或任何探测。

## 目的与边界

此脚本只用于一个有界离线反事实：使用已经安装的
`C:\prep395\llama\llama-mtmd-cli.exe`，以固定图片、模型、mmproj 和唯一
argv 尝试一次。它回答“绕过 HTTP/服务层、直接走同一原生 CLI 时是否仍出现
原生失败”。即使退出码为 0，也只说明该次反事实完成，**不是 OCR 质量通过，
也不证明此前 HTTP 路径或服务路径是崩溃根因**。

脚本不启动 HTTP 服务，不连接端口，不请求 health/readiness，不读取 API Key，
不安装或下载，不重试，不运行 `--help`，不执行旧 PowerShell helper，也不修改
模型、源码、配置或生产进程。root 必须在批准 argv 前另行核验 CLI 身份和帮助。

## Root 执行条件

只允许 root 在完整复核源码、冻结输入、CLI 身份、CLI 帮助和 admission 后，
使用原有 `C:/prep395/python/python.exe` 执行一次：

```powershell
C:\prep395\python\python.exe .\native-cli-diagnostic.py --admission <absolute-admission.json>
```

admission 必须由 root 控制，且只能有这些字段：

```json
{
  "schema": "lawbench-native-cli-counterfactual-admission/1",
  "verdict": "ADMITTED_ONE_NATIVE_CLI_COUNTERFACTUAL_NO_HTTP",
  "run_dir": "C:\\Users\\PC\\AppData\\Local\\Temp\\lb-ocr-native-<fresh-id>",
  "cli": {
    "path": "C:\\prep395\\llama\\llama-mtmd-cli.exe",
    "bytes": 0,
    "sha256": "<root-inventory-sha256>"
  },
  "model": {
    "path": "C:\\prep395\\models\\Xiaomi-OCR-0.BF16.gguf",
    "bytes": 1516744960,
    "sha256": "d796fa2cd211ba39a40f37691fc0046aa49f59c7968ec844eb9e81f2ae476a52"
  },
  "mmproj": {
    "path": "C:\\prep395\\models\\Xiaomi-OCR-0.mmproj-bf16.gguf",
    "bytes": 207346624,
    "sha256": "634d6bc95781ebf4a3f06570a59859fa5082d488db540fd474bc6b4061aec90e"
  },
  "image": {
    "path": "C:\\Users\\morel\\Documents\\Codex\\2026-10-21\\deepseek-codex-gpt-advisor-reviewer\\outputs\\OCRIsolatedLocalPrepare-root-20261028-005149\\private\\temp\\prepared\\preprocessed-page1.png",
    "bytes": 132843,
    "sha256": "6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a"
  },
  "argv": [
    "-m",
    "C:\\prep395\\models\\Xiaomi-OCR-0.BF16.gguf",
    "--mmproj",
    "C:\\prep395\\models\\Xiaomi-OCR-0.mmproj-bf16.gguf",
    "--image",
    "C:\\Users\\morel\\Documents\\Codex\\2026-10-21\\deepseek-codex-gpt-advisor-reviewer\\outputs\\OCRIsolatedLocalPrepare-root-20261028-005149\\private\\temp\\prepared\\preprocessed-page1.png",
    "-p",
    "Extract all information from the main body of the document image and represent it in markdown format, ignoring headers and footers. Tables should be expressed in OTSL format, formulas in the document should be represented using LATEX format, and the parsing should be organized according to the reading order.",
    "-n",
    "4096",
    "-c",
    "32768",
    "-ngl",
    "99",
    "--temp",
    "0"
  ],
  "source_pins": [
    {
      "path": "<absolute-frozen-source-path-1>",
      "bytes": 0,
      "sha256": "<frozen-sha256-1>"
    }
  ]
}
```

上面的 `cli.bytes=0`、CLI 占位 SHA 和单元素 `source_pins` 只是格式示意，不能
直接运行。`literal-inputs.json` 记载六个冻结来源；admission 必须恰好列出这
六项及其实测 bytes/SHA。CLI 身份在作者侧为 `NOT_ADMITTED`，必须由 root
inventory 后填写；不得用其他 CLI、包装器、别名或模型替代。

## 运行时约束

- 总预算固定为 300 秒，包含输入校验、单次子进程、身份核验和归因检查；
  子进程启动前会预留收尾时间。
- `run_dir` 必须是 `C:\Users\PC\AppData\Local\Temp` 下新的
  `lb-ocr-native-<fresh-id>` 目录，且已存在即拒绝；路径链上的 reparse point
  也拒绝。
- stdin 为 `DEVNULL`。子进程只得到 Windows 核心环境变量和 `run_dir` 内新建的
  private HOME/USERPROFILE/APPDATA/LOCALAPPDATA/TEMP/TMP；不继承 ambient
  `LLAMA_ARG*` 或 Key/credential 变量。
- 唯一的源码允许的辅助进程是固定、只读的 CIM 查询，用于取得子进程 PID、
  executable 和 UTC birth；查询命令不接受外部命令或路径。
- 超时只可能停止当前持有的 `Popen`，并且必须在停止前重新取得完全一致的
  PID/exe/UTC-birth。身份不符时拒绝停止；不按名字、端口或裸 PID 杀进程。
- 运行后独立查询原 PID/exe/UTC-birth 是否消失，并按原 child PID 枚举直接
  后代。任何未消失资源、后代或无法证明的状态都标为 `NOT_PROVEN`。
- 脚本主动写出的所有产物只写在该新 `run_dir`。输入、六份来源和 admission
  的 bytes/SHA/mtime 在前后复核；脚本不清理、不删除、不覆盖输入或旧证据。

## 结果解释

`diagnostic-result.json` 保留状态、退出码、停止原因、身份查询、日志摘要和
输入前后指纹。完整 stdout/stderr 在同目录保存。退出码：

- `0`：反事实子进程自然零退出且收尾/归因检查通过；仍非质量 PASS。
- `10`：自然非零退出。
- `12`：300 秒内超时并完成有身份根据的强制停止；不是自然退出。
- `20`：启动前阻断或收尾失败。
- `21`：资源未关闭。
- `22`：身份或后代归因未证明。
- `23`：输入变化或输入后复核未完成。

若日志出现 `c0000409` 或 fast-fail，报告应把它作为该次原生反事实的观察，
而不是自动推广成服务路径根因。任何崩溃、HTTP 500、ReadError 或“响应收到”
都不能改写为 OCR 质量 PASS。
