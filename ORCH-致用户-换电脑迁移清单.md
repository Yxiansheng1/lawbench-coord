# 换到公司电脑 · 迁移清单（第二期开工用）

原则：**代码从 GitHub 拿，不拷目录**；只拷"不在仓库里"的东西。五条线的分支（line-A/B/C/D、line-A-batch2）今天已全部推到 GitHub，仓库是 Private。

## 一、必须手工带走的（不在 GitHub 里）

| # | 什么 | 在哪 | 怎么带 | 备注 |
|---|---|---|---|---|
| 1 | **`.env.local`**（6000D 测试 Key 等） | `D:\lawbench\.env.local`（A/B/C 三个工作树各一份，内容相同，246 B） | U 盘或当面拷，**不走微信/邮件/聊天** | 新机每个工作树根目录各放一份 |
| 2 | **tokenizer.json**（打 Windows 包必需，20 MB） | `D:\lawbench-B\service\lawbench\llm\tokenizer.json` | 拷到新机同一位置（任一工作树的 `service\lawbench\llm\`）；打包令里 `-Tokenizer` 指它 | 被 gitignore；sha256 `87a7830d…`（`packaging\versions.lock` 第 53 行），拷完核一次 |
| 3 | **协调目录** `D:\lawbench-coord\`（12 MB） | 整个目录，含 `_archive\202610-第一期\` | 整目录拷 | 台账、候 owner 清单、1.4 候项、待办、律师文档、第一期全部信箱归档都在里面；按规矩不含密钥 |
| 4 | **交付物文件夹** `D:\连越律所Ai工作台使用教程和安装包\` | 两个安装包 + 五份文档 + EasyTier 包 | 整目录拷（约 1.5 GB） | 第八版正式包就是这里这份（`75e592d5` / `7021b47b`） |
| 5 | **Claude 的记忆与技能** | `C:\Users\<用户名>\.claude\projects\D--lawbench\memory\`（3 个文件）；`C:\Users\<用户名>\.claude\skills\`（16 个技能目录） | 拷到新机同路径（用户名不同就对应换） | 没有它们我在新机上是白纸：传话规矩、/keep-pushing、复核流程、编排技能 |
| 6 | **EasyTier 接入信息** | 本机 `C:\EasyTier\`（现用测试密钥，不要拷配置文件） | 新机重装 EasyTier 2.6.4，**密钥从律所密码管理器取**（换正式密钥后） | 虚拟 IP 段 `.10–.19` 给开发机，本机现用 `.10` |

## 二、从 GitHub 重建的（新机上照做，需要外网，开热点）

```powershell
git clone --recurse-submodules https://github.com/Yxiansheng1/lawbench.git D:\lawbench
```
1. 子模块 `dsh` 指向 `deepseek-ai/deepseek-harness`（公开仓库）`477b4f4`，`--recurse-submodules` 会一并拉下。
2. 四条线的工作树（CLAUDE.md"你是谁"按目录名识别）：
   ```powershell
   cd D:\lawbench
   git worktree add D:\lawbench-A line-A
   git worktree add D:\lawbench-B line-B
   git worktree add D:\lawbench-C line-C
   git worktree add D:\lawbench-D line-D
   ```
   线 A 的第二批半成品在 `line-A-batch2`，由线 A 自己 `git checkout` 接着做。
3. 依赖（每个要打包/测试的工作树各一次）：`dsh` 与 `dsh-ext` 的 `pnpm install`（按 `packaging\runtime-lock` 口径）；线 C 的 Python 虚拟环境 `.venv`（`service\requirements*.txt`、`prep395`）。第一次打包时 `packaging\build.ps1` 还会下载 Electron、NSIS、PyInstaller 等并校验锁文件。
4. 复核员克隆目录 `D:\lawbench-rv\` 新机上按需现建，老的不用带。

## 三、不要带的

- `D:\lawbench-rv\`（10 GB 复核克隆）、`D:\lawbench-devhome-*`、`D:\lawbench-smoke-*`：全是过程产物，复核记录已在仓库。
- 各工作树的 `node_modules`、`.venv`、`packaging\out`、`packaging\stage`：重建。
- 仓库里四个误建的案件目录（`docs\工作区`、`docs\成果`、`docs\plan\工作区`、`logo\工作区`，未跟踪，是测试时把仓库目录当案件打开留下的）：删掉即可。
- 本机装的工作台、`%LOCALAPPDATA%\lawbench`：不带。

## 四、新机开工前核一遍

1. `git log --oneline -1` 为 `c5057cb` 或更新；`git branch -r` 能看到五条 line 分支。
2. `.env.local` 在位：`python scripts\check_6000d.py` 通过（所内网或 EasyTier 开着）。
3. `python contracts\check_examples.py --skills skills` 通过。
4. `D:\lawbench-coord\ORCH-候owner清单.md`、`ORCH-第七版待办.md`、`docs\plan\lawbench-第一期收尾-20261012.md` 能打开——第二期从这三份开始。
5. 旧电脑：确认以上都到位后，再删旧电脑上的 `.env.local`、tokenizer、EasyTier 配置；仓库目录可以留着也可以删。
