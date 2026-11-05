# A-line handback — T34 complete launcher

状态：`SOURCE_HANDOFF_READY / AUTHOR_RUNTIME_ZERO / NEW_TARGET_NOT_RUN / FULL_TEST_NOT_RUN`

## 交回件

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompleteLauncher-20261031-004819\complete-launcher.mjs`
  - bytes：76,074
  - SHA-256：`92b2f652d5a25ac25f93816dc39b87bd8512dbf383150bba5478f3c0a9c65df6`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompleteLauncher-20261031-004819\literal-inputs.json`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CompleteLauncher-20261031-004819\README.md`
- 本 handback 文件

没有 Git 提交。Git 写操作为 0；本轮没有执行 add、commit、rebase、stash、reset、
clean、checkout 或 push。

## 实现摘要

`complete-launcher.mjs` 从 34,469-byte approved baseline 完整复制后做有界修改：

1. 原 14 个 source pin 保持原 literal 值；approved `copy_inputs` 的 99 个条目按
   JSON 原样嵌入为 `COPY_INPUTS`，合计 1,357,214 bytes。
2. 在任何 DSH import 前校验原 pins 与全部 99 个输入；随后安装既有八类 guard，
   再在本次独占 root 下创建 `complete-runtime`。
3. 每个复制文件只按字面 `relative` 路径写一次，使用 `wx`，写后回读 bytes/SHA；
   没有目录发现、安装、SDK 升级、resolver 包装、动态 hash 或覆盖旧文件。
4. `appBoot`、loader、config-editor、settings、llm、llm-pi-ai、timer、hmr 等
   实际 import、plugin URL 和合成 profile anchor 均切到新运行时；原观察器保持原
   approved source pin，不复制、不修改。
5. 真实内部 loader 使用新运行时的 desktop-host entry 作为 parent 导入
   `@deepseek-ai/dsh/profile-boot`，再调用一次真实 `runProfile`；没有强换直接
   profile-boot file URL，也没有 fallback resolver。
6. 旧 profile 只用于 approved old install anchor 的只读元数据解析，不 boot。新合成
   profile 保留同一六组件、原观察器和两条 synthetic route，anchor 指向新运行时。
7. 保留唯一 mutation、strict precondition、物理计数、已知
   `root_include_missing` 原始标签、错误隐私、唯一真实 shutdown、完整 context
   根归属和一次性流程。没有新增 mutation 或重试路径。

`literal-inputs.json` 的核心经只读文本比较确认与 approved JSON 前缀一致，只追加
`handoff` 的 self/counts/nonzeros/not_run。`complete-launcher.mjs` 内嵌的复制数组
经只读文本比较确认与 approved `copy_inputs` 原样一致，并确认恰有 99 个 `relative`
条目、无 placeholder 残留。

## 实际运行与验证计数

- Node：0
- Python：0
- import/check/test/build/prepare：0 / 0 / 0 / 0 / 0
- app / GUI / HTTP / model：0 / 0 / 0 / 0
- process probe / SSH / DPAPI：0 / 0 / 0
- Bash command：0
- Bash pre-execution denial：1（进程和命令均未启动，未重试该命令）
- Git write：0
- Git readonly status attempts：1（既有权权限边界失败，未修复）
- native PowerShell tool invocations：21，其中最后一次是唯一的 final readonly
  metadata/pin 检查
- shell command attempts：22（21 次原生 PowerShell，另 1 次被预执行拒绝的 Bash）
- failed absence queries：1（一次 source lookup 因命令构造不匹配无行；另一条独立
  只读查询已取得所需证据，没有运行 JSON/JS parser）
- failed readonly sequence queries：1（启发式匹配到前面的函数定义而非调用，返回
  false；随后直接人工核对实际 call order，未重试该启发式）
- failed readonly text queries：2（辅助文本断言使用了不匹配的换行或拼接公式；
  换行归一后的独立只读比较确认 approved 99 项数组成立）
- new target runs：0
- full tests：0

## 阻碍与处置

只读 `git status --short --untracked-files=all` 在
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 这一既有权限边界返回
`Permission denied`。按令没有修改权限、ACL、锁、沙箱或审批，没有拆 writer lock，
也没有尝试 Git 写入。该阻碍不影响源码交回。

一次工具请求被预执行拒绝于 Bash 访问边界；没有 Bash 进程或命令执行。所有实际源码
读取、复制和 metadata 检查均使用显式绝对路径的原生 PowerShell。

## 未运行与不能声称

新 target 为 `NOT_RUN`，全量测试等待 owner release。没有运行完整 business profile、
原生 GUI、模型、外连或产品修复。

因此本件不能声称：

- 新运行时中的 complete CLI payload 已由真实 resolver 自然解析；
- 真实 `runProfile` 已 boot 或 shutdown fulfilled；
- 唯一 unset 已 fulfilled，物理 external/lawfirm 计数已达到验收值；
- observer fulfilled、根 Include 状态已生效或 GUI 已修复；
- T34 已完成。

只有根侧唯一一次新 target 及其完整 source/delta/raw/setup-cleanup 与有限外壳闭合证据
可以作上述判断。
