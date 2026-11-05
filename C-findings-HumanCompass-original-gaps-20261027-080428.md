# C 线独立重建：第二期原卡真实缺口与下一安全动作

日期：2026-10-27（Asia/Taipei）  
执行体：独立 C 线 deepseek-v4.1-flash-1017 / max / `D:\Lawbeach\lawbench-C`  
唯一任务入口：`D:\Lawbeach\lawbench-coord\HumanCompass-C-order-20261027-080428.md`

结论先行：

1. 本轮不应再启动新的 C 线代码修补。当前最早、最具体、未覆盖的原卡工作已经存在：B 线 T37“旧复制材料与新引用材料混存兼容”任务正在准备，已落 `legacy_mixed_check.py`，但 README、正式交回和运行结果尚未出现。应让现有 B job 完成准备件，root 全文复核后执行一次既定原生消费者，不重复派单。
2. T30–T42 没有任何一张整卡已完成 Gate 1。已收口的是源码/局部运行时切片，不能外推为真实 GUI、真实模型、真实基础设施或安装包通过。
3. 不能写成“工程已经做完，只剩人工”。T30 的非空会话资源、T31 的真实 GUI picker、T32 的受控 pending 保存资源、T37 的混存兼容，以及 T40 的真实侧车/网络都是明确工程或准入条件；其中有些需要用户/基础设施，有些只需要现有资源上的下一次有界验证。
4. T43–T48 均无正式门证据。T47 只有离线工程接续；Packaging 仍为 HOLD。

## 1. 输入完整性与工作树保全

入口索引 `HumanCompassInput-20261027-080428\index.json` 的 14 个快照逐一重算：

| 项 | 结果 |
|---|---|
| 快照数 | 14 |
| 字节数与索引一致 | 14 / 14 |
| SHA-256 与索引一致 | 14 / 14 |
| 输入改写 | 无 |

快照完整性已由只读 `Get-FileHash` / `Get-Item` 核对。`00-input.md` 是第二期原卡 T30–T48；`01` 是旧 compass checkpoint；`02`–`13` 是当前证据或近期状态快照。

C 工作树基线：

- `HEAD = ebbca3f`，分支 `line-C`，相对 `origin/line-C` 为 ahead 84 / behind 1。
- 普通 `git status --short --branch` exit 1：
  `fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-C/modules/dsh': Permission denied`。
- 使用只读 `git -c submodule.recurse=false status --porcelain=v1 --branch --ignore-submodules=all` exit 0，确认既有 dirty/untracked 至少包括：
  `packaging/THIRD-PARTY-LICENSES.md`、`packaging/build.ps1`、`packaging/gen_lock.py`、
  `service/lawbench/app.py`、`service/lawbench/net.py`、`service/lawbench/remote.py`、
  `service/tests/test_remote.py`、`service/tests/fake_easytier.py` 及 T31/T40 证据文件。
- 这些都是继承 dirty，本轮保全，不收编，不暂存，不提交。
- 本轮没有修改 C/A/B 产品、测试、fixture、配置、契约、证据或运行时。

当前 T40 五个 runtime 文件的 SHA-256 与已收口三旅程记录 `ebbca3f` 完全一致：

| 文件 | 当前 SHA-256 |
|---|---|
| `service/lawbench/remote.py` | `af457cef5960b4b345997d22bfbb3b5cea6d75d4f2987726c954d28eed7eba7b` |
| `service/lawbench/net.py` | `6ce0ed9f17afac9f8d6b04495d3f1522c31087ea29bbe1774a77f46aea1b46a3` |
| `service/lawbench/app.py` | `e38b4efb99488c146d9b7a95b2aa305bc72ffbc94ff54d5c11dbde223c6833bd` |
| `service/tests/test_remote.py` | `7def9080f3533e4150b72bf9b767cfa6e60e48adfb011ccb5d75b6519458a8f5` |
| `service/tests/fake_easytier.py` | `c3a401af94763eae42c7418ed7abc3c83f9765fdef50b6e51d0bbf1a741f9d2f` |

因此这些文件已有的 fake/ASGI/三旅程结果可沿用；本轮不重跑。

## 2. T30–T42 三栏状态

“已核销”只表示列出的证据能够关闭相应动作；“剩余”表示原卡尚未具备完整验收证据。任何一行都不是整卡 PASS。

| 原卡 | 已核销：实际执行体 / 交付 / 直接证据 | 剩余的真实依赖或未验项 |
|---|---|---|
| T30 删除会话 | A 与 root。累计代码切片在 `D:\Lawbeach\lawbench-coord\ORCH-复核-T30部分写入失败-收口-20261021-193255.md`；A 交付在 `D:\Lawbeach\lawbench-A\docs\plan\evidence\T30\交付说明.md`。删除/回收站、部分写入失败、材料呈现与 OCR 页码预检均有过局部红绿或 GUI 切片。 | 缺少“已经实际开始过、且非空的准确合成会话”来观察右击菜单、确认、删除和回收站；空会话右击只观察到无菜单。Windows 三张真机截图、U 盘拒绝仍未组成整卡验收。不得伪造历史、metadata 或发模型消息来凑条件。 |
| T31 客户端小活批 | A 为主，B/root 做跨层证据。`02-input.json` 当前 fixture `e4823f5f...` 已实际运行 2/2：真实 source 的 SessionStore/Host/Inbox/control frames、固定生成 JS、local echo；`03-input.json` 为当前 B346/Host/CoreClient 的 native HTTP 14×200 切片。A 还交付 logo、wiki、加号、路径/批量等局部 GUI 或源码证据。 | `GUI_pass=false`、`whole_T31_pass=false`。真实 GUI 默认 3/3、reimport 0、toggle/all/cancel 仍未验；native picker 当前有 parent-only window、missing cached 199、outside-bounds drag 条件，owner 手工选择暂不可用。禁止盲目 fresh picker、重试、替代工具、伪造事件或 fake HTML。 |
| T32 右栏与文稿 | A/B/root。`05-input.md`：真实 DSH/Gateway/RPC/Host/native 完成 registered Markdown v1 预览→编辑 v2→保存→读回→v1/v2 切换；`06-input.md`：保存被安全拒绝时编辑器正文和 dirty 保留。右栏案件/文稿、临时原文页签已有证据。 | pending 保存期间关闭/重挂、真实 OCR 任务、真实材料移除仍未验。当前没有合法受控慢资源；T52 slow-start 方案已拒绝，禁止新增 slow fixture/替代重试。真实整 T32 未通过。 |
| T33 路径索引不复制 | B/root/A。`04-input.json`：真实当前 CaseRegistry/Materials/RefRegistry 完成 C→D 跨卷 moves、missing、relocate、重建持久，1/1。既有 100 MiB 目录登记、无原件副本、JPEG 改名→missing→重新定位、原生位图落盘也有独立证据。 | 真实 GUI 目录选择不能拿跨窗拖拽冒验；多候选、真实 OCR 出处、完整跨窗拖拽/真实重定位体验仍未组成整卡验收。native picker 当前受同一资源限制。`GUI_pass=false`、`whole_T33_pass=false`。 |
| T34 第三方公开模型（客户端） | B 交付真实 CoreClient/native HTTP 的 begin→abort/end 和本地 route；`ORCH-T34CoreHttpNativePass-20261025-165104.md`。A/root 做过设置只读呈现、禁用态、契约/生成/样例和 live consumer 切片。 | `settings/rejected cause` 仍未知，当前没有新元数据，禁止盲查 Keyring/网络。真实 provider、真实 Key、桌面真实发送、白名单整链仍未验。CoreClient/native 本地 route 不等于 external provider，也不等于整 T34。 |
| T35 提示词优化按钮 | A/root。`ORCH-复核-T35成功回填与T32保存后旧稿缓存发现-20261025-0022.md`：合成成功回填、只插入不发消息；空输入/失败保留另有证据。 | 真实模型改写质量未验；需要合法真实模型资源，不能使用施工 Key、替身成功或重新跑已过合成夹具。真实 DSH 多轮效果属于后续 T45/律师走查的一部分。 |
| T36 Skill 规则批 | B。提交 `e282d71`；交付 `D:\Lawbeach\lawbench-B\docs\plan\evidence\T36\交付说明.md`。两条共用规则、18 个 Skill 同步、build/check exit 0，并有 fake 6000D 与当时真 6000D 的对话记录。 | 交回后无后续协调收口件；不据此宣布整个第二期门通过。后续真实 DSH 多轮/工具效果归 T45 和律师走查。新机 LibreOffice/pandoc 基线差异是既有条件，不在本轮安装。 |
| T37 路径索引不复制（服务侧） | B/root。`ORCH-复核-T37应用API完整累计切片-收口-20261022-230321.md` 接受 copy/ref/relocate 的 Materials/Refs/API 工程切片。当前新 job 已派：`T37-legacy-mixed-order-20261027-080232.md`；截至本次检查，B 侧只出现 `legacy_mixed_check.py`（8:07），README 和 `B-handback-T37-legacy-mixed-20261027-080232.md` 尚未出现。 | 旧复制/新引用混存兼容、同盘对象重建后 legacy copy 与 ref/missing/source_deleted 并存，尚未由当前 job 准备完和 root 运行验收。默认 `create_app`/真实 HTTP/GUI/整 T37 仍未验。该 job 不得因已有脚本就视为通过，也不得重派重复任务。 |
| T38 第三方公开模型（服务侧） | B/root。`08-input.json`：服务契约完整累计 74 targets，两独立 scope/behavior 均 PASS；settings 页面有只读 GUI 切片。 | `07-input.md` 明确只是设置只读呈现，不是保存/凭据/真实 provider。真实配置写、Keyring/钥匙串、外部 provider、真实所外路由仍未验；settings/rejected cause 未知，禁止盲诊断。 |
| T39 提示词优化（服务侧） | B/root。`09-input.json`：HTTP 完整累计 20 targets，两独立 scope/behavior 均 PASS，receipt 已落。 | 只关闭接口工程切片；真实模型改写质量与“不是只回原文”的业务质量仍在 T35/后续真实条件，不能以 HTTP 绿替代。 |
| T40 EasyTier 嵌进工作台 | C 为主，A/B/root 配合。方案与 owner 裁决已落：全所一把正式接入码、连接即持久开启、断开即持久关闭、保留 STUN。`ORCH-复核-T40跨线运行器完整切片-收口-20261022-014053.md` 接受三旅程、运行器硬界和 CIM 清理；输入页/schema/API/设置 Host 也有独立切片。 | 整 T40 未过：真实 GUI 一键接入、真实 EasyTier sidecar、真实凭据管理器、6000D/395、真实虚拟网、默认契约 1.5 集成、安装包均未验。T41 正式密钥必须在发包前完成。真实网络/凭据/包均属当前禁区。 |
| T41 所外访问收尾 | C 已交操作单：`D:\Lawbeach\lawbench-coord\ORCH-致用户-操作单-所外收尾-20261019.md`。文档覆盖三台换正式密钥、虚拟网 8080 收口、检查与回退。 | 未发现 T41 验证证据目录或执行回执，说明只是操作单，不是实做。必须由 owner/律所基础设施在约定窗口亲手执行；需要真实节点、正式密钥、6000D/395 和手机热点检查。禁止 C 连接、读取或保存密钥。 |
| T42 Mac Intel | D/root。`ORCH-复核-T42与T47离线工程切片-收口-20261022-011259.md` 接受 workflow、打包布局、架构路径等 21 路径离线工程切片；arm64/x64 target 路径与 Windows 默认经副本探针核对。 | T42/T47 任务门均未关闭。缺 T44 freeze、真实云 Mac x64/arm64 构建、Intel 真机 N84、正式冒烟和 Packaging 授权；T42 云试包已转 T47。静态布局不能当 dmg 或冒烟。 |

## 3. T43–T48 门状态

协调目录文件名扫描：T43、T44、T45、T46、T48 均 0 个“完成/收口”件；T47 仅有前述离线工程切片。

| 门卡 | 当前状态 |
|---|---|
| T43 方案裁决 | 未见集合式 T43 收口件。T40 及其他局部 owner 决策存在，但不能替代 T43 的完整裁决门。 |
| T44 合流与冻结 | 无 freeze；未合流、未冻结、未形成 `freeze.txt`。 |
| T45 盲测 | 无盲测卡组执行证据。T31/T33/T37/T40 的切片不能代替。 |
| T46 Windows 1.0.0 | 无安装包，Packaging HOLD。 |
| T47 Mac 1.0.0 | 只有离线工程接续，不是两架构 dmg、云冒烟或 Intel 真机证据。 |
| T48 律师真人门 | 无律师走查记录。 |

所有原卡仍只能记为 Gate 1 未完成；不得跳门或把“工程可编译/切片绿”写成 ②–⑤ 门证据。

## 4. 分类边界

### 4.1 已收口的是源码/工程切片

- T30：删除/回收站、部分写入失败、持久化事实等累计代码切片。
- T31：产品实现、路径/批量/控制回显、scoped HTTP 等局部切片。
- T32：registered Markdown 原生保存和拒绝保存正文保留。
- T33：Materials/Refs 后端、跨卷、目录/位图/重定位局部切片。
- T34：Core route、CoreClient/native begin-abort-end、settings 禁用/只读。
- T35：合成成功回填、空输入和失败保留。
- T36：Skill 规则文本、构建/契约自检和对话记录。
- T37：copy/ref/relocate 的 API 与数据路径工程切片。
- T38：服务契约和外部模型接线壳的工程切片。
- T39：prompt refine HTTP 接口工程切片。
- T40：C `RemoteAccess`、Net 改道、跨层 fake/ASGI 三旅程、UI/Host/API 局部切片。
- T42/T47：Mac 双架构 workflow 与离线打包布局。

“源码切片已收口”不代表原卡验收，尤其不能替代真实 GUI、真实模型或真实网络。

### 4.2 本地运行时证据

已有可信局部运行时包括：T30 材料页/OCR 预检、T31 native control/echo 与 scoped HTTP、T32 native Markdown、T33 跨卷、T34 CoreClient native local route、T35 合成回填、T38 设置只读、T40 fake EasyTier/真实 ASGI/三旅程。它们都带有明确的“不是整卡/GUI/真实 provider”限定。

本轮不重跑这些同 SHA 结果。

### 4.3 GUI

- 真实 GUI 有局部通过：T32 Markdown 保存/拒绝保留、T33 部分目录/位图、T35 合成回填、T38 设置只读。
- 仍缺真实完整 GUI：T30 删除/U 盘、T31 默认批量及 picker 流程、T32 pending 保存/重挂、T33 跨窗拖拽/多候选、T34 真实设置与 provider、T40 一键接入。
- current native picker 的父窗口/cache/越界限制属于已知资源问题。没有 owner 允许的等价受控资源时，不能以 fresh picker、盲重试或 fake HTML 代替。

### 4.4 真实模型

T34 真实外部 provider、T35 真实改写质量、T38 真实服务路由和凭据仍未验。T36 曾有真 6000D 对话，但那是历史证据；本轮禁止调用真实模型/网络。所有真实模型结论均需新的原始请求证据，不能用 HTTP schema 或 fake 代替。

### 4.5 真实基础设施

T40/T41 的真实 EasyTier、正式密钥、6000D、395、虚拟网 8080 收口和节点集合未验。T37 的真实默认应用/HTTP 仍需另立有界准入，不能直接启动共享服务。真实基础设施行动需要 owner/律所窗口与明确准入。

### 4.6 Mac

只有离线工程和路径探针。缺 T44 冻结、云 Mac、Intel 真机、dmg 和冒烟。不得把 Windows 或静态布局结果移植成 Mac PASS。

### 4.7 安装包

Packaging HOLD。无 Windows 1.0.0、无 Mac 1.0.0、无 freeze SHA、无安装冒烟、无锁文件/产物 SHA 收口。未获明确 root 准入前不 build/package。

## 5. 最早的下一安全动作

### 当前结论

最早的未覆盖原卡工作不是新的 C 线代码，而是已派发的 B 线 T37 legacy mixed-store 准备与后续 root 验收。

当前可核事实：

- job：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\lane-B-T37-legacy-mixed-1017-20261027-080232.job.json`
- 唯一令：`D:\Lawbeach\lawbench-coord\T37-legacy-mixed-order-20261027-080232.md`
- B 准备件目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T37\LegacyMixed-20261027-080232`
- 当前已存在：`legacy_mixed_check.py`，36,960 bytes，mtime 2026-10-27 08:07:18。
- 当前缺失：同目录 `README.md`、`D:\Lawbeach\lawbench-coord\B-handback-T37-legacy-mixed-20261027-080232.md`。
- `10-input.json` 仍记录 `context_verified=false`、`GUI_pass=false`、`whole_T37_pass=false`；不能把“脚本出现”当成验收。

### 明确验收触发

1. B 按令完成 README 和正式交回，且只新增这两个准备文件与交回件；不运行 Node/Python/parser/AST/pytest/import/build/HTTP/GUI/model。
2. root 先完整读交回、README、脚本、固定输入身份与精确 diff，核对没有产品、旧测试、契约、runtime、P29、旧证据或共享数据写入。
3. 只有全文复核通过后，root 才在私有短子根执行同一次 `legacy_mixed_check.py --parent ...`，输出需同时证明：
   - 当前真实 `CaseRegistry + Materials + RefRegistry + contracts` 中，legacy copy 与 refroot 两种材料并存；
   - legacy import 生成案内原件和真实 material/text 身份，ref 模式不复制原件；
   - 冷对象重建后身份/状态/文本保持；
   - 外来 ref 源删除后只有 ref 为 missing，legacy copy 仍有效且文本保留；
   - 自有 legacy 案内副本删除后状态为 `source_deleted`，不是 missing，文本继续保留；
   - 清理、guard 计数、无网络/无 Keyring/无 OCR/无 subprocess/无真实 HOME/TEMP 副作用。
4. 该结果只关闭 T37 旧复制兼容/混存切片；默认应用、真实 HTTP、GUI、整 T37 和任何 Gate 2+ 仍不通过。
5. 若准备脚本或源码身份不合令，root 拒绝并给出具体原因；不要另派通用框架、不要重跑旧 T33/T31 绿证、不要让 C 越界改 B。

### 之后

在 T37 当前 job 合法完成前，没有发现应新开的 C 线原卡实现。T40/T41 后续分别需要真实 UI 或 owner/infra 触发；T42/T47 需要 T44 freeze 与打包准入。若 T37 job 仍无 README/交回，应把它记录为“在飞作者准备未完成”，而不是据此断言所有独立工作结束。

## 6. 已确认 / 推断 / 未决

### 已确认

- 14 个输入快照完整且未漂移。
- C 当前 T40 五 runtime 文件与已收 `ebbca3f` 身份一致。
- T30/T31/T32/T33/T34/T35/T36/T37/T38/T39/T40/T42 的上述工程切片存在直接证据。
- T31 current control/echo 2/2 和 scoped native HTTP 14 已实际执行；GUI 仍 false。
- T37 新 job 只有部分准备文件，尚无 README/交回/运行验收。
- T41 只有操作单，没有验证目录或执行回执。
- T43、T44、T45、T46、T48 无完工件；T47 只有离线切片。

### 合理推断

- T37 job 当前处于“作者准备进行中”或“准备未完成”，而不是已交付。
- T30 的非空会话、T31 的真实 picker、T32 的 pending 保存均不是靠现有绿证或再读源码就能关闭的产品缺陷结论；它们首先缺准确准入资源。
- 现有源码切片没有提供足够理由新开第三轮同类 T31 resolver 修补或 T40 第三轮修补。

### 未决

- T30 是否能用后续合法提供的准确会话资源完成删除/回收站，不影响对其余卡片的局部证据判断。
- T31 native picker 的根因与可用替代准入；当前不得自行探索。
- T32 pending 保存失效的精确产品行为；当前无受控慢资源，不能下产品 bug 结论。
- T34 settings/rejected 的具体根因；无新元数据时不能盲诊断。
- T37 legacy mixed 准备脚本最终是否满足令与运行结果。
- 真实模型、真实网络/密钥、Mac 云构建和律师验收。

## 7. 命令、非零结果与边界

本轮实际使用的成功命令均显式指定：

`C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe`，`login=false`。

实际动作只有：

- 第一个工具读取正式执行令；
- 读取 `HumanCompassInput...\index.json` 和 14 个输入；
- 只读 Git status/log；
- 只读文件枚举、文本读取、SHA-256/字节核对、T37 job/准备件存在性检查；
- 最后新增本报告。

非零结果：

1. 普通 `git status --short --branch` exit 1，原因是共享子模块 `dsh` 的 Git 元数据权限拒绝；没有修锁、ACL、审批或沙箱。
2. 三次只读工具调用误把 shell 参数设为 `bash`，均在预执行阶段返回 `Bash/E_ACCESS_DENIED`；没有启动 Bash、没有读取或写入。随后均用上述固定 PowerShell 7 绝对路径重做。
3. 两次 PowerShell 在“把 `foreach` 语句直接接管道”时出现 `ParserError: An empty pipe element is not allowed`；没有执行子命令、没有写盘，改为先赋中间变量后成功。
4. 一次 `rg` 以大写哈希匹配小写 JSON，exit 1 无命中；不是产品或权限失败。随后已通过读取身份 JSON 和重新计算哈希完成对照。

禁区遵守：

- 没有运行 Node/Python/parser/AST/Vitest/tsc/pytest/unittest/collect/import/build/prepare/serve/probe/HTTP/GUI/model/install。
- 没有运行 setup、legacy、网络、Keyring、Office、6000D、395 或 Mac 云构建。
- 没有读取 `.env.local`、凭据、密码、真实案卷、DSH history/cache/rollout。
- 没有 Git add/commit/rebase/stash/reset/clean/checkout/push，没有暂存，没有修复 index/writer lock。
- 没有更改 sandbox、审批、ACL、UAC、全局配置、API 或安全设置。
- 没有联系其他聊天或代理。
- 唯一写面：新增本文件。

## 8. 交回边界

本报告是 C 线独立重建与下一动作建议，不是 GUI 验收，不是 T31/T37/T40 整卡验收，不是打包授权，也不是项目完成声明。

root 应独立消费本报告并自行选择下一步；本执行者写完后停止，不创建新的 Monitor、循环、写手或重复 job。
