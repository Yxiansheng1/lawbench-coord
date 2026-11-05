# 交回件 — C 线 T18「V2 后置单元粒度」可行性评估（exact1017max）

| 项 | 内容 |
|---|---|
| 执行者 | 独立 C 线会话（本次执行者即唯一 writer） |
| 依据 | `ORCH-C-T18PostUnitV2GranularityFeasibility-20261101-210507.md`（唯一执行令） |
| 输入 | `T18PostUnitV2GranularityFeasibility-20261101-210507-capsule.json`；`lawbench-B\...\T18VisibleUnitSemanticPilotV2-20261101-195816\review-consumer.mjs`（sha256 `9830ff15…c7f98d`，只读全文） |
| 范围 | 纯静态源码可行性判断。**未改任何源码/测试/fixture/preparer/SDK/Skill/产品文件，未写 Git，未发起任何模型调用、HTTP、Node、Python、测试或构建。**除本文件外未创建/修改任何文件；未执行任何 Git 命令 |
| 复用 | 直接沿用胶囊中已通过且源码未变的既有记录（HTTP200×2 / 62→62→62 / issues 全空 / F1、F2 反例），未重演旧开工、安装、调研或全量测试 |

## 0. 结论先行

**建议：CONDITIONAL GO —— 采纳为"下一次受控试验的结构可行性假设"，不是 PASS，不是合流结论。**

三条理由：

1. V2 的失败不在措辞、参数、预算或模型，而在**义务粒度与义务方向**。Stage1 已正确写下"自制工作证"，Stage2 仍把整行判为 ADDRESSED 并引用只谈"虚构身份"的段落——这说明"一源行一处理 + 只从源侧发起义务"这个结构本身会掩盖同一行内的独立事实。
2. 唯一可用的实质结构改动只有一个：**代码侧确定性无损语法切分 + 逐片段双向义务**。切分是标点边界的语法操作，不需要语义分类器、不需要更狠的提示词、不需要换模型/加预算/上框架或私有 API、不需要案例关键词检查。
3. 预算可行性**尚未证实**：义务条数从 62 升到约 300–420，stage2 单次调用输出预计 18k–28k token，存在截断 / JSON 破损 / 漏报 / 逼近 400s–900s 上限四项风险。因此本交回附带准入门槛（S1）与逐级退路（§5、§8）。

**同时写明：这不是提示词变体。** 提示词只是随结构改动的产物；实质内容是切分函数与义务目标表（新增 5 个函数、修改 3 个函数），以及新增的两族反向义务。如果切分与反向义务被砍掉，剩下的只是今天已失败的行级匹配。

## 1. 现状复核（只读结论）

- 协议层**无缺陷**：两阶段 HTTP 200，62 个源单元 → 62 条 Stage1 描述 → 62 条 Stage2 复审，schema / ID / 引用交叉校验全部通过，issues 全空。
- 语义层**两处 BLOCKER**（F1、F2，详见胶囊）：
  - F1：`read-result-92#L14` 内含多个独立事实（自称业务经理 / 可办低息贷款 / 出示自制工作证）。草稿只写"虚构身份"。行级 ADDRESSED + 指向"虚构身份"段落的引用，把"工作证""低息贷款"两个遗漏整体掩盖。
  - F2：草稿与自检对**未读取的底层材料**（电子数据、被害人陈述、聊天记录）做了类别化断言，自检仍判"通过"。协议里根本没有任何一条义务去审"草稿侧主张是否成立"或"自检的通过是否成立"。
- 由此得到一条必须固定的纪律：**全量 unit ID 覆盖 + 机器引文 = 结构覆盖，不是语义证明**。现有判据（协议完整 / issues 非空）无法捕获 F1、F2 这类缺陷；机器校验永远只能证明 id/ref/字节覆盖，不得产出法律或事实 PASS。

## 2. 唯一的实质结构假设

> 把"一源单元一处理"换成"**一语法片段一处理**"，并补上"**每一个草稿候选片段一条反向义务**""**每一个可见自检断言一条反向义务**"；切分确定性、无损、可机器校验。

### 2.1 确定性无损切分（代码侧，不是模型侧）

- 输入仍是既有 62 个 numbered display unit；不新增读取、不新增数据源、不做全案兜底。
- `payload = unit.text` 去掉首行表头 `【第N行】`；表头以 `unit_header` 原样保留（表头/空白/格式**照录**，不隐藏过滤）。
- 切点：全角 `。；！？，`，以及**非数字相邻**的 ASCII `, ; ! ?`（避免把 `16,500` / `80,000` 切开）；边界字符归入**前一片段**；`〔…〕《…》（…）` 视为原子区，其内不切。
- 每片段记录：
  - `fragment_id`：`F:<unit_id>#<seq>`（`F:read-result-92#L14#3`）；
  - 溯源：`unit_id / receipt_id / material_id / number`；
  - `seq`、`start`/`end`（UTF-16 code unit，**父文本内精确偏移**）、`text`（= 父文本 slice）、`context_prefix`（本片段之前的父文本，承载"答：/问："归属与提问语境）、`syntactic_class`（`CONTENT` / `BLANK_OR_FORMAT`，**纯语法判定**）。
- 无损不变式：`unit_header + concat(片段 text) == unit.text`；父文本原样留存 → 字节偏移可随时导出。草稿候选按同一规则切（`C:D:43#2`），自检**表格行按单元格**切（`Q:S:16#4`，含"通过"这类判定格），非表行按标点切；行/跨度原文本原样保留，`|`、`〔〕` 等分隔字节不丢。
- 纪律：**切点 ≠ 事实边界**。片段是否承载独立事实只能由 Stage2 判断；切点本身不得被当作任何事实结论。

### 2.2 三族义务（六档 treatment + 证据理由）

| 义务族 | 每条义务问什么 | treatment 词表 |
|---|---|---|
| 源片段义务（`OF:`） | 这条源片段在草稿里被处理成什么样 | ADDRESSED / PARTIAL / OMITTED / UNKNOWN / NON_FACTUAL |
| 草稿候选义务（`OC:`） | 这条草稿主张在**已读**源片段里有没有支撑 | ADDRESSED(有支撑) / PARTIAL / UNSUPPORTED(无支撑) / UNKNOWN(记录未读，既不支撑也不否证) |
| 自检断言义务（`OQ:`） | 这条自检断言（含"通过"判定格）是否成立 | 同上 |

- `UNCLEAR` 退役并映射为 `UNKNOWN`（避免两套近义标签）；`NON_FACTUAL` 只允许出现在源片段义务（草稿/自检侧不得使用）。
- 每条义务必须带 `rationale`，且 rationale 内含**字节锚定引文**（≤40 字，且必须是目标片段或所引 span 的精确子串）→ "引用不悬空"可机器校验，这是能力判据的一半。
- 关键结构性改进：源片段义务的 `support_refs` 指向**具体草稿候选片段**，不再指向一整行；判定"只覆盖了一部分"必须落到 PARTIAL，**不允许用一条相关引用把复合事实整体打包**。

### 2.3 与禁区的对应

无语义分类器（切分是标点语法）；无更强提示词堆砌；无换模型/改温度/加预算；无新框架/SDK/私有 API；无案例关键词检查；无新增复核层（stage1 不动，stage2 扩展）；无纸面台账。

## 3. 精确 schema 与接口（提案，未实现）

### 3.1 stage2 输入信封（替换现 `buildStage2Envelope`）

```json
{
  "source_units": [
    {"unit_id":"read-result-92#L14","material_id":"M0001","unit":"line","number":14,
     "receipt_id":"read-result-92","text":"【第14行】\n答：……\n"}
  ],
  "unit_context": [
    {"unit_id":"read-result-92#L14","header_text":"【第14行】\n",
     "prev_unit_id":"read-result-92#L13","next_unit_id":"read-result-92#L15"}
  ],
  "obligations": [
    {"obligation_id":"OF:F:read-result-92#L14#3","kind":"source_fragment",
     "target_id":"F:read-result-92#L14#3","unit_id":"read-result-92#L14",
     "text":"给她看了我自己做的工作证。","context_prefix":"【第14行】\n答：我跟她说我是某某投资的业务经理，可以帮她办低息贷款，",
     "syntactic_class":"CONTENT","support_refs_space":["C:*"],"cross_refs_space":["Q:*"]},
    {"obligation_id":"OC:C:D:43#4","kind":"draft_candidate","target_id":"C:D:43#4",
     "span_id":"D:43","text":"上述事实表明张某甲虚构了身份，但该情节已反映在诈骗行为的定性中。",
     "support_refs_space":["F:*"],"cross_refs_space":["Q:*"]},
    {"obligation_id":"OQ:Q:S:16#4","kind":"selfcheck_assertion","target_id":"Q:S:16#4",
     "span_id":"S:16","cell_index":4,"text":"通过",
     "support_refs_space":["F:*"],"cross_refs_space":["C:*"]}
  ],
  "original_draft_spans": [{"id":"D:43","text":"…原行文本…"}],
  "visible_selfcheck_spans": [{"id":"S:16","text":"…原行文本…"}],
  "actual_coverage": { "…原样保留…": true }
}
```

字段说明：

- `source_units` / `original_draft_spans` / `visible_selfcheck_spans` / `actual_coverage` **字节不变**（同 8 份收据、同固定数据、同原草稿、同自检）。
- `unit_context` 保留相邻/源单元语境：`prev_unit_id`/`next_unit_id` 让"问："在前一行、"答："在本行这种结构不被切断（解析 id 即可取回全文，不重复字节）。
- `context_prefix` 保留同单元内的归属与提问语境；**未读材料不隐藏**、不做全案兜底。
- `obligations` 是**代码生成的义务目标表**，模型不得改 id、不得增删目标。

### 3.2 stage2 输出记录（三种 kind 同形，6 个 key）

```json
{"obligation_id":"OF:F:read-result-92#L14#3","kind":"source_fragment","treatment":"OMITTED",
 "support_refs":[],"cross_refs":["OQ:Q:S:16#4"],
 "rationale":"草稿无「工作证」字样，仅以虚构身份概括；自检 S16 未列工作证。"}
```

`support_refs` 语义按 kind 固定：源片段义务 → 草稿候选 id；草稿候选/自检义务 → 源片段 id。`cross_refs` → 另一族的关联 id。

### 3.3 校验与产物（提案）

- 逐义务校验：key 集合严格等于 `{obligation_id, kind, treatment, support_refs, cross_refs, rationale}`；`obligation_id` 必须在目标表内且 `kind` 一致；`treatment` ∈ 新词表（`UNCLEAR` → 校验失败并给出明确报错，不静默改写）；`support_refs`/`cross_refs` 必须落在该 kind 允许的 id 空间且去重；`ADDRESSED` 必带非空 `support_refs`；`rationale` 非空且含字节精确引文；重复 id → 失败。
- **漏报不硬失败**：模型未产出的义务记入 `unreported` 列表，产出 `coverage = reported / targets`，协议状态给 `PROTOCOL_COMPLETE`（100%）或 `PROTOCOL_PARTIAL`（<100%）。这样"漏报"是可观测事实，不会让整轮作废——同时把协议从"全有或全无"改成"覆盖可计量"，不引入新的复核层。
- 产物：现有 `route.json / inventory.json / stage1-* / stage2-* / timings.json` 不变；新增 `fragment-inventory.json`（切分结果与计数）、`obligations.json`（目标表 + 已报 + 漏报 + coverage）；`final-report.json` 增加 `obligationTargets / obligationsReported / coverage / obligationStatus`，并**继续保留** `protocol_capability_only: true`、`legal_or_business_pass: false`。

### 3.4 不变项（明确列出，便于复核）

模型 `qwen38-27b`、`temperature 0.6 / max_tokens 49152 / stream false`、2 次顺序调用、单次 400s、整体 900s、路由与外连白名单、密钥读取与脱敏、源码 pin 与 artifact 写入方式、8 份收据 / 固定数据 / 原草稿 / 自检字节、2 个新语境 —— **全部不变**。

## 4. 最小改动函数清单

| 函数 | 动作 | 说明 |
|---|---|---|
| `buildVisibleUnits` | 不动 | 62 单元构造与字节校验不变 |
| `buildSpanTable` | 不动 | D:/S: 行跨度不变 |
| `STAGE1_SYSTEM` / `buildStage1Messages` / `validateStage1Result` | 不动 | Stage1 仍是 62 条描述；片段切分不需要模型参与，成本不变 |
| `buildFragments(text, kind)` | **新增** | 确定性标点边界切分，返回 `{seq,start,end,text,syntactic_class}` |
| `buildSourceFragments(units)` | **新增** | 组装 `F:*` 片段 + `unit_context`（含相邻 unit id） |
| `buildCandidateFragments(draftSpans)` | **新增** | 组装 `C:*` 草稿候选片段 |
| `buildAssertionFragments(selfcheckSpans)` | **新增** | 组装 `Q:*` 自检断言（表行按单元格，非表行按标点） |
| `buildObligationTargets(...)` | **新增** | 义务目标表、`obligation_id` 分配、id 空间声明 |
| `buildStage2Envelope` | **改** | 携带 units + unit_context + obligations + spans + coverage |
| `STAGE2_SYSTEM` | **改** | 逐义务作答；六档 treatment；必须区分"部分覆盖 / 未支撑 / 未知"；自检判定格是被审对象；禁止用一条相关引用打包复合事实；rationale 必须字节锚定；不得输出总体通过/不通过 |
| `validateStage2Result` | **改** | 改为逐义务校验 + 漏报转 `unreported` + coverage 统计 |
| `buildStage2Messages` / `runMain` / `outputStatusForReviews` | **改（机械）** | 传新信封；写 2 个新产物；状态与计数改为义务口径 |
| `performRequest` / `unwrapChatCompletion` / `parseModelJson` / 密钥与 pin / artifact 写入 | 不动 | 传输层与证据层完全不动 |

合计：**新增 5、改 6、动 0 个传输层函数**。无新增依赖。

## 5. 义务规模、token/时延风险与停止判据

规模为**基于源码逻辑的区间估计**（切分规则是确定性的，但源文本长度未在本次运行统计，因此不承诺精确数字；实际数字由 §5-S1 的一次性代码侧统计给出，不靠猜）：

| 项 | 现状 | 提案 | 估计 |
|---|---|---|---|
| 源侧义务 | 62 | 片段级 | 约 140–190（只有含切点的行会拆，单片段行与今天等价） |
| 草稿候选义务 | 0 | 逐候选片段 | 约 120–170（现有草稿约 51–80 行） |
| 自检义务 | 0 | 逐断言/判定格 | 约 45–60（现有自检约 16 行） |
| 义务合计 | 62 | — | **约 300–420** |

风险与抑制：

- **输出膨胀**：stage2 输出约 4k → 18k–28k token（每条 5–6 字段 + ≤40 字 rationale + ≤40 字引文）。`max_tokens 49152` 未触顶，但**截断与 JSON 破损**风险明显上升。抑制：rationale 与引文长度上限、禁止回显源文、紧凑数组输出。
- **输入膨胀**：片段正文总量≈源正文 1 倍 + 元数据，stage2 输入 +40%–70%；相对当前上限仍宽裕。
- **时延**：一次调用要产出约 7 倍结构化内容，**400s / 900s 上限被逼近是本方案最现实的失败原因**。
- **漏报/档位拉平**：长列表下模型单条质量下降、可能整行处理或统一档位；这正是 §6 判据要暴露的对象。

停止判据（预注册，先判后跑）：

- **S1（准入，不调模型）**：义务总数 > 400，或按实测每条平均 token 估算的 stage2 输出 > 30,000 → **不跑**，报 `INSUFFICIENT_BUDGET`，转 §8 退路。
- **S2（协议层失败）**：单次 > 400s / 整体 > 900s / 响应截断 / JSON 破损 / 覆盖率 < 90% → 判定"2 次调用预算下不可行"，转 §8-A 或 §8-B。
- **S3（能力层证伪）**：若 F1 单元上模型仍产出"整行一条 ADDRESSED 且只引虚构身份段落"或"该行各片段处理档全同"，且工作证片段的字节锚定引文不含"工作证" → **本假设被证伪（REJECT）**，转 §8。
- **S4（未知记录内容层证伪）**：若涉及未读底层材料的主张一律被判为已支撑/部分支撑、全程不出现 UNKNOWN → 说明结构没带来新能力，**REJECT**，转 §8。
- **S5（任何一轮都适用）**：产物必须保留 `protocol_capability_only: true`、`legal_or_business_pass: false`；不得输出法律或事实通过结论；模型判断一律 Root-provisional。

## 6. 可证伪的实际能力判据（单条，非机器语义 PASS）

在同一批固定数据、同一模型与同一预算下重跑一次协议，产物中必须出现可人工核验的"**逐片段区分 + 字节锚定引用**"行为：

1. `read-result-92#L14` 的源片段义务 ≥ 3 条，且其 treatment **不全相同**；工作证片段若判 ADDRESSED，其 rationale 的字节锚定引文必须含"工作证"字节；判 PARTIAL/OMITTED 亦算通过。
2. `D:43` 中"虚构身份"那段存在**独立**的草稿候选义务，其 `support_refs` 指向具体源片段，且 `D:43` 整行**不得**再作为单一引用单位出现。
3. `S:16` 的判定格"通过"存在独立自检断言义务，且其 rationale 必须指出未覆盖的具体片段（含"工作证"或"低息贷款"字节）或指出该格无支撑。
4. 全部已报义务的 rationale 均含字节精确引文（机器只校验"引文不悬空"，这是结构检查，**不是**语义 PASS），且覆盖率 ≥ 90%。
5. F2 涉及的三个源单元与 `D:18/D:21/D:29/D:32/D:51` 中关于未读取底层材料的主张，其义务不得出现"已由已读源支撑"的结论，须落在 UNKNOWN 或 UNSUPPORTED，并写明未知依据（记录未读/未核验）。

**反例（falsifier）**：模型仍把 `read-result-92#L14` 整体判为一条 ADDRESSED，或同一行各片段处理档一致，或对 `S:16`"通过"给出无条件 ADDRESSED 且未指出未覆盖片段——则"仅靠粒度 + 反向义务"路线被证伪。

判据归属纪律：以上 1/2/3/5 属**Root 终裁范围**（模型判断 Root-provisional）；第 4 项是唯一可机器判的部分，且只判结构。**F1/F2 知识绝不进入模型输入**：模型只拿到机械切分结果，不含预期缺陷标签、不含人工切好的案例片段。

## 7. 本假设不能证明的三件事

1. **结构覆盖 ≠ 语义真伪。** 义务 100% 报告只证明"每条片段都有一份模型意见"，不证明意见正确。机器校验永远停在 id/ref/字节覆盖层面，产物不得升格为法律或事实 PASS。
2. **未知记录内容 ≠ 虚假。** 本次只读起诉意见书与讯问笔录，电子数据、被害人陈述、聊天记录等底层材料未读。对这些材料的任何断言既不能判"已支撑"，也不能判"假"，只能记 UNKNOWN 并写明未读依据；协议为此**禁止**全案兜底与隐藏过滤。
3. **粒度 ≠ 事实边界。** 标点切点只是语法切点：同一切点两侧可能是同一事实的两种表述（PARTIAL 的来源），也可能是一行内的多个独立事实（整体 ADDRESSED 掩盖的来源）。切点本身不构成任何事实判断。

另需承认：本方案不保证能发现全部缺陷，只是把"发现能力"的载体从行级匹配换成片段级逐条义务；新的失败模式（漏报、档位拉平）由 coverage 与 §6 判据暴露，而不是被掩盖。

## 8. 若被否或预算不足：原任务内的最小替代

不扩权、不换模型、不加数据源、不改 8 份收据与原草稿/自检字节，依次退：

- **A（最小改动，仍 2 次调用）**：只做"**草稿侧引证锚定的候选片段 + 全部自检判定格**"两族反向义务，源侧仍保持 62 条行级义务。义务约 120–150，stage2 输出约 8k–12k token，2 次调用内较稳。能直接命中 **F2**（草稿主张无支撑、自检"通过"真伪），**不能**命中 F1 的"同一行内多事实被一个引用整体覆盖"。
- **B（A 仍不稳时）**：把需要语义判断的量压到 ≤ 60 条——用**代码侧确定性引证锚定预筛**（只对含〔…〕引证且指向本次已读收据/行的草稿片段、自检判定格，生成候选片段↔源片段的机械对照表），模型只对入选条目作判断。仍是结构操作，非语义分类器、非案例关键词检查。
- **C（仍不可行时）**：判定"2 次调用预算下逐片段复核"不可行，报 **INSUFFICIENT**，把"增至 3 次调用"或"缩到单一收据子集"作为**预算/范围变更请求**交主编排与 owner 裁决，本线不自行扩权、不自行改审批与网络。

## 9. 交回声明

本交回是**可行性判断**，不是独立 PASS：未运行协议、未调用模型、未改源码，结论建立在胶囊中已通过且源码未变的既有记录 + 本次对 `review-consumer.mjs` 的只读全文阅读之上，可复核。产物继续标注 `protocol_capability_only: true`、`legal_or_business_pass: false`。收到新的结构试验授权前，本线不做任何实现、不做 Git 写入、不扩展到其他收据或案例。

