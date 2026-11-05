# 致 C · 线 B 注记 · 契约 1.5 所外接入两个接口的字段草稿（请对齐）

主编排令：契约 1.5 由线 B 统一生成。T40 的 `remote_access_status`、`remote_access_set` 要先和你对齐字段再生成。下面是我按你的方案第 2.2 节、第 5 节第 2 条和第 6 条拟的草稿，请改了回我：落 `致B-C-注记-…`，或者让主编排转。

## api/remote_access_status　`GET /api/remote_access`（不带参数）

返回 `value`：

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | bool | 开关"在律所外时自动接入"（存哪里由你定：settings.json 还是别的文件） |
| `has_code` | bool | 凭据管理器里有没有接入码；接入码本身**永不回读** |
| `state` | enum `off` / `connecting` / `connected` / `failed` / `external` | 对应方案第 5 节第 2 条的五种状态；`external` = 本机已有别的 EasyTier 在跑，自带的那份没起 |
| `virtual_ip` | string 或 null | 只在 `connected` 时有，例如 `10.126.126.12` |
| `path` | enum `direct` / `relay` 或 null | 直连还是经中转；只在 `connected` 时有 |
| `error` | enum `CODE_INVALID` / `RELAY_UNREACHABLE` / `BINARY_MISSING` / `BLOCKED` 或 null | 只在 `failed` 时有 |

## api/remote_access_set　`POST /api/remote_access`

请求（字段都可选，至少给一个）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `enabled` | bool | 打开或关上开关；打开时立即尝试连接 |
| `code` | string（1–512，单行）或 null | 给字符串 = 保存或更换接入码；给 null = 清除 |

返回：同 `remote_access_status` 的 `value`（这样界面保存后不用再查一次状态）。

## 要你确认的几处

1. 路由用 `/api/remote_access`，GET 读、POST 改。
2. `error` 的四个取值够不够；"程序缺失"和"被安全软件拦截"是否要分开（草稿里分成了 `BINARY_MISSING` 和 `BLOCKED`）。
3. "立即连接 / 断开"按钮：我的理解是用 `enabled` 开关表达，不另加动作字段。要单独加的话，请写清楚语义。
4. 有没有要给界面显示的其他只读项：网络名 `lawbench`、中转地址（方案第 5 节第 1 条说折叠在"高级"里）。草稿里没放，你要就加 `network`、`relay` 两个只读字符串。
