# A 交回 · T31 真实刚压缩后分支消费者

状态：`AUTHORED_NOT_RUN`。作者运行时为 0；没有执行 Node、TypeScript、测试、HTTP、模型、GUI 或构建。本件只交 root 静态审计和有限实跑。

## 新增交付

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\GenuineCompactedFork-20261028-115217\native-genuine-compacted-fork.mts` | 72,524 | `72130abd6e6e71d87fc56e17db262d75c693d36cbc5716336ff9cbfefa7c3aff` |
| 同目录 `README.md` | 8,237 | `c3bcff23e79cb40cb7ec1693e7694464c64bf61366365c5e812e3eeef6874e6e3` |

消费者复用已接受 `80c603…2343` 的真实会话装配、网络守卫、stdin 凭据和清理结构，并新增：

- 生产 JSONL 精确复制、`open(write)` 恢复和生产 Agent 恢复。
- 仅一次公开 `BasicCompactionEngine.compactNow()`；`auto:false`、摘要 provider/model 固定、`maxTokens=256`、Provider `maxRetries=0`。
- 压缩刷盘后从持久化重读并与内存快照等值，才调用一次生产 fork。
- 原第四轮提示只发一次，断言三个合成事实、父会话不变、父子重开一致。
- 无可用区间、`MAX_TOKENS`、摘要不缩小三条停止路径均保留实际 cause，且不 fork、不发后续轮。

## 既有状态与身份

- 已接受消费者：58,057 字节，`80c603f94c42f19ce635d245fc0520559aa9bb72fed55d2ef91685ae4d3c2343`，未变。
- 固定清单：46 项、14,284 字节，`ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522`，未变。
- 原始父会话：12,059 字节、27 个原生活动，`e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee`，未变。
- 七个 compression/session-controller 依赖现场哈希与输入区 `extra-source-pins.json` 全部相等，未改。
- 根仓库原有 dirty 未清理、未 stage、未 commit；本单在仓库内只新增 `GenuineCompactedFork-20261028-115217\`。

## 作者静态核对

- 完整读取执行令、关键事实索引、T31 工单、`PROJECT-PROFILE.md`、输入 README、固定清单、已接受消费者、原始 JSONL 与父/子证明。
- 静态审计 `compactNow`、区间选择、摘要、配置、Session restore/fork、JSONL 读刷写、prompt/fork 控制器。
- 指定 pwsh 的禁项 PCRE2 扫描零命中：无公开外连/395、旧 TTY 凭据、fake Agent/LLM、直接 `compactRegion`/`compactIfNeeded`、Git 写命令。
- 未调用任何代码解析器；未读 `.env.local`、Key、密码、SSH 或真实案卷。

## 阻碍与偏差

- 首次 `git status --short --branch` 退出 1：受限子模块 `dsh` 路径 `cannot chdir ... Permission denied`。按要求未修锁、未扩权；随后用 `--ignore-submodules=all` 只读核对根仓库。
- 猜读令中简称 `child-37-log.txt` 时退出 1，文件不存在；实际证据由 `report.json` 和两个原生 JSONL 构成，未改旧证据。
- 一次 `rg` 未开 PCRE2 而因 lookahead 退出 2；随后用 `--pcre2` 完成，零命中。
- 一次限定 `git status` 同时传入仓库外协调目录，Git 因路径在仓库外退出 1；随后只对仓库内目标路径重跑。
- 作者误把六次只读命令的 shell 字段选成 Bash；运行器均在启动前拒绝，未执行。另三次只读调用误用 `native-powershell` 路径且正常结束；未改文件、Git、锁、审批、沙箱或 ACL。

## Root 下一步

先静态审计消费者、README、原始 27 事件和七个依赖。通过后可按 README 的原生 pwsh 命令先跑无模型预检，再由 root 私有的匿名 stdin 槽以 `--credential-stdin` 跑一次。成功应为两次 `POST 200`；三条规定停止以退出码 2 结束；其他失败为 1。

T30 的 OS 回收证明未处理，GUI、完整 T31、五门、项目验收和打包均未声称通过。
