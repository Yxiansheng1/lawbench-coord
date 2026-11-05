# T18 标题契约候选待 ROOT 复核

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已交付新的 general-drafting 标题观察候选，含两份修改后的源码、只改两项 identity 的固定输入、README 和本交回。候选未被作者运行。 |
| 目标是什么 | 让消费者记录模型实际保存的非空标题，同时保留提问、正文、当前任务路径、版本、引用和质量边界。终门是新编译准入、repin、A 线装配、真实重跑和 ROOT 全反审。 |
| 在等什么 | 等 ROOT 对新源码做全反审与新的编译准入；信号是新编译身份和 repin 结果。之后由 A 线构建，再在独立运行中重跑真实场景。 |
| 卡在哪 | 作者运行权限明确为 0，不能验证编译或真实行为。原跑还存在独立的 `ask_user_question` 缺失失败；本候选保留该断言，不把它算作标题修复成功。 |

## 写入面

- 新建并写入 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingTitleContract-20261029-033824\`。
- 按字节复制两份冻结源码和 `literalfixed-inputs.json` 到该目录，再仅对标题逻辑和 manifest 两项 identity 应用补丁。
- 新增该目录的 `README.md` 与本交回文件。除此之外没有产品、Skill、测试、契约、运行产物或 Git 写入面。

## 依据与验证

- 原跑最终草稿：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\run-iOLk2a\case\工作区\任务\T-20261029033346-771d\草稿\律师函（致王某丙）-v4.md`，2962 字节，SHA-256 `88f4848fffc74f87dd2bab391981be3101bef31ad995f7510266f9488e64b31f`，v4 引用检查 `must_fix=0`、`citations=20`。
- 原跑标题与四次保存：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\run-iOLk2a\report.json`，实际标题为 `律师函（致王某丙）`，四次 `case_save_draft` 均成功。
- Python 响应误报：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralDraftingNative-20261029-025642\run-iOLk2a\b-service-final.json`，`violations` 为四次 `DRAFT_RESPONSE`，`draftPaths` 为空。
- 原跑首个消费者失败：`D:\Lawbeach\lawbench-coord\T18GeneralTitleContractInput-20261029-033824\actual-closed.json`，错误为 `actual tool loop lacks ask_user_question`；同时记录 `questions_answered_before_first_successful_save=false`。
- 新候选 Node 源码：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingTitleContract-20261029-033824\native-general-drafting.mts`，101376 字节，SHA-256 `9ddafeaa875d268b6cf80836dccebc127bc5dafd1f5e5b5d91d7037575f96630`。
- 新候选 Python 服务：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingTitleContract-20261029-033824\b-service-general-drafting.py`，42461 字节，SHA-256 `85a16d5ec6729e608ba32834e189d64be9406fed5043687cb9f477a28827fe07`。
- 新候选固定输入：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingTitleContract-20261029-033824\literalfixed-inputs.json`，11665 字节，SHA-256 `aaf17116a17e3f139d4274eb1db424589f7feb857dd9592323f65a5fce09ee3f`。
- 新候选 README：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GeneralDraftingTitleContract-20261029-033824\README.md`，4061 字节，SHA-256 `5404ffb802c0501d5e5c0ec8300bc8b5a999720f6c573f7e8dcd705248bc26dc`。
- 原已服务身份保持：Node `8a8347caeb801b3c5053bf22f709631f4302c3f802975c2b87215673003e9f70`，Python `c8bbde139050d1c3728a1631b50a7448614af7c8a1c6ce9334a8b657e84188bc`，原固定输入 `a1751fa2d62c22869092903f32a54b95ed63d57d6a67e6a1faf2b80d6a062464`。
- 只读命令限 `Get-Content`、`Get-ChildItem`、`Test-Path`、`Get-FileHash`、`Compare-Object`、`Select-String`、`rg` 和一次 `git status`；没有测试、编译或运行命令。

## 候选修改

Node 从最终 `result.drafts` 读取实际非空标题，用该标题与正文精确匹配末次模型保存调用，再核对工具结果中的当前任务草稿路径和版本，并把实际标题写入报告。

Python 只从 `request_args.title` 接受非空字符串，同时校验响应路径位于当前任务草稿目录、以 `.md` 结尾、版本为正整数，并记录实际路径。

标题不再要求等于常量 `律师函`。本候选没有新增标题别名、自然语言判断、白名单、正则分类器或存储，没有改写回复任务或原始保存正文，也没有删除提问、案件、会话、版本、引用、持久化、预算或质量断言。

## 未做与降级

- `AUTHOR_RUNTIME=0`：未运行 Node、Python、tsx、语法检查、编译、测试、构建、prepare、HTTP、模型、GUI、SSH、密钥、DPAPI 或凭据发现。
- 未获得新的编译产物准入，未 repin，未装配新 A 线，未重跑真实场景。
- 未执行任何 Git 写入。`git status --short --branch` 因 `lawbench-B-new/modules/dsh` 子模块 `Permission denied` 退出 1；未修锁、未扩权、未改 ACL。
- 读取阶段五次误传 `bash.exe`，均由环境以 `Bash/E_ACCESSDENIED` 拒绝；一次 PowerShell 哈希管道语法错误退出 1，一次目录检查因目标尚不存在退出 1，一次 `rg` 正则未闭合退出 1。均没有写入，也没有执行被读源码。
- 原跑的 `B HTTP service did not stop cleanly` 清理次生错误仍不得视为已消除。
- Gate 1 未过，完整 T18 未完成，项目未完成，Packaging 保持 HOLD。

## 下一步建议

ROOT 先对新源码做全反审并建立新的编译准入与 repin。A 线使用该新编译装配后，另起一次真实运行；只有提问问题和实际标题都按各自独立判据通过，才能进入 Gate 1。当前不需要作者再做 Git 操作或运行验证。

删减轮：读者 3 / 槽位 1 / 半句 2 / 重复 2 / 过程 1 / 黑名单 0

Response ID：`B-T18-general-title-contract-20261029-033824`
Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T18-general-title-contract-20261029-033824.md`
