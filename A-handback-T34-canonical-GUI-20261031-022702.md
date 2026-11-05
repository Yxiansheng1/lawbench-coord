# A 线交回：T34 canonical original-runtime GUI

状态：`SOURCE_ONLY_READY_FOR_ROOT_REVIEW / AUTHOR_RUNTIME_ZERO / GUI_NOT_RUN / WHOLE_T34_NOT_PASS`

交回方式：协调目录文件。按本次正式执行令，本交回不是 Git 提交；Git 只读和写入次数均为 0。

## 交付物

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CanonicalOriginalGUI-20261031-022702`

目录内只有批准的 11 个基线文件：

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `prepare.ps1` | 13563 | `57a55816e85436b74fc1143d550b217e6fc402b843c7e67ac0d4df9e4d6afa5e` |
| `start.ps1` | 95734 | `66edf51bddc08c0f009f080b76699e25b00696a320bae9e6d93fc33ce54b2b90` |
| `stop.ps1` | 7180 | `b8510efdfe0e3247d3b02cecfa22738a24358802bd3fad5a03320f8c3ba899ed` |
| `entry.py` | 88654 | `aa42c2aa1e9f0b3e5b84b1ba20b9bdd26ac35a1552a491f7f3d67ed266001f64` |
| `projection-observer.mjs` | 20058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `private-provider-binding.mjs` | 2499 | `376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e` |
| `settings-read-observer.mjs` | 11513 | `4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107` |
| `signature-finite.mjs` | 5381 | `d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed` |
| `observer-finite.mjs` | 6845 | `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb` |
| `literal-inputs.json` | self | `SELF_NOT_REFERENCED` |
| `README.md` | 3665 | `964d6a30c28c58cfad666bf3aed6eb1d20443675c46d48bfbad684b44a3263c3` |

`literal-inputs.json` 以批准 `root-approved-manifest-blueprint.json` 核心为骨架，只更新
11 个交接文件身份、本轮作者真实计数和 `not_run`，并保留批准的自引用约定：
`bytes: null`、`sha256: SELF_NOT_REFERENCED`。没有动态自哈希接受。

## 有界修改

- `prepare.ps1`、`stop.ps1`、`entry.py` 只迁移所属证据根。
- `start.ps1` 迁移证据根、更新 `entry.py` 的字节数和 SHA-256、更新
  `private-provider-binding.mjs` 的同一新根 URL，并加入批准的原运行时固定校验。
- 新常量为
  `D:\Lawbeach\lawbench-A\dsh\apps\desktop\.desktop-build\development\project`。
- 新 pin 数组恰为批准蓝图中的 38 个物理原始文件，路径不是逻辑
  `node_modules` 链接路径。启动前使用既有 `Assert-File`、`Assert-Sha256` 和
  `Get-Item().Length` 逐项核对，并且只以存在性检查确认 canonical 根及 `.env`
  文件，不读取环境文件内容。
- 未对原始逻辑 SDK 的既有工作区链接施加私有 owned NoReparse 守卫。
- 唯一环境赋值变化为
  `DSH_DESKTOP_DSH_DIR` 从 `$Project` 切到 `$CanonicalOriginalRuntime`。
  `$Project` 继续作为冻结 profile、legacy 检查和特殊 LawBench persona resolver
  所需的不可变 E50 输入。
- 五个 helper 均与批准基线逐字节一致。原 E50 输入、冻结 18 pin、当前 25 个私有
  文件、三个 native shim、resolver、guard、PDF 来源与资源、fake Key、私有
  HOME/TEMP/profile、内存凭据、外部发送拒绝、finally 清理、PID/exe/birth、
  600 秒上限均保留。
- `NODE_OPTIONS` 仍仅含原 resolver import 与原 network guard require；没有
  provider preload 或新 binding。合成外部 seed 的
  `http://127.0.0.1:65005/v1` 字面 URL 保留。
- 未复制或镜像 SDK 库，未 build、install、package、创建新链接、替换 resolver，
  也未修改默认库、私有 25、产品源码、真实凭据或原 served root。
- 未创建新的 prepared root 或 runs；没有留下作者启动的服务、窗口或临时 provider。

## 验证与未运行

最终只做一次 PowerShell 文件元数据读取。作者运行时为 0：Node、Python、
parser/AST、JSON parse、import、check、test、build、prepare、admit、start、应用、
GUI、HTTP、model、Key、DPAPI、SSH、process probe 均为 0。

实际 GUI、settings read、necessary ordinary unset、projection observation、
settings-read observation、physical patch verification、stop、owned OS closure
均未运行。全量套件为 `HOLD`，等待 owner 放行。whole T34 不是 PASS；本交回只证明
源码 bundle 已完成，不能由源码推导 GUI 通过。

ROOT 下一步按令独立复核新源码、delta、全部 raw 与 pin，只复用源码未变的有限
helper，再做一次新的受控 GUI：自有窗口观察、必要 unset、物理 patch、stop 和 OS
closure。不要在本作者停止点继续重试或增加变体。

## 执行计数与阻碍

- `exec_command`：27 次；25 次返回 0，2 次非零。
- 非零 1：一次只读哈希命令中的 PowerShell 语法错误，未执行产品或脚本。
- 非零 2：一次误把 shell 设为 Bash，在启动前被 runtime 拒绝；Bash runtime 实际为 0。
- Git 只读：0；Git 写入：0；没有 add、commit、rebase、stash、reset、clean、
  checkout 或 push。
- 没有联系其他聊天，没有更换 API，没有读取 Key、生产配置或真实案卷，没有修改
  沙箱、审批、ACL、writer 锁、权限或 lock 文件。

到此停止。
