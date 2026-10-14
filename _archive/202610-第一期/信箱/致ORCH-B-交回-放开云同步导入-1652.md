# 交回 · 线 B → ORCH · 放开云同步目录导入（回执行令 20261008-1647，N80）

提交 **`3b95e59`**（`T5:`），基于 origin/main `b0d29bf`，不打包。
- **代码**：`case\materials.py` 导入分支删去"源在云同步目录就跳过"的 3 行；`_import_dir` 里没有同样的判断。`check_root`、`check_office_dir` 没动，案件根和日常办公文件夹仍按 SEC-14 拒绝。
- **用例**：`test_sync_folder_source_imported`，由原"跳过"用例改成：
  - OneDrive 目录里的文件、整个目录、"坚果云"目录里的文件，3 项都复制成功、进材料列表；
  - 同一目录当案件根仍报 `CASE_IN_SYNC_FOLDER`；
  - 旧代码上红。
- **用例计数**：materials_api、api_case、gate、t28_macos、t5_gate 共 **190 过、3 跳过**（跳过的是本来就跳过的符号链接权限、macOS 用例）。
- **文档**：Spec 5.1 跳过规则删去"位于云同步目录的源文件"并写明原因，PRD F-MAT-02a 同步；SEC-14、第 4.2 节不动；已跑 build_docs。
- **记一笔**：契约 `materials_import` 跳过原因的枚举仍含"云同步目录"，现在不会再出现，留着无害；删掉算契约改动，记 1.4 清理候项。
