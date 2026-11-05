# B T23 verifier binding 交回

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

执行令：
`D:\Lawbeach\lawbench-coord\B-T23-verifier-binding-order-20261030-013515.md`

## 状态摘要

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已按令完成 helper 的四处有界修改，并新写证据说明与本交回件。 |
| 目标是什么 | 让既有 T23 helper 的 PDF verifier 绑定、失败路由底账、生成请求标记和 ASGI 关闭顺序可交 Root 审。距实际生成还隔 Root 的源码、符号表、全文反向、setup/cleanup 审查。 |
| 在等什么 | 等 Root 对这四项修改作独立审查。审查通过后，按原 README 的入口执行一次实际生成并判读报告；不通过则据具体源码事实退回。 |
| 卡在哪 | 源码修改无技术阻塞。只读 `git status` 被 `modules/dsh` 权限拒绝；另有四条命令存在 shell 参数形式偏差，均未写入，已如实记录。 |

## 改动与边界

修改文件：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948\genuine-plan-build.py`

修改后：76,711 bytes，1,938 行，SHA-256
`7c67ce5e26e7e610996689c1e236e5d7b213e2297bfb70f79a97ad8fcd5110df`。

基线 helper 为 75,121 bytes，SHA-256
`b6f44f6e98859de1769c20b6454d7afa95f992c55e786efdd384dc66d76c0740`。
修改只在令列四处：`verify_pdfs` 增加并传入现有 `descriptor`；请求前建立
真实路由底账并在 route `finally` 刷新；`actualGenerationStarted` 移到唯一
archive POST 前；ASGI 客户端关闭单独隔离。输入清单仍为 13,920 bytes，
SHA-256 `faa298e41705a156ea892fc224e32bc2eb8bf81a45140e9cef17f7d91e364e8e`。

没有修改产品、plan、旧 README、old formal、Skills、contracts、tests、SDK、
默认库、converter、源案件或旧报告；没有执行 Git 写入。

## 依据与验证

- 正式执行令：
  `D:\Lawbeach\lawbench-coord\B-T23-verifier-binding-order-20261030-013515.md`。
- 新证据说明：
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T23\GenuinePlanBuild-20261030-011948\verifier-binding-fix-20261030-013515.md`，
  4,937 bytes，SHA-256
  `fcfd75f06834ca6a570679c496374914629247a39a785d1570076af50628cf9f`。
- 与批准快照做只读全文比对，变化范围只落在四处及 route 底账行；定义、调用、
  archive POST、生成标记和 ASGI close 各计数 1。未运行词法、语法、import、
  测试或构建检查。
- `git status --short --untracked-files=all` 退出 1，只读子模块
  `modules/dsh` 的 `chdir` 权限拒绝。定向 `git diff` 与 `git ls-files`
  退出 0，无输出，也未尝试 Git 写入或权限修复。
- 交回 SHA 未生成，因为本运行器未获 Git add/commit 授权；按令这是交回边界，
  不是待修故障。

## 未做与降级

未运行 Node、Python、AST/parser、import、compiler、check、test、build、
HTTP、model、GUI、SSH、EnvKey、DPAPI 或进程探针；未执行 helper、实际生成、
LibreOffice、视觉审阅或 setup/cleanup。没有作者侧 source/symtable/full
inverse/setup-cleanup 终审结论。

执行形式偏差：三条只读分段读取命令的 `shell` 参数误写为
`PowerShell`，一次只读目录列举使用短名 `pwsh.exe`；前者均未按目标语法执行并
退出 1，后者只读成功。没有 Bash、legacy/setup 切换、API 更换、联系方式变更、
writer 启动或沙箱修改。两次只读汇总命令因 PowerShell 管道语法错误退出 1，
均未写入。

## 下一步建议

Root 先按令审查修改后源码、签名绑定、全文反向与 setup/cleanup 边界。只有审查
通过后，才按原 README 的唯一入口做一次实际生成；失败报告按真实 routes 与
refusals 判读，不复跑旧全量测试。

Response ID：`not-applicable-file-handback`

Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T23-verifier-binding-20261030-013515.md`

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 2 / 过程 0 / 黑名单 2
