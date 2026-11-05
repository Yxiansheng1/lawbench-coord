# B 线交回：T23 cleanup contract

状态：`AUTHOR_SOURCE_ONLY_RUNTIME0_NOT_RUN`

本次只完成有界源码修订、静态复核和正式交回。没有执行 Python、导入产品、
生成第二份案卷、启动 LibreOffice、调用模型/API、运行 `cleanup-finite.py`
或执行 actual cleanup。原 genuine generation 的总体状态仍是 `FAILED`。

## 交付目录

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuineCleanupContract-20261030-014614\`

- `genuine-plan-build.py`：79,296 bytes，SHA-256
  `5ad883794319c412cb74a1dff524b8b6ab1fed0e32f18379f0e0fa6d6b776d75`
- `literal-inputs.json`：13,920 bytes，SHA-256
  `faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e`
- `cleanup-finite.py`：20,344 bytes，SHA-256
  `2c38bdf99b35b5407a00635206a1e329f46ef40b384529f2103c1b08e3c02592`
- `README.md`：7,413 bytes，SHA-256
  `9dc6db32cf35b1eb4c7e322e2dcafd95a9575880a17c63be060e1f9e0f1261cd`

`cleanup-finite-report-20261030-014614.json` 尚未生成；按令只应由 root
在完整复核后执行一次。

## 已完成的修订

- 确认实际主对象是 `lawbench.case.materials.Materials`，其构造器不自持
  持久连接；`close()` 属于不同的 `_MaterialIds` 类。
- 删除旧 helper 两个错误的 `lb.materials.close()` 调用，增加精确类型断言
  和 no-close API 断言。
- 报告改为 `materialsClosed: null`、`materialsNoCloseAPI: true`、
  `materialsCloseRequired: false`；ASGI、网络、日志和 retainer sentinel
  的实际关闭检查保留。
- `remove_owned_tree` 只对 `temp`、`home`、`localappdata` 和
  `appdata\临时\lo` 启用 Python 3.12 `rmtree(onexc=...)`。仅处理
  `PermissionError` + `winerror 5` + `FILE_ATTRIBUTE_READONLY`；复核根内
  物理路径、reparse、普通文件/目录和原 failed operation 后，单次清除 DOS
  只读位并重试原 `os.rmdir`/`os.unlink` 一次。
- `case` 下临时目录不启用只读恢复；不处理 `appdata` 整目录、真实 HOME、
  源案卷或证据文件，不做 ACL/UAC/授权/takeown/Force。
- `cleanup-finite.py` 固定精确 root，开工前校验 5 个成品、索引、27 个受保护
  复制件和 30 个源案卷文件，只构造真实 `CaseRegistry` 与 `Materials`，
  然后调用候选 `clean_owned_runtime`。它不调用
  `create_app`/routes/converter/model/Key/native/task/case-open/scan，
  不调用候选 helper 的 `main` 或 `execute`。

## 当前私有根事实

只读复核时根仍包含 `appdata`、`case`、`home`、`localappdata`，`temp` 已不
存在。`home\Documents` 仍为 `ReadOnly, Directory`（`0x11`）。这次作者
执行没有删除、改属性或生成报告。

旧证据未改：

- 原 `genuine-plan-build.py` 仍为 76,711 bytes /
  `7c67ce5e26e7e610996689c1e236e5d7b213e2297bfb70f79a97ad8fcd5110df`
- 原 `literal-inputs.json` 仍为 13,920 bytes /
  `faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e`
- 原 `root-run-report.json` 仍为 22,772 bytes /
  `96f47cca0a419bea53fff492601c53fee44e8b19f3ac6737dbdb5446ffacccf6`

## 静态验证与边界

已做只读 diff、禁用调用扫描、路径/哈希和文件清单核对。没有运行 Python、
AST、导入、测试、构建、HTTP、模型、转换器、进程探测或清理。root 后续命令
与复核边界写在交付目录 `README.md`；root 还须使用其外部操作系统身份观察，
runner 不声称该外部观察。

## 偏差与阻碍

- 首次 `git status` 因 `dsh` 子模块目录权限拒绝而失败；改用只读
  `--ignore-submodules=all` 查看 dirty 状态，没有修复权限、锁或 ACL。
- 三次只读文件查看误选 `bash`，均在启动前被运行时以 `E_ACCESSDENIED`
  拒绝；一次 PowerShell 组合状态表达式在解析阶段失败。以上均未读取产品、
  未写入、未启动程序。README 已完整记录。
- 未尝试任何 Git 写操作，也未遇到或处理 `index.lock`。没有 add、commit、
  rebase、stash、reset、clean、checkout 或 push。既有 dirty 内容保持原样，
  新写入仅限上述新证据目录和本交回件。

下一步仅由 root 按 `README.md` 完整复核后执行一次 finite cleanup。作者到此停止。
