# T18 Cited Unread Bootstrap 交回

- 状态：`AUTHORED_NOT_RUN`
- runtime executions：`0`
- 源文件：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17OriginalTaskRegression-20261101-020115\bootstrap.py`
- 源 SHA-256：`7286e52ff7808fa98cf1504eafdb5e624814884d0bb8466c2dc4aa71c31436c4`
- 目标文件：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadBootstrap-20261101-143849\bootstrap.py`
- 目标字节数：`32098`
- 目标 SHA-256：`74e39d76dff08d470017f955a99dab6c026bede6f249ac900cae90972fc2c0a0`

## 实际修改

保留源文件全部原始字节，仅将 `MAIN_TARGETS` 中唯一命中的 22 条 pytest 目标替换为一条：

`r"D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py"`

替换前后的大小和 SHA-256 均与绑定清单完全一致。源文件使用 LF；目标文件沿用原字节和 LF 换行。

## 完整性边界

- 旧目标区块在源文件中精确命中一次，目标区块只写入一次。
- 除上述区块外，其余字节原样继承；未改动 flags、T37 precollection exclusion、38 个 guard 函数、process env、setup 或 finally。
- `protectedDeny`、`authorize_batch`、`soffice` 按源文件原函数复用，未修改、克隆、改路或绕过。
- 本线未修改产品代码、测试、helper 或 conftest。
- 未执行源码、pytest、collect、parser、test、check、build、prepare、serve、probe、HTTP、模型、GUI 或其他 runtime。
- 未执行任何 Git 写操作；本次交回不是 Git 提交。

阻碍：无。
