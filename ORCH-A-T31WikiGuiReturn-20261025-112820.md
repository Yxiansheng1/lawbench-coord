# ORCH-A T31 WikiEmpty GUI 正式交回

状态：`PREPARED FOR ROOT REVIEW`。作者未执行 prepare/start/stop、产品代码、构建、测试、服务或 GUI；这不是 GUI 验收。

## Full4 SHA-256

| 文件 | SHA-256 |
|---|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\prepare.ps1` | `1F5AE62FC4675D70F10D6CC0D7B0F44E84B3659A7B3B0460CE4067B658A91B37` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\start.ps1` | `1934FD92F534ED26909146A7DF167DB979207017701FD0151708E8D89812FC14` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\stop.ps1` | `7E9BC2E1216CDD5EDC4D70D6D22582329363B3A376BF6C26A11334DEA560F647` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\README.md` | `F3EB1E0D173D3525BCEA0DC50574AF7E78BB9002D68CDC4D967E904BAAED01C5` |

`prepare.ps1` 与 `stop.ps1` 对 T33 `NativeReadGui-20261025-110241` 逐字节一致。四件均先复制自该目录，之后只修改 `start.ps1` 与 `README.md`。

## Original3 Mechanical Diffs

1. `start.ps1:273` 只把 current client pin 从旧 E26 改为 approved C551，并把该一项 frozen root 定向到 `T31-wiki-build-root-full-20261025-1123\current\client.js`；其余 10 个 source pin/old frozen literal 未动。
2. `start.ps1:282-291,305,333-346,392-434` 在 fresh `<RunRoot>\gui\privateplugin` 物化原 E50 `package.json` 与 CURRENT A 的完整 6 个 lib 文件；source/destination 均作固定 SHA 校验，无动态 mapper、overlay source、runtime copy 或安装。
3. `start.ps1:434-454` 保留原 E50 `cordis.patch.yml` 字节前缀，只在末尾追加一条 `legal-ui` row；不替换已有 rows、bundle、memory provider、resolver、guard、环境或 lifecycle。

## Exact Pins, Destinations, Override

- Client source: `D:\Lawbeach\lawbench-A\dsh-ext\lib\client.js`, 508590 bytes, `c551f476c4992af95eaddd5a0eedd7a0a316cd12ebc028bab90dca0ff522589f`.
- Client frozen source: `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-wiki-build-root-full-20261025-1123\current\client.js`.
- Other five current files: `agent.js` `3a0d22545b49d27866be09fd025ab3c337af4fec1a0acb46a5698267c6948a43`; `credentials.js` `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1`; `host.js` `4f8c97e01cac44dbeb49e8b80374ed9a8c1d96bf62dcbeac8e2ff17342fdd1f8`; `index.js` `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956`; `session-store.js` `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762`.
- Manifest source: `D:\Lawbeach\lawbench-A\docs\plan\evidence\T50\20261023-211421\project\node_modules\lawbench-dsh\package.json`, SHA `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`.
- Wiki witnesses: `T31-wiki-empty-root-full-20261025-1120\current\wiki-card.tsx` SHA `aa3080aff89e12caf173e838ef6635203ed51858a64c5e93ab58521de5db5e5a`; `wiki-card.spec.ts` SHA `ae7089e08404237f57010f07c395f6870ac90e51e42a749d38d50801d34ec984`.
- Destinations: `<RunRoot>\gui\privateplugin\package.json` and `<RunRoot>\gui\privateplugin\lib\{agent,client,credentials,host,index,session-store}.js`.
- Overlay destination: `<RunRoot>\gui\dsh-home\profiles\desktop\cordis.patch.yml`; trusted prefix source SHA `7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f`.
- Sole suffix after the original bytes:

```yaml
- id: legal-ui
  name: file:///D:/Lawbeach/lawbench-B/docs/plan/evidence/T33/ReadGetEntry-20261025-105313/runs/T33-host-YYYYMMDD-HHMMSS/gui/privateplugin/lib/index.js
```

该 URL 由 `<RunRoot>\gui\privateplugin\lib\index.js` 的 canonical absolute path 经 `Uri.AbsoluteUri` 生成。最后一行之后仅有一个 LF；prefix 与 suffix 的字节边界由脚本再次逐字节核验。

## Author Checks and Boundary

- 已读完整执行令与 facts JSON；核对了 approved build/empty outputs、六件 CURRENT A、E50 manifest、原有 prefix hash 与目标目录不存在。
- `start.ps1` PowerShell 静态解析：0 errors。四件 final SHA 如上。
- `git diff --no-index` 复核显示 `start.ps1` 只有上述三组机械改动；未发现 guard/resolver/runtime/lifecycle 变化。
- 执行只读 `git status` 时，子模块 `dsh` 的 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-A\modules\dsh` 报 `Permission denied`。按令保留该阻碍，不修 lock、不扩权、不重试 Git 写路径。
- 未运行任何 prepare/start/stop 脚本、server、GUI、RPC、Vitest/tsc/pytest、collect/selftest/build/install/network，未访问真实凭据，未改沙箱/审批/ACL/锁，未执行任何 Git 写操作。

## Root Commands

```powershell
$Pwsh = 'C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe'
$Set = 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820'

& $Pwsh -NoProfile -File "$Set\prepare.ps1"
# 保存输出的 fresh runRoot；不得复用或擅自替换。

& $Pwsh -NoProfile -File "$Set\start.ps1" -RunRoot '<printed runRoot>'
# Root GUI review uses the actual Electron window only after cumulative-diff review.

& $Pwsh -NoProfile -File "$Set\stop.ps1" -RunRoot '<printed runRoot>'
```

启动前由 Root 核对 full4、三组 diff、六件固定 hash、原 prefix、唯一 suffix、`current.json`/`handoff.json` 路径及 fixed new client。GUI journey 仅限空案卷、sidebar、缺失 wiki legacy hint/card 不发生、materials/OCR 为空而非失败、六个真实 native GET 无通用契约错误。不得生成 wiki、导入、发送模型或录入真实凭据。

停止后读 `<runRoot>\gui\state\stop-report.json`；仅当 remaining exact identities 为 0 且 recorded native port 无 listener 才可称已清理。失败保留 root，用同一 `stop.ps1` 走精确身份清理；禁止 broad kill、递归删除、复用 root 或改锁。

## Unresolved

- 实际 `file:///.../privateplugin/lib/index.js` 启动与 GUI 呈现尚待 Root 执行；作者只证明了静态度量、固定哈希、manifest 元数据和给定 native resolver source facts 相符，不宣称 prepared 等于 GUI passed。
- 除上述二进证据外未发现新的依赖阻碍；不存在由本线改为第三候选、测试重跑或源码覆盖的授权。
