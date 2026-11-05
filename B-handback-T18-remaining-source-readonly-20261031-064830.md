# B 线交回：T18 剩余来源只读复查材料

## 状态

- 交付：`SOURCE_NOT_RUN`
- Git：`NOT_RUN`
- 范围：仅准备原始业务严格失败之后的两条 `GET /api/source` 消费者阶段
- 结论限制：不是全 T18 通过，不是业务真实性通过，不是 Skill/法律真实性通过

## 新交付面

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RemainingSourceReadonly-20261031-064830\doc-revise\check.py`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RemainingSourceReadonly-20261031-064830\doc-revise\literal-inputs.json`
3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RemainingSourceReadonly-20261031-064830\litigation\check.py`
4. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RemainingSourceReadonly-20261031-064830\litigation\literal-inputs.json`
5. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RemainingSourceReadonly-20261031-064830\README.md`
6. `D:\Lawbeach\lawbench-coord\B-handback-T18-remaining-source-readonly-20261031-064830.md`

未提交，未暂存，未执行任何 Git 读写。因执行令禁止 Git，本交回件没有提交 SHA。

## 固定元数据

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `doc-revise/check.py` | 19974 | `3fb71b36fdf9e7e1ca386b1d85b726bf956b4029caca644a862f240abd096e37` |
| `doc-revise/literal-inputs.json` | 59955 | `a1c9b86373d3047722c3d706ca1a42db47147be9c1a1a089df719ebce219e97b` |
| `litigation/check.py` | 19974 | `3fb71b36fdf9e7e1ca386b1d85b726bf956b4029caca644a862f240abd096e37` |
| `litigation/literal-inputs.json` | 54999 | `9b5483381eb3880293b1d7119463952ed8c2ce79c2f42c9a5ea00ba4d83b48d0` |

批准元数据固定为：`doc-revise` 17 条 GET、27 个案件文件、`line/para`；`litigation` 15 条 GET、19 个案件文件、`line`。这些值来自批准 inventory，脚本内沿用的 13/20 注释是既有基线说明，不是本轮实际常量。

## 完成情况

两份检查脚本从既有基线字节复制，SHA 与字节数一致；只将报告标题从 `T18 pre-issue source readback (GET /api/source only)` 改为 `T18 remaining draft source readback (GET /api/source only)`。静态核对确认旧标题消失、新标题仅一处，其他源码未改。

两份 `literal-inputs.json` 分别与批准输入逐字节相同。没有解析、重构或补写输入内容，也没有读取实际案卷、Key、环境文件或产品树。

DOCX 段落继续以既有真实生成的 47 单元 Markdown 文本为预期，不新增 XML 解析或声称 Word 转换保真；TXT 行与原始来源 SHA 保持原口径。引用只来自既有原始结果，逐条实际 GET 的运行仍未发生。

## 验证与阻碍

作者阶段仅做文件静态核对：新目标无覆盖、复制字节相等、标题差异唯一、两份脚本同构、批准元数据与实际数量口径一致。没有导入、解析检查脚本，没有运行脚本、测试、构建、app、HTTP、模型、网络或 Git；`source_runtime=NOT_RUN`。

本轮没有运行权限或文件写入阻碍。真实执行所需的 fresh 输出目录和运行放行仍由主编排后续门控制；原始严格失败结果及既有来源证明均未改写。
