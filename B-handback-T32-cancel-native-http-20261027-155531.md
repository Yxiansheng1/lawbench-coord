# B 线交回：T32 invalid-scope cancellation native HTTP

## 结论

状态：`PREPARED_FOR_ROOT_AUDIT_ONLY` / `RUNTIME_NOT_RUN`。

B 线已按正式执行令产出新的有限 HTTP 入口和 root 操作说明，未修改产品代码、
旧测试、配置或旧入口，未执行 Git 写入。作者没有运行 `--prepare`、`--serve`、
Python、Node、测试、探针、HTTP、GUI、模型或构建脚本；本交回不主张语法、运行时、
整个 T32、GUI、编译后 Host、模型或生产验收通过。打包继续 `HOLD`。

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\server.py`
  - `116713` 字节
  - SHA-256
    `882665196dfef16f895a5b50755fdac6b1608734fd4cb47698a68c8a46337437`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\InvalidScopeCancelHttp-20261027-155531\README.md`
  - `10461` 字节
  - SHA-256
    `01d688a202ca4bda322b48b6141d2c79701cc2ba48d6ad1a885fa78fb40729ce`
- 本交回件。

未产生 `runs\`、运行账本、最终元数据或其他运行时证据。

## 契约实现

新入口从冻结 `00-server.py`（`f0bcbb7f...`）机械复制后，只做本场景所需方法集
变化。核心行为：

- 保留真实 `lawbench.app.create_app(Config(...))`、contracts/skills 校验、
  lifespan off、原认证/Guard/Keyring/出站/OCR/Office/Retainer 禁止和自然收尾。
- 路由白名单只新增 `POST /api/materials/remove`。
- 真实 copy 导入三份合成 TXT；不使用引用 fixture，也不主张“不复制”。
- `materialsList` 从 `scope-in` 反查并要求编号为 `M0001`。
- 一次移除 `M0001` 后，原生 `context` 和一次 `case_read_material` 必须返回
  HTTP 200 `INPUT_CHANGED`；产品日志须各记录一次
  `INPUT_CHANGED:task_scope_version_changed`。
- `reason:"completed"` 的 `task/end` 必须同样业务失败且 task/result 字节和
  `running` 状态不变。
- `reason:"aborted"` 的 `task/end` 必须返回 `cancelled`；磁盘终态为 task
  `finished`、result `cancelled`、`coverage:null`，scope ID/version 不变。
- 原样重复同一 aborted end 不改变 task/result/reads 字节。
- 同 R 再 begin 必须返回 HTTP 200 `TASK_NOT_FOUND`，不新增任务。
- 外部三份 TXT 的 hash/size/mtime、JPEG 来源与副本 hash/size 必须不变；
  `M0001` 案件副本与派生文本按原生移除消失，另两份索引和文本不变。

README 已列出所有变化方法/常量、root 绝对 prepare/serve 命令、完整唯一请求序列、
终态断言、审计产物与运行边界。

## 只读核验

- 固定输入 `index.json`：10/10 快照 SHA-256 匹配。
- 当前 5 个固定产品源码身份：5/5 匹配
  `reviewed-source-pins.json`，总 SHA-256
  `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`。
- 旧 T31 `ScopeHttpEntry` 仍为 `92343` 字节 /
  `f0bcbb7fc2745ea1957167b2d5a247b1866a53a2d147e77ebdaa24cbb65bab89`。
- 旧 T32 `RefRemoveOptinEntry` 仍为 `141021` 字节 /
  `399f49b59097c87548c2dec307cbfac8cbe828f1fb4845b5d2c23c99f5c5947d`。
- 新入口静态双查：无 tab、末尾 LF、无外部 6000D/395 端点字面值、无 Git 写命令；
  `git diff --no-index --check` 无 whitespace 错误输出。
- 新入口只读静态对照了 A 侧已落盘的同一任务 consumer 请求顺序和聚合 evidence
  字段；未修改 A、未联系 A 会话、未等待或把 A 文件当运行证据。

## 工作区与阻碍

- 初次 `git status --short --branch` 在 `dsh` 子模块报
  `cannot chdir ... Permission denied`，退出 `1`。未修权限、未改锁、未扩权。
- 改用 `git status --short --branch --ignore-submodules=all` 成功读取既有
  dirty/untracked；B 树原有改动全部保留，本次目标目录显示为新增未跟踪目录。
- 两次只读汇总的 PowerShell 内联管道写法触发 `ParserError`；命令未执行、未写
  文件，随后均用等价只读命令成功。
- 一次只读 `rg` 检查误把工具 shell 参数指定为 Bash；环境在启动前返回
  `E_ACCESSDENIED`，Bash 命令未执行、无文件变化；此后全部使用指定原生
  `pwsh.exe`、`login=false`。
- `git diff --no-index` 和 `git diff --no-index --check` 因输入确有差异返回 `1`；
  这是 diff 预期码，不是测试失败。另有“无匹配”的只读 `rg` 返回 `1`，同样不是
  运行失败。
- 未执行任何 `git add/commit/rebase/stash/reset/clean/checkout/push`；未改权限、
  ACL、审批、沙箱、provider、全局 key 或 writer 锁。

## root 下一步

先独立审计新入口的方法变化、命令和清理路径，再生成一个全新
`runs\T33-host-YYYYMMDD-HHMMSS`，以 README 的绝对命令启动 B 入口，并在同一
20 秒存活窗内由 A 的真实 NativeSession/Host/LegalAgent/CoreClient consumer 执行
唯一场景。本交回到此停止。
