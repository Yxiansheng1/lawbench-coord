# A 线交回：T18 DocRevise 私有构建配置

**状态：`AUTHORED_NOT_RUN / CONFIG_NOT_IMPORTED / BUILD_NOT_ADMITTED / PACKAGING_HOLD`**

## 1. 目标与结论

按 `A-T18-doc-revise-private-config-order-20261029-021504.md`，只准备 root 复审后的私有构建配置。交付是三个审阅文件：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocRevisePrivateBuild-20261029-021504\build-private.mjs`
- 同目录 `build-config.mjs`
- 同目录 `README.md`

本轮没有运行 Node、Python、Vitest、tsc、parser、AST、配置导入、测试、编译、构建、prepare、serve、HTTP、模型、GUI、Key、DPAPI、SSH 或 runtime；没有创建 `private-output-*`，没有安装、打包、部署或替换 runtime。配置尚未导入，构建尚未准入，不能从本交回推导源码编译、原生加载、业务质量、GUI 或 T18 通过。

Git 按执行令严格只读。当前只读 `HEAD` 为 `a23271abee333a9a256fd46a3141da16975c2380`；没有 add、commit、rebase、stash、reset、clean、checkout、push，也没有修改 index、锁、权限或 ACL，因此本轮无提交 SHA，这是交回事实，不是交付阻碍。

## 2. 实际文件与哈希

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20465 | `4bc9a7e174b9222c476870dcf6763fb8aa86ad3d5f17714b0004a3d261de0219` |
| `README.md` | 5406 | `3fda625c3ce8f7a00f4caa802538c8b22217e3dfab2ba1be8bdc30840f4357ea` |

批准输入 builder 同为 32121 字节、`347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`，逐字节比较相等。批准前 config 为 20469 字节、`355b4a3e83d1ea9c585227bbd9223ba6a7d1cb666b0bea15b16802f35bccad48`。

目标目录实测只有上述 3 个普通文件，没有额外 `private-output-*`、manifest、profile、链接或安装包。

## 3. 唯一批准配置变更

`build-config.mjs` 只改以下 3 个数据字段：

| 字段 | 本轮值 |
| --- | --- |
| `EVIDENCE_ROOT` | `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocRevisePrivateBuild-20261029-021504` |
| `lawbench-agent-source.bytes` | `75039` |
| `lawbench-agent-source.sha256` | `62eb02d960db9e81bfebcac3f5292afab7fd4ce7b9ad66fcaf12874595e1733d` |

新目标根路径、新 bytes 字面量和新 agent SHA 各出现 1 次。把这三处精确逆替换为批准前值后，生成的反向整文件字节与批准前 config 做长度和逐字节比较，结果为 `REVERSE_WHOLE_BYTES_EQUAL=True`；没有把数组 `-ceq` 结果当作整文件相等。

agent 块保留 `root=D:\Lawbeach\lawbench-A\dsh-ext\agent`、`selector='all'`、`files=4`。旧树 4 文件、74824 字节、`4afb993817f195acce41a6b3c9b03ffe08243ce0553105a3135ca8f8a85f2eb7` 只作冻结对照；新树字面值为 4 文件、75039 字节、`62eb02d960db9e81bfebcac3f5292afab7fd4ce7b9ad66fcaf12874595e1733d`。

其余 17 棵树的 root、selector、文件数、字节数、SHA-256，以及 53 个文件 / 引用针的路径与哈希、Node/tsx/tsdown/esbuild/lightningcss/rolldown 固定项、`EXPECTED_A_HEAD`、默认值、25 项输出映射、输出命名和拒绝策略，均按批准 config 原字节保留。旧 18 棵 legacy 树、旧构建、旧运行证据和旧私有输出未改。没有动态哈希接受、配置导入或 builder 改动。

## 4. 既有资格与失败证据

root 已交付的聚焦单测记录给出 32 PASS、types 0；本轮未重跑。记录路径：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T18-doc-revise-question-gate-unit-root-current.json`

对应源码资格仍按批准 JSON：产品消费者为 `dsh-ext\agent\index.ts`，SHA-256 `d21dd7be6bc1fcb561063f259c2ad2e8d8714679f57982608823f5a896b1a5b0`；聚焦测试为 `dsh-ext\tests\doc-revise-question-gate.spec.ts`，SHA-256 `5ad9d9a049be0a323089b5d4c1c4a4967a6b9119ac1c47811b8437a15d19dd40`。范围是既有 contract-review 问题门的精确扩展，只覆盖实际 `doc-revise` 声明 ID；不包含业务质量结论。

`run-Jwpm24` 的 `ask=0`、`saved=1` 与“七项变四项”仍按失败证据保留。新源码目前没有编译或部署；旧私有 `agent.js` 552245 字节、`487335ef8c97c7171abf42b082835667af62c285bee9ba8320f5f08bbb6f1a17` 是冻结旧 runtime，不是新功能，不得复用作本轮产物。

## 5. 写入面

仓库内写入面只有：

1. 新建 `docs\plan\evidence\T18\DocRevisePrivateBuild-20261029-021504\`。
2. 从批准输入逐字节复制 builder。
3. 从批准 input 逐字节复制 config，随后只改上述 3 个数据字段。
4. 新增 `README.md`。

协调目录写入面只有本正式交回件。没有产品、测试、fixture、consumer、Skill、旧 runtime、默认库、manifest、安装包、Git 元数据、锁、审批或 ACL 写入。

## 6. 完整操作账与非零记录

以下是本轮实际工具操作的完整顺序摘要；“写”只指已列明的目标证据/交回件，除此之外均为只读。

| 序 | 操作 | 结果 |
| ---: | --- | --- |
| 1 | 完整读取唯一执行令 | 成功，确认只读 Git 与验证禁区 |
| 2 | 读取 `build-approved-inputs.json` | 成功，取得 18 树、53 针与 after agent 字面值 |
| 3 | `git status --short --branch` | **非零**：子模块 `dsh` 的只读 `.git/worktrees/.../modules/dsh` 拒绝 chdir；未修权限 |
| 4 | 枚举既有 T18 evidence | 成功，仅用于定位既有文件，未重跑证据 |
| 5 | 枚举协调输入目录 | 成功，确认 4 个只读输入文件 |
| 6 | 读取 `PROJECT-PROFILE.md` | 成功，核对协调目录和写入边界 |
| 7 | 新建目标目录并原字节复制 builder/config | 成功，先复制、后改 config |
| 8 | 首次给 config 改 `EVIDENCE_ROOT` | 成功 |
| 9 | 首次只针对路径做反向整文件比较 | 成功但范围不足，不能证明 agent after 已写入 |
| 10 | 只读哈希汇总脚本 | **非零**：PowerShell “empty pipe element” 语法错误；未写文件、未碰源码 |
| 11 | 修正后的哈希汇总 | 成功 |
| 12 | 打印 input/target 完整字节数与 SHA-256 | 成功 |
| 13 | 读取旧私有 `agent.js` 哈希作冻结对照 | 成功；后来采用既有批准记录的 487335，而非把它冒充新产物 |
| 14 | 搜索既有 `487335` 固定引用 | 成功，确认旧 runtime 身份 |
| 15 | 写初始 `README.md` | 成功，随后校正 |
| 16 | 列出目标三文件并计算哈希 | 成功 |
| 17 | 只读 `git rev-parse HEAD` | 成功，`a23271abee333a9a256fd46a3141da16975c2380` |
| 18 | 定位 config 的根路径、agent `files/bytes/SHA` | 成功并暴露初始 config 仍为旧 agent bytes/SHA |
| 19 | 检查正式交回件不存在并读取系统时间 | 成功 |
| 20 | 读取 agent 块原文 | 成功 |
| 21 | 只把 agent bytes/SHA 改为批准 after 值 | 成功 |
| 22 | 对路径、bytes、SHA 三处同时反向并做整文件逐字节比较 | 成功，`REVERSE_WHOLE_BYTES_EQUAL=True` |
| 23 | 校正 README 中的 config 哈希、差异范围和写入面描述 | 成功 |
| 24 | 重读 README、agent 块并重算三文件哈希 | 成功 |
| 25 | 写本正式交回件 | 成功 |
| 26 | 首次综合静态验收 | 工具退出 0；目录实际只有 3 个文件，builder、config 反向与三文件哈希均通过，但校验器把预期文件名的排序写死，误报 `EXACT_FILE_SET=False` |
| 27 | 在本交回件记录假阴性，并以与顺序无关的集合核对重跑最终静态验收 | 预期为 `FINAL_STATIC_CHECK_PASS=True`；若无额外写入或输出变化即停止 |

非零总数为 2：第 3 项 Git 只读权限拒绝，第 10 项 PowerShell 语法错误。两项均未产生数据写入。第 26 项工具本身退出 0，但断言因文件排序假阴性而返回 `False`；实际目录名与三文件哈希已由同一输出列明，第 27 项改用顺序无关核对。第 9 项虽返回成功，但只逆了路径，未达到完整配置核验条件；第 18 项发现缺口，第 21–22 项补足后重新整文件验证。没有隐瞒这些中间错误。

## 7. 后续不是本交回可宣称的结果

root 必须先完整审阅本目录和本交回，再决定是否用同一冻结 builder 执行一次新私有构建。后续仍需 root 独立核验 18 棵树、53 个文件 / 引用针与 legacy 18；再由 root 用新编译产物建立数据针、两个 import 和 manifest 的单一 fresh consumer，并验证同原始剩余 `doc-revise` 场景。该后续应保留既有 38 项提示/答案、MAX32768、budget 32/48/45、resource 115 events、严格 one-edit 和 JSONL 约束。

Gate 1、完整 T18、项目验收与 Packaging 均未完成。
