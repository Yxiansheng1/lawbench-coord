# A 线交回：T18 criminal finite signature

交回状态：`DONE_STATIC_AUTHOR_ONLY`

有限运行状态：`FINITE_NOT_RUN`

正式执行令：`D:\Lawbeach\lawbench-coord\A-T18-criminal-finite-signature-order-20261029-095555.md`

详细记录：`D:\Lawbeach\lawbench-coord\A-note-T18-criminal-finite-signature-20261029-095555.md`

## 交付结论

已按令只修正 `old_after_open` 单一块：旧验证器现在通过单参数 `old_module.verify_private_case(run_root)` 直接调用；只有捕获到消息精确等于 `OLD_EXTRA_ERROR` 的 `RuntimeError` 才记录原错误，旧验证器意外接受时以 `AssertionError` 失败。未捕获 `TypeError`，未做签名内省或回退。

目标文件：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CriminalTemplateGuard-20261029-094640\verify-criminal-template-finite.py`

- modifiedBeforeBytes: `15467`
- modifiedBeforeSha256: `943cff6968cf9706e7236b1cabb5b120fb28d1807cc352f080fe3fc2258c8b5d`
- currentBytes: `15732`
- currentSha256: `1cacba24e81a00e5c9d82fe663f664ac7618c5a2c0b471fb45a792611b713bf8`
- oldBlockOccurrences: `0`
- newBlockOccurrences: `1`
- byteInverseBytes: `15467`
- byteInverseSha256: `943cff6968cf9706e7236b1cabb5b120fb28d1807cc352f080fe3fc2258c8b5d`
- wholeByteInverseEqualsFrozenInput: `true`

## 验证边界

- 执行方式：native PowerShell，`login=false`；未使用 bash。
- `exec_command`: 10；success: 9；nonzero: 1。
- 唯一非零：初始完整 `git status` 因 `modules/dsh` 拒绝切换目录而退出 1。未修锁、未扩权。
- Python、Node、parser、AST、import、check、test、build、HTTP、model、GUI、SSH、Key、DPAPI、root driver、process probe：均为 0。
- 未启动产品、服务、Agent 或 Session。
- `finite` 未运行；本交回不构成运行时通过。

## 写入面

- 修改：指定 `verify-criminal-template-finite.py`。
- 新增：本 handback。
- 新增：`A-note-T18-criminal-finite-signature-20261029-095555.md`。
- 未修改 B 服务、原生 MTS、README、manifest、registry、Skill、样例、SDK、安全或策略文件。

Git 严格只读：未 add、commit、rebase、stash、reset、clean、checkout、push，未暂存；未更改沙箱、审批或 ACL。法律／产品运行时未启动，未产生 Key、密码、真实案卷或秘密信息。

## 当前源码钉子

- old B service: `e161fcb0df47bd87f4473022888c0db41c9360daa30599975193bdf48285283c`
- B service: `d216a0394488e6d6c90e0a20f373fe43b1d5d62d0e06126f0c85e0673591a9be`
- literal fixed inputs: `0afd235aee78bd36e3160cfde7838594b1af6400a34814954bde117a9121f08a`
- native MTS: `2401deb96f10320e80887ae09be9479bca04f6aef6c6d3dc0b74a495399c4f96`
- registry: `05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21`
- README: `2d01a2f34dc8f7a1e1d806e4f99f3b913382125913aa4e4832dc03cefe426b77`

## 既有状态保全

- 未重写或更正历史。
- 前序 COMPLETED 保持：60 次实际命令、52 次成功、8 次非零、runtime 0、full root review；不是 62。
- 前序 formal 保持：2 次记录、实际 3 次执行前拒绝；原 formal 未改。
- B guard `d216/source2401/manifest0afd` 保持，full byte inverse 已由 ROOT 接受，运行状态保持 `NOT_RUN`。
- 未复跑旧安装、调研、全量测试或证据；未联系其他聊天；未更换 API。

待办：主编排按令读取完整当前源码和本文件，再决定是否执行一次全新 `actualCaseRegistry`、私有案、no-HTTP/no-model 有限运行。
