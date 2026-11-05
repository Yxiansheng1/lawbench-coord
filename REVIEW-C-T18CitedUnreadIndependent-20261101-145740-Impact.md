# T18 独立高级复审

AUTHORED_REVIEW_ONLY / runtime 0

## Findings

- **P0：无。**

- **P1（范围内阻断，证据缺口）**：目标明确要求页、段、行三种引用，但运行证据只覆盖 TXT 的行。`test-cited-unread.py:_material_env/_assert_citation_denied` 总是创建 `.txt`，NEW JUnit 的六个案例也都是行引用；包内 `knownEvidenceLimits` 明确承认页、段格式化真实旅程未新验。现行不变量是三种单元都必须先完整读取，当前不能据此证明页、段旅程成立。最小修复：在安全临时根内各加一个有界的真实页、段读取—拒绝/允许旅程，旧版应红、新版应绿；不需要改产品接口。

- **P1（范围内阻断，证据缺口）**：目标的“live defense-opinion model save”只有非原生公开 Core 测试。`agent-consumer.ts:executeTool` 在 `r.ok=false` 时抛出 `r.error.message`，静态消费链看起来正确；但 `knownEvidenceLimits` 明说 fresh native R/model recovery 未验。现行不变量是原生模型路径收到可行动且不泄密的错误后能继续读取并重存，目前没有端到端观察。最小修复：用一次安全根、原生 R/模型旅程验证首次保存被拒、消息只含编号/位置/读取指引，随后读取并重存成功。

- **P2（范围内覆盖缺口）**：TaskStore 权威续接没有被运行案例覆盖。`task-store.py:_carry_reads` 只取同会话最新 Agent 任务且仅在其为 `finished + budget_stopped` 时复制读取；带 R 时还按当前范围的材料编号和哈希过滤，并写入新任务自己的 `reads.json`。因此源码满足“当前任务文件为权威”的语义，但搜索命中、其他任务和旧版本之外的关键合法续接路径没有证据。最小修复：补一个安全根案例覆盖“到顶续接允许”和“异常/普通结束不续接”，不要扩大为通用 TaskStore 重写。

## 追踪结论

- `new-drafts.py:_defense_unread_numeric_citation` 按 `(material_id, material_version, unit)` 分组，含端合并读取区间；缺口、旧哈希和跨任务记录均不能覆盖引用。`save_draft` 在 `_save_locked` 取版本、写文件及改 `result.json` 前执行该检查，且只在来源任务技能为 `defense-opinion` 时启用。
- 错误为既有 `INVALID_ARGUMENT / defense_citation_not_read`，正文只拼材料编号与页/段/行位置，不含材料名、案文、检索词或正文；消费端转发该消息。JUnit 的普通路径覆盖了这些断言。
- 手工界面路径 `new-drafts.py:save_document_ui` 未接入新闸；Excel `cell` 被显式排除。两者均符合任务措辞和非目标，不构成回归。
- 活性地图：`save_draft` 获取任务局部锁后重读状态，再依次完成引用解析、读取核对、版本/文件/结果写入；全程由 `with` 释放，所有异常均释放。读取追加使用独立 `_lock`，复核到的写入路径没有形成任务锁→`_lock` 的反向嵌套；并发读取晚到最多令本次保存保守失败，不会让未读保存成功。未发现死锁证据，也不把普通慢操作误称为死锁。
- OLD JUnit 为 6 项中 2 个主红灯（搜索命中、其他任务），NEW 为 6/6 绿；正向含正确读取、含端范围、长单元分段续读和非辩护意见对照。这是有效回归对称性，但不足以补上述高风险缺口。

## Scope

新旧快照差异限于读取辅助函数、辩护意见保存钩子、避免重复解析的缓存 lambda，以及 Spec 的一行说明；公开 API 1.7、schema、认证、SDK、TaskStore、guard、UI 手工保存和其他 Skill 未见语义改动。结题前已重读包内 criterion 与目标哈希；中心文件 `new-drafts.py` 实测 SHA-256 为 `03d8a77d41a75338ae3baa239e9572b97d71d74ad4bff4bbe01fe9709e20957d`，与包一致。

## Verdict

**INSUFFICIENT_EVIDENCE**。未发现可证明的源码越权写入缺陷，静态实现与错误隐私设计基本符合目标；但页/段真实旅程、原生模型错误恢复和预算续接仍属高风险未知，按本令不得降格为 PASS。此判定不主张 AMEND：要补的是最小证据，而非已证实的源码修改。Root 终裁，无豁免。
