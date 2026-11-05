# B 交回：T31 权威范围与 wiki 正文来源修复

- 交回时间：2026-10-26T03:04:05+08:00
- 执行令：`D:\Lawbeach\lawbench-coord\T31-B-scope-provenance-fix-Order-20261026-025909.md`
- 分支：`line-B`
- HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`（未变）
- 结论：完成两处有界源码修复及同目标回归源码；作者阶段未运行任何测试。不能宣称新三例已绿、旧五例已回归，更不能宣称整个 T31 PASS。

## 1. 权威范围路径

`service\lawbench\case\task.py` 新增 `TaskStore.task_scope(task)`，统一委托既有
`RequestScopeStore.task_scope()`。`index_for_task()` 与工具读取都复用这一入口，任务副本不能单独决定权限。

`service\lawbench\tools\inputs.py` 的 `case_read_input` 不再直接检查
`ctx.task["request_scope"]`。它先读取持久 R 记录并核验案件、会话、请求、任务和认领状态：

- 真实 scoped 任务即使内存副本缺 `request_scope`、置 null，或同时缺 `request_id`，也会失败关闭，不进入全案；
- prepare 后材料非空的真实 R 仍返回权威快照；
- 真正未 prepare 的原生 R/null 仍解析为 `None`；
- 旧无 R 任务仍解析为 `None`，前序成果读取行为保留。

新增回归使用既有真实 `CaseRegistry`、`Materials`、`TaskStore` fixture，通过实际
`tasks.create()`、`prepare()`、`begin()` 生成已落盘的 task/result/reads 与前序成果引用；只在
`copy.deepcopy()` 的内存任务副本上注入缺失/null 字段，没有手写持久 task、result、index 或 history。
同一用例还验证原生未 prepare R/null 和旧无 R 仍能读取真实生成的前序成果。

## 2. scoped wiki 正文来源

已删除 `_material_summary_is_proven()` 及基于案件卡片、`wiki_build` 任务和任务草稿的正放行。
该证明不绑定当前 `工作区/wiki/材料/<M-ID>.md` 的实际正文：`WikiPipeline.run()` 会先覆盖材料页，
后续可能中止；`wiki_update` 又会保留未重写的旧完整页；表摘要还消费全案 `case_text`。

当前准入资源没有可信的逐页“正文+本次来源材料范围/版本”记录，因此 scoped
`case_read_wiki("材料摘要")` 在摘要页存在时统一返回明确的安全说明，不返回正文、marker 或
`updated_at`。scoped 案件级 wiki 节继续安全拒绝。旧无 R 全案 wiki 读取不变；scoped 原始材料
读取、列表和检索未改。未改四份公开 schema，也未增加新元数据框架或重写 pipeline。

后续若要放行 scoped 既有摘要，需要契约允许的可信逐页正文来源与材料版本证明；在此之前保守不可用。

## 3. 实际文件与 SHA-256

| 文件 | SHA-256 |
|---|---|
| `service\lawbench\case\task.py` | `80033acb3ae76585f4a44a4582d07068aa48aad433b7bc2a2e09349e5e3341c0` |
| `service\lawbench\case\request_scope.py`（未改） | `4b158901d7b478e645cb57d4c53e5eb6b7ea947bf9581dce4be05058fa3356e8` |
| `service\lawbench\tools\inputs.py` | `b13f8ac7bdb85d87403531e4a6e9a3eb336623455f7e7a68db9422cf4b1f23ee` |
| `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py`（未改） | `1898c4d4208919b274f8e0cbc0f04bf6c874aa571f155e7b3dcab790a777a21c` |
| `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py` | `7d061c4d436e1a86e1f550e87ff66597caf650946d2c552a3a4e2d1072ec1a4a` |
| `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\README.md` | `a8b5386ee1286d18d8925328ce7d28bab0eac1c45849cac49c14f6e68f6a028f` |
| `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\交付说明.md` | `dd9366c5fc8563a2a7c03ca94faa43fdd3ea85b030d58e76ea316e4459502f2e` |

`scoped_task_boundaries.py` 原有两条测试及其断言均保留，另增
`test_scoped_read_input_without_scope_cannot_return_prior_output`，suite 现为三例。原五例源文件逐字节未变。

## 4. 可复用证据与不可外推边界

既有 root 事实保持不变：

- 根目录：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\`。
- `B-boundaries-green-root`：`Ran 2 tests in 0.663s`、`OK`；stderr SHA-256
  `22237bc8ada27ac12a17b0e9e512c5b28d1bb46c142ec8cae6b69bc2ec8f0d58`。
- `B-baseline-after-boundary-fix`：`Ran 5 tests in 1.604s`、`OK`；stderr SHA-256
  `62ee1e8ff86de95782348615c270dfbfaea2034dde053b26c5749a1e5967ac72`。

这些是上一版源码的 root 运行证据。本轮 task/input 和边界源码已变更，不能把它们写成当前版本的
新三例绿或回归绿；只能复用为“原两条边界断言与原五例断言在变更前曾实际通过”的事实。

## 5. 验证状态

- **NOT RUN**：本轮作者未运行 unittest、pytest、collect、parser、py_compile、Vitest、tsc、build、
  prepare、serve、probe、HTTP、GUI、模型、pipeline、契约自检或任何 Python 源。
- 只做了只读源码审查、`Get-FileHash`、定向 `git status`、`git diff` 和 `git diff --check`；
  新增/修改证据文本的尾随空白扫描为空。
- root 仍需全文审查并实际运行 `scoped_task_boundaries.py` 的三个用例、未改的
  `scoped_task_standalone.py` 五例，以及其判定的完整受影响回归。

## 6. 保全、Git 与阻碍

- 开工前保全 `B-before-next-source-fix-20261026-025909` 未清理、未覆盖；`request_scope.py` 与原五例
  哈希同 manifest 一致。现有 dirty 仅在上一轮已知目标/证据文件内延续。
- Git 严格只读：未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 本轮未遇到 index.lock、权限拒绝、沙箱拒绝或审批阻碍；未改锁、ACL、审批、沙箱、网络或 API。
- 所有命令均由绝对路径 native `pwsh.exe` 执行，`login=false`；未使用 bash 包装。
