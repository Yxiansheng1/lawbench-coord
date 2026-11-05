# 统一材料范围丢失修复进度

## 类型和状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已补独立持久意图：scoped prepare 先原子落凭据，再落主行；主行单独丢失时，同请求会失败关闭且不建任务。已写窄边界回归源码和说明，均未执行。 |
| 目标是什么 | 让合法未 scoped 的新请求继续得到全案控制路径，同时防止已固定材料范围的请求因主行单独消失而变成全案任务。 |
| 在等什么 | 等独立根复核代码与故障假设，然后运行冻结双例和受影响的本机 scope 回归；得到实际退出码、用例数和临时目录残留检查后才可判读。 |
| 卡在哪 | 当前不卡；源码交付可继续。Git 首轮总状态被不可读子模块阻断，已用 `--ignore-submodules=all` 只读绕开，没有处理权限或锁。 |

## 当前边界

- 作者验证：`NOT_RUN`；没有 Python、测试、HTTP、GUI、模型、OCR、Office、构建或自检输出。
- Git：只读；没有暂存、提交、分支改写或工作树操作。
- 产品源码只改 `service/lawbench/case/request_scope.py`。
- 私有结构只新增 `contracts/files/request_scope_intent.schema.json`。
- `service/lawbench/case/task.py` 保留开工前既有修改，本轮未改；其文件大小仍为 40253 字节，修改时刻仍为 2026-10-25 19:02:04 UTC。

## 依据与验证

- 冻结双例文件 SHA256：`5bf34cdd65be170754ba4faa1f40ef312045f4ffc160983ff15a0e0d61f69af2`。
- 新增边界源码：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\scope_intent_edges.py`。
- 设计、兼容策略和根运行入口：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md`。
- 新 schema 使用的请求、案件、会话、材料、摘要和时间字段均在 `contracts/common.schema.json` 存在。
- 新增目标文件静态尾部空白检查无输出；这是静态检查，不是测试通过。

## 未做与降级

- 未运行任何红测、绿测、契约自检、编译或产品服务。
- 未处理 `dsh` 子模块权限拒绝，未修改锁、审批、沙箱或 ACL。
- 卷整体丢失，或同一请求的主行与独立意图同时丢失时，无法区分“曾经 scoped”与“全新未 scoped”，此限制将在正式交回中明确。

## 下一步建议

独立根复核先看 `request_scope.py` 的五段状态顺序和兼容回填，再运行 README 列出的冻结双例、新边界和受影响 scope 回归；实际结果由根写入正式交回，作者不自行补绿。

Response ID：`root-t31-scope-intent-progress-20261026-152026`

Response log path：`D:\Lawbeach\lawbench-coord\B-progress-T31-scope-intent-fix-20261026-152026.md`
