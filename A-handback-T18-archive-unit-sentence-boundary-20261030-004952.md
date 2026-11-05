# T18 归档单元测试：句法 Skill 边界校正交回

日期：2026-10-30  
状态：`SOURCE_COMPLETE / RUNTIME_NOT_RUN / GIT_WRITE_NONE`  
执行身份：独立 A 线 DeepSeek 执行者（`deepseek-v4.1-flash-1017/max`）  
执行令：`D:\Lawbeach\lawbench-coord\A-T18-archive-unit-sentence-boundary-order-20261030-004952.md`

## 1. 结论

已按令只修改既有新增测试：

`D:\Lawbeach\lawbench-A\dsh-ext\tests\archive-workflow-gate-20261030-003021.spec.ts`

从 `agent/index.ts` 导入既有导出 `CASE_LIST_BEFORE_SENTENCE_READ_DENIAL`，并在诉讼文书拒绝分支与通用允许分支之间加入一个 `SENTENCE_CALC_SKILL` 的 `else-if`。该分支断言：尚未成功列出材料清单时读取材料，应返回：

```text
{ kind: 'deny', reason: CASE_LIST_BEFORE_SENTENCE_READ_DENIAL }
```

原有诉讼文书拒绝仍保留；其余七个既有 Skill 仍期望读取允许；无 Skill 分支仍保持原有语义。没有新增案例、没有预加载 LIST、没有削弱任何断言，也没有修改产品代码。

## 2. 写入面与精确计数

| 项目 | 非零计数或值 |
|---|---:|
| 本轮源码文件写入 | 1 |
| 本轮正式交回文件写入 | 1 |
| 修改的既有测试 | 1 |
| 新增导入 | 1 |
| 新增 `else-if` 分支 | 1 |
| 新增 `expect` 断言 | 1 |
| 新增案例 | 0 |
| 新增行 | 6 |
| 删除行 | 0 |
| 产品代码写入 | 0 |
| 配置、builder、README、旧测试、Skills、SDK、runtime、private outputs、B product 写入 | 0 |
| 运行时测试执行 | 0（`NOT_RUN`） |
| Git 写入 | 0 |

目标文件修改前：

| 属性 | 值 |
|---|---|
| 字节 | 29,358 |
| 行数 | 732 |
| SHA-256 | `19ba2e9269e5ec84c897a367fd815458d1eabf0994070ac60ad68146c08cbde3` |

目标文件修改后：

| 属性 | 值 |
|---|---|
| 字节 | 29,638 |
| 行数 | 738 |
| SHA-256 | `4719391feb49b71281eaa99ec2b6d0cde4d87d15a2df056b1a9e130811bfcd41` |
| 相对快照字节差 | +280 |
| 相对快照行差 | +6 |

快照到目标的只读差异核验为 `6 additions / 0 deletions`，内容恰好是上述一个导入和一个 `else-if` 分支；除此之外全文 inverse identical。

## 3. 冻结输入与复用证据

修改前后均读取并核验：

`D:\Lawbeach\lawbench-coord\T18ArchiveUnitBoundaryInput-20261030-004012\frozen-source-pins.json`

四个 pin 全部匹配：

| 文件 | 字节 | SHA-256 | 状态 |
|---|---:|---|---|
| `dsh-ext\agent\index.ts` | 50,557 | `d76bd85184e271ffb7aa10a4e8e1a5a11242aa4ae80850f02f29e94f89e94801` | MATCH |
| `dsh-ext\agent\task-state.ts` | 22,291 | `82121824045eee3e4e816caa5c066152b7e00681c39c207d49f562b399801815` | MATCH |
| `docs\plan\evidence\T18\ArchiveWorkflowGate-20261030-003021\build-config.mjs` | 20,463 | `9516e0f99bf42c9d8525191a2a422ad383f182a5b1dd4ec605db3f17babc9a62` | MATCH |
| `docs\plan\evidence\T18\ArchiveWorkflowGate-20261030-003021\build-private.mjs` | 32,121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` | MATCH |

复用并核验了执行令指定的原始测试快照：

`D:\Lawbeach\lawbench-coord\T18ArchiveUnitBoundaryInput-20261030-004012\archive-workflow-gate-20261030-003021.spec.ts`

该快照仍为 29,358 字节、732 行、SHA-256  
`19ba2e9269e5ec84c897a367fd815458d1eabf0994070ac60ad68146c08cbde3`，与目标修改前基线一致。

既有原始准备证据保留在：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\ArchiveWorkflowGate-20261030-003021\`

本令禁止重演旧开工、安装、调研、全量测试或构建，因此直接复用该目录及其冻结 pin，没有改写或新增其中文件。

## 4. 产品依据

产品源码中的现有句法工作流在 `sentenceWorkflow` 为真、`case_read_material` 尚未获得同一任务的成功材料清单时返回 `CASE_LIST_BEFORE_SENTENCE_READ_DENIAL`；该常量为既有导出，未新增或改写产品语义。测试原先把 `SENTENCE_CALC_SKILL` 归入通用读取允许分支，与本产品行为不符；本轮只校正该测试预期。

## 5. 验证状态

- 文件级：路径、字节、行数、SHA-256 和相对快照差异已核验。
- 冻结源：四个 pin 在修改后仍全部匹配。
- 差异边界：`+6/-0`，只有 1 个导入和 1 个 `else-if`。
- 运行时：`NOT_RUN`。
- Node、Python、AST、parser、import/check、测试、构建、HTTP、模型、GUI、SSH、DPAPI、credentials、process probes：均未运行。
- 根验证和任何测试通过结论：未作出；按令由 root 单独运行。

## 6. Git 与工作区

Git 全程只读，没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

既有工作区 dirty 全部保留，未清理、未暂存、未回退。默认 Git 状态探测在受限子模块路径  
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh`  
被权限拒绝；未改 ACL、未扩权、未修改或拆除 writer 锁，也未尝试修复 `index.lock`。随后仅使用 `--ignore-submodules=all` 与 `--no-optional-locks` 读取其他状态。

一次用于文件统计的 exec 参数误选为 bash；宿主在命令真正执行前返回 `E_ACCESSDENIED`，没有文件或 Git 状态变化。此后所有实际读取、哈希、差异和写入核验均使用执行令指定的完整 `pwsh.exe`、`login=false`。

## 7. 停止点

本正式交回件写完后停止。未进行任何 Git 提交，后续由 root 在授权边界内独立核验和运行。
