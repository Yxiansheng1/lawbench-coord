# A 线交回：T31 UI 批次到本机 HTTP

工单号：T31-ui-host-batch-http-20261026-132736

分支：`line-A`

只读基线 HEAD：`a23271abee333a9a256fd46a3141da16975c2380`

本运行遵守只读 Git 边界，没有提交 SHA。

## 正式状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 新增唯一源码级测试和证据 README；测试覆盖实际 UI 内存批次、实际 Host `callApi`、当前冻结 native HTTP 的两次同根引用导入。 |
| 目标是什么 | 根侧独立复核后，在全新 B 运行根上只跑这一次测试；目标是取得三项真实材料身份、重复导入全选保持和取消改选的运行证据。 |
| 在等什么 | 等根侧完成源码复核并提供新根的 `LB_BATCH_HTTP_ROOT`、`LB_BATCH_HTTP_PORT`、内存 token；信号到达后准备一次、启动一次、运行一次并关闭服务。 |
| 卡在哪 | 当前无产品阻碍。作者运行器明确禁止运行测试、服务、HTTP 和解析器，因此本件按令为 `NOT_RUN`；这不等于测试通过或失败。 |

## 新增路径

- `D:\Lawbeach\lawbench-A\dsh-ext\tests\t31-ui-host-batch-http.spec.ts`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\UiHostBatchHttp-20261026-132736\README.md`
- `D:\Lawbeach\lawbench-coord\A-handback-T31-ui-host-batch-http-20261026-132736.md`

测试 SHA-256：`69cc1c7d89de7174012e579a5b8950064b701ca664ebb213160c4027070d5032`

README SHA-256：`6895eba5bb2283c465fcce60f2c8c893f3bf046611b4ff71d1e973f2567c950f`

## 测试覆盖

- 实际 `caseOpen` 请求为 `{ path, template: null }`，用真实返回调用 `rememberCase`。
- 两次实际 `runRefImport()` 使用同一案件、同一目录根、同一界面会话键。
- 第一次要求 native `added: 3`，批次从真实 `materialsList` 得到三份当前材料的 ID 和名称，三项全选。
- 第二次要求 native `added: 0`，真实材料列表、三份 ID、版本 SHA-256 和来源文件身份保持，批次仍为三项全选。
- 实际逐项取消后为两项，全选后为三项，取消整批后批次与阻断态均消失。
- 开案一次、导入两次、材料列表两次；请求账本不得出现 core、task、范围或设置写入。
- 凭据 getter 调用为零；来源 TXT 和 JPEG 的 size、SHA-256、mtime 前后一致。

## 边界

这是 `jsdom` 中真实 UI store 函数加实际 `LawbenchRemote.callApi` 与本机 TCP 的源码级切片。它不证明 GUI、原生目录选择器、DSH Gateway IPC、NativeSession、原生请求号 R、模型、任务、OCR、默认批次或完整 T31。

没有运行旧 26 项探针、旧 mocked 单测、全量测试、构建或安装。既有已通过证据只在对应源码未变时继续引用；本测试不把它们的源码结论冒充为本次运行结果。

## 依据与验证

- 正式执行令：`D:\Lawbeach\lawbench-coord\T31-ui-host-batch-http-order-20261026-132736.md`
- 根预保全：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31UiHostBatchHttp-20261026-132736`
- 13 项 A 输入在当前磁盘的 SHA-256 和字节数全部匹配 `before-manifest.json`。
- 冻结 B 入口 SHA-256 匹配：`10c3a8fb366d340624accdb8313742a3219230dda98df0a902c955d0caef8ee4`。
- 静态文本检查：测试恰有一个 `it()`；没有 `makeMaterialSubmissionHook`、`requestScope`、`taskCreate`、`NativeSession`、直接 `fetch`、文件选择器、剪贴板或 CDP；两个新文件无行尾空白。
- 根侧运行环境、唯一命令和 `prepared.json`、`requests.ndjson`、`final-metadata.json`、`loop-closed.json` 核对项见证据 README。

## 副作用

- 只新增上述三个文件。未改产品代码、基础配置、既有测试、fixture、B 入口、启动器、护栏或运行时。
- 既有 `line-A` tracked dirty 和未跟踪资产保持原样；没有清理、覆盖或暂存。
- 未写真实 token、Key、密码或真实案卷内容。

## 工具偏差

- 读取阶段有五次只读 exec 被误填为 `shell=bash`，运行器在执行前以 `E_ACCESSDENIED` 拒绝；没有命令运行或写盘。
- 另有两次 PowerShell 只读格式化命令因 `foreach` 直接接管道报语法错误，未写盘。
- 其余 exec 均使用指定 native PowerShell，`login=false`。
- 未执行任何 Git 写命令，也未尝试修复锁、权限、ACL、沙箱或审批。

## 未做与降级

- 未运行 Vitest、`tsc`、解析器、AST、测试收集、prepare、serve、HTTP、探针、GUI、模型、构建或安装。
- 无测试红绿、根侧最终元数据或 GUI 真人结论。
- 未提交、未暂存、未合并、未推送。

## 下一步建议

根侧先独立复核测试和 README；随后按 README 在全新 `T33-host-YYYYMMDD-HHMMSS` 根准备一次，向测试进程仅注入当前服务的内存环境值，运行唯一测试一次，关闭服务并核对协议与最终元数据。若测试未运行，本件应保持 `NOT_RUN`；若运行，应另存命令、退出码、完整原始输出和根侧 verdict。

Response ID: T31-ui-host-batch-http-20261026-132736
Response log path: `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\UiHostBatchHttp-20261026-132736\README.md`
