# A 线交回：T18 条款级 Skill 针脚与顺序修订

状态：`AUTHORED_NOT_RUN / RUNTIME_NOT_RUN / PACKAGING_HOLD`

## 结论

已按唯一执行令 `A-T18-doc-revise-clause-pins-order-20261029-024101.md` 完成有界修改。新可复审数据位于：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DocReviseClauseRuntime-20261029-024101`

目录只有 `continue-genuine-doc-revise.mts`、`b-service-doc-revise.py`、`literalfixed-inputs.json` 和 `README.md`。没有运行结果或业务 PASS。

## 文件身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `continue-genuine-doc-revise.mts` | 123980 | `a6164ab06a15ec0254ccc31dde9ea6ad286186d323899fdfa8b147a25c7e46dc` |
| `b-service-doc-revise.py` | 38290 | `20fe78e454fd5fe23fd5cb63350dd8d2df659bdce9637782c902982861e85987` |
| `literalfixed-inputs.json` | 23159 | `deb37d4681f706a681efe24657f6cd557c806654c5194aa6f75a0707f07b1a2a` |

消费者和伴随服务均是原输入的逐字节副本。`literalfixed-inputs.json` 原身份为 23161 / `1d8a43a8c76b7fe79eee5e489bd0c79ca85ac3719b5a723d7fbbc1702aeba74f`。

## 精确逆转

本轮只在既有 manifest 中改变四条值：

- `consumer.path` 指向本目录 `continue-genuine-doc-revise.mts`；
- `bServiceEntry.path` 指向本目录 `b-service-doc-revise.py`；
- `doc-revise-skill.bytes` 由 11571 改为 12189；
- `doc-revise-skill.sha256` 由 `9107ea54962a12521f4d4a0b824c494100359fb3a0a9968a3db1cf86c65fe1f7` 改为 `23b048df3ceeb8948e9a14dbc3c1e8031e98158908fb9421f30de5f875d1fccf`。

Skill 路径仍是 `D:\Lawbeach\lawbench-B\skills\doc-revise\SKILL.md`。核准来源是输入目录 `root-approved-skill.json`（346 字节，SHA-256 `fe4e73be34c4e28b5c2be72bd9d119610b8f66e98ae87ec37ad7a22538b98c87`），没有复制进交付目录。

对新 manifest 内存逆替换四条值后，精确得到 23161 字节和 SHA-256 `1d8a43a8c76b7fe79eee5e489bd0c79ca85ac3719b5a723d7fbbc1702aeba74f`，整字节比较 `True`。这证明其余 literal pins、source 346、46/18 legacy、E50 old 459、空白、顺序和固定元数据均原样保持；没有动态接收逻辑、通用哈希框架或其他 pin 更新。

## 保留边界

`STAGE2_PROMPT`、答案、`provider=lawfirm`、`qwen38-27b`、`MAX32768`、32/48/45 预算、R、问题 ID、正文中原“第七条”的汉字“七”精确替换为 ASCII `4.1` 的约束、其他正文字节、实际材料读取、JSONL 深层重开和安全边界均未改动。

原始资源保持 Bf3ztJ 的 115 事件、23 个案件文件和两份实际输入，不采用旧失败 R8IeGo/Jwpm24 替换。没有新增金标准答案、历史、UUID、R、伪造元数据、源案件改动或预算提高。旧失败报告保持不可变原样。

消费者哈希与既有实际编译证据相同，沿用该 ESM 编译资格，不重跑构建。当前私有 agent `0e73a0e95b4d1248142f8a579a503f055eda11539f7ddf1614d8e1888e9d3329`、host `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`、manifest 58196 / `3d60e0330055795f456080f8fb4dd74ca1d8446a1cb5124301836cc1adbc272e` 均未重建。

原 root full data/source/formal 及 459/69/18 legacy/new-admission 记录不在本快照改写；仍待 root 在其完整账中按产品接受值与本次 before/after 独立收口。唯一剩余的 `doc-revise` 仍需匿名 DPAPI stdin 凭据，且该实际运行前不得宣称 Gate 1 或业务 PASS。

## 命令与非零检查

实际写操作只有新建目标目录、逐字节复制三件输入、修改新 manifest 四处值，以及新增本目录 `README.md` 和本交回件。哈希与逆变更均由原生 PowerShell 的 `Get-Item`、`Get-FileHash`、内存字符串替换、SHA-256 和逐字节比较完成。

已记录的非零检查：

- 创建前目标目录不存在，枚举退出 1；随后创建。
- 直接 `git status` 因 `modules/dsh` 工作树权限拒绝退出 1；未修锁、权限或 ACL。
- 一次 `rg` 定位关键词无匹配退出 1；未改文件。
- 一次误选 Bash 传输器被宿主以 `Bash/E_ACCESSDENIED` 拒绝，命令未执行、无文件变化；后续全部使用指定原生 PowerShell。

没有运行 Node、Python、tsx、AST、配置导入、测试、编译、构建、HTTP、模型、GUI、SSH、Key 或 DPAPI。没有读写真实凭据。

## Git 与后续

Git 全程只读。没有 add、commit、rebase、stash、reset、clean、checkout、push，也没有修改 index、锁、审批、ACL 或全局配置。dirty 保全文件为 `D:\Lawbeach\lawbench-coord\T18DocReviseClausePinsInput-20261029-024101\A-dirty-before.txt`，321082 字节，SHA-256 `fc3d16ae43205644bf0198f3342595c3a81b52d8182d1d2c679d16eb0427907e`。

请 root 独立复核新目录、四处完整逆转、当前编译四针和 ESM 可达路径，再决定是否执行唯一一次真实剩余 `doc-revise`。Gate 1、完整 T18、项目验收均 `INCOMPLETE`，Packaging `HOLD`；当前交回只到可复审数据与正式文件为止。
