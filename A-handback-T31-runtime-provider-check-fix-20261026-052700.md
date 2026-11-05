# A 线交回：T31 runtime provider 断言修正

- 工单：`T31-runtime-provider-check-fix-20261026-052700`
- 分支／提交：`line-A` / `a23271abee333a9a256fd46a3141da16975c2380`（本轮未写 Git，无新提交）
- 状态：允许范围内的源码与 README 修正完成；未重建、未运行测试、不是构建或 T31 验收通过
- 交回时间：`2026-10-26T05:29:15.4515144+08:00`

## 1. 改动

1. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs`

   仅替换一个断言字面量：

   ```diff
   -  assertMarker(join(lib, 'client.js'), 'conversationSubmission:')
   +  assertMarker(join(lib, 'client.js'), 'ctx.provide("conversationSubmission",')
   ```

   原有通用 `conversationSubmission` marker、`sourceModules` 检查及其他 source/pins/native logic/outputsets/metadata/checks 均保留。

2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\README.md`

   末尾新增第 9 节，记录 root 的 exit 1／2.547 秒实际构建、产物证据、类型声明被擦除与运行时 provider 注册的区别，以及本次只改断言的理由。

3. `D:\Lawbeach\lawbench-coord\A-handback-T31-runtime-provider-check-fix-20261026-052700.md`

   本交回件。除此之外未修改其他文件。

## 2. 既有证据与根因

- root 实际运行目录：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-build-20261026-052320`
- `result.json`：`exit_code=1`，`elapsed_s=2.547`；`stderr.txt` 报 `client.js lacks required marker "conversationSubmission:"`。
- 该次构建已实际生成六件 lawbench 插件和 ui-conversation Node/browser 产物，五个 lawbench ESM/Host 检查通过后才命中错误断言；没有 manifest、nativeSessionController 输出或 GUI 验收。
- 实际产物：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-052320\profile-node_modules\@deepseek-ai\dsh-client-ui-conversation\lib\client.js`
- 实际产物 SHA-256：`74f9b21d6a74a9353d512f88599588f76dcc2b7ef2eb5ee832ce5d8e74746557`
- 实际产物第 17900 行含 `ctx.provide("conversationSubmission", { register(hook) { ... }}`。
- `dsh/packages/client/ui-conversation/src/client/index.ts:90` 的 `conversationSubmission:` 是模块增强类型声明，编译时被擦除；运行时 provider 注册位于 `src/client/apply.ts:213`。因此新断言检查实际 Cordis runtime registration，而不是被擦除的类型语法。

## 3. 修改前保全与静态核对

修改前快照目录：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\before-runtime-provider-check-fix-20261026-052700`

修改前核对时，快照与工作区三份文件逐文件 SHA-256 相等：

| 文件 | 修改前 SHA-256 |
| --- | --- |
| `build-private.mjs` | `9f5d2f5a791c22465a2424883bc406335686986f2eb2861ec629b6b7f1c71b17` |
| `build-config.mjs` | `d4cde00714221b47e1475faa2e3e58ce5888c8f9bdeabf2e000a4a4711751650` |
| `README.md` | `2ed871ab5a29eac8aa407cecb26136198915b62f1c0f47ea4dfede18c2e9c3cd` |

修改后 SHA-256：

| 文件 | 修改后 SHA-256 |
| --- | --- |
| `build-private.mjs` | `b92847934271b33f281ba38050903ce34763a9fc1b588451994bb121412f1c01` |
| `build-config.mjs` | `d4cde00714221b47e1475faa2e3e58ce5888c8f9bdeabf2e000a4a4711751650`（未变） |
| `README.md` | `a8a0c3e1cab1ec2c787dce4c7a1ffe0b6f6eecd678c1207b42a2b9ce553c4cfd` |

静态 diff 结果：

- `build-private.mjs` 相对快照只有第 547 行这一处替换。
- `README.md` 相对快照只在原第 177 行后追加第 9 节。
- `build-config.mjs` 哈希与执行令给定值一致且未变。
- 新断言在第 547 行命中一次；旧字面量 `'conversationSubmission:'` 计数为 0；通用 marker 仍在第 432、546 行。

## 4. 验证边界、阻碍与遗留

- 作者本轮没有执行 build、Vitest、tsc、pytest、collect、parser、selftest、prepare、serve、probe、GUI、HTTP、model、API 或 network。
- 没有执行安装，没有改产品／配置／oldlib／E50／resolver／guard／PDF／权限／ACL／沙箱／审批／锁，没有 package、installer、merge、push、deploy 或 Actions。
- Git 全程只读：没有 add、commit、rebase、stash、reset、clean、checkout 或 push；HEAD 仍为 `a23271abee333a9a256fd46a3141da16975c2380`。既有 dirty 原样保留。
- 首次 `git status` 在 `dsh` 子模块报 `Permission denied`；按令未修复、未扩权，改用 `--ignore-submodules=all` 完成主工作树只读核对。该权限拒绝不是交付阻碍。
- 两次只读命令误填 `shell=bash`，均被运行器以 `ACCESS_DENIED` 在执行前拦截，未运行 Bash、未产生文件影响；后续命令均使用指定 PowerShell 完成。
- 失败构建的部分输出 `private-output-20261026-052320` 原样保留，未删除、未复用。是否执行一次新的私有构建由 root 独立审计并另行决定；Packaging 仍为 HOLD。
- 未启用任何私有生产凭据；T50 memory credentials provider 仍应是唯一有效凭据源，本单未触碰 launcher 或凭据交付。
