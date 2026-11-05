# T34 设置读回失败：源码审查结论

日期：2026-10-30  
执行线：B（DeepSeek）  
执行令：`B-T34-settings-read-failure-review-order-20261030-124520.md`  
模式：只读源码审查，运行时 0

## 结论

原生实际现象成立：界面出现“没能读取服务设置，外部模型路由没有同步”，且同一受控运行记录到 `/api/settings` GET 为 HTTP 200、B 服务日志记录 settings 成功。现有证据仍不能证明具体异常发生在哪一层，不能把该现象归因于网络、Key、ACL、HMR、settings 文件内容或 DSH Gateway。

源码能确定的是：UI 的读回函数捕获所有异常并折成 `undefined`，随后显示固定提示；因此任何阶段的失败都会呈现成同一条可见消息。冻结源码内没有证明出一个确定性的响应/契约不匹配。

## 证据复用与完整性

批准输入文件：`D:\Lawbeach\lawbench-coord\T34SettingsReadFailureReviewInput-20261030-124520\approved-inputs.json`。

- 15 份原始源码与对应冻结快照均逐文件 `Get-FileHash -Algorithm SHA256` 比对通过；未读取或改写任何产品文件。
- 4 份既有证据文件的字节数、SHA-256 与批准清单一致：
  - actual closed：11,032 bytes，`4df08d0f43dba2d7992fdf64ead138155d79daa2c623a511376fbcd3fff9f9e6`
  - actual sealed：426 bytes，`fa7fc081678d5d56a16d884aed80bca6d24ab100db5f3e5a0c48d8c5f7ddfe80`
  - source controls：1,105 bytes，`2edbd99e9389ca1cf6fe287eb75b77a1be38cffc60dd786ecc5715fade5b244d`
  - private build：1,310 bytes，`73cfef3daf1352d91d3693e28beaa24cbaec6ff6b7984797a0202040f7fecd06`
- 既有封存包记录 43 个文件、manifest SHA-256 `750d09ca45c62abad538c655dbd74f6b199360dc6b2888173623d83457c492a7`；本次复用该封存声明，未重演 GUI、构建或全量测试。

## 实际事实

来自既有 actual 证据：

- `settings_GET_HTTP200 = 1`；native 请求 46 次，均记录 HTTP 200。
- B 服务日志记录 settings 成功；该日志不携带响应正文或客户端异常。
- 私有观察器状态为 `ready`，`settingsMutate = 0`、`configEditorEdit = 0`、`events = []`。
- 设置读回失败提示实际可见；必需的设置变更未到达。
- 受控 GUI 已关闭，4 个自有端口无监听，原 12 个窗口未触碰。

这些事实只能证明“服务端收到并完成了 settings GET”和“UI 读回失败”，不能证明 Host 的 JSON 解析、Host 契约校验、DSH Gateway 包装、客户端解包或 `app.set` 成功。

## 精确调用链

1. `dsh-ext/ui/settings.tsx:239-255` 的 `readSettingsIntoState`：
   - `246` 调用 `settingsApi.getSettings<Settings>()`；
   - `248` 成功后才调用 `app.set(...)` 投影 `defaults`、`skill_presets`、`lawyer_name`；
   - `250-254` 用无绑定的 `catch` 吞掉错误；状态仍为当前代次时返回 `undefined`。
2. `dsh-ext/ui/settings.tsx:265-273` 的 `projectSavedExternalProvider`：
   - `270` 等待上述读回；
   - `271` 对 `null` 或代次失效静默退出；
   - `272` 对 `undefined` 返回固定可见消息“没能读取服务设置，外部模型路由没有同步”。
3. `dsh-ext/ui/state.ts:248-257` 的 `unwrapRemote`：
   - `253` 用原对象作 `this` 调用远端方法；
   - `254` 要求 DSH Gateway 结果为 `{ ok: true, value }`，否则抛出由 `lawyerMessage` 泛化的错误；
   - `255` 只把 `value` 交给 UI。
4. `dsh-ext/host/index.ts:756` 的 Host `LawbenchRemote.getSettings`：
   - 先调用私有 `api('GET', '/api/settings')`；
   - 再把原始值交给 `747-754` 的 `checked`，以 `{ ok: true, value }` 按 `settings.schema.json#/$defs/response` 校验。
5. `dsh-ext/host/index.ts:692-704` 的私有 `api`：
   - `694` 无 endpoint 时抛出服务不可用；
   - `695-699` 是**全局 `fetch`**，不是 `callApi` 使用的 `requestJson`；带 30 秒超时；
   - `700` 执行 `r.json()`，不先检查 HTTP 状态；
   - `702` `j.ok !== true` 时抛出服务错误；
   - `703` 只返回 `j.value`。
6. 服务端：
   - `service/lawbench/api/ui.py:32-56` 构造并返回 `{ ok: true, value }`；
   - `ui.py:104-105` 的 `settings_get` 调用 `st.settings.get()`；
   - `ui.py:205` 注册 GET 路由；
   - `service/lawbench/settings.py:50-61` 缺文件时返回默认值，存在文件时读取并先按 `files/settings.schema.json` 校验。
7. 成功进入 UI 后还会经过 `dsh-ext/ui/store.ts:15-19`：执行状态更新函数并同步调用所有订阅者。订阅者异常也会被 `readSettingsIntoState` 的 `catch` 吞掉，并形成同一可见失败。

## 静态候选阶段

以下均为源码允许的失败点，不是实际根因判定：

| 边界 | 候选失败 | 冻结源码依据 |
|---|---|---|
| Host HTTP | endpoint 缺失、fetch 拒绝/中止、读取 body 或 `r.json()` 失败 | `host/index.ts:692-700` |
| Host 业务包装 | `j.ok !== true`；即使 HTTP 200 也可能是应用级 fail | `host/index.ts:700-703` |
| Host 契约 | 返回对象不是 `{ok:true,value}`，或 `value` 不符合 settings 文件 schema；`validate` 自身也可抛错 | `host/index.ts:747-756`，`contracts.ts:40-45` |
| DSH Gateway | 调用拒绝、响应未按客户端预期包装，或返回 `{ok:false}` | `state.ts:244-255` 的接口约定；批准输入不含实际 Gateway 实现证据 |
| UI 解包 | 远端方法不存在、返回值缺少 `ok:true`、`value` 未取出 | `state.ts:250-255` |
| UI 状态投影 | store 更新函数或订阅者同步抛错 | `settings.tsx:248`，`store.ts:15-19` |

HTTP 200 只证明服务端返回了状态码 200；站点现有证据还记录服务端 settings 处理成功，但仍不能替代 Host 解析、Host 契约、Gateway 和客户端结果的原始证据。

## 实际、静态候选与未知的边界

**实际**

- UI 可见“没能读取服务设置”。
- 同次受控运行有 1 次 settings GET HTTP 200，B 服务日志记录 settings 成功。
- 私有观察器 ready，但设置写改计数和事件均为 0。

**静态候选**

- 上述 Host、Gateway、客户端解包、store 订阅任一处的同步或异步异常。
- 由于 UI `catch` 无绑定变量，异常名称、错误码和原始消息均不保留。

**未知**

- 实际抛出的异常阶段、名称、code、是否 Error 及安全形状。
- 实际响应正文、JSON 包装和客户端收到的对象；未把 settings 文件类型或服务日志当作原始响应证据。
- 本次加载的 Host/客户端构建产物是否逐字节等于已审源码所属构建；批准输入没有提供该运行时绑定证明。
- 私有 provider 组件是否在新运行中实际绑定；`binding_marker_in_forwarded_logs = 0` 不能回答该问题。
- 现有 dirty 清单；按执行令未运行 Git 状态/历史/目录枚举，且本次没有接触 B 线代码。

## 审查裁定

- 这是设置读回失败的源码可解释性审查，不是新的 ConfigEditor 写失败 RED，也不是 GUI 修复通过。
- 不提出重试、空 catch 改写、隐式 fallback、跳过 gate 或通用客户端框架；这些都没有实际根因证据支撑。
- Source 2 正例 + 1 负例的既有结论继续保持独立，不与本次 settings GET 失败合并。
- 产品、测试、fixtures、SDK、私有组件、已服务根与 pins 均未改动。

