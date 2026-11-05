# B 线 T33 跨卷消费者进度

- 状态：SOURCE_HANDBACK_READY
- 执行令：`D:\Lawbeach\lawbench-coord\T33CrossVolumeOrder-20261026-144123.md`
- 原始缺口：缺少当前原生 CaseRegistry/Materials/refs 的跨卷真实迁移独立消费者。
- B 线基线 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 基线快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\BC-purposeful-20261026-144123`
- 既有 dirty：按快照原样保全；未执行任何 Git 写入、清理、暂存或切换。
- 卷事实：C、D 均为 NTFS 且 UniqueId 不同。
- 目标证据目录：开工时不存在。
- 作者验证：NOT_RUN；执行令明确禁止作者执行 Python/产品/测试/parser/AST/Vitest/tsc/pytest/list/collect/prepare/serve/probe/build/GUI/HTTP/model/selfchecks。
- 已记录阻碍：只读 `git status` 在 `lawbench` 主仓库下 `dsh` 子模块处报 Permission denied。
- 执行器偏差，已保留在交回件：7 次只读命令误把 `shell` 填成 `bash`，均未执行，
  一律返回 `Bash/E_ACCESSDENIED`；未用 bash 重试，全部改由正式执行令指定的绝对
  `pwsh.exe`、`login=false` 重读。另有一次读取的材料源码分段使用了拼错的 shell
  路径字段但工具返回了输出；该分段随后已用指定的精确 shell 重读。以上均未改
  权限、沙箱、审批、ACL、锁或环境。
- 源码基线对照：当前 `service/lawbench/case/materials.py`、`refs.py`、`registry.py` 的 SHA-256
  与 `T31IndependentCurrentInput-20261026-144123` 快照及 manifest 一致。
- 已写白名单源码：`docs/plan/evidence/T33/CrossVolume-20261026-144123/cross_volume_check.py`
  与同目录 `README.md`。
- 消费者只加载一个有限 `unittest`，直接调用当前 `CaseRegistry`/`Materials`/`RefRegistry`；
  跨卷动作使用 `copy2`、hash/mtime 验证、unlink，不使用同卷 rename。
- 运行期边界：网络/connect、subprocess/Office、app lifespan、OCR、Keyring、模型接线拒绝；
  转换器仅以 TXT 拒绝桩存在；没有替换产品材料返回值。
- 作者验证：NOT_RUN。
- 正式交回：`D:\Lawbeach\lawbench-coord\B-handback-T33-cross-volume-20261026-144123.md`。
