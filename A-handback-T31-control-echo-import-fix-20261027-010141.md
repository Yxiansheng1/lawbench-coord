# A 线交回：T31 control echo 导入字面量修正

状态：
`AUTHOR_BOUNDED_IMPORT_FIX_COMPLETE / STATIC_VERIFIED / RUNTIME_NOT_RUN / ROOT_EXECUTION_PENDING`

执行令：
`D:/Lawbeach/lawbench-coord/T31-control-echo-import-fix-order-20261027-010141.md`

## 交付结果

只修改了：

`D:/Lawbeach/lawbench-A/dsh-ext/finite-tests/t31-control-projection-echo.spec.ts`

| 项目 | 原始 | 最终 |
| --- | ---: | ---: |
| 字节数 | 20,003 | 19,982 |
| SHA-256 | `1879c9fb4fb23ef675426f3cc15ec1ec37f9e18b92901ffd2f785529fd650df7` | `35821cc2ee8356c326384efbb4176454d14d760797a966535d17b33edae54474` |

7 处 `../../../dsh/` 已逐字替换为 `../../dsh/`。最终文件与“原始留档全文
恰好替换 7 次”后的字节序列完全相等（`ExpectedBytesExact=true`）；旧前缀
计数 0，新前缀计数 7。断言、用例、夹具、sourceframes、序列、native R 逻辑、
animation-frame、清理和不可变输入守卫均未改。

文件仍为 UTF-8 无 BOM、LF 换行：536 个 LF、0 个 CRLF。7 处原始匹配的字节
偏移为 `351,746,847,951,1054,1168,1343`。7 个新导入目标均静态证实存在。

新增证据：

`D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlProjectionEcho-20261027-005153/import-correction-20261027-010141.md`

该证据文件 2,187 字节，SHA-256
`5569a9203dabded556438abea26ffaea808b133f38685c21a05aec9afae2aced`。

冻结 selector 未改：

`D:/Lawbeach/lawbench-A/dsh-ext/vitest.t31-control-projection-echo.config.mjs`

437 字节，SHA-256
`c3ab9a15d4ee319e0a20ce1fc81d07bdd2f94658f58819cf4b71f22dc3e83aed`。

## 验证边界

`RUNTIME_NOT_RUN`

本运行器没有运行 Node、Vitest、tsc、pytest、解析器、AST、导入、收集、列表、
自检、构建、prepare、serve、probe、HTTP、GUI、模型或安装。没有更换 API，
没有联系其他聊天，没有开始旧开工/安装/调研/全量测试。复用的事实仅为既有根方
静态灰度判读：7 个导入失败、产品非红、根方运行次数 0；本次只消除静态导入错误，
不把结果声称成产品绿。

## 原越权运行单列披露

原作者在一次运行禁止下，在错误 cwd `D:/Lawbeach/lawbench-A` 执行过一次
Node/Vitest。结果为 `No test files found`、0 个断言，不得作为根方证据，也不得
作为产品红或绿。本次没有重复该运行，没有修改原 job/status/raw/README/
`original-handback.md` 或旧正式产物。该披露与本次静态修正隔离。

## Git 与阻碍

Git 全程只读。没有执行 add/commit/rebase/stash/reset/clean/checkout/push，
没有暂存，没有修 index.lock、权限、ACL 或 writer lock。

普通 `git status` 因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝退出 1。
按要求记录为既有环境阻碍；随后仅用
`--no-optional-locks` 加 `--ignore-submodules=all` 做只读状态核对。工作树已有
dirty/untracked 均保留，未触碰范围外改动。

另一个非零发生在用猜测名称查找 selector 时：候选文件哈希先成功，但猜测的
`t31-control-echo-selector.json` 不存在，使该命令退出 1。未产生写入；随后按
437B 和冻结 SHA 在既有目录精确定位到真实 selector。

## 全部实际命令

每次 `exec_command` 均显式使用：
`C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe`，
`login=false`，managed 隔离。以下为实际命令原文；除明确标出的两次非零外均退出 0。

1. 读取唯一执行令：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-control-echo-import-fix-order-20261027-010141.md'
```

2. 首次哈希核对；候选成功，但猜测的 selector 路径不存在，命令退出 1：

```powershell
$candidate = 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $selector = 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; Get-FileHash -Algorithm SHA256 -LiteralPath $candidate | Select-Object Path,Hash; Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-echo-selector.json' | Select-Object Path,Hash
```

3. 统计错误前缀并读取导入行：

```powershell
$p = 'D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $text = Get-Content -Raw -LiteralPath $p; $matches = [regex]::Matches($text, '\.\./\.\./\.\./dsh/'); [pscustomobject]@{BadPrefixCount=$matches.Count; ByteLength=(Get-Item -LiteralPath $p).Length}; Select-String -LiteralPath $p -Pattern 'from\s+''[^'']*dsh/' | ForEach-Object { '{0}:{1}' -f $_.LineNumber, $_.Line.Trim() }
```

4. 首次普通 Git 状态；子模块路径权限拒绝，命令退出 1：

```powershell
git status --short; git status --branch --short
```

5. 用猜测产物名检查 `dsh` 目标，得到 false：

```powershell
$base='D:\Lawbeach\lawbench-A\dsh'; @('control-projection-echo','control-projection-echo-fixture','control-projection-echo/session','control-projection-echo/control-descriptor') | ForEach-Object { $p=Join-Path $base $_; [pscustomobject]@{Path=$p;Exists=(Test-Path -LiteralPath $p)} }; Get-ChildItem -LiteralPath $base -Force | Where-Object { $_.Name -like '*control*' -or $_.Name -like '*projection*' -or $_.Name -like '*echo*' } | Select-Object Name,FullName,Length,PSIsContainer
```

6. 只读 Git 状态，忽略受保护子模块：

```powershell
git --no-optional-locks status --short --ignore-submodules=all; git --no-optional-locks status --branch --short --ignore-submodules=all
```

7. 在 `finite-tests` 中按 437B 和名称窄查 selector：

```powershell
$dir='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests'; Get-ChildItem -LiteralPath $dir -File | Where-Object { $_.Length -eq 437 } | ForEach-Object { $h=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash; [pscustomobject]@{Name=$_.Name;FullName=$_.FullName;Length=$_.Length;SHA256=$h} }; Get-ChildItem -LiteralPath $dir -File -Filter '*selector*' | Select-Object Name,FullName,Length
```

8. 静态解析 7 个导入并核对旧/新目标：

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $specDir=Split-Path -Parent $p; $text=Get-Content -Raw -LiteralPath $p; foreach($m in [regex]::Matches($text,"from\s+'([^']*dsh/[^']+)'")){ $rel=$m.Groups[1].Value; $current=[System.IO.Path]::GetFullPath((Join-Path $specDir $rel)); $correct=[System.IO.Path]::GetFullPath((Join-Path $specDir ($rel -replace '^\.\./\.\./\.\./dsh/','../../dsh/'))); [pscustomobject]@{Literal=$rel;CurrentExists=(Test-Path -LiteralPath $current);CorrectExists=(Test-Path -LiteralPath $correct);CorrectPath=$correct} }
```

9. 检查编码/换行并计算 7 次替换后的预期哈希：

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $bytes=[System.IO.File]::ReadAllBytes($p); $hasBom=$bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF; $lf=0; $crlf=0; for($i=0;$i -lt $bytes.Length;$i++){ if($bytes[$i] -eq 10){$lf++; if($i -gt 0 -and $bytes[$i-1] -eq 13){$crlf++}} }; $text=[System.Text.UTF8Encoding]::new($false,$true).GetString($bytes); $expectedText=$text.Replace('../../../dsh/','../../dsh/'); $expectedBytes=[System.Text.UTF8Encoding]::new($false).GetBytes($expectedText); $sha=[System.Security.Cryptography.SHA256]::Create(); $expectedHash=([System.BitConverter]::ToString($sha.ComputeHash($expectedBytes))).Replace('-','').ToLowerInvariant(); [pscustomobject]@{HasUtf8Bom=$hasBom;ByteLength=$bytes.Length;ExpectedByteLength=$expectedBytes.Length;LFCount=$lf;CRLFCount=$crlf;ExpectedSHA256=$expectedHash}; $sha.Dispose()
```

10. 窄查 `dsh-ext`、旧证据目录和既有输出目录：

```powershell
$dirs=@('D:\Lawbeach\lawbench-A\dsh-ext','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153','C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141'); foreach($d in $dirs){ if(Test-Path -LiteralPath $d){ Get-ChildItem -LiteralPath $d -File -Force | Where-Object { $_.Name -match 't31|control|selector|echo|ImportFix' } | ForEach-Object { $hash=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash; [pscustomobject]@{Directory=$d;Name=$_.Name;Length=$_.Length;SHA256=$hash} } } else { [pscustomobject]@{Directory=$d;Name='<MISSING>';Length=$null;SHA256=$null} } }
```

11. 读取候选文件前 32 行：

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; Get-Content -LiteralPath $p -TotalCount 32
```

12. 计算 7 个错误前缀的字节偏移：

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $bytes=[System.IO.File]::ReadAllBytes($p); $pattern=[System.Text.Encoding]::UTF8.GetBytes('../../../dsh/'); $positions=New-Object System.Collections.Generic.List[int]; for($i=0;$i -le $bytes.Length-$pattern.Length;$i++){ $ok=$true; for($j=0;$j -lt $pattern.Length;$j++){ if($bytes[$i+$j] -ne $pattern[$j]){$ok=$false;break} }; if($ok){$positions.Add($i)} }; [pscustomobject]@{Offsets=($positions -join ',');Count=$positions.Count}
```

13. 以 JSON 重取窄目录清单及哈希：

```powershell
$dirs=@('D:\Lawbeach\lawbench-A\dsh-ext','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153','C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141'); $rows=@(); foreach($d in $dirs){ if(Test-Path -LiteralPath $d){ foreach($f in Get-ChildItem -LiteralPath $d -File -Force | Where-Object { $_.Name -match 't31|control|selector|echo|ImportFix' }){ $rows += [pscustomobject]@{Directory=$d;Name=$f.Name;Length=$f.Length;SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $f.FullName).Hash} } } else { $rows += [pscustomobject]@{Directory=$d;Name='<MISSING>';Length=$null;SHA256=$null} } }; $rows | ConvertTo-Json -Depth 3
```

14. 按 437B 精确查找 selector：

```powershell
$dirs=@('D:\Lawbeach\lawbench-A\dsh-ext','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153','C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141'); $rows=@(); foreach($d in $dirs){ if(Test-Path -LiteralPath $d){ foreach($f in Get-ChildItem -LiteralPath $d -File -Force | Where-Object { $_.Length -eq 437 }){ $rows += [pscustomobject]@{Directory=$d;Name=$f.Name;Length=$f.Length;SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $f.FullName).Hash} } } }; $rows | ConvertTo-Json -Depth 3
```

15. 列出既有输出留档及哈希：

```powershell
$d='C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141'; Get-ChildItem -LiteralPath $d -File -Force | ForEach-Object { [pscustomobject]@{Name=$_.Name;Length=$_.Length;SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash} } | ConvertTo-Json -Depth 3
```

16. 列出既有 A 线证据及哈希：

```powershell
$d='D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153'; Get-ChildItem -LiteralPath $d -File -Force | ForEach-Object { [pscustomobject]@{Name=$_.Name;Length=$_.Length;SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash} } | ConvertTo-Json -Depth 3
```

17. 只读既有状态与根方静态灰度判读：

```powershell
Get-Content -Raw -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141\original-status.json'; Get-Content -Raw -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141\root-static-fixture-gray.json'
```

18. 只读原正式交回：

```powershell
Get-Content -Raw -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141\original-handback.md'
```

随后以 `apply_patch` 物理替换候选文件的 7 行导入字面量；未运行任何命令链。

19. 与原始留档替换 7 次后的预期字节做逐字节比较：

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $before='C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141\test-before.ts'; $actual=[System.IO.File]::ReadAllBytes($p); $orig=[System.IO.File]::ReadAllBytes($before); $old=[System.Text.Encoding]::UTF8.GetBytes('../../../dsh/'); $new=[System.Text.Encoding]::UTF8.GetBytes('../../dsh/'); $stream=New-Object System.IO.MemoryStream; $i=0; $hits=0; while($i -lt $orig.Length){ $match=$false; if($i -le $orig.Length-$old.Length){ $match=$true; for($j=0;$j -lt $old.Length;$j++){ if($orig[$i+$j] -ne $old[$j]){$match=$false;break} } }; if($match){$stream.Write($new,0,$new.Length);$i += $old.Length;$hits++}else{$stream.WriteByte($orig[$i]);$i++} }; $expected=$stream.ToArray(); $stream.Dispose(); $sha=[System.Security.Cryptography.SHA256]::Create(); $actualHash=([BitConverter]::ToString($sha.ComputeHash($actual))).Replace('-','').ToLowerInvariant(); $sha.Dispose(); $text=[System.Text.UTF8Encoding]::new($false,$true).GetString($actual); [pscustomobject]@{OriginalSHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $before).Hash.ToLowerInvariant();ExpectedHits=$hits;ActualSHA256=$actualHash;ActualLength=$actual.Length;ExpectedLength=$expected.Length;ExpectedBytesExact=($actual.Length -eq $expected.Length -and [System.Linq.Enumerable]::SequenceEqual([byte[]]$actual,[byte[]]$expected));OldPrefixCount=([regex]::Matches($text,'\.\./\.\./\.\./dsh/')).Count;NewPrefixCount=([regex]::Matches($text,'\.\./\.\./dsh/')).Count;HasUtf8Bom=($actual.Length -ge 3 -and $actual[0] -eq 0xEF -and $actual[1] -eq 0xBB -and $actual[2] -eq 0xBF);CRLFCount=([regex]::Matches($text,"`r`n")).Count;LFCount=([regex]::Matches($text,"`n")).Count} | ConvertTo-Json -Depth 3
```

20. 静态核对 7 个新目标并复核 selector 哈希：

```powershell
$p='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $specDir=Split-Path -Parent $p; $text=Get-Content -Raw -LiteralPath $p; $rows=@(); foreach($m in [regex]::Matches($text,"from\s+'([^']*dsh/[^']+)'")){ $rel=$m.Groups[1].Value; $full=[System.IO.Path]::GetFullPath((Join-Path $specDir $rel)); $rows += [pscustomobject]@{Literal=$rel;Exists=(Test-Path -LiteralPath $full);Resolved=$full} }; $rows | ConvertTo-Json -Depth 3; Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-projection-echo.config.mjs' | Select-Object Path,Hash | ConvertTo-Json
```

21. 只读查看候选 diff/状态：

```powershell
git --no-optional-locks diff -- dsh-ext/finite-tests/t31-control-projection-echo.spec.ts; git --no-optional-locks status --short --ignore-submodules=all -- dsh-ext/finite-tests/t31-control-projection-echo.spec.ts dsh-ext/vitest.t31-control-projection-echo.config.mjs docs/plan/evidence/T31/ControlProjectionEcho-20261027-005153/import-correction-20261027-010141.md
```

候选和 selector 均为 untracked，所以 `git diff` 为空；两个文件的只读状态均为 `??`。

随后以 `apply_patch` 新增证据文件。

22. 读取候选、selector、证据的最终长度与哈希：

```powershell
$paths=@('D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts','D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-projection-echo.config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153\import-correction-20261027-010141.md'); $rows=@(); foreach($p in $paths){ $item=Get-Item -LiteralPath $p; $rows += [pscustomobject]@{Path=$item.FullName;Length=$item.Length;SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant()} }; $rows | ConvertTo-Json -Depth 3
```

随后以 `apply_patch` 新增本交回文件。

23. 最终静态核验（在交付前执行）：

```powershell
$candidate='D:\Lawbeach\lawbench-A\dsh-ext\finite-tests\t31-control-projection-echo.spec.ts'; $before='C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ControlEchoImportFix-20261027-010141\test-before.ts'; $selector='D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-projection-echo.config.mjs'; $evidence='D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153\import-correction-20261027-010141.md'; $handback='D:\Lawbeach\lawbench-coord\A-handback-T31-control-echo-import-fix-20261027-010141.md'; $actual=[System.IO.File]::ReadAllBytes($candidate); $orig=[System.IO.File]::ReadAllBytes($before); $old=[System.Text.Encoding]::UTF8.GetBytes('../../../dsh/'); $new=[System.Text.Encoding]::UTF8.GetBytes('../../dsh/'); $stream=New-Object System.IO.MemoryStream; $i=0; $hits=0; while($i -lt $orig.Length){ $match=$false; if($i -le $orig.Length-$old.Length){ $match=$true; for($j=0;$j -lt $old.Length;$j++){ if($orig[$i+$j] -ne $old[$j]){$match=$false;break} } }; if($match){$stream.Write($new,0,$new.Length);$i += $old.Length;$hits++}else{$stream.WriteByte($orig[$i]);$i++} }; $expected=$stream.ToArray(); $stream.Dispose(); $text=[System.Text.UTF8Encoding]::new($false,$true).GetString($actual); $rows=@(); foreach($p in @($candidate,$selector,$evidence,$handback)){ $item=Get-Item -LiteralPath $p; $rows += [pscustomobject]@{Name=$item.Name;Length=$item.Length;SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $p).Hash.ToLowerInvariant()} }; [pscustomobject]@{ReplacementHits=$hits;ExpectedBytesExact=($actual.Length -eq $expected.Length -and [System.Linq.Enumerable]::SequenceEqual([byte[]]$actual,[byte[]]$expected));OldPrefixCount=([regex]::Matches($text,'\.\./\.\./\.\./dsh/')).Count;NewPrefixCount=([regex]::Matches($text,'\.\./\.\./dsh/')).Count;Files=$rows} | ConvertTo-Json -Depth 5
```

最终运行事实：`RUNTIME_NOT_RUN`。
