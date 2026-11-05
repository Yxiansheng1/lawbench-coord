# A 线交回：T31 compiled Gateway generation 承载修正

工单号：`T31`

状态：`RUNTIME_NOT_RUN`。测试夹具已按令完成有界修改；作者侧未运行
Node/Vitest/tsc 等动态验证，等待主编排全文复核后实际运行同一份冻结双用例。

改动：测试夹具不再伪造唯一 generation source；Host 改挂载既有实际
`@deepseek-ai/dsh-api-remotes` 支持插件；流载体改走实际公开
`typertGateway.wireStream.open`，`$events` 使用真实空上行，普通流透传客户端
上行队列。

冻结：两个 `describe/it` 块至 EOF 为 5,648 字节，SHA-256
`e88d227c20b5c122b0cd899ab5c1332d89b3335b13b1c16670f89e38d2bd0499`，
修改前后逐字节一致。产品源码三份支持源和选择器 `C4DF` 均未变。

分支：`line-A`；只读 HEAD 为
`a23271abee333a9a256fd46a3141da16975c2380`。按本次执行令未暂存、未提交，
改动保留在工作树。

交付说明：
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\CompiledGatewayGeneration-20261027-111534\README.md`

边界：仅 HEADLESS compiledNativeSession / actual Gateway / compiled Host
夹具；上一轮为启动夹具灰，不是产品红灯。未重跑 GUI/HTTP/model/B/whole T31；
Gate 1 与 Packaging 继续 `HOLD`。
