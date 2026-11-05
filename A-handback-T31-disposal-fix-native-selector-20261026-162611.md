# A 正式交回 — T31 disposal repair / native selector

执行令：`D:\Lawbeach\lawbench-coord\T31-disposal-fix-native-selector-order-20261026-162611.md`  
线：A / DeepSeek 执行者  
交回时间：2026-10-26T16:33:23+08:00  
状态：`SOURCE_HANDED_BACK / NOT_RUN`  
Git commit SHA：无（本运行器 Git 严格只读）

## 1. 交付

已写入：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\ui\material-batch.ts` | 16804 | `B4BC8CA39919B9F441556B41623AF957B22617C1A5358AC867C40DD09434F2E8` |
| `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-material-admission.config.mjs` | 1510 | `ED1C57BBB492E28CAF43725896BA265905D126A16126DC8824EAEA9BE961CDB9` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\DisposalAndNativeFixture-20261026-162611\README.md` | 本次证据说明 | 不把自身哈希写死在自身内 |
| `D:\Lawbeach\lawbench-coord\A-progress-T31-disposal-fix-native-selector-20261026-162611.md` | 进度 | 同上 |
| 本文件 | 正式交回 | 同上 |

修改前产品源为 16768 bytes、SHA-256
`38328DC0B4B1A568772729E5310677657E48247C1713D65F0CDE6028FEA4CD01`。

## 2. 产品修复

`registerMaterialSubmission` 的最后一个 disposer 生效后，在既有 app
`materialBatches` / `materialBatchBlocks` 清理之前同步执行：

```ts
materialCaptureOwners.clear()
```

这只在计数归零时发生，使所有未完成 capture 的 owner 失效；迟到
`materialsList` 响应随后在 `ownsMaterialCapture` 处返回 `undefined`，不会重建批次、
留下 loading/list_failed/empty 阻断态或继续 finish。仍有 registration 时不清理。

下列语义没有改动：单会话取消、同会话较新 capture 覆盖旧 capture、跨会话 owner
隔离、prepare 成功后的案件/批次/选择复核、accepted/failed、occupied session
释放和所有公开 API。

## 3. 私有 native selector

新文件只做配置组合和精确选择：

- import 原生 `..\dsh\vitest.config.ts`，使用其
  `thread-safe` project、plugins、setupFiles、execArgv、pool、exclude 和
  tsconfig path resolution。
- 顶层和 project root 都是原生 `D:\Lawbeach\lawbench-A\dsh`。
- 从既有 `dsh-ext\vitest.config.mjs` 只读取已固定的 `react` / `react-dom`
  alias 值，并同时用于顶层和实际 project resolution。
- 未复制或启用 UI 的 `@deepseek-ai/dsh-llm`、persistence、primitives 等 alias，
  未重定向原生 singleton。
- 顶层和 `thread-safe` project 的 include 都精确限定为
  `packages/api/session-controller/tests/t31-material-admission.client.spec.ts`。
- 无 skip、`passWithNoTests`、fake R、fake API、通用 alias proxy、新 loader 或
  依赖安装。

## 4. 冻结输入与复用证据

冻结 native admission test：

`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-material-admission.client.spec.ts`  
22825 bytes，SHA-256
`1166B065C97EF634D7B0E2829927E148E56F3A3F851148FAD92134205B45FC7B`

冻结 C disposal test：

`D:\Lawbeach\lawbench-C\dsh-ext\tests\t31-material-capture-disposal.spec.tsx`  
4639 bytes，SHA-256
`469118449395BCD0D6CA77D8D98BB43BDDAC949A6DCC2A7B47E041096B0D00DE`

两个既有配置保持原哈希：

- `dsh-ext\vitest.config.mjs`：
  `62E4D81D88C1500F03805C4E76D030A9837065E960D1EFE7935A039DA91B3FBF`
- `dsh\vitest.config.ts`：
  `D8CCC373D1AB9D837664814794017794551257A630A100534AAC8BAE7F56314F`

复用的 root 实际结果目录：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Lifecycle-root-20261026-162025`

- C disposal1 实际 1 test / 1 failed，失败点正是修改前批次仍被迟到响应重建。
- native2 实际 0 tests；gray 错误是 dsh-ext `store.ts` 侧解析不到 package
  `react`，不是 native product assertion red。
- root 记录的 7 个观察进程均自然 gone，`forced=false`。

旧 `NativeAdmission-20261026-155618/README.md` 的 `C88...` 保留为历史，但本单与 root
后续以现行冻结 `1166B065...FC7B` 为准，没有回写旧历史。旧 A 19、B 20、types 0
不覆盖本次最后解绑窗口，不能替代新运行。

## 5. 验证矩阵

| 项 | 状态 | 结论 |
|---|---|---|
| C disposal 1 | `NOT_RUN` | 静态设计满足冻结断言，未宣称通过 |
| affected 19 | `NOT_RUN` | 未运行 4 项 races + 旧 15 项 |
| affected types | `NOT_RUN` | 未运行 tsc |
| native admission 2 | `NOT_RUN` | selector 未 import、未 collect、未运行 |
| GUI / queued R2 / R1 | `NOT_RUN` | 不在本单 |
| whole T31 | `NOT_PASS` | 本单没有完整发版证据 |

本线没有执行 Python、Node、产品、测试、parser、AST、Vitest、tsc、pytest、collect、
prepare、serve、probe、build、GUI、HTTP、model 或 selfcheck；没有使用真实案卷、
历史、rollout、`.env.local`、Keyring、凭据、OCR、Office、网络、安装或打包。

## 6. root 下一门

root 必须先独立全文审阅当前累计源码、新 selector 的实际内容、冻结测试哈希和 dirty，
然后再实际执行并保存真实 stdout/stderr/退出码。作者建议入口：

C disposal 1：

```powershell
E:/node/node.exe D:/Lawbeach/lawbench-A/dsh/node_modules/vitest/vitest.mjs run --config D:/Lawbeach/lawbench-A/dsh-ext/vitest.config.mjs --root D:/Lawbeach/lawbench-C/dsh-ext tests/t31-material-capture-disposal.spec.tsx
```

affected 19 与 types，工作目录 `D:\Lawbeach\lawbench-A\dsh-ext`：

```powershell
node scripts\test.mjs tests\material-batch-races.spec.tsx
node scripts\test.mjs tests\material-batch.spec.tsx tests\material-batch-boundaries.spec.tsx
node ..\dsh\node_modules\typescript\bin\tsc -p tsconfig.json --noEmit
```

native admission 2，工作目录 `D:\Lawbeach\lawbench-A\dsh`：

```powershell
E:\node\node.exe node_modules\vitest\vitest.mjs run --config ..\dsh-ext\vitest.t31-material-admission.config.mjs packages\api\session-controller\tests\t31-material-admission.client.spec.ts --project thread-safe --maxWorkers=1 --no-file-parallelism --cache=false
```

native2 必须先从 fixture resolution 到达真实 material lifecycle assertions，才允许
讨论必要的 ConversationController/service/P29/Host/Agent/B 产品修复。C 侧不得跨线
改写，两个冻结测试不得改。

## 7. Git、dirty 与失败事件

Git 全程严格只读：未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
`checkout` 或 `push`，未暂存，也没有 commit SHA。没有尝试修复 `index.lock`、权限、
ACL、审批或 writer 锁，没有启动 setup、切换 legacy 或扩权。

普通 `git status --short --branch` 在共享 `dsh` 子模块的 `.git` 元数据处被
Permission denied；随后只用 `git status --short --ignore-submodules=all` 只读核对。
工作树开工前已有大量 dirty，本单全部保留。目标申报确认既有
`dsh-ext\vitest.config.mjs` exclude 改动仍在，且固定配置哈希未变。

失败事件：

- 两次命令误填 `shell=bash`：一次 `git diff`、一次读取 EvidenceFix README；
  managed MXC 均以 `Bash/E_ACCESS_DENIED` 拒绝，命令没有执行，随后用指定
  PowerShell 成功重跑。
- 一次 `rg --files` 因 `dsh/tests` 不存在返回 exit 1，但仍给出 A 侧候选文件；
  改以现有路径、哈希和证据定位冻结 native test。
- 一次 `rg` 把 Windows 通配符放进目录参数，报文件名语法错误；改为读取 Vitest
  类型定义静态确认 project 可携带 root/resolve。

详细命令台账、命令原文和 dirty 说明见：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\DisposalAndNativeFixture-20261026-162611\README.md`

本交回停在指定源码边界；不宣称项目完成、native 已红或任何测试通过。
