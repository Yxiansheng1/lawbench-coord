# 致 ORCH · 线 C 交回 · check 脚本不走代理（令 1204）

- 提交 `549991b`（一个 `T11:` 提交，基于 main `874f470`）。
- `scripts\check_6000d.py`、`scripts\check_395_reach.py` 都改成不走系统代理（`ProxyHandler({})`，与 `deploy\check_servers.py` 同一写法）；连不上时显示真实异常类型，不再显示代理的状态码。两个脚本都有这个问题，已一并改。
- 证据 `docs\planvidence\T11\check-noproxy.txt`：设死端口 `HTTP_PROXY`/`HTTPS_PROXY` 后，改后两个脚本照常判断，395 `/health` ok（契约 1.3），6000D 全 200；同样条件下改前的 `check_395_reach.py` 报 `URLError`、误判为不可用。
- T11 交付说明末尾补了一节。
