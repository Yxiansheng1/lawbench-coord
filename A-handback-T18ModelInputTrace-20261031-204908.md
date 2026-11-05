# A 线交回：T18 Model Input Trace

状态：`AUTHORED_NOT_RUN`；`runtime0`；离线审计候选尚未取得运行证据。

## 交付

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\trace.mjs`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\literal-inputs.json`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ModelInputTrace-20261031-204908\README.md`
- 本交回件。

`literal-inputs.json` 已按执行令用 `Copy-Item` 从批准输入字节精确复制。除以上新增件外，没有修改产品、测试、SDK、框架、Skill、prompt、guard、loader 或构建文件，也没有暂存、提交、rebase、stash、reset、clean、checkout 或 push。

## 已固定的输入

- 唯一原始日志及批准 SHA-256、字节数、mtime。
- 批准 header；原始行数 `70`，事件数 `69`。
- 目标 seq `37`、`42`、`60` 的精确消息 id、tool call id、完整文本 SHA-256 与 UTF-8 字节数。
- 批准源钉点 `8` 个；运行时要求真实 `assistant/message` 共 `12` 个，此数量尚未由执行验证。

## 审计设计

`trace.mjs` 直接导入原始 `surface.ts` 的 `foldSurface` 与 `deriveEventMessage`，以及原始 `context.ts` 的 `toPiContext`。每个 assistant 的真实前缀都是该 assistant seq 之前的事件，不含后继 `step/start`；前缀原样交给 fold，目标文本在 derived surface 与 pi-ai context 两端逐字节核对。

脚本前后核对整份日志与 `8` 个源钉点，要求所有前缀零 replacement、零 projection。所有不一致均抛错，不提供已知短语、mock、adapter、动态解析或语义回退。脚本不读环境变量、不调用模型、不访问网络、不写文件。

## 仍需 Root 执行

作者按执行令没有运行语法检查、测试、构建、Node、解析器、导入或任何应用启动。Root 后续应在既有隔离环境、原始 E50 resolver 与 network guard 下运行 `trace.mjs`，不安装依赖，不创建新的 Native app/session。

在 Root 运行并复核 stdout 与前后钉点之前，本次交付不得称为 PASS 或“模型实际收到”。历史 HTTP wire body 未捕获，因此任何离线结果都不能证明真实网络消息或模型接收。原始草稿业务问题仍为 `FAILED`，整张 T18 仍为 `false`，`Packaging` 维持 `HOLD`。
