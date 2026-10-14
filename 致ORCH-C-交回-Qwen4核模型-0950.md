# 致 ORCH · 线 C 交回 · 6000D 换 Qwen4 27B：核模型（令 10-14 09:45）

- 提交 `07fe707`（一个 `T11:` 提交，基于 main `c5057cb`）。没碰任何服务器。
- 核实记录：`docs\plan\evidence\T11\模型候选.md` 第八节。预案操作单：`deploy\操作单-6000D换模型-Qwen4-27B.md`。

## 结论一行
**Qwen4 27B 的权重截至 2026-10-14 上午没有发布，下载不到，现在换不了。** 客户端要不要改、要不要重打包，要等它发布后核完分词器和思考参数才能回答，现在答不了。

## 1. 存在性（10-14 当天查）
- Qwen 官方 Hugging Face 账号下，名字含 Qwen4 的仓库**一个都没有**。最近创建的文本模型就是 `Qwen3.8-27B`（08-05）、`Qwen3.8-27B-FP8`（08-13）、`Qwen3.8-Flash-Next`（08-24）。
- 按名字直接访问 `Qwen/Qwen4-27B`、`-FP8`、`-Instruct`、`Qwen-4-27B`、`Qwen4-32B`、`Qwen4`：全部 401。对照 `Qwen/Qwen3.8-27B` 是 200。
- ModelScope：`Qwen/Qwen4-27B`、`-FP8` 都是 record not found。
- 全站搜索唯一沾边的是第三方 `IteraCompute/Qwen4-27B-NVFP4`：10-14 凌晨刚建，只有一个 README，没有权重。它自述是"为预期中的发布预留位置"，并声明与官方无关。
- 新闻：多家第三方站点说阿里 9 月 22 日在云栖大会点名了 Qwen 4 系列，27B 是开放权重档，没给规格、许可证和日期。**没找到阿里官方页面**，只能当线索。
- **最接近的就是 6000D 现在跑的 Qwen3.8-27B**（Apache-2.0，官方有 FP8）。Qwen 官方目前没有比它更新的 27B。

## 2–4. 上下文、分词器、vLLM、显存
Qwen4 一项都没法核，文档里全部写"未查到"。记下了 Qwen3.8-27B 的基线，供发布后对比：
- 上下文：原生 262,144。
- 架构：`qwen3_5`，64 层。
- 思考参数：`enable_thinking`；`reasoning_effort` 支持 xhigh、medium、low。
- FP8 权重：28.77 GiB。按一张卡 85,651 MiB × 0.90 算，KV 缓存剩约 46 GiB。

**6000D 现装的 vLLM 版本，事实索引和 T11 记录里都没有，需要用户在 6000D 上 `pip show vllm`。**

## 顺带查清的一件事
客户端里打包的 `tokenizer.json`（从 6000D 取回，sha256 `87a7830d…`）和 Hugging Face 上 Qwen3.8-27B 的那份（`0997f410…`），**文件哈希不同，但内容完全相同**：词表、特殊 token、合并规则逐项相等，只是合并规则的存储格式不一样。所以执行令里说的"tokenizer.json 哈希对比"会误报"不同"。以后要比内容，第八节里写了比哪三样。

## 5. 操作单（预案，现在不能执行）
`deploy\操作单-6000D换模型-Qwen4-27B.md`：
- 开头标明"⛔ 现在不能执行"。
- 跟模型无关的步骤写好了：
  - 记现状；
  - 下载并核 sha256；
  - 停两路 vLLM；
  - 换启动参数，显式加 `--served-model-name qwen38-27b`；`--speculative-config mtp:3` 先不带；
  - 验证：`/v1/models`、一次带工具调用的请求、一次思考模式请求、开发机上跑两个检查脚本；
  - 回退。
- 停机窗口估 30–45 分钟，下载可以提前做。
- 取决于新模型的地方都留了【待填】，没填完不要交给甲方。
- 有三件事没有记录，要在 6000D 上看：
  - vLLM 版本；
  - 两路 vLLM 是怎么起的（systemd 还是脚本）；
  - 对外名字 `qwen38-27b` 是启动参数给的还是网关映射的。

## 6. 风险（发布后才能逐条落实）
1. **许可证不能想当然**：上一代 27B 是 Apache-2.0，但同代的 Max、Flash-Next 是别的许可证。
2. **分词器如果变了**，客户端要换分词文件、重打包，而且要和换模型同一天上。
3. **思考参数如果变了**：客户端"高"档现在发的是 `xhigh`，新模型不认就会 400。
4. **vLLM 可能要升级**：新架构往往要新版本，升级 vLLM 本身就是一次有风险的改动。
5. **显存与并发**：权重更大的话，KV 缓存变小，`--max-num-seqs 128` 可能要降。

## 建议
先不动。等官方仓库出现（可以定期看 `huggingface.co/Qwen`），再按第八节末尾的 6 项核一遍，把预案里的【待填】填上。要我到时候再核，发令即可。

## 出处
- Hugging Face API：`/api/models?author=Qwen&search=Qwen4`、`/api/models?author=Qwen&sort=createdAt`、`/api/models?search=Qwen4`
- hf-mirror API：`/api/models/Qwen/Qwen4-27B` 等
- ModelScope：`/api/v1/models/Qwen/Qwen4-27B`
- https://huggingface.co/IteraCompute/Qwen4-27B-NVFP4
- https://huggingface.co/Qwen/Qwen3.8-27B 、https://huggingface.co/Qwen/Qwen3.8-27B-FP8
- 第三方报道（仅作线索）：https://www.yottalabs.ai/post/qwen-4-27b-release-date-specs-hardware-what-is-known-2026 、https://llmlearner.com/models/qwen4-27b 、https://www.orcarouter.ai/blog/qwen-4-27b
