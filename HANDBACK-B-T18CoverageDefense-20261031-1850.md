# T18 覆盖率修复后的辩护意见消费者源码交回

状态：`SOURCE_PREPARED_NOT_RUN`。

## 交付位置

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CoverageDefenseActual-20261031-1850`

目录内文件：

- `native-defense-opinion.mts`
- `b-service-defense-opinion.py`
- `literalfixed-inputs.json`
- `wire-schema-finite.mjs`
- `README.md`

README 的交付表是本目录唯一一次最终四文件原生大小与 SHA-256 清点结果。

## 有界变更

- `native-defense-opinion.mts` 只改 `APPROVED_RUNTIME_PINS` 四个对象，以及
  Agent 和 Host 两条静态编译产物导入。新编译目录为
  `CoveragePrivateBuild-20261031-1845\private-output-20261031-184648`。
- `b-service-defense-opinion.py` 与旧已接受消费者逐字节相同，53696 字节，
  SHA-256 `6dee119fcb6949b2df376445bd2f8f77b28f8f04e8463d40e3546068f5a2b6fd`。
- `wire-schema-finite.mjs` 与旧已接受消费者逐字节相同，21756 字节，
  SHA-256 `73272d3fd8adbc9b089ad57c1e6ea6402a130d297ee224383b3d9cea572f48ea`。
- `literalfixed-inputs.json` 只更新 `compilerPrivate` 四个对象，以及消费者、
  Python 服务自身路径、大小和哈希。批准输入、源码 pin、Skill、任务、材料、
  notes、授权答案、选择决定、SDK 源码与可执行文件身份未改。

## 只读核对

- 新旧 MTS 逐行差异仅涉及批准的四项 pin 与两条静态导入；新旧清单逐行差异
  仅涉及批准的四项 `compilerPrivate` 与消费者、服务自元数据。
- 新编译对象均按正式元数据核对：
  - Agent：566945 字节，SHA-256 `2b8ca40fe6ce5dfdd90edfe910d3d830e662dd33115181dc446118b85a505244`。
  - Host：904755 字节，SHA-256 `ad0f620ef16519f53cec228b9683d44163df9d37ad7759ef1b4370299fdc45ba`。
  - package：1257 字节，SHA-256 `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`。
  - manifest：58592 字节，SHA-256 `156ca581c3bee3706f5a1ddfdc16cea32fef3939985d838fd51593e13e03e202`。
- 新 MTS 中旧构建目录残留 0 处、新构建目录 6 处（四项 pin 加两条 import）；
  新清单中旧构建目录残留 0 处、新构建目录 4 处。

## 根层接手

请根层完成整文件反向字节审查、源码/pin 审查和私有运行目录 setup/cleanup
审查。确认除上述允许行外无差异后，再只执行一次原辩护意见实际场景。若有任何
非授权差异或 pin 不匹配，应停止退回，不应改 repin 掩盖。

## 阻碍与声明

- 首次带子模块的只读 `git status` 在共享 `dsh` worktree 元数据处返回
  permission denied；改用 `--ignore-submodules=all` 只读确认外层状态。
  未尝试修复锁、权限、审批、沙箱或 ACL。
- 两次 PowerShell 命令因 `foreach` 直接接管道而在解析阶段失败，未执行文件
  读取或写入；改用先收集结果后正常完成。
- 未启动消费者、B 服务、schema 观察器、模型、HTTP、GUI，未运行测试、构建、
  导入或语言解析器，未生成运行报告，也未查看旧目录的运行结果、样例、答案或
  oracle。本文不声明运行时、质量门、业务或法律通过。
- Git 严格只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`。交回以本协调目录文件为准。
