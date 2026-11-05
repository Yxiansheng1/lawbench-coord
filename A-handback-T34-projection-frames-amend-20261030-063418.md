# A 线交回：T34 投影帧分类补正

状态：`SOURCE_ONLY_AMEND_HANDOFF_READY_FOR_ROOT_STATIC_AUDIT`

结论：已在原观察器候选中完成有界补正，使三个已批准生产模块的物理
Windows 路径及其 file URL 映射到原有三个固定 label 和数值 line/column；
同时保留原虚拟包路径识别，并补齐边界、转义、去重和四条上限。另提供只抽取
旧/新 `moduleFrames` 的有限助手。未证明底层投影拒绝原因，未宣称产品通过。

本次 Git 只读，故没有提交 SHA。当前 HEAD：
`a23271abee333a9a256fd46a3141da16975c2380`，分支 `line-A`。

## 唯一交付面

候选目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810`

目录恰有八个文件：

| 文件 | bytes | SHA-256 | 本轮状态 |
| --- | ---: | --- | --- |
| `prepare.ps1` | 13561 | `d280ca31609865f91b60c02b1cb531c506673b26e9743b3fdda5ffe8c6dfa9bc` | 原样 |
| `start.ps1` | 76348 | `4fe39e1dc2cfc989bbbffe976a71948af1436ec5fc4c49f6820352fb5bb2caf5` | 仅观察器自钉两行 |
| `stop.ps1` | 7178 | `d52ed07f1ec6bf0ef116c1dab069647c042e5f80751e579bc0872e7ccfed932d` | 原样 |
| `entry.py` | 88670 | `369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980` | 原样 |
| `projection-observer.mjs` | 18502 | `a50d2eeb520b87576bf977fe2bb895175a8a89e4527bbc907296897714dd0da5` | 仅替换 `moduleFrames` |
| `frame-classifier-finite.mjs` | 6972 | `2828a684b26aaaf4a435c05959a2d0951e6c6d0203bec2f24ccd601c6d4e804c` | 新增有限助手 |
| `README.md` | 12772 | `4f2c11afa82c4014b29f0d067c10ff0e21190c8b2c3791ffed915f183dea8f9a` | 精确补正说明 |
| `literal-inputs.json` | 13410 | `ce985069ce69d3b391358fa1e91ea24d63598d516480f97766cf1e71e5500359` | 更新自有行与助手行 |

`literal-inputs.json` 不自我引用，其 `literal_inputs_self_hash` 仍为
`NOT_SELF_REFERENCED`。

## 既有状态与 dirty 保全

- 开工读取的批准输入：
  `D:\Lawbeach\lawbench-coord\T34ProjectionFramesInput-20261030-063418\approved-inputs.json`。
- 原七文件快照与开工前 dirty57 字节清单保留，不改写、不重算基面。
- 普通 `git status --short --untracked-files=all` 在
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 处被权限拒绝。
  未修锁、未改 ACL/审批/沙箱、未启用 setup、未切 legacy。
- 使用只读 `git status --short --untracked-files=no --ignore-submodules=all`
  计数：开工与收尾均为 57 条既有 tracked modified，没有新增 tracked 改动。
- 全量 status 另有大量既有未跟踪证据、超长路径和子模块警告；未清理、未移动。
- 没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 三个批准已构建模块当前仍为：
  - `config-editor`：6853 bytes，
    `bb85243d9f5729a7186cace56c4ce31d4918bd026482797ef5b7c01bf612fab5`
  - `settings`：22636 bytes，
    `9432b872597b7a31473072eb38a55979ab23375c76bd1d86d751388a692a0136`
  - `settings-controller`：21753 bytes，
    `dd2bdf646a251745093f854e39399931a1efb8b68f789914b9f754bbc2bf1e2d`

## 修改内容

### `projection-observer.mjs`

新旧 source diff 仅覆盖 `moduleFrames`。固定映射只有三项：

| 固定输出 label | 既有虚拟文本 | 已批准物理路径 |
| --- | --- | --- |
| `@deepseek-ai/dsh-config-editor/lib/index.js` | 同名 | `D:\Lawbeach\lawbench-A\dsh\packages\boot\config-editor\lib\index.js` |
| `@deepseek-ai/dsh-settings/lib/index.js` | 同名 | `D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\lib\index.js` |
| `@deepseek-ai/dsh-api-settings-controller/lib/index.js` | 同名 | `D:\Lawbeach\lawbench-A\dsh\packages\api\settings-controller\lib\index.js` |

每个物理路径同时接受归一后的 `D:/...` 和规范
`file:///D:/...`。正则对候选路径全部转义；合法帧左侧只允许行首、空白或
`(`，右侧只允许行尾、空白或 `)`。输出对象仍只有固定 `module` 与数值
`line/column`，不序列化 stack、原始路径、message 或私有 sentinel。

其余 import、常量、writer、8-event、16 KiB、错误分类、绑定、hash pins、
wrapper、same-error rethrow、restore/finally 和所有 export/API 均未改。

### `start.ps1`

仅改：

```text
ObserverBytes: 17491 -> 18502
ObserverSha256: 8b53...d59919 -> a50d...0da5
```

preflight、observer URL、suffix 拼接、运行面、cleanup 和所有其他字节未改。

### `frame-classifier-finite.mjs`

助手的全部 import 只有：

```text
node:assert/strict
node:fs (readFileSync)
node:vm
```

它只读取两个绝对 source：

- 旧：
  `D:\Lawbeach\lawbench-coord\T34ProjectionFramesInput-20261030-063418\projection-observer.mjs.before`
- 新：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\projection-observer.mjs`

助手用纯字符串边界抽取 `moduleFrames`，在空 `vm` 上下文运行，不 import
production/Agent/Session/Native/app，不启动服务、HTTP、模型，不写文件。

有限卡组覆盖：

1. 旧函数对三个批准物理 Windows 路径为 0 帧，形成红证据。
2. 旧函数对三个批准 file URL 为 0 帧，形成红证据。
3. 新函数对三条物理路径输出三个固定 label 和精确数值帧。
4. 新函数对三个 file URL、虚拟 approved label、混合 `/`/`\` 分隔符通过。
5. 旧函数的未转义点号 lookalike 会误命中，作为缺陷红证据；新函数为 0。
6. 前缀私有路径、路径后缀私有串、列后缀、私有 file URL 前缀、未批准构建
   路径均为 0。
7. 重复帧去重，最多四条。
8. `undefined/null/object/array/String object` 等非字符串均为 0。
9. 所有正例输出仅允许 `module/line/column`、固定三个 label、正安全整数，
   且序列化文本不含 `D:`、`file:`、私有前缀或 sentinel。

作者未运行此助手，故其实际结果仍为 `NOT_RUN`，不得把源码声明写成测试 PASS。

### `literal-inputs.json` 与 `README.md`

字面清单只更新 `start.ps1`、`projection-observer.mjs`、`README.md` 的当前
bytes/hash，并新增有限助手行；原 baseline/source pins/primary/legacy18 未改。
误填 `bash` 的累计拒绝数据实记为 7。README 新增精确补正、固定日志 label、
输入路径边界、非根因声明和根侧有限命令，同时未删除或弱化原安全断言。

## 精确逆变换边界

若根侧要求撤销本次 source 补正：

1. 用输入目录的 `projection-observer.mjs.before` 恢复观察器。
2. 在 `start.ps1` 仅恢复：
   `ObserverBytes=17491`、
   `ObserverSha256=8b53efdfd648d09d5a009071383800a7a7fc37ffd7230e0935e85878e5d59919`。
3. 删除唯一新增 `frame-classifier-finite.mjs`。
4. 用输入目录的 `README.md.before` 恢复 README。
5. 用输入目录的 `literal-inputs.json.before` 恢复字面清单。
6. `prepare.ps1`、`stop.ps1`、`entry.py` 不需逆变换，当前已与原快照逐字节
   同 hash。

不得用该逆变换抹掉开工前 dirty57；禁止 stash/checkout 等 Git 写入。

## 根侧下一步

根必须先全量审阅本交回、八文件源码、全部 diff、输出 schema、setup/finally、
全部写面、source/profile identity、字面 pins 和 dirty57；审阅通过后只运行
一次有限助手：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\frame-classifier-finite.mjs'
```

有限助手通过后，再做必要的 fresh private GUI 诊断，原命令顺序为：

```powershell
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\prepare.ps1'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\entry.py' --admit --root '<runRoot>'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\start.ps1' -RunRoot '<runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\stop.ps1' -RunRoot '<runRoot>'
```

`<runRoot>` 必须为 `runs` 下 fresh
`T34-private-projection-observer-YYYYMMDD-HHMMSS`；不得复用旧 run/event。

## 作者命令台账

以下为本轮全部 `exec_command` 尝试。除明确标为非零/拒绝者外，均为只读
PowerShell 文件、哈希、文本 diff 或 Git 状态命令；没有目标运行时。

1. `Get-Content` 正式补正执行令，exit 0。
2. `Get-ChildItem` 批准输入目录，exit 0。
3. `Get-Content approved-inputs.json`，exit 0。
4. `git status --short --untracked-files=all`，exit 1；`dsh` 子模块 worktree
   元数据权限拒绝。
5. `Get-ChildItem` 候选目录，exit 0。
6. `Get-Content projection-observer.mjs.before`，exit 0。
7. `Get-Content` 当前观察器，exit 0。
8. `Get-ChildItem` 协调目录 T34/Projection 相关件，exit 0。
9. `Compare-Object` 旧/当前观察器，exit 0；当时无差异。
10. `Get-Content` 原 T34 执行令，exit 0。
11. `Get-Content` 原 T34 交回件，exit 0。
12. 误填 `shell=bash` 读取关键事实索引；运行器以 `E_ACCESSDENIED` 在启动前
    拒绝，exit 1，未执行命令。
13. `Get-Content PROJECT-PROFILE.md`，exit 0。
14. 修正为绝对原生 PowerShell 读取关键事实索引，exit 0。
15. `git status --short --branch --ignore-submodules=all --untracked-files=all`，
    exit 0；输出含大量既有未跟踪件及超长路径警告。
16. `Get-ChildItem + Get-FileHash` 候选七文件，exit 0。
17. `rg` 查找工单集中 T34/projection，exit 1；无匹配，只读。
18. `rg` 定位 `start.ps1` observer 自钉，exit 0。
19. `Get-Content literal-inputs.json`，exit 0。
20. 误填 `shell=bash` 读取 README；运行器以 `E_ACCESSDENIED` 在启动前拒绝，
    exit 1，未执行命令。
21. 修正为绝对原生 PowerShell 读取 README，exit 0。
22. `git rev-parse HEAD` 与 `git rev-parse --abbrev-ref HEAD`，exit 0。
23. `Get-FileHash` 补正后观察器，exit 0。
24. `Get-Item` 补正后观察器 bytes，exit 0。
25. `git diff --no-index` 原/新观察器，exit 1 表示存在预期 diff；仅局部
    `moduleFrames`。
26. `Get-Content frame-classifier-finite.mjs`，exit 0。
27. `Get-ChildItem + Get-FileHash` 候选八文件，exit 0。
28. `git diff --no-index` 前版/新 `start.ps1`，exit 1 表示存在预期两项自钉
    diff。
29. `git diff --no-index` 前版/新 README，exit 1 表示存在预期补正 diff。
30. `Get-ChildItem + Measure-Object` 候选计数，exit 0；8。
31. `rg` 核对字面清单既有/更新行，exit 0。
32. `rg` 核对助手 import/read/write/network/process 面，exit 0；只命中三项
   允许 import 和一次 `readFileSync`。
33. 只读 Git tracked modified 计数，exit 0；57。
34. 读取三模块 bytes/hash 的循环命令语法错误，PowerShell 在任何执行前报
    `ParserError`（空管道元素），exit 1；未读模块。
35. 修正后的三模块 bytes/hash 表，exit 0；值与前文批准值一致。
36. 最终候选八文件 bytes/SHA-256 列表，exit 0；与交付表一致。
37. 写交回后回读本文件，exit 0。
38. 交回件 bytes/SHA-256 自检，exit 0。
39. 核对观察器实际 bytes/hash 与 `start.ps1` 两条自钉字面，exit 0；两处字面
    均命中。
40. 收尾只读 Git tracked modified 计数，exit 0；仍为 57。
41. 修正命令台账后的最终 `Get-Content` 回读与交回 bytes/SHA-256 自检，
    exit 0。

文件修改均通过 `apply_patch` 完成；没有 shell 写文件。

## 运行面与非零

- `author_runtime=0`
- `target_runtime_scripts=0`
- `node_or_python_invocations=0`
- `parser_ast_import_check_test_build=0`
- `gui_http_model_process_probes=0`
- `git_writes=0`
- `package_install_or_update=0`
- `credential_reads=0`
- `product_sdk_lib_changes=0`
- `old_evidence_rewrites=0`
- `accidental_bash_attempts_rejected_before_execution=7`（原五加本轮二）
- 非零：普通 Git status 权限拒绝 1 次；三模块 hash 首命令 shell 语法错误
  （执行前）1 次；预期 source diff 的 `git diff --no-index` 为 exit 1 三次；
  无匹配 `rg` 一次。

`NOT_RUN`：有限助手、prepare、admission、start、GUI 设置动作、observer
capture、stop、任何 parser/import/test/type/build、runtime6、395、模型、
私钥、真实案卷、物理路径分类器真实运行、底层投影 PASS 与整条 T34 PASS。

## 阻碍与限制

1. Git 只读边界禁止提交，因此本交回没有 commit SHA；这不是交付源码缺失。
2. 普通 status 仍被子模块元数据权限拒绝；未修锁/扩权，不影响本轮候选文件
   的只读文件审计，但根侧仍应沿用原 dirty57 快照比较。
3. 索引锁、权限拒绝或 Git 写入不可用不得被尝试修复。
4. 本补正只增加已批准物理/file URL 的固定帧识别，不改其他安全分类、错误
   路径或产品行为，也不证明 T34 实际失败原因。
5. 作者的静态设计声明不能替代根侧有限助手执行；只有一次真实运行通过后，
   才可记录分类器补正的运行证据。
