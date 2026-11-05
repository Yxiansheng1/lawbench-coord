# B handback: T32 ref probe shape fix

状态：`DONE_FOR_ROOT_REVIEW`

唯一代码修改：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveEntry-20261027-115753\probe.mjs`

修改范围：`nativeState()` 当前第 120–144 行。删除了完整原始 refs 文档与简化 seeded summary 之间不可能的 `deepEqual`，改为校验原始文档和引用条目的精确形状、`v=1`、`next_seq=2`，并将 R01 的 `ref_id/path/kind/status` 精确投影后与 summary 比较。完整原始文档继续返回，所有后续前后态 `deepEqual` 和冻结行为断言未改。

哈希：

- 原 probe：`FA0F4BAB363BF50C3BBD50F9B3AA91BEFFB528BAB2952E618DD880972D574B57`
- 新 probe：`D50C804182D80B928B5A4ACABE928AE1549825102F1254FA42E62276368460E8`
- 新修改块：`2FBFA838A22C48A221006782B0FBE9715D7AD5D30963A4CE991B21C04BD78968`

块外字节校验：内存内将新块还原为原单行后，完整 probe 哈希重新等于原始值，`OriginalByteMatch=True`。

实际命令与 nonzero：

- 全部指定只读文件读取、精确 `rg`、`Get-FileHash` 和内存哈希校验成功，返回 `0`。
- `git status --short --branch` 返回 `1`，原因仅为受保护子模块 `dsh` 的 `.git` 路径 `Permission denied`；未改锁、ACL、权限或沙箱。
- `git status --short --branch --ignore-submodules=all` 返回 `0`，确认既有 dirty 已保留。
- 一条辅助 `rg` 正则因未闭合括号返回 `1`；改用固定字符串检索成功，返回 `0`。
- 最终交回文件存在性检查的首次 PowerShell 管道包装返回 `1`（空管道元素语法错误）；先收集结果再格式化后返回 `0`，交回文件本身未受影响。

`RUNTIME_NOT_RUN`

未运行 Node/Python、解析/AST、测试、构建、prepare、server、probe、HTTP、GUI、model 或 install。未修改 source/entry/launcher/pins/旧测试/产品代码，未做任何 Git 写操作。

证据说明：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveEntry-20261027-115753\probe-shape-fix-20261027-121733.md`
