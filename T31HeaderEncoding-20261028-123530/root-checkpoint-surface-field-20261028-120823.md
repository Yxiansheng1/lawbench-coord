# T31 checkpoint surfaceOp 字段层级根因备注

时间：2026-10-28 12:08:23（Asia/Taipei）

## 结论

`verifyCommittedCompaction` 原先从 `checkpoint.data.surfaceOp` 读取表面操作，但真实压缩事件的 `surfaceOp` 位于同一事件顶层。该观察点会在真实压缩成功后、fork 前错误拒绝有效事件。

本次只修正观察字段的位置：

- `checkpoint.data.source.compactionId` 与压缩结果的关联保持不变。
- 新增 `checkpointSurfaceOp`，只从同一 `checkpoint` 的顶层 `surfaceOp` 读取。
- `replace`、`startSeq`、`endSeq` 与 `result.shadowedRange` 的比较条件保持不变。
- 没有 data/顶层 fallback、猜测元数据或放宽断言。

## 精确变更

修改前关键片段：

```ts
const checkpointData = checkpoint?.data as {
  readonly source?: { readonly compactionId?: unknown }
  readonly surfaceOp?: {
    readonly op?: unknown
    readonly startSeq?: unknown
    readonly endSeq?: unknown
  }
}
// ...
|| checkpointData.surfaceOp?.op !== 'replace'
```

修改后关键片段：

```ts
const checkpointData = checkpoint?.data as {
  readonly source?: { readonly compactionId?: unknown }
}
const checkpointSurfaceOp = checkpoint?.surfaceOp as {
  readonly op?: unknown
  readonly startSeq?: unknown
  readonly endSeq?: unknown
} | undefined
// ...
|| checkpointSurfaceOp?.op !== 'replace'
```

## 静态核验

- 修改前文件：72,524 字节，SHA-256 `72130abd6e6e71d87fc56e17db262d75c693d36cbc5716336ff9cbfefa7c3aff`。
- 修改后文件：72,543 字节，SHA-256 `cd7e1a4e3ac19574fa99fb002501a8ab63a43f319f35812c8f5fa26b4f940b51`。
- `verifyCommittedCompaction` 函数外前缀 SHA-256 修改前后均为 `37d67fe73d05d3cce042200191e26d5a7e1952c3d20efcd05a31d0b58cc588b8`。
- 函数外后缀 SHA-256 修改前后均为 `f2cc12c69a14e6d812ddcc1177750a4dc1bd76fb31db92c5f92d18d9819c0d7f`。
- 修改后函数 SHA-256：`902102230865f69ee0ebf3a85583c5e21a627e8cedc8bf10f291a34cd3e470ab`。
- 静态标记检查：顶层读取存在，data/source 关联存在，三项 replace/range 比较存在，错误嵌套读取不存在，fallback 不存在。

未运行 Node、Python、TypeScript 编译、测试、模型、HTTP 或 GUI。实际运行次数为 0。

## 文件写入面

- 使用两次 `apply_patch` 修改本说明上一级目录中的 `native-genuine-compacted-fork.mts`；第一次仅修改该函数但局部结构写错，第二次在提交前立即纠正。最终字节和静态检查只针对纠正后的版本。
- 新增本备注文件。

