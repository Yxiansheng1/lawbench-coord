# 线 B 正式交回：T18 读材料 helper 单项有限修复

## 结论

- 执行令：`B-T18-sentence-read-helper-order-20261029-225304.md`
- 状态：`SOURCE_ONLY / BOUNDED_SOURCE_FIX / runtime: NOT_RUN`
- 唯一源码改动：在 `read-guard-finite.py` 的 `_SAFE_BUILTINS` 中新增一行
  `"staticmethod": staticmethod,`。
- 修改前后除该一行外没有 helper 字节变化；文件保持全 LF。
- 本轮没有解析、导入或执行 helper，没有运行有限 UNIT、514 项 admission、原始实际
  运行、Node、Python、TSX、类型检查、测试、构建、HTTP、模型、GUI、SSH、DPAPI 或
  产品路径。
- 本文件是协调目录中的正式交回，不是 Git 提交，也不是产品、真实模型、完整 T18、
  发车或业务质量 PASS。14 项有限 UNIT 与 514 项 admission 仍由 Root 复核后执行。

## 既有状态核验与保全

指定输入快照
`D:\Lawbeach\lawbench-coord\T18SentenceReadHelperInput-20261029-225304\`
已存在。修改前逐文件比对，快照中的五个输入均与 B 证据副本 SHA-256 完全相同：

| 文件 | bytes | 修改前 SHA-256 | 修改后状态 |
| --- | ---: | --- | --- |
| `native-sentence-calc.mts` | 164237 | `f5a837e15bd3b9279d2dd52997de3f38d59089f9a30cce4531922e41d8afb8c8` | 未变 |
| `b-service-sentence-calc.py` | 50285 | `d22b23a29b0a6f438f393fcbf755f9ca578cd17afc0e567995aa95eac70de82f` | 未变 |
| `literalfixed-inputs.json` | 12420 | `7eea9c826f4615f45bf0029a7d90b2dab01745fc8e48539d719947f326541fbf` | 未变 |
| `read-guard-finite.py` | 6517 | `b7097361668ebda68df510b48a49ba62088dce2a72ded687d1a82c301aa20ff` | 仅增目标一行 |
| `README.md` | 5967 | `36e857e80df5583281511285e2cf3afb78fad1256a84853de4b2db6cf8c3e817` | 未变 |

MTS `f5a8…b8c8` 的 WHOLE identity、B `d22b…82f` 的 whole inverse 身份和
manifest `12420` / `7eea…1fbf` 的既有 two-line B identity 证据均保持原状。
`Bservice/MTS/manifest/README/oldformal/currentprivate25/SDK/Skill/product/tests/`
以及 prompts、answers、budgets、guards、断言均未修改。协调目录中的既有输入快照
也没有改写；未创建新的 root、复制路径或 `run-*` 根。

此前 Root 已完成的边界事实保持原样：上一任务为 27 个命令、19 次成功、8 次非零，
上一份正式文件写为 28/20；该既有计数差异不回改、不追溯。旧失败原始报告也未改写。

## 精确修改

文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceReadContract-20261029-224308\read-guard-finite.py`

实际唯一 diff：

```text
@@ _SAFE_BUILTINS @@
     "set": set,
+    "staticmethod": staticmethod,
     "str": str,
```

修改后关键行：

```text
  50:     "object": object,
  51:     "set": set,
  52:     "staticmethod": staticmethod,
  53:     "str": str,
  54:     "tuple": tuple,
```

修改前：6517 bytes、250 LF、0 CRLF、0 bare CR、SHA-256
`b7097361668ebda68df510b48a49ba62088dce2a72ded687d1a82c301aa20ff`。

修改后：6551 bytes、251 LF、0 CRLF、0 bare CR、以 LF 结束、SHA-256
`abf7c3d8de879db405961cee49301fe900079bfe10575eece07455da03c8439`。

字节增量 34，恰好为目标插入行
`    "staticmethod": staticmethod,\n`。PowerShell 逐行比较只报告一条新增行；其余
四个输入文件在修改后与修改前快照的哈希仍全部一致。

## 复用与验收边界

- 复用既有的已通过原始证据和冻结输入身份，没有重演旧开工、安装、调研或全量测试。
- 没有执行 helper，因此 `read-guard-finite.py` 本轮没有任何运行通过结论。
- 没有运行 14 项 pure UNIT；没有运行 514 项 admission；没有运行一次必要的原始实际。
- 未新增、替换或弱化 final workflow、late ask、read、calc、save 断言。
- 未修改产品、API、模型、Key、预算、prompt、答案、测试、SDK、Skill 或契约。
- 当前 PID 仅是本次 B 执行者，不是第二 writer。

Root 的后续边界保持不变：先审查本次精确插入与反向差异，再由 Root 运行 14 项 pure
UNIT，然后运行 514 项 admission，最后只运行一次必要的原始实际以闭环。不得以本轮
source-only 交回替代这三步。

## 验证命令账

全部 `exec_command` 均使用：

```text
shell = C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login = false
```

截至创建本文件前共 15 次 `exec_command`：14 次退出码 0，1 次退出码 1。主要精确
命令如下：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-sentence-read-helper-order-20261029-225304.md'
git status --short --branch
Get-ChildItem -Force -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceReadContract-20261029-224308' | Select-Object Name,Length,LastWriteTime,Mode | Format-Table -AutoSize
Get-ChildItem -Force -Recurse -LiteralPath 'D:\Lawbeach\lawbench-coord\T18SentenceReadHelperInput-20261029-225304' | Select-Object FullName,PSIsContainer,Length,LastWriteTime | Format-Table -AutoSize
Get-FileHash -Algorithm SHA256 -LiteralPath <file>
Compare-Object (Get-Content -LiteralPath <pre-edit-snapshot>) (Get-Content -LiteralPath <edited-file>)
Test-Path -LiteralPath 'D:\Lawbeach\lawbench-coord\B-handback-T18-sentence-read-helper-20261029-225304.md'
```

唯一非零为只读 `git status --short --branch`：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

该权限拒绝按执行令记录为交付阻碍；没有启动 setup、没有切换 legacy、没有改动沙箱、
审批、ACL、权限、锁或 writer，也没有尝试绕过共享 worktree 权限。

源码修改通过 `apply_patch` 完成，不属于 `exec_command`，且只触及唯一目标行。

## 纪律声明

- 未联系其他聊天。
- 未更换 API。
- 未触碰生产。
- Git 全程严格只读：没有执行 `git add`、`commit`、`rebase`、`stash`、`reset`、
  `clean`、`checkout` 或 `push`；没有暂存或提交。
- 未修改协调目录中的执行令或既有输入快照。
- 本文件写入完成后停止，不进入 Root 专属验证。
