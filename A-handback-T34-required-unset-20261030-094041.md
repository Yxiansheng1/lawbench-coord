# A 线交回：T34 required-unset 原始缺失分支

状态：`SOURCE_ONLY_HANDOFF / AUTHOR_RUNTIME_ZERO / ROOT_ONE_FRESH_GUI_REQUIRED`

正式执行令：
`D:\Lawbeach\lawbench-coord\A-T34-required-unset-order-20261030-094041.md`

候选目录：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\RequiredUnsetGUI-20261030-094041`

## 交付

目录恰有七个文件：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13,559 | `262940270212db73fde357daa384624abd2db232d02c22d4731c491986fb0d3e` |
| `start.ps1` | 80,933 | `e1a0d31df1dfbbd9cce67aedd6407ca572e361ed7cf42a71d6edef9e511a7b46` |
| `stop.ps1` | 7,176 | `f64c63f37c9e1b701c9ca66d6b24bca6b36fd8d82587004d25355a77f9a7de4d` |
| `entry.py` | 88,650 | `70ae562d81d1acb91f8ccc63e8af56f5f0b7fded7373f48ef51820f626e9395a` |
| `projection-observer.mjs` | 20,058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `literal-inputs.json` | 22,313 | `SELF_NOT_REFERENCED` |
| `README.md` | 4,604 | `5d5a5d08095c7c2cd34b4cacf3d4bc9883382f3b5439598f531f7bf6591d30dd` |

相对批准 `.before` 快照，路径改动仅在本目录的 `prepare.ps1`、`start.ps1`、
`stop.ps1`、`entry.py`；`start.ps1` 同步钉住新的 `entry.py` 身份。observer 字节未变。
清单其余基线、SDK 六项加批准 UI、产品三源、当前 25 项私有构建、B346、legacy18、
binding 与 approved-origin 元数据均保留。

## 种子与证明

`start.ps1` 只在 `Prepare-PrivateProfile` 的 owned fresh profile 中，将以下块插到唯一
`    providers:` 与唯一 `      lawfirm:` 之间：

```yaml
      external:
        displayName: T34 required-unset synthetic
        api: openai-completions
        baseURL: !!js "'http://127.0.0.1:' + process.env.T50_LLM_PORT + '/v1'"
        apiKeyEnv: LAWFIRM_KEY
        timeoutMs: 1200000
        retryPolicy:
          mode: normal
          maxRetries: 1
        models:
          - id: t34-required-unset-synthetic
            name: T34 required-unset synthetic
            contextWindow: 2048
            input: [text]
```

写入前守卫：provider 头 1 个、6 空格 provider 行 1 个且为 `lawfirm`、`external` 为 0；
插入沿用目标换行，插入块计数 1。移除插入块后，seed 前缀与原件逐字节相等。最终仍执行
原 `seeded prefix + private suffix` 全量字节不变量，并要求种子块恰好 1 个。

launch 前只落一次 `gui/state/required-unset-seed.json`，记录固定 schema/kind、namespace、
provider 标签、seed model id、owned overlay 路径、磁盘实际前后 prefix 字节/SHA、插入数 1、
`currentBExternalLlmEnabled=false`，不记录 key/value/raw config。该证明写在完整 profile
落盘和断言之后、Electron launch 之前。

没有启用 workbench external model，没有真实 key、discovery、模型请求、网络调用、新路由、
分类器、自动输入或 helper test。guard、resolver、600 秒窗、观察器参数、精确清理与协议均未改。

## 核验

作者以只读命令确认：

- 目录恰七文件，六个非自引用哈希与清单逐项一致；
- START 中的新 `entry.py` 字节/SHA 与磁盘一致；
- `projection-observer.mjs` 与批准原件同字节、同 SHA；
- 五个交付文本中旧 `IdempotenceGUI-20261030-091453` 引用为 0；
- provider-only、external-absent、same-newline、insertion-one、inverse-byte-exact 与
  final-seed-one 守卫均在源码中；
- 所有文件无 BOM；PowerShell/Python/README 保持 LF，清单保留根批准蓝图的 CRLF；
- `legacy18`、当前 25 项构建、产品源与旧 run 均未重写或复用。

## 命令、偏差与阻碍

截至最终只读核验共 59 次 `exec_command`，非零 6 次。README 记录说明写入前的 41 次 / 4 次
非零；清单记录定稿时的 49 次 / 5 次非零。最终另有 10 次只读核验，其中 1 次误包 bash 后
在目标执行前被拒绝。

非零明细：

- 1 次只读 `git status` 因共享 worktree 子模块 `.git` 权限拒绝；未修复、未提权；
- 2 次原生 PowerShell 管道位置写法错误，无写入；
- 3 次误把只读 `rg/Get-Content` 包在 bash，均在目标命令执行前由运行器以
  `BASH/E_ACCESS_DENIED` 拒绝，无读取、无写入。

这是本轮交付的唯一执行偏差，已如实保留。Git 写操作为 0；未执行 add/commit/rebase/stash/
reset/clean/checkout/push，未改 index.lock、ACL、审批、锁或全局配置。共享 worktree dirty
未触碰；本次写入仅在指定新证据目录和本交回件。

## NOT RUN

`prepare`、admit、`start`、GUI、ordinary unset action、`settings.mutate` 实调用、
`ConfigEditor.edit` 实调用、observer capture、`stop`、磁盘 patch/current provider 检查、
owned OS closure、UI/no-source-change 检查、Node/Python、parser/import/type/check/test/build、
模型/网络、native projection PASS、整条 T34 PASS 和打包均为 `NOT_RUN`。

测试结果不可沿用：新增 seed 段从未实际运行。底层 native 写失败原因仍为 `UNKNOWN`。根侧应
审计本候选后只做一次全新实际 GUI，让 ordinary action 真实触发 external unset；失败即保留
失败并停止等价重试，不预先宣称 PASS。
