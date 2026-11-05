# T34 设置读回失败源码审查：正式交回

日期：2026-10-30  
执行线：B（DeepSeek）  
执行模式：只读源码审查，运行时 0

## 结论

状态：**SOURCE REVIEW COMPLETE / CAUSE UNKNOWN / OBSERVATION SEAM CONDITIONALLY SUPPORTED**。

原生失败事实可复用，但具体异常层与原因仍是 `UNKNOWN`。UI 的 `readSettingsIntoState` 捕获并丢弃所有异常，固定显示“没能读取服务设置，外部模型路由没有同步”；HTTP 200 和 B 服务 settings 成功不能证明 Host JSON 解析、Host 契约、DSH Gateway 包装、客户端解包或 `app.set` 成功。

冻结源码内没有证明出确定性的设置响应/契约不匹配。不得把本次现象直接归因于网络、Key、ACL、HMR、settings 文件或 provider 组件，也不得据此加入通用重试、隐式 fallback 或客户端框架改造。

## 交付物

- 审查结论：`B-T34-settings-read-failure-findings-20261030-124520.md`
- 最小观测缝：`B-T34-settings-read-observation-seam-20261030-124520.md`
- 本正式交回：`B-handback-T34-settings-read-failure-review-20261030-124520.md`

除上述 3 份协调目录文档外，没有写其他文件。产品、测试、fixtures、SDK、私有组件、服务根、pins、环境和凭据均未改动。

## 证据复用

- 逐文件核对 15 份原始源码与冻结快照 SHA-256，全部一致。
- 核对 4 份批准证据的字节数和 SHA-256，全部与 `approved-inputs.json` 一致。
- 复用 actual 结论：settings GET HTTP 200 共 1 次，native 46 次请求均 200；B 服务 settings 成功；私有观察器 ready；settings mutate 0、ConfigEditor edit 0、events 0；设置读回失败提示可见；设置变更未到达。
- `binding_marker_in_forwarded_logs = 0` 被明确判为通道不可见，不能推出组件未加载。

## 观测缝裁定

- 当前最直接的 Host 精确缝是 `LawbenchRemote.prototype.getSettings`，可原调用一次、同 `this`/参数、返回原 promise，并用独立尾随观察链记录固定阶段、错误名/短 code 和安全布尔形状。
- 现有 `private-provider-binding.mjs` 的 `console.error` 被 Host 主进程 stderr 内存缓冲截留；`console.log` 才走已转发的 stdout。该最小可见性修补尚未实施。
- 现有 provider URL resolve 钩子不是 settings Gateway 响应钩子，不能用来声称已覆盖客户端 `unwrapRemote`。
- Host 运行模块的精确 pin 以及客户端 mount/`setApi` 装载点不在批准输入中，故同进程同时区分 Host 与客户端阶段目前精确阻塞。不得靠猜路径、新增私有客户端构建或产品补丁绕过。

## 命令与运行边界

本次只执行 PowerShell 只读命令。除下述一次验证脚本 parser error 外，其余命令退出码均为 0：

- 完整读取执行令和 `approved-inputs.json`；
- 对明确列出的 15 组原始/快照文件执行 `Get-FileHash`；
- 对明确列出的快照执行 `Select-String`、`Get-Content` 行段读取和编号读取；
- 对 4 份明确列出的证据执行 `Get-Content`，并以 `ConvertFrom-Json` 结构化读取；
- 对 3 个目标文档执行 `Test-Path`，写前均为不存在。
- 写后对 3 个目标文档执行 `Get-Content`、`Get-Item`、`Get-FileHash` 和固定关键标记检查。

唯一 non-zero：第一次写后检查以内联 `foreach` 直接接 `Format-List`，PowerShell 报“An empty pipe element is not allowed”，退出码 1；该命令在读取阶段即 parser error，没有写文件。改为先收集结果再输出后，同一检查退出码 0，三份文档均存在；关键标记检查随后补出了结论文件缺少精确类名的表述，并已修正。

未执行 Node、Python、TS AST parser、测试、构建、prepare、serve、GUI、HTTP、SSH、DPAPI、环境/凭据读取、process probe、模型调用或其他产品运行时。未运行 Git 命令；没有 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

当前运行器为管理隔离的原生 MXC；未遇到沙箱拒绝、审批阻碍、`index.lock` 或权限失败，因此没有启动 setup、切换 legacy、改审批/ACL 或拆 writer 锁。当前 PID 是本次 B 线执行者，不作为第二 writer。

## UNKNOWN / 限制

- 实际失败阶段、异常名称、code、错误消息和 stack 均未知；消息与 stack 也不应进入新证据。
- 原始 HTTP 响应正文和客户端收到对象未知。
- 运行时实际 Host/客户端产物与已审源码构建的逐字节绑定未证明。
- 私有 provider 组件是否实际绑定仍未证明。
- 按令没有枚举 Git dirty；只用“不写产品文件、不执行 Git 写”保全既有状态。
- 本交回不代表 whole T34、项目、GUI 修复或法律功能通过；Gate1 仍 `INCOMPLETE`，Packaging 仍 `HOLD`。

