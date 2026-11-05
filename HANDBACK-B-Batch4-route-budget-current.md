# B Batch4 route-query budget — current handback

状态：有界源码修改完成，交回主编排。

## 已修改

- `D:\Lawbeach\lawbench-B\service\lawbench\net.py`
  - `_windows_route_identity()` 的 helper `subprocess.run` 参数：`timeout=3` 改为 `timeout=8`。
  - 8 秒仍为有限预算；既有异常、未知返回和解析失败路径继续 fail closed。
- `D:\Lawbeach\lawbench-B\service\tests\test_owner_batch4_remote.py`
  - helper 预算断言由 `kwargs["timeout"] <= 3` 改为 `kwargs["timeout"] == 8`。
  - 合成 `subprocess.TimeoutExpired("x", 3)` 的描述参数同步改为 `8`；未弱化其他断言。

## 依据

- 执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-Batch4-RouteBudget-20261103-093631.md`
- 令中已有只读实测：真实本地测量 `4.1717005` 秒、退出码 `0`；保留地址 `192.0.2.10` 上准确最佳路由返回 Mihomo/MetaTunnel。
- 旧 helper 的 3 秒上限会截断正常查询；新上限为 8 秒的有限预算。

## 验证与边界

- 按本执行令特别禁区，本运行未执行测试、运行时、查询、HTTP、模型、GUI、解析器、构建或其他验证命令。
- 本次未发起实际路由查询，未修改 EasyTier 参数，未更换 API。
- 本运行仅对上述两个白名单源码路径作字面补丁，并写本交回文件。
- 按执行令及当前运行器授权，未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；无 Git 提交 SHA。
- 未更改沙箱、审批、ACL、锁或 `.env.local`，未拆 writer 锁。

## 遗留

- 主编排需在合流前按规定自行完成所需验证；本交回不宣称测试已通过。
- 未观察到源码修改范围外的交付阻碍。
