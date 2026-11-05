# To ORCH：T34 Core Build Once 交回

状态：`PASS_BUILD_ONCE_6LIB`

## 结果

- 按正式执行令先核对运行状态；六个既有产物构建前 SHA-256 与此前保全基线逐项一致，`dsh-ext/lib` 的 scoped Git 状态无输出。
- 在 `D:\Lawbeach\lawbench-A\dsh-ext` 唯一一次执行 `& 'E:/node/node.exe' 'scripts/build.mjs'`，真实退出码为 `0`。
- 构建号：`202610251446`。
- 构建内置纯 ESM 导入检查及 `host.js` 方法形参/方法表一致性检查通过；没有把这些内置检查外推为完整测试结论。
- 构建日志：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreBuild-20261025-144521\build.log`
- 一页说明：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreBuild-20261025-144521\README.md`

## 六产物 SHA-256

| 文件 | 长度（字节） | SHA-256 |
|---|---:|---|
| `agent.js` | 528681 | `b37c804d14a9d8623b25fa4c2c25363a46e9975921b21c6a80c690484865e06b` |
| `client.js` | 508590 | `a44b04053acb7178ecc8391931d45fb9473a464ab9f5d4c45117ab1d9f9e5f46` |
| `credentials.js` | 15774 | `556f5dc427c01c2762308eeba0fa42cf8e5c722b16d9c60372a410f05778aec1` |
| `host.js` | 893180 | `a9be8f6c41daa47ff9e9cbc962b0eb74e0f9b17acc2ffd2033d4922939d3d994` |
| `index.js` | 208 | `df08553ed2310871adc5f2ab85ff351027917a6480a2797167fe636e2dad9956` |
| `session-store.js` | 44858 | `91a7ffc0414440cefd956740bec641d3730ff02293752e4ab994b6a910652762` |

本次构建使 `agent.js`、`client.js`、`host.js` 的哈希变化；其余三个文件哈希不变。

## 边界与交回

本次没有修改源码、schema、tests、其它脚本、配置、API/Key 或权限；没有启动 GUI/服务、复制 runtime、运行额外测试/网络/拦截器，也没有执行任何 Git 写操作或改动既有 dirty 内容。Packaging 保持 HOLD。按令以本文件作为正式交回，不是一个 Git 提交。
