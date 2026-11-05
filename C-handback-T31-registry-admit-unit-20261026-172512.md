# C 正式交回 — 生产注册表 admit UNIT

执行令：`D:\Lawbeach\lawbench-coord\T31-registry-admit-unit-order-20261026-172512.md`  
时间：2026-10-26T17:35:25.710+08:00  
状态：`SOURCE_HANDED_BACK / NOT_RUN`  
Git commit SHA：无（本运行器 Git 严格只读）

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新增一个真实生产注册表单元和一个只选择该文件的 A 原生配置包装；完成静态源码、导入链、清理链和冻结哈希核对。 |
| 目标是什么 | 补生产 `apply.ts` 注册表从 prepare 快照到同步 admit 的实际单元覆盖；只处理这一个缺口，不改产品。 |
| 在等什么 | 等 root 全文审阅后从 A 原生根实际执行唯一测试；通过则只收该单元覆盖，失败则按首个真实失败再判断。 |
| 卡在哪 | 源码交付没有停摆；初始 Git 状态受共享子模块权限拒绝，已用忽略子模块的只读状态核对并保留全部 dirty。 |

## 交付

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-C\dsh-ext\tests\t31-submission-registry-admit.spec.tsx` | 7354 | `372bed5005791ecc948aa2c673ccd03eccec3b64cb9b36a74d532f7093a15fce` |
| `D:\Lawbeach\lawbench-C\dsh-ext\vitest.t31-submission-registry-admit.config.mjs` | 971 | `6a00617ac4c4ec19ef16bb27fd1cf447e78a624007b1ee458f607a890a01a55c` |
| `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\RegistryAdmitUnit-20261026-172512\README.md` | 9136 | `88d545559177536567ad7a6b39278958254746a29313514a10f49d3d52335229` |
| `D:\Lawbeach\lawbench-coord\C-progress-T31-registry-admit-unit-20261026-172512.md` | 进度记录 | 不把自身哈希写进自身 |
| 本文件 | 正式交回 | 不把自身哈希写进自身 |

## 单元内容

唯一测试从 A 生产 `apply.ts` 取得 `conversationSubmission`，经真实
`ConversationController.send` 执行。文件明确标注 `LOCAL REGISTRY UNIT ONLY`；
`SlotTestRuntime` 的虚构 Session/`beginSubmission()` 只是本地 sentinel，不是
NativeSession UUID、Host、Gateway、HTTP 或 GUI 证据。

单一场景同时满足：

- 两个 hook 在 prepare 快照中按顺序完成。
- 最后一个 prepare 期间反注册已经 prepare 的第一个 hook，并注册迟到 hook。
- 同步 admit 仍按 `first → second` 调用两个已 prepare 的 hook 对象。
- 第二个 admit 抛出同一 sentinel 错误，真实 prompt 调用为零。
- 两个已 prepare hook 各 `failed` 一次，且收到同一个注册表事件对象。
- 两个 `accepted` 均为零，本地 submission `abandon()` 一次。
- 迟到 hook 的 prepare/admit/accepted/failed 均为零。
- 注册表 disposer、参考持有、feature、runtime 和 mocks 在 `finally` 恢复；本路径不使用
  `sendSession` 的 paint timer。

本单不修产品，不覆盖 `GAP-02` 的真实 Session 回显断言，也不处理 LOW 类型注入仅走
admit 的遗漏；这两项保持单列，没有隐藏或顺手修改。

## 私有选择器

- import A 原生 `D:\Lawbeach\lawbench-A\dsh\vitest.config.ts`，继承原始
  `thread-safe` project、plugins、setupFiles、`execArgv`、pool、exclude、装饰器和
  `tsconfig.base.json` source path。
- 顶层和唯一 `thread-safe` project 的 root 都是
  `D:\Lawbeach\lawbench-A\dsh`。
- 顶层和 project 的 include 都只有
  `D:\Lawbeach\lawbench-C\dsh-ext\tests\t31-submission-registry-admit.spec.tsx`。
- 没有复制产品实现，没有加载 C 产品/C 扩展状态，没有新增 loader、通用 alias、安装或升级。

## 冻结哈希

交回前再次实测，四项均与 source-map 声明及冻结快照一致：

| 文件 | SHA-256 |
|---|---|
| A `packages\client\ui-conversation\src\client\service.ts` | `9263521b80781489a071d411c14b7d3e85ef484a37f4a03046aa40a44a977414` |
| A `packages\client\ui-conversation\src\client\apply.ts` | `92d61e26087dd7d150a43f7e505ab07faa3114f90ca5a9318459b991f9703bb0` |
| A `packages\client\ui-conversation\tests\service-orchestration.client.spec.ts` | `c1f3b208106e714fd238248689a3b2aab11eee7710115bffe18686a9d5606579` |
| A `vitest.config.ts` | `d8ccc373d1ab9d837664814794017794551257a630a100534aac8bae7f56314f` |

其他冻结件实测：

- C `dsh-ext\vitest.config.mjs`：2487 bytes，
  `e83f4a114b8bb48b5a222e04ef3b88ec112577bb296ce3759d2c4c2051733cc0`；未改，
  `git status --ignore-submodules=all` 未列出。
- C `dsh-ext\tests\t31-material-capture-disposal.spec.tsx`：4639 bytes，
  `469118449395bcd0d6ca77d8d98bb43bddac949a6dcc2a7b47e041096b0d00de`。
- A `dsh-ext\vitest.t31-material-admission.config.mjs`：1510 bytes，
  `ed1c57bbb492e28caf43725896ba265905d126a16126dc8824eaea9be961cdb9`。
- A `packages\api\session-controller\tests\t31-material-admission.client.spec.ts`：22825
  bytes，
  `1166b065c97ef634d7b0e2829927e148e56f3a3f851148fad92134205b45fc7b`。

## 验证矩阵

| 项目 | 状态 | 说明 |
|---|---|---|
| 新注册表单元 | `NOT_RUN` | 本运行器禁止 Vitest；没有通过/失败数。 |
| 类型检查 | `NOT_RUN` | 本运行器禁止 tsc。 |
| quiet/fresh retry、affected 19/C1、旧 hook 6 | `NOT_RUN` | 按令复用既有 root 证据，不重演。 |
| NativeSession R/Host/Gateway/HTTP/GUI | `NOT_RUN` | 本地注册表单测不外推为原生集成。 |
| GAP-02 真实 Session 回显 | `NOT_RUN` | 单独保留。 |
| LOW 类型注入 admit 遗漏 | `NOT_RUN` | 单独保留。 |
| 整个 T31 发版 | `NOT_PASS` | 本单没有完整发版证据。 |

## root 命令

工作目录：`D:\Lawbeach\lawbench-A\dsh`

尚未执行的唯一命令：
`E:\node\node.exe node_modules/vitest/vitest.mjs run --config D:\Lawbeach\lawbench-C\dsh-ext\vitest.t31-submission-registry-admit.config.mjs --project thread-safe --maxWorkers=1 --no-file-parallelism --cache=false`

root 必须先全文审阅当前测试、配置、import 图、两层 root/include、setup 和 finally，再执行
这一条并保存原 stdout/stderr/退出码。fixture/import gray 不得预先称作产品红，断言不得
弱化；若通过，只可收“生产注册表单测 GAP-01 已覆盖”。

## 全部非零事件

均为实测退出码 1，均无源码/锁/ACL/审批/权限改动：

1. C 普通 `git status` 在共享 `.git/worktrees/lawbench-C/modules/dsh` 处
   `Permission denied`，随后 `'git status --porcelain=2' failed in submodule dsh`。
2. A 普通 `git status` 返回 `fatal: this operation must be run in a work tree`。
3. 首次批量哈希命令 PowerShell 解析错误：
   `An empty pipe element is not allowed.`；解析阶段退出，后续语句未执行。
4. 首次目标存在性命令出现同一 `An empty pipe element is not allowed.`；解析阶段退出。
5. 读取未纳入四快照的 `vitest.shared.ts` 返回
   `Cannot find path ... because it does not exist`；随后读取 A 实际文件成功。
6. 一次冻结哈希命令误填 `shell=bash`，managed 隔离在预执行阶段以
   `Bash/E_ACCESS_DENIED` 拒绝；Bash 未执行，未启动 setup/legacy，随后用指定原生
   PowerShell 成功重跑。
7. 一次状态过滤把 pipeline 误用为 `Select-String -LiteralPath`，返回
   `Missing an argument for parameter 'LiteralPath'`；随后用 `-Pattern` 成功重跑。

## Git 与未做

- Git 全程只读：没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`
  或 `push`；没有暂存。`git diff --cached --name-only --ignore-submodules=all` 为空。
- `git status --short --untracked-files=all --ignore-submodules=all` 成功，既有 dirty
  全部保留。C 工作树本单只新增允许的测试、配置和证据 README。
- 未执行 Python、Node、产品、parser/AST、Vitest、tsc、pytest、test、list、collect、
  prepare、serve、probe、build、GUI、HTTP、model、selfcheck 或 Git 写入。
- 未使用真实案卷、历史、rollout、后端/model fixture、`.env.local`、Keyring、凭据、OCR、
  Office、网络、安装、升级或打包。
- 未修 `index.lock`、权限、ACL、审批、writer 锁，也未扩权或切 legacy。

Source only。停止在本交回件；root 实际跑完唯一测试前，不宣称产品红、单元通过或 T31 完成。

Response ID: `T31-NAR-GAP-01/C-REGISTRY-ADMIT-UNIT`  
Response log path: `D:\Lawbeach\lawbench-coord\C-handback-T31-registry-admit-unit-20261026-172512.md`
