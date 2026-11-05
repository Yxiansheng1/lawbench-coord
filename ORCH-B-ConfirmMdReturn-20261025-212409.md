# B 线交回：T15 原生 Markdown 成果确认准备件

## 状态

`PREPARED_ONLY`。B 作者已按
`ConfirmMdOrder-20261025-212409.md` 完成有界文件准备，未执行 prepare、serve、
probe、HTTP、GUI、Word、模型、OCR、Vitest、tsc、pytest、collect、parser、
compile、build 或任何自测。以下文件存在不构成 T15、HTTP/GUI/Word/模型整链
通过结论。

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmMdEntry-20261025-212409\server.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmMdEntry-20261025-212409\probe.mjs`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T15\ConfirmMdEntry-20261025-212409\README.md`
- 本交回件：`D:\Lawbeach\lawbench-coord\ORCH-B-ConfirmMdReturn-20261025-212409.md`

白名单之外没有写准备件、launcher、产品、tests、contracts、lib、原 entry、
E50、guard、PDF 或模型文件；没有生成 run/task/result/index/history/rollout。

## 累计修改范围

- `server.py` 沿 manifest 指定的已审 `base-server.py`（77,868 bytes，输入
  SHA-256 `e041e2b27ea4b91b1cbae2be3abdc635475b830cf310ad0083b5caeb992ca86b`）
  全文复制构造，路径深度继续保持 `PREP_DIR.parents[4]` 指向
  `D:\Lawbeach\lawbench-B`。
- 路由仍为 16 条：只移除 `POST /api/documents/save`，换入
  `POST /api/outputs/confirm`。捕获路由同步替换，其余原 15 条保持不变。
- Firewall 只增加 confirmation 所需状态、claim、state 核对和认证分支：
  精确五字段 `case_id/task_id/draft/formats/template`；只接受本 run 唯一
  case、bootstrap 唯一 tool task、v1、`formats == ["md"]`、
  `template is None`。旧 case/begin/tool/end sticky failure 或 document/v2
  状态均拒绝。
- 新 confirmation 在任何 policy/claim 之前只按一个
  `Authorization` scope header 做完整值比较；缺头、错头以及 duplicate
  bad/good、good/bad 都在全局 `_guard_reply` 返回 401，不进入原生
  delegation。
- 合法请求先经 policy、once claim、registry、ended task snapshot、成果目录
  “不存在或严格空”守卫，再只调用一次唯一 `self.app`。原生
  `Exporter.confirm` 是唯一成果写入者；捕获结果、磁盘 Markdown/索引和
  source/task 状态全部核对后才标 `confirm_complete`。失败 sticky，不重试。
- `_serve` 的唯一跨边界差异是构造 Firewall 时把内存 `host_token` 传入；
  prepare/source pins/path/root 链/guard/env/keyring/socket/OCR/lifespan/
  Retainer/Net/log/20 秒 run/600 秒总界启动拒绝逻辑保持。
- `_bootstrap_native_v1` 全文保留，仍为真实 auth/contracts/native
  caseopen→begin→case_save_draft v1→end aborted 四调用；模型 0、工具 1，
  不手写原生索引，不冒充模型完成。

## 探针与 README

- `probe.mjs` 只用 Node 内建模块、只读文件、真实 127 HTTP；不写文件、
  spawn、mock 或输出 token。它分别计数 ASGI 4 与 TCP，先核精确 server
  SHA、prepared/started/ready 连续性、真实 task/result/reads/v1 和 source
  身份，再核 GET task-current selection 空、GET outputs 空。
- 负例覆盖缺 auth、错 auth、bad/good 与 good/bad duplicate auth、额外字段、
  错 case/task/v1/draft、跨任务路径、docx format、非 null template、
  documents/save 与 core/tool 拒绝；每次后都复核 task/result/reads/v1
  SHA+mtime 不变且成果仍为空。
- 合法 confirm 后核真实 200、单一 md/version 1/path、成果目录恰两成员、
  54-byte/原 v1 SHA、索引恰一条及来源契约形状，并核 GET outputs 恰一条。
  重复 confirm 必须 403，前后 task/result/reads/v1 与已写成果/索引
  SHA+mtime 不变。
- 最后等待自然 final metadata/loop close（25 秒上限、5 秒轮询），再核
  Net/log/listener/loop 关闭、0 getter/Keyring/outbound/OCR/lifespan/
  Retainer、必要 AnyIO 允许值和精确 16 路由。探针只输出短摘要；README
  规定主编排把 stdout 重定向到该 run 的 `probe-output.txt`。
- README 给出准确 prepare、隐藏窗口 serve `--seconds 20`、probe 命令，
  private 内存 env、finally 清理、失败原始证据路径及 PREPARED_ONLY 边界。

## 读取与执行记录

- 首工具只读正式执行令，其余 8 个后续 exec 全部使用指定绝对 pwsh、
  `login=false`；未使用 Bash、并行、短名或跨聊天。
- 首个 base 全文输出被工具截断，随后按令允许的分段方式补读完整；manifest、
  API/导出/检查器/schema/base probe/base README 等准确输入均已读取。
  未用自写 parser、hash 自证或工作区泛搜。
- 没有运行命令级语法检查、AST 差异核、文件哈希复算或任何验证禁区项。
  主编排仍需完整独立审和有限根运行，才能获得实际证据。

## Git、dirty 与阻碍

- Git 全程只读；没有 add、commit、rebase、stash、reset、checkout、clean
  或 push。没有暂存，也没有改动旧报告/history completed。
- 没有更改沙箱、审批、ACL 或 writer lock；未尝试拆锁或扩权。
- 本次准备未遇到需要修复的 `index.lock`、权限或 Git 写入阻碍；即便存在也
  按令不处理。既有 dirty 由根在派单前保全，本线只在上述白名单路径写入。
- 无剩余作者动作。准备件和本正式交回件落盘后即停；`Packaging` 保持
  `HOLD`，不把本次 prepared 当作 HTTP/GUI/Word/模型整链通过。
