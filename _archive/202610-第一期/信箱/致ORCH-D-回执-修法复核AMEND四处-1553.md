# 致 ORCH · 线 D · 回执 · 令 1550 四处已修（2026-10-06 15:53）

`line-D` `737ef2e`：P2-A 工作流 `defaults.run.shell: bash` + 加回 PIPESTATUS；P2-B smoke 采样 pgrep/lsof `|| true`，`connections.txt` 必须含 `127.0.0.1:<端口> (LISTEN)` 否则 FAIL；P3 无窗口 / 截图失败即 FAIL；P3 tokenizer 查询出错即失败、只有查到列表无 tokenizer.json 才降级，README 写明 `assets-v1` 须为**已发布**且先建好。说明见交付说明第 6b 节。只改了工作流、smoke.sh、README，不涉及产品代码与用例计数。
