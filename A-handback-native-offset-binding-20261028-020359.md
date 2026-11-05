# A线原生偏移绑定修正已交回

状态：`STATIC_BINDING_FIX_READY_NOT_COMPILED`。

唯一修改源码：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts`

- 修改前：54,690 字节，SHA-256 `3c82c230a9b4f803163e48c9c7eff91f0522cdf89e13de8912324777053d9b68`
- 修改后：54,823 字节，SHA-256 `2f25e05e75d0512f2445b27d412a6d8c13a900688cf3f4d9d9ec49bddf7c6084`

## 修正

`promptTurn()` 的回合事件切片改用生产 setup 已返回的
`production.SessionLogOffset(...)`。`requestHeaderAtBoundary()` 新增一个
窄类型参数，显式接收同一个 factory，并用它读取 `0` 与 `afterSeq` 前缀边界。

没有改全局映射、模块导出、插件装配、导入、配置或测试；没有手工伪造偏移值。请求头锚点与来源范围、provider/model/256、四个提示、R、UUID、完成态、工具禁用、网络 200 门、合成事实、fork 前缀、源不变和 JSONL 深比较均保留。

## 验证

- 修改前后只读 `git diff --no-index` 只出现绑定参数、前缀读取和 `promptTurn` 接线。
- dirty 基线 195 行，终态 195 行，集合差异 0。
- 旧 `.ts` 仍为 51,654 字节、SHA-256 `7909ea8f1e843538d20bce964d1036c17c930042b153cfaab3d0919072e5bc93`。
- 固定清单仍为 14,284 字节、SHA-256 `ce6556a142705d454122d4a689dc1c7efa488b268f5d39058315d814e197a522`。
- 旧 README 仍为 6,259 字节、SHA-256 `5e9537aef53e9471e8ff277ab261f2bb0fa9db3eea77fba04a1444746f7f514d`。
- 本执行者运行时执行 0；未运行 Node、tsx、Python、TypeScript 编译器、解析器、导入、测试、HTTP、模型、Key、SSH、GUI 或构建。
- 未重演安装、调研、setup、全量测试或四问。

上一轮正式报告的原始命令账更正为 43 个实际 `exec_command`，其中 39 个零退出、4 个非零；旧“38/34”摘要不准确。历史 no-Key setup 仍只作 setup 证据，不代表本轮完整消费器运行。

## 非阻断限制

- 普通 Git 状态因既有 `dsh` 子模块目录权限被拒；未修权限、ACL、审批、沙箱或锁。
- 命令 20 的工具 shell 路径误写为 `native-powershell\pwsh.exe`，未使用执行令指定的 `native\pwsh.exe`；该命令只读源码片段，退出 0，未用 Bash，也未改文件。
- 本轮没有编译、符号解析或运行时 PASS 证据。root 的独立检查通过前，不能宣称缺陷已被运行时消除。

## 交回

正式报告：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-offset-binding-20261028-020359.md`

root 下一步：核对新字节、哈希和精确差异，再执行 root 权限内的 TypeScript 符号解析或有限编译检查。AUTHOR 到此停止。

没有 Git add、commit、rebase、stash、reset、clean、checkout 或 push。
