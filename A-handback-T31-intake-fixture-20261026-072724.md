# A 线交回：T31 intake 测试上下文依赖

- 执行令：`T31-intake-fixture-order-20261026-072724.md`
- 状态：有界修改完成，静态审计完成；根会话验证待做；打包 HOLD
- 修改文件：`D:\Lawbeach\lawbench-A\dsh-ext\tests\intake.spec.ts`

## 精确改动

相对指定 before 文件，只增加了一行，为 `fakeCtx` 补齐实际 `Ctx` 的 `connection/reset` 订阅签名和可调用 Disposer：

```diff
@@ -79,6 +79,7 @@ function fakeCtx(registered: { intake: number; marks: number }, steps: string[]
       }),
     },
     effect: (fn: () => unknown) => { fn() },
+    on: (_event: 'connection/reset', _listener: () => void) => () => {},
     inject: (_deps: string[], fn: (c: unknown) => void) => {
       const p = Promise.resolve().then(() => fn(ctx)) as Promise<void> & { dispose(): Promise<void> }
       p.dispose = async () => {}
```

最终位置为 `intake.spec.ts:82`。该签名对应 `ui/index.tsx` 中实际契约：

```ts
on(event: 'connection/reset', listener: () => void): Disposer
```

未改动生产代码、GUI、配置、构建产物、启动器、Bentry、guards、schemas 或 18 pins。未增删、跳过或改写现有测试断言和案例；两条新增 intake 绑定测试仍保留。

## 状态保全与静态审计

- 指定的 before 文件已存在，并在修改前与目标文件哈希一致；未覆盖该留档。
- `git diff --no-index` 显示相对 before 的唯一差异就是上述一行。
- `git diff --check -- dsh-ext/tests/intake.spec.ts` 退出 0，无输出。
- `git diff --name-only -- dsh-ext` 显示工作区原有多处 dirty；本次只修改指定测试文件，已保全其余内容。
- 本次没有运行测试、Vitest、parser、tsc、build、runtime、HTTP、model、network、prepare、serve、GUI 或 selftest，因此不宣称任何测试 PASS。

## 复用证据与根会话下一步

按执行令复用既有事实：`input-import.spec.ts` 为 13/13 PASS，`intake.spec.ts` 为 5/9 PASS；四个既有 apply/open-case 用例在断言前因 `TypeError: ctx.on is not a function` 失败。原始红证据仍由根会话保留，本次未重跑。

建议根会话只运行受影响的四个失败用例及两条新增 intake 绑定测试，并按实际结果更新门禁。本文件只交回 fixture 依赖修复和静态事实。

## 阻碍与边界

只读 `git status --short --untracked-files=all` 被既有子模块目录权限阻断：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

未启动 setup、未切换 legacy、未修改沙箱/审批/ACL、未拆 writer lock，也未尝试任何 Git 写入。未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。该只读状态阻碍不改变本次交回，打包仍为 HOLD。
