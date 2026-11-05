# A 线交回件 — T34 原生链路真实中继（source-only）

- 交回时间：2026-10-31
- 交回人：线 A（DeepSeek 执行者，独立 A 线）
- 任务入口：`D:\Lawbeach\lawbench-coord\A-T34-native-relay-original-order-20261031-032735.md`
- 状态：**源码已交付，运行由 Root 持有；本线未运行任何源码**

## 一句话结论

补齐 T34 仍缺的「原始 Native SDK → 原始服务 forwarder → 真实中继」这一段，
以 **一次** 真实上游 POST 为上限；全部为未运行的源码，作者未执行、未验证。

## 交付物（4 个新文件 + 本交回件）

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\`

| 文件 | 字节 | sha256 |
| --- | --- | --- |
| `native-relay.py` | 23648 | `624b13d247a9aaa59a07ee44598cb606eaa4ad06907c6ce5515d0a3b4ee656e7` |
| `native-client.mjs` | 9265 | `8e8ce5164ddb61169c7d1d0dd771cc341164801ac539625bb4ad6f9cefee0f59` |
| `literal-inputs.json` | 11122 | `b240b36ba547b219ecc9eba254b86138bc79a07786dbc3a9c43aa20394d6f017` |
| `README.md` | 5418 | `af7bcaee8195cac62661f447bf0e1d32ac34689591bfbd3484e7cb36268fbd09` |

正式交回件：`D:\Lawbeach\lawbench-coord\A-handback-T34-native-relay-original-20261031-032735.md`

## 做了什么（源码层面）

**Python 消费者 `native-relay.py`**

- `--root` 指向 `runs/` 下的新鲜子目录；带 reparse/symlink 守卫，
  目录已存在即拒（`ROOT_EXISTS`）。
- 真实中继 Key **只从 stdin 进 Python 进程内存**，交给原始 forwarder 的
  external key getter；不进 Node、不进 argv、不进环境变量、不写任何文件。
- 预绑定 `127.0.0.1:0`（随机端口），用 uvicorn 承载原始
  `Net` / `ExternalLLMPolicy` / `forward_app`，`lifespan=on`（ASGI lifespan
  只覆盖 forwarder，不引入业务默认应用）。服务策略固定
  `https://www.tokenav.ai/v1` + `enabled=true` + `context_window=32768` +
  `supports_tools=true`；`127.0.0.1:65004` / `65003` 为死端口，不探测。
- **NativeGate** 复用已验收 Python 消费者（`importlib` 载入精确 pin 文件，
  该文件 `main` 有 `__name__ == "__main__"` 守卫，故不执行其 main），
  在真实出网前校验**原生 wire**：单次 POST、URL 精确等于 upstream、无 query、
  无重定向、Authorization 恰为 `Bearer <真实Key>`、无调用方哨兵、
  body 键集合恰为 `model/messages/stream/stream_options/max_tokens|
  max_completion_tokens/store`、`stream=true`、
  `stream_options={"include_usage":true}`、`max_tokens` 与
  `max_completion_tokens` **互斥**且值为 256、`store` 若存在须 false、
  messages 恰一条 user 且文本等于 AP 固定 prompt。多余键或不符一律
  **出网前 DENY**。`temperature` 不在允许集合（原生请求未带该参数）。
- 派 **1 个** 子进程：审批过的
  `dsh/apps/desktop/node_modules/electron/dist/electron.exe`，
  `ELECTRON_RUN_AS_NODE=1`，私有 HOME/APPDATA/TEMP/DSH_HOME，
  `NODE_OPTIONS` 只挂两个冻结件（`resolve-from-dsh.mjs` 1a174、
  `network-guard.cjs` cbb7）。Node 侧只能走 loopback。
- 超时：Node 子进程 120s、Python 180s。收尾：按确切进程句柄终止（超时则
  kill 并标记 `forced_termination=true`）、`server.should_exit` + 5s await、
  lifespan 关客户端/Gate、`net.client.close()`、`logs.close()`、socket 关闭、
  清空 Key 引用。收尾未全绿 → 结果 FAILED；强制终止过的运行不宣称已正常关闭。
- `result.json` 只写实际事实：阶段序列、pins 校验计数、Gate 计数与拒绝原因、
  子进程身份元数据（argv/pid/退出码/是否强制终止）、回复与字节数、收尾标志、耗时。
  写盘前扫描真实 Key，命中即抛错不落盘。

**Node 客户端 `native-client.mjs`**

- 原始 canonical CLI profile boot：原始 `appBoot`（`initProfile` /
  `loadProfileDirectory`）、原始 `launch-environment`
  （`createLaunchEnvironmentSnapshot([])`）、原始 CLI `profile-boot.js`
  的 `runProfile`，全部按 AP pins 的物理路径 fileURL 导入。
- 全新私有 profile：bundle 里**先插** T50 内存凭据夹具，再插
  config-editor / settings / llm / llm-pi-ai / timer / hmr；
  `llm-pi-ai` 的 `external` 线路 = `api:openai-completions`、
  `apiKeyEnv:EXTERNAL_LLM_KEY`、`baseURL=http://127.0.0.1:<port>/v1-ext`、
  模型 `deepseek-v4.1-flash-1017`、`contextWindow=32768`、`input:['text']`。
- boot 后 `ctx.get('credentials').set('EXTERNAL_LLM_KEY','T34_CALLER_SENTINEL')`
  —— 只有假哨兵，真实 Key 从未进入 Node 进程。
- 一次 `ctx.llm.stream({provider:'external', model, maxTokens:256,
  signal:AbortSignal.timeout(90000), messages:[{role:'user',
  content:[{type:'text',text:<AP prompt>}]}]})`；不传 id / source / system /
  tools / reasoningEffort / sessionId（SDK 类型允许的一个 identity-free
  `RequestUserInput`）。收集 text-delta / usage / finish；
  收尾 `shutdown.shutdown(0)`，记录 fulfilled 标志；不提前 `process.exit`。
- 只落 `node-result.json`（回复与元数据）；无 auth store、无用户钥匙串、无
  环境变量中的密钥。

**`literal-inputs.json`**

- `sdk_and_frozen_pins` 整块为 AP 原文**字节切片复制**（45 条，路径/字节数/
  sha256 未重打；已校验与 AP 切片逐字节一致）。
- `upstream` / `model` / `prompt` / `max_actual_POST` / `max_tokens` /
  `total_s` / `install_anchor` 为 AP 同文件原文取值。
- 另含固定的 `service_policy` 与 `dead_endpoints`（65004/65003 死端口）。

## 边界遵守

- **未运行**：源码、测试、构建、安装、AST/import 自检、socket 探测、HTTP、
  模型调用一律未做；本线只交付源码。
- **未复用旧 service-only 样本**换绿；本目录是独立的一次性消费者。
- 未起 GUI、未构造 Agent / Session / 历史 / R 记录、未碰系统钥匙串或系统存储。
- 未用默认 `create_app` / OCRRetainer / 生产配置路径。
- 未新增依赖、未复制大 SDK、未新建链接、未做临时组件准备。
- Git 全程**只读**：未 add / commit / rebase / stash / reset / clean /
  checkout / push，未暂存。**交回靠写协调目录文件，不靠 Git 提交。**
- 未改动既有 dirty 内容，未触碰 `lawbench-B` 内既有文件
  （仅新增本交回件与 4 个新源文件）。
- 未联系其他会话，未换 API，未做 AST/parser/JSON parse 自检、未做 patch 语义探针。
- 未触发历史禁止项（10 号临时探针等一律未重演）。

## 交给 Root 的运行要点

1. 源码未经运行验证，可能需要 Root 侧先做只读源检与必要的小修。
2. 运行方式见同目录 `README.md`（Key 走 stdin；
   `python native-relay.py --root <runs/下的新目录>`）。
3. 判据：真实出网 POST 恰 1 次且 NativeGate 接受；Node 退出码 0；
   `finish_reason=stop`；回复非空（预期中文"连接测试成功"）；
   stdout/stderr/`node-result.json`/`result.json` 无真实 Key；收尾全绿。
4. 超时预算：Node 120s / Python 180s / Root 外层 210s。
5. Root 需自行按 CIM 抓自己的父进程 + Node 子进程，不得宽泛 kill。

## 明确未验证

- **T34 整体 NOT PASS**：本目录只覆盖一段链路。
- **GUI 未验证**（没起桌面外壳）。
- **系统钥匙串 / 系统存储未验证**（用的是 T50 进程内存夹具）。
- Agent / Session / 历史 / R 记录 **一律未构造**。
- 服务侧 `Net` / `ExternalLLMPolicy` / `forward_app` 在
  `lawbench-A\service` 下的实际接口签名以 Root 运行时的真实源码为准；
  本消费者按已验收的 B 线消费者同款调用方式书写。

## 遗留 / 风险

- Node 侧 `ctx.llm.stream` 的返回形态以原 SDK 实际实现为准（按
  `GenerateOptions` / `StreamChunk` 类型书写：text-delta / usage / finish）。
- `max_tokens` 与 `max_completion_tokens` 的实际落点由原 SDK 的 compat 决定；
  NativeGate 允许二者**互斥**任一，值须为 256。
- `llm-pi-ai` 线路的 `baseURL` 尾部路径以原始 forwarder 的实际路由为准
  （源码按 `/v1-ext` 书写，与已验收消费者一致）。
- 本线未跑任何东西，以上三点是首次真机运行的预期调整点。
