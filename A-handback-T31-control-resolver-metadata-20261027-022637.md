# A 线交回：T31 control resolver metadata

状态：`A_DELIVERABLE_READY / AUTHOR_RUNTIME_NOT_RUN / ROOT_REVIEW_AND_SINGLE_RUN_REQUIRED`

正式执行令：
`D:/Lawbeach/lawbench-coord/T31-control-resolver-metadata-order-20261027-022637.md`

本交回只涵盖一次有限 resolver metadata 诊断的作者产物。没有修改产品、测试、
fixture、配置、生成物、运行时、P29、guard、fs allow、`safeModulePaths` 或旧证据；
没有执行 Node、Python、Vitest、tsc、parser、AST、payload import、collect、list、
prepare、serve、probe、HTTP、GUI、model、build 或 install。

## 结论先行

可以进入 root 的源码复核和唯一一次实际诊断。产物把 native-control 与
accepted-extension 两个上下文按固定顺序初始化，只记录执行令白名单内的配置和
`resolveId` / module graph / file-loading 元数据，然后分别 `await ctx.close()`。

作者没有运行诊断，因此当前仍无新的运行结论。`EXACT_RESOLVER_LEAF_UNRESOLVED`、
`GUI_NOT_VERIFIED` 与 `Packaging_HOLD` 均未改变。

## 新增物

1. `D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlResolverMetadata-20261027-022637/diagnose.mjs`
   - 14,171 bytes
   - SHA-256 `8deb7b32e63007069cb20fac13c850022324d39519c4c2df0c23321190074506`
2. `D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlResolverMetadata-20261027-022637/README.md`
   - 4,625 bytes
   - SHA-256 `aeaef30d1fcbf9a7ab64f87477e2bd576170265eacf233b6ec27cb0c49b45376`
3. 本交回件

唯一 A 树写面是执行令指定的新证据目录，共两个新文件。协调目录唯一写面是
本交回件。

## 脚本边界

- 使用两个字面绝对 file URL 动态导入实际安装模块：
  `dsh/node_modules/vitest/dist/node.js` 的 `createVitest`，及固定 pnpm Vite
  路径的 `isFileLoadingAllowed`。
- 固定检查两份配置和三份生成输入；API 初始化前检查一次，整个流程结束后再次检查
  bytes/size、SHA-256 与 `mtimeMs`。
- 两个实际 cwd 在配置加载前只做四个 `.env*` 文件的存在性守卫。没有从 A 根目录
  启动，没有读取任何 dotenv 内容。
- 只记录白名单字段；固定 host/remote 各自记录许可/safe-path 前后值、
  `resolveId` 的 `id/external`、`ensureEntryFromUrl` 的 `id/file/url` 和错误链。
- 不执行 module runner、payload import/evaluation、transform/load、测试、global
  setup、HTTP/WS/listen。
- 安全覆盖仅限 `api:false`、`watch:false`、`run:true`、browser disabled，及 Vite
  `middlewareMode:true`、`watch:null`、`open:false`、`hmr:false`、`ws:false`；
  root、plugins、aliases、`server.fs`、`safeModulePaths` 未被改写。
- 两个上下文均在 `finally` 中等待 `ctx.close()`，并各自恢复原 cwd；顶层也做一次
  cwd 恢复和固定输入后检。
- 失败时保留 structured partial row、close/cwd 状态并令 `process.exitCode=1`；
  成功只表示元数据已收集且已关闭，不表示测试或产品通过。

README 已给出 root 一次性命令：清空代理/凭据环境，隔离 HOME/TEMP/AppData，
从 `dsh-ext` 启动，stdout/stderr 分别落到指定 root output 目录，且不清理用户文件。

## 固定输入后检

以下均由作者只读哈希确认，未变化：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| native config | 1,607 | `ab29a362524b3cc78e7ff1ad5afcf29d95e192d63b48eda94c958021701eb006` |
| accepted config | 807 | `7991869596676b1e6f6fecf8f2cb3493d72051e74aff36792cabfe8be2b3940f` |
| manifest | 58,186 | `1b17847630e5ef9b8367b8aca37d3cb025eac64db0b6c8be802f84e076ff16ae` |
| `typert.host.js` | 158,754 | `a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12` |
| `typert.remote-client.js` | 59,116 | `e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630` |

作者静态检查结果：

- 禁区调用扫描为空：`start/run/collect/globalsetup/transformRequest/ssrLoadModule/moduleRunner/listen/safeModulePaths.add` 均未出现。
- 动态 import 只有两处，目标为执行令指定的 Vitest/Vite 安装模块；其余四行为
  Node 内建模块静态导入。
- 花括号 111/111、圆括号 149/149；稳定 marker 一次。
- 这是纯文本/哈希检查，不是 JavaScript 语法解析或运行验证。

## Git 与 dirty 保全

- 第一个工具只读正式执行令。
- 普通 `git status --short --branch` 退出 1：
  `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied`。
  这是既有共享 worktree 子模块权限阻碍；没有修锁、ACL、审批、沙箱或 writer lock。
- 改用只读 `git --no-optional-locks status --short --branch --ignore-submodules=all`
  成功，`line-A...origin/line-A [ahead 93, behind 1]`，原有 dirty/untracked 均保全。
- 最终指定路径状态只显示本目录两个新文件。全程没有
  `git add/commit/rebase/stash/reset/clean/checkout/push`，没有暂存。
- 对协调目录做最终只读状态探测时返回 `fatal: not a git repository`；该目录只是
  文件交回层，不是 Git 仓库，不是交付阻碍。
- 本任务无提交 SHA。交回方式是按令写本协调目录文件。

## 实际命令与非零披露

所有命令行工具调用均使用：

```text
C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe
login=false
```

作者实际执行的任务命令如下（重复的定向读取按同一行归并）：

1. 只读执行令：`Get-Content -LiteralPath 'D:/Lawbeach/lawbench-coord/T31-control-resolver-metadata-order-20261027-022637.md' -Raw`。
2. 只读工作树：普通 `git status --short --branch`；随后 `git status --short --branch --ignore-submodules=all`；最终 A 树 `git --no-optional-locks status --short --branch --ignore-submodules=all --untracked-files=all -- 'docs/plan/evidence/T31/ControlResolverMetadata-20261027-022637'`；协调目录同名 scoped status 探测。
3. 只读目录：`Get-ChildItem` 检查 T31 既有证据、root output 目录、目标新目录及最终两个文件。
4. 只读输入：`Get-Content` 读取两份新 selector、material-admission/scope-http 继承配置、fixture 的 `loadControlCodecs` 区段、`root-static-review.json`、`fixed-inputs.json`、runner stderr 与 C 线 findings。
5. 只读 API 形状：对实际安装 Vitest `node.js`/`node.d.ts`、`cli-api.BfdDOPPI.js` 及 Vite `index.js`/`index.d.ts` 执行定向 `rg`；读取 `createVitest`、`TestProject`、`close()`、`safeModulePaths`、`resolveId`、`ensureEntryFromUrl` 的相邻源码/类型；`rg --files ... | rg '\.d\.ts$'` 列出公开类型文件。
6. 只读哈希：PowerShell `Get-Item` + `Get-FileHash -Algorithm SHA256` 检查五份固定输入，并在产物写完后重查五份固定输入和两个新文件。
7. 唯一允许写入：`New-Item -ItemType Directory` 创建指定新证据目录；`apply_patch` 新增 `diagnose.mjs`、`README.md` 和本交回件。
8. 静态检查：`Select-String` 扫描 marker、绝对 API 导入、禁区调用；PowerShell 正则统计花括号/圆括号/import 数量。

非零记录：

1. 初始普通 Git 状态：exit 1，原因见上。
2. 一次公开类型定向 `rg` 无匹配：exit 1；未扩大搜索。
3. 一次 `rg` 查找 `VitestOptions` 无匹配：exit 1；改用已确认的公开签名。
4. 一次 `Get-Item` 同时探测尚不存在的目标目录/交回件：exit 1，符合预期。
5. 有 4 次工具调用的 `shell` 参数被误填为 `bash`。四次都在预执行阶段返回
   `Bash/E_ACCESS_DENIED`，没有启动 Bash、没有读写、没有调用命令；随后均以指定
   原生 pwsh 重跑了对应只读检查。没有切 legacy、改审批或改沙箱。
6. 协调目录 scoped `git status`：exit 1，`fatal: not a git repository`；该目录不是
   Git 仓库，未尝试任何绕行或 Git 写入。
7. 作者没有运行诊断或测试，因此本文件没有新的 runtime exit code。

## Root 下一步

1. 完整审查两个新文件的源码和 README 命令。
2. 若通过，只执行 README 中一次受控诊断；stdout/stderr 分开保存到指定 root output。
3. 先确认 runner 的 stdout 含单行 `T31_RESOLVER_METADATA`，再判读两端 resolved
   config、许可/safe-path 前后值、`resolveId` 与 module graph 叶子。
4. 不以诊断成功宣称测试、产品语义、GUI 或打包通过；不改安全边界去求绿。
