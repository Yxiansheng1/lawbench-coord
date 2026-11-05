# B 线交回：T31 批量入口长路径原件排除

## 状态摘要

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 按执行令只改了既有入口的一个遍历方法，追加了原入口说明，新增了一个 AST 选区回归及说明。源码可交 root 累计复核；回归尚未运行。 |
| 目标是什么 | 让原件复制排除检查在合法的同一身份超长内部案件目录上继续完整遍历，同时保持短路径、链接、缺失路径、哈希和所有既有护栏不变。 |
| 在等什么 | 等 root 累计复核，并在复核后运行新回归。若新回归通过，再由 root 判断有限 GUI 条件；启动器 pin 只能在累计复核和该纯检查之后处理。 |
| 卡在哪 | 没有工程阻塞。按令作者不得运行 Python、解析器、AST、测试、服务、探针或 GUI，因此全部运行证据为 `NOT_RUN`；打包保持 HOLD。 |

## 精确改动

唯一产品入口改动位于：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`

只改 `Firewall._contains_source_payload`。方法内新增 `traversal_access`：

- 仅当 Windows、绝对标准盘符或 UNC、长度达到旧 `MAX_PATH` 目录余量 248 字符，
  且不是已有 `\\?\` / `\\.\` 拼写时才转换；
- 先消除绝对路径中的 `.`、`..` 与混合分隔符，标准盘符使用 `\\?\`，
  UNC 使用 `\\?\UNC\`；
- 转换结果必须经未改的 `_norm` 与原名相等，身份不等则退回原路径；
- 该方法只把该访问拼写用于原目录、entry 访问、目录入栈和 `_sha256`。

248 字符以下路径、已有扩展长度前缀、非 Windows 路径、非绝对路径和无 drive 路径
仍按原拼写。没有新增全局路径框架或产品 helper。

原有 `_norm`、`_within`、`_link`、`_no_reparse`、`_sha256` 未改，仍分别承担身份
规范化、范围判断、链接/reparse 拒绝、逐级缺失与 reparse 检查以及完整 SHA-256。
遍历仍不排除任何目录或文件；命中仍要求 size 和 SHA-256 同时相等；错误仍抛原
`Deny` 码。认证、路由、次数、阶段、关闭、网络、元数据、`probe.mjs`、产品、
契约、UI、Host、构建与 launcher pin 均未改。

原入口 `README.md` 只追加本次根因、改动和未运行说明。

## 新聚焦回归

新目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchLongPathCheck-20261026-110943\`

`check_long_path.py` 使用标准库读取相邻的既有 `server.py`，通过 AST 只选择并编译：

- 实际 `Deny` 与唯一 `REPARSE` 赋值；
- 实际未改的 `_norm`、`_within`、`_link`、`_no_reparse`、`_sha256`；
- 实际唯一改动后的 `Firewall._contains_source_payload`；
- 该方法的唯一局部 `traversal_access`。

脚本不导入 `server.py`、`lawbench` 或产品，不启动服务，不调用子进程、HTTP 或网络。
它实际运行选中的 helper 和方法，覆盖：

- 目录和文件都超过 260 字符，只有同大小但不同 SHA-256 的文件时必须返回 `False`；
- 同大小且同 SHA-256 的合成来源载荷必须返回 `True`；
- 短路径命中和不命中的原行为；
- 实际方法对缺失路径仍拒绝 `required_path_missing`；
- 实际方法对系统现有安全 reparse 仍拒绝 `reparse_point`；
- 标准盘符和 UNC 只验证字符串转换及 `_norm` 身份，不访问网络共享；
- 短路径与已有扩展长度前缀保持原拼写。

脚本只创建 `tempfile.mkdtemp` 返回的私有合成树，不创建任务、历史、结果或案件
元数据。`finally` 会再次核验根是临时目录直接子项、名称带唯一前缀、根本身不是
reparse，然后通过标准扩展长度别名递归删除该唯一根，并断言普通拼写和别名都不再
存在。不会删除任何既有 run 或旧目录。

运行依赖是 Windows 标准临时目录，以及至少一个只读系统 reparse 夹具
（`<SystemDrive>\Users\All Users`、`<SystemDrive>\Documents and Settings` 或
`<SystemDrive>\ProgramData\Application Data`）。若均不可用，脚本明确失败，不跳过
或弱化拒绝断言；脚本不创建符号链接、junction，不请求权限或 UAC。

## 依据与验证

- 已完整读取唯一执行令
  `D:\Lawbeach\lawbench-coord\T31-batch-long-path-order-20261026-110943.md`。
- 开工时目标入口为 112475 字节，SHA-256
  `c44334b2c8d28531c080403d4aa6d1a7c8e5069b699155c4f25fe432ff978d6e`，
  与执行令一致。
- 保全基座目录中的 `server.py` 哈希同为上述值；保全 patch 实际文件为
  `B-tracked-before.patch`，149242 字节，SHA-256
  `5e78ab2ad23d4ae33f388f1fc91ae80cab4ff3c7831035e4a8e4ad323f853bd1`。
  本运行未改写该 patch。
- 对保全 `before\server.py` 与当前入口执行只读 `git diff --no-index
  --ignore-submodules=all`，差异只落在 `Firewall._contains_source_payload`；
  没有第二处源码差异。
- 当前 `probe.mjs` 仍为 20697 字节，SHA-256
  `dd9a58dbb66e9e83b2e0d0b06d79ea0a2208fc02e140f812ef73e7f4db7aeb0f`，
  与既有准备记录一致。
- 针对四个允许文件的只读 `git status --short --untracked-files=all
  --ignore-submodules=all` 显示它们仍均为未跟踪文件；没有暂存。

当前允许文件的实测身份：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `BatchGuiEntry-20261026-044214\server.py` | 113384 | `10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4` |
| `BatchGuiEntry-20261026-044214\README.md` | 10931 | `ed187563b64a1831143350ccad3e2e4a57ef807a0c69a2ec929d0eb8b93d8e42` |
| `BatchLongPathCheck-20261026-110943\check_long_path.py` | 13560 | `906ea8c65fbe4bf823585e2a855dd0d52e2fff942956f9f1c952eb273c53963d` |
| `BatchLongPathCheck-20261026-110943\README.md` | 3031 | `c0ad5a65ecf2691979b8064ae9f51e47a788b955ade6dbe9ea34fa6cea8e755e` |

原入口 README 改前为 9270 字节，SHA-256
`e612c9be7707abc64e2db00c291556364484a684a6ea00c324bb3774053e00e7`。

## 未做与降级

- `NOT_RUN`：新 `check_long_path.py`。
- `NOT_RUN`：任何 Python、AST、解析器、编译、pytest/collect、Vitest/tsc、
  selfcheck、prepare、serve、probe、构建、GUI、HTTP、模型、安装或旧源码绿色测试。
- `NOT_RUN`：原始完整 batch、原失败 run 的重放、A 启动器 literal pin、发布和安全
  GUI 条件。
- 没有更新 sourcepin、启动器 pin、旧状态、rollout、原元数据或期望证据。
- 没有 Git add/commit/rebase/stash/reset/clean/checkout/push，没有暂存、改锁或扩权。
- 没有更改沙箱、审批、ACL、安全策略或 API/config。

运行器偏差：两次辅助只读检查（一次 `rg`、一次 diff）误把 shell 填成 `bash`；
shell 均在启动阶段因访问被拒而未执行目标命令，没有改变任何文件或 Git 状态。
另有一条身份汇总 PowerShell 首次因管道写法报解析错误，未执行文件操作；一次只读
保全 patch 哈希误少了文件名前缀 `B-`，随即按指定输出目录顶层确认了实际文件名。
这些偏差均不构成交付阻碍，后续命令均保持显式 PowerShell。

## 根因与边界

本次复用 root 已落盘的只读根因证据
`root-original-path-audit.json`，没有读取旧缓存/历史载荷，也没有重新服务旧 run。
该证据确认 276 字符合成现有 native 会话目录的普通拼写不可见，而标准盘符扩展长度
别名引用同一身份且原 `_no_reparse` 可通过；20 个路径元数据检查只出现这一处读取
拼写失败，没有发现 reparse entry。

因此本次只处理入口遍历的访问拼写，不把问题扩大为材料缺失、索引缺失、native 导入
失败或产品安全策略变化。完整批次是否仍可运行、GUI 是否可用和发布是否成立仍归 root。

## 下一步建议

root 先对新方法与新回归做累计复核；复核接受后，只运行新回归并检查其 `SOURCE_SHA256`
与清理结果。该纯检查通过后，才判断 A 启动器 literal pin 和新的安全 GUI 条件。
在这两站之前，不宣称原完整 `3/3`、完整 T31、GUI 或发布通过，打包保持 HOLD。

Response ID: `B-T31-LONGPATH-20261026-110943`

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T31-batch-long-path-20261026-110943.md`
