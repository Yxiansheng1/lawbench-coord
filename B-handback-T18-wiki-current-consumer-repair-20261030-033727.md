# B-T18 当前案件 wiki 消费端返修交回

结论：`SOURCE_ONLY_READY_FOR_ROOT_FULL_VALIDATION`

作者 runtime 为 0。未 import、未做 Python AST/parser/check/test/build，未启动模型、
HTTP 或应用，未读取环境 Key/DPAPI。Git 全程只读；未 add、commit、rebase、stash、
reset、clean、checkout 或 push，未处理 `index.lock` 或扩权。

## 交付

新证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\WikiCurrentRepair-20261030-033727\`

- `genuine-wiki-pipeline.py`：76944 bytes，SHA-256
  `f2bdaaff63874215c1ee7bcb6c109aff1f6536ed62b49842fa4464011ad7d015`。
- `literal-inputs.json`：由 blueprint 原样复制，仅替换 helper final bytes/SHA。
- `README.md`：完整 autor scope、执行边界、命令台账与异常记录。

本 formal 是本次唯一交回文件，不声称产品 runtime PASS。

## 精确允许差量

相对
`T18WikiCurrentRepairInput-20261030-033727\baseline-helper.py`（72535B，
SHA `7925f51ac96401ee7479e3b91ef560b100d5f58544368dfd80a9e25587db5b1c`）：

1. `APPROVED_INPUTS` 指向新 approved-inputs；常量更新为 5210B /
   `977c8253b16f514857073e5dc7609c4434e09318d5b3610f7cf3e1109c038f99` /
   Unix-ns `1793302647327938900`。
2. `SOURCE_PINS` 指向新 346 行 pins；常量更新为 53548B /
   `7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b` /
   Unix-ns `1793302647316836800`。
3. case card 断言用真实 `ids_by_name + version_by_name` 构造精确
   `material_id -> sha256`；要求五条记录、完整集合、当前版本、无重复/额外/缺失，
   没有 fallback、假 ID 或宽泛接受。
4. 增加一个窄观察函数：在 production `Pipelines._lock` 内读取本私案实际
   `_live` 的 task ID、thread name、`is_alive`，随即释放锁。finally 只对本私案
   实际存活且已注册的 task ID 调用 production `Pipelines.cancel/wait`，随后再次
   观察。任务终态主路径也记录并验证线程已消失。
5. 任一线程残留、意外多任务、已返回 task ID 与实注册 ID 不一致，都会进入
   `cleanup_failures`，不能宣称 all joined。

其余 helper 字节/逻辑保持不变，尤其 owned-directory/reparse/inventory 防护、
5 TXT/8 原始源码快照、真实 CaseRegistry/TaskStore/Pipeline、schema、source GET、
最终 checker、网络池、ASGI、Retainer、日志关闭、路径边界、错误与预算断言。

## 静态核验

作者只读核验通过：

- 新旧 pins 均 346 行，仅
  `service/lawbench/pipeline/steps/wiki.py` 一行不同；其余 345 行相同。
- 当前 346 个 pin 目标 bytes/SHA mismatch 为 0。
- 新 approved-inputs 相对旧文件只改 `b_source_pins`；15 条 8 原始输入、5 TXT、
schema、Python 身份的 bytes/SHA/mtime mismatch 为 0。
- 当前 `wiki.py` 为 33796B /
  `96698902e8e0925376b742074fb7076edb41cf94f7ba83e0682d6c601607ef13`，
  新增测试为 8722B /
  `e46607d3f88bd31f499e41090849355a9dfd508c3c153c98aa761cc1593a0cfb`，
  与已接受 source unit 一致。没有重跑其单测，也没有再修产品。
- literal manifest 相对 blueprint 只有 helper 的 `bytes` 与 `sha256` 两项不同。

## 命令与非零记录

完整命令台账在证据 README。关键非零/阻碍如下：

- 首次只读 `git status --short` / `git diff --stat` 因受限子模块
  `modules/dsh` 的 `Permission denied` 未能完整枚举 dirty；按令未尝试修复。
- 三条身份/汇总检查命令发生 PowerShell `ParserError`（`foreach` 直接接
  `Format-Table/List`），均未产生目标输出或文件变化，随后以数组累积形式重跑。
- 两条只读命令误填 `shell=bash`，均被 `Bash/E_ACCESS_DENIED` 在执行前拒绝；
  没有 Bash 代码运行、没有改沙箱/审批/ACL/锁，随后均用指定 native PowerShell
  完成。
- 两次 `git diff --no-index` 返回 1，正常表示预期 diff 存在。
- 没有 Python、模型、HTTP、应用、测试、构建或运行验证。

## 完整实跑与清理验收（root）

root 应先做 final source/inverse-delta/raw-input/typed-contract/manifest 静态复核，
再做一次新的真实生产流程：

1. 只生成新的 `run-*` private root，复制恰好 5 个已批准 TXT。
2. 实际保存的 DPAPI Key 经匿名 stdin 输入；不得走 env/file/keyring/argv。
3. 仅一次 `/api/pipeline/run`，固定 `qwen38-27b`、off、64K、16384、
   `use_prep=false`；不得复用同源模型调用。
4. 消费实际 task/result/record、调用数、45 分钟生产预算、最终 checker、逐引用
   source GET、手查 wiki、346 源/8 原始输入前后不变性。
5. 主终态 wait 后确认实际 P thread `is_alive=false`；异常路径按实际私案注册 ID
   cancel、join、复查，并检查 root/ASGI/net pool/Retainer/logs/进程/句柄闭包。
6. OS 层审计应引用 root 自有证据；helper 报告不作为 OS 闭包的唯一证据。

作者只完成静态复核和文件交回，不进入 root runtime；现按令停止，等 root 执行与
终裁。
