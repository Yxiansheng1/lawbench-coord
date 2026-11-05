# B 线交回：T32 GUI 健康检查 probe 窄修

执行令：`D:\Lawbeach\lawbench-coord\ORCH-ToB-T32GuiHealthProbeFix-20261025-175242.md`

完成时间：2026-10-25

## 结论

已按令完成 `expectOk` 的单一函数窄修。`/health` 在 HTTP 200 后改为严格要求真实健康包络
`status === "ok"`、`contract_version === "1.6"`，并返回健康对象；其他业务响应仍严格要求
`ok === true` 且响应对象自有 `value` 键，返回 `value`。未改其他文件中的载荷、等待时间、环境、
fixture、server、README、lib、start、E50、guard 或依赖。

本次没有运行测试、解析器、构建、自检、probe、prepare、serve、GUI 或权限/API 变更。按要求复用
原执行令记录的既有事实：修改前实际 health 响应为
`{"status":"ok","contract_version":"1.6"}`，原 `server0` 的自然关闭和既有证据不重演。
本交回不宣称新运行通过；最终验证由编排执行全量 diff 审阅和新的有限 probe。

## 改动前后

路径：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\probe.mjs`

修改前：

```js
async function expectOk(method, pathname, body) {
  const response = await request(method, pathname, body);
  check(response.status === 200, `${method} ${pathname} expected 200`);
  const hasValue =
    response.json &&
    Object.prototype.hasOwnProperty.call(response.json, "value");
  check(
    response.json &&
      response.json.ok === true &&
      (hasValue || pathname === "/health"),
    `${method} ${pathname} response envelope`,
  );
  return hasValue ? response.json.value : response.json;
}
```

修改后：

```js
async function expectOk(method, pathname, body) {
  const response = await request(method, pathname, body);
  check(response.status === 200, `${method} ${pathname} expected 200`);
  if (pathname === "/health") {
    check(
      response.json &&
        response.json.status === "ok" &&
        response.json.contract_version === "1.6",
      `${method} ${pathname} health response envelope`,
    );
    return response.json;
  }
  const hasValue =
    response.json &&
    Object.prototype.hasOwnProperty.call(response.json, "value");
  check(
    response.json &&
      response.json.ok === true &&
      hasValue,
    `${method} ${pathname} response envelope`,
  );
  return response.json.value;
}
```

复核范围仅为上述一个函数的前后变化。

## SHA 与工作树状态

- 基座 HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`
- 修改后 probe SHA-256：`7cb9396e06f2dd856c5b96988641ad09d04e59e2bedf8486aad757b66d958af5`
- 修改后 Git blob：`d5201ae0b5cf9ecf0673665c4ef4bd79595584c8`
- 目标文件状态：`?? docs/plan/evidence/T32/GuiDraftEntry-20261025-172934/probe.mjs`
- 新 commit：无。按本次执行令，Git 全程只读，未 add、commit、rebase、stash、reset、clean、checkout
  或 push。

仓库级 `git status --short` 因既有子模块路径
`D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh`
权限拒绝而未完整返回；目标文件的独立只读状态读取成功。未尝试修复权限、锁、沙箱、审批或 ACL，
既有 dirty 状态未被清理或改写。

## 限制与遗留

- 本次仅做源码级窄修，没有执行新 probe，因此没有新增运行证据。
- 既有健康响应事实来自执行令所指的 `realapp.py` 第 116-117 行，以及既有实际运行记录；本次未重启、
  检查或运行旧 root。
- 目标 probe 仍未跟踪，且没有 Git 写入；最终合流与验证归主编排。
- Packaging HOLD。

本线修改、正式交回及只读状态记录已完成，停止。
