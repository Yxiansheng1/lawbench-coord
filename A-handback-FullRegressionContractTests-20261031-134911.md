# A 线交回：全量回归契约测试输入校准

## 结论

已按正式执行令完成十份指定源码的有界修改：九份测试源码和一份仅限开发/测试的本机伪服务。产品 Agent、Host、UI、契约、Skill、SDK、预算/提示、快照和旧证据均未修改。

本次只完成源码修改与人工源码走查，**未运行任何测试、类型检查、构建或运行时验证**；不能据此宣称任何测试已通过。Git 全程只读，本线未执行任何 Git 命令，也没有提交、暂存、rebase、stash、reset、clean、checkout 或 push。

## 既有状态与复用证据

- 执行令记录的既有官方全量为 1202 PASS、124 FAIL、18 pending（401 suites，361 passed / 40 failed；types 0）。
- 当前失败上下文来自 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\full-regression-A-current.json`，对应根证据目录 `FullRegression-root-20261031-130428`。
- 本轮直接复用上述原始证据，没有重跑旧开工、安装、调研、全量测试或已通过且源码未变的用例。
- Dock fixture 修正按执行令视为另行回收的问题，不把其数字并入当前全量总数。

## 精确源码变动

1. `dsh-ext/tests/case-tab.spec.ts`
   - 唯一一次 `materialsList` 精确对象增加 `include_removed: 'true'`。
   - 主证据：`dsh-ext/ui/materials.tsx:115`。
   - 保留：一次调用计数、整对象全等、UI 文案、成果顺序与案件隔离断言。

2. `dsh-ext/tests/source-tab-lifecycle.spec.ts`
   - guide 期望改为 `CASE, DOCUMENT, SEARCH`，并补公开检索页签注册及 slot 可达性检查。
   - 默认仍只打开案件、文稿两页；默认 opened/layout 两条精确断言未改。
   - 主证据：`dsh-ext/ui/index.tsx:381-399`，其中 394-396 只让公开检索进入 guide。

3. `dsh-ext/tests/t35-prompt-refine.spec.ts`
   - 取消能力从旧的“仅 promptRefine”改为精确四项；四项逐一断言 `{ parameter: 'signal' }`，其余全部断言 undefined。
   - 描述表实际顺序为 `documentPreview, webSearch, webFetch, promptRefine`，测试按该顺序锁定。
   - 主证据：`dsh-ext/ui/remote.ts:28-31`。
   - 保留：promptRefine 路由、契约请求、Host 原型、request-only 业务形参、动态 signal 传递及槽登记断言；`getSettings` 未被加入取消集合。

4. `dsh-ext/tests/loop-fuses.spec.ts`
   - 能力段总数锁定为四项；前三个名字仍精确为案件卡片、任务输入、能力边界，第三段正文仍整段等于 `CAPABILITY_TEXT`。
   - 第四个“本次任务 Skill”段按当前现有 fixture 锁定精确名字与正文。
   - 主证据：`dsh-ext/agent/index.ts:351-364`。
   - 保留：全部能力边界短语、后续步骤不再注入及原有熔断/预算/提示断言。

5. `dsh-ext/tests/sentence-workflow-gate-20261029-215838.spec.ts`
   - 八类 Skill 循环中，只有 `LITIGATION_DOCS_SKILL` 和 `GENERAL_DRAFTING_SKILL` 期望相同的先问后读拒绝；其余六类继续期望读取放行。
   - 主证据：`dsh-ext/agent/index.ts:337-340, 496-501`。
   - 保留：六个其它 Skill 的 allow、NONE、calc/default sentence workflow、保存门和标题/注释更新。

6. `dsh-ext/tests/doc-revise-question-gate.spec.ts`
   - 新增 `contract-draft` 真实目录解析，精确键为 `our_party, doc_scope, deal_terms`。
   - 覆盖答复前的草稿与修改清单拒绝、真实问题覆盖后 `observeToolResult` 解锁，以及解锁后仅一次写入。
   - 保留 `contract-review` 正向；零需求对照改为 `criminal-reading-notes` 和 `null`，不继承答案、旧结果、错会话、畸形目录等原断言保留。
   - 主证据：`dsh-ext/agent/index.ts:115-125, 233-248, 320-341, 509-514, 548-580`；`skills/contract-draft/SKILL.md` 的必问节。

7. `dsh-ext/tests/remote-methods.spec.ts`
   - 界面调用扫描扩展为：对每个 UI 文件，仅识别由 `const <alias> = lb()` 直接捕获的同一 API 身份，并扫描该 alias 的直接方法调用。
   - 未硬编码 `called.add('putSettings')`，未接受任意对象或类型声明调用。
   - 主证据：`dsh-ext/ui/settings-draft.ts:75-88`。
   - 保留：已知方法 sentinel（含 `putSettings`）和“每个调用都在方法表中”的反向零漏项断言。

8. `dsh-ext/tests/agent.spec.ts` 与 `dsh-ext/dev/fake-service.mjs`
   - 伪服务新增显式 `--local-route`，仅在成功 `task/begin` 的本次响应投影 `route: 'local'`；无开关时仍原样返回契约样例。
   - `agent.spec.ts` 的三个 `startFake` 调用全部传该开关。
   - 原始 `contracts/examples/core_task_begin.res.json` 未改；task/skill/params/budget/scope 未改。产品代码无 local 绕过。
   - 主证据：`dsh-ext/agent/index.ts:270-341`；原样例 `contracts/examples/core_task_begin.res.json`。
   - 保留：完整对话、CASE_MOVED、TASK_SHEET_FAILED、预算、白名单、取任务失败、清理旧通知等原断言。

9. `dsh-ext/tests/live-writer.spec.ts`
   - 仅对测试内 `TASK_BEGIN_OK` 做克隆，并把克隆值的 `route` 设为 `'local'`；原始样例、skill/params/budget/scope 均不变。
   - 主证据：`dsh-ext/agent/index.ts:290-331`；原合同样例当前声明 external。
   - 保留：原文件哈希、无模型调用、无错误、旧/新位置不写、flush、重启后续写等全部断言。

10. `dsh-ext/dev/fake-service.mjs`
    - 上述开关同时补充了开发期使用说明，默认分支保持不变。

## 保存级别与保留边界

- 所有修改都停留在测试输入或测试伪服务层；没有为了变绿而修改产品实现、契约或 Skill。
- 没有新增 skip、filter、timeout、空响应或 blanket `arrayContaining`。
- 没有放宽错误码、CASE_MOVED、问题门、预算、能力边界或文件哈希断言。
- 没有修改快照目录、`source-before.json`、旧原始证据或提交历史。

## 未运行与需 Root 独立验证

测试影响面如下，均**只改未跑**：

- `case-tab.spec.ts`
- `source-tab-lifecycle.spec.ts`
- `t35-prompt-refine.spec.ts`
- `loop-fuses.spec.ts`
- `sentence-workflow-gate-20261029-215838.spec.ts`
- `doc-revise-question-gate.spec.ts`
- `remote-methods.spec.ts`
- `agent.spec.ts`
- `live-writer.spec.ts`

建议 Root 按执行令先做十文件 delta/原始字节反向审阅，再跑上述精确受影响用例与类型检查；本轮不代表全量、类型或发布已通过。

## 遗留与源级观察

1. `loop-fuses.spec.ts` 当前任务的 `task/begin` fixture 没有声明 `skill`。产品代码用 `selectedSkill !== null` 判断，因此实际追加第四段，正文含 `undefined`。执行令禁止改变该 mock Skill，所以测试锁定的是当前真实输出；这是否应改产品判断为 `!== null && !== undefined`，留 Root 裁决，本线未改产品。

2. `live-writer.spec.ts` 仍是用既有 `user()` 消息和直接 follow-up 的 legacy 单元路径；该消息 source 只有 `{ kind: 'user' }`，没有原生 `rpcId`，所以 `requestIdFromMessages` 不产生 request_id。未伪造 request_id 或 Native submission history；本轮不证明新的 NativeR 原生提交覆盖。

3. `contract-draft` 的当前产品语义是读取材料可以由 Skill 指导先行，只对成果写入启用已答门。测试因此覆盖了真实 resolver 加载、保存拒绝和真实答复后的解锁，没有伪造“读取拒绝”；应在 Root 复核时与执行令中“load+save”措辞对照。

4. 本轮无运行时结果，不宣称任何失败已转绿，也不宣称剩余 124 FAIL 已全部消解。与十文件无关的既有环境缺失/套件错误仍以原始 JSON 为准。

## 运行器与阻碍记录

- 所有实际读取、检索和写入均使用指定 Windows 路径；没有启动 setup、legacy、Bash 或替代 shell 执行任务命令。
- 有四次只读工具调用误填 `bash` shell，运行器分别以 `BASH/E_ACCESS_DENIED` 或 MXC packaged-app 错误拒绝；这些调用均未执行、未产生源码读取或文件变化。随后改用指定原生 PowerShell，未扩权、未改审批/ACL、未拆 writer 锁。
- 有一次只读检索使用短名 `pwsh` 并成功执行；之后恢复为指定绝对 native PowerShell。
- 无 Git 写入；无 index.lock/权限问题需要修复。
