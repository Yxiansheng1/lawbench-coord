# B 线交回：T18 显式前序成果质量修订源码候选

## 状态

`AUTHORED_NOT_RUN`，等待主编排完整源码复核和唯一实际运行。

正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-explicit-prior-revision-order-20261029-004226.md`

证据目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\`

## 交付

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-genuine-quality-revision.mts` | 110,111 | `a13f40118f371fb7e9b7c400d841f21eb88fc9b85f459fa64f07580de4f2c05e` |
| `b-service-genuine-revision.py` | 38,214 | `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a` |
| `fixed-inputs.json` | 19,484 | `92eb03a9210d0cc57f67ee4c38e66e675c7be93eed5d3e486e54805b0cb13d47` |
| `README.md` | 见目录 | 说明与命令形态 |

源码实现了两阶段显式前序输入场景：

- 原案 16 个文件与原会话 1 个文件复制到全新私有根。
- 只复制两份真实 request-scope appdata 文件，并在 `create_app` 前核对字节和 `mtime_ns`。
- 同一 Native Session UUID 经生产 `commands.prompt` 恢复，原 `cwd` 与 59 事件前缀不改写。
- 阶段一 `pre-issue-check` 只选原 v2；阶段二 `doc-revise` 只选原 v2 和阶段一实际清单。
- 两阶段均在 R 生成前选择前序成果，且从不调用材料批或 `request_scope.prepare`。
- 新任务和新 R 由生产代码生成；B 守卫要求两次 begin 的 `request_scope` 明确为 `null`。
- 阶段一必须实际识别风险 3 的“第七条”与源合同 4.1。
- 阶段二必须保存模型实际生成的修改稿；风险 3 不得残留“第七条”，正文差异必须只有一个连续必要片段。
- 会话关闭后重新打开的全量事件必须与 live 深相等，原 59 事件前缀必须逐字节保留。

## 验证边界

按执行令，本执行者没有运行 Node、Python、tsx、解析器、导入、测试、构建、预检、HTTP、模型或 GUI，也没有读取凭证。因此本交回不含运行 PASS、质量 PASS、法律验收或打包结论。

根可使用以下命令形态执行：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts' --credential-stdin
```

凭证只应由根以匿名 stdin 输入；命令中不应出现 Key、token 或正文。

## 需要根复核的点

1. 复核 B 守卫仅对 `task_begin.cwd` 使用原会话头路径到私有复制案的精确别名，确认这不扩大案件权限。
2. 复核阶段二清单路径来自阶段一实际 `case_save_draft` 响应，而不是预写路径。
3. 复核消费者没有把模型全文、读取正文或引用正文写入 `report.json`。
4. 若模型未实际调用 `case_read_input`/`case_read_material`，消费者会真实失败而不是补证据；这是有意保留的失败面。

## Git 与环境记录

- Git 只读 `status` 因共享 `dsh` 子模块路径权限被拒绝；未修权限、拆锁、改沙箱或改审批。
- 未执行任何 Git 写操作。
- 本次多次只读列目录/源码读取命令误用了 bash 参数，均在 Bash 访问检查处失败；没有返回源码、没有写文件、没有执行产品运行时，之后均使用指定原生 PowerShell。

