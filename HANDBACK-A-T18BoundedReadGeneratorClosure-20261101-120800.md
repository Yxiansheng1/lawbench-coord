# A 线交回：T18 有界读取生成器封闭修正

状态：`AUTHORED_NOT_RUN`  
runtime：`0`  
最终目标 SHA-256：`193766d71caec8fb2eba65637157949f49a6d89651594921b2683a6626024ff4`  
最终目标大小：`68275` 字节

## 修改

唯一修改文件：`D:\Lawbeach\lawbench-A\contracts\_build\gen_schemas.py`

- 保留契约版本 `1.7`、`case_read_material.end` 可选行为以及全部无关 helper/schema 定义。
- `core/task_begin.schema.json`：在局部 `$defs` 导出 `request_scope`，并让 `value` 与 `response` 内的值都引用 `#/$defs/request_scope`。
- `api/request_scope.schema.json`：成功响应的 `value` 引用局部 `#/$defs/value`。
- `files/task.schema.json`：恢复原属性顺序为 `request_id`、`request_scope`、`route`；`request_scope` 保持 nullable，并恢复原短描述。
- 生成 schema 文本与 `VERSION` 显式使用 `newline="\n"`。

## 验证边界

本运行只做了源码静态回看与最终目标哈希/大小记录。按执行令未运行生成器，也未运行任何 Python、Node、解析器、契约检查、测试、构建、HTTP、模型、GUI 或自测；因此不声称生成结果已实际红绿。

未写生成 schema、`VERSION`、SDK、agent 或 Spec 文件。Git 全程未写：没有 add、commit、rebase、stash、reset、clean、checkout、push；没有处理 `index.lock`、权限、沙箱、审批或 writer 锁。

## 交回

无额外阻碍。请主编排按既定流程执行 full inverse、setup writes review 与实际生成验收。
