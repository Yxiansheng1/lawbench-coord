# A 线交回：T31 Control Echo 字面量依赖绑定

状态：`CODE_EDIT_COMPLETE_RUNTIME_NOT_RUN`

依据：
`D:/Lawbeach/lawbench-coord/T31-control-echo-literal-order-20261027-023646.md`

## 完成事项

仅修改：
`D:/Lawbeach/lawbench-A/dsh/packages/api/session-controller/tests/fixtures/t31-control-projection-echo.finite.ts`

`loadControlCodecs` 内两个延迟动态导入已按令替换为同一组固定文件的绝对字面量
路径。没有 eager 顶层 import，没有改 `_label`、签名、调用、常量、三组输入字节
哈希、断言、Host/control/frame/R/seq/rAF/finally/body，也没有改 native 配置、
产品、运行时、旧测试、旧 extension 或 guards。

## 静态证据

- 修改前：19,611 字节，SHA-256
  `16d9c5491b554a55e781886ff348027ef8ab5290995e19593fb9f356465ddded`。
- 修改后：19,944 字节，SHA-256
  `e4823f5f2e022969be3784cdd8f39464a7cfe539f61c0116e236ba4033274501`。
- 旧两个计算式各 0 处；新两个字面量式各 1 处。
- `typert.host.js`：158,754 字节，
  `a2665751cebf24f933761d23777331ea211dde8ea6f5ab79051682f8d751ab12`。
- `typert.remote-client.js`：59,116 字节，
  `e33bc1560f04009bebb3c4e7b2f384c7886f0165ec13735a31cb1f0e081a1630`。
- 两个固定源码文件的上述大小与哈希在修改前后相同。

完整证据：
`D:/Lawbeach/lawbench-A/docs/plan/evidence/T31/ControlProjectionEcho-20261027-005153/literal-import-correction-20261027-023646.md`

## 实际命令与限制

所有命令显式使用指定 Windows PowerShell 且 `login=false`，未使用 Bash。

`git status --short --branch` 退出码 1，真实错误是：

```text
fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied
fatal: 'git status --porcelain=2' failed in submodule dsh
```

没有修复权限、修改锁/ACL、扩大审批或更改沙箱；这不是本次修改造成的交付阻碍。
`git status --short --branch --ignore-submodules=all` 退出码 0，顶层既有 dirty
仍保留。本次只读 Git，无 add、commit、rebase、stash、reset、clean、checkout、
push，因此没有提交 SHA。

`RUNTIME_NOT_RUN`。没有运行 Node、Python、Vitest、tsc、解析器、AST、导入、
收集、自检、构建、服务、探测、HTTP、GUI、模型、安装或凭据读取；没有用旧运行
结果冒充当前夹具结果，也不声称产品红绿。下一步由 root 复核并实际运行同一组
两项 native 测试。

Packaging `HOLD`；Gate 1 未完成；GUI `GUI_NOT_VERIFIED`。
