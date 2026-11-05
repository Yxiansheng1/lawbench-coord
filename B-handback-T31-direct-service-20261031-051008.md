# B 线交回：T31 Direct GUI Scope Service

状态：`STATIC_SOURCE_CORRECTION_COMPLETE / RUNTIME_NOT_RUN`

正式执行令：

`D:\Lawbeach\lawbench-coord\B-T31-direct-service-order-20261031-051008.md`

## 交付

目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\GuiScopeDirectService-20261031-051008\`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 43651 | `3d6e215a6e15024768d4b29c005505358d83c6f64893963ade1da9ecd6ef586f` |
| `README.md` | 4792 | `1e480bbc58ce36cde3e2c382970af7e3e115fb877816957b8f281cf3df6c12b4` |
| `literal-inputs.json` | 7113 | `f7f2027c72a0e10c5b0c0b15ce4f022d62dcf8fe90b7ef0c61a902999c8488a5f` |
| `scope-a.txt` | 37 | `0a51e0be95614eef753152f14e9c6ff303f47814b07da716e57141baf4ceb6e8` |
| `scope-b.txt` | 37 | `3035e0e8f6e9a1b8c907425544c09628c9052c9d2042de6bc166d9f89cf87e91` |
| `scope-c.txt` | 39 | `5195e5e8b39b260769436bb9967e1f22456a748fb495c17a2795e7905e29a439` |

三个 TXT 从批准输入目录逐字节复制，字节数与 SHA-256 均命中批准 pin。
`literal-inputs.json` 已用 PowerShell `ConvertFrom-Json` 仅做语法解析，结果为
`PASS`。

## 已修正

- `EVIDENCE_ROOT=SELF_ROOT`、`RUNS_ROOT=SELF_ROOT\runs`；计划 GUI 根一致性检查只在
  `main/admit/serve`，导入阶段允许读取冻结源码。
- 删除策略工厂名列表、构造器探测、类扫描和吞异常的循环；精确执行冻结纯策略模块，
  直接调用 `make_scope_firewall(ORIGINAL.Firewall, source_root=root/'scope-source',
  source_sha_by_name=<三个字面 SHA>)`。
- 使用普通嵌套子类，正常调用 `super()`；保留批准 ContextVar 与原生响应转发。
- 删除 `_bounded_ids`、`_extract_named`、任意 TaskStore 属性扫描、SQLite/SQL 探索。
- 材料只经原生 `lb.materials.index()` 和
  `original_path(..., op='materials_original')` 解析；显示名 `.txt` 剥离问题通过
  `native_display_name` 单独记录，绑定使用真实源文件名。
- 首次真实成功导入后绑定一次；第二次导入读取并记录
  `response['value']['scan']['added']`；绑定后 GET/import 只复核原索引 ID、源文件、
  SHA 集合。
- `scope-evidence.json` 只写运行根，不写 `scope-source`。
- `/api/request/scope` 与 `/core/*` 的精确写路由在绑定完成和两个 listener 均就绪前
  拒绝；没有 `send/core` 子串过滤。
- 任务证据只从策略 `evidence()['task']['task_id']` 出发，经原生
  `lb.tasks.locate()`、`lb.tasks.rel(task_id, 'task.json')` 和原 gate 私路径读取；
  1 MiB 上限、单次解析、物理文件与原生快照一致、scope/session/request/两个材料
  ID+SHA 核对；无任务明确记 `NOT_REACHED`。
- `_inventory` 使用原 `_tree_files()` 的 `relativePath` 键。
- 从 `lawbench.net` 同批导入原 `forward_app()`，传入
  `transport=transport`、`external_policy=lb.external`、`external_key_getter=external_key`；
  API lifespan 仍为 off，转发 lifespan 为 on，OCR/Retainer 仍关闭。
- 转发包装只观察原应用实际发出的 `lifespan.startup.complete` 和
  `lifespan.shutdown.complete`；清理无法证明时判失败，不伪造完成。

## 证据复用

- Root 13 组纯策略：既有 `PASS`，未重跑、未修改。
- 源码冻结：既有 4 项持有，未修改。
- 原完整 PID `14088`：既有 `OS_GONE` 记录，未重启、未探测。
- 原适配器：静态拒绝，`NEVER_EXECUTED`。

本包没有重演开工、安装、调研、全量测试或 GUI。原生产方法只有在未来运行 Corrected
entry 时才会导入；本次只做源码组合，没有证明原生行为、JSONL、两选三运行时、模型
拒绝或整个 T31 已通过。

## 验证与本机元数据

- `entry.py`：1119 行，生成时未执行、未导入、未编译、未做 AST 解析。
- 没有 `product/current-25/SDK` 修改，没有 GUI、HTTP、模型、Key、SSH 或子代理。
- 计划 GUI 根仍为
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218`，
  未服务、未改写。
- Git 严格只读且本次未执行任何 Git 写操作；没有 `add/commit/rebase/stash/reset/
  clean/checkout/push`。交回是本文件，不是 Git 提交。
- 原作者历史结果原样保留为 `4/4/0`（4 次、4 次非零、0 次测试收货）；其中原第 4 次
  调用包含被禁止的只读 Git，未删除、未掩盖。本次没有修复该历史记录。

## 偏差与限制

1. 正式执行令要求最多 3 次 `exec`。平台把第二次大正文读取截断后，第三次尝试保留
   原生 PowerShell 会话时自然退出；因此实际启动 4 次 `exec_command`：3 个读取阶段
   + 1 个保活原生壳启动。4 次均原生 PowerShell、`login=false`、退出码 0。没有借此
   增加 Git、测试、探测或运行时动作。
2. 组合文件为 1119 行，高于“约 600 行”的目标。未做仅为压行数的装饰性压缩；原 guard、
   admission、私有环境、双服务器、清理及必要边界逻辑均保留。请 Root 在静态复核时
   决定是否要求结构性拆分。
3. 因为交付源位于 B 目录而计划 GUI 根仍是 A 提交根，当前 `main/admit/serve` 会按
   设计拒绝；只有后续把本目录放入计划 GUI 根后才可进入运行阶段。
4. JSON 只做了语法解析，Python 源码没有运行器检查。按令的静态边界，语法/Import/
   运行时问题不作为本次“静态修正完成”以外的通过宣称。

## 建议 Root 下一动作

只做静态复核：核对根一致性门、直接工厂调用、材料绑定、任务原生路径、转发器导入与
观察字段，以及是否接受 1119 行组合体。若要求运行，必须另发受控运行令并放在计划
GUI 根；本交回件不构成运行授权或发版结论。
