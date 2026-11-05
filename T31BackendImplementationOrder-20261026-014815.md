# B唯一实际产品施工：T31真实请求绑定与任务材料过滤
人类最新继续且不任意限时/限工程量。精确deepseek-v4.1-flash-1017/max。A主交回真实completed，root完整读正式及当前四schema：materials batch7/7、types0、111样例0错。A有UI边界正在独立A树补回归，不改本次四schema；本令四份已冻结为B集成输入，不等于A整体PASS。不能另造第二套字段/新模型调研paper。
## 精确输入
首读本令后按必要读 D:\Lawbeach\lawbench-coord\T31BackendInput-20261026-014815/owner-scope.md、owner-work-policy.md、contract-pins.json，contracts下四schema及examples下必要样例、A-delivery.md。勿一次输出30K截断，原源B D:/Lawbeach/lawbench-B真实HEAD dc56a93be4b07dbe7a48863e3135351659817fb5，原dirty已root完整保全C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Backend-20261026-014815（before 333 文件+tracked patch/status），不清理陌生改动。只读必要相关源码，不泛扫历史。
## 唯一原目标和真证据
完成原T31服务端：/api/request/scope prepare/release与TaskStore.begin的同一DSH原生R原子claim/幂等/固定材料版本权限；同一task的context/L0/L1/wiki/旧reads缓存/list/search/read/引用派生只能访问本scope。scope不放task.inputs、不由模型args控制，不向原路径写东西，不发模型/真实服务。旧无R客户端仍原全案兼容。
A生成唯一R，客户端prepare后才prompt，Agent从已claimed user source.rpcId把同一R交给begin。B不能再生成Host requestId/偷用session当一次请求身份；attempt/retry沿同R固定task/scope，不换权限。任务开始时固定snapshot来自真实Materials当前index含material_id+sha256，持久task.json按A fields写。
## 必须闭合的行为
1. prepare按case/session/R持久化，材料去重/当前存在性/版本核查；跨case/session/R篡改或sameR改集合必须冲突，不能因queue等待/进程重启丢失。记录只含必要ID/sha/state，不含用户正文或真实路径日志。新无准备R是明确全案null；已release/拒绝R的墓碑不能被当从未prepare而静默放大全案。release重复幂等，不删除材料，不改变已claimed任务权限。
2. begin在一个原子边界认领R和固定task。并发sameR只一个任务，同R运行中重放同task/scope，不能重复begin/task文件/预算；已结束R不得重开或重复执行，给明确错误。不同R/会话/案不得继承上一批。旧无R调用保持旧语义/route/params/budget不变。部分写盘失败必须可恢复/回滚，不留下指向不存在task的claimed记录或让下一次回落全案；复用现有gate/原子文件/锁，不新造通用存储框架。
3. TaskStore._carry_reads现在会带上次budget任务reads。scoped任务必须按固定权限过滤，不能把之前全案读记录/citation/version缓存带入新scope。scope内源版本被扫更新/移除必须明确失败，不静默换版本/扩大集合；复用T37现成路径/版本守卫。
4. case/context.py当前L0无条件全案wiki卡，ToolContext.index和case_read_wiki也可全案。必须闭合这些入口，不能只改列表。已有L1任务inputs是前序成果，不拿它冒scope字段，也不能自动偷渡范围外材料；明确受限或提供可验证受限数据，不静默全案。case_read_material的more_names与所有工具派生/citation/coverage也不能绕过固定scope。
5. search/fts必须在排名/limit/total/truncated之前限制scope，不能先全案topK再过滤导致错计/漏选、更不能full-index缓存旁路。未带scope旧行为不改，所有scope权限来自task_id，无模型新权限字段。缓存key/reads/coverage要含固定scope或使用同一受限索引，不串任务。
## 写白名单与落点
- B/service/lawbench/case/task.py/context.py、必要新request_scope模块、api/ui.py/core.py、tools/__init__.py/materials.py/search.py/inputs.py及为闭合scope所必需的现有drafts/edit_list/archive/citation/coverage读路径、search/fts.py；仅与本单直接相关最小修改，不重构其它业务。
- B/contracts仅精确合入输入四schema（不改其公共字段）、必要新内部持久记录schema/对应生成定义/本scope样例。将root输入JSONcopy进B是本单授权；保留B其它契约/dirty与VERSION1.6，不整体替换A目录或裸跑unlink生成器。公共字段若确有必要新改请交明确原因/源改动，不私自让A/B分叉；可继续独立实现部分，不把真依赖当停整个工程。
- 新回归优先在 D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815 下一个独立 unittest 源码/README（或既有准确安全测试位置）。不能复用会初始化真实create_app/lifespan的全量service/tests Env。测试只构造私有CaseRegistry/Materials/TaskStore等已核本地对象；TXT等合成输入经真实cases.open/materials.import_paths生成索引，begin/end真实生成task/result，禁止手写task/result/index/history凑成功。converter/OCR/Net若不需就给拒绝调用的窄stub，不伪造材料解析成功；无Keyring/凭据getter/网络/模型/Office/subprocess。测试执行前会由root全文审，作者不运行。
- 正式 D:\Lawbeach\lawbench-coord\B-交回-T31BackendImplementation-20261026-014815.md 与阶段进度 D:\Lawbeach\lawbench-coord\B-进度-T31BackendImplementation-20261026-014815.md。
不改A/C/D、lib/DSH/E50/网络/PDF/guard/权限/全局API/Key/真实案卷/engines、packaging/installer/build；不提交/merge/push，Git只读。
## 回归与交回
写有意义的回归覆盖旧无R兼容、新Rprepare/claim/release/重启/并发/相同R重放/结束不重开/跨sessioncase冲突、版本变更、无scope回退、context/wiki/list/read多名/search/cache/旧reads旁路及claim部分失败。root运行，不作者自测；新代码无需给任意分钟/命令/文件硬上限，需要多久做多久。进度只在实质变化落同一件；不做重复无信息尝试/新调研paper。
所有exec单独调用，精确shell=C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe、login=false，禁multi_tool_use.parallel，避免工具丢shell字段误走Bash；不要在Bash失败上循环。禁Vitest/tsc/pytest/collect/parser/unittest执行/prepare/serve/probe/GUI/HTTP/模型/build/安装/权限修理。完成真实产品代码与回归源码后六节正式交回，说明全累计路径/持久模型/关闭边界/未验，不冒测试已绿、native服务已跑或整T31完成。