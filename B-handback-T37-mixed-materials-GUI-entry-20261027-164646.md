# 线 B 交回：T37 混合 legacy-copy / ref 材料 GUI fixture 入口

## 结论

状态：`RUNTIME_NOT_RUN`、`PREPARED_FOR_ROOT_REVIEW`、`GUI_NOT_VERIFIED`。本件只交回新增入口、有限探针和说明。作者没有运行 Python、Node、HTTP、GNU、GUI、模型、OCR、Office、构建、测试、prepare、serve 或安装命令，不声明任何绿证。

本次只补原 T37 卡的固定混合场景：同一合成案件先以旧缺省 copy 导入 `scope-in.txt`，再以当前 ref 导入另外两份文件。没有改产品、UI、schema、契约、运行时、构建、源码 pin、P29、旧入口或旧探针。

## 固定输入与保全

- 正式执行令已完整只读：`D:\Lawbeach\lawbench-coord\T37-mixed-materials-GUI-entry-order-20261027-164646.md`
- 输入索引：`D:\Lawbeach\lawbench-coord\T37MixedGuiInput-20261027-164646\index.json`
- 当前 B HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 固定源码清单：`D:\Lawbeach\lawbench-coord\T32TaskCancelSourcePinsInput-20261027-145932\reviewed-source-pins.json`
- 源码清单：53,547 bytes，SHA-256 `5afec6625cbdb6459b5fb59788f9dd734b79775f3bff6ede802ed247667168cf`
- 复用入口快照：141,021 bytes，SHA-256 `399f49b59097c87548c2dec307cbfac8cbe828f1fb4845b5d2c23c99f5c5947d`
- 复用探针快照：22,165 bytes，SHA-256 `b1b3fa29d57ad1b727dc04c21804dcb117b0d6efb970d94b29a9d2cf3b62cb92`

初始顶层 `git status --short` 因父 worktree 的 `dsh` 子模块目录权限拒绝而失败；随后只用了 `git status --short --ignore-submodules=all` 观察状态。没有修锁、改 ACL、扩权或触碰子模块。已存在的顶层脏改全部保留。

## 交付文件与冻结身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\server.py` | 151259 | `7d4a45196746b6f29ea1877de32ab2652767ad9b4c20d7cc63f4a9f533584eb6` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\probe.mjs` | 31434 | `f18e06f0febb040058057759df97acdff1ff4758428d27a28d462b690d93d1de` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\README.md` | 10059 | `f44f35adde5bf3a2b59e206f37813a4ca9a3527ec391468d567a8d1168d4db6d` |

三份都是本次新目录内的新文件。没有 Git add/commit/rebase/stash/reset/clean/checkout/push，也没有暂存。Git 写入不在本运行器授权内，交回以本文件和协调目录落盘为准。

## 有界修改

- `PREPARED_FORMAT`：`T37-mixed-materials-gui-prepared-v1`。
- setup 固定为三次 ASGI 原生请求：`case/open`；只含 `scope-in.txt` 的缺省 copy import；含 `scope-out.txt`、`scope-third.txt` 的 ref import。
- `_verify_case_only_state`：第二次 import 前验证唯一 `M0001` 案件副本、缺失/空 refs、派生文本和来源未变。
- `_native_refs`：验证两个文件引用根 `R01/R02`、`next_seq=3`；删除后允许 `R01=removed`、`R02=ok`。
- `_native_materials`：验证 `M0001=case`、`M0002=R01`、`M0003=R02`，三行 parsed，材料/位置/text_path/当前 SHA 全部由产品生成；不要求原始 `M0001` 显式写 `origin`。
- `_source_payload_matches` / `_case_copy_state`：只允许案件内一份与外部原件逐字节相同的 `scope-in.txt`；两份 ref 原件不得有案件副本。
- `_complete_import`：首响应恰为一项 copy 和 `added=1`；第二响应为两项 `registered` 和 `added=2`。
- `finish_setup`、pre/post remove 状态、`evidence()`、ready/final 摘要：改为一个案件来源加两个引用来源；目标仍只移除 `M0002`。
- `probe.mjs`：改为混合三行、两个引用徽标身份、删除前三态、21 次 TCP 负/正序列、删除后 `M0001/M0003` 不变和真实 `M0002` 墓碑。

保留的 guard 不变量：同一随机 IPv4 loopback；私有 HOME/TEMP/APPDATA；内存假 Key；Keyring/外连 0；内存 `LB_TOKEN`；原生 strict auth；单次 claim/inflight/phase；无重复 body/query；per-request `include_removed` 绑定；source/settings/daily marker 身份；空任务目录；单一案件登记；Office/OCR/Retainer/回收站不启动；20 秒自然退出和 cleanup。

## 预期 setup 与有限探针

setup 精确 3 次：`POST case/open`、`POST materials/import`（legacy copy）、`POST materials/import`（two-file ref）。

TCP 精确 21 次：

1. 删除前 default/false/true 列表各 1，共 3 次原生 200。
2. 同案重开两次成功、第三次 guard deny。
3. remove 负向错案/错目标/额外 body/额外 query 共 4 次 guard deny。
4. remove 两种重复 Authorization 共 2 次 401。
5. 唯一成功 remove `["M0002"]`。
6. 五个非法材料查询 guard deny。
7. 删除后 default/false/true 各 1，共 3 次原生 200。

预期 TCP 总计：21 requests = native 200 共 9 + auth 401 共 2 + guard 403 共 10；材料列表原生成功恰 6 次。删除后 `R01=removed`、`R02=ok`，外部三份原文件及 `M0001` 案件副本不变。

## root 绝对命令

以下命令是待执行命令，不是作者已运行输出。root 复核后才能运行。

```powershell
$run = 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\runs\T33-host-<YYYYMMDD-HHMMSS>'
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\server.py' --prepare --root $run
```

serve 必须由 root/A 既有私有启动器设置本 run 的 `LB_PORT`、64 位小写十六进制 `LB_TOKEN` 和 `LB_APPDATA=<run>\private\appdata`，再执行：

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' -B -X utf8 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\server.py' --serve --root $run --seconds 20
```

有限探针：

```powershell
$env:LB_REF_REMOVE_GUI_ROOT = $run
& 'E:\node\node.exe' 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\probe.mjs'
```

后续 A 数据型启动器不在本件编写。它必须按上述新 SHA/bytes 冻结入口；stop 的 `NativeEntry` 全路径必须是 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\MixedMaterialsGui-20261027-164646\server.py`，以匹配 owned PID/exe/birth。

## 实际命令、非零与写入面

- `RUNTIME_NOT_RUN`；作者运行时调用数为 0。
- 只读受阻：初始 `git status --short` 在共享 worktree 的 `dsh` 子模块目录收到权限拒绝；未修复、未扩权，改为忽略子模块的状态查询。
- 一次误用 `bash` 外壳的只读命令被环境以 `Bash/E_ACCESS_DENIED` 拒绝，未执行、未写；此后严格使用 PowerShell。
- 两个临时的 PowerShell 元数据/存在性单行命令有语法错误并以非零结束，未写文件；修正后的只读命令成功。
- 写入面仅本次证据目录三文件与本交回件；没有写协调目录其他件、产品源码、旧证据、Git 索引或其他工作树。

## 声明边界

本件不提供 HTTP/GUI 绿证、真实墓碑运行结果、请求账、截图、整张 T37 完成、整项目完成或打包就绪。后续 A 只读 GUI 要读取三类混合材料；任何实际 GUI 移除仍需动作时真人确认。Packaging 保持 `HOLD`。
