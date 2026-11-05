# T30 GUI 最终观察器静态修正记录（2026-10-28 10:36:04）

状态：`AUTHOR_RUNTIME_ZERO / STATIC_CHANGED_NOT_RUN / ROOT_FULL_AUDIT_AND_FIRST_GUI_REQUIRED`

本记录只承接
`D:\Lawbeach\lawbench-coord\A-T30-GUI-final-observer-order-20261028-103604.md`。
当前执行者是独立 A 线的 DeepSeek 执行者，也是本条工作树的唯一 writer。没有联系
其他聊天、更换 API、启动 setup/legacy、修权限/ACL/审批/锁、拆 writer 锁，也没有
执行任何 Git 写操作。

## 既有状态核对

本轮没有重演 prepare、准入、安装、调研、全量测试或旧 T30 admission。只读核对结果：

- 既有运行根为
  `docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\runs\T30-genuine-session-gui-20261028-103405`。
- 该运行已有 `prepared.json` 与 `admission.json`；没有
  `started.json`、`ready.json`、`requests.ndjson`、`final-metadata.json`、
  `loop-closed.json` 或 `run-error.json`。
- `case` 最终现场只有父日志、子日志和 `case.db`；复制前的
  `case.db-shm`、`case.db-wal` 已自然消失。
- 两份 JSONL 仍为父 12,059 bytes /
  `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee`，
  子 16,235 bytes /
  `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461`。
- 最终 `case.db` 为 65,536 bytes /
  `47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6`。
- 工作树原本已有大量 dirty。只读
  `git status --short --branch --ignore-submodules=all` 已保全原状态；根级普通
  status 仍因共享 `dsh` submodule worktree 权限拒绝而不完整，未修权限或改锁。

这说明旧 `_final_target_observation` 要求最终仍存在复制前五文件，会让合法
SQLite 生命期收缩失败。这里只修观察器口径，不把该现象写成产品缺陷，也不据此给
GUI、删除、回收站或 T30 PASS。

## 修改边界

修改前输入身份：

| 文件 | 输入 bytes | 输入 SHA-256 |
| --- | ---: | --- |
| `entry.py` | 45,298 | `32d4cf19d8929c13c4023755494209dd4ce1cdbc17e8edfb2f760d77768a8345` |
| `start.ps1` | 74,131 | `efd043e99964c29463c9ede500a61b6e6fe598502349598838a038051328a18b` |
| `README.md` | 10,158 | `0751116e9c84d51cfbd89ddb32bc5c2b9294a269e76e79efc45893efe4880c7e` |

修改后身份：

| 文件 | 最终 bytes | 最终 SHA-256 |
| --- | ---: | --- |
| `entry.py` | 48,554 | `c68a8155b6b3d843605849f18e060ef7d663f43bd7dab0ba4e6a3247e9e9e1ba` |
| `start.ps1` | 74,131 | `627ed8bf61240479e9d0f5e8a4e4279890f2e44269e7328683016d2a3d44fb35` |
| `README.md` | 10,989 | `73a952925692b163c2ddb8889a8e79a46a8e92784b6638f7e0d198a988741b7d` |

`entry.py` 的精确变化区：

1. 顶部新增标准库 `import sqlite3`。
2. `_final_target_observation` 开头再次严格核对源案件固定五文件。
3. 最终目标由旧的“复制前五文件全集”改为精确白名单：固定父日志和
   `case.db` 必需；固定子日志、`case.db-shm`、`case.db-wal` 与两张固定会话 ID
   的投影缓存可选。白名单外任何文件失败。
4. 固定父/子日志仍逐字节、逐 SHA 校验；子日志缺席只接受子会话记录目录整体
   不存在，原有 pending-root-GUI/OS-recycle 状态与
   `targetLogsUnchanged:false` 语义保留。
5. `case.db` 和存在的 SQLite 辅助文件都必须是非 reparse 点、普通文件。
   `case.db` 记录实际前后 bytes/SHA；辅助文件存在时记录实际身份，缺席时明确写
   `present:false`、`state:ABSENT_AFTER_GUI_LIFECYCLE`、后置 bytes/SHA 为
   `null`、`changed:true`，不伪造哈希相等或动态 expected hash。
6. 最终只用 SQLite URI `mode=ro` 加 `PRAGMA query_only=ON` 读取既有 `meta`
   表，要求 case ID
   `872b161f-27d4-40bf-879e-ee457ef6454b`、schema `1`。未调用
   `CaseRegistry`，未打开写连接，未建库或补表。
7. 只认 `工作区/会话缓存/session-97c67db2-b8a6-428b-be48-04b4144d10bd.json`
   与 `工作区/会话缓存/session-7fd6b82e-f361-456a-9c91-b6ba77991bb9.json`。
   每张缓存记录存在性、实际 bytes/SHA，并固定标记
   `productGeneratedCache:true`、`acceptanceProof:false`。没有 glob、临时文件
   或 synthetic cache 写入。
8. `notAcceptance` 增加“缓存存在与 SQLite 辅助文件生命期只是观察，不是验收”，
   `COMPLETED_FOR_ROOT_REVIEW` / `FAILED_FOR_ROOT_REVIEW` 语义未改。

`start.ps1` 对输入只有同一 hunk 的 `$NativeEntryBytes` 与
`$NativeEntrySha256` 两行从 `45298 / 32d4...8345` 改为
`48554 / c68a...e1ba`。只读 diff 未发现其他 hunk。README 只改最终观察与生命期
说明，避免把缓存、SQLite 辅助文件缺席或子目录缺席写成 GUI PASS。

严格冻结且与协调输入逐字节相同：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13,520 | `285e5dec942a50a42b277f9d1cf43f690b7b16b0e8e2d0f10abe03e3783d590a` |
| `stop.ps1` | 7,145 | `cc9e0d32ffd9572c2edb1dbb6b030740d5503ef211698198527e3ed0618f3055` |
| `交付说明.md` | 9,579 | `0f8cd031fb50b4548eb56946d86215bf23885d47975b4b3244360c6ba1d53fdb` |
| `root-static-fix-20261028-102456.md` | 15,809 | `67396ce216f481c830b6e07396ffdecee7fac4e51ef00270c1348e9f7f832e11` |

`EXPECTED_FILES` 块、prepare/stop、旧正式材料、源案件、准入、prepared、两份日志、
路由/守卫/清理、product/tests/runtime 均未写。`entry.py`、`start.ps1`、
`README.md` 三份允许修改的文件都是 UTF-8 无 BOM、纯 LF。

## 静态核对

绿：

- `start.ps1` 入口 bytes/SHA 与最终 `entry.py` 精确一致。
- 旧白名单的最终五文件子集检查已消失；最终代码包含精确 required/optional
  白名单，且白名单外文件失败。
- 父日志、源案件、准入日志身份检查仍为固定值；子日志部分/缺文件但目录仍在的
  路径仍失败。
- SQLite 元数据连接是只读 URI 与 `query_only`；辅助文件缺席有显式记录，没有
  动态哈希。
- 缓存路径由两个固定会话 ID 生成，没有通配符。
- 原有 root-review outcome 与 notAcceptance 门保留。
- 源案件固定五文件逐项 bytes/SHA 与 prepared/admission 固定值一致。
- 既有 `103405` 现场文件集合可由新白名单解释，但本作者没有把它标成 GUI PASS。

红：

- 作者运行时为 0，没有执行 Python、Node、parser、AST、测试、prepare、admit、
  serve、probe、HTTP、模型、GUI、build 或 selftest。
- 因此没有语法执行证明、服务运行证明、GUI 证明或根接收证明。

灰：

- `case.db` 的只读 `meta` 查询和实际 GUI 退出后的最终观察尚未在本轮运行；根侧
  首次 GUI 才会实际覆盖。
- 子会话与 OS 回收站、实际删除、USB、macOS、整 T30 与打包均不在本轮范围。

## 实际命令台账

所有真正执行的 shell 调用都使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、
`login=false`，工作目录 `D:\Lawbeach\lawbench-A`。managed MXC 保持原隔离；没有
启动 setup、切 legacy、申请扩权或改审批。以下按调用顺序记录；多段 PowerShell
命令归为一个调用。

```powershell
# C01, 0
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T30-GUI-final-observer-order-20261028-103604.md'
# C02, 1: shared dsh submodule permission denied
git status --short --branch
# C03, 0
rg -n --glob '!*.pyc' "_final_target_observation|EXPECTED_FILES" .
# C04, 1: attempted Get-Content on coordination directory, no write
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T30GuiFinalObserver-20261028-103604'
# C05, 0
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637' -Force
# C06, 0
git status --short --branch --ignore-submodules=all
# C07, 0
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-coord\T30GuiFinalObserver-20261028-103604' -Force -Recurse
# C08, 0
entry.py lines 1-150, 250-325, 400-535, 1090-1185
# C09, 0
Select-String start.ps1 -Pattern '^\$NativeEntry(Bytes|Sha256)\s*=|entry\.py|NativeEntry'
# C10, 0
Get-Content -Raw README.md
# C11, 0
rg -n "sqlite|case\.db|schema|CaseRegistry|admission" entry.py
# C12, 0
Get-Content -Raw 'D:\Lawbeach\lawbench-B\contracts\case_db.sql'
# C13, nonzero: shell field accidentally Bash; managed runner refused before execution
Get-ChildItem 'D:\Lawbeach\lawbench-B\service\lawbench\case'; Get-Content registry.py
# C14, 0
Get-Content -Raw '...\GenuineSessionAdmission-20261028-092536\run-kLVTTq\admission-report.json'
# C15, 0
entry.py lines 900-990
# C16, 0
Get-Content -Raw coordination projection-cache.ts
# C17, 0
Get-Content -Raw 'D:\Lawbeach\lawbench-B\service\lawbench\case\registry.py'
# C18, 1: PowerShell parse errors in relative-path formatting command; no write
Get-ChildItem ...\case | ForEach-Object { ... FullName.Substring((Length?)) }
# C19, 0
entry.py metadata plus lines 430-590
# C20, 0
README.md metadata plus final-observation context
# C21, 1 expected: read-only no-index diff found entry changes
git diff --no-index --stat -- <input-entry> <workspace-entry>
# C22, 0
rg -n "sqlite3|_final_target_observation|required_paths|...|notAcceptance" entry.py
# C23, 1 expected: read-only no-index diff found start changes
git diff --no-index --unified=3 -- <input-start> <workspace-start>
# C24, 0
entry.py lines 582-625 and 1288-1310
# C25, tool-argument error before execution: duplicate sandbox_permissions field
Get-ChildItem evidence root files with bytes/SHA
# C26, 0
Get-ChildItem source-case files with relative path/bytes/SHA
# C27, 0
Get-ChildItem 103405 case files with relative path/bytes/SHA; list run-root files
# C28, 0
Get-Item prepare/stop/old delivery/old static note with hashes; print start entry literals
# C29, 1 expected: read-only no-index diff showed exact entry delta
git diff --no-index --unified=3 -- <input-entry> <workspace-entry>
# C30, nonzero: shell field accidentally Bash; managed runner refused before execution
git diff --no-index --unified=3 -- <input-README> <workspace-README>
# C31, 0
Get-ChildItem evidence-root files with bytes/SHA JSON
# C32, 0
rg -n path/cache/sqlite/outcome terms entry.py
# C33, 1: PowerShell parse error in line-ending check; no write
foreach-file byte/BOM/CRLF/hash command
# C34, 1 expected: native-pwsh read-only no-index README diff
git diff --no-index --unified=3 -- <input-README> <workspace-README>
# C35, 0
entry/start/README byte, BOM, CRLF and SHA check
# C36, 1: PowerShell parse error in frozen-file comparison; no write
prepare/stop/old-delivery/old-note workspace-vs-input comparison
# C37, 0
print start entry literals; print actual entry bytes/SHA
# C38, 0
prepare/stop/old-delivery/old-note workspace-vs-input bytes/SHA comparison
# C39, 0
Get-Item/ReadAllBytes the two new Markdown files; verify exists, bytes, BOM, CRLF,
AUTHOR_RUNTIME_ZERO and GUI_PASS=false; print first eight lines of each
```

非零汇总：C02 是既存共享 submodule 权限阻碍；C04 把目录当文件读取；C13、C30
在 Bash 中执行前被 managed runner 拒绝；C18、C33、C36 是 PowerShell 复合命令
解析错误；C25 是工具参数重复，未启动命令。C21、C23、C29、C34 是
`git diff --no-index` 发现预期差异的正常退出 1。所有失败均未写文件、未启动产品
或外部服务，也未改权限、审批、ACL、锁、writer 状态或 Git。

## 写面

shell 没有写任何文件。`apply_patch` 成功写面只有：

| 序号 | 写面 |
| --- | --- |
| W1 | `entry.py`：最终观察块初改。 |
| W2 | `entry.py` 的 `notAcceptance` 与 `README.md` 最终观察口径。 |
| W3 | `start.ps1` 的入口 bytes/SHA 两行。 |
| W4 | 本新证据记录。 |
| W5 | 协调目录新交回件。 |

没有 Git `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、
`push`、暂存、锁修复或扩权。`index.lock`/权限问题不是本轮交付阻碍。

## 根侧下一步

根侧应先做完整 cumulative source/delta/raw/finally/pins 审计。源码与依赖不变时，
可复用既有 `103405` 的 UNSERVED prepared + registered run，无需重做
prepare/admission。首次实际 GUI 仍必须在真实确认框前由现场人员按真人门处理；
本作者没有 GUI、模型、HTTP、删除、停止、release、trash 或回收站操作。

`GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`、
`Packaging=HOLD`。
