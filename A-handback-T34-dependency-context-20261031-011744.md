# A 线 T34 dependency-context 正式交回

状态：`SOURCE_READY / AUTHOR_RUNTIME_ZERO / PREPARED_RESOURCE_NOT_CREATED_BY_AUTHOR / PREPARE_NOT_RUN / ACTUAL_NOT_RUN / FULL_TEST_NOT_RUN`

交回方式：协调目录文件。按本次执行令，不写 Git、不提交、不合并。Git 只做过只读状态检查。

## 交付文件

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\dependency-context.mjs`
2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\literal-inputs.json`
3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\DependencyContext-20261031-011744\README.md`
4. 本交回件。

固定基线为
`CompleteLauncher-20261031-004819\complete-launcher.mjs`，76,074 bytes，SHA-256
`92b2f652d5a25ac25f93816dc39b87bd8512dbf383150bba5478f3c0a9c65df6`。基线源码只做过一次完整
byte 读取；后续只读其必要函数区段，未重载旧报告。

固定复制表为
`T34DependencyContextInput-20261031-011744\approved-copy-table.json`，1,722,626 bytes，
SHA-256 `44710f94a3368937cfd808fae8f0c5ffbdea6ffe14602bf2e183247e0c035c7e`，
4,704 files / 25,628,005 bytes。`approved-inputs.json` 未改。

## 源码交付内容

- 原 99 项内嵌复制表已移除，替换为固定 `COPY_TABLE` path/bytes/SHA/schema/count/bytes。
  原 14 个 source pin 保持原值，观察器仍为 original source pin。
- 固定表先核对自身 bytes/SHA，再 `JSON.parse`；要求精确 schema、4,704 files、
  25,628,005 bytes、允许扩展名、唯一 owned 相对路径，外层与行均冻结。
- 每次 prepare/actual 均核对固定表、原 14 pin 和表内全部 4,704 个原始文件。
- `--prepare-only --root` 只接受固定准备根，父目录固定为协调目录，创建后复验 reparse。
  `--root` 实际模式仍只接受本证据目录 `runs` 下尚不存在的子目录。
- prepare 只向固定准备根写 `complete-runtime`；逐文件 `wx` 写入、回读 SHA/bytes，
  不使用目录遍历或未绑定输入。每个新父目录前后受 reparse/owned 边界约束。
- prepare 最终结果为 `DEPENDENCY_FILES_PREPARED_NO_APP_IMPORT`，在任何 DSH import、
  `runProfile`、mutation、模型、worker、GUI 前返回 0。
- actual 不复制、不准备、不复用旧 served root；先验证 prepare proof PINNED 表
  SHA/count/bytes，再验证全部 4,704 个准备副本 SHA/bytes，之后才 import。
- 原有 pipeline 保留：八类 guard、旧 profile 只读元数据、prepared runtime 中的
  internal `profile-boot` import、最小新 profile、唯一 `unset providers.external`、
  物理 patch、观察器、identity 诊断、一次真实 shutdown。
- import/boot 未到达 mutation 时明确写 `NOT_REACHED`；只在实际拿到 context 时尝试
  自有 shutdown；未返回 context 时不声称整 context 已 dispose。

`literal-inputs.json` 的 `approved-inputs.json` JSON 核心与字段顺序保持原样，仅在末尾
追加一个 `handoff` 对象，记录本件自述、固定计数、全零运行计数和 `NOT_RUN`；未增加
其他顶层字段。

## 作者验证

- 只做了源码静态读取、引用搜索和文件元数据读取；未启动 JSON/JS parser、VM、Node、
  Python、import、check、test、build、prepare、actual、boot、应用、GUI、HTTP、模型、
  worker、SSH、DPAPI 或 process probe。
- 固定准备根未由作者创建。实际 runs root 未由作者创建。
- Git add/commit/rebase/stash/reset/clean/checkout/push 均为 0。
- 产品代码、SDK bytes、resolver、guard、观察器、业务 profile、Key/密码/环境变量均未改。

## 实际命令计数与阻碍

- PowerShell exec 请求：30 次；最后 1 次为本交回件完成后的一次四文件只读 metadata
  检查。前 29 次中：2 次退出码非零；1 次 PowerShell 非终止错误但工具退出码为 0。
- Bash 预执行拒绝：1 次。误设 `shell=bash` 后被 runner 在启动前拒绝；Bash runtime 为 0。
- Git：只读状态请求 2 次；写操作 0。第一次完整 status 因既有 `dsh` 子模块
  `Permission denied` 失败；随后用 `--ignore-submodules=all` 只读确认主树，未改权限、
  ACL、index/object 锁、沙箱或审批。
- 目录创建首次因该主机 `New-Item` 不接受 `-LiteralPath` 产生非终止错误，未创建文件；
  随后用固定绝对路径的 `-Path` 与 `$ErrorActionPreference='Stop'` 成功完成交付目录。
- 源码引用搜索一次无匹配并退出 1，属预期；不是运行失败。
- Node/Python/runtime/prepare/actual/model/HTTP/GUI/worker/process-probe 次数均为 0。

## 未完成与根侧下一步

本交回只证明源码和固定输入已形成可执行交接，不证明准备复制能跑、实际 launcher 会
boot、unset 会 fulfilled、GUI 会工作或 T34 已修复。根侧仍需按 README：

1. 一次性执行 `--prepare-only`，180 秒 setup 外壳内独立核对 4,704 副本、原始来源与
   OS closure；
2. 准备根闭合后用新 runs child 执行一次 actual，45 秒外壳不变；
3. 完整保留 raw、stdout/stderr、exit code、prepare/actual proof、observer 与 cleanup
   证据，再作 PASS/失败判定。

到此停止，不执行 prepare/actual 或任何替代重试。
