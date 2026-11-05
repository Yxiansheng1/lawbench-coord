# HANDBACK-B-T18CitedUnreadNativeCase-20261101-151539

状态：AUTHORED_NOT_RUN

执行者：B 线 DeepSeek

## 交付物

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadNativeCase-20261101-151539\native-defense-opinion.mts` | 156912 | `61044412a52df8bbba2587a257f807a5399bcee37fb52da36cbfd03d3b5877c6` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadNativeCase-20261101-151539\b-service-defense-opinion.py` | 53710 | `1ee11e50860e4cff5e711bf44a8d322d3c0b90ef9e73a2a1ab81e2b5b7c3ebe0` |
| `D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\T18CitedUnreadNativeCase-20261101-151539\literalfixed-inputs.json` | 12039 | `3cb8283490e8004d0d6670bbd7bcfed14b0c9871e685d1566074e11208241671` |

`literalfixed-inputs.json` 从 `D:\Lawbeach\lawbench-coord\T18CitedUnreadNativeCase-20261101-151539Input\literalfixed-inputs-ready.json` 字节原样复制，`manifest_byte_exact=true`。

## 字面替换计数与反向核验

| 文件 | 映射 | 批准次数 | 新值计数 | 旧值残留 |
|---|---|---:|---:|---:|
| `native-defense-opinion.mts` | 输入目录路径 | 2 | 2 | 0 |
| `native-defense-opinion.mts` | source-pin SHA-256 | 1 | 1 | 0 |
| `native-defense-opinion.mts` | `missingQuestionAskDenial` 拒绝码 | 1 | 1 | 0 |
| `b-service-defense-opinion.py` | 输入目录路径 | 2 | 2 | 0 |
| `b-service-defense-opinion.py` | source-pin SHA-256 | 1 | 1 | 0 |

MTS 的观察者参数仅同步为：

```text
missingQuestionAskDenial: production.invalidQuestionAskDenial,
```

原观察器精确匹配断言与函数体未改动。未加入 `ignoreerrors`，未放宽断言，未修改产品代码、guard、原任务、提示词、答案或业务功能。

## 状态与边界

- 依据绑定记录，当前 B346 唯一变化的源码行为 `service/lawbench/tools/drafts.py` 的后端草稿 provenance 修复；其绑定后大小为 22908 字节，SHA-256 为 `03d8a77d41a75338ae3baa239e9572b97d71d74ad4bff4bbe01fe9709e20957d`。
- 复用既有通过的 MTS/PY 原始证据，仅应用上述批准字面映射；SKILL 与四个已编译运行文件按绑定保持不变。
- 模型为 `qwen38-27b`，温度 `0.6`，单次任务参数上限 `49152`，工具/模型调用上限 `32+48`，技术超时 `900s`。
- 本执行没有运行 MTS、自测、解析器、Node、Python、测试、构建、prepare、serve、探测、HTTP、模型、GUI 或 Git 操作。
- `runtime_count=0`。没有新增凭据、日志、案卷或本地辅助脚本。
- 未对仓库执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`；本交回文件即交付通知。

停止于正式交回。
