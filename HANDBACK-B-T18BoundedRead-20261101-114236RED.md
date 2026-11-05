# B 线交回：T18 有界读取 RED

状态：`AUTHORED_NOT_RUN`

运行次数：`ZERO`

交回时间：`2026-11-01`

## 产物

- 新增测试：`D:\Lawbeach\lawbench-B\service\tests\test_read_bound_20261101_114236.py`
- 字节数：`7067`
- SHA-256：`5FBE67815932A3C27DBF524B8C741E11CD892A1339CF4A62F6DBC88DCDF85B0D`

本阶段只新增上述测试文件和本交回文件。未修改产品代码、契约、夹具或其他文件，保全了既有 dirty 状态。未执行 Git 写操作。

## 测试覆盖

1. 有界 `start=1,end=1` 只返回第一单元，不泄漏第二单元哨兵。
2. 有界 `start=2,end=3` 只返回第二、第三单元，不泄漏前后哨兵，并检查原文件字节未变。
3. 省略 `end` 时保持旧范围行为，返回本次 `max_chars` 下原有的完整可见范围。
4. 超长单单元的分段读取始终停留在第一单元，不泄漏第二单元；第一次未读完时 `reads.json` 和 `coverage.json` 保持不变，完整读完后才记录一次 `from=1,to=1`。
5. 反向范围 `start=2,end=1` 和越界 `start=1,end=999` 均返回 `INVALID_ARGUMENT`，且读取计数与原文件字节不变。
6. `more_names` 与 `end` 同时出现时返回 `INVALID_ARGUMENT`，且读取计数不变。
7. 公开工具入口通过真实契约校验拒绝五种非法类型：字符串 `start`、字符串 `end`、非整数 `offset`、低于下限的 `max_chars`、非字符串 `more_names` 项。

有界有效行为均走公开的 `case_read_material` 工具入口。测试读取真实临时目录内的 TXT，使用现有 `Env` 建立任务，读取真实 `reads.json`、`coverage.json`，并核对材料输入字节未变。未使用真实案卷、Key、网络、模型、Office 文件或解析器。

## 当前 RED 的含义

现有契约没有可选参数 `end`。因此，有界有效行为用例在当前基线上会先在真实参数 schema 校验处失败；这与“当前 schema 尚不具备有界结束能力”的既定基线一致，不构成对当前契约的违反声明。后续加入约定的 `end` 后，公开入口会到达真实读取实现，并继续检验其是否只返回选中单元。

反向、越界及 `more_names+end` 用例在当前基线上也可能由 schema 先行拒绝；加入契约后再检验真实读取函数的业务校验与非副作用。没有用跳过、弱断言或预期失败标记掩盖这一边界。

## 依赖与清理假设

- 依赖 pytest，以及现有 `service/tests/t8_helpers.py` 中的 `Env`、`fail`。
- `Env` 使用普通 `TestClient`，未使用上下文管理，因此不会触发 lifespan；测试 fixture 在 `try/finally` 中调用 `Env.close()`，关闭私有客户端并清理临时 appdata。
- pytest 的 `tmp_path` 管理合成 TXT 与案件目录；测试只用纯 TXT。
- 假设材料名按现有扫描行为使用文件名；假设任务目录中的读取与覆盖记录文件名分别为 `reads.json`、`coverage.json`。
- 假设 TXT 的空行分隔块会被识别为四个可读取单元；没有在本次纯源码阶段运行验证。

## 未执行事项

按规定未执行 pytest、收集、导入、语法编译、契约检查、构建、服务启动、HTTP、模型或 GUI 验证，运行计数为零。当前产物尚不能宣称通过；固定契约与产品实现后，应由规定验证阶段实际运行并判读。
