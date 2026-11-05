# A 交回：本批材料 UI 竞态回归

状态：1 个新测试文件已落盘，含 4 个定向用例；作者未运行。当前产品预期在 4 个业务断言上失败，这只是静态判读。没有产品修复。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新增取消、改选、清单取消和 A/B 逆序四类本地回归；旧 15 项结果按源码哈希一致复用，没有重跑 |
| 目标是什么 | 给出可由根侧独立运行的有意义预期红，证明四条旧响应不得继续成功或覆盖新状态；还差根侧源码复核、唯一新文件执行和结果判读 |
| 在等什么 | 等根侧确认测试源码与入口后运行新文件；收到实际结果后，再区分四条业务红、入口问题和是否需要产品修复 |
| 卡在哪 | 本轮不卡；作者运行是按执行令主动留给根侧，不是依赖缺失或失败后停摆 |

## 依据与验证

- 正式令：`D:\Lawbeach\lawbench-coord\T31-ui-race-red-order-20261026-150412.md`
- Root 判读：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31ReviewRegression-20261026-150412\root-C-adjudication.md`
- 新测试：`D:\Lawbeach\lawbench-A\dsh-ext\tests\material-batch-races.spec.tsx`
- 正式证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ReviewRegression-20261026-150412\README.md`
- 进度：`D:\Lawbeach\lawbench-coord\A-progress-T31-ui-race-red-20261026-150412.md`
- 旧实际结果：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\A-root-tests\batch.stdout.txt` 为 `Test Files 2 passed (2)`、`Tests 15 passed (15)`；命令与 exit 0 在同目录 `results.json`。本轮未重跑。
- 源码复用条件：7 个相关产品、旧测试和配置文件的当前 SHA-256 与 root `source-before.json` 全部一致。
- 新测试 SHA-256：`29ed5d6d556c7bbc810c7e57e658e6abfc666862aebc60b4977ebe26efa7c653`。
- 当前 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`。无提交 SHA。

## 预期红的位置

| 用例 | 预期通过标准 | 当前产品预期失败原因 |
|---|---|---|
| 取消后旧 prepare 晚回 | 旧 R 拒绝并 release，新批保留，新 R 可成功重试 | 只用旧批快照核对响应，没有核对当前批次已取消或被替换 |
| 改选后旧 prepare 晚回 | 旧选择拒绝并 release，新 R 只带改选后的材料 | 只与旧批快照比较，没有比较当前选择 |
| 取消 loading 后清单晚回 | 不重建批次、不恢复阻断，无批时不发 scope | 清单成功后无条件写批次 |
| A/B 两批逆序返回 | B 保持活动，A 不得覆盖 | 两次捕获都无条件写同一会话槽，没有代次校验 |

第 1 条的 release 使用旧 prepare 的同一 R；新 R 只用于明确重试并证明本地占用已解除。固定 R 是 synthetic hook 输入，不声称发生过 NativeSession beginSubmission。

## 根侧运行入口

工作目录：`D:\Lawbeach\lawbench-A\dsh-ext`

现有执行器入口：`node scripts\test.mjs tests\material-batch-races.spec.tsx`

展开后的实际 Vitest 命令：`node ..\dsh\node_modules\vitest\vitest.mjs run --config vitest.config.mjs tests\material-batch-races.spec.tsx`

类型检查只在新测试确需类型证明时运行：`node ..\dsh\node_modules\typescript\bin\tsc -p tsconfig.json --noEmit`

作者验证状态：`NOT_RUN`。不是实际红，也不是绿。

## 未做与降级

- 未运行 Python、Node、Vitest、tsc、产品、旧测试、parser、AST、collect、list、prepare、serve、probe、GUI、HTTP、build、模型、网络或自检。
- 未改产品、旧测试、schema、config、alias、loader、runtime、lib、entry、guard、pin、契约、安装、部署或打包。
- 未做 NativeR、Host、TCP、GUI 或服务验收；本回归仅验证本地 UI 状态和 hook 输入边界。
- 队列转 steer 风险和后端记录丢失仍是独立开放边界，不能由本文件宣称已处理。

## 所有非零命令

| 命令或动作 | 实际结果 |
|---|---|
| `git status --short --branch` | exit 1；子模块 `dsh` Git 元数据 `Permission denied` |
| 首次哈希脚本把 `foreach` 输出直接接管道 | exit 1；PowerShell ParserError，空管道元素 |
| 首次只读 `Get-Content` 误填 `shell=bash` | exit 1；`Bash/E_ACCESSDENIED`，命令未执行 |
| 第二次哈希脚本同类管道写法 | exit 1；PowerShell ParserError，空管道元素 |
| 最终只读状态汇总再次误填 `shell=bash` | exit 1；`Bash/E_ACCESSDENIED`，命令未执行 |

第一次 Git 阻碍后使用 `git status --short --branch --ignore-submodules=all` 成功只读核对。两次 Bash 误填均被拒绝且未执行；指定 PowerShell 的最终核对显示只新增测试和证据目录，暂存区为空。没有修权限、ACL、lock 或审批。

## 清理

没有临时目录、测试输出、后台进程或锁需要清理。没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push；没有暂存。

## 下一步建议

根侧先全文审新测试、导入和清理逻辑，再运行上面唯一的新文件命令。若实际失败点正是四条业务断言，保留为修前红；若出现导入、夹具或未处理 Promise 错误，先修测试入口，不得认作假红。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 1 / 黑名单 0

Response ID: 本次运行器未提供
Response log path: 当前执行器会话日志
