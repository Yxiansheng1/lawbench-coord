# B 线交回件：T32 移除引用材料与请求范围可见性

状态：`AUTHOR_DONE / RUNTIME_NOT_RUN / PACKAGING_HOLD`。项目整体仍未完成。本轮没有产品修复，没有产品缺陷结论，没有宣称测试通过。

## 交回物

本轮只新增以下三个文件；其中前两个是仓库证据，本文件是协调目录交回件：

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RemovedScopeVisibility-20261027-143226\removed_scope_visibility_check.py`
  - 28255 bytes
  - SHA-256 `1425b07199a6c7383bb2ba49d2bf832eba51e8ce912221d41557d2d4bce5f40b`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RemovedScopeVisibility-20261027-143226\README.md`
  - 3826 bytes
  - SHA-256 `00297e0b534b8939492f5c7311df94e017004d56f813ed669f1cee3c3848c68f`
- `D:\Lawbeach\lawbench-coord\B-handback-T32-removed-scope-visibility-20261027-143226.md`

没有修改产品、旧消费者、旧测试、配置、契约、schema、pin、guard、SDK、编译产物或启动器。

## 单一消费者覆盖

`removed_scope_visibility_check.py` 是一个本机后端单元消费者，只有一个实际测试方法，并由 `load_tests` 只装载本类。它明确不是 HTTP、NativeSession、AgentLoop、模型、GUI 或完整 T31/T32 验收。

三份纯合成 TXT 引用在 `tempfile.mkdtemp(prefix=".t32-removed-scope-visibility-")` 的本次专属树内。案件、材料、引用和任务编号由生产方法生成。运行时 `uuid4` 只用于后端请求编号，代码注释明确标为 `BACKEND_UNIT_UUID_NOT_NATIVE_SESSION`。

组合场景依次核对：

1. 生产引用导入后，目标唯一标记可经真实检索找到，持久 `search_units` 中目标行数大于 0；三份原件哈希、大小、修改时间和实际引用原件路径已记录。
2. 请求 P 只准备目标；请求 C 只准备并开始目标；合法未准备的范围 U 开始后看到三份材料。
3. 只调用一次生产 `Materials.remove(case_id, [target_id])`。在调用任何移除后检索前，先用固定只读 SQLite `COUNT(*)` 断言目标 `search_units == 0`。
4. 核对目标原始索引墓碑的编号、名称、引用身份、哈希、路径和文本位置等稳定字段；另外两份原始索引行逐项不变；三份外部原件状态不变；另外两份派生文本逐字节不变；未关闭的同一引用根记录不变。
5. 准备但未开始的 P 在移除后 `begin` 报 `INPUT_CHANGED / request_scope_material_changed`，任务目录没有增加，范围记录仍为目标且无任务编号。
6. 已开始的 C 经 `context.build`、`case_list_materials`、`case_read_material`、`case_search` 分别报 `INPUT_CHANGED / task_scope_version_changed`，没有退回全案。
7. U 的列表只剩两份活跃材料；目标名称读取报 `MATERIAL_NOT_FOUND / unknown_material`；目标唯一标记检索为 0；共同活跃标记检索命中两份活跃材料并可读取；上下文不含目标名称/标记且包含活跃材料。
8. 新准备已移除目标报 `MATERIAL_NOT_FOUND / request_scope_material_unavailable`；随后准备一个活跃材料成功，排除“全部拒绝”造成的假绿。
9. P/C 的持久范围在结尾仍固定为目标编号和目标版本；测试没有改写范围或存储来使断言变绿。

## 当前源码签名

编写前已读当前源码，消费者按以下实际签名调用：

```text
CaseRegistry(appdata, sql_path, *, ref_home=None, ref_appdata=None, ref_system_dirs=None)
Materials(cases, lo_base, *, ref_context=None)
Materials.import_(case_id, paths, target, unzip, *, mode="copy")
Materials.remove(case_id, material_ids)
SettingsStore(appdata)
TaskStore(cases, settings, materials, *, request_scopes=None)
TaskStore.request_scope(request)
TaskStore.begin(session_id, cwd, request_id=None)
TaskStore.index_for_task(task)
TaskStore.end(task_id, reason, model_calls, tool_calls, elapsed_s)
case.context.build(root, task, index, read_input)
tools.run(ctx, tool, args, validate_result=True)
search.fts.search(root, case_id, index, query, max_hits=20, material_ids=None)
```

当前 `TaskStore.END_STATUS` 不含字面原因 `"cancelled"`；生产映射是 `"aborted" -> "cancelled"`。清理因此调用 `tasks.end(reason="aborted", model_calls=0, tool_calls=<实际尝试数>, elapsed_s=<实际> )`。

## 源码身份

当前 12 个关键源码的文件字节数和 SHA-256 均与 `B346-source-before.json` 中的 pin 一致：

```text
contracts/case_db.sql 4199 18513849ca3dde0cdf333682983c77561ad597744c29da23c75a2544ae2c4703
service/lawbench/case/materials.py 84378 0e2a65ec8b98c901b636d176e4aa588a4682376695bf5124194418ae0a9021ac
service/lawbench/case/registry.py 11656 05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21
service/lawbench/case/task.py 40253 80033acb3ae76585f4a44a4582d07068aa48aad433b7bc2a2e09349e5e3341c0
service/lawbench/case/request_scope.py 20322 9a0bcfe70c7aeedb05f2b6440526ae7cc10d4d3cd5c5edd4a7dc8000680dc405
service/lawbench/case/context.py 6409 1128f934f13e1f0453be4c73cea1466dd4bf54ede158cd359eedc48a57e4d9ee
service/lawbench/settings.py 5201 e790b0b1fe21f69e929bf4ee5e18063a8fc1d19673657e6fcb19c9c581f7c9ee
service/lawbench/tools/__init__.py 2594 83fe68104ebf5f8440205b7bc5be12dc52b31a7945bfcc6ca53ba35b30872f5a
service/lawbench/tools/materials.py 7115 9122850f43ca96647fe8c3240c47000c55e395aba983c221e2fc79fcdc476a73
service/lawbench/tools/search.py 562 cc26c032bdaff52283680ef43ce1f5421bf054d42217b4062d3ebef3efa89531
service/lawbench/search/fts.py 16832 8b2836de4f25b04d9b1e340b24a052ac71aa3f2ba1c7e3b636dd691525e8abc5
service/lawbench/errors.py 3204 f580d733d88a15a70df089f8b1bcd6bfffcac6b8a78013532aab61d2d20d33f4
```

## Setup / finally / 禁区

- 临时树内创建 appdata、引用源、案件、LibreOffice 基目录、blocked home 和 blocked system；`CaseRegistry` 与 `SettingsStore` 都只使用该明确私有 appdata。
- TXT 手工写面只有三份合成夹具。`index.json`、引用登记、`case.db`、任务、结果、读取记录和范围记录均由生产 API 生成。
- SQLite 唯一辅助函数只执行 `PRAGMA query_only=ON` 和固定 `SELECT COUNT(*) FROM search_units WHERE material_id=?`；每个连接均在 `finally` 关闭。
- 网络 socket、`urlopen`、`subprocess.Popen`、`subprocess.run` 被替换为立即失败。没有 mock 功能索引、任务、搜索或读取。
- 场景 `finally` 对所有实际开始的任务调用生产 `tasks.end`，记录清理错误但不覆盖主断言；未开始的准备请求不会被结束。
- 已开始的 C 在权威范围失效后，生产 `coverage` 也会报 `INPUT_CHANGED`，所以其 `tasks.end` 预期可能留下一条 `INPUT_CHANGED / task_scope_version_changed` 清理错误。该错误会打印但不掩盖场景结果。
- 删除临时树前再次核对三份原件 SHA/大小/修改时间以及两份活跃派生文本；外层仅在确认父目录为系统临时目录且名称前缀匹配后删除本次专属根。

## 运行时与验证禁区

`RUNTIME_NOT_RUN`。本轮作者没有执行 Python、Node、解析器、AST、import、collect、pytest、unittest、Vitest、tsc、selftest、prepare、serve、probe、HTTP、GUI、build、model、upgrade 或任何安装/自检。

因此：

- 没有作者侧红/绿/灰结果；
- 没有“新消费者通过”或“发现产品 bug”的结论；
- 没有 HTTP、NativeSession、GUI、模型调用或完整 T31/T32 证据；
- 根必须先完整审计本消费者、命令、setup/finally 和当前源码，再运行以下唯一命令。

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RemovedScopeVisibility-20261027-143226\removed_scope_visibility_check.py' -v
```

## 实际 Shell 命令、非零与写面

全部 Shell 调用均显式使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false`，工作目录为 `D:\Lawbeach\lawbench-B`。

只读/状态命令：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T32-removed-scope-visibility-order-20261027-143226.md' -Raw
git status --short --untracked-files=all
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RemovedListOptin-20261027-130434\removed_list_check.py' -Raw
Get-Content -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32RemovedScopeVisibility-20261027-143226\B346-source-before.json' -Raw
rg --files src tests docs\plan\evidence\T32
rg --files service\lawbench
Get-Content / rg：case/materials.py、case/registry.py、case/task.py、case/request_scope.py、case/context.py、tools/__init__.py、tools/materials.py、tools/search.py、search/fts.py、settings.py、errors.py、logs.py、contracts/case_db.sql、task/tools schema
Get-Content：旧 RemovedListOptin README、新脚本、新 README
Get-Command python
Get-Command py
Get-ChildItem：目标证据目录及新证据文件
Select-String：从 B346 pin 提取关键源码身份
Get-Item + Get-FileHash -Algorithm SHA256：12 个关键源码、新脚本、新 README
git status --short --ignore-submodules=all --untracked-files=all
```

非零命令：

```text
git status --short --untracked-files=all
exit 1；子模块工作树 D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh 权限拒绝。未扩权、未修复、未写 Git。

rg --files src tests docs\plan\evidence\T32
exit 1；仓库没有 src 目录，仅缺少该搜索根；随后对 service 重查成功。

foreach ... | Format-Table
exit 1；PowerShell ParserError（foreach 语句后直接管道）；随后改为先赋值 $rows 再格式化，成功取得哈希。

Get-ChildItem 目标证据目录
exit 1；当时目录尚不存在，返回为空；之后仅创建该指定目录。
```

后续 `git status --ignore-submodules=all` 退出 0，但输出约 4982 行，包含大量既有修改/未跟踪文件，并有既有超长路径无法展开的 warning。该输出没有触发任何清理或 Git 写入。另一次不带 `--ignore-submodules` 的状态检查因 `modules/dsh` 权限被拒。

写面仅包括：

```text
New-Item -ItemType Directory：创建指定 RemovedScopeVisibility-20261027-143226 目录
apply_patch：新增脚本
apply_patch：新增 README
apply_patch：新增本交回件
```

没有 `git add/commit/rebase/stash/reset/clean/checkout/push`，没有修改锁、审批、ACL、沙箱或 writer 身份。

## 根复核关注点

- 先只读审计消费者是否准确遵守当前源码签名和错误原因，再运行唯一命令。
- 首轮若红灯，按真实栈和断言定位；不得放宽 P/C 必须失败、U 必须有效、移除前 SQLite 必须清零或活跃对照必须成功这些硬门。
- 正常运行的清理行可能含已开始的 C 因 `INPUT_CHANGED` 无法完成 `tasks.end` 的记录；这是清理可观测项，不应被误当成缺失清理逻辑或被吞掉的主断言。
- 根完成运行后另行决定证据等级；当前不得把本交回件写成 T32/T31 已通过或项目已完成。
