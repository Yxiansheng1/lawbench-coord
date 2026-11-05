# A 线原生真实对话 preflight/fixed-input 修订交回

状态：`AUTHORED_NOT_RUN`。预检未运行，完整真实对话未运行，没有模型回答、真实 fork、真实持久化重开或 `PASS`。作者仅做静态文件/JSON/哈希核对。

## 四处回答

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在既有消费器上加入固定输入门、`--preflight-only`、Key-ready 前闭合网络、延迟 TTY Key、ASCII/4,096 字节输入边界，以及逐轮真实模型 POST/HTTP 200 计数。原有四段提示、生产 AgentLoop、生产 fork、R/事件/seq、JSONL 重开和清理断言保留。 |
| 目标是什么 | 让 root 先审源码，再运行无 Key 的生产装配预检；预检成功只为 `CLEARSETUP_ONLY`。root 审后和本人输入 Key 后，才允许原四轮真实对话与 fork 验证。 |
| 在等什么 | root 独立重算 46 行 manifest、审阅消费器和 finally，捕获实际 OS 进程身份，然后运行预检；预检通过后由 root 决定完整模式。 |
| 卡在哪 | 作者运行权限按令限定为静态操作，真实运行尚不存在。Git status 子模块仍因共享 worktree 目录权限拒绝，按令不修。没有产品源码阻塞。 |

## 本次写入面

只写下列四个目标；没有其他文件写入：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\fixed-inputs.json`
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-preflight-amend-20261028-004315.md`
4. `D:\Lawbeach\lawbench-coord\A-handback-native-real-preflight-amend-20261028-004315.md`

未改旧 README、config、runtime、product、旧测试、patch、18 legacy、E50、guard、`.env`、Keyring、history、cache、案卷或费用。没有 Git 写入，因此没有提交 SHA。

## 产物事实

| 产物 | 字节 | SHA-256 |
|---|---:|---|
| 消费器 | 51,654 | `efb4c295f081c03bd39b396012c812c2810e15c69336d0cc23c0b41b81c0ef65` |
| 固定输入清单 | 14,284 | `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522` |
| 修订说明 | 6,135 | `8fc76fc8230e9e3cae04ac8a1fc78186dae1cbb2ad78f32e6c4fcadf6889abb3` |
| 旧 README（未改） | 6,259 | `5e9537aef53e9471e8ff277ab261f2bb0fa9db3eea77fba04a1444746f7f514d` |

消费器原值：39,711 字节，SHA-256 `24d9458aa87f07f35bf9c7851bc0104e01be4b05372d12a66b0df5c4ecccc8c73`。本交回件由 root 自行哈希。

manifest 共 46 行：原六项 6/6、显式运行时模块 16/16，其余为 Node/tsx、dsh 配置、piai 源码与 package、pi-ai 和 OpenAI SDK 的实际安装文件。作者最后静态重算 46/46 行，mismatch 0；消费器含 manifest 字面量 SHA，且 `await verifyFixedInputs()` 恰好两次：Key/产品加载前一次，清理后成功状态前一次。消费器自身哈希不在 manifest 内，也不自钉自己，root 独立持有该项。

## 旧 README 被覆盖之处

- 旧“固定输入”只列原六项，现由 46 行固定 manifest 和双时点复核替代。
- 旧“Root 启动”只有完整命令，现增加 `--preflight-only`；旧流程在导入/装配前读 Key，现改为生产装配和源 Session 创建后才读。
- 旧“凭据和网络”没有 ASCII/4,096 字节上限、Key-ready 前闭合计数和 stdin end/error 恢复；新实现增加这些，并保留单行 TTY 正常输入，不允许 env/CLI/file/IPC/服务回退。
- 旧“判定”只描述 `PASS`；现明确 `CLEARSETUP_ONLY` 只是生产装配预检，不是四轮/原生对话通过。
- 旧“仍未验证”仍是事实：作者没有真实运行。本修订不把静态检查或 root 旧导入证据写成真实对话证据。

旧 README 按要求冻结，以上以说明文件覆盖，不直接编辑它。

## 固定门与运行边界

- 固定门在任何 Key 读取和动态产品模块导入之前执行；manifest 自身按独立字面量校验，每行按路径、字节和 SHA-256 校验。
- `--preflight-only` 使用与 full 相同的生产导入、Context/plugin 组装、Session Controller、Agent Loop、JSONL 服务与关闭路径；创建生产 Session/Agent 后立即关闭，不提交提示，不制造历史/轮次事件，不读 Key。
- 网络守卫在预检或 Key 未就绪时先拒绝、再计数，不做 URL I/O。完整模式仍只允许 `http://10.126.126.1:8000/v1/*`，强制 `redirect: "error"`。
- full 只有在生产装配完成且源 Session 创建后，才从 TTY 读取一条非空可打印 ASCII 记录。超过 4,096 字节、控制字符或非 ASCII 均在无内容/长度/哈希/前缀回显下拒绝；所有结束路径尝试恢复 stdin/raw mode。
- 四段 prompt 常量、事实断言、生产 AgentLoop、生产 `prompt()`/`fork()`、Session UUID、R、事件 seq、JSONL 重开与清理语义保留。没有替换 Agent、provider、模型答案或持久化实现。
- 每轮记录 `networkStart`、实际 model POST 数和 HTTP 200 数；PASS 要求每轮至少一个真实 POST 200，总量也至少四个 200。生产重试可让尝试数超过四个，未写死“恰好四个网络记录”。
- `process.startedAtUtc` 仍是 `Date.now() - process.uptime()` 的近似值，不是 OS exe birth UTC；root 必须独立捕获 OS 身份。stdout 遮蔽只是精确字符串处理，不是全称内存或取证防漏保证。

## root 后续命令

预检：

```powershell
Set-Location 'D:\Lawbeach\lawbench-A\dsh'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts' --preflight-only
```

只有 root 完整审阅、独立重算 manifest、确认入口 SHA 并验证预检为 `CLEARSETUP_ONLY` 后，才可去掉 `--preflight-only` 在真实 TTY 输入本人 Key。root 阶段不属于作者结果。

## 静态验证

- JSON 可解析。
- manifest 46 行；original-six 6；runtime-modules 16；mismatch 0。
- 消费器内 manifest pin 与实算值一致。
- 文本检查确认两个实际 `await verifyFixedInputs()` 调用、`--preflight-only`、`CLEARSETUP_ONLY`、`gate.preflightOnly || !gate.keyReady`、ASCII/4,096 上限、逐轮 HTTP 200、fork 精确前缀和 JSONL 重开失败条件存在。
- 未运行 Node、tsx、Python、Vitest、tsc、TypeScript/JS 解析器、产品 import、AST、HTTP、Key、SSH、模型、GUI、build 或 selftest。

## 既有状态与阻碍

- 工作树开工前已 dirty；主工作树在 `--ignore-submodules=all` 下仍显示原 dirty/untracked，全部保留。
- 普通 `git status --short --branch` 非零：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。未重试修复、未扩权、未改 ACL/index.lock。
- root 旧导入证明：16/16 模块 fulfilled，denied 0，natural exit，8.171 秒，business key reads 0、HTTP 0、Context/Session 0、source pins6 match、`OS_exe_birth_NOT_captured: true`。仅证明 import load。
- 协调输入实际是目录 `NativeRealPreflightAmendInput-20261028-004315`；一次按无扩展名文字的 `.md` 猜测读取返回不存在，随后列出目录并按四份输入核对。该失败未改变状态。
- 有四次误把 shell 填成 `bash` 的工具调用，均在 MXC/Bash 入口因权限拒绝，未执行命令；随后改回指定原生 pwsh。它们是调用错误，不构成产品阻碍。
- 一次只读命令因工具参数重复未启动；一次错误的 `@earendil-works` 顶层路径返回不存在；一次 OpenAI 路径猜测返回不存在；一名 manifest 候选路径的 PowerShell 枚举最终实得 46 行，没有用猜测补行。
- 一次 `rg` 正则因 PowerShell 引号/管道解析报 ParserError；一次 tsconfig 组合命令在第二段因 `-Raw` 与 `-TotalCount` 冲突返回非零；均随后用更小只读命令完成。两次只读哈希汇总因 PowerShell 管道语法各报一次 ParserError，随后得到最终结果。一次 `rg` 无匹配返回 1，不是文件或运行失败。
- 最终 coordinator 路径只读状态检查非零：`fatal: not a git repository (or any of the parent directories): .git`。协调目录不是 Git 仓库；交回文件已存在，未尝试初始化或修改。
- 曾有两三条只读命令使用 `native-powershell\pwsh.exe` 路径别名并成功执行；这是路径偏差，未用 bash、未改状态。之后恢复执行令要求的 `native\powershell\pwsh.exe`。

## 实际命令台账

所有命令均在 `D:\Lawbeach\lawbench-A`，使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false`；误填 bash 的调用除外，均在执行前拒绝。

1. `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-native-real-preflight-amend-order-20261028-004315.md'`
2. `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\NativeRealPreflightAmendInput-20261028-004315.md'`（路径猜测；非零，不存在）
3. `git status --short --branch`（非零，dsh 子模块 Permission denied）
4. `Get-Item -LiteralPath <旧消费器>,<旧README>` 并显示长度/时间
5. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -Filter '*004315*'`
6. `git status --short --branch --ignore-submodules=all`
7. `Get-Content -Raw -LiteralPath <旧README>`
8. `Get-Content -Raw -LiteralPath <旧消费器>`
9. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\NativeRealPreflightAmendInput-20261028-004315' -Force`
10. `Get-Content -Raw -LiteralPath '...\NativeRealConversationInput-20261028-000823\source-inputs.json'`
11. `Get-Content -Raw -LiteralPath '...\outputs\native-real-import-preflight-current.json'`
12. `Get-ChildItem -LiteralPath <目标证据目录> -Force`
13. `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\package.json'`
14. 一次 tsconfig 目录枚举工具调用因重复参数未启动
15. 误填 bash 的 `Get-Content ...\llm-pi-ai\src\index.ts`（入口拒绝）
16. 误填 bash 的 `rg ... llm-pi-ai/src/package.json`（入口拒绝）
17. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules' -Force`
18. `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh' -Filter 'tsconfig*.json' -Force`
19. `Get-Content -Raw -LiteralPath ...\llm-pi-ai\src\index.ts`
20. `rg -n ... (@mariozechner|openai|pi-ai|shims|auth|provider|apiKey|resolveCredential|fetch) ...\llm-pi-ai\src ...package.json`
21. `Get-Content -Raw -LiteralPath ...\llm-pi-ai\package.json`
22. 误填 bash 的 `Get-ChildItem -LiteralPath ...\dsh\node_modules\@earendil-works`（入口拒绝）
23. `Get-ChildItem -LiteralPath ...\dsh\node_modules\@earendil-works`（路径不存在，非零）
24. `Get-ChildItem -LiteralPath ...\dsh\node_modules\.pnpm -Directory -Filter '@earendil-works*'`
25. 同一目录枚举 `.FullName`
26. `$pi=...; Get-ChildItem ...\pi-ai; Get-Content -Raw ...\pi-ai\package.json`
27. `Get-ChildItem -LiteralPath ...\pi-ai\dist\api -File`
28. `rg -n internal/shims|shims|globalThis.fetch|fetch... openai-completions[lazy].js`（无匹配，非零）
29. `Get-Content ...\pi-ai\dist\api\openai-completions.js -TotalCount 140`
30. `$openai=...; Get-ChildItem ...openai; Get-Content ...package.json`（错误 pnpm 路径，两个不存在错误）
31. `Get-ChildItem ...\.pnpm -Directory -Filter 'openai@*'`
32. `$openai=...openai@6.40...; Get-ChildItem ...openai; Get-Content ...package.json`
33. `Get-ChildItem ...openai\internal ...; Get-ChildItem ...openai\core ...`
34. `rg -n "from...internal/shims|fetch...|Authorization|baseURL..." ...client.mjs ...index.mjs ...shims.mjs`（PowerShell 引号/管道 ParserError）
35. `$openai=...; rg -n -e internal/shims -e fetch -e Authorization -e baseURL ...client.mjs ...index.mjs ...shims.mjs`
36. `Get-Content ...dsh\tsconfig.json; Get-Content ...dsh\tsconfig.base.json -TotalCount 80`（后者参数冲突，非零）
37. `Get-Content ...dsh\tsconfig.base.json -TotalCount 100`
38. `$sourceInputs=...; $entries=...; ... Get-Item/Get-FileHash 42 个候选路径 ... ConvertTo-Json -Depth 5`
39. `Get-Content -Raw ...\A-dirty-before.stdout.txt`
40. `Get-Content -Raw ...\A-handback-native-real-conversation-20261028-000823.md`
41. `Get-FileHash -Algorithm SHA256 -LiteralPath <新旧各两份> | Select-Object Path,Hash`
42. 误填 bash 的 `rg -n "SessionId" <消费器>`（入口拒绝）
43. `rg -n "SessionId" <消费器>`
44. `Get-Content <消费器> | Select-Object -Skip 1020 -First 420`
45. `rg -n "FIXED_INPUTS_SHA256|...|SessionId" <消费器>`
46. `Get-Content <消费器> | Select-Object -Skip 1280 -First 180`
47. `rg -n "\\b(BrowserSession|Context|...|installModelSelectionProjection)\\b" <消费器>`
48. `rg -n "\\bsetup\\b" <消费器>`
49. `$path=<消费器>; ... manifestVerifyCalls ...` 静态文本检查
50. `rg -n -C 2 "fork did|inherit the exact|source prefix|reopened JSONL|actual model POST" <消费器>`
51. `$manifestPath=...; ConvertFrom-Json; 逐行 Get-Item/Get-FileHash; 输出 entries/groups/mismatches`
52. `$paths=<消费器,清单,旧README>; ... Get-FileHash ...`（第一次 `foreach | Format-List` ParserError，非零）
53. 同三路径改为 `$results=@(); ...; $results | Format-List` 成功
54. `Get-Date -Format o`
55. `$path=<清单>; [pscustomobject]@{bytes;sha256} | Format-List`
56. `$path=<消费器>; [pscustomobject]@{bytes;sha256;lines;manifestSha256} | Format-List`
57. 最终审计：`ConvertFrom-Json` + 46 行逐项 `Get-Item/Get-FileHash` + 四个产物哈希 + 两个消费器 verify 调用检查
58. `git status --short --ignore-submodules=all -- 'docs/plan/evidence/T31/NativeRealConversation-20261028-000823'`（成功；目标目录为 untracked）
59. 在 coordinator 执行 `git status --short -- 'A-handback-native-real-preflight-amend-20261028-004315.md'`（非零，coordinator 不是 Git 仓库）

实际写入通过四个精确目标的 `apply_patch` 完成；Shell 没有被用作文本写文件工具。

## 结论

作者阶段到此停止。不得把本交回件判成 `PASS`、普通真实轮次通过、fork 通过或 JSONL 重开通过；可交给 root 审阅并独立执行预检的状态只有 `AUTHORNOTRUN / PREFLIGHT_NOT_RUN / FULL_NOT_RUN`。

Response ID: `A-native-real-preflight-amend-20261028-004315`

Response log path: chat reply
