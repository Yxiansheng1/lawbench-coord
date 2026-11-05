# B线交回：T32 GUI 自然收口观察窗修正

时间：2026-10-25T18:11:42+08:00 执行令对应交回

状态：`COMPLETE_FOR_ROOT_REVIEW`

## 范围与改动

仅修改：

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\GuiDraftEntry-20261025-172934\probe.mjs`

在 `waitForNaturalClose()` 的 `while` 循环结束之后、`fail("natural close evidence timeout")` 之前，增加且仅增加以下复查：

```js
if (fs.existsSync(finalPath) && fs.existsSync(loopPath)) return;
```

这覆盖轮询恰好发生在终态写入前、随后休眠到期限时已具备自然收口证据的情况。

## 边界确认

- 保留 25 秒总期限不变。
- 保留 5 秒轮询间隔不变。
- 未新增超时、休眠、检查项、跳过逻辑或断言削弱。
- `waitForNaturalClose()` 之后的完整元数据、源码、凭据和清理检查保持原样。
- 未修改 server、README、A 线、lib、E50、payload、路由、权限、API、配置或 GUI。
- 未启动 server、准备器、测试、自测、构建、探测或 GUI。
- 未执行 Git 写入；未暂存、提交、rebase、stash、reset、clean、checkout 或 push。
- 未更改沙箱、审批、ACL 或 writer 锁。
- 包装保持 `HOLD`。

## 证据与验证状态

本次按执行令仅完成授权源码修正，没有重演旧开工、安装、调研、全量测试或探测。因而本次交回不宣称新的测试绿；该观察窗修正及既有原始证据的独立 SHA 核验由主编排完成。

既有通过事实以原执行令所列 fresh 180934 证据及 B 线原交回件为准；本次没有改写或搬运其结论。

## 遗留

无本轮执行阻碍。若同一自然收口原因再次出现，按执行令停止 B 线，不创建第三个同类候选或新框架。
