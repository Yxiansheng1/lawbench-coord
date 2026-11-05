# 正常同案二次打开补正交回

状态：`DONE_FOR_ROOT_REVIEW`

运行时：`RUNTIME_NOT_RUN`

本轮只完成有界源码修改和静态边界核对，没有运行 Node、Python、服务、探针、HTTP 或 GUI。整项任务仍为 `HOLD`，不能把旧证据或静态差分当成新入口验收。

## 已完成

- 服务端只改三处：setup 后 GUI 同案打开上限由 1 变 2；领取时递增尝试数；证据完成条件允许 GUI 成功数不超过 2。案件绑定、路径、请求体、注册表、空任务目录、源码身份、inflight、移除和清理校验未改。
- 探针只在既有移除负例矩阵前插入 25 行：两次正常同案打开必须实际成功，第三次必须 403 `CASE_OPEN_AFTER_SETUP`，并核对引用、索引、原生状态、外部 TXT 哈希和 mtime 未变。
- 两个 GUI 启动入口只更新服务端字节数和 SHA-256；停止脚本未改。

## 新指纹

- 服务端入口：`134436` 字节，`8fa44405afde2bc48d2223385957bc47732ade8a701c70e65e5d0df578c29a34`
- 探针：`15690` 字节，`591f499fe02c25a43e455b1bae2258d95abc3988cf7d067891693dc5fc97e14d`
- 准备脚本：`8511729a5fd7bc598e6d73c40718ee0207a6630e6b18e5528b54db3a3b9eaef0`
- 启动脚本：`6f0a8582f3db4bfaeef39a85d18fb42721a5b8ae3934cd57e718edba62e4e2b7`
- 停止脚本：`3818bb48bba7e8f1d0735e6394f01340972007a01d4c6d4197530a84abb9fc44`，与改前相同

## 差分证据

对照执行令指定改前副本，服务端为 `3/3` 行，探针为 `25/0` 行，两个启动脚本各为 `2/2` 行。探针没有删除任何旧字节；两个启动脚本除入口字节数和哈希外没有变化。旧 README、旧交付说明和旧灰测记录未改。

## 保留证据

旧的有限 native 往返结果原样保留，可继续证明未变产品源码和移除语义，但使用旧入口哈希，不是新入口验收：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32ReferenceRemoveFinite-root-20261027-122109`

真实 GUI 灰测原样保留。旧入口在 setup 后第二次正常打开返回 403，是本次调整上限的直接依据，不能标成产品缺陷：

`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T32ReferenceRemoveGUI-root-20261027-122342`

## 非零命令

- `git status --short --branch` 返回 1：受保护子模块权限拒绝；未修权限、锁或审批。
- `git status --short --branch --ignore-submodules=all` 返回 0：既有未提交改动已保全。
- `git diff --no-index` 返回 1：工具发现预期差异时的固定返回；没有执行 Git 写操作。

## 等待 Root

请先核对新哈希和固定输入，再跑一次新的有限 native 往返测试，覆盖两次成功打开、第三次拒绝和完整移除矩阵；通过后另起全新真实 GUI。只在真实 UI 删除动作前请求用户当场确认。移除后还要观察原任务项折叠显示的 `removedN` 数量。真实 UI 删除完成前，源码身份不一致仍不能宣告通过。

详细记录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T32\RefRemoveEntry-20261027-115753\same-case-open-pair-20261027-123125.md`

未执行任何 Git 写操作。

Response ID：未提供

Response log path：chat reply
