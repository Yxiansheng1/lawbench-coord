# T31 原生真实对话 preflight/fixed-input 修订说明

状态：`AUTHORED_NOT_RUN`。作者阶段没有运行 Node、tsx、TypeScript、解析器、tsc、Vitest、产品导入、HTTP、模型、GUI 或构建，也没有读取 Key。

## before 与当前差异

修订前消费器为 39,711 字节，SHA-256 为 `24d9458aa87f07f35bf9c7851bc0104e01be4b05372d12a66b0df5c4ecccc8c73`。旧 README 仍为 6,259 字节，SHA-256 为 `5e9537aef53e9471e8ff277ab261f2bb0fa9db3eea77fba04a1444746f7f514d`，本阶段按令未改。

协调输入 `NativeRealPreflightAmendInput-20261028-004315` 实际是目录，含旧消费器、旧 README、旧交回件和 dirty 清单四份文件。执行令未写扩展名；一次按 `.md` 文件读取因此返回不存在，随后改读目录。

工作树在开工前已有大量 dirty/untracked。它们全部保留，没有执行 add、commit、rebase、stash、reset、clean、checkout 或 push。普通 `git status --short --branch` 因共享 worktree 的 `dsh` 子模块目录权限拒绝而失败；改用 `--ignore-submodules=all` 后只读核对了主工作树状态，没有修权限、锁、ACL 或审批。

root 在先前的独立导入 preflight 中实际加载了同一消费器的全部 16 个生产目标模块：denied 0、natural exit、约 8.171 秒、Key 读取 0、模型请求 0、Context/Session 创建 0，且原六项 pin 匹配。该证据只解决模块导入不确定性，不证明 Agent 组装、普通真实轮次、fork 或模型回答；其进程出生时刻也明确未由操作系统捕获。

## 当前固定输入门

新 `fixed-inputs.json` 共 46 行、14,284 字节，SHA-256 为 `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522`。消费器源码内含这一独立字面量，并在读取 Key、加载产品模块之前和最终 PASS/`CLEARSETUP_ONLY` 之前各重算一次：

- 原始六项 6/6，路径、字节和 SHA-256 从修订前快照逐项复制；快照路径也保留为元数据。
- 实际动态导入的显式运行时模块 16/16，路径按当前消费器调用逐项固化。
- Node 可执行文件与 tsx `cli.mjs`。
- `dsh/package.json`、`tsconfig.json` 和被其继承的 `tsconfig.base.json`。
- `llm-pi-ai` 的 package、入口、adapter、auth、config、provider、models。
- 已安装 `@earendil-works/pi-ai` 的 package、入口、模型、provider catalog、OpenAI-completions lazy/实现和 retry。
- 已安装 `openai` 的 package、ESM 入口、client、headers、流实现和实际取全局 fetch 的 `internal/shims.mjs`。

清单是固定准入数据，不是动态白名单；消费器不按“当前文件现算值”自动接受变化。源码文件不能自钉自身哈希，最终消费器 SHA-256 由 root 独立计算和审阅。

## 两种运行方式

预检命令：

```powershell
Set-Location 'D:\Lawbeach\lawbench-A\dsh'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts' --preflight-only
```

预检先校验固定输入，再安装闭合网络守卫、隔离私有 HOME/TEMP/DSH_HOME、加载同一生产装配、创建生产 Session/Agent 和 Browser Session，然后关闭并核对清理。它不读 Key、不提交提示、不制造事件，网络闭锁若被触达会计数并失败；成功状态只能是 `CLEARSETUP_ONLY`，不是四轮对话 `PASS`。若生产 Agent 创建阶段要求凭据，预检在 Key 输入前失败并保留安全错误，不注入假 Key。

完整命令为同一条命令去掉末尾 `--preflight-only`。完整模式复用同一装配；只有组装和源 Session 创建完成后才进入交互式 TTY 读 Key，读取后再开放模型网络。四段提示、生产 R、生产 fork、原生事件断言、逐事件继承和 JSONL 重开比较均保留。每轮单独记录实际模型 POST 数及 HTTP 200 数；总量也按实际 POST/200 统计，因此生产重试可产生多于四次的尝试，不伪造固定四次。

TTY 凭据只接受一条非空、可打印 ASCII、最多 4,096 字节的记录。控制字符、超长或非 ASCII 输入在不回显内容、前缀、哈希、长度或原始异常的情况下拒绝；各结束路径都尝试恢复 stdin raw mode。不会创建环境变量、CLI、文件、IPC 或凭据服务回退。`LAWBENCH_6000D_KEY` 仍只是进程内逻辑 credential ref，不是进程环境变量。

## 状态边界

- `status: CLEARSETUP_ONLY` 只表示固定输入门、同一生产装配、生产 Session/Agent 创建、闭合网络及清理成功。
- `status: PASS` 只属于完整模式，且必须满足原来的四轮断言、模型 POST HTTP 200、fork 继承、源不变、JSONL 重开一致、运行时 pin 未变和清理成功。
- root 的旧 16 模块导入证明不等于上述任一真实对话状态。
- `process.startedAtUtc` 继续由 `Date.now() - process.uptime()` 估算，是近似进程出生时间，不是操作系统 exe birth time；root 应独立捕获 OS 身份。
- stdout/stderr 遮蔽只是已安装的精确字符串处理，不宣称通用取证防漏或内存擦除。

## 被本说明覆盖的旧 README 部分

旧 README 的固定输入段只列六项，已由本文件固定输入门补充；旧“Root 启动”只有完整命令，且旧流程在导入/装配前读 Key，现由两种命令替代；旧凭据段的 TTY 约束和“模型调用前安装网络守卫”描述已由 ASCII/字节上限、Key-ready 前闭合及退出恢复替代；旧“判定”只写 PASS，`CLEARSETUP_ONLY` 的独立含义见上。旧 README 本身按执行令冻结，不由本阶段改写。

## 作者静态核对

作者只用 PowerShell 读取文件、目录和哈希，并静态查看文本与 JSON。清单 46/46 行的当前字节和 SHA-256 曾逐项重算一致；原六项 6/6、显式模块 16/16。消费器当前为 51,654 字节、1,452 行，SHA-256 为 `efb4c295f081c03bd39b396012c812c2810e15c69336d0cc23c0b41b81c0ef65`。这只是作者侧静态事实，不代替 root 的独立重算、源码审阅或真实运行。
