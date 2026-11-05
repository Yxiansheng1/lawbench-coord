# A progress，源码交回待主编排验证

状态：`SOURCE_HANDED_BACK / NOT_RUN`  
更新时间：2026-10-26T17:04:38+08:00

已做：

- 首个工具只读正式执行令。
- 只读核对 before 快照、三个产品源码、冻结测试与配置。
- 在原生 `prompt()` 前加入同步材料 admission 检查，失败沿用既有单次释放和
  回显撤销路径。
- 保留旧三钩 hook 兼容；没有新增请求号、Host 字段或全案回退。
- 新增只含 `service.ts` 和 `apply.ts` 的 P-29 后续补丁。
- 写入证据说明和正式交回文件。

当前关键哈希：

- `service.ts`：`9263521B80781489A071D411C14B7D3E85EF484A37F4A03046AA40A44A977414`
- `apply.ts`：`92D61E26087DD7D150A43F7E505AB07FAA3114F90CA5A9318459B991F9703BB0`
- `material-batch.ts`：`3447CA541CB32694416E33E1B808468A7930323C63A3D2B4A44B1F563C5368AF`
- 新补丁：`6BA11AE09A9E7ADEC05831479A84541ADAC0E72297F1729415718D95ECFCDF1D`

验证边界：

- 本线未运行 Node、Vitest、collect、产品、测试、`tsc`、Python、parser、AST、
  build、prepare、serve、probe、HTTP、GUI、网络或 `git apply`。
- 两个 native admission 用例、受影响 19 项、C disposal 1 项、类型检查、
  生命周期 5 项和原生身份 4 项均为 `NOT_RUN`。
- 没有用源码静态检查替代实际运行，也没有宣称整个 T31 通过。

阻碍记录：

- 普通 Git 状态与差分读取在共享 `dsh` 子模块元数据处被 managed MXC 权限拒绝；
  没有尝试修权限、锁、ACL 或扩权。只读
  `git status --short --branch --ignore-submodules=all` 已成功，顶层既有 dirty
  全部保留，当前分支为 `ahead 93 / behind 1`。
- 静态核查与文档扫描中共六条命令误填 `bash`，均在启动前被拒绝，未执行；
  随后用指定 native PowerShell 成功重跑。
- 两次 `rg` 路径写法导致退出 1，均未改状态，后续改用了精确文件读取。
- 三次 `git diff --no-index` 退出 1，是存在预期差异的正常文本差分返回码。
- 两次交付文字黑名单扫描退出 1，表示没有命中。
- 一次文档微调路径写漏 `T31` 目录，`apply_patch` 在写入前拒绝，没有文件变化；
  随后用实际路径重做。

下一步：主编排复核累计源码与补丁顺序，在隔离副本重放，再实际运行冻结两例、
受影响 19 项、C disposal 1 项、类型检查和必要窄生命周期回归。完整依据见
`docs\plan\evidence\T31\NativeAdmissionFix-20261026-165555\README.md`。

删减轮：读者 2 / 槽位 1 / 半句 2 / 重复 2 / 过程 0 / 黑名单 4

Response ID：`A-T31-native-admission-fix-20261026-165555-progress`  
Response log path：`D:\Lawbeach\lawbench-coord\A-progress-T31-native-admission-fix-20261026-165555.md`
