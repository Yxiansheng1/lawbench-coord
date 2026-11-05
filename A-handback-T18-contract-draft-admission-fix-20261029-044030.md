# A 线 T18 contract-draft 准入修复交回

## 进度

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 完成四项静态准入修复，更新三个允许文件及 manifest 摘要；新增作者说明。 |
| 目标是什么 | 让候选准入只使用已批准的真实身份，去掉无来源格式判据，并让未知问题固件边界明确失败。 |
| 在等什么 | 等主编排的累计审计和一次新的原始规范真实运行；运行信号到达后判断技术链路并人工复核合同。 |
| 卡在哪 | 没有修复层面的卡点；Git 状态读取受子模块权限拒绝，但按令不处理，Git 写入不在授权内。 |

作者态为 `AUTHORED_NOT_RUN`，运行次数为 0。本件不声称技术通过、业务质量通过、
Gate 1 通过、全量 T18 完成或可打包。当前打包状态为 `Packaging HOLD`。

## 四项交付

1. 批准样例的固定 SHA 已改为实际值
   `3c84906bb188f18ea0f3cfe51fc26911e371abfbcbc0afa43320be829b609fcd`。
   原 manifest、Python、native 三处漏掉一个 `f` 的字面量已逐一校正；批准 JSON
   未修改。这里没有改成运行时动态接受。

2. 批准清单五行现在都在角色分类之前检查真实普通文件身份、bytes、mtime_ns 和
   SHA-256。此前漏掉的第五行实际路径是
   `D:\Lawbeach\lawbench-B\skills\contract-draft\tests\要点.md`，实际为
   8926 bytes、mtime_ns `1792379578786316200`、SHA-256
   `f9ec3ea59b7107b4d731dacd054b76ffd338396590fb73591db30dfae6f04525`。
   函数仍只返回报价单和询价邮件两份材料；要点文件、任务说明和 Skill 不进入案件，
   不发送给模型。

3. 原机器检查中无来源的“正文至少 200 字且至少两个中文条号”已删除。仍保留非空
   合同文字含“合同”、实际买方“青禾建材”、实际供方“某某钢构”、两份材料引用
   来源以及全部既有技术断言。合同条款是否完整、交易事实和冲突取舍留给人工复核。

4. 未知问题 ID 仍只记录、不补答。真实 turn 事件取得后，在任何已知三问成功判定
   之前，如果出现额外 ID，立即抛出
   `UNSUPPORTED_SYNTHETIC_QUESTION: <实际排序后的ID>`。这一步发生在
   `beforeFirstSuccessfulSave: true` 之前；实际事件、报告错误和 `finally` 路径未改。

## 历史判断撤回

旧作者 README 和旧正式交回件曾写“`要点.md` 原路径当前不存在”。该判断错误，现明确
撤回。真实路径位于父级 `tests` 目录，文件存在且身份与批准清单一致。旧 README 和
旧正式交回件的原字节保持不动，本件只做新增更正。旧 README 还声称机器检查只覆盖
非空正文、双方名称和引用，但实际代码另有 200 字和中文条号判据；本次已改代码，
使实际检查回到该说明和规范要求。

## 文件摘要

修改前：

- `native-contract-draft.mts`：106165 bytes，
  `69b6865b676e764adde099767a4eed8c17115e9ccb8cf50fa7708000e9adf0a3`
- `b-service-contract-draft.py`：45166 bytes，
  `eeae98dd0cd8905b7e8d3272127686ab404033dc5c580b136732e877acd31221`
- `literalfixed-inputs.json`：10709 bytes，
  `bd99e4b52a98ddb033643b61a379bc2abeb23ebde9a8f8eff3a21b16fd78bfd2`

修改后：

- `native-contract-draft.mts`：106212 bytes，
  `b878312a3b64f6d689ca047f374201afc87f7a1e769918c6ed5fffa5e9098197`
- `b-service-contract-draft.py`：45447 bytes，
  `a9316a37e7b6396ab098dbbe0ab95398148ff03b0b9a60e8447b4b225b5aa418`
- `literalfixed-inputs.json`：10710 bytes，
  `0d4f8a5673f63d46b28e7e0f5baf60df47ada56da61fef5555d6c09e42e01bc7`

manifest 只更新批准 SHA、consumer 大小/SHA 和 service 大小/SHA。对冻结输入快照
静态比较后，仅上述三个允许文件不同；README 字节不变。

## 保持边界

规范提示、两份真实材料、三个已知回答、49152 token 上限、唯一种子 R、
Host/Agent/ToolRuntime、B 场景范围、实际保存、引用、覆盖、JSONL、隐私、网络封锁
和 `contextDisposed` 后清理均保持。没有改产品、测试、Skill、SDK、lib、当前私有
构建、全局设置、权限策略或生产环境。

Git 严格只读，没有 add、commit、rebase、stash、reset、clean、checkout 或 push；
没有改锁、ACL、审批或沙箱。因授权不含 Git 写入，本卡没有提交 SHA。

## 依据与验证

- 新作者说明：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\root-admission-fix-20261029-044030.md`
- 候选入口：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\native-contract-draft.mts`
- 候选 B 服务：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\b-service-contract-draft.py`
- 候选固定输入清单：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ContractDraftNative-20261029-042331\literalfixed-inputs.json`

静态读数为：错误 SHA 0 处，正确批准 SHA 3 处，两段禁用格式判据 0 处，
未知问题显式失败 1 处。五个 fixture 的实际 bytes、mtime_ns、SHA-256 与批准清单
逐行一致。这里只有文件读数与文本检查，不是运行、类型或质量验证。

## 未做与命令

未运行 Node、Python、测试、构建、语法/类型解析、HTTP、模型、GUI、Key/DPAPI、
环境探测或生产操作。未执行新的真实 turn，未声称全量通过。

作者共发起 40 次只读 shell 请求：39 次进入原生 PowerShell，1 次误设 bash 并在
启动前被拒绝。30 次退出码为 0，10 次非 0。非 0 包括：`git status` 子模块权限
拒绝 1 次、启动前 bash 拒绝 1 次、只读检索无匹配 2 次、预期有差异的
`git diff --no-index` 3 次、PowerShell 汇总命令管道语法错误 3 次。语法写错后均
修正重跑；所有操作均未改候选源码。另有 1 次退出码为 0 的旧 README 对比因基线
文件名不同产生非终止路径错误，随后以 `main-README-original.md` 准确重跑。

## 下一步

主编排应从以上新路径继续累计静态审计，核对完整命令、setup/cleanup、类型和有限
ESM 字面量 pin，然后只做一次新的原始规范真实模型运行，凭证仍走自动 DPAPI stdin。
不得另建 consumer、增加格式变体或复用旧同形运行。运行后仍需人工复核合同事实和
文本质量。Gate 1、全量 T18 与项目完成状态仍为未完成，打包保持 HOLD。

删减轮：读者 1 / 槽位 1 / 半句 0 / 重复 0 / 黑名单 0

Response ID：未分配。

Response log path：chat reply。
