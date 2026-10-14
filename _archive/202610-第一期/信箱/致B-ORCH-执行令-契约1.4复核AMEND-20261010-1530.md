# 致 B · 执行令 · 契约 1.4 复核 AMEND（rv-B24 对 7a065b5；2026-10-10 15:30 +08:00）

生成物、检查脚本、全量、remove 闸门实验都对得上。一处 P1 加几处小修，一个 T3 提交叠在 1.4 之上（与 kind 可同一提交），交回后换新复核员审累计范围。**顺序：先交端口四修（独立提交），再交这个。**

1. **P1-1（阻断）网络盘/U 盘上"移到回收站"= 永久删除**：`trash.py _recycle_windows` 用 `SHFileOperationW FOF_ALLOWUNDO|FOF_SILENT…`，目标所在位置没有回收站（UNC、映射盘、多数 U 盘）时 Windows 静默永久删除，而 `recycle()` 只查"文件还在不在"就报成功。复核员实测 `\localhost\D$\…` 文件消失且回收站里没有。**定口径**：移之前核路径非 UNC 且 `GetDriveTypeW == DRIVE_FIXED`，否则进 `failed`，reason "该位置没有回收站，未移除；请在资源管理器里自行处理"。**不加 `FOF_WANTNUKEWARNING`**（服务无界面，不许弹框）。回收站容量不够的情形记交付说明已知限制。加用例（UNC 或 mock 盘类型 → failed、回收函数未调用）。
2. **P2-2（阻断，测试缺口）**：remove 闸门去掉后 `test_materials_remove.py` 仍绿。加一例：登记后把材料所在目录换成指向案件外同名文件的联接 → `failed`、回收函数未调用、案件外文件还在。
3. **P2-3 定**：`case_open.folders` 只替代标准目录；律师**自填目录仍走 Host `caseFolders`**，不扩契约。交付说明"客户端要跟的点"第 4 条改为"标准目录走 folders，自填仍走 Host"。
4. **P2-4**：`case_open.kind` 候项 15（已注记），一起补。
5. **P2-1 知悉**：prep395 `CONTRACT_VERSION_FALLBACK` 由线 C 改（已令），合并时同车；你不碰 prep395。交付说明那句"不改也不会断"补一句"prep395 自己的版本用例会红，线 C 同车改"。
6. **P3-1**：`context.load_card` 把 `ContractError`/`ValueError` 转成 `CASE_CARD_INVALID`（现在是 INTERNAL 500）。
7. **P3-2**：流水线写 case.json（`steps\wiki.py` ~587）也拿 `_WIKI_LOCK`。
8. **NOTE 1/2**：闸门拒绝时 `failed.reason` 别写"可能正被其他程序打开"，写"该材料位置不在案件内，未移除"；index `rel_path` 被改成 `../` 时进 `failed` 而非 500。
9. **NOTE 4**：Spec 20.12 的 1.4 行"1.3 的客户端照常"改为"字段兼容；客户端与服务同包升级"，build_docs。
10. NOTE 3（more_names 略超 max_chars 十几字）不改，交付说明记一句。

交回件 `致ORCH-B-交回-契约1.4修-<HHMM>.md`，附 service 全量计数。
