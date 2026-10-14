# 线 A · COMPACT CHECKPOINT · 2026-09-30 17:46

角色：线 A（Opus 5.5），工作目录 `D:\lawbench-A`，分支 `line-A`。只做派给线 A 的工单；规矩见 `D:\lawbench-A\CLAUDE.md`、`PROJECT-PROFILE.md`。

## 1. owner 决策（本会话相关；原件都在协调目录，以原件为准）

- `OWNER-N46按推荐-20260930-1534.md` → 执行令补充 `致A-ORCH-执行令补充-N46已定-20260930-1534.md`：N46 ②，不在案件里的会话不许新建；首页无案件时输入区提示"先打开或新建一个案件"。**已做完并交回。**
- `OWNER-N48按推荐-20260930-1559.md` → `致A-ORCH-执行令补充-N48已定-20260930-1559.md`：N48 ①，写入依赖加 key。第三轮复核认定只修了一半（P2-1），第四轮已修。
- `OWNER-N50按推荐-20260930-1707.md`、`OWNER-N50改为服务替换-20260930-1710.md`：发票购买方名称由工作台服务替换（N50 ③）。这是线 C 的事，**与线 A 无关**，只读过。
- `OWNER-395硬盘加密暂缓-20260930-1503.md`：只读过，与线 A 无关。
- 用户在对话里的原话：只有"有你的新执行令"一句（当时信箱里还没有致 A 的件，1516 令是后来到的）。其余都是 cron tick。

## 2. 编排与目标态

- line-A HEAD `a8ffb5a`，已 rebase 到 main `49313b1`。
- 线 A 在 main 之上的最近提交（rebase 后的 SHA）：

| 提交 | 内容 |
|---|---|
| `995814a` | T17 第三步 |
| `387c635` | T13 第二轮返修 |
| `d870e22` | T17 第二步返修 |
| `5d685cf` | T17 N46 ② |
| `989b85a` | T13 桌面端复测 17.9 |
| `5ae689d` | T17 交付说明 5.5、5.9 |
| `a8ffb5a` | T13 第四轮返修 |

- **已交回、在等复核或合并**：
  - `致ORCH-A-交回-T17第二步返修-1713.md`；
  - `致ORCH-A-交回-T17第三步-1739.md`；
  - `致ORCH-A-交回-T13第四轮返修-1746.md`。
- **当前状态：等令。** 没有在做的工单。
- **止损线**（1722 令原文）："下一轮若同根因再露，不再返修、上候 owner 清单"。同根因指 T13 写入逻辑没把"显示的键 ≠ 服务那份"算进去。
- **以后要做**：T7 真服务复测，ORCH 会另派。

## 3. 验收与硬纪律（摘自 CLAUDE.md 与令文，要点）

- 契约优先，不私自增减字段；不改 `contracts\`、`service\`、`engines\`、`docs\src\`。
- 只在 line-A 提交，提交信息 `T<n>: ...`；不改工单集文件；不改已交回的提交。
- **禁 `git stash`。** 另外，**不要对有未提交改动的文件跑 `git checkout --`**：本会话这样误冲掉过 `session-store/index.ts` 的改动，当场补回了。
- 不写 Key 和密码，不放真实案卷；测试 Key 用临时脚本放 scratchpad，用完从凭据管理器和磁盘都删掉，脚本永不提交。
- 开发和测试时，`LOCALAPPDATA`、`APPDATA`、`DSH_HOME` 都指到 `D:\lawbench-devhome-A`（脚本 `scratchpad\run-desktop-t.ps1`，注释只用 ASCII）。
- 截图和文本证据里不许出现用户名 <用户名>，文本里换成 `<用户>`。
- 权限分类器拦下的动作，不要绕过。
- 外发件的文件名和时刻都取实钟。
- 派子代理必须显式指定 model。

## 4. 关键路径

| 路径 | 说明 |
|---|---|
| `D:\lawbench-A\docs\plan\evidence\T17\交付说明.md` | 第 5 节（5.1–5.9）第三步；第 6 节第二步返修 |
| `D:\lawbench-A\docs\plan\evidence\T13\交付说明.md` | 17.7（末尾有已知限制）、17.9 桌面端复测、17.10 第四轮返修 |
| `D:\lawbench-A\docs\plan\evidence\T13\第四轮返修\` | `mutate.py`、`red-tests.txt`、`复核员原样实验.txt` |
| `D:\lawbench-A\dsh-ext\ui\dock.tsx` | 输入区；`NO_CASE_TEXT`、`INPUT_CHANGED_TEXT` |
| `D:\lawbench-A\dsh-ext\session-store\{index,router,case-roots}.ts` | 会话存储路由 |
| `D:\lawbench-A\dsh-ext\cordis.patch.yml` | 第 5 节 `allowOutsideCase: false` |
| `D:\lawbench-A\dsh-ext\tests\dock-a19.spec.ts` | 第三轮复核员的 E 系列实验 |
| `D:\lawbench-A\dsh-ext\tests\helpers\dock-lab.ts` | 上面那份用的夹具 |
| `C:\Users\<用户名>\AppData\Local\Temp\claude\D--lawbench-A\83a515fe-3091-4d1d-bb29-68b2364c0be5\scratchpad\handled.txt` | 已处置件清单 |
| 同上 scratchpad | `n46-mut.py`、`rechain.ps1`、`run-desktop-t.ps1`、`cdp.mjs` 等 |
| `D:\lawbench-coord\A-心跳-监控存活.md` | 心跳 |

## 5. compass 对照

- **在飞**：线 A 无在做的工单。三份交回件等 ORCH 处理。
- **叫醒机制**：cron `b037bc5a` 发"[线A信箱tick]"。17:30 前后还在真实触发，本窗收到过多次。
  - 每次 tick：刷心跳；扫 50 分钟内匹配 `^(致A-|OWNER|owner|SELFTEST-A-|ORCH-.*(广播|全线|探活))` 的文件，对照 `handled.txt`；
  - 等令时，距最近一份外发件超过 35 分钟，就落两行的 `致ORCH-A-进度-等令-<HHMM>.md`。
  - 最近一份外发件：17:46（T13 交回）。
- **本窗跑偏**：
  1. 对未提交文件跑了 `git checkout --`，已补回；
  2. 变异脚本的匹配串先打中了日志行，没打中默认值，已修正并重跑，两例全红；
  3. 删除 `%LOCALAPPDATA%\lawbench` 残留被分类器拦下，没有绕过，已在交回件里请用户手动删。
- **遗留给用户手动做**：
  - 删 `%LOCALAPPDATA%\lawbench\{settings.json,logs,临时,lo,dsh-documents}`；
  - 删 `D:\Local`、`D:\dsh-home`。
- **工作区**：`.tmp-demo\` 不入库；`dsh` 子模块显示 `m`（工作区打了补丁），不提交。
- **rebase 坑**：rebase 后 `dsh-ext\ui\fixtures` 的 29 个文件可能变成 CRLF，`fixtures.spec` 会红 28 项。改回 LF 后执行 `git add dsh-ext/ui/fixtures` 刷新 stat，内容不变。

## 6. advisor 在生效建议

无。

## 可压缩区

N46 变异调试过程、fixtures CRLF 诊断、复核员实验复制与删除、测试和构建输出、各次 rebase 输出，都已固化进提交和证据文件。

## compact 后第一批动作

1. 读本件。
2. 按 17:15 起的修改时间扫 `D:\lawbench-coord`，与 `handled.txt` 对照补漏件。
3. 有致 A 的新令就按令做；没有就等令，按 tick 规则办。
