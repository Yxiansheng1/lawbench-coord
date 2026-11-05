# A 线交回：T18 QuestionGate imports/order correction

状态：**有界修正完成；未做运行验收，不得据此外推合同工作流 PASS。**

执行者：A 线 DeepSeek `deepseek-v4.1-flash-1017/max`，cwd `D:\Lawbeach\lawbench-A`。本运行只有当前 writer，没有启动第二 writer；未联系其他聊天，未更换 API，未扩权，未改沙箱、审批、ACL 或 writer 锁。Git 全程只读，没有 add/commit/rebase/stash/reset/clean/checkout/push，也没有 source commit。

## 交付

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts` | 103451 | `782d9d55cccbdecc8ccf754dfb9d9ec49ae9c4bddf9b4683f5311b3915e210ed` |
| `docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\fixed-inputs.json` | 17162 | `b187d49b0df3e913099f938bcfc91d2184c2f6632a16c58fd2bde50bc3710139` |
| `docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\README.md` | 6019 | `46e347983406efaf70ec6cf0443a3705b23b36dfd02a6e8930a6b8ca3325f6ef` |

两处实际动态导入现各出现一次：

```text
file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115/profile-node_modules/lawbench-dsh/lib/agent.js
file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/QuestionGatePrivateBuild-20261028-190358/private-output-20261028-191115/profile-node_modules/lawbench-dsh/lib/host.js
```

精确反向替换为原 T31 路径，并把 `FIXED_INPUTS_SHA256` 从 `b187d49b0df3e913099f938bcfc91d2184c2f6632a16c58fd2bde50bc3710139` 换回 `3594dc7b9b7bdc48c9bfcf826b6b0deafe34cef143a999cf03de24d2ffcf06ab` 后，内存结果为 103441 字节、SHA-256 `21f529a0c9e15c7b1f53347bc2885bf6c8b1273617a0963bafcc56a06de4fd5c`，与冻结原件精确一致。

相对协调目录 before consumer，最终文件只有 3 对行差异：1 个 manifest 常量、2 个动态导入。旧 T31 路径在最终 consumer 中出现 0 次。

`fixed-inputs.json` 相对 before 只有 5 条既有源码 pin 的字节/SHA 字面更新，共 10 对行差异；条目总数、JSON 布局及“其他字段/459 pin 行”没有重排或重算。更新项均匹配协调目录批准文件和当前实际文件：

| 路径 | 字节 | SHA-256 |
|---|---:|---|
| `dsh-ext\agent\index.ts` | 44666 | `4f652150927692c5230bd7ec5d517fdec2f45e35839fefd017d3e6d0aa3c922c` |
| `dsh-ext\agent\task-state.ts` | 20103 | `d69d93748eace497539a5ca96b18fd19e9852de2b3bed93cbddb45c87a7277b4` |
| `dsh-ext\host\index.ts` | 61281 | `da96a5e012b746da5204210188bf8f331bb1049e7436edfb859e162e0b18806f` |
| `dsh-ext\host\skills.ts` | 3801 | `9981fa72543238a5d7d16b9790905cb98a08dc140adab67a4fe485da5239a472` |
| `dsh-ext\shared\turn-notices.ts` | 4045 | `278c58c72ba15c6f7c0dccd63def3dd5f81d2a1fc51fb197dfd806d48c97b2a0` |

## 只读核验

- consumer 内 `FIXED_INPUTS_SHA256` 恰为 manifest 实际摘要 `b187d49b0df3e913099f938bcfc91d2184c2f6632a16c58fd2bde50bc3710139`。
- current runtime `agent.js` 为 549374 字节、`af533872ed30e41aeb2de823d24261a588f4b72c96f753ab05ead01def67c6e6`；`host.js` 为 902499 字节、`ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`。
- `b-service.py` 保持 30607 字节、`4fef1d5202b696b51467d1aaba52b00f71aa97610dbaffe3c65877abdc60f59f`。
- 协调输入原件保持冻结：consumer 103441/`21f529…`、旧 manifest 17162/`3594dc7b…`、B 入口 30607/`4fef1d52…`、原正式文件 5576/`be4a43d3…`、原 README 5035/`3d00ba30…`。
- README 已改为最终 consumer 字节/SHA、两处实际新导入和 root 顺序更正；保留 `AUTHORED_NOT_RUN`、5 个完整加 1 个部分 OS 身份、自然构建退出码 0，以及完整 T18/业务验收未完成边界。

未运行 Node、Python、TypeScript 解析器、AST、动态导入、Vitest/tsc/测试/自检、prepare/build/serve/HTTP/模型/GPU/GUI/SSH/Key/env/DPAPI/Keyring。未改动 B 入口、产品代码、6 号产品、测试、Skill、SDK、25 个编译输出、旧 lib、E50、18 legacy、source 346、fixed 46 或任务材料。合同问题实际先后与 `20 vs 2` 阅读质量问题仍开放；Gate 1、完整 T18、项目均未完成，Packaging 仍为 **HOLD**。

## 非零与阻碍

本运行 shell 调用 42 次：34 次退出 0，8 次非零；无长跑，技术 watchdog 未触发，runtime 0。8 次非零中，4 次是 bash 参数在预执行阶段被拒绝，命令未运行；其余 4 次是只读 Git 权限、输入路径笔误和两次 PowerShell 管道解析错误，均未改变文件。

1. `git status --short --branch`：退出 1；共享 worktree 的 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝。未尝试修锁或扩权。
2. 把令中 `T18QuestionGateImportsInput-20261028-192739.md` 当文件读取：退出 1，路径不存在；随后只读发现它是目录，实际输入均在目录内。
3. 第一次 bash 参数预执行拒绝：未执行，未改文件。
4. 两条源码哈希检查的 `Format-Table` 管道解析错误：各退出 1，未执行文件写入。
5. 第二次 bash 参数预执行拒绝：未执行，未改文件。
6. 第一次 Select-String 协调件检查的 bash 参数预执行拒绝：未执行，未改文件。
7. 最终 source-pin 检查的 bash 参数预执行拒绝：未执行；同一检查随后用原生 `pwsh` 通过，5 项均 `Matches: true`。

## 实际命令清单

除明确标为 bash 的 4 次预执行拒绝外，成功命令均显式使用绝对路径原生 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe` 且 `login=false`。

1. `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-question-gate-imports-order-20261028-192739.md'` — 0。
2. `git status --short --branch` — 1，dsh 子模块权限。
3. `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts'` — 0（输出截断）。
4. 以同一 EVIDENCE consumer 方式读取 `D:\Lawbeach\lawbench-coord\T18QuestionGateImportsInput-20261028-192739.md` — 1，文件不存在。
5. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18' -Force | Select-Object Name,FullName,Length,LastWriteTime` — 0。
6. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -File | Where-Object { ... T18QuestionGateImports/approved-five ... } | Select-Object ...` — 0。
7. `Select-String -LiteralPath <consumer> -Pattern 'Promise.all|agent\.js|host\.js|FIXED_INPUTS_SHA256' -Context 4,8` — 0。
8. bash：Get-Item/Get-FileHash 读取 manifest — 预执行拒绝。
9. `Get-ChildItem -LiteralPath <QuestionGateContractWorkflow-20261028-191702> -File | Select-Object Name,Length,LastWriteTime` — 0。
10. nativepwsh：Get-Item/Get-FileHash 读取 manifest — 0，17162/`3594dc7b…`。
11. `Get-Content -Raw -LiteralPath <fixed-inputs.json>` — 0。
12. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -Recurse -File ... approved-five...` — 0。
13. `Get-ChildItem -LiteralPath <consumer directory> -Recurse -File ... fixed-inputs/approved-five...` — 0。
14. `Get-Content -Raw -LiteralPath <README.md>` — 0。
15. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18QuestionGateImportsInput-20261028-192739' -Recurse -File | Select-Object Name,FullName,Length,LastWriteTime` — 0。
16. `Get-Content -Raw -LiteralPath <approved-five-source-literal-pins.json>` — 0。
17. nativepwsh：5 个源码文件 `Get-Item`/`Get-FileHash`，原写法 `foreach ... | Format-Table` — 1，PowerShell 管道解析错误。
18. nativepwsh：consumer/manifest/README `Get-Item`/`Get-FileHash`，原写法 `foreach ... | Format-Table` — 1，PowerShell 管道解析错误。
19. nativepwsh：5 个源码文件 `Get-Item`/`Get-FileHash`，改为 `$rows=foreach...; $rows | ConvertTo-Json` — 0。
20. nativepwsh：consumer/manifest/README `Get-Item`/`Get-FileHash` — 0。
21. bash：5 个协调输入文件 `Get-Item`/`Get-FileHash` — 预执行拒绝。
22. nativepwsh：Get-Item/Get-FileHash 读取 current runtime `agent.js`、`host.js` — 0。
23. `Get-Content -Raw -LiteralPath <A-dirty-before.txt>` — 0（输出截断）。
24. nativepwsh：Get-Item/Get-FileHash 读取协调 before consumer — 0。
25. bash：`Select-String` 读取协调 before consumer — 预执行拒绝。
26. nativepwsh：计算新旧 agent URI 长度及两处路径总 delta — 0，`old 159/new 164/delta +10`。
27. nativepwsh：5 个协调输入文件 Get-Item/Get-FileHash — 0，全部匹配冻结哈希。
28. nativepwsh：Select-String A-dirty-before 指定 4 个标记 — 0，无输出。
29. nativepwsh：Get-Item/Get-FileHash 读取改 import 后、改常量前 consumer — 0，103451/`b5107a22…`。
30. nativepwsh：Get-Item/Get-FileHash 读取改 5 pin 后 manifest — 0，17162/`b187d49b…`。
31. nativepwsh：`Compare-Object` before/after manifest 并汇总差异 — 0，10 旧/10 新。
32. nativepwsh：Select-String consumer 两处 `lawbench-dsh/lib/*.js` — 0，新路径各一行。
33. nativepwsh：Get-Item/Get-FileHash 读取最终 consumer — 0，103451/`782d9d55…`。
34. nativepwsh：内存反向替换两 URI 与常量，UTF-8 无 BOM 取 SHA-256 — 0，103441/`21f529…`，`Matches: true`。
35. nativepwsh：`Compare-Object` before/final consumer — 0，仅 6 行（3 对）差异。
36. nativepwsh：Get-Item/Get-FileHash 读取 manifest — 0，17162/`b187d49b…`。
37. nativepwsh：Get-Item/Get-FileHash 读取 consumer、manifest、README、B 入口 — 0，身份见上。
38. nativepwsh：Get-Content/Regex 计数 manifest 常量、新 agent/host 与旧 T31 前缀 — 0，`1/1/1/0`。
39. bash：5 个 current source pin Get-Item/Get-FileHash — 预执行拒绝。
40. nativepwsh：5 个协调输入文件 Get-Item/Get-FileHash 对照冻结值 — 0，全部 `Matches: true`。
41. nativepwsh：README Get-Item/Get-FileHash 与关键词检查 — 0，最终身份和 4 个边界标记均存在。
42. nativepwsh：5 个 current source pin Get-Item/Get-FileHash 对照批准值 — 0，全部 `Matches: true`。

3 次 `apply_patch`：consumer 两 URI 与 manifest 5 pin；consumer 唯一 manifest 常量；既有 README。除此之外未写产品/测试/Skill/B/协调输入。
