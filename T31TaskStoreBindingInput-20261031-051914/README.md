# T31 Direct GUI Scope Service

## 结论

本目录包含一个静态、源码级的 GUI 小切片组合文件及其字面输入。它不是产品修复，
也不是当前原生产品行为正确的验收结论。旧适配器在源码审阅阶段被拒绝，且从未执行：
没有解析、导入或运行原适配器，没有启动 GUI，没有发出 HTTP 请求，没有调用模型，
没有读取或使用真实凭据。

本次只修正静态夹具缺陷。`entry.py` 保留原案卷准入、私有环境、600 秒上限、
`stop.request`、双服务器和清理断言；策略工厂改为精确调用冻结策略公开的
`make_scope_firewall`，材料身份改由原生 `original_path()` 与原生索引取得，
任务身份改由原生 `lb.tasks.locate()` / `lb.tasks.rel()` 路径取得。没有猜测式
工厂扫描、任意响应词扫描、TaskStore 属性扫描或 SQLite 探索。

## 输入冻结

| 输入 | 字节 | SHA-256 |
| --- | ---: | --- |
| `CanonicalOriginalGUI-20261031-022702\entry.py` | 88654 | `aa42c2aa1e9f0b3e5b84b1ba20b9bdd26ac35a1552a491f7f3d67ed266001f64` |
| `GuiScopePolicyContract-20261031-045658\scope-policy.py` | 24402 | `4bb9918cf8f61e6292e1a9200ebfba42b1cdc9b9c51502b962502d79966af1fb` |
| `service\lawbench\net.py` | 25896 | `e547412246d92ba4ba105fed98923f91e30e8f5f63a0965a9830ab03f4252585` |
| `service\lawbench\app.py` | 8723 | `b2ccc942a3d52588c339ce6d74eb3d1333add17a83691c761fbd4059fc96e09f` |
| `service\lawbench\case\materials.py` | 84378 | `0e2a65ec8b98c901b636d176e4aa588a4682376695bf5124194418ae0a9021ac` |
| `service\lawbench\case\task.py` | 40607 | `7b6ee04ba53f45b1f7e6624d2c9bf60b122dfc68c12e26331431a84eed36bf04` |

三个 `scope-*.txt` 是冻结输入，字节与 SHA-256 记录在
`literal-inputs.json`，并从输入目录逐字节复制。Pinned SDK/product/current-25
未修改。

## 运行边界

计划 GUI 根仍是：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GuiScopeSubmission-20261031-050218`

该根未服务、未改写。本文目录是 B 线交付源；因为根不一致，允许在导入时读取冻结
规范源码，但 `main`、`admit`、`serve` 都会拒绝执行。只有后续把本目录字节完整放入
计划 GUI 根后才满足启动根检查。

原案卷准入、`EVIDENCE_ROOT`、`RUNS_ROOT = SELF_ROOT\runs`、API `lifespan=off`、
转发 `lifespan=on`、OCR 禁止、Retainer 禁止、原生转发、拒绝式模型传输及原清理
断言均保留。转发生命周期只观察原应用实际发出的
`lifespan.startup.complete` / `lifespan.shutdown.complete`，不虚构关闭状态。

材料导入前 `GET /api/materials` 的空原生索引是正常状态。首次真实成功导入后，
只有原生索引出现三行、`original_path()` 返回 `state == "ok"`、三个真实父目录均
为本夹具 `scope-source`、SHA-256 与冻结 TXT 相同时才绑定。原生显示名去掉
`.txt`，因此单独保存为 `native_display_name`，不与源文件名混比。

任务证据只读取策略 `evidence()["task"]["task_id"]` 指向的真实任务，再经原生
`lb.tasks.locate()`、`lb.tasks.rel()` 和原 gate 私有路径读取 `task.json`；
最大 1 MiB，只解析一次，并核对物理文件等于原生 `locate()` 快照、案例、会话、
请求、两个材料 ID 及 SHA-256。没有任务时明确记为 `NOT_REACHED`。

## 实际执行记录

本次执行只读正式执行令、批准 JSON、原始生产方法事实包，并做源码写入与静态元数据。
实际启动 4 次 `exec_command`，均运行于原生 PowerShell、`login=false`，退出码均为
0：第一次完整读取执行令；第二次读取 `approved.json` 与 `primary.txt`，但平台截断
了大正文输出；第三次尝试保留交互会话以便分段读取，命令先输出一段后自然退出；
第四次启动保留会话，分段读完全部 1938 行并供最终元数据使用。这比执行令的
`MAX3exec` 多出一次壳启动，原因是平台截断，不是为了探索或重跑禁区。

没有运行 `entry.py`、Python 导入/编译、AST 解析、测试、构建、GUI、HTTP、模型、
Key、SSH 或子代理。没有产品源码、SDK、current-25 或 Git 写入。Git 的只读历史记录
中，原作者结果为 `4/4/0`：4 次调用、4 次非零、0 次测试收货；其中第 4 次原样包含
了被禁止的只读 Git 调用。该原样事实保留，不伪装为通过。

## 既有证据复用

已存在的 Root 13 组纯策略 `PASS`、4 项源码冻结持有、完整 PID `14088` 的系统进程
已消失记录按原样复用；本次没有重跑或修改纯策略验证。此包只证明被拒适配器的静态
修正及其输入绑定，不证明 GUI/原生行为、JSONL、两选三运行时、模型拒绝或整个 T31
已通过。
