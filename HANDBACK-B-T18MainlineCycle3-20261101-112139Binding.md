# 交回件 · B 线 · T18 主线 Cycle 3 字面绑定

- 交回件路径：`D:\Lawbeach\lawbench-coord\HANDBACK-B-T18MainlineCycle3-20261101-112139Binding.md`
- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-T18MainlineCycle3-20261101-112139Binding.md`
- 批准清单：`D:\Lawbeach\lawbench-coord\T18MainlineCycle3-20261101-112139Input\approved.json`
- 交回日期：2026-11-01
- 执行者：独立 B 线（deepseek-v4.1-flash-1017 / max），原桌面聊天仅作参考

## 结论

按执行令完成字面绑定：仅新建 3 个文件，全部与批准清单中的期望字节数与 SHA-256 完全一致。

运行状态：**AUTHORED_NOT_RUN。运行次数 ZERO** —— 未执行任何 Node / Python / 服务 / 模型调用。

## 产出（全部位于 newroot）

newroot：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18MainlineCycle3-20261101-112139`

| 文件 | 字节数 | SHA-256 | 与期望一致 |
|---|---|---|---|
| `native-defense-opinion.mts` | 156887 | `7e923988380983af34996996e9fb83cb7473e02f088e6f5789e6732a81b79bc5` | 是 |
| `b-service-defense-opinion.py` | 53711 | `68809d1a0f8a31101d83b40bc220058ac1cf6da9d71fd7c04052281c022745b1` | 是 |
| `literalfixed-inputs.json` | 12014 | `3c86f7c702db0e010e19a36526c243f687b2646d0975b8ae75f079bed5b90715` | 是 |

期望值来源：`approved.json` 中各文件的 `expected.bytes` / `expected.sha256`。

## 做法与自证

1. 三个产出均以 approved.json 指定的 `before` 文件字节为唯一底本（.NET `ReadAllBytes` 原样复制），再按 approved.json 逐条做字面替换。
2. 每条替换前先校验出现次数与 `count` 完全相符，任一条不符即中止写入；本次 12 条替换（2 + 2 + 8，含 count=2 的四处）全部命中，无多余命中、无误替换。
3. 每个底本写入前先校验其 SHA-256 与 approved.json 的 `before.sha256` 一致：
   - `before-native-defense-opinion.mts` → `70c1e2dd…5585e2` ✔
   - `before-b-service-defense-opinion.py` → `8d267978…70aee` ✔
   - `before-literalfixed-inputs.json` → `009b5777…b5b4d` ✔
4. 写入后另起一次独立读取复算字节数与 SHA-256（即上表 FINAL 行），与期望完全吻合。
5. 底本与原始件（Cycle 2 目录）字节数、SHA-256 与 approved.json 所载一致，说明未使用被改动的源文件。

## 绑定内容摘要（仅路径 / 哈希类绑定位点）

- `native-defense-opinion.mts`：approved-inputs 路径 Cycle2 → Cycle3（1 处）；approved-inputs SHA-256 `4623131b…c98f` → `4570656f…1ac`（1 处）。
- `b-service-defense-opinion.py`：输入目录 Cycle2 → Cycle3（1 处）；approved-inputs SHA-256 同上（1 处）。
- `literalfixed-inputs.json`：approved-inputs 路径与哈希、Skill 哈希 `2111e323…12dc` → `ce22b6d6…59fc`（2 处）、Skill 字节数 `22785` → `27811`（2 处）、Skill mtime_ns `1793502746263533300` → `1793503227247092400`（1 处）、本轮产出目录 Cycle2 → Cycle3（2 处）、consumer 与 bService 的 SHA-256 改为本轮新值（各 1 处）。

## 未改动的部分（与执行令一致）

- 函数实现、提示词、模型 `qwen38-27b`（49152）、temp 0.6、budget 32+48、答案集、SDK、guards、assertions、disposal 逻辑一律与 Cycle 2 底本相同，本次只做上表列出的字面绑定替换。
- 执行令所述“当前实质性 Skill `ce22b6d6…` 已复核、离线检查已通过”一项沿用既有结论，本次未重做复核与离线检查。
- `D:\Lawbeach\lawbench-coord\T18MainlineCycle3-20261101-112139Input\` 下的输入与快照数据为 Root 已备数据，未做任何改动，本轮只读。

## 边界与纪律

- Git 全程只读，实际未执行任何 Git 命令：无 add / commit / rebase / stash / reset / clean / checkout / push，未暂存、未提交、未建分支、未动索引或锁。
- 未做目录遍历与发现性检索；除执行令、approved.json、三个 before 底本与本轮新建的 3 个产出文件外，无其他读取。
- 未启动 Node、Python、解析器、测试、检查、构建、prepare-execution，未发起 HTTP / GUI / 探针 / 自测，未触碰 6000D / 395，未更换 API。
- 未联系其他会话；未改动沙箱、审批与 ACL；未拆 writer 锁。当前 PID 即本次唯一执行者。
- 实际 Shell 为原生 PowerShell（`pwsh.exe`，login=false），未使用 bash 包装。
- 净增文件仅 3 个（外加协调目录下的本交回件）；工作区既有 dirty 内容一律保全，未清理、未覆盖。

## 遗留 / 待主编排决定

1. 三个新文件**未运行**，端到端行为未验证；如需实跑请另行下令并确认所需凭据与网络边界。
2. 本轮无 Git 提交，交回以本文件（协调目录）为准；如需入库请由主编排在 `main` 侧统一处理。
3. 底本 `before` 文件与 approved.json 的 `original` 字段指向 Cycle 2 目录，该目录内容未改动，作为可回溯的原始证据保留。
