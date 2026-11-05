# A 线交回：T18 ModelInputEnvelopeFix

状态：`STATIC_FIX_COMPLETE` / `AUTHOR_RUNTIME0` / `ROOT_RUN_PENDING`

## 结论

原候选的选项包装在启动任何运行时之前被静态阻断。原表达式把完整 `request/header` 记录展开为 SDK 选项，与生产 `buildRequest` 的 `...header.config` 顶层布局不一致。A 线已完成令定的单一表达式替换；修正后的原始 pure SDK 离线转换候选尚未运行，等待 Root 按令完成整字节反向核对与源钉点复核后执行一次。

这是审计候选的准备包装缺陷，不是产品回归。`toPiContext` 当前只读取 `messages`、`tools` 与 `system`，不得据此宣称产品导致了原始事实遗漏。

## 精确修改

文件：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\trace.mjs`

旧：

```js
const options = { ...header.data.header, messages: derived.map((entry) => entry.message) }
```

新：

```js
const options = { ...header.data.header.config, ...(header.data.header.tools === undefined ? {} : { tools: header.data.header.tools }), messages: derived.map((entry) => entry.message) }
```

除上述一处表达式外，没有修改函数、守卫、计数、目标、钉点或历史逻辑。产品源码、SDK、`literal-inputs.json` 和其他证据均未改动。

## 状态与证据复用

- 原候选在 `RUNTIME_STARTED=0` 时被静态拒绝，因此旧运行证据为 `NONE`，不得沿用为修正候选的 PASS。
- 执行令载明 Root 已完整审查 `trace.mjs` 的 235 行、13974 字节，以及全部写入面、`rawRows=70`、`events=69`、`assistants=12`、`targets=3`、源钉点 8 个；A 线未重演该审核。
- 既有输入与源钉点在执行令中载明保持准确且源码不变，可按令复用；A 线未重跑哈希、解析、导入或运行时校验。
- README 已记录静态拒绝、精确修正、`runtime0` 和证明边界。

## Root 后续命令

A 线未执行下列命令：

```powershell
node D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\trace.mjs
```

Root 仅在完成整字节反向核对和源钉点复核后执行这一条有界离线转换。只允许出现一次离线原始 SDK 转换调用；不得改做模型调用或网络请求。

## 验证边界

A 线运行次数为 `runtime0`：未运行 Node、解析器、导入、语法检查、测试、构建、应用、模型或 HTTP，未读取子代理，未更换 API，未改沙箱、审批或 ACL。Git 全程只读使用边界未被 A 线改写；本次未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

即使 Root 运行成功，该离线审计最多只能证明原始持久化前缀经原始 pure SDK 函数折叠、转换后保留了目标文本。它不能证明历史 HTTP wire body、模型实际收到的内容或模型输出正确；原始日志的 `observed_wire_body_captured` 为 `false`。原始问题仍是 `business FAILED`，T18 仍为 `false`，Packaging 仍为 `HOLD`。

## 交付文件

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\trace.mjs`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\README.md`
- `D:\Lawbeach\lawbench-coord\A-handback-T18ModelInputEnvelopeFix-20261031-205417.md`
