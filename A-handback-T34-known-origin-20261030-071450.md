# A 线 T34 已知来源分类补充：正式交回

结论：`SOURCE_HANDOFF_COMPLETE / AUTHOR_RUNTIME_ZERO / ROOT_AUDIT_FINITE_AND_ONE_ACTUAL_REQUIRED`

工单：T34 已知来源安全分类补充。  
分支提交 SHA：`NOT_APPLICABLE_BY_ORDER`。本运行器被明确禁止 Git 写操作；
没有 `add / commit / rebase / stash / reset / clean / checkout / push`，也没有
尝试扩权或修复锁。  
交付根：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450`

## 1. 目标与已确认事实

本次唯一目标是补齐已审底层源码能严格命名的错误来源，并让观察者保留一个
深度 0、有限、可选的 `Error.cause` 摘要。

已封闭的旧实测仍然是当前实际事实：

- 两个精确模块均通过 SHA-256 校验并安装成功。
- 一次 `settings.mutate` 执行 `unset providers.external`。
- 同一路径进入 `ConfigEditor.edit`，47 ms 后拒绝。
- 旧输出为 `Error / code OTHER / errno OTHER / category other / issues [] /
  moduleFrames []`。
- 没有 UI 输入、Send、输入法、fork、删除或新模型回合。
- 15 个完整 OS 身份已结束，52701 无监听，窗口消失，5 个源文件保持。
- 底层产品根因仍未证明，实际错误属于哪个已知来源仍为 `UNKNOWN`。

因此本次不是产品修复，也不能写成根因 PASS。

## 2. 有界改动

`projection-observer.mjs` 只增加：

1. `ERROR_NAMES` 加入 `ValidationError`。
2. `ERROR_CODES` 加入 `INACTIVE_EFFECT`。
3. `INACTIVE_EFFECT` → `inactive_context`。
4. `ValidationError` 名称 → `config_validation`。
5. `HMR transactions cannot be nested` → `hmr_nested_transaction`。
6. `HMR is disposed` → `hmr_disposed`。
7. 精确前缀 `atomic-write: timed out waiting for the writer lock at ` →
   `file_lock_timeout`，不输出路径。
8. 三组固定来源的物理路径、file URL 与固定 label。
9. 深度 0 非空对象 cause 的同一 sanitizer、深度 1 摘要。

新增固定模块 label：

- `@deepseek-ai/cordis/lib/index.js`
- `@deepseek-ai/dsh-hmr/lib/index.js`
- `@deepseek-ai/dsh-atomic-write/lib/index.js`

既有固定类别、未知项 `other`、三组旧模块帧、转义/边界/去重/最多 4 帧和
深度 1 停止均保留。无模糊字符串、NLP、启发式或 secret-value 匹配。

静态文本证明：新旧 `importPinned` 至 `addEvent` 块均为 1,380 字符且 Ordinal
相等；新旧 `apply` 至 EOF 均为 6,382 字符且 Ordinal 相等。模块 URL、pins、
export 检查、原型身份、两个包裹器、`once`、`Reflect.apply`、同错误对象重抛、
恢复、8 事件/16 KiB 上限均未变。

## 3. 当前文件身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13,564 | `a99c926cc72d74f063037133f4606b4674842ed22423a97d1e2e0dfa41d85a5f` |
| `start.ps1` | 76,333 | `bf3d2c3faa449e14ecf003e289a60da92110bfe5976fc66ea07544bd2da9123d` |
| `stop.ps1` | 7,181 | `827a7ddf5cb00eb6ad05bce0c7ed9d4e202faae7059a2d90db0acaa5be2ed6b4` |
| `entry.py` | 88,655 | `e22222f16824ce3b726ecd1e0f7befa33f9a58c10cd4dc6947d1647cfa320682` |
| `projection-observer.mjs` | 20,058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `frame-classifier-finite.mjs` | 7,049 | `1f12e91154bb745a576469d99cbb1e53126887305e4c52a3ea33dc0cea046a5e` |
| `README.md` | 12,851 | `b5bebce139f74ddbfb5b2a992ad8023bf4feb597492770728973901814c830a3` |
| `binding-finite.mjs` | 2,104 | `6e2ce94e8f8618d572512acd820fc143f0148dcaefdcc6b541e676d40b92f2f5` |
| `safe-error-finite.mjs` | 14,498 | `fe91e2f8aa41036ec078243f3dbe59a8b22ae4f878a7c940ce49a054d6bce24d` |
| `literal-inputs.json` | 15,695 | `5b73018e62bebb07b4d7716657eace4aedeb64c3b59007a461f0a0e733495a71` |

`start.ps1` 已精确钉住：

```text
entry.py: 88655 / e22222f16824ce3b726ecd1e0f7befa33f9a58c10cd4dc6947d1647cfa320682
observer: 20058 / 2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac
```

`literal-inputs.json` 含 10 个当前 handoff 文件行；自身行记录最终字节数，
SHA 标为 `SELF_NOT_REFERENCED`，实际最终 SHA 见上表。历史 baseline、primary、
SDK、legacy18、current B346、binding source 均未改；新增内容只在本目录指针、
当前文件行、作者边界、批准错误来源和封闭 actual/admission 指针。

九个旧批准输入在复制后再次逐项哈希，全部保持原字节和 SHA-256。旧
`ProjectionBindingFix-20261030-065353` 目录及全部 runs/source/reports 未被改写。

## 4. 新有限助手

`safe-error-finite.mjs` 只从旧 `.before` 与当前 observer 抽取四个有限 Set 和
六个 sanitizer 函数，放入 `vm`；只 import：

- `node:assert/strict`
- `node:fs` 的 `readFileSync`
- `node:vm`

静态禁词检查命中 0：没有 process、网络、写文件、子进程、环境或凭据读取。
助手先把 VM 输出 JSON 归一为 helper realm，再严格断言：

- 四项已知来源在旧分类器为 `other`，新分类器为固定类别；
- `ValidationError` 名称安全；
- 既有固定类别正向保持；
- 相似前后缀、相似代码和未知错误保持 `other`；
- 三组来源的 6 种物理/file-URL 形式；
- 无 cause、普通 cause、循环 cause、抛错 getter；
- aggregate 3 项上限与深度 1 停止；
- 私有 sentinel 不出现，输出只含批准枚举、固定 label 和合法整数。

作者没有运行它，也没有制造生产错误、弱化断言或把源码可分类性等同于实际命中。

## 5. 验证与根侧剩余动作

作者已完成：9 个输入身份校验、复制、观察者行级差异、包裹/apply 字节块相等、
五个脚本行级差异、规则唯一性计数、旧目录不变、当前 10 文件身份、helper
import/禁词静态检查。以上均为只读 PowerShell 文件/文本操作。

必须由根在完整审计本目录、全部命令、setup/finally/cleanup、所有写面、
source/profile identity、B346 和字面 pins 后执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450\safe-error-finite.mjs'
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450\frame-classifier-finite.mjs'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450\prepare.ps1'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450\entry.py' --admit --root '<runRoot>'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450\start.ps1' -RunRoot '<runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProjectionKnownOrigin-20261030-071450\stop.ps1' -RunRoot '<runRoot>'
```

`binding-finite.mjs` 当前与旧版精确同字节，已有一次实际 2.703 s、退出 0、
2 个 OS 身份结束的证据，只能复用其 Cordis/原型事实。既有 frame finite 不能
覆盖新增三组 label；新增六形式由 safe-error finite 覆盖。

实际只允许一次新的原 T34 禁用投影路径观察。若仍为 `OTHER` 且没有具体 cause，
保留 `UNKNOWN`，不提出无界分类器或 GUI 重试。必须确认 owned OS 进程、端口、
窗口关闭；不得把局部 finite、绑定成功或 `settings/rejected` 捕获宣称为根因。

## 6. 作者边界、非零与阻碍

`author_runtime=0`：

- Node / Python：0
- AST/parser/import/check/test/type/build：0
- GUI / HTTP / 模型 / 进程探测：0
- Git 写：0
- 安装/打包：0
- 凭据、DPAPI、EnvKey、旧 evidence 改写：0
- 产品、SDK、Cordis 源码改动：0

首次 `git status --short --branch` 是只读检查，但在 `dsh` 子模块因
`D:\Lawbeach\lawbench\chdir ... Permission denied` 失败，exit 1。按令没有修
index.lock、锁、权限、沙箱或审批；这不是 Git 写，不是交付阻碍，也没有提交 SHA。

共记录 45 次 `exec_command`：36 次退出 0，9 次非零。非零如下：

- 03：`git status --short --branch`，子模块权限拒绝，exit 1。
- 11：在工单集搜索 T34，无匹配，exit 1。
- 16：哈希命令的 PowerShell 管道语法错误，exit 1。
- 20：shell 参数误填非法值；底层包名命令未运行，exit 255。
- 21：五个字符串的 `rg` 原生参数引用错误，exit 2。
- 22：entry 相关 `rg` 同类引用错误，exit 2。
- 26：start 常量 `Select-String`；shell 参数误填非法值，底层命令未运行，exit 255。
- 33：误填 `bash` 的只读脚本差异比较在启动前被拒绝，exit 1。
- 37：误填 `bash` 的只读 import/禁词检查在启动前被拒绝，exit 1。

第 20、26 项未执行目标命令；第 33、37 项 Bash 未执行。四次失败均未写文件，
此后所有实际执行的命令都显式使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`。
这两次 shell 参数误填和两次 Bash 启动拒绝是本运行的明确偏离，故如实记录，
不声称“全部 shell 始终原生”；没有借失败启动 setup、切换 legacy、改 ACL、
改审批或拆 writer lock。

## 7. 实际命令审计

以下 1–39 与 `README.md` 第 7 节同一编号；长复合命令的完整规则/路径均记录于
该节。40–45 为 README 定稿后的附加命令：

1. 读正式执行令；成功。
2. 读 approved-inputs；成功。
3. 只读 Git status；权限失败。
4. 列授权输入目录；成功。
5. 读旧 observer；成功。
6. 读封闭 actual JSON；成功。
7. 读 runtime admission JSON；成功。
8. 读 PROJECT-PROFILE；成功。
9. 读关键事实索引；成功。
10. 检查新目录不存在；成功。
11. 工单集 T34 搜索；无匹配。
12. 审旧 start/entry/stop/observer 常量；成功。
13. 读旧 frame finite；成功。
14. 读旧 README；成功。
15. 读三个批准底层源码窄片段；成功。
16. 三项哈希初检；语法错误。
17. 审 start 路径与 pins；成功。
18. 读旧 literal manifest；成功。
19. 修正三项哈希；成功。
20. 读包名；非法 shell 参数。
21. 检索五个新字符串；引用错误。
22. 检索 entry 运行/清理面；引用错误。
23. 原生 PowerShell 重读包名；成功。
24. `Select-String` 审 entry；成功。
25. 递归检索旧 T34 批准字符串；成功只读。
26. `Select-String` 审 start；非法 shell 参数。
27. 九个批准输入逐项字节/SHA；成功。
28. 新建本目录并复制九个输入；成功。
29. 查待替换旧证据根；成功。
30. 算最终 entry/observer identity；成功。
31. observer 行级差异；成功。
32. 包裹/apply 文本块相等；成功。
33. 五脚本差异；Bash 启动前拒绝。
34. 新规则/label 唯一性静态计数；成功。
35. 原生 PowerShell 重跑五脚本差异；成功。
36. 十目标文件初轮 identity；成功。
37. helper import/禁词；Bash 启动前拒绝。
38. 九旧输入复哈希；全部未变。
39. 原生 PowerShell 重跑 helper 静态检查；成功。
40. README 定稿字节/SHA：12,851 /
    `b5bebce139f74ddbfb5b2a992ad8023bf4feb597492770728973901814c830a3`。
41. literal 首次定稿尺寸/hash：15,691 /
    `f1531586f17c845150765d9719b725e1555fa2dec0b0428e27c4f5833351ad97`；
    随后只把自身行占位字节固定为最终 15,695。
42. 十目标文件最终 identity 回读；全部与上表一致。
43. 新旧 literal 行级差异；只出现本目录、当前身份、作者边界、批准来源及
    actual/admission 指针变化。
44. `Select-String` 定位 literal 的 handoff 自引用、作者边界、来源与 admission；
    成功。
45. 读 literal 第 255–344 行，人工确认 10 行、逗号和末尾结构；成功。

`NOT_RUN`：`safe-error-finite.mjs`、当前 `frame-classifier-finite.mjs`、
prepare、admission、start、stop、GUI 设置动作、observer capture、原生投影、
模型/网络、完整 T34 PASS 和打包。

**交回状态**：源码与正式文件已就绪，等待根侧完整审计、受影响有限检查、一次
必要实际观察及 OS 闭包。当前实际分类仍为 `UNKNOWN`，产品根因
`NOT_PROVEN`，整条 T34 `NOT_PASS`，打包 `HOLD`。
