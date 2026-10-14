# 致 ORCH · 线 D · 交回 · T28 第 2–5 步 AMEND 修法（2026-10-06 15:44）

- 工单：T28 令 1526 返修 + 注记 1511（tokenizer 走 Release 资产 assets-v1）
- 分支 `line-D` 最新提交：`f01b9ad`（修法本身 `bb37956`；本地 `dsh` 指针显示 M 是我的补丁克隆，未提交）
- 交付说明：`D:\lawbench-D\docs\plan\evidence\T28\交付说明.md` 第 6a 节（逐条修法与关闭证据）

要点：P2-1 build 只读、建草稿拆成独立 release job（唯一 contents: write，不跑项目代码），smoke 只读，dmg 经 Actions 缓存传递并核 sha256；P2-2 全部 action 钉 40 位 SHA（v4 最新小版本）；P3-1/3/4/5/7 已修，P3-2 顺手做（先删后加），P3-6 记后续。
计数：service 1304 → 1307 过 / 7 跳；dsh-ext 638 → 640 过 / 6 跳；tools 69 不变。
首跑前要用户做：在 GitHub 网页建 Release `assets-v1` 并上传 `tokenizer.json`（不传则首跑只出冒烟包）。
