# T31 真实“刚压缩后新分支”记录消费者

状态：`AUTHORED_NOT_RUN`。作者阶段只做静态核对和文件编写，没有启动 Node、TypeScript、测试、HTTP、模型、GUI 或构建。

## 目的

从已经通过的原始三轮回话开始，不重跑前三轮：

1. 把原始 JSONL 逐字节复制到一个全新的私有持久化根。
2. 用生产 JSONL 后端、生产 Session Store、生产 Agent 控制器恢复父会话。
3. 只调用一次生产 `BasicCompactionEngine.compactNow()`，不伪造压力，不改阈值或 token meter。
4. 只有压缩真实提交并完成刷盘后，才调用一次生产 `SessionCommandController.fork()`。
5. 在子分支上用原第四轮提示的相同字节询问三个合成事实，只产生一次真实模型请求。
6. 关闭资源后重新打开父、子 JSONL，逐事件核对持久化快照。

这不是 GUI 测试，也不判定 T31、五门或项目完成。

## 固定输入

| 项 | 值 |
|---|---|
| 输入区 | `D:\Lawbeach\lawbench-coord\T31GenuineCompactedForkInput-20261028-115217\` |
| 已接受消费者 | `native-real-conversation.mts`，58,057 字节，SHA-256 `80c603f94c42f19ce635d245fc0520559aa9bb72fed55d2ef91685ae4d3c2343` |
| 固定输入清单 | `fixed-inputs.json`，46 项，SHA-256 `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522` |
| 原始父会话 | `session-97c67db2-b8a6-428b-be48-04b4144d10bd`，12,059 字节，27 个原生事件 |
| 原始父会话 SHA-256 | `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee` |
| 合成事实 | `LB-SYN-FORK-27`、`林岚`、`2700` |
| 路由 | `http://10.126.126.1:8000/v1`、`lawbench-6000d`、`qwen38-27b` |
| 摘要与后续请求上限 | `maxTokens=256` |

消费者还会逐文件核对输入区 `extra-source-pins.json` 所列七个固定依赖：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `compaction-basic/src/index.ts` | 20,589 | `4136f3bb98964a0d1546795131da12364ed1e7ecc33b123dfdc860965ddf8a5b` |
| `compaction-basic/src/region.ts` | 23,571 | `295b53cc9e924f7cb2e843e0d0d296e89ead73da2aab9790282db30736e2e063` |
| `compaction-basic/src/summarizer.ts` | 10,107 | `9169a13cac6a168c6e758528524cc913bb04255e2d2f8c13af5c07fe0bf4b64f` |
| `compaction-basic/src/config.ts` | 14,220 | `4972edc6447dcff87eab54c3a9c5984171238aa06aa0eb34ffde4bfac4ce1275` |
| `compaction/src/index.ts` | 8,764 | `1923cc2fd2400184760f321fb7df7a9ffbc6cff200012884dda09632756dc849` |
| `session-controller/src/commands.ts` | 31,548 | `c3ea5af81f21212888364bbd169c9d3d19c93f8720716dfc44ba32c1d164bb2c` |
| `session-controller/src/agent.ts` | 22,822 | `2136af39dc59755f3fc5ef9474ec78ca77576061ea197627f1b664b319a4d769` |

## 写入面

运行时只写一个新的 `run-<随机后缀>\`：

- `sessions\`：原始 JSONL 的精确副本，以及生产恢复、压缩和 fork 新增的事件。
- `report.json`：准入、复制、恢复、压缩、fork、网络、重开与清理的元数据。
- `home`、`appdata`、`localappdata`、`temp`、`dsh-home`、`xdg-config`、`xdg-cache`：隔离的进程目录。

运行时不会改原始会话、已接受消费者、固定输入、产品源码、配置、测试或其他证据。

## 凭据与网络

完整模式只接受 `--credential-stdin`：

- stdin 必须是非 TTY 管道。
- 只接受一条可打印 ASCII 记录，最多 4,096 字节。
- 不读取命令行参数、环境变量、文件、Keyring 或目录配置中的凭据。
- 凭据只为进程内匿名凭据 seam 使用；报告、日志和错误在写出前遮罩并复核。

网络守卫只允许 `http://10.126.126.1:8000/v1/*`，强制禁止重定向，并最多放行两次 POST。预期成功路径恰为：

1. 压缩摘要一次 `POST 200`。
2. 压缩后子分支原第四轮提示一次 `POST 200`。

Provider 路由显式设置 `retryPolicy.mode=normal`、`maxRetries=0`。没有自动重试、备用模型、公开搜索、额外 GPU、395、SSH 或 GUI。

## Root 运行命令

先静态审计本文件、消费者和七个依赖快照。审计通过后，可在精确的交互执行窗口运行无模型预检：

```powershell
Set-Location 'D:\Lawbeach\lawbench-A\dsh'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts' '--preflight-only'
```

完整运行使用同一命令，仅把最后一个参数替换为 `'--credential-stdin'`。由 root 私有的匿名 stdin 槽提供唯一凭据记录；不要在命令、环境变量、文件或本文中写入凭据。

## 判定与停止

只有以下条件全部成立才写 `PASS_OPERATION_ONLY`：

- 复制前后原始文件仍为固定字节和哈希，复制副本初始也逐字节相同。
- 生产持久化读回 27 个原始事件与原文完全相同；恢复后父前缀仍完全相同，新增项只来自生产恢复/压缩/fork。
- `compactNow()` 提交一个同 ID 的 `compaction/start`、`compaction/summary`、checkpoint 替换消息和 `compaction/end`，且摘要是固定 provider/model/256，并在 fork 前刷盘。
- 生产 fork 生成不同真实 UUID，`parentSession`、`isSeeded`、继承前缀和 `session/end-seed` 标记正确。
- 子分支一次真实请求的回答保留三个合成事实，父会话未被 fork 或子轮改写。
- 关闭后重开父、子 JSONL，事件快照与关闭前完全相等。
- 清理、凭据清除、网络恢复和环境恢复全部成功。

若 `compactNow()` 返回 `null`，记录 `STOPPED_NO_USEFUL_RANGE`；若摘要以 `MAX_TOKENS` 失败，记录 `STOPPED_MAX_TOKENS`；若真实摘要不比被压缩内容小，记录 `STOPPED_NO_SHRINK`。这三种情况都保留实际错误原因并停止，不 fork、不发后续请求、不补历史、不增加重试。

进程退出码：操作级通过或无模型预检为 `0`；上述三种真实停止为 `2`；其他失败或清理不完整为 `1`。

## 作者阶段记录

作者未执行消费者或任何测试。作者阶段曾误把六次只读命令的 shell 字段选成 Bash；运行器均在启动前拒绝，没有执行读取或产生证据。另有三次只读调用误用原生 `native-powershell` 路径；命令为只读并正常结束，未改变文件、Git、沙箱或审批状态。此后所有后续执行统一使用指定 `native\powershell\pwsh.exe`；这项偏差应随静态审计交 root 判断。

作者实际做过的只读核对包括：

- 完整读取执行令、两份关键事实索引、第二期 T31 工单、`PROJECT-PROFILE.md`、输入区 `README.md`、`fixed-inputs.json`、`extra-source-pins.json`、已接受消费者、原始 27 事件 JSONL、父/子证明 JSON。
- 用 `Get-FileHash`/`Get-Item` 核对已接受消费者、原始会话、固定清单和七个额外依赖的字节数与 SHA-256。
- 用 `rg --files`、`rg -n`、`Get-Content` 静态读取 compactNow、区间选择、摘要、配置、Session restore/fork、JSONL 读写、Prompt/fork 控制器。
- 用 `rg -c '"group"' fixed-inputs.json` 核对清单为 46 项。
- 用 `git status --short --ignore-submodules=all` 核对新增面；目标目录外无本单新增文件。
- 用指定 pwsh 的 PCRE2 禁项扫描核对无公开 URL、395、旧 TTY 凭据入口、fake Agent/LLM、直接 `compactRegion`/`compactIfNeeded` 或 Git 写命令；零命中。

非零或受阻记录：

- 首次 `git status --short --branch` 退出 1：受限子模块 `dsh` 路径 `cannot chdir ... Permission denied`。按令不修锁、不扩权、不运行 Git 写命令；随后以 `--ignore-submodules=all` 只读核对根仓库 dirty。
- 曾按执行令简称猜读 `run-RTmLl7\child-37-log.txt`，文件不存在并退出 1；随后 `rg --files` 找到实际证明为 `report.json` 和两个原生 JSONL，没有复制、改名或写入该运行目录。
- 一次禁项 `rg` 使用不支持 lookahead 的默认引擎，退出 2；改用 `--pcre2` 后正常执行，零命中。
- 一次限定 `git status` 同时传入仓库外协调目录，Git 退出 1 并提示路径在仓库外；随后只对仓库内目标路径重跑只读状态核对。

本文件不声称 GUI、完整 T31、项目验收或打包通过。
