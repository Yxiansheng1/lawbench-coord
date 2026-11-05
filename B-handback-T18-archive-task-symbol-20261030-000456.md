# B 线交回：T18 归档任务选择符号补正

## 结论

状态：`SOURCE_ONLY / BOUNDED_LITERAL_FIX / AUTHORED_NOT_RUN`

按
`D:\Lawbeach\lawbench-coord\B-T18-archive-task-symbol-order-20261030-000456.md`
完成有界静态补正。实际 B 服务中此前未声明的 `TASK_SKILL` 已在新自有交付目录中按令
声明；旧实际类仍保留两处未绑定消费者，供主编排后续用 helper 做反算对照。

本轮没有运行 helper、Python、Node、B 服务、消费者、AST、HTTP、模型、扫描器或 Native
流程。以下全部是源码与哈希准备结果，不是功能通过证据。

## 交付目录

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveTaskSymbol-20261030-000456`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-archive.mts` | 170355 | `279f3d3cd49e06a801aaa363c3b95d493b9f305e7d3c4a67b3f4c34454b6f76b` |
| `b-service-archive.py` | 54781 | `b6d1d7b695b0a31aa1359bc2d9341ffa0b8e0bcefc4d9c743889228839e39bac` |
| `literalfixed-inputs.json` | 15403 | `c073dfb333e1f9e9ea8f3741fa69793586c49344679437bc5e2e3df34db13462` |
| `archive-task-contract-finite.py` | 9556 | `beffb568f9304ae3a07afa80281cce9f9c878dc0e041a884cc27fb1418e99ba7` |
| `README.md` | 6560 | `2ba0ae0076bf221ef76d4eb4b2489b785d3b3b0a4bb7905aa3a5affe4712727f` |

## 有界修改

消费者从批准输入
`T18ArchiveTaskSymbolInput-20261030-000456\native-archive.mts` 逐字节复制；PowerShell
全文件比较为 `ByteIdentical=True`，bytes/SHA 与原值相同。

B 服务从同一批准输入的 54751 字节、SHA-256
`de60a4988fb8af32d9c8076cb7c210d69fdfa560753b264ed1678b40e09720f4` 复制，只在
`RUNTIME_SKILL` 后相邻加入一行：

```python
TASK_SKILL = "case-archiving"
```

反向字节比较结果：旧 54751 字节、新 54781 字节、delta 与插入字节均为 30；插入内容
精确匹配，插入点之后的旧后缀与新后缀逐字节相等。`_check_post`、`_exact_keys`、计数、
断言、拒绝、清理和任务参数均未修改。

清单从批准输入的 15395 字节、SHA-256
`a0423927fbd34ebd06e92b5e219b6a5e0b39d7b56e9046504a53e883dd4bc9bd` 派生。逐行比较
只有四个替换：`consumer.path`、`bService.path`、`bService.bytes`、
`bService.sha256`。格式、任务名、Review ID、15 条原件、29 个依赖、4 个私有编译文件、
3 个运行时可执行文件、4 个问题 ID、答案、prompt、预算、Native 报告与历史字段保持
原值。

新 B 服务中 `TASK_SKILL` 的只读文本位置：

- 第 44 行：唯一声明；
- 第 623 行：`/api/task` 请求检查消费者；
- 第 953 行：任务响应二次核对消费者。

## helper

`archive-task-contract-finite.py` 是唯一新增 helper 源码。它只使用 Python 标准库，
CLI 接收旧、新实际 B 源码，通过 AST 抽取实际 `FiniteFirewall` 和必要常量，在内存中
编译执行该类；不导入 B 模块、应用、路由、扫描器、`CaseRegistry`、Agent、Session、
历史、Key、HTTP 或模型。

内存构造使用 `app=None`、不创建的固定合成案件根和明显的单元案件/会话标记。三项控制：

1. 旧实际类对完全合法的合成 `/api/task` 请求必须抛
   `NameError(name="TASK_SKILL")`；
2. 新实际类对同一请求返回 `None`，且仅在内存中绑定 session；
3. 另一个新实际类对错误 Skill 请求返回 `TASK_SELECTION_BODY`，且 session 不绑定。

helper 还只读走查新源码全部全局 `TASK_SKILL` 引用，要求声明存在并与
`RUNTIME_SKILL` 相邻、两处消费者均在该声明后实际绑定。允许结论仅为：

```text
PURE_LOCAL_REQUEST_CONTRACT_UNIT_NOT_MODEL_OR_HTTP
```

作者没有解析、导入或执行该 helper，因此不宣称三项控制已通过。

## 保全与只读核验

未复制旧的 `archive-fixture-finite.py`，未修改或复用旧 run/report。旧根最终身份抽查：

- `native-archive.mts`：170355 字节，
  `279f3d3cd49e06a801aaa363c3b95d493b9f305e7d3c4a67b3f4c34454b6f76b`；
- `b-service-archive.py`：54751 字节，
  `de60a4988fb8af32d9c8076cb7c210d69fdfa560753b264ed1678b40e09720f4`；
- `literalfixed-inputs.json`：15395 字节，
  `a0423927fbd34ebd06e92b5e219b6a5e0b39d7b56e9046504a53e883dd4bc9bd`；
- `run-6O8MEj\report.json`：21326 字节，
  `d7e2edae7c108841fe17be058f867896bf518fc93ad7cc901f3af2a4fea995b6`。

执行前后均未对该旧目录执行写操作。除两个允许修改项、一个新增 helper、一个新增
README 和本协调目录正式交回件外，没有新建或修改交付文件。

Git 仅只读。初始全状态被子模块 `dsh` 的 `Permission denied` 中断；之后使用
`--ignore-submodules=all` 核对主工作树，未修权限、ACL、锁或审批。目标证据与新 helper
在 Git 中只显示为未跟踪文件；旧 `ArchiveNative` 原本也已是未跟踪既有交付。

没有执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或
`push`，没有暂存或提交，故无提交 SHA。Git 写入不在本运行器授权内，未尝试扩权或修复锁。

## 命令与阻碍记录

- 初次 `git status --short --untracked-files=all` 因
  `dsh` 子模块权限拒绝失败，立即改用主仓只读的
  `--ignore-submodules=all`，没有启动 setup。
- 按订单字面探测同名输入 `.md` 文件得到 `Cannot find path`，随后确认实际输入是
  `T18ArchiveTaskSymbolInput-20261030-000456` 目录。
- 一次 B 服务探测误用不存在的 `src\b_service\b-service-archive.py` 路径；
  随后按批准输入与旧证据定位实际交付源。
- 一次 PowerShell 二进制后缀比较因开放式数组范围语法报 `ParserError`；
  修正为显式闭合范围后得到单插入反向比较结果。
- 累计 8 次只读命令误填 `bash`，全部被 MXC 在执行前拒绝，未启动 setup、未切换
  legacy、无读写效果。
- 其余命令均显式使用
  `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
  且 `login=false`。未更改沙箱、审批或 ACL，未拆 writer 锁；当前 PID 未被当作第二
  writer。

## STRICT_NOT_RUN

未执行 Python、Node、TSX、helper、B 服务、消费者、AST 解析、import、语法检查、
单元测试、契约检查、构建、HTTP、扫描器、`CaseRegistry`、模型、Native Session、
事件、JSONL、GUI、真实案件、全量回归、所内/所外探测或任何 API Key 使用。

## 请主编排继续

1. 审阅本交回目录、清单反向差异和 helper；
2. 独立运行 helper，确认恰好三项控制通过且仅返回允许标签；
3. 做字面量准入检查；
4. 最后执行一次新的真实 Native 归档流程至闭环；
5. 本交回件不得作为一次新真实流程、T18 发车或归档质量通过的证据。
