# A → ORCH：T34 core route contract 交回

时间：2026-10-25（Asia/Taipei）。状态：有界修改与正式文件交回完成，等待 root 独立审查和有限动态验证；不是开发构建或收货结论。

## 1. 结论

按 `ORCH-ToA-T34CoreRouteContract-20261025-143529.md` 完成两份已审契约的逐字节对齐、生成器对应两处可选 `route` 定义和唯一真实消费者 spec。既有 dirty 全部保留。HEAD 仍为 `a23271abee333a9a256fd46a3141da16975c2380`，staged 为空；按令没有 Git 写操作，无提交 SHA。没有 build、lib、产品源码、服务、GUI、Host/lifespan、网络、模型或凭据操作。

## 2. 四目标 SHA-256

| 目标 | before | 当前 |
|---|---|---|
| `contracts/core/task_begin.schema.json` | `5250EA908D1B5281D297DC8BEEAA02744D4AC1F23630BA0CDA2796D4A578EC51` | `B1DCBBFC9DE622D8C215D5A9AB9EB9BEBA470408C3AC139D46510A85F32AA318` |
| `contracts/files/task.schema.json` | `FD9F944A58B8863924463D1FFAEDC53B2B7E50E1229553882FB1B78A151DACCD` | `868DA39A8F462D6C4F6F292CFE7881E889F7C84C59CC38E968735EE6D2CCA0C5` |
| `contracts/_build/gen_schemas.py` | `F50D76B599D32650FEF1029F573E7DE6AAEAA69292D43963C327CADB65FB5E8C` | `B984719A5EC22F09B56EF8933CED33B74614184DAD9D6FBBC1E0C884B63A9588` |
| `dsh-ext/tests/t34-core-route-contract.spec.ts` | 不存在 | `CCA0D590B16308011FB04142A8C07E8597A4FCC9100730D45DB0433F8B090D70` |

两份 schema 当前 SHA 与固定 B 输入完全相等，原始字节比较均为真。生成器相对 dirty 原件只有 `core/task_begin` 响应和 `files/task` 两处 hunk；VERSION `1.6`、`main`、入口及已对齐的 `task_create`、`task_current`、`settings` 未改。没有运行生成器 `main`。

## 3. 消费者测试与证据页

新 spec 使用现有真实 `CoreClient` 默认校验和进程内 `fetch`，只接受 loopback `17650/core/task/begin`；覆盖 local、external、旧无 route 的接收，以及非法 route、value 额外字段、响应根额外字段的拒绝。task 文件同覆盖三类接收与两类拒绝。未 import Vitest，未加依赖、框架、假服务或 Host 生命周期。

六节证据页：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\CoreRouteContract-20261025-143529\README.md`，SHA-256 `220D6F968257C3FFEF3AE7EF0746B303AD2A6D07B6EDE823B4D56ABDC38DBACA`。

## 4. 已做核验与证据复用

已做固定源/目标 SHA 和原始字节比较、两份 JSON 解析、optional route/additionalProperties 静态检查、生成器相对 dirty 原件的两 hunk 差异、scoped `git diff --check`（无空白错误，仅既有 LF/CRLF 提示）及 scoped 状态。未修改的 `shared/core-client.ts` SHA 为 `5DEEB42F96B2B23225F90ADB8642FA9529F419A01A8E14F731378B4F2AC74C50`。

旧 root 红证仅用于确认修前根因：`T34-core-begin-contract-root-before-red.json` 中 A 拒绝 `/value.route`，B 接受。该红证不冒充本轮绿；作者按令没有运行新 spec，因此当前没有动态绿证。

## 5. root 有限命令

```powershell
Set-Location 'D:\Lawbeach\lawbench-A\dsh-ext'
& 'E:\node\node.exe' '..\dsh\node_modules\vitest\vitest.mjs' run --config vitest.config.mjs tests\t34-core-route-contract.spec.ts
& 'E:\node\node.exe' '..\dsh\node_modules\typescript\bin\tsc' -p tsconfig.json --noEmit
Set-Location 'D:\Lawbeach\lawbench-A'
python contracts\check_examples.py --skills skills
```

以上由 root 完整审后按其许可决定是否执行；开发构建仍需 root 另行决定。

## 6. 阻碍、偏离与停止点

- 普通 `git status` 在 `dsh` 子模块元数据处权限拒绝，随后只用 `--ignore-submodules=all` 读取父工作树；未修权限、ACL 或锁。
- 三次只读命令误填 `bash`，均由环境在执行前以 `Bash/E_ACCESS_DENIED` 拒绝；两次只读命令使用 `pwsh.exe` 短名而非规定绝对路径。三次只读 PowerShell 表达式解析失败、一次短路径哈希命令找错文件，均未执行目标动作或改状态。
- 未运行 Vitest、tsc、pytest、collect、`check_examples.py`、生成器、build、产品 import、Host/lifespan、GUI、服务、RPC、网络、模型、Keyring、真实凭据或 API 探测。
- 未改 TEMP、权限、审批、沙箱、ACL 或 writer 锁；未执行 Git add/commit/rebase/stash/reset/clean/checkout/push。

交回完成，按令停止，不等待回信。
