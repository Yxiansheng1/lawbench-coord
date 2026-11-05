# B 线交回：T32 PDF GUI root-layout correction

状态：`AUTHORED_NOT_RUN / STATIC_LAYOUT_COMPAT_ONLY / PACKAGING_HOLD`

## 结论

已按正式执行令完成一个有时间、文件和函数边界的静态适配。`_prepare`
仍严格要求根部四件并严格检查 private/input/ready/case；只有
`_verify_prepared` 可以额外接受与冻结启动器精确匹配的 `root/gui`。
没有删除或跳过根检查，没有开放任意目录，没有改动产品代码。

作者没有运行 Python、Node、import、parser/AST、compile、测试、build、
prepare、serve、probe、HTTP、GUI、trace、模型、Office 或 selftest。
因此本件不声明修复成功，也不把静态前提写成产品失败或运行通过。

证据说明：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\root-layout-correction-20261027-210353.md`

该说明为 8,236 bytes，SHA-256
`d0f7537ab1ea8fa2d5a6286a09197ab0e444165db79b77e52fb8fde3e4a8f08f`。
旧 README、旧交回件、probe 和 frozen GUI start 均未改写。本说明只取代
旧材料中 GUI 根布局会被拒绝的判断；旧材料中的修改前 `server.py` 哈希
仍作为 provenance。

## 精确改动

只修改：
`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\server.py`

- 新增 `_assert_gui_layout(root)`：`gui` 必须非 reparse，直接条目恰为
  `dsh-home / electron-user-data / host-skills / logs /
  private-native / state` 六个普通非 reparse 目录。
- 只用既有 `_checked_file` 读取 `gui/state/current.json`；要求
  `schemaVersion=1`、`task=T33-native-gui`、`reason=""`、
  `phase in {prepared, launching}`、canonical `runRoot=root`。
- 精确要求 `paths.gui=root/gui`、`paths.state=root/gui/state`、
  `paths.nativeRun=root`，以及固定 accepted private build：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112`。
- `_assert_root_inventory` 增加默认 `allow_gui=False`；`_prepare` 仍调用
  默认严格版本，`_verify_prepared` 显式调用 `allow_gui=True`。

固定 private build manifest 仍为
`5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f`，
manifest 加 24 个 literal outputs 共 25 个不可变输出；本次入口不读取
manifest、不递归 profile/history/cache，也不构造 OS 权威。

## 当前身份

- `server.py`：78,926 bytes，SHA-256
  `165565761356c1100baf7b101b4a39ff1dbcf668d89321e3b1874bae9246da9f`
  （修改前为 76,898 bytes / `bada298e…a85e0e`）。
- `probe.mjs`：32,525 bytes，SHA-256
  `766c0e1a3c1a81f0569efc429eda0d983030341a72cacadffa185697641ddf6f`
  未变。
- `README.md`：12,105 bytes，SHA-256
  `ab417cf87e364661ba0d624eae79ec128988b6ca0a48c2983fdee256cb379aa6`
  未改写。
- frozen GUI start：77,186 bytes，SHA-256
  `3dbff8acb475a86e61bb8f7381e9e178c9c15ed9d85f4aec6df7250b0915f395`
  未改写。

最终只读反向 diff 统计 `63 insertions / 4 deletions`，只覆盖
`_assert_gui_layout` / `_assert_root_inventory` 区段和
`_verify_prepared` 的调用行；恢复这两个 sanctioned 区域可逐字节回到
修改前 `bada…5e0e`。

## 证据复用与纠正

没有重演旧开工、安装、调研或全量测试，也没有新增 runtime。旧源码身份
已由输入目录重新哈希核对，由于除 sanctioned 区段外字节未变，原
`probe.mjs` 继续沿用为来源材料，但没有把它变成新的通过证据。

覆盖语义按作者自纠保留：材料数 `1`、`read_units=1`、`total_units=5`；
不再写 `coverage.total=5`。原 root finding 也记录 `root_runtime=0`、
`product_bug_proven=false`。

## 通道、Git 与阻碍

Git 严格只读：没有 `add/commit/rebase/stash/reset/clean/checkout/merge/
push`，没有暂存或提交，无提交 SHA。既有 dirty 全部保全。

普通 `git status --short --branch` 因
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh`
权限拒绝 exit 1；未修复、未扩权、未改 ACL/锁/沙箱/审批。
`--ignore-submodules=all` 的只读状态成功。该阻碍不属于本次交付修复项。

一次早期读取旧交回时误把 shell 写成 `bash.exe`，启动层以
`Bash/E_ACCESSDENIED` 拒绝，命令未执行。
随后恢复正式执行令指定的完整原生 PowerShell 绝对路径与 `login=false`。
未启动 setup/legacy，未拆 writer 锁，未联系其它聊天，未更换 API。

## Root 下一步

1. 对最终 `server.py` 做全字节反向审计，确认反向恢复两个 sanctioned
   区域后哈希回到 `bada298e…a85e0e`，probe/README/frozen start 哈希不变。
2. 使用全新 root 执行一次既定的有限 native PDF citation 事件；不得复用
   旧根，不得把本次静态适配当作运行结果。
3. native 有限事件通过后，另用全新 GUI root 验证冻结启动器能到达
   bootstrap，并在 `<=600s` 内完成 PDF citation 入口的既有范围；这一轮
   没有 GUI 证据。

本件交回即停止；Packaging 保持 `HOLD`。
