# T30 GUI 压缩配置补充

状态：`AUTHOR_RUNTIME_ZERO / STATIC_CHANGED_NOT_RUN / ROOT_FRESH_PREPARE_ADMIT_GUI_REQUIRED`

本记录承接
`D:\Lawbeach\lawbench-coord\A-T30-GUI-compression-order-20261028-110209.md`。
执行者只修改私有 GUI profile 的压缩配置。没有运行产品、服务或 GUI，也没有执行
Python、Node、测试、parser、AST、prepare、admit、HTTP、模型或删除。当前 PID 是
本次唯一 writer，不是第二个 writer。

## 既有状态

协调目录冻结快照中的 `start.ps1` 为 74,131 bytes /
`8aa948afe87e7a8d29ad6d394acd06d737d53b701000ef181316b04f4a359b8f`，与修改前
工作树文件逐字节一致。目标脚本所在目录在 Git 中整体未跟踪，dirty 快照保存在
`D:\Lawbeach\lawbench-coord\T30GuiCompression-20261028-110209\A-dirty-before.txt`
（9,100 bytes /
`d7424de5571769c42b219f7954c78d2c7764a50d830fa8afc4185e15f2f459fc`）。
本次没有覆盖或清理其他 dirty 文件。

普通 `git status` 在共享 `dsh` submodule 处被权限拒绝；忽略 submodule 的状态读取
另报告长路径无法枚举。两项都是只读环境阻碍，没有修权限、ACL、锁或审批，也没有
执行任何 Git 写操作。

## 源码证据

协调目录保留了与本次裁定对应的冻结源码副本：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `installed-jsonl-index.js` | 68,746 | `74784ff35d292004a40fdf7bfdb7306a85d31bd3f4938c03e6a29cf4812a7335` |
| `session-store-index.ts` | 18,019 | `f0b335c7e2eb0a83544ac9acefd95c079abaaae1a297383d7d2a6cde066619a8` |

`installed-jsonl-index.js` 第 32 行定义 `DEFAULT_COMPRESSION = 'zstd'`，第 49 行把
该值设为 schema 默认，第 171 行使用
`config.compression ?? DEFAULT_COMPRESSION`。第 1251–1256 行在 Session 目录发现
相反压缩后缀时调用 `encodingMismatch`，第 1419–1422 行明确要求换 root 或选择匹配
的压缩模式。

`session-store-index.ts` 第 35–36 行声明可选 `compression`，第 165 行仅在配置提供
该值时才把它传给 `Jsonl`。已验收 T30 输入保留为两份真实明文
`session.v4.jsonl`，身份仍为 12,059 bytes /
`e07870975267497a8ab19b7836d01f549d48effe161c55b8e63bf669616b5dee` 和
16,235 bytes /
`b6e48f43655a511fb07020a61574e5767d4f9bbac72459057ceb791f19ee8461`；既有 T30
准入报告为 `PASS`，没有改写这些日志。

上一轮 `105256` 的生成 profile 第 91–98 行显示
`legal-session-store-t31-private` 没有 `compression`。这与本次明文输入形成确定的
配置不一致，但尚无新建 root 运行中出现非空 GUI 会话行的证据，因此不能把该配置
不一致写成“空列表根因已证明”，也不能写成 GUI PASS。

## 修改

`start.ps1` 只在私有 profile 的 `backendModule` 下新增一行：

```diff
         backendModule: !!js "process.getBuiltinModule('node:module').createRequire(baseUrl).resolve('@deepseek-ai/dsh-session-persistence-jsonl')"
+        compression: none
         defaultRoot: !!js dshHomePath('sessions')
```

该行位于第 907 行，目录内精确命中 1 次。修改只影响本次新生成的
`legal-session-store-t31-private` profile；原始日志、产品 loader、全局默认值、
router、源码和准入配置均未改。

| 文件 | 修改前 bytes / SHA-256 | 修改后 bytes / SHA-256 |
| --- | --- | --- |
| `start.ps1` | 74,131 / `8aa948afe87e7a8d29ad6d394acd06d737d53b701000ef181316b04f4a359b8f` | 74,157 / `4566466fd7057439ca1cf2b2505cc4432283df842709d4c199f236febb1a59ba` |
| `README.md` | 10,989 / `73a952925692b163c2ddb8889a8e79a46a8e92784b6638f7e0d198a988741b7d` | 11,473 / `446418ca7a16c77a72585c250f92488926ec98b8d938fe2d87f568fa599bf957` |

`git diff --no-index --numstat` 对冻结 `start.ps1` 给出的结果是 `1 0`。修改后脚本
仍为 UTF-8 无 BOM、纯 LF，共 1,510 个 LF。`entry.py` 未变，启动脚本中的入口
bytes/SHA pin 无需调整。以下既有文件与冻结快照逐字节一致：

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 48,547 | `709cd845fc4ecc389eb3f906f0bc03ad45676c4c9e09d1d8d4e75297dcd8ee87` |
| `prepare.ps1` | 13,520 | `285e5dec942a50a42b277f9d1cf43f690b7b16b0e8e2d0f10abe03e3783d590a` |
| `stop.ps1` | 7,145 | `cc9e0d32ffd9572c2edb1dbb6b030740d5503ef211698198527e3ed0618f3055` |
| `交付说明.md` | 9,579 | `0f8cd031fb50b4548eb56946d86215bf23885d47975b4b3244360c6ba1d53fdb` |
| `root-static-fix-20261028-102456.md` | 15,809 | `67396ce216f481c830b6e07396ffdecee7fac4e51ef00270c1348e9f7f832e11` |
| `root-final-observer-20261028-103604.md` | 12,432 | `fe023aa1a770f3ad54253e5b4891943c746bf8a4d1506399eed2a2f98dc4d23c` |
| `root-port-literal-20261028-104724.md` | 6,892 | `6b1b1934c0c82e54b75e7cf638b7ae9a0f064cf5a10fadc62157f74046119d56` |

## 命令与边界

所有实际 shell 调用均使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、
`login=false`，工作目录 `D:\Lawbeach\lawbench-A`；没有使用 Bash、cmd 或其他 pwsh。

| 命令组 | 次数 | 非零 | 内容 |
| --- | ---: | ---: | --- |
| 执行令 | 1 | 0 | 只读完整执行令 |
| 状态与位置 | 10 | 1 | dirty、目录、字节、插入点；一次共享 submodule 权限拒绝 |
| 来源与证据 | 8 | 2 | 冻结源码、既有报告；两次 `rg` 无匹配 |
| 快照与精确来源 | 5 | 0 | 协调快照、源码上下文 |
| 修改与差异 | 7 | 3 | 单行补丁、numstat 与 diff；一次命令语法错误、两次预期差异退出 |
| 写作 skill | 2 | 0 | `cn-prose`、`formal-report` |
| 冻结身份 | 4 | 0 | 修改后身份、未改文件逐字节一致 |
| 最终回读 | 3 | 0 | 新文件、最终状态与身份回读 |

合计 40 次 shell 调用、6 次非零。另有 2 次工具参数在 shell 启动前被拒绝，没有
执行命令或写文件。shell 没有写文件；成功写面仅为 `start.ps1` 一行、`README.md`
一段、本记录和新交回件。没有 Git `add`、`commit`、`rebase`、`stash`、`reset`、
`clean`、`checkout`、`push`、暂存、锁修复或扩权。

## 结论与根侧下一步

本次修补使新私有 GUI 输入与真实明文的 `compression: none` 物理格式一致。要确认
它是否改变空列表，必须由根侧重新审计后使用全新 prepare、admit 和 GUI 运行，上限
600 秒；不得复用失败或已服务的旧 root。只有新 GUI 出现父、子两个真实 Session
行，才能讨论原推断获得观察支持。

`GUI_PASS=false`、`USB_PASS=false`、`whole_T30_PASS=false`、
`Packaging=HOLD`。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 1 / 黑名单 0
