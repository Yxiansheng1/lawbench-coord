# B 线 T33 跨卷引用重新定位交回

## 任务与原卡

- 状态：**SOURCE_ONLY_NOT_RUN**
- 执行令：`D:\Lawbeach\lawbench-coord\T33CrossVolumeOrder-20261026-144123.md`
- 原卡：T33；本件只补“当前原生 `CaseRegistry` / `Materials` / `RefRegistry` 的真实跨 NTFS
  卷 目录引用 登记 -> 原件迁移 -> `missing` -> `relocate` -> 重启读取持久身份”这一个缺口。
- 非目标：不是 GUI 验证，不是整卡验收，不是新产品服务/启动器，不声称消费者已执行或已通过。
- B 线基线 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 当前产品基线：`materials.py`、`refs.py`、`registry.py` 的 SHA-256 与
  `T31IndependentCurrentInput-20261026-144123` 快照/manifest 完全一致。

## 改动文件

只写了执行令白名单中的文件：

| 文件 | SHA-256 |
|---|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\CrossVolume-20261026-144123\cross_volume_check.py` | `36f90b48bf0b3634c2d8ed5d922f347a1c71c30c4b6e760b72ac2a7288613ffd` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\CrossVolume-20261026-144123\README.md` | `a9b895fb76fd92df46b75a3d780ca47ef885eb1963193a895d2001e0500e818f` |
| `D:\Lawbeach\lawbench-coord\B-progress-T33-cross-volume-20261026-144123.md` | 过程进度，见文件本体 |
| `D:\Lawbeach\lawbench-coord\B-handback-T33-cross-volume-20261026-144123.md` | 本交回件 |

没有改产品、现有测试、契约、工单集、旧证据、Git 索引或 Git 历史。

## 实现范围

`cross_volume_check.py` 直接加载当前产品模块，只有一个有限 `unittest`：

1. 用 Win32 卷 API 验证显式 C/D 父目录都位于 NTFS、卷 UniqueId 不同；父目录必须存在、
   为普通本地绝对路径、非盘符根、路径链无 reparse，且规范化路径不超过 150 字符。
2. 只在两个显式父目录下创建唯一的 `lb33c-<12hex>` / `lb33d-<12hex>` 根；合成案件、
   appdata、home、lo 与 C 源目录为兄弟关系。
3. 合成材料只有 stdlib 写出的一个 TXT。调用真实
   `CaseRegistry.open`、`Materials.import_(mode="ref")`、`Materials.scan`、契约校验、
   `Materials.original_path` 和 `Materials.index`，确认是引用登记且案件中没有原件副本。
4. 跨卷移动不调用同卷 rename：逐文件 `copy2`，核对 hash、mtime 后 unlink，再移除空源目录；
   随后断言旧源不存在、目标树无 reparse，且目标位于不同卷。
5. 再次真实扫描，断言引用根和材料均为 `missing`；调用真实 `Materials.relocate`，断言
   `restored=1`、`still_missing=0`，并保持 `material_id`、`ref_id`、`name`、`imported_at`、
   hash、size、mtime、`text_path`、`rel_path`。
6. 重新构造真实 `CaseRegistry`、`Materials`、`RefRegistry`，只从持久文件读取，确认材料
   `parsed`、引用根 `ok`、当前原件路径指向 D 卷目标。
7. 运行入口要求测试数恰为 1；零测试、skip、断言失败或 cleanup 失败均非零退出。

运行期只在材料接口之外安装边界桩：网络/connect、subprocess/Office 拒绝；应用入口、OCR、
Keyring、模型模块在导入前拒绝；转换器替换为 TXT 拒绝桩。`import_`、`scan`、`relocate` 的
真实结果没有被替换，index/refs/task/result/history 也没有手写。

## 作者实际执行与失败

作者用正式执行令指定的绝对
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
且 `login=false` 完成了执行令、T31 安全 fixture、当前 `materials.py` / `refs.py` /
`registry.py` / `ref_paths.py` / `gate.py`、相关 index/refs/import/scan/relocate 契约、
卷事实和当前源码哈希的只读检查。代表性命令包括：

- `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T33CrossVolumeOrder-20261026-144123.md' -Raw`
- `Get-Content ...T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py -Raw`
- `Get-Content ...service\lawbench\case\materials.py -Raw` 及同目录 `refs.py`、`registry.py`、`ref_paths.py`、`gate.py`
- `Get-Content ...contracts\files\material_index.schema.json`、`material_refs.schema.json` 及 materials import/scan/relocate 契约
- `Get-FileHash -Algorithm SHA256 ...` 对照当前产品与协调快照
- `rg` / `Select-String` 做白名单、禁用调用、测试数量和字段路径的文本级审计

非零与阻碍均保留：

- `git status --short --branch`：exit `1`。只读 Git 在
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 报 `Permission denied`。
  未修复、未扩权、未改锁；改用协调目录既有 dirty 快照保全状态。
- 初始目标证据目录列举：exit `1`、无输出；当时目标目录确实不存在。
- **执行器偏差**：有 7 次只读命令误把 `shell` 填为 `bash`，环境均未执行命令，统一返回
  `Bash/E_ACCESSDENIED`。对应内容包括 volumes、contracts/files、`case_db.sql`、
  T37 relocate 搜索、fts 搜索、快照 B 文件列表和最后的禁用字符串搜索。没有用 bash 重试，
  后续全部以规定的绝对 `pwsh.exe` / `login=false` 重读。
- 另有一次 `materials.py` 分段读取的 `shell` 路径字段拼错，但工具返回了该分段输出；该分段
  随后已用指定精确 shell 重读。未改变文件、权限、沙箱或环境。
- 一次 `rg` 正则因 PowerShell 引号返回 unclosed group，随后改用单引号 `-e` 模式成功。
- 若干 `rg` 无匹配和一次读取不存在的 `material_list.schema.json` 返回 exit `1`/无输出；
  无匹配是预期文本审计结果，不是产品运行失败。

没有运行 Python、Node、产品、测试、parser、AST、Vitest、tsc、pytest、collect、prepare、
serve、probe、build、GUI、HTTP、模型或 selfcheck。没有安装、启动 setup、切换 legacy、
联系其他聊天、换 API、改权限/ACL/沙箱/审批/锁，或执行任何 Git 写操作。

## 作者验证状态

**NOT_RUN**。作者只做源码与 README 的文本级静态审查，没有执行或编译
`cross_volume_check.py`，因此不声称其语法、运行结果、GUI 或整卡状态。

需要 root 独立全文审查完整 source/setup/cleanup/all command events，然后再决定是否运行。

## Root 执行

先在 `C:`、`D:` 分别准备 root 自己拥有的短 scratch 父目录；父目录必须已经存在、
不是盘符根、非链接/junction/reparse、路径规范化后不超过 150 字符。建议使用
`C:\LB33-OWNED-C` 与 `D:\LB33-OWNED-D`，执行前由 root 创建并确认所有权。

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\CrossVolume-20261026-144123\cross_volume_check.py' --c-parent 'C:\LB33-OWNED-C' --d-parent 'D:\LB33-OWNED-D'
```

不得加 pytest、unittest discovery、`-m unittest`、产品入口或 shell 包装。成功标准是该进程
返回 `0`，恰运行 1 个测试、无 skip、全部断言与 cleanup 成功，并打印
`T33_RESULT`、`T33_HASH`、`T33_VOLUMES` 及两条 `T33_CLEANUP ... state=removed`。
这不等于 GUI 或整卡结论。

## 副作用、清理与依赖

- C 父目录下会临时出现一个 `lb33c-<token>`，内含 `appdata`、`home`、`case`、`lo`、
  `refroot`；D 父目录下会临时出现 `lb33d-<token>`。
- 产品在 C 的合成案件/appdata 中写 `case.db`、cases/index/refs、材料文本和检索索引；TXT
  原件从 C 的 `refroot` 迁到 D 的 `refroot`。
- 不改全局 `TEMP`/`TMP`/`HOME`/用户环境变量，不使用默认临时目录，不在两个显式父目录之外
  写文件。
- cleanup 在成功和失败路径都执行，只删除精确直系 `lb33c-*` / `lb33d-*`；删除前复核 parent、
  containment 和整树无 reparse，不使用通配符。发现可疑即拒绝删除、打印 `state=refused` 并令
  运行失败，不扩权。
- 没有长驻应用、OCR、Office、模型或服务需要关闭；产品 SQLite 句柄由当前 `Materials`/
  `CaseRegistry` 路径自行关闭。
- 依赖为 Python 3.12 标准库、当前仓库 `service/lawbench` 与 `contracts/`、以及仓库已安装的
  `jsonschema` / `referencing`。不需要安装、打包、部署或网络。

## Git 与遗留

- 按执行令，Git 严格只读；没有 add/commit/rebase/stash/reset/clean/checkout/push，
  所以本交回没有新提交 SHA，也不是 Git 提交。
- dirty 既有内容按开工快照保全；开工时目标证据目录不存在。
- 唯一遗留是“消费者尚未由 root 执行”，这是本令要求的作者侧 `NOT_RUN`，不是交付阻碍。
