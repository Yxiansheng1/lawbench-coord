# B 交回：合成 OCR / Refine / Cancel 有限消费者

状态：`AUTHORED_NOT_RUN`

## 1. 目标与出处

唯一任务入口：

`D:\Lawbeach\lawbench-coord\B-real-synthetic-OCR-refine-order-20261027-225347.md`

固定输入：

- `D:\Lawbeach\lawbench-coord\RealSyntheticOCRRefineInput-20261027-225347\targets.json`
- `D:\Lawbeach\lawbench-coord\RealSyntheticOCRRefineInput-20261027-225347\fixed-inputs.json`
- `D:\Lawbeach\lawbench-coord\OWNER-合成案卷真实识别模型测试授权-20261027-224859.md`

原始授权只覆盖纯合成案卷连接现有 6000D、395、业务模型和取消恢复；不读真实案卷、不新增付费、不改全局配置、不处理真实 Key。正式执行令进一步限定作者只写消费者与 README，root 才执行，且 Git 全只读。

## 2. 改动清单与 SHA

只新增以下文件：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\consumer.py` | 54,101 | `6fc82bef21755fb7c58cd5de81044af572d71f30cd70a1073c7e90b3b005346f` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\README.md` | 13,275 | `1028830da878a762e93469e2bc8d6d163e942d6e7bd24a7d75b75903849bad7c` |
| `D:\Lawbeach\lawbench-coord\B-handback-real-synthetic-OCR-refine-20261027-225347.md` | 本交回件 | 不预置自哈希 |

没有修改产品、测试、fixture、配置、旧脚本、入口、T346 pins、编译产物、25 个 legacy、56 个 source、E50、guard 或 schema。没有生成 loader、框架、server、journal。

没有 Git 提交 SHA。正式执行令覆盖旧项目提交要求；本次 Git 全只读，没有 add、commit、rebase、merge、reset、stash、checkout、clean、push 或 staging 写入。

## 3. 消费者内容

`consumer.py` 是单文件、有限、显式 phase 的消费者，唯一 CLI：

```text
consumer.py --parent <ABS fresh nonexistent-or-empty ordinary root> --phase <ocr|refine|cancel>
```

每次只运行一个 phase，没有 all、自动重试、测试发现或隐式串联。推荐 root 为每个 phase 使用协调目录下全新的私有路径：

```text
D:\Lawbeach\lawbench-coord\B-real-synthetic-runs-20261027-225347\ocr-<unique>
D:\Lawbeach\lawbench-coord\B-real-synthetic-runs-20261027-225347\refine-<unique>
D:\Lawbeach\lawbench-coord\B-real-synthetic-runs-20261027-225347\cancel-<unique>
```

先导校验在任何 `httpx` / `lawbench` 导入前完成：

- targets、fixed-inputs、OWNER 授权三文件字节数和 SHA-256；
- targets 全部公开非密字段与本文件常量完全一致；
- fixed-inputs 共 15 项；
- 实时文件与协调目录快照的字节数、SHA-256 全部一致；
- fixture 为固定 47,379 字节 JPEG，SHA-256 为 `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`；
- `--parent` 是绝对普通目录且不存在或为空。

owned root 下建立私有 `HOME`、`USERPROFILE`、`APPDATA`、`LOCALAPPDATA`、`TEMP`、`TMP`，finally 恢复。阻止 keyring 导入、subprocess spawn、`os.system`、`os.startfile`，并用进程内 socket 审计只允许：

```text
10.126.126.1:8000
10.126.126.3:9000
```

不做系统/网络策略、沙箱、审批、ACL、锁或全局设置修改。Net 使用每次新构造的内存私有字典，VPN 地址为 primary，两个 alternate 都为 `None`，保持生产 client 的 `trust_env=False` 和 `follow_redirects=False`。

公开 marker `lawbench-synthetic-no-secret-acceptance` 只作为单字面值 `key_getter`。成功调用只说明当前后端配置接受了这次合成调用，不证明真实凭据有效或安全验收。

实际调用链：

- OCR：`render_png(fixed JPEG, "image", 1)` → 实际 `PageSender(...).send(PNG)` → `GET /health` → 单次 `POST /v1/ocr/page`，不传 query。
- Refine：实际 `refine.refine(Net, marker getter, [], synthetic_prompt, None, ["转账截图"])` → `GET /v1/models` → 真实 SSE `POST /v1/chat/completions`。
- Cancel：实际 unchanged `LLM.chat`，`qwen38-27b`、`max_tokens=512`、关闭思考、32K；观察到真实 chat dispatch 后立即设置产品取消 Event，另行记录同一 `pipeline-request` 线程在取消瞬间和自然 unwind 时的 socket 建连观察；连接池复用不伪造为新建连接。实际取消后运行一个 tiny synthetic recovery 请求。

OCR 完整检查姓名、金额、尾号和日期；规范化只限 NFKC、空白、货币符号、千分位、末尾 `.00`、日期分隔符和月份前导零，不修改实际输出。Refine 独立要求 `refined=true`、非空、与输入不同、保留两人名/金额/日期、无失败 reason；金额仅额外放行语义相同的 `8万元`，不放行其他数。Cancel 记录前后线程名称/数量、dispatch、同线程建连、产品异常、`pipeline-request` 自然 unwind/join 和恢复；不声称服务端 499、vLLM abort 或后端进程停止。

每次运行写 `result.json`、`summary.json`、`metadata.json` 和私有产品日志。stdout 只输出 metadata summary；完整合成输只写 owned root。日志 finally 关闭并记录哈希，检查没有 synthetic input/output 泄漏。

退出码：

| code | status |
|---:|---|
| 0 | PASS |
| 2 | FAIL_ACTUAL_ASSERTION / RUNTIME_FAIL |
| 3 | BLOCKED_AUTH_REQUIRED |
| 4 | SETUP_ERROR |
| 5 | CANCEL_NOT_EXERCISED |
| 6 | UNEXPECTED_ERROR |

## 4. 只读基线核对与验证

作者只读检查结果：

- fixed-inputs 的 15 项实时文件均存在，且与固定快照的字节数和 SHA-256 一致；
- 固定 JPEG 为 47,379 字节，SHA-256 与固定输入一致；
- 产品源码接口与固定快照一致，未发现需要产品修复才能编写的消费者阻断；
- `targets.json`、fixed-inputs、OWNER 授权哈希已内嵌在消费者中，root 每次先复核。

没有任何实际运行红绿：

- 未运行消费者；
- 未运行 Python / Node / import / pytest / collect / Vitest / tsc / build / serve / probe / selftest；
- 未发起 HTTP、模型、OCR、业务模型、取消或恢复请求；
- 没有可声称的 PASS、BLOCKED、NOT_EXERCISED 或模型质量结论。

## 5. 契约、安全与已知限制

已完整读取 prompt_refine 契约、prep395 OCR/health 契约、相关 Spec 6/8/20 段、refine SYSTEM、LLM、Net、PageSender、render、logs、errors 和 fixture 生成源。

已知限制：

- unchanged `PageSender.send()` 不返回服务端 `elapsed_ms`/backend；消费者记录自己的实测耗时，不伪造服务端字段。
- OCR 的 395 keycheck 是服务端内部 6000D 调用，本地只记录可能发生一次 `max_tokens=1`，不伪造精确上游计数。
- marker 接受不代表真实 Key 或安全验收。
- Cancel 只能证明本地 dispatch、建连、产品取消与线程 unwind；远端 499/vLLM 状态没有证据。
- OCR/refine 各一个样本，不覆盖队列持久化、GUI、NativeR、Hostclaim、全 T32 或广义业务质量。
- 实际样本事实不符应原样报红，不能据结果自动改产品、fixture、测试或提示词。

## 6. 实际命令、非零项与交回

作者通过指定原生 `pwsh.exe`、`login=false` 执行了只读 `Get-Content`、`Get-ChildItem`、`Get-FileHash`、`Get-Item`、`rg` 和一次 `git status`。

必须披露的偏差：为逐项审计 15 项固定清单，使用了 PowerShell `ConvertFrom-Json` 做只读取值。该操作没有运行产品代码、没有导入产品、没有运行 fixture/产品解析器，也没有产生实际测试结果；但按正式令“作者不得运行 parser”的字面边界，这是形式偏差。消费者与 README 已明确记录。

Git 非零项：

```text
git status --short --branch
exit 1
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

另有两条只读 `rg` 调用非零：一条 pattern 以 `--phase` 开头，被 `rg` 当作未知选项；另一条把 `-g '*.py'` 放在 `--` 之后，被当成文件名。两者都没有修改文件，修正参数顺序后的同类检索退出 0。

另有一次工具参数误写为 `shell=bash`；宿主在命令执行前以 `Bash/E_ACCESS_DENIED` 拒绝。该错误违反“所有 exec 必须指定原生 pwsh”的操作纪律，但没有启动 Bash、没有执行命令，也没有文件或 Git 副作用；之后只用指定原生 `pwsh.exe` 重跑。

两次工具参数对象重复字段的调用在进入 Shell 前失败，也没有文件或 Git 副作用。没有尝试修复 Git 权限、index.lock、ACL、审批或沙箱，也没有拆 writer 锁。

交回位置：

- 消费者：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\consumer.py`
- 运行说明：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\README.md`
- 本交回：`D:\Lawbeach\lawbench-coord\B-handback-real-synthetic-OCR-refine-20261027-225347.md`

作者工作到此停止。下一步仅由 root 按 README 在三个全新的私有 root 中分别审计并有限执行；作者不联系其他聊天、不换 API、不自行跑实际验证。
