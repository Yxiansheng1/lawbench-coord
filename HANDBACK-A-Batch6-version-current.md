# A 线 Batch6 版本元数据交回

结论：按执行令完成两处版本字面量修改，均为 `0.1.0` → `0.9.0`。每处修改前均校验目标字面量恰好命中一次；采用等长原始字节替换，未改动其他字节或换行。

## 修改文件

| 文件 | SHA-256 | 字节数 |
|---|---|---:|
| `D:/Lawbeach/lawbench-A/dsh-ext/shared/product.ts` | `59d45b6e9a2d95e6e07d4052898ad88cd7a42e417f0ed8549d575f83d595c9f5` | 1479 |
| `D:/Lawbeach/lawbench-A/dsh/apps/desktop/scripts/lawbench-product.mjs` | `5089e070233a91c8dab82b6b8ce45d77f50c8c20de4c68bc7522374206806115` | 3463 |

## 验证边界

- 验证仅限执行令允许的两文件读取、字面量唯一性检查、等长字节替换及修改后文件哈希/字节数计算。
- 未运行测试、parser、tsc、build、GUI、runtime、model 或其他检查。
- 未执行任何 Git 操作，也无提交或暂存。
