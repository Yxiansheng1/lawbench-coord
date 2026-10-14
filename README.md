# lawbench-coord · 协调目录（私有）

主仓库 `lawbench` 放代码与正式文档；本仓库放**开发过程**：主编排与四条施工线的全部往来、台账、候 owner 清单、给律师/律所/安装负责人的文档，以及主编排会话用的 Claude 技能与记忆。按规矩不含任何密钥、密码、网络密钥、真实案卷。

| 位置 | 内容 |
|---|---|
| `ORCH-值守计划-*.md` | 主编排处理记录（按时刻追加，SSOT） |
| `ORCH-候owner清单.md` | 要用户/甲方拍板的事 |
| `ORCH-第七版待办.md`、`ORCH-契约1.4候项.md` | 待办与契约候项 |
| `ORCH-致律师-*`、`ORCH-致律所-*`、`ORCH-致用户-*`、`ORCH-致总工-*` | 对外文档（律师、律所、安装负责人、总工） |
| `致<收件>-<发件>-<件型>-<主题>-<时刻>.md` | 当期信箱（执行令/交回/注记） |
| `_archive/202610-第一期/` | 第一期全部信箱（726 件）、附件、旧版文档、旧台账 |
| `lawbench-lane-registry.json` | 四条线登记 |
| `claude-config/skills/` | 主编排会话用的 Claude 技能（原在 `~/.claude/skills/`） |
| `claude-config/memory/` | 主编排对本项目的记忆（原在 `~/.claude/projects/D--lawbench/memory/`） |

新机恢复：clone 到 `D:\lawbench-coord`；把 `claude-config/skills` 拷到 `~/.claude/skills`、`claude-config/memory` 拷到 `~/.claude/projects/D--lawbench/memory`。
