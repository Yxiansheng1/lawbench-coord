# A 交回：T31 原生 fixture 装配与 P29 第四补丁修复

状态：令范围内两处有界修改已完成并落盘；未运行测试、构建或补丁检查，不作实际 claim 窗口或补丁重放的 PASS 结论。等待 GPT 主编排独立执行与定谳。

## 1. 执行入口与根证据

- 正式执行令：`D:\Lawbeach\lawbench-coord\T31-A-native-fixture-patch-fix-Order-20261026-025909.md`
- 已读根 stdout/stderr、`A-patch-chain-AMEND.md`、`A-P29-main-check-result.json` 和上一份正式交回。
- 根日志显示该测试文件为 `0 test`，失败发生在导入阶段：`assembly/index.ts` 急切导出 `bundle-roster.ts`，后者无法从当前工作区解析 `@deepseek-ai/dsh-web-app`。这不是 claim 断言或产品代码红。
- 根 P29 结果以真实先导快照执行只读 `git apply --check --whitespace=error-all`，第四补丁在 service spec 旧第 932 行上下文失败。
- 本单没有重演开工、安装、调研、全量测试或旧任务，没有联系其他聊天，也没有更换 API。

## 2. 目标 1：原生身份测试只修装配

唯一修改的测试文件：

```text
D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-native-request-identity.client.spec.ts
```

修改范围仅是运行时装配入口：

- 不再从 `assembly/index.ts` 导入，从而不再急切加载 `bundle-roster.ts`。
- `createClientTest` 改为直接导入 `src/assembly/vitest.ts`。
- `ClientRoster` 改为从既有显式 API `src/assembly/roster.ts` 导入。
- `sessionBench.client.ts` 的 assembly import 本身是 type-only，运行时会擦除，未作改动。

`ClientRoster.of` 的三行按实际 web profile 的 base 后 web composition 顺序声明，并只取 Gateway 的依赖闭包：

| 行 | 实际 `dsh.client` 声明 |
|---|---|
| `@deepseek-ai/dsh-typert-registry` | `inject: []`, `immediately: true` |
| `@deepseek-ai/dsh-api-gateway` | `inject: [registry, client-connection]`, `immediately: true` |
| `@deepseek-ai/dsh-client-connection` | `inject: []`, `immediately: true` |

实际读取的 shell platform seeds 为：

```text
react, react/jsx-runtime, react-dom, react-dom/client, @deepseek-ai/cordis,
@deepseek-ai/dsh-client-store, @deepseek-ai/dsh-client-ui-slots,
@deepseek-ai/dsh-client-ui-primitives, @deepseek-ai/dsh-client-ui-dockkit
```

这些 seed 由 shell 平台表提供，`ClientRoster.closure()` 遇到它们即停止，不需要伪造成插件 roster 行。没有新增 bundle reader、配置、symlink、复制包或全局环境修改。

四个既有测试及其严格断言全部保留，没有改正文：

1. 两个原生 UUIDv4 R 分别进入真实 inbox，并由两次真实 `claim('next-turn', turn)` 一一取走。
2. claim 后、`user/message` admission 前的同 R 重放不得重新排队、增加 history 或再次 claim。
3. 无 batch steer R 经真实 controller 进入 `next-step`，claim 后 `source.rpcId` 保持同一个 R。
4. 本地 admission 首次失败后同 R 可重试，且不产生 attempt/history。

真实 `Session.beginSubmission()`、`Session.prompt()`、Gateway Remote、`SessionCommandController`、`ReactLoopInbox`、claim、`source.rpcId` 均保留。既有的无模型 Agent 窄 fixture 只负责把 controller 生成的消息交给真实 inbox，没有替换这些原生链路组件，也没有合成 history、rollout、attempt 或 user event。

## 3. 目标 2：第四补丁按真实先导源码重建

只读比对确认，根证据目录：

```text
C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\A-P29-main-check
```

与：

```text
C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247\author-final\dsh
```

中的 4 个先导文件逐字节一致。当前 A 树相对该先导态只多出第四步的真实输出：`src/client/apply.ts` 与 `tests/service-orchestration.client.spec.ts`；`src/client/index.ts` 和 `src/client/service.ts` 与先导态相同。

先导 SHA256：

```text
12944BE5ABA7859DB9F2D1B7C079979460F735B75473781439057E33B14020A2  src/client/apply.ts
7AAA12F5DC0D1E7CE895896317D5C296CAA565AC7D3FCD7E0D545CC57F323231  src/client/index.ts
CED6F86AFDE441A996B8CA8C1E2594C9E934BB2549239AF67336853960171825  src/client/service.ts
BD9E35E4C8D0625535B88FE98A16582F7BE2B5C1D7365D71E9B0FB5F3A83156B  tests/service-orchestration.client.spec.ts
```

当前最终源码保持未改，SHA256 为：

```text
4339BAAF4A2D07B955C4B783D115B20A2AF2D6A621DA5C651F3A8952A42F2447  src/client/apply.ts
7AAA12F5DC0D1E7CE895896317D5C296CAA565AC7D3FCD7E0D545CC57F323231  src/client/index.ts
CED6F86AFDE441A996B8CA8C1E2594C9E934BB2549239AF67336853960171825  src/client/service.ts
C1F3B208106E714FD238248689A3B2AAB11EEE7710115BFFE18686A9D5606579  tests/service-orchestration.client.spec.ts
```

第四补丁 `dsh-patches\P-29-request-submission-failure-cleanup.patch` 已按上述真实先导文件与当前最终源码重建：

- `apply.ts` hunk 保持真实先导的 `@@ -216,15 +216,39 @@` 上下文。
- service spec 顶部 hunk 改为真实先导的 `@@ -7,15 +7,20 @@`，补回 `stubConfigForm` 的 import 变化。
- 末端 hunk 改为真实先导的 `@@ -929,3 +934,203 @@`，保留 `await b.runtime.dispose()`、两层 `})` 和随后新增块；不再把旧第 932 行及额外 EOF 空行当上下文。
- 两个文件的全部 hunk 已与真实先导到当前源码的直接只读差分逐行一致。该静态比对不是 `git apply --check`，不是补丁重放，也不是 PASS 结论。

前三补丁未改、未重排，SHA256 保持：

```text
9187CBE653F8B86488C9A29C4813DE391A71022F053337B25DE2DB7276BD0012  P-29-request-submission-ordering.patch
E76C9C520B567D7AEF47A7EE16FCFF403A35D5913E52219375126BBEEF09991A  P-29-request-submission-scope.patch
6A9F60203B41FE454D881CC05704B4E57D9009DA49E595D6E194CBC3F6C52DA1  P-29-request-submission-scope-test.patch
```

`PATCHES.md` 现有第四补丁说明仍与实际范围相符，本单未改。

## 4. 验证边界

按令，以下均未运行：

- Vitest、tsc、pytest、unittest、collect 或 parser；
- patch apply/apply-check、rebase 或任何临时镜像自测；
- build、prepare、serve、probe、HTTP、GUI 或模型调用；
- 全量测试、安装、环境配置或权限/ACL/锁修改。

主编排应独立执行正式令指定的四测试目标，并对真实前三步输出按固定顺序执行第四补丁的独立重放/检查。当前静态装配闭包不代替实际启动结果；若仍有其他真实 assembly dependency 缺失，应报告确切包名，不得以 stub、复制包或弱化断言处理。

## 5. 文件与哈希

```text
6EDAC6FCE7E9E1DD6A9B41F53D8DA9982F965402AF2ED8755594D6F4065D8343  dsh\packages\api\session-controller\tests\t31-native-request-identity.client.spec.ts
28F174027664A20DA6FA07370460AB17B3C94032426D4DD5D88FF1F0311CB169  dsh-patches\P-29-request-submission-failure-cleanup.patch
```

测试文件 333 行、13951 bytes；补丁 275 行、13035 bytes。

## 6. Git、dirty 与操作偏差

- Git 严格只读；未执行 add、commit、rebase、stash、reset、clean、checkout、push，也未暂存任何文件。
- 开工前后保留 A 主树既有 modified/untracked；只写正式令允许的新测试、第四补丁和本交回文件。
- `git --no-optional-locks -C dsh status --short --ignore-submodules=all` 仍被运行器拒绝：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
```

未修权限、ACL、index.lock 或隔离；该只读状态阻碍不影响文件交付，但本线无法提供 `dsh` 子模块 Git status/diff 证明，主编排应以其可见工作树复核。

- 操作偏差一次：一个只读核对命令误填 `shell=bash`，运行器在启动前以 `Bash/E_ACCESSDENIED` 拒绝；命令未执行、未写文件、未改变仓库。其余命令均显式使用 `shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false`。
- 本单没有提交 SHA；交付以两个授权文件落盘及本交回为准。

## 7. 结论与主编排下一步

本线已完成 fixture 装配修复和第四补丁的源码一致性返修，没有修改产品/native、公共 schema、其它测试、P29 前三补丁或 `PATCHES.md`。当前不能宣称测试、claim 窗口或补丁链通过；最终结论由主编排独立执行四测试及 P29 重放后作出。
