# HANDBACK-A-Batch2-EasyTier-minimal-20261102-213330

## 状态

有界源码修改完成，待主编排复核与测试。

## 实际改动文件

| 文件 | 修改后 SHA-256 |
| --- | --- |
| `D:\Lawbeach\lawbench-A\dsh-ext\ui\remote-access.tsx` | `8D43317202DCF80AE7585FEA5DB380726A8139C9CC8C22844593ED4BF1EEB9BD` |
| `D:\Lawbeach\lawbench-A\contracts\api\remote_access.schema.json` | `63720524979F9FF3A11C9B070EF03AFDDAD472A2CF40FBC4AD3603226C239080` |
| `D:\Lawbeach\lawbench-A\dsh-ext\tests\owner-runtime-detection-batch2.spec.ts`（新增） | `858535367E9BE5015787AF0BD9565E9C31289C4C650715E515E0F3C36EFFF2CD` |

## 完成内容

- `RemoteAccessStatus.reason` 与 schema 两处 `reason` 枚举均增加 `RUNTIME_MISSING`；未增加 schema 字段或状态。
- 状态文案和原因文案均优先把 `RUNTIME_MISSING` 显示为 `未检测到 EasyTier`；原有 `NO_CODE` 及有码、无码的 off 文案保持不变。
- 原连接入口复用现有 `run('connect', ...)` 包装，仅调用 `getRemoteAccess({})`；不改接入码，不发 POST，不新增连接 API。按钮文案改为 `检测运行时` / `正在检测…`，仅由 busy 禁用。
- 密码框 Enter 改为调用 `saveCode`；保存接入码仍是单次 `postRemoteAccess({ code })`，提交后立即清空输入框。
- 原“自动接入”文案改为持久偏好，并永久显示：`连接请使用现有 EasyTier GUI；工作台只检测运行时，不自动启动服务、虚拟网卡或修改系统路由。`
- 关闭按钮文案改为 `关闭持久偏好` / `正在关闭…`，仍调用 `postRemoteAccess({ enabled: false })`。
- 新增小型纯辅助函数测试，覆盖运行时缺失、原有 noCode/hasCode 文案，以及 `RUNTIME_MISSING` 与 `NO_CODE` 可区分。

## 验证与边界

- 仅完成静态源码核对和三个交付文件的内容哈希。
- 按执行令，本次未运行测试、构建、解析器、类型检查或任何运行时检查；未修改或运行所有者旧测试。
- 未执行任何 Git 写入，也未执行 `status`、`diff` 或其他 Git 操作；未触碰 index、锁、暂存区或提交历史。
- 仅写入上述三个源码/测试文件及本交回件；T18、Search、外设置、logo、所有者既有测试均未触碰。

## 遗留

- 由主编排运行现有旧 6 条测试、所有者 P05 组件测试和类型检查。
- 由主编排完成与 B 线 `DetectionOnlyRemoteAccess` 及 schema 的规范化字节比较。
