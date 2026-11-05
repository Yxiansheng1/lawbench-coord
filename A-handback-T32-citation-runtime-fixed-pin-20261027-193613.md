# A-HANDBACK — T32 citation runtime fixed pin

FROM：A 线 / DeepSeek 独立本地执行者  
TO：GPT 主编排  
TASK：T32 文稿出处修复后的 private runtime 固定输入更新  
STATUS：`FIXED_PIN_APPLIED / AUTHOR_RUNTIME_NOT_RUN / ROOT_FRESH_BUILD_REQUIRED`  
COMMIT：N/A（Git 严格只读，未暂存、未提交）

## 结论

已完成有界修改。只更新了 `docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs` 中 `lawbench-ui-source` 的字节数与 SHA-256：

- `files`：保持 92。
- `root`：保持 `D:\Lawbeach\lawbench-A\dsh-ext\ui`。
- `selector`：保持 `all`。
- `bytes`：`635866 -> 637026`。
- `sha256`：`ca47a1390b26dcfa70676ddab251e94ea007606b6acb841dc1783b906a7d1c9a -> 605ff86d3e3587c99a8e2ac5d742461d811d81602d6f1d8ef81e6e4914fa7dc9`。

配置修改前 SHA-256：`6c60333e2a488b75b51b2f3f7630d4141cdcfcefd276a5e4c0b5760f6b392076`  
配置修改后 SHA-256：`4f86aad968ebcd72e238f767b71cad80dd89446bef89ea473ad8600cd634dae6`

只读 `git diff --no-index` 对比协调目录修改前快照与仓库目标文件，结果只有本行的 `bytes`、`sha256` 两行变化。其余 17 棵树、39 个 `FILE_PINS`、14 个 `REFERENCE_PINS`、25 个 intended outputs、输出策略及所有其他配置字节均未改。冻结 builder 仍为 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。

## 输入与复用证据

- 正式蓝图：`D:\Lawbeach\lawbench-coord\T32CitationContinuationAInput-20261027-193613\blueprint.json`
- 蓝图 SHA-256：`48da3e556a87639495e54a638eb6eb1b0ff04cb58120c350116f231135d2b829`
- accepted Documents SHA-256：`a276632db5ae38af61d0e81b743c960b539c5d76c11f170a3d7cdc10dbe85d55`
- 正式执行令记录：根端已用原始 Documents 快照独立重建旧 UI digest，并证明当前 92 文件树相对旧输入只有一个产品源文件变化。
- 正式执行令记录：冻结 2 项以及既有 documents/citation 30 项为实际通过，类型检查为 0，且已自然收口。

以上根端结果直接复用，本作者没有重演旧开工、安装、调研、测试或全量验证。

## 证据文件

固定输入注记：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-citation-fixed-input-20261027-193613.md`

注记包含精确前后值、配置与 builder 哈希、冻结边界、命令日志、非零项和全部 NOT_RUN。

## 作者检查

只做文本读取、静态哈希、静态 diff 和目标行读取。目标 UI 行现为 92 files / 637026 bytes / `605ff86d…4fa7dc9`；修改后配置哈希为 `4f86aad9…dae6`；builder 哈希未变。未执行任何生成代码或运行时命令。

`git status --short` 与 `git diff --stat` 均为退出码 1：

`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`

按令未处理权限、`index.lock`、writer 锁、ACL、沙箱或审批；改用只读 `git status --short --ignore-submodules=all` 观察外层既有 dirty。另有两项只读搜索误设 `shell=bash`，均在命令启动前以 `BASH/E_ACCESS_DENIED` 拒绝，未执行、无写入；其余命令均使用指定绝对 native PowerShell、`login=false`。

最终合并 pathspec 的 Git 状态检查因把协调目录文件传给 A 仓库而退出 1；拆分后 A 仓库状态退出 0，显示配置与注记均为 `??`；协调目录 Git 状态退出 1，返回 `fatal: not a git repository`。本交回件不依赖协调目录 Git 提交，实际存在、全文读取和 SHA-256 已单独核对。

## 根端后续

1. 独立执行逆向字节核验和全部 pin 核验。
2. 通过后只发起一次全新的 private DEVELOPMENT build。
3. 对该次构建完成全部 25 个输出和 contracts 审计。

作者没有构建，因此本次交回不宣称 fresh build、25 outputs、contracts audit、GUI、打包或项目整体通过。Packaging 保持 HOLD；未安装、部署、触发 Actions 或费用操作。

## NOT_RUN

`RUNTIME_NOT_RUN`。未运行 Python、Node、import、parser、AST、compile、trace、faulthandler、test、Vitest、tsc、pytest、collect、build、prepare、serve、probe、HTTP、GUI、模型、Office、install 或 selftest；未执行生成代码；未运行旧绿测试或运行时全量回归。

Git 写操作全部 `NOT_RUN`：add、commit、rebase、stash、reset、clean、checkout、merge、push。交回以本协调目录文件为准，没有 commit SHA。

## 全部 shell 命令

以下为本次全部 `exec_command` 入口；除两条明确标注的 `shell=bash` 启动拒绝项外，均使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false`，工作目录为 `D:\Lawbeach\lawbench-A`。

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T32-citation-runtime-fixed-pin-order-20261027-193613.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32CitationContinuationAInput-20261027-193613\blueprint.json'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
git status --short
git diff --stat
git status --short --ignore-submodules=all
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs' | Format-Table -AutoSize Path,Hash
Select-String -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs' -Pattern "id: 'lawbench-ui-source'","files: 92","bytes:","sha256:" -Context 0,4 | Select-Object -First 40 | Format-List LineNumber,Line,Context
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910' -File | Select-Object Name,Length,LastWriteTimeUtc | Sort-Object Name | Format-Table -AutoSize
rg --files 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\DocumentCitationFix-20261027-192523' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDocumentCitations-20261027-190830'
rg -n --hidden --glob '!*.png' --glob '!*.jpg' --glob '!*.jpeg' --glob '!*.zip' --glob '!*.7z' --glob '!*.exe' "a276632db5ae38af61d0e81b743c960b539c5d76c11f170a3d7cdc10dbe85d55|naturalclosed|natural closed|types0|types: 0|actualPASS|ProductDocuments" 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\DocumentCitationFix-20261027-192523' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDocumentCitations-20261027-190830' 'D:\Lawbeach\lawbench-coord'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-materials-optin-fixed-inputs-20261027-132513.md'
rg --files 'D:\Lawbeach\lawbench-coord' | rg -i 'citation|handback|32'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-handback-T32-document-citation-fix-20261027-192523.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\DocumentCitationFix-20261027-192523\README.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-handback-T32-native-document-citations-20261027-190830.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativeDocumentCitations-20261027-190830\README.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-note-T32-citation-typepath-20261027-191703.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32DocumentCitationFixInput-20261027-192523\root-run.json'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32DocumentCitationFixInput-20261027-192523\root-red-results.json'
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord' -File | Where-Object { $_.Name -match 'T32.*citation|T32.*document' } | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 20 Name,Length,LastWriteTimeUtc | Format-Table -AutoSize
Select-String -LiteralPath 'D:\Lawbeach\lawbench-coord\T32CitationContinuationAInput-20261027-193613\build-config.mjs' -Pattern "id: 'lawbench-ui-source'" -Context 0,6 | Format-List LineNumber,Line,Context
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-coord\T32CitationContinuationAInput-20261027-193613\blueprint.json','D:\Lawbeach\lawbench-coord\T32CitationContinuationAInput-20261027-193613\build-config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs' | Format-List Path,Hash
$paths=@('D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-citation-fixed-input-20261027-193613.md','D:\Lawbeach\lawbench-coord\A-handback-T32-citation-runtime-fixed-pin-20261027-193613.md'); $paths | ForEach-Object { [pscustomobject]@{ Path=$_; Exists=(Test-Path -LiteralPath $_) } } | Format-Table -AutoSize
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs' | Format-List Path,Hash
git diff --no-index -- 'D:\Lawbeach\lawbench-coord\T32CitationContinuationAInput-20261027-193613\build-config.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
$lines=Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'; for($i=103;$i -le 110;$i++){ '{0}: {1}' -f ($i+1),$lines[$i] }
$paths=@('D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-citation-fixed-input-20261027-193613.md','D:\Lawbeach\lawbench-coord\A-handback-T32-citation-runtime-fixed-pin-20261027-193613.md'); $paths | ForEach-Object { [pscustomobject]@{ Path=$_; Exists=(Test-Path -LiteralPath $_) } } | ConvertTo-Json -Depth 2
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-citation-fixed-input-20261027-193613.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-handback-T32-citation-runtime-fixed-pin-20261027-193613.md'
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\T32-citation-fixed-input-20261027-193613.md','D:\Lawbeach\lawbench-coord\A-handback-T32-citation-runtime-fixed-pin-20261027-193613.md','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs' | Format-List Path,Hash
git diff --check -- 'docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/build-config.mjs'
git status --short --ignore-submodules=all -- 'docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/build-config.mjs' 'docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/T32-citation-fixed-input-20261027-193613.md' 'D:\Lawbeach\lawbench-coord\A-handback-T32-citation-runtime-fixed-pin-20261027-193613.md'
git status --short --ignore-submodules=all -- 'docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/build-config.mjs' 'docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/T32-citation-fixed-input-20261027-193613.md'
git status --short --ignore-submodules=all -- 'A-handback-T32-citation-runtime-fixed-pin-20261027-193613.md'
```

第二条新增状态命令在 `D:\Lawbeach\lawbench-coord` 启动，其余命令在 `D:\Lawbeach\lawbench-A` 启动。

非零项：`git status --short`、`git diff --stat` 因 `dsh` 子模块权限退出 1；`git diff --no-index` 因存在预期差异退出 1；跨仓合并状态命令因协调文件在 A 仓库外退出 1；协调目录单独状态命令因该目录不是 Git 仓库退出 1；两条 `shell=bash` 只读搜索在启动前退出 1。其他项退出 0。

STOP
