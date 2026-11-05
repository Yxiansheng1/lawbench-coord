# HANDBACK B：T18 Wiki 真实门禁集成测试

## 状态

源码追加完成，等待主编排执行新的有界单元测试阶段。

## 交付

- 测试文件：`D:\Lawbeach\lawbench-B\service\tests\test_t18_wiki_date_source_retention_20261031-173317.py`
- 新增测试：`test_cached_page_backfill_preserves_lawyer_block_through_real_gate`
- 说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\WikiRealGateTest-20261031-200927\README.md`

既有测试前缀保持字节不变；产品文件 `service\lawbench\pipeline\steps\wiki.py` 未修改。最终哈希、大小和前缀校验由本次唯一一次只读清单确认。

## 覆盖的判断

新增测试在真实 `tmp_path` 案件目录中，用实际路径门禁写入缓存页和合法卡片，实际执行两次 `WikiRun.run`。它核对缓存页回填、原文和准确出处、律师块原样保留、第二次更新幂等、原件字节不变，以及材料摘要模型调用为零。

只隔离材料加载、卡片/索引日志/草稿三个无关收尾副作用；未替换门禁、读写方法或操作系统写入。

## 未运行

未运行 pytest、导入、收集、解析、构建、应用、HTTP、模型或凭据检查。按执行令，这些由主编排在新单元测试阶段执行。

## Git 与保留

未执行任何 Git 写入，也未暂存或提交。旧 15 项测试包及旧证据未改动。未清理临时或现有文件。

