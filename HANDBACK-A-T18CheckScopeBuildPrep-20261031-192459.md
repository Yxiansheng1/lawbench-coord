# HANDBACK A — T18 Check Scope Build Prep

状态：`SOURCE_PREPARED_NOT_RUN`

## 交回件路径

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\CheckScopePrivateBuild-20261031-192459\`

## 完成内容

- 从已接受的 `CoveragePrivateBuild-20261031-1845` 目录复制构建输入。
- `build-private.mjs` 按字节复制，未修改。
- `build-config.mjs` 仅有两处受令变更：
  - `EVIDENCE_ROOT` 指向本次 `CheckScopePrivateBuild-20261031-192459` 目录。
  - `lawbench-ui-source` 固定值更新为 `files: 92`、`bytes: 641236`、`sha256: e8f1c5200721ae97c9d82f56e6c56c5f07727da62b4db18107375df564d6b6cc`。
- 其余 17 个树固定项、41 个文件固定项、14 个引用固定项、25 个预期输出、18 个 legacy 项，以及 SDK、resolver、guard、`agent/index.ts` 的 d832 pin 和 `task-state.ts` 的 8c68 pin，均按复制配置原样保留。
- 新增 `README.md`，明确标注实际构建尚未执行。

## 三文件原生大小/哈希

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `build-private.mjs` | 32121 | `347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55` |
| `build-config.mjs` | 20795 | `64eee59a664cdea04c197cc647ca35f644bc57e97c0071bdcdd0499e1f522b07` |
| `README.md` | 448 | `d5751d50d328950fbba70c1eba45c824206f7c30bd8d4126077c1f05cce9bba9` |

## 未执行与声明边界

- 未运行构建、prepare、应用、GUI、HTTP 或模型。
- 未读取案卷、模型或 oracle，未编辑产品或测试源码。
- 未安装或写入 package/library。
- 未执行任何 Git 操作，未暂存或提交。
- 本交回不构成 T18 事实或法律结论 PASS，也不构成 UI 标签通过声明。

## Root 后续

Root 仍需先做完整 inverse/pin/setup cleanup 审阅，再执行这次新源码的有界编译。当前 `PackagingHOLD` / Gate1 仍未完成。

阻碍：无。
