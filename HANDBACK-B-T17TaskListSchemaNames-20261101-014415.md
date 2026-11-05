# HANDBACK — B 线 T17 契约 schema 名绑定修正

状态：**AUTHORED_NOT_RUN**（仅改写测试源文件，未运行任何测试/解释器/运行时）

## 1. 执行依据

- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-T17TaskListSchemaNames-20261101-014415.md`
- 批准清单：`D:\Lawbeach\lawbench-coord\T17TaskListSchemaNames-20261101-014415Input\approved.json`
- 改前快照：`D:\Lawbeach\lawbench-coord\T17TaskListSchemaNames-20261101-014415Input\test-before.py`
- 目标文件（已存在，未新建、未删改其他文件）：
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskListRecovery-20261101-013252\test_public_task_list.py`

## 2. 开工前状态核对

- 目标文件改前 SHA256 = `7A2D01FD6509C7A53D578D0E03109512C685CCF08A9288AB0AB48F5A903D45D2`
- 与 `approved.json` 的 `before_sha256` **完全一致**；与 `test-before.py` 逐字节一致（同一内容、LF 行尾、无 BOM、长度 8262 字节）。
- 结论：目标文件处于「已存在且未改动的原始状态」，符合执行令所述 EXISTING / UNSERVED 前提，可直接做定点替换，无需重演旧开工与调研。

## 3. 根因（执行令与批准清单一致，本次仅做绑定修正，未改产品代码）

原始 `contracts.validate` 的第二个参数是**相对 schema 名字符串**，不是文件系统路径；真实取值为 `BASE + schema_path + pointer`。
原测试把 `CONTRACTS / "files" / "xxx.schema.json"`（Path 对象）当作 schema 名传入，属于源码绑定错误，需在任何运行时介入之前先行改正。

## 4. 实际改动（严格 5 处字面量替换，逐条命中各 1 次）

| # | 改前 | 改后 |
|---|------|------|
| 1 | `contracts.validate(CONTRACTS / "files" / "cases.schema.json", "#", cases)` | `contracts.validate("files/cases.schema.json", "", cases)` |
| 2 | `contracts.validate(CONTRACTS / "files" / "task.schema.json", "#", good_task)` | `contracts.validate("files/task.schema.json", "", good_task)` |
| 3 | `contracts.validate(CONTRACTS / "files" / "result.schema.json", "#", good_result)` | `contracts.validate("files/result.schema.json", "", good_result)` |
| 4 | `contracts.validate(CONTRACTS / "files" / "task.schema.json", "#", bad_task)` | `contracts.validate("files/task.schema.json", "", bad_task)` |
| 5 | `contracts.validate(CONTRACTS / "api" / "tasks_list.schema.json",` | `contracts.validate("api/tasks_list.schema.json",` |

说明：第 1–4 条的 pointer 由 `"#"` 改为 `""`（顶层 schema），与相对名绑定方式配套；第 5 条只换 schema 名，
其 pointer `"#/$defs/response"` 与后续参数原样保留在下一行，未被触碰。

## 5. 未改动内容（按批准清单 scope 与执行令禁区逐条自证）

- 未改 `contracts`、产品代码、guard、bootstrap、imports、模板、用例数据、断言、helper、元数据、清理逻辑。
- 未改 `Config(..., contracts_dir=CONTRACTS)`；未改 `CaseRegistry(appdata, CONTRACTS / "case_db.sql")` 的 SQL 路径绑定。
- 目标文件中残留的唯一 `CONTRACTS / "` 引用即上述 `case_db.sql` 一处，属批准清单明确要求「held」的范围，保持原样。
- 文件行尾仍为纯 LF（CRLF 计数 0），无 BOM，UTF-8 无损写入。
- 未新增、未删除、未重命名任何文件；除目标文件外未触碰仓库内其他文件。

## 6. 改后元数据（最终 native PowerShell 元数据读取）

- 路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T17\T17TaskListRecovery-20261101-013252\test_public_task_list.py`
- 改后 SHA256 = `AB5A8F3DFA90069E67C59FBF2C4DE5142ED1A111D3E006C7206B28926BC574A8`
- 改后大小 = 8178 字节（改前 8262 字节，净减 84 字节，与 5 处短名替换的净缩短量一致）
- 5 条新串各命中 1 次（1/1/1/1/1），无重复无遗漏。

如实说明读取次数：除执行令规定的两份输入外，还读取了目标文件本身（读取原始字节是施加定点替换与核对 `before_sha256`
所必需），并在此前后各做过一次文件元数据/字面量计数读取。因此「仅改后一次元数据读取」的说法不成立，
实际为「改前一次 + 改后一次」。除此之外无其他额外读取、搜索或遍历。

## 7. 验证与边界声明

- **AUTHORED_NOT_RUN**：本次未运行 Python / Node / pytest / collect / build / prepare / 应用 / HTTP / 模型 / GUI / 凭据 / 运行时中的任何一项。
- 上述 SHA 与大小为纯文件元数据与字面量计数，非执行结果，不构成任何功能通过或失败的结论。
- 未执行任何 Git 写操作（无 add / commit / rebase / stash / reset / clean / checkout / push），未暂存；交付即本文件的落盘，未做 Git 提交。
- 未做额外读取、搜索、目录遍历、环境变量或元数据检查；除本执行令规定的两份输入、目标文件本身
  （读取原始字节与改前/改后元数据核对所必需）外，未扩展读取范围。

## 8. 遗留 / 待主编排决定

- 本修正只解决「schema 名 vs 文件路径」的源码绑定错误。测试的实际红绿结论需由具备运行许可的一侧执行，本次不预判。
- 若后续运行发现 `contracts.validate` 对空 pointer 或相对名还有其他约定（例如是否要求 `./` 前缀、是否要求 `""` 之外的顶层写法），
  属规范歧义，按 AGENTS 纪律应摘录原文交主编排决定，本次未自行扩大改动范围。
