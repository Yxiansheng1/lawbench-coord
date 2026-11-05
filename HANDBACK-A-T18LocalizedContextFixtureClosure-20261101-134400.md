# A 线交回：T18 本地化上下文测试夹具闭合

## 状态

- 任务：仅闭合新增测试夹具中的错误计数断言。
- 状态：已完成有界修改并编写本交回件；测试未运行。
- 运行时验证次数：0。
- Git：未执行任何写操作，未暂存、未提交。

## 唯一修改

文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-read-bound-20261101-114236.spec.ts`

仅将末尾新增 `describe('T18 localized complete question-context')` 用例中的最终断言由：

```ts
expect(state!.toolCalls).toBe(2)
```

改为：

```ts
expect(state!.toolCalls).toBe(usePreTool ? 2 : 1)
```

原因：`executeTool` 直接路径不经过 `preTool` 的预算计数；经 `preTool` 的路径计数为 2，直接调用路径计数为 1。

未修改产品代码、其他测试、原 12,552 字节前缀或新增测试的其余内容。

## 目标文件核验

- 字节数：14,261
- SHA-256：`9663D9B9FB4C4E080698B71CCBE3D5992188333D0CD3E89C68E1AFB853A69C05`

## 验证边界

按正式执行令特别验证禁区，未运行 Node、Python、解析器、测试、check、build、HTTP、模型、GUI 或凭证相关操作；未进行额外发现或重复元数据检查。旧任务中已通过且源码不变的原始证据继续沿用，本交回不宣称新增运行时通过结果。

## 遗留

无本任务范围内遗留；修改后的夹具尚待主编排按既有流程安排后续验证。
