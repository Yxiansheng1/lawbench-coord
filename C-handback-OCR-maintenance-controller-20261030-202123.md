# C 线交回：OCR 维护控制器源码

## 结论

状态：`SOURCE_READY_NOT_RUN`

已按 `C-OCR-maintenance-controller-20261030-202123.md` 完成唯一新源码目录内的有界控制器、README 和冻结字面输入索引。没有执行控制器，没有导入或运行 Python，没有启停服务，没有发送 HTTP，没有启动模型或 GPU 实例，没有修改策略、ACL、锁或 Git 索引。

运行时仍须由 Root 完整审阅源码、SCM ctypes 原型、XML 语义逆变换和失败恢复路径后，建立唯一冷启动 stage 与独立 admission，再执行一次维护。

## 新文件

目录：`D:\Lawbeach\lawbench-C\prep395\deploy\maintenance-controller-20261030-202123\`

| 文件 | 字节 | SHA256 |
|---|---:|---|
| `maintenance-controller.py` | 56413 | `223B8792B7D4BE635BFE4C1DFF55F9C731C6736EE278AC450CB41E6D3675460A` |
| `README.md` | 8933 | `74C2862EC23326C9F97028AAF4159D867B028C8720BFC9FBABB8583C3AB46C35` |
| `literal-inputs.json` | 9243 | `239977A30E1EF7DB66855D363BD7F47D581F0288FCAC19175BA8B4425ECF3D59` |

只读限定路径 Git 状态确认该目录为唯一新增项：

```text
?? prep395/deploy/maintenance-controller-20261030-202123/
```

## 实现范围

- 只允许既有服务 `prep395` 和 `prep395-ocr`；`prep395-llm9b` 仅做身份前后核对，其他服务名在代码入口拒绝。
- 服务控制仅经 ADVAPI32 的 `OpenSCManagerW`、`OpenServiceW`、`ControlService`、`StartServiceW`、`QueryServiceStatusEx` 和 `CloseServiceHandle`。进程身份经 Kernel32 `OpenProcess`、`QueryFullProcessImageNameW`、`GetProcessTimes`；后代捕获使用 Toolhelp32，未覆盖项明确为 `PARTIAL_NOTPROVEN`。
- 第一次成功停 `prep395` 后才启动唯一 300 秒计时；主阶段上限 180 秒，恢复截止同时受第一次停服后的总截止和 120 秒保留约束。
- 正常顺序为停 API、停 OCR、应用日志配置、启 OCR 并健康检查、启 API 并健康检查、唯一本地 POST。恢复顺序为停 API、停 OCR、写回原始 XML、启 OCR 并健康检查、启 API 并健康检查。
- 只用一次性冻结请求字节：177698 字节，SHA256 `0b04102960d29ce77935b5a2d7efd5d1fc616aab9770e5260fc893183cfef0d5`；目标固定为 `http://127.0.0.1:9101/v1/chat/completions`。
- XML 原始字节固定为 738 字节、SHA256 `6f38260bf02c49b6e8a64fe9c4deae7bdf3a08970719b456e372e516ed02bc98`。维护增量只替换唯一 `--log-disable`，增加精确自有 `logpath`，并设置 `roll-by-size`、`sizeThreshold=1024`、`keepFiles=2`。
- 恢复只有在原始 XML 精确、两个授权服务 RUNNING 且 `/health` 就绪、9B wrapper/direct 身份未变、旧 API/OCR wrapper/direct 身份均已消失时才是 `PASS`；访问拒绝不算“身份已消失”。
- 所有阶段记录时间、状态和错误。唯一 HTTP 尝试会保留 status、筛选后的 header 元数据、完整 raw body，以及已取得的断连部分 body；HTTP 200 只记为单次接口样本，根因仍为 `NOTPROVEN`。
- `run` 保留 `original-ocr.xml`、`modified-ocr.xml`、`http-raw-response.bin` 和 `result.json`。日志只哈希本次自有目录文件，所有日志哈希读取累计上限为 4 MiB。没有删除或清理步骤。
- 未运行、内联、编码或移植 policy-refused 旧 isolated-server helper；其状态仍为 `NOTRUN`。README 明确未绕过拒绝，未新增原生服务/GPU 实例，也未提前改生产日志或策略。

## 冻结输入复用

已只读核对 `approved-inputs.json`、五份证据 JSON、原始 `request.json` 和 `C-dirty-before.txt`。请求、XML、Python、原生程序及 30 个 DLL 的大小/SHA 已纳入源码索引；既有 dirty 快照保持为输入事实，没有重做旧开工、安装、调研或全量测试。

`literal-inputs.json` 是审阅索引，不是运行时 admission。真实 stage 必须是：

```text
C:\Users\PC\AppData\Local\Temp\lb-ocr-maint-<16位小写十六进制>
```

开始只含控制器、逐字节相同的 `request.json`、Root 冻结的 `admission.json`，且 `run` 和目标日志目录均不存在。Root 必须在 admission 中独立冻结当前 SCM wrapper PID/exe/creation FILETIME 与三个 direct 进程身份；控制器代码固定要求 direct PID 为 API `2932`、OCR `36704`、9B `9652`。

## 验证与未验证

已做：

- 全量人工读取执行令、批准元数据、五份证据、原始请求元数据、dirty 快照，以及最终控制器/README/字面索引。
- 只读核对输入大小和 SHA、源码三文件 SHA、目标目录清单和限定路径 Git 状态。
- 对控制器进行人工静态走查，覆盖 300 秒预算、120 秒恢复保留、SCM 名称白名单、XML 精确备份/恢复、唯一 POST、HTTP 断连保全、旧身份访问拒绝、9B 不变与日志 4 MiB 累计读取上限。

未做且按令不得由本执行者做：

- 未按 Python 导入、编译、AST/语法解析、自测、测试、构建或执行控制器。
- 未做任何 SCM 查询/控制、进程启动、HTTP/health、网络、模型、GPU 或真实维护。
- 未生成 runtime stage/admission，未产生真实 HTTP 结果，也未声称端到端通过或原始 HTTP 根因已证实。

## 实际执行与阻碍

- 共 26 次 `exec_command` 工具调用：25 次使用规定的绝对 PowerShell 并以退出码 0 完成只读操作；1 次误将 shell 参数写成 `bash`，执行器在启动阶段返回 `Bash/E_ACCESS_DENIED`，PowerShell 命令未运行、无文件写入。随后同一只读元数据命令已按规定 PowerShell 路径成功重做。
- 实际运行时 Python 退出码为 0，因为它从未运行；服务控制、HTTP、模型请求和 GPU 运行次数均为 0。
- Git 只执行一次 `git status --short -- <新目录>`，退出码 0。未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
- 没有发现需要放宽边界的 `SOURCE_BLOCKED` 条件。除 Root 完整审阅与一次真实 300 秒维护外，本任务在源码准备范围内已停止。
