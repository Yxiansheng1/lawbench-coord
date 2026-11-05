# B线正式交回：FullRegression Safety Runner 源级窄修

交回对象：GPT Root / 主编排

执行线：B（deepseek-v4.1-flash-1017 / max）

任务入口：
`D:\Lawbeach\lawbench-coord\ORCH-B-FullRegressionSafetyFix-20261031-131835.md`

状态：三项指定 PRE-RUNTIME 源问题已按源码窄修完成；B 未执行该源码，未运行任何测试、采集、导入或源码自检，不声称运行时通过或 full-service PASS。

## 产物

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\SafetyRunnerFix-20261031-131835\bootstrap.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\SafetyRunnerFix-20261031-131835\README.md`

基线：
`D:\Lawbeach\lawbench-coord\FullRegressionSafetyFixInput-20261031-131835\bootstrap.py`
及其同目录 `README.md`。输入目录与原有 `SafetyRunner-20261031-130847` 目录、快照、旧 raw/formal 错误和历史均未修改。

## 精确改动

1. `_private_environment`

   删除唯一一行 `"TOKENIZERS_PARALLELISM": "false"`。未放宽 `_environment_has_prohibited_values` 的 `TOKEN` 匹配，未白名单化任何 secret-like 环境变量名。

2. `_install_fs_guard`

   新增 `_is_exact_os_null_device(path)`：Windows 只接受无路径分隔符、ASCII、整串大小写不敏感的 `os.devnull`（裸 `NUL`）；其他平台只接受整串 `os.devnull`。带后缀、路径、UNC/设备命名空间、其他设备名或包含 `nul` 的真实文件名均不放行。

   在 `open` 审计事件、`guarded_open`、`guarded_close`、`check_write_fd`、`guarded_dup`、`guarded_dup2` 中加入该精确空设备例外和 fd 跟踪。空设备 FD 不以私有根文件身份解析或记录；普通路径仍必须严格位于私有根下。未增加捕获参数、pytest 行为或测试断言改动。

3. `_install_process_guard.authorize_system_tool` 的 `taskkill.exe` 分支

   将原先无法成立的四元素 set 相等判断替换为：

   - 恰有四个参数；
   - `/t`、`/f`、`/pid` 各恰出现一次，重复、缺失和额外参数拒绝；
   - `/pid` 后必须立即有一个 ASCII 十进制正整数；
   - 超长数字等无法安全转换的值按 `taskkill_pid` 拒绝。

   原有 `program.parent == System32`、`owned` 表查找及 `proc.poll()` 活进程检查保持不变。没有放行全局或非自有进程终止。

上述三个块之外，`bootstrap.py` 的源码由基线机械复制后仅做这些定点替换，未重构、重排或格式化。没有修改函数白名单、网络、Keyring、subprocess 其他允许项、预算、原 T37 precollection ignore、失败/JUnit 保留、summary、清理或源码 immutability 约束。

## README 更新

只更新了新产物路径、三处 source-only 修正说明和相应已知边界。保留原有安全契约、受限能力和不支持面的说明；明确 B 未运行、未自检，需 Root 独立复核与隔离控制后才能服务测试。

## 未触碰范围

- 无产品、测试、`conftest.py`、SDK、契约、文档 HTML 或旧证据改动。
- 未执行 Git 读取或写入；未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未接触 writer 锁、ACL、沙箱或审批配置；未启动 setup、服务、GUI、HTTP、模型或凭据流程。
- 未执行 Python、Bash、cmd、pytest、collection、AST/parser、import、assert/check 或任何源码验证命令。
- 未联系其他聊天，未创建子代理，未更换模型或 API。

## 待 Root 处置

Root 仍需按原令独立审阅完整 inverse/source，并运行隔离控制，重点覆盖：继承子环境不再被 `TOKENIZERS_PARALLELISM` 误拒；两种原测试实际使用的 `taskkill` 参数顺序被正确接受，而重复、缺失、value-as-switch、非十进制、非正数和额外参数被拒绝；精确 `NUL` 写入/FD 复制/关闭可通过，而 `NUL.txt`、带路径的 `NUL`、`CON`、UNC、其他设备路径仍被拒绝。服务测试与 full regression 仍由 Root 另行决定和执行。

