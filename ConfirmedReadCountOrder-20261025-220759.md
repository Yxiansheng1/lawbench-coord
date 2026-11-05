# 唯一精确探针计数窄修，不运行
原主单completed9/8已结束，不重开。精确deepseek-v4.1-flash-1017/reasoning_effort=max。本单独立240秒，首工具只读本令；此令已含全部必要上下文，不需额外读取或hash自证。
唯一产品准备写白名单 D:/Lawbeach/lawbench-B/docs/plan/evidence/T15/ConfirmedReadEntry-20261025-215536/probe.mjs。仅将唯一原行
check(tcpCount === 11, "exactly 11 reviewed TCP GETs");
逐字替换为
check(tcpCount === 12, "exactly 11 reviewed TCP GETs plus one same-case POST");
原因：原第一个expectOk POST /api/case/open已tcpCount+=1，随后恰11GET，所以此处应12。后续3业务POST403+2GET403总TCP17，ASGI5另外计。其它所有断言/内容/顺序/文件不改。不改server/README/产品/旧入口/E50/guard/loader/lib/配置/权限。不再修改主formal历史，不自证PASS。
首读后仅apply_patch这个一行替换与正式文件，不额外exec/parallel/搜路径/parser/测试/prepare/serve/probe/HTTP/GUI/build。每exec仅绝对原生pwsh/loginfalse，禁Bash/短名。不得读凭据/真实数据，Git禁止写，不改ACL/审批/锁。准确完成即停。
唯一正式交回路径：D:\Lawbeach\lawbench-coord\ORCH-B-ConfirmedReadCountReturn-20261025-220759.md
准确绝对界：2026-10-25T22:11:59.3050617+08:00
