# B 线交回：PRD 12.22 本机胶囊原生入口测试准备

状态：`READY_FOR_INDEPENDENT_REVIEW / UNRUN`。本交回只表示测试材料已写，不表示胶囊排序、原生入口或整卡已通过。

## 1. 出处

- 唯一执行令：`D:\Lawbeach\lawbench-coord\ORCH-ToB-CapsuleNative-20261025-183517.md`
- 服务端输入：`D:\Lawbeach\lawbench-coord\ORCH-CapsuleNativeInput-20261025-183517\server-before.py`
- 上下文输入：`D:\Lawbeach\lawbench-coord\ORCH-CapsuleNativeInput-20261025-183517\context.txt`
- `server-before.py` 的 SHA-256：`C763F3B00EC32575BF26F34D4B2A22D07A9A17ABA370AAE79A078737FD2458CA`
- 机械复制后的 `server.py` 在打补丁前与该 SHA-256 一致。
- 按令未重演 dirty 检查或保全；既有 A/B dirty 保全位置为 `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\CapsuleNative-before-20261025-183517`。
- Git 全程只读，因此没有提交 SHA；本交回不引用作者自证。

## 2. 全部差异

测试目录 `D:\Lawbeach\lawbench-B\docs\plan\evidence\Capsules\NativeEntry-20261025-183517\` 只新建以下三件：

- `server.py`
- `probe.mjs`
- `README.md`

`server.py` 从 `server-before.py` 逐字复制，只改两处：

- 顶层 `ROUTES` 增加 `("PUT", "/api/capsules")` 和 `("POST", "/api/capsules/reset")`，由原 12 条变为 14 条。
- `Firewall` 类内部增加固定写闸：
  - 构造时从真实 `app.state.lb.capsules.default()` 深复制候选 A/B；缺 `civil`、`office`、`contract-review` 或 `contract-draft` 时直接 `Deny`，无 fallback。
  - 候选 A 保持原顺序；仅把 `contract-review.name` 改为“合成审查”、`contract-draft.hidden` 改为 `true`、在 `office` 末尾新增 `custom-1` 合成工具。候选 B 只再交换 `civil` 中这两个对象的位置。
  - 所有非 GET 请求先按真实 `app.state.lb.config.token` 与 ASGI `authorization` 头做常量时间判断；未认证请求交给原生应用，不消费写声明。
  - PUT 扩用原 `_read_body` / `MAX_BODY`；认证后只接受无 query 且严格等于候选 A/B 的完整 JSON。
  - PUT 与 reset 用原 `threading.Lock` 原子占用粘滞声明；PUT 失败不重试，真实 HTTP 200 后才开放 reset；reset 只接受非空正文 `{}` 且无 query，真实 HTTP 200 后永久封闭所有非 GET。
  - 每次原生写前核对私有 `appdata\capsules.json` 为普通文件、无 reparse/link、`st_nlink == 1`、无 sparse 标志；核对默认源文件 hash 未变。
  - 未手写 `capsules.json`；PUT/reset 只进入原生路由和 `CapsuleStore`。GET、原 11 条 GET、case/open、空任务守卫、案件绑定、源码审计与停止逻辑保持原实现。
- `probe.mjs` 只用 Node 内置模块，只读指定 run 的 `prepared.json`、`ready.json`、私有胶囊文件和 skills 默认源，只访问 `127.0.0.1`。它执行候选 B 的 PUT、GET/磁盘深等、重复 PUT、reset/GET/磁盘深等、重复 reset、未认证/错误候选/query/越界路由拒绝，以及最终关闭证据断言。Token 只驻留内存，不输出。
- `README.md` 给出 fresh run 的 `--prepare`、`--serve --seconds 20`、probe 调用、Token 内存处理和七条边界。

没有修改产品源码、旧 entry、E50、认证、业务、契约、环境、guard、PDF、GUI 或 `engines\`。

## 3. 未运行

按令没有运行任何 parser、prepare、serve、probe、Node 检查、Vitest、tsc、pytest、build 或 GUI。没有启动服务、没有启动自己的代码、没有访问模型/OCR/Retainer、没有发起产品网络请求，也没有运行候选 A/B 的实际排序。

因此目前没有新的运行证据；测试材料只供独立审阅后由 root 首次运行。

## 4. 精确依赖与 root 命令

依赖：当前 B 工作树、可导入的 `lawbench.app.create_app` 及其现有 Python 依赖（含 `httpx`、`uvicorn`）、Python、Node.js（需支持 `structuredClone`）和 PowerShell。无需新增依赖或 Key。

每个 run 必须新建且不得复用。完整命令和七条边界见：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\Capsules\NativeEntry-20261025-183517\README.md`

核心调用顺序为：

```powershell
python D:\Lawbeach\lawbench-B\docs\plan\evidence\Capsules\NativeEntry-20261025-183517\server.py --prepare --root <new-run-root>

# 从 <new-run-root>\prepared.json 读取 paths.appdata.path，
# 在当前 PowerShell 内存中设置 LB_PORT、LB_TOKEN、LB_APPDATA。
python D:\Lawbeach\lawbench-B\docs\plan\evidence\Capsules\NativeEntry-20261025-183517\server.py --serve --root <new-run-root> --seconds 20

# ready.json 出现后，在当前 PowerShell 内存中设置
# LB_CAPSULE_NATIVE_ROOT=<new-run-root>、LB_CAPSULE_PORT、LB_CAPSULE_TOKEN。
node D:\Lawbeach\lawbench-B\docs\plan\evidence\Capsules\NativeEntry-20261025-183517\probe.mjs
```

`<new-run-root>` 必须是测试目录 `runs\T33-host-YYYYMMDD-HHMMSS` 的直接子项。完整 README 命令使用隐藏窗口启动 serve，并等待 `ready.json`。

## 5. 副作用关闭

- 只新建本交回列出的三件测试文件和本交回文件；没有删除、移动或覆盖既有文件。
- 未执行 Git add/commit/rebase/stash/reset/clean/checkout/push，未碰 index、lock、ACL、审批或沙箱。
- 未生成 Key、Token 或真实案卷内容；未写协调目录机密。
- 未启动服务、后台进程、OCR、Retainer、模型或网络连接。
- 无需要关闭的副作用。

## 6. 未验

- 未验 Python 语法/AST、Node 语法、首次 prepare、原生应用启动、候选 B 排序或改名/隐藏/新增是否生效。
- 未验候选 A；probe 只实跑候选 B。
- 未验并发 PUT/reset 的重叠时序；代码有锁与粘滞声明，probe 只覆盖顺序重复。
- 未验 GUI 拖动、真实 Host/RPC、重启后保持、真实案卷、OCR、模型、打包或整卡验收。
- 未验 `final-metadata.json`、`loop-closed.json` 及 credentials/outbound/OCR/lifespan/Retainer/Net/日志/监听器/task/loop 的实际断言结果，因为这些证据必须在 root 首次运行时产生。
- 本交回不是通过结论，也没有把未运行项写成已通过。
