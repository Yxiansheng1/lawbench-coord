# A handback — T31 control echo native fixture — 2026-10-27 01:15:50

## 结果

按正式执行令完成有界静态改造，新增且仅新增四件：

1. `D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts`
2. `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-echo-native.config.mjs`
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153\native-fixture-20261027-011550.md`
4. 本交回件

作者运行态：`RUNTIME_NOT_RUN`。未运行 Node、Vitest、tsc、测试收集或任何测试；未安装依赖；未读取 `.env.local`；未执行 Git 写操作。native 首跑留给 root。

## 最终大小、哈希与字节等价

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| new native fixture | 19,759 | `889e8dcb727afa9c636aa478055e8eea78a18bfa123f86cb60289f3ac8a0616e` |
| new native selector | 1,607 | `ab29a362524b3cc78e7ff1ad5afcf29d95e192d63b48eda94c958021701eb006` |
| evidence note | 3,235 | `6b3461ae7e7d7d3fbb7dfdc59660554938089ff8064ad7530ca410745077ae6a` |
| corrected source consumer | 19,982 | `35821cc2ee8356c326384efbb4176454d14d760797a966535d17b33edae54474` |

七个新 import 各出现一次。将七个新 literal 反向替换后，fixture 的 SHA-256 恢复为 `35821cc2ee8356c326384efbb4176454d14d760797a966535d17b33edae54474`，与 corrected source consumer 全字节等价；断言、helper、realframe、R/seq、rAF、cleanup、guards 均未改。

| 原 literal | fixture literal |
|---|---|
| `../../dsh/packages/core/agent-loop/src/inbox.ts` | `../../../../core/agent-loop/src/inbox.ts` |
| `../../dsh/packages/api/session-controller/src/agent.ts` | `../../src/agent.ts` |
| `../../dsh/packages/api/session-controller/src/commands.ts` | `../../src/commands.ts` |
| `../../dsh/packages/api/session-controller/src/control.ts` | `../../src/control.ts` |
| `../../dsh/packages/api/session-controller/src/client/sessions/session.ts` | `../../src/client/sessions/session.ts` |
| `../../dsh/packages/api/session-controller/src/client/sessions/remotes.ts` | `../../src/client/sessions/remotes.ts` |
| `../../dsh/packages/api/session-controller/src/types.ts` | `../../src/types.ts` |

七个目标源文件经 `Test-Path` 全部存在。原生配置继承 `vitest.t31-material-admission.config.mjs` 的 root/nativeRoot、source plugins、thread-safe project、setupFiles、execArgv 和 React aliases；仅在顶层与唯一 project 替换 include、设置 jsdom，并从 `session-controller/package.json` owner 增加 `/^zod$/` 绑定。静态确认已安装 `zod@4.4.3`，`dsh` 顶层不存在四类 `.env*` 文件。

冻结件与既有捕获的双向哈希一致：

| 冻结件 | SHA-256 |
|---|---|
| old extension consumer / capture | `35821cc2ee8356c326384efbb4176454d14d760797a966535d17b33edae54474` |
| old extension selector / capture | `c3ab9a15d4ee319e0a20ce1fc81d07bdd2f94658f58819cf4b71f22dc3e83aed` |
| existing native selector / capture | `ed1c57bbb492e28caf43725896ba265905d126a16126dc8824eaea9be961cdb9` |

## 既有运行记录

- 旧的非 root 记录：original main005153 非法运行过一次 Node/Vitest，得到 NoTests、0 assertions；不是 root 证据，不证明产品红绿。
- root 的真实首跑：`T31ControlProjectionEcho-root-20261027-010902`，自然 Node 退出码 1、14.806 秒、0 tests；具体错误为 `Failed to resolve import @deepseek-ai/dsh-agent`，来源 `finite-tests/t31-control-projection-echo.spec.ts`。这是 fixture import 灰，不是产品断言失败或语义红灯。
- 本作者：修正后的 native fixture 运行 `NOT_RUN`。

## 实际命令与非零

除单个明确标注的误配 `bash` 调用外，以下命令均通过指定 PowerShell 执行：`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，`login=false`，工作目录 `D:\Lawbeach\lawbench-A`。

成功读取准备：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-control-echo-native-fixture-order-20261027-011550.md' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\lawbench-关键事实索引-20260928.md' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\PROJECT-PROFILE.md' -Raw
Get-ChildItem -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550' -Force | Select-Object Name,Length,LastWriteTime,Attributes | Format-Table -AutoSize
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext' -Filter 'vitest.t31*' -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31' -Force -Recurse | Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-material-admission.config.mjs' -Raw
Get-Content -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\root-first-run-gray.json' -Raw
Get-Content -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\A-tracked-before.stderr.txt' -Raw
rg -n '^diff --git' 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\A-tracked-before.patch'
rg --files 'D:\Lawbeach\lawbench-A\dsh-ext' | rg 't31-control-projection-echo'
```

```powershell
$paths = @('C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\extension-consumer-before.ts','D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts','D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts'); $results = foreach ($path in $paths) { if (Test-Path -LiteralPath $path) { $item = Get-Item -LiteralPath $path; $hash = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant(); [pscustomobject]@{Path=$path;Length=$item.Length;SHA256=$hash} } else { [pscustomobject]@{Path=$path;Length='MISSING';SHA256='MISSING'} } }; $results | Format-List
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-projection-echo.config.mjs' -Raw
Get-Content -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\existing-native-selector.mjs' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts' -TotalCount 80
rg -n "^import|from 'zod'|createRequire|resolve:" 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts' 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-projection-echo.config.mjs' 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-material-admission.config.mjs'
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts' -Raw
rg -n "describe\(|it\(|expect\(|process\.env|\.env|env\.local|child_process|fetch\(|http://|https://|WebSocket|exec\(" 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'
```

```powershell
rg -n "createRequire|zod|session-controller/package.json|material-admission" 'D:\Lawbeach\lawbench-A\dsh-ext' -g 'vitest*.mjs'
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.config.mjs' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\vitest.config.ts' -Raw
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\package.json' -Raw
```

写入与逐字节复核：

```powershell
New-Item -ItemType Directory -Path 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures' | Select-Object FullName,Attributes
Copy-Item -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\extension-consumer-before.ts' -Destination 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts'; Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts' | Select-Object FullName,Length
```

两文件内容分别由 `apply_patch` 新增；fixture 的事务只包含上述七个 import 替换。之后执行的完整静态等价脚本见下：

```powershell
$sourcePath = 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoNativeFixture-20261027-011550\extension-consumer-before.ts'; $fixturePath = 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts'; $utf8 = [System.Text.UTF8Encoding]::new($false); $text = [System.IO.File]::ReadAllText($fixturePath, $utf8); $pairs = @(@('../../../../core/agent-loop/src/inbox.ts','../../dsh/packages/core/agent-loop/src/inbox.ts'),@('../../src/agent.ts','../../dsh/packages/api/session-controller/src/agent.ts'),@('../../src/commands.ts','../../dsh/packages/api/session-controller/src/commands.ts'),@('../../src/control.ts','../../dsh/packages/api/session-controller/src/control.ts'),@('../../src/client/sessions/session.ts','../../dsh/packages/api/session-controller/src/client/sessions/session.ts'),@('../../src/client/sessions/remotes.ts','../../dsh/packages/api/session-controller/src/client/sessions/remotes.ts'),@('../../src/types.ts','../../dsh/packages/api/session-controller/src/types.ts')); $counts = foreach ($pair in $pairs) { [pscustomobject]@{New=$pair[0];Old=$pair[1];NewCount=([regex]::Matches($text,[regex]::Escape($pair[0]))).Count;OldCount=([regex]::Matches($text,[regex]::Escape($pair[1]))).Count} }; foreach ($pair in $pairs) { $text = $text.Replace($pair[0], $pair[1]) }; $sha = [System.Security.Cryptography.SHA256]::Create(); $transformedHash = [Convert]::ToHexString($sha.ComputeHash($utf8.GetBytes($text))).ToLowerInvariant(); $sourceHash = (Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant(); $fixtureHash = (Get-FileHash -LiteralPath $fixturePath -Algorithm SHA256).Hash.ToLowerInvariant(); $counts | Format-Table -AutoSize; [pscustomobject]@{SourceBytes=(Get-Item -LiteralPath $sourcePath).Length;SourceSHA256=$sourceHash;FixtureBytes=(Get-Item -LiteralPath $fixturePath).Length;FixtureSHA256=$fixtureHash;ReverseMappedSHA256=$transformedHash;WholeByteEqual=($transformedHash -eq $sourceHash)} | Format-List
```

最终静态检查：

```powershell
$base = 'D:\Lawbeach\lawbench-A\dsh\packages'; $paths = @("$base\core\agent-loop\src\inbox.ts","$base\api\session-controller\src\agent.ts","$base\api\session-controller\src\commands.ts","$base\api\session-controller\src\control.ts","$base\api\session-controller\src\client\sessions\session.ts","$base\api\session-controller\src\client\sessions\remotes.ts","$base\api\session-controller\src\types.ts"); $results = foreach ($path in $paths) { [pscustomobject]@{Exists=(Test-Path -LiteralPath $path);Path=$path} }; $results | Format-Table -AutoSize
$paths = @('D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-echo-native.config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153\native-fixture-20261027-011550.md'); $results = foreach ($path in $paths) { $item = Get-Item -LiteralPath $path; [pscustomobject]@{Bytes=$item.Length;SHA256=(Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant();Path=$path} }; $results | Format-List
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\.pnpm' -Filter 'zod@4.4.3*' -Directory | Select-Object FullName,Name | Format-Table -AutoSize
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\.pnpm' -Filter 'zod@4.4.3*' -Directory | ForEach-Object { $packageJson = Join-Path $_.FullName 'node_modules\zod\package.json'; [pscustomobject]@{PackageJson=$packageJson;Exists=(Test-Path -LiteralPath $packageJson)} } | Format-List
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh' -Force | Where-Object { $_.Name -in @('.env','.env.local','.env.test','.env.test.local') } | Select-Object Name,Length | Format-Table -AutoSize
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\.pnpm\zod@4.4.3\node_modules\zod\package.json' -Pattern '"version"\s*:\s*"4\.4\.3"' | Select-Object LineNumber,Line
```

非零命令：

| 编号 | 命令 | 退出码/结果 |
|---|---|---|
| N1 | `git status --short --branch` | 1；Git 无法 chdir 到共享 worktree 的 `dsh` 子模块，`Permission denied`，`git status --porcelain=2` 失败。未换替代 Git 命令、未改锁/权限。 |
| N2 | `rg -n "T31|ControlProjection|control projection|control-echo" 'D:\Lawbeach\lawbench-A\docs\plan\lawbench-工单集-第一版开发-20260928.md'` | 1；无匹配。 |
| N3 | `Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures' -Force | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize` | 1；创建前目录不存在，符合预期。 |
| N4 | 首次 artifact hash 脚本（以 `foreach (...) { ... } | Format-Table` 结尾） | 1；PowerShell ParserError（空管道元素）。 |
| N5 | 首次 capture/current pair hash 脚本（以 `foreach (...) { ... } | Format-List` 结尾） | 1；PowerShell ParserError（空管道元素）。 |
| N6 | 首次四路径存在性脚本（以 `foreach (...) { ... } | Format-Table` 结尾） | 1；PowerShell ParserError（空管道元素）。 |
| N7 | `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-material-admission.client.spec.ts' -TotalCount 60`，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`。未用替代 shell 重试该读取；未改沙箱、审批或 ACL。 |

用户给定的 dirty 状态由既有 `A-tracked-before.patch`（292,776 字节）和 `A-tracked-before.stderr.txt`（1,110 字节）保全；本次未覆盖或删除。顶层 Git status 被共享 worktree 子模块权限阻断后，本执行者只按指定新路径写四件，没有改动旧文件或索引。
