# B 线交回：T37 旧 copy 与当前 ref 混合持久化有限消费者

状态：**SOURCE_AND_README_COMPLETE / RUNTIME_NOT_RUN**

正式执行令：

- `D:\Lawbeach\lawbench-coord\T37-legacy-mixed-order-20261027-080232.md`
- 6,162 bytes，SHA-256 `d82b08de3e49718eb6b7014ae91df35993c5b43b37dc3db7085d235fc3b0fa10`

本线按令只补原 T37 第二阶段的当前原生缺口：旧缺省 copy 请求形态与新 `mode="ref"` 引用根在同一案件磁盘上并存，经两次同进程冷对象重建，再按计划删除自有合成源并核对 `parsed`、`missing`、`source_deleted` 及文本保留。没有修改产品、旧测试、契约、source pin、运行时、P29、旧证据或根脚本；没有声称已证明产品 bug。

## 允许写盘与实际交付

本线只新增了正式令允许的三个文件：

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\LegacyMixed-20261027-080232\legacy_mixed_check.py` | 36,960 | `30f7239eb19cfd0cf38bff695331b684f24144c10855326f032f7b4a07b2a6f9` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\LegacyMixed-20261027-080232\README.md` | 10,674 | `8f51769feccb79e6cfcd9fbeebe403c744f37d6331ae95125f65212e02431046` |
| `D:\Lawbeach\lawbench-coord\B-handback-T37-legacy-mixed-20261027-080232.md` | 本文件 | 自哈希不列 |

未修改两份固定输入：

- `fixed-inputs.json`：`bf0b563d1c1b4754c74bdba39b1406aa06531953f17791802911a3486c29577b`
- `product-source-map.json`：`5fb557e5985a9165570b1e854bef6f82024b34df56a0c3a96e4c6160e99e50ed`

当前相关产品源码只读哈希与固定快照一致，包括：

- `service\lawbench\case\materials.py`：`3983f6e90337be065819eb24539a81dc9a181ef4d5d81303656e713954627078`
- `service\lawbench\case\registry.py`：`05d3266afd7efb4108d416102c35d548aae29b011cdfb8b757872a8b0e656c21`
- `service\lawbench\case\refs.py`：`76d2f550a65b1f07b504e46fb5dbfa53351391bcaa1217cb78aa4ed869ba2ac2`
- `service\lawbench\case\ref_paths.py`：`37a0f8ff7f4bf0e645c7c66e2bb07ce9db97aac69f871e9b9f2ee2b23b876b8a`
- `service\lawbench\case\texts.py`：`1f44044b450d6816b1384288391f5a72229b236e8d067a958b424dadae6f85c4`
- `service\lawbench\case\gate.py`：`cfed621cd2729d595c61f600c6eea88903de867d5647911881314104171a482e`

完整输入/契约哈希和允许写盘范围见 README。

## 脚本语义

唯一 `unittest` 场景使用真实当前 `CaseRegistry`、`Materials`、`RefRegistry`、路径闸门、TXT parser 和契约：

1. 用旧请求形状 `Materials.import_(..., target=None, unzip=False)` 导入合成 ASCII TXT，不传 `mode`；核对案件内原件副本和缺省/`case` origin。
2. 保存产品生成的 material identity、SHA/version、size、mtime、`imported_at`、`text_path` 以及生成文本的精确 bytes/hash。
3. 丢弃对象并从同一私有 `appdata/case` 磁盘重建真实对象，重扫和列表；legacy 身份、状态和文本不变。
4. 用 `mode="ref"` 登记另一外部合成 TXT 根；核对两个不同身份、correct `origin/ref_id`、外置原件路径和 copy 持久性。
5. 遍历案件文件，断言唯一 `.txt` 原件为预期 copy 副本、没有文件与 ref 源逐字节相同；派生 `.md` 可含正文但 hash 不同，不误判。
6. 第二次冷重建并重扫/列表，核对两类材料身份、来源 metadata 和文本仍未变化。
7. 顺序 unlink 自有外部 legacy copy 源、自有外部 ref 源、自有案件内 copy 副本；每次 unlink 前重验 SHA/size/mtime。
8. 最终 legacy 为 `source_deleted`，ref 为 `missing`，两份产品生成文本逐字节保留；全程不使用 `Materials.remove`、回收站或 trash。

脚本不使用 fake Materials/Registry、AST、手写 index/task/result、跨卷框架或 GUI/HTTP/模型。它在产品首次导入前阻断网络、进程/Office 启动、app/ASGI/lifespan/OCR/Retainer/Keyring/model 导入，并只对 TXT 转换器使用拒绝桩。

测试根由显式 `--parent` 下新建的唯一 `t37lm-<12hex>` 根承载；`appdata`、fake home、case、copy 源和 ref 源均为其内彼此分离的 sibling。清理注册早于 mkdir 和产品导入，并校验精确直系父目录、marker、containment、父链/整树无 reparse 后才递归删除自有根。

## 运行与命令账

作者运行状态：**RUNTIME_NOT_RUN**。

作者没有执行 Node、Python、解析器、AST、pytest、unittest、collect、import、build、prepare、serve、probe、HTTP、GUI、模型、selfcheck、安装或其他测试命令。作者 consumer runtime command 清单为空，故 consumer runtime exit code 为 **N/A**。

root 全文复核后只允许执行 README 中这一条待运行命令（执行前由 root 创建并确认自己的短父目录）：

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\LegacyMixed-20261027-080232\legacy_mixed_check.py' --parent 'D:\T37LM-OWNED'
```

退出码 `0` 才表示唯一测试、全部断言、外部守卫和清理均通过；任何非零都必须原样保留 stdout/stderr 后复核。不得把 README 或本交回当成运行通过。

作者侧非零只读检查事件也如实记录：

- `git status --short --untracked-files=all` 退出 1：`lawbench` 主仓的 `dsh` 子模块目录 `D:\Lawbeach\lawbench\.git\worktrees\lawbench-B-new\modules\dsh` 权限拒绝，随后用 `--ignore-submodules=all` 只读确认主树既有大量 dirty 和长路径警告，未清理/暂存。
- 两次 PowerShell 哈希清单命令出现同一 ParserError（`foreach ... } |` 管道写法），均未写文件；改用 `$rows = foreach ...; $rows | ...` 后成功。
- 一次 PowerShell `rg` 正则引号错误退出 1，未写文件。
- 四次工具请求误配置为 `shell=bash`，均在启动层被拒绝且没有执行任何命令；未用 bash 包装、未改 shell/审批/沙箱/ACL。

这些均为只读检查事件，不是 consumer 验证结果，也不改变 `RUNTIME_NOT_RUN`。

## Git 与 dirty

Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout、push，未暂存、未改 index/lock，未扩权或改 ACL。正式令禁止 Git 写，因此没有 commit SHA；`index.lock` 或权限拒绝不是本线待修交付阻碍。

现有 dirty 原样保留。发现的长路径 warning、未初始化/权限拒绝的 `dsh` 子模块和既有 product/evidence dirty 均未处理。

## 限制与门状态

- “legacy”仅表示当前代码接受的旧缺省 copy 请求形状；没有打开字节级旧版发布数据库，也不证明升级迁移。
- 不覆盖 GUI、HTTP、ASGI/lifespan、真实用户目录、真实案卷、真实跨卷或 OS 重启。
- 不覆盖全部 T37、全部旧格式或全部升级路径。
- Packaging：**HOLD**；Gate 1：**尚未完成**；GUI：**NOT_VERIFIED**。
- 本次是覆盖缺口的有限候选源码；root 必须全文复核并实际运行后才能形成一次有限原生证据。
