# A 线交回：T18 任务 Skill 绑定

## 1. 目标与出处

执行令：

`D:\Lawbeach\lawbench-coord\A-T18-task-skill-binding-order-20261030-023251.md`

来源注记：

`D:\Lawbeach\lawbench-coord\A-T18-task-skill-binding-source-20261030-023251.md`

目标是把 `task/begin` 已返回的显式任务 Skill 绑定到首次模型的同一个 `lawbench-context` 快照，要求模型先调用实际 `skill` 工具加载该 Skill，再执行任务；不新增 Skill 分类、正文注入、业务门或 TaskState 字段。

## 2. 改动清单与提交 SHA

分支：`line-A`

父提交/只读 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`

本次提交 SHA：无。执行令禁止 Git 写入，index 和 dirty 状态均未改变。

产品改动：

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
- 类型：既有 dirty 文件上的有界修改
- 定钉前：50557 字节，SHA-256 `d76bd85184e271ffb7aa10a4e8e1a5a11242aa4ae80850f02f29e94f89e94801`
- 当前：50901 字节，SHA-256 `e78789e20dc9e015664d41cebc1b55097c6a70ba6e85ce221006d5d06a23bbec`
- 相对定钉文件：新增 7 行，删除 0 行
- 当前行位置：351、358–363

新增测试：

- `D:\Lawbeach\lawbench-A\dsh-ext\tests\task-skill-binding-20261030-023251.spec.ts`
- 250 行，8777 字节
- SHA-256 `a60c87e6bf2312b8c5091486bfbb98f86acc46e5faeaff1fdb3731810ba119e`
- `git status` 只显示该文件为 `??`；没有暂存

测试覆盖：

1. 显式选中 Skill 在首快照中精确出现一次，并保留 L0、L1、能力边界、原 decision 消息、task/provider/model/params/required questions/budget。
2. `skill=null` 时自由对话快照保持原三段。
3. 同一 `LegalAgent` 上两个会话选择不同 Skill 时不串线。
4. 第 2 步不重注 Skill。
5. 同一真实单位 agent ID 下一新任务使用新 begin 选择，不复用旧选择。
6. `context` 失败时不产生 `enter` 或快照。

所有新增测试标识均为合成单元标识；没有伪装成 Native 事件、历史或真实案件。

## 3. 红绿验证

运行验证：`NOT RUN`，A 线执行者 runtime=0。

执行令明确禁止 Node、Python、AST、导入、检查、测试、构建、HTTP、模型、GUI、SSH、进程探针、环境 Key 读取和 DPAPI。因此：

- 没有宣称红测、绿测或测试通过。
- 没有编译新测试或产品源码。
- 没有运行模型，不能宣称模型会遵守指令。
- 没有运行原生生命周期或 SDK 消费边界。

静态只读检查：

- 原始产品源码 SHA-256 与执行令定钉及 `baseline459.json` 完全一致。
- 用原始 770 行与当前 777 行逐行比较，结果为新增 7、删除 0。
- 当前 Skill 段只在成功 `context` 后、首快照生成前加入；`selectedSkill !== null` 才追加。
- 旧 `agent.spec.ts` 当前为 10300 字节、SHA-256 `7a520b1c07908286fd04a00f154ac63b0e3b0c4931c432ccada2965cba68bbcf`，与 `existing-tests.json` 一致。
- 旧 T18 夹具当前为 11825 字节、SHA-256 `74b4028d3e5e66b7509a25889c1446cdb154b934262e1f9ff74113cbd06f284d`，与 `existing-tests.json` 一致。
- 新测试不在旧 `existing-tests.json` 中，符合“新增聚焦测试”的预期。
- 本次没有改写旧测试断言、旧夹具、契约、B 服务、Skill、SDK、旧消费者、运行报告、参数、legacy18 或 E50。

## 4. 测试证据路径

测试源码：

`D:\Lawbeach\lawbench-A\dsh-ext\tests\task-skill-binding-20261030-023251.spec.ts`

原始失败依据：

`D:\Lawbeach\lawbench-coord\T18TaskSkillBindingInput-20261030-023251\actual-failure.json`

原始源码与基线：

- `D:\Lawbeach\lawbench-coord\T18TaskSkillBindingInput-20261030-023251\agent-index.before.ts`
- `D:\Lawbeach\lawbench-coord\T18TaskSkillBindingInput-20261030-023251\baseline459.json`
- `D:\Lawbeach\lawbench-coord\T18TaskSkillBindingInput-20261030-023251\existing-tests.json`

本次没有生成测试输出、截图或运行报告，因为运行被执行令设为 runtime=0。

## 5. 契约或文档摘要

没有修改契约、Spec、工单集、Skill、SDK 或共享数据结构。

实现只使用既有 `BeginValue.skill` 和既有 `lawbench-context` 快照：

- `begin.value.skill` 非空：同一个首快照追加“本次任务 Skill”段。
- `begin.value.skill === null`：不追加，原有自由对话路径不变。
- Skill 正文仍由实际 `skill` 工具加载。
- 不从材料正文、用户措辞、Skill 名称模式或旧任务推断选择。

本次没有新增 TaskState 字段、store、gate、framework、version、signature、budget、UI、route 或分类器。

## 6. 自检、命令记录与遗留

### 运行器与生命周期

- 所有成功执行的 shell 都是绝对路径原生 PowerShell：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

- `login=false`。
- 本地原生 MXC 保留 managed 隔离。
- 没有更改沙箱、审批、ACL、writer 锁、API 或模型。
- 没有联系其他聊天，没有启动新 agent。

### 实际命令记录

以下按实际执行顺序记录。`0` 为成功，`1` 为非零；长读取命令保留其实际检索模式。

1. `Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\A-T18-task-skill-binding-order-20261030-023251.md' -Raw` — 0
2. `git status --short --branch` — 1；父仓进入未授权子模块 `.git/worktrees/.../modules/dsh` 时 `Permission denied`
3. `Get-FileHash -Algorithm SHA256 -LiteralPath '...\dsh-ext\agent\index.ts','...\agent-index.before.ts'` — 0
4. `rg --files docs/plan dsh-ext tests contracts | rg '(key|facts|ticket|T18|task-skill|Spec|spec|agent|task.py|preStep|context|snapshot|PROJECT-PROFILE)'` — 0；输出截断
5. `Get-ChildItem -LiteralPath '...\T18TaskSkillBindingInput-20261030-023251' | Select-Object Name,Length,LastWriteTime` — 0
6. `git status --short --branch --ignore-submodules=all` — 0
7. `rg -n -C 35 "preStep|selectedSkill|lawbench-context|context.*snapshot|snapshot|begin\.value\.skill|capability|decisions" dsh-ext/agent/index.ts` — 0
8. `Get-Content -LiteralPath '...\docs\plan\lawbench-关键事实索引-20260928.md' -Raw` — 0
9. `Get-Content -LiteralPath '...\PROJECT-PROFILE.md' -Raw` — 0
10. `Get-Content -LiteralPath '...\actual-failure.json' -Raw` — 0
11. `Get-Content -LiteralPath '...\existing-tests.json' -Raw` — 0
12. `rg -n -C 50 "9\.2|任务.*Skill|Skill.*任务|选择.*Skill|技能.*选择|task/skill|selected.*skill" docs/src/Spec.md` — 0
13. `rg -n -C 25 "new LegalAgent|\.preStep\(|task/begin|context" dsh-ext/tests/agent.spec.ts dsh-ext/tests/task-state.spec.ts dsh-ext/tests/*question*gate*.spec.ts dsh-ext/tests/t18-agent-current-fixture-20261028-214724.spec.ts` — 1；PowerShell 不展开该 `*` 路径模式
14. `rg -n "^### 9\.2|^### 9\.3|^### 10\.1" docs/src/Spec.md` — 0
15. `rg -n -C 20 "function.*begin|task/begin|skill" dsh-ext/tests/helpers/fake.ts dsh-ext/dev/fake-service.mjs` — 1；误设为 Bash，被 managed 隔离拒绝，未执行
16. `rg -n -C 15 "preStep|snapshot\(|CAPABILITY_TEXT|L0|L1|selected" dsh-ext/tests/*.spec.ts` — 1；PowerShell 不展开该 `*` 路径模式
17. `Get-Content -LiteralPath '...\docs\src\Spec.md' | Select-Object -Skip 888 -First 24` — 0
18. `rg -n -C 25 "skill" service/lawbench/case/task.py service/lawbench/api/core.py service/lawbench/case/context.py` — 0
19. `rg -n -C 25 "function.*begin|task/begin|skill" dsh-ext/tests/helpers/fake.ts dsh-ext/dev/fake-service.mjs` — 1；误设为 Bash，被 managed 隔离拒绝，未执行
20. `rg -n -C 15 "preStep|snapshot\(|CAPABILITY_TEXT|L0|L1|selected" dsh-ext/tests -g '*.spec.ts'` — 0；输出截断
21. `Get-Content -LiteralPath '...\archive-workflow-gate-20261030-003021.spec.ts' | Select-Object -First 195` — 1；误设为 Bash，被 managed 隔离拒绝，未执行
22. `Get-Content -LiteralPath '...\litigation-question-order-20261029-192258.spec.ts' | Select-Object -First 180` — 0
23. `Get-Content -LiteralPath '...\sentence-workflow-gate-20261029-215838.spec.ts' | Select-Object -First 180` — 0
24. `rg -n "class .*CoreClient|override async call|class .*Client" dsh-ext/tests -g '*.spec.ts'` — 0
25. `rg -n "requiredQuestion|requiredQuestions|constructor\(" dsh-ext/agent/task-state.ts` — 0
26. `rg -n -C 30 "request\(|reasoningEffort|maxTokens|params" dsh-ext/agent/index.ts | Select-Object -First 220` — 1；误设为 Bash，被 managed 隔离拒绝，未执行
27. `rg -n "requiredQuestionIds|budget|params|taskId" dsh-ext/agent/task-state.ts | Select-Object -First 100` — 0
28. `rg -n -C 10 "core_task_begin.res|skill" contracts/examples/core_task_begin.res.json contracts/core/task_begin.schema.json` — 0
29. `rg -n -C 24 "request\(" dsh-ext/agent/index.ts` — 0
30. `Get-Content -LiteralPath '...\dsh-ext\agent\task-state.ts' | Select-Object -Skip 95 -First 70` — 0
31. `rg -n "CAPABILITY_TEXT|export const CAPABILITY" dsh-ext/agent/index.ts` — 0
32. `rg -n -C 20 "core/task/end|case 'task/end'|task/end" dsh-ext/shared/core-client.ts dsh-ext/tests -g '*.spec.ts' | Select-Object -First 180` — 0
33. `rg -n -C 6 "function reasoningEffort|const reasoningEffort" dsh-ext/agent/index.ts` — 0
34. `rg -n "reasoningEffort" dsh-ext/agent/index.ts | Select-Object -First 20` — 0
35. `rg -n -C 5 "export function reasoningEffort|export const reasoningEffort" dsh-ext/agent/task-state.ts` — 0
36. `Get-Content -LiteralPath '...\dsh-ext\agent\index.ts' | Select-Object -Skip 404 -First 35` — 0
37. `apply_patch`：修改 `dsh-ext/agent/index.ts`，新增目标测试文件 — 成功
38. `git diff -- dsh-ext/agent/index.ts` — 0；相对 Git base 显示大量既有 dirty，不代表本次相对定钉文件改动
39. `Get-Content -LiteralPath '...\task-skill-binding-20261030-023251.spec.ts' -Raw` — 0
40. `Get-FileHash -Algorithm SHA256 -LiteralPath '...\agent\index.ts','...\task-skill-binding-20261030-023251.spec.ts'` — 0
41. `Get-Item -LiteralPath '...\agent\index.ts','...\task-skill-binding-20261030-023251.spec.ts' | Select-Object FullName,Length,LastWriteTime` — 0
42. PowerShell `Compare-Object`：770 行定钉文件对 777 行当前文件 — 0；新增 7、删除 0
43. `rg -n "agent\.spec\.ts|task-skill-binding-20261030-023251|total|passed|failed|exitCode" '...\baseline459.json'` — 0；只命中无关 `api_remote_access.res_failed.json` 路径
44. `Get-Content -LiteralPath '...\baseline459.json' | Select-Object -First 60` — 0
45. `rg -n -C 8 "const selectedSkill|本次任务 Skill|执行任务动作前" dsh-ext/agent/index.ts` — 0
46. `rg -n -C 5 "dsh-ext\\\\agent\\\\index\.ts|dsh-ext\\\\tests\\\\agent\.spec\.ts|dsh-ext\\\\tests\\\\t18-agent-current" '...\baseline459.json'` — 0；确认产品源字节数和 SHA 行
47. PowerShell 逐文件 `Get-Item` + `Get-FileHash`：定钉源、当前源、新测试 — 0
48. `rg -n "legal-workflow|litigation-docs|case_read_wiki|userMessage\(|textContent|Native|session\.v4|actual-failure" dsh-ext/agent/index.ts dsh-ext/tests/task-skill-binding-20261030-023251.spec.ts` — 0；只看到产品既有 litigation-docs/case_read_wiki 常量和测试合成消息
49. PowerShell 逐文件 `Get-Item` + `Get-FileHash`：旧 `agent.spec.ts`、旧 T18 夹具 — 0
50. `Get-Content -LiteralPath '...\dsh-ext\tsconfig.json' -Raw` — 0
51. `rg -n "\.at\(-1\)" dsh-ext -g '*.ts' -g '*.tsx' | Select-Object -First 20` — 1；误设为 Bash，被 managed 隔离拒绝，未执行
52. `rg -n "task-skill-binding-20261030-023251" '...\existing-tests.json'` — 1；无匹配，确认新测试不属于旧测试清单
53. `git rev-parse HEAD` — 0；`a23271abee333a9a256fd46a3141da16975c2380`
54. `git status --short --ignore-submodules=all -- dsh-ext/agent/index.ts dsh-ext/tests/task-skill-binding-20261030-023251.spec.ts` — 0；` M` 与 `??`
55. `git diff --stat --ignore-submodules=all -- dsh-ext/agent/index.ts` — 0；显示 396/24，这是既有 dirty 相对 HEAD 的统计
56. `(Get-Content -LiteralPath '...\task-skill-binding-20261030-023251.spec.ts').Count` — 0；250
57. `apply_patch`：新增本交回件和来源注记 — 成功

另有一次工具参数在调用层因重复 `sandbox_permissions` 字段被拒绝，未形成 shell 进程，也未执行命令；不是文件或 Git 阻碍。

### 非零与阻碍判读

- 普通 `git status` 进入父仓未授权子模块路径时返回 1；改用 `--ignore-submodules=all` 后只读核对成功。没有扩权、改组权限或拆锁。
- 两次 PowerShell 通配路径未展开，`rg` 返回 1；改用 `-g '*.spec.ts'` 后完成。
- 五次只读检索误填 Bash shell，被 managed MXC 拒绝，均未执行命令或改变状态；后续全部恢复指定原生 PowerShell。
- 新测试文件名在旧测试清单中无匹配，返回 1，符合新增测试事实。
- 这些都不是需要修复的交付阻碍。

### Dirty 与生命周期限制

- 开工时工作树已有大量产品、契约、证据、旧测试和未跟踪文件；全部原样保留。
- 本次由 A 线只写两个允许的 A 产品路径及本交回/来源注记。
- `dsh` 子模块的只读 Git 状态不可访问，没有尝试修复。
- 没有 commit SHA，因为 Git 写入不在本运行授权内。
- 没有测试报告，因为 runtime=0；主编排仍需在新鲜私有构建中独立执行新测试，并按当前 459/旧文件状态做实际消费验证。
- 产品只能保证传播显式选择，不能保证 LLM 遵从。

本文件为正式交回。A 线在此停止；主编排继续。
