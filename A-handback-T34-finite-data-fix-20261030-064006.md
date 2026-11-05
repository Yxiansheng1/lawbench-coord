# A 线 T34 有限助手数据修正交回

状态：`SOURCE_ONLY / AUTHOR_RUNTIME_ZERO / ROOT_FINITE_RERUN_REQUIRED`

## 进度

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 修正有限助手两处数据问题；补写根红证据说明；更新清单中助手与 README 两行字节/SHA。只读核对显示五个冻结文件哈希不变。 |
| 目标是什么 | 让既有严格断言在助手 realm 内比较纯数据，并让相似点号输入真正命中旧缺陷；不改观察器、产品、SDK 或既有证据。 |
| 在等什么 | 等根在该源码交回后重跑受影响的有限助手一次。根记录 PASS 后，再按原 T34 真实禁用投影路径做原 GUI 诊断。若根记录红，保留现场并按红因处理。 |
| 卡在哪 | 作者侧无运行时卡点。普通 `git status` 仍因 `dsh` 子模块 worktree 元数据权限被拒；按令未修锁、未扩权、未改审批。该权限拒绝不阻碍源码交回。 |

## 修改范围

`frame-classifier-finite.mjs` 只改两处：

1. `loadModuleFrames` 将 `vm.runInNewContext` 求值函数的返回结果经 JSON 数据往返转回助手 realm，再进入全部既有严格比较。断言、新旧源码对照、分类器和测试体均未放宽或删除。
2. `dotLookalike` 三条输入保留完整模块名和连字符，只把末尾 `index.js` 改为 `indexXjs`。旧函数仍应产生未转义点号的红证据，新函数应拒绝相似输入。

`README.md` 只补写根红记录、跨 realm 失败性质、未触发产品链，以及上述相似输入修正。

`literal-inputs.json` 只更新 `handoff_source_files` 中 `frame-classifier-finite.mjs` 和 `README.md` 的字节/SHA。其他行未改；文件自哈希仍为 `NOT_SELF_REFERENCED`。

## 文件身份

| 文件 | 当前字节 | 当前 SHA-256 |
| --- | ---: | --- |
| `frame-classifier-finite.mjs` | 7046 | `6102ee17d992306bbe06405347f25132ba1140feac329ded7f9345ac35ebcd0e` |
| `README.md` | 13965 | `6be25612597b13c5ea77cb32aa527dbfe82511419cf98241cb7100a228fbd58a` |
| `literal-inputs.json` | 13410 | `d7a48764689919a66d20d648511801e4eff7a3bbf5d114dee9ea31fa3eb987d2` |

受影响文件修改前身份：

| 文件 | 修改前字节 | 修改前 SHA-256 |
| --- | ---: | --- |
| `frame-classifier-finite.mjs` | 6972 | `2828a684b26aaaf4a435c05959a2d0951e6c6d0203bec2f24ccd601c6d4e804c` |
| `README.md` | 12772 | `4f2c11afa82c4014b29f0d067c10ff0e21190c8b2c3791ffed915f183dea8f9a` |

冻结文件当前身份与批准输入一致：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 88670 | `369f3fd3b8f70e01a56e9685e14bd41d7b126cad490a974544b62911a2e58980` |
| `prepare.ps1` | 13561 | `d280ca31609865f91b60c02b1cb531c506673b26e9743b3fdda5ffe8c6dfa9bc` |
| `projection-observer.mjs` | 18502 | `a50d2eeb520b87576bf977fe2bb895175a8a89e4527bbc907296897714dd0da5` |
| `start.ps1` | 76348 | `4fe39e1dc2cfc989bbbffe976a71948af1436ec5fc4c49f6820352fb5bb2caf5` |
| `stop.ps1` | 7178 | `d52ed07f1ec6bf0ef116c1dab069647c042e5f80751e579bc0872e7ccfed932d` |

## 依据与验证

- 唯一执行令：`D:\Lawbeach\lawbench-coord\A-T34-finite-data-fix-order-20261030-064006.md`。
- 批准输入：`D:\Lawbeach\lawbench-coord\T34FiniteDataInput-20261030-064006\approved-inputs.json`；八个候选文件在修改前均与批准字节/SHA 一致。
- 根红记录：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34FrameClassifierFinite-root-20261030-063918`。
- 根红读数：退出码 1，耗时 2.407 秒，`forced=false`，2 个进程身份、其后无遗留进程；无网络访问、应用启动或模型调用；`stdout.txt` 为空。
- 根红首断言：`stderr.txt` 报旧分类器漏批准物理路径，展示数据为 `[]`。该失败来自跨 realm 数组与 `node:assert/strict.deepEqual` 的原型比较，生产观察器未执行。
- 根红文件：`root-result.json` 记录 `model=0`、`consumer_main_executed=false`、`actual_Native_events_created=false`、`Packaging=HOLD`。
- 文本差异：助手相对 `.before` 只有一处结果归一化和三行 `dotLookalike` 输入变化；README 只增加根红说明；清单只变化助手和 README 两行。
- 当前 A 树 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`。
- 限定目录只读状态：`docs/plan/evidence/T34/ProjectionObserver-20261030-061810/` 整体仍是未跟踪项；未暂存、未提交。

## 未做与降级

- 作者运行面为 0：未运行 Node、Python、AST、parser、import、check、test、build、GUI、HTTP、model、probe、SSH、EnvKey、DPAPI、安全配置或全局配置操作。
- 未由作者重跑有限助手，未启动 GUI，未执行原始真实禁用投影诊断，未生成新的运行现场。
- `Full command/nonzero/writefaces/whole inverse/formal` 均为 `NOT_RUN`。
- 本次复用原始根红证据；根红不能当作修正后的绿证据。
- Git 全程只读：`git_writes=0`，没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 没有修改快照 `D:\Lawbeach\lawbench-coord\T34FiniteDataInput-20261030-064006`，没有新的助手文件或产品文件。

## 下一步

根先运行一次
`E:\node\node.exe D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionObserver-20261030-061810\frame-classifier-finite.mjs`。
根记录 PASS 后，再按 README 的原 prepare、admit、start、GUI 禁用投影、stop 路径执行一次真实诊断；不得复用旧 prepared、admission、served root 或旧事件。真实诊断若红，保留安全观察输出并按失败类别交回；若没有绑定或没有命中 `llm-pi-ai`，按 `BLOCKED/NOT_RUN` 记录。

Response ID: 未提供
Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T34-finite-data-fix-20261030-064006.md`

删减轮：读者 3 / 槽位 2 / 半句 4 / 重复 2 / 过程 0 / 黑名单 0
