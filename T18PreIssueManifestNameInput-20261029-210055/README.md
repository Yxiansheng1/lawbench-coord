# T18 pre-issue ready 计数谓词修正

状态：`SOURCE_ONLY_NOT_RUN`。本目录只含三份批准源件副本；未启动
Node、Python、TypeScript、B service、产品、模型或 HTTP，未执行测试、构建、导入、
进程探测或 Git 写入。

实际根运行 `run-v1G6xP` 在 4.734 秒、0 次模型 POST、0 次模型 HTTP 200 时自然
失败：consumer 的 `startBService` 仍保留旧 defense 场景谓词
`materialCount === 2`、`fixtureCount === 3`。本原始 preissue 场景实际注册四份
TXT 材料，加一份 prior，B service 正确计算并返回 `4 materials / 1 prior / 5 total`。
因此这是准备阶段旧计数谓词造成的 readiness 记录无效，不是产品或模型缺陷。

修正只涉及 `native-pre-issue-check.mts` 中两个数值字面量：

```text
ready.materialCount !== 2  ->  ready.materialCount !== 4
ready.fixtureCount !== 3   ->  ready.fixtureCount !== 5
```

逐字节比较确认全文只有两个变化字节，位于偏移 `52840` 和 `52919`；文件长度
仍为 153232 字节，与根事先计算身份一致。

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-pre-issue-check.mts` | 153232 | `c39d244e81f988f2418cd3b3047998cbe2cf718bd17a14aac8480bff3f15bce4` |
| `b-service-pre-issue-check.py` | 53737 | `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924` |
| `root-approved-manifest-data.json` | 13575 | `2ca2cba062250e03817e50fefa5b060afdb54cac5c63f414bcfe0654b53f2923` |

B service 和 manifest 均为输入件的逐字节副本。未新增有限辅助器、测试或业务逻辑；
既有有限函数字节未由本作者重跑。后续完整反向核对、ESM/作用域绑定、准入检查及
一次全新原始实际运行由根执行。
