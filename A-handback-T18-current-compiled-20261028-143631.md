# A 线交回件：T18 当前编译源适配（20261028-143631）

## 交回结论

任务状态：有界修改完成，静态核验完成，等待 root 独立审计后在授权运行面执行有限兼容性和一次原始 Skill 工作流。

本轮只将 T18 消费者从旧默认扩展成品切到已验收私编成品，并补齐真实固定依赖。没有修改产品代码、默认 lib、B 入口、fixture、Skill、package、锁文件或构建配置。作者运行时为 0；没有跑消费者，也没有产生新的模型、HTTP、GUI、安装或构建结果。

## 精确源码增量

目标：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts`

- 修改前：76669 字节，SHA-256 `6b8313689b2386540d9409f67a03364e8a04ed7a321164dd4aee7a975528ab47`。
- 修改后：76889 字节，SHA-256 `eff244a84cd9b0d81d5bef5afd62d2e665309e161c17eb2eca6a58bd745435be`。
- 与协调输入快照逐行比较：恰好删除 3 行、新增 3 行；仅 literal manifest pin 和两条动态 import 发生替换。
- 原 `dsh-ext/lib/agent.js`、`dsh-ext/lib/host.js` 动态导入为 0 条。
- 新私编绝对 file URL 动态导入为 2 条，分别指向：

```text
D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/private-output-20261027-194112/profile-node_modules/lawbench-dsh/lib/agent.js
D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/private-output-20261027-194112/profile-node_modules/lawbench-dsh/lib/host.js
```

- Context、SessionCommandController、BrowserSession、AgentLoop、native R、B HTTP、Skill、question、model route、预算、coverage、draft、citations、JSONL、finally、断言和校验全部未改。

README：`...\README.md` 修改前 5278 字节 / SHA `17747afa72596cc1ad37574c9c05aec3ccddc25fb8d916dde1701d84cbe2f9e8`；修改后 7120 字节 / SHA `20d1beb9040d44b8684a9330f468b6f4d706454671a707656d2f7ca335091f8b`。逐行比较只有新增 13 行，历史事实未改写。

## 固定清单增量

目标：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\fixed-inputs.json`

- 修改前：14681 字节，SHA-256 `7fa7ee7fddcc8fff0768a3dde4b84eef077c10aaea2cc451e201469c5d4869e0`。
- 修改后：16217 字节，SHA-256 `81f2a55fd881f0ac8f8a53e92c3f3b93b08be0b6aef32c6e68bc077cf296c2b3`。
- 原 58 条固定记录全部保留，新增 4 条 `accepted-private-runtime` 依赖；固定记录由 58 条变为 62 条。
- 消费者 literal `FIXED_INPUTS_SHA256` 已更新为 `81f2a55fd881f0ac8f8a53e92c3f3b93b08be0b6aef32c6e68bc077cf296c2b3`。
- 旧默认编译 agent/host 固定行没有覆盖，仍作为历史旧 surface 保留。

四条新增记录均用明确 path、role、bytes、SHA 固定，不从运行时动态信任：

| 角色 | 字节 | SHA-256 |
|---|---:|---|
| current-compiled-agent | 537563 | `0013b9564720a2c68fe2239a36ebfe6f2e80aee35d8e3ade019384b62091135b` |
| current-compiled-host | 900805 | `84adeef92360e0ef3faddb1b89e6d56a2c66135e2b07283a180049613bce8164` |
| current-compiled-package-metadata | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| current-compiled-manifest | 58195 | `5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f` |

## 验证与边界

- 私编 manifest、agent、host、package metadata 均实际存在；只读 `Get-FileHash` 与 `private-inputs.json` 和已验收 immutable manifest 完全一致。
- 工作流旧 import 计数 0、新 import 计数 2、新 pin 计数 1。
- 固定清单 `accepted-private-runtime` 计数 4，`"sha256":` 行数由 60 变为 64，新 pin 与 fixed-inputs 文件实际 SHA 一致。
- README 仅追加；工作流相对快照仅 3 行替换。
- 除一次只读路径存在性诊断外，全部实质命令退出码为 0。该诊断特意同时检查一个不存在的短路径别名，因第二路径不存在退出 1；没有运行进程、写入文件或改变状态。一次全工作树 Git status 因 Windows 超长路径目录产生 warning 和截断输出，但命令仍退出 0。
- 未运行 Node、Python、import、JSON/TS parser、AST、compiler、tsc、tests、build、prepare、serve、probe、HTTP、model、GUI、SSH、selftest、安装或 package 操作。
- Git 严格只读；未 add、commit、rebase、stash、reset、clean、checkout 或 push。没有处理 index.lock、权限、ACL、审批或 writer 锁。
- 没有接触 Key、DPAPI、credential、环境秘密、history、rollout 或真实案卷数据；没有联系其他聊天或代理。

完整逐条实际命令、修改前状态和静态核验明细在：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\current-compiled-20261028-143631.md`

该记录文件当前为 14889 字节，SHA-256 `b0f0f1d4a3035fd499a4a50abe3e7c4513d2f0e0b1330e4a56f1f10205a0fc98`。

## 写入面

本轮新写或修改的路径仅为：

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\native-reading-workflow.mts`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\fixed-inputs.json`
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\README.md`
4. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\NativeReadingWorkflow-20261028-133231\current-compiled-20261028-143631.md`
5. `D:\Lawbeach\lawbench-coord\A-handback-T18-current-compiled-20261028-143631.md`

其他既有 dirty 与未跟踪内容全部原样保留。

## 留给 root

请独立审计后运行有限兼容性检查，再跑一次原始 Skill 工作流。本交回不声称 `request_scope`、模型 POST、native/GUI 边界或整条 T18 已在本次修改上通过；旧失败和旧 native 空集合只作为历史事实。Gate 1 与项目完成度未闭环，Packaging 仍为 HOLD。
