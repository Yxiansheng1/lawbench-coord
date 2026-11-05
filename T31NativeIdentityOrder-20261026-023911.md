# T31原生R admission→queue/claim→重放：新增准确验证源码
精确deepseek-v4.1-flash-1017/max，A前一返修已completed，root真实通过UI15/15、原生提交hook5/5（29跳过）、types0，原7红已转绿；不是整T31收货。B在独立树补范围读取反例，不改公开四schema。继续原目标，无任意工时/工程量上限，不重复旧green或paper。
先读本令、D:\Lawbeach\lawbench-coord\A-交回-T31BoundaryFix-20261026-015505.md、C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\A-root-tests\results.json。准确已有原生源码/夹具：
- dsh/packages/api/session-controller/src/client/sessions/session.ts（真实beginSubmission/prompt）
- 同包 tests/session-pending-submissions.client.spec.ts 与 tests/remote/bench.client.ts、remote/session.client.ts（真实client Session通过既有Gateway内存fixture，不能复制预制event history）
- 同包 src/commands.ts SessionCommandController.prompt、hasPromptRequest；tests/commands-queue-attachment.host.spec.ts 的准确controller接线（其中旧inbox stub不可当真实claim，勿整体复制祖先/子代理history）
- dsh/packages/core/agent-loop/src/inbox.ts 与 tests/inbox.spec.ts 的 inboxAgent：真实Context+SessionStore+SessionProjectionRegistry+ReactLoopInbox，所有事件由实际append/claim操作产生，不手写历史/rollout。
- dsh-ext/agent/index.ts requestIdFromMessages 和原3个T31回归（只读，不重复作者执行）。

本单只写 D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-native-request-identity.client.spec.ts 与正式 D:\Lawbeach\lawbench-coord\A-交回-T31NativeIdentity-20261026-023911.md；若确需单个同目录测试helper可新增但要明确无副作用，不改产品/native原函数/其它测试/契约/patch/lib/配置，不运行。现有代码和已有dirty保留。一树一作者，无新框架/loader/服务/HTTP/provider。

唯一目的：用真实原生R生成与原生prompt封装、Host controller消息source和实际ReactLoopInbox.claim证明身份没有在异步/queue/steer/重放处换掉。不能vi.stub beginSubmission或手写literalR当“原生R通过”；可用既有client sessionBench生成真实随机R，内存remote endpoint把真实payload送实际SessionCommandController，controller的Agent调度只把消息交真实inbox、不启动模型/loop/provider。
请据实际接口写这些有意义的断言：
1. client beginSubmission产生UUIDv4 R，实际prompt(payload,R)从内存Gateway到实际controller后user source.rpcId就是同R；queue里挂两个不同R后真实claim每轮只取一个next-turn，绝不把后一条R误配到前一条。本条文本不携带material IDs/scope或自造R。
2. 已排队同R重复prompt不新增消息；重点覆盖**真实claim已取走R，但还未被写成user/message的异步窗口**，重放同R不能又排一份、不能重复创建原生提交身份。目前hasPromptRequest仅看pending inbox和user/message，未核agent/inbox/claimed，静态疑似红。不能手动session.append伪造user/message来藏掉这个窗口；真实inbox.claim本身会发claimed事件。写严格预期，root跑红再由后续单修产品；本单不修。
3. steer无batch沿同一个实际R进入next-step，claim后R仍正确；T31带batch的steer目前明确阻断不扩大运行中scope，别通过塞scope到正文/inputs实现。
4. 相同message/R的失败重试/请求边界只做本地admission/claim验证，不调用真实或假模型去造attempt历史；如果existing实际Attempt驱动必须模型stream，不本单硬造“attempt通过”。准确说明本次证据范围，后续API+模型前接线另计。
原生clientfixture与Host上下文均必须dispose，Promise受控、无sleep猜顺序；private合成路径/会话，不读真实会话/磁盘history，不写task/result/index/history/rollout、无credentials/Keyring/network/Office/OCR/subprocess。用真实Session类和真实inbox/contract，不以内存重新实现它们。

所有exec精确shell=C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe，login=false，参数不准写bash，不parallelwrapper/短名。作者禁止测试/Vitest/tsc/parser/pytest/collect/build/prepare/serve/probe/HTTP/GUI/模型；Git只读，不apply/commit/add/权限/沙箱/审批/锁更改或临时镜像patch自测。root全审源码/依赖/setup后才跑。工作完成或有准确不可组装依赖就正式交回，说明实际哪些类/链是真的，哪些调度只是无模型窄替身，不虚标全链。不要新研究paper或等待用户逐项派工。
