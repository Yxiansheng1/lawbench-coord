# T18 bid-drafting 原生消费者源码交回

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已按正式执行令建立 bid-drafting 样本 03 的源码作者包，含原生消费者、有限 B 服务、固定输入清单和 README；六个批准输入及关键冻结 pin 已做只读身份核对。 |
| 目标是什么 | 目标是给根控一份可独立审查、尚不宣称实际运行通过的 original bid-drafting 原生工作流源码；离终门还差根控整源码/静态绑定/有限 admission 和一次实际运行。 |
| 在等什么 | 等根控完成全量反向审查、静态绑定与 admission，并给出运行信号；信号到达后由根控按既有匿名 DPAPI stdin 路径仅运行一次。 |
| 卡在哪 | 作者运行已按令停止，不是故障停摆；默认 `git status` 因共享 `dsh` 子模块外部路径权限拒绝而非零，已用忽略子模块的只读状态确认目标目录，未修权限、锁或审批。 |

## 交付范围

唯一新证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\BidDraftingNative-20261029-075529`

目录中有四项：

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-bid-drafting.mts` | 119002 | `8d7cc7505b99b823550c58da7945d6f227cc75966a91d285bcdc4cb9ff1c731a` |
| `b-service-bid-drafting.py` | 45996 | `b45ab740ad1669db86488d63dc1ea1e798aded0360e91f5a183635ca2b6648a5` |
| `literalfixed-inputs.json` | 11285 | `e14f26a1b72627293a679a562c3cd82b5586061aaf68aa03b701167630d8e560` |
| `README.md` | 9911 | `92cd07a3692e4856cc318d2c90ac9a87980cb3d464ca0c7ee0672b99943ee599` |

本交回文件是该目录之外唯一新增文件。没有改工单集、产品源码、B Skill、样例、旧源码、
测试、SDK、安装器、加载器、配置、权限或锁。Git 只做只读查看；没有 add、commit、
rebase、stash、reset、clean、checkout、push 或暂存。

## 源码适配

消费者从已接受的 tender-review 问题文本绑定基线复制，只替换必要场景数据与断言：

1. Skill 改为 `bid-drafting`，任务改为 `A-T18-bid-native-20261029-075529`，输入目录
   改为样本 03。公开 prompt 只取任务标题至首个 `---` 分隔符之前，不包含测试说明、
   两种全称的必问说明或判分要求。
2. 三个案件材料改为 `物业服务招标文件`、`采购需求`、`公司简介`。任务以 `inputs: []`
   发起，不使用样本 01 的未验证 L1，也不回退完整案卷。
3. `max_tokens` 改为该 Skill primary 声明的 49152。32 次模型、48 次工具、45 分钟、
   1200000 ms 请求/流超时、86400000 ms 技术看门狗未增加。
4. 必问 ID 改为 `bidder/parts`。第一个回答明确选择正文第一个全称，并要求核对落款名称与
   文件印章；第二个回答只确认投标函和偏离表。两者标为
   `SYNTHETIC_TEST_LAWYER_CHOICE`，不是真实律师新回复，也不是已验证企业名称。
5. synthetic 回答只在真实模型实际调用 `ask_user_question` 后产生；未知 ID、缺问题、
   无问题、成功保存早于完整回答、保存正文与工具参数或 latest version 不一致均 FAIL。
6. 旧八段审查结构断言已删除。现只检查 `# 投标文件`、投标函、偏离表和未越出两个
   public parts 的章节结构；8/10 人、120 日、自有设备、报价、资质、签章和法律后果
   不写成机器 business PASS。
7. 保留三材料全文覆盖、真实 Skill 工具调用、真实 Session/R/Host/AgentLoop、
   生产 JSONL 关闭重开同一、三材料 citation GET、A-E 缺失、`must_fix=0`、全部 hints
   保留、原件 SHA/字节/`mtime_ns`、旧 source pins、owned cleanup 与 Key 清空检查。

有限 B 服务只替换 Skill/样本/批准清单路径、49152、三材料名和相应报告标签。原有限路由、
拒绝型 outbound transport、凭据拒绝、lifespan off、OCR/retainer/import 关闭、
loopback/no-forward 及全部 setup/finally 原样保留。容器 setup 仍保留 null 上下文，
没有伪造工具响应或模型输出。

## 依据与验证

- 正式执行令：
  `D:\Lawbeach\lawbench-coord\A-T18-bid-native-order-20261029-075529.md`。
- 批准清单：
  `D:\Lawbeach\lawbench-coord\T18BidNativeInput-20261029-075529\approved-inputs.json`，
  2201 字节，SHA-256
  `ee2cf7c3a268206b54922b788cd5958a2aa481622c59f5a2433db787ecfc08ab`。
- 六个原件的字节、SHA-256、`mtime_ns` 均与批准清单和快照一致；Skill 为 12998 字节、
  `d4a562…`，三个材料分别为 2371/1192/320 字节，任务 695 字节，要点 8429 字节。
- 346 项 B source pin 文件为 53548 字节，
  `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`。
- A `dsh-ext\agent\index.ts` 仍为 `40ab48…`，`task-state.ts` 仍为 `fa2467…`。
- B citations 仍为 `6171f0…`；private25 manifest 仍为 `712f3b…`，四个编译对象的
  agent/host/package 身份沿用既有 accepted 值，本轮未导入或运行。
- dirty 前快照与 tracked pins 仍在输入目录：
  `A-dirty-before.txt`、`A-tracked-dirty-pins.json`。目标路径的路径限缩只读状态为
  `?? docs/plan/evidence/T18/BidDraftingNative-20261029-075529/`。
- 源码和清单的旧 tender-review 标识、旧三材料名、32768 与 `PENDING` 负向搜索为零命中。
- 六项材料身份复核使用只读 PowerShell；源码未执行解析、类型检查、import、测试或构建。

## 命令、失败与写入面

截至正式交回前，共执行 64 次 shell 命令：49 次退出 0，15 次非零。非零中有 1 次是普通
`git status` 被共享 `dsh` 子模块权限拒绝，1 次是最终“应无命中”搜索按约定返回 1，1 次是
只读 PowerShell 格式化命令的 ParserError。其余 12 次是运行器选择器/启动器失败：11 次
误选 bash 后在执行前拒绝，1 次使用了不存在的短路径 PowerShell。

另有 10 次 `apply_patch`：9 次写入成功，1 次因同一补丁含重复目标文件的验证错误而未写入。
还出现过 1 次只读命令使用短名 `pwsh.exe` 并成功结束；这不符合显式绝对路径要求，但没有
写入或运行产品。所有失败均未触发 setup、legacy 切换、审批、ACL、锁或 Git 写入。

文件写入面严格为：新证据目录四项，以及本正式交回文件。产品 runtime 计数为 consumer 0、
B service 0、Node 0、Python 0、Agent 0、Session 0、Context 0、Task 0、Case 0、
model request 0、HTTP request 0、source GET 0、DPAPI 0、GUI 0。

## 未做与降级

- 未运行 Node、Python、TypeScript 解析/类型检查、import、测试、构建、HTTP、模型、
  GUI、SSH、DPAPI、Key/环境读取、进程探测或安装。
- 未生成实际 report、草稿、Native JSONL、citation hints、source GET 结果或业务交付。
- 未宣称 bid-drafting 实际运行通过、业务/法律质量通过、Gate 1 通过、完整 T18 通过或
  打包放行。
- 普通 `git status` 的 `dsh` 子模块权限拒绝属于本次禁止修复的阻碍；它不是需要作者修复的
  交付前置。

## 根控人工事项

根控须完成整源码及逆替换审查、静态绑定、当前 pins、有限 ESM 和 admission，再决定是否用
既有匿名 DPAPI stdin 运行一次 canonical 样本 03。实际运行后须人工读取真实 ask，确认它
展示正文与落款两个全称并询问选择；机器没有措辞谓词，也不声称该语义已经通过。

根控还需独立核对：8 名与 10 名的人员偏离、租赁与自有设备偏离、120 日有效期、五列偏离
表、不得从“持证保安 60 人”推出 10 名驻场、报价和签章/签字由律师填写，以及无上游意见时
提醒可先用 `/tender-review`。这些只作为人工核对事实，未注入 prompt、L1 或假工具结果。

## 下一步建议

当前处境是“源码作者包已写，实际运行未开始”。根控完成整源码、setup/finally、静态绑定、
当前 pins 和有限 admission 后，以实际运行信号触发一次 canonical 样本 03；作者本轮到此
停止。

删减轮：读者 2 / 槽位 1 / 半句 3 / 重复 3 / 过程 1 / 黑名单 1

Response ID: `A-T18-bid-native-20261029-075529-AUTHORED-NOT-RUN`

Response log path: `D:\Lawbeach\lawbench-coord\A-handback-T18-bid-native-20261029-075529.md`
