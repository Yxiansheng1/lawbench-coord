# A 线交回：T31 Control Echo 模块导入分隔符修正

状态：`CODE_EDIT_COMPLETE_AWAITING_ROOT_ACTUAL_2`

已按
`D:/Lawbeach/lawbench-coord/T31-control-echo-slash-order-20261027-014157.md`
完成有界修改。仅改 native 夹具
`dsh/packages/api/session-controller/tests/fixtures/t31-control-projection-echo.finite.ts`
中的两个表达式：

```ts
await import(HOST_PATH.replaceAll('\\', '/'))
await import(REMOTE_PATH.replaceAll('\\', '/'))
```

`HOST_PATH`、`REMOTE_PATH`、`INPUTS`、三组输入大小与 SHA-256 仍用于 Windows
文件读取；只规范化动态导入地址。`_label`、全部断言、辅助函数、动画帧等待、
`finally` 清理、旧测试、旧 extension、native 配置、P29、产品或运行时代码均未改。
旧 README、formal 和 note 均未追加或覆盖。

修改前为 19,567 字节 / SHA-256
`43a4484c5a9a25c10648933f6b4dd87b27a272955a56154109c3d6de53b5c607`；
修改后为 19,611 字节 / SHA-256
`16d9c5491b554a55e781886ff348027ef8ab5290995e19593fb9f356465ddded`。
净增 44 字节。静态反向替换两处后精确恢复修改前大小与 SHA-256；旧表达式 0 处，
新表达式各 1 处；UTF-8 无 BOM，CRLF 0、LF 533。`_label` 仍在。

## 实际命令与退出

所有 `exec_command` 均使用指定原生绝对路径 `pwsh.exe`、`login=false`。

- 读取正式执行令：退出 0。
- `git status --short --untracked-files=all`：退出 1；在子模块 `modules/dsh`
  切换目录时权限拒绝，`git status --porcelain=2` 失败。
- `Get-ChildItem` 列出 T31 证据、协调目录 T31 文件、root 输出目录：均退出 0。
- 读取上轮交回件和 current JSON：均退出 0。
- 对上轮夹具 `Select-String`，对 A 线夹具定向 `rg`：均退出 0。
- 读取夹具全文、目标行段、文件大小与 SHA-256、BOM 与换行计数：均退出 0。
- 内存中执行精确两处替换并计算预期大小与 SHA-256：退出 0。
- `apply_patch` 一次有界修改：成功。
- 修改后字节、旧/新表达式、BOM、换行、`_label` 与反向恢复哈希检查：均退出 0。
- `Test-Path` 检查两个新文件均不存在、两份基线证据存在：退出 0。
- 写入本新 note 与本新交回件：成功后作最终只读存在性与内容复核。

Git 仅尝试上述一次只读 status；未执行 add、commit、rebase、stash、reset、clean、
checkout 或 push，未改锁、审批、ACL 或沙箱。`index.lock` 或权限拒绝不尝试修复。

`RUNTIME_NOT_RUN`：本次未运行 Node、Vitest、tsc、解析器、AST、导入、收集、
构建、HTTP、模型、GUI、安装或探测。上轮 root 的同实际 2 项结果为 0 通过、
2 失败、5.2239174 秒，失败在语义断言前；错误 id 为反斜杠地址
`/@id/D:\Lawbeach\lawbench-A\docs\...\typert.host.js`。请 root 完成全文复核后
运行同一实际 2 项测试。

新增证据：
`D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlProjectionEcho-20261027-005153/module-separator-correction-20261027-014157.md`

包装 HOLD；Gate 1 未完成；GUI_NOT_VERIFIED。
