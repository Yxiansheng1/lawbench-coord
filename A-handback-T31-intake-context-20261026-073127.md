# T31 intake fixture 上下文对齐交回件

日期：2026-10-26  
执行线：A  
执行令：`D:\Lawbeach\lawbench-coord\T31-intake-context-order-20261026-073127.md`  
状态：实现完成，等待根独立复跑与类型验证；本文件不宣称测试通过。

## 交付

唯一源码改动：

- `D:\Lawbeach\lawbench-A\dsh-ext\tests\intake.spec.ts`

改动内容：

1. `fakeCtx.inject` 按注入依赖路径名册判断服务是否存在。只有依赖齐全的块才执行；`remote.credentials`、`remote.settings`、`conversationSubmission` 缺席时，对应块保持不出现，与 `ui/index.tsx` 的实际 `apply` 行为一致。
2. `fakeCtx.effect` 保存当前注入块登记的清理函数；块 dispose 时逆序执行，并防止未启动的注入块在 dispose 后继续运行。
3. `conversationFileIntake` 与 `chatInlineMarks` 的测试登记器在释放时回减计数。原“各登记一次”断言保留，并增加释放后计数归零断言。
4. 原有九个测试场景与断言均保留；两个原生目录绑定场景及其断言未改动。未添加生产实现绕过、跳过测试、全局错误抑制或 Vitest 配置修改。

## 基线与脏状态

- Git HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 修改前目标文件 SHA256：`79D066B77FADB408CD205082EB08BCC83CE9269E734E7DDE3D1BB7EB8BCB8D43`
- 修改后目标文件 SHA256：`476C228F64214583DE71A9E695B6FB2883EF8DBBD516C9705BCBA8E8AFE4707C`
- before 快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31IntakeContext-20261026-073127\before\intake.spec.ts`
- 工作树原有大量 dirty 内容已保持；未使用 stash、checkout、reset、clean、add、commit、rebase 或 push。

## 证据与复跑边界

- 原始失败证据：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31IntakeContext-20261026-073127\root-new-errors.txt`
- 该证据记录 4 次 `apply` 各触发 3 个未处理拒绝，共 12 个：凭据服务、设置服务、材料提交注册器缺席。
- 复用既有根结果：intake 9/9 断言通过但 Vitest exit 1，因此旧结果不是进程 PASS。
- 本次按执行令未运行 parser、Vitest、tsc、collect、build、prepare/start/serve、probe、GUI、HTTP、model、network、selftest 或 install。
- 已执行只读 `git diff --check --ignore-submodules=all -- dsh-ext/tests/intake.spec.ts`，退出码 0。

## 根待办与遗留

- 请根独立复跑受影响 intake，再复跑类型检查，确认 12 个 unhandled rejection 消失且九个场景为进程级通过。
- 本次为单元回调契约的最小内存替身，不构成 GUI、真实原生提交或实际凭据/设置服务验收。
- 可选凭据、设置和材料提交块仍按依赖缺席处理，不在本次最小上下文中启用。
- Packaging 保持 HOLD。未遇到需要修复的 Git 写权限、index lock 或沙箱审批问题，也未尝试改变这些边界。
