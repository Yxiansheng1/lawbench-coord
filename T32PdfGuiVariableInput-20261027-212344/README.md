# T32 PDF 引用 GUI 启动器

状态：`NOT_RUN`。本目录交付三份启动器和这份说明。作者没有运行 prepare、start、stop、GUI、HTTP、模型、Office、安装或打包，也没有把静态检查写成运行通过。GUI 与整条 PDF 引用流程仍待主编排后续核验。

## 交付范围

启动器复用同一套已审查启动器，只把文本文档引用适配为 PDF 引用。预期只读动作是打开 native 草稿、打开第 2 页 PDF 引用、查看页面图和文字，然后关闭临时页签。不发送、不键入、不保存、不删除、不选文件、不改设置、不调用模型，也不需要人工输入。

冻结输入如下。

| 输入 | 字节 | SHA-256 |
| --- | ---: | --- |
| 旧 `prepare.ps1` | 17850 | `c631549f877f4856e8cbd36348a08386db45e538d6e2bb7557bcae77fb0b8d4e` |
| 旧 `start.ps1` | 77186 | `3dbff8acb475a86e61bb8f7381e9e178c9c15ed9d85f4aec6df7250b0915f395` |
| 旧 `stop.ps1` | 7154 | `33cc1ea557e75c24733f8dada20f72ade0fa76d5e7d93aad00eeb7dc348d983d` |
| PDF native 入口 | 78926 | `165565761356c1100baf7b101b4a39ff1dbcf668d89321e3b1874bae9246da9f` |
| reviewed source pins | 53547 | `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf` |
| 冻结 safety base | 151304 | `a5bebfc7d476ec508bfef90f143796bce648c95a1a7d184e066b3c5843bd47d5` |
| synthetic JPEG | 47379 | `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad` |
| synthetic PDF | 57132 | `761224e4fd57ae5dee275ee50e31425304a31c44190c872592695d3342c3f191` |

PDF native 入口位于 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativePdfCitationEntry-20261027-204736\server.py`。runs 根目录是该入口下的 `runs`。

当前 runtime 固定为 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261027-194112`。`manifest.json` 是 58195 字节，SHA-256 为 `5260367f4b54d1d7a384dd427dd743e20094fd7138b2780a6074e858a5d96a0f`。24 项输出身份和 runtime 文件清单保持旧值，没有重建 runtime。

本次交付的脚本身份如下。

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 21824 | `642145c15714d41806eac14baec071d457bd5886ca7dc5e2698e7bf6d5008132` |
| `start.ps1` | 81176 | `ac076517e6f9cedb22710875e9bcedcb8fd57d577fe46d5749e0905a400fd862` |
| `stop.ps1` | 7157 | `b87887fe29dc191cbe9237e3111f1ce9d48ab26ac330edc1e06c5804699a9eec` |

## 已制备形状

- format 固定为 `T32-native-pdf-citation-entry-prepared-v1`，expected head 为 `dc56a93be4b07dbe7a48863e3135351659817fb5`。
- ready 目录只允许 `转账截图.jpg` 和 `起诉意见书.pdf` 两个普通文件。
- JPEG 的 source 与 copy 验证 `bytes`、`sha256`、`path` 和 `canonical`。
- PDF source、PDF copy 和 `citation_source` 验证实际文件的 `bytes`、`sha256`、`mtime_ns`、`path` 和 `canonical`。PDF copy 与 `citation_source` 的五项身份必须一致。
- `input_ready` 固定为 JPEG 加 PDF 两个名称、`jpeg_control_imported: false`、`pdf_reference_import_only: true`。
- `citation` 固定为 `〔起诉意见书 第2页〕`、`material_name: 起诉意见书`、`unit: page`、`from: 2`。
- `read` 固定为 `start: 2`、`max_chars: 500`。
- 当前 prepared 样例没有独立的 pages 或 fragments 属性。五页和 PDF 第 2 页文字片段由已审查 native 入口在启动后的 bootstrap 中验证，启动器不解析 PDF。
- `source` 保持 347 项 reviewed pins 加 `entry/server.py`，safety base、source pins、settings、daily marker、8 项 canonical path、空 case、空 private Desktop、runtime artifact 缺席和根目录四项 inventory 的既有检查均保留。

## 运行命令

以下命令须在主编排完成累积审计、确认 fresh root 和输入身份后执行。

```powershell
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310\prepare.ps1'
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310\start.ps1' -RunRoot '<prepare 返回的 runRoot>' -LifetimeSeconds 600
& 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\NativePdfCitationGui-20261027-211310\stop.ps1' -RunRoot '<同一 runRoot>'
```

prepare 应返回 `readyInputFiles: 2`、PDF 的字节和哈希、`runtimeArtifactsAbsent: true` 以及空 private Desktop。start 应返回 `ok: true`、state 和 handoff 路径、native PID 与 port、600 秒 deadline。stop 只接受新 runs 根目录下名称精确匹配 `T32-pdf-citation-YYYYMMDD-HHMMSS` 的根目录。

## 修改范围

`prepare.ps1` 只改固定入口、runs 根目录、prefix、format、PDF 文件名/大小/哈希/源路径，以及原有输入验证段和输出中的 PDF 身份字段。private Desktop 准备尾段没有改。

`start.ps1` 只改同一组固定常量、精确 run-root 正则和 `Assert-PreparedInputs` 中的 PDF 清单验证。relay 脱敏、24 项 staging/output 身份、T50 memory-only 与 credentials disabled、remote hooks、固定 auth、一次性 source claim、phase、600 秒 deadline、absolute DLL resolver、PDF browser origin 与五个资产、proxy、managed deps、PID/exe/UTC birth 记录和 stop cleanup 均保持旧字节。

`stop.ps1` 只改新 runs 根目录和 `T32-pdf-citation` 精确名称校验，没有新增宽泛回退。

逆回办法是从 `D:\Lawbeach\lawbench-coord\T32PdfCitationGuiInput-20261027-211310` 重新复制三份冻结脚本。正向复现与此相同，复制后再只应用上述固定常量和 PDF 验证段，不执行生成器、PDF 解析器、测试或构建。

## 静态检查与阻碍

作者使用的命令类别如下，路径均取本说明列出的绝对路径，重复调用同一类别时不逐条展开。

```powershell
Get-Content -LiteralPath '<absolute-path>' -Raw -Encoding UTF8
Get-ChildItem -LiteralPath '<absolute-directory>' -Force
Get-FileHash -LiteralPath '<absolute-file>' -Algorithm SHA256
Select-String -LiteralPath '<absolute-file>' -Pattern '<literal>'
Get-Content -LiteralPath '<prepared.json>' -Raw -Encoding UTF8 | ConvertFrom-Json
git status --short --branch
git status --short --branch --ignore-submodules=all
git diff --no-index --unified=4 -- '<base.ps1>' '<new.ps1>'
Copy-Item -LiteralPath '<frozen.ps1>' -Destination '<new-folder>\<frozen.ps1>'
```

写文件只用了 `apply_patch`；`Copy-Item` 只用于把三份冻结脚本原字节复制到新目录。

非零记录如实保留：

- 原始 `git status --short --branch` 因共享子模块 `dsh` 的 worktree 权限拒绝而失败；随后以 `--ignore-submodules=all` 只读取得根树 dirty 清单。没有修锁、改权限、扩权或写 Git。
- 三份 `git diff --no-index` 因存在预期差异返回退出码 1，差异只落在本说明允许的固定常量、PDF 验证段和 run-root prefix。
- 两次只读检索误把 shell 目标填成 `bash`，运行器均返回 `Bash/E_ACCESS_DENIED`；没有启动 Bash，也没有执行 Bash 中的命令，随后改用正式执行令指定的原生 PowerShell 重做。
- 一次只读存在性检查的呈现命令出现 PowerShell `ParserError`；改用直接输出后完成核对，没有运行交付脚本。

没有执行 Python、Node、import、源码 parser/AST/compile、测试、Vitest、tsc、pytest、collect、build、prepare、serve、probe、HTTP、trace、模型、Office、安装或 selftest。没有发送、键入、保存、删除、选文件或改设置。没有改 API、Key、凭据、权限、沙箱、审批、ACL 或锁。Git 没有 `add`、commit、rebase、stash、reset、clean、checkout、merge 或 push。

本说明只记录源码交付和既有输入事实，不声称 GUI、整条 PDF 引用流程、网络、模型质量或打包通过。打包状态为 `HOLD`。

删减轮：读者 4 / 槽位 2 / 半句 3 / 重复 2 / 过程 1 / 黑名单 1。
