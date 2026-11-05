# HANDBACK — T18 DefenseReadOrder 私有构建准备

状态：`AUTHORED_NOT_RUN`

任务入口：
`D:\Lawbeach\lawbench-coord\ORCH-A-T18DefenseReadOrderBuildPrep-20261031-231143.md`

产物目录：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\DefenseReadOrderPrivateBuild-20261031-231143`

## 新文件

| 文件 | 字节数 | SHA-256 |
|---|---:|---|
| `build-private.mjs` | 32121 | `347AE08143138724DB02017FD4243D56F950D2F1A2E7FDF9EF53EC557AB47B55` |
| `build-config.mjs` | 20801 | `723170F5EB5EF2DCC13F8C86D7099F2DDB4968F62D87C69E7B845C2DDDCAD42E` |

## 制作边界

- `build-private.mjs` 从 `CheckScopePrivateBuild-20261031-192459` 原件逐字节复制，未编辑。
- `build-config.mjs` 从同一原件复制后，仅完成执行令指定的四处字面修改：
  - `EVIDENCE_ROOT` 改为新目录；
  - `lawbench-agent-source` 树字节数由 `89916` 改为 `89963`；
  - 对应树 SHA 从 `b6523f17b93372d8e880e3fea16fcfea45a8f678f98e6ed597122ccb73da9ce9` 改为 `433b220f8a72503872b79d7de6bea0fdaa53d21d98b6569b667bd8fa0495b5a6`；
  - `dsh-ext\agent\index.ts` 文件 PIN 从 `d8328b142489dc69d12f56156884d04f975b45b90eca7ce54a25c4c1c202fa0c` 改为 `a9a26fd6fffc3fc458e6f04e18848ad035db80e67723886e73d3f1425a815451`。
- 未执行、导入、解析、探测、自测、测试或构建两份脚本。
- 未修改产品源码、测试、旧作业、原始证据或 served root。
- 未联系其他聊天，未更换 API，未安装依赖。
- Git 全程只读；未执行 add、commit、rebase、stash、reset、clean、checkout、push。

## 验证限制与遗留

- 按执行令特别验证禁区，本次没有运行任何构建或静态检查；因此不能把本交回件解释为构建通过或 T18 已验收。
- 除取得上述两个新文件的字节数与 SHA-256 外，未做额外清单、Git、Node、Python、parser、AST、tests、tsc、build、app、HTTP、model、GUI、env 或 credentials 检查。
- 无执行阻碍。后续构建是否可运行，应由收到本交回件后的正式阶段决定，不在本次授权内。
