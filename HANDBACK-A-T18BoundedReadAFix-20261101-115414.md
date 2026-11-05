# A 线交回：T18 辩护意见有界读取补修

- 执行者：A 线 DeepSeek
- 日期：2026-11-01（Asia/Taipei）
- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-T18BoundedReadAFix-20261101-115414.md`
- 批准输入：`D:\Lawbeach\lawbench-coord\T18BoundedReadAFix-20261101-115414Input\approved.json`
- 状态：AUTHORED_NOT_RUN
- runtimeZERO：未运行生成器、测试、类型检查、构建、自检或产品运行时
- 既有证据：沿用 Root 权威记录，修前 corrected 15 项中 8 个边界断言 FAIL、7 个 control PASS；产品未改。未重跑
- Git：严格只读；未 add、commit、rebase、stash、reset、clean、checkout 或 push

## 修改面

1. `dsh-ext/agent/index.ts`
   - 新增中文常量 `DEFENSE_READ_END_DENIAL`。
   - 扩展既有 `defensePrimaryReadDenial`：保持有效检索优先、无效 `start` 返回既有 start 拒绝；有效 `start` 后要求显式数值整数 `end === start`。
   - `preTool` 与 `executeTool` 的既有 helper 调用、预算顺序及其他行为未改。
2. `contracts/_build/gen_schemas.py`
   - `CONTRACT_VERSION` 由 `1.6` 改为 `1.7`。
   - 仅在源码生成器的 `case_read_material` args 中增加可选整数 `end`（含本端，>=1）；省略时保留旧行为。
   - `more_names` 说明改为不能同时给 `start`、`end`、`offset`。
   - 未运行生成器，未写生成 schema 或 `VERSION`。
3. `docs/src/Spec.md`
   - 仅在 20.12 增加 1.7 一行，记录可选有界 `end`、省略兼容、`more_names` 互斥及辩护意见当前单单元工作流；返回结构不变。

## 最终元数据

| 文件 | SHA-256 |
|---|---|
| `dsh-ext/agent/index.ts` | `2d19b3b00caaaf417f6e513d002d082613b68a1be667affad93382a5a1ede48b` |
| `contracts/_build/gen_schemas.py` | `104280826d163768834e43a49742e192e0c837d20aa9c0d75d1dc3d9f957b28e` |
| `docs/src/Spec.md` | `808c030b18b3588958308b3999a446d754c446805b9af4b88856da58d84bcd22` |
| `dsh-ext/tests/defense-read-bound-20261101-114236.spec.ts` | `08e6e13fb7a8ecd264761882957e2549895a3e1fe08cd3b2705ab839933d3b59` |

冻结测试保持批准 SHA 字节未变。等待 Root 独立复核累计写入面、生成契约并执行 15 项验证；本交回不宣称测试转绿。
