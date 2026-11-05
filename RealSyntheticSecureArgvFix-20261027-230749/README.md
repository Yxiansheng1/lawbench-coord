# T32 真实合成识别 — 私有业务 Key 输入启动器

状态：**AUTHORED_NOT_RUN**。本文件与 `launch.ps1` 只由作者编写；作者没有运行
PowerShell parser、脚本、`Read-Host`、consumer、Python、Node、HTTP、模型、测试、
构建、GUI 或自检。下面是 Root 审读后使用的契约，不是已验证结果。

## 用途与硬边界

这是一个只服务于固定 B consumer 路径的私有、交互式 PowerShell 启动器，不是通用
凭据代理、Key 存储、服务、命名管道或可复用框架。固定路径如下：

- PowerShell：`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
- Python：`C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe`
- consumer：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\consumer.py`

脚本没有任意程序、consumer 或命令开关。它只接受 `-Parent` 和
`-ConsumerSha256`。`-ConsumerSha256` 必须是 Root 审读 B 交付后给出的 64 位十六进
制固定值；脚本以 `Get-FileHash` 计算文件哈希并逐字比较，不会把自己的动态哈希回填
成“已接受 pin”。

`-Parent` 必须是绝对路径、位于本目录下的 `runs\` 子目录中，并且开始时不存在或是
空目录。脚本只创建缺失的目录和产物，不覆盖、清空、递归清理或删除任何内容。三个
独立子根固定为 `<Parent>\ocr`、`<Parent>\refine`、`<Parent>\cancel`；启用后每个
子根必须尚不存在，由对应 consumer 进程创建。

## 当前前置条件

当前 B consumer 草稿只接收位置 phase 和 `--phase`，**尚未实现 `--key-stdin`**。
Root 在 B 交回并完成最小 stdin 适配后，必须重新审读 consumer，确定新的固定哈希，
并先审计本脚本全文和全部命令，之后才可在可见控制台启动。未完成该前置条件时，
本启动器契约不可执行，状态仍为 `AUTHORED_NOT_RUN`。

Root 预期使用的完整命令形状如下，其中尖括号内容必须替换为 Root 选定的字面值：

```powershell
& 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe' -NoProfile -File 'D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\launch.ps1' -Parent 'D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\runs\root-<UTC>' -ConsumerSha256 '<ROOT_ACCEPTED_64_HEX_SHA256>'
```

以上命令未由作者执行，也没有任何退出码被观察。`root-<UTC>` 必须换成 Root 自己
创建并持有的独立空运行名；不要指向已有目录。

## 用户输入与生命周期

1. 脚本先完成静止检查：绝对路径、owned `runs\` 范围、普通文件和非重解析点目录
   链、Parent 新鲜度、三个 phase 子根不存在、consumer 哈希格式与内容相等。
2. 全部静止检查通过后，控制台标题设为精确值
   `Lawbench Synthetic Test - Private Key Input`。
3. 仅此时调用一次 `Read-Host -AsSecureString`，提示用户亲手输入
   `BUSINESS TEST KEY ONLY`。脚本不接受命令行、环境变量、文件、剪贴板、`.env`、
   Keyring、注册表、配置或 DPAPI 中的 Key。
4. 用户输入后，脚本在本次私有进程内存中短暂取得明文，检查非空、可打印 ASCII、
   无换行和控制字符、长度不超过 4096。该检查不显示 Key、前缀、后缀、长度或哈希。
5. 按 `ocr`、`refine`、`cancel` 顺序，为每个 phase 启动一个独立 Python 子进程。
   每个子进程收到自己的尚不存在子根；Key 仅通过一次 stdin 行写入，随后立即关闭
   stdin。Key 不出现在参数、环境、命令摘要或文件里。
6. 进程使用 `ProcessStartInfo.ArgumentList`，参数依次为 `-B`、`-X`、`utf8`、固定
   consumer、`--parent`、phase 子根、位置 phase、`--phase`、phase、`--key-stdin`。
   `UseShellExecute=false`，不经过 shell 插值，不弹子窗口。
7. stdout 和 stderr 的异步读取在 `WaitForExit` 前已启动。没有由本启动器设置的强制
   终止期限；产品自身的 1200 秒请求边界保持不变。
8. stdout 和 stderr 在进入控制台或文件之前，都用当前 Key 做精确字面替换
   `[REDACTED]`。保存内容及 `launch-summary.json` 不含 Key、Key 哈希、前缀、后缀
   或长度。汇总只记录时间、阶段、进程元数据、实际退出码、状态、redaction 标志和
   `credential_source=user_secure_console_stdin`。

## 退出码与停止规则

以下规则是设计契约，均未经作者运行验证：

| consumer 实际退出码 | 处理 |
|---|---|
| `0` | 记录 `EXIT_0`，继续下一独立 phase。 |
| `2` | 记录 `EXIT_2_ASSERTION`，继续下一独立 phase；整体最终非零。 |
| `3` | 记录 `EXIT_3_AUTH_BLOCKED`，立即停止，不重试 Key，不运行剩余 phase。 |
| `4` | 记录 `EXIT_4_SETUP_ERROR`，停止；剩余 phase 标为未运行。 |
| `5` | 记录 `EXIT_5_NOT_EXERCISED`，继续下一独立 phase；整体最终非零。 |
| `6` 或其他非零 | 记录原始码，停止；剩余 phase 标为未运行。 |

父启动器不会把退出码改写成统一“PASS”。任一所运行 phase 失败，整体退出码非零。
本地父进程只能观察和记录本地子进程；它不声称远端模型服务或服务端取消动作已停止。
启动器自身也不发起 HTTP、模型、服务、GUI、Office 或网络操作。

## 产物

Root 审计并启动后，预期产物为：

- `<Parent>\launch-summary.json`
- `<Parent>\ocr.stdout.txt`、`<Parent>\ocr.stderr.txt`
- `<Parent>\refine.stdout.txt`、`<Parent>\refine.stderr.txt`
- `<Parent>\cancel.stdout.txt`、`<Parent>\cancel.stderr.txt`
- consumer 自行写入的 `<Parent>\<phase>\result.json`、`summary.json`、
  `metadata.json` 等结果文件

所有运行结果原样保留，不清理、不删除。Root 应在认可结果安全性和无 Key 泄漏后，
分别审计每个 phase 产物；整体状态文件不能替代这些 phase 结果。

## 安全与清理限制

`finally` 会调用 `Marshal.ZeroFreeBSTR`、`SecureString.Dispose`，并把 Key 相关变量
置空。这是降低驻留时间的最佳努力，**不是**托管堆、分页文件、崩溃转储、调试器、
进程转储或取证层面的内存清零保证。该启动器也不改变全局 Key 生命周期，不安装
持久凭据，不替代 B consumer 对 stdin Key 的处理责任。

## 作者验证声明

- 实际结果：**NOT_RUN**。
- 已做：只读核对正式执行令、`targets.json`、既有 consumer 草稿和 Git dirty 状态；
  按获准范围编写本 README 与 `launch.ps1`。
- 未做：未静态解析、未执行、未读取 Key、未调用模型或网络、未运行测试或构建。
- Git 写入：未执行 `add`、`commit`、`rebase`、`checkout`、`stash`、`reset`、
  `merge` 或 `push`。本次交回是协调目录文件，不是 Git 提交。
- 已知阻碍：普通 `git status --short --branch` 因受限的 `dsh` 子模块读权限失败；
  改用 `--ignore-submodules=all` 只读核对到既有 dirty 内容，未尝试修锁、扩权、
  改 ACL 或改动其他 writer 的产物。
