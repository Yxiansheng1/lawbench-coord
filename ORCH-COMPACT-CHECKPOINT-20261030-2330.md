# T34 新外部模型功能：本次检查结论

本人说明：这是新需求，以前未使用过，因此没有正常客户端的历史表现可对照。

本次使用原 SDK 和当前项目测试构建，将隔离配置里的两个模型地址改成与正式配置相同的文本格式，只做了一次真实窗口验证。结果仍是：停用外部模型时，删除 providers.external 配置进入 ConfigEditor.edit 后被拒绝。错误框实际可见，文件中的该配置也仍在。

此次模型请求为 0，未使用真实 Key，未访问外部模型接口。因此这次 settings/rejected 发生在配置变更阶段，不能归因为模型接口缺 Key；底层写入拒绝的具体原因仍未知。此前表达式地址的有限检查失败真实存在，但它不足以解释这次原生失败，不能据此宣布问题已修复。

已关闭隔离窗口；15 个有完整 PID、可执行文件和创建时间的受控进程均已退出，3 个测试端口均无监听，原 14 个窗口保留。Python 被有界强停，不宣称其 finally 或观察器恢复已完成。原合成材料、SDK、当前项目构建和源文件校验均保持。

不再重复同样的窗口或分类器验证，也不要求提供 Key。全量仍等待本人同步版本的明确信号，项目未完成、打包保持 HOLD。

证据：outputs/T34-literal-route-actual-closed-current.json；44 件封存清单 SHA-256 fb00ac81f9a967ef8f5fddfc6fe56b2f759787588137d90d7fd41a0cb4478e3b。

## Source audit
Original source author 53/42/11; count-only source finalizer 8/8/0; both exact deepseek-v4.1-flash-1017/max/cwdA/native first order and full raw/write/source inverse independently reviewed; runtime0. Formal staged51 qualified by final raw53. Earlier six readonly PS check attempts exceeded intended single metadata check, retained as source-only boundary deviation. Historical forbidden runtime9 unchanged. Cumulative10821/9355/1466.

## Root admin errors retained
Admission inverse initially assumed CRLF; actual LF corrected before any fixture runtime. Old build metadata path shape and utf-8-sig spelling corrected in root admin. Closure first checked all T50_LLM_PORT expressions rather than baseURL only; unchanged forwardPort expression caused readonly assertion; corrected to exact baseURL shape after observing both literal lines. No product execution repeated. One malformed sky activation call was rejected before UI input, then fresh selected returned window activated/observed once. Short parser/metadata helper identities not independently sealed; no full-machine cleanup/traffic claims.

## No pending runtime
No authors/GUI/localHTTP/model/SSH/extraGPU active; no old job reopen, no new equivalent GUI variant, no Key requests. Source admission consumedfalse/runtimefalse. Last REAL heartbeat14:40 receipt144046 scan1ABC1; human iteration0scan/receipt/trigger/ABC. Unique lawbench-abc30min ACTIVE. Broader OCR owner暂接受/后置; T18 quality partial/failed, formal network/blindtest/WinMac/lawyer delivery open. PackagingHOLD/fullsuite only explicit synchronized-release.

Prior detailed source setup: ORCH-COMPACT-CHECKPOINT-20261030-2310.md; stale ACTIVE sections overridden by this terminal actual closure.
