# B 交回：上海当前产品 Net.select 源级观察件

状态：`SOURCE_ONLY_AUTHORED_NOT_RUN`

唯一任务入口：

`D:\Lawbeach\lawbench-coord\ORCH-B-RealRoute-20261031-170722.md`

## 交付文件

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\ShanghaiNativeRoute-20261031-170722\observe.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\FullRegression\ShanghaiNativeRoute-20261031-170722\README.md`

本件只是供 root 全文审核后执行一次的有界观察器，不是产品修复、实际线路结论或发版证据。

## 接续与复用

当前 `service\lawbench\net.py` 与既有固定快照
`RealSyntheticOCRRefineInput-20261027-225347\02-net.py` 均为 25,896 字节，SHA-256 均为：

`E547412246D92BA4BA105FED98923F91E30E8F5F63A0965A9830AB03F4252585`

因此观察器按当前未改 `Net` 编写。执行令所指既有 health GET 证明两台 EasyTier 服务器可达；
作者没有重演健康检查、旧消费者、安装、调研、全量测试或其他旧运行。

## 观察器边界

`observe.py` 只使用标准库、`httpx` 和当前 B `service\lawbench.net.Net`。它要求全新绝对
`--output` 目录，产品日志只落该目录；不读取设置、环境变量、Key、Keyring、app、Session、
模型或真实案卷。

固定四个公开基础地址，并在收到任何网络请求前追加严格钩子：

- 只允许四条指定 `GET /v1/models`、`GET /health` 探测 URL；
- 拒绝额外 URL/方法、非空 body、`Authorization`、`Cookie`、`Proxy-Authorization`；
- 响应只记录 method/URL/status；
- 不输出请求/响应 body、headers、Cookie、Key 或原始异常文本。

当前 `Net` 以默认 clock、常量、transport、probe、cache、allowlist 构造。
`select("llm")`、`select("prep")` 各调用一次；除现版 `Net` 自身探测外不补请求或重试，
不 mock，不修改策略。`finally` 关闭并核验本进程 client。

JSON 写自身 `result.json` 和 stdout，记录实际 base/route 或有界
`errorclass`/`ApiError.code`、请求与响应元数据、耗时和 `ownclientclosed`。
仅当两种 kind 都由真实 `Net.select()` 选中所外 `alternate`、探测有 HTTP 2xx 元数据且
client 关闭时退出 0；其他情况保留实际 JSON 并退出 1。

## 作者验证与阻碍

作者只做 PowerShell 只读源码/目录/既有证据核对，并写入两个指定源文件。
`AUTHOR_RUNTIME=0`：未运行 `observe.py`、Python、import、parser、AST、pytest、collect、
build、serve、HTTP、models、SSH、自验证或产品测试。

准确记为操作偏差：两次并行只读探测把 shell 参数误传为 Bash，宿主均在命令启动前以
`Bash/E_ACCESS_DENIED` 拒绝；未启动 Bash，无文件、网络或 Git 副作用。之后全部使用指定
原生 `pwsh.exe`、`login=false`。另有一次只读目录名猜测不存在，无状态变化。

Git 全程只读，本次未执行任何 Git 命令；没有 add、commit、rebase、merge、reset、stash、
checkout、clean、push 或 staging 写入。未修改产品、SDK、guard、测试、设置、锁、ACL、
审批或其他旧证据；未尝试修复 `index.lock` 或权限。

本协调目录交回件不含 Key、密码、网络密钥或真实案卷内容。

## Root 下一步

root 须先全文审核 `observe.py` 与 README，再在全新绝对输出目录执行一次，父级期限 45 秒。
上海直连深圳 `192.168.*` 超时属预期网络路径，不是端点缺陷；不要重跑既有 health 证据。
只有 llm 与 prep 都在本次实际选择中落到所外 `alternate` 且 client 已关闭，才可按源级观察
记录实际成功。模型生成、Key、完整网络、安全验收和全量回归仍不在本件范围。

作者到此停止。
