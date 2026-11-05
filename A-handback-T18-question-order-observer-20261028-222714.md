# A 线交回：T18 问答题顺序观察器

交回状态：**AUTHORED_NOT_RUN**

执行入口：`A-T18-question-order-observer-order-20261028-222714.md`

本交回只处理证据 consumer 的 observer 误判。没有联系其他聊天，没有更换 API，没有启动第二 writer，没有修改产品必问门。

## 结果

旧 consumer 用第一个 `ask_user_question` 与第一个 `case_save_draft` 在工具名数组中的顺序判断，误把已拒绝的存稿尝试算成已保存草稿。实际原生事件为：

- 存稿调用 `seq 31`，匹配结果 `seq 32`，`isError=true`，是已知必问门拒绝，没有保存路径/版本。
- 问题调用 `seq 36`，成功结果 `seq 37`，完整回答 `our_party` / `purpose` / `focus`。
- 首次真正保存成功的草稿调用 `seq 41`，匹配结果 `seq 42`，`version=1`。

新观察器按 callId 关联 call/result，使用实际 seq，严格检查记录的真实回答 IDs/内容、三个必问角色、成功保存路径和正整数版本，并要求 `answerResult.seq < draftCall.seq`。未知错误、缺失/重复/外来结果、部分回答、成功草稿先于回答、草稿调用先于回答结果等均失败关闭。

主流程只替换旧 `askIndex` / `firstDraftIndex` 块，并在报告中增加可选 `questionOrder` 锚点。

## 文件

修改：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts`

- 107449 → 117061 字节
- `4437A994E8990C9179CFF973CF82D6CC70C0A75D444C9E3281BB32BA3637D790`
  → `207CD958EF0D4040396455D80CA6DB377A58517177AEA4FDAE32B4E3BF02AB45`
- LF 保持

新增：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\question-order-observer.spec.mts`

- 11140 字节
- `1A7830DE70C5C8BEF763EF9EA4CE8A8D4AFD8ED3CA74960B5783470E11EB8E9A`

新增证据说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\问题顺序观察器-交付说明-20261028-223405.md`

## 既有证据保全

- 输入 consumer 与修改前工作文件逐字节同源，原 SHA `4437…d79`。
- `actual-native-events.jsonl`：336215 字节，`5A0F499A2C6172D970AF0C0B6A63308D955D907F9F711FB5B931B164E50461D9`。
- 实际最终草稿：6916 字节，`322134603F27217A9F2E486B9DD8B4ED4BF3F365A53FAA236469FA43E024C68B`，与 run `xORN3S` 的 v4 逐字节一致。
- `fixed-inputs.json`：17197 字节，`BD26B55780DB28D3EEB9D47ADC60034EDF76A340A9111EB18D93FB5AF94D253E`。
- `b-service.py`：30634 字节，`AC7CCB2607FFC52C55C1E29BA84E3D6A5F8294937C3F93F3339988762649AB84`。
- 命名 B source pins：53548 字节，`CCB030E6A47D2ECD61852085A990459F0C02ECA982D748F17F00563A4E0C3B5B`。
- 旧 38 项 `manual-reason-observer.spec.mts`：14571 字节，`25ADCBBE8A2A0C061F668FDD23058A3B946D1970639BAA8ADA6775C389D48239`，未改、未运行。
- 原 `report.json` 的 `FAILED`、`question=null` 和错误文本保持不可变。

## 有限测试

新测试尚未运行。测试只提取当前 consumer 的唯一下列顶层纯函数，受限 VM 执行，不导入 consumer；重放不可变实际 70 行事件，并含正常正例和 16 个失败关闭负例。

root 完成全源反向核对后才可运行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\question-order-observer.spec.mts'
```

不要重跑旧 38 项。测试通过后，是否执行一次同原合同的真实流程由 root 判定；如执行，应直接继续目标是 redline 与 JSONL 重开，不从准备工作重新开始。

## 边界与偏离

- 无 Node、Python、TypeScript 解析器执行、测试、自测、collect、prepare、import consumer、编译、安装、HTTP、模型、GPU、GUI、SSH、凭据或产品运行。
- 无 Git add/commit/rebase/stash/reset/clean/checkout/push；无暂存。
- 未改 Skill、生产树、私有输出、B、schema、manifest、旧测试、README、prompt、callback、模型路由、预算、Native、TTY、fetch、redline/OOXML、JSONL。
- 首次 `git status --short --branch` 因子模块 `dsh` 权限失败；按令未修锁/ACL/审批，改用 `--ignore-submodules=all` 只读检查。
- 五次命令误写 `bash` shell 参数，均在执行前被拒绝；一次只读命令误用 `pwsh` 短名并成功；四次本地 PowerShell 解析/替换构造失败且未执行目标动作。所有写入仅经 `apply_patch`。
- `git diff --no-index` 因预期差异返回 1，差异只显示三处批准变更。

运维计数：模型/API/HTTP = 0，Node/Python = 0，测试 = 0，Git 写 = 0，产品写 = 0，runtime 残留 = 0。

Gate 1、完整 T18、业务质量和项目交付均未完成。Packaging 保持 **HOLD**。
