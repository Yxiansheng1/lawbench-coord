# T32 citation/uname 五参数有界修改记录

执行令：`D:\Lawbeach\lawbench-coord\B-T32-citation-uname-five-arg-order-20261027-193613.md`

唯一源码目标：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDocumentCitationEntry-20261027-190830\server.py`

开工前静态核对与 `expected.json` 一致：67866 字节，SHA-256 `fd39258ca33596f714044de7e598d2b57eae6d2f4378073f0ce23e26ff1858f9`。

只将目标字面量从：

```text
"Windows", "T32-CITATION-SYNTHETIC", "", "", "", ""
```

改为：

```text
"Windows", "T32-CITATION-SYNTHETIC", "", "", ""
```

静态核验结果：67862 字节，SHA-256 `ec4e15f047f3ae6264dc25ad582cb2191ce085e9bc7c5add4bb5df0212ba0dd8`；旧序列 0 处，新序列 1 处；静态反替换后恢复为 67866 字节和原 SHA。源码其余字节因此保持冻结。

本轮未执行 Python、Node、解析、编译、测试、服务、探针、HTTP、GUI、模型、安装或其他运行时，也未运行 README 示例和诊断。实际新鲜有限运行与 GUI 验证由 root 负责，本执行者不提供作者运行时证明。

Git 仅尝试只读 `git status --short --untracked-files=no`，因 `dsh` 子模块工作树权限拒绝而未完成。没有执行任何 Git 写入，也没有修锁、扩权、改审批或绕过权限。

先前 B main 的旧作者在 hard runtime ban 下重复启动未授权运行时，已构成明确违规；其历史 raw/job/roots/README 未改动，也不构成本轮可采信的作者运行时证据。
