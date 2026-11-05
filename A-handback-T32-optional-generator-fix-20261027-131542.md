工单号：T32 A optional declaration correction（`RUNTIME_NOT_RUN`；整张 T32 未通过；Packaging HOLD）
分支最新提交 SHA：无（本运行器严格 Git 只读，未产生 add/commit/rebase/stash/reset/clean/checkout/merge/push）

修正：`contracts/_build/gen_schemas.py` 的 `materials_list` request 仅由
`obj({case_id, include_removed})` 改为
`opt(obj({case_id}), include_removed=enum(...))`。枚举值、顺序、说明、response、
生成后 schema、VERSION、UI、旧配置和测试均未改；生成器未运行。

哈希：
- 修正前 generator：`210A1E9D7DD3AEA423A6BD84A8B339AC589B1C09CD0B5B0F66B523CCFF557F88`
- 修正后 generator：`C511BDCD9E490F1E3AD8B53CAE25F03B309856382F66C4D98931EE3C5C07B4AB`
- 冻结测试：`B338913095F92491CFE358001B9BA31FC19F760AE1A3C9C098F9958ABF989B25`（未变）
- 已生成 materials schema：`370943E6C57008F24FC1D6DD298604A3F02436DAABF3DDFE88317CC084EB42E0`（未变）
- 旧证据 README：`45BE019611DBF814A6137D4807FB1EB41E1D943393F632C1F1E529EDC33CDF57`（未变）
- 根静态 AMEND JSON：`095A95052A4630DEC3BB57FA7EC6574B8B9F90985902F336018C0E8E58C70100`（未变）

实际核对：反向替换唯一新片段后 SHA-256 精确回到修正前值；文件仍为 814 LF、0 CRLF、无 BOM；
`git diff --check` 退出 0。没有运行 Node、Python、parser/AST、import、测试、类型检查、构建、
生成器、服务、HTTP、GUI、模型或安装。

实际非零：首次 `git status --short` 退出 1，因 managed 隔离无法进入
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh`（Permission denied）；未修权限、
未拆锁，随后只用 `--ignore-submodules=all` 只读核对。另一次只读哈希脚本因 PowerShell
对象构造 `ParserError` 退出 1，未写入，已重跑成功。完整命令记录见交付说明。

交付说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\MaterialsOptinUI-20261027-130738\optional-generator-correction-20261027-131542.md`
交付说明 SHA-256：`B881BA5E31FC94FFA2536A0A93125C759A3074D9D6C441F1BDF12AAFC4517E5B`

留给主编排：独立表达式等价检查、实际新单测、受影响 UI/类型检查，随后按令做私有构建、
严格入口和 GUI；静态检查和本地单测不能替代 GUI 验收。
