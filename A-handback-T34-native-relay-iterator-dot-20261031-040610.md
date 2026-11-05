# A 线正式交回：T34 Native Relay iterator 尾点

## 执行范围

- 唯一源码：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-relay.py`
- 唯一修改：`self._iterator = source.__aiter__().` -> `self._iterator = source.__aiter__()`
- 修改性质：删除末尾一个 ASCII 句点字节；其余字节保持不变。
- 既有 dirty 状态：未清理、未暂存、未提交。

## 实际命令（2 条）

1. 读取正式执行令：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T34-native-relay-iterator-dot-order-20261031-040610.md'
```

2. 单文件字面替换、UTF-8 无 BOM 保字节回写并采集元数据：

```powershell
$sourcePath = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\NativeRelayOriginal-20261031-032735\native-relay.py'
$metadataBefore = Get-Item -LiteralPath $sourcePath
$hashBefore = Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256
$textSource = [System.IO.File]::ReadAllText($sourcePath)
$textSource = $textSource.Replace('self._iterator = source.__aiter__().', 'self._iterator = source.__aiter__()')
[System.IO.File]::WriteAllText($sourcePath, $textSource, [System.Text.UTF8Encoding]::new($false))
$metadataAfter = Get-Item -LiteralPath $sourcePath
$hashAfter = Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256
[pscustomobject]@{ Path = $sourcePath; LengthBefore = $metadataBefore.Length; LengthAfter = $metadataAfter.Length; SHA256Before = $hashBefore.Hash; SHA256After = $hashAfter.Hash } | Format-List
```

## 结果

- 修改前长度：32566 字节。
- 修改后长度：32565 字节。
- 修改前 SHA-256：`4887D321AEBA3B94C3F989F8A8BCFE676E12B8331EF13A9420F41458B409E1F7`
- 修改后 SHA-256：`1DC6DDB10CBDF9707DF0193BBB1532E65C784064FAEDB1F04BB69A0E85E9FFCD`
- 修改前哈希与执行令给定的 `native-relay-before.py` 哈希一致。
- 根因：ROOT 执行令中的英文标点错误导致多出一个 ASCII 句点；不是产品故障。

## 验证状态

- Source：NOTRUN
- T34：NOTPASS
- Actual：NOTRUN
- Key：NOTLOADED

按执行令未运行源码、未自检、未统计匹配数、未执行全模块 inverse/finite/actual 验证；等待 ROOT 独立验证。
