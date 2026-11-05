# 线 B 交回：T18 诉讼文书观察器契约返修

交回时间：2026-10-29 19:42:55 +08:00

## 结论

任务：`B-T18-litigation-observer-contract-20261029-192800`

状态：`SOURCE_COMPLETE / AUTHORED_NOT_RUN / ROOT_REVIEW_REQUIRED`

本轮只完成有界源码修改和只读静态核对。按正式执行令，未运行 Python、Node、
TSX、TypeScript 编译器、测试、构建、HTTP、模型、GUI、SSH、DPAPI 或产品流程；
未运行完整消费者和有限回放。原始实际会话证据未重放成绿色。

Git 全程严格只读。未执行 add、commit、rebase、stash、reset、clean、checkout
或 push，因此没有交付提交 SHA。当前分支为 `line-B`；冻结的 42 项 tracked
dirty 保持原状，本轮只新增一个未跟踪证据目录。

## 交付文件

证据目录：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\LitigationQuestionObserver-20261029-192800\`

| 文件 | 字节 | SHA-256 |
|---|---:|---|
| `native-litigation-docs.mts` | 127135 | `7e615458396fefcba57bb6f23647f9e40a6263b046705b9a5012fe48256d3ec3` |
| `b-service-litigation-docs.py` | 46327 | `c9e8faa0b998eff4ed893a439e5030a76c0a04dda8e438e6bc2af563e29105f2` |
| `literalfixed-inputs.json` | 11264 | `95e572a30ebde10a687a50e27c12723b32a8bb862f933f70bbde487fa87af00a` |
| `observer-replay-finite.mjs` | 23471 | `c323daeb49783585704f03f6c228fe1a67fe4c6b548b5925f445641dec81305c` |
| `README.md` | 5586 | `2139b8f3e54072c860598c49fc71422bc1e1072e1ce637999b39010b30ab3587` |

B 服务副本与冻结输入逐字节相同：

- 输入/输出均为 46327 字节。
- 两侧 SHA-256 均为
  `c9e8faa0b998eff4ed893a439e5030a76c0a04dda8e438e6bc2af563e29105f2`。

## 源码修正

1. `QuestionCapture` 把回调入口次数和成功回调次数分开：
   `attemptCount` 在回调入口递增；`successfulCallbackCount` 只在四个 ID、正文和
   options 全部通过校验，且四个结构化答案完整、即将返回时递增。授权答案文件在
   这些校验之后才读取，成功读取最多一次。
2. 回调拒绝记录新增
   `origin: production | synthetic_callback`。合成回调只接受冻结实际会话中的
   精确文案：
   `Error: UNSUPPORTED_SYNTHETIC_QUESTION: the joint ask must contain the exact four IDs`。
   任意错误、合法参数上的回调错误、错误答案、缺失答案和第二个成功回调仍失败。
3. 新增窄范围纯观察器 `observeReadTimeline`，分别保留
   `rejectedCalls` 与 `successfulReads`。问句观察先完成，再观察读取；成功读取
   必须晚于最后一次必问答案。实际旧事件中任何 pre-answer 成功读取都会使
   `successfulReadsAfterRequiredAnswers=false`。
4. pre-answer 的读取错误仅在结果确为错误、尚缺声明 ID，且文案精确匹配未来
   `questionsBeforeReadDenial(missingIds)` 的前缀时记作生产拒绝；其他错误仍失败。
5. 后续材料源码解析、覆盖和“引用材料须先读”检查只使用成功材料读取。被生产
   拒绝的读取仍保留在报告，但不作为数据解析。
6. setup 已改为要求未来 current LegalAgent 导出
   `questionsBeforeReadDenial`。当前冻结旧 private 构建没有该导出，因此本消费者
   在本轮按设计不可运行，等待 root 后续新版绑定。

`TASK_NAME`、`REVIEW_ID` 已改为本轮新身份。`b-service-litigation-docs.py`
全部字节保持不变。

## Manifest 反查

与冻结 `literalfixed-inputs.json` 相比只改了允许的四个字段：

- `task` -> `B-T18-litigation-observer-contract-20261029-192800`
- `consumer.path` -> 本轮自有证据副本路径
- `consumer.bytes/sha256` -> 上述 127135 字节和新 SHA
- `bService.path` -> 本轮自有证据副本路径

`approvedInputs`、source pins、3 份材料、任务、Skill、参考要点、26 个
dependencies、4 个 compiler-private 项、3 个 runtime executables，以及 B 服务
字节/SHA 均保持不变。source pins 仍为 346 项、53548 字节、
`6b07e5773dc77c6b13fd6688e4febca847af250f8a37ce13d3a4af4d581c5205`。

## 冻结实际证据

实际 JSONL 路径：

`D:\Lawbeach\lawbench-coord\T18LitigationObserverInput-20261029-192800\original-actual-session.v4.jsonl`

身份：197963 字节、68 events、SHA-256
`c449784caf29430657eb65ab5265a155027f68857f4304312a8ac8b05a773f1b`。

未修改事件、seq、UUID、R、request/response history。已核对：

- 原 run `keDSBH` 关闭 119.094 秒；natural 1/10；model 200；68 native events；
  7 complete；OS gone；Listen 0。
- 坏回调为 36/37，实际来自 synthetic callback，不是 production 七门。
- 唯一成功的四 ID 回调为 41/42。
- Wiki 读取从 18 开始，材料读取从 27 开始，均早于答案 42。
- 成功保存位于 46/47、51/52、56/57、61/62。
- 四个答案早于首次成功保存的事实保持不变。
- 最终结论仍是读序 **RED**：
  `wiki18/material27 < answers42`。没有放宽断言。

冻结旧失败包仍为
`96859e21516083328c9c256dc073da438e4719142a4401af238046ca120f5d1e`。

## 有限回放脚本

`observer-replay-finite.mjs` 使用冻结 TypeScript
`569177652966bd528c319171c7dd22860dbf72bde116cbc4f644f1d02bb12e39`
（9144216 字节），从新消费者中只抽取实际观察函数和必要纯 helper，经
transpile 后在私有 VM 中运行。脚本不 import consumer、Agent、Session、SDK、
provider、service 或模型；只读冻结 JSONL，stdin 收到
`ROOT_OBSERVER_RECEIPT` 后只写证据目录内指定的新 result JSON。

脚本预期：

- 识别 36/37 为 `synthetic_callback`；
- 接受 41/42 为唯一成功四答案；
- 验证 46/47 起的保存时序；
- 将 18/20 的 Wiki 成功读取和 27/29/31 的材料成功读取保留在 timeline；
- 判定实际读序 RED，不宣称产品通过。

exact-denial 保留与任意拒绝失败使用明确标为 `UNIT` 的内存变体；不冒充
producer 或 native API 证据。

## 验证边界与遗留

本轮只做只读静态核对：输入哈希、B 服务逐字节一致、manifest 允许差异、
回调计数/拒绝来源、读取过滤和精确文案出现次数均已核对。

未做 TypeScript 编译、ESM 执行、单元测试、完整消费者、模型重跑、原生会话、
API/JSONL 重开、OS 关闭、业务验收或打包。故不得把本轮写成产品绿灯。

后续仍由 root 完成：

1. 新版 8 个 private、4 个 imports、4 个 pins 的 data-only 绑定；
2. 在绑定后的版本中审阅并运行 `observer-replay-finite.mjs`；
3. 后续原件恢复实跑，取得 post-answer Wiki/material 成功读取、保存、JSONL
   重开和 OS 关闭证据；
4. 对实际读序红灯作产品修复并重新实跑，不能把本观察器改成接受旧读序。

## 执行纪律偏离

任务要求的每个 shell 调均应使用下面唯一精确启动器且 `login=false`：

`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`

实际有 7 次只读取证调用误写为 `bash`，均被 sandbox 拒绝；另有 2 次只读调用
的 shell 路径/参数串写错。上述误调用没有执行任何写、Git、锁、ACL、审批或
环境变更；真正的目录复制及所有文件写入均未通过这些误调用进行。该偏离已在此
如实保留。
