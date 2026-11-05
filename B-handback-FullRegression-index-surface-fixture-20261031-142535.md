# B 线交回：FullRegression 索引测试面修正

- 任务来源：`D:\Lawbeach\lawbench-coord\ORCH-B-FullRegression-index-surface-fixture-20261031-142535.md`
- 执行者：独立 B 线 DeepSeek 执行者
- 完成时间：2026-10-31（Asia/Taipei）
- 交付状态：源码修改与正式交回已完成；未运行测试，不提出新的 PASS 结论。

## 修改

仅修改 `service/tests/test_tools.py`：

1. 改写旧用例 `test_read_tampered_index_rel_path`：不再写当前 API 索引，而是复制 `names(env)` 中“情况说明”的材料项，移除 `text_path`，把虚拟 `rel_path` 设为 `工作区/wiki/待确认.json`，直接调用 `texts.text_rel`，断言抛出 `ApiError` 且错误码严格为 `OUT_OF_CASE`。
2. 保留既有现代索引负例：非法 `text_path` 经 API 返回 `OUT_OF_CASE`；合法持久 `text_path` 在 `rel_path` 改名后仍读取同一正文。
3. 新增 `test_read_index_missing_required_text_path_fails_before_text_io`：从实际私有案件索引复制后仅移除“情况说明”的必填 `text_path`，经 API 调用断言 HTTP 500、`ok == false`、错误码严格为 `INTERNAL`；同时替换 `texts.read_text` 为记录即失败的探针，断言文本读取调用次数为零。原索引在 `finally` 中恢复。

未修改产品代码、bootstrap、schema、SDK、fixture 或其他测试。修改前原文件已保存至：

`D:\Lawbeach\lawbench-coord\FullRegression-index-surface-fixture-before-20261031-142535\before.txt`

## 边界与证据

- 沿用既有结论：最近 focused 54 为 53 PASS、1 FAIL；唯一失败为 `test_read_tampered_index_rel_path` 因现代索引缺 schema 必填 `text_path` 而在 API 预校验阶段返回 500 `INTERNAL`。
- 根因是旧测试面错误地移除现代索引必填字段，再把现代 API 路径当作 legacy `rel_path` 覆盖；不是产品安全校验失效，不放宽 schema、索引闸门或 handler，也不把 `INTERNAL` 当 legacy 用例的替代期望。
- 保留所有既有报告、失败 54 包、dirty 状态及旧证据；未执行全量回归，未重演开工、安装、调研或运行时初始化。
- 按本次执行令未运行测试、类型检查、构建、自检或源码比对，因此不宣称修改后的测试或产品通过。Git 全程只读边界下未做 add、commit、rebase、stash、reset、clean、checkout、push、锁修复或权限变更。

## 接续

主编排需按原 fresh admission 流程仅重绑 `testToolsHash` 与新用例，然后重跑既有 owned fresh private case。旧的现代非法 `text_path`、合法持久路径等通过证据在源码不变前提下仍可复用。
