# A 线交回：T31 native Client 类型与 Host 元数据构建对齐

交回时间：2026-10-26  
执行令：`D:\Lawbeach\lawbench-coord\T31-native-client-type-build-order-20261026-053749.md`  
工作树：`D:\Lawbeach\lawbench-A`

## 结论

执行令允许的有界修改已实际写入：目标 native Client 类型、第六个 P-29 补丁、P-29 台账、
私有构建辅助、固定 pin 和 README 均已完成。正式交回以本文件落盘为准。

作者没有运行 build、tsc、Vitest、补丁 apply/check、GUI、HTTP、网络、模型、prepare、打包或安装；
因此本交回不声称源码诊断已转绿、构建已通过或 T31 已可用。留给 root 的下一步是先独立核对类型擦除、
补丁前序及固定输入，再明确批准唯一一次新的私有构建以实际执行 Client 诊断。

## 既有状态与失败事实

root 第三次真实构建证据：

- `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-build-20261026-053209\result.json`
- `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-build-20261026-053209\stderr.txt`

实际结果：退出码 1、耗时 10.86 秒、无 `manifest.json`、无 GUI/打包。报错为
`packages/api/session-controller/src/client/transport.ts:127:3` 的 TS2322：构造器推断的
`RemoteSnapshotStream<SessionControlFrame, SessionControlFrame>` 不能赋给
`SessionControlStream = RemoteSnapshotStream<SessionControlBaselineFrame, SessionControlDeltaFrame>`，
两条 `options.isSnapshot` 类型谓词不相容。

修改前已按令给出的
`before-native-client-types-20261026-053749\dsh\packages\api\session-controller\src\client\transport.ts`
核对：其 SHA-256 为
`843cc49eedda548abc9261342f7f97acfe643b083d1b1c44c804405d1a76b90d`，与 A 工作树原文件逐字一致。

## 实际写入

1. `D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\src\client\transport.ts`

只改第 127 行：

```diff
-  return new RemoteSnapshotStream(stream, {
+  return new RemoteSnapshotStream<SessionControlBaselineFrame, SessionControlDeltaFrame>(stream, {
```

与快照前文件逐行比较，差异数仍是 2（同一旧行/新行），没有新增 `as`、`unknown`、`any`、
`@ts-ignore` 或诊断放宽。文件中原有的一处 `as unknown as` 未改动。修改后文件 SHA-256：
`a3c5886db9b10a357a2026278ed88884600fcdb1bac3b78e4ff9c2151cefd5ac`。

2. `D:\Lawbeach\lawbench-A\dsh-patches\P-29-session-control-stream-type-arguments.patch`

新文件仅含上述一个 hunk，路径相对 `dsh`，以前述快照源文件为前序。SHA-256：
`5a146f11b743f69c8b382b1d28420b55a13ba06e84f1fe6bec4d3f5f1324ce73`。

`dsh-patches\PATCHES.md` 只在应用命令和 P-29 台账末尾追加第六项，没有改写旧失败或旧补丁历史。
原五个 P-29 补丁重新逐个做 SHA-256 只读核对，均与既有 pin 一致：

- scope：`e76c9c520b567d7aef47a7ee16fcff403a35d5913e52219375126bbeef09991a`
- ordering：`9187cbe653f8b86488c9a29c4813de391a71022f053337b25de2db7276bd0012`
- scope-test：`6a9f60203b41fe454d881cc05704b4e57d9009da49e595d6e194cbc3f6c52da1`
- failure-cleanup：`28f174027664a20da6fa07370460ab17b3c94032426d4dd5d88ff1f0311cb169`
- native-claimed-request-idempotency：
  `d3527b61841a596c66293f3ecbd42973ef4b74045eaa34779d3de11afbc7f862`

更新后台账 SHA-256：
`f488f59084d4402ede036f163e17ff1b1186b0e3541c5f76a8c0b4918e601a0a`。

3. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs`

`materializeSessionTypert()` 现在先直接导入固定生成器的 `lib\types\analyzer.js`，用真实
`WorkspaceAnalyzer` API 执行：

```js
new WorkspaceAnalyzer({
  root: join(REPO_ROOT, 'dsh'),
  packages: [SESSION_CONTROLLER_PACKAGE_ID],
  faces: ['client'],
  checkDiagnostics: true,
  mode: 'check',
}).analyze()
```

并断言恰好返回一个 Client face，且其中包含精确的 session-controller 包。此段无发射、无源码写入。
随后只调用：

```js
generator.generate([SESSION_CONTROLLER_PACKAGE_ID], ['host'])
```

保留 exactly-one Host、Remote 必须存在、package/face、五个固定输出、provider/source-module/output
检查及其他构建代码。原 `['host', 'client']` 生成调用已不存在；不是删除 Client face 或关闭诊断来隐藏错误。
SHA-256：`522a17fcfe7ce824d263b64652e7e6016a616026289a8b36ca702c3745fdbc3f`。

4. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs`

仅更新允许的固定输入：

- `session-controller-source`：34 files、337,178 bytes、
  `db0e5c6419f98fc90feca6b6dd6b66c2e42419dcfd28966d1210e698a21ee7bc`
- `PATCHES.md` reference pin：
  `f488f59084d4402ede036f163e17ff1b1186b0e3541c5f76a8c0b4918e601a0a`
- 新第六补丁 literal pin：
  `5a146f11b743f69c8b382b1d28420b55a13ba06e84f1fe6bec4d3f5f1324ce73`

树摘要使用与现有 `TREE_DIGEST_ALGORITHM` 一致的实际 TAB、POSIX 相对路径、UTF-8 ordinal
排序和 LF，加末尾 LF；用两种只读 PowerShell 计算写法复核一致。其他文件 pin、18 个树 pin、
root、allowlist、动态接受策略均未改。SHA-256：
`0ac79a990da674d4eefe35cf5862118c645943a38be16202e02ba41b99bc53ac`。

5. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\README.md`

只在末尾追加第 10 节，记录第三次 root 失败、精确类型根因、一行源码修正、第六补丁、Client
check-only 分析与 Host-only 发射、固定 hash、未验证边界；前两次失败记录未改写。SHA-256：
`77a74d5b07f9732f6c2cda78bab6438afbe395c0b6543e29643ca81e991a22dd`。

6. 本正式交回件：
`D:\Lawbeach\lawbench-coord\A-handback-T31-native-client-type-build-20261026-053749.md`

## 只读 Git 与 dirty 保全

全部 Git 操作均为只读。没有执行 add、commit、rebase、stash、reset、clean、checkout、push 或
`git apply`，没有暂存、改锁、扩权、改 ACL/审批/沙箱或拆 writer 锁。没有修改子模块指针，也没有
把 Git 写入当作交付条件。

`git status --short --branch --ignore-submodules=all` 可见 A 树原有大量 tracked/untracked dirty；
这些内容均保留。对 `dsh` 子模块的普通状态查询被工作树路径权限拒绝，错误为：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

该拒绝按令记录为 Git 阻碍，不是本交付需要修复的代码或交付阻碍。目标 `transport.ts` 则在修改前与
指定快照源文件做了逐字 SHA/逐行比较，修改后再次比较，证明实际源码差异只有允许的一行。

## 未执行与剩余限制

- 未运行作者 build/tsc/Vitest/pytest/collect/parser/transpile/selftest/prepare/serve/probe/GUI/HTTP/
  model/API/network/install。
- 未执行 Git apply/check，尚未由本作者证明新补丁能在前序上应用；补丁文本与快照前源文件已静态核对。
- 未证明类型擦除后的 JavaScript 运行代码逐字相同，未证明修正后的 Client TypeScript 诊断已经通过。
- 没有新的私有输出、`manifest.json`、GUI 或打包产物；第三次失败的部分输出原样保留。
- 未触碰其他产品源码、契约、T 树/E50、resolver/guard、PDF/global API、密钥、权限、真实案卷或
  `.env.local`；没有激活生产凭据或执行 packaging/merge/push/deploy/Actions。

root 仍负责独立复核并决定是否批准唯一一次新的私有构建。只有实际构建通过后才能讨论源码构建层面；
它仍不等于 GUI、T31 导入批次或打包通过。
