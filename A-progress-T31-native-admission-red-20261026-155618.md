# A Progress — T31 Native Admission Red

更新时间：2026-10-26T16:08:47+08:00  
状态：`SOURCE_HANDED_BACK / NOT_RUN`

- 已读正式执行令与 `source-before.json`，核对 8 个基线源码/测试哈希，均未变化。
- 已新增指定测试
  `dsh/packages/api/session-controller/tests/t31-material-admission.client.spec.ts`，
  覆盖 prepare 成功、nextPaint 前取消并重建批次，以及 nextPaint 前改选两个窗口。
- 测试使用真实原生 `Session.beginSubmission()` / `Session.prompt()` /
  `SessionCommandController` / `ReactLoopInbox` / `Agent.followup()`；
  `beginSubmission` 仅透传 spy。材料 `materialsList` / `requestScope` 是窄合成
  契约 responder，不宣称真实后端或模型。
- 根侧预期：当前产品源码应在两个用例的旧 R 不得 prompt/queue、旧 R 释放及
  新 R 重试断言处产生有意义红测。
- 未运行任何 test/tsc/parser/build/HTTP/GUI/model；没有修改产品源码、旧测试、
  配置或 B 侧文件。
- Git 严格只读；顶层 `git status` 因 `dsh` 子模块元数据权限被拒，按令未修复。
- 正式交回和证据 README 已落盘。`QueuedR2 -> steer -> R1` 与 GUI 仍未验证。
