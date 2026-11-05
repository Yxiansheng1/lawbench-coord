# B 线 Batch4 交回

- 状态：源码与测试源修改完成，已按执行令停止。
- Git：全程只读；未执行 add / commit / rebase / stash / reset / clean / checkout / push，也未处理 index.lock、权限、锁或 ACL。
- 测试：未执行任何代码、pytest、collection、parser、build、HTTP、进程、网络或 GUI 检查。

## 改动文件

1. `D:\Lawbeach\lawbench-B\service\lawbench\net.py`
   - 新增只读 Windows 路由身份辅助函数，要求绝对路径 Windows PowerShell、`-NoProfile -NonInteractive`、`shell=False`、超时 3 秒。
   - 仅接受 IP 字面量；主机名不做 DNS，直接失败关闭。
   - PowerShell 用 `Find-NetRoute -RemoteIPAddress` 取得目标路由，要求所有行的 InterfaceIndex 唯一；再按该精确 ifIndex 过滤 `Get-NetAdapter -IncludeHidden`，仅输出 name 与 description 的 JSON。
   - 无匹配、多 index、命令出错、超时、非 Windows、非 UTF-8 JSON、多余字段均返回失败关闭。
   - `Net` 新增可注入的 `route_identity` 和 `easytier_route()`；仅 interface name 不区分大小写以 `et_` 开头，或 description 不区分大小写包含 `EasyTier` 时返回 true。无缓存。

2. `D:\Lawbeach\lawbench-B\service\lawbench\remote.py`
   - 新增内部原因 `EXTERNAL_NOT_TUNNEL = "external_not_tunnel"`，公开状态枚举未改。
   - `_direct_ok()` 保留；它现在要求目标 probe 成功且 `net.easytier_route()` 严格返回 `True`。缺少该方法、异常或未验证身份均不得视为 EXTERNAL。
   - 所外地址可达但路由身份不是 EasyTier 时，监管循环仍调用自己的 `_run_once()`，并在 connecting/failed 过程中保留 `EXTERNAL_NOT_TUNNEL`。
   - 自有转发成功时清除原因并发布 CONNECTED；已验证外部 EasyTier 仍发布 EXTERNAL 且无原因；缺运行库、缺接入码原因保持原样。
   - `set_secret()` 在任何存储、日志、重启之前校验：必须是 str、长度 1..512、每个码点均在 `0x21..0x7E`；不 trim。失败抛固定 `ApiError("INVALID_ARGUMENT", "remote_code_invalid")`，不包含输入值。
   - core_args、flags、默认安装位置、relay、network name、环境变量传递、进程生命周期、锁和 alternate forward 语义未改。

3. `D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py`
   - 只增加 `EXTERNAL_NOT_TUNNEL` 的导入与公开原因映射，映射为精确值 `EXTERNAL_NOT_TUNNEL`。

4. `D:\Lawbeach\lawbench-B\contracts\api\remote_access.schema.json`
   - 在 `$defs.response...reason` 和 `$defs.value.reason` 两处枚举均加入 `EXTERNAL_NOT_TUNNEL`；其余键保留。

5. `D:\Lawbeach\lawbench-B\service\tests\test_owner_real_connect_batch3.py`
   - 仅给旧正例的 `FakeNet` 增加 `easytier_route()` 身份方法；旧断言未改。

6. `D:\Lawbeach\lawbench-B\service\tests\test_owner_batch4_remote.py`（新文件）
   - 纯合成测试源，使用 MemorySecret/FakeNet；除显式假 Popen 桩外，Popen、thread.start、subprocess.run 默认硬拒绝。
   - 覆盖精确 interface identity、无关 EasyTier adapter、无路由身份方法、未知形状、异常、超时、非 Windows、主机名失败关闭、无缓存。
   - 覆盖 et_ 与 description 正例、Mihomo 误判回归、不可达、缺运行时、缺接入码、失败原因保留、自有 forward 成功 CONNECTED。
   - 覆盖 ASCII 有效边界、13 类无效输入无存储/日志/重启且不泄漏输入值、API 映射和两处契约枚举。

## 既有状态与限制

- 工作区原有大量脏改动已保全，未回滚、未暂存。
- 本执行开始时 `git status` 在 `dsh` 子模块遇到 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 读取权限拒绝；改用只读 `--ignore-submodules=all` 核对白名单路径，未扩权或改锁。
- 当前索引中 `service/lawbench/remote.py`、两个 Batch3/Batch4 测试文件为未跟踪状态；按命令没有执行 Git 写入，不能用提交 SHA 标识。
- `contracts/_build/gen_schemas.py` 不在本令白名单，仍保留旧原因枚举；本令指定手改的 schema 已更新，生成器同步留给主编排裁决。
- 路由 PowerShell 实际 cmdlet 运行、测试执行、契约验证与构建均未由 B 作者运行；这些属于后续 finite checks。
- 提交 SHA：无（本执行禁止 Git 写入）。
