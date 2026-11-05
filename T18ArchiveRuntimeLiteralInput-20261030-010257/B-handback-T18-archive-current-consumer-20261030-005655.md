# B-T18 current consumer handback

状态：`SOURCE_HANDOFF_ONLY / RUNTIME0 / NOT_RUN`

正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-archive-current-consumer-order-20261030-005655.md`

证据目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveCurrentConsumer-20261030-005655`

## 交回结论

已完成令内允许的源码修改并停止。未运行 Node、Python、类型检查、UNIT、测试、构建、AST、import、HTTP、模型、GUI 或原生场景。无任何 model/native/business/legal PASS 宣称；T23 生成仍 `NOT_RUN`。

消费者变化只覆盖：

1. 新 sourcePins 的 path/bytes/SHA；
2. agent/host 两个绝对动态 import；
3. 实际 `ExtAgentModule.CASE_LIST_BEFORE_ARCHIVE_MATCH_DENIAL` 绑定、非空校验、返回和必填传参；
4. 拒绝 MATCH 的最小类型、严格同轮配对观测与 `rejectedMatches` 报告字段；
5. root-approved compilerPrivate4 与 manifest SHA 的清单回填。

B 服务差异以只读 diff 核对，除 `SOURCE_PINS` 路径、bytes、SHA 字面量外无变化。

## 文件与 SHA

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `native-archive.mts` | 172273 | `3cb19daa9e03bd952a645f9b2eb9ddcce124398d1552f7b21896ec824e05010e` |
| `b-service-archive.py` | 54743 | `7facdd335d06cc2c6f5d728e27b5334618057e85cf6c81c20e020473d85e0780` |
| `literalfixed-inputs.json` | 15338 | `5719d1b29d6fce4031c75a443bee14113cf1700d13dbdbee43d6ab482fb43fc4` |
| `archive-order-finite.mts` | 7163 | `fc01d193cd0c8d23c451786fb65dded7576e0ac55703078acd56e2ac66e05588` |
| `README.md` | 6133 | `69f3330b258f1fef529b848e75cc213b0e4ae550e560a5b5a60f808bcf48cb76` |

已只读确认 private manifest = 58194 bytes / `d19fd43a929d0e24a000ab6a054209a356a5360aba21e1c06077f12434f3cfbf`；新 B source pins = 53548 bytes / `5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`。

## 静态保留

- LIST 仍必须恰有一次成功，返回实际九个材料名，并早于合问。
- 成功 MATCH 仍必须恰有一次，在成功 LIST 后、合问前；原 argument/catalog/result 检查保留。
- 每个先于 LIST 的拒绝 MATCH 必须有同轮实际 call/result 对，且 result 文本逐字等于 `Error: ${实际 production denial}`，并早于成功 LIST result 和唯一成功 MATCH。
- 未知原因、LIST 后拒绝、缺/外来结果、多个成功 MATCH、LIST 前成功 MATCH 保持 RED。
- 至少一次受限读取及 read-before-ask 检查保留。
- `callbackAttempts === successfulCallbackInvocations` 严格断言未改；旧 no-LIST 与 invalid-ask callback2 仍为 RED。
- helper 仅写纯内存事件，明确 `UNIT_NOT_MODEL_OR_NATIVE` / `AUTHORED_NOT_RUN`，作者未执行。

## 运行器事实与阻碍

- 全部有效执行显式使用指定 `pwsh.exe`、`login=false`、managed 隔离。
- 普通只读 `git status` 因 managed sandbox 拒绝 `modules/dsh` 子模块而退出 1；未修复权限、未改锁，随后用只读 `--ignore-submodules=all` 取得顶层状态。
- 两次并行只读切片误指定 `bash`，立即被 `E_ACCESSDENIED` 拒绝，无读取、执行或写入；未启动 setup、未切 legacy，之后恢复指定 PowerShell。
- 一次 PowerShell 哈希汇总因管道语法错误退出 1，无写入；改用结果数组后成功。
- `git diff --no-index` 的有差异退出属于正常 diff 结果，不是验证运行。

写操作仅有新证据目录、三份从冻结快照/root blueprint 的机械复制、令内 `apply_patch` 修改、README 与本交回件。未写产品 A/B 源树、tests、Skills、SDK/runtime/private25/config/builder/legacy18、旧 served root 或协调输入快照。

Git 全程只读：无 add/commit/rebase/stash/reset/clean/checkout/push。未联系其他聊天、未换 API、未做进程探针、未拆 writer 锁。

## Root 后续

请 root 先审完整 consumer、helper、types/contracts/ESM/bindings 和精确 source rebinding，再决定后续有限原生验证。以 root 的完整累积复核为准；本文件不替代原生、业务或法律验收。
