# T30 GUI 端口字面值修正记录（2026-10-28 10:47:24）

状态：`AUTHOR_RUNTIME_ZERO / STATIC_CHANGED_NOT_RUN / ROOT_FRESH_PREPARE_ADMIT_GUI_REQUIRED`

本记录只承接
`D:\Lawbeach\lawbench-coord\A-T30-GUI-port-literal-order-20261028-104724.md`。
当前执行者是独立 A 线的 DeepSeek 执行者，也是本工作树的唯一 writer。没有联系其他
聊天、更换 API，没有启动 setup/legacy、产品、服务或 GUI，也没有改权限、审批、ACL、
锁、writer 状态或 Git。

## 既有状态核对

- `103405` 失败运行未复用，其现场未写。该运行没有
  `started.json`、`ready.json`、`final-metadata.json`；保留
  `run-error.json`、`launch-error.json`、`loop-closed.json`。
- `run-error.json` 记录
  `exceptionType=Deny`、`guardCode=LB_FORWARD_PORT_not_fixed`、
  `outcome=FAILED_FOR_ROOT_REVIEW`、`rootRetained=true`。
- 源案件仍为 5 个文件；失败运行目标案件仍为父日志、子日志和 `case.db`。
  父日志 12,059 bytes /
  `e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee`；
  子日志 16,235 bytes /
  `b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461`；
  `case.db` 65,536 bytes /
  `47f21b3fb42c2648605943bd1ee590ceb42dcfd5b6dfd2c8c35c1d8099e7faa6`。
- `A-dirty-before.txt` 与修改后的
  `git status --short --branch --ignore-submodules=all` 均为 197 行，差异 0。

## 精确补丁

`entry.py` 只删除条件中的文件路径归一化包装：

```diff
- if _norm(os.environ.get("LB_FORWARD_PORT", "")) != "65005":
+ if os.environ.get("LB_FORWARD_PORT", "") != "65005":
```

精确字面值 `"65005"`、拒绝码 `LB_FORWARD_PORT_not_fixed`、其他函数、断言和清理
均未改。`start.ps1` 只改入口 bytes/SHA 两行：

```diff
- $NativeEntryBytes = 48554
- $NativeEntrySha256 = 'c68a8155b6b3d843605849f18e060ef7d663f43bd7dab0ba4e6a3247e9e9e1ba'
+ $NativeEntryBytes = 48547
+ $NativeEntrySha256 = '709cd845fc4ecc389eb3f906f0bc03ad45676c4c9e09d1d8d4e75297dcd8ee87'
```

## 文件身份

| 文件 | 修改前 bytes / SHA-256 | 修改后 bytes / SHA-256 |
| --- | --- | --- |
| `entry.py` | 48,554 / `c68a8155b6b3d843605849f18e060ef7d663f43bd7dab0ba4e6a3247e9e9e1ba` | 48,547 / `709cd845fc4ecc389eb3f906f0bc03ad45676c4c9e09d1d8d4e75297dcd8ee87` |
| `start.ps1` | 74,131 / `627ed8bf61240479e9d0f5e8a4e4279890f2e44269e7328683016d2a3d44fb35` | 74,131 / `8aa948afe87e7a8d29ad6d394acd06d737d53b701000ef181316b04f4a359b8f` |

`start.ps1` 的入口字面量与修改后 `entry.py` 的实际 bytes/SHA 完全一致。两份文件均为
UTF-8 无 BOM、纯 LF。

严格未写的既有证据文件身份：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13,520 | `285e5dec942a50a42b277f9d1cf43f690b7b16b0e8e2d0f10abe03e3783d590a` |
| `stop.ps1` | 7,145 | `cc9e0d32ffd9572c2edb1dbb6b030740d5503ef211698198527e3ed0618f3055` |
| `交付说明.md` | 9,579 | `0f8cd031fb50b4548eb56946d86215bf23885d47975b4b3244360c6ba1d53fdb` |
| `README.md` | 10,989 | `73a952925692b163c2ddb8889a8e79a46a8e92784b6638f7e0d198a988741b7d` |
| `root-static-fix-20261028-102456.md` | 15,809 | `67396ce216f481c830b6e07396ffdecee7fac4e51ef00270c1348e9f7f832e11` |
| `root-final-observer-20261028-103604.md` | 12,432 | `fe023aa1a770f3ad54253e5b4891943c746bf8a4d1506399eed2a2f98dc4d23c` |

历史计数串 `47/37mainfinalobserver and40/36earlierfix170/149main` 按令原样保留，
旧记录未改写。

## 静态核验

- 旧表达式
  `_norm(os.environ.get("LB_FORWARD_PORT", ""))` 为 0 处。
- 新条件
  `os.environ.get("LB_FORWARD_PORT", "") != "65005"` 唯一命中第 775 行。
- 拒绝码 `LB_FORWARD_PORT_not_fixed` 仍在紧邻分支。
- `entry.py` 减少 7 bytes，恰为删除 `_norm(` 与其右括号。
- 冻结文件、源案件、失败运行案件、两份会话日志和 `case.db` 身份均与既有固定值
  一致。

## 命令与非零

所有实际 shell 调用均使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、
`login=false`，工作目录 `D:\Lawbeach\lawbench-A`。C13 是本文件写入后的原生命令行
只读回读。合计 43 次 shell 调用、7 次非零；没有 Bash 或其他 shell 实际执行。

| 命令组 | 次数 | 内容 | 非零 |
| --- | ---: | --- | --- |
| C01 | 1 | 完整读取正式执行令 | 0 |
| C02 | 4 | 根级状态、目标文件枚举、证据与协调目录清单 | 1：共享 `dsh` submodule 权限拒绝 |
| C03 | 6 | 目标入口/启动脚本静态读取、三份旧证据读取、脏状态文件读取 | 1：初查文件名不存在 |
| C04 | 6 | bytes/BOM/CRLF、表达式、启动 pin、忽略 submodule 的 dirty、运行门文件 | 2：复合命令解析错误；精确检索引号错误 |
| C05 | 4 | 修改前身份、唯一命中、`_norm` 上下文、dirty 前件 | 1：`^def _norm` 无匹配 |
| C06 | 3 | 修改后入口身份、条件与 pin、`_norm` 上下文 | 0 |
| C07 | 6 | 最终身份、六份冻结文件身份、表达式、三份运行 JSON | 1：shell 字段误配 Bash，执行前拒绝 |
| C08 | 2 | 旧证据数字检索、命令标记计数 | 1：同类 Bash 字段误配，执行前拒绝 |
| C09 | 3 | 协调目录历史串检索、原生计数、执行令原文复核 | 0 |
| C10 | 3 | 源案件、失败运行案件、修改前后 dirty 对比 | 0 |
| C11 | 2 | 源/目标日志与会话数据库 bytes/SHA | 0 |
| C12 | 2 | 读取 `formal-report` 与 `cn-prose` 规程 | 0 |
| C13 | 1 | 新建两份文件存在性、bytes、BOM、CRLF、关键标记回读 | 0 |

七次非零均未写文件。两次 Bash 字段误配在 managed runner 执行前被
`Bash/E_ACCESSDENIED` 拒绝，未执行命令，也未更改沙箱、审批或 ACL。根级普通
`git status` 的 submodule 权限拒绝保留为环境阻碍，没有修复或扩权。

## 写面与边界

`apply_patch` 成功写面只有：

| 序号 | 写面 |
| --- | --- |
| W1 | `entry.py` 的唯一表达式；`start.ps1` 的两行入口身份。 |
| W2 | `start.ps1` 的最终入口 SHA 字面量。 |
| W3 | 本新证据记录。 |
| W4 | 协调目录新交回件。 |

shell 没有写文件。没有执行 Python、Node、parser、AST、测试、prepare、admit、
serve、probe、HTTP、模型、Key、SSH、GUI、build、selftest 或删除。没有执行
Git `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push`、
暂存、锁修复或扩权。

作者运行时为 0，因此不宣称语法执行、准入、服务、GUI、USB 或整 T30 通过。
`GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`、
`Packaging=HOLD`。

## 根侧下一步

根侧应完成完整来源、差异、原始文件、finally 与 pins 审计，然后使用这一新身份做
新的 prepare、admit、完整 GUI，上限 600 秒。不得复用 `103405` 失败运行。本执行者
在交回后停止。
