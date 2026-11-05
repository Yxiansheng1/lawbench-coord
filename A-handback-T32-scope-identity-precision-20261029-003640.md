# A 线 T32 请求范围身份精度源修正交回

## 结论

状态：`SOURCE_ONLY_PRECISION_FIX_COMPLETE / ROOT_REVIEW_PENDING / NO_RUNTIME_VALIDATION`

本次只修改了执行令指定的 Python 源文件，只替换两处请求范围身份比较表达式。没有执行 Node、Python、解析器、AST、导入、编译、测试、prepare、serve、HTTP、模型、GUI 或 SSH；没有生成新运行目录，也没有重跑 `r001`/`r002`。新源码是否可运行、T32 是否通过，均未由本线声称。

## 当前哈希与基线

- 修正前保全输入：`D:\Lawbeach\lawbench-coord\T32ScopeIdentityPrecisionInput-20261029-003640\continue-genuine-document-save.py`
- 修正前大小：`38548` 字节
- 修正前 SHA256：`5cdae99282553032a5f59e1decb23c1d8a31e490b5025bc1df8b2146e33a8c96`
- 修正后源码：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\GenuineDocumentSave-20261029-002334\continue-genuine-document-save.py`
- 修正后大小：`38750` 字节
- 修正后 SHA256：`ad36174d12cf6c2271713222e67e067acc56d0c01b035c8351706c5c62bfd29f`
- 修正后行数：`929`

逐文件只读差异比较显示，相对保全输入只有一个 hunk：仅两处身份相等表达式发生变化，没有其他源码字节变化。保全输入本身仍为上述 `38548` 字节和 `5cda...a8c96` 哈希。

`genuine-scope-identities.json` 只读核对值为：

- 大小：`694` 字节
- SHA256：`1f59bf875340e9b74d6a55ca4a84ac59abb4fd70fda8676a24c8c0664f8f52e4`

## 精确修改

修改位置在修正后源码 `run()` 的源范围复核块。两处都保留完整相等断言，只把右侧由带 `path` 的捕获字典改成该字典中按固定顺序取出的 `bytes`、`sha256`、`mtime_ns` 三项：

```python
        require(
            helper.file_identity(REQUEST_SCOPE_STORE)
            == {
                key: request_scope_evidence["sourceStore"][key]
                for key in ("bytes", "sha256", "mtime_ns")
            },
            "source request-scope store changed",
        )
        require(
            helper.file_identity(REQUEST_SCOPE_INTENT)
            == {
                key: request_scope_evidence["sourceIntent"][key]
                for key in ("bytes", "sha256", "mtime_ns")
            },
            "source request-scope intent changed",
        )
```

没有删除断言，没有改成 truthy 判断，没有放宽到单个哈希，也没有修改捕获或复制逻辑。两项比较仍要求运行前后 `bytes`、`sha256`、`mtime_ns` 三项逐一完全相等。

## 精确反向文本

以下仅记录源修正的精确反向文本，未执行：

```diff
-            == {
-                key: request_scope_evidence["sourceStore"][key]
-                for key in ("bytes", "sha256", "mtime_ns")
-            },
+            == request_scope_evidence["sourceStore"],
             "source request-scope store changed",
         )
         require(
             helper.file_identity(REQUEST_SCOPE_INTENT)
-            == {
-                key: request_scope_evidence["sourceIntent"][key]
-                for key in ("bytes", "sha256", "mtime_ns")
-            },
+            == request_scope_evidence["sourceIntent"],
             "source request-scope intent changed",
```

该文本只反转本次两处表达式，不包含新的运行命令或交付命令。

## 只读审查范围

- 完整读取修正前 `38548` 字节源码，共 `923` 行。
- 完整读取新增的请求范围准备函数、来源身份返回字段、复制完整性断言、运行后来源复核、错误元数据和最终报告相关区域。
- 只读查看 `genuine-scope-identities.json`、`rejection.json`、`request-scopes.json` 和请求范围 intent 文件清单。
- 只读确认 `r001`、`r002` 仍然存在及其文件清单；未写入、未重跑、未清理。
- 对固定源码包、案件材料、任务、结果和现有证据未作运行验证或改写。

根目录 `git status --short --branch` 无法完整枚举 dirty 状态，原因是既有子模块 `modules/dsh` 的 `.git` 路径被权限拒绝：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

该阻碍被原样记录。没有尝试修复权限、更改沙箱或审批、拆除 writer 锁，也没有执行任何 Git 写入。

## 命令与退出状态

所有 Shell 均为：

```text
C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe
```

全部使用 `login=false`。实际用于检查的命令如下；省略仅为同一条命令中的格式化尾部，不改变读写性质：

1. `Get-Content ...A-T32-scope-identity-precision-order-20261029-003640.md -Raw`，退出 `0`。
2. `git status --short --branch`，退出 `1`；原因为上述 `modules/dsh` 权限拒绝。
3. `Get-ChildItem ...T32ScopeIdentityPrecisionInput-20261029-003640`，退出 `0`。
4. `Get-Item ...continue-genuine-document-save.py`（工作源码）及 `Get-FileHash -Algorithm SHA256`，退出 `0`。
5. `Get-Content ...genuine-scope-identities.json -Raw`，退出 `0`。
6. `Get-Item`、`Get-FileHash`、`(Get-Content).Count`（保全输入源码），退出 `0`。
7. `Get-Item`、`Get-FileHash`、`(Get-Content).Count`（工作源码），退出 `0`。
8. `Get-Content ...rejection.json -Raw` 与 `Get-Content ...request-scopes.json -Raw`，退出 `0`。
9. `git --no-pager diff --no-index -- 保全输入源码 工作源码`，原生命令退出 `1`（两文件不同），外层检查命令以 `0` 返回并记录 `DIFF_EXIT=0`。
10. 分段读取保全输入源码第 `1-470` 行，退出 `0`。
11. 分段读取保全输入源码第 `471-923` 行，退出 `0`。
12. `Get-ChildItem ...T32 -Recurse -File` 并按源码文件名或 `33890` 字节筛选，退出 `0`；未发现该 `33890` 字节独立文件。
13. `Get-ChildItem ...GenuineDocumentSave-20261029-002334 -Force`，退出 `0`。
14. `Get-ChildItem ...T32GenuineSaveInput-20261029-002334 -Recurse -File`，退出 `0`。
15. `Get-ChildItem ...lawbench-coord -Recurse -File` 并按源码文件名或 `33890` 字节筛选，退出 `0`。
16. 读取 intent 清单，并用 `Compare-Object` 按字节比较保全 `request-scopes.json` 与原始 appdata 同名文件，退出 `0`；前五项无差异。
17. `Get-ChildItem ...r001 -Recurse -File`，退出 `0`。
18. `Get-ChildItem ...r002 -Recurse -File`，退出 `0`。
19. `Get-ChildItem C:\Users\morel\Documents\Codex -Recurse -File` 并按源码文件名或 `33890` 字节筛选，退出 `0`；未发现独立初版源文件。
20. `Get-Item`、`Get-FileHash`、`(Get-Content).Count`（修正后工作源码），退出 `0`。
21. `git --no-pager diff --no-index --unified=8 -- 保全输入源码 修正后工作源码`，原生命令退出 `1`（预期差异），外层检查命令以 `0` 返回并记录 `DIFF_EXIT=1`。
22. `Select-String` 只读打印两处身份表达式和上下文，退出 `0`。
23. `Get-FileHash -Algorithm SHA256`（保全输入源码、`genuine-scope-identities.json`），退出 `0`。
24. `Get-Item`、`Get-FileHash`、`Get-Content -TotalCount 24`（修正后源码与本交回件），退出 `0`；复核源码哈希仍为 `ad36174d12cf6c2271713222e67e067acc56d0c01b035c8351706c5c62bfd29f`。

另有一次 `apply_patch` 写操作，只修改指定源码；另一次 `apply_patch` 写操作，只新增本交回件。两者均未调用运行时。

## 写面

数据写入仅限：

1. 修改 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T32\GenuineDocumentSave-20261029-002334\continue-genuine-document-save.py`。
2. 新增 `D:\Lawbeach\lawbench-coord\A-handback-T32-scope-identity-precision-20261029-003640.md`。

明确未写：

- `r001`、`r002` 或任何新运行目录。
- `README.md`、交付说明、证据报告或测试产物。
- 保全输入、请求范围身份文件、固定源码包或案件材料。
- 任何 Git 索引、提交、分支、锁、权限、策略、配置或凭据。

`git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout`、`push` 均未执行。

## 遗留边界

本交回只证明静态源码改动精度和相对保全输入的单 hunk 差异。当前源码未经本线运行，不能据此声称新的产品失败、T32 PASS、模型质量修复或完整 T18 PASS。请独立复核并在根侧按既有授权决定后续动作。
