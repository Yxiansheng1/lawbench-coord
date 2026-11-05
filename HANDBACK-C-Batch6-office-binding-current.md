# C 线交回：Batch6 Office 验收入口绑定修正（源码）

状态：**有界源码修正完成，未执行验证**。

本次严格按 `ORCH-C-Batch6-office-binding-source-current.md` 执行，只修改
`prepare_acceptance.py` 中传给 `office_section` 的 `script_path` 实参。Root
已将版本与安装器名称固定为 `1.0.0` 的修改原样保留；没有改业务代码、验证
断言、预期值、资源、网络逻辑或 `office_acceptance.mjs`。

## 修正事实

修正前，`main()` 把
`pathlib.Path(__file__).resolve()` 传给 `office_section`，Node 实际会尝试执行
Python 文件，Office JS 必然不会运行。

修正后，调用参数为：

```python
require_file(
    pathlib.Path(__file__).resolve().with_name("office_acceptance.mjs"),
    "Office acceptance script",
),
```

该表达式解析为与 `prepare_acceptance.py` 同目录的绝对路径，并由已有的
`require_file` 在启动 Node 前确认它存在且是普通文件。

## 文件事实

基目录：

`D:\Lawbeach\lawbench-C\docs\plan\evidence\Batch6\FinalPackageAcceptance-20261103\`

| 文件 | 修正前 bytes | 修正前 SHA-256 | 修正后 bytes | 修正后 SHA-256 |
|---|---:|---|---:|---|
| `prepare_acceptance.py` | 38537 | `F0E2C98C32F26BF0E8022A1E6884468985DA7F8AEF2575248D63322C71317BAB` | 38661 | `48BF8E40EB9B7A07839E0A99922D9937C6CBF12CDBCF5583DEF285AD7D85ADE3` |

字节变化：`+124` bytes。

以下文件本次未改：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `office_acceptance.mjs` | 14007 | `B84230507F90242AB02AADBF5E8EE520550798D8E2E4B37E33A6D30D5C3D6B34` |

`office_acceptance.mjs` 与原始源码交回中的 bytes/SHA 一致，因此其既有源码
事实可复用。`README.md` 的 `1.0.0` Root 修改也原样保留；本次未触碰。

## 精确逆向

若需逆向本次唯一修改，把修正后的四行实参：

```python
            require_file(
                pathlib.Path(__file__).resolve().with_name("office_acceptance.mjs"),
                "Office acceptance script",
            ),
```

整体替换回修正前的一行实参：

```python
            pathlib.Path(__file__).resolve(),
```

逆向应恢复 `prepare_acceptance.py` 为 38537 bytes、SHA-256
`F0E2C98C32F26BF0E8022A1E6884468985DA7F8AEF2575248D63322C71317BAB`。

## 验证与边界

- 只做了只读源码定位、调用点核对、文件 facts 和修正后静态核对。
- 没有运行 Python、Node、解析器、测试、构建、安装包、GUI、HTTP、模型或 OCR。
- 没有执行任何 Git 命令，也没有使用 `add`、`commit`、`rebase`、`stash`、
  `reset`、`clean`、`checkout` 或 `push`。
- 工作树原有 dirty 内容未覆盖、未清理；本次只改上述一个参数，并新增本交回件。
- 本修正没有新的执行证据；不把旧执行结果冒充为本次源码执行的 PASS。
