# T34 provider test location — A 线交回

状态：`SOURCE_ONLY_NOT_RUN / AUTHOR_RUNTIME_ZERO / NO_NATIVE_PASS`

本次只修正有限测试位置，未改产品源码或既有测试。旧 6041 字节 spec 已整文件逐字节复制到
`D:\Lawbeach\lawbench-A\dsh\packages\settings\settings\tests\t34-provider-composition-20261030-110957.spec.ts`；
目标原不存在，复制后仍为 6041 字节、SHA-256
`7ce149acac721f5ccff24ad447c049d1d1f313a3f93911135684c9bc030d2e4c`，与旧文件相同。

回顾上一轮：测试误放在 evidence 目录，`vite-tsconfig-paths` 按 importer scope 解析后无法导入
`@deepseek-ai/cordis`，实际执行 0 个测试正文并发生 1 次 collection failure；不是两条断言失败，
也不是依赖或源码 alias 缺失。该位置选择属于根侧准备遗漏。本轮仅把同一 spec 放入正常
`settings\tests` 树，没有替换 alias、迁移本地 node、安装、构建或改 loader。fixture 的普通上层
override/裸下层声明、两条精确测试名和 assertions 均保持。

## 新证据

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderTestLocation-20261030-110957`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `vitest.finite.config.mjs` | 1105 | `4ba3de61a72ed48669b0e9caa8529806775d7b8168054e03331eeb554b7911ea` |
| `literal-inputs.json` | 5592 | `3f3e9abfd2087fa01e1d997e7b6dc2469b2f8459f94ca170acf22157ebe08404` |
| `README.md` | 8646 | `eabb9feaad660e2906c67e5e5ad5848e7b9a7f5d3c4ae6ca25ff0ee5e651d0d3` |

配置是旧 1096 字节配置逐行复制，仅 `cacheDir` 和唯一 absolute `include` 不同；把这两处
逆变换后全文逐字符等于旧配置。`literal-inputs.json` 保留同一 17 个 primary pins、两条测试、
实际 native 失败和既有三项通过指针，记录新测试/配置身份并指向上一轮 import failure；不引用
自身。旧配置行仍指向 1096 字节文件。

## 核对与边界

- 17/17 primary pins、旧 4/4 文件、既有 57/57 个 dirty 文件均与冻结元数据一致。
- 新证据目录只有上述三件，`runtime` 不存在；旧运行、旧四件与日志未改。
- 作者执行两个测试正文的次数为 0，退出码与结果均为 `NOT_RUN`；未启动 Node、Vitest、
  Python、parser/import、check/test/collect/build/GUI/HTTP/model/credential/process probe。
- 根侧完整静态核对、私有 allowlist 环境 setup、一次全新两项调用、结果落盘和 OS 关闭命令
  已逐项写在 README；不得继承 ambient Keys，不得只做末端准备或重试其他变体。
- Git 全程只读，add/commit/rebase/stash/reset/clean/checkout/push 均为 0，因此没有提交 SHA。
  全树状态仍因未获权限的子模块 `.git` 路径被拒绝；未改锁、ACL、审批或沙箱，正式交回以本文件为准。

当前等待根执行器按 README 做唯一一次两项 finite 运行并保留真实结果。此交回不声明测试通过、
native GUI 通过或整条 T34 通过；native 根因仍为 `UNKNOWN`。
