# B 交回：T31 提交边界补齐

本次授权范围内的三个必要回归源码和说明已经落盘，等待根会话完整审阅后执行。
产品代码未改，测试状态为 `NOT_RUN`；这份交回不等于 T31 整体通过。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 只新增 `scoped_submission_edges.py`、同目录 `README.md` 和本交回件；测试源暴露三个新方法，分别覆盖同请求首次并发 begin、TaskStore 重启后的 release tombstone、以及 claimed pending 在首次 running 写盘失败后的恢复。 |
| 目标是什么 | 补上原目标缺少的三个必需边界证明，不扩成新功能或新框架。剩余步骤是根会话先完整读测试与运行选择，再只运行这三个新方法并作独立判断。 |
| 在等什么 | 等根会话的完整审阅、三个新方法运行结果和对证据的接受或返修结论。根会话接收后也不代表 T31 整体验收通过。 |
| 卡在哪 | 没有实现卡点。作者运行被执行令禁止，所以结果状态保持 `NOT_RUN`；Git 写入未获授权，因此没有暂存、提交或新 SHA。Packaging HOLD。 |

## 依据与验证

- 测试源：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedSubmissionEdges-20261026-104202\scoped_submission_edges.py`，实测 277 行、10605 字节、SHA256 `B236A1072E9F35332DF27CAFD0FAD5FB827E4277845D8B361F382546A3CACEC2`。
- 测试说明：同目录 `README.md`，实测 72 行、3550 字节、SHA256 `70517D073D8405AEE39F6E9B25BE96457DBD088A929D528A4FD2D2A37315005C`；其中列明三个精确测试名、各自可观察证明、根会话运行选择和冻结路径。
- 夹具复用：通过标准 `importlib.util` 读取既有 `ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py`，没有另建 loader；`load_tests` 只加入 `EDGE_TESTS` 中的三个新方法。
- 真实接缝：只读核对 `task.py` 的 begin、prepare、activate、TaskStore 初始化、`mark_abnormal` 和 end，以及 `request_scope.py` 的 release、`claim_or_replay`、持久记录格式。第三个用例只在既有 `_write` 上拦截第一次 `task.json` 且状态为 `running` 的写入，并在落盘前抛一次 `OSError`。
- 静态复核：源码文本中三个测试方法名与 `load_tests` 收集表一致；未发现 `time.sleep`、HTTP、`lawbench.app`、subprocess、keyring、socket 或 collect 入口标记。该检查是文本检查，不是 Python、AST 或测试执行。
- 工作树：开工时已有大量未提交修改和未跟踪证据，均保持原样。目标目录开工前不存在；新增前审计材料位于 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedSubmissionEdges-20261026-104202`，其中 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedSubmissionEdges-20261026-104202\before` 与 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedSubmissionEdges-20261026-104202\B-tracked-before.patch` 存在且未改。
- Git 状态：对本次目标目录的只读状态检查只返回一个新未跟踪目录；没有暂存、提交、rebase、stash、reset、clean、checkout、push、锁清理、ACL 或审批变更。

## 未做与降级

- 按令未运行 Python、测试、`unittest`、`pytest`、collect、解析器、AST、prepare 探针、服务、GUI、HTTP、构建、模型、网络或安装命令。作者不能给出红绿断言结果，根会话不得把 `NOT_RUN` 写成通过。
- 没有提交 SHA。此处是运行器授权边界，不是交付阻碍；交回以仓库内两个新文件和本协调目录文件为准。
- 产品源码、既有夹具、契约、schema、入口、guard、E50、库、配置、补丁、GUI、日志和 launcher 均未修改；没有启动或复用旧测试进程，没有联系其他聊天或更换 API。
- 两处只读操作偏差已实物记录：一次附带读取误将 shell 设为 `bash`，被原生运行器拒绝且没有执行命令；一次复杂 PowerShell 文件元数据命令发生解析错误。两者均未改文件，之后所有执行均使用执行令指定的原生 PowerShell 绝对路径与 `login=false`。
- 一次性全量未跟踪清单检查遇到既有证据目录的长路径警告并截断了显示；未执行文件操作，后续改用目标目录范围检查。该问题不影响本次新增文件存在性和 SHA 读数。
- Packaging、合流、盲测、发布和真人验收均未执行；本次只是三个必要回归源码的可审阅候选。

## 安全与冻结

测试源码只规划使用临时目录中的合成 TXT、真实 `CaseRegistry.open`、`Materials`、`TaskStore.prepare/begin/end` 生成数据；不导入应用入口，不使用真实案卷、材料名、Key、密码或网络。所有并发线程位于 `ThreadPoolExecutor` 上下文中，临时数据由既有夹具的 `TemporaryDirectory` 清理。第三个用例的唯一注入点位于既有 `TaskStore._write`，不替换范围、claim、结果或索引结果。

冻结读取路径均未修改：

- `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py`
- `docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py`
- `service\lawbench\case\task.py`
- `service\lawbench\case\request_scope.py`
- `contracts\files\request_scope_store.schema.json`

下一步由根会话先完整读取新增测试源、README 和本文，再按 README 的运行选择只执行三个新方法。若测试失败，把实际断言证据返回本线作有界修正；若通过，根会话仍需独立判断这些证明是否足够，不能据此宣称整个 T31 已验收。

Response ID: `B-handback-T31-scoped-submission-edges-20261026-104202`

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T31-scoped-submission-edges-20261026-104202.md`
