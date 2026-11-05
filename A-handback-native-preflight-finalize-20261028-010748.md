# 预检收尾已静态修订

状态：`AMEND_NOT_RUN`。控制流修复已经完成，修订后的 preflight 尚未运行，不能据此宣称真实装配、报告写入或完整 T31 已通过。

## 交付状态

| 四问 | 内容 |
|---|---|
| 做了什么 | 删除了 preflight 的提前返回，并把完整对话路径收进同一普通 `if/else`；preflight 现在会落入原 finally 和其后的统一收尾。新增修订说明并完成静态字节核对。 |
| 目标是什么 | 让 no-Key preflight 仍跳过硬凭据、模型、四轮对话和 fork，同时自然经过清理判定、最终固定输入校验、报告写入、stdout 与退出码。当前只差 root 的独立 no-Key 实跑。 |
| 在等什么 | 等 root 在没有 Key 窗口和权限弹窗的条件下运行 preflight。信号是生成 `report.json`，其中模式为 preflight、状态为 `CLEARSETUP_ONLY`、initial/final 准入各一次、自然清理成功、网络观测为 0。信号到后再决定是否进行完整对话验收。 |
| 卡在哪 | 静态修订没有被卡住。开工时的普通 `git status` 因 `dsh` 子模块权限拒绝返回 1；之后仅用 `--ignore-submodules=all` 做只读清单比较，没有修权限、锁、ACL 或审批。 |

## 改动范围

修改：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts`

新增说明：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-preflight-finalize-20261028-010748.md`

新增本交回件：

- `D:\Lawbeach\lawbench-coord\A-handback-native-preflight-finalize-20261028-010748.md`

未改旧 README、旧说明、旧交回件、工单集、产品源码、测试、配置、运行时、guard、18 个旧材料、B/C 线材料或旧状态。未联系其他聊天，未启动子代理，未更换 API。

## 控制流修订

原缺陷在 `main()` 的 `try` 内：

```diff
-      return
-    }
+    } else {
```

完整路径结束后增加关闭括号：

```diff
     report.status = 'PASS'
+    }
   } catch (error: unknown) {
```

preflight 仍执行原来的生产 setup、生产 Session/Agent 创建和 Browser Session 创建，然后跳过 Key、四轮提示、生产 fork 和持久化重开路径。离开 `try` 后会执行同一 finally，再执行同一段 finally 之后逻辑。完整模式没有改变调用顺序。

## 依据与验证

- 唯一执行令：`D:\Lawbeach\lawbench-coord\A-native-preflight-finalize-order-20261028-010748.md`。
- 冻结清单在输入目录和证据目录均为 14,284 字节，SHA-256 为 `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522`。
- 修订前源码为 51,654 字节、SHA-256 `efb4c295f081c03bd39b396012c812c2810e15c69336d0cc23c0b41b81c0ef65`。
- 修订后源码仍为 51,654 字节，SHA-256 为 `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93`。
- 修订后仍为 1,452 个 LF、0 个 CRLF、无 BOM，行数与编码形态未变。
- 用修订前源码、两个精确替换片段和修订后源码做内存重建，结果与原文件全文本严格相等。除这两个片段外，其余文本与字节未变。
- 提示区段、断言区段、生产 fork 至 `PASS` 设置区段的 SHA-256 在修订前后分别保持 `961dab…98460`、`884122…8495c`、`99ab9d…be1a7` 不变。
- 源码第 1160 行为 preflight 条件，第 1170 行为同级 `else`；第 1420 行仍执行最终固定输入校验，第 1436 行仍写 `report.json`。
- 开工前 dirty 清单为 195 行；完成后只读清单仍为 195 行，逐行比较一致。
- 新说明文件为 4,418 字节，SHA-256 为 `cc23e498b9fbffea2327808347956b6c595a942b5d80737887c4282a791a4dd0`。
- 历史原始消费器正确值为 39,711 字节、SHA-256 `24d9458aa87f07f35bf9c7851bc0104e01be4b05372d12a66b0df5c4ccc8c73`。旧说明中的该值多一个 `c`，旧文件按令保留。

## 实际命令账

本阶段共使用 33 次只读或编辑工具调用；其中命令账拆成 36 个可执行条目。每次 Shell 均使用显式原生 PowerShell、`login=false`，没有使用 bash 包装。`<SOURCE>` 指 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.ts`，`<INPUT>` 指 `D:\Lawbeach\lawbench-coord\NativePreflightFinalizeInput-20261028-010748`，`<NOTE>` 指新说明文件。

- C01 `Get-Content -Raw -LiteralPath <执行令>`：退出 0，完整读取执行令。
- C02 `Get-ChildItem -Force -LiteralPath <INPUT> | Select-Object Mode,Length,LastWriteTime,Name | Format-Table -AutoSize`：退出 0。
- C03 `Get-ChildItem -Force -LiteralPath <证据目录> | Select-Object Mode,Length,LastWriteTime,Name | Format-Table -AutoSize`：退出 0。
- C04 对 `<INPUT>\fixed-inputs.json` 和 `<SOURCE>` 执行 `Get-FileHash -Algorithm SHA256 -LiteralPath … | Format-List`：退出 0，分别匹配 `CE6556…A522` 和 `EFB4C2…EF65`。
- C05 `git status --short --branch`：退出 1，原始输出见下。
- C06 `Get-Content -Raw -LiteralPath <证据目录>\README.md`：退出 0。
- C07 `rg -n "preflight-only|function|finally|admission|verifyFixedInputs|report.json|exitCode|setup|cleanup|assert|prompt|four|fork|process\\.stdout|writeFile" <SOURCE>`：退出 0。
- C08 `Get-Content -Raw -LiteralPath <INPUT>\fixed-inputs.json`：退出 0。
- C09 `Get-Content -Raw -LiteralPath <INPUT>\root-preflight-amend-20261028-004315.md`：退出 0。
- C10 `Get-Content -LiteralPath <SOURCE> | Select-Object -Skip 0 -First 230`：退出 0。
- C11 `Get-Content -LiteralPath <SOURCE> | Select-Object -Skip 1028 -First 220`：退出 0。
- C12 `Get-Content -LiteralPath <SOURCE> | Select-Object -Skip 1248 -First 210`：退出 0。
- C13 `Get-Content -LiteralPath <SOURCE> | Select-Object -Skip 240 -First 100`：退出 0。
- C14 按 CRLF 构造两个预期替换并比较修订前后文本：退出 1，原始输出见下。
- C15 `foreach` 哈希汇总后直接接 `Format-List`：退出 1，PowerShell 原始解析错误见下。
- C16 `Get-Content -LiteralPath <SOURCE> | Select-Object -Skip 1148 -First 52`：退出 0。
- C17 `Get-Content -LiteralPath <SOURCE> | Select-Object -Skip 1298 -First 32`：退出 0。
- C18 按 LF 构造两个精确替换并比较修订后文本：退出 0，输出 `PASS exact expected LF text equality`。
- C19 重新对两份 `fixed-inputs.json` 做文件大小和 SHA-256 汇总：退出 0。
- C20 用 `foreach` 统计字节、LF、CRLF、BOM 后直接接 `Format-Table`：退出 1，PowerShell 原始解析错误见下。
- C21 对修订后 `<SOURCE>` 执行 `Get-Item …` 与 `Get-FileHash -Algorithm SHA256 …`：退出 0。
- C22 修正 C20 的汇总写法，逐文件输出字节、LF、CRLF、BOM：退出 0。
- C23a `rg -n -F "if (mode === 'preflight-only')" <SOURCE>`：退出 0，命中第 1160 行。
- C23b `rg -n -F "} else {" <SOURCE>`：退出 0，命中第 1170 行。
- C23c `rg -n -F "report.admission.final = await verifyFixedInputs()" <SOURCE>`：退出 0，命中第 1420 行。
- C23d `rg -n -F "await writeFile(reportPath" <SOURCE>`：退出 0，命中第 1436 行。
- C24 用正则计数静态确认 preflight 条件至 `else` 之间无 `return`，且 `PROMPTS`、`FORK_PROMPT`、`assertTurn`、`assertContainsFacts` 各出现一次：退出 0。
- C25 逐文件直接读取字节，输出 `BYTES`、`LF`、`CRLF`、`BOM`：退出 0。
- C26 `Get-Content -Raw -LiteralPath <INPUT>\A-dirty-before.stdout.txt`：退出 0。
- C27 按 `PROMPTS`、`assertTurn`、生产 fork 三个锚点截取修订前后区段并分别计算 SHA-256：退出 0，三区段均 `EQUAL=True`。
- C28 对修订前输入副本和修订后 `<SOURCE>` 分别执行 `Get-FileHash -Algorithm SHA256 -LiteralPath …`：退出 0。
- C29 `git status --short --branch --ignore-submodules=all`，并与开工前 195 行清单做 `Compare-Object`：退出 0，前后 195 行，`STATUS_INVENTORY_MATCH=True`。
- C30 `Get-Content -Raw -LiteralPath <cn-prose SKILL.md>`：退出 0。
- C31 `Get-Content -Raw -LiteralPath <formal-report SKILL.md>`：退出 0。
- C32 `Get-Content -Raw -LiteralPath <human-explain SKILL.md>`：退出 0。
- C33 对 `<NOTE>`、修订后 `<SOURCE>`、证据目录 `fixed-inputs.json` 执行 `Get-Item` 和 `Get-FileHash -Algorithm SHA256`，随后重做 C29 的只读 dirty 清单比较：退出 0；三者大小依次为 4,418、51,654、14,284 字节，dirty 前后均为 195 行且一致。

编辑工具调用：

- P01 修改 `<SOURCE>`：删除 preflight `return`，加入 `else` 起始。
- P02 修改 `<SOURCE>`：把分行 `else` 整理为标准 `} else {`。
- P03 新增 `<NOTE>`。
- P04 新增本交回件。

## 非零原始输出

C05，退出 1：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

C14，退出 1：

```text
FAIL outside expected transform changed
```

C15，退出 1：

```text
ParserError:
Line |
  2 |  . customobject]@{Path=$p;Bytes='MISSING';SHA256='MISSING'}} } | Format- .
   |                                                                ~
   | An empty pipe element is not allowed.
```

C20，退出 1：

```text
ParserError:
Line |
  2 |  . and $b[0] -eq 239 -and $b[1] -eq 187 -and $b[2] -eq 191)} } | Format- .
   |                                                                ~
   | An empty pipe element is not allowed.
```

C14 是检查脚本假定 CRLF，而源码实际全 LF；C15、C20 是只读汇总脚本把 `foreach` 语句直接接到管道。三次均未改文件，随后已用精确 LF 重建和修正后的 PowerShell 写法重跑成功。

## 未做与降级

- 没运行修订后的 preflight。
- 没运行完整模式、Node、tsx、TypeScript、解析器、测试、tsc、产品导入、HTTP、模型、GUI 或构建。
- 没读 Key，没创建 Key 窗口或权限弹窗，没改 API。
- 没做 Git add、commit、rebase、stash、reset、clean、checkout 或 push。
- 没修 `dsh` 权限、`index.lock`、ACL、审批或沙箱。
- 没有真实 `report.json`、真实清理结果或四轮模型答案。本交回只证明静态控制流修订和字节边界。

## 下一步

请 root 独立运行 no-Key preflight，并核对三点：initial/final 固定输入准入均成功、自然清理判定成功、`CLEARSETUP_ONLY` 报告实际落盘且 stdout/退出码正确。该结果通过前，不进入完整 T31 或 GUI 结论。

Response ID: chat reply

Response log path: chat reply
