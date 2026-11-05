# A 线 T18 Sentence 私有构建配置交回

工单：T18 Sentence 工作流私有构建配置  
执行令：`D:\Lawbeach\lawbench-coord\A-T18-sentence-private-config-20261029-220752.md`  
证据说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752\README.md`  
状态：源码配置交付完成；未执行构建、测试或产品运行

## 交付

- 新建唯一证据目录 `docs\plan\evidence\T18\SentenceWorkflowPrivateBuild-20261029-220752`。
- `build-private.mjs` 从批准输入整字节复制，32,121 B，SHA-256 `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`，与输入一致。
- `build-config.mjs` 从批准输入整字节复制后只改第 10、68、69 行：证据根改到本目录，`lawbench-agent-source` pin 改为 4 文件 / 79,219 B / `0ac5873ff7cbcc87ebbcd4d63e8a895b81a17dd0933993470b7340a865456eb1`。
- 最终 `build-config.mjs` 为 314 行、20,472 B，SHA-256 `1fc565b02d4b0a3c76cac73ff36fa92230da266a8ddc6ec1568aa3bcec3ad358`。前后逐行比较无其他差异。

## 核验与复用

- agent 树独立重算匹配批准值：4 文件、79,219 B、`0ac5873ff7cbcc87ebbcd4d63e8a895b81a17dd0933993470b7340a865456eb1`、无重解析链接。
- `index.ts`、`task-state.ts`、500 行新测试分别保持冻结 SHA-256 `140584362c259b6f2909f32f6c8489f47e447ceb2106db1475b76e3971c909ab`、`866a15366ba37b44f1c611c5b4ba48b51cf995f89b4931aaaf38e5bc1cb8cd99`、`90a9682fd9c7344c984027624884e0c26ddcd28b87b1df2e3f3fd41e1668635e`。
- 复用既有 Gate 原始读数：实际审查命令 37 / 成功 34 / 非零 3；47 UNIT PASS / 0 失败，1.639578 秒；types exit 0，3.524117 秒；8 个 complete OS 记录消失；forced=false；无 actual model/NATIVE PASS；Packaging=HOLD。原始实际运行 103.281 秒，11 次模型 POST 全为 200，工具计数 list=0、ask=0、calc=1、save=7。
- 批准件记录的 `all18inverseheld`、`all53refsheld`、`legacy18held` 均为 true。未重演全量反查；其余 17 棵树/39 文件 pin/14 引用/53 运行时对象/25 输出项及路径、flags、loader 原文保留。

## 边界、阻碍与遗留

- 未运行 Node、Python、AST、解析、导入检查、测试、类型检查、构建、HTTP、模型或 GUI；未联系 B 线或旧聊天。
- Git 严格只读且未提交，故无 commit SHA。初次 `git status` 因 `dsh` 子模块元数据权限拒绝而失败；随后以 `--no-optional-locks --ignore-submodules=all` 只读记录 dirty。未修锁、扩权、改 ACL、改审批或尝试 Git 写操作。
- 既有 dirty 全部保全；本卡只新增证据目录，未改产品码、B 线、旧测试、private25、Skills、contracts、legacy 18 或其他配置。
- 下一责任段属于主编排：有限配置反查、明确的一次 fresh private25 development compile（非安装器/打包），之后才进入 DS 消费者恢复、runtime pin、准入和唯一原始实际闭包。本交回不声称这些阶段已通过。
