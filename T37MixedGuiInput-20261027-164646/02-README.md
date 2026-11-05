# T32 当前 opt-in 源码的严格新入口（root static AMEND）

状态：`RUNTIME_NOT_RUN`、`NOT_ACCEPTED`。本次是 root 指出的静态 fixture 兼容返修；本目录只保存作者按正式执行令产出的有限入口与探针。作者没有运行 Python、Node、PowerShell 启动脚本、HTTP 请求、GUI、模型、OCR、安装、测试或构建。这是有限 HTTP/后端检查，不是 GUI 启动器，不是 GUI 验收，也不代表整个 T32、打包或生产验收。

## 目标

在独立合成的案件根上，用真实 `lawbench.app.create_app` 创建服务，先经同一个 Firewall 的 `httpx.ASGITransport` 执行以下三次原生调用：

1. `POST /api/case/open`
2. `POST /api/materials/import`，同一合成目录第一次引用导入
3. `POST /api/materials/import`，同一合成目录第二次幂等引用导入

随后才启动一个 IPv4 loopback TCP listener。删除前分别读取 default、`include_removed=false`、`include_removed=true`，三份都必须是原样三行 `parsed`。监听后的业务写入口只新增 `POST /api/materials/remove`，并且只接受当前案件和 `["M0002"]` 一次。删除后 default/false 必须是原来的两份完整材料行，true 必须是两份当前材料加一行真实原生墓碑。原 `case/open` 和 `materials/import` 路由保留原严格校验；setup 结束后同一案件恰好允许两次成功导航重开，第三次同案重开为 403，导入继续拒绝。

ASGI setup 请求写入 `setup-requests.ndjson`，监听后的请求写入 `requests.ndjson`。两份记录不混用。

## 文件

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `server.py` | 141080 | `cce387f4b5492a0be2b10ef1e99c2687872a60a826f8bdfaab5ed62ffc8fad79` |
| `probe.mjs` | 22165 | `b1b3fa29d57ad1b727dc04c21804dcb117b0d6efb970d94b29a9d2cf3b62cb92` |

`server.py` 和 `probe.mjs` 都从 `docs/plan/evidence/T32/RefRemoveEntry-20261027-115753/` 的旧审版本逐字节复制后作有界修改。`README.md` 按当前任务重写。探针只由 root 复核后运行。

## 入口改动

| 基线位置 | 新入口范围 | 改动 |
|---|---|---|
| 模块头与常量 | `server.py:1-132` | 新标题、当前固定源码清单路径与摘要、目标 `M0002`、唯一新增 remove 路由、setup 账本 |
| `Firewall.__init__` | `server.py:851-910` | 分离 setup/TCP 账本，增加 remove、移除前后状态和按选项分桶的列表证据 |
| `Firewall._record` | `server.py:911-930` | 按通道写账本并记录 `channel` |
| 新增文本/身份方法 | `server.py:1291-1361` | case 内相对路径、派生文本身份、原生三材料状态快照 |
| `Firewall.finish_setup` | `server.py:1362-1424` | 校验两次导入、current3、R01 和 M0002 指向 `scope-out.txt`，保存移除前基线 |
| `_verify_pre_remove_state` | `server.py:1425-1439` | 移除前重验索引、引用、文本、来源、任务和登记 |
| `_verify_post_remove_state` | `server.py:1440-1527` | 校验 M0002 墓碑、派生文本消失、其余两份原始行和文本不变、R01 仍为 `ok`、外部来源不变 |
| `_validate_public_materials` | `server.py:1528-1578` | 分别用真实列表校验移除前 3 份、移除后 2 份 |
| `_claim_case` | `server.py:1825-1873` | setup 后只允许两次成功同案导航重开，写入前重验来源 |
| `_claim_import` | `server.py:1874-1915` | setup 后拒绝任何导入 |
| 新增 `_claim_remove` | `server.py:1916-1955` | 精确 case、精确 `["M0002"]`、无查询、无额外字段、单次、phase 和移除前状态 |
| 新增材料查询解析 | `server.py:1169-1202` | default/false/true 精确解析；重复、空值、错案、未知键和非法值拒绝 |
| `_claim_get` | `server.py:2002-2057` | 材料列表按单次请求选项精确解析；所有合法重复读取只受原始 `MAX_MATERIAL_LISTS` 上限约束；其他路由的原严格查询校验保留 |
| `_policy` | `server.py:2214-2232` | 仅增加 remove 分派 |
| `_complete_case` | `server.py:2241-2277` | 单独记录监听后的一次同案重开 |
| 新增 `_complete_remove` | `server.py:2328-2357` | 校验原生成功信封和移除后状态，转入等待真实列表 |
| `_complete_get` | `server.py:2418-2515` | 删除前每次均深校验当前请求选项；首个合法删除后响应即进入 `done`，`done` 后的重复读取仍逐次深校验并累计；每份结果存入实际请求选项桶 |
| `_complete` | `server.py:2654-2710` | 新 remove 响应校验与 inflight 清理 |
| `Firewall.evidence` | `server.py:2790-2977` | `protocol_complete` 要求原始安全/移除不变量和至少一份实际校验过的删除后响应；三变体与 GUI true 墓碑分别给出独立布尔证据 |
| 新增 `_seed_native_asgi` | `server.py:2908-2993` | 监听前 exact case/open 与两次 import，全部经同一 Firewall |
| `_serve` | `server.py:2994-3393` | listener 前 seed、ready 证据、recycle 拒绝、load/source 关闭与自然生命周期 |

## 材料列表查询

`GET /api/materials` 只接受当前绑定案件的下列原始查询形状：

- `case_id=<当前案件 UUID>`
- `case_id=<当前案件 UUID>&include_removed=true`
- `case_id=<当前案件 UUID>&include_removed=false`

两个参数顺序可以互换，但每个键只能出现一次；`include_removed` 的值只能是原始字符串 `true` 或 `false`。空查询、空值、重复键、重复 flag、未知键、错案和非法值都由 Firewall 在进入原生 ASGI 前以 `MATERIALS_LIST_QUERY` 拒绝。其他 GET 路由继续沿用原入口的单 `case_id` / 单 `session_id` 精确查询约束。

每次请求的解析选项只沿本次调用链传给完成检查，不写入共享的“上次查询”标志。默认与 false 删除后必须深比较为原来的两份完整材料行；true 才允许出现墓碑。有限 probe 的最终校验要求删除前三态各一次、删除后三态各一次，并保留 default、false、true 三份响应元数据。

上述三态三份是有限 probe 的固定覆盖，不是通用读取协议的前置条件。通用 `protocol_complete` 仍要求原始 setup、单次 remove、原生 raw 墓碑、原件/派生文本保护、登记、来源、引用和索引不变量，并要求至少一份经 `_validate_public_materials` 按本次请求选项完整深校验的删除后响应。合法 default/false/true 读取可重复，只受原入口的 `MAX_MATERIAL_LISTS = 16` 约束；不得把重复读取误判成新协议。

`all_list_variants_verified` 只从实际出现的 pre/post default、false、true 桶计算，并且每个删除后桶必须分别为 default/false 2 行、true 3 行。`gui_optin_tombstone_verified` 只从实际出现的删除后 true 3 行桶计算。二者都不是通用 `protocol_complete` 的条件。`post_remove_list` 继续只保存 default 2 行，绝不把 true 3 行写入该字段。有限 probe 自身仍明确发出并断言 pre/post 三变体、6 次原生 GET、负向查询不进原生层、精确三份载荷和来源清理；本次修改不弱化、不跳过、不伪造这些断言。

## 安全与边界

- 固定源清单改为 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32OptinEntry-20261027-131809\reviewed-current-native-source-pins.json`，53,547 字节、SHA-256 `5856ffbfded1bceff8671e52bb903955a94415e58aff860f0e43c43a3b9d7835`。清单有 346 个固定项，其中 `entry/server.py` 使用本入口新身份；入口不通过动态散列放行清单外代码。
- `PRODUCT_ROOT` 仍由本文件 `parents[4]` 得到 `D:\Lawbeach\lawbench-B`。
- token 是 Host 运行时生成的本地临时 token，只写入私有 run 根的 `ready.json` 供有限探针认证；不使用 `.env.local`、Keyring、真实 Key 或真实案卷。
- Key getter 是内存假值并在启动时断言 0 次；Keyring 调用 0；socket/HTTPX 外连和子进程由原 guard 拒绝。
- 产品 lifespan 关闭；OCR 不启动；Retainer 不启动或关闭；Office 转换拒绝；`can_recycle` 和 `recycle` 也被拒绝。
- source、JPEG 控制件、settings、daily marker、任务目录和单一案件登记在 setup 前后、remove 前后和 shutdown 时复核。
- 原普通只读 route 保留；没有扩大为通用代理，没有新增模型、任务、scope、setting、import 或任意材料写入 route。
- 本目录不包含 GUI 启动器或构建配置。当前 A 运行时的 GUI 接入必须另做完整复核、私有构建和固定；本阶段不运行也不准备。

## 有限探针

`probe.mjs` 从 `ready.json` 读取固定 `127.0.0.1`、随机端口、64 位临时 token、有限生命周期和 setup 证据。它不启动服务，只做以下有限序列：

1. 读取原生 `引用.json`、`index.json` 和三份外部 TXT 身份。
2. 删除前读取 default、false、true，三份都与 setup 的完整公开三行相等且全部 `parsed`。
3. 拒绝错案、错材料、额外字段、额外查询和两种 Authorization 重复顺序。
4. 确认拒绝期间索引、原生状态和来源身份完全不变。
5. 发出唯一一次 M0002 原生 remove。
6. 删除后先以 `MATERIALS_LIST_QUERY` 拒绝错案、重复 flag、重复 case、非法 flag 和额外查询；这些请求不得增加原生材料列表成功或准入计数。
7. 校验 default 与显式 false 都是原来的 M0001、M0003 完整行；显式 true 是这两行加真实持久化 M0002 墓碑，墓碑 `status=removed`、`chars=null`、`stale_ocr=false`，编号、名称、路径、类型、位置单位、来源、引用编号和原件位置与删除前一致。
8. 校验索引保留 M0002 墓碑，其余两行不变，R01 仍是 live，外部字节与 mtime 不变。
9. 等待服务自然写出 final 和 loop-closed，并校验 listener、网络 client 与产品日志已关闭。

作者未执行任何探针命令。root 需先完整复核固定源码与入口 diff，再选定一次不超过 600 秒的有限生命周期；建议按正式执行令使用一次 20 秒运行。探针自报 `backend_guard_only` 和 `not_gui_acceptance`，不能替代 GUI 验收；真实 GUI 的 true 轮询验收仍须在后续 current-runtime GUI 阶段独立完成。

## 复核重点

- 先审 `_material_list_query`、`_claim_get`、`_validate_public_materials`、`_complete_get` 和 `__call__`，确认选项没有落入共享字段。
- 再审 `protocol_complete` 是否保留原始安全/移除不变量且只要求至少一份已校验删除后响应；三变体和 true 墓碑是否仅作为独立证据布尔值。
- 确认 M0002 在当前导入顺序中确实指向 `scope-out.txt`；若原生结果不同，应记 fixture 红，不扩大路由或改产品。
- 确认 `setup-requests.ndjson` 只有三条 ASGI 写请求，`requests.ndjson` 只含 TCP 请求。
- 确认 ready 中 token 是本 run 的临时值，未进入协调目录或报告。
- 确认探针失败时保留 run 根，不用重试、放宽断言或伪造成功。

