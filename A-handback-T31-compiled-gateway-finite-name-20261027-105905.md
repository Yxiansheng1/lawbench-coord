# A 线交回：T31 编译网关有限名称顺序修正

状态：`COMPLETE`

运行状态：`RUNTIME_NOT_RUN`

## 已完成

- 将任务自建测试从普通自动发现路径改名为：`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-compiled-session-gateway.finite.ts`。
- 原路径：`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-compiled-session-gateway.client.spec.ts`，已确认不存在。
- 旧路径与新路径均为普通文件语义；新路径非重解析点。
- 改名前后字节数均为 `28086`，SHA-256 均为 `58E73F68D0E1A55A1DD858C2A7F504632549611F9BECAD186CDC2E104C70751B`，内容逐字节一致。
- 私有选择器 `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-compiled-session-gateway.config.mjs` 仅做指定替换：`t31-compiled-session-gateway.client.spec.ts` → `t31-compiled-session-gateway.finite.ts`。
- 选择器由 `818` 字节变为 `813` 字节；冻结基准 SHA-256 为 `031664C86951748E5CBDEAA40CF29897F7A15FEFC2C87021CACC2105939DB697`，当前 SHA-256 为 `760FDD5FCADD2479EE920E35954637A1A9B0FF6E010539E555D3C03E7475C2A5`。
- 选择器旧字面量出现次数 `1` → `0`，新字面量当前出现 `1` 次；冻结基准只替换该字面量后与当前内容完全相等。

## 证据

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\CompiledGatewayFiniteName-20261027-105905\README.md`

## 命令与退出码

共执行 `7` 次 `exec_command`：`6` 次退出码 `0`，`1` 次退出码 `1`。全部使用执行令指定 PowerShell，`login=false`。

唯一非零项是首次 `git status --short --untracked-files=all`：只读检查在 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 遇到 `Permission denied`。未修复权限、未改锁、未扩权。

随后使用 `git status --short --ignore-submodules=all --untracked-files=all` 顶层只读检查，退出码 `0`，确认大量既有脏改动仍在且未被处理。

## 边界

- `RUNTIME_NOT_RUN`：未运行 Node、Python、解析器、AST、测试收集、导入、构建、准备、服务、探针、HTTP、GUI、模型或自检。
- 未执行任何 Git 写操作；未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未修改普通配置、旧配置、别名、测试正文、业务逻辑、框架、测试用例、既有 README 或既有正式文件。
- 本次不处理既有脏工作树；只读 Git 子模块权限拒绝不是本运行器的修复项。
- root 可在完整审计后执行首次 actual paired2；本线不代替其运行。
