# A 线交回：T34 平台原生依赖上下文

状态：按正式执行令完成有界源码上下文与证据固化。未运行任何运行时验证，不声称目标通过。

## 交付物

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PlatformNativeContext-20261031-015332\dependency-context.mjs`
  - 55,089 字节
  - SHA-256 `691c98fbb963977a661ba4b5f970abeb5d6b668b0c2ce49454a6adc9f03cc59a`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PlatformNativeContext-20261031-015332\literal-inputs.json`
  - 63,539 字节
  - SHA-256 `c98afe56db78f8eba1e77582a5cf7ebb8348c17012711e2e1989f07ab4c978bc`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\PlatformNativeContext-20261031-015332\README.md`
  - 记录固定输入、有界差异、计数、运行状态和未来同步放行后的验证顺序。

正式执行令要求的新增文件仅上述三个证据文件与本交回件。未创建固定准备资源根 `D:\Lawbeach\lawbench-coord\T34PlatformNativeResources-20261031-015332`。

## 静态核对

- 基线：55,083 字节，SHA-256 `95ef4c472a70900417606d19009ebe09a1f737e9941e9ac9d117bba09a0b131d`。
- 新源码相对基线仅 7 行成对变化，对应批准的三处声明：`COPY_TABLE` 路径/大小/SHA/文件数/字节数、`PREPARED_RESOURCE_ROOT`、既有扩展列表末尾追加一个 `.node`。
- 将上述 7 个变更字面量反向替换后，源码 SHA-256 精确恢复为基线值，证明其他文本未被改动。
- `literal-inputs.json` 与批准 `approved-inputs.json` 均 63,539 字节，SHA-256 均为 `c98afe56db78f8eba1e77582a5cf7ebb8348c17012711e2e1989f07ab4c978bc`，逐字节一致。
- 批准复制表：1,752,599 字节，SHA-256 `1e712a4a6ecf1b5f13c7ca931df794210c186274ca89b41443d35426e19af22a`。
- 批准固定表：154 个包，4,786 个文件，26,435,994 字节；其中只有 1 个 `.node` 文件。
- 新增范围仅原 SDK 的 4 个 `node-addon-require-builtin-win32-x64-msvc` 文件，共 344,423 字节。

静态源码阅读说明 `appBoot.internalModules()` 经可选平台包加载 `node-addon-require-builtin-win32-x64-msvc` 的来源缺口；这不是旧有界启动错误的原因定论，也不能证明目标通过。

## 作者侧既有计数

- 旧来源检查：6/6/0，本轮未重跑。
- 旧 finalizer 检查：4/4/0，本轮未重跑。
- 旧坏 manifest 和旧正式交回件保持原样，未改写。

以上是既有证据的作者侧计数，不是本轮新的通过数。

## 运行与禁区状态

- 运行时执行：0。
- 原生实际加载：NOT RUN。
- `PREPARE_ONLY`：NOT RUN。
- `ACTUAL`：NOT RUN。
- 应用、GUI、模型、HTTP、安装、构建、测试、全量套件和 JavaScript 解析：0。
- 源 SDK、served resources、原包、缓存、策略及 writer 锁：未修改。
- 全局用户缓存：未触碰；本次也没有产生任何原生副作用。
- 产品源码和缓存源码：未修改。

完整套件仍等待主编排明确同步放行。获准后的预留顺序是：`ROOTFULL` 反向检查、原始清单、pin、原生缓存加载来源检查、setup 清理前置；然后一次 180 秒 `PREPARE_ONLY`；核对独立副本并确认 OS 句柄关闭；最后一次 45 秒 `ACTUAL`。原生副作用只能落在本次拥有的私有 `LOCALAPPDATA`/`TEMP`，不得使用全局用户缓存。

## 执行计数与阻碍

- `exec_command`：20 次，全程原生 PowerShell，`login=false`；无 bash、cmd 或子代理。
- 首次只读 Git 状态查询因子模块目录权限非零；随后仅用一次只读 `submodule.dsh.ignore=all` 忽略配置重查并成功，存在既有 dirty/ignored 状态及长路径警告。未改变工作区。
- Git 写入：0；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 两次源码派生预检在写入 `dependency-context.mjs` 前中止；首次已逐字节创建 `literal-inputs.json`，其后未覆盖。最终四个新增文件各自只写一次。
- 所有 20 次 PowerShell 执行中非零退出 3 次：上述 Git 权限查询 1 次、源码预检 2 次。其余为 0。

本交回为停止点。未联系其他聊天、未更换 API、未读取 Key 或生产配置、未修改沙箱/审批/ACL，也未尝试修复 Git 锁或权限。
