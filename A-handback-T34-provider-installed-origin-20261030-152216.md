# A 线 T34 已安装源绑定交回

状态：`SOURCE_ONLY_READY_FOR_ROOT_REVIEW`。本次只完成已证明的根因字面修复
与源包交回，不是 T34 PASS；实际 GUI、必要 unset、物理 patch 和底层写因
均未由 A 线验证。

## 做了什么

- 按执行令从批准输入复制十一份基线到唯一新目录。
- 仅把 `private-provider-binding.mjs` 的 `FIXED_ORIGINAL.path` 从工作区副本
  改为安装拥有的同字节模块：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\@deepseek-ai\dsh-llm-pi-ai\lib\index.js`
- `prepare.ps1`、`stop.ps1`、`entry.py` 只替换自身证据根名。
- `start.ps1` 只替换自身根、入口和绑定的字节/SHA 固定值、安装源字面路径
  及绑定 URL 断言。
- `README.md` 改为本次短交回说明；`literal-inputs.json` 以 ROOT 批准的
  整份 blueprint 为数据底稿，只写十一项实际摘要、literal 自引用占位、
  作者非零实况和 `not_run`。历史元数据及
  `prior_author_runtime_violation` 原样保留。

## 根因证据

- 主桌面入口设置
  `DSH_DESKTOP_DSH_DIR=D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project`。
- Host 将同一 `runtimeDir` 作为安装锚点；profile 安装优先解析
  `node_modules\@deepseek-ai\dsh-llm-pi-ai\lib\index.js`。
- 旧 hook 固定的工作区副本与新安装源是不同绝对 URL，严格文件 URL 比较
  必然不能命中。
- 两个原始文件均为 `114078 / a86cc1bd55ae218b92eea3cad786c454a82b4450c351572c669f8c24d3ef1d9f`。
- 本次修复只改 hook 的源字面；候选仍为
  `81412 / 664859957b714046e4667ca8a7739fddd232b358ecf36da3750c562d788a7c17`，
  manifest 仍为
  `24383 / f881626dbcd0cce738f2bcb08a64e3d3bf7bc48de93921ebce3d4329edb72e54`。

## 交付目录

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderInstalledOriginGUI-20261030-152216`

目录内恰有十一份文件：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `entry.py` | 88660 | `9e6231b6b8d9f651328175921b029249835c6b442ae16c4c053d9d095c0059fb` |
| `literal-inputs.json` | 30528 | `146e2f79b24c7237d2dad88d79f842b9897610e90410cce30102e7c333712685` |
| `observer-finite.mjs` | 6845 | `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb` |
| `prepare.ps1` | 13569 | `627d32b16dc0d02a8d554eadef259efe6255f55a6e8eac4873abdc9793f4c7f7` |
| `private-provider-binding.mjs` | 2564 | `ef202125b689f7fd4bd34134b97ea7ea09d62c2dad5d066399501f80607d6819` |
| `projection-observer.mjs` | 20058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `README.md` | 3176 | `b754f4478b4c77b855e1f15e3caa4cfb7dde4515d276e5231f428f492ccce7e7` |
| `settings-read-observer.mjs` | 11513 | `4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107` |
| `signature-finite.mjs` | 5381 | `d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed` |
| `start.ps1` | 86142 | `5cf7a96ec0ccf2725b5a9fa343c74f2732bc256c2db11246d478afb4e6a3f2bc` |
| `stop.ps1` | 7186 | `8a35854e87470394abc55b64c7c3cc3bccb30562656b326777f44791caafd59b` |

## 保持不动

- 固定原始 provider、候选组件、候选 manifest 的实际字节与 SHA 未改。
- 当前私有构建根、25 项 manifest 库存、当前 Host
  `904755 / ad0f620e…fdc45ba`、client
  `539494 / 87ffe74e…0ff869`、全部 24 项输出和 3 项原生 shim 均未改。
- 原 resolver `1a174359…27b208`、network guard、PDF fixed-origin 源、
  SDK 源和 E50 安装树只读未改。
- 既有真正合成 provider、静态假 Key、外网禁用、Occurrence 2、出站拒绝、
  OCR retainer off、600 秒、自拥有清理、UUID 历史案卷副本均未改。
- `settings-read-observer.mjs`、`projection-observer.mjs`、
  `observer-finite.mjs`、`signature-finite.mjs` 与批准输入逐字节相同。
- 未增加 helper、未改测试、未重建 SDK、未改产品代码或旧 served root。

## 未运行与结论

- 未运行 prepare、admit、start、GUI、设置读取、原生/设置观察、stop、
  owned OS 关闭或必要 unset。
- 未运行 Node、Python、AST/parser、import、check、test、typecheck、build、
  有限 helper、HTTP、模型/网络、环境 Key、DPAPI 或进程探测。
- 实际绑定命中、BOUND marker、物理 patch 与完整闭包均 `NOT RUN`。
- 底层写因：
  `NOT_FIXED_OR_PROVEN_BY_PATH_CORRECTION`；whole T34：`NOT PASS`；
  Packaging：`HOLD`。

## 只读核验与阻碍

证据十项非 literal 的自摘要与包内固定值同源；四份“不变”文件已与批准
输入对比为逐字节相同。literal 的十一项 inventory 记录自身为
`bytes=null / SELF_NOT_REFERENCED`，其实际哈希见上表与 handoff。

第一次 `git status --short --untracked-files=all` 因仓库外共享子模块元数据
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 的
`Permission denied` 返回非零；随后用只读、忽略子模块的方式取得工作树状态，
同时出现大量长路径 `Filename too long` 警告。未修锁、未扩权、未改 ACL，
既有 dirty 全量保留。另一次误填非指定 shell 的调用在启动前被运行器以
`Bash/E_ACCESSDENIED` 拒绝；一次只读 `Select-String` 正则语法错误在执行
读取前返回非零。两类均未执行 Bash、未产生文件或产品状态变化，已如实计入
非零。

Git 全程严格只读。未执行 add、commit、rebase、stash、reset、clean、
checkout 或 push；交回以本文件和新证据目录为准。

## 下一步

ROOT 全逆变换审查本十一文件、literal 与 handoff 后，再另发一次实际运行令。
该次运行才是必要 unset 与物理 patch 的验证入口。A 线到此停止。

Response ID: A-T34-provider-installed-origin-20261030-152216

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T34-provider-installed-origin-20261030-152216.md`
