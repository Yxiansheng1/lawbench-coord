# B 线正式交回：T18 刑事申请输出规则专项审计

- 工单：T18 刑事申请输出规则专项审计
- 状态：有界修改完成，静态核对完成；按令未提交、未暂存、未推送
- 当前 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 产品改动：`D:\Lawbeach\lawbench-B\service\lawbench\tools\drafts.py`
- 新文件 SHA-256：`d11c360b8ac017d7c273b4be6b46cbaeb440756a7c84fadcb38aadf3f19c21ca`
- 详细发现：
  `D:\Lawbeach\lawbench-coord\B-T18-criminal-application-output-rule-findings-20261029-153305.md`

结论：`case_save_draft` 和界面 `save_document_ui` 共用的 `_save_locked`
已增加最小结构检查。`criminal-applications` 任务在材料不是全部不可读且
正文缺少固定说明 `法律依据待律师核实` 时，返回 G 类 `must_fix` 和
`passed=false`，但保留草稿供修复；全部不可读回退不追加本问题。

验证等级：静态源码、pin、diff 和原草稿哈希核对；`git diff --check` 为 0。
按执行令未运行 Python、导入、契约程序、pytest、构建、服务、HTTP 或模型，
因此不是红绿测试通过，也没有宣称模型会自动完成第二次修正。

未解决：无依据的“部分谅解”、受理机关问题缺正式位置出处、申请理由的
法律/事实语义、最终聊天自检，以及确认导出路径，均未用关键词或 NLI 猜测；
详见发现文件第 6、8、9 节。
