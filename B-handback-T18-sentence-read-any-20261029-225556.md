# 线 B 正式交回：T18 读材料 helper 内建 `any` 有限修复

## 结论

- 执行令：`D:\Lawbeach\lawbench-coord\B-T18-sentence-read-any-order-20261029-225556.md`
- 状态：`SOURCE_ONLY / NOT_RUN`
- 唯一修改：在 `read-guard-finite.py` 的 `_SAFE_BUILTINS` 中插入一行
  `"any": any,`。
- 修改前：6551 bytes，SHA-256
  `ABF7C3D8DE879DB405961CEE49301FE900079BFE105755EECE07455DA03C8439`。
- 修改后：6567 bytes，SHA-256
  `B41A4FABFA3B8D65EE5824A740180C8F32AB0618046EEE30A859781CCD5FA36D`。

本文件是协调目录中的正式交回件，不是 Git 提交。它不是产品、真实模型、完整
T18、发车或业务质量 PASS。14 项 pure UNIT、514 项 literal admission 和一次必要
的原始实际仍须由 Root 按既定边界执行。

## 既有状态与冻结输入

修改前，目标文件与指定快照
`D:\Lawbeach\lawbench-coord\T18SentenceReadAnyInput-20261029-225556\read-guard-finite.py`
逐字节相同，均为 6551 bytes、
`ABF7C3D8DE879DB405961CEE49301FE900079BFE105755EECE07455DA03C8439`。

以下冻结输入在修改后仍与快照逐文件 SHA-256 相同：

| 文件 | bytes | SHA-256 | 状态 |
| --- | ---: | --- | --- |
| `b-service-sentence-calc.py` | 50285 | `D22B23A29B0A6F438F393FCBF755F9CA578CD17AFC0E567995AA95EAC70DE82F` | 未变 |
| `native-sentence-calc.mts` | 164237 | `F5A837E15BD3B9279D2DD52997DE3F38D59089F9A30CCE4531922E41D8AFB8C8` | 未变 |
| `literalfixed-inputs.json` | 12420 | `7EEA9C826F4615F45BF0029A7D90B2DAB01745FC8E48539D719947F326541FBF` | 未变 |
| `README.md` | 5967 | `36E857E80DF5583281511285E2CF3AFB78FAD1256A84853DE4B2DB6CF8C3E817` | 未变 |

既有 dirty 工作目录全部保留。没有修改 Skill、产品、测试、旧正式文件、模型、
prompt、answers、budgets、guards、断言或其他输入证据，没有创建新 root 或变更
路径。

## 精确修改

文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\SentenceReadContract-20261029-224308\read-guard-finite.py`

实际唯一 diff：

```text
@@ _SAFE_BUILTINS @@
     "__name__": "finite-firewall-unit",
+    "any": any,
     "bool": bool,
```

插入内容为 16 bytes：

```text
20-20-20-20-22-61-6E-79-22-3A-20-61-6E-79-2C-0A
```

修改后关键行：

```text
  42:     "__name__": "finite-firewall-unit",
  43:     "any": any,
  44:     "bool": bool,
  53:     "staticmethod": staticmethod,
```

全文件字节级反向核验通过：从当前文件移除 offset 1047 处这 16 bytes 后，与修改前
快照逐字节完全相同。字节增量恰为 16；当前为 252 个 LF、0 个 CRLF、0 个孤立
CR、无 UTF-8 BOM，并以 LF 结束。没有改动 helper 逻辑、断言或其他内建项。

## 复用与验证边界

- 复用既有已通过且源码不变的原始证据与冻结输入身份。
- 没有重演旧开工、安装、调研、全量测试或旧真实运行。
- 没有运行 Node、Python、TSX、AST/import/check/test/build、HTTP、模型、GUI、
  SSH、DPAPI 或产品路径。
- 没有执行本轮 helper，因此本轮不产生 `UNIT_PASS_NOT_REAL_MODEL` 结论。
- 没有运行 14 项 pure UNIT、514 项 admission 或一次必要的原始实际。
- 没有新增、替换或弱化任何 final workflow、late ask、read、calc、save 断言。

Root 后续顺序保持为：完整反向审查本次单行插入，运行 14 项 pure UNIT，运行
514 项 literal admission，再执行一次必要的原始实际并用冻结后置验收闭环。

## Git 与执行纪律

Git 全程严格只读。没有执行 `git add`、`commit`、`rebase`、`stash`、`reset`、
`clean`、`checkout` 或 `push`；没有暂存或提交。

首次普通 `git status --short` 因共享 worktree 的 `dsh` 子模块目录权限被拒：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

随后使用只读的 `--ignore-submodules=all` 完成状态核对；没有修锁、权限、ACL、
审批、`.git` 或子模块。`index.lock` 或权限拒绝不作为需要修复的交付阻碍。

另有一项工具参数偏差：一个只读 `git diff` 调用误将 shell 填成 `bash`，运行器在
执行前以 `Bash/E_ACCESS_DENIED` 拒绝，未执行命令，也未产生文件效果。另一项
PowerShell 哈希比较脚本因管道位置解析失败而退出 1，未触及文件，修正表达式后
重跑。除该次被拒绝的误填外，后续命令均显式使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
且 `login=false`。没有启动 setup、切换 legacy、更改沙箱或扩权。

本次当前 PID 只作 B 执行者，不是第二 writer。未联系其他聊天、未更换 API、未触碰
生产。正式写入只有目标源码的一行字符串与隔离证据目录中的本交回文件。
