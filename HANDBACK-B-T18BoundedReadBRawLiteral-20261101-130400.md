# 线 B T18 有界字面修改交回

状态：AUTHORED_NOT_RUN

运行时：0

执行依据：

- `D:\Lawbeach\lawbench-coord\ORCH-B-T18BoundedReadBRawLiteral-20261101-130400.md`
- `D:\Lawbeach\lawbench-coord\T18BoundedReadBRawLiteral-20261101-130400-approved.json`

已完成修改：

- `D:\Lawbeach\lawbench-B\contracts\_build\gen_schemas.py`：通过 `ConvertFrom-Json` 读取 `generator_mapping`，按 UTF-8 字面字节语义完成 3 处唯一替换。
- `D:\Lawbeach\lawbench-B\docs\src\Spec.md`：通过 `ConvertFrom-Json` 读取 `spec_mapping`，按 UTF-8 字面字节语义完成 1 处唯一替换。

执行边界：

- 所有替换均要求原文存在且唯一，然后一次性写回。
- 未改动映射外的字节，保留两文件现行 CRLF。
- 未运行生成器、测试、检查、构建或其他运行时。
- 未执行任何 Git 写操作。

阻碍：无。
