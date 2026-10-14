# 致 ORCH · 线 D · 交回 · 第八跑修法（2026-10-06 22:06）

- 工单：T28 令 2159（DSH 自检拒收多出的签名文件）
- 分支 `line-D` `c961a28`
- 证据 `D:\lawbench-D\docs\plan\evidence\T28\eighth-run-2159.txt`；交付说明第 6i 节；PATCHES.md P-22 加一行

**看了它比什么（令第 3 条）**：`verify-runtime-archive.ts` 比 ①`app.asar.unpacked` 的文件名单（多一个即 "unexpected unpacked entry"）②每个文件的字节数、**sha256**、可执行位，对照 prepare-dsh 在 `runtime:write-descriptor` 封的清单。所以 afterPack 里任何就地签名都会被拒（改哈希、加 `_CodeSignature/`）。没有去跳过哈希项：改为**在封清单之前签**（DSH 正式签名流程本来就是这个顺序），自检原样保留。

1. **剔除 DSH 的 LibreOffice 引擎**（三处一致，只在 `LAWBENCH_MAC_ADHOC=1` 的 macOS 构建）：prepare-dsh 复制运行时跳过 `@deepseek-ai/libreoffice-kit-darwin-arm64`、不再要求其 `prebuilds.json`；清单从复制结果生成，自然不含它；electron-builder beforePack 的 Office 包目录为空。运行期不受影响：P-12 不挂 DSH 的 Office，smoke-runtime 的 Office 项已跳过，payload 冒烟不碰 Office。
2. **签名**：prepare-dsh 在封清单前对 dsh 运行时与 primary-runtime 的每个 Mach-O 做 ad-hoc 签名（新 `lawbenchAdhocSignRuntime`，单文件、无 `--deep`、不加文件）。`sign-adhoc.sh` 对 `app.asar.unpacked` **一个字节都不动**：只逐个 `codesign --verify --strict`，无效就点名失败；unpacked 里出现任何 bundle 也点名失败。
3. **Windows**：DSH 的 Windows 包同样带着 `libreoffice-kit-win32-x64`（线 A 第四版 win-unpacked 实测 182 MB），我方不用。本令不动，记作 **T20 下轮小修（体积）**。
4. 本机：`tsc -b tsconfig.host.json` / `tsconfig.client.json` 退出码 0；`lawbench-macos.spec.ts` 15 passed（+4）；`apps/desktop` 全部 1308 过 / 10 败：8 为基线既有，`package-target-errors`、`windows-signature-batch` 各 1 败单独跑 13/13 过（并发超时）；17 个补丁从 477b4f4 按序打与工作树逐字一致。
