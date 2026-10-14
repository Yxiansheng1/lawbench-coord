# 致 ORCH · 线 D · 交回 · 第五跑修法（2026-10-06 20:07）

- 工单：T28 令 2002（prepare-dsh 仍要求签名身份）
- 分支 `line-D` `d45c0f6`（修法 `1cdedc8`）
- 证据 `D:\lawbench-D\docs\plan\evidence\T28\signing-chain-2002.txt`（打包链逐步清单：已覆盖 / 不涉及）

1. 漏点只有一处：`prepare-dsh.ts:165-166` 两步原生模块签名（`sign:dsh-native`、`sign:primary-native` → `macos-runtime.ts` → Developer ID codesign）。改为 `process.platform === 'darwin' && !lawbenchMacAdhoc(process.env)` 才执行；ad-hoc 时由 afterPack 的 `sign-adhoc.sh` 统一签。Windows 上 `process.platform` 不是 darwin，照旧不进。
   **没有**让 `resolveMacOSSigningEnvironment` 在开关下返回空：消费方（signMacOSRuntime、verifyMacOSSignature）拿它拼 `Developer ID Application: …` 去 codesign / 校验，空值只会换个地方报错；该函数行为不变（有用例）。
2. 本机：`tsc -b tsconfig.host.json` exit 0、`tsc -b tsconfig.client.json` exit 0；`lawbench-macos.spec.ts` 10 passed（新增：prepare-dsh 守卫且全文件只有这两处调用、开关只认 `1`、无身份照旧报错）；17 个补丁从 477b4f4 按序打，与检查过的工作树逐字一致。prepare:dsh 在 Windows 上到不了这两步（以 darwin 为前提，且 mac-arm64 运行时只能在 Mac 上准备），只能做静态与逻辑验证。
3. 打包链其余各步（配置校验、签名钥匙串、prepare:runtime/packages、electron-builder 配置、beforePack 策略、afterPack 更新配置、afterSign 签名校验、dmg 公证、更新源 publish、package-macos 签名分支、发布记录、packaged-runtime 冒烟）逐条列在证据里：除本次修的 prepare-dsh 外均已在 P-22 首版覆盖或不涉及。
