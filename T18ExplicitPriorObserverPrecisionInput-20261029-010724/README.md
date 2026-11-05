# T18 显式前序成果质量修订：未运行源码候选

## 结论

状态：`AUTHORED_NOT_RUN`。

本目录是 B 线按 `B-T18-explicit-prior-revision-order-20261029-004226.md` 生成的两阶段真实工作流源码候选。按执行令，本执行者没有运行 Node、Python、tsx、解析器、导入、测试、构建、预检、边界消费者或任何模型工作流；没有读取凭证，也没有启动服务。

本文件不宣称两阶段通过，不宣称原 T18 业务错误已修正，不宣称完整 T18、Word GUI、法律质量、真人验收或打包通过。原首轮把风险 3 的 4.1 条写成“第七条”的业务失败，仍应视为原始失败记录。

## 文件与身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-genuine-quality-revision.mts` | 110,111 | `a13f40118f371fb7e9b7c400d841f21eb88fc9b85f459fa64f07580de4f2c05e` |
| `b-service-genuine-revision.py` | 38,214 | `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a` |
| `fixed-inputs.json` | 19,484 | `92eb03a9210d0cc57f67ee4c38e66e675c7be93eed5d3e486e54805b0cb13d47` |

`fixed-inputs.json` 同时固定本消费者和 B 伴随件自身的大小与 SHA-256。消费者启动时会核对自身、B 伴随件、原案 16 个文件、原会话 1 个文件、两份 appdata 记录、346 条 B 源码 pin、A 侧运行时依赖和原始失败证据。

## 两阶段工作流

阶段一：

1. 在全新私有根中复制原案 16 个文件和原会话 1 个文件，字节与 SHA-256 必须一致。
2. 通过生产 `commands.prompt` 恢复同一个 Native Session UUID；会话头 `cwd` 保持原值，59 个原事件作为字节前缀保留。
3. B 守卫在 `create_app` 前只复制 `request-scopes.json` 和原始 R 的 intent 文件，并要求复制后的字节数与 `mtime_ns` 精确一致。
4. 通过真实 `/api/task` 选择 `pre-issue-check`，输入只有原 v2 草稿。
5. `BrowserSession.beginSubmission` 生成新 R；不调用 `request_scope.prepare`、不提交材料批，直接提交普通合成用户问题。
6. 生产 `task_begin` 必须返回 `request_scope: null`。问题回调按实际声明的问题 ID 回答草稿、文书类型和本次核对范围。
7. 要求实际调用 `case_read_input`、`case_read_material`、`case_save_draft`。保存的问题清单必须同时指出风险 3 的错误“第七条”和源合同 4.1，且不能以“引用检查通过”代替语义核对。

阶段二：

1. 在阶段一任务正常结束后，再通过真实 `/api/task` 选择 `doc-revise`，输入严格为原 v2 草稿和阶段一实际保存的清单路径。
2. 再次生成新 R，并再次要求 `request_scope: null`。
3. 合成律师意见只要求按《采购合同》原文改正风险 3 的错误条款编号，不提供更正后的正文。
4. 新任务和 R 必须分别不同于阶段一及原任务/原 R。
5. 保存标题必须是 `合同审查意见-修改稿`。正文必须来自实际 `case_save_draft` 工具参数；风险 3 不得再有“第七条”，且必须出现 4.1。
6. 原稿与修改稿的字节差异必须只有一个连续片段；该片段移除“第七条”并引入 4.1，其他字节不变。

两个阶段都记录生产任务、R、问题 ID、工具调用哈希、材料读取范围、覆盖、引用解析、模型网络观察和最终会话持久化。`report.json` 只保存元数据、哈希和长度；完整模型输出与草稿正文留在私有 JSONL 和草稿文件中。

## B 边界

B 伴随件只允许：

- 打开私有复制案；
- 两阶段 `/api/task` 和 `/core/*`；
- 材料/任务/source 只读接口；
- `case_list_materials`、`case_read_material`、`case_read_input`、`case_search`、`case_read_wiki`、`case_save_draft`。

它拒绝材料导入、`request_scope`、redline、设置修改、凭证获取和所有外连。OCR 与 Retainer 不启动。守卫仅对 `task_begin.cwd` 做一处精确路径别名：原会话头中的原案路径映射到本次私有复制案；会话文件本身不改写。

## 根执行的唯一命令形态

由已有 LaneColdRunner 在 `D:\Lawbeach\lawbench-B` 下执行，凭证只经匿名 stdin 管道输入：

```powershell
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-A\dsh\node_modules\tsx\dist\cli.mjs' 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts' --credential-stdin
```

命令中没有 Key、密码、token 或材料正文。根执行前应先做自己的完整源码复核。

## 本执行者未做的事

- 未执行上述命令。
- 未运行任何 Node、Python、tsx、解析器、导入、测试、构建、预检、HTTP 或模型调用。
- 未读取、打印或写入任何 Key、密码或真实案卷。
- 未修改产品、Skill、契约、fixture、旧消费者、旧证据或原始输入。
- 未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

普通只读 `git status` 因共享 `dsh` 子模块路径权限被拒绝；按要求没有修权限、拆锁、改审批或切换沙箱。

另需如实记录：本次会话中有多次只读列目录/源码读取命令误用了 bash 参数，均在 `Bash/E_ACCESSDENIED` 处失败，没有返回内容、没有写文件、没有执行产品运行时；之后均改回指定的原生 PowerShell。

## 写面孔

本次只新增：

- 本目录的 `native-genuine-quality-revision.mts`
- 本目录的 `b-service-genuine-revision.py`
- 本目录的 `fixed-inputs.json`
- 本文件
- 协调目录的 `B-handback-T18-explicit-prior-revision-20261029-004226.md`

