# B 线交回：T18 本地化上下文 Skill/Spec 有界修订

- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-T18LocalizedContextSkillSpec-20261101-134000.md`
- 状态：已完成有界源码修订，交回 root 验收后停止。
- 作者态：authored-not-run
- 作者运行次数：runtime=0
- Git：严格只读；未暂存、未提交、未变基、未使用 stash、未重置、未清理、未检出、未推送。

## 修改范围

1. `skills\defense-opinion\SKILL.md` 第 3 步：要求 `case_read_material` 显式给出有界 `start`、`end`，`end >= start`，读取最小必要上下文；允许相邻且直接依赖的问答或上下文单元，同一单元 `start=end` 仍合法，页码、行号等单位以材料实际元数据为准。保留每次最多 8000 字符限制；`next_offset` 续读沿用相同 `start`、`end`；禁止不设结束单元的读取或默认通读整份材料。
2. `docs\src\Spec.md` 1.7 行：将“`start=end` 的单单元范围”限定改为显式闭区间有界范围 `start`、`end`，`end >= start` 且不超过材料末单元，可覆盖最小必要的相邻问答或上下文单元，同时保留同一单元 `start=end` 的合法性与原有单次最多 8000 字符及作用域限制。

## 保持项

- Schema、`VERSION`、服务代码、`materials.py`、生成器及 `contracts` 均未改动，继续按 1.7 与既有字节保持。
- 未改 frontmatter、问题、共享指令、预算、答案或任何其他 Skill/Spec 条款。
- 未运行 Node、Python、解析器、构建、检查、测试、采集、HTTP、模型、GUI 或任何运行时验证。
- 未读取 root-only before 快照，也未自行宣称全文件逆检查已完成。

## 目标指纹

| 文件 | 字节数 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md` | 28447 | `5c6fe8ee70076e2b491adb4e4e4ed5e76ca056317ea4e8bbcf3028b56aecbc11` |
| `D:\Lawbeach\lawbench-B\docs\src\Spec.md` | 203312 | `a84bdb2be66264146e586b1186772ca7201e405b6cccbdf86c60a131dbd2ce31` |

请 root 按 before 快照核对：两份目标文件除 Skill 第 3 步与 Spec 1.7 指定条款外全字节不变；反向确认该两处之外无改动后决定接受。
