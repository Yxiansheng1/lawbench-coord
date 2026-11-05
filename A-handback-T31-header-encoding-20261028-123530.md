# A 线交回：T31 header 编码观察修正

状态：`OBSERVER_FIX_AUTHORED_STATIC_ONLY`

本执行者完成了有界观察器修正，但按执行令未运行任何运行期命令：Node/Python/TSX/导入/解析器/AST/tsc/测试/构建/prepare/probe/GUI/HTTP/模型/Key/SSH 均为 0。没有产品 PASS、whole-T31 PASS 或打包授权。打包保持 HOLD。

## 写入面

仅写以下三个路径：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\root-header-encoding-20261028-123530.md`
3. `D:\Lawbeach\lawbench-coord\A-handback-T31-header-encoding-20261028-123530.md`

未改 README、旧报告、源码夹具、事件、ID、cwd、27 条原始前缀、native end seed、compaction/fork/R/summary/checkpoint、provider/model、MAX 256/2 POST、网络门、凭证路径、清理、pins、产品、SDK、配置、运行时、测试或构建。未执行任何 Git 写命令；未 add/commit/rebase/stash/reset/clean/checkout/push，未改锁/权限/审批。

## 修正结果

- `LogicalSourceHeader = Omit<SourceHeader, 'type'>` 只作为已验证原生逻辑 header 的最小边界类型；物理 `SourceHeader` 保留 `type`。
- `ProductionSetup.encodeSourceHeader()` 直接转发已导入的 `PersistenceFormatModule.toHeaderLine()`。
- 同一个 `restored.header` 经该生产编码器一次转换为物理 header，再与 `parsedSource.header` 做精确深比较。
- 抛错和 `restore.sourceHeaderEqual` 共用同一个 `sourceHeaderEqual` 值。
- 没有手工加 `type`、字段白名单、JSON strip、expected fallback、header 重写或 unknown 转换绕过比较。

修改前观察器：72535 字节，SHA-256 `4A6E9E7943FA9DB0289FE14C4A663B00AF008ACBF9602D1314DC4314D6087EBA`。修改后：72982 字节、2079 行、无 UTF-8 BOM，SHA-256 `1A725BF2572B582B86D89C250E94F010063840DF8CD4E498B57ED97EFBBA7A3C`。

生产格式源码 SHA-256 保持 `87D536EAD041FB953F866E0191A79B4DBBBC510AEE1461706F9CDC2E4C46A038`；12059 字节原始会话 SHA-256 保持 `E07870975267497A8AB19B7836D01F549D48EFFE161C55B8E63BF669616B5DEE`。

## 既有证据复用

`run-nLz6eF` 的 12059 字节原始/复制文件和事件前缀均一致；其失败仅为观察器直接比较逻辑 header 与物理首行。该 run 未进入 compaction，网络与模型 POST 均为 0。`run-bQNtlj` 是更早的 PiAi 模块形状失败。两份旧报告均未改写作废。

根编排仍需按令自行审计全部源码/delta/命令/setup/cleanup，再做 fresh preflight；只有 fresh preflight 成功后，才允许真实 compaction/fork 的最大 2 次 POST 运行。

## 阻碍与审计事项

- 执行令所列前置记录 `D:/Lawbeach/lawbench-coord/T31HeaderEncoding-20261028-123530.md` 不存在。未创建替代文件，也未声称读过。
- 普通仓库级 Git status 因嵌套子模块 `modules/dsh` 权限拒绝而非零退出：`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。随后仅用 `--ignore-submodules=all` 做只读状态核验。
- 工作树在开工时已有大量 modified/untracked 项；本执行者未清理、未暂存、未覆盖无关修改。
- 命令执行中发生过一次误用 Bash wrapper 和两次错误 shell 路径；它们均未产生源码或正式证据写入，输出未用作验证证据。之后恢复执行令指定 PowerShell，并复核了关键事实。

## 原始命令记录

以下为本次执行者实际发出的 PowerShell 命令（按批次记录；`exit` 为非零时明确标注）：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T31-header-encoding-order-20261028-123530.md' -Raw

Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31HeaderEncoding-20261028-123530.md' -Raw
git status --short --untracked-files=all
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts' | Select-Object FullName,Length,LastWriteTime | Format-List

Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -File -Filter '*T31HeaderEncoding*' | Select-Object -ExpandProperty FullName
git -c submodule.recurse=false status --short --untracked-files=all --ignore-submodules=all
rg -n -C 5 "PersistenceFormatModule|ProductionSetup|SourceHeader|sourceHeaderEqual|headerEqual|restored\.header|parsedSource|toHeaderLine|fromHeaderLine" 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'
rg --files -g 'producer-format.ts' -g '!node_modules' 'D:\Lawbeach\lawbench-A' 'D:\Lawbeach\lawbench'

$p='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $lines=Get-Content -LiteralPath $p; for($i=80;$i -le 130;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }; for($i=380;$i -le 435;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }; for($i=1080;$i -le 1165;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }; for($i=1558;$i -le 1585;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -File | Where-Object { $_.Name -like '*T31*' } | Sort-Object LastWriteTime -Descending | Select-Object -First 40 Name,Length,LastWriteTime | Format-Table -AutoSize
Get-ChildItem -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217' -File | Sort-Object Name | Select-Object Name,Length,LastWriteTime | Format-Table -AutoSize
rg -n "producer-format|PersistenceFormatModule|node_modules/.+persistence" 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217'

$p='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $lines=Get-Content -LiteralPath $p; for($i=0;$i -le 100;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }
$p='D:\Lawbeach\lawbench-A\dsh\packages\session\session-persistence-jsonl\src\format.ts'; Get-Item -LiteralPath $p | Select-Object FullName,Length,LastWriteTime | Format-List; Get-FileHash -LiteralPath $p -Algorithm SHA256 | Select-Object Hash | Format-List; $lines=Get-Content -LiteralPath $p; for($i=0;$i -lt $lines.Count;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }
Get-ChildItem -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217' | Select-Object Mode,Name,Length,LastWriteTime | Format-Table -AutoSize
git -c submodule.recurse=false diff -- 'docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/native-genuine-compacted-fork.mts'

rg -n -C 16 "return \{|copyOriginalSession|reopenPersistedEvents|workspaceRoot" 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'
Get-ChildItem -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF' -File -Recurse | Sort-Object FullName | Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize
Get-ChildItem -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-bQNtlj' -File -Recurse | Sort-Object FullName | Select-Object FullName,Length,LastWriteTime | Format-Table -AutoSize
$p='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $bytes=[System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $p)); $sha=[System.Security.Cryptography.SHA256]::HashData($bytes); [pscustomobject]@{Bytes=$bytes.Length;SHA256=[Convert]::ToHexString($sha);LastWriteTime=(Get-Item -LiteralPath $p).LastWriteTime.ToString('o')} | Format-List

Get-Content -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF\report.json' -Raw
Get-Content -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-bQNtlj\report.json' -Raw
Get-ChildItem -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF' -File -Recurse | ForEach-Object { '{0}`t{1}`t{2}' -f $_.FullName,$_.Length,$_.LastWriteTime.ToString('o') }
```

上述最后一条曾以 `shell=bash` 执行，结果为 `exit 1`、`E_ACCESS_DENIED`，未用于证据。

```powershell
$a='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $b='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF\report.json'; $c='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-bQNtlj\report.json'; foreach($p in @($a,$b,$c)){ $item=Get-Item -LiteralPath $p; $sha=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash; [pscustomobject]@{Path=$p;Bytes=$item.Length;SHA256=$sha;LastWriteTime=$item.LastWriteTime.ToString('o')} } | Format-List
```

该次使用错误 shell 路径，PowerShell ParserError，`exit 1`；未执行有效哈希命令。

```powershell
rg -n -C 5 "export type SessionId|interface SessionHeader|type SessionHeader" 'D:\Lawbeach\lawbench-A\dsh\packages\core\session\src'
$p='docs\plan\evidence\T31\NativeRealConversation-20261028-000823\run-RTmLl7\sessions\--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--\session-97c67db2-b8a6-428b-be48-04b4144d10bd\session.v4.jsonl'; Get-Item -LiteralPath $p | Select-Object FullName,Length,LastWriteTime | Format-List; Get-Content -LiteralPath $p -TotalCount 1
Get-ChildItem -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF' -File -Recurse | ForEach-Object { '{0}`t{1}`t{2}' -f $_.FullName,$_.Length,$_.LastWriteTime.ToString('o') }
$items=@('docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts','docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF\report.json','docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-bQNtlj\report.json'); foreach($p in $items){ $item=Get-Item -LiteralPath $p; $sha=(Get-FileHash -LiteralPath $p -Algorithm SHA256).Hash; [pscustomobject]@{Path=$p;Bytes=$item.Length;SHA256=$sha;LastWriteTime=$item.LastWriteTime.ToString('o')} } | Format-List
```

其中最后一条同样使用错误 shell 路径，PowerShell ParserError，`exit 1`；未产生证据。

```powershell
$p='D:\Lawbeach\lawbench-A\dsh\packages\core\session\src\types.ts'; $lines=Get-Content -LiteralPath $p; for($i=19;$i -le 39;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }; for($i=89;$i -le 135;$i++){ '{0,5}: {1}' -f ($i+1),$lines[$i] }
$p='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF\sessions\--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--\session-97c67db2-b8a6-428b-be48-04b4144d10bd\session.v4.jsonl'; Get-Content -LiteralPath $p -TotalCount 1
Get-FileHash -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts' -Algorithm SHA256; Get-FileHash -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\session\session-persistence-jsonl\src\format.ts' -Algorithm SHA256
git -c submodule.recurse=false status --short --untracked-files=no --ignore-submodules=all -- 'docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/native-genuine-compacted-fork.mts' 'D:\Lawbeach\lawbench-A\dsh\packages\session\session-persistence-jsonl\src\format.ts'

rg -n -C 8 "LogicalSourceHeader|encodeSourceHeader|encodedRestoredHeader|sourceHeaderEqual" 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'
rg -n "toHeaderLine|type: 'session'|\.\.\.restored\.header|JSON\.parse\(|sourceHeaderEqual:" 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'
git -c submodule.recurse=false status --short --untracked-files=all --ignore-submodules=all -- 'docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/native-genuine-compacted-fork.mts' 'docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/root-header-encoding-20261028-123530.md' 'D:/Lawbeach/lawbench-A/dsh/packages/session/session-persistence-jsonl/src/format.ts'
Get-FileHash -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts' -Algorithm SHA256; Get-FileHash -LiteralPath 'dsh\packages\session\session-persistence-jsonl\src\format.ts' -Algorithm SHA256; Get-FileHash -LiteralPath 'docs\plan\evidence\T31\NativeRealConversation-20261028-000823\run-RTmLl7\sessions\--D-Lawbeach-lawbench-A-docs-plan-evidence-T31-NativeRealConversation-20261028-000823-run-RTmLl7-workspace--\session-97c67db2-b8a6-428b-be48-04b4144d10bd\session.v4.jsonl' -Algorithm SHA256

$p='docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $i=Get-Item -LiteralPath $p; $b=[System.IO.File]::ReadAllBytes($p); [pscustomobject]@{Bytes=$i.Length;Lines=(Get-Content -LiteralPath $p).Count;UTF8BOM=($b.Length -ge 3 -and $b[0] -eq 0xEF -and $b[1] -eq 0xBB -and $b[2] -eq 0xBF);LastWriteTime=$i.LastWriteTime.ToString('o')} | Format-List
Get-Date -Format 'yyyy-MM-ddTHH:mm:ssK'
Get-FileHash -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-nLz6eF\report.json' -Algorithm SHA256; Get-FileHash -LiteralPath 'docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\run-bQNtlj\report.json' -Algorithm SHA256
```

非零/阻碍汇总：缺失前置记录 1 次；普通 Git status 子模块权限拒绝 1 次；误用 Bash wrapper 1 次；错误 shell 路径导致 ParserError 2 次；`rg --files` 无匹配 1 次。其余读取、定点检索和哈希命令成功。未把这些失败输出当作 PASS 证据。
