# 致 ORCH：B 线 DemandClosure P0 源码交回

执行令：`D:\Lawbeach\lawbench-coord\ORCH-B-DemandClosure-P0-source-20261102-171800.md`

状态：有界源码修改与新测试已写入；按令**未运行任何 Python、pytest、collect、parser、build、setup、HTTP、GUI 或模型调用**。Git 全程只读，未 add/commit/rebase/stash/reset/clean/checkout/push。

## 改动

- `service/lawbench/archive/build.py`
  - P0-1：`_write` 去掉 `.docx/.md` 白名单，索引登记本次返回的全部实体文件；`卷宗.pdf`、`发票.pdf` 均以精确扩展名 `pdf` 登记。原原子索引更新与失败回滚路径未改。
  - P0-4：新增 `_persist_confirmed()`，经既有 `gate.write_bytes(..., op="archive_plan")` 把界面确认方案原子回写到 `归档方案.json`；保留律师自由文本，不改写案情简介或分析意见。
  - 旧方案结果与本次确认不同时给出明确复核提醒；确认结果与原文中的直接结果表述不一致时也给出确定性提醒，不做语义替换或结果推断。
- `service/lawbench/archive/documents.py`
  - P0-4：结案报告模板若有结果栏，以确认结果为唯一值，覆盖旧值或无占位符的旧值；若模板没有结果栏，在报告末尾补入“办案结果：<确认值>”。
  - P0-4：`归档目录.md` 固定展示确认的办案结果，并展示结果复核提醒；未新增“客户满意”等任何推断。
- `service/lawbench/checks/citations.py`
  - P0-3：引用事实侧和材料原文侧在比较前统一去掉全部空白；顺序在既有条款号排除之后，未改全局 `search.normalize`，未转换中文/阿拉伯数字，未改显示摘录、出处或源文本。
- `contracts/files/outputs_index.schema.json`
  - 文件格式枚举仅增加 `pdf`，契约版本及其他字段未动。
- `service/tests/test_owner_archive_p0_20261102.py`（新建，全部合成数据）
  - 索引登记全部实体文件及精确格式；
  - `2026 年 2 月 20 日` 正确页通过；同页值错误仍报 C；原文第4页却标第1页仍报 B，摘录保持原样；中文数字不转换成阿拉伯数字；
  - 界面确认“部分胜诉”覆盖旧“胜诉”方案并提示复核；
  - 模板无结果栏时补结果，模板有旧结果但无占位符时改为确认结果；
  - 报告与归档目录均不生成“客户满意”。

## 根因

1. 归档写入后，索引构造用了扩展名白名单，只保留 `.docx/.md`，故实际生成并返回的 PDF 永远不登记。
2. 引用值提取沿用保留空白的位置归一，日期内部空格使 `2026年2月20日` 与 `2026 年 2 月 20 日` 不相等；该问题属于比较口径，不应改全局搜索归一。
3. 本次 `confirmed` 只参与内存构建，未回写保存方案；结案报告模板又只替换已有占位符，无结果占位符时确认值不可见；归档目录原先完全不展示办案结果。

## 静态核验

- `git diff --check` 对四个已跟踪目标文件通过；仅提示 `outputs_index.schema.json` 的 LF/CRLF 转换警告。
- 只读路径核对确认 `_build`、`catalog_md`、`_write` 调用点均已闭合。
- 开始时 Git 状态读取遇到 `dsh` 子模块权限拒绝；随后用 `--ignore-submodules=all` 完成只读状态核对，未修锁、未扩权、未改 ACL。仓库原有 dirty 大量存在，本线只新增/修改上述五个路径，未回滚或覆盖其他 dirty。

## 测试状态

**NOT RUN**（执行令禁止本线运行 Python/tests）。建议 ORCH 在完整 setup/cleanup 复核后至少运行：

```powershell
python -m pytest service\tests\test_owner_archive_p0_20261102.py -q
python -m pytest service\tests\test_archive.py service\tests\test_checks.py -q
python contracts\check_examples.py --skills skills
```

未宣称红绿结果；旧测试或旧证据不得用于宣称上述已改源码行通过。

## 文件 SHA-256 与字节数

| 文件 | SHA-256 | 字节 |
|---|---|---:|
| `service/lawbench/archive/build.py` | `5AE9BF49FC936FB0CDEA08183C49A1E4C30000AB866EA765965810978660CF0B` | 18448 |
| `service/lawbench/archive/documents.py` | `A20AEA59A0B2EE47D465A49ADB096C425E7DEB0523647A9D0F23BD3A7F197A66` | 16267 |
| `service/lawbench/checks/citations.py` | `0A49F427C1CAB6802683554E496D6685B2189DCC98828BB2E5F486274B86B671` | 19893 |
| `contracts/files/outputs_index.schema.json` | `6FEA34F663068A42542C007F60AD709E4F53A506D9A25B4936DF8F14935C1255` | 2229 |
| `service/tests/test_owner_archive_p0_20261102.py` | `B769F0A3F88D7BEA374B474381C27329991E3D7C252666D69B9715472641DA4F` | 6422 |

## 未决/边界

- 执行令点名的 `contracts/api/outputs.schema.json` 在当前工作树不存在。现有读接口 `contracts/api/outputs_list.schema.json` 的 `response` 与 `value` 都直接引用 `contracts/files/outputs_index.schema.json`，因此已随该枚举接受 `pdf`。未改 `outputs_confirm.schema.json` 中只适用于草稿确认的 `md/docx` 枚举，避免放开后端不支持的写路径；请 ORCH 确认这一路径名称差异。
- P0-1、P0-3、P0-4 的有界确定性路径均已实现；仍需 ORCH 跑上述测试并做最终源码/契约复核。无实际案卷、发票、私有试跑材料、`.env.local`、Keyring 或凭据被读取或写入。
