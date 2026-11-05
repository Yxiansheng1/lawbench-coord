# A 线交回：T34 native relay 静态修复

状态：**BLOCKED / STATIC-INCOMPLETE，不得进入实际运行。**

执行令：`D:\Lawbeach\lawbench-coord\A-T34-native-relay-static-fix-order-20261031-034408.md`

执行模型：`deepseek-v4.1-flash-1017/max`，工作目录
`D:\Lawbeach\lawbench-A`。只使用原生 PowerShell；
`login=false`；未使用 bash。

## 已完成

### 1. AP 与字面量复制

`literal-inputs.json` 已用整字节复制覆盖为以下文件：

`D:\Lawbeach\lawbench-coord\T34NativeRelayStaticFixInput-20261031-034408\approved-inputs.json`

源、目的均为：

- 字节数：`25377`
- SHA-256：`4e468424f8d316b0000f3c035c810b5399a195cc97d5b51a80cd6fb9a944664c`

复制使用 PowerShell `Copy-Item -LiteralPath ... -Force`；未解析、未重排、未自检该 JSON 内容。

### 2. `native-client.mjs`

路径：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-client.mjs`

- 在加载 SDK 前校验三组 pin：45 个 SDK/冻结 pin、5 个 B service pin、2 个 additional/runtime pin；逐项核对字节数和 SHA-256。
- `appBoot.initProfile` 已拥有的 `cordis.patch.yml` 使用 UTF-8 `w`。
- 其余 fresh 文件使用 UTF-8 `wx`；为覆盖文件尾部未完整显示的那一处 `writeFileSync(..., 'wx')`，增加了本地 UTF-8 包装器，将 `'wx'` 归一为 `{encoding:'utf8', flag:'wx'}`，没有删除任何 guard 或生成文件。
- `boundedError` 不再保留原始 `message`、`stack`、`details` 或 `cause`；只保留固定白名单内的 `name/code`，其余为 `OTHER`。
- `finish.reason` 原对象保留在 artifacts 中；成功判据改为 `reason.kind === 'stop'`。
- Node 在创建私有 profile 前设置 `process.env.DSH_HOME` 为同一次运行的实际 `<root>\dsh-home`。
- 固定请求形状、单次 `ctx.llm.stream`、90 秒流超时、原 prompt/model/256 max tokens 与 SDK/profile 设计未改动。

### 3. `README.md`

路径：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\README.md`

- 删除含 Key 占位符的可复制 PowerShell 示例。
- 明确 Root 只能通过匿名管道向 Python stdin 发送一个 JSON object，键名为 `key`。
- 明确 Key 不进入 shell 命令行、argv、环境变量或文件。

### 4. `native-relay.py` 已落地部分

路径：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-relay.py`

- 删除 `sys.path.insert(0, str(SERVICE_DIR))`。
- 在 service imports 前增加严格 pin 门：要求 45 + 5 + 2 共 52 项，逐项核对字节数和 SHA-256。
- 在主执行前把 `SERVICE_DIR` 绑定为精确的
  `D:\Lawbeach\lawbench-B\service`。
- Root 必须按下令提供 child-only `PYTHONPATH=D:\Lawbeach\lawbench-B\service`；本线未改环境、审批或沙箱。

## 未完成，原因与影响

最后一次原生读取的 Python 文件名误写为 `relay-forward.py`，实际为
`native-relay.py`，因此该文件正文未进入本会话。三次原生执行额度已用尽；此后没有启动第四个 Shell，也没有通过其他通道读取源码。

以下执行令要求因此**没有安全落地**，不能宣称完成：

- `NativeGate` 尚未记录原 `response.status_code`、`content-type` 与原始 `AsyncByteStream` 的有界原始 SSE。
- 尚未实现 65536 字节上限、在 yield/落盘前扫描实际 Key、chunk 字节不变、`wrapper.aclose` 关闭原流、完成后以 SHA/长度写入 result。
- 尚未增加透明 ASGI send wrapper 观测 lifespan `startup.complete` / `shutdown.complete`，亦未证明 HTTP 消息原样转发。
- `run_node_child` 的 cancellation 路径尚未核对并修复为 exact Process handle `terminate/wait`、保留元数据、闭包后重抛 cancellation。
- Python judge 对 `finish.reason` 的现有判断未定位，尚不能确认其要求 `dict` 且 `kind == 'stop'`。
- Python child env 的 `DSH_HOME` 未定位；Node 已强制覆盖为实际 `<root>\dsh-home`，但脚本侧原配置仍需 Root 静态复核。

没有用猜测重写 `native-relay.py`，以免破坏执行令要求保留的无关函数、常量、guards、请求次数、时限、模型、prompt、SDK 与 profile 设计。

## 验证与边界

- **source-not-run**：未运行任何源码。
- 未运行 Python、Node、tests、build、prepare、app、GUI、HTTP、model、Key probe、parser/AST 或检查器。
- 未调用 6000D、395、upstream、SDK、service 或子代理。
- 未使用 system TEMP。
- 未声明 `sourcecheck performed`。
- 未生成实际请求，`actual POST` 仍为 0。
- 本交回不构成 T34 PASS、fullsuite、release 或可运行信号。

## Git 与工作区

- Git 全程只读；本轮未执行任何 Git 命令。
- 未执行 add、commit、rebase、stash、reset、clean、checkout、push。
- 未触碰 `index.lock`、writer lock、ACL、审批或沙箱。
- 当前 PID 按令视为本次执行者，不是第二 writer。

## 原生执行记录

1. 只读正式执行令，退出码 `0`。
2. 一次批读四个当前文件与 AP；命令退出码 `0`，但工具侧截断正文。
3. 整字节复制 AP，输出复制元数据并补读 `README.md`；因误用
   `relay-forward.py` 路径，退出码 `1`，`native-relay.py` 未读出。

## 下一步门

必须先由有源码读权限的 Root 静态检查现有 `native-relay.py`，完成上述六项缺失，并核对全部 inverse/cumulative/raw/setup/cleanup；
在此之前不得做有限检查或唯一一次实际请求。
