# B 线交回：T24 core/tool 有界接入检查

状态：`CONSUMER_READY_FOR_ROOT_REVIEW`

运行状态：`NOT_RUN`

打包：`HOLD`

依据：
`D:\Lawbeach\lawbench-coord\T24-core-tool-order-20261026-125234.md`

## 前置核对

- 已先读取正式执行令全文。
- BEFORE manifest 共 17 项，作者交付前复核为 17/17 字节数与 SHA-256 一致：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T24CoreTool-20261026-125234\before-manifest.json`
- BEFORE tracked patch 已读取：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T24CoreTool-20261026-125234\B-tracked-before.patch`
- 开工时三个授权交付路径均不存在；工作树原有 dirty 全部保留，未做 Git 写操作。
- 未发现需要另一 B writer 协调的迹象；本 PID 仅作为当前执行者使用。

## 新增文件

1. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CoreToolCheck-20261026-125234\core_tool_check.py`
   - 15903 bytes
   - SHA-256 `1ac875170307f52b741f237d8b0a3f1b8920f4dc8fded3c8fed48ea3470ba9d8`
2. `D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CoreToolCheck-20261026-125234\README.md`
   - 3381 bytes
   - SHA-256 `be498b08a96f3ecbab1519b4898e150e8ce21133e969b24858dafe17b4c41d92`

除此之外没有新增或改写产品、测试、fixture、schema、entry、config、runtime 文件。

## 消费件内容

- 通过既有 importlib 方式加载 T31 `scoped_task_standalone.py`，继承其真实
  `CaseRegistry`、`Materials`、`SettingsStore`、`TaskStore`、三个合成 TXT、
  converter deny、network guard 和私有 `TemporaryDirectory` 装配。
- `load_tests` 只选择新增的
  `test_new_core_tool_lifecycle`，不运行继承的旧用例。
- 使用真实 `lawbench.api.core.routes`，配置为
  `SimpleNamespace(config.validate_responses=True, skills_dirs=(), tasks=..., materials=...)`。
- 只选择真实 POST `/core/task/begin`、`/core/tool`、`/core/task/end` endpoint；
  用真实 Starlette `Request` 和单次 ASGI `http.request` body 调用。
- 使用不带 `request_id` 的 legacy task begin，不制造 Host、Native R 或
  NativeSession 身份。
- 成功输入严格采用
  `contracts/examples/tool_calc_sentence.args.json`，并严格比对
  `contracts/examples/tool_calc_sentence.result.json`。
- 四个错误输入严格为：原 `args_bad`、`2026-03-02..2026-03-01` 的一年有期徒刑
  倒序羁押、零刑期拘役、`9999-01-01` 加 25 年；均要求真实 `ApiError` 的
  `INVALID_ARGUMENT`。
- 在同一 `try/finally` 中始终经真实 `/core/task/end` 以
  `aborted / model_calls=0 / tool_calls=5 / elapsed_s=0` 收尾。
- `finally` 后读取实际持久化 `task.json` 与 `result.json`，要求 task 为
  `finished`、result 为 `cancelled`、usage 为 `0/5/0`、drafts/citations 为空、
  草稿目录无文件，并且只有这一张真实任务。
- 通过调用真实函数主体的计数包装核对 `contracts.errors` 与
  `contracts.validate`：Core 三个接口的 request/response、工具 args/result
  均实际经过校验；没有替换 route、registry、tools、TaskStore 或返回体。
- 整个生命周期只调用一次 `asyncio.run`；事件循环结束后 join 仍存活的
  AnyIO/asyncio worker threads，再由 fixture 清理私有临时目录。

## 作者侧验证

只做了只读静态核对：

- BEFORE manifest 17/17 字节数、SHA-256 一致。
- 授权目录仅有上述两个文件；正式交回文件交付后为第三个授权文件。
- 禁止项扫描未发现 `lawbench.app`、`t8_helpers`、原 `test_sentence`、
  TestClient、ASGI application、lifespan、HTTP server/listener、subprocess、
  pytest、logs.setup、OCR/Office/Keyring、socket/HTTP client。
- 消费件只有一个 `def test_...`，并且 `load_tests` 只选该一个方法。
- 读取的依赖版本：
  - Python 3.12：`C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe`
  - Starlette 1.9.0
  - AnyIO 4.15.1
  - jsonschema 4.26.0
  - referencing 0.37.0

没有安装、升级或下载任何依赖。

## Root 审阅后命令

从 `D:\Lawbeach\lawbench-B` 运行：

```powershell
python docs\plan\evidence\T24\CoreToolCheck-20261026-125234\core_tool_check.py -v
```

## NOT_RUN 与边界

- 作者未执行 `core_tool_check.py`，因此本交回不宣称 T24 core/tool 集成已通过。
- 未重跑 current13 purecalc/contracts、九项 rules text checks、旧 T31 绿色用例、
  `test_sentence.py` 全套或任何全量测试。
- 未证明 HTTP transport/auth、HTTP 200 失败体映射、GUI、NativeSession、
  packaging 或完整产品生命周期。
- 未执行任何 Git add/commit/rebase/stash/reset/clean/checkout/push；也未尝试
  修复 index.lock、权限、ACL、审批或 writer lock。
- 若 root 运行发现实际依赖不兼容，应保留原始异常与版本事实，不安装依赖、
  不换 loader、不引入新框架、不改真实 route 为假实现。

## 命令边界记录

- 所有 Python、测试、产品装配均未执行。
- 仅两个授权源码/说明文件由 apply_patch 新增；协调目录仅新增本交回件。
- 只读执行中曾有两条 `exec_command` 的 shell 字段使用 PATH 名 `pwsh`，
  未使用要求的绝对原生路径；两条命令均为只读且成功。另有两次误用的
  `bash` 只读命令在执行前被运行器拒绝，一次跨仓库 Git status 被 Git 拒绝；
  这些失败均无文件或 Git 状态副作用。最终复核与正式边界命令均使用指定绝对
  native pwsh、`login=false`。
