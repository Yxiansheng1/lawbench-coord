# B 线交回：T18 pre-issue section 最终源文件修正

## 结论

`SOURCE_ONLY_FINAL_FIX_COMPLETE_NOT_RUN`

执行令点名的两项源准备缺陷均已完成有界修正。未运行 JavaScript、Node、Python、
TypeScript、AST/BAST、import、check、test、build、HTTP、模型、GUI、SSH、DPAPI、
环境密钥读取或进程探测，也未执行任何 Git 写操作。

本交回只表示 B 线源文件和字节身份已可交主编排复核，不表示有限检查、ESM/BAST
准入、literal admission、实际 workflow、Gate 1 或完整 T18 通过。

## 授权写面与实际改动

本轮只写入以下四个路径：

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs`
3. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\README.md`
4. `D:\Lawbeach\lawbench-coord\B-handback-T18-pre-issue-section-final-fix-20261029-205133.md`

### manifest

使用 `Copy-Item` 将以下批准文件整体复制到目标，未编辑内容、未解析或重算 pin：

- 源：`D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json`
- 目标：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json`

结果：

```text
bytes=13579
sha256=487734032ca411e85e9935f33f69dd3d92744e7139211414d6a52c9d4d5ba4fe
```

目标与批准源的大小、SHA-256 相同。修正前目标为 `13570` 字节、
`516092888809b9e06794bd9fa1277a52a236e31b1533999ed7e3dfd2f923c33f`。

### 有限检查器

仅替换指定精确行：

```diff
-  return exactFive().replace(`${TABLE}\n\n`, '')
+  return exactFive().replace(`${TABLE}\n\n`, '问题项占位。\n\n')
```

其中 Unicode 转义由执行令明确要求落为实际汉字 `问题项占位。`；`\n\n` 保持源码中
的反斜杠加 `n` 字符。最终身份与根批准值一致：

```text
bytes=21111
sha256=bee136027de035cf3253b7087e1608fb210a665ad50e6566adfcfa6546a52be4
```

与修正前快照逐行比较，只有上述旧行和一行新行，没有其它文本差异。该改动只让缺表
负例在删表后保留非空小节，使失败仅由 `hasProblemListTable` 触发；负例预期键和
断言未改。

### README

将旧表述“当前 manifest 是修正前冻结快照，原样保留”更正为：当前 manifest 是根审计
批准文件的全字节替换，并列明 `13579` 字节与批准 SHA-256。另明确历史 `11741` 字节
defense 基线不等于本目录当前 manifest，说明缺表占位保留非空小节，并继续保持
`SOURCE_ONLY_NOT_RUN`，未宣称任何运行时通过。

## 冻结对象

以下两个对象在修改前后逐字节未变：

```text
native-pre-issue-check.mts
bytes=153232
sha256=86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536

b-service-pre-issue-check.py
bytes=53737
sha256=58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924
```

目标证据目录实际为原五个文件，未增删其它文件；执行令所称的第六项快照是协调
目录中的上一版交回件，不在该目标目录内。目录内最终身份：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `b-service-pre-issue-check.py` | 53737 | `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924` |
| `literalfixed-inputs.json` | 13579 | `487734032ca411e85e9935f33f69dd3d92744e7139211414d6a52c9d4d5ba4fe` |
| `native-pre-issue-check.mts` | 153232 | `86fb97730bedf145d18346b00b169d80960d814d908cc130f09ac4cc2f1e3536` |
| `README.md` | 8824 | `618106b09425fb20c18591ee768b16617d1148b7aa36f7943187951dac5234c1` |
| `section-check-finite.mjs` | 21111 | `bee136027de035cf3253b7087e1608fb210a665ad50e6566adfcfa6546a52be4` |

## 修改前状态

- 根审计 `root-review.json`：`SOURCE_REJECTED_BEFORE_ANY_RUNTIME_TWO_EXACT_PREPARATION_DEFECTS`。
- 根审计确认 `entry_and_service_accepted_unchanged=true`。
- 批准 manifest 在复制前已核对为 `13579` 字节及规定 SHA-256。
- 目标目录原有六个文件可读；五个既有实现/说明文件与协调目录快照逐字节一致。
- 工作树为 `line-B...origin/line-B [ahead 141, behind 1]`，存在大量既有修改和
  未跟踪交付。全部原样保留；目标证据目录本身在 Git 中仍是未跟踪目录。

## 实际执行命令

下列命令均使用执行令指定的完整原生 PowerShell
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
且 `login=false`。命令块内的多行在同一个 PowerShell 进程中执行。`apply_patch`
用于文本修正，不是 shell 命令。

```powershell
# C01 首次工具：只读正式执行令
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-pre-issue-section-final-fix-order-20261029-205133.md' -Raw -Encoding UTF8

# C02 只读根审计与有限检查器批准身份
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-review.json' -Raw -Encoding UTF8
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-finite-identity.json' -Raw -Encoding UTF8

# C03 只读目标目录初态及两个关键哈希
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039' -File | Select-Object Name,Length,LastWriteTime
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json','D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs' | Select-Object Path,Hash

# C04 只读检索目标行与 README 相关表述
rg -n -F "return exactFive().replace(`${TABLE}\n\n`, '')" 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
rg -n "manifest|13570|516092|13579|487734|source-only|source only|provenance|来源|状态" 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\README.md'

# C05 只读批准 manifest 哈希；同时误猜了两个不存在的快照文件名
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json'
(Get-Item -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json').Length
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\section-check-finite.mts','D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\service-check.mts' | Select-Object Path,Hash

# C06 只读列出协调目录快照实际文件名
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133' -Recurse -File | Select-Object FullName,Length

# C07 只读四个目标文件初态哈希
$base = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039'
Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $base 'literalfixed-inputs.json'),(Join-Path $base 'section-check-finite.mjs'),(Join-Path $base 'native-pre-issue-check.mts'),(Join-Path $base 'b-service-pre-issue-check.py') | ForEach-Object { '{0} {1} {2}' -f $_.Hash,$((Get-Item -LiteralPath $_.Path).Length),$_.Path }

# C08 只读定位 replace 行
$path = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$lines = Get-Content -LiteralPath $path -Encoding UTF8
for ($i = 0; $i -lt $lines.Count; $i++) { if ($lines[$i].Contains('return exactFive().replace')) { '{0}: {1}' -f ($i + 1), $lines[$i] } }

# C09 只读完整 README
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\README.md' -Raw -Encoding UTF8

# C10 只读 Git 状态，保全全部 dirty
git status --short --branch --ignore-submodules=all

# C11 只读比较批准 manifest 与旧目标
$approved = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json'
$current = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json'
Compare-Object -ReferenceObject (Get-Content -LiteralPath $current -Encoding UTF8) -DifferenceObject (Get-Content -LiteralPath $approved -Encoding UTF8) | Format-Table -AutoSize | Out-String -Width 240

# C12 只读检查四个授权目标当前存在状态
$targets = @(
'D:\Lawbeach\lawbench-coord\B-handback-T18-pre-issue-section-final-fix-20261029-205133.md',
'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json',
'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs',
'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\README.md'
)
foreach ($p in $targets) { '{0} exists={1}' -f $p,(Test-Path -LiteralPath $p) }

# C13 只读比较五个既有文件与快照
$snap = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133'
$dest = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039'
$names = 'b-service-pre-issue-check.py','literalfixed-inputs.json','native-pre-issue-check.mts','README.md','section-check-finite.mjs'
foreach ($n in $names) { $a = Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $snap $n); $b = Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $dest $n); '{0} same={1} target={2}' -f $n,($a.Hash -eq $b.Hash),$b.Hash }

# C14 唯一 manifest 写操作
Copy-Item -LiteralPath 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json' -Destination 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json' -Force

# C15 修改后只读核验四个身份
$base = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039'
$approved = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json'
$manifest = Join-Path $base 'literalfixed-inputs.json'
$finite = Join-Path $base 'section-check-finite.mjs'
$native = Join-Path $base 'native-pre-issue-check.mts'
$service = Join-Path $base 'b-service-pre-issue-check.py'
foreach ($p in @($manifest,$finite,$native,$service)) { $h = Get-FileHash -Algorithm SHA256 -LiteralPath $p; '{0} bytes={1} sha256={2}' -f ([IO.Path]::GetFileName($p)),((Get-Item -LiteralPath $p).Length),$h.Hash.ToLowerInvariant() }
'manifest_byte_equal=' + ([IO.File]::ReadAllBytes($approved) -ceq [IO.File]::ReadAllBytes($manifest))

# C16 修改后只读逐行差异
$old = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\section-check-finite.mjs'
$new = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$d = Compare-Object -ReferenceObject (Get-Content -LiteralPath $old -Encoding UTF8) -DifferenceObject (Get-Content -LiteralPath $new -Encoding UTF8) -SyncWindow 0
'diff_count=' + @($d).Count
$d | Format-List SideIndicator,InputObject | Out-String -Width 240

# C17 修改后只读检索 README 关键表述
$readme = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\README.md'
Select-String -LiteralPath $readme -Pattern 'SOURCE_ONLY_NOT_RUN','13579','487734032ca411','13570','问题项占位','root-approved-manifest-data.json' -Encoding UTF8 | ForEach-Object { '{0}:{1}' -f $_.LineNumber,$_.Line }

# C18 只读字节计数与文件首尾
$aPath = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\section-check-finite.mjs'
$bPath = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$a = [IO.File]::ReadAllBytes($aPath)
$b = [IO.File]::ReadAllBytes($bPath)
'old_bytes=' + $a.Length
'new_bytes=' + $b.Length
$lfOld = 0; $crOld = 0; $lfNew = 0; $crNew = 0
for ($i=0; $i -lt $a.Length; $i++) { if ($a[$i] -eq 10) {$lfOld++}; if ($a[$i] -eq 13) {$crOld++} }
for ($i=0; $i -lt $b.Length; $i++) { if ($b[$i] -eq 10) {$lfNew++}; if ($b[$i] -eq 13) {$crNew++} }
'old_LF={0} old_CR={1} new_LF={2} new_CR={3}' -f $lfOld,$crOld,$lfNew,$crNew
'old_first3=' + (($a[0..2] | ForEach-Object { $_.ToString('X2') }) -join ' ')
'new_first3=' + (($b[0..2] | ForEach-Object { $_.ToString('X2') }) -join ' ')
'old_last5=' + (($a[($a.Length-5)..($a.Length-1)] | ForEach-Object { $_.ToString('X2') }) -join ' ')
'new_last5=' + (($b[($b.Length-5)..($b.Length-1)] | ForEach-Object { $_.ToString('X2') }) -join ' ')

# C19 只读定位实际汉字占位字节
$p = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$bytes = [IO.File]::ReadAllBytes($p)
$needle = [Text.Encoding]::UTF8.GetBytes('问题项占位。')
$found = -1
for ($i=0; $i -le $bytes.Length-$needle.Length; $i++) { $ok=$true; for ($j=0; $j -lt $needle.Length; $j++) { if ($bytes[$i+$j] -ne $needle[$j]) { $ok=$false; break } }; if ($ok) { $found=$i; break } }
'placeholder_offset=' + $found
if ($found -ge 0) { (($bytes[$found..($found+$needle.Length+11)] | ForEach-Object { $_.ToString('X2') }) -join ' ') }

# C20 只读定位首个不同字节
$aPath = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\section-check-finite.mjs'
$bPath = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$a = [IO.File]::ReadAllBytes($aPath)
$b = [IO.File]::ReadAllBytes($bPath)
$n = [Math]::Min($a.Length,$b.Length)
for ($i=0; $i -lt $n; $i++) { if ($a[$i] -ne $b[$i]) { 'first_diff=' + $i; $s=[Math]::Max(0,$i-24); $e=[Math]::Min($a.Length-1,$i+80); 'old=' + (($a[$s..$e] | ForEach-Object { $_.ToString('X2') }) -join ' '); $e2=[Math]::Min($b.Length-1,$i+103); 'new=' + (($b[$s..$e2] | ForEach-Object { $_.ToString('X2') }) -join ' '); break } }

# C21 纠正缩进后只读核验有限检查器身份
$p = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$h = Get-FileHash -Algorithm SHA256 -LiteralPath $p
'bytes={0} sha256={1}' -f (Get-Item -LiteralPath $p).Length,$h.Hash.ToLowerInvariant()

# C22 只读核验 manifest 源/目标身份
$m = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\literalfixed-inputs.json'
$c = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\root-approved-manifest-data.json'
$mh = (Get-FileHash -Algorithm SHA256 -LiteralPath $m).Hash.ToLowerInvariant()
$ch = (Get-FileHash -Algorithm SHA256 -LiteralPath $c).Hash.ToLowerInvariant()
'manifest_target={0} bytes={1}' -f $mh,(Get-Item -LiteralPath $m).Length
'manifest_source={0} bytes={1}' -f $ch,(Get-Item -LiteralPath $c).Length
'hash_equal=' + ($mh -eq $ch)

# C23 再次只读逐行差异
$old = 'D:\Lawbeach\lawbench-coord\T18PreIssueSectionFinalFixInput-20261029-205133\section-check-finite.mjs'
$new = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\section-check-finite.mjs'
$d = Compare-Object -ReferenceObject (Get-Content -LiteralPath $old -Encoding UTF8) -DifferenceObject (Get-Content -LiteralPath $new -Encoding UTF8) -SyncWindow 0
'diff_count=' + @($d).Count
$d | Format-List SideIndicator,InputObject | Out-String -Width 240

# C24 只读最终目录清单与身份
$base = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039'
Get-ChildItem -LiteralPath $base -File | Sort-Object Name | ForEach-Object { $h = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName; '{0}|{1}|{2}' -f $_.Name,$_.Length,$h.Hash.ToLowerInvariant() }

# C25 只读最终 README 相关段落
$readme = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039\README.md'
Get-Content -LiteralPath $readme -Encoding UTF8 | Select-Object -First 55
Get-Content -LiteralPath $readme -Encoding UTF8 | Select-Object -Skip 125 -First 20

# C26 只读目标目录状态及交回件存在性
git status --short --ignore-submodules=all -- 'docs/plan/evidence/T18/PreIssueSectionContract-20261029-204039'
Test-Path -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T18-pre-issue-section-final-fix-20261029-205133.md'

# C27 交回后只读目录计数与五个文件身份
$base = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueSectionContract-20261029-204039'
'file_count=' + @(Get-ChildItem -LiteralPath $base -File).Count
Get-ChildItem -LiteralPath $base -File | Sort-Object Name | ForEach-Object { $h = Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName; '{0}|{1}|{2}' -f $_.Name,$_.Length,$h.Hash.ToLowerInvariant() }

# C28 交回后只读交回件身份及首尾
$f = 'D:\Lawbeach\lawbench-coord\B-handback-T18-pre-issue-section-final-fix-20261029-205133.md'
$item = Get-Item -LiteralPath $f
$h = Get-FileHash -Algorithm SHA256 -LiteralPath $f
'formal_exists=True bytes={0} sha256={1}' -f $item.Length,$h.Hash.ToLowerInvariant()
Get-Content -LiteralPath $f -Encoding UTF8 | Select-Object -First 12
Get-Content -LiteralPath $f -Encoding UTF8 | Select-Object -Last 12

# C29 交回后只读 Git 目标路径状态
git status --short --branch --ignore-submodules=all -- 'docs/plan/evidence/T18/PreIssueSectionContract-20261029-204039'
```

## 作者侧偏差与纠正

记录如下，均未触碰禁止运行面：

1. C05 误猜了两个不存在的快照文件名 `section-check-finite.mts` 和
   `service-check.mts`，只读哈希命令以非零退出；随后用 C06/C07 定位真实
   `section-check-finite.mjs` 与 `b-service-pre-issue-check.py`。
2. 第一次 README `apply_patch` 因上下文行合并方式不完全匹配而被拒绝，工具未写入；
   第二次按实际原文成功修正。
3. 第一次有限检查器修正把目标行缩进多加了 1 个空格，导致文件为 `21112` 字节、
   SHA-256 不符批准身份。通过 C18/C20 的只读字节定位后删去该空格，C21 最终精确
   命中 `21111` 字节和批准 SHA-256。
4. C15 的 `manifest_byte_equal` 用数组 `-ceq` 展示，结果列为空，不能作为明确布尔证据；
   最终以源/目标大小和 SHA-256 完全一致作为 manifest 全字节身份证据。

## Git 与权限边界

- Git 只执行过 `git status` 只读查询。
- 未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或
  `push`。
- 未暂存、未提交、未切换分支。
- 未修改锁、ACL、审批、沙箱或全局设置。
- 未启动或修改第二个 writer。

## 主编排后续门

按执行令，下一步由主编排执行，不由 B 线作者在本轮代跑：

1. 完整逆审计全部源文件、写面和命令账本。
2. 有限检查、ESM/BAST 准入与 literal admission。
3. **一次**原始实际 workflow。
4. 按实际证据决定能否通过对应门；本交回不预判结果。
