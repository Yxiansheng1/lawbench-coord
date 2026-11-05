# B 线交回：T31 Scope Evidence Publisher

状态：完成有界离线源码摘录。SOURCE NOT RUN / OFFLINE FINITE ONLY / NO FULL GUI ACCEPTANCE。

## 交付物

- 证据目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopeEvidencePublisher-20261031-061636\`
- `entry.py`：43,775 字节
- `entry.py` SHA-256：`1da8cf5594863d4f54027565149cc40dea210e63815590bed68ff08d9064eacb`
- `README.md`：范围、来源与不宣称事项
- `literal-inputs.json`：批准输入事实、唯一替换字面量及有限主张

## 修改与证据

批准基线的 `_write_json` 默认使用 `mode="x"`，创建同名文件时排他。`_publish_scope_evidence` 的既有调用没有传模式，因此首次发布可创建 `scope-evidence.json`，后续重发会因目标已存在而失败，旧摘要不能更新。本次仅在该调用上增加 `mode="w"`，只覆盖该测试证据发布器自有的记录文件。

`entry.py` 由批准基线逐字节复制，只做上述单一调用替换；字节数与批准值一致，SHA-256 与批准值一致。没有修改旧摘要或既有实际证据。此复制有意保留计划旧 GUI 根路径，不得作为新 GUI 入口准入或对外服务。

## 验证边界

按执行令，没有运行源码、断言、测试、构建、App、GUI、HTTP、模型或网络流程；因此不给完整 GUI 验收结论，也不重演既有 GUI/native 绿灯。只执行了最终文件长度和 SHA-256 元数据核对。

Git 写操作未执行，没有 add、commit、rebase、stash、reset、clean、checkout 或 push。仅创建上述指定新文件；目标目录原先不存在。未改动沙箱、审批、ACL、锁或其他工作区文件。

## 遗留

后续目标测试须待 owner 明确解除同步冻结；本交回只提供有限源码证据，不替代该测试或 GUI 验收。
