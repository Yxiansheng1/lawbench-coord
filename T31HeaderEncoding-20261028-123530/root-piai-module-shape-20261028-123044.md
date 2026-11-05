# T31 PiAI 模块形状静态修正

日期：2026-10-28（Asia/Taipei）

## 结论

已按执行令将
`docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/native-genuine-compacted-fork.mts`
中唯一错误表达式：

```ts
const PiAiModuleDefault = PiAiModule.default
```

改为：

```ts
const PiAiModuleDefault = PiAiModule
```

别名名称、插件调用 `live.plugin(PiAiModuleDefault, { ... })`、配置、注入、断言、固定输入针、256 token 上限、两次 POST 限制、fork、原生恢复、源会话复制、摘要、checkpoint、TTY/stdin、清理与 `finally` 均保持原字节。

本修正只处理已确认的消费者导入形状错误，不宣称产品通过、T31 通过或项目通过。未运行 preflight 或完整验证；这些由 root 在完整静态审计后使用已保存的 Key 执行。打包保持 HOLD。

## 字节基线

修改前：

- 长度：72,543 字节
- SHA-256：`CD7E1A4E3AC19574FA99FB002501A8AB63A43F319F35812C8F5FA26B4F940B51`
- 精确错误表达式出现次数：1

修改后：

- 长度：72,535 字节
- SHA-256：`4A6E9E7943FA9DB0289FE14C4A663B00AF008ACBF9602D1314DC4314D6087EBA`
- 精确新表达式出现次数：1
- 精确错误表达式出现次数：0

将修改后的唯一新表达式按字节还原为旧表达式，得到：

- 长度：72,543 字节
- SHA-256：`CD7E1A4E3AC19574FA99FB002501A8AB63A43F319F35812C8F5FA26B4F940B51`
- 与修改前整文件哈希完全相等：是

该逆向还原比较证明除指定表达式外，整个文件其余字节未变。

## 静态定位

修改后相关行：

```text
1107:    PiAiModule,
1151:  const PiAiModuleDefault = PiAiModule
1217:  await live.plugin(PiAiModuleDefault, {
```

另核对已接受消费者
`D:\Lawbeach\lawbench-coord\T31GenuineCompactedForkInput-20261028-115217\native-real-conversation.mts`：

- 长度：58,057 字节
- SHA-256：`80C603F94C42F19CE635D245FC0520559AA9BB72FED55D2EF91685AE4D3C2343`
- 第 1147 行直接使用 `await live.plugin(PiAiModule, {`

这与执行令给出的已接受导入契约一致。

## 实际读取和只读核对

Shell 始终为显式指定的 PowerShell，`login=false`：

```text
C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
```

工作目录始终为 `D:\Lawbeach\lawbench-A`。按实际调用顺序，完整命令账如下：

1. 完整读取本轮执行令：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T31-piai-module-shape-order-20261028-123044.md' -Raw
```

2. 读取令中指定的生产者索引；路径不存在，退出码 1：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31PiAiModuleShape-20261028-123044.md' -Raw
```

3. 三个并行只读调用：

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -File -Filter '*T31PiAiModuleShape*' | Select-Object Name,Length,LastWriteTimeUtc | Format-Table -AutoSize
```

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217' -File | Where-Object { $_.Name -in @('native-genuine-compacted-fork.mts','root-piai-module-shape-20261028-123044.md','accepted-setup.mts','producer-index.md') } | Select-Object Name,Length,LastWriteTimeUtc | Format-Table -AutoSize
```

```powershell
git status --short --untracked-files=normal
```

4. 三个并行只读调用，建立目标字节基线并核对关键行：

```powershell
$target = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $bytes = [System.IO.File]::ReadAllBytes($target); $sha = [System.Security.Cryptography.SHA256]::HashData($bytes); [pscustomobject]@{Length=$bytes.Length; SHA256=[Convert]::ToHexString($sha); LF=([regex]::Matches([System.Text.Encoding]::UTF8.GetString($bytes), "`n")).Count; CRLF=([regex]::Matches([System.Text.Encoding]::UTF8.GetString($bytes), "`r`n")).Count} | Format-List; Select-String -LiteralPath $target -Pattern 'PiAiModule(?:Default)?' | ForEach-Object { '{0}:{1}' -f $_.LineNumber, $_.Line }
```

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217' -File | Select-Object Name,Length,LastWriteTimeUtc | Sort-Object Name | Format-Table -AutoSize
```

```powershell
$target = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; Get-Content -LiteralPath $target -TotalCount 80
```

5. 只读目标设置段和两份同目录说明：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts' | Select-Object -Skip 1075 -First 165
```

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\README.md' -Raw
```

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\root-checkpoint-surface-field-20261028-120823.md' -Raw
```

6. 只读核对已接受消费者的完整字节和 PiAiModule 上下文：

```powershell
$p='D:\Lawbeach\lawbench-coord\T31GenuineCompactedForkInput-20261028-115217\native-real-conversation.mts'; $b=[System.IO.File]::ReadAllBytes($p); $h=[System.Security.Cryptography.SHA256]::HashData($b); [pscustomobject]@{Path=$p;Length=$b.Length;SHA256=[Convert]::ToHexString($h)} | Format-List; $lines=Get-Content -LiteralPath $p; $m=Select-String -LiteralPath $p -Pattern 'PiAiModule'; foreach($x in $m){ $start=[Math]::Max(0,$x.LineNumber-4); $end=[Math]::Min($lines.Count-1,$x.LineNumber+2); for($i=$start;$i -le $end;$i++){ '{0}:{1}' -f ($i+1),$lines[$i] } }
```

7. 三个并行只读核验，检查修改后哈希、按字节逆向还原和限定 Git 状态：

```powershell
$target='D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts'; $bytes=[System.IO.File]::ReadAllBytes($target); $sha=[System.Security.Cryptography.SHA256]::HashData($bytes); $newToken=[System.Text.Encoding]::UTF8.GetBytes("const PiAiModuleDefault = PiAiModule`n"); $oldToken=[System.Text.Encoding]::UTF8.GetBytes("const PiAiModuleDefault = PiAiModule.default`n"); $text=[System.Text.Encoding]::UTF8.GetString($bytes); $newCount=([regex]::Matches($text,[regex]::Escape([System.Text.Encoding]::UTF8.GetString($newToken)))).Count; $oldCount=([regex]::Matches($text,[regex]::Escape([System.Text.Encoding]::UTF8.GetString($oldToken)))).Count; $idx=$text.IndexOf([System.Text.Encoding]::UTF8.GetString($newToken),[StringComparison]::Ordinal); if($newCount -eq 1 -and $oldCount -eq 0 -and $idx -ge 0){$prefix=[System.Text.Encoding]::UTF8.GetBytes($text.Substring(0,$idx)); $suffix=[System.Text.Encoding]::UTF8.GetBytes($text.Substring($idx+[System.Text.Encoding]::UTF8.GetString($newToken).Length)); $restored=New-Object byte[] ($prefix.Length+$oldToken.Length+$suffix.Length); [Array]::Copy($prefix,0,$restored,0,$prefix.Length); [Array]::Copy($oldToken,0,$restored,$prefix.Length,$oldToken.Length); [Array]::Copy($suffix,0,$restored,$prefix.Length+$oldToken.Length,$suffix.Length); $restoredHash=[Convert]::ToHexString([System.Security.Cryptography.SHA256]::HashData($restored)); [pscustomobject]@{Length=$bytes.Length;SHA256=[Convert]::ToHexString($sha);NewTokenCount=$newCount;OldTokenCount=$oldCount;RestoredLength=$restored.Length;RestoredSHA256=$restoredHash;MatchesOriginal=($restoredHash -eq 'CD7E1A4E3AC19574FA99FB002501A8AB63A43F319F35812C8F5FA26B4F940B51')} | Format-List}; Select-String -LiteralPath $target -Pattern 'PiAiModule' | ForEach-Object { '{0}:{1}' -f $_.LineNumber,$_.Line }
```

```powershell
git diff --ignore-submodules=all --no-ext-diff --unified=3 -- 'docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/native-genuine-compacted-fork.mts'
```

```powershell
git status --short --ignore-submodules=all --untracked-files=normal -- 'docs/plan/evidence/T31/GenuineCompactedFork-20261028-115217/native-genuine-compacted-fork.mts'
```

修改通过一次 `apply_patch` 完成，仅替换上述一行。

未执行 Node、Python、TSX、import、parser、AST、测试、构建、prepare、probe、GUI、HTTP、模型、Key 读取或 SSH。实际运行次数为 0。未运行 Bash、别名包装、备用执行器或权限/安全/锁/策略变更。

## 阻碍与非零结果

1. 执行令指定的生产者索引
   `D:\Lawbeach\lawbench-coord\T31PiAiModuleShape-20261028-123044.md`
   不存在；`Get-Content` 退出码为 1。仅在协调目录以同名前缀做一次窄范围文件搜索，结果为零，未做广泛重新探索。
2. 初始只读 `git status --short --untracked-files=normal` 退出码为 1：
   `cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`，
   随后 `'git status --porcelain=2' failed in submodule dsh`。
   按令未修复锁或权限，未扩权。
3. 目标文件在 A 仓库中为未跟踪文件。使用 `--ignore-submodules=all` 的限定状态命令返回
   `?? ...native-genuine-compacted-fork.mts`；限定 `git diff` 为空，不能作为行差异证据。整文件逆向还原哈希是本次精确差异证据。

这些阻碍未触发安装、setup、legacy 运行器、锁/ACL/审批或沙箱修改。

## 后续

root 应完整审计精确差异和本备注所列全部实际命令，再使用已保存的 Key 重新执行一次无模型 preflight；preflight 通过后才运行规定的一次完整验证。

