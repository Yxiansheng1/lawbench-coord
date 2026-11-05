# A 线交回：T31 compiled Session through real Gateway to compiled Host

状态：`AUTHORED_BOUNDED_PAIR / RUNTIME_NOT_RUN / PACKAGING_HOLD`

已按正式执行令完成有界作者交付。新增测试直接装载固定 215235 发射包中的
`client.js`、`index.js`、`typert.host.js`、`typert.remote-client.js`：浏览器侧
走实际模块句柄/factory 与 `apply(ctx)`，Host 侧走编译 `SessionController` 和真实
Gateway 描述符；unary/stream 均通过实际 `TypertGatewayService.invoke/stream`。
两测分别为受限队列 claim 后拒绝不同 scoped R 的 steer 提升，以及普通 queued→steer
对照组。没有源码 Session fallback、RemoteMock 直路由或伪造目标响应。

登记事实：执行令称谓 `claimNextTurn(1)` 在固定源码及发射包中不存在；实际公共 API
为 `ReactLoopInbox.claim('next-turn', 1)`，事件仍为 `agent/inbox/claimed` 且携带
同一 R。夹具使用实际 API，并在证据 README 明示，未加兼容层或改写产物。

作者未运行 Node、Vitest、tsc、导入探针、解析器、测试收集、socket、HTTP、GUI、
模型、安装或构建，故运行态只能记为 `RUNTIME_NOT_RUN`，不得据此声称产品绿或
GUI/完整 T31/ Packaging 通过。root 需独立复核源码、setup、finally、选择器和
运行边界后首次运行恰好两个测试。

正式证据入口：

`D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/CompiledSessionGateway-20261027-103448/README.md`

新增文件：

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `dsh/packages/api/session-controller/tests/t31-compiled-session-gateway.client.spec.ts` | 28,055 | `59E66FDA4B7080E8779053AC341595E1BD0D61E8B227AFE16C832AD365254121` |
| `dsh-ext/vitest.t31-compiled-session-gateway.config.mjs` | 818 | `031664C86951748E5CBDEAA40CF29897F7A15FEFC2C87021CACC2105939DB697` |
| `docs/plan/evidence/T31/CompiledSessionGateway-20261027-103448/README.md` | 9,133 | `1B64C568A659AD35DF271C11776A45401DBF121CF6BF15EB1AB7A3E2088848DD` |
| 本交回件 | 以文件系统实况为准 | 由收件方只读取用，不构成 Git 提交 |

Git 边界：开工普通只读 status 因子模块元数据权限拒绝退出 1；之后仅使用
`--ignore-submodules=all` 只读核对。未执行任何 add/commit/rebase/stash/reset/
clean/checkout/push，未改锁、ACL、权限、审批或沙箱。交回不是 Git 提交。
