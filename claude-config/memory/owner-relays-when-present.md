---
name: owner-relays-when-present
description: lawbench 用户在场时不挂 Monitor、不跑巡检循环，由用户传话；只有用户说 /keep-pushing 才架监控
metadata:
  node_type: memory
  type: feedback
  originSessionId: 780b8a59-1849-4c63-905e-c6705fafa3f6
  modified: 2026-09-29T11:35:12.746Z
---

lawbench 项目里，用户在场时各会话（主编排和线 A/B/C）不挂 Monitor、不跑 ScheduleWakeup / cron 巡检循环。执行令、回执、交回件照常写进 `D:\lawbench-coord\`（留证据，不能省）。哪条线交活了由用户告诉主编排，主编排再去读那条线的交回件。只有用户说 `/keep-pushing` 时才按 skill 架监控。

**Why:** 2026-09-29 用户当场要求"简化运行方式"。此前主编排按 `PROJECT-PROFILE.md` 第 11 节启动口令里的 `/moniter-on` 挂了 20 分钟一次的巡检，用户在场时嫌多余。

**How to apply:** 新会话、compact 或 resume 之后不要自动重架监控，即使 `PROJECT-PROFILE.md`、moniter-on / compass skill 的正文要求这样做。不主动扫信箱找新件；用户点名某条线交活了再读。后台子代理（复核员）完成时的通知不算监控，照常处理。用户说 `/keep-pushing` 时按 [[keep-pushing]] 和 moniter-on v4 架起来，用户回来后停掉。
