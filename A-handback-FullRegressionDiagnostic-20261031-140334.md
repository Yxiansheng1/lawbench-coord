# A 线交回：全量回归诊断的有界修改

- 任务令：`D:\Lawbeach\lawbench-coord\ORCH-A-FullRegressionDiagnostic-20261031-140334.md`
- 状态：源码修改已写入，未运行测试。
- 产品代码：未修改。
- Git：未执行任何写操作；未暂存、提交、rebase、stash、reset、clean、checkout 或 push。

## 改动范围

1. `dsh-ext/tests/remote-methods.spec.ts`
   - 保留原有全 UI 文件的 `call(...)` 与 `lb().method(...)` 扫描。
   - 将“由 `const name = lb()` 直接捕获别名”的扩展严格限制为仅处理实际文件 `settings-draft.ts`。
   - 文件名随源码一起携带，不再用合并后的全文件源码执行别名扩展，消除其他词法作用域中同名 `credentialsApi.describe/set/unset` 的误报。
   - 这是有界同文件文本扫描扩展，不是 TypeScript 全作用域分析；未增加硬编码方法名、任意对象别名接受、通用解析器或框架。
   - 源码预检确认 `settings-draft.ts` 只有一个 `settingsApi = lb()` 绑定、共三处引用，未发现同文件同名遮蔽。
   - 既有已知方法哨兵和方法表否定断言均未削弱。

2. `dsh-ext/tests/live-writer.spec.ts`
   - 在既有共享的复制/搬家首轮拒绝断言上增加 `JSON.stringify({ notice, errors })` 诊断消息；该断言仍为 `toEqual(['CASE_MOVED', []])`，四种既有循环生成用例都会复用该消息。
   - 在既有“新建的会话第一轮不误判为位置失效”用例中，复用 `prepare()` 已返回的 `errors`，并在实际失败的模型调用数断言上增加同样的 notice/errors 诊断消息；仍保留原来的 `toBe(1)` 以及后续 `[false, 1, false]` 断言。
   - 未增加模板、原版源码历史、假 NativeR、日志正文、秘密内容、捕获忽略或新运行时插桩。
   - 既有 dirty 中用于本地路线准备的 `LOCAL_TASK_BEGIN_OK` 改动原样保留。

3. `D:\Lawbeach\lawbench-coord\A-handback-FullRegressionDiagnostic-20261031-140334.md`
   - 本交回文件。

## 复用的既有证据

- 原始报告：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\full-regression-contract-tests-replay-current.json`
- 报告时间：2026-10-31 06:01:24 UTC。
- 已知口径：9 个受影响文件，97 个实际用例，68 PASS、29 FAIL、0 pending。
- 扫描器失败为 `expected [ 'describe', 'set', 'unset' ] to deeply equal []`，与跨文件同名别名误报一致。
- 首轮拒绝用例报告为 `expected [ 'CASE_MOVED', …(1) ] to deeply equal [ 'CASE_MOVED', [] ]`，原报告未展开错误项。
- “新建的会话第一轮”实际失败在模型调用数：`expected +0 to be 1`；原报告未给出 notice/errors 内容。

没有重跑旧开工、安装、调研或全量测试，也没有把现有 PASS 当作修改后结果沿用。

## 验证边界与遗留

- 按执行令只交付源码修改，未运行测试、未运行类型检查、未运行构建、未运行导入级或其他写入后自检。
- 当前修改后的实际 PASS/FAIL 数和 live-writer 完整错误内容仍未知；需要主编排按规定选择红测诊断回放及根因审计。
- 指定前置输入 `D:\Lawbeach\lawbench-coord\FullRegressionADiagnosticInput-20261031-140334.md` 实际不存在；协调目录内未找到同名或近似诊断输入文件。本次依据正式执行令及上述既有原始报告完成有界改动，未自行补造输入。
- 根仓整体 `git status` 曾因受限子模块 `.git` 权限拒绝而失败；按要求未修复权限、锁、审批或沙箱，也未把该失败当作产品缺陷。
- 未提交，因此无提交 SHA。
