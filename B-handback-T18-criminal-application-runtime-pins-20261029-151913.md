# B-T18 刑事申请 runtime pin 恢复交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已完成 source-only 数据重绑定。三份基线先原样复制，随后只改 MTS 两条绝对导入、manifest 四个编译行及两个自指项；B 服务副本未变。 |
| 目标是什么 | 为一次新 pin 的 canonical 刑事申请实跑准备可准入输入。终门仍差一次新 pin 的 actual runtime，以及 strict report、强制人工确认和 OS 关闭证据。 |
| 在等什么 | 等主编排读取本交回件和最终 pin 后，启动唯一一次 fresh canonical actual runtime；实跑结果会决定业务是否通过，而不由本次数据重绑定决定。 |
| 卡在哪 | 没有阻断交付的卡点。初次 `git status` 因受保护子模块 `dsh` 目录权限失败，已改做忽略子模块的只读检查；未尝试扩权、改锁或修复。 |

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-criminal-application-runtime-pins-order-20261029-151913.md`
- 基线来源：`D:\Lawbeach\lawbench-coord\T18CriminalApplicationRuntimeInput-20261029-151913\`
- 授权变更：`D:\Lawbeach\lawbench-coord\T18CriminalApplicationRuntimeInput-20261029-151913\approved-runtime-changes.json`
- 交付目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CriminalApplicationGateRecovery-20261029-151913\`
- 基线三件：MTS `137924 / effd7e0e66c49bd1a12172e00180f83ff584034c513966e8a9570fef7edf135f`；B 服务 `48430 / 5841bfe21acd27ac6bc6dd468d8d2c1dedafbb28db52b176fb94d12032c7e28b`；literal inputs `11652 / 92dbec88557eece5c4971f3361f166d7378f957dfa7945e0a75c6d7e0feeb9c8`。
- MTS 最终：`137944 / fe37f8f0f11d4d8feca0ff6cd46a17a562d03c2153d6197ad957e28a3f4f3e44`。旧 root 原 2 处，新 root 2 处；逐字替换后的全文与期望值一致。
- manifest 最终：`11700 / e8d7b4bd0af0e21cb507defac4d1e1d122ce5bb136ff26512d8d678e2fe4fb5f`。新 compiler root 4 行；反演四行与两个自指项后，全文与基线逐字一致。`compilerPrivate` 未增删行，基线 510 行公式 `459 + 44 + 6 + 1 = 510` 不变；没有动态准入或重算未批准库 pin。
- B 服务最终：`48430 / 5841bfe21acd27ac6bc6dd468d8d2c1dedafbb28db52b176fb94d12032c7e28b`，与基线完全一致。
- 新 compiler pins：agent `553084 / 4f0c3cbe1801d718e50c4ee0a5f6fd354ee5ac92130fce53dd2077b1d8f5bee8`；host `902499 / ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`；package `1257 / 3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`；manifest `58206 / 896f7cf20b187f9c96ea44a9c08796a9f36858fd67f84e073d225eeb71e01778`。

初次只读 `git status --short --branch` 的非零原始输出：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

该命令退出码为 1。随后 `git --no-optional-locks status --short --branch --ignore-submodules=all` 成功执行，仅用于保存现场，未修改 Git 状态。该只读结果记录分支 `line-B` 相对 `origin/line-B` 为 ahead 141、behind 1；既有脏文件全部保持原样。

## 未做与降级

- 未运行任何 runtime、模型调用、HTTP、GUI、AST、测试、构建、Python、Node、tsx、导入或进程探测。
- 未修改 fixture、Skill、产品代码、guard、routes、lifespan、OCR、Retainer、Key getter、SDK、loader、构建源码、旧 private 或当前 private。
- 未执行 Git add、commit、rebase、stash、reset、clean、checkout 或 push；Git 写入不在本次运行器授权内。
- 未宣称业务成功。未知或不支持的事实在实际运行中仍应进入人工问题；本次只把已批准的 runtime pins 准备好。

## 下一步建议

主编排读取最终 pin 后，复用已通过的 binding AST/ESM 与 new 510-pin admission，执行唯一一次 fresh canonical actual runtime。实跑必须走 strict report，并保留“模型先 SHOW 提供的事实类型与推导出的机关引用，再人工确认”的顺序；业务未知或不支持事实继续按人工失败处理，直到 actual 证据出现。

删减轮: 读者 1 / 槽位 0 / 半句 3 / 重复 1 / 过程 2 / 黑名单 0

Response ID: 运行器未提供

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T18-criminal-application-runtime-pins-20261029-151913.md`
