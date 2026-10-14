# 工程 skill 包(通用版)

放进 `~/.claude/skills/<名字>/SKILL.md` 即可用(用户级),或放进项目 `.claude/skills/`。全部零项目词;项目事实(协调目录、台账、部署脚本、账号)一律写进你项目根的 `PROJECT-PROFILE.md`,skill 只引用它。

| skill | 一句话 |
|---|---|
| 5gate | 五门发版范式:任务门 → 合流门 → 盲测门 → 发车门 → 真人门,每门只认落盘证据;发车件三节合一模板 + 用量纪律 |
| orch-plan | 编排计划三件套(HTML 总览 + 事实索引 + 工单集),每张工单六要素 + 五门格,冷启动自包含判准 |
| verify-3way | 发版三路验证:全量回归 + 无背景盲测红绿灰卡组 + 规范走查,主编排交叉判读 |
| coordination-worktree | 多会话协作:文件信箱通讯层 + 一线一树 worktree 纪律(禁 stash、合并权归编排) |
| keep-pushing | 无人值守自主推进:叫醒机制实证、依赖图并发、分层用模、停摆恢复 |
| moniter-on | 可验证的值守 Monitor:强制重架 + 通道实测,pattern 从真实文件名倒推 |
| compass | 导航校准:对照目标 / 三栏对账 / 活性审计 / 跑偏自检(含 hook 附录) |
| compact-s | compact 前把只活在对话里的状态高保真外置成 checkpoint,并给出压缩后启动 prompt |
| reboot | 主编排换代交接文档与握手闭环 |
| human-explain | 说人话:给决策者的解释零代号、结论先行 |
| cn-prose | 书面中文五病判据 + 删减轮,对外文字交付前必跑 |
| formal-report | 面向 owner 的正式进度 / 状态报告该含什么、什么算证据 |
| senior-review | 两名独立高级复核员(纪律 / 影响半径)+ 主循环综合 verdict |
| feature-dev | 通用功能开发流水线:调研 → 契约冻结 → 工单 → 独立复核 → 验收 |
| need-research | 决策级盲区调研:补 unknown unknowns,给带默认值的选择题 |

建议顺序:先读 5gate(脊柱),再 orch-plan / verify-3way / coordination-worktree;无人值守三件(keep-pushing / moniter-on / compass)配合用;compact-s 与 reboot 管会话生命周期;human-explain / cn-prose / formal-report 管对人的输出。
