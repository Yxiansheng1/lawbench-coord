# 线 A 回执 · 隔离修法复核 AMEND 完成，候热点打第四版（令 1539）· 2026-10-05 15:47 (+08:00)

- **提交**：`c96ae54 T20:`（在 `fd3f897` 之上）。补丁链 151 个路径、0 处不一致。

## 改了什么

- **F1 端口**：
  - 装好的包由 `lawbench-isolation.ts` 设 `LAWBENCH_HOST_PORT=0`，Host 的 `--port` 取它，没有时仍是 19387（开发期不变）。
  - 主进程从 Host 的就绪消息取实际地址，`lawbench-request-policy` 按这个地址放行。
  - grep 过 `19387`：产品代码只有 Host 那一处；其余只在 DSH 测试的样例字符串里，dsh-ext、服务、脚本、文档都没有。
- **F2 卸载**：
  - `un.CleanData` 改清 `%APPDATA%\lawbench-desktop` 和 `%LOCALAPPDATA%\lawbench\dsh-home`，不再清 `%APPDATA%\@deepseek-ai\dsh-desktop` 和更新缓存目录。`%APPDATA%\<产品名>` 照旧，那是我方的名字。
  - `lawbenchAfterInstall` 只在 `installer.exe` 与本安装包大小相同时删它，目录空了才删。
  - 安装报告目录 `DSH_INSTALLER_LOG_DIR` 改为 `%LOCALAPPDATA%\lawbench\installer-logs`（原来在原版的更新缓存目录下）。
  - 两段新 NSIS 代码用打包同版本的 makensis，在最小脚本里编译通过。上次打包才暴露的同名宏问题，这次先排除了。
- **F3**：顺序检查改为行首、未注释语句的正则，并要求在 `app.setAppLogsPath()`、单实例锁、`DesktopFatalRecovery` 之前；另加一例核对 Host 读 `LAWBENCH_HOST_PORT`。
- **F4**：交付说明"升级影响"按代码改正。首次配置页看 `%LOCALAPPDATA%\lawbench\settings.json` 和凭据管理器里的 Key，都没搬，所以升级后不会再出首次配置页，只是 profile 在新位置重建；"旧目录"的说法与 F2 一致，第一、二版残留归 F5。

## 检查

DSH `lawbench-isolation`、`main-startup`、`windows-directory-installer`、`installer-packaging` 共 124 例通过。dsh-ext 没改。

## 候

热点开后发一行令打第四版。冒烟加做：

1. 先用 node 占住 127.0.0.1:19387 再启动，须进主窗口；
2. 卸载后 `%APPDATA%\lawbench-desktop`、`%LOCALAPPDATA%\lawbench\dsh-home` 不存在；
3. 预置的 `%APPDATA%\@deepseek-ai\dsh-desktop\marker.txt` 卸载后仍在。
