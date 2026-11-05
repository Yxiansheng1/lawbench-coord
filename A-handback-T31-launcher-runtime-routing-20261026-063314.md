# A 线交回：T31 launcher runtime routing

## 结论

已在正式执行令允许的三个文件范围内完成有界修改，待主编排累计审计和
fresh prepare/start/sky 实际运行。A 线未执行 parser、prepare、start、服务、
probe、GUI、HTTP、测试、构建、模型或网络动作，不宣称实际 GUI 或模块解析通过。

- 执行令：
  `D:\Lawbeach\lawbench-coord\T31-launcher-runtime-routing-order-20261026-063314.md`
- 工作树：`D:\Lawbeach\lawbench-A`
- 交回时间：`2026-10-26 06:43:33 +08:00`

## 文件与工作树身份

以下哈希是工作树文件 SHA-256，不是 Git 提交 SHA。本任务明确禁止 Git 写入，
因此没有 add、commit、rebase、stash、reset、clean、checkout 或 push。

| 文件 | 修改前 | 修改后 |
| --- | --- | --- |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1` | `0f73c39f0117d294f3e2bbf491e43e50143b9d3548ceaea4381247bed9e4def2`，64448 bytes | `c93c9294a024a46f8d377f0b30cf2c13ef873f949f1bf75c07785a5927e84400`，75457 bytes |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md` | `61d954f625b77232eb6b1a3367cdd0ecef3d750024673feb8bdbb4c82c19c0b0`，14919 bytes | `18ad427afd3728e79311e10db7cf52685e783675759cf1c5f7ec647492b18e58`，18793 bytes |

冻结文件保持字节不变，并与 before 快照逐一相等：

| 文件 | SHA-256 | 与 before 快照相等 |
| --- | --- | --- |
| `prepare.ps1` | `54a6a395b6d4e1a7e7e9d463df86092c9ba15c241b4aff8de81773efde6a8e8e` | true |
| `stop.ps1` | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` | true |

## 已完成的限定实现

1. `start.ps1` 新增 `GuiRoot\private-native`、`private-native\lib` 和
   `private-native\package.json` 的精确路径登记；`Write-RunState` 增加
   `privateNative` 与 `privateNativePackage` 两个实际路径字段。
2. `Prepare-PrivateProfile` 在 profile `node_modules` 之外创建 fresh shim，
   写入精确三键 manifest：

   `{"name":"lawbench-t31-native-private","type":"module","private":true}`

   然后只从 fixed private build 复制下列三个已 admitted 文件：

   | shim 文件 | bytes | SHA-256 |
   | --- | ---: | --- |
   | `lib\host.js` | 900186 | `7c2f1a2c2e4825a5626a8deba279d0a75b38b060620269c71a1c2c5beea7bb63` |
   | `lib\agent.js` | 537141 | `43561af340996eab90043d031f0669efe8e8d50e05b75bd4015d489ec0c73ca8` |
   | `lib\session-store.js` | 44858 | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` |

   shim 复制前后都核对实际 bytes/SHA-256，目标必须不存在并禁止覆盖；最终
   inventory 必须恰好为上述三个文件加 `package.json`，任何 link/reparse
   point 都拒绝。manifest 的完整属性序列必须恰为 `name,type,private`，
   从结构上拒绝 `dsh`/`client`/`exports`/`scripts` 的第二份浏览器元数据。
3. 原有三个 admitted 包及 24 个文件仍按原固定 pin 直接铺入 fresh profile
   `node_modules`。两个 native 包仍用裸包名；`lawbench-dsh` 仍为直接依赖，
   `package.json`、exports、`dsh.client`、bundle 和 client 文件校验未削弱。
4. profile overlay 保持 T50 原始 prefix 字节不变，只追加：

   - 原 `session-controller` 禁用并插入 `session-controller-private`。
   - 原 `ui-conversation` 禁用并插入 `ui-conversation-private`。
   - `legal-ui` 禁用；`legal-ui-t31-private` 使用 fresh profile 中
     `lawbench-dsh\lib\index.js` 的绝对 file URL。
   - `legal-host` 禁用；`legal-host-t31-private` 使用 shim `host.js` 的绝对
     file URL，并完整保留 known-good 七字段配置：`command`、`cwd`、
     `appData`、`forwardPort`、`env`、`skillDirs`、`officeRuntimeWorker`。
   - `legal-session-store` 禁用；`legal-session-store-t31-private` 使用 shim
     `session-store.js` 的绝对 file URL。配置完整保留 admitted 包中的
     `backendModule`、`defaultRoot`、`appData`、
     `allowOutsideCase: false`、`projectionCache.module`、
     `writeEveryEvents: 200`、`writeIntervalMs: 5000`。
   - `preset-lawbench` 用完整对象替换，保留 persona complete/
     includeRuntimeContext false、Skill、工具和 compaction；只把原有
     `legal-agent` 指向 shim `agent.js` 的绝对 file URL，
     `validateContracts: true` 不变。没有新增第二个 Agent 或 Host。
5. 新 overlay 采用逐行精确文本断言：四个新 ID、四个目标 file URL、
   `allowOutsideCase`、两个 projection 写参数和 `validateContracts` 均按固定
   缩进且必须恰好出现一次。旧 `legal-ui`、`legal-host`、
   `legal-session-store` 的 disabled 块也必须精确出现一次。`legal-credentials`
   必须恰好 disabled true；overlay 中禁止出现生产
   `lawbench-dsh/credentials` 或 disabled false。

## 复用证据与未改边界

- before 快照：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\before-launcher-runtime-routing-20261026-063314`
- 既有 ESM 解析证据：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-profile-lawbench-esm-resolution.json`
- known-good 原始模式：
  `D:\Lawbeach\lawbench-coord\T31BatchGuiInput-20261026-055030\base-start.ps1`
- private build：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-054741`

只读核对结果：

- private build manifest 为 57729 bytes，SHA-256
  `50c04674f198278e3e426448fa265729243c89386045534bb9810951783c7401`，
  outputs 恰为 24，format/status 分别为
  `T31-private-runtime-build-v1` / `SOURCE_BUILT_RUNTIME_NOT_EXERCISED`。
- 三个 shim 源文件的实际 bytes/SHA-256 与上表完全一致。
- `preset-lawbench` 全文 block 与 known-good `base-start.ps1` 的对应 block
  静态文本比较无差异；Host 七字段 block 静态比较无差异。
- 与 before 快照的只读 diff 仅落在允许的路径登记、Prepare materialization、
  profile suffix、overlay 断言和 README 说明；没有 product/source/contract/
  B/guard/build 文件修改。
- `git diff --no-index --check` 未报告空白错误，仅报告仓库既有的
  LF/CRLF 提示。

## 验证禁区遵守

本执行者没有执行下列任何动作：

- parser、prepare.ps1、start.ps1、stop.ps1、serve、probe、GUI 或 sky；
- Node import/resolve、PowerShell 脚本解析、HTTP、selftest；
- test、Vitest、pytest、tsc、build 或任何安装；
- 模型请求、网络请求或真实案卷；
- Git add/commit/rebase/stash/reset/clean/checkout/push；
- .env.local、Key、Keyring、凭据、ACL、沙箱、审批、锁或 writer 状态的变更；
- package、installer、merge、push、deploy 或 Actions。

## 阻碍与过程披露

- 普通 `git status --short --branch` 在子模块 `dsh` 处失败：
  `cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。
  随后只用
  `git -c submodule.recurse=false status --short --branch --ignore-submodules=all`
  做只读父仓查询，确认工作树原本已有大量 dirty 状态；未修复权限，未扩展权限，
  未改动锁或 ACL。
- 两次只读查文件时，工具的 shell 参数被误填为 `bash`；宿主在命令执行前即返回
  `Bash/E_ACCESS_DENIED`。没有命令执行，没有文件或进程状态变化。其余所有
  成功命令均使用执行令指定的原生 pwsh 绝对路径、`login=false`。
- 一次只读 inline PowerShell 核验因管道写法错误返回 ParserError；没有写入，
  随后用同一原生 shell 以修正后的只读命令复核完成。

## 主编排下一步

在累计静态复核通过后，由主编排自行：

1. 审计本交回所列 file URL、完整 preset、shim 四文件 inventory、24 输出 pin、
   18 legacy pin 和凭据禁用状态。
2. 对 `start.ps1` 做 parser 检查，再执行 fresh `prepare.ps1`。
3. 在全新 run root 执行 `start.ps1`/sky，实证 UI、Host、Agent、SessionStore
   均从 fresh file URL 加载，并检查 duplicate browser client 和 loopback 路由。
4. 执行既定的输入区动作和 `stop.ps1` 精确清理；不得由本交回替代实际 GUI、
   模型或 T31 整体验收。

当前状态：`BOUNDED_CHANGE_READY_FOR_ROOT_AUDIT_AND_RUNTIME`。
