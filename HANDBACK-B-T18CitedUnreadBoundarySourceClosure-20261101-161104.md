# B 线交回：T18 CitedUnread 边界源码闭合

状态：`AUTHORED_NOT_RUN`

本执行者按指定执行令完成有界源码与 bootstrap 修改后停止。运行时测试次数为 0；未运行 Python、pytest、collect、build、server、HTTP、模型或 OCR，未修改产品、门禁、TaskStore、parser、citation 或 guard 源码，未执行任何 Git 写操作。

## 写入面

1. `D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py`
   - 仅在原有 18,000 字节后追加 `test_t18_gap_` 节点，数量恰为 2。
   - 原 18,000 字节前缀 SHA-256 保持为 `b9542217e14d90f6d63d1e5b75a8dc8a027d88c2d8be31d5097c47aabeeb526d`。
   - 修改后 22,767 字节，SHA-256 为 `87ae1628656c98a24ba5b14796b70dac84f25b83f637ec14abb285342c71764e`。
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadBoundarySourceClosure-20261101-161104\bootstrap.py`
   - 从 capsule 指定原件逐字节复制，原件 SHA-256 为 `74e39d76dff08d470017f955a99dab6c026bede6f249ac900cae90972fc2c0a0`。
   - 仅在 MAIN 的目标模块参数后插入 `"-k", "test_t18_gap_"`；逆向字节比较确认没有其他变化。
   - 修改后 32,137 字节，SHA-256 为 `a284e02c636447dcc5552e59f9125e6f48732e4edb3e3811218edf5d638067b4`。
3. 本交回文件。

## 两个新增节点

- `test_t18_gap_encrypted_pdf_inverted_range_rejects_failed_page`
  - 仅使用原始加密 PDF fixture，先核对公开材料清单为 `page`/`failed`，公开读取第 1 页返回 `MATERIAL_NOT_READY` 且 reads 为空。
  - 先执行有效的第 1 页拒绝控制，再以倒置的 `第5-3页` 为主断言，要求拒绝且 result/草稿无副作用。
  - 当前预期主路径形成真实产品 RED；节点设计不以 fixture 失败代替产品断言。
- `test_t18_gap_placeholder_page2_not_coverage_and_citation_denied`
  - 仅使用原始可读 PDF fixture，按既有 `PENDING_OCR` 程序规则只改本任务派生缓存第 2 页，第 1 页真实内容保留。
  - 公开读取第 1-2 页返回两页及占位标记，reads 覆盖第 1-2 页；既有 coverage API 必须排除第 2 页并保持不完全读取。
  - 第 2 页引用必须拒绝；该断言通过后才验证第 1 页真实引用可保存为 v1 且磁盘字节精确一致。
  - `finally` 先恢复原派生缓存字节并核对原始 fixture/案件材料字节未变，再关闭 Env。
  - 当前预期占位页引用形成真实产品 RED；节点设计不以 fixture 失败代替产品断言。

## 边界与待主编排执行

- 两个节点均未运行，故不宣称实际 RED；请由 Root 复核后做有限 RED 运行。
- bootstrap 已带精确 `-k test_t18_gap_` 参数，运行时应为 2 个节点。
- 没有旧 job 重开、额外源码读取、全量测试、安装、调研或协作联系。
- 无 Git add/commit/rebase/stash/reset/clean/checkout/push。
