# 致 B · 执行令 · 契约升 1.4（服务侧）+ 待办 10 端口原因分类（2026-10-10 14:28 +08:00）

开工先读完信箱新件逐一回应件名；`git rebase main`（头 `5e0d218`）。用户 10-10 定"小尾巴能做就做"。两件事**分两个提交**，待办 10 先交（小，进第七版），1.4 后交（进第八版，不卡第七版打包）。

## 一、待办 10（rv-A50 NOTE）：端口被占原因分类
服务起不来时 stderr 现在只写"18765 端口被其他程序占用"。WinError 10013 多半不是别人占了，而是落在 Windows 的**保留端口段**（`netsh int ipv4 show excludedportrange protocol=tcp`，Hyper-V/WSL 常见）。要求：服务启动绑定失败时 stderr 首行带可机读类别 `PORT_IN_USE` / `PORT_RESERVED` / `PORT_DENIED`（10013 且端口在 excludedportrange 内→RESERVED；10048→IN_USE；其余→DENIED），后跟中文一句（RESERVED 的话："18765 在 Windows 保留端口段内，请在设置里换一个端口"）。查保留段只跑一次 netsh、超时 3 秒、失败按 DENIED。用例：三类各一，netsh 输出用 fixture 文本。客户端展示由 A 随后做，你把三个类别字面写进 `contracts`？——**不改契约**：stderr 不是契约面，类别常量放 `service` 一处并在交付说明写明，A 读源码对照。

## 二、契约 1.4（服务侧 + 契约文件 + Skill 适配）
候项汇总 `D:\lawbench-coord\ORCH-契约1.4候项.md`（14 项）。按事实索引第 8 节流程：`contracts\_build\gen_schemas.py` + VERSION 1.4 + Spec 20.12 变更记录 + `check_examples`。逐项：
- **做**：1 N45 正则；2 `ORIGINAL_HAS_REVISIONS`；3 status 9B 提示字段；4 `case_card_invalid`；5 `/api/source` 加 task_id；7 **`POST /api/materials/remove`**（按线 B 10-06 最小方案 `evidence\T5\材料删除-最小方案.md`：原件移回收站、删文本/识别/检索、index 条目保留 status removed、幂等、返回四类；`material_status` 加 `removed`；**SEC-08 口径：移到回收站，不永久删**）；8 `materials_list.chars`；9 `case_read_material` 一次多份；10 outputs 加 `draft` 来源路径（confirm 时写）；11 `materials_import` 跳过原因枚举去"云同步目录"；12 `case_open` 可选 `folders` 名单（服务按 gate.py mkdir_original 补建，替代 Host caseFolders）；13 wiki 核对状态字段（服务端记，多机一致）；14 prep395 `/health` 加 `ocr_model`（这项在 prep395 契约里，改 `contracts\prep395\health.schema.json`，服务侧 prep395 由 C 做——你只改契约文件并在交付说明点名）。
- **不做/候**：6 N66 原图（候拍板，不进 1.4）。
- 旧客户端兼容：新字段全部可选，1.3 客户端照常；服务 `contract_version` 报 1.4。
- 每项用例红绿；service 全量过；Skill 若引用变化（read 多份、draft 字段）跟着改并 build_skills + check_examples。
- 交付说明列"客户端要跟的点"清单给 A/D：materialRemove 放开、draft 对应改按 outputs.draft、caseFolders/wiki 核对改走服务、端口类别展示。

交回件：`致ORCH-B-交回-端口原因分类-<HHMM>.md`、`致ORCH-B-交回-契约1.4-<HHMM>.md`。
