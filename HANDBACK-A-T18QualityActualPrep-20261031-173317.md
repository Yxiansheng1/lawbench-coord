# A 线交回：T18 QualityPrivateBuild 准备

状态：`STOPPED_BEFORE_MUTATION_UNEXPECTED_UI_TREE_DRIFT`

执行令：`ORCH-A-T18QualityActualPrep-20261031-173317.md`

## 结论

按执行令先核对冻结输入。目标 agent 树的计划内变化成立，但 `lawbench-ui-source`
发生了计划外漂移。执行令要求除 agent 外任何意外变化都立即报告并停止，因此本次没有创建：

`docs/plan/evidence/T18/QualityPrivateBuild-20261031-173317`

没有生成 builder、config 或 README，没有运行 build/test/import/Node/Python，也没有启动应用、GUI、HTTP、模型或凭据操作。Git 只执行了 scoped status/diff 读取，未执行任何写操作；既有 dirty 状态原样保留。

## 冻结输入核验

- 旧 builder：
  `docs/plan/evidence/T34/CurrentUIPrivateBuild-20261031-101722/build-private.mjs`
- 大小：32,121 字节
- SHA-256：`347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`
- 与执行令给定原 SHA 完全一致。
- 旧 config SHA-256：`15cb9506b93856c6a7c83bb9b1330591018977b8b74c7d22501617de7d6a1851`
- 旧 README SHA-256：`53d2dc126ae563364d85ae5901465a1f9d42d42402dfd5f6569b165794c4b5d3`

## Agent 精确元数据

`lawbench-agent-source` 根：`D:\Lawbeach\lawbench-A\dsh-ext\agent`

冻结树算法：`ordinal-path-tab-size-tab-sha256-lf-v1`

- 文件数：4
- 字节数：82,739
- 树 SHA-256：`239aeb10619cb4d4e1abbb1f6ac77b98648f9f932387397515dac6c9cbf1f2e8`

本次唯一允许变化的两个源码文件：

- `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts`
  - 51,847 字节
  - SHA-256：`32598121a9815eadd003db2dbfd9cd7f2f4c5e8a254b4ee5617c0de78479644c`
- `D:\Lawbeach\lawbench-A\dsh-ext\agent\task-state.ts`
  - 23,360 字节
  - SHA-256：`dbfaab69d86b21f156d59333ee16e44cf6ee71fcb9ed168f063749c9f60fe72a`

两个文件在 scoped Git status 中均显示为既有 `M`。本 runner 没有修改它们。

## 计划外漂移

`lawbench-ui-source` 根：`D:\Lawbeach\lawbench-A\dsh-ext\ui`

- 配置预期：92 个文件，639,769 字节，SHA-256
  `5519187c9d7d5eb367f3eb89fbf330f6955421b304cf62edc96fc24b6a6269b0`
- 当前实际：92 个文件，641,077 字节，SHA-256
  `c734ad079b8ecadbacacf51509f07f20a552acbc88bea5ec377f2396e82bda19`

Scoped Git status 显示的既有修改文件共 20 个：

- `cases.ts`
- `dialogs.tsx`
- `dock.tsx`
- `documents.tsx`
- `estimate.ts`
- `fixtures/capsules.json`
- `fixtures/capsules.req.json`
- `fixtures/materials_list.json`
- `folder-actions.ts`
- `format.ts`
- `index.tsx`
- `intake.ts`
- `materials.tsx`
- `remote.ts`
- `session-case.tsx`
- `settings-draft.ts`
- `settings.tsx`
- `state.ts`
- `tasksheet.ts`
- `wiki-card.tsx`

该漂移不是本次执行产生的，但会使旧 UI 钉在 Root 构建时失败。基于执行令，本线没有更新 UI 钉，也没有用当前实际值覆盖原值。

## 其余树核对

除 agent 与上述 UI 树外，其余 16 棵树均逐项匹配旧 config 的文件数、字节数与树 SHA-256：

- `lawbench-credentials-source`
- `lawbench-host-source`
- `lawbench-session-store-source`
- `lawbench-shared-source`
- `embedded-contract-schemas`
- `ui-conversation-source`
- `session-controller-source`
- `typert-generator-runtime`
- `tsdown-installed-package`
- `tsx-installed-package`
- `esbuild-installed-package`
- `esbuild-win32-x64`
- `lightningcss-installed-package`
- `lightningcss-win32-x64`
- `rolldown-installed-package`
- `rolldown-win32-x64`

## 需 Root 决定

请确认 20 个 UI 修改是否属于新的已审阅基线：

1. 若是，请发出把 `lawbench-ui-source` 更新为上述当前实际元数据的新执行令，并明确该 UI 漂移已审阅。
2. 若否，请确定应采用的 UI 源码基线；本线不自行覆盖或还原任何文件。

本交回不宣称 runtime PASS，不宣称 current build 可用，也没有运行或验证任何构建产物。
