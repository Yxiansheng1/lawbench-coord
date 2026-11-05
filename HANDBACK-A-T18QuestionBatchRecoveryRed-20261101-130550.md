# A线 T18 必问闸门漏项恢复红测交回

- 状态：`AUTHORED_NOT_RUN`
- Runtime：`0`
- 新增测试用例：`3`
- 测试文件总用例：`8`
- `runtime0`：未执行任何测试、编译、解析、HTTP、模型或 GUI 操作

## 修改范围

仅修改：

- `D:\Lawbeach\lawbench-A\dsh-ext\tests\defense-question-gate-20261029-172117.spec.ts`

在文件末尾追加一个 `describe`，使用 `it.each(QUESTIONS)` 分别覆盖 `direction`、`stage`、`key_points`。原测试的全部既有断言未改动；修改后前 20288 字节的 SHA256 仍为：

`7fff83589539e15b622218d34a3053d0c0bd7748d02d2cf12075a120d2dba1c8`

修改后测试文件：

- SHA256：`b0c1c4eefdff0a97c83966bdab10c00971fe0f633bcfd1650c0048edb9e4d72c`
- 大小：`22380` 字节

## 红测行为

每个参数化用例独立启动真实 `ToolRuntime` 接线，进入任务后只通过原 `ask_user_question` API 声明一个必问 ID。测试断言：

- 部分提问返回 `isError`。
- 回复包含 `ask_user_question`、字面量 `questions`，以及全部三个尚缺 ID。
- 回复不包含误导性的草稿提交前缀“提交成果前必须先取得律师对必问问题的真实回答。还缺：”。
- 部分提问零回答回调、零 Core 写请求，且不能解锁草稿写入。
- 随后用原 API 一次提交全部三项结构化问题，成功且回答回调恰好一次。
- 真实观察到回答后，原 `case_save_draft` API 成功，Core 恰有一次门控写请求。
- 每个用例均在 `finally` 中 `await env.dispose()`。

未 mock 新诊断、守卫或 TaskState，未预置已答状态，未放宽既有闸门。

## 产品与边界

产品文件 `D:\Lawbeach\lawbench-A\dsh-ext\agent\index.ts` 未修改：

- 大小：`59536` 字节
- SHA256：`2d19b3b00caaaf417f6e513d002d082613b68a1be667affad93382a5a1ede48b`

本运行未执行 Git 写入或元数据操作，未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。未运行测试，故不声明 RED/GREEN 的真实运行结果。
