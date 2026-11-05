# 交回件：A 线 T18「辩护意见先问后读」谓词修补

- 执行令：`ORCH-A-T18DefenseReadOrderFIX-20261031-225445.md`
- 状态：AUTHORED_NOT_RUN（已改完，**本地未跑任何测试**，独立验证待 Root 侧）
- 执行者：A 线（deepseek-v4.1-flash-1017 / max）
- 时间：2026-10-31

## 一、改了什么

只有一个文件的、一行、一个表达式。

文件：`D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`（第 441 行，TaskState 构造函数的 `questionsBeforeMaterialRead` 入参）

旧：

```ts
begin.value.skill === LITIGATION_DOCS_SKILL || begin.value.skill === GENERAL_DRAFTING_SKILL,
```

新：

```ts
begin.value.skill === LITIGATION_DOCS_SKILL || begin.value.skill === GENERAL_DRAFTING_SKILL || begin.value.skill === DEFENSE_OPINION_SKILL,
```

为什么是这一处：既有「先问后读」开关只认诉讼文书和通用文书两个 Skill，辩护意见 Skill 不在其中，所以它选中时 `questionsBeforeMaterialRead` 为 false，`case_read_material` / `case_read_wiki` 不会被拦，模型可以直接先读材料再提问。这次把 `DEFENSE_OPINION_SKILL` 补进同一个谓词，开关为真后，preTool 拦阻与直接执行入口拦阻（`index.ts` 第 607 行、第 680 行两处读守卫）自动同时生效，不需要改第二处。

`DEFENSE_OPINION_SKILL` 常量在同文件第 218 行已定义，无需新增声明。

## 二、改动边界（可核）

| 项 | 值 |
| --- | --- |
| 改前 SHA-256 | `d8328b142489dc69d12f56156884d04f975b45b90eca7ce54a25c4c1c202fa0c` |
| 改后 SHA-256 | `a9a26fd6fffc3fc458e6f04e18848ad035db80e67723886e73d3f1425a815451` |
| 字节数 | 57789 → 57836（+47，恰为新增表达式的字符数，无多余改动） |
| 换行 | CRLF 889 处，改前改后相同（未引入 LF、未动行尾） |
| 文件头 | 无 BOM，改前改后相同 |
| 改动行数 | 1 行 |

除 `index.ts` 与本交回件外，本运行没有写过任何文件：没有动 `dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts`（保持 RED 基线原样，SHA 应仍为 `aedcd6e0f247dd47adbd6276359ca829944cd0823b01ab8fdcb661fc56e7eeeb`），没有动旧测试、契约、Skill、TaskState 布尔位/默认值/构造函数其余入参、拒绝文案、提问身份与答案判定、预算、TaskStore/Host/API/SDK。没有加框架、没有加提示词变体、没有加 NLP 或日期算法、没有改模型与预算。

## 三、本次没做的事（按令）

- 没跑任何测试、tsc、构建、解析器或自测；没装任何东西；没重新做开工、安装、调研或全量回归。
- 没碰 Git：全程只读既有状态，未 add / commit / rebase / stash / reset / clean / checkout / push，也没有暂存任何内容。未解决 index.lock 或权限问题（不需要解决）。
- 没读执行令与 `index.ts` 之外的任何源文件、元数据、清单、依赖清单；没读环境、凭据、模型、HTTP、界面相关文件。
- 没联系其他会话、没换 API。
- 为确认行号与行尾，我额外做了几次对 `index.ts` 的只读定位（内容检索、取行、字节与哈希统计）；不涉及任何其他路径。

## 四、待 Root 侧独立验证

1. 独立跑红→绿：新测试 `dsh-ext\tests\defense-read-question-order-20261031-224957.spec.ts` 在改前应为 2 通过 3 失败（改前的合法 RED 基线），改后应全绿。
2. 类型检查（tsc）确认改动无类型问题。
3. 复核既有行为未被带偏：文书起草、通用文书、合同、刑期计算、归档等既有先后顺序判定应保持原样。
4. 确认 RED 基线文件仍为字节原样、断言未被削弱。

## 五、风险提示

- 本次属最小改动，不涉及运行时逻辑分支新增；但「先问后读」覆盖面扩大到辩护意见 Skill 后，辩护意见任务若在提问前读取材料或 Wiki，会被既有拒绝文案拦下，属预期行为变化。
- 上述独立验证全部待 Root 侧执行，本运行**未提供任何绿证据**。
