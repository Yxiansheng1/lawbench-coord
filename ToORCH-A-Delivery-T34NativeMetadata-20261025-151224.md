# A 线交回：T34 私有原生元数据归属纠正（prepared-only）

结论：已在唯一写白名单内完成有界修正。Host/Agent 的 file URL 现指向独立的
`private-native\lib`，UI 仍指向原 `privateplugin\lib\index.js`。本次没有运行
prepare/start/stop、GUI、服务、模型、build、parser、Vitest、tsc、pytest 或任何
自测或请求。Packaging 保持 HOLD。

## 两个目标文件的累计 before/current

开工前快照：
`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-native-metadata-before-20261025-151224`

| 目标 | before SHA-256 | current SHA-256 |
| --- | --- | --- |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\start.ps1` | `446586e991d0f0441fd57093e8fc39e7466736051914399ce2a22f2c6e0ffb88` | `080abc3f93dbe7032fcad378315ee5b5c271d7cd4dec2761729ff24ebf295445` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRuntimeGui-20261025-145707\README.md` | `4cd495a28560657668c48ef16149b4ce265b825f266c4fbd922beeb06483cfc5` | `c1c8b4ecaa97ff427f2ad0af2255084a0aa23213d77f17e51c53e8ee640635b0` |

相对开工前快照，本次只改上述两个目标文件。既有工作树 dirty 未新增改动，未执行
任何 Git 写入；`docs/plan/evidence/T34/CoreRuntimeGui-20261025-145707/` 在当前
Git 状态中仍是未跟踪证据目录。

## start.ps1 的唯一实现变化

- 仅新增三个路径常量：
  `$PrivateNative`、`$PrivateNativeLib`、`$PrivateNativePackage`。
- `Prepare-PrivateProfile` 在 fresh GUI 创建集合中加入
  `private-native` 及其 `lib`，并复用 `Assert-NoReparsePath` 守卫。
- 写入的 package 元数据只含固定字面数据：
  `{"name":"lawbench-t34-native-private","type":"module","private":true}`。
  不含 `dsh`、`client`、`exports` 或 `scripts`。
- 从既有固定源码字节复制 `host.js` 与 `agent.js` 到新 `lib`，每件继续使用现有
  的 literal SHA-256 断言。
- 仅 Host/Agent 两个 file URL 改指 `private-native\lib`；UI 仍使用
  `privateplugin\lib\index.js`。
- 未增加 shim、loader、HTTP/API；未改 DSH/clientModules 源码，未关闭 duplicate
  校验。

函数级只读核对结果：文件前后均有 14 个顶层函数，除
`Prepare-PrivateProfile` 外，其余 13 个函数正文逐字节不变。差异中未出现
`AssetPins`、`CoreBuildLibPaths`、`WikiPluginLibPins`、冻结分派、旧 runtime
assert、旧 prefix、旧 `legal-ui` suffix、七字段 Host config 或完整 preset
对象的变化；`validateContracts: true` 保持。

## 固定元数据与两个原生库 pin

`privateplugin` 的既有 package 元数据和六库复制逻辑均保留。新原生目录逐件复用的
固定 pin 为：

| 文件 | literal SHA-256 |
| --- | --- |
| `agent.js` | `b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b` |
| `host.js` | `a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994` |

只读哈希核对中，上述两项在仓库源码和
`T34-core-build-root-full-20261025-144914\current` 冻结副本均为 match。
沿用既有证据，未重跑旧 build 或测试。

## 原字节边界与未验事项

`prepare.ps1` 和 `stop.ps1` 保持原字节：

- `prepare.ps1`：
  `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37`
- `stop.ps1`：
  `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647`

README 已说明新私有 metadata、准确目录、prepare/start/stop 用法、停止后目录仍
保留，以及作者未运行任何准备或验收步骤。

未验证：fresh prepare 产物、fresh GUI 启动、duplicate 校验器在真实启动中的最终
结果、模型请求、正常 cleanup。不得把本交回视作 GUI 或模型验收。后续只能使用
fresh root；旧 served 根不可复用。本支只允许 root 至多一次 fresh GUI。

Packaging HOLD。
