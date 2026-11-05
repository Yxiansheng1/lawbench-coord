# HANDBACK B — T18 Quality Actual Prep

状态：`SOURCE_PREPARED_NOT_RUN`

正式执行令要求的两项有界源修改均已完成。作者 runtime 为 0，未运行 Python、
import、解析器、AST、测试、构建、prepare、应用、HTTP、模型、凭据或 GUI；没有
业务 PASS。Git 全程未写入，未暂存、提交、rebase、stash、reset、clean、
checkout 或 push。

## 1. B defense-opinion Skill

修改文件：

`D:\Lawbeach\lawbench-B\skills\defense-opinion\SKILL.md`

- 最终 13852 bytes，SHA-256
  `f3fed80c767e5c9d7f2fdaebc9e0fa5c0b5aa2878383ffd52b12edca260c9846`。
- 仅加入 A 已批准的四类非共享内容：不利事实覆盖与必保留章节、委托/已开展工作
  占位约束、单一当事人陈述的标题/正文/结论归属，以及对应模板结构。
- 未复制整份 A，未改任何 sharedrules 内容。
- 最终原生 PowerShell 元数据核对：B 的 `<!-- 共用规则:开始 -->` 至
  `<!-- 共用规则:结束 -->` 与令中 B-before 副本逐字符一致
  （`SHARED_BLOCK_EXACT=True`），两条 B 特有共享规则保留。
- 原 B-before 身份为 12859 bytes，SHA-256
  `e49d280e4f09f2a2aeeb94bef8f188aca7ce84a773fab410703d59d59a4da04a`。

## 2. Wiki 当前消费端源准备

证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\QualityWikiActual-20261031-173317`

- `genuine-wiki-pipeline.py`：76954 bytes，SHA-256
  `bc690d541141836a4b043fa3887fab7c69aaa882f33f8f821b6815ef5b564323`。
  逐字节复制旧原创 helper，仅改顶层 `APPROVED_INPUTS`、`SOURCE_PINS` 的 path、
  bytes、SHA-256、mtime_ns；函数、类、守卫、setup/cleanup、模型、源、任务、
  prompts、32 次预算及判据均保留。
- `literal-inputs.json`：5477 bytes，SHA-256
  `7b226879dfcb011f1129f270bc1f8878b4dfbcb543281423f6abe701b13ad0a7`。
  原对象整份复制；除 `b_source_pins` 身份行及 `helper` 当前 path/bytes/SHA 外，
  original/material/schema/python/tasks/params 字段均保留。
- `README.md`：3347 bytes，SHA-256
  `195bd2414b6be9a68cb2f75d0460b23f0b84fc7ab5ec6c2959e9e013122de6c7`。
  明确标注 `SOURCE_ONLY_NOT_RUN`、允许差量与 root 待执行边界，没有业务 PASS。
- 旧 helper 保持 76944 bytes /
  `f2bdaaff63874215c1ee7bcb6c109aff1f6536ed62b49842fa4464011ad7d015`；
  旧运行报告未替换，reader-only manual notes 未读取。

当前 approved inputs 为 5224 bytes /
`0b447d27aa7327556993f1124577c6f09d29d347834ceb313ecc06767d4ebc8d`；
reviewed pins 为 53548 bytes /
`0da04b925d421c711b7c6ef8d8bbc049b75c04fba537ba2275efc0a642b81847`。
pins 共 346 行，仅 root 指明的 4 行变化，其余 342 行不变。

## 3. 异常记录

- 一次只读调用误用 bash，被环境以 `Bash/E_ACCESS_DENIED` 拒绝；未执行、未写入，
  后续均使用指定原生 PowerShell。
- 最终只读核对中，旧 `literal-inputs.json` 的一项“不变”比较误用了临时猜测的
  预期 SHA，得到 `False`。该比较未写文件，旧 literal 实际未被修改；此错误结果
  不作为证据。最终 helper 原文件身份核对为 `True`。

## 4. 交给 root

root 可先对上述两源文件做完整整文件反向差量、AST 和输入身份复核，再以专用
合成凭据经匿名 stdin 对 changed-source 执行唯一一次实际生成。作者到此停止，
不再运行或补写。
