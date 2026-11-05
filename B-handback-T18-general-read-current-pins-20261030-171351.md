# B 线交回：T18 general-read 当前编译针

执行令：`B-T18-general-read-current-pins-20261030-171351.md`
结果：`SOURCE_ONLY_COMPLETE_REVIEW_REQUIRED`，不是业务 PASS。

## 两处导入

仅修改 `native-general-drafting.mts` 的两个绝对导入 URI：

```text
file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T34/SettingsStartupPrivateBuild-20261030-141828/private-output-20261030-142648/profile-node_modules/lawbench-dsh/lib/agent.js
file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T34/SettingsStartupPrivateBuild-20261030-141828/private-output-20261030-142648/profile-node_modules/lawbench-dsh/lib/host.js
```

替换为：

```text
file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/GeneralReadOrderPrivateBuild-20261030-164557/private-output-20261030-171028/profile-node_modules/lawbench-dsh/lib/agent.js
file:///D:/Lawbeach/lawbench-A/docs/plan/evidence/T18/GeneralReadOrderPrivateBuild-20261030-164557/private-output-20261030-171028/profile-node_modules/lawbench-dsh/lib/host.js
```

入口新标识：`108580` bytes，SHA-256 `17ca8da66d3dd2047df40f061482e040ff71a8cce3a690e83f6d1e0facdc7be5`。入口无静态四行运行时表，未新增该表。

## 四个当前编译针

`literalfixed-inputs.json` 已按获批蓝图重建，`compilerPrivate` 只有以下四行：

| role | path | bytes | SHA-256 |
|---|---|---:|---|
| current-compiled-agent | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557\private-output-20261030-171028\profile-node_modules\lawbench-dsh\lib\agent.js` | 558006 | `f395c8557d7095c9a98183c8dfaf01fd66344c1636bbb983d11eab0568ab7311` |
| current-compiled-host | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557\private-output-20261030-171028\profile-node_modules\lawbench-dsh\lib\host.js` | 904755 | `ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba` |
| current-compiled-package | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557\private-output-20261030-171028\profile-node_modules\lawbench-dsh\package.json` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| current-compiled-manifest | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557\private-output-20261030-171028\manifest.json` | 58199 | `89725cac86267da39572a8e9e9fb3e855aca26199cac4e0df13dd84e2cf76d52` |

清单新标识：`11938` bytes，SHA-256 `5ea298ec1c8754a82fc1c9fcf348cdcf95f59b649abdbe4f72bb0fc80fe4ce8f`。`bService` 保持 `42437` bytes、SHA-256 `44bb8b5ff60309a7d7dc3c1474ab4efebe00995673927f59137dbb1f86346203`。

## 验证边界

未运行 Node、Python、导入检查、AST/类型检查、测试、构建、产品、GUI、HTTP、模型或网络探测；`RUNTIME_EXECUTED=0`、`NOT_RUN`。

仅作静态收尾哈希：`b-service-general-drafting.py`、`general-read-order-finite.mts`、旧 `README.md` 的 bytes/SHA 与既有 pin 完全相同。未改旧主目录、服务、有限消费器、README、测试或构建配置，未新增代码、断言、提示词、金标、模型预算、SDK 或 Key。

Git 全程只读，未 add/commit/rebase/stash/reset/clean/checkout/push，也未改锁或权限。只读 `git status` 在共享 worktree 的 `modules/dsh` 上返回 `Permission denied`；未尝试修复，这不阻断开头规定的源码交付。既有 dirty 均未清理或覆盖。

根仍须完成 classifier、finite/fullraw inverse 和后续显式 admission；在真实同案原执行前，本交回不构成业务 PASS。全量测试仍等待人工同步放行与 Packaging HOLD 解除。
