# B 线交回：T32 GUI draft entry fixture

状态：`READY_FOR_ROOT_RUN_NOT_PASS`

## 产物

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\server.py`
  — `77553` bytes，SHA-256
  `458412d6b03c4c350bd40e228503e8ec8f207c13125ec22139612a9176a62151`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\probe.mjs`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\README.md`

## 完成内容

- 从指定 30dc 基座整文件复制，只扩展 16 路由、runtime artifact、
  Firewall 的 GUI/bootstrap 边界与一个 `_bootstrap_native_v1`。
- bootstrap 在 listener 前用 `httpx.ASGITransport` 直连同一原生 app，
  固定执行四次 case open/begin/tool/end；真实产生 finished/cancelled、
  0 模型调用、1 工具调用和一条 54-byte 原生 v1。
- bootstrap 完成后才进入 GUI 阶段；core 始终 403，同案 open 最多四次，
  GET 只在严格原生快照下按捕获 case/session 放行，current 对实际 UI
  session 依赖原生 TaskStore 返回 `null`。
- `probe.mjs` 仅用 Node 内建模块，覆盖 16 路由边界、一次真实 documents
  save、v1/v2 身份、ledger 分界和自然关闭证据。它不 spawn、不写文件。
- README 给出主编排专用 20 秒根运行命令及 ASGI/TCP/GUI 的证明边界。

## 验证与未验证

- 已做：指定六份直接输入按完整文件/行段读取；基座与目标哈希核对；源码
  有界差异与交付文件静态核对。
- 未做：按正式执行令，未运行 author test/parser/build/prepare/serve/
  probe/GUI/Vitest/tsc/pytest/collect/selftest。因此本交回不宣称运行
  通过，也不宣称实际 Host/GUI、模型、OCR、new launcher 或打包通过。
- 待主编排：按 README 独立执行根运行；只有 probe exit 0 才是这一有界
  根运行通过。Packaging 继续 `HOLD`。

## 边界与阻碍

- 开工前 HEAD 为 `dc56a93be4b07dbe7a48863e3135351659817fb5`；工作区
  原有大量 dirty 已原样保留，本次只写执行令列明的三个证据文件与本交回件。
- 未修改产品、service、contracts、lib、E50、currententries、config、
  fixtures 或 launcher。
- Git 全程只读；未 add、commit、rebase、stash、reset、clean、checkout
  或 push。没有 Git 写入阻塞待处理。
- 未联系其他聊天、未更换 API、未扩张沙箱/审批/ACL、未处理 writer lock。

## 停止点

本 B 线任务已到正式交回点，停止。
