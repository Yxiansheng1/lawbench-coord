# 受限排队兼容修复源码交回

结论：允许范围内的源码修复已经写入，旧的异步准备契约得到恢复；当前交付状态为 `SOURCE_ONLY / ROOT_RUN_PENDING`。类型检查和运行结果仍以根侧独立执行为准。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 把受限值从异步准备阶段移到最终同步接纳阶段；恢复 `Promise<void>`，保留同 R 排队限制、受限插话拒绝、未知值拒绝和一次失败清理；拆出窄化受限消息来源，保留旧消息来源声明形状。 |
| 目标是什么 | 保留材料限制与普通消息控制，同时让旧竞态断言、原生标识和客户端类型兼容。当前只到源码交付，尚待根侧真实类型检查与分组运行。 |
| 在等什么 | 等根主编排审阅源码和累积补丁，再独立运行类型检查、UI19、paired2、admission2、policy/registry、identity4、selected legacy 与 disposal。信号是实际退出码和分组读数；信号到达后由根侧判断合流。 |
| 卡在哪 | 当前不卡。执行边界禁止本执行者运行测试和类型检查；`dsh` 子模块的 Git 管理路径读取被拒，因此完整内层状态无法读取。目标文件改用前后哈希核对，未改权限、ACL、锁或沙箱。 |

## 依据与验证

- 证据正文：[README.md](D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ScopedQueueCompatibilityFix-20261026-193241/README.md)
- 累积补丁：[P-29-scoped-queued-delivery-policy.patch](D:/Lawbeach/lawbench-A/dsh-patches/P-29-scoped-queued-delivery-policy.patch)
- 修复前源码索引：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedQueueCompatibilityFix-20261026-193241\source-before.json`
- 原版基线：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedQueuedSteerFix-20261026-175219\before\lawbench-A`
- 根失败证据：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ScopedQueueFixed-root-20261026-192810\`
- 累积补丁 SHA-256：`B282ECDC045C31D5001159D4B6EDE5E0C241AF4471E9CFADB0EDB3434123785A`
- 补丁结构：6 个 native 文件头，31 个 hunk。
- 静态签名扫描：旧 `prepare` 限制返回和旧 `admit(): void` 形态零命中，exit 1。
- 静态类型扫描：旧 `user-rpc` 可选限制声明零命中，exit 1；受限来源为必填限制的独立映射键。
- 空白检查：7 个改动文件的 textdiff 均为预期 exit 1，空白问题数为 0。
- 保留文件：客户端契约与会话实现两个文件的当前哈希与修复前快照相同。
- 继承读数只用于对照，不冒充当前运行：修复前 paired2 为 2/2、admission2 为 2/2、policy/registry 为 4/4、identity4 为 4/4、selected legacy 为 6/6、disposal 为 1/1；UI19 为 17/19，类型检查 exit 2。

## 未做与降级

- 未运行 Node、Vitest、tsc、Python、pytest、parser、AST、collect、selftest、build、gitapply、prepare、serve、probe、GUI、HTTP 或模型。
- 未重跑旧开工、安装、调研、全量测试或冻结测试。
- 未生成提交 SHA。Git 写入不在本次授权内，且不是交付阻碍。
- 未宣称当前源码测试通过、进程清理结果或 GUI 结果。
- 未修改冻结测试、old7 补丁、old lib、tsconfig、skipLibCheck、loader、公共 schema、B 源码或打包配置。
- 执行中有 17 次 shell 参数误写为 `bash`，均在执行前被 MXC 拒绝，exit 1，无文件或状态变化；没有启动 setup 或 legacy。

## 下一步建议

根主编排先审阅证据正文和累积补丁。随后按既有根运行流程独立执行类型检查与各测试分组；收到真实退出码和分组读数后，由根侧决定合流。本执行者停止，不再运行或改写。

删减轮:读者 2 / 槽位 1 / 半句 3 / 重复 1 / 过程 1 / 黑名单 2

Response ID: `T31-scoped-queue-compat-fix-20261026-193241-A`

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T31-scoped-queue-compat-fix-20261026-193241.md`
