# A 线交回 T30 GUI 压缩配置

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 在私有 GUI profile 中新增唯一一行 `compression: none`，并补充 README 与根侧证据；原始日志、产品源码、router、全局默认值和未改文件均保持不变。 |
| 目标是什么 | 让新合成 GUI 输入与两组真实明文 `session.v4.jsonl` 的物理编码一致，再由根侧观察是否出现非空 Session 行。 |
| 在等什么 | 等 GPT 主编排完成差异复核后启动全新 prepare、admit 和 GUI；信号是新建 root 中出现父、子两个真实会话行，随后才可讨论原推断获得观察支持。 |
| 卡在哪 | 本有界任务未卡；按令没有运行任何产品、服务、GUI 或测试，因此没有 GUI 结果可报。普通 Git 状态读取在共享 `dsh` submodule 处权限拒绝，未修复或扩权。 |

## 依据与验证

- 执行令：`D:\Lawbeach\lawbench-coord\A-T30-GUI-compression-order-20261028-110209.md`。
- 修改脚本：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\start.ps1`。
  第 907 行是唯一新增配置，冻结快照差异为新增 1 行、删除 0 行。
- 脚本身份：修改前 74,131 bytes /
  `8aa948afe87e7a8d29ad6d394acd06d737d53b701000ef181316b04f4a359b8f`；
  修改后 74,157 bytes /
  `4566466fd7057439ca1cf2b2505cc4432283df842709d4c199f236febb1a59ba`。
- 源码证据：协调快照中的 `installed-jsonl-index.js` 第 32、49、171、1251–1256、
  1419–1422 行，以及 `session-store-index.ts` 第 35–36、165 行。完整摘录、哈希、
  命令和非零记录见
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\GenuineSessionGui-20261028-094637\root-compression-20261028-110209.md`。
- 未改文件：`entry.py`、`prepare.ps1`、`stop.ps1`、旧 `交付说明.md` 和三份旧根侧
  记录均与冻结快照逐字节一致；`start.ps1` 中的入口 bytes/SHA pin 无需更新。
- 证据边界：源码证明配置会决定 JSONL 匹配模式，既有生成 profile 也确实缺少
  `compression`；但尚无新 GUI 数据证明空列表根因或产品通过。

## 未做与降级

按令未运行 Python、Node、测试、parser、AST、prepare、admit、serve、probe、HTTP、
模型、GUI、build、selftest 或删除。未执行任何 Git 写操作或暂存。另有 2 次工具
参数在 shell 启动前被拒绝，未执行命令；所有实际 shell 均为指定原生 PowerShell，
`login=false`，共 40 次、非零 6 次，非零均已在根侧记录中分类。

## 下一步建议

根侧先按字节复核单行补丁和冻结文件，再使用全新的运行目录完成 prepare、admit 与
不超过 600 秒的 GUI 观察。当前不需要 owner 做技术决定；只有未来进入真实删除确认
框时才需要现场人工确认。`GUI_PASS=false`、`whole_T30_PASS=false`、
`Packaging=HOLD`。

删减轮：读者 2 / 槽位 1 / 半句 2 / 重复 1 / 过程 1 / 黑名单 0

Response ID：`A-T30-GUI-compression-20261028-110209`

Response log path：`D:\Lawbeach\lawbench-coord\A-handback-T30-GUI-compression-20261028-110209.md`
