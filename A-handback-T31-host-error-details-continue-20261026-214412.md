# T31 Host Error Details Continuation — A 线交回

状态：完成有界修改并写回证据。`runtime NOT_RUN`；打包 HOLD。

## 精确修改

- `commands.ts` 行 333/340/363：三个 `reason` 新记录均改为单行 `issues: [{ reason: ... }]`；错误码、消息、准入逻辑未改。
- `P-29-scoped-queued-delivery-policy.patch` 行 308/315/339：仅同形替换三条新增行；行数/hunk 数不变。
- `build-config.mjs`：`session-controller-source` 改为 34 files、340866 bytes、`52771d9796f48ceb872c6fe9f7ac5de42eec576feda4db7eba7fe7098a89d059`；第八补丁引用 SHA 改为 `50bddd4121541d7d51aec5a91379b02d4545726134f46a670e90100f38e0af1b`。
- 新增：本回件与 `docs/plan/evidence/T31/HostErrorDetailsContinue-20261026-214412/README.md`。

## 最终哈希

- `commands.ts`：31,548B；`c3ea5af81f21212888364bbd169c9d3d19c93f8720716dfc44ba32c1d164bb2c`
- `P-29-scoped-queued-delivery-policy.patch`：20,815B；`50bddd4121541d7d51aec5a91379b02d4545726134f46a670e90100f38e0af1b`
- `build-config.mjs`：20,463B；`c04c58a5a8fa43aa57de7c54566c5427600819ed8cb6dbe68356ae1c3e311bc1`
- 补丁：UTF-8 BOM=false，CR=false，末字节 LF=true。

非零变更计数：源码行替换 3、补丁行替换 3、配置标量替换 2、新增交付文件 2。逐行精确检查确认旧形态行各 0、新形态行各 1，位置分别为源码 333/340/363 与补丁 308/315/339。

## 实际命令 / 退出

所有 Shell 均为 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false`。最终命令正文为：

```powershell
$paths = @(
  'dsh\packages\api\session-controller\src\commands.ts',
  'dsh-patches\P-29-scoped-queued-delivery-policy.patch',
  'docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
)
$rows = foreach ($path in $paths) {
  $item = Get-Item -LiteralPath $path
  [pscustomobject]@{ Path = $path; Bytes = $item.Length; SHA256 = (Get-FileHash -LiteralPath $path -Algorithm SHA256).Hash.ToLowerInvariant() }
}
$rows | Format-List
```

该命令退出 0，哈希和大小全部匹配。4 次先前的只读格式核验因 PowerShell `foreach` 直接接管道的语法错误退出 1，未写文件；修正后退出 0。另有 1 次补丁只读检查多计了 diff 前缀 `+`，退出 0 但结果无效，已按实际单 `+` 行复核通过。

未运行测试、构建、解析器、Git apply、探针或运行时；未做任何 Git 写操作，未修改锁、审批、ACL 或沙箱。
