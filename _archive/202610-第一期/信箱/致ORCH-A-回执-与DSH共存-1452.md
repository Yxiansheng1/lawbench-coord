# 线 A 回执 · 与 DeepSeek Harness 桌面版共存（注记 1440）· 2026-10-05 14:52 (+08:00)

**结论：第二版包与原版 DeepSeek Harness 不能共存。** 有三处同名，会互相干扰。只读源码判定，没有做实验。

## 逐项

| 项 | 原版 DSH | 我方第二版 | 判定 |
|---|---|---|---|
| 1 安装目录 | `…\Programs\DeepSeek Harness` | `…\Programs\连越律师工作台` | 不同，可共存 |
| 2 appId / 卸载键 | 原版自己的 appId（模板默认 `com.deepseek.harness`） | `cn.lianyue.lawbench`；卸载键是由 appId 算出的 GUID | 不同，可共存 |
| 3a Electron 用户数据目录 | `%APPDATA%\@deepseek-ai\dsh-desktop` | **同一个**（包名 `@deepseek-ai/dsh-desktop` 没改，只改了 productName） | **冲突** |
| 3b DSH 主目录与 profile | `%USERPROFILE%\.dsh\profiles\desktop`（含 `lock`） | **同一个**（`dsh-home-paths` 默认 `~/.dsh`） | **冲突，最要紧** |
| 4a 单实例锁 | Electron 的锁按用户数据目录 | 同 3a，所以**同一把锁** | **冲突** |
| 4b 协议名 | `dsh` | `dsh`（P-4 有意没改） | 同名，较轻 |
| 4c 开始菜单项 | DeepSeek Harness | 连越律师工作台 | 不同 |

## 冲突的后果

- **单实例锁**：一个开着时启动另一个，后者直接退出，并把前者窗口带到前台。律师会以为打开了律师工作台，实际看到的是原版 DSH，或反过来。
- **共用 profile**：两个程序共用 `~/.dsh\profiles\desktop\package.json` 和它的锁。
  - 原版 DSH 先建的 profile 里没有 `lawbench-dsh`；DSH 对已有的 profile 一律不动。
  - P-14 发现缺少组合包时拒绝启动，弹"律师工作台的组件没有全部加载……请重新安装"。
  - 反过来，我方建的 profile 带着 `lawbench-dsh`，原版 DSH 打开它会尝试加载我们的组合包。
- **共用 Electron 数据**：Local Storage、窗口状态、快捷键配置等互相覆盖。
- **协议**：两者都会注册 `dsh:`，后启动的一方占用，影响只在网页唤起，第一版用不到。

## 最小修法（P-4，主进程 `main.ts`，app ready 之前，只在装好的包里生效）

1. `app.setPath('userData', %APPDATA%\lawbench-desktop)`。用户数据和单实例锁随之分开，3a、4a 一起解决。
2. 设 `process.env.DSH_HOME = %LOCALAPPDATA%\lawbench\dsh-home`。桌面端 profile、锁、会话索引都随之移开（`dsh-home-paths` 读 `DSH_HOME`，Host 子进程继承）。解决 3b。
3. 协议名先不改，记后续：改了要连带改 DSH 的单实例唤起，第一版用不到网页唤起。
4. 补用例：装好的包 userData、DSH_HOME 都不是原版的路径。

**估时**：改动和用例约 40 分钟；重打第三版约 25 分钟，需要联网装 npm 运行时；本机冒烟约 5 分钟。合计约 1 小时 10 分钟。

**对现场的影响**：
- 已装第一或第二版的机器，原来的数据在 `%APPDATA%\@deepseek-ai\dsh-desktop` 和 `~/.dsh`；改后会当作首次启动，要重新填首次配置。案件和会话在案件文件夹里，不受影响。
- 现场的临时绕法：同一台电脑上不同时开两个程序。如果原版 DSH 用过，我方程序可能因 P-14 拒绝启动，这时改不了，只能等修法。

**请定是否现在做。**
