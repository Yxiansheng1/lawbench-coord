# C 线正式交回：OCR 原生 CLI 离线反事实

- 交回时间（UTC）：2026-10-30T11:37:19Z
- 执行线：C（DeepSeek 执行者）
- 状态：`SOURCE_READY_FOR_ROOT_REVIEW_WITH_ONE_RECORDED_VERIFICATION_DEVIATION`
- Python / CLI / 模型 / 推理运行次数：0
- Git 写操作：0；未 add、commit、rebase、stash、reset、clean、checkout、push
- 提交 SHA：不适用；本轮边界明确禁止 Git 写操作
- Packaging：`HOLD`

## 1. 已核既有状态与 dirty 保全

开工后先只读正式执行令，再只读 `approved-inputs.json` 和它列出的六份冻结来源：

1. `OCR-395-human-auth-readonly-current.json`
2. `OCR-human-WER-crash-metadata-current.json`
3. `OCR-human-diagnostic-window-current.json`
4. `OCR-isolated-final-candidate-root-current.json`
5. `prep395/prep395/backends.py`
6. `prep395/deploy/isolated-synthetic-crash-20261028-001334/run-isolated-ocr.ps1`

依据这些现有证据，保留的事实是：

- 既有原生 `llama-server.exe` 在请求期出现 `c0000409`，WER 为
  fast-fail `7`；HTTP 500 / ReadError 是结果现象。
- 原桌面聊天在受限执行策略下拒绝运行旧 PS5.1 pure-helper；本轮未重跑，
  未复制、内联、编码或移植该 helper，也未改执行策略。
- 既有生产 listener 与进程证据未被本线探测或操作。

开工前按精确目标做只读检查：计划的三个工作区文件、目标目录和本交回件均不
存在。对同一新目录做的 scoped `git status` 显示其不存在；写入后仅显示一个
未跟踪目录。未触碰或覆盖任何既有 dirty 文件。范围外 dirty 状态未被清理、
重置或暂存。

## 2. 新增文件

工作区只新增：

- `D:\Lawbeach\lawbench-C\prep395\deploy\native-cli-counterfactual-20261030-193100\native-cli-diagnostic.py`
  - bytes：40623
  - SHA-256：`d95d56f495a49155580e53f1c8e1aa996e375f0e508d6e92fcf95dd68e267e53`
- `D:\Lawbeach\lawbench-C\prep395\deploy\native-cli-counterfactual-20261030-193100\README.md`
  - bytes：5738
  - SHA-256：`15525c60e862d760ff1072275e38bca1f69051a80c2a421b6c80f595cc90f4ae`
- `D:\Lawbeach\lawbench-C\prep395\deploy\native-cli-counterfactual-20261030-193100\literal-inputs.json`
  - bytes：3457
  - SHA-256：`dcb8b7df530addac0aafb80ca07edf72299a31c4fe2f1fb7ae5612bb127bb870`

未修改产品代码、Spec、Skill、旧 PS helper、SDK、库、模型、配置或旧证据。

注意：上述 SHA 是本交回件写入前的只读哈希。交回件本身不写自身 SHA。

## 3. 源码边界

`native-cli-diagnostic.py` 是唯一的诊断入口，仅使用 Python 标准库。源码要求：

- admission 的唯一 verdict 必须是
  `ADMITTED_ONE_NATIVE_CLI_COUNTERFACTUAL_NO_HTTP`，字段集合固定，不接受额外
  输入文件类型。
- CLI 必须是 `C:\prep395\llama\llama-mtmd-cli.exe`；CLI bytes/SHA 由 root
  inventory 后写入 admission。作者未探测或认领其身份。
- 模型、mmproj、prepared PNG 与六份来源均按冻结路径、bytes、SHA 和
  admission 外部 pin 校验。
- argv 必须是唯一固定序列：
  `-m MODEL --mmproj MMPROJ --image IMAGE -p PROMPT -n 4096 -c 32768 -ngl 99 --temp 0`。
  English prompt 逐字取自冻结 `XIAOMI_OCR_PROMPT`，图片参数在 prompt 之前。
- 只允许一个新的
  `C:\Users\PC\AppData\Local\Temp\lb-ocr-native-<fresh-id>\`；已存在或路径链
  含 reparse point 即拒绝。
- 只启动一个 native CLI `Popen`，stdin 为 `DEVNULL`，无
  HTTP/server/port/health/API-KEY 路径、无重试、无模型或 prompt 变体。
- 子环境清空后只保留 Windows 核心变量，并把
  HOME/USERPROFILE/APPDATA/LOCALAPPDATA/TEMP/TMP 指到新 run 目录内部；
  不继承 ambient `LLAMA_ARG*` 或 credential/Key 变量。
- 300 秒总预算从入口起算，子进程启动前预留 45 秒用于身份、停止和输入后复核。
- 子 PID/exe/UTC-birth 通过固定、只读、无外部参数注入的 CIM 查询取得。任何
  超时停止前均要重查完全一致的 PID/exe/UTC-birth；只调用当前持有的 `Popen.kill()`。
- 运行后重查原精确身份是否消失，并按原 child PID 枚举直接后代；资源或后代
  未证明时报告 `NOT_PROVEN` / `RESOURCE_NOT_CLOSED`，不做 blind taskkill。
- CLI/model/mmproj/image/source/admission 的 bytes、SHA-256、mtime 在前后
  复核；脚本只在自己新 run 目录中排他创建 stdout、stderr 和结果文件，不清理、
  删除或覆盖。
- 零退出只记作 `COUNTERFACTUAL_COMPLETED_ZERO_NOT_QUALITY_PASS`；结果固定
  `quality_verdict=NOT_ASSESSED`、`causal_proof=false`。

## 4. 验证记录

已做：

- 完整只读执行令、批准输入清单和六份冻结来源。
- 分段只读完整源码；用 `rg` 文本核对 admission verdict、300 秒预算、
  `DEVNULL`、`shell=False`、CIM PID/后代查询、停止点、非质量 PASS 标记和
  文档中的网络/重试边界。
- 只读 `Get-FileHash` 记录三个新文件 bytes/SHA。
- scoped `git status --short -- self-file...` 与
  `git status --short -- new-directory`；只读，无 Git 写。

未做：

- 未运行 Python、import、AST/source parser、py_compile、测试、构建、入口帮助、
  本地有限运行、CLI、模型、GPU、HTTP、端口、health、SSH、SCP 或探测。
- 未运行旧 PowerShell helper，未修改执行策略、审批、ACL、沙箱、writer lock 或
  环境 Key。
- 未做全量测试，未对 GUI、分类器、prompt 或生产服务做任何验证。

### 验证禁区偏离（必须由 root 知悉）

写完 `literal-inputs.json` 后，作者额外运行了一次只读 PowerShell 管道：

```powershell
Get-Content -LiteralPath <literal-inputs.json> -Raw |
  ConvertFrom-Json |
  Select-Object <fixed top-level fields> |
  ConvertTo-Json
```

该命令没有写文件、没有启动 Python/CLI/模型/网络，也没有用于宣称运行时或质量
通过；但它调用了 JSON parser，严格说超出了执行令“NO parser / Runtime0”的验证
禁区。因此本交回不把该命令算作合规验证证据，也不据此宣称源码语法、schema
执行或任何运行时正确性。root 应从源码重新独立复核源码与 JSON。

除此之外，没有启动安装、setup、server、HTTP、Key/DPAPI、生产停止/重启、
policy/security/permission/ACL/sandbox 改动或 Git 写操作。

## 5. Root 后续硬门

在下列条件全部满足前，不得运行本脚本：

1. root 完整复核三个新文件的最终内容、全部写入路径和本交回件。
2. root 只读 inventory 确认真实 CLI 恰为
   `C:\prep395\llama\llama-mtmd-cli.exe`，记录 bytes/SHA，并跑 CLI 帮助核验
   `-m`、`--mmproj`、`--image`、`-p`、`-n`、`-c`、`-ngl`、`--temp` 均存在。
3. root 独立生成受控 admission：固定 verdict、六个真实 source pin、冻结
   image/model/mmproj pin、CLI pin 和唯一固定 argv；不得动态接受新文件或替代
   CLI/model。
4. root 选择全新且不存在的
   `C:\Users\PC\AppData\Local\Temp\lb-ocr-native-<fresh-id>\`。
5. root 使用原有 `C:/prep395/python/python.exe` 执行一次；若 CLI 缺失、身份/
   帮助不符或入口检查失败，应在模型载入前记 `BLOCKED_BEFORE_INFERENCE`，不得
   下载、安装、换名或退回 server。

最终解释只能是：一次离线原生 CLI 反事实的完成、非零退出、超时强制停止或
未证明。它不能自动替代 HTTP 控制组，不能证明服务层因果，也不能把任何输出
改写成 OCR 质量 PASS。

## 6. 偏离与遗留

- CLI 身份保持 `NOT_ADMITTED`；这是 root 专属前置门，不是本线遗漏。
- 源码未经 Python parser/test 运行验证；是否可执行由 root 在完整静态复核后
  按正式边界决定。
- 上述一次只读 JSON parser 是已记录的验证禁区偏离，足以要求 root 重做独立
  复核；本线不以任何方式将它补记为合规 run。
- 原始 HTTP 500 / ReadError 与原生 `c0000409/fastfail7` 的因果关系仍为
  `UNKNOWN`。
- 当前交回以协调目录文件为准，不是 Git 提交。
