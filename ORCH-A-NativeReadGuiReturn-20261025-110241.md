# ORCH-A NativeReadGui 交回

2026-10-25，任务入口：
`D:\Lawbeach\lawbench-coord\NativeReadGuiOrder-20261025-110241.md`。

## 结论

状态：`PREPARED_FOR_ROOT_REVIEW_ONLY`，`PACKAGING HOLD`。

A 线已在新的
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeReadGui-20261025-110241`
中按旧四文件原字节起步，仅替换新 B 入口/path/SHA、新 RunsRoot、README
固定输入/launcher 路径和原第 3 节读取旅程。没有修改旧四文件、产品、
E50、B 入口或任何共享配置。

本次没有执行 prepare、start、stop、PowerShell 脚本、Python、Node、测试、
selfcheck、AST、构建、安装、服务、GUI 或网络。作者不声称任何 GUI、六
GET 呈现、非空材料、OCR、wiki、模型、设置或清理验收。没有新增运行根。

Git 全程只读；没有 add/commit/rebase/stash/reset/clean/checkout/push，
也没有处理 index.lock、权限、ACL、sandbox、审批或 writer lock。

## 开工状态与 dirty 保全

- A 树 HEAD：
  `a23271abee333a9a256fd46a3141da16975c2380`，与执行令一致，交回时未变。
- 开工前快照：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\NativeReadGui-before-20261025-110241`。
- 快照 `head.txt` 与当前 HEAD 相同。
- 快照 `tracked.patch` 为 3,940 行；当前
  `git diff --ignore-submodules=all --no-ext-diff --no-color` 也是 3,940
  行，逐行比较差异 0 行。既有 tracked dirty 内容保全。
- 既有 untracked 文件未删除或改写。允许写入仅限本任务新目录四文件与本文。

首次裸 `git status --short --untracked-files=all` 返回 1，原始阻碍为：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

该命令尝试进入 `dsh` 子模块；未修复权限，之后只用
`--ignore-submodules=all` 做只读状态/diff 核对。

## 交付文件与指纹

| 文件 | 字节 | 行数 | SHA-256 |
|---|---:|---:|---|
| prepare.ps1 | 5544 | 144 | `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37` |
| start.ps1 | 38947 | 893 | `1d6aba900858c93a7ac83eda855cebc83baa0a85b17e68a64305011df8ac8558` |
| stop.ps1 | 7126 | 197 | `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647` |
| README.md | 7974 | 176 | `5896882e23581b05806a19aa7e731afc4e4aeb236313cd288f2200675d05fa8d` |

原四文件逐字节未变：

| 文件 | 字节 | 行数 | SHA-256 |
|---|---:|---:|---|
| prepare.ps1 | 5541 | 144 | `186b268691deacaa78fd03d56711706b2554dc9a1202ac0b3c49bf759088a77f` |
| start.ps1 | 38944 | 893 | `7f605046a916cd0304ec7562f3056ac5a0a8980b80c33b3da4a0b973bf6c5b96` |
| stop.ps1 | 7123 | 197 | `09adeef6710c1da24ecb9ec2e75f16727b66009dfe4202559f962c2c25e4c7a0` |
| README.md | 8119 | 178 | `ebdfc9bfb6795fcfa7eccd263937db0c06d31690640a63db1fc3683e1f3f4915` |

## 精确改动

新 B 入口：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py
SHA-256 c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca
```

- prepare/start 的旧入口
  `...\HostEntry-20261025-094816\server.py` 替换为新入口。
- prepare/start 的旧 SHA
  `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`
  替换为 `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`。
- prepare 的 `$RunsRoot` 与 start 的 `$RunsRoot` 均由同一个新
  `$NativeEntry` 派生，固定为
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\runs`。
- stop 的固定 `$runsRoot` 改为同一新
  `ReadGetEntry-20261025-105313\runs`。
- `entry/server.py` 特殊映射保留，其他 prepared source label 仍按 B 产品根
  解析；lifetime/relay/partial-cleanup/exact identity/guard/resolver/PDF/env/
  private profile/Host skills/source fixedmaps 均未改。
- README 只更新与新 launcher/入口有关的固定路径和 SHA，并将原第 3 节
  Paint bitmap 导入验收整节替换为只读六视图旅程。其余 setup、cleanup、
  safety、未来副作用和 known metadata 说明保留。
- 新目录中旧入口 path 与旧 SHA 的命中数均为 0；新入口 path 覆盖四文件，
  新 SHA 覆盖 prepare/start/README，stop 不含 SHA 是预期。

README 新旅程明确：`nativecase/open` 打开准确 fresh case；task view 保持
`task-current`-free 且无 GET error；case pane 的 materials/OCR jobs 为空，
wiki 未生成，六个读取不出现 generic contract error；documents 为空但不是
load failure。不得选择 Skill/task、保存/编辑/PUT/Key/真实 provider/model/
OCR/wiki run/import。已知 T34 settings/rejected modal 可出现，只关闭既有
提示，不诊断或重试；普通 probe warning 与产品失败分开。

## 未变固定资产

- B 旧入口仍为
  `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`。
- B 新入口实测
  `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`。
- E50 guard：
  `cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130`。
- E50 resolver：
  `1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208`。
- E50 六个 compiled `lawbench-dsh\lib` 文件仍逐项等于 start.ps1 内钉死值：
  agent `3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43`，
  client `e26b9f922b1c57a88d3e209fe1b0119d0e4f6381f02759afa23f629ebe5f8661`，
  credentials `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1`，
  host `4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8`，
  index `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956`，
  session-store `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762`。
- 既有 tracked product/E50 diff 与开工前 snapshot 逐行相同，见上文。

## 完整累计 diff：原四文件 → 新四文件

```diff
diff --git a/NativeGui-20261025-100530/README.md b/NativeReadGui-20261025-110241/README.md
index 2769f8a..e7b68fc 100644
--- a/NativeGui-20261025-100530/README.md
+++ b/NativeReadGui-20261025-110241/README.md
@@ -21,9 +21,9 @@ claimed and packaging remains on hold.
 ## Fixed inputs
 
 - Native entry:
-  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py`
+  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py`
   with SHA-256
-  `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`.
+  `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`.
 - Python312:
   `C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe`.
 - Electron and PrimaryRuntime under `D:\Lawbeach\lawbench-A\dsh\apps\desktop`.
@@ -43,7 +43,7 @@ fixture, native server, guard, resolver, or E50 bundle is modified.
 Run after root review:
 
 ```powershell
-& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\prepare.ps1'
+& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeReadGui-20261025-110241\prepare.ps1'
 ```
 
 The script prints JSON containing `runRoot`. It invokes the pinned native entry
@@ -51,7 +51,7 @@ exactly as:
 
 ```text
 python.exe -B -X utf8 <server.py> --prepare --root
-D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs\T33-host-YYYYMMDD-HHMMSS
+D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\runs\T33-host-YYYYMMDD-HHMMSS
 ```
 
 The target is one new direct child of `runs`, matching the native name rule.
@@ -71,7 +71,7 @@ snapshot, marker, settings, or canonical path differs.
 Start only from the already reviewed fresh root:
 
 ```powershell
-& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\start.ps1' -RunRoot '<printed runRoot>'
+& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeReadGui-20261025-110241\start.ps1' -RunRoot '<printed runRoot>'
 ```
 
 The command returns after a hidden, single-run owning supervisor has verified
@@ -97,41 +97,39 @@ python.exe -B -X utf8 <pinned server.py> --serve --root <runRoot> --seconds 600
 The total owning supervisor budget is at most 600 seconds from actual Electron
 start, independent of the native serving timer.
 
-## 3. Root-only actual GUI acceptance
+## 3. Root-only actual GUI read journey
 
-Use only computer-use `@oai/sky node_repl` for real UI interaction. Refresh the
-surface, select the actual test window, and record its real window ID in the
-root evidence. Do not use DOM/CDP input, fake HTML, clipboard APIs, or an
-invented success response.
+The author did not run this journey and claims no GUI acceptance. Use only
+computer-use `@oai/sky node_repl` for real UI interaction. Refresh the surface,
+select the actual test window, and record its real window ID in the root
+evidence. Do not use DOM/CDP input, fake HTML, clipboard APIs, or an invented
+success response.
 
 1. Confirm the actual Electron window and that its PID/creation identity
    matches `current.json`.
-2. In the native UI, open the prepared `case` path through case open. Confirm
-   the empty native daily-case marker is registered; do not fabricate session,
-   history, rollout, or conversation metadata.
-3. Reuse the current native Paint copy procedure only as needed. The synthetic
-   source is
-   `D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg`,
-   SHA-256
-   `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`,
-   47,379 bytes, 750x1334. Open it in the existing Paint app, select the full
-   image, press Ctrl+C, close Paint without editing or saving, then paste with
-   Ctrl+V in the selected native UI window.
-4. Verify the real material target under `<runRoot>\case` and verify the saved
-   input through native material metadata or a decoded image. Paint clipboard
-   output may be PNG or bitmap re-encoded, so a failed PNG byte-hash comparison
-   against the original JPEG is not evidence of failure.
-5. Verify Host owns and deletes the temporary paste file under
-   `<runRoot>\private\appdata\临时\粘贴`. Do not invoke a remove UI or delete a
-   file manually.
-6. Take screenshots only of the exact test window. Do not inspect business
-   windows. Do not trigger OCR, model completion, paid Search, PDF conversion,
-   Office conversion, or an external network request.
+2. Open the prepared `case` path in the native UI through `nativecase/open`.
+   Confirm that the accurate fresh case is opened; do not fabricate a session,
+   history, rollout, conversation, or task.
+3. Observe the task view and confirm that it remains `task-current`-free with
+   only the local case selection and no GET error.
+4. Open the case pane and confirm that materials are empty and OCR jobs are
+   empty. Confirm that wiki content is not generated. The six read views
+   `tasks`, `outputs`, `ocrjobs`, `wiki-suggestions`, `wiki-review`, and
+   `task-current` must not show a generic contract error.
+5. Confirm that documents are empty and do not treat the empty list as a load
+   failure.
+6. Stop after the read-only inspection. Do not select a Skill or task, save or
+   edit anything, issue a PUT, enter a Key or provision a real provider, run a
+   model, OCR, or wiki operation, or import a file.
+
+The known T34 settings/rejected modal may still appear. Close only the existing
+prompt; do not diagnose or retry it. Keep ordinary probe warnings separate
+from product failures.
 
 ## 4. Stop and verify
 
 ```powershell
-& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeGui-20261025-100530\stop.ps1' -RunRoot '<printed runRoot>'
+& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\NativeReadGui-20261025-110241\stop.ps1' -RunRoot '<printed runRoot>'
 ```
 
 Stop first requests the owning supervisor to close Electron gracefully. Its
diff --git a/NativeGui-20261025-100530/prepare.ps1 b/NativeReadGui-20261025-110241/prepare.ps1
index e0279d1..af10ccf 100644
--- a/NativeGui-20261025-100530/prepare.ps1
+++ b/NativeReadGui-20261025-110241/prepare.ps1
@@ -6,8 +6,8 @@ param(
 Set-StrictMode -Version Latest
 $ErrorActionPreference = 'Stop'
 
-$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py'
-$NativeEntrySha256 = '93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139'
+$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py'
+$NativeEntrySha256 = 'c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca'
 $Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
 $RunsRoot = Join-Path (Split-Path -Parent $NativeEntry) 'runs'
 $Fixture = 'D:\Lawbeach\lawbench-A\tests\fixtures\criminal-01\转账截图.jpg'
diff --git a/NativeGui-20261025-100530/start.ps1 b/NativeReadGui-20261025-110241/start.ps1
index 8a9996d..4d48abe 100644
--- a/NativeGui-20261025-100530/start.ps1
+++ b/NativeReadGui-20261025-110241/start.ps1
@@ -128,11 +128,11 @@ $DesktopRoot = Join-Path $RepoRoot 'dsh\apps\desktop'
 $Electron = Join-Path $DesktopRoot 'node_modules\electron\dist\electron.exe'
 $Node = 'E:\node\node.exe'
 $Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
-$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\server.py'
+$NativeEntry = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\server.py'
 $BProductRoot = 'D:\Lawbeach\lawbench-B'
 $ServiceRoot = 'D:/Lawbeach/lawbench-B/service'
 $RunsRoot = Split-Path -Parent $NativeEntry | ForEach-Object { Join-Path $_ 'runs' }
-$NativeEntrySha256 = '93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139'
+$NativeEntrySha256 = 'c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca'
 $Guard = Join-Path $E50Runtime 'network-guard.cjs'
 $Resolver = Join-Path $E50Runtime 'resolve-from-dsh.mjs'
 $SidecarScript = Join-Path $E50Runtime 'fake-sidecars.mjs'
diff --git a/NativeGui-20261025-100530/stop.ps1 b/NativeReadGui-20261025-110241/stop.ps1
index 987c0e1..f9f27f2 100644
--- a/NativeGui-20261025-100530/stop.ps1
+++ b/NativeReadGui-20261025-110241/stop.ps1
@@ -7,7 +7,7 @@ Set-StrictMode -Version Latest
 $ErrorActionPreference = 'Stop'
 
 $rootFull = [IO.Path]::GetFullPath($RunRoot)
-$runsRoot = [IO.Path]::GetFullPath('D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\HostEntry-20261025-094816\runs')
+$runsRoot = [IO.Path]::GetFullPath('D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\ReadGetEntry-20261025-105313\runs')
 if ([IO.Path]::GetDirectoryName($rootFull).TrimEnd('\') -ine $runsRoot.TrimEnd('\') -or
     $rootFull -notmatch '\\T33-host-[0-9]{8}-[0-9]{6}$') {
   throw "refusing non-T33 run root: $rootFull"
```

## 精确命令偏差与恢复

1. 第一次建目录时误用
   `New-Item -ItemType Directory -LiteralPath`；该命令不接受
   `-LiteralPath`，目录未创建。随后 `Copy-Item` 把新目录名误落成
   `T33\NativeReadGui-20261025-110241` 单文件，最终内容为 README，SHA
   `ebdfc9bfb6795fcfa7eccd263937db0c06d31690640a63db1fc3683e1f3f4915`。
   已按精确绝对 leaf 与 SHA 核验后删除该本次误产物；误产物不在约定目录内。
2. 改为 `New-Item ... -Path` 后，正确创建目录，并按指定顺序复制四文件；
   复制后的四 SHA 与旧四文件完全一致，随后才作限定修改。
3. 两个只读汇总命令曾把 `foreach` 语句直接接 `Format-Table`，PowerShell
   报空管道解析错误；无写入，改为数组汇总后通过。
4. `git diff --no-index` 因存在差异按 Git 约定返回 1，非失败；CHR/LF
   警告只是 Git 提示，没有 checkout 或写回。最终四文件按读字节 SHA 确定。

## 交回与停止

- 未修改旧四文件。
- 未新增第五个 launcher 文件，未在 A 根新增 source snapshot，未复制错误
  A/README。
- 未运行测试或 GUI，不声称实现验收。
- Git 写权限不在本 runner 授权内；如未来 index.lock/权限拒绝，不属于本单
  需要修复的交付阻碍。
- 唯一正式交回为本文件。请 root 按执行令审四文件与累计 diff；真实 GUI
  由 root 另行只读展示并自然清理。Packaging 保持 HOLD。
