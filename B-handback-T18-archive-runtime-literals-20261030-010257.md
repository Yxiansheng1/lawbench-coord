# B-T18 archive runtime literals handback

状态：`SOURCE_REPAIR_HANDOFF_ONLY / RUNTIME0 / NOT_RUN`

执行令：`D:\Lawbeach\lawbench-coord\B-T18-archive-runtime-literals-order-20261030-010257.md`

证据说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveCurrentConsumer-20261030-005655\runtime-literals-fix-20261030-010257.md`

## 交回结论

已按令只修复 `APPROVED_RUNTIME_PINS` 的四项运行时字面量，并同步 `literalfixed-inputs.json` 的 consumer bytes/SHA，随后停止。

旧 `SentenceWorkflowPrivateBuild-20261029-220752` 四个角色行已替换为 root 已批准的 `ArchiveWorkflowGate-20261030-003021/private-output-20261030-005335` 四项数据：

| 角色 | Bytes | SHA-256 |
|---|---:|---|
| agent | 557503 | `b19dbe88fff54656ce3da8f603cea46949e7f4a4d2fe62f093af319edaa3c6f8` |
| host | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| package | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| manifest | 58194 | `d19fd43a929d0e24a000ab6a054209a356a5360aba21e1c06077f12434f3cfbf` |

## 字节级静态核对

- 冻结快照 SHA：172273 bytes / `3cb19daa9e03bd952a645f9b2eb9ddcce124398d1552f7b21896ec824e05010e`。
- 修复后消费端：172233 bytes / `3d4e671f2aa634777cb975c33d0b5b88ce620b7acae640af410c5569734e3314`。
- 净变化 -40 bytes，与移除四个数字分隔符及路径差异相符。
- `const APPROVED_RUNTIME_PINS = {` 在修复前后均恰出现一次。
- 与冻结快照比较，常量块前的全部字节逐字符相同，`} as const` 后的全部字节逐字符相同。
- 当前文件中旧 `SentenceWorkflowPrivateBuild-20261029-220752` 计数为 0；新归档构建路径计数为 6，即四个常量角色路径加既有两个动态 import。
- 四个角色键、imports、observer、assertions、prompts、params、4 answers、production、fetch、finally 均未被修改。

## 清单与保留文件

| 文件 | Bytes | SHA-256 | 状态 |
|---|---:|---|---|
| `native-archive.mts` | 172233 | `3d4e671f2aa634777cb975c33d0b5b88ce620b7acae640af410c5569734e3314` | 本次仅改常量块 |
| `literalfixed-inputs.json` | 15338 | `54e85f38d211f7bd435b851d1671e2d55bc38e41098c6d0da3926c36c6060621` | 仅 consumer 两项更新 |
| `b-service-archive.py` | 54743 | `7facdd335d06cc2c6f5d728e27b5334618057e85cf6c81c20e020473d85e0780` | 保留 |
| `archive-order-finite.mts` | 7163 | `fc01d193cd0c8d23c451786fb65dded7576e0ac55703078acd56e2ac66e05588` | 保留 |
| `README.md` | 6133 | `69f3330b258f1fef529b848e75cc213b0e4ae550e560a5b5a60f808bcf48cb76` | 保留 |

旧 formal 未改。README 中 native-powershell 路径说明仍不正确；实际执行使用执行令指定的 native PowerShell，以 raw 命令为准。

## 执行与阻碍

- 所有 shell 命令均显式使用指定 native `pwsh.exe`、`login=false`，未使用 Bash 或 cmd。
- 交回文件写入前实际 23 条 `exec_command`：21 条 exit 0，2 条 exit 1。
- 非零一：普通只读 `git status --short` 因 managed sandbox 拒绝 `dsh` 子模块路径而失败；未修复权限，改用只读 `--ignore-submodules=all` 取得顶层 dirty 状态。
- 非零二：一次辅助哈希汇总 PowerShell 管道语法错误；未写入。
- 交回后执行 3 条只读复核，均为 exit 0；首条整段清单比较因子串反斜杠转义假设错误而报告 false，第二条只读诊断确认 bytes/SHA 精确，第三条修正断言后终检通过。
- 本次累计 26 条 `exec_command`：24 条 exit 0，2 条 exit 1。
- Git 全程只读；未 add、commit、rebase、stash、reset、clean、checkout、push。
- 未联系其他聊天、未换 API、未改沙箱/审批/ACL、未拆 writer 锁。

## NOT_RUN

未运行 Node、Python、ESM、AST、parser、import、check、tests、build、helper、HTTP、model、GUI、EnvKey、DPAPI、SSH 或进程探针；未生成 `run-*`；未执行 finite、bindings、admission529 或 original actual。无模型、原生、业务或法律验收宣称。

## Root 后续

请 root 先执行完整 whole inverse，确认旧快照到新 consumer 的唯一允许差异，再运行既定的 finite/ESM/bindings/admission529 与 original actual。本交回件只证明精确数据修复和静态保留，不替代 root 的完整复核与运行验收。
