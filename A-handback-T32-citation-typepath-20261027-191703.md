# A 线交回：T32 稿件出处测试类型路径

任务：修复 `dsh-ext\tests\document-citation-navigation.spec.tsx` 中唯一的类型导入扩展名。

结果：已完成有界夹具修复。仅将第 9 行 `../ui/session-case.ts'` 中的一个 ASCII 字节改为 `../ui/session-case.tsx'`。无产品、断言、用例、清理、导航或标签改动。

修改文件：

```text
D:\Lawbeach\lawbench-A\dsh-ext\tests\document-citation-navigation.spec.tsx
```

字节证据：

```text
before: 8978 bytes, SHA-256 bf167a78a12fe494222a1b18cfc0f2af1dcd2a5d8187d75a3c06abfe1f30d4e0
after:  8979 bytes, SHA-256 6c438973fd59868a9fb5ca596c842c4bf8314e5127a9807b654cfe7bec0114b7
single insertion: ASCII x (0x78) at zero-based byte offset 579
```

after SHA 与 `T32CitationTypePathInput-20261027-191703\expected.json` 完全一致。

真实源文件：`D:\Lawbeach\lawbench-A\dsh-ext\ui\session-case.tsx` 存在；不存在的 `session-case.ts` 未创建。

验证状态：NOT_RUN。按正式令未执行解析、Vitest、tsc、pytest、collect、构建、渲染、服务、探针、HTTP、GUI、模型或 Office。

Git 状态：严格只读。目标文件修改前后均未被本次操作暂存或提交；未执行 add、commit、rebase、stash、reset、clean、checkout、push 或权限/ACL/锁修改。只读分支 `line-A`，HEAD `a23271abee333a9a256fd46a3141da16975c2380`。

已记录的非零/异常：

1. 首个全工作树 `git status --short --untracked-files=all` 退出码 1：Git 在 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 报 `Permission denied`。未修复或扩展权限；后续使用 `--ignore-submodules=all` 完成只读 dirty 核对。
2. 在通用工单集中检索 `T32` 无匹配，退出码 1；本次以正式执行令与指定输入目录为唯一事实入口。
3. 首次单字节核对脚本因比较 after 长度时误用 before 长度而输出 `SingleInsertion: False`；修正脚本后输出 `True`。文件摘要和字节数未受此核对脚本错误影响。

详细命令、基线、二进制差异和禁区记录：

```text
D:\Lawbeach\lawbench-coord\A-note-T32-citation-typepath-20261027-191703.md
```

范围声明：本次是夹具路径修复交回，不代表产品行为绿灯或项目验收。打包 HOLD。其他既有 dirty 内容全部原样保全。
