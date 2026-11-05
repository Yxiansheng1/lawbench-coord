# A 线交回：T31 编译网关 peer bindings

状态：`COMPLETE`

运行状态：`RUNTIME_NOT_RUN`

## 已完成

- 只修改
  `D:\Lawbeach\lawbench-A\dsh-ext\vitest.t31-compiled-session-gateway.config.mjs`。
- 静态盘点固定运行时 `index.js`、`typert.host.js`、`typert.remote-client.js`：
  `index.js` 有 19 个 different bare package specifier，Host/Remote 仅重复
  引用 `zod`；三个模块均无静态 re-export。
- 在私有选择器加入一份 18 项精确 peer binding，覆盖除既有 `zod`
  owning-package alias 外的全部静态 bare imports。
- `dsh-session` 与 `dsh-session/fork` 使用带首尾锚点的独立正则；
  `mime-types` 固定到已安装 3.0.2 的普通 `index.js`。
- 同一份 binding 同时追加到顶层和 `thread-safe` 项目的原 alias 列表，
  原有 React、source、`fs.strict`、include、根目录、jsdom 与 `zod`
  bindings 保留。
- 未修改冻结的 client、Host、Remote 产物或 28086 字节消费者正文。
  `dsh-credentials` 仅作静态支持依赖绑定，未实例化凭证、provider 或 Keyring。

## 身份与证据

- 选择器修改前：`813` 字节，SHA-256
  `760FDD5FCADD2479EE920E35954637A1A9B0FF6E010539E555D3C03E7475C2A5`。
- 选择器修改后：`3450` 字节，SHA-256
  `C4DF61B6E2D308E227841609CE70832D774C7AE65B89B8CF77F807769B234F1A`。
- 消费者正文保持 `28086` 字节，SHA-256
  `58E73F68D0E1A55A1DD858C2A7F504632549611F9BECAD186CDC2E104C70751B`。
- 固定运行时 `index.js`、`typert.host.js`、`typert.remote-client.js`
  的字节数与 SHA-256 均与冻结清单一致。
- 18 个 binding 目标均为现有普通文件，非重解析点；逐个入口、字节数和
  SHA-256 已写入证据 README。
- 证据：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\CompiledGatewayPeerBindings-20261027-110548\README.md`

## 边界

- `RUNTIME_NOT_RUN`：未运行 Node、Python、解析器、AST、Vitest、
  测试收集、导入、构建、准备、服务、探针、HTTP、GUI、模型或自检。
- 未重复旧开工、安装、调研、全量测试或已关闭的 GUI 流程。
- 未执行任何 Git 写操作；未 add、commit、rebase、stash、reset、clean、
  checkout 或 push。父工作树既有 dirty 全部保留。
- 只读 `git status` 在 `dsh` 子模块工作树元数据处遇到 `Permission denied`；
  未修复权限、未改锁、未扩张审批或 ACL。
- 本线只完成有界修改、静态证据和正式交回；新的 actual2 由主编排审计后运行。
  不宣称 whole T31、GUI、packaging 或产品行为已通过。
