# A 线交回：T31 private Desktop 参数修正

- 执行令：`T31-private-desktop-param-order-20261026-114218.md`
- 目标文件：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1`
- 唯一修改：第 345 行 `New-Item` 的参数 `-LiteralPath` 改为 `-Path`
- 修改前 SHA256：`1C0EB848B618963C68CD6F6C6577829663B3E1F73E5DE6112C7C6DE3BC203A47`
- 修改后 SHA256：`3642FDAB7B888E6490A196F0EADDD99FC105E901EB2A03DA4B009FEA37C0BAB2`
- 完整性校验：修改后字节仅在内存中反向替换该唯一令牌后，SHA256 精确还原为修改前值；匹配 `true`。其余字节、换行与 BOM 未变。
- 验证状态：`NOT_RUN`
- 未运行：prepare、GUI、服务、解析器/AST、Python、测试、自检、构建、HTTP、模型或网络操作。
- Git：严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push，未改变 index、ACL、审批或锁。
- 边界：未触碰 README、start/stop、既有 UI、manifest、legacy 或其他业务文件；工作区原有 dirty 状态保持不动。
