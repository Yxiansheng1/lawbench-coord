# B 线交回：T18 有界读取生成器收口

状态：`AUTHORED_NOT_RUN`

runtime：`0`

## 修改范围

- `contracts/_build/gen_schemas.py`
  - 契约版本升至 `1.7`。
  - `case_read_material` 增加可选整数参数 `end`（最小为 1，含本端），`more_names` 的互斥说明补入 `end`。
  - `core/task_begin` 的 `$defs/request_scope` 使用批准的长描述；`files/task` 保留短描述。
  - `api/request_scope` 成功返回的 `value` 改为本地 `#/$defs/value` 引用。
  - `files/request_scope_store` 的 `records.additionalProperties` 改为本地 `#/$defs/record`，并由既有 `scope_record` 生成该局部定义。
  - 新增 `files/request_scope_intent` 生成声明，字段和描述按批准的预期 Schema。
  - Schema 与 `VERSION` 写入显式指定 LF。
- `docs/src/Spec.md`
  - 仅在 `20.12` 表尾追加批准的 `1.7` 行。

未修改测试，未运行生成器，未写入任何生成的 `.schema.json` 或 `VERSION`，未执行 Git 写入。

## 最终目标核对

补丁后只执行了一次两个目标的 SHA-256 与大小读取：

| 目标 | SHA-256 |
|---|---|
| `D:\Lawbeach\lawbench-B\contracts\_build\gen_schemas.py` | `AFBC423B4448F2734C820954CAEA4FF19857279033EB18B519B7CBB7DB44C095` |
| `D:\Lawbeach\lawbench-B\docs\src\Spec.md` | `058D6F25E1C5045F79BBCF01B2FF7E86AE01C37DFFC20A48C59D81A437A749A9` |

该单次命令同时读取了字节数，但终端表格宽度未渲染出 `Bytes` 列；按“最终 SHA-size 只执行一次”的边界，未为重取字节数而重跑。

## 未执行验证

按执行令，未运行 Python、Node、parser、check、test、collect、build、prepare、model、HTTP、GUI 或 selftest，因此五个预期 Schema 的运行时 DEEPEQUAL 尚未由本线验证。需由有相应授权的后续生成/验证阶段执行。
