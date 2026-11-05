# 唯一一次语义审查窄修，不扩大原PRD引用同步目标
绝对截止 2026-10-25T23:59:17.5124501+08:00，180秒，最多首读令+一次实际写入命令。旧job已deadline_exceeded终态且文件/正式已落盘，不重开、不篡状态、不重做五段。此为原目标允许的第1/1次证据窄修，之后无第三轮；需要更多即停止该支。
首读本令已包含全部事实，不额外读其它上下文：目标 D:/Lawbeach/lawbench-A/docs/src/PRD.md 当前SHA2988243c1e47c52afea1781d67be86d2640aae29ead6978c3fe7f18467cf4d53；root保全在 C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\PRDReference-20261025-235005/PRD-author-current.md。唯一问题：你新增的“仅供调用方显式选用”限制没有owner依据，真实B api/ui.py:125是mode=d.get(mode,copy)，Materials.import_paths:1254默认copy；原裁决只说保留旧copy，未要求显式mode。root已准确读这些行，不需要你再查源码/grep。
允许只将目标当前两处字面量各替换一次：
1. 服务保留的 copy 模式仅供调用方显式选用。
   改为：服务保留原有 copy 模式。
2. 服务保留 copy 模式，仅由调用方显式选用，不属于本条的拖入或选择引用规则。
   改为：服务保留原有 copy 模式；本条的工作台拖入或选择操作使用引用模式。
仅两处，其它字节保持。不要改旧正式报告，不改其它条款。目标读取/固定SHA核对/两次精确文本替换/按原UTF8无BOM和CRLF写回/落新正式 D:\Lawbeach\lawbench-coord\A-交回-PRDReferenceAmend-20261025-235617.md 可在唯一一次绝对pwsh/login=false命令完成。声明只是修去无依据限制，不是产品服务/功能验证；HTML仍未生成。禁止任何自测/LCS/parser/测试/编译/build/git/服务/GUI/model调用。达到两处更正和新formal即停，不补读/不再哈希汇总。无其它文件写入，不root/其它树，不重新派生任务。