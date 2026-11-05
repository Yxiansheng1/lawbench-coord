# B 线交回：T18 pre-issue manifest 文件名纠正

状态：`SOURCE_ONLY_READY_FOR_ROOT`。

已按执行令完成且有界修改：

- 将 `docs\plan\evidence\T18\PreIssueReadyCountFix-20261029-205727\root-approved-manifest-data.json`
  原地改名为同目录的 `literalfixed-inputs.json`，仅一次非递归 `Move-Item`。
- README 只将该文件名表中的旧名改为新名，未改字节数或 SHA-256。
- 未修改源码、运行时、manifest 内容、其他字段，未新增辅助器、测试或逻辑。

核对结果：

- 旧名不存在，新名存在；新文件 13575 字节，SHA-256 为
  `2ca2cba062250e03817e50fefa5b060afdb54cac5c63f414bcfe0654b53f2923`。
- `native-pre-issue-check.mts` 仍为 153232 字节，SHA-256 为
  `c39d244e81f988f2418cd3b3047998cbe2cf718bd17a14aac8480bff3f15bce4`。
- `b-service-pre-issue-check.py` 仍为 53737 字节，SHA-256 为
  `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924`。
- README 当前 SHA-256 为
  `69f043e87c0b7b29b71bfe8bd27fef8ed3ba1f88bbc4569a987b7795f274ad3c`；
  全文不再出现旧名。

环境阻碍：只读 `git status --short --branch` 因共享 worktree 的
`modules/dsh` 权限拒绝而失败；未修复、未绕过权限，也未执行任何 Git 写入。

按本令未启动 Node、Python、TypeScript、B service、产品、模型或 HTTP，未执行测试、
构建、导入、进程探测或 Git 写入。后续完整反向核对、绑定检查、准入检查及全新原始
运行由根执行。
