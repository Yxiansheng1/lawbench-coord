# HANDBACK — B线 T18 CitedUnread 边界夹具闭合

- 状态：`AUTHORED_NOT_RUN`
- 运行时验证次数：`0`
- 产品修复声明：无
- Git 操作：无（未执行 add、commit、rebase、stash、reset、clean、checkout、push）

## 有界修改

仅修改：

`D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py`

DOCX 追加节点中的一处断言：

```python
reads[0]["material_version"] == material["sha256"]
```

改为：

```python
reads[0]["material_version"] == hashlib.sha256(source_bytes).hexdigest()
```

PDF 追加节点中的一处断言：

```python
reads[0]["material_version"] == material["sha256"]
```

改为：

```python
reads[0]["material_version"] == hashlib.sha256(source_bytes).hexdigest()
```

共且仅有这两处断言替换。两处均使用已加载的原始夹具 `source_bytes` 核验实际材料版本，保留原断言强度。

## 完整性与边界

- 原文件大小：17,956 字节。
- 最终文件大小：18,000 字节；增量 44 字节，来自两处等长新增内容。
- 原 8,985 字节前缀及其余既有内容未被重写；除上述两处断言外，所有原始字节保持不变。
- 最终测试文件 SHA-256：`b9542217e14d90f6d63d1e5b75a8dc8a027d88c2d8be31d5097c47aabeeb526d`
- 未修改测试辅助层、导入、产品代码、schema、guard、旧 bootstrap 或其他文件。
- 接受的既有诊断事实：Root 的 `actual2FAIL9PASS` 为夹具 `KeyError`，不是产品失败。

## 验证说明

按执行令，未运行 pytest、Node、Python、解析器、HTTP、模型、GUI 或构建流程；运行时验证次数为 0。唯一执行的文件核验为最终测试文件 SHA-256 与大小。

## 遗留

后续运行时验证需由获准流程执行；本交回不声称产品缺陷已修复。
