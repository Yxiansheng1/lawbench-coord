# B T23 genuine-plan build handback

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

执行令：

`D:\Lawbeach\lawbench-coord\B-T23-genuine-plan-build-order-20261030-011948.md`

## 交回内容

唯一新增证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948`

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `genuine-plan-build.py` | 75121 | `b6f44f6e98859de1769c20b6454d7afa95f992c55e786efdd384dc66d76c0740` |
| `literal-inputs.json` | 13920 | `faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e` |
| `README.md` | 5021 | `a017d1616027d8f3a75a5e8e4cf4b166f9418b54bde2c8894abc81ea7d2d5412` |

`literal-inputs.json` 与批准快照逐字节相同。证据目录中没有
`root-run-report.json`、`run-*` 或 `lb-t23-*`，作者未产生归档运行件。

## 作者侧只读核验

按 `literal-inputs.json` 逐项只读核对：

- 30 个源文件：bytes、SHA-256、mtime_ns 均匹配，mismatch 0。
- 13 个批准资源：bytes、SHA-256、mtime_ns 均匹配，mismatch 0。
- `soffice.exe` 与 `soffice.bin`：bytes、SHA-256 均匹配，mismatch 0。
- Approved descriptor：13920 bytes，
  `faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e`。
- B source-pin manifest：53548 bytes，
  `5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`，
  346 entries；helper 会在实际运行前后再次核对该清单。

当前既有关键源码与批准清单一致，故 helper 复用现状接口，没有修改产品、
测试、SDK、runtime、Skill、contracts、默认库、构建产物或旧 evidence。

## Root 执行入口

在 Root 完成整份 helper、命令、typed API、setup/cleanup、346+13 resources、
30 case files 和两个二进制核验后，只运行一次：

```powershell
$t23Root = Join-Path $env:TEMP ('lb-t23-' + ([guid]::NewGuid().ToString('N').Substring(0, 8)))
$t23Python = 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe'
$t23Helper = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948\genuine-plan-build.py'
$t23Report = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948\root-run-report.json'
& $t23Python $t23Helper --root $t23Root --report $t23Report
$LASTEXITCODE
```

helper 的行为边界：

- 只复制批准清单中的 30 个既有文件，保留原 `case_id`、`task_id`、
  session/request ID 和真实持久化 13-field plan。
- 使用当前 B `create_app(...)`，私有无钥匙设置，只把 `converter` 改为
  `libreoffice`，注入实际 `OfficeConverter` 和指定 `soffice.exe`。
- 使用 `httpx.ASGITransport`，lifespan 不启动，无 TCP listener；只调用
  `POST /api/case/open` 与一次 `POST /api/archive/build`。
- 拒绝所有模型 Key、外部 Key、出站 HTTP 和 Python socket/TLS 操作；
  retainer 为未启动 sentinel。
- 保留两条原始 request/response；核验实际 page ranges、连续页码、PDF 内容、
  invoice/volume 一致性、generated item 15 一次、DOCX 计划字段与占位符、
  临时模板/手签警告、md/docx-only outputs index。
- 保留复制案件和生成成果供复核；只清理新运行根拥有的 temp/profile/home
  路径。不删真实数据，不 broad kill，不改全局防火墙/代理/打印机。

## Git 与现场事实

- 分支：`line-B`；只读 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`。
- 执行令覆盖旧项目提交要求，本次未执行 add/commit/rebase/stash/reset/clean/
  checkout/push；没有暂存、提交或修改 `.git`。
- 工作树原有大量 dirty；均原样保留。T23 定向 status 只显示本证据目录 3 个
  新文件。
- 首次普通 `git status --short --branch` 退出 1：只读子模块 `dsh` 权限拒绝。
  未修权限/index.lock/ACL/审批，改用 `--ignore-submodules=all` 只读获取状态；
  后续 status 有多个历史超长路径 warning，但 T23 定向结果可读。

## 运行偏差与阻碍

- 作者未运行 Python、AST/parser/import、check/test/build、HTTP、模型、GUI、
  SSH、EnvKey、DPAPI 或进程探针；没有 T23 实际生成、业务或法律 PASS 声明。
- 第一个工具按要求以完整指定 PowerShell 路径、`login=false` 只读执行令；
  后续少数只读命令及一次 `Copy-Item` 的 `shell` 参数写成了
  `pwsh.exe`/`pwsh`，不是每一条都重复完整绝对路径。实际均为本机 PowerShell，
  未使用 Bash/cmd，也没有改变产物内容；但这是一项执行形式偏差，Root 应据实
  判定是否仍接受本次作者交回。
- 两次只读 PowerShell 汇总命令因 `foreach` 后直接管道语法错误退出 1，均未写入；
  改用结果数组后成功。
- 未更换 API、未联系其他聊天、未启动 setup/legacy、未改沙箱/审批/ACL、
  未拆 writer 锁、未做进程探针。

## 未证明事项

本交回只交 Root 可审的源码、批准输入的精确副本和执行边界。没有证明实际
归档成功、PDF 视觉质量、真实律师确认、法律正确性或完整 OS 清理。实际生成及
其报告必须由 Root 后续单独执行和判读。
