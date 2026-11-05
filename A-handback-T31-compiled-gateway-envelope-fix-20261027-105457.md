# A 线交回：T31 编译 Gateway 失败包络修复

执行者：独立 A 线 DeepSeek

时间：2026-10-27

执行依据：`D:\Lawbeach\lawbench-coord\T31-compiled-gateway-envelope-fix-order-20261027-105457.md`

状态：`COMPLETE` / `RUNTIME_NOT_RUN`

## 完成内容

只修改现有夹具文件：

`D:\Lawbeach\lawbench-A\dsh\packages\api\session-controller\tests\t31-compiled-session-gateway.client.spec.ts`

原：

```ts
return cloneJson(gateway.wireStream.failure(error))
```

新：

```ts
return { ok: false as const, error: cloneJson(gateway.wireStream.failure(error)) }
```

原因：`gateway.wireStream.failure(error)` 返回的是 `ConnectionRpcError` 字段 `code/message/details`，而真实 Gateway 客户端的 `invoke` 期望 `ConnectionRpcResult` 失败分支 `{ ok: false, error }`。原夹具遗漏外层判别包络，会使受限负向场景被错误编码。此次只修夹具承载格式，不涉及产品代码、契约、Schema、断言或共享夹具。

## 证据

完整证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\CompiledGatewayEnvelopeFix-20261027-105457\README.md`

- 修改前基准 SHA-256：`59e66fda4b7080e8779053ac341595e1bd0d61e8b227afe16c832ad365254121`，28,055 字节
- 修改后 SHA-256：`58e73f68d0e1a55a1dd858c2a7f504632549611f9becad186cdc2e104c70751b`，28,086 字节
- 换行保持 `LF=824`、`CRLF=0`
- 从冻结基准在内存中只替换目标表达式后，与修改后文件逐字节比较为 `True`
- `git diff --no-index` 只显示第 349 行一处变化；两个完整测试、全部断言、`finally`、全局清理、`R` 标识、编译模块指纹和真实 Gateway 分派字节未变

## 命令与阻碍

基准与修改前 `Get-FileHash` 均得到指定 SHA-256；`Select-String` 确认目标表达式一处。`git status --short --branch` 退出码为 `1`，原始错误为：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

这是 `dsh` 子模块 worktree 元数据权限拒绝，不是需要修复的交付阻碍。没有尝试拆 writer 锁、修改 `index.lock`、ACL、权限、审批或配置。

## 验证边界

`RUNTIME_NOT_RUN`

按令未运行任何测试、解析器、类型检查、构建、服务、HTTP、GUI、模型或自测，因此不建议把本次结果当作测试通过或首次根运行时完成。此修复只覆盖无头编译 Session/Gateway 承载夹具，不代表整个 T31、项目或 Packaging 完成。

## Git 保全

Git 全程严格只读。没有执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`，没有暂存。只读观察到 HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`；原有主历史保持不变，现有 dirty 内容未被清理或覆盖。除指定夹具、证据 README 和本交回件外，没有写入其他路径。

使用 `--ignore-submodules=all` 的只读顶层状态为 `line-A...origin/line-A [ahead 93, behind 1]`，既有 dirty 内容仍在；没有执行 rebase。

## 留给主编排的后续门

执行者未代跑根级运行时。请主编排先反向核验整文件字节，再于隔离且自有的 `HOME`/`TEMP` 下执行首次实际 paired2；剩余夹具灰色问题按证据判读处理，不得削弱控制。
