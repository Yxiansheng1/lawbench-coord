# A 线交回：T34 enabled prototype fix

状态：`SOURCE_ONLY_READY_FOR_ROOT_COMPARE`；`runtime=0`；`not_tested`。未宣称运行通过。

## 产物

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledPrototypeFix-20261031-112635\native-enabled.mjs`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledPrototypeFix-20261031-112635\literal-inputs.json`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledPrototypeFix-20261031-112635\README.md`
- `D:\Lawbeach\lawbench-coord\A-handback-T34-enabled-prototype-fix-20261031-112635.md`

## 实际改动

- 两份 service class 身份断言由直接比较 `.constructor` 改为
  `Object.getPrototypeOf(service) === Module.default.prototype`。
- `module_identity` 的初始化、赋值、断言共六处字段名分别改为
  `settings_prototype` 与 `config_editor_prototype`。
- `literal-inputs.json` 从原目录原样复制。
- README 仅补充 `.constructor` 经 `createTraceable` 代理、应比较原型的源码说明。
- 原 `EnabledRouteWrite-20261031-111605` 目录未改。没有 Git 读取或写入、Node、
  Python、解析、测试、检查、构建、GUI、HTTP 或模型调用。

## 实际命令与非零项

1. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-enabled-prototype-fix-order-20261031-112635.md' -Raw`
2. `Get-Content` 读取原 `native-enabled.mjs`、`literal-inputs.json`、`README.md`。
3. 首次读取 `D:\Lawbeach\lawbench-A\vendor\cordis\src\utils.ts`：退出码 1；
   路径不存在，随后区间取值因空数组产生 76 条 `InvalidOperation`。
4. `Get-Content` 读取 `CurrentUIExactGUI-20261031-102438\projection-observer.mjs`
   第 460–482 行。
5. 按 canonical 路径读取 `D:\Lawbeach\lawbench-A\dsh\vendor\cordis\src\utils.ts`
   第 145–220 行：退出码 0。
6. `New-Item` 建立上述新证据目录，`Copy-Item` 原样复制三项原始材料：退出码 0。
7. 使用定点文本编辑完成上述 source-only 修改和正式交回文件创建。
8. 对四项产物执行一次显式 `Get-Item` / `Get-FileHash` 清单：退出码 1；
   PowerShell `ParserError: An empty pipe element is not allowed.`，未产生哈希。
   按执行令未重试。

运行证据：无；运行次数 `0`。由 Root 比对原文件反向后执行。
