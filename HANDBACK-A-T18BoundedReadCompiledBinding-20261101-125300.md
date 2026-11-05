# 交回：A 线 T18 有界读取 · 已编译闭包副本（绑定件 20261101-125300）

状态：**AUTHORED_NOT_RUN**（仅落盘交付物，运行次数 = 0）
执行会话：A 线（DeepSeek 执行者），依据执行令 `ORCH-A-T18BoundedReadCompiledClosure-20261101-125600.md`
绑定件：`T18BoundedReadCompiledBinding-20261101-125300-approved.json`

## 一句话结论

已按绑定件生成目标用例文件：批准源文件的逐字节副本，仅含两处 import 绑定改写（指向新接受的 Agent+Host 私有编译产物），源码主体、断言、fixture、类型均未改动。未运行任何测试、构建或运行时。

## 交付物

| 项 | 值 |
| --- | --- |
| 源（未改动） | `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts` |
| 源 bytes | 12552 |
| 源 sha256 | `d9869b950f9dff665dea917403665423af6104c55e123a6d129cd49f5759c867`（与绑定件一致） |
| 目标（新建） | `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-compiled-20261101-125300.spec.ts` |
| 目标 bytes | 13124 |
| 目标 sha256 | `bee79f5f4a0164b446a97b0232e30e80658f28b5a96ac85612a0ceccfc9b8f14` |

最终 SHA + 大小已按执行令做唯一一次一次性核验，源侧与绑定件声明值吻合。

## 改动内容（恰好两处，均为 import 绑定映射）

1. `import { CONTRACT_REVIEW_SKILL, DEFENSE_OPINION_SKILL, DENY_BUDGET, LegalAgent } from '../agent/index.ts'`
   → 改写为：以 `COMPILED_AGENT_URI`（`file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/T18BoundedReadPrivateBuild-20261101-124200/private-output-20261101-122346/profile-node_modules/lawbench-dsh/lib/agent.js`）动态导入，并追加 `type LegalAgent = import('../agent/index.ts').LegalAgent` 类型别名。
2. `import { LawbenchRemote } from '../host/index.ts'`
   → 改写为：以 `COMPILED_HOST_URI`（同目录下 `lib/host.js`）动态导入，并保留 `as typeof import('../host/index.ts')` 类型约束。

其余内容零改动：describe/it 结构、断言文本、fixture 路径与读入、`MemoryCore`、`INVALID_ENDS` 用例表、类型标注、行尾风格（LF、无 BOM）均与源一致。

## 制作与自检方法（仅文件操作，无执行语义）

- 源文件 sha256 与绑定件 `source_sha256` 逐位比对通过后才动手。
- 两个映射模式在源文本中各出现且仅出现 1 次，按替换后回译（revert）结果与原文做区分大小写精确比对：`REVERT_MISMATCH` 未触发，即确认除这两处外无任何其他差异。
- 目标文件为新建，写入前确认目标路径不存在，避免覆盖既有文件。

## 明确未做（执行令禁区，逐条遵守）

- 未运行任何测试、收集、构建、准备、模型调用、HTTP、GUI、运行时：`runtime 0`。
- 未读取库产物（`lib/agent.js`、`lib/host.js`）、未读取 bundle manifest 等其他元数据、未做目录发现。
- 未改动产品代码、运行时代码、构建脚本；本线未产生任何源码级产品变更。
- Git 全程只读：未 add / commit / rebase / stash / reset / clean / checkout / push，未暂存，未改锁、未改审批、未改 ACL。交回即本文件，非 Git 提交。
- 未联系其他会话，未更换 API，未重演旧开工/安装/调研/全量测试。
- 未复用旧的编译态绿灯：源侧 15 例、类型侧、邻接 30 例的既往通过结论在本件中不作为证据，仅作为背景。

## 待主编排裁决 / 后续

- 本件仅证明"绑定映射已按批准件落盘、且源未被改动"。编译态闭包是否成立，需要由后续独立的编译运行验证给出结论；本执行者未运行，因此不出具任何通过/失败判定。
- 绑定件中的 `bundle_manifest`（bytes 58594 / sha256 `e4ac06d9…ed1d95`）按执行令"不读其他元数据"要求未做校验，其完整性由后续验证环节负责。

遗留问题：无（除上述按令未执行项外）。
