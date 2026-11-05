# 用户指定三线执行模型

2026-10-21T22:33:31.318562+08:00台北，当前主编排聊天人类原话：

> 等等 ，a b c 你用的是 什么模型 ，要用 **deepseek-v4-pro**   这个强一点

生效：A、B、C后续执行精确指定deepseek-v4-pro，不能deepseek-flash或静默降档；GPT主编排/独立review保持。此前后台实际模型deepseek-flash如实保留历史，不能改写成Pro。运行中A在安全边界保全接续，已结束B/C不为换模型重复已完成任务；新job显式model，runner强制Pro。API/provider/Key/GPT桌面配置不改。新的runner C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\LaneColdRunner-deepseek-v4-pro-20261021.py，旧入口已备份C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\runner-model-backup-20261021-223331.py并改为指向新runner，不新增永久loop。
