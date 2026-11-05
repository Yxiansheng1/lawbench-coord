# C 线交回：OCR 维护控制器安全修订

## 结论

状态：`SOURCE_AMENDED_NOT_RUN`

已按 `C-OCR-maintenance-safety-amend-20261030-203451.md` 在**同三个未服务文件**上完成有界修订，没有触碰任何其他文件。控制器仍未运行：没有导入或执行 Python，没有启停服务，没有发送 HTTP，没有启动模型或 GPU 实例，没有改策略、ACL、锁或 Git 索引。

根的 7 条静态发现已逐条核对源码确认，并在源码中修好。

## 交付文件（仅三个，全部在原目录）

目录：`D:\Lawbeach\lawbench-C\prep395\deploy\maintenance-controller-20261030-202123\`

| 文件 | 字节 | SHA256 |
|---|---:|---|
| `maintenance-controller.py` | 80330 | `cf126cedbc083ef5021380783ef975fb793c1a850979b98eb6d9361bf08793ce` |
| `README.md` | 11335 | `a99553126a9d6ab8ae25ba1aff90234359fbf573e1f1b273a0aa5e70b7288936` |
| `literal-inputs.json` | 11110 | `bd2c594434d48bc740a7ea5ac098b68bba39b594b8fabac853c98c0d91dea6ac` |

修订前基线（保留在协调目录快照 `OCRMaintenanceSafetyInput-20261030-203451`，未改动）：控制器 56413 字节 / `223b8792…5460a`，README 8933 字节 / `74c2862e…6c35`，`literal-inputs.json` 9243 字节 / `239977a3…3d59`。

`literal-inputs.json` 内已写入控制器最终自哈希（80330 / `cf126ced…93ce`），已核对与文件实际一致。

## 逐条修订

**1. API_HEALTH 固定端点。** 改为 `("10.126.126.3", 9000, "/health")`，与根的实测监听一致（`192.168.8.124:9000` 与 `10.126.126.3:9000`，同由 API Python 进程 2932 持有）。启停健康检查和恢复最终检查**共用这一个常量**，源码中 `API_HEALTH` 全部 4 处引用无第二个地址、无回落、无默认值。`127.0.0.1:9000` 已从源码彻底移除（剩余的 `127.0.0.1` 只有 OCR 的 9101，属于另一条服务路径，未改）。

**2. XML 原文件内写。** 新增 `write_file_in_place()`：只以 `os.open(path, os.O_RDWR | os.O_BINARY)` 打开**已存在**文件（无 `O_CREAT`、无 `O_TRUNC`），`lseek` 到 0 → `os.write` → `os.ftruncate(len)` → `os.fsync`；写前用 `GetFileInformationByHandle` 取卷序列号 + 文件索引，写后再取一次，**必须同一文件对象**才通过；另校验 regular、非 reparse、末字节逐字节比对。XML 路径上不再有 `os.replace`、rename、unlink、chmod 或任何安全描述符 API——原来的 `atomic_write(XML_PATH, …)` 已换成这个函数，**应用和恢复两处都用它**。控制器自有输出（`result.json`）仍走原来的 `atomic_write`，未改。原文件的 atime/mtime 在停服前记下，恢复时用 `os.utime` 还原（只动时间戳，不碰权限）。738 字节原始备份 `run/original-ocr.xml` 仍是不可变的 `xb` 写入。

**3. `list.extend` 修正。** `old_identities.extend([observed_direct["api-python"], observed_direct["ocr-native"]])` —— 单个可迭代对象，不再是两个位置参数。同一份原始身份同时写进 `RESULT["old_identities"]` 供根核对。

**4. 真正的 `finally`。** 维护段整体放进 `try: … except BaseException: … finally:`，`finally` 覆盖从第一次停服派发到那一次 POST 的全部路径，`BaseException` 和控制流错误同样触发恢复。`persist_result()` 从第一次停服起改为**尽力而为**（失败只记进 `RESULT["persist_failures"]`，不再抛出）；停服前必须的写入改走新的 `persist_result_strict()` 和 `durable_write_bytes()`，备份或首份证据写不出来就在**停服前**中止。恢复里每个 step 自己 catch 自己的错误、记自己的账、继续下一步（`except BaseException`），任何一步的失败都不会被吞成 PASS：任一步报错都进 `errors`，`pass_checks` 要求 `not errors` 且五项硬门全过。恢复内的最终核对也拆成互相独立的 `final_check()`，一项失败不会遮住后面几项。

**5. 300 秒计时位置。** 单调钟在第一次 `dispatch_stop` **之前一刻**取点（`stop_dispatch_started_at`），主阶段截止 = `min(+180s, +300s−120s)`，总截止 = `+300s`；清理阶段不再重置任何时钟。所有等待都受既有截止约束，缺席证明另有 15 秒独立小界（`start_after_absence`），不会把启动和健康检查的预算吃光。停服派发本身失败时走 `verify_without_mutation()`：只观察真实状态和配置，**不停也不启任何服务**，判定为 `STOP_DISPATCH_FAILED_NO_MUTATION`，不伪造停服也不伪造成功。

**6. 服务名窄守卫。** 新增 `require_authorized_service()`，`dispatch_start` 和 `dispatch_stop` 在**打开任何变更权限之前**先校验名字必须在 `AUTHORIZED_SERVICES`（只有 `prep395` 和 `prep395-ocr`）。9B 只能走查询函数。

**7. 进程身份按代跟踪。** 每个授权服务按“代”登记 wrapper 和当时捕获到的原生/Python 子进程（`OWNED_REGISTRY[(label, generation)]`）。每次计划启动前，先在有界等待内证明该服务**上一代**登记的身份确实已消失（`require_owned_absent`），证不出来就抛错，**不启动第二个进程，也绝不强杀**。停服前记录控制器自身 PID/exe/creation FILETIME；每次启动后用既有 `capture_descendants` 捕获后代并登记。捕获失败或缺失进 `OWNED_CAPTURE_GAPS`，标 `PARTIAL_NOTPROVEN`，绝不外推成整棵树已证明。最终核对要求原始代和所有中间代都已消失；当前活着的那一代单独核对，不被误判成泄漏。

## 未改动（按令保持原样）

模型、请求字节与 SHA、原生程序与 30 个 DLL pin、XML 原始 738 字节与其 SHA、OCR 的 9101 单次 POST 端点与 70 秒上限、日志 4 MiB 累计读取上限、120 秒恢复保留、无删除/清理步骤、不读凭据/环境变量/DPAPI/真实案卷/旧生产日志、不联系 6000D、旧 policy-refused helper 仍为 `NOTRUN` 且未内联或移植、没有新框架/新 provider/新服务/GPU 实例/新 helper/提示词变体。

## 验证与未验证

已做：

- 完整人工重读执行令、`root-static-findings.json`、`actual-readonly-preflight.json`、上一份交回、原始 XML、以及修订前后的控制器全文。
- 逐条比对根的 7 条静态发现与源码，修完后复核每条。
- 结构检查（不用任何解析器）：全文件括号深度归零且无负深度异常、所有缩进均为 4 的倍数、无行尾空白、无制表符；函数/类定义顺序清单复核；被调用名字与已定义名字交叉核对，唯一 4 个“未知名”是 docstring 里的 `direct(`/`identity(` 和形参名 `function`，非真实引用。
- 元数据 JSON 校验：`literal-inputs.json` 可正常解析。
- 哈希与字节数核对：控制器实际哈希与 `literal-inputs.json` 内自哈希一致；README 内无残留旧哈希。
- 只读 Git 状态（限定路径、忽略子模块）：仍只有 `?? prep395/deploy/maintenance-controller-20261030-202123/`，与修订前相同，dirty 状态保持。

未做且按令不得由本执行者做：

- 未按 Python 导入、编译、AST/语法解析、自测、测试、构建或执行控制器。
- 未做任何 SCM 查询/控制、进程启动、HTTP/health、网络、模型、GPU 或真实维护。
- 未生成运行时 stage / admission.json，未产生真实 HTTP 结果，未声称端到端通过或原始 HTTP 根因已证实。

## 实际执行与阻碍

- 本次全部 `exec_command` 调用使用规定的绝对 PowerShell 路径、`login=false`，均以退出码 0 完成只读操作。**没有发生**误用 bash 的情况。
- **实际运行时 Python 退出码：无。** 控制器从未运行，本报告不提供任何“Python 退出码 0”之类的说法。服务控制、HTTP、模型请求、GPU 运行次数均为 **0**。
- Git 只执行了只读的 `status`（一次全量、一次限定路径加 `--ignore-submodules=all`）。**未执行** `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`，未暂存任何内容。全量 `git status` 因子模块 `dsh` 的 `.git/worktrees/lawbench-C/modules/dsh` 权限拒绝而失败；限定路径只读查询成功。该权限拒绝属于工作树外的既有状态，**不是本次交付的阻碍**，未尝试修复、未扩权、未改锁或审批。
- 没有发现需要放宽边界的 `SOURCE_BLOCKED` 条件。

## 给根的下一步

源码已就绪，运行时仍未获准。根按原流程做整字节/函数级差异复核、AST 检查与有限生命周期演练，通过后再建立冷启动 stage 与独立 admission，执行那一次 ≤300 秒的现有 OCR/API 维护。控制器自身不新增任何调度、脱离或执行机制；根仍可用标准 WMI 进程创建、隐藏窗口，把这个既有服务控制器跑在 395 上，不依赖 SSH stdout。

