# B-T18 修改稿输入保真复核 findings（2026-10-29 02:51:44）

## 结论

**未确认产品代码缺陷。** 两份已选前序输入都已在首轮 L1 快照中完整投递给模型；实际模型只对输入 1 调用了 `case_read_input(index=1)`，没有调用输入 2。律师本轮明文要求两份都实际调用工具读取，因此本次失败应分类为 **模型 instruction-following / capability boundary FAIL**，不是适配器丢字段、传输失败或保存门禁误判。

**T18 仍不通过。** “合同第七条”没有精确改成目标“4.1”，只是正文中改成了上位“合同第四条”；这是与输入读取失败相互独立的 factual quality FAIL。`citation_check.passed=true` 只表示没有 must-fix，不表示业务质量通过。

本次只做只读审计；产品、测试、fixture、Skill、consumer、运行参数与 pins 均未改。Package 状态继续 **HOLD**。

## 输入与边界

- 正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-doc-revise-input-fidelity-review-order-20261029-025144.md`
  - 4246 bytes
  - SHA-256 `feaa11719cab3aac2877709b1f242b55702eaec4892d09907fa16107436a1b07`
- 唯一输入目录：`D:\Lawbeach\lawbench-coord\T18DocReviseInputFidelityReviewInput-20261029-025144`
- 实际源码使用 A 线绝对路径；没有把 B 树里的旧 agent 副本当现行源码。
- 只读取既有的固定合成运行 `run-DDLgyK`；没有新跑模型、工具、HTTP、GUI、构建或测试。
- B 线 dirty 保全快照：`T18DocReviseInputFidelityReviewInput-20261029-025144\B-dirty-before.txt`
  - 737334 bytes
  - SHA-256 `659fe09f0c4db2eaa96b77799963639b3caa76ce1ff4636a3281bf59ac5701a4`
- 本次唯一写入面是本文件与 `B-handback-T18-doc-revise-input-fidelity-20261029-025144.md`。

## CONFIRMED

### C1. 任务持久化了两份正确的已选输入

实际任务 `T-20261029024515-5073` 的 `task.json` 第 10-27 行记录：

| index | title | path/version | sha256 |
|---|---|---|---|
| 1 | 合同审查意见 | `工作区/任务/T-20261028234100-6b49/草稿/合同审查意见-v2.md`，v2 | `1b095356f48c4a7ae9e94bd171c92377385d70ff3730c59fcb50f26822cba31d` |
| 2 | 出稿前审查-合同审查意见 | `工作区/任务/T-20261029012044-5869/草稿/出稿前审查-合同审查意见-v4.md`，v4 | `b01af533b523c9752a84fd3801d3de1cfd46db5fb75642888aaa6bad493abe2f` |

主路径：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocReviseClauseRuntime-20261029-024101\run-DDLgyK\case\工作区\任务\T-20261029024515-5073\task.json:10-27`
- 服务建单时从界面路径生成并持久化 `index/title/path/version/sha256`：`D:\Lawbeach\lawbench-A\service\lawbench\case\task.py:115-130,141-153,234-269`
- `task/begin` 按当前待执行选择复制成执行中任务，不消耗、不删除选择：`task.py:234-269`
- 输入引用契约要求五个字段齐全：`D:\Lawbeach\lawbench-A\contracts\common.schema.json:507-543`

运行报告还独立观察到 selection 的两个输入路径、任务绑定和服务端 `/core/task/begin` 一次：

- `run-DDLgyK\report.json` 的 `bService.final.protocol.selectionInputs`、`taskIds`、`counts`。

### C2. 输入 2 没有在 L1 构建或 Host/Agent 适配层丢失

阶段 2 的实际 `lawbench-context` 用户消息位于 native event **seq 120**。该消息正文和 `source.sections["任务输入（L1）"]` 各出现一次“输入 1”和“输入 2”（同一快照正文与其 source 镜像各两份），且没有“未放入 L1 的输入”toc 段。

最小实测片段：

```text
## 任务输入（L1）

## 输入 1：合同审查意见
...
## 输入 2：出稿前审查-合同审查意见

# 出稿前审查：合同审查意见
...
```

紧接着：

- seq 121：律师阶段 2 指令；
- seq 122：实际模型请求头。

主路径与源码映射：

- `run-DDLgyK\sessions\...\session-1cb28369-3a90-46dc-b047-e64986038394\session.v4.jsonl`，第 122 行，event seq 120。
- 服务按 token 预算把能放下的前 k 份整份内联，其余才进 toc：`D:\Lawbeach\lawbench-A\service\lawbench\case\context.py:69-96`。
- `/core/context` 直接以持久化任务构建 L0/L1：`D:\Lawbeach\lawbench-A\service\lawbench\api\core.py:20-22`。
- Agent 把 `l1.text` 原样放进“任务输入（L1）”，只在 `l1.toc` 非空时另放目录：`D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts:325-339`。
- Host 只向 Agent 提供本地服务和令牌；不重写 context/input：`D:\Lawbeach\lawbench-A\dsh-ext\host\index.ts:1-3,1012-1026`。
- `CoreClient` 对请求/响应做契约校验后直接转发 `/core/*`，没有字段裁剪：`D:\Lawbeach\lawbench-A\dsh-ext\shared\core-client.ts:20-71`。

实测没有传输异常：运行报告为 6 次模型 POST、6 次 HTTP 200、0 denied；服务只记录一次 `/core/context`，三条业务工具调用都返回成功。

### C3. 实际模型明确忽略了“两份都 actual tool read”的指令

律师指令逐字写明：

> 请实际使用 case_read_input 读取上述两份前序成果，并用 case_read_material 回读合同相关段落。

主路径：

- `T18DocReviseInputFidelityReviewInput-20261029-025144\continue-genuine-doc-revise.mts:80-81`
- native session 第 123 行，event seq 121。

阶段 2 的完整 tool chain：

| seq | tool | 实测结果 |
|---|---|---|
| 124 | `skill` | doc-revise 成功，结果含新层级规则 |
| 129 | `ask_user_question` | draft/opinions 一次问完并成功 |
| 134 | `case_read_input` | `{"index":1}`；结果 `start=1,end=105,has_more=false`，与输入 1 全文逐行一致 |
| 139 | `case_read_material` | 回读《采购合同》第 22 段附近，成功 |
| 144 | `case_save_draft` | 保存 v1，成功 |

阶段 2 内 `case_read_input(index=2)` 调用数为 **0**。主路径：

- native session 第 136 行，event seq 134。
- native session 第 137 行，event seq 135。
- native session 第 141 行，event seq 139。
- native session 第 146 行，event seq 144。
- 工具计数汇总见输入目录 `T18-doc-revise-clause-actual-root-closed-current.json` 的 `actual_tool_counts.case_read_input=1`；`run-DDLgyK\report.json` 记录同一失败与运行边界。

因此输入 2 已经送到模型眼前，但模型没有执行律师指定的读取动作。该事实不能用“输入未投递”解释。

### C4. 当前产品没有“已选前序输入必须全部/部分经工具读取”的机械完成要求

结论是：**none（产品路径没有 all/partial 读取完成条件）**。

证据：

1. `TaskState` 只跟踪预算、草稿、规则熔断、必问项和草稿反馈；没有已选输入集合、已读 index、分页覆盖等字段：
   - `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts:74-111`
2. `preTool` 只做工具白名单、必问门禁、预算/重复调用/收尾检查：
   - `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts:417-487`
3. `executeTool` 只在成功保存草稿时设置 `draftSaved` 和出处反馈，不登记 `case_read_input` 结果：
   - `index.ts:510-530`
4. `case_save_draft` 服务实现只核对任务仍 running、版本号、写入、出处核对和材料 coverage；没有核对任务 inputs：
   - `D:\Lawbeach\lawbench-A\service\lawbench\tools\drafts.py:38-62`
5. `reads.json` 的读取记录仅属于材料覆盖；`case_read_input` 不进入该记录：
   - `D:\Lawbeach\lawbench-A\service\lawbench\case\task.py:55-62,250-275,382-389`
   - `D:\Lawbeach\lawbench-A\service\lawbench\tools\inputs.py:33-44`
6. 任务结束只写 reason、usage、材料和草稿 coverage，不检查前序 input 的工具读取：
   - `task.py:505-537`

### C5. 通用 PRD/Spec/Skill 契约允许“已内联即直接使用”，并不普遍强制再调工具

关键原文：

- PRD `F-ENT-02`：“后一步可以直接选用前面的成果（包括其他胶囊的成果，例如辩护词起草选用案卷分析的笔录），不用复制粘贴。”
  - `D:\Lawbeach\lawbench-A\docs\src\PRD.md:271`
- PRD `F-SKILL-08`：“Skill 之间靠‘上一步的成果作为下一步的输入’串联”。
  - `PRD.md:243`
- Spec：“L1 任务输入：任务单选用的前序成果和 wiki 分节……超出的只列目录，由 AI 用 `case_read_input` 分段读取。”
  - `D:\Lawbeach\lawbench-A\docs\src\Spec.md:899`
- 工具表对 `case_read_input` 的用途明确写“L1 放不下的输入用它读”：
  - `Spec.md:486`
- 契约描述：“分段读取任务单选用的第 index 个输入（L1 放不下时用）”。
  - `D:\Lawbeach\lawbench-A\contracts\tools\case_read_input.schema.json:5`
- doc-revise Skill：“L1 放不下时只列目录，用 `case_read_input`……分段读完整份草稿。”
  - `D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md:22`

所以不能把“所有已选输入都必须调用工具读取”写成未声明的通用产品契约。相反，本轮 acceptance 要求 index 1、2 都实际读取，权威来自律师本轮明确、具体、可执行的指令，而不是通用契约。

### C6. consumer 的 all-index 门禁是忠于本轮指令的测试判据，不应弱化

`continue-genuine-doc-revise.mts:2767-2785` 要求 index 集合恰为 `[1,2]` 且两份逐行全覆盖；`2787-2797` 再核对两份实际文本特征。该判据与 `STAGE2_PROMPT` 的双读明文一致。

它不是产品运行时门禁，也不能被解释成通用业务需求。当前失败直接发生在该 exact-instruction oracle，而不是 transport/product layer。没有修改、削弱或替换测试谓词。

### C7. 新层级 Skill 规则确实已交付且被执行上下文可见

- B Skill：12189 bytes，SHA-256 `23b048df3ceeb8948e9a14dbc3c1e8031e98158908fb9421f30de5f875d1fccf`。
- `skill` 实际结果：seq 125，结果 SHA-256 `208975cef032159751ecefc11be46b7817c0e0e250b71b209afe90b4f16f423e`。
- 实际结果含：“条款与层级引用必须回原件核准……应指向原稿所描述的实际具体条款，不能只写其所属章、节等上位标题。”
- 原始 accepted 记录：`run-DDLgyK\T18-doc-revise-clause-level-root-accepted-current.json` / 协调输入副本同名 JSON。

因此本次不是“新规则没送到模型”，而是模型在收到新规则和显式双读指令后仍未精确执行。不要再用同源 prompt variant 或同源重跑掩盖边界。

### C8. “第七条→4.1”的精确质量失败仍成立

实际草稿：

- path：`run-DDLgyK\case\工作区\任务\T-20261029024515-5073\草稿\合同审查意见-修改稿-v1.md`
- 9170 bytes
- SHA-256 `cd8f3cf84f8af1be413e0764798f076c2c91ba91f0f1f026e8b344b1e5c924bb`

定点核对：

- `合同第七条` 出现 0 次。
- `合同第四条` 出现 1 次，位于第 44 行：`若按合同第四条执行……`。
- `4.1` 出现 2 次，位于第 43、46 行。
- 实际未达到“第七条精确改为 4.1”；只把上位“第四条”放进说明性正文，删除了原第七条字样。

运行记录同时明确：

- `exact_seven_to_4_1_rest_bytes_equal=false`
- `business_quality_all_PASS=false`
- citation check 为 `passed=true, must_fix=0, hints=11`

因此 citation gate 通过不代表业务质量通过；这是第二个独立的 FAIL。

## INFERRED

### I1. 失败原因是模型没有遵守显式过程指令

由 C2、C3、C6、C7 可以推断：模型已看到两份 input、明确指令和新 Skill 规则，但选择了 `case_read_input(index=1)` 后直接保存，跳过了 index 2 的显式读取。可观察证据只能归到 instruction-following/model-capability failure；无法从原生会话证明模型内部为何这样选择。

### I2. 若未来决定把“必须读取”升级为产品硬约束，现有没有无契约变更的最小插入点

Agent 能观察 `tool/call`/`tool/result` 并可在 `TaskState` 记录 index，但当前 `BeginValue` 不暴露已选 inputs，L1 response 也没有 machine-readable “must-read” 清单；因此当前没有既能区分 inline 输入与 explicitly-must-read 输入、又不猜测文本的现成产品 seam。

这不构成本次要求实现的理由。若 owner 以后明确要求 product-enforced read policy，应先走契约流程，最小方向才可能是：

- `/core/context` 暴露 selected input index/title 与 per-turn read policy；
- `TaskState` 持有 task-owned selected indices 与已完整读取集合；
- 在现有 `tools/result` 观察点登记成功 `case_read_input`；
- 在现有 `preTool`/`executeTool` 的 `case_save_draft` 写入谓词处合并检查；
- 覆盖 task/session/case 身份、取消、重试、迟到结果和 pagination。

当前没有这样的契约，因此不应凭本次失败新增 Map、store、generic framework、NLP、rewrite、UI 或硬编码条款 4.1。

## UNRESOLVED

1. **模型为何忽略显式指令**：只能确认结果，不能从黑盒 native log 推断内部原因。
2. **T18 全质量是否可过**：未重跑，且既有报告已明确 `business_quality_all_PASS=false`；production JSONL reopen 仍为 `NOT_REACHED`。
3. **Git 全量 dirty 可视性**：只读 `git status` 在 submodule `dsh` 遇到目录权限拒绝；`--ignore-submodules=all` 又出现超长路径 warning。未修权限、未改锁，也未执行任何 Git 写命令。dirty 原样保留。
4. **未来产品硬门禁验证**：本令禁止实现和测试，故没有也不声称有未来门禁的红绿证据。

## 下一步具体动作

1. 在 T18 台账中把本次运行保留为 **explicit-read instruction-following FAIL**；不得把 `citation_check.passed=true`、B 服务通过或输入已投递写成 T18 PASS。
2. 保留独立的 **7→4.1 precision FAIL**；不能因前序读取问题分类清楚而关闭质量项。
3. 不重发同一 Skill prompt、不换 API、不做同源模型重试。要满足原 18 Skill T18 goal，下一步需要能力足以执行显式过程指令的模型/执行资源，或由 owner 明确改变验收策略。
4. 当前不实施代码修复；Packaging 保持 HOLD。若 owner 决定产品化 enforced-read，再按 I2 先定契约，后接最小 state seam。

## 源码与证据 pins

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` | 46243 | `d21dd7be6bc1fcb561063f259c2ad2e8d8714679f57982608823f5a896b1a5b0` |
| `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts` | 21264 | `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b` |
| `D:\Lawbeach\lawbench-A\service\lawbench\case\context.py` | 5231 | `8252a25cb7198f6914b7345bd087402b27b4a8b15e3fda8fbec4327e2f831549` |
| `D:\Lawbeach\lawbench-A\service\lawbench\case\task.py` | 31562 | `9efc7bd899c40ef4641816bb340c1e50b2b742b0ac3d8fcde15cd21a25d37f2f` |
| `D:\Lawbeach\lawbench-A\service\lawbench\tools\inputs.py` | 3145 | `aa96eea8647165ab6494690b69081aeeaf0c5ebb3efbbe8937ec4b359d3b089f` |
| `D:\Lawbeach\lawbench-A\service\lawbench\tools\drafts.py` | 4632 | `cce94cb8b0d4ce7d069a390f16978680a970b27ccb57fe2a7a51f0bf9b3f8d2b` |
| `D:\Lawbeach\lawbench-A\contracts\core\context.schema.json` | 5197 | `778e77caa5110464c093fb33b5064c4ee4a4dd87433d4598dd5ab7089b21f0c7` |
| `D:\Lawbeach\lawbench-A\contracts\tools\case_read_input.schema.json` | 1735 | `8b6eedeb68d38dafa79ec180f77e65283b4446708b1abdd4398060e0663413f3` |
| `D:\Lawbeach\lawbench-A\contracts\common.schema.json` | 17837 | `46a8ac7b6c7017684d2667f4d622bb65577b29691b3f4121a20de02a6e5cb445` |
| `D:\Lawbeach\lawbench-A\docs\src\PRD.md` | 52403 | `f5851cd815b7db69a539b4b9ec36883d3e9664d42ca483b09f9486fac45c5794` |
| `D:\Lawbeach\lawbench-A\docs\src\Spec.md` | 199684 | `edc6b4d47fd3d100831eba736b8efd8bf061604674319da49dd6ff74d1ad2bcc` |
| `D:\Lawbeach\lawbench-A\docs\src\业务编排.md` | 17014 | `983be9cd78a53292c63de8c6795197110826330d086315821b7a79a9cc99026c` |
| `D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md` | 12189 | `23b048df3ceeb8948e9a14dbc3c1e8031e98158908fb9421f30de5f875d1fccf` |
| `T18DocReviseInputFidelityReviewInput-20261029-025144\continue-genuine-doc-revise.mts` | 123980 | `a6164ab06a15ec0254ccc31dde9ea6ad286186d323899fdfa8b147a25c7e46dc` |
| `run-DDLgyK\report.json` | 27440 | `9dc8f50ef7d414e0c1a69e1f7beb0d9d6f2788345bda0d074717993537261d4c` |

## 执行审计

- Author/product/model/test/HTTP/GUI/SSH/runtime starts：**0**。只读取既有 `run-DDLgyK` 证据。
- 写完 findings 前的只读 PowerShell 审计命令：**64**；写后文件/内容校验命令：**3**；合计 **67**；nonzero：**10**。
- 写入面：**2 个新文件**，即本 findings 和正式 handback。
- 未运行 Node、Python、parser/AST、import、tsx、test、build、model、HTTP、GUI、SSH、Key/DPAPI 或生产进程。
- 未执行任何 Git 写命令：无 add/commit/rebase/stash/reset/clean/checkout/push。
- 未改 sandbox、审批、ACL、writer lock 或权限。

nonzero 原因：

1. 普通 `git status --short --untracked-files=all` 因 submodule `dsh` 目录权限拒绝而 exit 1。
2. 一次在 `dsh` 中搜索 `TaskState` 无命中，rg exit 1。
3. 一次误以 bash 启动只读 `rg`，在命令执行前 access denied。
4. 一次误以 bash 启动只读 `Get-ChildItem`，在命令执行前 access denied。
5. 一次误以 bash 启动只读文档范围读取，MXC 拒绝 packaged bash。
6. 一次误以 bash 启动只读事件映射，在命令执行前 access denied。
7. 一次误以 bash 启动只读事件映射，在命令执行前 access denied。
8. 一次误以 bash 启动只读 index=2 检索，在命令执行前 access denied。
9. 一次误以 bash 启动只读 CoreClient/Host 检索，在命令执行前 access denied。
10. 最后一次 Host 组合检索因不存在的 `host\remote.ts` 返回 exit 1；其余已读取内容有效。

上述 7 次 bash 均为误指定 shell，均在执行目标命令前被平台拒绝；没有发生读取、写入、联网或状态改变。其余实际只读命令均使用规定 native pwsh。
