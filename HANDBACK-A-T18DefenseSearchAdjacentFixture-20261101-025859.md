# T18 Defense Search Adjacent Fixture 交回

状态：`AUTHORED_NOT_RUN`

执行者：DeepSeek 执行者 A

## 修改

仅修改：

`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts`

- 新增读取原始 `contracts\examples\tool_search.result.json` 的 `SEARCH` 常量。
- `MemoryCore` 仅新增 `case_search` 成功结果分支。
- 在唯一正向用例的真实三项最终回答之后，实际执行一次成功的 `case_search`，随后以显式 `start: 1` 执行材料读取。
- 仅将正向用例的精确工具名期望扩展为 `case_search`、`case_read_material`、`case_read_wiki`、`case_save_draft`。
- 原问题生产、最终身份、拒绝逻辑及其余断言均保留；其他用例未改。

## 验证边界

按执行令，未运行 Vitest、tsc、pytest、构建、应用、HTTP、模型或运行时自检；本次测试修改属于 `AUTHORED_NOT_RUN`，不宣称测试已通过。

复用既有证据：主执行令载明根场景的实际结果已为 16 个新增门 GREEN、类型错误 0；相邻未改用例为 29 PASS、1 FAIL，唯一失败是旧正向用例在真实回答后仍允许仅按名称读取材料，未证明搜索成功或显式起点。未重演旧开工、安装、调研或全量测试。

最终原生 PowerShell 只读核对：

| 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| `dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts` | 15604 | `57e76bcbe3988d632ca31966f1e9bec3821c9b2698aa709609e1038043a14c91` |
| `dsh-ext\agent\index.ts` | 59185 | `b0e093554b4903a605587431be0095e4318b846c7bffa6791d70114b4ecadf93` |
| `dsh-ext\agent\task-state.ts` | 25296 | `ce6a5ee0d21443305173c19fd36c5b623a6641566164dac427098da9f3718dae` |

两份产品源码与批准基线的大小和 SHA-256 完全一致。

## 偏离与遗留

无范围偏离。由于执行令禁止运行测试，本交回仅完成测试夹具修正与静态元数据核对；修正后用例是否转绿需由获授权验证者运行确认。

Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
