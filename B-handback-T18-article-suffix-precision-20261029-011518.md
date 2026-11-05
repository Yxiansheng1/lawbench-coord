# T18 条号后缀精度源码交回

状态：`SOURCE_HANDED_BACK_NOT_RUN`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 修正实际正文单编辑观察器中唯一的共同后缀终点表达式，更新 consumer 的两个 manifest pin，新增精度 note。 |
| 目标是什么 | 交给 Root 运行既有五个反例控制和编译器，再运行唯一一次含两个 Skill 的真实模型工作流。 |
| 在等什么 | 等 Root 对当前 pin 的审查、编译和真实运行结果。 |
| 卡在哪 | 源码交回没有阻塞。候选、观察器、测试、编译与模型工作流按令禁止，B 侧未运行。 |

原始业务失败仍成立。本次只修订并交回未运行源码，不宣称产品失败已消除，也不宣称质量通过。

## 当前 pin

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\native-genuine-quality-revision.mts` | 112,104 | `d9602629f65a13d97e0a6aa2aa232b039bb28fd84ce163676633eead38e1bc76` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\fixed-inputs.json` | 19,484 | `dbca629100335db645d3b590b568b25d0c57cc58d14acd03fd2f2013fb3db6b0` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\b-service-genuine-revision.py` | 38,214 | `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\ExplicitPriorQualityRevision-20261029-004226\precision-note-article-common-suffix-20261029-011518.md` | 4,028 | `d77407eff07fe6df0fc005a0f4024dbfa64c088547580693a48e6ab6fa5691eb` |

修改前 consumer 为 112,107 字节、SHA-256 `07b17ac7c111ff8601f1318c2965a8be88efd3b9b14e2ed828b9144c39ea79d3`；修改前 manifest 为 19,484 字节、SHA-256 `a482b49d8387f8074835e9730b388bd4e78b882083b14ce2a0ad7346ff949c4d`。修改前工作文件与本次输入副本逐项一致。

## 唯一源码改动

`oneContiguousEdit` 继续保持整篇原稿与修订稿的 maximal common prefix/suffix。原稿 `第七条` 到修订稿 `第4.1条` 的实际 delta 只有 `七 -> 4.1`；末尾 `条` 是共同后缀，不属于新 delta。

源码只把：

```ts
original.slice(0, wrongArticleAt + '第七条'.length)
```

改为：

```ts
original.slice(0, wrongArticleAt + '第七'.length)
```

`afterArticle` 现在位于条号第二字 `七` 之后、共同末尾字 `条` 之前，并继续按 UTF-8 字节换算。精确 delta 字节相等、前缀位于原稿风险 3、以及整篇共同前缀/后缀相等三项判定均保留；没有增加 normalization、宽松包含或窗口规则。

源码与输入副本逐行比较只显示这一处语义变化。文件少 3 字节，即原先错误多计入的共同后缀 `条` 的 UTF-8 长度。prompt、答案、参数、header、finally、模型参数和其他源码字节未改。没有把修正正文提供给模型。

## manifest 与冻结文件

manifest 只改 `consumer.bytes` 和 `consumer.sha256`：

```diff
- "bytes": 112107,
- "sha256": "07b17ac7c111ff8601f1318c2965a8be88efd3b9b14e2ed828b9144c39ea79d3"
+ "bytes": 112104,
+ "sha256": "d9602629f65a13d97e0a6aa2aa232b039bb28fd84ce163676633eead38e1bc76"
```

manifest 与输入副本逐行比较只显示这两行。所有其他 manifest 数据、服务和 companion 保持原样。companion 与输入副本逐行比较无差异，SHA 仍为 `77a826901fc8b9ea1243ad389e121148995be057eb791487d0f62bbcc5ed2f4a`。

## 精确反演

把源码 `'第七'.length` 改回 `'第七条'.length`；把 manifest `consumer.bytes` 改回 112,107，把 `consumer.sha256` 改回 `07b17ac7c111ff8601f1318c2965a8be88efd3b9b14e2ed828b9144c39ea79d3`。其余文件与字节不应变化。

## Root 下一步

Root 运行既有五个反例控制及编译器，通过后运行唯一一次含 `pre-issue-check` 与 `doc-revise` 的真实模型工作流。Root 独占候选、运行时、模型与最终验收权限。

## 未做与验证等级

- 已复用 Root 对冻结 `07b17a…79d3` 的实际四函数观察：必要条号变更失败、四个否定控制通过、自然退出、模型/HTTP/Key 为 0。
- 本次为 `SOURCE_ONLY_STATIC_CHECKED`，不是 runtime pass，不是 business pass。
- B 侧没有执行 Node、Python、tsx、解析器、AST、导入、测试、编译、构建、预检、边界消费者、HTTP、模型、GUI、SSH 或凭证读取。
- 没有运行候选、B 服务或产品；没有打开真实案卷、原始会话或材料正文，没有生成材料或修正正文；没有修改 prompt、答案、模型参数、产品代码、Skill、契约或冻结证据。
- 写后只读复核使用 `Get-Item`、`Get-FileHash`、`Get-Content`、`rg`、`Compare-Object` 和 `git status`；没有执行候选源码。
- Git 严格只读，未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。普通 `git status --short --branch` 因共享 `dsh` 子模块目录权限被拒；忽略子模块的只读状态读取成功。未修权限、锁、ACL、审批或沙箱，未拆 writer 锁。

## 写面孔

- `apply_patch` 一次修改 `native-genuine-quality-revision.mts` 的唯一表达式。
- `apply_patch` 一次只修改 `fixed-inputs.json` 的 consumer bytes/SHA。
- `apply_patch` 新增 `precision-note-article-common-suffix-20261029-011518.md`。
- `apply_patch` 新增本正式交回件，并在写后封存校验后由同一执行者补记命令 17、修正一处边界措辞。
- 没有其他文件写入动作；没有 Git 写入、外部消息或模型调用。

## 实际 shell 命令与返回

以下按执行顺序列出本轮全部 shell 片段；命令 1-16 在首次写入本文件前执行，命令 17 是写后只读封存。所有可执行调用均显式使用 `C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`、`login=false` 和 managed 隔离；没有使用 bash 包装。

1. `0` 读取正式执行令：`Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\B-T18-article-suffix-precision-order-20261029-011518.md'`
2. `0` 完整读取 `root-actual-delta-red.json`。
3. `1` `git status --short --branch`；因 `.../modules/dsh` 权限被拒，无可用状态输出。
4. `1` 组合读取三文件字节/SHA 的 PowerShell 命令；工具层展开 `$` 变量后触发 `ParserError: An empty pipe element is not allowed`。命令在执行任何文件 API 前终止，没有写入。
5. `0` 列出工作证据目录和输入目录：`Get-ChildItem -LiteralPath ... -Force | Select-Object Name,Length,LastWriteTimeUtc`
6. `0` `git status --short --branch --ignore-submodules=all`；成功显示既有 dirty 工作树，未改动任何条目。
7. `0` 六次显式 `Get-FileHash` 校验工作区与输入副本的 consumer、manifest、companion。
8. `0` `Get-Content -Raw ... fixed-inputs.json`；读取完整输入 manifest。
9. `0` `rg -n -C 10 "oneContiguousEdit|afterArticle|第|article" ...native-genuine-quality-revision.mts`；定位唯一缺陷表达式。
10. `0` 修改后读取源码长度与 SHA：`Get-Item ...native-genuine-quality-revision.mts`、`Get-FileHash ... -Algorithm SHA256`。
11. `0` `Compare-Object` 比较输入副本与修改后 consumer 的行；只显示 `第七条`/`第七` 一处差异。
12. `0` `Get-Content ... | Select-Object -Skip 1690 -First 38`；回读实际函数上下文。
13. `0` 对当前 consumer、manifest、companion 运行 `Get-FileHash`，对 consumer、manifest 运行 `Get-Item`。
14. `0` `Compare-Object` 比较输入副本与修改后 manifest 和 companion；manifest 只显示 bytes/SHA 两行，companion 无差异。
15. `0` 读取旧 precision note 与旧正式交回件，仅作格式和边界核验。
16. `0` 读取新 note 的 `Get-Item` 长度与 `Get-FileHash`；得到 4,028 字节、`d77407…91eb`。
17. `0` 写后只读封存：对 consumer、manifest、companion、新 note、正式交回件运行 `Get-FileHash` 和 `Get-Item`；用 `Compare-Object` 再次比较 consumer、manifest、companion 与输入副本；用 `Get-Content -Raw` 回读新 note 与正式交回件。结果仍为 consumer 一处差异、manifest 两行差异、companion 无差异。

两次非零调用为命令 3 和 4。命令 3 是只读 Git 子模块权限边界；命令 4 在文件 API 前解析失败。两者均未触发写入，不是源码交付阻碍。
