# 已核实际接线事实，不是旧候选方案
- A/dsh/packages/client/ui-conversation/src/client/service.ts275：Session.beginSubmission同步产生submission；293把submission.requestId交给session.prompt。唯一R已存在，不准另造Host requestId。
- A/dsh/packages/api/session-controller/src/client/sessions/session.ts228：beginSubmission生成唯一R/pendingecho；prompt请求显式带R。
- 当前A/dsh-ext/ui/intake.ts本机path走startImport(caseRef,paths,对话框)，caseRef来自session cwd映射；位图另走importPastedImage默认copy。
- A/dsh-ext/ui/cases.ts runRefImport的返回registered只有ref_id/root，scan.added是数量，不等于本批material_ids；需从真实材料索引响应解析本次选根当前成员，不能把目录数量当材料数量/仅按增量忽略重复根。
- 当前A agent/preStep 第一步core task/begin只session_id/cwd，然后全案core/context；当前case_search args只有query/max_hits，case_list_materials args为空。要真正限本批，必须同时闭合任务固定scope、context/cache/wiki、list/search/read的服务端约束；不能仅UI提示或提示词。
- 原T31旧候选被拒的原因：错误时序/双造R、缺attempt/claim/幂等/retry以及全案cache/wiki旁路。只复用这组反例和真实源事实，不能重写第三份相同paper或照旧字段施工。
- 当前A头a23271abee333a9a256fd46a3141da16975c2380，dirty是已有产品成果。root已完整保存tracked patch/status，不覆盖/清理陌生修改。
- 原T31 card：导入完成输入区显示本批，下一问默认针对本批，律师可取消/改选；导入不自动发消息。默认产品口径已经owner拍板。