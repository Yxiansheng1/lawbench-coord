# T34 设置读回失败：最小观测缝审查

日期：2026-10-30  
范围：只做现有源码可支持的观测设计，不实施、不运行 GUI、不新增客户端构建

## 先结论

1. 现有私有绑定钩子的 `console.error` 确实不可见：Host 子进程把 stderr 只收进主进程内存，而 stdout 被转发。仅看到“转发日志中绑定标记为 0”，不能推出组件未绑定。
2. 对 `getSettings` 失败本身，当前最稳的精确缝是 Host 的 `LawbenchRemote.prototype.getSettings`。但现有 `private-provider-binding.mjs` 只拦截一个固定的 provider 模块，不是通用 Gateway 响应钩子；批准输入中没有可证明的 Host 运行时模块 URL，也没有客户端 mount/`setApi` 注入点。
3. 因此可以设计并审查 Host 进程内的一次调用直通观察器，但不能声称现有材料已经提供同时覆盖 Host 与客户端阶段的同进程注入点。客户端阶段的精确实现仍缺一个经批准、带 pin 的模块/API 装载点。

## 现有日志通道缺陷

- `private-provider-binding.mjs:47-59` 使用 `console.error(JSON.stringify(...))` 输出绑定事件。
- `dsh/apps/desktop/src/host-process.ts:203-205` 把 Host 子进程 stderr 仅保存在私有内存缓冲 `this.stderr`，正常 ready 路径不转发；stdout 才 `pipe(process.stdout)`。
- `dsh/apps/desktop/src/node-environment.ts:12-17` 展开调用方 environment，未看到删除 `NODE_OPTIONS` 的清洗逻辑。

所以：

- 新钩子可能已经加载并绑定，只是标记落在未转发的 stderr；0 个转发标记不能证明“未加载”。
- 对现有绑定标记，最小可见性修补是把 `console.error` 改为 `console.log`，让既有 stdout 通道可见。这个改动不改变 resolve 函数、pin 或候选模块，但它只能验证组件绑定，不能诊断 `getSettings` 失败。
- 本次按令不实施该改动，也未启动 GUI 验证。

## 主观测缝：Host `getSettings` 边界

### 精确符号

- 类方法：`LawbenchRemote.prototype.getSettings`
- 原源码：`dsh-ext/host/index.ts:756`
- 返回：`Promise<unknown>`；内部先取 `/api/settings`，再走 `checked(...)`。

该缝能回答“Host 是否 fulfil 了一个已通过 settings 契约的值，或 Host 自身 reject”，不能回答客户端 `unwrapRemote`、`readSettingsIntoState` 或 `app.set` 之后的阶段。

### 直通包装规则

私有观察器只能在已确定加载的同一个 Host 模块实例上安装。不要按猜测的路径 `import` Host 源码，否则可能拿到第二份类或模块实例，观察不到实际调用。

建议的唯一包装形态：

```ts
const original = LawbenchRemote.prototype.getSettings
function observed(this: LawbenchRemote, ...args: never[]) {
  const originalPromise = Reflect.apply(original, this, args)
  // 观察链独立兜底；绝不把包装后的 promise 返回给原调用方。
  void originalPromise.then(
    (value) => emitFixedShape('host_fulfilled', value),
    (error) => emitFixedMetadata('host_rejected', error),
  ).catch(() => undefined)
  return originalPromise
}
LawbenchRemote.prototype.getSettings = observed
```

硬约束：

- 原方法只调用一次，`this` 与原参数原样传递。
- 返回原 promise，不重试、不映射成功值、不替换错误。
- 观察器内部所有异常吞掉；日志失败不改变调用结果。
- 只恢复自己的包装：仅当当前方法仍是 `observed` 时恢复 `original`。
- 不写诊断文件；优先使用现有 Host stdout 通道，避免 FS 失败参与业务结果。

### 固定、有限、无原文的字段

每次最多 8 个事件，总输出预算不超过 16 KiB。建议只输出：

```json
{
  "tag": "T34_SETTINGS_READ_OBS",
  "seq": 1,
  "pid": 0,
  "boundary": "host_getSettings",
  "phase": "call|host_fulfilled|host_rejected",
  "errorName": "Error|TypeError|TimeoutError|AbortError|OTHER|null",
  "code": "稳定短 code 或 null",
  "shape": {
    "isError": true,
    "isObject": true,
    "hasCode": false,
    "hasServiceCode": false,
    "valueObject": false,
    "hasDefaults": false,
    "hasSkillPresets": false,
    "hasProfile": false,
    "hasExternalLlm": false
  }
}
```

禁止记录：

- `message`、`stack`、完整异常、完整设置对象、URL、配置、材料名、路径、Key 或凭据；
- settings 字段值、provider 模型名、检索词、模型输入输出；
- 客户端 token 或授权头。

`errorName` 和短 `code` 是否可用于最终日志，应继续按固定白名单/长度限制；无法安全提取时记 `OTHER`/`null` 与布尔形状。

## 客户端边界与本令所称“Gateway 响应钩子”

`state.ts:223-230` 有精确的 `LawbenchApi.getSettings` 类型，`state.ts:248-257` 有精确的 `unwrapRemote` 解包规则。理论上可在客户端对 `settingsApi.getSettings` 的原调用做同样的尾随观察，以区分：

- Host fulfil 后客户端仍 reject：客户端/网关边界问题；
- 客户端取到值后 `app.set` 才失败：状态投影问题；
- Host reject：先查 Host 的 `api/checked` 分支。

但批准输入只给到 UI 源码，没有给出实际 mount 中 `unwrapRemote`/`setApi` 的装载模块、构建产物和 pin。现有 `private-provider-binding.mjs:63-69` 的 `resolve` 仅在 URL 等于固定的 `llm-pi-ai/lib/index.js` 时替换，不是 Gateway 响应钩子，也不能证明可用于 `lawbench.getSettings` 客户端包装。

因此当前精确阻塞是：

1. Host 侧符号与包装行为已支持，但还缺“实际加载的是哪个模块 URL/构建哈希”的获准 pin，才能安全安装到同一个类实例。
2. 客户端侧还缺实际 mount/装载点；不得猜测模块路径、不得新增私有客户端构建、不得为绿色而改产品调用链。

若主编排已有经 pin 的 Gateway 客户端响应缝，应提供该精确模块、校验方式和安装位置，再用同一直通规则观察客户端边界。否则本轮只能先做 Host 边界，不能把单次 Host 成功/失败夸大为整个 UI 链路的根因结论。

## 建议实施顺序

1. 如仍需验证现有 provider 组件是否加载，只把该钩子的 `console.error` 改为 `console.log`，沿用既有 stdout。
2. 若要定位 getSettings，先以单独运行安装 Host `LawbenchRemote.prototype.getSettings` 直通观察器；不改产品实现，不重放旧 GUI 计划。
3. 只有 Host 已 fulfils 且 UI 仍失败时，才使用经批准并 pin 的客户端 `LawbenchApi.getSettings`/`unwrapRemote` 边界做第二个独立运行。
4. 任何一次只观察一个边界，避免同一次事件无法区分 Host 与客户端来源。

在没有上述额外 pin 前，本审查不声称客户端观测缝已经可用，也不提出产品补丁。

