# T34 原生链路真实中继（source-only）

本目录是 **只写源码、作者未运行** 的一次性消费者。运行权归 Root。

## 目的

在**不复用旧 service-only 样本**的前提下，补上 T34 至今仍缺的一段：
原始 Native SDK（`dsh-llm-pi-ai` + `pi-ai` 的 `openai-completions` 线路）
真实发起一次流式请求，经原始服务 forwarder 真实中继到
`https://www.tokenav.ai/v1/chat/completions`。

不做的事：GUI、Agent、Session、历史、系统钥匙串、本地默认模型、
模型发现 GET、余额查询、重试、案卷读写。

## 文件

| 文件 | 作用 |
| --- | --- |
| `native-relay.py` | Python 消费者：起 uvicorn（自带 `127.0.0.1:0` 预绑定 socket）承载原始 `forward_app`，派 1 个 Node 子进程，收尾、写 `result.json` |
| `native-client.mjs` | Node 客户端：原始 canonical CLI profile boot（原始 appBoot / launchEnvironment / loader / llm / llm-pi-ai）+ 原始 T50 内存凭据夹具，1 次 `ctx.llm.stream(...)` |
| `literal-inputs.json` | 字面量清单：pins 全表从 AP（`approved-inputs.json`）原文机械复制而来（路径/字节/SHA 未手抄），另含 upstream/model/prompt/限额/install_anchor 与服务策略、死端口 |
| `runs/` | Root 运行时创建的一次性目录（每次一个新鲜子目录） |

两个程序都从 `literal-inputs.json` 按路径后缀取模块，不重复硬编码路径与 SHA。

## 一次运行的形状

1. Root 通过匿名管道把真实中继 Key 交给 Python 的 **stdin**：只发送一个
   JSON object，字段名为 `key`。
   Key 只存在于 Python 进程内存：交给原始 forwarder 的 external key getter。
   **不进 Node、不进 argv、不进环境变量、不进任何文件。**
2. Python 预绑定 `127.0.0.1:0`，用 uvicorn 承载原始
   `Net` / `ExternalLLMPolicy` / `forward_app`（`lifespan=on`，
   ASGI lifespan 只覆盖 forwarder），服务策略固定
   `https://www.tokenav.ai/v1` + `enabled=true` + `context_window=32768`
   + `supports_tools=true`；`127.0.0.1:65004` / `65003` 为死端口，不探测。
3. Python 派 **1 个** 子进程：审批过的
   `dsh/apps/desktop/node_modules/electron/dist/electron.exe`，
   `ELECTRON_RUN_AS_NODE=1`，私有 HOME/APPDATA/TEMP/DSH_HOME，
   `NODE_OPTIONS` 只挂两个冻结件：`resolve-from-dsh.mjs`（1a174）与
   `network-guard.cjs`（cbb7）。Node 只能走 loopback。
4. Node 侧用原始 CLI profile boot 起一个**全新私有 profile**：
   bundle 里先插 T50 内存凭据夹具，再插 config-editor / settings / llm /
   llm-pi-ai / timer / hmr；`llm-pi-ai` 的 `external` 线路指向
   `http://127.0.0.1:<port>/v1-ext`、模型 `deepseek-v4.1-flash-1017`、
   `contextWindow=32768`、input `text`。
   boot 之后 `ctx.get('credentials').set('EXTERNAL_LLM_KEY','T34_CALLER_SENTINEL')`
   —— 只有假哨兵，真实 Key 从未进入 Node。
5. Node 调 **一次** `ctx.llm.stream({provider:'external', model, maxTokens:256,
   signal: AbortSignal.timeout(90000), messages:[{role:'user',
   content:[{type:'text',text:<AP 固定 prompt>}]}]})`，收集
   text-delta / usage / finish；随后 `shutdown.shutdown(0)`，写
   `node-result.json`。
6. Python 侧的 **NativeGate** 卡在真实出网前，只放行一种线：
   单次 POST、URL 精确等于 upstream、无 query、无重定向、Authorization 恰为
   `Bearer <真实Key>`、无调用方哨兵标记、body 键集合恰为
   `model / messages / stream / stream_options / max_tokens|max_completion_tokens / store`、
   `stream=true`、`stream_options={"include_usage":true}`、
   `max_tokens` 与 `max_completion_tokens` 互斥且值为 256、
   `store` 若存在须为 false、messages 恰一条 user 且文本等于 AP prompt。
   任何多余键或不符 → **在出网前 DENY**。
7. 收尾：子进程按确切进程句柄终止（如仍存活）、`server.should_exit`
   并在 5 秒内 await、forwarder lifespan 关客户端/Gate、
   `net.client.close()`、`logs.close()`、socket 关闭、清空 Key 引用。
   强制终止过的收尾**不宣称**已正常关闭。

## 判据

一次运行算 PASS，当且仅当：

- 真实出网 POST 恰 1 次，且 NativeGate 接受（原生 wire 为真）；
- Node 退出码 0，`finish_reason=stop`，回复非空（预期中文“连接测试成功”）；
- stdout / stderr / `node-result.json` / `result.json` 中均无真实 Key；
- 收尾项全绿。

`result.json` 记录实际事实：阶段、pins 校验、Gate 计数与拒绝原因、
子进程身份元数据（argv/pid/退出码/是否强制终止）、回复与字节数、
收尾标志、耗时。

## 未验证 / 边界

- 本目录整体 **T34 NOT PASS**：只覆盖“原生 SDK → 原始 forwarder → 真实中继”这一段。
- **GUI 未验证**：没有起桌面外壳。
- **系统钥匙串 / 系统存储未验证**：用的是 T50 进程内存夹具。
- Agent / Session / 历史 / R 记录 **一律未构造**。
- 作者 **未运行** 任何源码、测试、构建、安装；源码未经运行验证。

## Root 运行边界

Root 只能通过匿名管道向 Python stdin 发送一个 JSON object，键名为 `key`。
不要把 Key 放进 shell 命令行、环境变量或文件，也不要运行本目录提供的示例
命令：本文件不提供含秘密占位符的可复制命令。

超时预算：Node 子进程 120s、Python 180s、Root 外层 210s。
