# T34 provider layers — A 线交回

状态：`SOURCE_ONLY_CONFIG_READY / AUTHOR_RUNTIME_ZERO / ROOT_RUN_PENDING`

本次只修正旧 fixture 的配置层级：下层 `test-bundle` 保留原有 5 个 insert entry，并追加
`llm-pi-ai` 裸声明；上层 profile patch 改为普通 `id/config/providers` override。旧顺序把
普通 GUI override 写成 insert 行内配置，导致 `unset` 按设计恢复继承值；这是 fixture 层级
错误，不能据此报告旧 target 产品失败，也不是已证明的 native 原因。旧 target 保持
`NOT_RUN`，旧四件与原始状态均未改动。

## 交付文件

目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\ProviderLayers-20261030-105817`

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| `provider-composition.spec.ts` | 6041 | `7ce149acac721f5ccff24ad447c049d1d1f313a3f93911135684c9bc030d2e4c` |
| `vitest.finite.config.mjs` | 1096 | `1e95bb7400a85020ad40ff1d1b35a3c90e3bb50077a05eb7c1b55c8c12a9b132` |
| `literal-inputs.json` | 5380 | `9d33dfebd4336b6beef00bd9ddf8e178f1c2b650bc1d80ec53f0d2078ab39d82` |
| `README.md` | 2518 | `63d32fc47136c9495075c61aefc1fa5dbe3d0803d909b688663352f325a73966` |

`literal-inputs.json` 保留 17 个 primary pins、两个精确测试名、旧失败与既有通过引用，并更新
本目录两个新文件身份；它不引用自身。`runtime` 未创建。

## 静态审计

- 17/17 个批准 source pins 的字节数与 SHA-256 仍一致。
- 旧 `ProviderComposition-20261030-104724` 四件以原始哈希复核，4/4 未变；其中旧 spec 仍为
  5690 字节、`ffaf93f12795b92c793182e9f7da13d7761342c7dd8bae38f9fae9158ccb4114`。
- 新配置与旧 1106 字节配置逐行比较，仅 `cacheDir`、`include` 两行内的目录 basename 不同；
  `envDir: false`、三份 setup、`execArgv`、单 worker、关闭并行、cache 与 coverage 均保持。
- 从 `type ProviderView` 开始逐行比较两个 case body，仅两条 baseURL 输入的缩进由 12 格改为
  8 格；其余 assertions 逐字一致。
- setup 实际读取并解析现有 `test-bundle/cordis.patch.yml`，断言 1 个 patch 和原有 5 个
  insert entry，追加唯一 `{ id: "llm-pi-ai", name: "cordis:t34-llm-pi-ai" }` 后写回；上层
  用普通 profile override 写 provider 配置。
- 每个 case 恰有一次 `ctx.settings.mutate`，共 2 次；无 catch、mock、fetch、重试/轮询、
  服务启动或模型调用。

## 验证与 Git 边界

两个测试均为 `NOT_RUN`，等待 root 做一次两项 finite 判读。作者未启动
Node/Vitest/Python/parser-import/type check/collect/build/GUI/HTTP/model/SSH/DPAPI/
credential/process probe。

Git 全程只读，add/commit/rebase/stash/reset/clean/checkout/push 均为 0。既有 57 个 tracked
修改与 203 个其他 dirty/untracked 项保留。全树状态检查在子模块 `dsh` 被权限拒绝：
`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh':
Permission denied`；未尝试修锁、改 ACL、扩权或绕过。外层只读状态为 line-A，相对
`origin/line-A` ahead 93 / behind 1。因此本次没有提交 SHA；协调目录本文件即正式交回。
