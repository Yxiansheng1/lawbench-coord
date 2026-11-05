# T18 archive current-consumer source handoff

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

本目录只包含 B-T18 当前归档消费者的有界源码返修。作者未运行 Node、Python、类型检查、测试、构建、AST、import、HTTP、模型或 GUI；没有任何模型、原生、业务或法律 PASS 声明。T23 归档生成仍未运行。

## 改动范围

- `native-archive.mts:70-74`：只将 `SOURCE_PINS` 的 path、bytes、SHA 改为 `T18ArchiveWarningBSourcePins-20261030-003710.json` 的实际值。
- `native-archive.mts:437-455`：新增拒绝 MATCH 的最小证据类型，并在读时间线报告中加入 `rejectedMatches`。
- `native-archive.mts:1758-1759`：只将 agent/host 两个绝对动态 import 改为 root-approved private build 的实际输出。
- `native-archive.mts:1783-1793`：在实际生产工厂 `setupProduction` 绑定 `ExtAgentModule.CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL`，校验为非空字符串并原样返回；执行令写作 `createProduction`，但快照源码实际符号是 `setupProduction`。
- `native-archive.mts:2094`：将上述实际 denial 绑定随 production 返回。
- `native-archive.mts:2687-2901`：`observeArchiveReadTimeline` 增加必填 denial 参数；保留唯一成功 LIST 和唯一成功 MATCH 的全部原检查，逐条配对拒绝 MATCH，记录 callId/seq/resultSeq/reason/result SHA，并仍只返回成功 MATCH 作为 `archiveMatch`。
- `native-archive.mts:3818-3824`：主调用传入 production 返回的实际 denial，不使用期望字面量兜底。
- `b-service-archive.py:55-60`：只改 `SOURCE_PINS`、`SOURCE_PINS_BYTES`、`SOURCE_PINS_SHA256` 三项字面量；其余服务字节保持。
- `literalfixed-inputs.json:333-343`：相对 root-approved blueprint，只回填本目录 consumer 和 B service 的实际 bytes/SHA。
- `archive-order-finite.mts`：整文件新增，纯 UNIT 内存事件，不创建 Native Session、Agent、R、任务或持久历史。

## 观测规则

成功路径要求：同一当前请求轮内恰有一次成功 LIST，返回实际九个材料名；LIST 后恰有一次成功 MATCH；MATCH 后至少一次受限材料读取；全部在合问之前。成功 MATCH 的原始 catalog 参数、result 形状及 catalog 一致性检查保持不变。

生产先于 LIST 的 MATCH 拒绝只有在同时满足下列条件时才不算 RED：同一当前请求轮内有独立实际 call/result 配对；`call.seq < result.seq < 成功 LIST 的 result.seq`；result 是 `isError`；文本逐字等于 `Error: ${caseListBeforeArchiveMatchDenial}`；且早于唯一成功 MATCH。未知错误、LIST 后拒绝、缺失/外来结果、多个成功 MATCH、LIST 前成功 MATCH 均保持 RED。拒绝文本未被解析为业务数据。

问题回调的 `callbackAttempts === successfulCallbackInvocations` 严格断言未修改。旧 no-LIST 场景仍为 RED；旧 invalid-ask callback2 仍为真实 RED。产品在无效 ID 上先拒绝、回调不发生，不通过放宽 observer 解决。

## UNIT 源文件场景

`archive-order-finite.mts` 共写有 10 个静态场景：正常 LIST→MATCH→受限读取→合问接受；已知“先拒绝 MATCH、后 LIST 恢复”接受；UNIT 专属 denial 绑定与不同绑定拒绝；未知拒绝原因 RED；LIST 后拒绝 RED；缺 LIST RED；多个成功 MATCH RED；缺配对结果 RED；外来配对结果 RED；成功 MATCH 早于 LIST RED。

文件头部明确标记 `UNIT_NOT_MODEL_OR_NATIVE` 和 `AUTHORED_NOT_RUN`。作者未执行该文件；root 仍需先审完整 helper，再由 root 负责后续有限验证。

## 实际文件

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `native-archive.mts` | 172273 | `3cb19daa9e03bd952a645f9b2eb9ddcce124398d1552f7b21896ec824e05010e` |
| `b-service-archive.py` | 54743 | `7facdd335d06cc2c6f5d728e27b5334618057e85cf6c81c20e020473d85e0780` |
| `literalfixed-inputs.json` | 15338 | `5719d1b29d6fce4031c75a443bee14113cf1700d13dbdbee43d6ab482fb43fc4` |
| `archive-order-finite.mts` | 7163 | `fc01d193cd0c8d23c451786fb65dded7576e0ac55703078acd56e2ac66e05588` |

只读身份核对还确认：

- private manifest：58194 bytes，`d19fd43a929d0e24a000ab6a054209a356a5360aba21e1c06077f12434f3cfbf`。
- 新 B source pins：53548 bytes，`5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`。

## 命令、非零与写入

所有成功执行均显式使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native-powershell\pwsh.exe`、`login=false`、managed 隔离。正式读取使用 `Get-Content -Raw -Encoding UTF8`、`rg`、`Get-Content | Select-Object`；差异使用只读 `git --no-optional-locks diff --no-index`；身份使用 `Get-Item` 与 `Get-FileHash -Algorithm SHA256`。

写入只有：创建唯一新证据目录；用 `Copy-Item` 从未改快照复制 MTS/B 服务，并用 root-approved blueprint 初始化 `literalfixed-inputs.json`；用 `apply_patch` 做上述有界源码、清单和文档修改。未写产品目录、测试、Skill、SDK/runtime/private25/config/builder/legacy18、旧 served root 或协调输入快照。

非零/阻碍如实记录：

- 普通 `git status --short --branch` 退出 1：只读子模块 `modules/dsh` 被 managed sandbox 拒绝；未改 index lock、ACL 或审批，也未尝试任何 Git 写操作。随后只用 `git --no-optional-locks ... --ignore-submodules=all` 取得顶层 dirty 状态。
- 两次并行只读切片误指定了 `bash`，均被 runner 以 `E_ACCESSDENIED` 拒绝，未读取、执行或写入任何内容；没有启动 setup 或 legacy。此后恢复指定 PowerShell。
- 一次 `Get-FileHash` 汇总命令因 PowerShell 管道语法错误退出 1，未写入；改用结果数组后成功。
- 所有 `git diff --no-index` 的有差异退出均符合 diff 语义，不是运行验证。

当前执行者按执行令视为唯一 writer；未做进程探针，未联系其他聊天，未更换 API，未拆 writer 锁。Git 全程只读，无 add/commit/rebase/stash/reset/clean/checkout/push。

本交回不证明原生运行、业务正确或法律正确；仅交 root 复核源码。
