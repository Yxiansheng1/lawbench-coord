# 交回 · 线 B → ORCH · Key 校验判定 + T18 观察项（回执行令 20261003-1751）

- 落件时刻：2026-10-03 17:56 (+0800)
- 提交：**`23fc350`**（`T3:`），基于 origin/main。产品代码只改 `service\lawbench\api\ui.py`（+26/−12，在你亲核的 30 行内）；测试改 `tests\fakes.py`、`tests\test_api_case.py`。说明：`evidence\T3\交付说明.md` 末节；红绿 `key-check-redgreen.txt`。

## 1. Key 判定
- 真 Key 401/403 → `false`；回其他状态码 → `null`（"Key 暂时无法验证"）。
- 真 Key 200 → 再发一次 `Bearer invalid-<16 位随机十六进制>`：
  - 它被拒 → `true`；
  - 它也回 200 → `null`，提示"网关当前未校验 Key，无法确认 Key 是否正确"；
  - 其他情况 → `null`（"Key 暂时无法验证"）。
- 契约没改。无效 Key 不进日志。
- 假 6000D 加 `valid_keys` 模式：不设 = 网关不校验（现状），设了 = 不在集合里的 Key 回 401。新例 `test_connection_key_three_states` 覆盖三态。把"假 Key 回 200 也算有效"改回去，新例变红。
- 界面侧不用改：Host 首次配置判定是 `key_valid !== false`（`dsh-ext\host\index.ts:362`），null 不挡。律所现网测试连接会显示"网关当前未校验 Key…"，不再显示"有效"。

## 2. "0 毫秒"
- 根因不在 select 的起表位置：Windows 上 `time.monotonic` 约 16 毫秒才跳一次，所内快请求量出来正好是 0，再经 `int()` 截断。
- 改用 `perf_counter`，向上取整。6000D 有 Key 时取真实那次 chat 请求的耗时；没 Key 或探 395 时取健康检查的耗时。

## 3. T18 观察项
`evidence\T18\交付说明.md` 末尾记了两条，T18 实测时核：刑事案件"对方当事人：检察院"的口径；归档方案"承办律师未填"应取设置里的本机律师姓名。

只跑了连接相关用例（8 过）；全量按广播 1712 留给合流。
