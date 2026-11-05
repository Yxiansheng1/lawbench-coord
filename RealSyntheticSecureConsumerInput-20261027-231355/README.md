# T32 合成案卷真实 OCR / 提示词优化 / 取消恢复消费者

状态：`AUTHORED_NOT_RUN`。

本目录只有作者编写的有限消费者 `consumer.py` 和本说明。作者没有运行它，没有产生任何真实 OCR、模型、取消或恢复结果；本文件中的 PASS、FAIL、BLOCKED、NOT_EXERCISED 均只是运行后可写入的状态定义。

## 1. 唯一入口

只接受两个必填参数：

```powershell
& '<已由 root 核验的 Python 3.12 python.exe>' -B -X utf8 `
  'D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RealSyntheticOCRRefine-20261027-225347\consumer.py' `
  --parent '<ABS 绝对路径；必须是新建或不存在的空普通目录>' `
  --phase '<ocr|refine|cancel>'
```

`--phase` 每次只能给一个值，没有 `all`、重试、自动串联或隐式补跑。每个 phase 必须换一个全新的 `--parent`。推荐 root 使用协调目录下不入 Git 的运行树，例如：

```text
D:\Lawbeach\lawbench-coord\B-real-synthetic-runs-20261027-225347\ocr-<unique>
D:\Lawbeach\lawbench-coord\B-real-synthetic-runs-20261027-225347\refine-<unique>
D:\Lawbeach\lawbench-coord\B-real-synthetic-runs-20261027-225347\cancel-<unique>
```

这些只是推荐路径；root 应使用自己的唯一后缀，确保目录不存在或为空。消费者不做递归删除，不复用旧运行目录。

命令必须由 root 用 Windows `pwsh.exe` 执行，`login=false`，不能用 Bash、sh、cmd 包装。作者不执行此命令。

## 2. 固定输入与先导校验

消费者在导入 `httpx` 和任何 `lawbench` 产品模块之前：

1. 校验 `targets.json` 的精确字节数和 SHA-256。
2. 校验 `fixed-inputs.json` 的精确字节数和 SHA-256。
3. 校验 OWNER 原始授权文件的精确字节数和 SHA-256。
4. 校验 `targets.json` 的全部公开非密字段与本消费者常量完全一致。
5. 校验固定清单共 15 项，逐项比较实时文件和协调目录快照的字节数与 SHA-256。
6. 校验固定 JPEG 身份：47,379 字节、SHA-256 `feeb9faf...59ad`。
7. 校验消费者自身仍位于 `targets.destination`。
8. 校验 `--parent` 是绝对路径、普通目录、且不存在或为空。

任一检查失败不进入产品导入，也不发起网络请求。运行结束的 finally 会再次校验 15 项源码/素材快照、固定输入哈希和原始 JPEG 的字节数、SHA-256、`mtime_ns`；失败结果仍写明，不删除证据。

## 3. 私有运行边界

消费者在 owned root 下创建并使用：

```text
private\home
private\appdata\roaming
private\appdata\local
private\temp
```

运行时把 `HOME`、`USERPROFILE`、`APPDATA`、`LOCALAPPDATA`、`TEMP`、`TMP` 临时指向这些目录，finally 恢复原进程环境。环境变量值不写入 stdout、result 或 metadata。

以下访问被进程内阻断：

- 导入 `keyring` 或 `keyring.*`。
- `subprocess.Popen` 创建子进程。
- `os.system` 和 Windows `os.startfile`。
- 任何不是 `10.126.126.1:8000` 或 `10.126.126.3:9000` 的 socket 目的地址或地址解析。

socket 审计只在本消费者进程内；没有修改系统代理、防火墙、网络策略、设置服务、全局 JSON、注册表、ACL、审批或沙箱。记录的是允许地址的尝试/成功/失败计数和拒绝计数，不把它称为全局网络审计。

消费者不读取 `.env.local`、Keyring、凭据、token 文件、真实案卷、DSH cache/history/rollout、发票或 registry。不启动 app、lifespan、OcrQueue、Retainer、Office 或任何服务，不创建 case task/history。

## 4. 公开合成 marker

`lawbench-synthetic-no-secret-acceptance` 是固定输入里的公开合成测试数据，不是律师 Key。消费者只把它作为进程内 `key_getter` 的单个非空字面值传给实际产品 API，不读取或猜测其他凭据。

如果当前后端接受该 marker，只能说明这次真实调用在该服务当前配置下被接受；它不证明真实凭据有效，不证明鉴权安全，也不代表生产凭据验收。

若网关或 395 实际返回 401/403，或 refine 返回 `KEY_INVALID`，该 phase 立即记 `BLOCKED_AUTH_REQUIRED`，不重试、不换 key、不绕鉴权。若 395 因上游 keycheck 返回 503，产品接口只暴露 `KEY_CHECK_UNAVAILABLE` 或 `Busy` 一类结果，消费者不会把不可见的 401/403 猜成已知事实。

## 5. 三个 phase 的实际调用链

### OCR

实际调用：

```text
render_png(fixed JPEG, "image", 1)
→ Net(private server dict, VPN primary, alt=None)
→ PageSender(Net, lambda: PUBLIC_MARKER).send(actual PNG)
→ Net.select("prep") 的 GET /health
→ POST http://10.126.126.3:9000/v1/ocr/page
```

只发一页；请求不带 query，因此 395 使用默认 `deskew=true`、`dewatermark=false`、`return_image=false`。渲染在内存中完成，不写临时图片。

记录实际返回的完整 `markdown`、`unclear`、消费者实测耗时、PNG 字节数/SHA-256/宽高/PNG 类型字段，以及 fixture 前后身份。395 服务端可能为 keycheck 自行向 6000D 发一次 `max_tokens=1` 请求，该上游调用不能由本地 socket 观察精确计数，因此不伪造数量。

OCR 质量按固定生成器的 `SCREENSHOT_LINES` 与 targets 检查：

- 姓名 `张某甲`
- 姓名 `吴某`
- 金额 `80000`
- 尾号 `0417`
- 日期 `20250310`

规范化只用于比较，不改实际输出：

- 使用 Unicode NFKC；
- 删除比较副本中的全部 Unicode 空白；
- NFKC 后的全角数字/符号按标准映射；
- 金额接受 `80000`、`80,000`、`￥80,000.00`、`¥80,000.00` 这类仅分隔符/货币符号/末尾 `.00` 差异；
- 日期接受 `2025-03-10`、`2025/03/10`、`2025.03.10`、`2025年3月10日` 这类仅分隔符和月份前导零差异。

不修正、不补写、不放松姓名、金额数值、尾号或日期值。任一值找不到即实际质量 FAIL。

### Refine

实际调用：

```text
refine.refine(
  Net(private server dict, VPN primary, alt=None),
  lambda: PUBLIC_MARKER,
  [],
  targets.synthetic_prompt,
  None,
  ["转账截图"],
)
```

`refine.refine` 内部使用实际 `LLM.chat`、生产 SYSTEM、固定 `max_tokens=512`、固定温度、关闭思考、32K 窗口：

```text
Net.select("llm") 的 GET /v1/models
→ SSE POST http://10.126.126.1:8000/v1/chat/completions
```

不提供自定义 `llm_factory`、mock、模型替换或其他端点。记录完整返回 dict 和实际输出，并独立要求：

- `refined == true`
- 输出非空
- 输出与输入不同
- 保留 `张某甲`
- 保留 `吴某`
- 保留金额 `80000`；只额外接受语义完全相同的 `8万元`
- 保留日期 `2025-03-10`
- 成功返回不带失败 `reason`
- 没有 app、NativeSession、case task 或 history 状态

这是单个真实样本的提示词细化检查，不是广义模型质量、业务质量或全 T32 验收。

### Cancel

实际调用 unchanged `LLM.chat`，参数固定为 `qwen38-27b`、`max_tokens=512`、`temperature=0.0`、关闭思考、32K 窗口。一个非 daemon 的消费者观察线程只做以下动作：

1. 等待调用穿透 transport 观察到真实 `POST /chat/completions` dispatch。
2. 在该 dispatch observation 后立即设置实际线程 `threading.Event`，让 unchanged 产品代码自行关闭 client 并抛出 `Cancelled`。
3. 另行记录同一 `pipeline-request` 线程在取消瞬间和自然 unwind 时是否观察到 socket 建连；连接池复用不会被伪造为“新建连接”。

没有假慢服务器、人工 latency、sleep、模拟挂起或替代响应。结果区分：

- `CANCELLED_AFTER_REQUEST_DISPATCH_AND_CONNECT`
- `CANCELLED_AFTER_REQUEST_DISPATCH_CONNECTION_NOT_OBSERVED`
- `NOT_EXERCISED_NATURAL_COMPLETION`
- `NOT_EXERCISED_NO_CHAT_DISPATCH`
- `REQUEST_ENDED_WITHOUT_CANCEL_OBSERVED`

只有产品在真实 transport dispatch 后实际抛出 `Cancelled`，才进入同一模型的实际普通恢复请求。恢复请求是独立的 tiny synthetic instruction、`max_tokens=16`、关闭思考、32K 窗口，用于验证新连接池可继续工作，不改模型或产品参数。

记录取消前后线程名称/数量、dispatch、建连、产品异常类型、产品 `pipeline-request` 线程对象、自然 unwinding/join 结果和恢复线程。若线程在 86,400 秒技术 watchdog 后仍存活，绝不声称 clean。没有远端 `/admin`、395 日志、499 或 vLLM abort 证据，因此结果固定写明 `server_side_499_or_vllm_abort_claimed=false`。

## 6. 产物

每次运行在 `--parent` 本身写入：

```text
summary.json   元数据摘要，也是 stdout 唯一 JSON
result.json    实际返回/输出、断言、HTTP 元数据、线程和隔离证据
metadata.json  固定输入、双次源码基线、fixture 前后、socket 计数、日志哈希、清理状态、产物哈希
private\...    私有 HOME/APPDATA/TEMP 与产品 service.log
```

完整合成 OCR 输出和模型输出只允许写在该 owned root 的 `result.json`。stdout 只打印 summary，不打印模型输出、HTTP headers、请求体、Key、token 或原始异常文本。HTTP 记录只有 method、host、port、path、是否有 query、状态码、错误类名和线程名称/编号。

产品日志由 unchanged `logs.setup(private appdata)` 建立，finally 调 `logs.close()`。消费者再对 `service.log` 计算字节数/SHA-256，并检查 synthetic prompt、OCR 输出或模型输出没有出现在日志中。

退出码：

| 退出码 | 状态 | 含义 |
|---:|---|---|
| 0 | `PASS` | 该单 phase 的实际断言与清理均通过 |
| 2 | `FAIL_ACTUAL_ASSERTION` | 实际 OCR/refine/取消恢复或运行时断言失败 |
| 3 | `BLOCKED_AUTH_REQUIRED` | 实际 401/403 或产品暴露 `KEY_INVALID` |
| 4 | `SETUP_ERROR` | 参数、固定输入、基线、fixture、普通目录或私有环境错误 |
| 5 | `CANCEL_NOT_EXERCISED` | 请求自然完成或取消早于真实网络连接 |
| 6 | `UNEXPECTED_ERROR` | 其他实现级异常，只记录异常类名 |

## 7. 已知限制

- OCR 产品 `PageSender.send()` 只返回 `markdown` 和 `unclear`，不暴露 395 返回体里的 `elapsed_ms` 或 backend；消费者记录自己的 measured phase elapsed，不伪造服务端字段。
- 395 的 keycheck 是服务端内部调用 6000D，消费者只能记录“不可本地测量”及可能发生一次 `max_tokens=1` 请求，不报告精确上游请求数。
- 取消只证明本地产品观察到 dispatch、真实建连、线程取消与自然 unwind；没有远端服务端日志，不能证明网关 499、vLLM abort 或后端进程已停止。
- 公开 marker 被接受不等于真实 Key 安全验收。
- refine 的金额等价写法只放行固定事实相同的 `8万元`，不放行其他数。
- OCR 和 refine 都只使用指定一个合成样本；不覆盖队列持久化、GUI、NativeR、Hostclaim、全 T32 或广义业务质量。
- 任何实际事实差异是样本结果，不据此自动改产品、测试、fixture、提示词常量或契约。

## 8. 作者本次实际执行记录

作者状态为 `AUTHORED_NOT_RUN`。以下命令类别均通过指定原生 `pwsh.exe`、`login=false` 执行：

- 只读读取正式执行令、OWNER 授权、targets/fixed-inputs、相关产品源码、契约、Spec、PROJECT-PROFILE、fixture README 和健康证据：`Get-Content`。
- 只读枚举 T32 目录和契约文件：`Get-ChildItem`。
- 只读计算 targets、fixed-inputs、授权与 15 项固定输入的 SHA-256/字节数：`Get-FileHash`、`Get-Item`。
- 只读文本定位：`rg`。
- 一次只读 Git 状态检查：`git status --short --branch`。
- 为逐项审计 15 项固定清单，用 PowerShell `ConvertFrom-Json` 对 fixed-inputs 做了只读取值。该操作未执行产品代码、未导入产品、未运行 fixture 或产品解析器，但按正式令“作者不得运行 parser”的字面边界，这是必须披露的偏差；它没有修改状态，也没有产生实际测试结果。

未执行 Python、Node、pytest、Vitest、tsc、import、HTTP、模型、OCR、业务代码、测试发现、build、serve、probe 或 selftest。未运行消费者。

Git 唯一非零命令是：

```text
git status --short --branch
exit 1
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

该阻碍原样记录，未尝试修复权限、改锁、扩权或改变 Git 状态。Git 全程只读；没有 add、commit、rebase、merge、reset、stash、checkout、clean、push 或任何 staging 写入。

另有两条只读 `rg` 命令非零：第一次 pattern 以 `--phase` 开头，被 `rg` 当作未知选项；第二次把 `-g '*.py'` 放在 `--` 之后，被当成文件名。两次都没有修改文件；修正参数顺序后的同类检索退出 0。

另有一次工具参数误写为 `shell=bash`；宿主在命令执行前以 `Bash/E_ACCESS_DENIED` 拒绝。该错误违反“所有 exec 必须指定原生 pwsh”的操作纪律，但没有启动 Bash、没有执行命令，也没有文件或 Git 副作用；之后只用指定原生 `pwsh.exe` 重跑。

另有两次工具调用因参数对象重复字段而未进入 Shell 执行；没有产生命令、文件或 Git 副作用。
