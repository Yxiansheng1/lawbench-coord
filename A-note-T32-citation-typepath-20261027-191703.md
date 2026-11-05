# A 线注记：T32 稿件出处测试类型路径

## 结论

状态：ONE_BYTE_FIXTURE_FIX_APPLIED；验证：NOT_RUN；打包：HOLD。

本次仅修复新建测试夹具中的类型导入路径：

```text
../ui/session-case.ts'
```

改为：

```text
../ui/session-case.tsx'
```

实际 Shell 为原生 PowerShell，`login=false`。没有使用 Bash，没有安装、渲染、解析、AST/import 检查、Vitest、tsc、pytest、collect、构建、启动服务、探针、HTTP、GUI、模型或 Office 操作。

## 既有状态与真实源文件

- 工作目录：`D:\Lawbeach\lawbench-A`
- 分支：`line-A`
- 只读核对的 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`
- 目标文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\document-citation-navigation.spec.tsx`
- 修改前 Git 状态：`?? dsh-ext/tests/document-citation-navigation.spec.tsx`，即既有未跟踪 dirty 文件。
- 修改前实际字节数：8978
- 修改前实际 SHA-256：`bf167a78a12fe494222a1b18cfc0f2af1dcd2a5d8187d75a3c06abfe1f30d4e0`
- 唯一旧路径命中：第 9 行。
- 实际类型导出源：`D:\Lawbeach\lawbench-A\dsh-ext\ui\session-case.tsx`，大小 2061 字节。
- 同名 `.ts` 源文件不存在：`Test-Path` 返回 `False`。

工作树存在大量其他既有修改和未跟踪文件；均未触碰。没有暂存、提交、rebase、merge、push、stash、reset、clean 或 checkout，也没有修改权限、ACL、锁、沙箱或审批配置。

## 修改后的字节证据

- 修改后实际字节数：8979
- 修改后实际 SHA-256：`6c438973fd59868a9fb5ca596c842c4bf8314e5127a9807b654cfe7bec0114b7`
- `expected.json` 的 after 字节数：8979
- `expected.json` 的 after SHA-256：`6c438973fd59868a9fb5ca596c842c4bf8314e5127a9807b654cfe7bec0114b7`
- 与 `consumer-before.spec.tsx` 的二进制共同前缀：579 字节
- 与 `consumer-before.spec.tsx` 的二进制共同后缀：8399 字节
- 插入位置：零基偏移 579
- 插入字节：十进制 120，十六进制 `0x78`，即 ASCII `x`
- 单字节插入判定：`True`

该判定确认修改前后的差异恰好是一个 ASCII `x`；其他字节及顺序保持不变。没有重演测试来证明此项。

## 命令记录

以下记录覆盖本次执行所使用的正式读取、状态核对、修改和字节核对入口。所有 `exec_command` 均显式使用：

```text
shell=C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
login=false
```

1. 只读正式执行令：`Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32-citation-test-typepath-order-20261027-191703.md'`；退出码 0。
2. 读取 5gate 约束：`Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\.agents\skills\5gate\SKILL.md'`；退出码 0。
3. 并行只读事实与输入：
   - `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\lawbench-关键事实索引-20260928.md'`；退出码 0。
   - `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-A\PROJECT-PROFILE.md'`；退出码 0。
   - `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32CitationTypePathInput-20261027-191703\expected.json'`；退出码 0。
   - `Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32CitationTypePathInput-20261027-191703\consumer-before.spec.tsx'`；退出码 0。
4. `git status --short --untracked-files=all`；退出码 1。Git 在 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 报 `Permission denied`，随后 `git status --porcelain=2` 在该子模块失败。未修复权限或锁，未尝试写 Git。
5. `rg -n -C 8 'T32' 'docs\plan\lawbench-工单集-第一版开发-20260928.md'`；退出码 1，无匹配。改为以本次正式执行令和协调目录输入为唯一接续事实入口。
6. 只读、忽略子模块后的 dirty 核对：`git status --short --untracked-files=all --ignore-submodules=all`；退出码 0。确认工作树存在大量既有修改和未跟踪文件，未清理或改写。
7. 目标文件状态：`git status --short --ignore-submodules=all -- 'dsh-ext/tests/document-citation-navigation.spec.tsx'`；退出码 0，输出 `?? dsh-ext/tests/document-citation-navigation.spec.tsx`。
8. 唯一旧路径命中：`rg -n -F "../ui/session-case.ts'" 'dsh-ext\tests\document-citation-navigation.spec.tsx'`；退出码 0，仅第 9 行。
9. 修改前摘要与长度：`Get-FileHash -Algorithm SHA256` 加 `Get-Item().Length`；退出码 0，得到 8978 字节及上述 before SHA。
10. 真实源文件核对：`Get-Item -LiteralPath '...\dsh-ext\ui\session-case.tsx'` 与 `Test-Path -LiteralPath '...\dsh-ext\ui\session-case.ts'`；退出码 0，`.tsx` 存在，`.ts` 返回 `False`。
11. 只读分支与 HEAD：`git rev-parse --abbrev-ref HEAD` 与 `git rev-parse HEAD`；退出码 0，得到 `line-A` 和 `a23271abee333a9a256fd46a3141da16975c2380`。
12. 文件修改：`apply_patch` 仅替换第 9 行中的一个 ASCII 字节，把 `session-case.ts'` 改为 `session-case.tsx'`。
13. 修改后摘要与长度；退出码 0，得到 8979 字节及上述 after SHA。
14. 首次二进制共同前后缀脚本；退出码 0，但判定表达式误将 `before.Length` 用作插入后的总长度，输出 `SingleInsertion: False`。这是核对脚本错误，不是文件差异；随后修正并重跑。
15. 修改后路径搜索与目标状态：`rg -n -F "../ui/session-case.tsx'" ...` 与目标路径限定的 `git status --short --ignore-submodules=all`；退出码 0，目标行唯一，目标仍为 `??`。
16. 修正后的二进制共同前后缀脚本；退出码 0，输出 `SingleInsertion: True`，并得到 579/8399/0x78 的证据。
17. 仅读确认两份新协调文件写入前均不存在：`Test-Path -LiteralPath` 返回两个 `False`；退出码 0。

## 明确未运行

- 未运行 Vitest、tsc、pytest、collect。
- 未运行 Python、Node、脚本解析器、AST、import 检查或任何构建。
- 未渲染、未启动服务、未做 HTTP、GUI、模型、Office 或安装操作。
- 未读取或写入真实数据、环境变量、Keyring、历史、缓存、rollout。
- 未修改产品、旧测试、配置、stub、运行时或版本钉。

本交回只证明测试夹具根因（不存在 `.ts`、真实导出为 `.tsx`）已按 bounded 指令修复。它不是产品行为已通过、GUI/Native/R、模型或项目验收的证明；若后续目标产品断言仍红，应另立产品修复，不在本次范围内。
