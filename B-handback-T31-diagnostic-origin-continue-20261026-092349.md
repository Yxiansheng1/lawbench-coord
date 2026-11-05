# B 线交回：T31 首因诊断路径规范化补正

## 状态

已完成执行令允许的有界静态修改与文件交回。该结果不是 runtime admission，不证明
`runs\T33-host-20261026-080026` 的原始 `required_path_missing` 原因，也不构成 HTTP、
GUI、模型、测试、打包或 T31 验收结论。Git 全程只读，没有 commit SHA。

## 冻结前状态与保全

- 执行令、冻结 `before` 和 root 初步证据均按指定路径只读核对。
- `before\server.py`：112595 字节，SHA-256
  `f1238a50bc9e892aa8fe7d21ccb972bc179f032d535b11e495e40336029738c1`。
- 修改前现场 `server.py` 与该冻结源完全同哈希，说明接续的是既有实际代码。
- B 工作树事前已很脏：分支 `line-B` 对 `origin/line-B` 为 ahead 141、behind 1，
  同时存在大量既有 tracked/untracked 变更；目标目录本身为未跟踪目录。未用 stash，
  未清理、覆盖或回滚任何既有 dirty 文件。
- 全工作树只读 status 对若干既有超长运行目录报告 `Filename too long`，因此该命令不能
  枚举这些旧目录内部；没有尝试修改 ACL、锁、权限或路径来解决。目标目录的定向 status
  仍为 `?? docs/plan/evidence/T31/BatchGuiEntry-20261026-044214/`。
- 第一次 Git status 误把 `--ignore-submodules=all` 放在全局选项位，PowerShell 下返回
  `unknown option`；随后改为只读子命令级参数完成检查。没有因此扩权或执行 Git 写操作。

## 实际修改

只修改了执行令白名单内两个文件：

1. `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`
   - 修改前：112595 字节，SHA-256
     `f1238a50bc9e892aa8fe7d21ccb972bc179f032d535b11e495e40336029738c1`
   - 修改后：112475 字节，SHA-256
     `c44334b2c8d28531c080403d4aa6d1a7c8e5069b699155c4f25fe432ff978d6e`
   - 唯一源码差异位于 `Firewall._diagnostic_relative`（第 1469 行起）。
   - 删除先对 root/value 分别调用原始 `os.path.abspath` 的两行，把
     `os.path.relpath(value_absolute, root_absolute)` 改为
     `os.path.relpath(_norm(value), _norm(run_root))`（第 1477 行）。
   - 只读逐字 diff 证明 `_norm`、`_within`、`_no_reparse`、诊断 traceback 收集、
     `_fail`、`_complete` 的 catch、自动记录、协议状态、路由、认证、次数、快照和其他
     源码均未改。

2. `docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\README.md`
   - 修改前：8363 字节，SHA-256
     `5668a06f0b74ea8a818662fec035974178bb17a3cb73dc136f5f9f075ef5edaa`
   - 修改后：9270 字节，SHA-256
     `e612c9be7707abc64e2db00c291556364484a684a6ea00c324bb3774053e00e7`
   - 只读 diff 证明仅在第 172 行后的文末追加 907 字节说明，原内容未改。

冻结探针 `probe.mjs` 与 `before` 逐字一致：20697 字节，SHA-256
`dd9a58dbb66e9e83b2e0d0b06d79ea0a2208fc02e140f812ef73e7f4db7aeb0f`。

## 诊断边界保持

- `_required_path_diagnostic` 仍位于第 1445 行，继续只生成 traceback 中各 frame 的
  `function`/`line`，以及 `_no_reparse` frame 的 `path`/`current` 相对值。
- `no_reparse_path` 与 `no_reparse_current` 仍相对 `self.case.parent`；外部路径在
  `_within` 失败时固定返回 `pinned_external`，内部路径经现有 `_norm` 规范后返回
  run 相对路径。
- 没有输出异常正文、self/locals 全量内容、token、请求/响应/正文/header，也没有新增
  日志框架、字段类别、路由、公共契约或运行时产物。
- 第 2266 行起的既有 catch 顺序未变：先尝试诊断，诊断自身失败即丢弃详情，随后必定
  `_fail(failure_code)`，所以原始首因仍会记录。`protocol_failure` 及可选
  `protocol_failure_details` 的既有附加条件未改；正常五字段不受影响。

## 验证与未验证

只做了只读文件身份、逐字 diff、冻结探针一致性、目标 status 与关键行核对。严格未运行：

- 作者解析器、AST/Python、自检、测试、Vitest、tsc；
- prepare、serve、probe、构建、GUI、HTTP、模型、网络、安装；
- 任何 Git 写操作或打包。

纯 Windows 长路径别名与外部路径隐私反例留给 root 独立复核；本轮没有用自制测试绕过
验证禁区。原始 GUI 首次 `required_path_missing` 的根因仍未确定，需 root 先审本交回与
累计源码，再按执行令做 A 的精确 SHA pin 和一次新的真实 GUI 采集。Packaging HOLD。
