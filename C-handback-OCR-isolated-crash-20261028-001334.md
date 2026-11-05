# C 交回：395 独立同二进制合成 OCR 崩溃定位候选

状态：`AUTHORED_NOT_RUN`

作者只写候选与本文，没有在 395、6000D 或本机启动模型、服务、Python 候选、PowerShell
候选、HTTP、SSH、SCP、GUI、构建、安装、自检或测试。没有生成新的 root、模型或质量结果，
没有确认 native 根因，也没有把本次交付说成 OCR PASS/FIX。

## 1. 目标与出处

唯一任务入口：

`D:\Lawbeach\lawbench-coord\C-OCR-isolated-crash-order-20261028-001334.md`

既有事实与证据：

- 固定输入快照：
  `D:\Lawbeach\lawbench-coord\OCRIsolatedCrashInput-20261028-001334\inputs.json`
- 395 只读 SSH 元数据：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\395-SSH-readonly-evidence-current.json`
- 合成测试授权：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\real-synthetic-authorization-current.json`
- B 既有合成消费者交回：
  `D:\Lawbeach\lawbench-coord\B-handback-real-synthetic-OCR-refine-20261027-225347.md`
- B 既有失败运行原始结果：
  `D:\Lawbeach\lawbench-C\docs\plan\evidence\T32\RealSyntheticSecureInput-20261027-225913\runs\root-20261027-234232\ocr\result.json`

只读核对得到的事实：

- B 纯合成夹具 `criminal-01\转账截图.jpg`：47,379 字节，SHA-256
  `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`；
- 既有生产 renderer 原始结果：750×1334 PNG，132,843 字节，SHA-256
  `6c8399569502b6444544960b3e6f32ed43e5ada8a47ff6f7c039127ab813c40a`；
- B 旧消费者真实请求得到 HTTP 500 / `ReadError`，本地记录耗时约 22,016 ms；这不是本次
  重新执行的结果；
- root 已转录同一时段 Windows Application 1000：`llama-server.exe`、`ucrtbase.dll`、
  `c0000409`；精确 native assertion 未保留；
- 当前 `app.py`、`backends.py`、`dewatermark.py`、B `render.py` 均与固定输入快照字节数
  和 SHA-256 相等。

候选针对的是“同一固定合成输入、同一预处理、同一后端请求体、同一二进制/模型”的有限
私有复现。它不推断 OOM、驱动、模板、GGUF、升级或版本问题是根因。

## 2. 改动清单与 Git

只新增指定候选目录和本交回件：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\prepare_isolated_inputs.py` | 9,899 | `79ae8cbb78d5fd32210a44bc43fa323357a95a2ce7e4462c43e28ddcbe7c6641` |
| `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\run-isolated-ocr.ps1` | 29,044 | `d36a3be66da749112059ebf9b29b760b88f9154095343b1de91fca2beef83232` |
| `D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\README.md` | 10,545 | `2477e1659a11a9cd96e8fcc0cde1de1b37a8a10b10fc2a14e3312e351be4b910` |
| `D:\Lawbeach\lawbench-coord\C-handback-OCR-isolated-crash-20261028-001334.md` | 本文件 | 不预置自哈希 |

没有 Git 提交 SHA。正式令覆盖项目通用提交要求；全程 Git 只读，没有
`add / commit / rebase / merge / reset / stash / checkout / clean / push` 或 staging 写入。

开工前工作树已 dirty，以下是保留下来的既有状态，不是本次候选产出：

```text
## line-C...origin/line-C [ahead 84, behind 1]
 M packaging/THIRD-PARTY-LICENSES.md
 M packaging/build.ps1
 M packaging/gen_lock.py
 M service/lawbench/app.py
 M service/lawbench/net.py
?? .agents/
?? AGENTS.md
?? docs/plan/evidence/T31/
?? docs/plan/evidence/T32/
?? docs/plan/evidence/T40/本机验证-20261021-1536/baseline.txt
?? docs/plan/evidence/T40/本机验证-20261021-1536/write-test.txt
?? docs/plan/evidence/T40/本机验证-20261021-1536/开工前/files/.agents/
?? docs/plan/evidence/T40/本机验证-20261021-1536/开工前/files/AGENTS.md
?? docs/plan/evidence/T40/本机验证-20261021-1536/开工前/files/docs/
?? dsh-ext/tests/t31-material-capture-disposal.spec.tsx
?? dsh-ext/tests/t31-submission-registry-admit.spec.tsx
?? dsh-ext/vitest.t31-submission-registry-admit.config.mjs
?? packaging/licenses/
?? service/lawbench/remote.py
?? service/tests/fake_easytier.py
?? service/tests/test_remote.py
```

最终只在上述 dirty 集合上新增：

```text
?? prep395/deploy/isolated-synthetic-crash-20261028-001334/
```

没有改产品、既有 deploy、config、guard、engine、native exe、模型、source pin、25 个
outputs、18 个 legacy、E50、旧测试或 author status。

## 3. 候选行为

### 3.1 本地准备

`prepare_isolated_inputs.py` 在任何导入前硬校验固定夹具及四个生产源码的字节数和
SHA-256；设置 `sys.dont_write_bytecode=True`，从实际固定 `render.py` 源码执行：

```text
render_png(fixture, "image", 1)
  -> prep395._open_image(rendered, 2480)
  -> prep395._preprocess(image, deskew=True, dewatermark=False)
  -> 生产 Xiaomi 图前文后提示词与 LlamaServerBackend._chat 同形 body
```

它不调用 `create_app()`、不进入 lifespan、不实例化 KeyChecker 或 backend、不读业务
Key、不发起网络/模型调用。输出目录必须尚不存在，成功后是 `PREPARED_NOT_RUN`，并记录
实际 render、preprocess、request、manifest 的字节数和 SHA-256。

请求体与未改产品源码一致：

```text
model=Xiaomi-OCR-0.BF16.gguf
image_first=true
temperature=0
max_tokens=4096
stream=false
chat_template_kwargs.enable_thinking=false
```

JSON 字节语义与已安装 HTTPX 0.28.1 的 `encode_json` 一致：
`ensure_ascii=False,separators=(",", ":"),allow_nan=False`。

### 3.2 远端单实例

`run-isolated-ocr.ps1` 是纯 ASCII、无 BOM PowerShell，兼容 Windows PowerShell 5.1。
它只接受当前用户 TEMP 下、没有 reparse 组件的私有一级输入 stage。启动模型前硬校验：

- 夹具、render、预处理 PNG、请求 JSON、生产源码 pin 和 Xiaomi 原提示词；
- 二进制：
  `C:\prep395\llama\llama-server.exe`，
  SHA-256 `9d7ec1f038329210f6be353a889752ea4a762f9defa80560d37102ccce7b09a06`；
- 模型：
  `C:\prep395\models\Xiaomi-OCR-0.BF16.gguf`，1,516,744,960 字节，
  SHA-256 `D796FA2CD211BA39A40F37691FC0046AA49F59C7968EC844EB9E81F2AE476A52`；
- mmproj：
  `C:\prep395\models\Xiaomi-OCR-0.mmproj-bf16.gguf`，207,346,624 字节，
  SHA-256 `634D6BC95781EBF4A3F06570A59859FA5082D488DB540FD474BC6B4061AEC90E`；
- 生产 9000、9101、9102 均已有 listener，且启动前后 PID、路径、UTC birth、
  listen 地址/端口集合保持一致。

唯一私有进程参数：

```text
-m <fixed Xiaomi model> --mmproj <fixed mmproj> --port <random loopback port>
-np 2 -c 32768 --host 127.0.0.1 -ngl 99 --no-webui
```

固定 `install.ps1` 当前没有 `--no-warmup`，候选不增加未知参数。候选有意不传生产
`--log-disable`，只为了取得私有 stdout/stderr；这是 README 中明示的唯一启动参数差异。
工作目录和 `HOME / USERPROFILE / APPDATA / LOCALAPPDATA / TEMP / TMP` 均在该私有
stage 下，子进程环境只复制系统启动所需变量，不带代理，不改全局环境。

readiness 只认私有 `/health` 的实际 HTTP 200，每次沿用产品 health 的 3 秒超时；
总窗口取产品 `ocr_timeout_s=120`。唯一请求使用产品
`LlamaServerBackend(timeout_s=ocr_timeout_s+10)` 的 130 秒边界。启动点、推理 POST
静态计数均为 1；非 loopback URI 为 0。

最后只对本次 `Process` 对象停止，并在停止前再次核对 owned PID、可执行路径、UTC birth。
仍存活则记录 `forced_stop=true`，不声称自然退出。纯合成结果、stdout/stderr、生产
前/后只读快照、listen closure、响应或异常均留在私有 stage；不递归清理。

## 4. 红绿与证据

本次没有执行红绿，因为没有获准运行 Python、PowerShell 候选、模型、HTTP、SSH、SCP、
parser、import、compile、collect、serve、probe、selftest 或测试，也没有远端证据。

只读静态检查为绿：

- 固定夹具和四份生产源码字节数/SHA-256 与输入一致；
- 旧 B 结果中的 render 750×1334、132,843 字节及 SHA-256 与根令一致；
- HTTPX 0.28.1 安装源确认 JSON 编码方式与准备脚本一致；
- 候选文件不含真实 Key、密码或业务材料；
- `prepare_isolated_inputs.py` 无 socket/HTTP/subprocess/create_app/KeyChecker/backend
  实例化调用；
- `run-isolated-ocr.ps1` 只有一个 `llama-server` 启动点和一次推理 POST；
- 无 `Stop-Service / Restart-Service / Set-Service / sc.exe / firewall / schtasks`
  等生产变更；
- 权威脚本为纯 ASCII、无 BOM，避免 Windows PowerShell 5.1 对无 BOM 非 ASCII 的误读。

候选证据路径：

`D:\Lawbeach\lawbench-C\prep395\deploy\isolated-synthetic-crash-20261028-001334\`

## 5. 契约、安全与命令

没有改接口、契约、字段、生成文件、文档 HTML、产品配置、模型、GGUF、服务 XML、
日志模式、权限、ACL、锁或安全策略。

README 给出了 root 审计后的精确本地准备、先传候选源码、再传三份纯合成输入、最后
单次远端执行的 CLI。作者没有执行其中任何 SCP/SSH 命令；密码不属于本 job。实际执行
前仍须 `ROOT_REVIEW_THEN_HUMAN_RESOURCE_APPROVAL`。

候选会额外占用 Vulkan/GPU 和共享物理内存，可能触发显存分配、驱动或页面文件压力。
不得说成零影响。私有进程以 SSH 调用者身份运行，可能不同于生产 `prep395svc` 服务账户；
身份/ACL 差异会记录，但不改账户或 ACL。

本次所有 shell 调用均走指定原生 `pwsh.exe`、`login=false`，除下列四次误把 `shell`
参数写成 `bash`。这四次均被宿主在命令执行前以 `Bash/E_ACCESS_DENIED` 拒绝，没有启动
Bash，也没有文件、Git、进程或网络副作用；之后用原生 PowerShell 重跑对应只读检查。
这是执行纪律偏差，明确交 root 审计。

另有一次只读审计用 PowerShell `ConvertFrom-Json` 读取既有 B 结果，并用正则做静态
文本计数。它们没有导入或运行产品代码、fixture/产品 parser、模型或网络；但按“作者
不得运行 parser”的严格字面，属于形式偏差，一并披露。

命令日志按发生顺序：

| ID | 命令/目的 | exit |
|---|---|---:|
| A01 | `Get-Content ...C-OCR-isolated-crash-order... -Raw` | 0 |
| A02 | `git status --short --branch` | 1；`dsh` submodule chdir Permission denied |
| A03 | `Get-Content ...OCRIsolatedCrashInput...inputs.json -Raw` | 0 |
| A04 | `Get-Content ...395-SSH-readonly-evidence-current.json -Raw` | 0 |
| A05 | `Get-Content ...real-synthetic-authorization-current.json -Raw` | 0 |
| A06 | `Get-Content ...PROJECT-PROFILE.md -Raw` | 0 |
| A07 | `git status --short --branch --ignore-submodules=all` | 0 |
| A08 | `Get-Content prep395\prep395\app.py -Raw` | 0 |
| A09 | `Get-Content prep395\prep395\backends.py -Raw` | 0 |
| A10 | `Get-Content lawbench-B\service\lawbench\ocr\render.py -Raw` | 0 |
| A11 | `Get-Content prep395\deploy\操作单-换Xiaomi-OCR-0.md -Raw` | 0 |
| A12 | `rg` 夹具/根令哈希，范围含 C 与 coord、排除 `.git`/`dsh` | 0；输出过大被宿主截断 |
| A13 | `Get-Content prep395\prep395\dewatermark.py -Raw` | 0 |
| A14 | `Select-String ...install.ps1 -Pattern ...`，误传 `shell=bash` | 1；执行前 `E_ACCESS_DENIED` |
| A15 | `rg ...Xiaomi/model/port/log flags...`，误传 `shell=bash` | 1；执行前 `E_ACCESS_DENIED` |
| A16 | `Get-Content ...\5-操作单-换Xiaomi-OCR-0.md -Raw` | 0 |
| A17 | `Get-Content ...B-handback-real-synthetic-OCR-refine... -Raw` | 0 |
| A18 | 夹具 `Get-FileHash` + `Get-Item` | 0 |
| A19 | install.ps1 参数 `Select-String` | 0 |
| A20 | install.ps1 `Get-Content -Raw` | 0 |
| A21 | `rg` 旧 render evidence，范围含不存在的 `evidence\T37` | 1；T37 path missing；其余命中正常 |
| A22 | `Get-Content prep395\prep395\config.py -Raw` | 0 |
| A23 | `Get-Content` 旧 B `ocr\result.json -Raw \| ConvertFrom-Json` | 0 |
| A24 | `Get-ChildItem input snapshot dir`，误传 `shell=bash` | 1；执行前 `E_ACCESS_DENIED` |
| A25 | 四份产品源码 `Get-FileHash` + `Get-Item` | 0 |
| A26 | 目标 candidate/handback `Test-Path` | 0；当时均不存在 |
| A27 | `Get-Content prepare_isolated_inputs.py -Raw` | 0 |
| A28 | `Get-Content run-isolated-ocr.ps1 -Raw` | 0 |
| A29 | `Get-Content prep395\pyproject.toml -Raw` | 0 |
| A30 | `Select-String run-isolated-ocr.ps1` 禁用服务/外连/固定 flags | 0 |
| A31 | `Select-String prepare_isolated_inputs.py` 调用边界 | 0 |
| A32 | `Get-ChildItem prep395` | 0 |
| A33 | `rg --files prep395 \| rg httpx...` | 1；无匹配 |
| A34 | 候选三文件 `Get-FileHash` + `Get-Item`（首轮） | 0 |
| A35 | README 固定值/边界 `Select-String` | 0 |
| A36 | `Get-Command python` | 0 |
| A37 | `Get-ChildItem` 多个可能 Python 根目录 | 1；部分候选路径不存在，已成功列出 Python312/38 |
| A38 | 候选三文件 `Get-FileHash`（第二轮） | 0 |
| A39 | `Get-Content lawbench-B\pyproject.toml -Raw` | 1；该文件不存在 |
| A40 | `Get-Content` 已安装 HTTPX `_content.py -Raw` | 0 |
| A41 | `Get-ChildItem` HTTPX dist-info | 0；0.28.1 |
| A42 | `Get-ChildItem lawbench-B` 根目录 | 0 |
| A43 | 候选脚本 process/POST/service token 计数 | 0；确认后收紧两处实现 |
| A44 | 四份生产源码终轮 size/hash | 0 |
| A45 | 候选文件终轮 size/hash | 0 |
| A46 | `git status --short --branch --ignore-submodules=all` | 0；dirty 基线未变 |
| A47 | 凭证词 `Select-String`，误传 `shell=bash` | 1；执行前 `E_ACCESS_DENIED` |
| A48 | owned process/TCP listener/POST/Kill 精确计数 | 0 |
| A49 | 凭证词 `Select-String`，原生 PowerShell 重跑 | 0；只命中防护 regex 和空字段 |
| A50 | `Get-Content` run 脚本参数/清理段 | 0 |
| A51 | `Get-Content` run 脚本时限/函数段 | 0 |
| A52 | run 脚本 byte/non-ASCII/BOM 检查 | 0；当时发现 12 个非 ASCII 字节 |
| A53 | `Get-Content` run 脚本头与校验段 | 0 |
| A54 | `Get-Content README -Raw` | 0 |
| A55 | run 脚本 ASCII/BOM 终检 | 0；纯 ASCII、无 BOM |
| A56 | 单进程/单 POST/非 loopback URI 终检 | 0 |
| A57 | 候选三文件最终 size/hash | 0 |
| A58 | 候选三文件 + 本文 size/hash | 0 |
| A59 | 最终 `git status --short --branch --ignore-submodules=all` | 0；只新增指定候选目录 |
| A60 | 本文状态、候选 hash、六节数量、残缺 patch marker 检查 | 0 |
| A61 | 本文 `Get-Content -Tail 35` | 0 |

所有 `apply_patch` 写入仅限上述 candidate 与本文。Git 状态发生非零的唯一原因就是
`dsh` submodule 的现有权限；按令没有尝试修 index.lock、权限、ACL、审批、沙箱或 writer 锁。
正式件第一次 `apply_patch` 因 Markdown 代码块行首符号触发补丁校验，文件未创建；随后
分段写入成功，没有残留半文件。

## 6. 自检与遗留

- 当前状态仍是 `AUTHORED_NOT_RUN`；没有任何 OCR 运行证据，不能报告 PASS、FAIL、
  BLOCKED 或根因。
- 固定 `install.ps1` 未含 `--no-warmup`；本候选不添加。若 root 认为生产实际 XML
  另有该参数，应在执行前以实际 XML 复核并显式记录，不能凭假设改候选。
- `--log-disable` 是故意漏传，因生产 log-mode-none 会让本诊断失去 native stderr；
  root 应把这视为已声明的 log-capture 差异。
- 公开 `fixture` 是纯合成材料，不是真实案卷；本地准备输出可含该合成图片和 OCR 请求，
  远端 stage 只能留在 root 指定的私有 TEMP 目录。
- 私有实例会消耗 GPU/共享内存；执行前必须由 root 向人类明示并取得资源批准。
- 本候选不证明生产修复、不证明模型质量，不证明 `c0000409` 由哪个组件触发。
- 作者到此停止。只有 root 可以独立审计候选、决定是否执行，再按 README 的
  `ROOT_REVIEW_THEN_HUMAN_RESOURCE_APPROVAL` 边界推进。
