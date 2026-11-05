# ToORCH-A-Delivery-T32NativeConsumer-20261025-171344

状态：`PREPARED_ONLY`。A 线已完成有界修改，未由作者运行 Vitest、tsc、pytest、collect、parser、build、serve、prepare 或 selftest，因此本交回不构成验收，打包继续 `HOLD`。

## 修改范围

- 新增 `D:\Lawbeach\lawbench-A\dsh-ext\tests\t32-native-draft-http.spec.ts`。
- 新增本交回文件 `D:\Lawbeach\lawbench-coord\ToORCH-A-Delivery-T32NativeConsumer-20261025-171344.md`。
- 未改源码、服务端、配置、依赖、lib、fixture 或既有测试；未执行任何 Git 写入。

开工核验时目标测试文件不存在。主仓 `git status --short` 在只读子模块边界返回：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

按执行令未修复权限、未改审批、未拆 writer 锁，也未暂存或提交。除上述两份允许文件外未写入既有工作树。

## Consumer 与资源

测试从 `../shared/core-client.ts` 导入真实 `CoreClient`，以 `new CoreClient(..., true, 5_000)` 使用项目契约校验；没有 import、copy、mock、override CoreClient，也没有直接 import Python server 或产品 app。

必填环境变量：

```text
LB_NATIVE_DRAFT_ROOT
LB_NATIVE_DRAFT_PORT
LB_NATIVE_DRAFT_TOKEN
```

缺任一项直接失败，不 skip。根目录必须是绝对路径，且是下列正式 runs 目录的直接子目录：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\NativeDraftEntry-20261025-165327\runs
```

端口必须是 `1..65535` 的整数。Token 只保留在测试内存和请求头中，不打印、不写文件；台账与 consumer 日志均断言不含 Token。测试仅访问 `http://127.0.0.1:${port}`，原始 HTTP fetch 和真实 CoreClient 均为 5 秒超时。

## 有界载荷与流程

固定会话：

```text
11111111-1111-4111-8111-111111111111
```

固定标题：`T32SyntheticDraft`。

v1 为 54 bytes，LF 原文：

```text
# T32 synthetic draft

Synthetic local document only.
```

SHA-256：`cabff0ec4478c1eab2800d1d5df1d5139d6c245bfc08f3762092443155d8f0ae`。

v2 为 61 bytes，LF 原文：

```text
# T32 synthetic draft

Synthetic revision for local UI save.
```

SHA-256：`7d090ef6fbda9e38b17f1befe5e1c4a2bb8f6db2c2bf45031eb70e52e19a22cc`。

唯一用例的顺序：

1. 原生 `/api/case/open` 一次，绑定 `root/case`。
2. 真实 CoreClient `task/begin` 一次；断言 `local`、`skill:null`、实际原生 task id 与绑定案件。
3. 在有效 tool 前发送 `case_search` 和错误参数的原生 draft 请求，均须 403 且不消费认领。
4. 真实 CoreClient `tool` 一次，载荷固定为捕获 task id、`case_save_draft`、固定 title/content；断言原生 v1 路径、version 1、citation check 通过和零 coverage。
5. 只读核对 v1 的 54 bytes、SHA、普通单链接小文件，以及原生 `result.json` 已登记 v1。
6. 重复 tool 和结束前合法 documents-save 各须 403，不消费后续认领。
7. 真实 CoreClient `task/end` 一次，参数 `aborted/model_calls=0/tool_calls=1/elapsed_s=0`，返回 `cancelled`。
8. 错误 source path 的 documents-save 须 403；随后以真实 HTTP 向 `/api/documents/save` 一次发送绑定 case、捕获 v1 path 和固定 v2 content。
9. 断言返回同一 task id、准确 v2 path/version 2、citation check 通过、零 coverage；重复保存、settings PUT、progress 均须 403。
10. 只读核对唯一 task 目录、三个 JSON 加 `草稿` 目录、草稿目录仅 v1/v2；全部普通文件无符号链接、单链接、64 KiB 内，草稿另受 4 KiB 限制。v1 保持 54 bytes/原 SHA，v2 为 61 bytes/原 SHA。
11. 断言 task 为 `finished/local/nullskill` 且案件、会话匹配；result 为 `cancelled`，usage 为 `model_calls=0/tool_calls=1/elapsed_s=0`，drafts 精确登记 v1 后 v2，reads/citations 为空。
12. 台账只允许 `disposition/elapsed_ms/method/path/status` 元数据；恰好五个 200 原生请求：case-open、begin、tool、end、documents-save；其余负向请求均 403 且不标为 `native_app`。
13. consumer 日志无请求/响应契约错误，三个真实 CoreClient 调用依次为 begin/tool/end。
14. 自然等待 final metadata 最多 25 秒、loop-closed 最多 5 秒，用例总超时 40 秒。断言源码与 fixture 未变，credential getter、keyring、outbound、OCR、lifespan、Retainer 均为零/未启动；listener、Net、产品日志和事件循环均关闭；必要的 AnyIO worker 不做无依据禁止。

测试不写 fixture/index/result/history/rollout，也没有手工造 task/result/history 文件。源输入身份沿用执行令与 README 的只读复核：`server.py` 67,606 bytes，SHA-256 `30dc704d919bf8a242d3a4e5a75f19866da66dcbff8cee8c57ae754cca3cd62f`；仅 ROUTES 与 Firewall 变化，products/E50/security/close 未触碰。

## Root-only 验证命令

由主编排准备一次全新的原生 root 并启动 20 秒 server；不得复用旧 served root。在 `D:\Lawbeach\lawbench-A\dsh-ext` 执行：

```powershell
E:/node/node.exe A/dsh/node_modules/vitest/vitest.mjs run --config vitest.config.mjs tests/t32-native-draft-http.spec.ts --maxWorkers=1 --no-file-parallelism --cache=false
```

本交回只覆盖 native API 与真实 source consumer 的待验证入口，不是 GUI、Agent、模型、草稿法律质量或最终验收。缺失环境或不可达 server 必须失败，不能绿色跳过。
