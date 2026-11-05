# B 线交回件：T34 Core HTTP 准备态

状态：`PREPARATION COMPLETE — PACKAGING HOLD`

已完成有界修改并写回正式文件。未运行任何测试、服务器、解析器、构建或 GUI；无测试绿证。Git 全程只读，无 add/commit/rebase/stash/reset/clean/checkout/push，因此没有新提交 SHA。

## 交付路径

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\CoreHttpEntry-20261025-163357\server.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\CoreHttpEntry-20261025-163357\README.md`
- `D:\Lawbeach\lawbench-B\dsh-ext\tests\t34-native-core-http.spec.ts`

## 内容

- `server.py`：基线 HEAD `dc56a93be4b07dbe7a48863e3135351659817fb5`。输入 `server-before.py` 原样复制后，仅收窄 `ROUTES` 并补充 Firewall。允许面为 `GET /health`、`POST /api/case/open`、`POST /core/task/begin`、`POST /core/task/end`。
- case/open：精确 path、私有本案、一次 claim、sticky、只捕获原生 200/ok/case_id。
- begin：固定 synthetic session、private case cwd、单案注册表、空任务目录、一次原生请求；只接受原生成功且任务号/本案/local/null skill/params/budget 合法。
- end：只接受捕获任务号、aborted/0/0/0..60；转发前独立检查三文件小快照、身份和空的初始状态；只捕获原生 cancelled，重复与错误均在 claim 前 403。
- ledger 保持纯元数据；准备、认证、Keyguard、socket guard、OCR/Retainer 关闭、600 秒上限、生命周期和关闭证据沿用基线。
- 测试直接 import 实际 `CoreClient`，无 Vitest import/mock/copy/fetch override/contracts override；缺环境 FAIL，不写文件、不启动进程，真实请求只走精确 `127.0.0.1:port` 且 timeout 5000 ms。

## 身份与依赖

- `server.py`：`2e9d542ff0449fe5041f0cc6869a5470f610ed4ee7b5cd477332efc5f5bfd4cd`
- `t34-native-core-http.spec.ts`：`3cf0e9bc19d38c1b8853b95d1ea698ec5cfc924bcefc94fbf6e47b3cc1d2bea6`
- 输入 `server-before.py`：`c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`
- 输入 `core-client.ts`：`5deeb42f96b2b23225f90adb8642fa9529f419a01a8e14f731378b4f2ac74c50`
- 输入 `contracts.ts`：`2b4f550ea89a4efcc41ffd59327332d8aeea535cc2918dee3db7310b4719342b`
- 输入 `task.py`：`287603e1c0ce790a4bc39ef94ee6ce6be15b2be94b59aab735a51d7b80f912c3`
- 输入 `core.py`：`f3836ed76685a72ebc462a0a63eab389a6f1a75ad9bb632428484b438f201bdb`
- 依赖：现有 Python `httpx`/`uvicorn` 与现有 DSH/Vitest；未安装、未升级。

## 主控验证入口

README 的“主控专用命令”给出一次 prepare、20 秒 serve、真实 Vitest 测试和自然关闭等待。测试会自行等待 `final-metadata.json` 与 `loop-closed.json`，核验服务器清理、源码/样本不变和任务文件物理形状。

## 阻碍与限制

- 完整 `git status` 在共享子模块 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-B-new\modules\dsh` 被权限拒绝；按令未修权限、未改 ACL/index lock、未扩权，也不能据此声明全局 dirty 清单。
- 执行开始时三个目标均不存在，未覆盖既有目标；其他 dirty 未被写入或清理。
- 没有运行测试，不能声明功能通过。没有测试输出、截图、退出码或实际 HTTP 成功证据。
- 沿用基线 T33 对外命名/格式/文本；实际 `__file__` 路径已将 runs 放在本 T34 preparation 目录下。
- 无待主控裁决的模糊语义；无发布动作。停止等待主控，不等待其他会话。
