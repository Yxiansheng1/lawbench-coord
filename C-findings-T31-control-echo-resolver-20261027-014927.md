# C 线独立审查：T31 control/echo 生成模块 native resolver 失败

状态：`REVIEW_COMPLETE / EXACT_LEAF_UNRESOLVED / NO_CODE_CHANGE / C_RUNTIME_NOT_RUN`

只读入口：
`D:/Lawbeach/lawbench-coord/T31-control-echo-resolver-review-order-20261027-014927.md`

本审查只输出本文件，没有修改 A/B/C 产品、测试、fixture、配置、生成物或运行时。
没有运行 Node、Python、Vitest、tsc、parser、AST、import、collect、build、serve、probe、
HTTP、model、GUI 或安装。以下“通过/失败”均引用既有 root 证据，不是本次重跑结论。

## 结论先行

1. **已证实：** 两项 control/echo 测试不是产品语义红。它们在
   `loadControlCodecs()` 的动态模块获取/加载阶段失败，早于
   `codec.create()` 与任何 control/echo 语义断言。
2. **已证实：** 当前错误里的 `/@id/D:/...` 主要是 Vitest Windows transport 的
   内部绝对路径标记，不是“真实包名变成了 `/@id/`”。Vitest 还会把底层
   `Failed to load url` 类错误统一改写成 `Cannot find module`。
3. **已证实：** accepted 对照与 native control 的有效项目组合不同：
   accepted 从 `dsh-ext` 启动且没有显式 Vite root；native control 由
   material-admission 继承 `root=D:/Lawbeach/lawbench-A/dsh`，并使用 native
   `thread-safe` project、三项 setup、jsdom。
4. **强推断：** 差异在“项目 root/项目组合如何承载 root 外的动态生成文件”，
   不在动态 import 的查询串、反斜杠或普通 `file://` 拼写。三种拼写已经被既有
   root 实测分别否定。
5. **未决：** 静态源码还不足以唯一判定最终叶子是 `server.fs.allow` 拒绝、
   plugin/module-graph 解析结果失配，还是两者组合。accepted 通过而 native 失败，
   但两者的目标文件都在各自表面上“root 外”，因此不能把任意一个 api 直接写成
   唯一根因。
6. **建议：** root 先做一个只读 resolved-config/module-fetch 边界诊断；在看到
   `root`、`server.fs.allow`、`resolveId()` 返回值和 `isFileLoadingAllowed()` 后再选
   一个现有组合绑定。不要继续试 import 拼写，不要放宽 fs/security guard，不要
   复制或重写生成 payload，也不要再起第三套同类 C 测试配置。

## 证据身份

固定输入当前复核如下，均与 `fixed-inputs.json` 一致：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| native control fixture | 19,611 | `16d9c5491b554a55e781886ff348027ef8ab5290995e19593fb9f356465ddded` |
| native control selector | 1,607 | `ab29a362524b3cc78e7ff1ad5afcf29d95e192d63b48eda94c958021701eb006` |
| material-admission selector | 1,510 | `ed1c57bbb492e28caf43725896ba265905d126a16126dc8824eaea9be961cdb9` |
| accepted private selector | 807 | `7991869596676b1e6f6fecf8f2cb3493d72051e74aff36792cabfe8be2b3940f` |
| scope-http selector | 1,531 | `ca433f29e9d5a7228eda2cc70447eeed23e8947bc6224e69274ab4c38079f629` |
| native `vitest.config.ts` | 21,057 | `d8ccc373d1ab9d837664814794017794551257a630a100534aac8bae7f56314f` |
| native `vitest.shared.ts` | 1,482 | `3e8900b7471bffab582974b3a0a6413140d8143d41f62f19a348c41ad3a316a0` |

三个实际生成输入仍存在、为普通文件，且大小/哈希等于 fixture 内硬编码值：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `manifest.json` | 58,186 | `1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae` |
| `typert.host.js` | 158,754 | `a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12` |
| `typert.remote-client.js` | 59,116 | `e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630` |

accepted packet 当前物证：

- packet：
  `C:/Users/morel/Documents/Codex/2026-10-21/deepseek-codex-gpt-advisor-reviewer/outputs/T31PrivateRuntimeWire-root-20261027-003541`
- 摘要文件当前 SHA-256：
  `55ba71de7a9e8086e41599d0b5b585bc13c54b9217d70f7865a9206cde705c0b`
- 摘要自证：exit 0、2/2 PASS、8.9799364 秒；
  `compiled_Host_Remote_JS_executed=true`、`test_sha=9077981a8ff897a5c1d0c70130d0e063d05e90f549a6a8b0b9b96a16f12c0ff8`、
  `selector_sha=7991869596676b1e6f6fecf8f2cb3493d72051e74aff36792cabfe8be2b3940f`。
- 当前 accepted 测试源码与 selector 哈希也分别精确等于上述 `test_sha` 和
  `selector_sha`。

## 失败点与调用链

### 1. 失败发生在冻结测试的加载 helper

当前 native fixture 在
`D:/Lawbeach/lawbench-A/dsh/packages/api/session-controller/tests/fixtures/t31-control-projection-echo.finite.ts:149`
和 `:152` 执行：

```ts
await import(HOST_PATH.replaceAll('\\', '/'))
await import(REMOTE_PATH.replaceAll('\\', '/'))
```

既有 root 运行
`T31ControlEchoResolveDiagnostic-root-20261027-014650` 为自然 exit 1、5.042326 秒、
2 discovered / 2 failed。两例堆栈都停在 `loadControlCodecs`，没有进入 control/echo
断言。

当前首错为：

```text
Cannot find module
'/@id/D:/Lawbeach/lawbench-A/docs/.../profile-node_modules/@deepseek-ai/dsh-api-session-controller/lib/typert.host.js'
imported from D:/Lawbeach/lawbench-A/dsh/packages/api/session-controller/tests/fixtures/t31-control-projection-echo.finite.ts
```

证据：
`C:/Users/morel/Documents/Codex/2026-10-21/deepseek-codex-gpt-advisor-reviewer/outputs/T31ControlEchoResolveDiagnostic-root-20261027-014650/test-results.json`

### 2. `/@id/` 是 worker transport 的标记

Vitest 4.1.8：
`dsh/node_modules/.pnpm/vitest@4.1.8_.../node_modules/vitest/dist/chunks/startVitestModuleRunner.bRl2_oI_.js`

- `663-670`：worker `fetchModule` 在 Windows 上看到 `D:` 绝对路径时，
  先统一盘符大小写，再添加 `/@id/`；
- `679`：`rawId = unwrapId(id)`；
- `706`：把处理后的 id 经 RPC 交给服务端；
- `714-717`：把底层 `Failed to load url` 或 `Cannot find module` 统一重抛成
  `Cannot find module ...`，并设置 `ERR_MODULE_NOT_FOUND`。

因此，日志中的 `/@id/` 和 `Cannot find module` 都不是独立的根因证明；它们同时是
transport 标记和错误消息归一化结果。

### 3. 服务端模块获取链

Vitest 4.1.8
`.../vitest/dist/chunks/cli-api.BfdDOPPI.js`：

- `962-998`：`ModuleFetcher.fetch()` 先判断外部 URL；普通 `file://` 不被当成网络
  externalization；
- `985-990`：非 `/` 开头的动态请求先走 `pluginContainer.resolveId()`，随后进入
  module graph；
- `994-998`：按解析后的模块 id 判断 externalization；
- `1123-1126`：未 externalize 时进入 Vite `fetchModule()`。

Vite 8.0.16
`dsh/node_modules/.pnpm/vite@8.0.16_.../node_modules/vite/dist/node/chunks/node.js`：

- `23187-23228`：`fetchModule()` 判断 builtin/network；bared import 走 Node resolve；
- `23230-23234`：`unwrapId()`、`ensureEntryFromUrl()`，随后
  `transformRequest()`。
- `24552-24567`：`doTransform()` 先做 module graph/`pluginContainer.resolveId()`，
  再进入 `loadAndTransform()`。
- `24585-24609`：load hook 无结果时，只有
  `isFileLoadingAllowed()` 为真才读取目标文件。
- `24628-24637`：若仍无 code，Vite 抛 `ERR_LOAD_URL` 的
  `Failed to load url ... Does the file exist?`。

这条链说明失败在“请求解析/模块图/文件许可/读取”区间，而非生成文件内容或产品运行。

### 4. 三种导入拼写已被排除为独立原因

既有 root 包分别证明：

1. 带自定义查询串的普通 `file://` URL 失败；
2. 移除查询串后，普通 `file://` 仍失败；
3. 直接绝对路径失败为 `/@id/D:\...`；
4. 仅将反斜杠替换为正斜杠后，仍失败为 `/@id/D:/...`。

因此“只解决 query”“只解决反斜杠”“只换一种 file URL spelling”都没有证据支持。
当前源码已经做过第三、第四种，不应继续同类循环。

## accepted 与 native 的实际配置差异

| 维度 | accepted prompt-codec 对照 | native control/echo |
| --- | --- | --- |
| root runner cwd | `D:/Lawbeach/lawbench-A/dsh-ext` | `D:/Lawbeach/lawbench-A/dsh` |
| 顶层 selector | `vitest.t31-private-runtime-wire.config.mjs` | `vitest.t31-control-echo-native.config.mjs` |
| root 设置 | 未显式设置；继承 scope-http/extension 配置 | material-admission 显式 `root=nativeRoot` |
| 有效 nativeRoot | 无 | `D:/Lawbeach/lawbench-A/dsh` |
| project | scope-http 的单一 extension source 图 | native `thread-safe` project |
| setup | extension 基础配置无 native 三 setup | native proxy/invariants/jsdom 三 setup |
| environment | node | jsdom |
| 测试位置 | `dsh-ext/finite-tests/...` | `dsh/packages/.../tests/fixtures/...` |
| 生成文件 import | 变量 `hostUrl/remoteUrl`，`file://...?...` | 变量直接为斜杠化 Windows 绝对路径 |
| 既有结果 | 2/2 PASS | 2/2 FAIL before assertions |

直接配置证据：

- `D:/Lawbeach/lawbench-A/dsh-ext/vitest.t31-material-admission.config.mjs:27`
  设置顶层 `root: nativeRoot`；
- 同文件 `:38` 又给唯一的 thread-safe project 设置 `root: nativeRoot`；
- `D:/Lawbeach/lawbench-A/dsh-ext/vitest.t31-control-echo-native.config.mjs`
  只 spread material-admission、替换 include、改 jsdom、增加 zod alias，没有移除
  native root；
- `D:/Lawbeach/lawbench-A/dsh-ext/vitest.t31-private-runtime-wire.config.mjs:5,13`
  spread scope-http，没有设置 root；
- accepted root runner `:26` 的 `WorkingDirectory` 是 `dsh-ext`；
- native root runner `:26` 的 `WorkingDirectory` 是 `dsh`。

生成的 Host/Remote 路径位于 `D:/Lawbeach/lawbench-A/docs/plan/evidence/...`，
不在 native root `D:/Lawbeach/lawbench-A/dsh` 下。

## 为什么还不能把叶子写成 “fs.allow 拒绝”

Vitest 会覆盖 Vite 的默认 fs allow：

- `cli-api.BfdDOPPI.js:10087-10093`：
  `resolveFsAllow(projectRoot, rootConfigFile)` 返回 config 目录、workspace root
  和 Vitest `rootDir`；
- `:10328` 把该结果写入每个 project 的 `server.fs.allow`，并启用
  `middlewareMode: true`。

Vite 自身默认值则在 `node.js:26575` 使用
`searchForWorkspaceRoot(root)`。native root `dsh` 的 `package.json` 声明了
`workspaces`，因此 native 的 workspace 搜索会停在 `dsh`，而生成目录在其外。

但 accepted 从 `dsh-ext` 启动时，目标文件表面上也不在 `dsh-ext` 内，却实际通过。
现有 packet 没有保存 accepted 的最终 resolved config、`safeModulePaths` 或
module-graph resolve 结果。因此：

- “native root 外目标在这一项目组合中未被正确承载”有强证据；
- “具体是 `isFileLoadingAllowed=false`”仍是推断，不是已证实；
- “root 外目标必然失败”被 accepted 对照反证；
- “`/@id/` 或 `file://` 拼写本身是根因”已被失败矩阵反证。

## root 侧最小诊断点

建议 root 在隔离环境里只做一次不含产品写入的边界诊断，不重复当前两项测试：

1. 分别解析 accepted selector 与 native control selector 的有效配置，只记录：
   - `project.vitest.config.root`
   - `project.vite.config.root`
   - `project.vite.config.server.fs.strict`
   - `project.vite.config.server.fs.allow`
   - config file 路径
   - project/plugin 名称
2. 在 native control 对 `HOST_PATH` 的第一次 `ModuleFetcher.fetch` 前后记录：
   - 传入 id；
   - `pluginContainer.resolveId(input, importer)` 的 `id/url`；
   - module graph 的 `module.id/file/url`；
   - `isFileLoadingAllowed(config, HOST_PATH)`；
   - 是否命中 `config.safeModulePaths`。

只看这些元数据即可唯一区分：

- allow/safe-path 拒绝；
- resolveId 返回错误 URL 或空结果；
- module graph 已登记但 load/transform 失配。

在看到上述值之前，不应应用新的 import 拼写、fs allow 放宽、loader、转译器、
payload 复制或第三套同类 selector。若诊断显示是项目组合未承载 root 外文件，再优先
复用 accepted 已验证的 resolver/project composition；若显示是具体安全许可拒绝，
由 root 决定是否接受任何范围变化，C 不建议自行放宽。

## 边界与非结论

- 不声称 control/echo 产品语义通过或失败；
- 不声称 native resolver 已修复；
- 不声称 accepted 覆盖实际 compiled browser `NativeSession`、完整 `NativeHost RPC`
  或 GUI；
- GUI 批量默认 3/3、reimport 0、toggle/all/cancel 仍为 `NOT_VERIFIED`；
- packaging 仍为 `HOLD`，Gate 1 未完成；
- 没有读取 `.env.local`、Key、密码、DSH cache、history 或真实案卷。

## Git、dirty 与写面

- 初始普通 `git status --short --branch` exit 1：
  `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh': Permission denied`。
  这是既有只读权限阻碍；未修锁、ACL、审批或沙箱。
- 随后只读
  `git --no-optional-locks status --short --untracked-files=all --ignore-submodules=all`
  退出 0，当前 C 工作树有 55 行 dirty/untracked；全部保全。
- 全程未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`，未暂存、未改 `index.lock`、未改 writer lock。
- 本任务唯一写面是新增本文件。写入前确认目标不存在；没有写 A/B/C 产品树。

## 实际命令与非零披露

所有成功命令均显式使用：

```text
C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe
login=false
```

第一个工具只读取正式执行令。后续只读内容包括：fixed-inputs、配置、fixture、
Vitest/Vite 安装源码、既有 root JSON/log/runner、生成物 lstat/hash、Git 只读状态。
没有调用任何被禁止的运行时验证。

非零记录：

1. 初始 `git status --short --branch`：exit 1，原因见上。
2. 一次 PowerShell 哈希脚本出现 `ParserError`（空管道元素），未写盘；随后改为逐项
   哈希并成功。
3. 若干定向 `rg` 因无匹配返回 exit 1；没有据此扩大搜索或改变结论。
4. 本轮共有 16 次误把 `shell` 写成 `bash` 的调用。其中 14 次返回
   `Bash/E_ACCESS_DENIED`，2 次返回 MXC “packaged `bash.exe` cannot be launched”
   错误。所有 16 次都在预执行阶段失败，没有启动 Bash、没有读取或写入，也没有据此
   扩权。之后成功命令均恢复指定原生 pwsh。
5. 没有其他非零运行态结果；本执行者没有执行 Node/Vitest 等命令。

## 交回判定

`CONFIRMED_FAILURE_BOUNDARY_PRE_SEMANTICS`

`CONFIRMED_PROJECT_COMPOSITION_DIVERGENCE`

`EXACT_RESOLVER_LEAF_UNRESOLVED`

`NO_PRODUCT_OR_TEST_CHANGE`

`ROOT_DIAGNOSTIC_REQUIRED_BEFORE_SAFE_FIX`
