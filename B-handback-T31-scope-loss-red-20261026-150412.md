# B formal handback — T31 scope-loss paired regression

状态：`SOURCE_ONLY`  
作者验证：`NOT_RUN`  
Git：严格只读，无 add/commit/rebase/stash/reset/clean/checkout/push  
执行者：PID `35484`，单一 writer

## 1. 目标与出处

本次唯一输入是：

`D:\Lawbeach\lawbench-coord\T31-scope-loss-red-order-20261026-150412.md`

目标是在不修改产品的前提下，先给出两个相互独立的实际生命周期配对证据：

1. 未 prepare 的合法新 R 当前仍应以 `request_scope: null` 启动全案任务并正常结束；
2. 同一会话中另一个 R 已对三份合成材料中的两份完成真实 scoped prepare，
   随后只删除它自己的持久 R 行；同一 R 再进 `TaskStore.begin` 时必须失败关闭，
   不得静默变成全案/null-scope 新任务。

本轮同时读取了：

- `root-C-adjudication.md`
- `service\lawbench\case\request_scope.py:169-205`
- `service\lawbench\case\task.py:280-312`、`394-473`
- `contracts\api\request_scope.schema.json`
- `contracts\files\request_scope_store.schema.json`
- `contracts\files\task.schema.json`
- `contracts\core\task_begin.schema.json`
- `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py`

## 2. 改动与 Git 状态

只新增了本执行令允许的四个文件：

| 文件 | SHA-256 / 状态 |
|---|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py` | `5BF34CDD65BE170754BA4FAA1F40EF312045F4FFC160983FF15A0E0D61F69AF2` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\README.md` | `8BEDF71AD9282704A88BB961D88BACA3AC2C2E62B63A12C5B21343540228CC52` |
| `D:\Lawbeach\lawbench-coord\B-progress-T31-scope-loss-red-20261026-150412.md` | 本进度件 |
| `D:\Lawbeach\lawbench-coord\B-handback-T31-scope-loss-red-20261026-150412.md` | 本交回件 |

没有修改产品、旧测试、schema、config、alias、loader、runtime、lib、entry、
guard 或 pins；没有建包、部署、安装或外连。

分支：`line-B`  
开工/当前只读 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`  
提交 SHA：无。Git 写入不在本运行器授权内，交回以协调目录文件为准。

既有 dirty 的快照基线是：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ReviewRegression-20261026-150412\B-status-before.txt`

该基线及工作树内既有改动均未覆盖、清理或暂存。

## 3. 作者验证状态与静态预期

作者按令没有运行 Python/Node、产品、测试、parser/AST、Vitest、tsc、pytest、
collect/list/prepare/serve/probe、GUI、HTTP、build、model 或 selfcheck。
因此当前没有可宣称的绿、红或通过率；唯一状态是 `NOT_RUN`。

仅按权威源码静态阅读，预期控制例通过，丢失例在实际执行时于
`assertIsNotNone(failure, ...)` 处产生两例自身的语义断言红。该预期不是执行结果，
也不能被写成协议缺陷结论。根必须独立复核并实际运行一次后判定：

- 真实缺陷；或
- 未 prepare 新 R 与已 prepare 但丢行 R 在当前持久形状上不可区分所暴露的协议意图缺口。

## 4. 回归内容与证据

新脚本只用 stdlib `unittest`，通过模块对象复用原始安全夹具的 setup：

- 真实当前 `CaseRegistry`、`Materials`、`TaskStore`
- 私有临时目录与合成 TXT
- 转换器拒绝桩与网络连接拒绝
- 不导入旧测试类到发现面，不运行旧测试
- 两个测试使用全新的独立夹具；控制 R 与故障 R 不同，但会话相同

故障例从真实 `prepare` 生成的 `request-scopes.json` 中只移除 `FAULT_R`。
断言消息记录：

- 夹具私有 store 的精确绝对路径
- 删除前/后的 R 键
- 被删行的 `state`、`task_id`、材料编号
- 实际 begin 的返回或异常
- 是否创建新任务
- 返回/持久/权威 scope 与当时可见材料编号
- 每个意外任务的结束结果和 cleanup 错误

没有伪造任务、材料、结果、索引或会话历史；合成 UUID 只表示 native backend
生命周期单元，不声明为真实 `NativeSession` R。

两例都在断言前清理：

- 控制例先 `completed` 结束任务，再验证结束状态与全案范围。
- 故障例若意外成功，先读取结构、`aborted` 结束实际任务，再作失败关闭与无新任务断言。
- 测试 cleanup 再幂等处理意外路径，关闭 converter patch，并删除私有临时目录。

## 5. 根执行与 cleanup

工作目录：`D:\Lawbeach\lawbench-B`

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ReviewRegression-20261026-150412\scope_loss_check.py' -v
```

绝对 Python 路径已只读确认存在。`-B` 禁止写 `__pycache__`。测试的私有临时目录
以 `.t31-scoped-task-` 开头，位于 `D:\Lawbeach\lawbench-B`，正常、断言失败和
一般异常路径均会 cleanup。

运行后可只读核对无残留：

```powershell
Get-ChildItem -LiteralPath 'D:\Lawbeach\lawbench-B' -Force -Directory -Filter '.t31-scoped-task-*'
```

预期无输出。若解释器硬崩溃留下目录，根先按精确字面路径确认它属于本次运行的
允许前缀，再决定受控清理；本轮作者没有创建或删除任何临时任务目录。

## 6. 依赖、失败命令与遗留

依赖：唯一确定的运行解释器为上述 Python 绝对路径；本轮没有安装、升级或联网。
安全夹具的运行时 import 兼容性未由作者验证，留给根的独立 review/有限 run。

全部失败命令均记录如下；均未通过 escalation 重试，也未改变沙箱、审批、ACL 或锁：

| 只读命令/尝试 | 实际失败 | 处理 |
|---|---|---|
| `git status --short --untracked-files=all` | exit 1；`cannot chdir to ...\modules\dsh: Permission denied`，子模块 `git status --porcelain=2` 失败 | 按令保留阻碍；使用既有 `B-status-before.txt` 作 dirty 基线，不修锁 |
| 枚举 `contracts\*.schema.json` 时误将 runner shell 设为 `bash` | runner 返回 `Bash/E_ACCESSDENIED`，命令未执行 | 立即改回指定 `pwsh`；后续所有 exec 均显式使用指定绝对 shell |
| 首轮只读目标存在性对象格式化命令 | PowerShell `ParserError`；对象字面量内 `Test-Path` 表达式未加括号，无命令执行 | 改为简单 `Test-Path` 只读检查 |
| 第二轮只读目标存在性格式化命令 | PowerShell `ParserError`；复杂 loop/pipeline 被解析失败，无文件变更 | 使用目录列表与简单 `Test-Path` 核对；目标当时不存在 |
| 探测三个候选 Python 路径的 `Get-ChildItem ... -ErrorAction SilentlyContinue` | exit 1，因为 `.venv`、`venv` 两个候选不存在 | 输出确认 runtime Python 绝对路径存在，并使用简单 `Test-Path` 复验为 `True` |

未执行失败的测试命令，因为作者被明确禁止运行测试。

遗留：R 行删除后，持久 store 的可见形状与“从未 prepare 的合法新 R”相同；
当前源码在缺行时创建空材料 `claiming` 记录，后续会走全案/null-scope。根需在
实际运行后裁决修法，不能以 blanket reject 破坏控制例，也不能在本轮自行新增字段或修 guard。
