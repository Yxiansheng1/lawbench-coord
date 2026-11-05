# HANDBACK · Windows package P-1 · 20261102-021251

## 结论

`PREPARED_NOT_RUN`。没有产出候选安装包，也不宣称 P-1 通过。当前主机缺少离线 Python wheelhouse、PyInstaller 闭包、PSF 签名 Python nupkg、Electron/NSIS 缓存、LibreOffice、Pandoc 和 Office 原生引擎；现有 `packaging\build.ps1` 还会写 A 本地 `build-tools\dsh`，并默认打入 A 的 service/contracts/skills，不能原样用于本次 A UI + B service 绑定。因此没有准备一个会误导为可执行的打包 runner。

已建立全新私有 [stage](D:/Lawbeach/lawbench-A/docs/plan/evidence/T20/WindowsPackageP1-20261102-021251/stage) 与 [out](D:/Lawbeach/lawbench-A/docs/plan/evidence/T20/WindowsPackageP1-20261102-021251/out)，两者为空。没有运行 build、preparer、preflight、测试、安装包、Node/Python/应用、HTTP/模型/GUI、生产/395 或 Key 操作；没有 Git 命令或 Git 写入。

## 产物与写入

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `docs\plan\evidence\T20\WindowsPackageP1-20261102-021251\package-readiness.json` | 12135 | `a7c9ff3160960523fc5176940526c50998b7827e9f8cba51eae35d551fdf7307` |
| `docs\plan\evidence\T20\WindowsPackageP1-20261102-021251\source-bindings.json` | 2288 | `a4f3dc90798110bcba0a87fe163131cfcde3f02685e55e9c1fa7a0b39acf9098` |
| `docs\plan\evidence\T20\WindowsPackageP1-20261102-021251\preflight.ps1` | 2390 | `fe706e640c9dab95f77fe3bdb79dd1e08fd37dec747ff7c7df9d025f1d1427ce` |
| `docs\plan\evidence\T20\WindowsPackageP1-20261102-021251\README.md` | 815 | `d582d0334559e58b04df9145edbbf35396ea9c2533bd6104d9c63a18e98a5ec9` |

目录本身：`...\WindowsPackageP1-20261102-021251`、`...\stage`、`...\out`。除这些证据文件和本交回件外没有写入。

## 源码绑定

冻结的 T18 三源 pin 保持原值：

| 角色 | 字节 | SHA-256 |
|---|---:|---|
| A UI `dsh-ext\ui\index.tsx` | 30047 | `165bdbb32254a7be826d929cbd4861761cd82a82f2868c3eb5acd5994606edf0` |
| A agent `dsh-ext\agent\index.ts` | 62098 | `6d8d77041ee8e7655a32afa2b5135ce5104788505db624fea476831ecace9cd1` |
| A host `dsh-ext\host\index.ts` | 63665 | `cb3679ae85ea6b4f56406b5cbb1e01c1fe0e4739bb22d0ccf05cd4c7ac8fbf83` |

当前 B 绑定：service `0.1.0`，`pyproject.toml` SHA-256 `60e93d8f960b914a067236e0e57fa161cb495aae5aaaaeefff4a1c11d3836665`；contracts `1.7`，`VERSION` SHA-256 `2894c5729307b0246d73c17758d6394fe47087f69a25a0f8351810387663dac5`；approved skill capsules SHA-256 `c0554a73bef9af1effbb9c3217f34eebb52a8c20e2edddc69f48c353bfd1665e`；tokenizer 19,989,343 B，SHA-256 `87a7830d63fcf43bf241c3c5242e96e62dd3fdc29224ca26fed8ea333db72de4`，与 `versions.lock` 一致。

## 既有资源

- 主运行时 Node 24.21.0 归档存在，37,618,919 B，文件名 pin `158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541`。
- python-build-standalone 3.12.14 archive 存在，21,980,728 B，文件名 pin `7c45c9622400d578709a9b2cddbe8124cc21d382409d9f13406d706d28e31b14`；它是备用无签名解释器，不替代 PSF 签名的 3.12.10。
- Electron npm 模块 44.0.0、electron-builder npm 模块 26.15.3 存在；`packaging\runtime-lock\pnpm-lock.yaml` 存在，903,339 B。
- Office worker、`package.json`、`package-lock.json` 存在，两个 Office 包均 pin 在 0.2.2；原生 `dsoffice.exe` 缺失。

## 准确缺口

阻塞项和原始 pin 已写入 `package-readiness.json`，包括 Electron 44.0.0 官方 SHA-256 `e61aa3bcea8152bc0730abd015e47c032d778a0ef10e2a1c78ba3c4ea47942f9`、PSF Python 3.12.10 SHA-256 `0eb85c2dfccccf1b17352de4c397f69194035b7d37149eacc16f1147d93de3b8`、PyInstaller 6.22.3 七轮子闭包、NSIS/7za/rcedit/elevate/icons/winCodeSign 原 pin，以及 LibreOffice 26.8.0.3、Pandoc 3.11 原 exe pin。

已安装应用只做了令许可的四文件元数据读取，未执行、未枚举、未复制：

| 文件 | 字节 | 版本 | SHA-256 |
|---|---:|---|---|
| `python\python.exe` | 104952 | 3.12.10 | `4d6f5f81a4bca11191c4c7c6b43632694d0a4ce74e068619d8fdc161d469859a` |
| `tools\convert\convert.exe` | 5527248 | - | `681de1ee000ab90bdd0986b0d5b0284378d9c3e37a22728044e30fcbcc9f034d` |
| `tools\splitter\splitter.exe` | 5504074 | - | `b7c665b0b92b9a8d915b11ce33bfe12f80d8e8bb6db8325b30652e891ffa3c4a` |
| `resources\app.asar` | 127384598 | - | `e1def883558e62669963120557506804dd5fd20ce2b0d04f4d3715e6c0f54ed8` |

这些文件不作为新包的权威来源。

## 下一条安全命令

当前状态可直接复核：

```powershell
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T20\WindowsPackageP1-20261102-021251\preflight.ps1' -ExpectedStatus PREPARED_NOT_RUN
```

该命令只核 JSON、源码 pin、私有目录和状态；不构建、不测试。它本次没有运行，只做了 PowerShell 语法解析。

进入下一条 P-1 尝试前，Root 需先把 `package-readiness.json` 的阻塞项按原 pin 恢复到本机，并由有权限的下一步明确处理“私有一致快照 + B service/contracts/skills 覆盖 + A UI/agent/host 编译”的 runner；不能直接以默认 `build.ps1` 代替。

## 命令与退出

所有正式命令使用绝对 native pwsh、`login=false`、managed 沙箱。`C08`、`C18`-`C20`、`C22`、`C32` 是 PowerShell 脚本拼写错误，解析阶段失败；`C21` 是本执行者误填 `shell=bash`，工具在执行命令前以 `E_ACCESSDENIED` 拒绝。该次没有实际跑 bash、没有执行命令。其余均退出 0。

| 编号 | 命令/动作摘要 | 退出 |
|---|---|---|
| C01 | `Get-Content -Raw` 读正式执行令 | 0 |
| C02 | `Get-Content -Raw` 读 companion JSON | 0 |
| C03 | 读 owner follow-on | 0 |
| C04 | 读 `packaging\build.ps1` | 0 |
| C05 | 读 `packaging\versions.lock` | 0 |
| C06 | 读 `dsh\apps\desktop\scripts\package-target.ts` | 0 |
| C07 | 读 `dsh-ext\scripts\build.mjs` | 0 |
| C08 | 首次精确路径存在性表；foreach 管道语法错误 | 1 |
| C09 | 修正后精确路径存在性表（25 条） | 0 |
| C10 | 读 B `service\pyproject.toml` | 0 |
| C11 | 读 A `product.ts` 与 B `contracts\VERSION` | 0 |
| C12 | 读 Office `package.json`、`package-lock.json` | 0 |
| C13 | 读 DSH `primary-runtime\lock.json` | 0 |
| C14 | 读 B `skills\_scripts\install.py` | 0 |
| C15 | 精确检查并读 T18/T20 交付说明候选路径 | 0 |
| C16 | 在 T18 交付说明内定向 `Select-String` pin/冻结词 | 0 |
| C17 | 读 T20 `payload-fetch.txt` | 0 |
| C18 | Electron/electron-builder 版本；foreach 管道语法错误 | 1 |
| C19 | archive/cache 存在性；foreach 管道语法错误 | 1 |
| C20 | 源码/契约 SHA；foreach 管道语法错误 | 1 |
| C21 | 尝试读取已安装应用四文件元数据；误填 `shell=bash`，执行前拒绝 | 1 |
| C22 | Office/安装器/引擎路径；foreach 管道语法错误 | 1 |
| C23 | 修正后读 Electron 44.0.0、electron-builder 26.15.3 | 0 |
| C24 | 修正后 archive/cache/lock 存在性 | 0 |
| C25 | 修正后源码/契约/tokenizer SHA 全量输出 | 0 |
| C26 | 修正后已安装应用四文件长度/版本/SHA | 0 |
| C27 | 修正后 Office worker/engine、installer、engines 路径 | 0 |
| C28 | archive/cache/runtime-lock 精确状态，确认 Electron/NSIS cache 缺失 | 0 |
| C29 | 源码绑定完整 SHA JSON | 0 |
| C30 | wheelhouse、PyInstaller、Python nupkg、Office node_modules 精确状态 | 0 |
| C31 | 系统 LibreOffice/Pandoc 原始路径及邻接许可证检查 | 0 |
| C32 | 两主运行时 archive SHA；foreach 管道语法错误 | 1 |
| C33 | Electron official `checksums.json` 取 44.0.0 win-x64 SHA | 0 |
| C34 | 建立私有 evidence/stage/out，未写源码 | 0 |
| C35 | 严格解析两份 JSON、PowerShell AST 语法检查、列产物 SHA、确认 stage/out 子项为 0 | 0 |
| C36 | 正式交回件目标路径存在性检查 | 0 |

APP/测试/模型运行次数：**0**。
