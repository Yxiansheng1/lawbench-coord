# A 线交回：provider composition 有限对照

状态：`SOURCE_ONLY_CONFIG_READY / AUTHOR_RUNTIME_ZERO / TARGET_NOT_RUN`

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 已准备两份精确测试的唯一有限配置，覆盖真实 provider composition 删除外部 provider 的 literal 与表达式两种写法；未改产品源码。 |
| 目标是什么 | 查清真实 Settings/ConfigEditor/Loader/HMR 在组合已有 provider 时能否写入成功。当前停在根侧一次私有运行前。 |
| 在等什么 | 等根执行器核对后运行两测试一次，并保留真实退出码和输出；拿到结果后再判断该组合路径是否仍有写入问题。 |
| 卡在哪 | 当前不卡；作者按令不运行测试。唯一运行核对阻碍是全树 Git 状态在未获权限的子模块元数据处失败，已用忽略子模块的只读状态确认原有 dirty 仍保留。 |

## 依据与验证

- 新增目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderComposition-20261030-104724`。
- 四个允许文件：`provider-composition.spec.ts`、`vitest.finite.config.mjs`、`literal-inputs.json`、`README.md`。
- 测试正文为 5690 字节、SHA-256 `ffaf93f12795b92c793182e9f7da13d7761342c7dd8bae38f9fae9158ccb4114`；有限配置为 1106 字节、SHA-256 `9ea64ce38881f633e9179ecc7b8850365d993d447370fab43485ebf8c2ca307b`。
- 批准输入的 17 个 pin 均与批准清单的字节数和 SHA-256 一致，漂移数为 0；`literal-inputs.json` 加入上述两个新文件身份，未引用自身。
- 新配置与旧配置的静态差异只有本次要求的 `cacheDir` 和唯一 absolute include；其他 root、环境目录、插件、setup、worker、cache 与 coverage 设置保持不变。
- 静态检索没有发现动态配置测试、liveConfig、模型列表/发现/拼装/流、认证、浏览器、网络、凭据读取、等待轮询或 mock/fake 替身。
- README 内含根侧唯一命令、两测试精确名称、私有 allowlist 环境边界和停止条件。

作者使用指定 PowerShell 做了只读源码、历史文件和 pin 核对，并用 `apply_patch` 写允许的
文件。非零命令包括全树 Git 状态权限拒绝、5 次误传 `bash` 在启动前被拒绝、一个不存在的
loader 包路径、一次只读筛选返回 1，以及一次 `New-Item -LiteralPath` 参数不受支持；这些
命令均未启动目标测试，后续没有改审批、沙箱、ACL、锁或 Git 状态。

## 未做与降级

Node、Vitest、Python、AST/parser、import、type check、test、collect、build、GUI、HTTP、
模型、SSH、DPAPI、凭据和环境探测均为 `NOT_RUN`；runtime 目录创建数为 0，退出码和两测试
结果均为 `NOT_RUN`。没有安装、连网、联系其他会话、更换 API、Git 提交或 native PASS
声明。既有 native 失败仍只作为事实指针，具体根因保持 `UNKNOWN`。

## 下一步建议

根执行器先核对四个新文件、`literal-inputs.json` 的 19 个 pin、私有环境和清理责任，再按
README 的同一命令运行一次两测试。若测试失败，保留输出后停止，不扩大测试范围。

关键路径：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderComposition-20261030-104724\README.md`

Response ID: chat reply

Response log path: chat reply
