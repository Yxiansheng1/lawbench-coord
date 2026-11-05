# A 线交回：T34 existing settings finite source contract

状态：`SOURCE_ONLY_READY_FOR_ROOT_EXECUTION / AUTHOR_RUNTIME_ZERO / TARGET_NOT_RUN`

执行令：
`D:\Lawbeach\lawbench-coord\A-T34-existing-settings-finite-order-20261030-100927.md`

交付目录：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ExistingSettingsFinite-20261030-100927`

## 1. 目标与结论

已按令准备一次可由根执行器独立运行的源码级有限对照：只加载现有
`configuration.spec.ts`，按固定命令行 pattern 恰好选择 3 个测试。其目的是比较真实
private profile `ConfigEditor`/`Loader`/HMR、持久化编辑、重启、表达式保留和整表 reset
契约，为原生 settings 写失败提供可复核的有限证据面。

本轮没有实现或推断修复。既有原生实际失败的
`settings.mutate -> ConfigEditor.edit` 约 25 ms `Error/OTHER` 拒绝、synthetic route
仍落盘及具体根因 `UNKNOWN` 均未被改写。本交付不是原生 GUI、native settings write
PASS、built/installed libraries 验证或 T34 通过声明。

## 2. 改动清单

只新增执行令允许的四份文本，没有产品源码、测试正文、fixture、SDK、build 或 package
改动，也没有 Git 写操作或提交 SHA。

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `vitest.finite.config.mjs` | 922 | `e52134909ad4fb07d8103c41f0d922dc4d7d4abb8002ac2da2b8a632b91aa81a` |
| `literal-inputs.json` | 3221 | `ad576596e789e4f1f8292edca56b9ffed886aa52e2bd502d964bf51676e8414c` |
| `README.md` | 8366 | `80017575ca88a648b3922c56baa61dd4c68345a2ff517019707b23f702e8f8d7` |
| 本交回件 | 当前文件自身 | `SELF_NOT_REFERENCED` |

配置只从三条绝对 ESM 文件入口加载已安装 Vitest 4.1.8、
`vite-tsconfig-paths` 6.1.1 和固定 `vitest.shared.ts` exports；不导入默认
`dsh/vitest.config.ts`。root 固定为 `D:/Lawbeach/lawbench-A/dsh`，`include` 恰为一个
现有测试文件，没有其他 project、glob、coverage、HTML report、test generation 或 build。
路径使用固定 `tsconfig.base.json`，`pool: 'forks'`、`maxWorkers: 1`、
`fileParallelism: false`、`cache: false`、coverage disabled。

## 3. 红绿核验

Green（作者运行时为 0，以下只是只读静态核验）：

- 批准输入的 10 个 pin 与 `literal-inputs.json` 逐项同路径、同字节、同 SHA-256，
  且磁盘当前值仍全部匹配。
- 根、测试文件、3 个 exact test names、actual failure/seal 指针与 approved inputs
  精确一致；三条 `it('...')` 在固定测试正文中逐字存在。
- 三份 evidence 文件可读，JSON 可解析；目录恰三文件且没有 `runtime`。
- 三条配置导入的绝对文件、Vitest CLI、Node 24.21.0 以及 9 个关键第三方依赖入口存在。
- 配置有一个 `include`、三份固定 setup、单 fork、不并行文件、`cache:false` 和
  coverage disabled；没有 Vitest `projects` 或顶层默认配置探测。
- 三份文件均无 BOM、无 CR、无尾随空白。

Red（保留原状，不在本卡处理）：

- 既有实际 required-unset 仍失败，Validity business PASS 不存在，原因 `UNKNOWN`。
- 根首次 `git status --short --branch` 因共享 worktree 的 `dsh` 子模块 `.git`
  Permission denied 返回 1；改用 `--ignore-submodules=all` 只读确认工作树 dirty，
  没有任何修复或清理。

## 4. 测试与命令状态

目标 Vitest 命令、Node、Python、AST/parser、import、type check、test/collect、build、
GUI、HTTP、模型、SSH、DPAPI、环境 Key 和 process probe：全部 `NOT_RUN`。runtime 0，
因此没有可记入的测试退出码、3-test pass/fail 或新运行时间证据。

截至最终证据复取，共 60 次 `exec_command`，非零 12 次；目标测试仍为 0 次。12 次
非零中：1 次 `git status` 子模块权限、3 次 PowerShell 静态检查语法/路径写法在结论前
失败、1 次假定 Vite 类型路径不存在、1 次错误的顶层 workspace 依赖路径检查、2 次
宽泛 `rg` 无命中、4 次误填 bash 的只读命令在执行前被 `BASH/E_ACCESS_DENIED` 拒绝。
另有 1 次定稿后的只读哈希重测误把 `shell` 写成相对名 `pwsh.exe`；该命令 exit 0，
不符合绝对 shell 约束，结果未单独采信，随后用指定绝对 PowerShell 重测通过。4 次
bash 命令均未执行 bash/cmd，未造成读写。没有用这些偏差推导源码通过或失败。

根执行器应只执行一次 README 中的完整 PowerShell 命令。命令把 HOME、USERPROFILE、
APPDATA、LOCALAPPDATA、TEMP/TMP 指到本证据目录的私有 `runtime`，清掉启动前
`NODE_USE_ENV_PROXY`，并在 `finally` 恢复环境。fixture 只建临时 `test` profile，
注册 editor/settings/default-model/probe，普通 token 为固定虚构值，由
`onTestFinished` 删除 owned 临时目录。

## 5. 契约与非宣称

固定测试选择为：

1. `persists a model edit, updates the real consumer without remounting, and restores it at restart`
2. `preserves configuration expressions while editing a different live field`
3. `resets a whole form without losing ordinary fields or pinning inherited defaults`

前两项按现有 fixture 启用 HMR，第三项关闭 HMR；`DefaultModel` 只读取
`currentSelection`，不做 LLM inference。使用 actual standard decorator plugin 和
`vitestExecArgv`，没有新增 alias、built-lib replacement 或 alternate testcase。

本交付不证明原生 GUI 写链、installed/built libraries、E50 runtime、安装包或整条 T34。
即使三条源码测试将来全绿，也只能说明这些现有 SDK caller/callee 契约；不能替代真实
GUI required-unset，也不能单独给出根因或修复结论。

## 6. 自检、偏差与下一步

- Git 全程只读：add、commit、rebase、stash、reset、clean、checkout、push 均为 0；
  index、锁、ACL、审批、沙箱未改。既有 dirty 完整保留，当前 PID 为本次唯一执行者。
- 未安装包、未 build SDK、未读取 Key、未接触真实案卷、未联系其他会话或更换 API。
- 下一次只在根侧执行 README 的那一条 3-test invocation。若绝对 ESM 配置或 setup import
  失败，记录具体错误后停止，不放宽断言、不替换 alias、不切 alternate execution；若测试
  失败，保留现实失败。任何结果都按上面的非宣称收口。
