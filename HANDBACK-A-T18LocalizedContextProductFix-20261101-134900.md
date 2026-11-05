# HANDBACK-A：T18 有界相邻上下文产品修复

- 任务：`ORCH-A-T18LocalizedContextProductFix-20261101-134900.md`
- 状态：`AUTHORED_NOT_RUN`
- `author_runtime`：0
- `runtime`：0
- Git：只读边界内未执行任何 Git 命令；未 add、commit、rebase、stash、reset、clean、checkout、push
- 既有脏工作区：保留；仅定点修改下列三个目标文件
- 禁止读取项：未读取 `T18LocalizedContextProductFix-20261101-134900Before` 快照

## 落地修改

1. `dsh-ext/agent/index.ts`
   - 仅将辩护意见读取结束端点的数值比较由 `end === start` 改为 `end >= start`。
   - 将 `DEFENSE_READ_END_DENIAL` 替换为批准的含端范围文案：
     `辩护意见任务读取案件材料时必须明确提供有界含端范围：start/end 均为大于等于 1 的整数，且 end 必须大于或等于 start。`
   - 保留 `end` 的数字、整数检查，保留 `start` 的数字、整数、`>= 1` 检查；未改任务、搜索、问题、预算、Core、冻结范围、授权或 R 范围逻辑。

2. `dsh-ext/tests/defense-read-bound-20261101-114236.spec.ts`
   - 仅将新增测试 `INVALID_ENDS` 中唯一的多单元向量
     `{ name: '借条', start: 1, end: 2 }`
     替换为负端点向量
     `{ name: '借条', start: 1, end: -1 }`。
   - 负例总数仍为 8；missing、null、string、fraction、boolean、zero、reversed 对照例保持不变。
   - 断言、源码 helper 校验、两个 `14..18` 正例正文均未改动；未跳过或删除测试。

3. `docs/src/Spec.md`
   - 仅修改 1.7 变更记录的最后单单元条款。
   - 现明确：辩护意见读取须显式给出整数有界范围，`start`、`end` 均 `>= 1`，`end >= start` 且不超过材料末单元；只读回答问题所需的最小相邻上下文；`start=end` 同单元仍合法；8K 上限与当前 R 范围不变。
   - 未改版本号、schema、生成文件、contracts 或其他文档。

## 验证与限制

- 已用 PowerShell 对允许的三个目标做字面核对：批准文案、`end >= start`、负端点向量及 Spec 新口径均存在；旧比较、旧文案和旧多单元向量均不存在。
- 按执行令特别验证禁区，未运行 Node、Python、parser、测试、check、build、collect、HTTP、模型、GUI 或凭据运行时；未重新制造 RED，未重跑全量测试或旧证据。
- 既有 `14..18 localized` 两路径证据沿用：`2 RED / 0 PASS / 15 old skipped / 2.172s`，两端点均因旧 `end===start` 被拒；原始 RED 保留未改。
- 未执行 `scripts/build_docs.py`，因为正式执行令明确禁止本运行器运行 Python/build；`docs/src/Spec.md` 为本工单唯一文档源码变更。
- 未执行 Git 状态或历史发现命令；未暂存，未提交。

## 最终三目标 SHA-256 / 字节数

| 文件 | SHA-256 | 字节数 |
|---|---|---:|
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | `6EBCFD0C0360B7749B53EE947CC8AE8DF91D1F15EF40A55C2DA4C3EACDD276FF` | 59850 |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts` | `AFC69BAA8127A95C1F07A65C83C24980D51EE11DC8951E1C06699E12B7A79D80` | 14260 |
| `D:\Lawbeach\lawbench-A\docs\src\Spec.md` | `7CABD849BFFA2BAF90026B00A87188C5BDA8402D04341AAA2E4E7CC3B2E601DA` | 200381 |

## 交回根编排

A 线作者工作到此停止。请根编排按既有授权承接：逐文件 inverse 检查，再运行同一测试文件的 17 项 GREEN、类型检查 0 错，随后 fresh build 与 Native 验证。A 未对上述运行时结果作任何宣称。
