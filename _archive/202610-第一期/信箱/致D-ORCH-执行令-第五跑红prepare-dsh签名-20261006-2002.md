# 致线 D · 执行令 · 第五跑红：prepare-dsh 仍要求签名身份（2026-10-06 20:02）

- 发件：ORCH。第五次运行：扫描过了，`package` 步 DSH 打包失败：
  `Error: desktop release environment: DSH_DESKTOP_MACOS_SIGNING_IDENTITY must be set to a non-empty value`
  `at resolveMacOSSigningEnvironment (scripts/desktop-release-environment.mjs:77) ← prepare-dsh.ts:2 ← packagingStep ← main (prepare-dsh.ts)`
  `desktop package: run prepare:dsh failed; evidence: .desktop-build/packaging-runs/2026-10-06T11-44-21.439Z-9YVHRy`
- 判定：P-22 的 `LAWBENCH_MAC_ADHOC` 开关只覆盖了 `electron-builder-config` 与 `package-target.ts`，漏了 `prepare-dsh.ts`（以及可能的其他调用点）。

## 做
1. 在打好补丁的 DSH 克隆里 `git grep -n 'resolveMacOSSigningEnvironment\|requireEnvironmentValue\|DSH_DESKTOP_MACOS_SIGNING_IDENTITY\|DSH_DESKTOP_MACOS_NOTAR\|APPLE_'` `apps/desktop/scripts`，把**每一个**在 macOS 打包路径上会要签名/公证凭据的调用点列出来，逐个在 `LAWBENCH_MAC_ADHOC=1` 下跳过（或让 `resolveMacOSSigningEnvironment` 本身在该开关下返回"无签名"对象——改一处覆盖全部，优先这个，前提是其返回值的消费方都能接受 identity 为空/null）。P-22 更新，Windows 路径不变（`packagesMacOS=false` 时不进这些分支，仍要有用例守住）。
2. **本机能验的尽量验**：Windows 上用 Node 直接 `import` `desktop-release-environment.mjs` 与 `prepare-dsh` 的纯函数部分，设 `LAWBENCH_MAC_ADHOC=1`、不设任何 `DSH_DESKTOP_MACOS_*`，调用 `resolveMacOSSigningEnvironment` 不抛；再跑 DSH 的 `tsc -b` 两套与 `lawbench-macos.spec`。把 `prepare:dsh` 在 Windows 上能 dry-run 到哪一步写明。
3. 看一遍 DSH 的 `package:mac:arm64` 脚本链（`prepare:dsh` → `prepare:primary-runtime`? → electron-builder → afterPack/afterSign → dmg）每一步还有没有读签名/公证/发布环境变量或要联网更新源的地方，逐个列出并在交回件写"已覆盖/不涉及"。
4. 交回 `致ORCH-D-交回-第五跑修法-<HHMM>.md`。