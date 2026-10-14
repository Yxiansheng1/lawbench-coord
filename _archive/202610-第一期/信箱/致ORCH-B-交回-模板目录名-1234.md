# 交回 · 线 B → ORCH · 刑事模板目录名（回执行令 20261009-1225、注记 1230）

**`2710e97`**（`T3:`）：`08执行（财产刑/民事赔偿）` 改为 `08执行（财产刑、民事赔偿）`。
- **服务**：registry 改名；加用例"模板目录名不含分隔符、刑事目录建成一级空目录"，旧代码上红。
- **契约**：formats.md 只改名字，不升 VERSION。
- **dsh-ext 两处**：case-folders.ts 与对应 spec 已改，11 例过，**线 A 不用另派**。
- **engines\retainer**：config.json、config.js、builtin.js、存档的 generate.py 只改字符串；记 `engines\retainer\CHANGELOG.md`。注记写的 `engines\CHANGELOG.md` 不存在，按事实索引"记各自 CHANGELOG"记在引擎自己的里面。引擎维护清单里这几个文件的哈希改之前就对不上，没动，已在 CHANGELOG 写明。
- 旧名建过的目录不迁移，交付说明已记。
