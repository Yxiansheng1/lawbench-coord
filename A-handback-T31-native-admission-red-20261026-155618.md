# A 交回 — T31 Native Material Admission Red

交回时间：2026-10-26T16:08:47+08:00  
唯一状态：`SOURCE_HANDED_BACK / NOT_RUN`  
产品结论：未修复、未验证、不得计为 T31 通过。

## 1. 交回内容

指定新增测试：

```text
D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-material-admission.client.spec.ts
```

SHA256：

```text
C88A71A8E162A41F9E5AE45608C1EC2FCEA4F00BC0F686F24A77EF487C8B6ABE
```

证据 README：

```text
D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeAdmission-20261026-155618\README.md
```

SHA256：

```text
6637CFEF9FC81A731D7484448CDCE35FFC8AE753D4C3A98C9B7F90A81C516C23
```

本文件与 A-progress 是协调目录交回文件，不是 Git 提交。没有提交 SHA；Git
写入不在本运行器授权内。

## 2. 两个真实红测

测试冻结的边界是：

```text
real beginSubmission -> material prepare fulfilled -> nextPaint pending
-> user cancel/replacement or selection change -> frame released
-> Session.prompt / Host admission
```

用例一：旧材料范围 prepare 成功后，在 nextPaint 等待期间取消旧批，并在同一
会话建立新批；随后放行受控帧。预期当前源码会把旧 R 静默送入 Host。

用例二：旧批 prepare 成功后，在 nextPaint 等待期间改选材料；随后放行受控帧。
预期当前源码会把旧 R 静默送入 Host。

两例都要求：

- 旧 `ConversationController.sendSession()` 必须失败或返回 error；
- 旧 R 不得调用真实 Host `session/prompt`；
- 旧 R 不得进入真实 `ReactLoopInbox.nextTurn`；
- 旧 prepare 必须用同一 R 执行 `requestScope(release)`；
- 显式重试必须重新调用真实 `Session.beginSubmission()`，取得新的 UUIDv4 R；
- 只有重试 R 可被 Host 接纳、queue 和真实 claim 为 `next-turn`；
- `Agent.send()` 一次都不得被调用，任何模型循环尝试都会抛错。

当前 `service.ts` 在 prepare 后没有重新校验材料状态，因此用例的有意义断言应在
旧 R 被接纳处为红。本线未执行，不能把“预期红”写成实际运行结果。

## 3. 依赖与真实桥

复用既有依赖，没有安装、升级、生成 alias/loader 或新增框架：

- `@deepseek-ai/cordis`
- `@deepseek-ai/dsh-agent`
- `@deepseek-ai/dsh-remote-mock`
- `@deepseek-ai/dsh-session`
- `@deepseek-ai/dsh-session-projection`
- `@deepseek-ai/dsh-client-test-runtime`
- 现有 `sessionBench()` / `ClientRoster` / `createClientTest`
- 现有真实 `SessionCommandController`、`ReactLoopInbox`、Host Agent shell
- 当前 `ConversationController`
- 当前 `makeMaterialSubmissionHook` / 材料批次函数

真实部分：

- 原生 `Session.beginSubmission()` 生成 R；测试只使用默认透传 `vi.spyOn`；
- Session Remote prompt 经过内存真实 Gateway mock；
- Host 真实 `SessionCommandController.prompt()` 生成消息并进入真实
  `ReactLoopInbox`；
- 最终 queue 通过真实 claim 与 `agent/inbox/claimed` 观察。

不存在的假件：

- 不替换 `beginSubmission`，不伪造 HostR、attempt、history 或 rollout；
- 不构造消息 source/metadata；
- 不启动模型、HTTP、默认 app lifespan、OCR、Office、Keyring 或真实材料；
- 不使用真实 `File` 路径或 `pathFor`。

唯一合成件是测试局部 `materialsList` / `requestScope` 契约 responder，返回虚构
材料及 `prepare` / `release` 结果。它不代表真实材料服务或后端已通过。

受控 `requestAnimationFrame` 截停生产 `nextPaint`；fake timers 同时冻结 100 ms
兜底。每个用例 `finally` 放行 pending 帧、settle send、执行未完成 R 的失败
清理、dispose Host Context 与 Controller fiber、恢复全局帧/API/app 状态。
client fixture 继续由既有设施自动 dispose。

## 4. 验证状态

本线 `NOT_RUN`。没有执行 Python、Node、Vitest、Vitest collect/list、tsc、
lint/parser/AST、pytest、build、prepare、serve、probe、HTTP、GUI、OCR、
Office、Keyring、模型或自检。测试是否可编译、是否按预期红均待 root 独立执行。

root 唯一建议的既有选择命令，工作目录
`D:\Lawbeach\lawbench-A\dsh`：

```powershell
E:\node\node.exe node_modules\vitest\vitest.mjs run --config vitest.config.ts packages\api\session-controller\tests\t31-material-admission.client.spec.ts --project thread-safe --maxWorkers=1 --no-file-parallelism --cache=false
```

预期首轮：两个用例都在旧 R 不得 Host prompt/queue、旧 R 释放或重试新 R 的有
意义断言处红。若在 import、fixture、语法或缺失依赖处失败，不得称为产品红；
由 root 把准确失败交回，本线仅据实际新夹具失败作有界修复。

## 5. 基线与写入边界

仅写入执行令列出的四个路径。产品源码、旧测试、配置、schema、alias、loader、
fixture、P29、构建产物和 B 侧文件均未修改。

8 个 `source-before.json` 文件的当前 SHA256 与基线逐项一致：

```text
6EDAC6FCE7E9E1DD6A9B41F53D8DA9982F965402AF2ED8755594D6F4065D8343  t31-native-request-identity.client.spec.ts
BBC1D4F53710FD60AEEB73723F0C7C1E5F80FBC8612FAA8A1CA6F9EB45AF6DEC  remote/bench.client.ts
C1F3B208106E714FD238248689A3B2AAB11EEE7710115BFFE18686A9D5606579  service-orchestration.client.spec.ts
CED6F86AFDE441A996B8CA8C1E2594C9E934BB2549239AF67336853960171825  client/service.ts
507260418C1D9666756FA43839BF15489D1114C0EA8DA850F2BE0869459538F5  client/sessions/session.ts
0EC066A40E71B2ADA35B6C3FBDE40A84B7506457BCBBF282A15A62193ACEF87E  commands.ts
38328DC0B4B1A568772729E5310677657E48247C1713D65F0CDE6028FEA4CD01  ui/material-batch.ts
29ED5D6D556C7BBC810C7E57E658E6ABFC666862AEBC60B4977EBE26EFA7C653  tests/material-batch-races.spec.tsx
```

## 6. 实际命令与阻碍

exec 仅用于只读核对：

```powershell
Get-Content -Raw / Get-Content line slices
Get-ChildItem -Recurse
Select-String
rg -n
Test-Path
Get-FileHash -Algorithm SHA256
Get-Date
git status --short --branch
```

以及证据目录创建：

```powershell
New-Item -ItemType Directory -Force -Path 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeAdmission-20261026-155618'
```

所有源码/证据文件内容通过 `apply_patch` 写入。没有其他写命令。

非零/异常：

1. `git status --short --branch` 退出 1。原因是
   `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 的
   `.git` 元数据权限拒绝。按令未修复、未扩权、未改锁、未执行任何 Git 写。
2. 第一次建证据目录使用 `New-Item -LiteralPath`，当前 PowerShell 报参数不存在；
   未创建目录、未写文件。随后用 `-Path` 精确重做并验证存在。
3. 操作偏差：有三次 exec 误填 `shell=bash`（分别用于读取 `format.ts`、搜索
   `ConversationController`、搜索 `scheduleFrame`）。三次都被原生运行器以
   `Bash/E_ACCESSDENIED` 在命令启动前拒绝，没有执行命令或改变文件。其余源码
   读取和哈希命令均显式使用指定绝对 `pwsh.exe`、`login=false`。
4. 一次并行批次中的 `Get-Content` 被底层解释为不支持该 cmdlet 的 shell 并失败；
   随后以指定绝对 pwsh 单独重读成功。未使用失败结果。
5. 若干 `rg` 无匹配按工具约定退出 1；没有文件写入。

未请求审批、未改沙箱/ACL/权限、未拆 writer lock、未使用网络、未联系其他聊天、
未更换 API。PID 身份和 writer 身份均按执行令处理。

## 7. 遗留

- 当前产品仍缺 prepare 后、prompt 前的取消/改选复验与同 R 释放接线；
- 新测试及所要求的 fresh-R 重试路径完全未运行；
- `QueuedR2 -> steer -> R1` 是另一个开放边界，本单未合并、未声称修复；
- GUI、真实材料 HTTP、真实模型与完整 T31 均未验证；
- 本交回完成即停止，不扩到产品修复或旧用例重跑。
