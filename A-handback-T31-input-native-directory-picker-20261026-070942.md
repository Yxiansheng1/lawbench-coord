# 原生文件夹入口已交回

输入区新增了律师可直接使用的原生文件夹选择。选中目录后继续走原有导入确认和下一问材料批次绑定；源码、定向测试与固定指纹已写入工作区，回归测试、类型检查、构建和真机选择尚未运行。

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新增可访问的文件夹按钮；原生目录走既有确认框；补齐等待期双击占用、取消恢复、案件/会话/工作目录/相位变化和组件卸载后的拒绝；更新定向测试与 UI 固定指纹。 |
| 目标是什么 | 律师能从输入区选择真实目录，把本次根和当前会话绑定到下一问材料批次，取消或改选后不误用旧批，任何导入都不自动发送。尚缺主编排复核、定向回归、类型检查、新源码私有构建和真机 GUI。 |
| 在等什么 | 等主编排完成累计复核并明确放行新源码私有构建。信号到达后，主编排运行受影响的界面测试与类型检查，再构建新源码、更新客户端与清单字面指纹，做全新真机目录选择；通过前不进入打包。 |
| 卡在哪 | 本执行者按令不得运行测试、类型检查、构建或 GUI，因此没有运行证据；整个工作树的 Git 状态读取被只读子模块元数据权限拒绝，已改用忽略子模块的外层只读核对。源码交回本身没有技术阻碍。 |

## 交付内容

1. `dsh-ext/ui/input-import.tsx` 保留原文件“＋”入口，新增独立的“文件夹”按钮。文件夹按钮调用现有 `getNav().pickDirectory()`，没有合成带假路径的 `File`。
2. 原生选择等待期间使用同步 ref 占用，两个按钮和隐藏文件输入同时禁用。取消、拒绝和完成后在 `finally` 中释放；同一 tick 双击只调用一次选择器。
3. 选择返回前后均核对当前会话、案件、工作目录和 `plain` 相位。返回时还检查输入组件是否已卸载；变化时显示安全提示并拒绝旧选择。
4. 已选目录通过 `IntakeHook` 的可选本机根进入现有 `startImport`，保留 `batchSessionId` 和 `{ path, kind: 'dir' }`。原有案件检查、原生提交观察点必需检查、粘贴、拖入和文件选择默认值保持不变。
5. `dsh-ext/tests/input-import.spec.tsx` 增加以下定向断言：选择器调用、取消、既有确认框、目录根与会话绑定、原生提交检查、同步双击占用、案件/会话/工作目录/相位变化、组件卸载和拒绝后恢复。
6. `dsh-ext/tests/intake.spec.ts` 增加已选目录不伪造 `File`、直接进入既有确认框，以及调用当下实时工作目录和案件变化后拒绝旧选择的断言。
7. `build-config.mjs` 只更新 `lawbench-ui-source` 的固定字节和摘要；`README.md` 记录新指纹来源、静态事实、未运行范围和打包保留。

## 依据与验证

- 真机现状来自 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31DirectoryPicker-20261026-070942\root-GUI-resource-finding.json`：实际“＋”打开 `type=file multiple`，导入请求为 0，记录说根已关闭自身运行。
- 开工前快照位于 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31DirectoryPicker-20261026-070942\before\`。
- 结构、禁止旁路词和 UI 树复算均为只读静态核对。`rg` 对 `new File`、`materialsImport`、`fetch`、`XMLHttpRequest`、`sendMessage`、`conversation.send` 和 `task(` 在本次两处生产源码中没有命中。
- UI 树复算使用固定算法：普通文件、相对路径按 UTF-8 字节序、每行 `path<TAB>bytes<TAB>sha256`、LF 连接并补末尾 LF，再取 UTF-8 SHA-256。以开工前快照替换两处 UI 文件后，旧树精确复现原固定摘要。
- 四条源码/测试差异的 `git diff --no-index --check` 均只因“确有差异”返回 1，空白诊断为空；构建配置与说明的同类检查也为空。
- 旧的加号入口测试和构建证据只用于确认开工基线；本次源码已变化，没有把旧测试结果写成新回归通过。

## 前后字节与摘要

| 文件 | 开工前字节 / SHA-256 | 交回时字节 / SHA-256 |
|---|---|---|
| `dsh-ext/ui/input-import.tsx` | `2,484` / `7AAFF0028EA547C66224B41AB5505223C6FF1868E6002A03E86900CEDBAE75D8` | `5,327` / `A0891E884B1F518BBBFDB3497B1A732879F028BE30F1EB79737B5D4167F06AF6` |
| `dsh-ext/ui/intake.ts` | `5,488` / `8B10417860E931E8A1D099AEAE24AE1D95EDE8B7882988D274CAB1DAD1AD5D2A` | `6,524` / `926F787CA7FC7F92EFB03A2EC0FAA0029ECFE5243AF4D1335371EF08BB3E689A` |
| `dsh-ext/tests/input-import.spec.tsx` | `5,876` / `1809D01786C30DCC76F280A479ACA3616D8A1C573324CC2E1B9FD884654A0617` | `14,583` / `25BE9A12A323B1AFD779093D75F2F6C3F877B5F929AD0D02636A26D551C28FBF` |
| `dsh-ext/tests/intake.spec.ts` | `7,020` / `8D55D76AD388DEC36C25C80333FE813780C77D165443DCFC439EE2E24E7F4B2F` | `9,303` / `0631891443B8D327678A3F7026BC6ADBC23CCD2750D7EFC691456D66122ACA63` |
| `PrivateRuntimeBuild-20261026-043910/build-config.mjs` | `20,075` / `DE35F2A805024AD79F0DDDAE7E1DBB7420630387F34A6AFCAB0391F3B2182394` | `20,075` / `BB633BF59B12583A964002EC67B719B231307699FAEF638EA68C404374A403A5` |
| `PrivateRuntimeBuild-20261026-043910/README.md` | `22,232` / `3E1EF76AE8FE6C4BEEFC43BF1303FFF9A9F950874D6E7C1F1C1B1C507589BC7B` | `24,513` / `25B9DB18BAC3114CA3CD628024379EFCC6CAFC5D2E3878BFA5995DB64E714137` |

| UI 树状态 | 文件数 | 字节 | SHA-256 |
|---|---:|---:|---|
| 开工前 | 92 | 627,510 | `59af2e62c9f661d2f8df127e3b0708499f6223874f9e8f5f1f7a85b09647027c` |
| 交回时 | 92 | 631,389 | `3fdbec412ea153fa68e98c07972733817b3c23ae39d4c5df0b038dca6a510add` |

## Git 只读状态

- 分支：`line-A`
- HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 没有暂存、提交、变基、stash、reset、clean、checkout 或 push；因此没有提交 SHA。
- 目标范围内只读状态为：`intake.ts` 和 `intake.spec.ts` 已修改；`input-import.tsx`、`input-import.spec.tsx`、`build-config.mjs`、`README.md` 未跟踪。它们都保留在工作区，没有加入索引。
- 开工时外层已有大量无关未提交改动。本次没有清理、回退或覆盖这些改动。
- 全树 `git status --short --branch` 在 `dsh` 子模块处返回 `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。没有改权限、ACL、锁或审批；外层使用 `--ignore-submodules=all` 完成只读核对。

## 实际执行的关键命令

所有成功执行的产品文件读取、哈希、差异和摘要命令均通过以下原生命令解释器执行，`login=false`：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

首个工具只读取正式执行令：

```powershell
Get-Content -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-input-native-directory-picker-order-20261026-070942.md' -Raw
```

Git 只读核对：

```powershell
git status --short --branch
git rev-parse HEAD
git branch --show-current
git -c core.quotepath=false status --short --branch --ignore-submodules=all
git -c core.quotepath=false status --short --ignore-submodules=all -- dsh-ext/ui/input-import.tsx dsh-ext/ui/intake.ts dsh-ext/tests/input-import.spec.tsx dsh-ext/tests/intake.spec.ts docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/build-config.mjs docs/plan/evidence/T31/PrivateRuntimeBuild-20261026-043910/README.md
```

文件摘要：

```powershell
$files=@('D:\Lawbeach\lawbench-A\dsh-ext\ui\input-import.tsx','D:\Lawbeach\lawbench-A\dsh-ext\ui\intake.ts','D:\Lawbeach\lawbench-A\dsh-ext\tests\input-import.spec.tsx','D:\Lawbeach\lawbench-A\dsh-ext\tests\intake.spec.ts','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs','D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\README.md'); $files | ForEach-Object { $item=Get-Item -LiteralPath $_; $hash=Get-FileHash -Algorithm SHA256 -LiteralPath $_; [PSCustomObject]@{Path=$item.FullName; Bytes=$item.Length; Hash=$hash.Hash} } | ConvertTo-Json -Depth 3
```

差异与空白检查采用 `before` 对当前文件的配对，逐对运行：

```powershell
git diff --no-index --check -- '<before-file>' '<current-file>'
```

禁止旁路词静态扫描：

```powershell
rg -n --no-heading "new File|materialsImport|fetch\(|XMLHttpRequest|sendMessage|conversation\.send|task\(" dsh-ext\ui\input-import.tsx dsh-ext\ui\intake.ts
```

UI 树摘要按固定算法在 PowerShell 中枚举普通文件、以 UTF-8 十六进制键排序、逐项取 SHA-256，再对 `path<TAB>bytes<TAB>sha256` 行加末尾 LF 后取 SHA-256。旧树通过只替换 `input-import.tsx` 和 `intake.ts` 为 `before` 快照后复算；两次读数见上表。

## 未做与降级

- 没有运行 parser、test、Vitest、tsc、pytest、collect、prepare、build、start、serve、probe、GUI、HTTP、模型、网络、selftest 或 install。
- 没有执行私有构建器，没有生成新私有产物；旧 `054741` 和 `070027` 未改，launcher 未改。
- 没有完成任何真机原生文件夹选择，没有声称目录确认、材料成员、下一问批次、取消/改选或“不自动发送”已经通过 GUI。
- 没有执行打包、安装、合并、推送或部署；Packaging 保持 HOLD。
- 没有改权限、ACL、沙箱、审批、锁、全局 API、Keyring、真实材料或产品契约。
- 没有联系其他会话或更换 API。
- 工具调度有偏差：五次只读命令误把 shell 配成 `bash`，均在执行前返回 `Bash/E_ACCESSDENIED`；一次只读扫描的 shell 字段误填为 `W:\`，返回通配符参数错误；一次差异检查的 PowerShell 管道有语法错误，未执行命令。以上均未写文件、未改状态，之后成功命令均使用指定原生 PowerShell。

## 主编排下一步

主编排先做累计源码与测试复核，再运行受影响的 `input-import.spec.tsx`、`intake.spec.ts` 和必要类型检查。通过后按既有准入流程构建新源码，更新客户端、清单和 launcher 的精确字面指纹，再用全新运行根做一次真实原生目录选择。GUI 必须覆盖空选取消、真实目录确认、真实 `material_ids` 批次、换案/换会话/相位变化拒绝、取消和改选、以及不自动发送；这些通过前不能勾整卡或打包。

删减轮:读者 4 / 槽位 1 / 半句 3 / 重复 4 / 过程 2 / 黑名单 2

Response ID: 系统未提供；本文件路径作为回执锚点。

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T31-input-native-directory-picker-20261026-070942.md`
