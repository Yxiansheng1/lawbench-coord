# A 正式交回，实际验证待主编排

执行令：`D:\Lawbeach\lawbench-coord\T31-native-admission-fix-order-20261026-165555.md`  
线：A / DeepSeek 执行者  
交回时间：2026-10-26T17:04:38+08:00  
状态：`SOURCE_HANDED_BACK / NOT_RUN`  
Git commit SHA：无，本运行器 Git 严格只读

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在原生请求交给 `prompt()` 前增加同步材料范围复核；失配时释放旧请求并撤销旧回显 |
| 目标是什么 | 两个冻结用例使用真实 Controller/Host 由旧红变为通过，随后复核配套回归 |
| 在等什么 | 主编排给出累计源码复核、补丁重放及实际测试的 stdout、stderr、退出码 |
| 卡在哪 | 本线没有停摆；含子模块的 Git 状态读取被 managed MXC 拒绝，顶层 dirty 已用只读 fallback 核对 |

收口状态：T31 未完成；已合流可见 0 项，在飞 1 个源码候选，已裁未派工
0 项，候 owner 0 项。

## 1 交付

产品改动只有三个允许文件：

| 文件 | 修改前 SHA-256 | 当前 SHA-256 |
|---|---|---|
| `D:\Lawbeach\lawbench-A\dsh\packages\client\ui-conversation\src\client\service.ts` | `CED6F86AFDE441A996B8CA8C1E2594C9E934BB2549239AF67336853960171825` | `9263521B80781489A071D411C14B7D3E85EF484A37F4A03046AA40A44A977414` |
| `D:\Lawbeach\lawbench-A\dsh\packages\client\ui-conversation\src\client\apply.ts` | `4339BAAF4A2D07B955C4B783D115B20A2AF2D6A621DA5C651F3A8952A42F2447` | `92D61E26087DD7D150A43F7E505AB07FAA3114F90CA5A9318459B991F9703BB0` |
| `D:\Lawbeach\lawbench-A\dsh-ext\ui\material-batch.ts` | `B4BC8CA39919B9F441556B41623AF957B22617C1A5358AC867C40DD09434F2E8` | `3447CA541CB32694416E33E1B808468A7930323C63A3D2B4A44B1F563C5368AF` |

新原生源码补丁：

`D:\Lawbeach\lawbench-A\dsh-patches\P-29-submission-admission-revalidation.patch`  
3561 bytes，SHA-256
`6BA11AE09A9E7ADEC05831479A84541ADAC0E72297F1729415718D95ECFCDF1D`

本文件、进度文件和证据说明也是本批实际写入。没有改
`dsh-ext\ui\index.tsx`、测试、配置、四份 JSON 契约、`PATCHES.md`、
私有构建器、动态哈希配置、既有 25 份输出、18 份旧证据、启动器、E50 或 guards。

证据说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeAdmissionFix-20261026-165555\README.md`

## 2 产品行为

`prepare()` 成功后仍要等待 paint 和附件序列化。新的同步 `admit()` 在
`session.prompt(..., submission.requestId)` 前执行，检查：

- 本次请求的 reservation 仍在，且会话和投递模式一致。
- 会话当前根目录仍对应 reservation 的案件。
- 当前批次、block、选中 ID 和会话占用仍属于本次请求。

任一条件失配时，现有 `failed()` 删除 reservation、释放占用、调用一次
`requestScope.release`，随后服务撤销本地回显并停止 `prompt()`。当前新批次、
新选择或案件状态不被清除，律师可用新的原生请求号再次发送。

旧三钩 hook 的 `admit` 是可选能力，因此无批次、legacy hook 和普通未带材料的
插话保持原路径。没有新增 `beginSubmission()`、Host 请求号、消息字段、附件字段、
全案回退、skip、fake R 或 bridge 替换。

## 3 补丁基线

固定 DSH 基座为 `477b4f420553e8a52c2fbccc464d7561b239c443`。累计顺序沿用
`dsh-patches\PATCHES.md` 的 `P-10` 至 `P-28`，随后依次应用六个既有 P-29：

1. `P-29-request-submission-scope.patch`
2. `P-29-request-submission-ordering.patch`
3. `P-29-request-submission-scope-test.patch`
4. `P-29-request-submission-failure-cleanup.patch`
5. `P-29-native-claimed-request-idempotency.patch`
6. `P-29-session-control-stream-type-arguments.patch`

新补丁排在这六个之后，只含 `service.ts` 与 `apply.ts`。组合包
`material-batch.ts` 不进入 DSH 源码补丁。六个历史补丁哈希依次为：

`E76C9C52...09991A`、`9187CBE6...BD0012`、`6A9F6020...C52DA1`、
`28F17402...11CB169`、`D3527B61...BC7F862`、`5A146F11...24CE73`。

完整哈希与冻结文件表见证据说明。作者没有运行 `git apply`、补丁检查或任何 Git
写入。

## 4 冻结输入

两个原生 admission 用例保持 22825 bytes，SHA-256
`1166B065C97EF634D7B0E2829927E148E56F3A3F851148FAD92134205B45FC7B`。

C disposal 用例保持 4639 bytes，SHA-256
`469118449395BCD0D6CA77D8D98BB43BDDAC949A6DCC2A7B47E041096B0D00DE`。

材料竞态文件保持
`29ED5D6D556C7BBC810C7E57E658E6ABFC666862AEBC60B4977EBE26EFA7C653`。

两个既有配置和原生配置保持：

- `62E4D81D88C1500F03805C4E76D030A9837065E960D1EFE7935A039DA91B3FBF`
- `ED1C57BBB492E28CAF43725896BA265905D126A16126DC8824EAEA9BE961CDB9`
- `D8CCC373D1AB9D837664814794017794551257A630A100534AAC8BAE7F56314F`

所有原始 native、UI、private selector 均未改。

## 5 依据与验证

上一轮 root 实际运行目录为：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31DisposalFixed-root-20261026-165252`

该轮事实证明冻结 native 测试已收集到，两个产品断言在第 427、547 行记录旧
`promptRequests` 非空；C disposal 1 项通过、受影响 19 项通过、类型检查 0 错误，
13 个观察到的操作系统身份均自然退出。本次没有重跑这些项目，这些事实不能当作
本次源码候选的通过证据。

本次静态核对结果：

- `source-before.json` 的 15 个条目逐项复算，只有三个允许产品文件发生变化。
- 三个产品文件的文本差分只包含同步 admission 调用、已准备 hook 转发及材料范围
  复核；没有无关 UI 重构。
- 冻结测试、配置、历史 P-29、`index.tsx` 和 C 线测试哈希全部未变。
- 最终检查与 `prompt()` 之间没有 `await`，请求仍复用同一个原生 ID。

## 6 未做与降级

以下均为 `NOT_RUN`：

- 两个冻结 native admission 用例及红转绿。
- 受影响 19 项、C disposal 1 项、类型检查、生命周期 5 项、原生身份 4 项。
- GUI、Gateway、模型、HTTP、网络、真实案卷、历史、rollout、凭据、Keyring、
  OCR、Office、付费检索、打包和真实环境。
- Python、Node、产品、测试、Vitest、`tsc`、`pytest`、parser、AST、list、collect、
  prepare、serve、probe、build、`git apply`、权限、ACL、审批、锁或 setup 变更。

本单不能证明整个 T31，也不能证明 GUI 或 Gateway 模型路径。它不声称修复
“排队 R2 后插话得到 R1”的独立风险；该风险仍未验证。

## 7 Git 与失败事件

Git 全程只读。没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
`checkout` 或 `push`，没有暂存，也没有 commit SHA。没有尝试修复 Git 权限、
`index.lock`、ACL、审批或 writer 锁，没有拆锁、扩权、启动 setup 或切 legacy。

非零事件：

- `git status` 在共享 `lawbench-A` 工作树 `dsh` 子模块的 Git 元数据路径被
  Permission denied，退出 1。改用
  `git status --short --branch --ignore-submodules=all` 后成功，确认既有 dirty
  全部保留；当前分支为 `ahead 93 / behind 1`。
- 普通 `git diff` 的两个组合查询同样因该路径退出 1；未产生 Git 写入。
- 静态核查与文档扫描中共六条命令误填 `bash`，managed MXC 在启动前拒绝
  packaged `bash.exe`，命令均未执行；随后用指定 native PowerShell 成功重跑。
- 一次 `rg` 使用 Windows 通配符路径，报文件名语法错误；改为精确目录读取。
- 一次探索性 `rg` 多了不存在的 `ui-conversation` 路径，退出 1；后续改用了
  已知文件的精确搜索。
- 三次 `git diff --no-index` 以退出码 1 表示存在预期文本差异，没有执行产品。
- 两次交付文字黑名单扫描以退出码 1 结束，表示没有命中。
- 一次文档微调把路径中的 `T31` 目录写漏，`apply_patch` 在写入前拒绝；随后用
  实际路径重做，失败调用没有产生文件变化。

## 8 下一步

主编排应先独立审阅当前累计源码、新补丁和冻结哈希，再在隔离副本中确认新补丁可
接在六个既有 P-29 后重放。随后实际运行两个冻结 native 用例、受影响 19 项、
C disposal 1 项、类型检查及必要窄生命周期回归，并保存真实 stdout、stderr
与退出码。

只有实际运行产生新证据后，才可讨论红转绿。若发现需要允许范围外的依赖，应先
报告精确事实，不扩大文件集、动态哈希或测试选择。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 0 / 黑名单 5

Response ID：`A-T31-native-admission-fix-20261026-165555`  
Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T31-native-admission-fix-20261026-165555.md`
