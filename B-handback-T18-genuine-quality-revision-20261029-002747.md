# B 线交回：T18 真实质量返修边界阻碍

## 结论

已按令实现可审查的有限消费者、B 边界伴随件、固定输入清单和 README，并运行一次不读取凭证的边界预检。

结果是 `BLOCKED / SCOPED_PRIOR_INPUT_UNAVAILABLE`，不是 PASS：当前冻结的生产实现不允许“真实 R 已固定精确材料范围”与“读取选定的前序成果”同时成立。阶段二要求原审查意见 v2 和阶段一模型问题清单，因此安全的两阶段工作流不能启动。没有绕过范围、改写会话、手填上下文或保存根预制修正稿。

原 T18 业务错误（风险 3 原引 4.1，却在正文写“合同第七条”）仍未被发现或修正，原首轮业务失败继续有效。完整 T18、Word GUI、法律验收和打包均未通过，Packaging 仍为 HOLD。

## 确切源码阻碍

`D:\Lawbeach\lawbench-B\service\lawbench\case\context.py`，6,409 字节，SHA-256 `1128f934f13e1f0453be4c73cea1466dd4bf54ede158cd359eedc48a57e4d9ee`：

```text
if task.get("request_scope") is not None:
    ...
    因此未注入正文，也不能用 case_read_input 绕过范围。
```

`D:\Lawbeach\lawbench-B\service\lawbench\tools\inputs.py`，4,428 字节，SHA-256 `b13f8ac7bdb85d87403531e4a6e9a3eb336623455f7e7a68db9422cf4b1f23ee`：

```text
if ctx.tasks.task_scope(ctx.task) is not None:
    raise ApiError(
        "OUT_OF_CASE", "scoped_read_input",
```

这不是推测：消费者及 B 伴随件都先核对上述文件与 `case/task.py` 的精确大小和 SHA，再确认守卫原文存在。若未来守卫变化，夹具会失败关闭并要求重新审查。

## 已实现的内容

- `native-genuine-quality-revision.mts`：23,333 字节，SHA-256 `c0a59487952bdbd57742cf83b012177bcd8b9d8e53ab94acf0e825979c97fa7b`。
- `b-service-genuine-revision.py`：3,510 字节，SHA-256 `804b8cf9eb72743715ee13a16e6af86fca7083a16a649162c00c746e44db584a`。
- `fixed-inputs.json`：12,073 字节，SHA-256 `f1d196ecc67a1bc2fc38df29bc7f62b78d547654f045022295d30ece62ca8ba8`。
- `README.md`：完整状态、源码依据、运行命令、非零记录、写面孔和后续判断。

消费者不是旧的 `contract-review` 自动主线复用：它验证当前真实案 16 文件、1 会话、两个冻结 Skill、当前私有编译 DSH、B 源码守卫和运行时，随后在凭证接入前硬停。

## 实际运行与证据

唯一运行命令：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineQualityRevision-20261029-002747\native-genuine-quality-revision.mts' --credential-stdin
```

工具层报退出码 1，消费者 JSON 状态为 `BLOCKED`，阻碍为 `SCOPED_PRIOR_INPUT_UNAVAILABLE`。没有重跑。

报告：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineQualityRevision-20261029-002747\run-98bIfi\report.json`

13,683 字节，SHA-256 `9e3a947457e651be70bee733e9f4be90b3513700753b56ebc13fbd48e1e34661`。

报告明确记录：

- 原始案文件复制 16 个，会话文件复制 1 个；
- 原会话 240,391 字节、SHA-256 `cd40b5df18811adbbe988cf1bea2b739c0a8e25eb2009e36f15935b3d4ace2b5`；
- 物理 60 行 = 原会话头 1 行 + 原 59 事件，序号 0..58；
- 会话 ID `session-1cb28369-3a90-46dc-b047-e64986038394`，原 `cwd` 未改写；
- 原 v2 草稿 9,170 字节、SHA-256 `1b095356f48c4a7ae9e94bd171c92377385d70ff3730c59fcb50f26822cba31d`；
- 运行前后 17 个原始输入大小和 SHA 全匹配；
- 凭据未读、B 未启动、Browser/Context 未打开、AgentThread 未 join、模型请求 0、case registry 写入 0；
- B 最终文件 0 个，证明没有用伴随件假装服务已跑。

## 文件与 Git 边界

原有 B 工作树的大量 dirty/untracked 内容保持原样。普通 `git status` 被共享 `dsh` 子模块元数据权限拒绝；使用 `git status --short --branch --ignore-submodules=all` 成功读取。没有修权限、改锁、拆 writer、改 ACL 或审批。

本轮新增写面孔只有证据目录四个顶层文件、`run-98bIfi/` 私有副本和本交回件。没有修改产品、测试、Skill、契约、fixture、旧消费者、旧 B 入口、旧报告、原案或原会话。

没有执行 Git 写入：`add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push` 均为 0。没有读取或打印 Key、密码、环境凭据或 DPAPI；没有更换 API、模型、预算或 provider。

## 需要主编排决定

要继续满足原令，必须先决定是否修改生产语义和契约，让前序成果带着“来源任务 + 材料编号 + 版本”证明后，可以在同一精确材料范围内进入 L1。若不改这条规则，只能接受两阶段返修无法使用 `request_scope`，不能拿旧全案路径冒充本令完成。

完整证据、命令类别和所有明确非零记录见：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineQualityRevision-20261029-002747\README.md`
