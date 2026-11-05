# HANDBACK-A-T14NullRecoveryPrivateBuild-20261101-005211

状态：`AUTHORED_NOT_RUN`

本件只交回私有构建脚本与配置的授权落盘结果。没有执行构建、运行、测试或发布；不得据此宣称 build/runtime PASS。

## 产物

目标目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14NullRecoveryPrivateBuild-20261101-005211`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20800 | `be91ffca1e58f344ab156989d65a5b9c924b7e6d64f9b7df2db7848857c99975` |

`build-private.mjs` 是 approve 输入 `build-private-original.mjs` 的逐字节副本。其 SHA-256 等于批准件 `builder_sha`，也等于 T18 原件 `build-private.mjs` 的 SHA-256。

## 只读预检

- fresh 目标在写入前不存在。
- 协调目录两份输入均与 T18 原件逐字节一致。
- 协调目录 `build-private-original.mjs` SHA-256：`347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`，命中批准件。
- 协调目录 `build-config-before.mjs` SHA-256：`723170f5eb5ef2dcc13f8c86d7099f2ddb4968f62d87c69e7b845c2dddcad42e`，与 T18 原件一致。
- 三处批准旧值在配置原文中各恰出现 1 次。

## 实际修改

仅对 `build-config.mjs` 做以下三次、各一次的字节级替换，顺序如下：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DefenseReadOrderPrivateBuild-20261031-231143`
   → `D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14NullRecoveryPrivateBuild-20261101-005211`
2. `188418` → `188498`
3. `3dbe7d097306c8e1734fa458e4f3889cd2f89e9f776b5d6f6935392bcecf73b3`
   → `54c836bfda442012238675ea3ca80949b8a8197d23633548e236345a14de1f63`

除上述三次替换外，配置字节保持原样。没有其它逻辑、辅助函数或字段改动。

## 实际落盘命令

以绝对路径 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false` 执行。核心 PowerShell 命令如下：

```powershell
$sourceDir='D:\Lawbeach\lawbench-coord\T14NullRecoveryPrivateBuild-20261101-005211Input'
$dest='D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14NullRecoveryPrivateBuild-20261101-005211'
if (Test-Path -LiteralPath $dest) { throw "destination already exists: $dest" }
function Get-Utf8Bytes([string]$value) { return ,([System.Text.Encoding]::UTF8.GetBytes($value)) }
function Replace-OneByteSequence([byte[]]$source,[byte[]]$oldBytes,[byte[]]$newBytes,[string]$label) {
  $hits=[System.Collections.Generic.List[int]]::new()
  for ($i=0; $i -le $source.Length-$oldBytes.Length; $i++) {
    $matched=$true
    for ($j=0; $j -lt $oldBytes.Length; $j++) {
      if ($source[$i+$j] -ne $oldBytes[$j]) { $matched=$false; break }
    }
    if ($matched) { $hits.Add($i) }
  }
  if ($hits.Count -ne 1) { throw "$label expected exactly one byte match; found $($hits.Count)" }
  $index=$hits[0]
  $result=[byte[]]::new($source.Length-$oldBytes.Length+$newBytes.Length)
  [Array]::Copy($source,0,$result,0,$index)
  [Array]::Copy($newBytes,0,$result,$index,$newBytes.Length)
  [Array]::Copy($source,$index+$oldBytes.Length,$result,$index+$newBytes.Length,$source.Length-$index-$oldBytes.Length)
  return ,$result
}
$builderBytes=[System.IO.File]::ReadAllBytes((Join-Path $sourceDir 'build-private-original.mjs'))
$configBytes=[System.IO.File]::ReadAllBytes((Join-Path $sourceDir 'build-config-before.mjs'))
$configBytes=Replace-OneByteSequence $configBytes (Get-Utf8Bytes 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DefenseReadOrderPrivateBuild-20261031-231143') (Get-Utf8Bytes 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14NullRecoveryPrivateBuild-20261101-005211') 'replacement 1 EVIDENCE_ROOT'
$configBytes=Replace-OneByteSequence $configBytes (Get-Utf8Bytes '188418') (Get-Utf8Bytes '188498') 'replacement 2 host bytes'
$configBytes=Replace-OneByteSequence $configBytes (Get-Utf8Bytes '3dbe7d097306c8e1734fa458e4f3889cd2f89e9f776b5d6f6935392bcecf73b3') (Get-Utf8Bytes '54c836bfda442012238675ea3ca80949b8a8197d23633548e236345a14de1f63') 'replacement 3 host sha256'
[void][System.IO.Directory]::CreateDirectory($dest)
[System.IO.File]::WriteAllBytes((Join-Path $dest 'build-private.mjs'),$builderBytes)
[System.IO.File]::WriteAllBytes((Join-Path $dest 'build-config.mjs'),$configBytes)
```

## 最终元数据命令

唯一成功的最终元数据命令只读取两个新文件：

```powershell
$dest='D:\Lawbeach\lawbench-A\docs\plan\evidence\T14\T14NullRecoveryPrivateBuild-20261101-005211'
foreach ($name in @('build-private.mjs','build-config.mjs')) {
  $path=Join-Path $dest $name
  $item=[System.IO.FileInfo]::new($path)
  [pscustomobject]@{
    File=$name
    Bytes=$item.Length
    SHA256=(Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant()
  }
}
```

## 偏差与阻碍

- 第一次元数据命令在 PowerShell 解析阶段因把 `foreach` 语句直接接到管道而报 `ParserError`。该次没有读取文件、没有产生元数据，也没有写入；随后以同一边界重跑，成功得到上表。
- 未修改产品源码、测试、SDK、guard、defaultlib、旧 evidence root、环境、Key、安全策略、审批、沙箱或 ACL。
- 未运行 Node、Python、parser/AST、Vitest、tsc、collect、check、prepare、build、serve、app、HTTP、model、GUI 或 author runtime。
- 未执行任何 Git 写操作，未暂存、未提交、未 rebase/stash/reset/clean/checkout/push；没有尝试修复或绕过任何 Git 锁或权限问题。
- 本运行器没有执行构建；本交回件不是 build/runtime 通过证明，下一步只能由主编排按完整 inverse/full-raw/setup-cleanup review 后的独立授权处理。
