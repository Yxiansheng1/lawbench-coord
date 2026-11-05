# B 线交回：T18 引用可操作性红灯

## 结论

状态：`AUTHORED_NOT_RUN`

已按正式执行令完成两处源码写入和本交回件：

1. 在既有 T18 测试文件尾部追加一个公开 Core + 真实自有文件系统流程测试。
2. 字节克隆旧过滤 bootstrap，只替换唯一 MAIN 筛选字面量。

本次未执行 pytest、Python、Node、parser、collect、build、prepare、serve、HTTP、模型、GUI 或 OCR；运行时次数为 0。

## 源码交付

### 新增测试

- 路径：`D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py`
- 测试名：`test_t18_actionability_public_material_id_recovery_flow`
- 新增字节：3668
- 当前长度：26752 字节
- 当前 SHA-256：`0f1460f12dac8dc7c5f59a14b98ab2d5c2d0fd91efd0d25616a7375f8c1a8fde`
- 原锁定前缀：前 23084 字节，SHA-256 `fe2841296774f75d984ffcd49f9ed6656cc6f0a70935259509af56f6207b064f`，静态核验保持。

流程覆盖：

- 建立含两行私有合成文本的既有 TXT 环境，并选择辩护意见任务。
- 通过公开 `case_list_materials` 取得真实 `material_id`。
- 对未读第 2 行引用保存，捕获原 `INVALID_ARGUMENT` 错误并核对 ID、位置、读取提示、敏感信息约束、草稿/result 快照及任务仍运行。
- 用该 ID 直接调用 `case_read_material`，要求 `MATERIAL_NOT_FOUND`，且 reads 与快照不变。
- 再经公开 `case_list_materials` 映射到对应材料名，按 `name`、第 2 行读取，核对真实 reads 台账中的 ID、当前版本、单位和区间。
- 用同一引用内容保存草稿 v1，核对物理字节；原夹具及环境内材料字节保持不变，`finally` 关闭环境。

唯一 MAIN 可操作性断言位于完整恢复流之后：错误消息必须同时给出 `case_list_materials` 和 `case_read_material`，且前者先出现，并要求 `name` 参数。该断言不依赖任意固定中文整句。

当前实现的预期结论是：公开完整流程可达，但错误消息缺少从材料 ID 到对应材料名的恢复指令，因此在最后一个 MAIN 断言处产生一个实际红灯；不归因于夹具失败，也不宣称模型循环因果。

### 新 bootstrap

- 新路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitationActionabilityRed-20261101-165456\bootstrap.py`
- 旧路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadBoundarySourceClosure-20261101-161104\bootstrap.py`
- 旧长度 / SHA-256：32137 字节 / `a284e02c636447dcc5552e59f9125e6f48732e4edb3e3811218edf5d638067b4`
- 新长度 / SHA-256：32147 字节 / `3bd19283aba7faef543f47ef967751f204898009f8ed9ba0bf9e5e9d49702f2e`
- 唯一变化：`test_t18_gap_` 替换为 `test_t18_actionability_`，长度增加 10 字节。
- 静态逐字节核验：新文件与旧文件仅执行上述一次替换后的内存期望完全一致。
- 旧筛选字面量剩余 0 处；新筛选字面量恰为 1 处。

未创建新的 runtime/privateRoot，未执行新 bootstrap。旧 bootstrap 中冻结的保护结构、T37 预忽略、环境与 `finally` 均通过整文件字节克隆原样保留。

## 边界与保全

- 源码写入恰好两处：上述测试文件和上述新 bootstrap。
- 第三处写入仅为本正式交回件。
- 产品代码、当前草稿和既有测试前缀均未改动；24502B/28011 的锁定边界保持不变。
- 未做 Git 读写，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未读取其他源码，未做额外发现、元数据检查或运行时验证。
- 未更改沙箱、审批、ACL、锁或 API；未联系其他聊天或启动子代理。

## 后续定谳

按执行令交由 Root 独立完整复核后产生唯一实际 RED。B 线在本交回件落盘后停止。
