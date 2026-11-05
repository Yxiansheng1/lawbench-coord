# C 线 T31 解绑回归交回

| 类型 | 内容 |
|---|---|
| 做了什么 | 新增 1 个局部回归测试，交回源码与证据 |
| 目标是什么 | 覆盖最后提交 hook 解绑后迟到清单不得重建批次；还差根执行与结果分类 |
| 在等什么 | 等根执行固定命令后的红或灰结果；预期红转产品修复评估，工具链灰按 fixture 处理 |
| 卡在哪 | 作者端无阻塞；运行证据缺失是本单禁止作者执行，不是环境停摆 |

## 依据与验证

- 执行令：`D:\Lawbeach\lawbench-coord\T31-C-disposal-red-order-20261026-160622.md`
- 证据说明：`D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\Disposal-20261026-160622\README.md`
- A source-under-test：`D:\Lawbeach\lawbench-A\dsh-ext\ui\material-batch.ts`，SHA-256 `38328DC0B4B1A568772729E5310677657E48247C1713D65F0CDE6028FEA4CD01`。
- A app state：`D:\Lawbeach\lawbench-A\dsh-ext\ui\state.ts`，SHA-256 `DC1BFCA134440714B4242A7E13D53DD4CA993841C7DC1197CE791C3FA3D5CE51`。
- A HEAD：`a23271abee333a9a256fd46a3141da16975c2380`；C HEAD：`ebbca3f39cdb97440f56f90dcb07dce161849231`。
- 新测试：`D:\Lawbeach\lawbench-C\dsh-ext\tests\t31-material-capture-disposal.spec.tsx`，SHA-256 `469118449395BCD0D6CA77D8D98BB43BDDAC949A6DCC2A7B47E041096B0D00DE`。
- 固定根命令：`E:/node/node.exe D:/Lawbeach/lawbench-A/dsh/node_modules/vitest/vitest.mjs run --config D:/Lawbeach/lawbench-A/dsh-ext/vitest.config.mjs --root D:/Lawbeach/lawbench-C/dsh-ext tests/t31-material-capture-disposal.spec.tsx`。

当前源码的最后一个 disposer 只清空 app 批次和阻断态，没有使 pending capture owner 失效。源码级预判是迟到成功清单仍会重建批次并返回，因此该测试在现源上应为红。没有运行 PASS 结果。

## 变更文件

- `D:\Lawbeach\lawbench-C\dsh-ext\tests\t31-material-capture-disposal.spec.tsx`
- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\Disposal-20261026-160622\README.md`
- `D:\Lawbeach\lawbench-coord\C-handback-T31-disposal-red-20261026-160622.md`
- `D:\Lawbeach\lawbench-coord\C-progress-T31-disposal-red-20261026-160622.md`

## 失败命令与清理

- C 根普通 Git status 被子模块 `dsh` 的权限错误阻断；使用 `--ignore-submodules=all` 读得根仓库 dirty 状态，没有修锁或扩权。
- A 工作树 status 报 `fatal: this operation must be run in a work tree`；改用 A HEAD 与源码 SHA-256 固定来源，没有修共享 Git 元数据。
- 合并输出四个 SHA-256 的只读 PowerShell 表达式因换行转义报错，退出码 1；文件未变。
- 测试的 `finally` 会幂等结算唯一 deferred、单次解绑、等待已经结算的捕获、恢复 API/app state、清空本地 hook 集合并恢复 mocks。
- 本次没有执行测试，故无运行期清理；没有产品、配置、依赖、权限、ACL、审批或锁变更。

## 未做与降级

- 未运行 Python、Node、Vitest、tsc、pytest、测试、收集、prepare、serve、probe、build 或 selfcheck。
- 未改产品源码、相邻测试、测试配置、依赖、A、B5、真实案卷或任何环境安全设置。
- 未执行任何 Git 写入，因此没有提交 SHA；交付以文件内容和 SHA-256 固定。
- C/A 的既有 dirty、A/B5 pin 与旧快照均未清理、改写或暂存。

## 下一步建议

根 agent 在现有工具链上执行上面的固定命令。若得到预期红，将该结果归到 T31-FIX-A-01 的材料捕获解绑问题，再另行派产品修复；若得到导入或 0 test 的工具链灰，按 fixture 或工具链问题处理。当前不需要 owner 做决定，也不要由本 C 作者继续改产品。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 0 / 黑名单 0

Response ID: `C-T31-disposal-red-20261026-160622`

Response log path: `D:\Lawbeach\lawbench-coord\C-handback-T31-disposal-red-20261026-160622.md`
