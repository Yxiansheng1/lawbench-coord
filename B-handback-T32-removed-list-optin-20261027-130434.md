# B 交回 T32 移除材料可选列表

## 结论

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 在允许的两处源码、两处契约声明和一份新证据测试内，完成可选 `include_removed` 读路径。默认仍只列当前材料；显式 opt-in 才加入原生墓碑。未提交。 |
| 目标是什么 | 让后续 A 材料页能在根复核后选择显示已移除材料，同时不恢复、读取或扫描墓碑原件及派生文本。当前只到“待根复核并运行新测试”；HTTP/GUI、A 接入和打包未做。 |
| 在等什么 | 等根运行本文给出的新 unittest；全绿后由根审 API 映射与契约，再做有限 HTTP/GUI 和 A 页面接入决定。 |
| 卡在哪 | 没有产品实现阻塞。作者环境按令禁止运行 Python/测试/生成器，因此本轮结果是 `RUNTIME_NOT_RUN`；另有只读 `git status` 被子模块 `dsh` 权限拒绝，已用忽略子模块的只读状态命令记录 dirty。 |

## 改动

1. `service/lawbench/case/materials.py`
   - `Materials.list` 增加仅关键字参数 `include_removed: bool = False`，并拒绝非布尔直接调用。
   - 默认与显式 `False` 仍只返回未移除行。
   - 显式 `True` 使用已加载的原生 `index.json`、`引用.json` 和元数据构造墓碑行。
   - 墓碑固定 `chars=null`、`stale_ocr=false`；不调用 `_chars`，不经过原件/文本 getter，不触发 OCR、网络、回收站或重新扫描。
   - 响应字段和结构未增删；`remove/import/scan/index/context/tools` 未改。
2. `service/lawbench/api/ui.py`
   - 只有 `materials_list` 包装把原始查询串 `"true"` 映射为 `True`；省略、`"false"` 映射为 `False`。
   - `_endpoint` 和所有其他路由未改。
3. `contracts/_build/gen_schemas.py`
   - 只给 `materials_list` 请求增加可选 `include_removed`，枚举值是字符串 `"true"`、`"false"`，并写明用途和墓碑行为。
   - 未运行生成器；未改 `CONTRACT_VERSION`。
4. `contracts/api/materials_list.schema.json`
   - 只同步增加的请求属性。响应、值定义、`required` 仍与原来一致。
   - `contracts/VERSION` 只读核对仍为 `1.6`。
5. 新增证据文件：
   - `docs/plan/evidence/T32/RemovedListOptin-20261027-130434/removed_list_check.py`
   - `docs/plan/evidence/T32/RemovedListOptin-20261027-130434/README.md`

未改工单集、Spec、examples、旧测试、其他 schema、`VERSION`、入口、启动器、运行时文件或 A 线代码。

## 新消费者检查

检查只使用生产 `CaseRegistry`、`Materials`、真实原生引用导入与移除。运行时在唯一临时根创建三份虚构 TXT、案件目录和应用数据目录；不手写索引、编号或历史，不创建任务/OCR，不启动 app、HTTP 或 GUI，不调用模型、Keyring、Office、retainer 或业务网络。

覆盖项：

- 默认、显式 `False` 为当前两份材料；显式 `True` 为两份当前材料加 `M0002` 墓碑。
- 墓碑 `chars=null`、`stale_ocr=false`，编号、名称、引用身份保持；另外两份索引行保持。
- 三份外部 TXT 的 SHA-256、mtime_ns、大小不变；移除目标的派生文本消失。
- 新建 `CaseRegistry`、`Materials` 后仍能从原生持久状态读到同一墓碑。
- 请求契约接受省略、`"true"`、`"false"`，拒绝布尔、数字、任意字符串和 `null`。
- 默认、显式 false、显式 true 三份实际结果都走现有响应契约校验。
- 读取墓碑时，若访问已移除原件、其派生文本或来源目录，测试直接失败；网络连接和回收站操作也直接失败。
- 临时根仅在确认父目录是系统临时目录、名称前缀匹配后清理。本轮没有实际创建或删除测试夹具。

根运行命令：

```powershell
python -B -X utf8 docs\plan\evidence\T32\RemovedListOptin-20261027-130434\removed_list_check.py -v
```

本轮作者结果：`RUNTIME_NOT_RUN`。静态检查没有把它记为绿；HTTP/GUI、A 页面回归、入口重钉均未执行。

## 静态证据与源码身份

`git diff --ignore-submodules=all --check -- <六个本轮文件>` 退出 0。整树 `git diff --check` 也退出 0，只报告既有 CRLF 转换警告。

| 文件 | 本轮结束时整文件 SHA-256 |
|---|---|
| `service/lawbench/case/materials.py` | `0E2A65EC8B98C901B636D176E4AA588A4682376695BF5124194418AE0A9021AC` |
| `service/lawbench/api/ui.py` | `A9E9F4DD18CAE7869847D56A3A15C992CC618EC3FE242A2E0302A169595BA09C` |
| `contracts/_build/gen_schemas.py` | `6902E298C64573473C3898768099093126241F69C1E3FAEB8E143795FDE86762` |
| `contracts/api/materials_list.schema.json` | `F0F0F3E08C8374E36F9E6CF52A84FEE4CCDE43757561EB820B01C9F0343EFF31` |
| `docs/plan/evidence/T32/RemovedListOptin-20261027-130434/removed_list_check.py` | `35E7E43CD72E71BEA7AE43B07276394AD8247638F9BA9009093E97AE0FCC7851` |
| `docs/plan/evidence/T32/RemovedListOptin-20261027-130434/README.md` | `8703C84ED621D7E86DB74063B89F133BC72FE77329226CC54A700FB0157A231E` |

只读状态：

- 分支 `line-B`，相对 `origin/line-B` 为 ahead 141、behind 1。
- HEAD 仍为 `dc56a93be4b07dbe7a48863e3135351659817fb5`；本轮没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 工作树原本已有大量 modified/untracked；本轮只增量修改上列四个既有 dirty 文件并新增上列两个证据文件，其他 dirty 原样保全。
- 无 `index.lock` 操作，未改权限、ACL、sandbox、approval、锁、API 或运行配置。
- 初始 `git status --short --branch` 被 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh: Permission denied` 拒绝；没有修复该子模块。后续只读状态均加 `--ignore-submodules=all`。

## 实际命令与写面

所有成功执行的命令都使用指定 `pwsh.exe` 和 `login=false`。列出的是实际输入；默认工作目录 `D:\Lawbeach\lawbench-B`。

```text
0  Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T32-removed-list-optin-order-20261027-130434.md'
1  git status --short --branch                         [exit 1: dsh 子模块 Permission denied]
2  Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\PROJECT-PROFILE.md'
3  Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\docs\plan\lawbench-关键事实索引-20260928.md'
4  Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\case\materials.py'
5  Select-String -LiteralPath 'D:\Lawbeach\lawbench-B\service\lawbench\api\ui.py' -Pattern 'materials_list' -Context 12,28
6  Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\_build\gen_schemas.py'
7  Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\contracts\api\materials_list.schema.json'
8  git status --short --branch --ignore-submodules=all
9  rg -n "^(    )?(def list|def remove|def index|def _row|def _stale|def _chars|def _material|def _context)|source_deleted|removed" service/lawbench/case/materials.py
10 rg -n -C 6 "materials_list\(" service/lawbench/contracts.py service/lawbench/api/ui.py tests docs/plan/evidence/T32 -g '*.py' -g '*.md'
11 $p='service/lawbench/case/materials.py'; $c=Get-Content -LiteralPath $p; for($i=930;$i -le 1190;$i++){if($i -le $c.Count){'{0,5}: {1}' -f $i,$c[$i-1]}}
12 $p='service/lawbench/case/materials.py'; $c=Get-Content -LiteralPath $p; for($i=1190;$i -le 1420;$i++){if($i -le $c.Count){'{0,5}: {1}' -f $i,$c[$i-1]}}
13 rg -n -C 10 "materials_list" contracts/_build/gen_schemas.py   [误用 Bash；未执行，E_ACCESSDENIED]
14 Get-Content -Raw -LiteralPath 'docs\plan\evidence\T32\RefRemoveEntry-20261027-115753\runs\T33-host-20261027-125552\root-confirmed-remove-verdict.json'   [exit 1: 相对路径不存在]
15 Select-String -LiteralPath 'contracts\_build\gen_schemas.py' -Pattern 'materials_list' -Context 25,15
16 Get-Content -Raw -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32ReferenceRemoveGUI-root-20261027-125552\root-confirmed-remove-verdict.json'
17 Get-Content -Raw -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32ReferenceRemoveGUI-root-20261027-125552\GUI-after-success-dismissed-counter-absent.txt'
18 Get-Content -Raw -LiteralPath 'service\lawbench\contracts.py'
19 git diff --ignore-submodules=all -- service/lawbench/case/materials.py service/lawbench/api/ui.py contracts/_build/gen_schemas.py contracts/api/materials_list.schema.json
20 $p='service/lawbench/api/ui.py'; $c=Get-Content -LiteralPath $p; for($i=27;$i -le 80;$i++){'{0,4}: {1}' -f $i,$c[$i-1]}
21 rg -n "CaseRegistry\(|Materials\(|import_\(.*mode=\"ref\"|materials\.remove|remove\(" service/tests docs/plan/evidence/T32 -g '*.py' | Select-Object -First 200
22 rg -n 'mode="ref"|mode='"'"'ref'"'"'|\.remove\(' service/tests docs/plan/evidence/T32 -g '*.py' | Select-Object -First 250   [exit 1: PowerShell 引号拆词；无产品动作]
23 rg -n '^class CaseRegistry|def __init__|def open\(|def root_of' service/lawbench/case/registry.py | Select-Object -First 120   [误用 Bash；未执行，E_ACCESSDENIED]
24 $p='service/lawbench/case/registry.py'; $c=Get-Content -LiteralPath $p; for($i=1;$i -le [Math]::Min(230,$c.Count);$i++){'{0,4}: {1}' -f $i,$c[$i-1]}
25 rg -n 'ref_context_for|materials = Materials|Materials\(' service/lawbench -g '*.py'   [误用 Bash；未执行，E_ACCESSDENIED]
26 rg --files docs/plan/evidence/T32 service/tests | Sort-Object | Select-Object -First 300
27 Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\.agents\skills\formal-report\SKILL.md'
28 Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-B\.agents\skills\cn-prose\SKILL.md'
29 $p='service\tests\t37_remove_ref_standalone.py'; $c=Get-Content -LiteralPath $p; for($i=1;$i -le 390;$i++){'{0,4}: {1}' -f $i,$c[$i-1]}
30 Get-ChildItem -Force -LiteralPath 'service' | Select-Object Name,Mode; Get-ChildItem -Force -LiteralPath 'service\lawbench' | Select-Object Name,Mode
31 rg -n '^sys\.path|REPO_ROOT|pythonpath|testpaths|service' pyproject.toml pytest.ini setup.cfg service\tests\conftest.py service\tests\t37_remove_ref_standalone.py -g '*'   [exit 1: 三个根文件不存在]
32 rg -n 'network|socket|urlopen|keyring|recycle|monkeypatch|patch\(' service\tests\t37_remove_ref_standalone.py | Select-Object -First 100
33 $p='service\lawbench\case\materials.py'; $c=Get-Content -LiteralPath $p; for($i=1174;$i -le 1212;$i++){'{0,5}: {1}' -f $i,$c[$i-1]}
34 $p='service\lawbench\api\ui.py'; $c=Get-Content -LiteralPath $p; for($i=118;$i -le 128;$i++){'{0,4}: {1}' -f $i,$c[$i-1]}
35 Select-String -LiteralPath 'contracts\_build\gen_schemas.py' -Pattern 'materials_list' -Context 0,15
36 $p='contracts\api\materials_list.schema.json'; $c=Get-Content -LiteralPath $p; for($i=1;$i -le 36;$i++){'{0,4}: {1}' -f $i,$c[$i-1]}
37 $p='docs\plan\evidence\T32\RemovedListOptin-20261027-130434\removed_list_check.py'; $c=Get-Content -LiteralPath $p; for($i=1;$i -le $c.Count;$i++){'{0,4}: {1}' -f $i,$c[$i-1]}
38 Get-Content -Raw -LiteralPath 'docs\plan\evidence\T32\RemovedListOptin-20261027-130434\README.md'
39 git diff --ignore-submodules=all --check -- service/lawbench/case/materials.py service/lawbench/api/ui.py contracts/_build/gen_schemas.py contracts/api/materials_list.schema.json docs/plan/evidence/T32/RemovedListOptin-20261027-130434/removed_list_check.py docs/plan/evidence/T32/RemovedListOptin-20261027-130434/README.md
40 @('service\lawbench\case\materials.py','service\lawbench\api\ui.py','contracts\_build\gen_schemas.py','contracts\api\materials_list.schema.json','docs\plan\evidence\T32\RemovedListOptin-20261027-130434\removed_list_check.py','docs\plan\evidence\T32\RemovedListOptin-20261027-130434\README.md') | ForEach-Object { $item = Get-Item -LiteralPath $_; $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $_; [pscustomobject]@{Path=$_.Replace('\','/'); SHA256=$hash.Hash; Bytes=$item.Length} } | Format-Table -AutoSize
41 git status --short --branch --ignore-submodules=all
42 Get-Content -Raw -LiteralPath 'contracts\VERSION'
43 git diff --ignore-submodules=all --check
44 Get-ChildItem -LiteralPath 'docs\plan\evidence\T32\RemovedListOptin-20261027-130434' -Force | Select-Object Name,Length,LastWriteTimeUtc
45 同 40 的六文件列表，但逐行输出完整 SHA-256
46 git rev-parse HEAD
```

实际写面只有以下 `apply_patch`：

```text
W1 service/lawbench/case/materials.py
W2 service/lawbench/api/ui.py
W3 contracts/_build/gen_schemas.py
W4 contracts/api/materials_list.schema.json
W5 docs/plan/evidence/T32/RemovedListOptin-20261027-130434/removed_list_check.py（新增）
W6 docs/plan/evidence/T32/RemovedListOptin-20261027-130434/README.md（新增）
W7 对 W5 的单次静态收紧：路径守卫改绝对字符串，异常断言改 ApiError
W8 D:\Lawbeach\lawbench-coord\B-handback-T32-removed-list-optin-20261027-130434.md（本文件，新增）
```

三条 Bash 尝试均被环境在启动前拒绝，没有执行命令或改变状态；之后恢复为指定 PowerShell。没有运行 Python、Node、parser、AST、import、collect、pytest、Vitest、tsc、test、selfcheck、build、prepare、serve、probe、HTTP、GUI、model 或 install。

## 未做与遗留

- 新 unittest 未运行，结果只能是 `RUNTIME_NOT_RUN`。
- 契约生成器未运行；JSON 是与生成声明同步手改的对应请求属性，根需在完整审阅后做目标 schema 等价校验。
- `ui.py` 查询串映射只做静态核对；有限 HTTP/GUI 尚未运行。
- A 材料页尚未 opt-in，后续是否显示和交互由根复核后决定。
- Packaging 仍为 HOLD，Gate 1 未完成。

Response ID: `T32-removed-list-optin-20261027-130434`

Response log path: `D:\Lawbeach\lawbench-coord\B-handback-T32-removed-list-optin-20261027-130434.md`
