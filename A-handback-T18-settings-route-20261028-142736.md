# A-handback: T18 设置读取消费者路由修正

状态：`COMPLETE_STATIC_CHANGE`

任务入口：`D:\Lawbeach\lawbench-coord\A-T18-settings-route-order-20261028-142736.md`

交回给：根主编排

## 结论

已在唯一获准的消费者中放行精确的无查询 `GET /api/settings`。修改后请求门仍只接受 scoped loopback 的精确端口及集合内精确方法/路径；没有放宽到 `/api/*`，没有加入 `PUT` 或连接测试。

本次是静态有界修正，不代表完整 workflow 已通过。实际有限运行仍由根主编排安排。

## 唯一源码改动

文件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts`

第 697 行：

```diff
-    ['GET', new Set(['/health'])],
+    ['GET', new Set(['/health', '/api/settings'])],
```

冻结输入：

- 路径：`D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts`
- 字节：`76652`
- SHA-256：`F3AB52077C41090124EB1440908483B716A40F74A8C14CFF3E572444B3F9B4B4`

当前源码：

- 路径：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts`
- 字节：`76669`
- SHA-256：`6B8313689B2386540D9409F67A03364E8A04ED7A321164DD4AEE7A975528AB47`

## 完整正向/逆向字节等价

固定旧行只出现 1 次，固定新行只出现 1 次。

正向：从冻结输入把旧行替换为新行，编码结果 76,669 字节，与当前文件 `SequenceEqual` 为 `True`；结果 SHA-256 为 `6B8313689B2386540D9409F67A03364E8A04ED7A321164DD4AEE7A975528AB47`。

逆向：从当前文件把新行替换回旧行，编码结果 76,652 字节，与冻结输入 `SequenceEqual` 为 `True`。

位置级证据：

- 共同前缀：`23105` 字节。
- 共同后缀：`53547` 字节。
- 前缀加后缀：`23105 + 53547 = 76652`，等于冻结输入全长。
- 差异仅为偏移 `23105` 处插入的 17 字节：ASCII `, '/api/settings'`，十六进制 `2C20272F6170692F73657474696E677327`。
- 编码：无 BOM；CRLF `0`；LF `2011`，与冻结输入相同。

因此，除该行追加的 17 字节外，其余源码字节与原输入完全相同；逆向恢复也完整通过。

## 静态契约证据

- `dsh-ext/host/index.ts:731` 的当前实现是 `getSettings(): await this.api('GET', '/api/settings')`。
- `native-reading-workflow.mts:1126-1130` 当前包装并转发 `remote.getSettings()`。
- `native-reading-workflow.mts:1588` 当前消费者调用 `await remote.getSettings()`。
- `b-service.py:227-234` 的 `GET_PATHS` 已含 `/health` 与 `/api/settings`。
- `b-service.py:265-272` 对 `/api/settings` 仅在无查询串时放行，否则拒绝为 `SETTINGS_QUERY`。
- 请求门仍要求 `http://127.0.0.1:<本次 ready.port>`，精确匹配 `method` 和 `pathname`，并强制 `redirect: 'error'`、`cache: 'no-store'`。

核对时以下冻结文件哈希为：

- `dsh-ext/host/index.ts`：`4A12F0E0176C05596A6620B6877F2A8E6D12F4C61081683FC70FFD4302A3D6B8`
- `b-service.py`：`87BE5A7C09D0E8CAFBA0B3A729885189C517DDC0EA9BDDB6B4C845CD7FDC3220`
- `fixed-inputs.json`：`7FA7EE7FDDCC8FFF0768A3DDE4B84EEF077C10AAEA2CC451E201469C5D4869E0`
- `README.md`：`17747AFA72596CC1AD37574C9C05AEC3CCDDC25FB8D916DDE1701D84CBE2F9E8`

## 写面

1. `apply_patch` 修改唯一源码行（旧行到新行）。
2. `apply_patch` 新建 `docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\settings-route-20261028-142736.md`。
3. `apply_patch` 新建本正式交回件。

除此之外没有文件写面。没有使用 PowerShell 写文件命令。未改 README、manifest、B 入口、主程序、旧 report、旧 formal、失败工件或 history。

## 状态与阻碍

- dirty 工作树在开工时已大量存在，全部保留，没有清理、回退或暂存。
- 初查 `git status` 返回码 `0`，但 Git 对若干超长证据路径给出 `Filename too long` warning；这是只读状态枚举阻碍，未尝试修复锁、路径、权限、ACL 或沙箱。
- 一个宽泛的 `b-service.py` 关键字读取输出被展示层截断，退出码仍为 `0`；随后用窄范围只读命令确认了 `GET_PATHS` 与无查询限制。
- 没有非零退出命令。没有 Git 写命令。没有第二 writer。
- 未联系其他聊天，未更换 API，未读取 Key、DPAPI、凭据、环境、history 或 rollout，未接触真实案卷。
- 未重演旧开工/安装/调研/全量测试；旧 `run-gb8yil` 事实仅按执行令引用，未重开或改写。
- 未执行任何运行期验证；以下禁区均为 `0`：Python、Node、import、parser、AST、compiler、tsc、tests、build、prepare、serve、probe、HTTP、model、GUI、SSH、selftest。

## 全部实际 Shell 命令与退出码

以下 17 条 `exec_command` 均使用绝对路径 PowerShell：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

均为 `login=false`，工作目录 `D:\Lawbeach\lawbench-A`。全部退出码 `0`，非零退出条数为 `0`。

1. 只读正式执行令：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-settings-route-order-20261028-142736.md'
```

2. 全工作树只读 dirty 初查：

```powershell
git status --short --untracked-files=all --ignore-submodules=all
```

3. 三个关键文件元数据：

```powershell
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts','D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts','D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts' | Select-Object FullName,Length,LastWriteTimeUtc | Format-Table -AutoSize
```

4. 三个关键文件初查哈希：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts','D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts','D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts' | Select-Object Path,Hash | Format-Table -AutoSize
```

5. 主程序设置路由静态读取：

```powershell
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts' -Pattern 'getSettings|/api/settings' -Context 4,8 | ForEach-Object { $_.ToString() }
```

6. 消费者相关路由静态读取：

```powershell
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts' -Pattern 'allowedLocal|getSettings|/api/settings|/health' -Context 4,8 | ForEach-Object { $_.ToString() }
```

7. 完整初查哈希值：

```powershell
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts','D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts','D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts' | ForEach-Object { '{0}|{1}|{2}' -f $_.Path,$_.Hash,$_.Algorithm }
```

8. 初查逐字节相等、长度、BOM/换行：

```powershell
$a=[IO.File]::ReadAllBytes('D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts'); $b=[IO.File]::ReadAllBytes('D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts'); [pscustomobject]@{CurrentBytes=$a.Length;BeforeBytes=$b.Length;ByteEqual=[Linq.Enumerable]::SequenceEqual[byte]($a,$b);FirstBytes=([Convert]::ToHexString($a[0..7]));LastBytes=([Convert]::ToHexString($a[($a.Length-8)..($a.Length-1)]));CrLfCount=[regex]::Matches([Text.Encoding]::UTF8.GetString($a),"`r`n").Count;LfCount=[regex]::Matches([Text.Encoding]::UTF8.GetString($a),"`n").Count} | Format-List
```

9. B 入口宽范围路由静态读取：

```powershell
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\b-service.py' -Pattern '/api/settings|allowed|method|path' -Context 4,10 | ForEach-Object { $_.ToString() }
```

10. 两条新交付文件初查：

```powershell
$paths=@('D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\settings-route-20261028-142736.md','D:\Lawbeach\lawbench-coord\A-handback-T18-settings-route-20261028-142736.md'); $paths | ForEach-Object { [pscustomobject]@{Path=$_;Exists=Test-Path -LiteralPath $_} } | Format-Table -AutoSize
```

11. 第 697 行精确文本与 UTF-8 字节数：

```powershell
$p='D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts'; $line=(Get-Content -LiteralPath $p)[696]; $enc=[Text.UTF8Encoding]::new($false); [pscustomobject]@{LineNumber=697;Text=$line;Utf8Bytes=$enc.GetByteCount($line);ContainsOnlyFrozenAllowlist=($line -ceq "    ['GET', new Set(['/health'])],")} | Format-List
```

12. B 入口 `GET_PATHS` 与无查询检查的窄范围静态读取：

```powershell
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\b-service.py' -Pattern 'GET_PATHS =|def _check_get' -Context 0,14 | ForEach-Object { $_.ToString() }
```

13. 两条新交付文件不存在性复核：

```powershell
$paths=@('D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\settings-route-20261028-142736.md','D:\Lawbeach\lawbench-coord\A-handback-T18-settings-route-20261028-142736.md'); foreach($p in $paths){ '{0}|{1}' -f $p,(Test-Path -LiteralPath $p) }
```

14. 修改前从前向字节替换计算预期结果：

```powershell
$p='D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts'; $text=[IO.File]::ReadAllText($p,[Text.UTF8Encoding]::new($false)); $old="    ['GET', new Set(['/health'])],"; $new="    ['GET', new Set(['/health', '/api/settings'])],"; $oldCount=([regex]::Matches($text,[regex]::Escape($old))).Count; $expected=$text.Replace($old,$new); $bytes=[Text.UTF8Encoding]::new($false).GetBytes($expected); [pscustomobject]@{OldLineOccurrences=$oldCount;ExpectedBytes=$bytes.Length;ExpectedSha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes))} | Format-List
```

15. 修改后完整正向/逆向字节等价、位置、换行与冻结文件哈希：

```powershell
$beforePath='D:\Lawbeach\lawbench-coord\T18SettingsRouteInput-20261028-142736\native-reading-workflow.mts'; $currentPath='D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts'; $enc=[Text.UTF8Encoding]::new($false,$true); $before=[IO.File]::ReadAllBytes($beforePath); $current=[IO.File]::ReadAllBytes($currentPath); $beforeText=$enc.GetString($before); $currentText=$enc.GetString($current); $old="    ['GET', new Set(['/health'])],"; $new="    ['GET', new Set(['/health', '/api/settings'])],"; $forward=$enc.GetBytes($beforeText.Replace($old,$new)); $inverse=$enc.GetBytes($currentText.Replace($new,$old)); $prefix=0; while($prefix -lt [Math]::Min($before.Length,$current.Length) -and $before[$prefix] -eq $current[$prefix]){$prefix++}; $suffix=0; while($suffix -lt ([Math]::Min($before.Length,$current.Length)-$prefix) -and $before[$before.Length-1-$suffix] -eq $current[$current.Length-1-$suffix]){$suffix++}; [pscustomobject]@{BeforeBytes=$before.Length;CurrentBytes=$current.Length;DeltaBytes=($current.Length-$before.Length);OldLineCount=([regex]::Matches($beforeText,[regex]::Escape($old))).Count;NewLineCount=([regex]::Matches($currentText,[regex]::Escape($new))).Count;ForwardByteEqual=[Linq.Enumerable]::SequenceEqual[byte]($forward,$current);InverseByteEqual=[Linq.Enumerable]::SequenceEqual[byte]($inverse,$before);CommonPrefixBytes=$prefix;CommonSuffixBytes=$suffix;FirstChangedOffset=$prefix;ChangedByteCount=($before.Length-$prefix-$suffix);BomPresent=($current.Length -ge 3 -and $current[0]-eq 0xEF -and $current[1]-eq 0xBB -and $current[2]-eq 0xBF);CrLfCount=([regex]::Matches($currentText,"`r`n")).Count;LfCount=([regex]::Matches($currentText,"`n")).Count} | Format-List; Get-FileHash -Algorithm SHA256 -LiteralPath $currentPath,'D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts','D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\b-service.py','D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\fixed-inputs.json','D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\README.md' | ForEach-Object { '{0}|{1}' -f $_.Path,$_.Hash }
```

16. 修改后设置路由与禁止项静态复核：

```powershell
$p='D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts'; Select-String -LiteralPath $p -Pattern "allowedLocal|\[\'GET\'|/api/settings|PUT|connection/test|/api/\*" -Context 1,3 | ForEach-Object { $_.ToString() }
```

17. 修改后焦点路径只读 Git 状态复核：

```powershell
git status --short --untracked-files=all --ignore-submodules=all -- 'docs/plan/evidence/T18/NativeReadingWorkflow-20261028-133231/native-reading-workflow.mts' 'docs/plan/evidence/T18/NativeReadingWorkflow-20261028-133231/settings-route-20261028-142736.md' 'dsh-ext/host/index.ts' 'docs/plan/evidence/T18/NativeReadingWorkflow-20261028-133231/b-service.py'
```

最后一条显示：`dsh-ext/host/index.ts` 为既存 `M`，源码与 `b-service.py` 为该目录内既存未跟踪文件；本次没有 Git 暂存或提交。
