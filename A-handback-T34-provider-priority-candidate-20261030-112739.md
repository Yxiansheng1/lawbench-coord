# A 交回：T34 provider priority candidate

状态：`SOURCE_CANDIDATE_READY / AUTHOR_RUNTIME_ZERO / ROOT_ACTUAL_PENDING`

## 结论

已按正式执行令生成一个独立私有源码候选，只修正已观测到的监听器顺序问题：
`LlmPiAi` 的 `internal/config` 监听器关闭时使用 `{ prepend: true }`，让外层 Loader
先完成表达式插值，再执行原有的 `Config`、`assertServiceable`、自 fiber 检查和返回路径。
没有手工二次插值，没有改 import、schema、guard 或函数体。

这不表示原始 SDK 已应用、native GUI 已通过或整条 T34 已完成。原先
`T34ProviderCompositionFinite-root-20261030-111703` 的
`1 literal PASS + 1 expression FAIL` 原样保留；本次没有重跑旧源码。

## 新增交付

- 私有源码候选：
  `D:\Lawbeach\lawbench-A\dsh\packages\llm\llm-pi-ai\t34-source-candidate-20261030-112739`
  - 12 个 `.ts`，184672 字节。
  - `index.ts` 14201 字节，SHA-256
    `b1adfdf28162b6ce85735eb440fec6fa125cdf272de1ae89cda652e434ab804f`。
  - 其余 11 个文件与原始 `src` 逐字节相同。
- 新测试：
  `D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\tests\t34-provider-priority-candidate-20261030-112739.spec.ts`
  - 7218 字节，SHA-256
    `160617c6041635ae0acfe8b411f84df6216893cf4ace99c59cd1f07299b90fbd`。
- 证据：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderPriorityCandidate-20261030-112739`
  - `vitest.finite.config.mjs`：1117 字节，SHA-256
    `3bddf4b9736006008ed30cefeab6ca833c65f9f3c0330d65283bbde2d62f12c8`。
  - `literal-inputs.json`：7686 字节，SHA-256
    `f44167b8c98ca16b22c5b7d23959e1cfb2426c46eefbd8229750f0718d951d14`。
  - `README.md`：1254 字节，SHA-256
    `605c0fe143f8d0a4381cb143a1199d07383f6bb3faae2b82b8a95c22582c0686`。
  - 未创建 `runtime`；证据 JSON 不引用自身。

## 已验证

- 冻结输入 `approved-inputs.json`：22446 字节，SHA-256
  `c221d4bcd57a5c6c7d02a0e7529f60305feaf263813688db6b63ec3e0a75f4d9`。
- 原 12 文件为 184653 字节；候选除 `index.ts` 外全部逐字节一致。
- 候选 `index.ts` 只增加 `, { prepend: true }`；撤销该选项后 SHA-256 恢复为
  `1aa1823262d01d9e2bdc33177b82bfb1082b4559cbde288bb3606db19d575f2d`。
- 新测试恢复旧包导入后，前两例正好是旧 6041 字节测试的完整逐字节前缀；新增内容只有
  一个负例。
- 新配置恢复目标 `cacheDir` 与 `include` 两字段后，逐字节恢复旧配置
  `4ba3de61a72ed48669b0e9caa8529806775d7b8168054e03331eeb554b7911ea`。
- `literal-inputs.json` 已由 PowerShell `ConvertFrom-Json` 成功解析。
- 原 SDK `lib/index.js`、旧测试、旧配置、Cordis events、Loader、Loader 插值源码哈希均与
  冻结输入一致。

## 根执行边界

下一步应由现有 90 秒、身份已核验的根 wrapper 做唯一一次实际三例 finite 运行。现有旧
invocation 的 Node/Vitest 参数应只改成本目标准确路径：

- 配置：上述 `ProviderPriorityCandidate-20261030-112739\vitest.finite.config.mjs`
- 测试：上述 `t34-provider-priority-candidate-20261030-112739.spec.ts`
- 名字过滤：
  `^(removes\ a\ synthetic\ external\ provider\ through\ real\ Settings\ with\ literal\ route\ URLs|removes\ a\ synthetic\ external\ provider\ through\ real\ Settings\ with\ expression\ route\ URLs|rejects\ a\ malformed\ route\ after\ expression\ validation\ ordering\ is\ corrected)$`
- reporter：JSON，输出文件必须由根放在自己的结果目录。

根运行后还需核对：三例完整结束、owned OS 进程全部消失、候选与测试/配置/旧 pin 在运行
前后不变。只允许一次三例 finite；不得用同一源码反复试绿，也不得把该结果升级成 native
GUI 或整条 T34 通过。

## 阻碍与偏差

- 直接 `git status --short` 在 `dsh` 子模块处被工作树权限拒绝；未修锁、未扩权，后续使用
  `--ignore-submodules=all` 只读确认现有 dirty 并全程保全。
- 流程中两次辅助列目录/读结果调用误把工具 shell 参数指定为 Bash，均在命令启动前由环境
  以 `ACCESS_DENIED` 拒绝，未产生文件或状态变化；其余正式命令均显式使用指定
  `pwsh.exe` 且 `login=false`。
- Git 全程只读：未 add、commit、rebase、stash、reset、clean、checkout 或 push；index
  lock 或权限拒绝不作为交付阻碍处理。

作者未启动 Node、Vitest、Python、parser/import/type check/collect/build/GUI/HTTP/模型/
凭据，未修改原 SDK、旧测试、旧证据、审批、沙箱或 ACL。交回后停止。
