# B 线交回：Batch6 Provider 固定绑定装配修复

状态：`SOURCE_ONLY_STATIC_COMPLETE_FOR_ROOT_REVIEW`

本次只修改以下两个文件：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\Batch6\NativeMaterials-20261103\start.ps1`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\Batch6\NativeMaterials-20261103\README.md`

修复内容：删除“Provider manifest 必须等于 B6 编译 build manifest”和“Provider component 必须属于 24 项 B6 output”两个错误前置条件；Provider 组件改为复用 Batch5 已验收的 T34 固定资产，并与该组件自己的 `manifest.json` 按独立 literal pin 校验。

## 固定资产实证

以下值由当前文件直接读取 SHA256 和字节数后与脚本固定值比对：

```text
81412  664859957b714046e4667ca8a7739fddd232b358ecf36da3750c562d788a7c17
D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\llm-pi-ai.mjs

24383   f881626dbcd0cce738f2bcb08a64e3d3bf7bc48de93921ebce3d4329edb72e54
D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\manifest.json
```

`llm-pi-ai.mjs` 与 `manifest.json` 是同一 `private-output` 目录下的两个独立文件。脚本仍分别校验 binding、original provider、component 和 component 自有 manifest 的字节数与 SHA。

## 文件身份

| 文件 | 修改前字节 / SHA256 | 修改后字节 / SHA256 |
| --- | --- | --- |
| `start.ps1` | `95462` / `429594fc05e94e2caf3fc27dff7d4a4e3aa8443baa06d34fa557db992dd95954` | `94775` / `5d8a37a4b3ae13edc702859a056b960a180d46bfb05e0636a75c9c7cf221dcba` |
| `README.md` | `7689` / `41b8bd833c6d7b528be58deb400f63fe50b739038767612b7b807b2d05aa2374` | `8445` / `9238c8511333900250bafe8c582a0eb89937d184e100a7e2167d85e4a63c3bb6` |

同目录未授权文件保持原哈希：

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| `entry.py` | `44738` | `23fdc7d8bca96af1086134082b9422745fca1eb52e20dfb6f580d28f585426c8` |
| `prepare.py` | `24440` | `951e5cbfd540b7b4c1f9d992dfa388908b4e76b14d1b42cf7ce9a9e92a0ae55f` |
| `private-provider-binding.mjs.template` | `2260` | `7f8ec740e3c38671939b96e0eefdfcc6cb4c3708020d28f335920db0e43dcd30` |
| `stop.ps1` | `7143` | `a75d07c67e7b67daacf3c76f173d223ca455950897cfc608b354e40d20e6218e` |

## 完整变更 diff

以下为本次全部源文件变更，不使用 Git：

```diff
diff --source a/docs/plan/evidence/Batch6/NativeMaterials-20261103/start.ps1
diff --source b/docs/plan/evidence/Batch6/NativeMaterials-20261103/start.ps1
--- a/docs/plan/evidence/Batch6/NativeMaterials-20261103/start.ps1
+++ b/docs/plan/evidence/Batch6/NativeMaterials-20261103/start.ps1
@@ -154,15 +154,15 @@
 $PrivateProviderOriginal = 'D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\lib\index.js'
 $PrivateProviderOriginalBytes = 114078
 $PrivateProviderOriginalSha256 = 'a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f'
-$PrivateProviderComponent = 'ROOT_BINDER_REQUIRED_PROVIDER_COMPONENT_PATH'
-$PrivateProviderComponentBytes = 0
-$PrivateProviderComponentSha256 = 'ROOT_BINDER_REQUIRED_PROVIDER_COMPONENT_SHA256'
-$PrivateProviderManifest = 'ROOT_BINDER_REQUIRED_PRIVATE_BUILD_MANIFEST'
-$PrivateProviderManifestBytes = 0
-$PrivateProviderManifestSha256 = 'ROOT_BINDER_REQUIRED_PRIVATE_BUILD_MANIFEST_SHA256'
+$PrivateProviderComponent = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\llm-pi-ai.mjs'
+$PrivateProviderComponentBytes = 81412
+$PrivateProviderComponentSha256 = '664859957b714046e4667ca8a7739fddd232b358ecf36da3750c562d788a7c17'
+$PrivateProviderManifest = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\manifest.json'
+$PrivateProviderManifestBytes = 24383
+$PrivateProviderManifestSha256 = 'f881626dbcd0cce738f2bcb08a64e3d3bf7bc48de93921ebce3d4329edb72e54'
 $ExpectedHead = 'ROOT_BINDER_REQUIRED_EXPECTED_HEAD'
 $PreparedFormat = 'lawbench-b6-native-materials-prepared-v1'
 $AdmissionFormat = 'lawbench-b6-native-materials-admission-v1'
 $ExpectedRootBindingSha256 = 'ROOT_BINDER_REQUIRED_ROOT_BINDING_DESCRIPTOR_SHA256'
 $ExpectedCaseId = '872b161f-27d4-40bf-879e-ee457ef6454b'
 $SourceCaseRoot = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionAdmission-20261028-092536\run-kLVTTq\case'
@@ -592,9 +592,3 @@ function Assert-Preflight {
 function Assert-Preflight {
   Assert-RootBinderComplete
-  if ([IO.Path]::GetFullPath($PrivateProviderManifest) -ine
-        [IO.Path]::GetFullPath($PrivateBuildManifest) -or
-      $PrivateProviderManifestBytes -ne $PrivateBuildManifestBytes -or
-      $PrivateProviderManifestSha256 -cne $PrivateBuildManifestSha256) {
-    throw 'private provider manifest and compiled build manifest must be the same fixed file'
-  }
   if ($PrivateOutputPins.Count -ne 24) {
     throw 'literal private output pin count must be 24'
   }
@@ -635,14 +629,5 @@ function Assert-Preflight {
   Assert-Sha256 $PrivateProviderComponent $PrivateProviderComponentSha256 'private provider component'
   if ((Get-Item -LiteralPath $PrivateProviderComponent).Length -ne $PrivateProviderComponentBytes) {
     throw 'private provider component byte count mismatch'
   }
-  $providerInPrivateOutputs = @($PrivateOutputPins | Where-Object {
-    [IO.Path]::GetFullPath((Join-Path $PrivateBuildRoot ($_.Path -replace '/', '\'))) -ieq
-      [IO.Path]::GetFullPath($PrivateProviderComponent) -and
-    [long]$_.Bytes -eq [long]$PrivateProviderComponentBytes -and
-    [string]$_.Sha -ceq $PrivateProviderComponentSha256
-  }).Count -eq 1
-  if (-not $providerInPrivateOutputs) {
-    throw 'private provider component is not one of the current 24 compiled outputs'
-  }
   Assert-Sha256 $PrivateProviderManifest $PrivateProviderManifestSha256 'private provider manifest'
 
diff --source a/docs/plan/evidence/Batch6/NativeMaterials-20261103/README.md
diff --source b/docs/plan/evidence/Batch6/NativeMaterials-20261103/README.md
--- a/docs/plan/evidence/Batch6/NativeMaterials-20261103/README.md
+++ b/docs/plan/evidence/Batch6/NativeMaterials-20261103/README.md
@@ -11 +11 @@
-- `private-provider-binding.mjs.template`：Root 绑定私有 Provider 的模板，占位值不能被运行。
+- `private-provider-binding.mjs.template`：Root 绑定 Batch5 已验收私有 Provider 的模板，占位值不能被运行。
@@ -29 +29 @@
-先生成一份 literal 描述文件，例如 `RootBinding.json`。格式固定如下，所有路径、字节数和 SHA 必须来自 Root 最终编译结果：
+先生成一份 literal 描述文件，例如 `RootBinding.json`。格式固定如下。Desktop、B6 private build、24 项 output 和 3 项 native shim 的路径、字节数与 SHA 必须来自 Root 最终编译结果；Provider 组件及其 manifest 单独使用下文固定的 T34 资产，不属于这 24 项 output：
@@ -67 +67 @@
-1. 将 `private-provider-binding.mjs.template` 复制为 `private-provider-binding.mjs`，只填入原始 Provider、B6 编译 Provider 和 B6 编译 manifest 的固定 path/bytes/SHA。
+1. 将 `private-provider-binding.mjs.template` 复制为 `private-provider-binding.mjs`，只填入原始 Provider、Batch5 已验收 T34 Provider 组件和该组件自己的 manifest 的固定 path/bytes/SHA。模板里的 “B6_COMPILED” 占位名沿用旧模板，其候选组件和 manifest 仍必须填下文 T34 固定资产，不能填 B6 24 项编译输出。
@@ -69 +69 @@
-3. 填写 `start.ps1` 的 `$DesktopRoot`、`$DesktopPackageBytes`、`$DesktopPackageSha256`、`$ExpectedHead`、`$PrivateBuildRoot`、`$PrivateBuildManifestBytes`、`$PrivateBuildManifestSha256`。将 `$PrivateProviderManifest` 固定为同一个编译 manifest，并将 `$PrivateProviderComponent` 固定为其 Provider 输出。
+3. 填写 `start.ps1` 的 `$DesktopRoot`、`$DesktopPackageBytes`、`$DesktopPackageSha256`、`$ExpectedHead`、`$PrivateBuildRoot`、`$PrivateBuildManifestBytes`、`$PrivateBuildManifestSha256`。`$PrivateProviderComponent` 固定为 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPrivateBuild-20261030-120048\private-output\llm-pi-ai.mjs`（81412B，SHA256 `664859957b714046e4667ca8a7739fddd232b358ecf36da3750c562d788a7c17`），`$PrivateProviderManifest` 固定为同目录 `manifest.json`（24383B，SHA256 `f881626dbcd0cce738f2bcb08a64e3d3bf7bc48de93921ebce3d4329edb72e54`）。二者按各自 literal pin 独立校验，不得要求它们等于 `$PrivateBuildManifest` 或属于 24 项 `$PrivateOutputPins`。
```

## Qualification

- `SOURCE_ONLY`：未运行 `start.ps1`、`entry.py`、`prepare.py`、准备器、PowerShell/Python 解析器、测试、构建、GUI、HTTP 或模型。
- 错误装配条件静态命中数均为 0：`private provider manifest and compiled build manifest must be the same fixed file`、`private provider component is not one of the current 24 compiled outputs`、`providerInPrivateOutputs`。
- Provider 固定值来自 Batch5 `start.ps1` 和 `private-provider-binding.mjs` 的既有行为；本次重新读取资产，字节数和 SHA 均与执行令一致。
- 独立校验仍存在：binding 在第 621 行、original provider 在第 625 行、component 在第 629 行、component 自有 manifest 在第 633 行。对应的 `Assert-NoReparsePath` 和字节数校验也保留。
- `$PrivateOutputPins.Count -ne 24` 仍在第 594 行；`$CanonicalOriginalPins.Count -ne 38` 仍在第 597 行；B 源码 pin 文件固定 SHA 在第 639 行，346 项计数在第 656 行。
- 原网络 guard SHA 校验仍在第 637 行，resolver SHA 校验仍在第 638 行；RootBinding、authorization 和其余安全逻辑未改。
- `$PrivateBuildManifest` 仍以 `$PrivateBuildRoot\manifest.json` 由 Root 固定绑定；本次只解除它与 Provider 自有 manifest 的错误等同要求。
- 除 README 的 Provider 说明外，未修改任何产品文件；`entry.py`、`prepare.py`、binding 模板、`stop.ps1` 哈希与原值一致。
- 未执行 Git 读取或写入；没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`，也没有处理 `index.lock`、权限或锁。
- 运行器临时快照不跨命令保留，`fc.exe` 无法再次读取；diff 由上一步已捕获的原文和本轮 patch 全量重建，不是 Git diff。一次只读检索误传了 `bash`，执行器返回 `E_ACCESSDENIED`，未执行命令、未修改状态；其余命令均使用执行令指定的原生 `pwsh.exe`、`login=false`。

结论：本次装配错误已按 Batch5 原始固定绑定方式修复，供 Root 在完成全部 `ROOT_BINDER_REQUIRED` 占位后复核和执行。
