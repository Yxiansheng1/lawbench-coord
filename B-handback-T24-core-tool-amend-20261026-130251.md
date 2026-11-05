# B 线交回：T24 core/tool consumer 静态修正

状态：`CONSUMER_AMENDED_FOR_ROOT_REVIEW`

运行状态：`NOT_RUN`

打包：`HOLD`

依据：
`D:\Lawbeach\lawbench-coord\T24-core-tool-amend-order-20261026-130251.md`

## 结论

只修正了消费者与 README，没有改产品、测试、fixture、契约、入口、配置或
runtime。作者没有运行消费者、测试、解析器或产品装配，因此本交回不宣称
core/tool 集成通过，也不把主编排确认的消费者/装配静态失败说成产品/API
失败。

## 改前身份

- 仓库内消费者和 README 改前分别与只读 amend 目录副本一致：
  - `core_tool_check.py`：15903 bytes，
    SHA-256 `1ac875170307f52b741f237d8b0a3f1b8920f4dc8fded3c8fed48ea3470ba9d8`
  - `README.md`：3381 bytes，
    SHA-256 `be498b08a96f3ecbab1519b4898e150e8ce21133e969b24858dafe17b4c41d92`
- 改后静态复核时，BEFORE manifest 的 17 项产品、fixture、契约和样例的
  bytes、SHA-256、mtime 仍为 17/17 一致。
- Git 状态枚举在 `dsh` 子模块遇到权限拒绝；既有 dirty 无法用 Git 完整列出。
  本执行者只按授权路径编辑，没有触碰无关 dirty，不据此宣称其他文件干净。

## 精确改动

### 1. `core_tool_check.py`

路径：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CoreToolCheck-20261026-125234\core_tool_check.py`

改后：16207 bytes，
SHA-256 `47865f6f2016c747792ae8bbc517a94b5d83d2fd9409afcc7fc938da1cb915d5`

- 在 fixture 模块执行前创建一个标准 `asyncio.Runner` 并立即
  `get_loop()`。fixture 随后安装原有永久 `socket.connect` 拒绝。
- 整个 lifecycle 使用同一个 Runner；`run()` 外包 `try/finally`，成功或失败
  都调用 `Runner.close()`，再检查 worker threads。没有模块级延迟关闭、
  第二次 loop 创建或无限轮询。
- `_section` 改为直接迭代 `core_api.routes(state)` 实际返回的
  `list[Route]`，不再读取不存在的 `.routes`。原有 exact path、POST method、
  endpoint module/qualname 身份断言保留。
- `core/tool` request schema 校验次数从错误的 6 改为 5，即项目原有的一次
  成功调用加四个坏输入调用；工具 args 校验次数仍为 5。
- 原有业务场景未增删、未弱化：
  - 成功仍严格使用
    `tool_calc_sentence.args.json` / `tool_calc_sentence.result.json`；
  - 四个坏输入仍为 `args_bad`、倒序羁押、零刑期拘役、
    `9999-01-01` 加 25 年；
  - 每次仍在 `INVALID_ARGUMENT` 分支要求真实 `ApiError`；
  - 仍在 `finally` 经真实 `/core/task/end` 以
    `aborted / model_calls=0 / tool_calls=5 / elapsed_s=0` 收尾；
  - 仍检查真实 `TaskStore` 的 finished/cancelled、usage、空 drafts/citations、
    空草稿目录和唯一真实任务。

### 2. `README.md`

路径：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T24\CoreToolCheck-20261026-125234\README.md`

改后：4436 bytes，
SHA-256 `7154386b3c2bcb883874eebac0ad8a2441ebba9970950a5599c0f005600001de`

- 删除未支持的“twenty-seven currently passing”表述。
- 明确早先 13 项 pure calculation/contract checks 与 9 项 rule-text checks
  是不同封闭切片；本次没有重跑，也不把它们并入本检查。
- 说明一个标准 Runner 在 fixture 拒网前初始化 private loopback self-pipe，
  同一个 Runner 贯穿 lifecycle 并在 finally 关闭。
- 删除“blanket no listener”含义，改为精确说明：CPython 标准库 fallback
  可能在端口建立 self-pipe 时短暂使用一个私有 loopback listening socket；
  预先初始化步骤没有启动 HTTP/application server、调用真实服务 endpoint、
  访问外部网络或引入自定义框架。

### 3. 本交回

`D:\Lawbeach\lawbench-coord\B-handback-T24-core-tool-amend-20261026-130251.md`

除此之外，本执行者没有编辑其他路径。

## 标准库基础设施边界

主编排已确认本机 CPython 3.12 Windows 没有 native socketpair，标准
`socket._fallback_socketpair` 与 proactor 初始化依赖私有 loopback self-pipe。
因此本次允许的唯一前置基础设施动作是：

1. 创建一个标准 `asyncio.Runner`；
2. 在 fixture 安装永久 `socket.connect` deny 前，强制 `get_loop()`；
3. fixture 导入后，同一 Runner 跑完整 begin/tool/failure/end lifecycle；
4. 用同一 Runner 的标准 `close()` 结束 loop。

没有 monkeypatch、restore、减少/放宽网络 guard、地址 allowlist、自定义
event loop/loader/adapter/socket、HTTP listener/service、subprocess，或
真实外部 endpoint、Keyring、模型、Office 调用。也不宣称所有
socket/listener 为零。

## 作者侧验证

只做只读静态核对：

- 旧 `asyncio.run`、`route.routes` 和
  `twenty-seven currently passing` 文本均已不存在。
- 一个 Runner 创建/初始化、同一 Runner `run()`、`finally` 中 `close()` 均
  存在；没有 `new_event_loop`。
- `_section` 直接迭代 routes list；request schema 计数为 5。
- 成功 args/result、四个 bad inputs、`INVALID_ARGUMENT`、end usage 和
  原 TaskStore 持久化断言均仍在源码中。
- 17/17 BEFORE bytes、SHA-256、mtime 一致。
- 本执行者没有执行 Python、AST/parser、unittest、pytest、collect、prepare、
  serve、probe、HTTP、build、model 或 runtime。

## NOT_RUN 与待 Root

- 作者没有运行消费者，不能提供 pass/fail 结果。
- Root 仍需独立完整读取 main consumer、README、本正式交回、47 条既有实际
  命令字符串及六个非零输出，并比较 17 项原始身份和 tracked patch。
- Root 的限量运行命令仍为：

```powershell
python docs\plan\evidence\T24\CoreToolCheck-20261026-125234\core_tool_check.py -v
```

- 仍未证明 HTTP authentication/transport、HTTP 200 错误体翻译、GUI、
  NativeSession、packaging 或完整服务生命周期。坏参数仍预期抛真实
  `ApiError`，不是 HTTP 错误翻译证明。
- 未重跑旧 T31 green cases、13 项 pure calculation/contract checks、9 项
  rule-text checks、`test_sentence.py` 或任何全量测试。

## Git、命令与阻碍

- 所有本执行者命令都显式使用
  `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
  且 `login=false`；工作目录为 B 线。没有使用 Bash、短 `pwsh` 或 shell 包装。
- 成功命令仅为只读的 `Get-Content`、`rg`、`Select-String`、`Get-FileHash`、
  `Get-Item`、`Test-Path`，以及三个授权文件的 `apply_patch` 写入。
- 本执行者实际有三个只读非零事件：
  1. 初次读取误用了仓库根 `api\core.py`，路径不存在；实际文件在
     `service\lawbench\api\core.py`，随后只读读取正确文件。
  2. 初次读取误用了 `tests\fixtures\stub_target.py`，路径不存在；实际 fixture
     是既有 T31 standalone 文件，随后按令读取其前 85 行。
  3. `git status --short --untracked-files=all` 因 `dsh` 子模块权限拒绝而失败：
     `cannot chdir ... Permission denied`。没有尝试修复。
- 上述失败均为只读，没有文件或 Git 副作用。没有创建 `index.lock`，没有改锁、
  ACL、审批、配置、权限或 writer lock。
- 严格没有执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`。Git 写入不在本运行器授权内；提交不是本次交回条件。
- 主编排既有 `completed 47/41` 保持不变；其六个非零事件也原样保留，不在本次
  重开或改写：
  `ParserError`、两次 Bash deny、`rg` no-hit、错误的 Python root path、
  repo 外 Git status。

## 环境与依赖

沿用既有只读记录：CPython 3.12、Starlette 1.9.0、AnyIO 4.15.1、
jsonschema 4.26.0、referencing 0.37.0。本次没有安装、升级、下载依赖，也没有
重新执行版本导入或模型/网络检查。
