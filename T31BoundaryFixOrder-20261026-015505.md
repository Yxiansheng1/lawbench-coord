# T31 原目标：根据 root 真实红证据修产品，不削弱断言
用户继续授权；有目的推进，不设人为工时/命令/文件数量上限。只有 A 树本作者，B 在独立树按固定四 schema 接后端，故本单不能更改公开契约字段或两线协议。不要发送跨聊天消息。

先完整读本令，然后准确输入：
- C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247\root-findings-current.md
- C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247\root-red-20261026-015234\stdout.txt 和 stderr.txt（root 实跑7条：6红1绿，exit1）
- C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247\native-registry-red-20261026-015311\stdout.txt 和 stderr.txt（真实注册器新用例1红，31跳过，exit1；失败是 first.failed 调用0，非夹具挂载错误）
- A-交回-T31BoundaryRed-20261026-014531.md（本目录）
- dsh-ext/ui/material-batch.ts / .tsx / state.ts / cases.ts；两个 material-batch 测试
- dsh/packages/client/ui-conversation/src/client/apply.ts 与 service.ts；tests/service-orchestration.client.spec.ts 的真实注册器末尾测试。
root 已保全当前源与测试到 C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247\boundary-before-fix-20261026-015505。所有旧 dirty 不清理，不回滚其它改动。

目标仍是导入选根真实当前全部 material_ids → 下一问默认本批且可取消改选 → 原生 Session.beginSubmission 唯一 R，固定作用域与幂等/隔离。不是增加新需求。修正以下已实测失败：
1. 不得以共享 ref_id 把可靠位置在选根外或无法证明属于选根的材料混入。root 红实收 M0001/M0002/M0003，应只 M0001。保留目录已有成员（不是只增量）与真实 location/rel_path 的准确解析。不能为了过红退回只导入增量。
2. 导入已成功但 materialsList 失败或本次成员空，要在该 session+case 留明确可见且可取消/重新导入恢复的阻断状态，下一次 prepare 必须失败，不能清空 batch 静默全案。当前两个红中 promise resolved undefined。原普通未导入/明确取消仍可正常无scope，不用一个全局死锁。不要清掉正在使用的旧 R 或其它会话状态。
3. 在异步 scope prepare 开始前占用该 session+case，避免不同 R 并发穿透。相同 R 并发重入共享同一 Promise 成功或失败，不重复请求；失败后正确释放本地占用/服务已准备状态，使明确重试可用；不同会话并行互不误锁。不能用延时/轮询/单全局锁凑断言。accepted 只消费对应批次，await期间导入的新 batch 不丢；failed 保留待重试批次。处理 prepare 响应异常/throw，不静默放大全案。
4. 原生 lifecycle 某后注册 hook.prepare 抛错，前面已成功 prepare 的 hook 必须收到同一 R 的失败清理。send 和 sendSession 两路径保持 native R；不向 prompt 发送，不遗留占用。保留原错误，不让清理错误覆盖主错误；实际成功准备者的回调集合应与该次准备一致，别因注册/卸载变化遗漏清理或错误释放其它 R。不要重复 failed 回调。若在 registry prepare 内原子清理或在 controller catch 统一失败，择符合真实原生命周期的最小清晰实现，不能另造第二 R。

允许修改：上述必要 A 产品源（material-batch/state/cases/UI和native apply/service生命周期）、必要同目标测试、P29对应补丁及PATCHES说明、正式和阶段交回。可为这些实际边界补互补回归，不删/跳过/放松root红断言，原7绿守卫保留。若需修补丁链，让P29按顺序准确重放到源码，不新框架/任意重排旧补丁。当前全部schema、其它lib/服务/Host公共接口/B树/构建配置冻结。禁止 build、自测或执行测试/tsc/parser/Vitest/pytest/collect/prepare/serve/probe/HTTP/GUI/模型。根审后 root 才跑。

操作：每一 exec 显式 shell=C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe，login=false；不要 multi_tool_use.parallel，不调用省略shell的包装，不用Bash/短名；需要并行读取也逐条单exec确保壳固定。Git仅只读，不add/commit/checkout/reset/stash/clean/push，不修submodule权限。配置/Key/审批/ACL/锁/隔离/E50/网络PDFguard全不改，拒绝不绕过。

交回 D:\Lawbeach\lawbench-coord\A-交回-T31BoundaryFix-20261026-015505.md，必要阶段进度 D:\Lawbeach\lawbench-coord\A-进度-T31BoundaryFix-20261026-015505.md。说明完整文件、每个红的实际修复机制及新互补回归，未执行测试如实写。目标机制与回归源码齐全即交回；同一无信息失败不循环，不以PID或命令数冒完成；本单没有任意工程deadline，技术86400进程watchdog非验收时限。
