# A handback — T31 control echo native fixture module import — 2026-10-27 01:26:54

## 结论

已完成有界静态修正，状态为 `STATIC_FIX_DONE_RUNTIME_NOT_RUN`。

本次只修改既有 native fixture 的 `loadControlCodecs` 帮助函数，并新增既有 README 的
修正说明与本交回件。native selector 未改，产品源码、生成物、断言、旧 consumer、
config、文档和运行时均未改。作者未运行 Node、Vitest、tsc、测试收集、解析器、AST、
import、HTTP、网络、模型、GUI、安装、构建或 Git 写操作。

修正目标是移除 root 已确认失败的“带自定义查询串的 `file://` 模块导入”。实际是否
转绿须由 root 使用同一 native config 重新运行恰好两个测试确认；本交回不把静态修正
写成运行通过，也不作 GUI 结论。

## 唯一代码改动

文件：

`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts`

修正前到修正后的帮助函数精确差异：

```diff
@@
-async function loadControlCodecs(label: string): Promise<ControlCodecs> {
-  const hostUrl = `${pathToFileURL(HOST_PATH).href}?${label}-control-host`
-  const remoteUrl = `${pathToFileURL(REMOTE_PATH).href}?${label}-control-remote`
-  const hostModule = await import(hostUrl) as {
+async function loadControlCodecs(_label: string): Promise<ControlCodecs> {
+  const hostModule = await import(pathToFileURL(HOST_PATH).href) as {
     readonly TYPERT: { readonly invocations: CompiledInvocation[] }
   }
-  const remoteModule = await import(remoteUrl) as {
+  const remoteModule = await import(pathToFileURL(REMOTE_PATH).href) as {
     readonly TYPERT_REMOTE: { readonly descriptors: CompiledInvocation[] }
   }
```

`label` 形参和两个调用点保留原调用形状，形参改名 `_label` 以标明不再参与模块身份。
两个调用仍分别执行实际 `codec.create()`；没有 eval、源码重写、转译、子运行器、
新 loader、框架、mock codec 或新 config/plugin/alias。

## 静态证据

当前 native fixture：

| 项 | 值 |
|---|---|
| 字节 | 19,648 |
| SHA-256 | `25c4b3450bd8c20a4583c4cc9e6cddbbf1dfb2e5aa6c1adcbb20301ef9c7b140` |
| 自定义 control-host/control-remote 查询串 | 0 次 |
| 固定 `HOST_PATH` import | 1 次 |
| 固定 `REMOTE_PATH` import | 1 次 |

全字节反演：把当前帮助块逐字恢复为修正前九行后，文件恢复：

| 项 | 值 |
|---|---|
| 字节 | 19,759 |
| SHA-256 | `889e8dcb727afa9c636aa478055e8eea78a18bfa123f86cb60289f3ac8a0616e` |
| 与修正前 fixture 全字节相等 | 是 |

因此帮助函数外字节没有变化。固定 `HOST_PATH`、`REMOTE_PATH`、`MANIFEST_PATH`，三组
大小与 SHA-256 字面量，以及全部 assertion/helper/Host/frame/R/seq/rAF/finally/body
均保持原字节。

当前项目实际使用 Vite 8.0.16。静态主 resolver 代码显示：

- `module-runner.js` 的 `ModuleRunner.import` 接收文件路径、server path 或 root 相对 id。
- `fetchModule` 将 `file://` 输入送入 `_ensureEntryFromUrl`。
- 该路径只移除 import/timestamp 查询，不会移除本次 fixture 自定义的
  `?<label>-control-host|remote` 查询；root 的失败正是该查询型模块身份未解析。

所以本次采用现有 native resolver 支持的无查询 `pathToFileURL(...).href` 文件模块身份。

## 未变冻结件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| native selector `dsh-ext/vitest.t31-control-echo-native.config.mjs` | 1,607 | `ab29a362524b3cc78e7ff1ad5afcf29d95e192d63b48eda94c958021701eb006` |
| old extension consumer `dsh-ext/finite-tests/t31-control-projection-echo.spec.ts` | 19,982 | `35821cc2ee8356c326384efbb4176454d14d760797a966535d17b33edae54474` |
| `manifest.json` | 58,186 | `1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae` |
| `typert.host.js` | 158,754 | `a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12` |
| `typert.remote-client.js` | 59,116 | `e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630` |

README 修正说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153\README.md`

当前 11,885 字节，SHA-256
`706d72f5010f0ab10f805b8c2bde9811ac0d0819d61a6bb60b887189c617aff4`，只新增第 7 节。

## 根运行事实

保留并只引用执行令给出的实际 root 事实：

- 运行：`T31ControlEchoNative-root-20261027-012521`
- 自然 Node 退出码：1；耗时：5.575 秒
- 发现：2 个；失败：2 个
- 两例均停在 `loadControlCodecs` 的模块加载，早于语义断言
- 错误：找不到带 `?restricted-control-result-control-host` /
  ordinary 对应查询串的 `typert.host.js` 文件 URL
- 实际文件存在，固定大小/SHA 正确；生产源码无缺失

没有重跑该输入，没有弱化语义断言，也没有根据该结果声称产品红绿。

## Git 与 dirty 保全

按要求全部 Git 操作只读：

`git status --short --untracked-files=all`

因共享 worktree 的 `dsh` 子模块元数据权限拒绝而退出 1；未修锁、扩权或改 ACL。随后
只读使用：

`git --no-optional-locks status --short --untracked-files=all --ignore-submodules=all`

成功退出 0，显示工作树有 1,429 项 dirty/untracked；本批未清理或暂存任何其他改动。没有
执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。
交回按协调目录文件完成，不以 Git 提交代替。

## 实际命令与阻碍

除下表中明确标记的误配 Shell 外，所有命令均用指定的绝对原生：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

`login=false`，工作目录 `D:\Lawbeach\lawbench-A`。第一次工具只读正式执行令。

主要成功读取与静态检查：

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-control-echo-module-import-order-20261027-012654.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\A-handback-T31-control-echo-native-fixture-20261027-011550.md'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\ControlProjectionEcho-20261027-005153\native-fixture-20261027-011550.md'
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\fixtures\t31-control-projection-echo.finite.ts' -TotalCount 190
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-control-echo-native.config.mjs'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-material-admission.config.mjs'
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\vitest.config.ts'
Get-FileHash -Algorithm SHA256 -LiteralPath ...
Select-String -LiteralPath ... -Pattern ... -SimpleMatch
```

Vite 8.0.16 的实际解析源码只读定位：

```powershell
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\vitest'
Get-Item -LiteralPath 'D:\Lawbeach\lawbench-A\dsh\node_modules\.pnpm\vitest@4.1.8_@opentelemetry_c353b8f649d25fdfb1de02f01ebaca2b\node_modules\vite'
Select-String -LiteralPath '...\vite\dist\node\module-runner.js' -SimpleMatch -Pattern @('async import(','resolveUrl','dynamicRequest','cleanUrl(','posixResolve')
Select-String -LiteralPath '...\vite\dist\node\chunks\node.js' -SimpleMatch -Pattern @('async function fetchModule','ensureEntryFromUrl(','removeImportQuery','function isExternalUrl')
```

修正与验证：

```powershell
apply_patch  # 只改 loadControlCodecs 帮助函数
apply_patch  # 只补 README 第 7 节
# 失败与校准过的内存反演脚本不计为运行证据，见下表
Get-FileHash -Algorithm SHA256 -LiteralPath ...
git --no-optional-locks status --short --untracked-files=all --ignore-submodules=all
```

非零与实际阻碍：

| 编号 | 实际命令/配置 | 结果 |
|---|---|---|
| N1 | `git status --short --untracked-files=all` | 1；共享 worktree 的 `dsh` 子模块权限拒绝；未修锁/权限 |
| N2 | `Get-Item dsh\node_modules\vite` 与随附 `Get-Content vite\package.json` | 1；该顶层 junction 路径不存在；改用 Vitest owner 下实际 junction |
| N3 | `Select-String` 两份 Vitest config，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N4 | `Get-Content dsh\vitest.shared.ts`，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N5 | `Get-ChildItem dsh\node_modules\.pnpm -Filter vite@*`，误配 `shell=bash` | 1；MXC 报 packaged `bash.exe` 不能启动 |
| N6 | `Get-ChildItem vite\dist\node`，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N7 | `Select-String vite\dist\node\index.js`，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N8 | 读取 `chunks\node.js` 的 `_ensureEntryFromUrl` 区间，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝；随后仅用 pwsh 成功读取同一区间 |
| N9 | `Select-String` 查询 `isExternalUrl`，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N10 | 读取 `chunks\node.js` 的 `fetchModule` 区间，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N11 | 最终只读核验 README/交回件标题，误配 `shell=bash` | 1；`Bash/E_ACCESS_DENIED`，读取前拒绝 |
| N12 | `Select-String` 为 `-SimpleMatch` 数组却保留 regex 分隔符 | 1；PowerShell 报无效正则；改用 `-SimpleMatch -Pattern @(...)` |
| N13 | 第一次反演脚本用 `\n` 拼接 | 旧哈希不命中；修正为实际 LF 后继续 |
| N14 | 第二次边界 `$lines[148..155]` | 含空行导致反演短 1 字节；修正为 `148..154` 后恢复旧哈希 |

上述误配 `bash` 均在读取或写入前被拒绝，没有用其他 shell 规避，也没有改沙箱、审批、
ACL、锁、index 或运行配置。N13/N14 只影响内存检查，未写回源文件。

## 交回边界

- 未修改 `vitest.t31-control-echo-native.config.mjs`；哈希仍为 `ab29...006`。
- 未修改产品、Host、frame、Session、R/seq/rAF、finally/body、旧 consumer、
  P29、runtime、旧 evidence 或工单集。
- 未安装依赖，未读取 dotenv/credentials，未联系其他聊天，未更换 API。
- Packaging 继续 HOLD。

下一步只允许 root 以现有 native config 重新执行同一恰好两个测试，并据实际输出区分：
导入灰已消除但出现语义失败，或两个语义测试通过；不得据此声称 GUI 通过。
