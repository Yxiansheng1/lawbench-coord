# B 线交回：T18 Defense 有限格式修复

状态：完成。按令只改一个编译文件名提示字段；未运行目标或任何验证禁区。

## 修改对象

- 文件：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\DefenseOpinionNative-20261029-155352\observer-format-finite.mjs`
- 唯一修改行：257
- 修改前：`    fileName: sourcePath,`
- 修改后：`    fileName: 'observer-fragment.cts',`
- 性质：source-only；仅向既有 `ts.transpileModule` 提供 CommonJS 编译文件名提示，未创建实际 `.cts` 文件，未改 VM 文件名、原始 AST 读取或来源路径。

## 字节与哈希

- 修改前：21,664 字节，SHA-256 `304d4483b0f0d823898222ea9949791dfc0136f7ca17fb07252e5886c9c50f8a`。
- 修改前与正式输入快照 `D:\Lawbeach\lawbench-coord\T18DefenseFiniteFormatInput-20261029-165058\observer-format-finite.mjs` 全字节相等：`True`。
- 修改后：21,677 字节，SHA-256 `5f15b6e64380b34f9c49618233e8b28a0816704044a7e9581244591e68557b5c`。
- 与快照共享前缀 8,387 字节、共享后缀 13,267 字节；字节差分仅移除 `sourcePath`、插入 `'observer-fragment.cts'`。
- 将唯一差分反向替换后与 21,664 字节原快照全字节相等：`True`。
- 新行全文出现 1 次；旧行全文出现 0 次。

## 验证与边界

- runtime：0。没有运行 Node、Python、解析器、AST、eval、import、check、test、函数调用、HTTP、模型、GUI、环境变量、Key、DPAPI 或进程探测。
- 只使用只读 PowerShell 做文件读取、字节比较和 SHA-256 计算。
- 没有修改其他文件、冻结输入、旧正式交回、状态、原始证据或失败 ROOT。
- Git 未执行任何写入；只读 `git status --short` 在子模块 `dsh` 上因 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 权限拒绝而失败。按令未修复该阻碍，未扩权、未改 ACL/审批，也未触碰 `index.lock` 或其他锁。
