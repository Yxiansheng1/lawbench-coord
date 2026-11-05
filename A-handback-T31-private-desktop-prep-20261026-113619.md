# T31 私有 Desktop 准备交回（A）

- 执行令：`D:\Lawbeach\lawbench-coord\T31-private-desktop-prep-order-20261026-113619.md`
- 执行令身份：`4512` 字节，SHA-256 `bff115fbcaa800f606e715de362bbe09277edc130cd97ccf5749d9b800ec6208`
- HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 执行角色：独立 A 线；按执行令使用 native `pwsh`、`login=false`、managed 隔离。
- 状态：`AUTHOR_COMPLETE`；`ROOT_CUMULATIVE_REVIEW_REQUIRED`；`GUI_NOT_RUN`；`T31_NOT_ACCEPTED`；`PACKAGING_HOLD`。
- Git：全程只读。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；未改 index、lock、ACL、审批或全局 Git 配置。本交回不是提交。

## 修改范围

只修改了执行令允许的两个文件：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`

`start.ps1`、`stop.ps1`、B 线 native 入口、既有运行时、manifest、设置、daily marker、source pins、case/ready/root inventory 和产品源码均未修改。

## Before / current 文件身份

| 文件 | Before | Current |
|---|---|---|
| `prepare.ps1` | `15407` 字节；`af3d28d3844173c9841ea8668412d1c126ff36ee11837ef1b871065c5deaf450` | `17112` 字节；`1c0eb848b618963c68cd6f6c6577829663b3e1f73e5de6112c7c6de3bc203a47` |
| `README.md` | `23055` 字节；`4dff0b64f9882150b2133fd48d0f9865e35d51e29b772de20ab81715ab2346ac` | `23565` 字节；`0614493a5bf195622852e7affc5ca61c2f21d6292da7d4d7e497052cac2f6e8a` |

冻结入口复验仍与执行令一致：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `BatchGui-20261026-055030\start.ps1` | `75433` | `bbbe9eb62191a62eafd7bd0c5c0c1c29503fbf395291e512960d47368d8f5c72` |
| `BatchGui-20261026-055030\stop.ps1` | `7127` | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` |
| `BatchGuiEntry-20261026-044214\server.py` | `113384` | `10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4` |

## Dirty 保全

- `A-tracked-before.patch`：`291903` 字节，原始 SHA-256 `48bf28c283df6d88e2108850944427336c62780f4114e583d59827dee4a51c58`。
- 将 patch 与当前 `git diff --ignore-submodules=all --binary --no-color` 统一为 LF、去掉末尾空行后，两者均为 `5117` 行，规范化 SHA-256 均为 `f462fe789fb6181487065c04ec8925edbc8ebb29610a80909d3ee32bd755ccac`，逐字相等。
- 最终 `git status --short --ignore-submodules=all` 为 `138` 项：`54` 个 tracked modified、`84` 个 untracked。目标目录在执行前已是 untracked 证据目录；本次没有引入 tracked 修改。

## 唯一源码块

新块位于全部既有 root、case、ready、manifest、settings、daily marker、source pin 和 runtime-artifact 校验之后，最终 JSON 之前。精确新增源码为：

```powershell
$privateHome = [IO.Path]::GetFullPath([string]$expectedPreparedPaths.home)
$expectedPrivateHome = [IO.Path]::GetFullPath((Join-Path $rootFull 'private\home'))
$privateDesktop = [IO.Path]::GetFullPath((Join-Path $privateHome 'Desktop'))
$expectedPrivateDesktop = [IO.Path]::GetFullPath((Join-Path $expectedPrivateHome 'Desktop'))
$ownedRootPrefix = $rootFull.TrimEnd('\') + '\'
if ($privateHome -ine $expectedPrivateHome -or
    $privateDesktop -ine $expectedPrivateDesktop -or
    [IO.Path]::GetDirectoryName($privateDesktop) -ine $privateHome -or
    [IO.Path]::GetFileName($privateDesktop) -cne 'Desktop' -or
    -not $privateDesktop.StartsWith($ownedRootPrefix, [StringComparison]::OrdinalIgnoreCase) -or
    -not (Test-Path -LiteralPath $privateHome -PathType Container)) {
  throw "private Desktop preparation identity mismatch: $privateDesktop"
}
Assert-NoReparsePath $privateHome
$privateDesktopBefore = Get-Item -LiteralPath $privateDesktop -Force -ErrorAction SilentlyContinue
if ($null -ne $privateDesktopBefore) {
  throw "private Desktop already exists: $privateDesktop"
}
$null = New-Item -ItemType Directory -LiteralPath $privateDesktop -ErrorAction Stop
$privateDesktopItem = Get-Item -LiteralPath $privateDesktop -Force -ErrorAction Stop
if (-not $privateDesktopItem.PSIsContainer -or
    ($privateDesktopItem.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0) {
  throw "private Desktop is not a plain directory: $privateDesktop"
}
Assert-NoReparsePath $privateDesktop
if (@(Get-ChildItem -LiteralPath $privateDesktop -Force).Count -ne 0) {
  throw "private Desktop is not empty: $privateDesktop"
}
```

行为边界：

- 只从既有、已校验的 `$expectedPreparedPaths.home` 派生目标。
- 要求目标等于 `$rootFull\private\home\Desktop`，父目录身份逐字相等，并位于精确运行根内。
- 既有目标无论文件、目录或其他形状均拒绝，不接管、不覆盖。
- `New-Item` 未使用 `-Force`；只创建该次运行的 `Desktop` 子目录。
- 创建后检查它是普通目录、非 reparse、为空，再执行 `Assert-NoReparsePath $privateDesktop`。
- 未改用户 Desktop、HOME/TEMP 环境、权限、注册表、服务或产品。

最终 JSON 只新增一个键：

```powershell
privateDesktop = [ordered]@{
  path = $privateDesktop
  empty = $true
}
```

原有 JSON 键和值均未改变。

## README

README 只在文件末尾追加一节“2026-10-26 私有 Desktop 准备修正”，说明：

- 只在既有私有 HOME 校验后创建本次运行的 `private\home\Desktop` 空普通目录；
- 预先存在、父目录身份不符、越出运行根或 reparse 均拒绝；
- 用户 Desktop、HOME/TEMP、权限、注册表、产品和其他目录均未改变；
- 本节不代表 prepare、GUI 或 T31 验收已运行通过。

## 已完成验证

- 只读读取执行令、相关路径校验行、`Assert-NoReparsePath`、README 尾部及目标目录 before 副本。
- 对 `prepare.ps1` 与 before 副本做 `git diff --no-index --ignore-submodules=all`：仅出现上述单一新增块与单一 JSON 键，无其他 hunk。
- 对 `README.md` 与 before 副本做同类 diff：仅文件末尾追加一节。
- 复验 start、stop 与 B 线 native 入口的字节数和 SHA-256 未变。
- 复验受保护 tracked dirty 的规范化 diff 与 `A-tracked-before.patch` 完全相等。

以上都只是静态文本、身份和差异核验。

## NOT_RUN

按执行令 Author 禁区，本次未运行：

- Python、PowerShell parser/AST、任何 tests/selfcheck；
- `prepare.ps1`、`start.ps1`、`stop.ps1`、probe；
- build、GUI、HTTP、model、network、install；
- 任何删除、移动、复制、history/task/result 写入；
- 任何 Git 写操作、全局配置、API、安全、ACL、UAC、approval 或 lock 变更。

因此：

- 尚未证明脚本运行成功；
- 尚未证明私有 Desktop 在 fresh run 中实际创建；
- GUI batch 未通过，T31 整体未验收；
- packaging 必须保持 `HOLD`。

## Root 接续门

1. 对精确新增块、before/current diff、本文件命令簿和 3 个脚本做 cumulative parser/静态复核。
2. 仅在复核通过后运行一次 fresh `prepare.ps1`；确认输出中的 `privateDesktop.path` 精确指向该次 `private\home\Desktop` 且 `empty=true`，并确认原有键、claim 与 13/13 既有事实未被改写。
3. 可再做至多一次 actual GUI attempt；若没有新的安全 UI 信息，停止该 UI 分支，不做 guard、权限或系统设施绕行。
4. 打包继续保持 `HOLD`；本交回不构成 T31 或 GUI 验收。

## Author 命令簿

所有 `exec_command` 均显式使用：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
```

只读/身份命令按执行顺序：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-private-desktop-prep-order-20261026-113619.md' -Raw
git status --short --ignore-submodules=all
rg -n -C 14 "expectedPreparedPaths\.home|function Assert-NoReparsePath" "docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1"
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md' -Tail 40
rg -n -C 24 "expectedPreparedPaths" "docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1"
rg -n -C 18 "prepared manifest|final report|ConvertTo-Json|Write-Output|Write-Host" "docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1"
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1'；读取 `Length`、SHA-256 和 `LastWriteTimeUtc`
Get-Content ...prepare.ps1 | Select-Object -Skip 34 -First 28
Get-Content ...prepare.ps1 | Select-Object -Skip 300 -First 40
rg -n -C 12 '\$rootFull' 'docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1'
rg -n -C 6 "private\\home|private/home|\bhome\b" "docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1"
读取 prepare、README、start、stop、B 线 native 入口的字节数和 SHA-256
获取 README before 字节数和 SHA-256
```

两条失败的只读 shell 调用也保留为事实，均未写文件：

```text
1. rg 正则因 PowerShell 插值/转义形成无效分组，退出码 1；随后改用单引号固定 `$rootFull`。
2. 首版 foreach-hash 语句将 foreach 语句直接接入管道，触发 PowerShell ParserError；随后改用先收集结果再输出 JSON。该错误只发生于作者临时命令，不是 prepare.ps1 的解析结果。
```

写入动作只有 `apply_patch`：

```text
1. 在 prepare.ps1 加入唯一源码块和最终 JSON 单键；在 README 首次试插说明节。
2. 发现 README 说明节未位于尾部，仅用 apply_patch 将其移到文件末尾；源码块未再改。
3. 新建本交回文件。
```

修改后身份/差异命令：

```powershell
读取 prepare、README、start、stop、B 线 native 入口的 current 字节数和 SHA-256
rg -n -C 24 "private Desktop preparation identity mismatch|privateDesktop =" "docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1"
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md' -Tail 18
Get-ChildItem -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31PrivateDesktopPrep-20261026-113619\before' -Force
git --no-pager diff --no-index --ignore-submodules=all --no-color --unified=3 -- <before\prepare.ps1> <current\prepare.ps1>
git --no-pager diff --no-index --ignore-submodules=all --no-color --unified=3 -- <before\README.md> <current\README.md>
读取 before 四文件、A-tracked-before.patch、current prepare/README 的字节数和 SHA-256
将 A-tracked-before.patch 与当前 `git diff --ignore-submodules=all --binary --no-color` 规范化后比较行数、SHA-256 和逐字相等性
Test-Path -LiteralPath 'D:\Lawbeach\lawbench-coord\A-handback-T31-private-desktop-prep-20261026-113619.md'
读取 UTC/本地时间、shell PID 与 shell path
读取执行令 identity；只读读取 HEAD
```

执行结束时的 shell PID 为 `8020`；该 PID 是本次执行 shell，不是第二 writer。未打开 GUI、服务或旧 job。
