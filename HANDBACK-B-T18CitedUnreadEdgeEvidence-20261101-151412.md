# B 线交回件：T18 引用未读边界证据

状态：`SOURCE_AUTHORED_NOT_RUN`

本件只交回源代码与运行说明。B 线执行者没有运行 pytest、Python/Node/解析器、collection、服务、HTTP、模型或 GUI，也没有把任何预期结果称为实际通过。没有 Git 操作，没有暂存、提交、rebase、stash、reset、clean、checkout 或 push。

## 写面

1. 追加：`D:\Lawbeach\lawbench-B\service\tests\test_t18_cited_unread_20261101.py`
2. 新建：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadEdgeEvidence-20261101-151412\old-bootstrap.py`
3. 新建：`D:\Lawbeach\lawbench-coord\HANDBACK-B-T18CitedUnreadEdgeEvidence-20261101-151412.md`

除以上测试追加、旧 bootstrap 派生件和本交回件外，B 线没有修改产品源码、测试辅助层、TaskStore、契约、原始旧 bootstrap 或原始旧 `drafts.py`。产品源码保持执行令给定的 SHA-256 `03d8a77d41a75338ae3baa239e9572b97d71d74ad4bff4bbe01fe9709e20957d`。

原有测试前缀必须保持 8985 bytes、SHA-256 `d341d1ec25e9ad6e265523c92cfdf7a07c0cd70c952e3f08630b0e88bfa93047`。本次只在原文件尾部追加，不修改既有六个节点、断言或受保护闸门。

## 追加的五个节点

1. `test_t18_edge_docx_para_denial_then_single_para_allows`
   - 仅使用原始 `CASE_FILES["证据/借条.docx"]`。
   - 初始读取台账为空，先由既有 `_assert_citation_denied` 验证引用第1段被拒、无草稿/`result.json` 变化、任务仍在运行且不泄露材料名或私有正文。
   - 随后公开 `case_read_material` 读 `start=1,end=1`，核对 `unit=para`、台账中当前任务的 material ID/version/unit/range，再保存相同引用内容，核对 version 1、草稿物理 bytes 和材料原件 bytes。

2. `test_t18_edge_pdf_page_denial_then_single_page_allows`
   - 仅使用原始 `CASE_FILES["起诉意见书.pdf"]`。
   - 初始读取台账为空，先验证引用第2页被拒且无副作用。
   - 随后公开读取 `start=2,end=2,max_chars=8000`，核对完整 `page`、`has_more=false`、`next_offset=null`、当前任务读取台账，再保存相同引用内容并核对 version 1 与物理 bytes。

3. `test_t18_edge_budget_stopped_carries_reads_to_next_same_session_task`
   - 同会话真实读取小 TXT 第1行，再经公开 `/core/task/end`、`reason=budget` 结束。
   - 请求中的 usage `model_calls=7,tool_calls=2,elapsed_s=3` 是测试合成值，不代表真实模型预算或真实 API 调用。
   - 核对原任务实际落盘 `state=finished`、`result.status=budget_stopped`；用既有 `_selected_task` 新建后继任务，核对任务 ID 不同、读取记录逐项相同，随后同引用保存 version 1。

4. `test_t18_edge_completed_does_not_carry_reads`
   - 同会话真实读取后以 `reason=completed` 结束，核对 `completed` 实际状态。
   - 后继任务 ID 不同、读取台账为空；同引用保存被拒，由既有 helper 核对草稿/result 不变且任务仍为 running。

5. `test_t18_edge_error_does_not_carry_reads`
   - 同会话真实读取后以 `reason=error` 结束，核对 `failed` 实际状态。
   - 后继任务 ID 不同、读取台账为空；同引用保存被拒，无文件变更且任务仍为 running。

五个节点均使用各自独立会话和案件，均以 `try/finally` 调用 `env.close()`；没有 sleep，也没有伪造 Native 事件、history 或模型预算。

## 原始实现对照模式

追加的 autouse fixture 同时满足 `request.node.name.startswith("test_t18_edge_")` 与 `os.environ.get("LB_T18_COMPARE_ORIGINAL_SAVE") == "1"` 才启用。默认缺省 flag 时不读旧源码、不执行提取、不产生任何 patch，直接使用当前真实 `drafts.save_draft`。

对照模式仅读取固定源：

`D:\Lawbeach\lawbench-coord\T18CitedUnreadProductFix-20261101-144353Before\drafts.py`

并先断言整文件 SHA-256 为 `e46c1656ecea6f151e1ca827aad2911e45a54b2a14abc8f1abfb5df92d817822`。随后只截取 `def save_draft(` 到 `def _save_locked(` 之前的单一函数原文，用当前 `drafts` 模块 globals 的字典副本 `compile/exec`，最后只 monkeypatch `drafts.save_draft`。没有替换 authorize、gate、deny、TaskStore、出处检查器、当前 `_save_locked` 或 UI 尾段；没有回滚真实文件。B 线没有执行该 fixture。

## 旧 bootstrap 派生件

`old-bootstrap.py` 是从以下原件逐字节复制后得到的派生件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadBootstrap-20261101-143849\bootstrap.py`

文本级逐行比较显示只增加三项数据：

1. 在 `os.environ.update(safe_env)` 后增加 `os.environ['LB_T18_COMPARE_ORIGINAL_SAVE'] = '1'`
2. 在测试模块路径参数后增加 `-k`
3. 紧接增加 `test_t18_edge_`

guard 函数、冻结 38 项、环境检查、T37 ignore、`finally`、summary 和 disposal 均未改。如做逆向核对，仅删除上述三项即可恢复原 bootstrap 内容；不得覆写原始 bootstrap。读取 guard 原本只限制可写打开，不改读取 guard 即可读取固定旧 `drafts.py`。

owner 若另行运行，必须提供一个新的、已存在且为空的绝对 private root，并把 JUnit 放到该 root 的子路径：

```powershell
python D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadEdgeEvidence-20261101-151412\old-bootstrap.py --private-root <fresh-empty-absolute-root> --junit <fresh-empty-absolute-root>\junit.xml
```

B 线没有创建 private root，没有运行 bootstrap，也没有执行清理。清理范围只能由 owner 限于该新建 private root，不得指向源码树或协调目录中的既有内容。

## 未执行预期

以下只是执行令规定的待验证预期，不是本次运行事实：

- 当前实现、缺省 flag：模块共 11 个节点应通过。
- 旧实现对照模式：五个边界节点中预期 4 个未读拒绝断言失败，1 个合法 budget 续接保存通过。

本次没有测试输出、JUnit、日志或截图，因此不宣称任何 red/green 结果。
