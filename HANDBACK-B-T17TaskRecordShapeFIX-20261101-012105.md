# B 线交回：T17 任务记录形状修复

状态：AUTHORED_NOT_RUN

## 修改

- 唯一修改文件：`D:\Lawbeach\lawbench-B\service\lawbench\case\task.py`
- 修改位置：`TaskStore._read`
- 唯一语义改动：旧任务单 `route` 兼容默认值仅在 `schema == "files/task.schema.json"` 且 `data` 为 `dict` 时执行。
- `contracts.validate(schema, "", data)` 保持无条件执行；非对象数据仍由原验证器抛出 `ContractError`。
- 未增加 helper、异常捕获、形状验证器、schema 或 route fallback。

## 源码指纹

- 修改前 SHA256：`7b6ee04ba53f45b1f7e6624d2c9bf60b122dfc68c12e26331431a84eed36bf04`
- 修改前字节数：`40607`
- 修改后 SHA256：`a5f4d01587def86b1308eef91c06263ceab7d0a24c7b7f663d54bdee33d7ec01`
- 修改后字节数：`40634`

## 验证与计数

- 本次测试执行数：`0`
- 本次 collect / prepare / build / runtime 数：`0`
- 当前交付证据等级：AUTHORED_NOT_RUN；不能表述为修复后测试通过。
- 执行令给定的既有根场景 RED 计数：共 `9` 项，其中 `5` 项 AttributeError FAIL、`4` 项 PASS；本次未重跑。
- 指定的修复后验证测试文件保持不变，批准 SHA256 为 `33ffc45c4bf28b3442504ef3c113e569113a111def3ab28467ebd2edd1204e52`。

## 边界确认

- 未读取或修改测试、guard、contract、SDK、Service API、TaskState、Agent、prompt、budget、dependency、default app 或 global policy。
- 未执行 Node、Python、parser、AST、pytest、collect、prepare、build、serve、HTTP、model、GUI、env、Key、credentials 或 runtime 操作。
- 未执行任何 Git 读取或写入，包括 status、diff、add、commit、rebase、stash、reset、clean、checkout、push。
- 未联系其他聊天，未更换 API，未改动沙箱、审批或 ACL，未处理 writer 锁。

## 偏离

无。
