# A 交回：T31 queued-steer paired red 源码

状态：`SOURCE_HANDED_BACK / NOT_RUN`  
执行令：`D:\Lawbeach\lawbench-coord\T31-queued-steer-paired-red-order-20261026-172106.md`  
交回时间：`2026-10-26T17:30:54.5408068+08:00`  
工作树：`D:\Lawbeach\lawbench-A`，分支 `line-A`，HEAD
`a23271abee333a9a256fd46a3141da16975c2380`  
Git commit SHA：无。Git 严格只读，本运行器未 add/commit/rebase/stash/reset/
clean/checkout/push。

## 结论

已新增一个有界成对回归：公开无 scope 的 queued NativeR2 转 steer 仍作为合法控制；
经实际材料 hook `prepare` 的 queued R2，在 NativeR1 已通过真实
`ReactLoopInbox.claim('next-turn', 1)` 建立进行中 turn 后，不得被
`SessionCommandController.updateQueue(steer)` 静默提升成同一 turn 的
`next-step`。允许 Host 明确拒绝，或 R2 留在自身下一 turn。

源码作者没有运行测试，因此不宣称产品红或红转绿。下一动作必须由主编排：

1. 独立复核新测试、selector、冻结源和清理路径；
2. 在独立副本/隔离 packet 中执行下面的真实 2 项命令；
3. 仅当控制 1 绿、scoped 1 产品断言红、退出 1 且无 setup 错误时，才确认本单
   的 red 阶段；
4. 只有该真实产品红成立，才可安排适当 owning-tree 修复和必要契约设计。

排队插话、T31 整体和 GUI 仍为 `OPEN`。

## 新增交付

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-scoped-queued-steer.client.spec.ts` | 18186 | `FE96D6F18F65811D694BCE8AA6E788F5FD3B84E2C247F5F9EA1DFD917CA2E426` |
| `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scoped-queued-steer.config.mjs` | 1517 | `E87FC04AC518EAA1EC2B8B79618C6FA9B883A6E438C81E0DFFB5DAAE417E2584` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\QueuedSteerPair-20261026-172106\README.md` | 11245 | `E3E388140FF17C719414C95C2B54F52A41E8E0C99F2BB570C62D98FF6E10FE97` |

selector 与既有 `vitest.t31-material-admission.config.mjs` 的静态差异只有测试变量
一行和两个 `include` 行；沿用原 native setup、thread-safe project、path graph、
React aliases 和根项目结构。

## 冻结源与复用边界

`source-before.json` 的 10 项逐项复算全部匹配。关键冻结哈希如下：

| 文件 | SHA-256 |
|---|---|
| 原 native identity 测试 | `6EDAC6FCE7E9E1DD6A9B41F53D8DA9982F965402AF2ED8755594D6F4065D8343` |
| 原 material admission 测试 | `1166B065C97EF634D7B0E2829927E148E56F3A3F851148FAD92134205B45FC7B` |
| `commands.ts` | `0EC066A40E71B2ADA35B6C3FBDE40A84B7506457BCBBF282A15A62193ACEF87E` |
| client `session.ts` | `507260418C1D9666756FA43839BF15489D1114C0EA8DA850F2BE0869459538F5` |
| `service.ts` | `9263521B80781489A071D411C14B7D3E85EF484A37F4A03046AA40A44A977414` |
| `apply.ts` | `92D61E26087DD7D150A43F7E505AB07FAA3114F90CA5A9318459B991F9703BB0` |
| `material-batch.ts` | `3447CA541CB32694416E33E1B808468A7930323C63A3D2B4A44B1F563C5368AF` |
| 原 material selector | `ED1C57BBB492E28CAF43725896BA265905D126A16126DC8824EAEA9BE961CDB9` |
| 既有 UI config | `62E4D81D88C1500F03805C4E76D030A9837065E960D1EFE7935A039DA91B3FBF` |
| native config | `D8CCC373D1AB9D837664814794017794551257A630A100534AAC8BAE7F56314F` |

上一轮 native2 的 `2 PASS` 只有在源码仍为 `1166...` / `ED1C57...` 时可复用；本轮
没有重跑或把它当作新风险已证明。原 native2、1166 测试、产品、旧测试、原配置、
四份公开 schema、P29 七份补丁、私有 25 份输出和 18 份旧证据均未修改。

## 两个用例

控制：实际 client mint NativeR1，走真实 Host prompt 和 inbox claim；再 mint 无
scope NativeR2，实际 `updateQueue(steer)` 经 in-memory Remote 转真实 Host
controller。断言 R2 仍在同一 NativeR1 turn 作为合法 `next-step` claim。

scoped：同样先 claim NativeR1；用合成材料 API 捕获现有虚构批次，由实际
`makeMaterialSubmissionHook` 为 NativeR2 调用 `prepare`，再经
`ConversationController.sendSession` 进入真实 Host queue。记录 R2、case、
session、material IDs 和真实 message identity。实际 `updateQueue(steer)` 后，
`rejectedAtHost || stillQueuedForOwnTurn` 必须为真，且 R2 不得进入
NativeR1 的 `next-step`。

清理在 `finally` 中撤销残留 reservation、release 合成 scope，并以
`Promise.allSettled` 释放 controller/Host fibers；还撤销 frame global、清空
mock API/app stores 和 spies，红断言后也会执行。Agent.send 始终只会抛错并计数。

边界：材料 scopeAPI 是合成 responder；只证明 Native queued identity + material
hook 集成，不证明 B 线真实 context、HTTP、Gateway backend、模型或 GUI。

## 根实际运行的精确有限命令

工作目录：`D:\Lawbeach\lawbench-A\dsh`。期望 2 suite / 2 tests；控制通过，
scoped 在 `rejectedAtHost || stillQueuedForOwnTurn` 红，退出 1。任何导入、
TypeScript、config、fixture、collect 失败都先按 setup 失败保留，不能冒充产品红。

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\vitest\vitest.mjs' run --config 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-scoped-queued-steer.config.mjs' 'packages/api/session-controller/tests/t31-scoped-queued-steer.client.spec.ts' --project thread-safe --maxWorkers=1 --no-file-parallelism --cache=false --reporter=json --outputFile='C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31QueuedSteerPairedRed-root-20261026-172106\A-queued-steer-pair.json'
```

## 实际命令、非零事件与 NOT_RUN

作者实际 Shell 命令全部列在证据 README 的“实际 Shell 命令”和“非零事件与偏航”
两节。没有 Node、Vitest、测试、collect/list、tsc、parser、AST、Python、pytest、
build、prepare、serve、probe、HTTP、GUI、模型、selfcheck 或 git apply 命令。

非零事件：

- 普通 `git status --short --branch` 退出 1；managed MXC 在共享
  `.git\worktrees\lawbench-A\modules\dsh` 拒绝访问。按令没有修锁/扩权。
  `--ignore-submodules=all` fallback 成功，确认 `line-A`、`ahead 93 / behind 1`
  和既有 dirty；全部原样保留。
- 五个目标交付文件在原位存在性查询中尚未全部存在，`Get-Item` 退出 1。
- 三次 PowerShell 采集脚本因管道语法错误退出 1；修语法后用变量重跑成功。
- 两次命令误填 `bash`，managed MXC 以 `Bash/E_ACCESS_DENIED` 在执行前拒绝；
  没有任何 Bash 内容被执行。
- 一次 `rg` 把 Windows `*` 放进口径退出 1；改为目录加 `-g` 后重跑。
- 一次目录列举脚本因不存在的兄弟目录，第二个 `Get-ChildItem` 退出 1。
- 六次只读命令误填非执行令绝对 shell 路径，两次误填 `pwsh.exe` 短名；仅读、
  比较或列目录，没有写文件、运行产品/Node/Vitest 或更改权限。后续均使用执行令
  指定的 native PowerShell。

`NOT_RUN`：实际产品红/绿、红转绿、T31 整体、GUI、B 实际范围、HTTP、Gateway
后端、模型、真实案卷、凭据、Keyring、OCR、Office、网络、权限、ACL、审批、
打包、安装/升级、默认 app/lifespan、历史/rollout 和 Git 写入。

交回在协调目录，不是 Git 提交。本单到此停止，等待主编排独立复核和真实成对运行。
