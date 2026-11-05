# C 线交回：OCR 维护最小退出修订

状态：`SOURCE_EDIT_COMPLETE_NOT_RUN`

执行令：`D:/Lawbeach/lawbench-coord/C-OCR-maintenance-minimal-exit-20261030-212159.md`

## 交付文件

- `D:/Lawbeach/lawbench-C/prep395/deploy/maintenance-minimal-exit-20261030-212159/maintenance-controller.py`
  - 82737 字节
  - SHA256 `ec901804479cfdc018141fb9f4b393f28f788a3c2d82483346088fd9147e18b6`
- `D:/Lawbeach/lawbench-C/prep395/deploy/maintenance-minimal-exit-20261030-212159/README.md`
  - 13541 字节
  - SHA256 `6b58374b20a84bf2730b68d39f7235cfc1571d8876fe7de1206446c3af1af095`
- `D:/Lawbeach/lawbench-C/prep395/deploy/maintenance-minimal-exit-20261030-212159/literal-inputs.json`
  - 12813 字节
  - SHA256 `bbc305af812093b55f8d1959f41ced282061eefb15e04919ea2e6809843e894b`

三份工件新建时已核对与指定基线逐字节一致；原服务根文件未修改。

## 实际改动

1. 增加只读旧进程退出兜底：使用既有 `OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION)`、`GetProcessTimes` 字段与 `finally` 中的 `CloseHandle`，返回 64 位创建和退出 FILETIME。仅当创建时间与捕获的旧身份精确相等且退出时间大于零时，才记 `old_identity_absent=true`、`CAPTURED_IDENTITY_EXITED_OBJECT_RETAINED`；其余情况保持 `ABSENCE_NOTPROVEN`。原 `process_identity` 与 `identity_matches` 未改。
2. 恢复阶段保存 `start-ocr-and-health` 的返回结果。仅成功且非空时执行 `start-api-and-health`；OCR 步骤失败或返回空时，API 步骤记为 `BLOCKED_NOT_STARTED` 并追加恢复错误，不调用 API 启动，后续最终检查继续。
3. 将 `EVIDENCE_DIRECT_PIDS` 的 API Python 从 `2932` 改绑为 `12624`，OCR 原生进程从 `36704` 改绑为 `4356`；9B 仍为 `9652`。`literal-inputs.json` 同步记录三项当前身份、创建 FILETIME、UTC 出生时间与 exe。

当前身份证据：

- API Python：PID `12624`，创建 FILETIME `134378394284216688`，exe `C:/prep395/python/python.exe`
- OCR 原生：PID `4356`，创建 FILETIME `134378394277613718`，exe `C:/prep395/llama/llama-server.exe`
- 9B 原生：PID `9652`，创建 FILETIME `134364439878751939`，exe `C:/prep395/llama/llama-server.exe`

旧退出对象证据：PID `36704`，创建 FILETIME `134375894605370111`，退出 FILETIME `134378393965817791`。该证据证明捕获身份已经退出，不证明 OCR HTTP 根因。

## 验证与边界

- 本写入者运行源码次数：0。
- 本写入者源码检查、测试、构建、应用启动、服务控制、网络/HTTP、模型/GPU 动作次数：0。
- 未执行 Python/Node/AST/编译/解析/导入；未做格式、风格、括号或行宽检查。
- Git 全程只读且未执行任何 Git 命令；未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 未读取凭据、真实案卷或旧生产日志；未联系 6000D；未执行维护或改变服务。

此前维护执行仍为 `FAILED`：POST 前失败、POST 次数 0，原始服务和恢复健康状态已由根确认。前序两轮源码写入/检查未取得通过，历史 `FAILED` 结论不重写，历史违规计数为 9。

## 交回后事项

新源码为 `NOT_RUN`，下一次停服仍未获授权。根需独立完成有限审阅、确认最终字节和 SHA，并重新建立 `FUTURE_ADMISSION_REQUIRED`；不得沿用旧 admission 或把本交回解释为运行成功。
