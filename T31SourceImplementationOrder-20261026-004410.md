# A唯一产品施工：T31默认本批材料的真实请求接线（不是候选paper）
当前人类已明确继续实际施工，不是只读/等条件；并澄清不按任意时间/命令数/工程量截断有进展工作。原功能范围与安全约束不变。精确deepseek-v4.1-flash-1017/max，不替代。
## 先准确读输入，然后施工
首工具读本令后，按必要片段读：
D:\Lawbeach\lawbench-coord\T31ImplementationInput-20261026-004247/owner-scope.md
D:\Lawbeach\lawbench-coord\T31ImplementationInput-20261026-004247/owner-work-policy.md
D:\Lawbeach\lawbench-coord\T31ImplementationInput-20261026-004247/source-facts.md
D:\Lawbeach\lawbench-coord\T31ImplementationInput-20261026-004247/rejected-candidate-reasons.md（只作不得重犯的反例，不照抄该方案）
现成B源码精确副本清单可Get-ChildItem本输入目录；只读各文件必要部分，避免一次30K输出截断。真实产品源A根D:/Lawbeach/lawbench-A，只读Git确认HEAD可，禁止写Git/全树重复搜索/碰凭据或history。root已保全dirty到C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31Implementation-20261026-004247。不重开旧job/旧17绿测试。
## 原目标及唯一收货证据
原T31反馈2/6：输入区导入文件/目录后，以本次所选根真实当前material_ids形成批次，不仅scan增量；下一条提问默认该批，律师可取消/改选。导入不自动发消息。必须沿原生Session.beginSubmission唯一R绑定与队列/claim/attempt生命周期，任务范围开始后固定，明确retry/重复请求/换会话/换案件/后续新批不会错绑；不另造Host requestId、不塞任务inputs或用户正文。实际context与list/search/read/wiki/cache必须服从相同scope，不能全案旁路、不能只UI/提示词冒实现。
本单目标是交付A侧必要真实产品代码、精确A契约（若确需）和有意义的新回归源码；不是再写第三份候选文档。B服务端实现是后续真依赖，由root依你实际落地的精确契约派B；A不得跨写B。不要因需要B就零改动交一份paper：先完成A可施工部分与可独立验收断言，交回准确B必要输入。A尚不能独自宣称整T31完成。
完成证据由root全累计审+有限新回归+随后B真实native过滤/端到端核对形成。你不得自行运行测试/服务/build/模型。
## 允许写入范围（必要改动必须逐件说明，不用人为文件数限制）
- A/dsh-ext/ui中现有intake/cases/dialogs/input-import/dock/state及为本批选择新增的明确T31模块；
- A/dsh-ext/host和agent及shared中本批快照、真实请求身份传递、固定作用域所需代码，不改无关模型/外部设置/凭据/文稿/预算逻辑；
- A/contracts与生成源中本批传递/固定scope必要的精确schema与对应生成定义；保持VERSION1.6与其它已定契约，不裸跑unlink的生成器。不得据被拒旧候选四字段直接抄schema；从当前原生请求生命周期推导；
- A/dsh-patches新增/更新T31最小原生hook patch及其PATCHES登记；必要时A/dsh/packages/api/session-controller、client/ui-conversation、core/agent-loop源码中与唯一R/attempt/claim传递直接相关文件，必须与patch一致并保全已有修改，不升级DSH/不改历史；
- A/dsh-ext/tests与上述dsh子包tests内本单新回归或准确受影响回归源码。断言真实身份/旧参数兼容/不同会话/并发新批不污染/失败重试/取消改选，禁止mirror-only自证测试；
- 正式D:\Lawbeach\lawbench-coord\A-交回-T31ActualImplementation-20261026-004410.md与进度D:\Lawbeach\lawbench-coord\A-进度-T31ActualImplementation-20261026-004410.md。注意正式准确路径以本令末行为准（不猜不存在文件）。
不改lib/构建产物、packaging/install、旧E50、guard/resolver/PDF、安全策略、全局API/Key、B/C/D树或main工单；不清理dirty、不提交/merge/push。
## 工作方式与停止判断
按原目标必要的源码理解→实现→自查，不规定任意分钟/命令/文件上限。需要较长就继续，阶段有实际改动或发现时写同一进度件，说明已改/正在做/下一依赖。不是每隔几分钟空报一次。
有新证据/有效改动就沿同一目标推进；同一失败且无新信息不循环，不复活旧paper，不顺手扩其它需求。真遇缺失扩展点就在该白名单实现必要hook；不要把必须的hook都推成候owner。若必须触及禁止区域/真实数据/网络，则停相应危险动作，交具体阻碍；其它A可施工代码继续。不能造model/history/rollout让验证看似成立。
所有exec必须shell=C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe，login=false，禁Bash/短名；不改审批/隔离/权限/锁。作者禁Vitest/tsc/pytest/collect/parser/prepare/serve/probe/GUI/HTTP/模型调用/自测/build；静态读自己的改动可以，不循环搞LCS/自写验证器。不要派其它模型/子代理。
正式交回六节：原目标与来源、全累计修改、未运行验证及root建议、原始证据、精确契约/生命周期说明（从真实代码所得而非另立候选paper）、B必要依赖与剩余范围。未做就明确未做，不说prepared/测试绿/功能已全通。目标做实后结束，非到时强停。
正式交回唯一准确路径：D:\Lawbeach\lawbench-coord\A-交回-T31ActualImplementation-20261026-004410.md