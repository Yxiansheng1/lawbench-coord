# B 线交回：T18 引用未读红灯测试

- 状态：`AUTHORED_NOT_RUN`
- 运行次数：`runtime=0`
- 正式执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-T18CitedUnreadRedTests-20261101-143008.md`
- 产品代码：未修改
- 旧测试、`t8_helpers.py`、`conftest.py`、gate/契约：未修改
- Git：全程只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`

## 落盘文件

1. `D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py`
   - SHA-256：`35a0a80597d8231be8f3d964a02025400581b0bb9e173d3d32e7a672d7c26e35`
   - 字节数：`8838`
2. `D:\Lawbeach\lawbench-coord\HANDBACK-B-T18CitedUnreadRedTests-20261101-143008.md`
   - 本交回件

目标测试在创建前不存在。未覆盖、删除或改写任何已有工作树文件。Git dirty 全量清点未能完成：`git status --short` 在未改动的子模块 `dsh` 上报 `fatal: cannot chdir ... Permission denied`。按令未修权限、未改锁、未扩权；这不影响本次限定的源码交回。

## 预期旧实现 RED：恰为 2 个节点

以下两项在未实现读取授权时，`case_save_draft` 会成功写草稿，因而红灯：

1. `service/tests/test_t18_cited_unread_20261101.py::test_t18_main_search_only_numeric_citation_denied_without_side_effects`
2. `service/tests/test_t18_cited_unread_20261101.py::test_t18_main_wrong_task_or_old_version_read_does_not_authorize`

预期旧实现 RED 数量：`2`。

第一项先验证“搜索命中不等于读取”。首次拒绝断言之后才加入“第 2-4 行只读 2、4 行、缺第 3 行仍应拒绝”的缺口断言，因此即使旧实现同时缺少区间并集核对，也不会增加第三个主 RED 节点。

第二项在同一主节点内覆盖两种不得授权的事实：

- 另一任务读过同一材料、当前辩护任务未读；
- 当前任务读过该材料旧版本，材料重新扫描后版本已变化。

## 预期通过的正向对照：4 个节点

1. `service/tests/test_t18_cited_unread_20261101.py::test_t18_positive_correct_actual_read_allows_same_content`
2. `service/tests/test_t18_cited_unread_20261101.py::test_t18_positive_complete_inclusive_range_allows`
3. `service/tests/test_t18_cited_unread_20261101.py::test_t18_positive_long_unit_partial_then_offset_recovery`
4. `service/tests/test_t18_cited_unread_20261101.py::test_t18_positive_non_defense_save_unchanged`

预期正向 PASS 数量：`4`。测试源码预期共 6 个测试节点；该数量是静态编写结果，不是 collect 或运行结果。

正向对照分别证明：真实完整读取后可保存；包含区间全部读完可保存；长单元分段未完成时不记已读、用 `next_offset` 连续读完后可保存；非辩护意见保存保持原有行为。

## 红灯的行为约束

拒绝保存时使用：

- 错误码：`INVALID_ARGUMENT`
- 原因：`defense_citation_not_read`
- `detail`：有界字符串，包含材料名和数字位置范围，提供一个可执行的“先读取”提示；不得包含材料正文或检索词

拒绝不得产生以下任何副作用：

- 新草稿文件；
- 新草稿版本；
- `result.json` 内容变化；
- 任务自动终止、自动中止或硬性全局限制。

仅辩护意见的实时 `save_draft` 路径执行授权；授权事实必须是同一任务、同一 `material_id`、当前材料版本，以及 `reads.json` 中实际完整的数字页/段/行读取记录。不得用关键事实 NLP 推定位点。

## 明确未证明 / 未运行

- 未运行 Node、Python、pytest、collect、parser、build、prepare、probe、HTTP、模型、GUI 或真实 OCR。
- 未使用真实案卷、旧私有样例、Office、安装、凭据或网络。
- 没有复跑旧测试；没有复用或改写任何旧运行结果，所有运行证据计数保持 `0`。
- 手工界面 `save_document_ui` 保存未测试：没有使用额外的入口契约发现或已授权的真实公开 setup。该项保持 `UNCHANGED / NOT RUN`，不得据此宣称通过。
- Excel 单元格级来源能力保持 `NOTPROVEN / OPEN`；本次没有新增任何 blanket PASS。
- 测试使用真实 `Env`、owned 临时文件系统、公开 `/api/task` 与公开 Core `case_search`、`case_read_material`、`case_save_draft` 链；未 patch gate、audit、deny、lifespan 或模型历史。

## 交回后停止

本线到此停止。冻结测试源码供主编排完整审查、清理夹具并执行有限 RED；本轮不进入产品修复。
