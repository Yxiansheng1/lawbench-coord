# A线交回：T34 生成顺序窄修

状态：代码窄修完成，待 root 复核并运行新 capture。Packaging 保持 HOLD。

## 改动

1. `D:\Lawbeach\lawbench-A\contracts\_build\gen_examples.py`

   - 将唯一、逐字节相同的 `file_settings.ports.json` 原 `ex(...)` 块从 `api_remote_access` 四例之后移走。
   - 插入到唯一的 `api_documents_save.req.json` `ex(...)` marker 之前。
   - 实际 manifest 尾顺序成为：`file_settings.ports` → `documents_save` 三例 → `remote_access` 四例 → `legacy/create/create_legacy/external` 四例。
   - 块正文未改，未调整其它源码、样例、expect、manifest 写出、缩进、断言或 EX 删除逻辑。

2. `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ExampleGenerator-20261025-160738\capture.py`

   - 仅将 `EXPECTED_SOURCE_SHA256` 的旧 literal 替换为新源码 SHA。
   - capture 的其它内容、比较逻辑、样例 pins 和只读补丁逻辑均未改。

## SHA-256

| 文件 | before | current/new | 口径 |
|---|---|---|---|
| `contracts\_build\gen_examples.py` | `6e7d786c983386f846326db019d4515693bf413d0db0bed4775f73688d648fde` | `77143e0bb82340f4667dbded8c1ff7222404b2ee1210717deac3b253e1c56ec4` | before 已从磁盘实测并与 facts 相符；new 由对原始字节文本执行同一精确移块变换后计算 |
| `docs\plan\evidence\T34\ExampleGenerator-20261025-160738\capture.py` | `c23599f3f07d69a63ded57df5b6d0e25c9a4a1a42b70e3e608c04c622707bb63` | `d40b1dfb38eebc981028d668dd3eaa8ff289bcff942176f234b7e0e867ad1b1e` | before 已从磁盘实测并与 facts 相符；new 由仅替换唯一旧 SHA literal 后的精确文本计算 |

## 已做的最小校验

- 修改前 source/capture SHA 均与 facts 精确相符。
- 原移动块和插入 marker 在 source 中各出现一次；修改前块位于 marker 后，符合待修状态。
- 移块变换保持 source 文本长度不变；分别移除移动块后，修改前后剩余文本完全相同，证明除该块位置外没有文本内容变化。
- 变换后移动块与 marker 仍各唯一，块位于 marker 前。
- capture 中旧 source SHA 仅出现一次，替换后文本长度不变。
- 修改前两文件均按既有 dirty 状态保留：source 为 `M`，capture 为未跟踪 `??`；既有 before 保全件未触碰。

## 复用证据

按执行令复用既有已通过证据：旧生成源单 completed 7/7；root 已完成完整审并实际做过一次 memory capture；105 JSON 仅 manifest 顺序语义不等，磁盘 105 件均未变。本次不重演旧开工、安装、调研或全量测试，也不修改旧报告。

## 未验与禁区遵守

- 未运行原 generator、capture、parser、自测、pytest、Vitest、tsc、collect、build、服务或 GUI。
- 新 capture 由 root 审后运行；本次不宣称 capture 已通过。
- 未修改任何现有 105 样例、schema、lib、配置、准备文件或 guard。
- 未执行 Git 写操作，未暂存、提交、rebase、stash、reset、clean、checkout 或 push；未更改权限、TEMP、锁或隔离设置。
- 实际 Shell 为绝对路径 PowerShell，`login=false`；未使用 Bash，未联系其它聊天，未更换 API。

交付文件仅本说明。代码改动仅上述两个既有文件。
