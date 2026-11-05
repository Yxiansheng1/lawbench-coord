# A 线交回：T18 tender-review 观察契约修正

## 结论

- 执行令：`D:\Lawbeach\lawbench-coord\A-T18-tender-observation-contract-order-20261029-072238.md`
- 状态：`OBSERVATION_CONTRACT_SOURCE_READY_NOT_RUN`
- 封装：`HOLD`
- 本交回只表示修正后的源码、清单、README 和正式文件已准备完毕。未作 admission、未载入 ESM、未运行消费者、未调用模型，不能宣称实际链路、题目语义、业务质量、Gate 1、完整 T18 或打包通过。

## 新交付物

唯一新证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\TenderReviewObservationContract-20261029-072238`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-tender-review.mts` | 117885 | `b043c3644723edabc51deebe412769e40ad0603ceb2aec97ed10958d02255732` |
| `b-service-tender-review.py` | 46017 | `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` |
| `literalfixed-inputs.json` | 11289 | `53136c596eb7fbd8ef3815d9a4fa596b480f1d1242b096fcef99bcfc342911be` |
| `README.md` | 12392 | `50b225ab722cbaa118c621f689c2cf2d992e85a35019f3cfa6748963c4f14c3d` |

正式交回文件：

`D:\Lawbeach\lawbench-coord\A-handback-T18-tender-observation-contract-20261029-072238.md`

## 有界修改

1. 删除 `questionTextsById` 接口字段、Map 初始化及 `.set` 写入；题目文本恢复为直接
   `question.questionTexts.push(asString(item.question, ...))` 采集。实际问题文本和
   Native 事件记录保留。
2. 删除 `sideQuestion`、`focusQuestion` 及题目措辞的字符串包含判断。严格两项声明 ID、
   实际成功回答、回调计数、回答字节、首次成功保存时序、畸形主问题拒绝和未知回调 ID
   拒绝等原有硬断言全部保留。题目语义不设机器 PASS，仍需 `ROOTMANUAL` 人工核对。
3. 引用检查保留 `passed=true`、`must_fix=0`、全部 problems 与 qualityHints，以及 hint
   数量一致检查；恢复独立的 `citationProblemClasses.some(... A-E ...)` 缺失谓词。A-E
   在 `must_fix=0` 之外另行致命，F/G 等 hint 仍不致命且全部报告。
4. 清单只改本消费者和配套 B 服务的路径、字节及 SHA-256。六个批准输入、346 项源 pin、
   四个私有编译对象、25 项依赖与三个运行时可执行文件身份保持不变。
5. README 更新新目录路径、源码/清单身份、两处观察契约修正、A-E 与 hints 并存规则，
   并明确题目语义为根控人工确认。Counter 0 只表示产品运行期计数，不是 CLI 子进程遥测。

逻辑 `TASK_NAME`/`REVIEW_ID` 仍为原 `A070224`，证据目录使用本执行令的新目录名。

## 字节保全

| 对象 | 字节 | SHA-256 | 结果 |
|---|---:|---|---|
| 冻结输入 MTS | 118524 | `80cb5560d72182bd85cdceb51e1e94490906f26d2141c51a4feda301e909db4b` | 未变 |
| 旧候选 MTS | 118524 | `80cb5560d72182bd85cdceb51e1e94490906f26d2141c51a4feda301e909db4b` | 未变 |
| 冻结输入/新目录 B 服务 | 46017 | `3398e560aecb98d6e8a4d74dd225aed1b45482946f22e831031ff571c39d97bc` | 逐字节相同 |

新 MTS 对冻结输入的只读 `git diff --no-index` 仅显示上述题目文本、字符串谓词和 A-E
引用护栏三组改动。新清单对冻结清单的只读差异仅有 `consumer` 与 `bService` 两个对象。
旧证据、旧正式文件、raw、pins 和既有实际运行结果均未改动。

## 验证边界

本轮只使用指定原生 PowerShell、只读文本检索、只读哈希和只读 Git diff/status。执行令
禁止的全部事项均未执行：Node、Python、解析器/AST、import、check、test、build、model、
HTTP、GUI、SSH、Env/Key、DPAPI、root driver、进程探测、安装、准备脚本和新 private25。

正式交回写入前共有 32 次 Shell 调用：27 次成功、5 次非零。非零分别是 `dsh` 子模块
权限拒绝、一次通配哈希路径错误、两次 `git diff --no-index` 因确有差异而按 Git 约定
返回 1，以及一次 PowerShell 管道语法错误；这些均未产生写入。

未运行一次本消费者，未读凭据，未启动产品运行时。产品运行期计数为 consumer 0、Agent 0、
Session 0、Context 0、Task 0、Case 0、model request 0、HTTP request 0。这个 0 不描述
CLI/脚手架子进程遥测。

## Git 与阻碍

- Git 全程只读；没有 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 普通 `git status` 仍因共享 worktree 的 `dsh` 子模块外部 `.git` 路径权限被拒绝；未改
  ACL、审批、锁或 writer 锁。使用 `--ignore-submodules=all` 的窄范围状态可完成，新目录
  仅显示四个未跟踪文件。
- 既有 dirty 全部保留。本执行者未修复或清理 `index.lock`、权限拒绝或共享 dirty。
- 原 `A070224` 作者记录的 100 条命令、85 条成功、15 条非零和产品运行期 0 继续作为历史
  事实保留；原作者包、旧正式文件和实际运行历史不改写。

## 根控后续

根控须在完整源码、依赖、setup/finally 和逐字节反向审阅后，自行决定并执行有限 admission、
ESM/绑定检查和一次 canonical actual。实际运行后再人工审阅实际问题措辞、引用/ hints、
草稿质量和全部关闭结果。本交回到此停止，没有继续运行任何消费者。
