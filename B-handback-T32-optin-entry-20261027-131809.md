# B 交回：T32 opt-in 当前源码严格新入口

日期：2026-10-27  
执行者：独立 B 线 DeepSeek  
状态：`CODE_READY_FOR_ROOT_REVIEW / RUNTIME_NOT_RUN`  
结论：令内有界代码与 README 已落盘，协调目录交回件已写；未运行运行时代码，未参加 GUI，未打包，等待 root 按令复核。

## 1. 交付位置与静态身份

新入口目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveOptinEntry-20261027-131809\`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `server.py` | 140615 | `7d07b7ca3de79a37c5217e6069f748bf5907fd35d9ed0a76bc0757452d2715a9` |
| `probe.mjs` | 22165 | `b1b3fa29d57ad1b727dc04c21804dcb117b0d6efb970d94b29a9d2cf3b62cb92` |
| `README.md` | 9376 | `96f0378ac1edf77dd774177e47ad412b50d0f5106d1dd8212d4cdb1df1486cb1` |

交回件自身：

`D:\Lawbeach\lawbench-coord\B-handback-T32-optin-entry-20261027-131809.md`

本交回件不写自身摘要，避免循环依赖；其身份可由协调目录直接读取。

## 2. 既有状态复用

- 当前 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`。
- 旧审入口源目录：`docs\plan\evidence\T32\RefRemoveEntry-20261027-115753\`。
- 旧 `server.py` 仍为 134436 字节、`8fa44405afde2bc48d2223385957bc47732ade8a701c70e65e5d0df578c29a34`，未改。
- 旧 `probe.mjs` 仍为 15690 字节、`591f499fe02c25a43e455b1bae2258d95abc3988cf7d067891693dc5fc97e14d`，未改。
- 新入口 `server.py`、`probe.mjs`、`README.md` 从旧目录同层复制后只在新目录编辑；`PRODUCT_ROOT` 的 `parents[4]` 仍是 `D:\Lawbeach\lawbench-B`。
- 没有重跑旧 shell、旧 source runtime、旧 probe、GUI launcher 或 Native 1 旧源码。

## 3. 固定源码

路径：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32OptinEntry-20261027-131809\reviewed-current-native-source-pins.json`

- 实测 53,547 字节。
- 实测 SHA-256：`5856ffbfded1bceff8671e52bb903955a94415e58aff860f0e43c43a3b9d7835`。
- 文本内实测 346 个 `bytes` 项、346 个 `sha256` 项。
- `server.py` 的 `SOURCE_PINS` 与 `SOURCE_PINS_SHA256` 已精确改为上述路径和摘要。
- 入口自身仍按原逻辑动态计算并从固定清单比较中排除；没有改成动态哈希放行清单外当前代码。

作者没有修改产品源码、契约、schema、generator、旧入口、旧 probe、旧 source pins、旧 launcher、legacy/compiled/SDK/E50 或任何运行产物。

## 4. 有界实现

### 4.1 查询准入

`GET /api/materials` 新增精确解析：

- 必须恰有一次当前案件 `case_id`。
- `include_removed` 可省略，或恰有一次为原始字符串 `true` / `false`。
- 参数顺序允许互换。
- 空查询、空值、重复 case、重复 flag、未知键、错案和非法值在 Firewall 内以前既有语义码 `MATERIALS_LIST_QUERY` 拒绝，不进入原生 ASGI。
- 其他 GET 路由继续走原单 `case_id` / 单 `session_id` 精确约束；没有新增 route 或网络 guard 旁路。

解析结果在单个请求内由 `__call__` 传给 `_policy`，完成时再传给 `_complete` / `_complete_get`。没有把 `include_removed` 写进共享的“上次查询”标志，因此并发请求不能偷用另一请求的选项。

### 4.2 列表基线

- 删除前 default、false、true 三态都按移除前完整公开三行深比较，三行都必须保持 `parsed`。
- 删除后 default 与显式 false 都按移除前完整公开行深比较，只允许原来的 `M0001`、`M0003`。
- 显式 true 只新增真实持久化 `M0002` 墓碑，并逐行深比较三行；墓碑要求 `status=removed`、`chars=null`、`stale_ocr=false`、`error=null`、两个 OCR page 数组为空。
- 墓碑的编号、名称、相对路径、类型、单位、单位数、OCR 类型、origin、ref_id 和 location 都绑定移除前公开基线；probe 再与移除前原生 raw target 交叉核对。
- 原 `_verify_post_remove_state` 对 raw index、R01、另外两行、派生文本、外部来源、任务目录、登记和原件复制检查保持不变。

`protocol_complete` 现在要求删除前三态各一次、删除后三态各一次，并保留 default/false/true 三份完整列表元数据。协议不会在 wire 实际为 true 三行时声称 default 两行。

### 4.3 Probe

旧 probe 的全部原有断言保留：两次普通同案重开、第三次 403、两种重复 Authorization、remove guard negatives、真实 M0002 remove、default 删除后两行、source hash/mtime、无原件复制、任务空、引用根 live、自然 cleanup。

新增：

- 删除前 default/false/true 三份精确三行且全部 `parsed`。
- 删除后五类非法查询明确断言 `MATERIALS_LIST_QUERY`。
- 删除后 default/false 精确两行；true 精确两行加墓碑。
- 最终 `read_counts` / `read_ok` 都是 6，证明五个非法查询没有进入原生列表实现。
- 最终 default/false/true 计数均为 1，三份响应元数据都完整保留。
- 探针输出明确 `backend_guard_only=true`、`not_gui_acceptance=true`。

## 5. 静态验证与未运行项

已完成：

- 只读哈希、文件大小、目标目录文件集合。
- `git diff --no-index` 对新旧 `server.py`、`probe.mjs` 的完整人工审阅。
- `git diff --no-index --check` 未报告 whitespace diagnostic；因文件存在差异，该命令按 Git 语义返回 1。
- 关键方法、调用点、查询分支、墓碑字段和最终计数的人工交叉检查。

明确 `NOT_RUN`：

- Python / `py_compile` / import / AST / pytest / collector。
- Node / `vitest` / `tsc` / probe / HTTP。
- `server.py --prepare` / `--serve` / 20 秒有限运行。
- GUI、模型、OCR、安装、构建、打包、setup cleanup 运行验证。

因此本交回件只能证明作者侧静态实现与有界差异，不能声称运行绿、GUI 绿或 T32/Gate 1 完成。Packaging 仍 `HOLD`。

## 6. 实际命令与异常记录

所有成功启动的 shell 调用都显式使用：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

`login=false`，工作目录为 `D:\Lawbeach\lawbench-B`。成功命令只做以下类别：

- 读取正式执行令。
- `Get-Item` / `Get-FileHash` / `Get-Content` / `Get-ChildItem` / `rg`。
- `git status`、`git rev-parse HEAD`、`git diff --no-index` 的只读检查。
- `New-Item` 创建唯一新目录与三次 `Copy-Item` 初始复用。
- `apply_patch` 修改三个新文件并创建本交回件。

非零或未完整命令：

- 初次 `git status --short --untracked-files=all`：在共享 worktree 子模块 `dsh` 的 `.git` 目录遭遇 `Permission denied`；未修权限。
- 初次目录枚举中目标目录尚不存在，复合只读命令返回非零；随后按预期新建目录。
- 一次复合哈希命令在 launcher 参数层出现 PowerShell parser error，未完成该次读取；随后拆成显式 `Get-Item` / `Get-FileHash` 重做成功。
- `git status --short --ignore-submodules=all --untracked-files=all` 只读枚举遭遇既有超长路径 warning，输出很大且不能作为完整 clean proof；未改 Git 或文件系统。
- 两次 `git diff --no-index` 和一次 `--check` 返回 1。这是“有差异”的预期退出码，`--check` 没有 whitespace diagnostic。
- 共有 7 次工具调用误填了 `shell=bash`。这些调用在 shell 启动阶段被环境以 `Bash/E_ACCESSDENIED` 或 MXC packaged-app refusal 拒绝，命令体没有执行，没有产生读取结果或文件改动。此后全部调用保持显式 PowerShell。该通道偏差按要求如实记录，未通过安装、权限、sandbox 或 legacy 绕行。

Git 写入面为零：未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`。没有修 `index.lock`、ACL、审批或沙箱。

## 7. 写面

作者侧实际新增/修改仅四处：

1. 新入口 `server.py`
2. 新入口 `probe.mjs`
3. 新入口 `README.md`
4. 本协调目录交回件

另创建了容纳三份入口文件的唯一新目录。没有写 `runs\`、测试文件、产品源码、历史 evidence、缓存或全局配置。

## 8. 后续 root 门

建议 root 按正式执行令顺序：

1. 固定 pins 与 current-B cumulative source audit。
2. 审阅本入口相对旧审文件的完整 diff。
3. 确认四份新写面与命令审计。
4. 只在上述静态门通过后，启动一次 fresh finite 20 秒后端检查。
5. GUI 必须等待当前 A runtime 的独立完整复核、私有构建和固定；本交回不准备或运行 GUI launcher。

作者侧到此停止。
