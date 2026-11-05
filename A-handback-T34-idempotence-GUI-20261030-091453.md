# A 线交回：T34 禁用幂等受影响 GUI 候选

状态：`SOURCE_ONLY_HANDOFF / AUTHOR_RUNTIME_ZERO / ROOT_AUDIT_AND_ONE_FRESH_GUI_REQUIRED`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 已在新证据目录落七文件候选；当前 25 项私有构建、B 清单、产品三源和观察器身份均经只读核验 |
| 目标是什么 | 让根侧实际 GUI 只在该 live `remote.describe` 精确匹配本产品拥有的禁用 provider 时跳过无意义 unset；其他情况保持原行为 |
| 在等什么 | 等根侧完成独立源码/写面审计并给出“可做一次实际 GUI”的信号；信号到达后只跑一次 fresh GUI，再做元数据与 owned OS 闭环 |
| 卡在哪 | 作者侧未被阻塞；作者边界内不运行 GUI，所以底层 `ConfigEditor` 写拒绝原因仍为 `UNKNOWN`，本候选不构成 GUI/整条 T34 通过 |

未产生 Git 写入，因此没有提交 SHA；这是正式执行令的边界，不是交付缺失。

## 依据与验证

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\IdempotenceGUI-20261030-091453`

最终七文件：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 13,557 | `7c8f507862a12b6f8173a4c6d58c27b255500aa02c0dc30eea025071b569ec0b` |
| `start.ps1` | 76,330 | `b131b6f493006bf99b42b524059f2f22073aee9759c713c6e5eb68d3b1680efe` |
| `stop.ps1` | 7,174 | `0e64b2c15c830f9fd32254368c3ff050d552c141e65431ec5b2e6844ad981593` |
| `entry.py` | 88,648 | `a6ff33b4922f11178bf4d637947c6fb05e4ff8dbf1b1cfbf40a06d84b0b9e31b` |
| `projection-observer.mjs` | 20,058 | `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac` |
| `literal-inputs.json` | 20,493 | `8005056e8367abe279ae4745032c482debb2d7e8159eb3ff70b53b2d6286e48b` |
| `README.md` | 4,402 | `af393693dc921d453bae21437070fe581db925eb200c7b77d766a0a7be55e7ac` |

`literal-inputs.json` 对本文件使用非自引用的 `bytes: null / SELF_NOT_REFERENCED` 占位；
其实际最终身份以上表为准。README 行已与 README 最终字节/SHA 对齐，七行交回顺序为：
`prepare.ps1`、`start.ps1`、`stop.ps1`、`entry.py`、
`projection-observer.mjs`、`literal-inputs.json`、`README.md`。

当前唯一允许的私有构建：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\IdempotencePrivateBuild-20261030-085828\private-output-20261030-091211`

- 清单 58,198 字节，SHA-256
  `8493f52c879b8674b8c72f961de4c81d89165f97ffd251b91bcb270c85bf39ab`。
- 24 个输出逐项字节/SHA 全部匹配，`start.ps1` 的 24 行字面表顺序精确一致。
- 18 棵树、53 个引用和 legacy18 沿用批准身份；唯一改变的产品输出为
  `profile-node_modules/lawbench-dsh/lib/client.js`，539,498 字节，
  `b6ffe003a34af83918bc9fc069350cfa4054ac69458d7644200b68f567a9bd86`。
- 既有当前构建证据记录 19.381895 秒、退出 0、4 个 owned OS 身份均已结束。
- 旧 `private-output-20261027-194112` 未被声称为新客户端证明。

当前产品源：

| 源 | 字节 | SHA-256 |
| --- | ---: | --- |
| `dsh-ext\ui\settings.tsx` | 39,858 | `e6f5e5fb98b6f249e397d85f98fe7eac3a7dae9869e1daa57abbc34f0fee7967` |
| `dsh-ext\ui\state.ts` | 18,994 | `d93174f1f1ac88eb6c5552c740774178a636ef8d2eeff592297750492a0257cb` |
| `dsh-ext\tests\t34-disabled-provider-idempotence.spec.ts` | 12,622 | `2b5104d027eba0bfd9efe40a6ba540339d13896968d25ef3f657b00b64b998a1` |

当前产品源码证明位于根工作区：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-disabled-idempotence-source-reviewed-current.json`

读取时为 1,288 字节，
`cad7525601a2334b41f3e2b18965f9496aa5d2b23e082d61a8dba54926175e9d`。
B 来源清单为 53,548 字节，
`7410f1bd84f1b2a2764203540550670d3252a73bae3b3e3cc02007e5adf9c57b`。

## 实际改动

- `prepare.ps1`、`stop.ps1`、`entry.py`：各只把 self evidence/owned-runs 根改到本目录。
- `start.ps1`：证据根改到本目录；`entry.py` 钉为 88,648 字节及上表 SHA；B 清单、
  当前私有构建路径、清单字节/SHA、24 个输出和 3 个原生垫片改为当前批准字面值。
- `projection-observer.mjs`：与批准快照逐字节相同，未改。
- `literal-inputs.json`：以根批准蓝图为其他元数据基础；当前 SDK 行为 `e6f5`；
  写入当前 24 输出数据、当前产品源证明、七文件交回行和真实作者计数。
- `README.md`：源码交付、当前 25 项、安全边界、未运行项与根侧下一步。

`start.ps1` 的 3 个原生垫片为当前 `host.js`、`agent.js`、`session-store.js`；
PDF 固定来源及五项资源、resolver、network guard、SDK 其余六项、legacy18、
T30 源案与两份日志字节均保持批准快照。未增加有限助手或分类器。

## 验证读数

- 七份批准输入快照的全部字节/SHA 与输入清单一致。
- 最终目录恰有七个文件；`handoff_source_files` 恰七行且顺序一致。
- 旧证据根 `ProjectionKnownOrigin-20261030-071450` 在七文件中命中 0。
- 相对批准快照的行级差异数：prepare 2、start 26、stop 2、entry 2；
  start 的额外差异均为当前 B 清单、私有构建、24 输出、3 垫片和新 entry 身份。
- `PrivateOutputPins` 24/24 顺序精确；`NativeShimPins` 3/3 精确。
- 当前构建实际 24 个输出逐项字节/SHA 为 24/24 匹配。
- 观察器与原批准快照字节/SHA 完全一致，未因任何路径改动发生漂移。
- 最终封版审计 `ok=true`、`problems=[]`、README 交回行匹配、作者计数匹配。

## 作者命令记录

共 41 次执行器调用，35 次退出 0，6 次非零。非零不包含任何目标运行时脚本；
第 21、34 次是误填 `bash` 后在启动前被运行器拒绝，目标命令未执行。

| # | 只读动作 | 结果 |
| ---: | --- | --- |
| 1 | 读正式执行令 | 0 |
| 2 | 读 `approved-inputs.json` | 0 |
| 3 | 读根批准蓝图 | 0 |
| 4 | 核对根工作区源码证明存在性/身份 | 0 |
| 5 | `git status --short --untracked-files=all` | 1；`dsh` 子模块权限拒绝，未修锁/ACL |
| 6 | 列批准输入目录 | 0 |
| 7 | 目标/当前构建根初查 | 1；PowerShell 语法错误，目标命令未执行 |
| 8 | 读当前源码证明 JSON | 0 |
| 9 | 七快照哈希初查 | 1；PowerShell 语法错误，目标命令未执行 |
| 10 | 目标/当前构建根重查 | 1；PowerShell 语法错误，目标命令未执行 |
| 11 | 读当前构建清单 | 0 |
| 12 | 查旧脚本中的证据根/构建常量 | 0 |
| 13 | Git ignored-submodule 状态 | 0；有长路径目录访问警告 |
| 14 | 全读 `prepare.ps1` 快照 | 0 |
| 15 | 全读 `stop.ps1` 快照 | 0 |
| 16 | 读 `entry.py` 顶部 | 0 |
| 17 | 读 `start.ps1` 关键范围 | 0 |
| 18 | 读 `start.ps1` 固定项区 | 0 |
| 19 | 读旧 `literal-inputs.json` | 0 |
| 20 | 读旧 README | 0 |
| 21 | 清单片段查询误填 bash | 1；启动前拒绝，目标命令未执行 |
| 22 | 读 `start.ps1` 材质化区 | 0 |
| 23 | 读 `PROJECT-PROFILE.md` | 0 |
| 24 | 确认新证据目录不存在 | 0 |
| 25 | 核对产品三源/B 清单/构建清单身份 | 0 |
| 26 | 核当前构建 24 个输出 | 0；24/24 |
| 27 | 建新目录并机械复制批准快照/蓝图 | 0 |
| 28 | 四脚本相对快照行级比较 | 0 |
| 29 | 修改脚本初版字节/SHA | 0 |
| 30 | 观察器原字节比较 | 0；未变 |
| 31 | 列新目录六文件初态 | 0 |
| 32 | entry 钉值回填后的脚本哈希 | 0 |
| 33 | 读 start 当前固定项 | 0 |
| 34 | 清单片段查询再次误填 bash | 1；启动前拒绝，目标命令未执行 |
| 35 | 读清单精确行段 | 0 |
| 36 | 七文件/24 输出/3 垫片/源身份综合审计 | 0；`ok=true` |
| 37 | README 中间哈希 | 0 |
| 38 | 中间封版审计 | 0；随后按 formal-report 证据口径校正命令计数 |
| 39 | 读 `formal-report` 技能 | 0 |
| 40 | 校正计数后的 README 哈希 | 0 |
| 41 | 最终封版审计 | 0；`ok=true`、`problems=[]` |

最终作者计数：目标运行时脚本 0、Node/Python 调用 0、
parser/import/type/check/test/build 0、GUI/HTTP/模型/进程探针 0、Git 写 0、
凭据或 DSH home 存储读取 0。Shell 目标命令均指定原生 PowerShell；两次误填 bash
均在启动前拒绝。没有 `git add/commit/rebase/stash/reset/clean/checkout/push`。

## 未做与降级

`NOT_RUN`：prepare、admission、start、GUI 操作、observer capture、stop、
parser/import/type/check/test/build、模型/网络、原生投影通过、整条 T34 通过、打包。

底层 `ConfigEditor` 写拒绝原因仍为 `UNKNOWN`；本候选只覆盖从已审源码接受的
“live 精确匹配禁用 provider 时跳过 unset”路径，不证明实际拒绝来源。

## 下一步建议

根侧先独立审计本目录、相对批准快照的逆变换、全部写面、当前 25 项数据、
profile/setup/finally/cleanup 和上述命令记录。审计通过后，信号是“允许一次 fresh GUI”；
届时只用当前 25 项构建跑一次实际禁用投影路径，随后核对元数据并关闭全部 owned OS
身份、端口和私有窗口。若仍未得到具体写入原因，继续保持 `UNKNOWN` 和打包 `HOLD`，
不降级 guard，不增加无界分类器。

Response ID: A-T34-idempotence-GUI-20261030-091453-01
Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T34-idempotence-GUI-20261030-091453.md`
