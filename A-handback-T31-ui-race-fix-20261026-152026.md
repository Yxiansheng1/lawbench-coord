# A 正式交回：T31 当前材料 UI 竞态修复

状态：`SOURCE_ONLY / AUTHOR_NOT_RUN / ROOT_RUN_REQUIRED`

## 1. 目标与出处

唯一执行令：

`D:\Lawbeach\lawbench-coord\T31-ui-race-fix-order-20261026-152026.md`

目标是修复已由根实际复现的四个 UI 生命周期错误：取消后旧 prepare 仍被接受、改选后旧选择
仍被接受、取消 loading 后迟到清单重建批次、同会话旧建批覆盖新批。实际红证据：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Directed-root-20261026-151537`

详细事实、契约、静态判读、全部命令、非零事件、根运行命令和遗留均在：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\EvidenceFix-20261026-152026\README.md`

## 2. 改动清单与 Git

精确产品改动只有：

`D:\Lawbeach\lawbench-A\dsh-ext\ui\material-batch.ts`

- 修改前 SHA-256：`5456b507f01d74e722317008d3d67b78717bca8ffd500da4f1466da7cebf4397`
- 修改后 SHA-256：`38328dc0b4b1a568772729e5310677657e48247c1713d65f0cde6028fea4cd01`

新增文档只有本文件、进度件和上述 README。`material-batch.tsx` 未改
（`1fdd2a32cbef1ec04be59e1197bd852b287e1a900c3ffcad4cebab6382cb0586`）；冻结新 4 项
仍为 `29ed5d6d...7c653`，旧测试和配置也未改。

Git 严格只读：没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
分支 `line-A`、HEAD `a23271abee333a9a256fd46a3141da16975c2380`，提交 SHA 无。
共享 `dsh` 子模块的 `git status` 权限拒绝已保留，没有修权限/ACL、改锁或拆 writer；
既有 dirty 全部保留。

## 3. 源码行为

建批现在有会话私有 owner 代次：最新一次建批才可写批次、阻断或提示，取消会注销 owner。
因此迟到清单无论成功、失败还是为空都不能覆盖取消或更新后的批次。

`requestScope prepare` 异步返回后，在保留服务端回显校验之外，再核验当前会话对应案件、
案件根、阻断态、当前批次案件/ID 和当前 `selected_ids`。任何不一致都拒绝旧 R，并用同一个
`case_id + session_id + request_id` release；不清除当前新批，occupancy/preparing 走既有
catch/finally 清理，随后可显式用新 R 重试。

修法没有新增公共字段、契约或框架，没有按测试 UUID、会话 ID 或虚拟路径特判，没有自动发送，
没有整案回退，没有重写正文、输入或历史。

## 4. 验证状态

作者验证：`NOT_RUN`。

没有运行 Python、Node、产品、测试、parser/AST、Vitest、tsc、pytest、collect/list、prepare、
serve、probe、GUI、HTTP、build、模型或 selfcheck。四个新用例、旧 15 项和类型检查均待根实际运行；
不得把源码静态推断写成绿，`whole_T31_pass` 和 `GUI_pass` 仍为 false。

根需先独立全文审核累计源码，再在 `D:\Lawbeach\lawbench-A\dsh-ext` 执行：

```powershell
node scripts\test.mjs tests\material-batch-races.spec.tsx
node scripts\test.mjs tests\material-batch.spec.tsx tests\material-batch-boundaries.spec.tsx
node ..\dsh\node_modules\typescript\bin\tsc -p tsconfig.json --noEmit
```

证据 README 已逐条列出实际测试入口、预期静态路径和保存真实 stdout/stderr、退出码的要求。

## 5. 命令事件与阻碍

详细全量命令表见 README 第 6-7 节。关键事件：

- `git status --short` 因共享 `dsh` 子模块 Permission denied；改用忽略子模块的只读状态与既有快照，未修环境。
- 有 6 次只读调用误把 runner shell 填成 `bash`，均被 managed MXC 拒绝且未执行；随后以指定原生
  `pwsh.exe`、`login=false` 完成所需读取。该执行纪律偏差已原样记录。
- 根令提到的 B `results.json` 不存在；改读 B 交回件和根结果，没有从缺失文件编造结果。
- `git diff --no-index` 对修改快照返回语义性 exit 1，差异仅为本次源码补丁。
- 没有启动 setup/legacy，没有改沙箱、审批、ACL、UAC、锁、writer、安装、API 或全局配置。

## 6. 遗留与边界

- `hook.prepare` 返回后到 `ConversationService.prompt` admission 前仍是开放边界；准备后复核
  不能关闭这段，本修复不声称覆盖。
- 同会话 queued R2 -> steer -> R1 的排序风险仍在，需根下一步按真实 native 生命周期处理。
- B 已 prepare 行丢失后接受空范围、看到 3 份材料而非准备时 2 份的问题不在 A 写入范围，
  本轮没有改 B。
- `073502` runtime 是修改前 UI，不能证明本轮新源码；没有 build、packaging、Host/HTTP、native R、
  GUI 或真人验收。
- 源码有界修复到此停止，不进入相邻 native、B 或框架工作。
