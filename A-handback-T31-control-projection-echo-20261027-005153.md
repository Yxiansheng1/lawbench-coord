# A 线交回：T31 control projection / local echo

状态：`AUTHOR_BOUNDED_CHANGE_COMPLETE / TEST_DISCOVERY_GRAY / PRODUCT_RUNTIME_NOT_RUN`

执行令：
`D:/Lawbeach/lawbench-coord/T31-control-projection-echo-order-20261027-005153.md`

证据：
`D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlProjectionEcho-20261027-005153/README.md`

## 新增文件

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `D:/Lawbeach/lawbench-A/dsh-ext/finite-tests/t31-control-projection-echo.spec.ts` | 20,003 | `1879C9FB4FB23EF675426F3CC15EC1EC37F9E18B92901FFD2F785529FD650DF7` |
| `D:/Lawbeach/lawbench-A/dsh-ext/vitest.t31-control-projection-echo.config.mjs` | 437 | `C3AB9A15D4EE319E0A20CE1FC81D07BDD2F94658F58819CF4B71F22DC3E83AED` |

未改生产源码、冻结测试/生成物、旧 selector、launcher、profile、权限、ACL 或锁。

## 唯一 selector 结果

命令：

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\vitest\vitest.mjs' run --config 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-projection-echo.config.mjs' --maxWorkers=1 --no-file-parallelism --cache=false
```

退出码 `1`，原始结果：

```text
RUN  v4.1.8 D:/Lawbeach/lawbench-A
No test files found, exiting with code 1
include: finite-tests/t31-control-projection-echo.spec.ts
exclude:  **/node_modules/**, **/.git/**
```

因此测试体未执行，不得记为产品红或绿。selector include 是相对路径，目标文件真实位于
`D:/Lawbeach/lawbench-A/dsh-ext/finite-tests/t31-control-projection-echo.spec.ts`，
本次 cwd 为 `D:/Lawbeach/lawbench-A`。按令，灰色 discovery 后未在当前令内改 fixture/config，
也未重跑。

## 已完成的夹具范围

- 两份用例分别覆盖受限 queued echo 与普通 steering echo。
- Host 为实际 `Context + SessionStore + SessionProjectionRegistry + inboxProjectionDefinition + ReactLoopInbox + SessionCommandController + SessionControlController`；Agent 为 `send` 抛错/计数的 sentinel shell。
- baseline/frame 只取自实际 `SessionControlController.control()`；R 只取自真实源码 `NativeSession.beginSubmission()`。
- 两种 frame 都走固定 215235 Host strict result codec → JSON → Remote strict result codec → 实际 `ProjectionValueStore.seed/apply`，没有手写 baseline、frame、R 或 seq。
- restricted 用例在客户端观察 frame 前保持 queued echo；应用真实 frame 后等待 animation-frame 才以 `observed` 退场一次，Host inbox 与客户端 projection 各保留同一消息。
- ordinary steer 用例保持同 R/文本/`steering` placement，source 无 restriction、无 next-turn/scoped 转换；没有伪造 durable admission，最终显式 abandon/dispose。

## 固定输入

三份 215235 生成物 selector 后仍为：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `manifest.json` | 58,186 | `1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae` |
| `typert.host.js` | 158,754 | `a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12` |
| `typert.remote-client.js` | 59,116 | `e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630` |

冻结 restricted-claim 夹具仍为
`5386E8B5AAC7B9CFB76A5C254D1329E0B94881145CA6B675914F9B93B666CF56`。

## Git / 边界

- 普通 `git status` 先因
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝退出 1；
  之后仅用 `--ignore-submodules=all` 只读核对，未修权限或锁。
- 原有 dirty/untracked 全部保留；两个新文件为 untracked。
- 没有 Git 写入；没有 add/commit/rebase/stash/reset/clean/checkout/push。
- 没有构建、安装、GUI、HTTP、网络、模型、产品运行或打包。
- 记录中披露一次误用 `shell=Bash` 的只读尝试；runner 以 `E_ACCESSDENIED` 拒绝，
  未产生文件或状态变化，随后全部使用指定原生 `pwsh.exe`。

## 下一窄令

只需处理 test discovery root：决定使用显式 test root 或从 `dsh-ext` 启动，并授权修正后
恰好一次重跑。当前结果不得作为 control projection 产品通过或失败证据。
