# 线 A 回执 · 与原版 DSH 隔离修法完成，候热点打第三版（令 1444）· 2026-10-05 14:55 (+08:00)

- **提交**：`fcfcc9e T20:`（line-A，在 `ef1cdc8` 之上）。补丁链 150 个路径、0 处不一致。
- **修法**：P-4 新文件 `lawbench-isolation.ts`；`main.ts` 在全部 import 之后、单实例锁之前调用。
  - 判定用 `app.isPackaged`：只有装好的包生效，开发期从仓库起的实例不变。
  - 装好的包：`userData` 改为 `%APPDATA%\lawbench-desktop`，`DSH_HOME` 改为 `%LOCALAPPDATA%\lawbench\dsh-home`（Host 子进程继承）。
  - Electron 的 `logs`、会话数据、单实例锁都随 `userData` 走。
- **用例**：`lawbench-isolation.spec.ts` 3 例——装好的包两处都不是原版路径；开发期不变；隔离在单实例锁之前。`main-startup.spec` 110 例照常通过；tsc 0 处报错。
- **grep `dsh-desktop`、`.dsh`**：界面、自检、首次配置页、文档里都没有写这两个位置的地方。我方日志与数据本来就在 `%LOCALAPPDATA%\lawbench\`，不动。
- **交付说明**：加了"与原版 DSH 共存"一节，写了三处冲突、修法、升级影响（视为首次启动、重填首次配置；案件不受影响；旧目录不迁移、不删）。协议名不改，记后续。
- **本机旧路径现状**（第三版冒烟时对照用）：

  | 路径 | 现状 |
  |---|---|
  | `%APPDATA%\@deepseek-ai\dsh-desktop` | 不存在（上次卸载时清掉了） |
  | `%USERPROFILE%\.dsh` | mtime 2026-10-04 19:54:11 |
  | `%USERPROFILE%\.dsh\profiles\desktop` | mtime 2026-10-05 11:28:19 |

- **候**：用户开热点后你发一行令，我按令 1035 ＋ 注记 1037 打第三版，并加做旧路径 mtime 不变的冒烟项。
