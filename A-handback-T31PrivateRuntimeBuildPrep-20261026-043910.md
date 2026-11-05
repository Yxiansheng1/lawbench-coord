# A 线交回：T31 私有运行时构建准备

交回时间：2026-10-26  
执行身份：独立 A 线 DeepSeek 执行者  
正式执行令：`D:\Lawbeach\lawbench-coord\T31PrivateRuntimeBuildPrepOrder-20261026-043910.md`  
执行令 SHA-256：`a6f3e85ee5b647bc7961025678c894287058c6857fc202f4685358c96d7a8b21`

## 结论

`PREPARED_FOR_ROOT_AUDIT_BUILD_NOT_EXECUTED`

已准备三个可审查文件，脚本覆盖 lawbench 当前六件、embedded contracts、当前 `ui-conversation` P29 浏览器 hook、当前 `session-controller` Client `beginSubmission`、Host `commands.ts` 和当前 Typert Host/Remote 元数据。

本次没有执行 build/tsc/Vitest/pytest/parser/self-test、prepare/server/GUI/HTTP/model/network/API/installation；没有生成 `private-output-*`、manifest、profile 或 launcher；没有改任何产品源码、配置、契约、lib、依赖、旧运行目录或 evidence 快照。Packaging HOLD。

## 允许目录中的交付文件

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910`

| 文件 | 行数 | 字节 | SHA-256 |
| --- | ---: | ---: | --- |
| `build-private.mjs` | 818 | 31,202 | `66f122273e5c13eb5996b147041684816a5ea2f8c05fb7af0c3935bb32dcee63` |
| `build-config.mjs` | 311 | 19,825 | `bbb7fea1f2bffa6abfbcf85e507ca97f4a35914863d4224bed12b8e496b711de` |
| `README.md` | 156 | 11,512 | `f6ce723e6cc489cb02d96f703edfd809e5275f0718d1c2d3877d80ed04559799` |

目录当前无子目录、无 reparse/link、无构建产物。

## 既有状态与 dirty 保全

- A HEAD 仍为 `a23271abee333a9a256fd46a3141da16975c2380`。
- 既有 A dirty 快照：`A-tracked-before.patch`，279,607 字节，SHA-256 `83fcf760d38fe8ec031ff4962c03e944fc6f3af592b05e9e3b6a10c16c9c1b17`。
- 既有 DSH dirty 快照：`DSH-tracked-before.patch`，2,521,883 字节，SHA-256 `53fbed34a9aca6d7ef10197756a50aff95f3c679c903de9a69e4ed4dc3799248`。
- `fixed18-reference.json` SHA-256：`5521c1351aaca7049424fab319e9a3c08a311adf9e04ab603a991923e020dd72`。
- 既有 root HTTP 接续事实：`checkpoint-T31-scope-http-current.md` SHA-256 `5e82293cd9adbc7c89564d47188b55e353ecd89b7ea15eeff33647da1d827b14`；`HTTP-root-accepted-current.json` SHA-256 `7a97049e87027e9750c4cb77baeef63beb1cac656e83bd40b307e4415c3de01b`。
- 这些快照和 root evidence 均未修改。没有重跑已通过的源码测试或真实 NativeR/Host/CoreClient TCP 切片。

全量 `git status` 首次读取在 `dsh` 子模块的 `.git/worktrees/lawbench-A/modules/dsh` 处被 `Permission denied` 拒绝；没有修权限、改 ACL、拆 writer 锁或扩展审批。改用 `--ignore-submodules=all` 后，限定本证据目录的状态只显示上述三个未跟踪文件。Git 全程只读，没有 add/commit/rebase/stash/reset/clean/checkout/push。

## 关键输入

`build-config.mjs` 内有完整 literal pin 表。源码树采用 ordinal 排序的 `path<TAB>bytes<TAB>file-sha256`，加 LF 后整体 SHA-256；工具链目录也按同一算法固定。

| 源码/工具树 | 文件数 | 字节 | SHA-256 |
| --- | ---: | ---: | --- |
| `dsh-ext/agent` | 4 | 57,829 | `5312ffd4ca0c8a1e7ed59b2e1bd25a44daf86692178655a6a21949ea03c2581d` |
| `dsh-ext/credentials` | 4 | 20,408 | `3a2fda95d9c0b677d14cba31cbc5b6b4ef26722d8bfaed9bbb5ddf8a234646d2` |
| `dsh-ext/host` | 20 | 183,881 | `261cff5d2fc7f72d91d41ec00006956f04f08fea676aa4c3d0e8313a8cf27077` |
| `dsh-ext/session-store` | 5 | 70,071 | `03899682afa6e53ac7b4078eec79e2d7ba699b5646305097c708d4989252c416` |
| `dsh-ext/shared` | 9 | 33,915 | `e1157334b68f6923715ced8927bbed93411a2cf855abf98bf0b91323da7f7645` |
| `dsh-ext/ui` | 92 | 627,510 | `dcb170437d80fb9b3444a6fb29dda44dd11611703fdf9ed4a26dd4c703173756` |
| `contracts` schema 闭包 | 69 | 251,415 | `b4198d53f6ab72324044a68c0b8f0e2150ce0bf9c7e4d4038c6d8f1e70e74a69` |
| `dsh/packages/client/ui-conversation/src` | 79 | 589,707 | `9ae9334ba510bf94ff7699250877ecc8959a2c0da3d83f1d5df997f9038c2cb9` |
| `dsh/packages/api/session-controller/src` | 34 | 337,123 | `54ac9c5584cd05ab78542f6686868f3c8f057d1fc791226f6f3324689c8ec523` |
| Typert generator installed `lib/types` | 32 | 559,777 | `99db12246e9c7460db735353308ed10da86ef4ea68db7bc17986b29dd976e866` |
| tsdown 0.22.2 package | 49 | 203,850 | `7b19b8642ba7169663940b45ada7d86658ddef2771e5660df45e25a6e179df5f` |
| tsx 4.22.4 package | 53 | 522,956 | `bb02a5fea778f46de71b78090dfafc92ffeec38767faabb24f7f858687b6d562` |
| esbuild 0.28.1 package | 10 | 149,038 | `130e9264dcedb8dc0d82fe19fe1e9252c1245888708d3044c1b77f10cb814d3b` |
| esbuild win32-x64 | 3 | 11,671,045 | `24adc822df9adeba23d7ea5e8eb22bb9f91a9bd7ff412564e8e6764ed97f0c4b` |
| lightningcss 1.32.0 | 14 | 510,515 | `ff206f299930ce60d19f50129c409e0a17171a16dab1626cb81e11f2329430b4` |
| lightningcss win32-x64 | 4 | 9,514,088 | `70291c57eb7d588d4270a2451e7e601fe79026cdddaf8da466a43ad27ef5888b` |
| rolldown 1.1.1 | 48 | 773,777 | `60b8bf09f6a48d953a33571b2a0772d3bad8fa57d5b521f23f6907adb9278bea` |
| rolldown win32-x64 | 3 | 31,085,946 | `141f626551fdcee67c602f6b838c04f420e134690486de40bc1985d43fbb7935` |

关键文件 pin 包括但不限于：

- `dsh/packages/client/tsdown.client.ts`：`8afeabc31d95e2c0ff5735193273f4d67bb1ef81f1adf3f45eb5adbef9510b33`
- `dsh/packages/api/session-controller/package.json`：`ef7d21eec0e9b35212cc773f984afd7e24daca7063de8fad69a287e661c55a81`
- `dsh/packages/client/ui-conversation/package.json`：`9e002e9f9c09ec329e82995cbf1fe47d64dd5f516c8912bc98f73db327f567d1`
- `dsh/package.json`：`eb332130b7347793c65c6e72af2afb8543e767d86857400dbb23ff0c46d527b4`
- `dsh/pnpm-lock.yaml`：`60c46d0ed242a2f94663b0921b6296dd2db3a64fb2112dbc708a8341828acc38`
- `dsh-ext/package.json`：`3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`
- `dsh-ext/scripts/build.mjs`：`34e0f5d6136d203f56816bf181d359ce7941bc7e09048fce2ec62cc145646b33`
- `dsh-ext/scripts/contracts-source.mjs`：`6460a6963458f9a74e18e15f26aeaa292bf9a00222bc45eea8c71d8d9c4e5baf`
- Node `E:\node\node.exe` v24.21.0：`ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32`
- T50 resolver：`1a174359fa6fe54a8a83ae996897c703e9a5b8065cae36a8fcd12d07fc27b208`
- T50 guard：`cbb770e4f3b75ad09d017837a15c5f412d630a8b32b852b8d33a96911f0a4130`
- T50 profile package：`bb7315c3844542261d160da20c0b9c963b5e56464cb81f546862fb2d46f43c3f`

P29 补丁也逐字节固定：scope `e76c9c52...`、ordering `9187cbe6...`、scope-test `6a9f6020...`、failure-cleanup `28f17402...`、native-claim `d3527b61...`（完整值见 `build-config.mjs`）。本脚本不 apply 补丁。

## 预期输出

只有在 `--out` 指向本目录下尚不存在的 `private-output-YYYYMMDD-HHMMSS` 时，脚本才允许写：

```text
manifest.json
profile-node_modules/lawbench-dsh/
  package.json
  cordis.patch.yml
  persona.md
  lib/{agent,client,credentials,host,index,session-store}.js
profile-node_modules/@deepseek-ai/dsh-client-ui-conversation/
  package.json
  lib/index.js
  lib/client.js
  lib/client.js.map
profile-node_modules/@deepseek-ai/dsh-api-session-controller/
  package.json
  lib/index.js
  lib/client.js
  lib/client.js.map
  lib/typert.host.js
  lib/typert.host.d.ts
  lib/typert.remote-client.js
  lib/typert.remote-client.d.ts
  lib/typert.remote-client.d.ts.map
  lib/types/types.js
  lib/types/remote-events.js
```

输出集合必须完全相等；脚本不递归删除，失败的部分输出保留供审。`manifest.json` 最后写入，记录实际输出 hash、输入 hash、进入 bundle 的模块路径、构建内静态检查和“未加载到 profile、未 GUI/HTTP/模型”的状态。

`lib/types/*.js` 只是原 package 子路径的运行时入口，不是发布用完整 npm 包；没有复制旧 d.ts 或旧 `lib/types`。

## Root 批准的 future command

仅在一次明确批准的构建中运行：

```powershell
$env:NODE_OPTIONS = $null
& 'E:\node\node.exe' --import 'file:///D:/Lawbeach/lawbench-A/dsh/node_modules/.pnpm/tsx@4.22.4/node_modules/tsx/dist/loader.mjs' 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs' --out 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-YYYYMMDD-HHMMSS' --stamp '20261026-043910'
```

脚本在创建输出前验证 Node、A HEAD、所有文件/树 hash；拒绝已有输出、路径越界和 links/reparse。它要求 `NODE_OPTIONS` 为空，以避免冻结 T50 guard/resolver 混入构建进程。

## P29 运行投递理由

1. 当前 `ui-conversation/src/client/service.ts` 在原生 `session.beginSubmission()` 生成 R 后、`prompt()` 前调用 hook；`index.ts` 暴露 `conversationSubmission`。私有浏览器 bundle必须从当前 source 生成，否则 lawbench UI 看不到真实 R。
2. 当前 `session-controller/src/client/sessions/session.ts` 生成 R，并把同一 R 传给 Host；它的 browser bundle必须替换，不能只换 lawbench 六件。
3. 当前 `session-controller/src/commands.ts` 把 R 写成 `source.rpcId`，并从真实 `agent/inbox/spliced` 纯 claim 窗口识别重放；它的 Node bundle和当前 Typert Host/Remote metadata必须一起投递。
4. lawbench `agent.js` 从已 claim 消息提取同一个 R，交给 `/core/task/begin`；`client.js` 在 prepare 时把本批材料绑定到同一 R。
5. lawbench 六件单独更新只能提供观察者/消费者；不能证明原生 Session/Host 已换，故不构成 T31 原生链路生效。

## 未来 profile 投递条件

未来原始 launcher 尚需把上述两个原生 package 与 lawbench package 放到同一 fresh run 的：

`<RunRoot>\gui\dsh-home\profiles\desktop\node_modules\...`

fresh profile 的 `package.json.dependencies` 还必须声明：

```json
"@deepseek-ai/dsh-api-session-controller": "0.1.7-rc.2",
"@deepseek-ai/dsh-client-ui-conversation": "0.1.7-rc.2"
```

原因：`createRuntimeResolution()` 的 `localPackageNames` 只对 profile 直接依赖且已在 profile `node_modules` 中存在的包启用本地优先路由。只放文件而不声明依赖，bundle/installation 中的旧同名 package 仍可能先命中。此步不要求运行 npm/pnpm；本任务也未执行。

profile 后缀至少在冻结 T50 前缀之后：

```yaml
- id: session-controller
  disabled: true
- id: ui-conversation
  disabled: true
- insert:
    - id: session-controller-private
      name: '@deepseek-ai/dsh-api-session-controller'
    - id: ui-conversation-private
      name: '@deepseek-ai/dsh-client-ui-conversation'
```

原生双面包必须保留原 package id，以便浏览器 modules 表读取 `dsh.client` 且 Typert loader读取同一 package 的 `./typert`。`legal-ui`、`legal-host`、`legal-credentials`、`legal-session-store` 和 preset 内的 `legal-agent` 五个运行点必须全部改到私有 lawbench 文件 URL；仅替换其中一部分不算生效。详细说明见 README 第 6 节。

## 尚未完成 / 不得宣称

- root 尚未独立审计或批准 build；脚本未执行，输出/manifest 不存在。
- 新 launcher 尚未准备。profile-local 包投递、dependencies 声明、两行禁用/插入、五个 lawbench 运行点替换、fresh native root、进程身份和 cleanup 都尚未在运行件中闭合。
- 私有 package 在 profile 的实际 Node ESM/Typert/modules 加载、重复 package 检查尚未验证。
- GUI 的真文件/目录导入、当前材料 `material_ids` 本批、下一问默认批次、取消/改选、以及任何情况下不自动发送，均未验证。
- 既有真实 NativeR/Host/CoreClient Scoped HTTP 切片仍按 root 原结论沿用，不是 GUI PASS；本任务未重跑。
- 本准备不是 build PASS、native runtime PASS、GUI PASS、model PASS 或整 T31 PASS。Packaging 继续 HOLD。

## 执行边界偏差记录

本运行中有若干只读 `exec_command` 误把 `shell` 参数填成 Bash 或短名 `pwsh`。Bash 调用在 MXC launcher 前被拒绝（`E_ACCESS_DENIED`），没有执行内容；短名 `pwsh` 调用只执行了 `Get-Content`、`Get-ChildItem`、`Get-FileHash`、`rg` 等只读检查。没有由此写文件、启动 setup/legacy launcher、改沙箱/审批/ACL/锁或把当前 PID当 writer。后续命令均使用指定绝对 `pwsh.exe`。该偏差在此留痕，不据此主张验证通过。

到此停止，等待 root 独立审计。
