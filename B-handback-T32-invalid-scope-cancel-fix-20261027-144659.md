# B 线交回件：T32 失效范围内的取消收尾最小修复

状态：`AUTHOR_DONE / RUNTIME_NOT_RUN / PACKAGING_HOLD`

工单号：`T32-invalid-scope-cancel-fix-20261027-144659`

提交 SHA：无。本轮按执行令保持 Git 严格只读，没有 `add / commit / rebase / stash / reset / clean / checkout / push`。

## 1. 交付物与身份

产品修改：

```text
D:\Lawbeach\lawbench-B\service\lawbench\case\task.py
40607 bytes
SHA-256 7B6EE04BA53F45B1F7E6624D2C9BF60B122DFC68C12E26331431A84EED36BF04
```

新增后端单元消费者：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelFix-20261027-144659\invalid_scope_cancel_check.py
24701 bytes
SHA-256 35DC7A7E971D3C88DA195BB024A14BE013F8AEADDF4DF64ACBD5E863BA3302CA
```

新增证据说明：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelFix-20261027-144659\README.md
7229 bytes
SHA-256 F7DAF5666A9F4A4E07A35397FA5F01DC63392AB911E79AA2B36F6CB4828EBFE4
```

本交回件：

```text
D:\Lawbeach\lawbench-coord\B-handback-T32-invalid-scope-cancel-fix-20261027-144659.md
```

没有修改旧 visibility 消费者、旧测试、fixture、schema、契约、配置、锁、pin、guard、SDK、编译产物或启动器。旧 visibility 消费者 SHA-256 仍为根方接受值：

```text
1425B07199A6C7383BB2BA49D2BF832EBA51E8CE912221D41557D2D4BCE5F40B
```

## 2. 产品改动

只在 `TaskStore._end` 的权威覆盖计算外增加一个窄分支。正常路径仍先调用 `coverage()`；仅当以下条件全部成立时，使用契约已有的可空 `coverage` 完成非成功收尾：

- `ApiError.code == "INPUT_CHANGED"`；
- `ApiError.reason == "task_scope_version_changed"`；
- 任务自身 `request_scope` 非空；
- 映射后的结果状态不是 `completed`。

因此：

- 失效范围的 `completed` 仍失败，不能把取消语义冒充成功；
- 失效范围的 `aborted` 可以写真实 `cancelled` 终态和 `coverage=null`；
- 普通未准备任务继续计算真实覆盖；
- 有效范围任务继续计算真实覆盖；
- `INTERNAL`、身份、意图、契约、I/O 和其他错误不被吞掉；
- 范围、工具、context、材料、schema、状态锁、草稿、参数和用量行为未改。

## 3. 新消费者覆盖

脚本是一个 `unittest` 后端单元消费者，使用一个实际测试方法和 `load_tests` 单类装载。它明确不是 HTTP、NativeSession、AgentLoop、模型、GUI 或完整 T31/T32 验收。

唯一有意义场景使用三份合成 TXT 引用和生产 `CaseRegistry / Materials(mode=ref) / SettingsStore / TaskStore / context.build / tools.run`：

1. 开始失效范围 C、普通未准备任务 U、有效范围 V。
2. 生产移除目标后，C 的 context 与三个工具均以 `INPUT_CHANGED / task_scope_version_changed` 失败。
3. C 的 `completed` 结束仍报同一错误，任务/结果仍为运行中且字节不变。
4. C 的 `aborted` 结束返回 `cancelled`；任务为 `finished`，结果 `coverage=null`、`finished_at` 已写、用量精确为 `model_calls=0 / tool_calls=3 / elapsed_s=7`。
5. C 的范围编号、材料版本、任务范围副本和持久 `claimed` 记录保持绑定。
6. 重复结束返回原 `cancelled` 且字节不变；同一请求再次 begin 报 `TASK_NOT_FOUND / request_scope_task_ended`，不新建任务。
7. U 取消得到活跃材料 `coverage.total=2`；V 完成得到 `coverage.total=1`，排除“一律空覆盖”。
8. 三份外部原件 SHA-256/大小/修改时间与三份派生文本均复核不变。

案件、材料、引用、任务、结果、读取和范围记录均由生产方法生成。唯一 `uuid4` 明确标记为后端请求编号，不是 NativeSession。危险 socket / urlopen / subprocess 路径被替换为立即失败，没有 mock 被测生产方法。

## 4. 验证与证据

作者侧验证只有只读静态检查：

- `git diff --check -- service/lawbench/case/task.py` 通过；
- 目标三个文件尾随空白扫描无匹配；
- 新消费者文本扫描确认没有 HTTP、NativeSession、AgentLoop、SQLite 或实际子进程调用；
- `task.py` 最终分支精确匹配四项守卫；
- 目标路径 Git 状态只有 `M service/lawbench/case/task.py` 和本卡新证据目录。

`RUNTIME_NOT_RUN`。作者没有运行 Python、测试、import、解析器、selftest、HTTP、GUI、build、model 或安装。没有作者侧红绿结论。

根方唯一命令：

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelFix-20261027-144659\invalid_scope_cancel_check.py' -v
```

根方应使用短私有临时根包装，并先完整审计新消费者、最终 `_end` diff、setup/finally 和命令；随后在同源码上复跑冻结 visibility 消费者，再按依赖审计选择必要旧范围回归。

## 5. 实际命令、非零与写面

全部 Shell 调用均显式使用：

```text
C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
cwd=D:\Lawbeach\lawbench-B
```

实际命令类别：

- `Get-Content`：正式执行令、根 verdict、当前源码/契约/说明/交回格式；
- `Get-ChildItem`、`Get-Item`：证据目录与协调目录状态；
- `Select-String`：`_end` 和新增守卫；
- `rg`：禁用运行面、危险补丁、生产调用、普通写入面、尾随空白；
- `Get-Content | Measure-Object`：消费者规模；
- `Get-FileHash`：旧消费者、产品源码、新消费者、README；
- Git 只读：`status`、目标 `diff`、`diff --check`；
- `New-Item`：只创建执行令指定证据目录；
- `apply_patch`：产品窄分支、新消费者、README、本交回件。

非零命令：

```text
git status --short
exit 1：共享 worktree 子模块 modules/dsh 的 Git 路径 Permission denied。
未扩权、未修锁、未写 Git；随后用 --ignore-submodules=all 做只读目标检查。

Get-Item 目标证据目录
exit 1：创建前目录尚不存在；随后只创建执行令指定目录。

一次 rg 显式误用 Bash
exit 1：managed 隔离返回 Bash/E_ACCESS_DENIED，命令未执行且未写文件；
随后改用指定 pwsh.exe 成功重做。

rg 尾随空白
exit 1：无匹配；表示目标文件无尾随空白。
```

严格写面只有执行令允许的两个仓库位置和本交回件。没有 Git 写入、锁修改、审批变更、ACL/沙箱变更、Key/API 配置变化或外部联系。

## 6. 遗留与结论

无产品语义模糊点需要 owner 拍板。当前只完成作者侧有界修改和静态审计；新消费者尚未运行，不能把本件当作生命周期通过或完整 T32 通过。

项目继续 `PACKAGING_HOLD`。根方运行后才能决定证据等级和是否进入下一门。
