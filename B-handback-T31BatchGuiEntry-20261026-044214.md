# B 线交回：T31 Batch GUI Entry

## 状态

`PREPARED_ONLY / ROOT_RUN_REQUIRED`

准备完成，不是 HTTP、GUI、Host/RPC 或完整 T31 PASS。作者未运行 prepare、serve、
probe、HTTP、GUI、构建、模型、解析器或测试。

## 基线

- B worktree：`D:\Lawbeach\lawbench-B`
- HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 基座 `ScopeHttpEntry-20261026-031523/server.py` SHA-256：
  `0938e78ccfc3fa73d1e03cec99c5cdc6374c0abc78601a20c6662d22814ebf11`
- 读 GET 来源 `ReadGetEntry-20261025-105313/server.py` SHA-256：
  `c763f3b00ec32575bf26f34d4b2a22d07a9a17aba370aae79a078737fd2458ca`
- source pins SHA-256：
  `7c3cf7cda3632f2bb1f05fa69bdebb5b1fa40806bf710bec4e6293d864bdb18e`

三个哈希均与执行令一致。既有 dirty/untracked 状态保留。

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`
  - SHA-256：`23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\probe.mjs`
  - SHA-256：`35386a57004f919e50c3f438ec61e63f78cd2a6b9d5aea8980e9ebafa5a225cb`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\README.md`
  - SHA-256：`c04b2a1628d68011e9b8d9cc242a6c03edf12d642cecafdf3c1f33e936b522f3`

目标目录仅有上述三个文件。

## 静态核验

- `ROUTES` 为精确 13 个 method/path pair：11 GET + `case/open` + `materials/import`。
- 旧 `request/scope`、core begin/context/tool/end 不在放行集；未保留活跃旧路由。
- `case/open` 允许精确 path 或 path+`template:null`，总尝试上限 4；后续同案不重置绑定/相态。
- `materials/import` 只允许固定 bound case、固定 `scope-source` 目录、
  `target:null`、`unzip:false`、`mode:"ref"`，最多两次。
- native `R01`、三份材料 ID/版本、第二次 `scan.added=0`、source hash/mtime、
  JPEG、无原件副本和无任务由 server 完成校验；独立 probe 再由真实 HTTP 和原生
  index/refs 交叉核对。
- `probe.mjs` 只使用 Node 内建模块；没有 spawn、写入、mock 或安装。
- 请求账本字段只有方法、固定路径、状态、处置和耗时，不含 query、正文、正文文本或 token。

## Git 与阻碍

Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

- 普通 `git status --porcelain=v1 --branch` 仍因
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限拒绝而失败。
- 加 `--ignore-submodules=all --untracked-files=all` 后可见本任务三个 untracked 文件；
  未修权限、ACL、沙箱、审批或锁。
- 执行过程中有多次工具参数误写成 `bash`/短名 `pwsh`。Bash 调用均在任何命令执行前
  被运行器以 `BASH_E_ACCESS_DENIED` 拒绝；一次短名 PowerShell 调用在命令执行前因语法错误停止。
  没有读取结果、文件写入或产品执行来自这些失败调用。

## Root 后续

root 需先审累计字节/AST/auth/once 边界，再用新私有 runtime 对 fresh run 单独执行
prepare、serve 和 finite probe；之后才进行真实 GUI 的同一 3-TXT 目录两次导入、
材料复选框变更/全选/取消及“不发送”验收。
