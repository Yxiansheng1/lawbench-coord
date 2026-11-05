# A → root：T31 私有运行时 wire 专项交回

批次：`T31-private-runtime-wire-20261027-002010`

状态：`A-COMPLETE / AWAITING_ROOT_FULL_INDEPENDENT_REVIEW_AND_FIRST_RUN`

Runtime：`NOT_RUN`

本回件不宣称测试通过、不宣称 GUI/完整 NativeHost RPC/queue/claim/attempt 或整个 T31 通过。Packaging 继续 HOLD。

## 新增文件与最终作者侧哈希

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `D:/Lawbeach/lawbench-A/dsh-ext/finite-tests/t31-private-runtime-wire.spec.ts` | 10,633 | `9077981A8FF897A5C1D0C70130D0E063D05E90F549A6A8B0B9B96A16F12C0FF8` |
| `D:/Lawbeach/lawbench-A/dsh-ext/vitest.t31-private-runtime-wire.config.mjs` | 807 | `7991869596676B1E6F6FECF8F2CB3493D72051E74AFF36792CABFE8BE2B3940F` |
| `D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeWire-20261027-002010/README.md` | 5,038 | `4C6CFCCF5EAB5F71C8C55A08786BEF66803120FE90B0E6F81FE8ECB6DA195BE6` |
| `D:/Lawbeach/lawbench-coord/A-handback-T31-private-runtime-wire-20261027-002010.md` | 本回件自身，未嵌入自哈希 | 由 root 读取后计算 |

工作区内没有新增或修改其他地方；工作区 edit 由三次 `apply_patch` 完成：先新增 test+selector，再新增 README，最后把 README 中两个待复核尺寸改成最终尺寸。本协调目录回件另由第四次 `apply_patch` 新增。

## 固定输入核对

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `manifest.json` | 58,186 | `1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae` |
| `typert.host.js` | 158,754 | `a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12` |
| `typert.remote-client.js` | 59,116 | `e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630` |

三份输入均与执行令一致。测试在任何动态导入前核对普通单链接文件、尺寸与 SHA-256，并在 `finally` 再次读取完整字节、尺寸、mtime 与 SHA-256 后整体比对。

## 交付内容

- 恰好两个 `it`。
- A：实际生成 Remote `session/prompt` strict request codec → `JSON.stringify`/`JSON.parse` → 实际生成 Host strict request codec，逐字段验证 `deliveryRestriction: "next-turn-only"`、`requestId`、`sessionId`、`mode`、`content`、时区保持。
- B：固定验证无限制 `queue`、`steer` 均被两侧接受且字段保持缺席；同一身份与内容加入非法 `deliveryRestriction: "next-turn"` 后被两侧拒绝；两侧结果 codec 接受 `accepted: true`、拒绝 `false`。
- 两侧均断言 `session/prompt` id、service、namespace、method、direct invocation、request/result strict mode 与生成类型符号。
- `requestId` 由当前源码真实 `NativeSession.beginSubmission` 产生，导入路径与冻结 native-scope HTTP consumer 相同。该 Session 明确只是 source-only ID producer；不是编译后的浏览器 Session。
- 无假 HostR/history/events，无 remote submission。remotes 为活动拒绝代理；handle 和 Session 在 `finally` 中 `abandon`、`dispose`，并断言 remote 访问数为零。

## zod / selector 事实

- 生成 Remote 和 Host JS 的首行均为 `import { z } from 'zod'`。
- 215235 的 `profile-node_modules` 下没有 `zod`。
- 会话控制器生产包 `package.json` 声明 `"zod": "^4.4.3"`；其 owning package 的 `node_modules/zod` 是一个 Junction，目标是 `D:/Lawbeach/lawbench-A/dsh/node_modules/.pnpm/zod@4.4.3/node_modules/zod`，实际 package version 为 `4.4.3`。
- 私有 selector import 并 spread `vitest.t31-scope-http.config.mjs`，保留 plugins、aliases、exclude、环境，只把 include 覆盖为本 finite-tests 文件。
- selector 用 owning package 的 `createRequire` 解析 `zod/package.json`，只追加一个精确 `/^zod$/` alias。没有安装、复制、全局 alias、resolution rewrite、额外 loader/plugin/framework，也没有改旧配置。

## 工作树与 Git

- 工作树原有大量 modified/untracked 文件，均按 dirty 保全；本批只新增上述四个允许文件。
- 顶层只读检查：`line-A...origin/line-A [ahead 93, behind 1]`。
- `git status --short --branch` 和 `git diff --stat` 在受限只读子模块元数据 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 上报 `Permission denied`。
- 随后用 `--ignore-submodules=all` 完成 top-level 只读核对。没有尝试修复 index.lock、权限、ACL、审批或 writer lock；没有执行任何 Git 写命令。
- 本交回不是 Git commit。没有 `add/commit/rebase/stash/reset/clean/checkout/push`。

## Root 首次运行命令（作者未执行）

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\vitest\vitest.mjs' run --config 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs' --maxWorkers=1 --no-file-parallelism --cache=false
```

root 必须先完整独立复核 fixture/setup/finally/import resolution/zod binding，再首次且仅一次执行该 selector。Import/依赖灰不是产品红；记录 exact facts，不改产品或旧测试。只有真实产品断言失败才可另行授权窄修源码。

## 作者实际 exec 命令流水

基线：除明确标注的 C13、C14、C36、C37 外，每条均使用指定完整 shell `C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe`、`login=false`、默认 managed sandbox、`workdir=D:/Lawbeach/lawbench-A`。

### 正常指定 shell

```powershell
# C01
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-private-runtime-wire-order-20261027-002010.md' -Raw

# C02
git status --short --branch

# C03
git diff --stat

# C04
$paths = @('D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeWire-20261027-002010\README.md','D:\Lawbeach\lawbench-coord\A-handback-T31-private-runtime-wire-20261027-002010.md'); $paths | ForEach-Object { [pscustomobject]@{ Path = $_; Exists = Test-Path -LiteralPath $_ } } | Format-Table -AutoSize

# C05
$base = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235'; $files = @((Join-Path $base 'manifest.json'),(Join-Path $base 'profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.host.js'),(Join-Path $base 'profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.remote-client.js')); $files | ForEach-Object { $f = Get-Item -LiteralPath $_; $h = Get-FileHash -LiteralPath $_ -Algorithm SHA256; [pscustomobject]@{ Path=$_.Substring($base.Length+1); Bytes=$f.Length; SHA256=$h.Hash.ToLower(); LastWriteUtc=$f.LastWriteTimeUtc.ToString('o') } } | Format-List

# C06
git status --short --branch --ignore-submodules=all

# C07
git diff --stat --ignore-submodules=all

# C08
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scope-http.config.mjs' -Raw

# C09
rg -n --hidden --glob '!node_modules/**' --glob '!docs/plan/evidence/**' "native-scope|beginSubmission|NativeSession" dsh-ext

# C10
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext' -Force | Select-Object Name,Length,Mode | Format-Table -AutoSize

# C11
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\tests\t31-native-scope-http.spec.ts' -Raw

# C12
rg -n -C 8 "deliveryRestriction|beginSubmission|abandon|dispose|strict|invocation|accepted" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.remote-client.js'

# C15
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.remote-client.js' -TotalCount 80

# C16
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.remote-client.js' | Select-Object -Skip 560 -First 150

# C17
rg -n -C 10 "deliveryRestriction|TYPERT_HOST|session/prompt|session/updateQueue|export const|accepted|invocation" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.host.js'

# C18
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.host.js' -TotalCount 100

# C19
rg -n -C 12 "class Session|beginSubmission|deliveryRestriction|updateQueue|PromptRequest|Queue" 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\client\sessions\session.ts' 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\types.ts'

# C20
$paths = @('D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\zod\package.json','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\zod','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\package.json','D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules\zod\package.json','D:\Lawbeach\lawbench-A\dsh\node_modules\zod\package.json'); foreach ($path in $paths) { "${path} => $(Test-Path -LiteralPath $path)" }

# C21
if (Test-Path -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\zod\package.json') { Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\zod\package.json' -TotalCount 50 }

# C22
if (Test-Path -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\package.json') { Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\package.json' -Raw }

# C23
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scoped-queued-steer.config.mjs' -Raw

# C24
rg -n --hidden --glob '!node_modules/**' --glob '!docs/plan/evidence/**' "pathToFileURL\(|dynamic import|import\(.*\.js|sha256.*mtime|createHash\('sha256'\)" dsh-ext/tests dsh-ext/finite-tests

# C25
$paths = @('D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\zod\package.json','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\zod','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\package.json','D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules\zod\package.json','D:\Lawbeach\lawbench-A\dsh\node_modules\zod\package.json'); foreach ($path in $paths) { "${path} => $(Test-Path -LiteralPath $path)" }

# C26
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules' -Force | Where-Object { $_.Name -like 'zod*' } | Select-Object Name,FullName,Mode,LinkType,Target | Format-List

# C27
if (Test-Path -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules\zod\package.json') { Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules\zod\package.json' -TotalCount 35 } elseif (Test-Path -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\zod\package.json') { Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\zod\package.json' -TotalCount 35 }

# C28
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules' -Force | Select-Object Name,Mode,LinkType,Target | Format-Table -AutoSize

# C29
rg -n -C 4 '"zod"|@deepseek-ai/dsh-api-session-controller' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\manifest.json'

# C30
rg -n -C 3 '"./package.json"|"exports"|"import"|"require"|"module"' 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules\zod\package.json'

# C31
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\node_modules\zod' | Select-Object FullName,LinkType,Target | Format-List

# C32
rg -n -C 6 "reject|safeParse|codec\.create|descriptors\.find|invocations\.find" dsh-ext/tests dsh/packages/api/session-controller/tests --glob '*.spec.ts' --glob '*.spec.tsx'

# C33
rg -n -C 8 "TYPERT_REMOTE|TYPERT.*invocations|codec.*create|safeParse" dsh/packages/api dsh-ext/tests --glob '*.ts' --glob '*.mjs'

# C34
git status --short --ignore-submodules=all | Select-String -Pattern 't31-private-runtime-wire|T31/PrivateRuntimeWire|A-handback-T31-private-runtime-wire'

# C35
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs' -Raw

# C38
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs' -Algorithm SHA256 | Select-Object Path,Hash | Format-List

# C39
git check-ignore -v -- 'dsh-ext/finite-tests/t31-private-runtime-wire.spec.ts'

# C40
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts' -Raw

# C41
git status --short --untracked-files=all --ignore-submodules=all | Select-String -Pattern 't31-private-runtime-wire|PrivateRuntimeWire|A-handback-T31-private-runtime-wire'

# C42
rg -n --hidden --glob '!node_modules/**' "vitest\.t31-scope-http|vitest\.t31-scoped-queued-steer|--config.*vitest\.t31|run --config" D:\Lawbeach\lawbench-A\docs\plan\evidence\T31 D:\Lawbeach\lawbench-A\docs\plan\evidence\T32 --glob '*.md' --glob '*.txt'

# C43
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\package.json' -TotalCount 120

# C44
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\.bin' -Force | Where-Object { $_.Name -match '^vitest' } | Select-Object Name,Mode,LinkType,Target | Format-List

# C45
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\scripts\test.mjs' -TotalCount 160

# C46
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeWire-20261027-002010\README.md' | Select-Object FullName,Length | Format-List

# C47
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeWire-20261027-002010\README.md' -Algorithm SHA256 | Select-Object Path,Hash | Format-List

# C48
git status --short --untracked-files=all --ignore-submodules=all | Select-String -Pattern 'finite-tests|vitest.t31-private-runtime-wire|PrivateRuntimeWire-20261027-002010'

# C49
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeWire-20261027-002010\README.md' | Select-Object FullName,Length | Format-List; Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeWire-20261027-002010\README.md' -Algorithm SHA256 | Select-Object Path,Hash | Format-List
```

### 指定 shell 偏差

```powershell
# C13：错误使用 shell=bash，立即 E_ACCESSDENIED，exit 1，无检索结果
rg -n -C 8 "deliveryRestriction|beginSubmission|abandon|dispose|strict|invocation|accepted" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-215235\profile-node_modules\@deepseek-ai\dsh-api-session-controller\lib\typert.host.js'

# C14：错误使用裸 shell=pwsh.exe；命令执行成功。输出为 dsh-ext/package.json 与 vitest.config.mjs
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\package.json' -Raw; Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.config.mjs' -Raw

# C36：错误使用 shell=bash，立即 E_ACCESSDENIED，exit 1，无文件哈希输出
Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs' -Algorithm SHA256 | Select-Object Path,Hash | Format-List

# C37：错误使用裸 shell=pwsh.exe；命令执行成功，输出 test/config 的静态文本检索
rg -n "it\(|include:|deliveryRestriction|pathToFileURL|path:|bytes:|sha256:|beginSubmission|abandon|dispose|safeParse|TYPERT" 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-private-runtime-wire.spec.ts' 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-private-runtime-wire.config.mjs'
```

这四个 shell 偏差没有触发 Node/Python/Vitest/tsc/import/build，没有改文件、沙箱、审批或 ACL。C13/C36 被环境拒绝；C14/C37 虽执行成功，但不能作为“每条均使用指定 shell”的合规宣称。

## 非零退出与含义

- C02、C03：exit 1，`git` 进入受限只读子模块元数据时 `Permission denied`；未修复，随后以 `--ignore-submodules=all` 完成顶层只读检查。
- C13、C36：exit 1，`Bash/E_ACCESSDENIED`，shell 偏差，无结果。
- C24：exit 1，因为当时 `dsh-ext/finite-tests` 尚不存在；不是测试失败。
- C39：exit 1，`git check-ignore` 未命中规则，表示该 finite-tests 文件没有被忽略；不是交付失败。

## 未运行项

- 未运行 Node、Python、Vitest、tsc、pytest、AST/parser/collect/list、任何 test/selfcheck/import of modules/build/prepare/serve/probe/HTTP/GUI/model/install/Git write。
- 未执行 root 的私有 selector 首次运行。
- 未重跑旧 source/unit/HTTP、25 outputs、P29、18 legacy、E50、guard/resolver/PDF 或其他全量验证。
- 未生成 GUI、RPC、queue/claim/attempt 或 packaging 证据。
