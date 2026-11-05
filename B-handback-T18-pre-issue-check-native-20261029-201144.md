# B 线交回：T18 pre-issue-check 原生样本 01 预交付检查

日期：2026-10-29  
状态：`AUTHORED_NOT_RUN / READY_FOR_ROOT_SOURCE_REVIEW / RUNTIME0`  
项目状态：`Gate 1 INCOMPLETE / full T18 INCOMPLETE / Packaging HOLD`

| 类型和状态 | 内容 |
| --- | --- |
| 做了什么 | 从通过且源码不变的 defense 基座复制并作最小场景适配，交付四材料加 canonical 上游草稿的 pre-issue-check consumer、有限 B service、冻结 manifest 和 README。 |
| 目标是什么 | 为 ROOT 复核后进行唯一一次全新 pre-issue-check 实际运行准备可冻结、可反审的输入。 |
| 在等什么 | 等 ROOT 完整复核本交回、全部工具调用和源码差异，再决定执行一次全新的匿名 stdin 实际运行。 |
| 卡在哪 | 作者无权执行产品、模型、HTTP 或测试；业务质量仍需实际运行后由 ROOT 人工判读。 |

## 唯一新目录与文件

目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\PreIssueCheckNative-20261029-201144\`

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-pre-issue-check.mts` | 153233 | `d67d4ee3f79f6654f01e62c38c88b02764e8a6402efd0e164d893d76b7d06430` |
| `b-service-pre-issue-check.py` | 53737 | `58f86c15afb92ea287e9838a6d9a179a5e06b2197148279359ad1ca2a7c00924` |
| `literalfixed-inputs.json` | 13570 | `516092888809b9e06794bd9fa1277a52a236e31b1533999ed7e3dfd2f923c33f` |
| `README.md` | 5307 | `ac3b95dd8e0d8946d90f79516b35690caa195e6c7e63fe8d3fe73423b9298aca` |

本交回件：

`D:\Lawbeach\lawbench-coord\B-handback-T18-pre-issue-check-native-20261029-201144.md`

目录不包含运行目录、测试输出、截图、凭据或案卷副本。

## 冻结输入

三份 defense 基线在复制前与
`T18PreIssueNativeInput-20261029-201144` 快照逐字节一致：

| 来源 | 字节 | SHA-256 |
| --- | ---: | --- |
| `native-defense-opinion.mts` | 148710 | `7d20cbed7b28602f3fd37ca52656440e09eb0651782339be12e0868588369cda` |
| `b-service-defense-opinion.py` | 53717 | `7b96e25683a9f6f26587fb6a5e8d4fce059b4a6fa6b02698f44e5f07ac446049` |
| `literalfixed-inputs.json` | 11741 | `0459c97f81f8a9020a6e655e63e5cae6bc22cdd5aa564198f1c66c1969f8b6f7` |

当前 346 项 reviewed B source pin 全部读回并逐字节匹配。四个当前私有编译项也按
`root-approved-current-private-four.json` 逐字节匹配：

| 对象 | 字节 | SHA-256 |
| --- | ---: | --- |
| `lib/agent.js` | 554518 | `28b1e320fd57c0b07396ad0916c2bb2ad6faacd87f6cee451e74a7368f6fb866` |
| `lib/host.js` | 902499 | `ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b` |
| `package.json` | 1257 | `3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794` |
| `manifest.json` | 58197 | `79cffb10b40f0f9ba449b7c4087c14cc1869353af305a4b95678adb9fc52b296` |

批准输入为八条原始行：任务、Skill、四材料、canonical 上游草稿和测试要点。八条
SHA-256、字节数和 `mtime_ns` 均由 `approved-inputs.json` 固定；没有用动态哈希替代。

## 有界修改

只做了以下场景适配：

1. 新 Skill、任务、样本、标题、两项问题 ID 和四材料集合。
2. canonical 草稿按 `成果/民事起诉状草稿.md` 作为唯一 `task.inputs`，请求作用域保持
   `null`，不准备材料 scope。
3. 主参数改为 `analysis / 中思考 / 128K / 32768 max_tokens`，32 次模型调用、
   48 次工具调用、45 分钟和 1200000 ms 请求超时不变。
4. 两个绝对 compiled import 只重绑当前 agent/host；其余 SDK/native 依赖由原 manifest
   保留并逐项哈希验证。
5. 输出只允许新问题清单 title `出稿前审查-民事起诉状草稿`，机器检查五个规定一级
   小节均存在、顺序正确且非空，不检查样本金额、日期、姓名或结论。
6. 联合确认恰好一次成功；任何回答前成功材料/Wiki 读取会使运行 RED。生产端精确
   拒绝只作为被阻止尝试记录，拒绝正文不当材料数据解析。

当前八个产品问答门不包含 pre-issue-check；没有新增第九门，也没有把 consumer 的
观察器说成产品门已经生效。若当前产品允许回答前读取，实际运行必须保留 RED。

## 静态验证

| 检查 | 结果 |
| --- | --- |
| 冻结 defense 三输入 | 3/3 字节和 SHA 匹配 |
| 当前私有编译四项 | 4/4 字节和 SHA 匹配 |
| reviewed B source pins | 346/346 匹配，0 失败 |
| manifest 固定条目 | 47/47 存在且字节/SHA 匹配，0 失败 |
| manifest 结构 | 四材料、26 依赖、唯一 pre-issue-check Skill 依赖、四编译项、三运行时 |
| 既有 tracked dirty pin | 42/42 保持不变，0 失败 |
| compiled imports | 恰两处，均为当前私有 agent/host；旧路径 0 |
| 旧场景/样本事实指纹 | 新三文件中 0 |
| 当前 agent 导出 | 静态文本确认 `invalidQuestionAskDenial`、`questionRequirementDenial`、`questionsBeforeReadDenial` 均存在并导出 |
| diff whitespace check | 两份源码均无 whitespace error；命令因存在文件差异返回 1 |

这些静态结果只证明输入、路径、结构、哈希和文本边界，不证明代码可运行，更不证明
问答、材料读取、引用或业务质量。

## 未执行

作者侧运行期计数为 0：

- Node、Python、TypeScript、TSX、AST、解析器、导入、检查、测试、构建、打包：0。
- HTTP、模型、GUI、SSH、DPAPI、环境变量 Key 读取、进程探测：0。
- Git add、commit、rebase、stash、reset、clean、checkout、push：0。
- 安装、消费者接线、旧编译件运行、旧 prompt/输出/session/task 复用：0。

没有读取凭据或真实案卷，没有修改产品、Skill、contracts、测试、旧证据、权限、锁、
审批、ACL 或全局设置。

## 阻碍与执行偏差

第一次只读 `git status --short --branch` 因 `dsh` 外部 `.git/worktrees/.../modules/dsh`
权限拒绝而失败；随后用 `--ignore-submodules=all` 只读取得 B 线状态，没有修权限、
ACL、锁或审批。Git 写入不在授权内，未尝试。

本 session 有若干次工具调用误传了 `bash` 或短 `pwsh` shell 参数。所有误传 `bash`
均在 MXC 启动阶段被拒绝；一次短 `pwsh` 成功执行了只读 `Get-Content`；没有一次误调用
执行 Node、Python、测试、模型、Git 写入或产品命令。作者不伪造无法从分派文本可靠
还原的累计命令总数，完整原始调用由 ROOT 按本会话工具轨迹审计。这是执行纪律偏差，
不改变文件字节或交回结论，但应保留在累计复核中。

## 下一步

ROOT 完整复核本交回、源码差异、manifest 反演、工具轨迹、冻结输入与 dirty 保全后，
如批准执行，应只启动一次全新 consumer，使用现有匿名 stdin 凭据路径，不复用旧模型
输出或任务历史。实际运行后仍须人工检查：

- 两项预填是否向律师展示确认；
- 是否完成至少 10 处或全部事实回读，并单列未核对出处；
- 七项检查、五个小节、待补项和法律依据清单质量；
- 原稿未改、新问题清单标题正确、真实 citation 全部回到当前 source GET；
- JSONL 重开一致，所有私有进程、监听和资源正常关闭。

不得把本交回、静态哈希或未来单次技术运行自动提升为业务、法律、Gate 1 或完整 T18
通过。

Response ID：`B-T18-pre-issue-check-native-20261029-201144`  
Response log path：`D:\Lawbeach\lawbench-coord\B-handback-T18-pre-issue-check-native-20261029-201144.md`
