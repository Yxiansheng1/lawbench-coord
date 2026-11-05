# A 线正式交回：T18 反馈运行时 pins（20261028-221120）

结论：`DATA_ONLY_BINDING_COMPLETE`。A 线已在授权写入面内完成六行数据绑定和消费脚本的两个 URI 加一个固定输入 SHA 常量；Runtime 执行次数为 0。Gate 1、完整 T18、项目完成和 Packaging 仍为 HOLD。

执行令：

`D:\Lawbeach\lawbench-coord\A-T18-feedback-runtime-pins-order-20261028-221120.md`

## 可收货写入面

既有文件只修改以下两个：

| 文件 | bytes | SHA-256 |
|---|---:|---|
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\fixed-inputs.json` | 17,197 | `bd26b55780db28d3eeb9d47adc60034edf76a340a9111eb18d93fb5af94d253e` |
| `D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\native-contract-workflow.mts` | 107,449 | `4437a994e8990c9179cff973cf82d6cc70c0a75d444c9e3281bb32ba3637d790` |

新增说明：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\QuestionGateContractWorkflow-20261028-191702\T18-feedback-runtime-pins-20261028-221120.md`

该说明为 5,817 字节，SHA-256 为 `1195bf77210d26f78bab6d6f2b0e2eb3001c8f346b46dbe5fb239f11fdf52cbb`。

本交回件亦为本次新增文件。除上述三个文件外，未修改 README、旧交付说明、源码、产品代码、测试、Skill、schema、B 线文件、构建器、配置、编译输出或私有运行时产物。

## 绑定内容

`fixed-inputs.json` 中六条既有记录已按批准输入绑定：

- 源码 `dsh-ext\agent\index.ts`：46,028 字节，`5e53fbe9d1833c6533143a2e87d7c39a4f2cf1ce4ede4b421572664aab9fdcfb`。
- 源码 `dsh-ext\agent\task-state.ts`：21,264 字节，`fa2467257b68f274bf4e734ea7116dbce20d15327b66952ae01ac6e5a708479b`。
- 私有 `agent.js`：552,245 字节，`487335ef8c97c7171abf42b082835667af62c285bee9ba8320f5f08bbb6f1a17`。
- 私有 `host.js`：902,499 字节，`ca849dcf561fdeaf37858dc280b1ef460dbfaef86c1c95c452d6f2ce11aae56b`。
- 私有 `package.json`：1,257 字节，`3d6bcaf2b875d7c2e19d1e982de019f07035866f117693749e80b9c0dc5ee794`。
- 私有 `manifest.json`：58,195 字节，`2ea2b754f9c9bc787e8e692fcce4daa73724c61d48748cbbbe568ea218c8f3c1`。

四条私有记录的 path 均指向 `DraftFeedbackPrivateBuild-20261028-214724\private-output-20261028-220815`。最后一条 `manifest.json` 的 path 严格按批准 JSON 原文，没有自行补中间包目录。

消费脚本只修改：

- `agent.js` 的绝对动态 import URI：旧私有构建改为 `DraftFeedbackPrivateBuild-20261028-214724` / `private-output-20261028-220815`。
- `host.js` 的绝对动态 import URI：同上。
- `FIXED_INPUTS_SHA256`：改为 `bd26b55780db28d3eeb9d47adc60034edf76a340a9111eb18d93fb5af94d253e`。

## 验证证据

- 批准六行输入文件为 1,668 字节，SHA-256 `062e915b6bf0fff99a2b89c5e03259b8a52ec034a22cec73c0f8992793dd520a`。
- `fixed-inputs.json` 可解析，`dependencies` 仍为 54 行；六个批准 path 均唯一命中，path、bytes、SHA-256 全部匹配；旧私有构建路径剩余 0 行。
- 六行在内存中逆替换后恢复原 17,193 字节和 SHA-256 `1119535d0bff70be82b214c3956437c2922fb4874ac050b42b7d8eed8d13488f`，证明其余字节未变。
- 两个 URI 加一个 SHA 常量在内存中逆替换后恢复原 107,447 字节和 SHA-256 `4228076465001f210f18d5bc90542f7a1bb6eb0dbd04c424961b4a5c92163cf4`，证明其余字节未变。

实际非零退出和纠错：

- `git status --short` 退出 1，原因是受保护的 `dsh` worktree 子模块 `Permission denied`；未修权限、未改锁。已用只读 `git status --short --ignore-submodules=all` 退出 0 核对。
- 两次内存逆替换草稿依次因 PowerShell 字面换行写错、片段与文本不符而退出 1；均未改文件，改正后最终逆替换通过。
- 一次核对命令曾误填 `shell=bash`，系统直接返回 `ACCESS_DENIED`，退出 1；未发生读取或写入，之后全部恢复指定原生 PowerShell。
- 核验中曾短暂按错误理解补写最后一条 path，随后重读批准 JSON 并恢复原文；最终六行精确校验和两项逆替换均通过。

## 限制和主线后续

未运行 Node、TypeScript、Vitest、Python、parser/AST、import、collect、build、prepare、selftest、serve、probe、HTTP、模型、GPU、GUI、SSH、DPAPI、Key、Keyring、环境凭据、真实案卷、发票主账、安装器或 monitor。未重跑旧 admission，也没有把旧 admission 当作新功能证据。既有 `run-znIBMz` 严格引用失败和 redline 0 仍记为未全通过。

主线后续仍按执行令：先完成全 459 条 pins、BAST、ESM 复核，然后只跑一次新的原合同保存 DPAPI 匿名 stdin 路径。A 线本次没有也不会把该 runtime 绑定视为业务通过。

Git 严格只读：未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。工作区原有大量 dirty/untracked 内容均保持未整理；子模块权限阻碍未尝试修复。
