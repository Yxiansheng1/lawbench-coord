# A 线交回：T31 Control Echo Windows 模块导入纠正

状态：`CODE_EDIT_COMPLETE_AWAITING_ROOT_ACTUAL_2`

已按
`D:/Lawbeach/lawbench-coord/T31-control-echo-windows-import-order-20261027-013843.md`
完成有界修改。只改 native 夹具
`dsh/packages/api/session-controller/tests/fixtures/t31-control-projection-echo.finite.ts`：
删除无用的 `node:url` 导入，将两个动态导入分别改为 `await import(HOST_PATH)` 和
`await import(REMOTE_PATH)`。固定路径、三组输入大小/SHA、函数签名与调用、全部断言、
清理逻辑和测试配置均未改；旧 README 未追加或覆盖。

夹具修改前为 19,648 字节 / SHA-256
`25c4b3450bd8c20a4583c4cc9e6cddbbf1dfb2e5aa6c1adcbb20301ef9c7b140`；
修改后为 19,567 字节 / SHA-256
`43a4484c5a9a25c10648933f6b4dd87b27a272955a56154109c3d6de53b5c607`。
净减 81 字节，全文不再含 `pathToFileURL`。

实际命令均以指定原生 `pwsh.exe`、`login=false` 执行：

- 读取执行令：退出 0。
- `git status --short --branch`：退出 1；子模块 `modules/dsh` chdir 权限拒绝。
- 定向 `rg` 与目标片段读取：退出 0。
- `Get-Item` + `Get-FileHash`：退出 0。
- `git -C ...\dsh diff -- ...`：退出 1；同一 chdir 权限拒绝。

Git 仅作上述只读尝试；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，
未改锁、审批、ACL 或沙箱。`RUNTIME_NOT_RUN`：未运行 Node、Vitest、tsc、收集、解析器、
构建、HTTP、模型、GUI、安装或探测，因此本交回不声称两项测试通过。请 root 复核后运行
实际 native 两项测试，判定修复是否成立。

证据说明：
`D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlProjectionEcho-20261027-005153/module-windows-correction-20261027-013843.md`

包装 HOLD；Gate 1 未完成；GUI_NOT_VERIFIED。
