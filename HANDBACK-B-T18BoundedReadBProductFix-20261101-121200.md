# T18 有界读取 B 线产品修复交回

状态：AUTHORED_NOT_RUN  
运行计数：runtime=0  
完成时间：2026-11-01（Asia/Taipei）

## 结论

已按正式执行令完成有界修改。仅修改了 `materials.py` 与 `defense-opinion/SKILL.md`；固定测试、生成 schema、契约、VERSION、SDK、guard、其他 Skill 均未修改。

## 修改内容

- `service/lawbench/tools/materials.py`
  - `case_read_material` 新增可选、闭区间的 `end`。
  - `end` 缺省时保留原有读取路径与行为。
  - `end` 出现时校验 `start`/`end` 为整数且非 bool；`end` 不得小于 `start`，不得大于材料实际最后一个单元编号，失败统一返回 `INVALID_ARGUMENT`。
  - 只从 `start..end` 选定单元读取，`next_start`、`has_more`、`next_offset` 均由选定范围内计算，不越过请求上界。
  - 未改 `_record`、`_read_part` 的真实记账规则、`max_chars`/预算或渲染逻辑。
  - `_read_many` 在任何材料读取前拒绝同时携带 `end` 与 `more_names`。
- `skills/defense-opinion/SKILL.md`
  - 仅改处理步骤 3 的定位回读说明：明确 `start`/`end` 为同一单元编号且起止均包含，`start: 1, end: 1` 合法；续读时沿用相同 `start`/`end` 和返回的 `next_offset`，直到当前单元读完；下一个单元须重新检索定位。
  - frontmatter、必问问题、共用规则、其他步骤、输出模板和自检清单其余内容未改。

## 基线核验

- 修复前两份源码与 `approved.json` 所列基线一致。
- 固定测试 `service/tests/test_read_bound_20261101_114236.py` 未修改，最终 SHA-256 仍为授权值。
- 命令过程仅有 PowerShell 输出格式重试；未发生沙箱拒绝、审批请求、ACL 修改、writer 锁处理或 Git 写入。

## 最终文件指纹

| 文件 | SHA-256 | 字节数 |
|---|---|---:|
| `D:\Lawbeach\lawbench-B\service\lawbench\tools\materials.py` | `ec1d87ae113c54da64461e57b4c5908b3599cc8217e940cc8767e92af45bc415` | 7692 |
| `D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md` | `1288909be965ebf23df8d76cc975d244a61163427c1acf9062c62911af455af0` | 28181 |
| `D:\Lawbeach\lawbench-B\service\tests\test_read_bound_20261101_114236.py` | `ccd486bb5be5ae21c6a0821434be8e45b0fc5f95b238b314a25f4c920b6ce14b` | 8744 |

## 未运行验证

按执行令特别禁区，本次未运行 Python、pytest、collect、check、build、parser、Node、模型、HTTP、GUI 或其他命令级验证，runtime=0。源码修改为已编写未运行状态。

## 偏离与遗留

- 无实现偏离。
- 公共工具 schema 按执行令留给 Root 审阅后的生成器更新；本次未改生成器或 schema。
- 后续应由主控在其允许的验证边界内运行固定测试，重点覆盖 8 个既有通过项与 3 个原有失败场景，并确认 `end` 上界、长单元续读和 `more_names` 前置拒绝。

## Git 边界

本次未执行任何 Git 写操作；未 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。交回以本协调目录文件为准。
