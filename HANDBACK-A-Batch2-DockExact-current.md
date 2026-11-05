# HANDBACK A Batch2 DockExact current

状态：源码精确修改已完成，交回待主编排核收。

## 修改

- 仅修改 `D:/Lawbeach/lawbench-A/dsh-ext/ui/dock.tsx`。
- `rowsOpen` 初始化为 `useState(hero)`。
- `showRows` 改为 `showRows = rowsOpen`。
- “选能力/收起能力”按钮移除 `!hero` 外层条件，保持原点击逻辑与文案不变。
- `EXTERNAL_HINT_TEXT` 改为“外部模型采用服务商默认思考设置；使用公开模型时请避免上传本地客户信息”，服务商默认思考设置句保持不变。
- `data-route-label` 所在 span 增加按本地/外部路由区分的浅色背景、同色 1px 边框、4px 圆角和 `4px 6px` 内边距；原有字体颜色与路由逻辑不变。

## 验证

- 源码：已按令写入。
- runtime：`NOT_RUN`（执行令明确禁止本 job 运行测试、parser、build、model、GUI、HTTP、tsc）。

## 边界

- 未执行任何 Git 写操作。
- 未修改模型配置、Key、handler、slots、materials、inputs、SDK、logo、T18。
- 未进行额外调研或全量测试。
