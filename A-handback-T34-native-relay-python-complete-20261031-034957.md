# A 线交回件：T34 native relay Python 完成

- 交回时间：2026-10-31 03:49:57（Asia/Taipei）
- 执行角色：独立 A 线 DeepSeek 执行者
- 正式执行令：`D:\Lawbeach\lawbench-coord\A-T34-native-relay-python-complete-order-20261031-034957.md`
- 修改源码：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-relay.py`
- 新建交回件：`D:\Lawbeach\lawbench-coord\A-handback-T34-native-relay-python-complete-20261031-034957.md`
- 当前结论：**源码完成，运行未验证，非 T34 PASS**。本运行器未执行源码、真实流、测试、构建或应用。

## 修改前状态

指定源码在执行前存在：

- 24,828 字节；
- SHA-256 `95DE8D7D782F788BC53BAA522EFDDFBB0F45051565BA38CFB0AB2E4E0CC03A13`；
- `SERVICE_DIR` 曾指向 A 线 service，文件尾部另有 B 线 service 覆盖；
- service import 前残留一个无主体的 `sys.path` 条件；
- 新交回文件在执行前不存在。

上述元数据只用于确认接续对象，不构成源码测试或完成验收。按执行令约束，修改后未再执行 PowerShell、Python、解析器、测试、构建或源码断言，因此未计算修改后哈希。

## 有界修改

1. `SERVICE_DIR` 现在只在文件顶部绑定一次，精确为 `D:\Lawbeach\lawbench-B\service`；删除死 A 线常量和尾部重复覆盖，删除 `sys.path` 操作。52 项 pin 预检调用移入 `execute`，在 service import 前执行。
2. `NativeGate` 对真实响应记录原状态码和原 `content-type`，只替换原 `AsyncByteStream` 的迭代边界。包装器逐块透传原 bytes，单块及累计上限均为 65,536 字节；每个块在 yield 前对累计字节做真实 Key 扫描。`completed` 仅在原迭代器正常结束后置真；`aclose()` 直接等待原流 `aclose()`。
3. `FinishReason` 保留 Node 返回的 JSON 对象，判定 `kind == "stop"`。判定同时要求真实 HTTP 200、SSE content-type、原始 SSE 正常完成、Gate denied 为 0、Node 子进程实际关闭且未被强制终止、Node shutdown `fulfilled == true`。
4. 在原始 `forward_app` 外包一层透明 ASGI send 观察器。HTTP 请求仍直接进入原应用；`lifespan.startup.complete` 和 `lifespan.shutdown.complete` 消息原样、逐条转发，同时记录是否实际出现及是否重复。Uvicorn 的 lifespan 只运行该 forwarder，不使用业务默认应用或 OCRRetainer。
5. `run_node_child` 对 `TimeoutError` 和 `CancelledError` 都使用已创建的 Process 句柄执行关闭，等待每次有界为 10 秒，并以 `returncode is not None` 判定实际关闭。取消分支在子进程关闭记录后重新抛出取消，不使用 `taskkill`、全局杀进程或其他进程。
6. `sanitized_env` 将 `DSH_HOME` 固定为本次 root 下的 `dsh-home`，真实 Key 仍只在 Python stdin 和进程内存；未加入环境、argv、文件或 Node。

原始 SSE 在资源清理后以 `xb` 模式写入 run root 下的 `raw-sse.bin`，仅当流已完成、未越界、无非法块且未发现真实 Key。结果记录产物的 `artifact`、真实字节数和 SHA-256；若 Key 出现在累计流中，该块不会 yield，也不会写产物或结果。

## 变更函数与不变量

变更函数/代码块：

- 模块级 52 项 pin 预检调用：从 import 时副作用移入 `execute`；
- 模块常量 `SERVICE_DIR`：单一 B 线绑定；
- `build_native_gate`：真实响应边界与受限 SSE 包装；
- `sanitized_env`：`DSH_HOME` 路径；
- `run_node_child`：取消/超时关闭与有界等待；
- `execute`：lifespan 观察、完成判定、资源清理和 SSE 产物交回；
- 文件尾部重复 `SERVICE_DIR`：删除。

保持不动的关键约束：

- `model`、`prompt`、一次上游 POST、`max_tokens=256`、stream wire、允许键和 Gate 鉴权；
- 无重试、无 MockTransport、无新 fake response、无响应体改写、无 prompt 变体；
- Gate 仍在委派前计数，无 query，TLS verify 为真，retries 为 0，trust_env 为假；
- 外时界 180 秒、Node 时界 120 秒、清理时界 5 秒和 Root 有界 210 秒；
- 结果、stdout、stderr 的真实 Key 隐私检查；
- 原始服务、SDK、产品代码、契约和测试材料未修改。

本次写操作只涉及上述源码和本交回件。执行令列出的其他 3 个文件未打开、未枚举、未改写；其字节保持原状。

## 执行边界与实际命令数

- PowerShell exec：3 次；
  - 第 1 次：只读正式执行令；
  - 第 2 次：只完整读取指定 `native-relay.py`；
  - 第 3 次：只返回当前 Python 与新交回文件的 Get-Item/Get-FileHash 元数据。
- Python 运行：0；
- 测试、自测、构建、GUI：0；
- HTTP、模型、Key、外部探针：0；
- 解析/断言/source assert：0；
- Git 命令及 Git 写入：0；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

## Root 后续验收点

Root 需要完整审计源码与 delta，并在其获准的有限执行范围内运行一次真实 SSE 流。运行时重点确认：

- 实际 `content-type` 满足 `text/event-stream`；
- Node shutdown 的实际 JSON 形状包含 `fulfilled: true`；
- FinishReason 的实际 JSON 形状为对象且 `kind` 为 `stop`；
- 原响应流的 `aclose()` 确实由原消费路径触发；
- registry 中记录的 HTTP 200、SSE completed、强制终止为 false、Gate denied 为 0，并与 SSE 长度和 SHA 对上。

本交回件不宣称 T34 已通过，也不替代 Root 的真实流验收。
