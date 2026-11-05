# A 线交回：T31 esbuild plugin filter 字面量修正

**状态：有界修改完成，静态证据齐全，待 root 独立审计。没有执行作者构建；Package/Installer/Merge/Push/Deploy/Git 写入均为 HOLD。**

## 结论

root 已授权的唯一一次私有开发构建在创建部分输出后被 esbuild 拒绝，真实退出码为 1，耗时 1.016 秒：

```text
[lawbench-contracts-fixed] "onResolve" filter is not a valid Go regular expression: "(?u)^lawbench:contracts$"
```

按正式执行令，本次只从 `build-private.mjs` 的两个 esbuild plugin filter 移除不兼容的 `/u`：

```diff
- filter: /^lawbench:contracts$/u
+ filter: /^lawbench:contracts$/
- filter: /.*/u
+ filter: /.*/
```

原始 `dsh-ext/scripts/build.mjs` 的对应 filter 没有 `u` 标志。除上述两个字面量外，源码、输出集合、固定哈希、断言、metadata、typecheck 与 native 逻辑均未改动。

## 修改清单

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs`
  - 仅移除上述两个 filter 的 `/u`。
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\README.md`
  - 仅在第 8 节追加 root 的真实失败、原因和两项修正，不重写历史内容。
- `D:\Lawbeach\lawbench-coord\A-handback-T31-esbuild-filter-fix-20261026-051710.md`
  - 本正式交回件。

## 精确性证据

- 失败前 `build-private.mjs` SHA-256：`66f122273e5c13eb5996b147041684816a5ea2f8c05fb7af0c3935bb32dcee63`
- 修正后 `build-private.mjs` SHA-256：`9f5d2f5a791c22465a2424883bc406335686986f2eb2861ec629b6b7f1c71b17`
- 静态计数：新 `filter: /^lawbench:contracts$/` 为 1 次，新 `filter: /.*/` 为 1 次；两项带 `/u` 的旧字面量均为 0 次。
- 内存反向替换证明：把两处新字面量在原文件文本中分别还原为带 `/u` 的旧字面量后，计算 SHA-256 得到 `66f122273e5c13eb5996b147041684816a5ea2f8c05fb7af0c3935bb32dcee63`，与失败前哈希完全一致。该检查没有写临时文件。
- `build-config.mjs` SHA-256：`d4cde00714221b47e1475faa2e3e58ce5888c8f9bdeabf2e000a4a4711751650`，与执行令要求一致。

## 复用的原始证据

- root 构建结果：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-build-20261026-051541\result.json`
- root 标准错误：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeAdmission-20261026-043910\root-build-20261026-051541\stderr.txt`
- 失败时部分输出：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-051541`

上述 partial 输出仍存在，没有删除、覆盖或复用。

## 本次实际执行与禁区

本次只进行了只读状态核对、读取执行令与既有证据、上述文件修改、文件哈希与内存反向替换证明。

没有执行 build、Vitest、tsc、pytest、collect、parser、selftest、prepare、serve、probe、GUI、HTTP、模型/API、网络或安装。没有更改算法、工具链或检查。没有触碰真实案卷、`.env.local`、Keyring、凭据或全局设置。没有修改权限、审批、ACL、沙箱或锁，没有拆除 writer 锁。

Git 保持严格只读：没有 add、commit、rebase、stash、reset、clean、checkout 或 push。由于当前运行器边界，本次没有提交 SHA。首次 `git status --short --branch` 因嵌套子模块路径 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 权限拒绝而以退出码 1 结束；随后仅使用 `--ignore-submodules=all` 做只读状态核对，确认并保留既有 dirty 内容。没有尝试修复该权限阻碍。

## root 下一步

1. 独立审计上述两个字面量的精确差异及 README 追加内容。
2. 若认可，另行明确批准是否进行一次新的私有开发构建；本次交回不包含任何重试。
3. 在 root 另有决定前，Packaging 保持 HOLD。
