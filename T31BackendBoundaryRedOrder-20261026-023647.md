# T31原目标服务端边界：只补可执行回归，不改产品先取得root真红
精确deepseek-v4.1-flash-1017/max，B主已completed，root已全文读formal/主test/setup/全部服务diff，真实执行 standalone 5/5 PASS、exit0。此只证明该5条覆盖，不代表未测旁路完成。继续原目标，工时/工程量不限，不重跑既有绿、不再paper。
先读本令、D:\Lawbeach\lawbench-coord\B-交回-T31BackendImplementation-20261026-014815.md、当前D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_standalone.py、service/lawbench/case/task.py index_for_task、tools/inputs.py read_wiki，以及scope_store/current契约；准确root raw结果C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31-root-review-20261026-023035\B-root-tests\stderr.txt。旧dirty与主交回snapshot全保留。

本单只写 D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\ScopedTaskImplementation-20261026-014815\scoped_task_boundaries.py 及正式 D:\Lawbeach\lawbench-coord\B-交回-T31BackendBoundaryRed-20261026-023647.md。可复用原独立回归类的setUp/helpers，importlib加载原模块需避免 unittest.main 自动运行，class继承/组合按最小清晰方式；无新框架，原5条源与断言不改，产品源/contracts/生成器/其它树不改。

两个明确原目标未闭合的边界，请写应失败关闭的回归，不执行：
1. 固定scope权限不能由坏/缺字段任务静默退全案。用真实cases.open/materials.import_/prepare/begin产生同R scoped任务，再在**内存副本**模拟已读任务缺request_scope字段、或request_scope被错误置null（保留原request_id/task_id/case/session）。调用真实TaskStore.index_for_task，应明确拒绝，而不是返回全案3材料。不得手写task/result/index/history到磁盘；原生R首次无prepare合法null与旧无R仍全案作为互补守卫。当前_task_scope.get(None)直接全索引，静态预期红；真实由root运行判定。
2. wiki材料摘要必须符合固定版本，不能只因文件名是scope内M-ID就读任何旧文本。用原生begin得到合法M1固定hash，测试私有wiki/材料/M-ID.md写唯一合成过期/无来源marker（不是task/index/history伪造）。在缺少对应材料版本/来源证明时，read_wiki(scope内name)应明确不可用/拒绝或返回安全说明且不含marker；不能把原件hash当前一致等同摘要当前版本。若找到既有可信wiki版本元数据可写另一真实本地生成的安全场景，但不得运行pipeline/模型/伪造历史或索引凑来源，必要上下文只读后在formal讲清。原始standalone里直接写INSIDE_WIKI后允许全文的断言不足以证明版本，先不改原测试，本单新增独立反例，不以原5绿压掉新问题。

测试只能全合成/私有临时目录/真实本地对象，无create_app/真实默认lifespan、网络/模型/凭据/Office/OCR/subprocess。沿原socket拒绝和UnusedConverter窄拒桩；新脚本不改变全局API/权限/Key/安全guard。作者不运行unittest/pytest/collect/parser/tsc/Vitest/测试/selfcheck/build/prepare/serve/HTTP/GUI；root全审后执行红。所有exec精确绝对pwsh/loginfalse；**参数里不准出现shell=bash**，每次exec前核固定shell，不用parallel工具或短名，拒绝不换壳重试。不做git写操作/清理/修权限。当前只定位两缺口的回归证据，不提前修产品，不扩其它功能。
交回列每条真实对象路径、预期断言、未运行声明。完成即交root，不循环自查/重跑旧5例。本单仍没有任意工程deadline；86400仅技术进程watchdog。
