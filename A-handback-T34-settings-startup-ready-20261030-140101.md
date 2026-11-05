# A 线 T34 设置启动就绪交回

## 结论

源码最小修改和聚焦测试已落盘，等待主编排只读复核后决定定点类型检查与单测。本次没有运行任何源码、测试、解析器、检查器、构建或真实服务，结论是 `SOURCE ONLY / NOT RUN`，不是项目 `PASS`。

- 输入源起始状态与批准输入一致：61,281 字节，SHA-256 `DA96A5E012B746DA5204210188BF8F331BB1049E7436EDFB859E162E0B18806F`。
- 当前源：63,665 字节，SHA-256 `CB3679AE85EA6B4F56406B5CBB1E01C1FE0E4739BB22D0CCF05CD4C7AC8FBF83`。
- 新测试：9,587 字节、238 行，SHA-256 `651E130F2520A1459AF31296AC7BB0A7C9CCAFEC0C13CE51E9DDEAD77E676124`。
- Git 提交 SHA：无。正式令禁止 Git 写入，交回以本文件为准。
- 运行时：0。测试：`NOT RUN`。

## 实际改动

只改了以下源码，并新建一个测试文件。

- `D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts:692`：私有 `api` 增加可选 `AbortSignal` 入口。
- `D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts:696`：有信号时使用调用方总信号；其他调用仍使用原有 `AbortSignal.timeout(30_000)`。
- `D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts:756-798`：新增私有 `waitForSettingsService`。仅 `starting` 时订阅现有 `supervisor.onState`，订阅后重查当前状态；`running`、终态、取消、超时和同步抛错均单次结算并清理订阅及 abort 监听。
- `D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts:799-818`：`getSettings()` 保持零正式参数。一个 30 秒总信号同时控制就绪等待和随后一次 `GET /api/settings`；使用现有调用信号，取消或终态后不再发起新请求。
- `D:\Lawbeach\lawbench-A\dsh-ext\tests\t34-settings-startup-ready-20261030-140101.spec.ts`：新建纯内存测试，不启动 app、server、socket、模型或真实文件写入；只读现有 `contracts\examples\file_settings.json` 合成设置。

除上述两个产品路径和本交回件外，没有新增或修改文件。工作树已有其他脏改动均保留；只读 `git diff` 显示这些既有改动仍在，不能把本交回误认为完整基线差异。

## 六个测试控制

1. `starting` 等待期间不发请求；转入 `running` 后只发一次 `GET /api/settings`，返回现有合成设置。
2. `running` 立即读取；断言 `getSettings.length === 0` 且方法源码仍为零正式参数。
3. `stopped`、`failed`、`version_mismatch` 立即返回原有不可用文本，不发 HTTP。
4. 调用方在等待前或等待中取消均不发 HTTP；Supervisor 订阅、调用方 abort 监听清空。
5. 验证 30 秒是等待加读取的总预算：等待 29,999 毫秒仍无请求，30,000 毫秒超时；等待 20 秒后进入 `running`，同一信号只剩约 10 秒且不重启、不重试。
6. 覆盖订阅时同步回调和状态重查、订阅同步抛错清理，以及请求已发出后的迟到取消和旧响应；取消后拒绝一次，不产生第二次 HTTP。

## 静态核对

开始修改前，批准输入源哈希与 `approved-inputs.json` 完全一致。修改后以下批准输入仍保持原哈希：

- `dsh-ext\host\supervisor.ts`
- `dsh-ext\tests\host-api.spec.ts`
- `dsh-ext\tests\supervisor.spec.ts`
- `dsh-ext\shared\remote-methods.ts`
- `contracts\api\settings.schema.json`

未改变其他 Remote API、方法表、UI、Agent、TaskState、参数、模型、契约、私有 25 项、组件或 served roots。未访问凭据、`setupState`、`configured` 或 `externalLlmState`。

验证只做 PowerShell 读取、哈希和一次路径限定 `git diff`。没有运行 Node、Python、测试、导入、解析器、AST、检查、构建、准备、应用、GUI、HTTP、模型、SSH、DPAPI 或进程探测。

## 非零结果与偏差

- 初次 `git status --short --branch` 因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而非零退出；未改锁、权限或审批，未尝试 Git 写入。
- 三次只读命令的 shell 字段误设为 `bash`，均在命令执行前被环境以 `BASH/E_ACCESS_DENIED` 拒绝；没有源码或测试被执行。后续命令均使用指定 PowerShell。
- 一次远程方法表哈希核对先用错了一个预期字符串，随即只用正确批准哈希重核，结果为一致；这不是文件变更。
- 没有零新增红、全量回归或项目验收声明。

## 遗留与下一步

测试和类型检查由主编排按正式令执行。若只读复核接受源码，下一步是主编排运行聚焦单测和类型检查；实际原启动流程、必要写入、物理补丁与清理仍只在主编排取得结果后按其单独顺序处理。

含糊点：无。现有私有 `api` 可选信号被正式令明确允许，作为共享总预算的最小接缝。

删减轮: 读者 4 / 槽位 1 / 半句 2 / 重复 2 / 过程 1 / 黑名单 0

Response ID: 当前会话未提供  
Response log path: D:\Lawbeach\lawbench-coord\A-handback-T34-settings-startup-ready-20261030-140101.md
