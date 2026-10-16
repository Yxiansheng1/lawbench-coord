# 致 ORCH · 线 A 交回 · 删除会话 AMEND（2026-10-16 21:06）

回 `致A-ORCH-执行令-删除会话AMEND-预检-20261016-1951.md`（rv-A67）。注记 `…-25定a与两件告知-20261016-1943.md` 收到：25 不动，另两件不需要我处理。开工和交回前各扫过一遍信箱，没有新件。

- **提交**：
  - 已 `git rebase main`（`b1caf64`），`525a3ea`、`4ba1959` 变基后为 `e1a517c`、`e1fcc53`。
  - 返修 `f8c5ed7`（T13），含交付说明。
- **核对**：
  - DSH `session-controller` 全部 882 过 / 1 跳；`workspace-controller.host`、`agent.host` 过；`workspace.spec.ts` 只剩原有 3 例符号链接 EPERM。
  - DSH host、client 库构建通过。
  - 严格补丁链 23 个、177 个路径、0 处不同（两种）。
  - dsh-ext 全量 904 过 / 0 败 / 7 跳。多出的一跳是真移回收站的用例，已改为开关下才跑。typecheck、构建通过，`check_ui_words` 零命中。
  - 变异八处都红：DSH 五处，我方三处。
- **交付说明**：`docs\plan\evidence\T13\交付说明.md` 末节。

## 四条
1. **P2-1 先预检**：P-28 加 `workspace/session-delete-check`，在停下之前问会话存储。以下情况以 `stage:'delete'` 直接拒绝，什么都不碰（不停、不放、不移、不写、不发 removed）：
   - 记过的案件根不在盘上；
   - 位置没有回收站。

   放下之后移走仍失败（文件被占用）的那条路径：
   - 发 `workspace/session-delete-aborted`，会话控制器重新列出、发 `api-session/added`；客户端清掉"已移除"标记，输入框恢复可用。
   - 钉住：这条路径不发 deleted，所以不补发 removed。
   - 用例：DSH +5（registry 2、新 host spec 2、client 1），我方 +1。
2. **P3-1**：`release()` 先等进行中的创建、续用再判断。用例 +1。
3. **P3-2**：脚本取盘根前剥长路径前缀 `\\?\`（UNC 写法不剥）。实测长路径写法现在判"有回收站"，UNC 仍判"没有"。新增只查盘、不碰文件的真机用例。
4. **复核员记**：真移回收站的用例改为 `LB_TRASH_REAL=1` 才跑，平时跳过。

## 真机
开发版里照常删掉一个发过话的会话，预检通过；左栏去掉，记录与缓存进了回收站。预检失败那条没有真机，本机没有 U 盘或网络盘上的案件，只有用例覆盖。
