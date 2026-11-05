# C 正式交回：T31 原生最终接纳独立源码复核

执行令：`D:\Lawbeach\lawbench-coord\T31-native-admission-independent-review-order-20261026-170803.md`  
线：C / DeepSeek 独立执行者  
状态：`SOURCE_REVIEW_COMPLETE / ALL_RUNTIME_NOT_RUN`  
Git commit SHA：无；本运行器按令只读 Git

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 逐项核验 8 份冻结快照，审查最终同步 admission、材料 reservation、registry 快照、失败清理、无批次与旧三钩兼容，并隔离 P29 增量 |
| 目标是什么 | 判断新源码是否关闭两条原始 post-prepare/paint 失配，同时区分源码缺陷、验证覆盖缺口和既有 queued-R2→steer-R1 风险 |
| 在等什么 | root 对当前生产者哈希作最终对照，然后重放 P29 并实际运行原生回归、受影响回归、C disposal、类型检查和 GUI |
| 卡在哪 | 没有停摆；子模块 Git 元数据权限拒绝只影响只读 Git 状态，不修权限、不改锁 |

## 1. 结论

源码层面没有发现会阻断本轮两类原始失配的运行缺陷：

- `material-batch.ts` 的 `admit()` 在最终 prompt 前重查 reservation、会话、mode、当前案例根、block、batch_id、选择集合和占用。
- `service.ts` 先在 paint/附件序列化之后同步调用 `admit()`，再以同一个原生 R 调 `prompt()`；两者之间没有 `await`。
- mismatch 抛错后，`service.ts` 走 `failed(event)`，再 `submission.abandon()`；不进入 Host prompt。材料 hook 删除 reservation、释放本地占用并对旧 R 发一次 release，当前批次保留供新 R 重试。

结论不是通过验收。当前候选尚未运行；没有模型、HTTP、Gateway、rollout、真实 GUI 或真实案卷证据。

## 2. 新发现

### `T31-NAR-SRC-01` / `LOW` / 源码可证类型面缺口

`dsh-ext\ui\index.tsx` 第 94–100 行对注入的 `conversationSubmission.register` 仍只声明
`prepare/accepted/failed`，没有新增的可选同步 `admit`。生产 `apply.ts` 第 93–106、
245–249 行已支持并转发四钩。

当前材料适配器靠结构兼容和变量对象保留运行时 `admit`，所以没有据此声称现产品发送链路
已经失效；但按注入类型直接写四钩对象字面量会得到 TypeScript excess-property 错误。
最小修正是给该注入声明补 `admit?(event): void`。类型检查按令未运行。

### `T31-NAR-GAP-01` / `MEDIUM` / 验证覆盖缺口，不是源码缺陷

冻结 native2 第 323–332 行把 `materialHook` 直接作为 `submissionLifecycle` 注入
`ConversationController`，绕过 `apply.ts` 第 216–263 行的生产 registry。配置第 8–10、
32–46 行也只选择该文件。

因此两个冻结用例没有覆盖：多 hook 的 `admit` 投递、prepared-set 快照、late hook
排除、其中一个 `admit` 抛错后所有已准备 hook 恰好一次 `failed`。源码看起来正确，
但现有运行证据没有经过这段路径。既有 service-orchestration 测试覆盖 prepare 失败和
accepted 快照，却没有四钩 `admit` 用例。

### `T31-NAR-GAP-02` / `LOW` / 验证覆盖缺口，不是源码缺陷

冻结用例在第 427–430、547–550 行证明旧请求未到 Host、release 一次并通过第二 R
成功，却没有断言实际 Session 的旧 pending echo 已删除。它们也只覆盖 `queue`、
同一案件、非空批次。源码第 352–355 行确实先 `failed` 再 `abandon`，但没有运行证明。

最小补证：第一次失败结算后断言旧 R 不在 `pendingSubmissions`；另补无批次旧三钩、
切案或 steer 的窄组合。只写建议，本单没有改测试。

## 3. 已审 NO_FINDING

- 取消并替换批次、改选材料：最终 admit 的精确 batch/selection/case/mode 复核可拦截，未发现新的 await 缝隙。
- 同步边界：admit 到同一 R 的 prompt 之间没有 await、timer 或新事件循环。
- 失败所有权：registry 在 accepted/failed 前删除 prepared 映射，再用 `Promise.allSettled` 结算；无双重最终化路径。
- 无批次和旧三钩：无 reservation 时正常放行；`admit` 可选，合法 unscoped NativeR 没有被一律拒绝。
- P29 静态范围：补丁只有 `service.ts` 与 `apply.ts`，无 Host/wire 字段、消息字段、附件字段或全案回退。实际补丁重放 `NOT_RUN`。

边界事实：材料 `failed()` 对 `requestScope.release` 只证明“尝试一次”，没有检查
`call()` 返回的 `ok`。这在本轮增量前已存在，所以不列为新发现；报告没有宣称后端
release 成功。queued-R2→steer-R1 仍是既有独立风险，本单没有重审或宣称已修。

## 4. 证据复用

root 修复前运行事实已复用：

- A-native2 两条产品断言在第 427、547 行红。
- C-disposal1、A-affected19、A-types 当时绿。
- GUI 当时无证据。

这只证明修复前基线。当前候选改了 `service.ts`、`apply.ts`、`material-batch.ts`，
所以 A-native2、A-affected19、A-types 都不能沿用为当前候选通过。C-disposal1 对应的
捕获/注销源码区段没有在本轮增量中改变，可窄复用其旧绿色基线，但不能当成 native
admission 证据。

## 5. 冻结身份

8 份输入均与 `source-map.json` 的字节数及 SHA-256 一致：

- `material-batch.ts`：`3447CA541CB32694416E33E1B808468A7930323C63A3D2B4A44B1F563C5368AF`
- `index.tsx`：`DBAF0B4121F11DDA040EF9475EC8B1D52C64E757C9959392E26C573764A957FB`
- `service.ts`：`9263521B80781489A071D411C14B7D3E85EF484A37F4A03046AA40A44A977414`
- `apply.ts`：`92D61E26087DD7D150A43F7E505AB07FAA3114F90CA5A9318459B991F9703BB0`
- native2 spec：`1166B065C97EF634D7B0E2829927E148E56F3A3F851148FAD92134205B45FC7B`
- P29：`6BA11AE09A9E7ADEC05831479A84541ADAC0E72297F1729415718D95ECFCDF1D`
- vitest config：`ED1C57BBB492E28CAF43725896BA265905D126A16126DC8824EAEA9BE961CDB9`
- C disposal spec：`469118449395BCD0D6CA77D8D98BB43BDDAC949A6DCC2A7B47E041096B0D00DE`

报告只适用于这些哈希。root 若发现 A 最终生产者哈希不同，应做窄重审，不静默沿用。

## 6. 交付文件

- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\NativeAdmissionReview-20261026-170803\findings.md`
- `D:\Lawbeach\lawbench-C\docs\plan\evidence\T31\NativeAdmissionReview-20261026-170803\source-map.json`
- `D:\Lawbeach\lawbench-coord\C-handback-T31-native-admission-independent-review-20261026-170803.md`
- `D:\Lawbeach\lawbench-coord\C-progress-T31-native-admission-independent-review-20261026-170803.md`

证据哈希：

- `findings.md`：16503 bytes，`3473d92ec4726b259d9b79e06f4fc384a523eae068c97abe64179662e8079b1a`
- `source-map.json`：21356 bytes，`f6d0cbb4696cba13a3ae295ee1c09096ad2a1be94f5a9d99a2c19300362eb80b`

## 7. NOT_RUN 与禁区

以下全部 `NOT_RUN`：Node、Vitest、tsc、pytest、Python、测试、list、collect、
parser、AST、build、prepare、serve、probe、selfcheck、default lifespan、`git apply`、
补丁重放、HTTP、Gateway、模型、网络、GUI、OCR、Office、真实案卷、history、rollout、
`.env.local`、Keyring、credentials、付费检索和安装。

实际 GUI：**不存在**。模型/HTTP：**不存在**。当前候选 post-fix 运行结果：**不存在**。

## 8. Dirty、Git 与阻碍

- Git 全程只读；没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`，没有暂存。
- 普通 `git status` 在共享 `dsh` 子模块 Git 元数据处报
  `cannot chdir ... Permission denied`；改用 `--ignore-submodules=all` 只读查看 C 顶层。
- C 顶层原有 dirty 有五项 tracked modification及既有 untracked evidence/config 等；
  本单未改、未清理这些内容。
- 没有修复 `index.lock`、权限、ACL、审批或 writer 锁，没有 setup/legacy 切换。

## 9. 给 root 的下一步

1. 先比对最终生产者哈希与冻结清单。
2. 若接受类型面缺口，补 `index.tsx` 的 `admit` 声明；产品运行时逻辑不因此改变。
3. 在隔离副本重放六个既有 P29 后加本 P29，实际运行冻结 native2、受影响回归、
   C disposal、类型检查。
4. 增加测试侧的 registry 四钩 admission 失败用例和旧 R 回显撤销断言。
5. 以上均通过后再进入 GUI/Gateway/模型与整个 T31 的 root 验收；本报告不代替验收。

Response ID：`C-T31-native-admission-independent-review-20261026-170803`  
Response log path：`D:\Lawbeach\lawbench-coord\C-handback-T31-native-admission-independent-review-20261026-170803.md`
