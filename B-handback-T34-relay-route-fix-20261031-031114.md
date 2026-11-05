# B 线 T34 中继路由修复交回

执行令：`D:\Lawbeach\lawbench-coord\B-T34-relay-route-fix-order-20261031-031114.md`

## 结论

源文件中的三个指定字面值已完成有界修改；其余源码字节未作编辑。本次没有运行产品代码、脚本、测试、构建、解析器、导入检查或任何网络/模型请求。正式运行态为 0，实际单请求验证为 `NOT RUN`，因此整个 T34 状态仍为 `NOT PASS`。

旧版源码的路由基址缺少 `/v1`，已按执行令在导入和任何产品请求之前作静态拒绝；该旧证据不能产生产品请求结果。此前已审查的“根目录初始 417、当前 330，源码与清理逻辑已复核”状态沿用执行令所载事实，未重演旧开工、安装、调研或全量测试。

## 修改对象

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549\relay-forward.py`

修改前 SHA-256：

`837bed29b107178a0e8dcd5ded947faf9a80e3b934a66c3686ac7220bebb742f`

修改后元数据：

- 字节数：`15707`
- SHA-256：`06e63ebc7c92eb7b316527446dfe094ba48f6f7ef8c8971d2991703d81bb2c23`

仅替换以下三个值：

1. `enabled` 字典内的 `base_url`：`https://www.tokenav.ai` → `https://www.tokenav.ai/v1`
2. `context_window`：`65536` → `32768`
3. `supports_tools`：`False` → `True`

未改动格式、注释、清单、说明或其他源码行。原有一个 POST 门禁、请求边界、隐私扫描和清理逻辑均保留，未弱化断言。

## 限制与状态

- 本次仅做源码字面值修改和源文件元数据记录。
- 未保存真实凭据，未使用全局环境变量。
- 未执行 Git 写入；未使用 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 原始正式文件、状态原始记录、Manifest 和 README 均未改写。
- 未联系其他会话，未更换 API。

## Root 后续边界

Root 可先对上述修改后文件做精确全字节反向还原，再按既有授权执行 AST 无导入检查和一次实际请求。运行时由 Root 在私有子进程环境中把 `PYTHONPATH` 单点限定到 `B/service`，以解析原有固定版本包；无需再修改本源码。

本次交回以本文件为准，不以 Git 提交作为交付。
