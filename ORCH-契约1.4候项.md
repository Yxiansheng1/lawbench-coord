# 契约 1.4 候项清单（主编排维护，2026-10-06 21:55 建）

改契约走 `contracts\_build\gen_schemas.py` + VERSION + Spec 20.12，一批做。来源散见各卡交付说明与候 owner 清单，这里汇总。

| # | 候项 | 来源 | 状态 |
|---|---|---|---|
| 1 | N45 正则（案件名/编号校验） | T13 | 候 |
| 2 | `ORIGINAL_HAS_REVISIONS` 原文含修订专用码 | T15 | 候 |
| 3 | status 9B 提示字段 | T11/T22 | 候 |
| 4 | `case_card_invalid` | T13 | 候 |
| 5 | `/api/source` 加 `task_id` | T9 | 候 |
| 6 | 原文查看返回图片材料原图（N66） | T9 | 候拍板 |
| 7 | **`POST /api/materials/remove`**（case_id、material_ids、delete_original；原件移回收站；删文本/识别页/检索行；index.json 条目保留、状态 `removed`；幂等；返回 removed/already_removed/failed/wiki_needs_update）+ `material_status` 加 `removed` | 线 B 2026-10-06 `evidence\T5\材料删除-最小方案.md`；律师反馈 | 候；**待定 SEC-08 放宽为"确认后移到回收站"**（主编排建议允许；"只去索引留原件"不允许） |
| 8 | `materials_list` 加 `chars`（每份材料文本字数，服务端算一次） | 线 B `evidence\T18\read-capacity.md` | 候 |
| 9 | `case_read_material` 一次读多份小材料 | 线 B read-capacity | 候（提升读全容量） || 10 | `成果/索引.json` outputs 加 `draft`（来源草稿路径），界面按路径对应草稿↔成果 | rv-A52 P1 b） | 候 |
| 11 | `materials_import` 跳过原因枚举删"云同步目录"（已不再出现） | N80 | 候 |
| 12 | `case_open` 加可选 `folders` 名单（律师勾选的子目录），替代 Host `caseFolders` 过渡 | 线 A 1955 | 候 |
| 13 | wiki 核对状态服务端字段（多机一致），替代本机指纹 | 线 A 1955 | 候 |
| 14 | `/health`（prep395）加当前识别模型名字段（现 `additionalProperties:false`，先用识别结果 `backend` 字段带模板名 `llama.cpp/vulkan:xiaomi-ocr-0` 代替） | 线 C 2026-10-10 交回 1310 | 候 |
| 15 | \`case_open\` 加可选 \`kind\`（民商事/刑事/日常事务），替代本机记案件类型（新建案件与拖文件夹建案件两条路都传） | 线 A 1449 请定 1 | 候（B 1.4 顺带） |
| 16 | 设置加工作台/转发端口项，DSH 侧模型地址跟改（补丁）；现 RESERVED 只能"联系技术支持" | 线 A 1527 请定 1 | 候（1.5） |
| 17 | `POST /api/case/forget`（case_forget）：只从 cases.json 删该案件登记，文件夹不动；左栏"从列表移除案件"调它，首页卡片与"切换案件"下拉随之一致 | 用户 10-10 发现左栏移除后下拉/首页仍列出 | 候（B 1.4 顺带，A 客户端接） |
| 17 | … | … | **已进 main e53f0e7**（A 第二批接） |
