# B 交回：T18 当前任务 Skill 消费端

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

任务：`B-T18-navigation-current-task-skill-consumer-20261030-024454`

执行令：`D:\Lawbeach\lawbench-coord\B-T18-navigation-current-task-skill-consumer-order-20261030-024454.md`

证据目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\NavigationCurrentConsumer-20261030-024454\`

提交 SHA：无。按本次执行令，Git 全程只读，未 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 交回结果

已生成唯一的四文件消费端修复包：

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `native-navigation.mts` | 176215 | `753b4b5f77ae1740085090be76b6282f2273e542d882101400c7dcad2ff5dc53` |
| `b-service-navigation.py` | 58754 | `bae68496aabbbdc3dcc6951beec4942908aeaa99133b986f56cddbdd43906e69` |
| `literalfixed-inputs.json` | 13105 | `8d42b4c739aecfb6fa8ab675a06aeba89152cbc51ab2fba70364888edec02bed` |
| `README.md` | 5569 | `1ec5cf0a6ccf73603ad00e4dc5fb6151efb57cb994fc56c11a343db685c81fd2` |

MTS 从指定基线复制。基线到新文件的逐行逆差为 10 行删除、10 行新增，总行数均为 4671；差值全部落在四个 `APPROVED_RUNTIME_PINS` 对象行的 8 个标量行及两处 `agent.js` / `host.js` 绝对编译导入。旧构建路径计数 0，新构建路径计数 6。`TASK_NAME`、`REVIEW_ID`、`SKILL`、公开任务输入读取、B 服务 setup、固定输入、参数、工具预算、模型请求、断言、JSONL 关闭/重开与 finally 均未改。

`b-service-navigation.py` 与基线大小、SHA-256 及字节数组均完全相同。`literalfixed-inputs.json` 与批准蓝图逐行比较只有 `consumer`、`bService` 两个占位行的 4 个 bytes/SHA 标量变化。

## 新运行时固定值

四个对象行及两处导入均指向：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TaskSkillPrivateBuild-20261030-023904\private-output-20261030-024244\profile-node_modules\lawbench-dsh\`

| 角色 | Bytes | SHA-256 |
|---|---:|---|
| `current-compiled-agent` | 557970 | `0c403eacf1552a7fce0f628ca10044dc29fec9517394313fd4a809860f5da16d` |
| `current-compiled-host` | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| `current-compiled-package` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| `current-compiled-manifest` | 58197 | `30d4c52a7ee8ae31f1e2dddd03cc9e948fbcdc1c9852d564a9e33d43327932a0` |

输入目录中的 `approved-runtime-four.json` 已存在，本次只读核对上述四项及四个实际文件，结果一致，未改写。

## 输入与静态核对

- `baseline-entry.mts`：176203 bytes，`343470287d428f917b9eca0315da1c3995eb2e1fce17dbcede6b0becbac192af`。
- `baseline-service.py`：58754 bytes，`bae68496aabbbdc3dcc6951beec4942908aeaa99133b986f56cddbdd43906e69`。
- `baseline-manifest.json`：13079 bytes，`25c9d2e41a8b4e99d944f32cefa0d05b68cadd9350073da42b1fed66e2323e7b`。
- 批准蓝图的五个材料、八个原件、29 个依赖、source pins 53548 bytes / `5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`、三个运行时可执行文件均原样沿用。

## 命令、阻碍与未运行

交回文件写入前共执行 21 条 shell 命令：20 条退出 0，1 条退出 1。全部显式使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe` 且 `login=false`，未使用 Bash、cmd 或 legacy setup。

实际只读命令包括 `Get-Content`、`Get-Item`、`Get-FileHash -Algorithm SHA256`、`Test-Path`、`Select-String`、`Compare-Object`、`Get-ChildItem`、`git status --short --ignore-submodules=all`，以及 `[System.IO.File]::ReadAllBytes` 配合 LINQ `SequenceEqual`。写入仅为 `New-Item`、`Copy-Item` 和 `apply_patch`。

退出 1 的命令是普通只读 `git status --short`：共享 worktree 的只读 `dsh` 子模块目录返回权限拒绝。按要求准确记录，未修 index lock、权限、ACL 或审批，未拆 writer 锁；改用 `--ignore-submodules=all` 后成功取得主仓既有脏项。一次 PowerShell 对字节数组直接调用不存在的 `SequenceEqual` 方法产生运行时错误，但该命令退出 0 且未写文件；改用 LINQ 后确认 `BYTE_EXACT=True`。

Node、Python、ESM、AST/parser、import/check、测试、构建、helper、HTTP、产品服务、原生 Session、AgentLoop、模型、GUI、EnvKey、DPAPI、SSH 和进程探针调用均为 0。没有 `run-*`，没有模型或原生 turn、业务/法律 PASS，也没有 JSONL close/reopen。

## Root 后续

root 仍需先执行完整 whole-byte inverse 和独立检查（包括 new 517 pins、459A index 的显式 `d76 → e787`、current private 25 + B346 + legacy18），再以同一 canonical actual workflow 执行一次 fresh 运行并将结果以 DPAPI 保护保存。来源证据不复用，本次静态身份核对不替代 root 的实际运行与业务判读。

未联系其他聊天，未更换 API，未更改沙箱或审批。作者在写入本交回件后停止。
