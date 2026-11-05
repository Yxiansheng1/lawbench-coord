# A 线交回：全量回归测试假数据修复

## 状态

已在执行令限定的范围内完成两份测试假数据的字面修改。仅编写，未运行；不声称测试通过。

## 改动

1. `dsh-ext/ui/fixtures/materials_list.json`

   - 保留原有 9 条材料记录及顺序不变。
   - 在末尾追加唯一一条完全虚构的 `M0010`，字段值与执行令逐项一致，状态为 `source_deleted`。
   - 未创建、删除或扫描任何实际材料文件。

2. `dsh-ext/ui/fixtures/capsules.req.json`

   - 按 `dsh-ext/ui/fixtures/capsules.json` 的 `value` 补齐三条 wiki 胶囊：`case-wiki`、`case-wiki-criminal`、`case-wiki-office`。
   - 插入顺序、ID、名称、隐藏标记及其他字段均按当前响应字面值保留。
   - `capsules.json`、默认 Skill 选项和提示词均未改动。

## 边界与验证

- 按令未运行测试、类型检查、构建、收集、应用、HTTP、模型、GUI、JSON 解析或任何自检；根环境负责验证深相等与 schema。
- 未改测试 spec、产品源码、schema、响应胶囊、Skills 或 E50 冻结数据。
- 修改前目标文件与输入快照一致：`FullRegressionFixtureDataInput-20261031-141651/0-before.txt`、`1-before.txt`。
- 预期仓库侧仅有上述两个假数据文件差异；协调目录交回件不计入 Git 工作树。
- 只读 `git status --short --untracked-files=all` 因既有子模块 `dsh` 的 `.git` 目录权限拒绝而中止。按令未改权限、未改锁、未扩权；该情况不视为本次交付阻碍。

## Git 纪律

未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，未暂存、未提交，也未创建或改写提交 SHA。

## 遗留事项

无执行令范围内的遗留修改事项。最终验收以根环境对两份测试假数据执行契约/schema 与深相等检查为准。
