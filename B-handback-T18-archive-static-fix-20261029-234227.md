# B 线 T18 归档静态修复交回

状态：`SOURCE_ONLY / STATIC_FIX_READY_FOR_ROOT / STRICT_NOT_RUN`

任务入口：
`D:\Lawbeach\lawbench-coord\B-T18-archive-static-fix-order-20261029-234227.md`

本交回只表示执行令限定的静态修复已完成，允许主编排继续独立审计和运行。它不
表示 fixture 已运行、扫描器已通过、模型或 HTTP 已通过、T18 已完成、T23 已完成，
也不表示可发车。

## 完成范围

只修改了原证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ArchiveNative-20261029-231046\`

共五个文件：原四个文件的静态修复、README，以及一个新增有限 fixture helper。没有
修改工单集、产品 A/B、Skills、contracts、SDK、测试或现有私有构建。旧 formal 未
打开、未覆盖。证据目录当前没有 `run-*` 目录。

1. 15 条批准输入保持逐行 bytes、SHA-256、mtime 核验。10 个 TXT 作为材料；
   `_任务说明.md`、`SKILL.md`、`要点.md` 保留原角色；两个工具 schema 只作为批准
   元数据，精确限定到 B 的 `contracts/tools/` 两个路径，未知行仍拒绝，schema 不复制
   为案件材料。
2. TXT 直接复制到 `case_root/<original relativePath>`，不再加
   `02案件材料/` 包装。注册前只允许 10 个文件和来源父目录；真实
   `CaseRegistry.open` 后才允许 `registry.py` 民事模板的既定 21 个目录及来源父目录，
   未知文件、目录、重解析项和越界路径继续拒绝。
3. MTS 材料早期身份核验只把错误的 `material.originalBytes` 改为
   `material.bytes`；`MaterialReadRecord.originalBytes = source.bytes` 保留。扫描
   row、原始区、文件身份循环和 B 服务均使用同一原相对路径。
4. manifest 全量采用主编排提供的 V2 数据，依赖数为 29，加入实际民事行政卷目录
   `3684 / a265908e491a6f2f40d6249288309d0c143cb4a6b63273f580ce03015d0a7eeb`；
   除当前 consumer 和 B 服务的最终 bytes/SHA 外，与 V2 无差异。
5. 新增 `archive-fixture-finite.py`，仅由 Root 执行。脚本先核验全部 15 条批准输入，
   再从实际 B 源码 AST 提取指定六个函数及必要常量，原样编译执行正负 fixture。正向
   要求 10 个原相对路径和 bytes/SHA/mtime 一致且无 `02案件材料/` 包装；负向分别
   加入一个未批准普通文件、一个未批准普通目录并要求实际验证器拒绝。自有根目录保留。

## 最终文件身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-archive.mts` | 170355 | `279f3d3cd49e06a801aaa363c3b95d493b9f305e7d3c4a67b3f4c34454b6f76b` |
| `b-service-archive.py` | 54751 | `de60a4988fb8af32d9c8076cb7c210d69fdfa560753b264ed1678b40e09720f4` |
| `literalfixed-inputs.json` | 15395 | `a0423927fbd34ebd06e92b5e219b6a5e0b39d7b56e9046504a53e883dd4bc9bd` |
| `archive-fixture-finite.py` | 9804 | `8dacbe13936c98d0bf54727b7cbeb2a79feee56b8a88d6b242790a3ff154d527` |
| `README.md` | 7929 | `efd7ef5d601261d66319c3d66007ce37292c067cf1fb5eda4272d64432410974` |

原批准清单保持：

- `approved-inputs.json`：4178 字节，SHA-256
  `eb0c8f7f988590326d7a715e081c309cb2c0d0054b922ad773e3587614b0d574`；
- 15 行、10 个 TXT 材料、3 个任务/Skill/要点角色、2 个 schema 元数据行；
- 冻结四问 ID、callback、JSONL、引用和人工质量边界未改。

## 只读核验

- 当前 consumer 与输入副本的 diff 只包含上述 schema 15 行接入、29 依赖、原相对路径
  和 `material.bytes` 修正。
- 当前 B 服务与输入副本的 diff 只包含 schema 元数据准入、直接相对路径复制、注册前
  严格目录集、注册后既定民事模板集及扫描 row 原相对路径断言。
- 当前 manifest 与主编排 V2 的 diff 只有 consumer 和 B 服务最终 bytes/SHA 两处。
- Git 只读目标状态只列出本目录允许的五个文件，均为原工作区既有未跟踪证据，未暂存。
- 复用既有批准输入身份和历史证据，没有重演旧开工、安装、调研、产品检查或全量测试。

## 命令原始计数与阻碍

截至本正式交回写入前，共调用 `exec_command` 41 次：

- 退出 0：34 次；
- 退出 1：7 次。

7 个非零中：

- 1 次是共享 worktree `dsh` 子模块权限拒绝；
- 2 次是误填 `bash`，由 MXC 在执行前拒绝，无读写效果；
- 4 次是预期有差异的只读 `git diff --no-index`，不是测试失败。

另有 2 次只读 Git 命令的 shell 参数误写为 `native-powershell`，命令成功且无写效果。
总共有 37 次调用使用指定绝对路径：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

且 `login=false`。上述偏差均未用于任何通过结论。

## 严格未运行

`STRICT_NOT_RUN`：

- 未运行 Node、Python、TSX、helper、AST 执行、导入、类型检查、测试、构建；
- 未运行扫描器，`scanner 9` 没有结果；
- 未启动 Core、工具、HTTP、GUI、Native Session、Agent 或模型；
- 未读取或使用任何 API Key，未访问任何网络服务；
- 未生成 Native UUID、JSONL、材料索引或事件；
- 未执行 T23、归档生成、Word 或任何真实案卷操作。

helper 的允许结论上限仅为 `LOCAL_FIXTURE_UNIT_NOT_MODEL_OR_SCANNER`。

## Git 边界

未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或
`push`，未暂存、未提交、未合并，因此没有提交 SHA。`dsh` 权限拒绝和任何索引锁均
未尝试修复或扩权。

后续由 Root 按正式执行令独立审计源码、运行 helper、验证完整命令面，再决定是否
继续真实归档流程。B 线到此停止。
