# T18 criminal-reading-notes 原生链路作者包

## 1. 状态

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-criminal-reading-native-order-20261029-085813.md`
- 作者状态：`CRIMINAL_READING_SOURCE_READY_NOT_RUN`
- Gate 1：`INCOMPLETE`
- 打包：`HOLD`
- 本目录只有源码、固定输入清单、README 和交回文件，不运行消费者。

这不是 criminal-reading-notes 实际链路通过、业务质量通过、法律意见通过、完整 T18
通过或打包放行。消费者、Agent、Session、Context、Task、Case、模型请求、HTTP 请求、
ESM 导入、解析器、测试和构建的作者运行次数均为 0。

## 2. 文件身份

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-criminal-reading.mts` | 121086 | `10ecad8e837ea12f46b077efdc735611ac24cfd842332631449050f521df1fe2` |
| `b-service-criminal-reading.py` | 46172 | `e161fcb0df47bd87f4473022888c0db41c9360daa30599975193bdf48285283c` |
| `literalfixed-inputs.json` | 11707 | `17fe7b58b3af630a722a92e553078d5fa66cad5fd0cf99ebf7467ebea50fcdea` |
| `README.md` | 本文件 | 见交回时的最终只读哈希 |

冻结适配基线：

| 输入 | 字节 | SHA-256 |
|---|---:|---|
| `native-tender-review.mts` | 117979 | `19505d6ff1552b310463cefc6f7ff1d86372e810098e8c8e3b1639b08a8fa83a` |
| `b-service-tender-review.py` | 46017 | `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` |
| `literalfixed-inputs.json` | 11289 | `9a1b38a7de5a05a2a3ddfc31e6aa11fe12836194bf899dcbb71a5f59ef6faf23` |

## 3. 七个批准输入

`approved-inputs.json` 为 2706 字节，SHA-256
`7514275a52f7ff840fb5499894e6d9083585615a66e72e3bc3670b56ee3b281f`。

| 角色 | 实际路径 | 字节 | SHA-256 | `mtime_ns` |
|---|---|---:|---|---|
| Skill | `D:\Lawbeach\lawbench-B\skills\criminal-reading-notes\SKILL.md` | 13853 | `0bc8ee2b56b5900fe7d20ce3b6310ec864b8afa789393028f945bf332e291d10` | `1792400314785867900` |
| 材料 | `...\样本01-张某甲诈骗全卷\起诉意见书.md` | 3033 | `e7679f4ff37a2b3754501a7c9542f40deb3fab105c3513c17600da5916607414` | `1792379578802422600` |
| 材料 | `...\样本01-张某甲诈骗全卷\讯问笔录.md` | 1454 | `f2949baa0f7f6faddb8f675f550db246e3e2c2d49ca84169040ff0051622ba48` | `1792379578802422600` |
| 材料 | `...\样本01-张某甲诈骗全卷\现场勘验图文.md` | 396 | `2679d8c0fd896a4c2cae632742aa90134cb825cbced77ba981ea8051e34c070c` | `1792379578802422600` |
| 材料 | `...\样本01-张某甲诈骗全卷\转账截图.md` | 230 | `8886609975be061cfa20015efea5ead6ba6bf08a461ac316f3c3b0cc5af11b35` | `1792379578802422600` |
| 任务说明 | `...\样本01-张某甲诈骗全卷\_任务说明.md` | 775 | `76be730e804c3953f7c94f32ee7141da127bc0e74357bd02e98455be67af2d56` | `1792379578801919300` |
| 要点 | `D:\Lawbeach\lawbench-B\skills\criminal-reading-notes\tests\要点.md` | 10867 | `05534f1d511777d4910103ca53be4f6fe30b9044bfe09f8785784ffcf22d7e02` | `1792379578805930000` |

公开提示词只取任务说明第一个 `---` 前的正文。其后的测试说明、派生说明、评分要点和上面的
人工事实均不进入 model、L1、context 或工具注入。

四份材料均由当前 B 文本扫描器原生登记为 `type=md`、`unit=line`。按当前扫描器同一换行
规则静态核对的行数为：

| 材料 | 行数 |
|---|---:|
| 起诉意见书 | 42 |
| 讯问笔录 | 33 |
| 现场勘验图文 | 5 |
| 转账截图 | 10 |

材料原有 `【第N页】` 文本保持原样，只作为材料内容；模型出处和实际读取位置使用 B 返回的
LINE 单元。没有伪造 PDF 页、OCR 质量、页级读取或 `L1`。

## 4. 有界修改

消费者只做本次场景适配：

1. 标识、报告、Skill、任务和配套 B 服务路径改为 criminal-reading-notes。
2. 新案件显式使用真实 `CaseRegistry` 的 `template=criminal`、`kind=criminal`；复制四份
   已批准 Markdown，不通过 import 路由。
3. 模型参数改为 Skill 声明的 `thinking=低`、`window=64K`、`max_tokens=16384`；32 次模型、
   48 次工具、45 分钟、1200000 ms 请求/流超时和 86400000 ms 技术看门狗不变。
4. 必问项只保留 `scope`，来源标志为 false。合成律师只在模型发出实际回调后返回
   “本次只读全部 4 份材料：起诉意见书、讯问笔录、现场勘验图文、转账截图。”
5. 新增刑事专用顺序门：成功的 `case_list_materials` 结果必须先于实际 scope 提问；回答后
   才允许任何 `case_read_material`。最终保存仍须在所有实际回答之后。
6. 保留严格的 pre-execute denial、成功回调、结果摘要、回答 ID、真实题目文本重建和时序
   断言；同一 scope 若被成功回答多次直接失败。
7. 四份材料必须实际全文读取，材料名、当前版本、字节、SHA-256、`mtime_ns`、`md/line`
   身份和读取范围逐项核对；单读与批量 parts 形状均保留。
8. 最终草稿必须由模型在真实 `case_save_draft` 参数中生成，标题包含“刑事阅卷笔录”，且
   具有用途、覆盖清单、指控事实与证据对应表结构，并引用四份当前材料。
9. 引用继续经当前 `/api/source` 回读，要求 `source_changed=false`、A-E 类缺席、
   `must_fix=0`，并保留全部 F/G hints。
10. `case_suggest_wiki` 只作为一个现有工具名加入有限 B 白名单；成功调用及参数/结果摘要
    单独报告，明确 `validatedLawyerFacts=false`、`lawyerConfirmedCard=false`。

有限 B 服务只改 Skill/样例/材料路径、七项批准输入、刑事 case kind、四份 Markdown、四项
material ID、`md/line` 断言、单 scope 参数和相应报告文字。默认凭据 stdin、拒绝型外连
transport、fetch/finally、BrowserSession、SessionCommandController、AgentLoop、生产
JSONL、精确进程/resources 所有权均保持。

未新增 HTTP 路由、handler、store、loader、SDK、依赖、模型、transport、fake wiki、
fallback 问题、预置 TaskState、假 Native 事件或产品 hard gate。`criminal-reading-notes`
不是四 Skill 产品 hard gate 的成员，本包没有改变该门。

## 5. 冻结对象

清单保留：

- 346 项 reviewed B source pins，53,548 字节，
  `3fdd539f6a43e3864a2d00dcdb56a83e58ed3bf626bbf1d23e415698c01eaa97`；
- 其余 25 项既有依赖不变；末尾唯一 Skill 依赖改成本次七项输入中的 Skill；
- 4 个既有 private compiler objects 不变；
- 3 个运行时可执行文件不变；
- raw 459 项、legacy 产物、既有 fixture、旧 T18 运行结果和 private25 均不重建、不改写。

旧 admission 的 509 不能作为本次证据。相较 tender 场景增加一份 Markdown 和一条批准输入，
主编排必须从当前清单、346 项 source pins、459 项 raw 及其它保留集合重新计算并核对精确
511；本 README 不把该算术替代为一次实际 admission。

## 6. 主编排人工事实清单

以下内容只供主编排在真实运行后人工审阅，不进入提示词、工具、L1、上下文或模型注入：

- 指控含三笔金额单元；人工核对日期、金额和对应证据。
- 第二笔在讯问笔录中的金额含不可读的 `■`，不得补成完整值。
- 第二笔存在“借款”辩解与“解冻费”指控两种说法，不得替律师判断何为事实。
- 第三笔卷内无转账记录、陈述或其他外部印证，只能如实写缺失。
- 讯问同日拘留、记录人同侦查员、勘验未载见证人等只照原文记录，不写违法、无效或排除。
- 退赔 20,000 元只见于起诉意见书，卷内未见退赔凭证。
- 整体只做摘录和结构对应，法律定性须标“法律依据待律师核实”。

这些是 `ROOTMANUAL` 审阅事实，不是 golden-fact、merits、字面正则或模型提示。实际题目语义
也必须由主编排读取真实 question text，确认其列出原任务已经给出的全部四份范围；机器只验证
列材料、问、答、读、存的真实时序。

## 7. 未运行与后续

本轮没有运行 Node、Python、TypeScript/解析器/AST、import/check/test/build、HTTP、模型、
GUI、SSH、Env/Key、DPAPI、root driver 或进程探测，也没有安装、准备 setup 或读取凭据。

主编排仍须完成整源码、依赖、setup/finally、静态绑定和逐字节反向审阅，再按当前授权完成
finite ESM、scoped bindings、重新计算的 511 admission，最后才决定是否用既有匿名 stdin 和
已保存 DPAPI 路径实际运行一次并完成关闭核验。作者到此停止。
