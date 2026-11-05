# A 交回：T31 Scope HTTP Consumer Amend

状态：`SOURCE_ONLY_AMENDED / NOT_RUN`

执行边界：只改本令允许的 `dsh-ext/tests/t31-native-scope-http.spec.ts`，并写本交回件。未修改产品、native、schema、patch、config、loader、B 证据或其他冻结文件；未运行测试、tsc、parser、Vitest、pytest、collect、build、prepare、serve、probe、HTTP、GUI 或模型。

## 实际修改

- 删除三个不必要的 fixture/source 导入：`sessionWorld`、core 源码的 `SessionId`、`RemoteMock`。这消除了把 Host fixture、源码声明和 built-lib 声明同时拉入 consumer 的 7 条类型诊断。
- 从真实 native client 的 `client/sessions/remotes.ts` 以 `import type` 引入 `SessionRemotes`；固定合成 UUID 使用 `ConstructorParameters<typeof NativeSession>[0]` 的精确品牌类型。没有 `any`、`unknown` 类型绕行、`ts-ignore`、import loader、alias、symlink 或安装动作。
- 新增只供真实 `NativeSession` 构造使用、但不承载任何 RPC 的 typed `Proxy<SessionRemotes>`。任何远端属性读取都会先计数并抛错；构造、同步 `beginSubmission` 后及 `dispose` 后均断言访问数为 0。没有伪造 Host RPC、业务响应、history、turns 或 streams。
- 保留实际 `Session as NativeSession` 源导入、真实构造函数、真实 `beginSubmission`、原生 UUID request id、pending echo、`abandon()` 与 `dispose()`。没有 stub/replace `beginSubmission` 或调用替代 UUID。
- 删除已不适用于 inert remote 的 mock stream bookkeeping 和 `assertNoUnmatched()`，以严格 `remoteAccesses === 0` 断言替代。
- `final.fixture_copy` 改为真实 `_file_identity` 形状：`bytes: 47379`、固定 `sha256: feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`；不再使用 manifest 的 `copy_bytes`/`copy_sha256`，也不再只校验十六进制形状。
- 协议计数改为实际整数：`material_list_ok: 1`、`scope_prepare_ok: 2`、`begin_ok: 1`。其余已验证布尔标志保持 `true`。

## 保留的 consumer 断言

- 健康检查、Bearer 认证、case open/import/list、精确三材料清单与 native material id 保持不变。
- Host `requestScope prepare` 的首次与 replay 严格参数及相等结果保持不变。
- Core `task/begin` 的首次与 replay 严格相等、`route: local`、`skill: null`、精确 material request scope 与 material hash 归因保持不变。
- 文件只读快照、材料索引与副本、task/result/reads/request-scope 持久化身份、context 外部材料排除、四项工具顺序、实际 native denial HTTP 200、最终清理与凭证 getter 零调用路径保持不变。
- 没有增加 save、模型、OCR 或额外 HTTP 动作。

## 文件指纹

- 修改前：`dsh-ext/tests/t31-native-scope-http.spec.ts`
  - SHA-256：`9862d3fc63b019364bc00a0c5f62bd291671491051d4f3a0564ed5ac208de2a3`
  - 行数：777
  - 只读快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\A-before-http-consumer-amend-20261026-040724\t31-native-scope-http.spec.ts`
- 修改后：`dsh-ext/tests/t31-native-scope-http.spec.ts`
  - SHA-256：`055d65ba57fa6e625fcc59d44a791c76c58f3e2889d65adf9aa11edc15b69eb1`
  - 行数：784
- 只读对照：修改前后差异仅为本交回件第“实际修改”节列出的 import、typed inert seam、零访问断言、fixture identity 和三个整数计数。

## 证据复用与只读检查

- 复用根类型日志 `A-http-consumer-types-20261026-040516\stdout.txt`，不重跑；其 7 条诊断与移除的三个 fixture/source 导入及新 `SessionRemotes` 缺口一致。
- B 安全入口 `server.py` 当前 SHA-256 为 `0938e78ccfc3fa73d1e03cec99c5cdc6374c0abc78601a20c6662d22814ebf11`，与执行令一致。
- frozen lifecycle 当前 SHA-256 与执行前快照均为 `8dbdd93982225e96ec4ed858cb1a7a6a7d9a903acd7983cb2da2ea6246e4202c`，5/5 文件未改。
- B 的 `README.md` 与 `prepared.json` 只读确认固定 JPEG 为 `47379` 字节、SHA-256 为 `feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`；计数实际实现位于 `server.py`。

## Git 与 dirty 保全

- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；未暂存、未提交，因此没有交付提交 SHA。
- 初始和最终均使用只读 status。普通 status 因
  `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而失败；改用 `--ignore-submodules=all` 成功记录现有 dirty。该权限问题未修复、未扩权、未改 ACL。
- 目标测试原本就是 untracked；其 dirty 状态被保留并只在允许文件内修订。没有改动 index、index.lock、writer 锁或审批/沙箱设置。

## 阻碍与偏离

- 有一次只读 `rg` 检索误选了非 PowerShell shell 入口，环境立即以 `E_ACCESSDENIED` 拒绝，未执行检索、未写文件。之后全部命令均使用指定的原生 PowerShell、`login=false`。
- 当前 B 准备目录只有 `prepared.json` 和输入文件，尚无 `final-metadata.json`；本交回不以推测文件替代该运行产物。

## 剩余缺口

本交回完成的是实际 consumer 源码修订与正式文件回交，不代表编译、运行时或 T31 全链通过。仍需 root 在全量交接后先跑 consumer 类型检查，确认 source-only 修改消除 7 条诊断及可能的 ext concrete runtime resolution，再按既有准备根执行一次有限 HTTP。有限 HTTP 后应验证真实 final metadata 的 `fixture_copy.bytes/sha256` 与 `material_list_ok/scope_prepare_ok/begin_ok = 1/2/1`，并确认全部原有协议、范围和清理断言。
