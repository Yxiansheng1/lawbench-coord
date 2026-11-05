# A 线交回：T18 本地夹具路由修正

日期：2026-10-28  
执行者：A 线 DeepSeek  
结论：当前新测试副本的有界夹具修正已完成，产品源码未改。作者侧运行时为 `0`；15 项运行与类型检查尚未执行，因此不得宣称测试绿。`BUILD_NOT_ADMITTED`，Gate 1、T18 全量验收、项目完整性与 Packaging 均保持 `HOLD`。

## 1. 接续状态与根因

- 已首先并完整读取唯一执行令 `A-T18-local-fixture-route-fix-order-20261028-220053.md`。
- 已只读核对输入目录 `T18LocalFixtureRouteInput-20261028-220053` 中的原始测试、修正前失败副本、假服务、生产 `CoreClient`、契约示例和 root 失败结果。
- 已保留 `A-dirty-before.txt` 所载既有 dirty 状态；未回滚、清理或重新暂存任何既有变更。
- 原失败结果为 15 项中 6 通过、9 失败，unit 退出 1；同次 types 退出 0，但该类型结果早于本次测试副本改动，不能覆盖当前新副本。
- 根因确认：假服务固定返回 `contracts/examples/core_task_begin.res.json`，该全局 T38 示例为 `skill: criminal-reading-notes`、`route: external`。测试未启用外网模型状态，实际 `LegalAgent` 因而在问题与上下文前拒绝为 `EXTERNAL_ROUTE_UNAVAILABLE`。
- 这不是本轮产品源码回归。新增空问题提供器无法修复路由，且会偏离原始测试构造；本次已撤销该思路。

## 2. 实际修正

唯一修改的既有文件：

`D:\Lawbeach\lawbench-A\dsh-ext\tests\t18-agent-current-fixture-20261028-214724.spec.ts`

- 删除旧三行兼容说明。
- 恢复原始 7 个 `LegalAgent` 构造调用的原参数形态。
- 保留实际 `LegalAgent`、全部 15 个测试体与断言，以及 lawfirm/qwen、路径记录、取消、预算、案件移动和上下文检查等原预期。
- 新增一个测试私有的 `LocalRouteFixtureCoreClient`，继承实际生产 `CoreClient`。
- 对每个命令均先调用实际 `super.call`，保留真实 loopback HTTP、鉴权、请求契约校验与原始回复契约校验。
- 仅当原始 `task/begin` 调用成功时，复制回复值并把副本的 `route` 改为 `local`；所有其他字段与全部其他命令不变。
- 使用现有 `coreId('task_begin')` 和 `response` 校验器重新校验转换后的完整回复。
- 泛型返回值只做一次已说明的边界转换；完整回复已通过上述现有 schema 校验，未使用 `any`、类型忽略或新通用框架。
- 顶部注记明确该路由适配仅属于本单元测试，不改变生产默认路由、模型调用或 Native R。

新增注记：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DraftFeedbackPrivateBuild-20261028-214724\路由夹具修正-20261028-220053.md`

## 3. 静态验证

当前测试副本：

- 11,825 字节。
- SHA-256：`74b4028d3e5e66b7509a25889c1446cdb154b934262e1f9ff74113cbd06f284d`。
- 15 个 `it`；7 个实际 `new LegalAgent`；7 个 `LocalRouteFixtureCoreClient` 实例。
- `any`、`ts-ignore`、`ts-expect-error`、`it.skip`、`it.todo`、`describe.skip` 均为 0。
- 198 个 CRLF、0 个裸 LF，末尾换行保留。

精确反向校验：

- 在内存中删除顶部说明、适配器专用导入和适配器类，并把 7 个适配器实例换回 `CoreClient`。
- 反向结果与原 `agent.spec.ts` 逐字符相等。
- 反向结果与原文件同为 10,300 字节。
- 反向结果 SHA-256 为 `7a520b1c07908286fd04a00f154ac63b0e3b0c4931c432ccada2965cba68bbcf`，与原文件完全一致。
- 该检查同时证明 15 个旧断言、测试体、CRLF 和末尾换行未被弱化或改写。

冻结输入只读哈希复核：

- 修正前失败副本：11,010 字节，SHA-256 `c229ce9945c3d85acecddfa1122dd296eabe145a56e3697a53a76392bbbfcb47`。旧正式件将其写成 `bbbcfb47` 的错误转置保留在历史文件中，不追改。
- `dsh-ext/dev/fake-service.mjs`：27,923 字节，SHA-256 `54229b71b8df17bf0f02de9a222ee739c810cf2001a93739b7decbe6c56aa761`。
- `dsh-ext/shared/core-client.ts`：3,666 字节，SHA-256 `5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50`。
- `contracts/examples/core_task_begin.res.json`：960 字节，SHA-256 `7f06fcbed0c6ad96f8aa5b9418aeafbee3038314bceb0214c08c5225dd95a9e7`。
- 私有 builder：32,121 字节，SHA-256 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`。
- 私有 config：20,469 字节，SHA-256 `355b4a3e83d1ea9c585227bbd9223ba6a7d1cb666b0bea15b16802f35bccad48`。
- builder 与 config 均未改；既有 18 棵树、53 个文件/引用身份和 18 个 legacy 冻结仍沿用原批准事实，本线未运行 builder 重算。

## 4. 未运行边界

以下均由执行令明确禁止作者运行，本次未运行：

- Node、Python、Vitest、tsc、类型检查、AST/parser、import、collect、自测、构建或 prepare。
- HTTP、模型、GUI、SSH、凭据、环境变量 Key、keyring 或真实案卷。
- 安装器、打包或任何外网访问。

因此：

- 当前新副本 15 项仍为 `NOT_RUN_BY_AUTHOR`，不是通过。
- 当前新副本类型检查仍为 `NOT_RUN_BY_AUTHOR`，不是通过。
- 同源 46 项既有绿证可继续复用；本次未重跑 7 项反馈、其他旧测试或旧 52 项。
- 本次不是产品补丁，不证明 Gate 1 或项目已完整。

请求 root 的受限后续顺序：

1. 使用现有 root 受限 runner，只跑当前副本 15 项和必要类型检查；出现红项立即停，不扩大为旧 52 项。
2. 15 项与类型检查绿后，独立复核新 config 的 18 棵树、53 个文件/引用、18 个 legacy 冻结及 builder 清理图。
3. 只在上述门通过后执行一次私有 25 文件开发编译，不安装、不打包。
4. 随后再按既定原合同模型验收执行；不得提前宣称模型或业务通过。

## 5. 写面与 Git

本线实际写面只有：

1. 修改既有 `dsh-ext/tests/t18-agent-current-fixture-20261028-214724.spec.ts`。
2. 新建 `docs/plan/evidence/T18/DraftFeedbackPrivateBuild-20261028-214724/路由夹具修正-20261028-220053.md`。
3. 新建本交回件。

未创建临时目录或额外作者文件。原始 `agent.spec.ts`、fake service、helper、shared Core、schema、示例、产品源码、其他旧测试、既有 failed/root 报告、config、builder、consumer、模型参数、manifest、编译产物和私有输出均未由本线写入。

Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。根 `git status --short --untracked-files=all` 仍因进入 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 时 `Permission denied` 退出 1；该阻碍不作为交付修复目标，未改锁、ACL、审批或权限。

## 6. 实际命令与退出状态

共执行 31 条 shell 命令：27 条退出 0，4 条退出 1。另有 1 次工具参数在进程启动前因 `duplicate field shell` 解析失败，未执行任何 shell。另做 3 次 `apply_patch` 写入，其中最后一次即生成本交回件。

退出 0 的主要命令：

- `C01` `Get-Content -Raw -LiteralPath D:\Lawbeach\lawbench-coord\A-T18-local-fixture-route-fix-order-20261028-220053.md`
- `C03` `rg --files D:\Lawbeach\lawbench-coord\T18LocalFixtureRouteInput-20261028-220053`
- `C04` `Get-Content -Raw -LiteralPath D:\Lawbeach\lawbench-A\dsh-ext\tests\t18-agent-current-fixture-20261028-214724.spec.ts`
- `C05` `rg --files D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DraftFeedbackPrivateBuild-20261028-214724`
- `C06` `Get-Content -Raw -LiteralPath ...\A-dirty-before.txt`；退出 0，输出因体积被工具截断，原文件未改。
- `C07` 至 `C10` 分别只读 `core-client.ts`、`core_task_begin.res.json`、`actual-results.json`、`root-finite-failure.json`。
- `C11` `rg -n "task/begin|task/context|call\(|response|validate|async call|CoreClient" ...\core-client.ts`
- `C14` 对原始测试、失败副本、当前副本、当前 `agent.spec.ts` 执行 `Get-FileHash -Algorithm SHA256`，并输出 `Path,Hash`。
- `C15` `rg -n "export (function|const) (coreId|validate)|function coreId|function validate" ...\contracts.ts`
- `C16` `rg -n "route|externalLlmState|EXTERNAL_ROUTE_UNAVAILABLE|task/begin" ...\agent\index.ts`
- `C17` 至 `C20` 分别只读 `contracts.ts` 前 80 行、`task_begin.schema.json`、`tsconfig.json`、`package.json`。
- `C22` `rg -n "new LegalAgent|new CoreClient|async \(\) => \[\]|undefined, undefined, undefined" ...\t18-agent-current-fixture-20261028-214724.spec.ts`
- `C23` `Get-Content -Raw -LiteralPath ...\DraftFeedbackPrivateBuild-20261028-214724\README.md`
- `C24` 在协调目录与 T18 私有构建目录的 `.md/.txt/.mjs` 中 `rg` 检索接续关键词；退出 0，输出被截断。
- `C25` `Get-Content -Raw -LiteralPath D:\Lawbeach\lawbench-coord\A-handback-T18-feedback-fixture-build-20261028-214724.md`
- `C27` 对 9 个冻结/交付文件执行 `Get-FileHash`，并同时输出长度。
- `C28` 对原始、失败副本、当前副本执行 `Get-Item` 并输出路径、长度和 UTC 修改时间。
- `C29` 用原生 PowerShell 在内存中做精确反向变换并比较原字符串、原 SHA 和字节数；结果为 `ExactEqual: True`。
- `C30` 用原生 PowerShell 统计 `it`、`LegalAgent`、适配器、禁用标记、CRLF、裸 LF 和末尾换行。
- `C31` `Select-String` 静态核对 `super.call`、命令限定、`route: local`、转换后契约校验和边界返回。
- `C32` `git status --short --untracked-files=no --ignore-submodules=all`

退出 1 的命令：

- `C02` `git status --short --untracked-files=all`：子模块 `dsh` 的 `.git/worktrees/.../modules/dsh` 权限拒绝。
- `C12` `git diff --no-index --unified=5 <original-agent.spec.ts> <修正前当前副本>`：预期差异退出 1。
- `C13` `git diff --no-index --unified=5 <original-agent.spec.ts> <failed-current-copy.spec.ts>`：预期差异退出 1。
- `C21` 修改后再次执行 `git diff --no-index --unified=5 <original-agent.spec.ts> <当前副本>`：预期仍有适配器差异，退出 1；差异范围已逐项核对。

启动前失败：

- `C26` 一次“读取既有接续与 admission 说明”的 `rg` 调用因工具参数重复 `shell` 被拒绝；没有启动 shell，也没有产生文件或状态变化。

所有真正执行的 shell 均显式使用原生 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，`login=false`。未使用 Bash/cmd 包装，未启动 setup/legacy，未改变沙箱、审批或 ACL。
