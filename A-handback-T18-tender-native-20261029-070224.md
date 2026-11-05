# A 线交回：T18 tender-review 原生消费者作者包

## 1. 结论与边界

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-tender-native-order-20261029-070224.md`
- 状态：`AUTHORED_NOT_RUN`
- 分支：`line-A`；无新提交、无提交 SHA。
- 本交回只说明源码适配完成，不声称 tender-review 实际链路、业务输出、Gate 1、完整
  T18、法律质量或打包通过。
- 没有修改产品源码、Skill、样例、配置、契约、SDK、private25、legacy18、E50、旧测试、
  旧消费者、旧运行包或 Git 索引。

正式作者说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewNative-20261029-070224\README.md`

README：11277 字节，SHA-256
`9546c3543286cc84ed9e6700c00ccbe5a675d127fd53b270a2ac1691835a9702`。

## 2. 交付文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-tender-review.mts` | 118524 | `80cb5560d72182bd85cdceb51e1e94490906f26d2141c51a4feda301e909db4b` |
| `b-service-tender-review.py` | 46017 | `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` |
| `literalfixed-inputs.json` | 11263 | `b381c7618886a3b9b505e02d6d7127074079486cc94ff02f920c3961806068cf` |
| `README.md` | 11277 | `9546c3543286cc84ed9e6700c00ccbe5a675d127fd53b270a2ac1691835a9702` |

目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewNative-20261029-070224`

## 3. 已核事实

### 3.1 六个输入

批准文件 `approved-inputs.json` 为 2184 字节，SHA-256
`0939aebc1e1d3c611cccb641261809eee6e0c1a3ffc16f27d0aef1c62e001e5d`。
只读 PowerShell 已逐项比对：

| 输入 | 字节 | SHA-256 | 字节/哈希/mtime |
|---|---:|---|---|
| `tender-review\SKILL.md` | 13036 | `a7f19dc17bac500bb66e2dc7eb2bfe07653c6165d3c452e40b996649966ccdf6` | 一致 |
| `招标文件.txt` | 2646 | `298a4e0def9269d670a17c4455999940ba1b5a53d11021901f3b7b303f4f0a6d` | 一致 |
| `补充通知.txt` | 554 | `cd01f666a0122787ce48a122d32de8962fef003a9c3c91f9b89bc898cd4519f7` | 一致 |
| `投标人情况.txt` | 1058 | `04976f7bc442a52e07cb4408da65be95bb22e9d9f85607d23bbc1c2757e69411` | 一致 |
| `_任务说明.md` | 766 | `0f741ddc16d477740673ed9ba9370124baf57a8857d5fc9885877451664fd36d` | 一致 |
| `tests\要点.md` | 10509 | `a84387d199f03da4f8bdce84919ec3fb12c78b88a193a4340c7f73fcbf27bc25` | 一致 |

### 3.2 冻结运行时与源

- B 源 pin：346 项，53548 字节，
  `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`。
- A agent：46547 字节，
  `40ab48b82a3bb8b1ae488daa1ba930924d1b8b292aa70114bf317e9a633d5794`。
- A task-state：21264 字节，
  `fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b`。
- B citations：19642 字节，
  `6171f0dd8c564cb9fe092a1c3d222217acaedab6bf500baf04afeafeca19b412`。
- private25 manifest：58200 字节，
  `712f3b68d73d793c3caa6391bcc0f14e48b66c83dd5364e78b02db8a84affc14`。
- 编译 agent：552781 字节，
  `f0b3f4c9bdc77c4b6c6de6eb7355c179a23568d7a15a8716a5f45683d7ee1f2f`。
- 编译 host：902499 字节，
  `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`。
- 编译 package：1257 字节，
  `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`。

没有重建或加载这些对象。

## 4. 改动内容

消费者从冻结 `9d5a…` 基线作最小适配，净增 77 行：

1. Skill、任务、报告和文件路径改为 `tender-review`；`max_tokens` 从 49152 改为
   Skill 声明的 32768。32 模型/48 工具/45 分钟/1200000 ms/86400000 ms 均未放宽。
2. 清单增加 `referenceNotes`；六个批准输入都在消费者和 B 服务中核对字节、SHA-256、
   `mtime_ns`。要点只作身份核对，不进模型和案件。
3. 三项材料限定为 `txt`、类型 `txt`、单位 `line`；全文覆盖必须等于三项实际行覆盖。
4. 问题改为 `side/focus`，来源标志均为 false。回调只为实际邀请的两个 ID 回答；未知
   ID 到达回调直接失败。问题文本还必须复述任务已给的本方身份及资格/合同重点。
5. 完整回答必须先于首个成功保存；缺问题、无问题、错误回答、晚回答、保存体不符都失败。
6. 引用只以 `must_fix=0` 为硬门；hint 不按 A-E/F/G 盲杀，报告保留全部 problems 和
   qualityHints。三项材料均须有引用并经 `/api/source` 回读。
7. 草稿标题须包含“招标文件审查意见”，正文检查八节骨架；不检查法律结论。
8. 保留真实 CaseRegistry、文本扫描、原生 UUID Session、Host、生产 JSONL、
   SessionCommandController、AgentLoop、finally、关闭重开和自有资源清理。
9. B 服务净增 13 行，只改 tender-review 路径、6 输入 pin、32768、三项 TXT/line
   断言和对应协议字段；拒绝型 transport、lifespan off、OCR/retainer/import/release
   关闭、loopback 和 finally 保持。

完整变更清单和人工复核事实见 README 第 5、6、8 节。

## 5. 只读验证与命令面

本作业的 shell 命令面只有：

```powershell
Get-Content -LiteralPath <冻结输入或新文件>
Select-String -LiteralPath <文件> -Pattern <只读关键词>
rg -n <只读关键词> <冻结路径>
Get-Item -LiteralPath <文件>
Get-FileHash -LiteralPath <文件> -Algorithm SHA256
git status --short --branch --ignore-submodules=all -- <新目录>
git diff --no-index [--stat|--unified=N] -- <冻结基线> <新文件>
```

唯一写入命令面是：

```powershell
New-Item -ItemType Directory -Path <令件指定新目录>
Copy-Item -LiteralPath <冻结基线> -Destination <令件指定新文件>
```

随后三份源码及 README 均由 `apply_patch` 写入。没有其他写入面。

结果：

- 六个批准输入：SHA/字节/`mtime_ns` 全部一致。
- 旧业务残留检索：`contract-draft`、49152、旧材料名、旧三问题 ID、旧“two current”
  等在新三份源码/清单中 0 命中。
- 关键预算检索：32/48/45/32768/1200000/86400000 与 2 个问题 ID 均存在。
- `b-service` 与 `native` 的 `git diff --no-index` 为预期差异退出码 1，不是测试失败；
  差异内容只含上述适配。
- 新目录 Git 状态为单个 untracked 目录。

非零结果如实记录：

- 普通 `git status` 1 次因共享 worktree 的 `dsh` 子模块外部 `.git` 路径权限拒绝。
- `git diff --no-index` 3 次因存在差异返回 1，属预期。
- 6 次非 PowerShell 选择器请求在启动前被运行器拒绝；Bash 实际执行数为 0。
- 2 次 PowerShell 命令构造/管道写法错误、1 次 malformed `rg` 正则、1 次错误候选路径，
  均在只读检查中失败且未改文件。
- 另有少量只读命令误用短名 `pwsh`，不是令件要求的绝对路径；未产生写入。其余检查使用
  指定 native PowerShell。

工具界面把并行调用分组返回，且没有可靠的独立总数接口；因此不虚构“成功 shell 调用
总数”。上列是完整命令类型和全部已知非零类别。

## 6. 运行计数、写面与阻碍

运行计数严格为 0：

| 项 | 次数 |
|---|---:|
| consumer | 0 |
| Agent / Session / Context / Task / Case | 0 / 0 / 0 / 0 / 0 |
| B HTTP 服务 | 0 |
| model request | 0 |
| HTTP request | 0 |
| 子进程 | 0 |
| Node / Python / TypeScript 解析 / 类型检查 | 0 |
| import / test / build / prepare / GUI / SSH / DPAPI | 0 / 0 / 0 / 0 / 0 / 0 / 0 |
| Key / 环境读取 | 0 / 0 |

最终写面：1 个新证据目录、4 个证据文件、1 个正式交回文件；Git 写入 0，产品/测试/
Skill/配置/SDK 写入 0。未使用 `git add`、`commit`、`rebase`、`stash`、`reset`、
`clean`、`checkout` 或 `push`，未改锁、ACL、审批或沙箱。

普通 `git status` 的 `dsh` 权限拒绝保持原状，不作为交付阻断，也未尝试修复。

## 7. 根控下一步

1. 全文审阅消费者、B 服务、清单、六个输入、依赖、类型、setup/finally 和三份新文件的
   逐字节反向差分。
2. 通过后再做有限 admission、ESM/变量绑定和现有专用凭据匿名 stdin 的实际保存路径；
   作者不得运行，也不得通过旧证据替代本次实际结果。
3. 实际运行后人工核对 three-material reads/parts、questions、saves、source GET、
   citations/hints、JSONL 重开、清理和 README 第 8 节事实。

实际运行命令、预期但未运行的链路、完整严格断言和根控人工事实均在 README 第 6–8 节。

到此停止。
