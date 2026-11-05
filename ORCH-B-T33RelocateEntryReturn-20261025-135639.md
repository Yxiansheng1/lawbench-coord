# ORCH-B T33RelocateEntry 交回

状态：`PREPARED_FOR_ROOT_REVIEW`

是否完成：本次有界准备已完成；源码与 README 已齐，但作者未运行任何新脚本、测试、服务或 GUI，不能宣称 relocate 已跑通或完成 T33 验收。

## 实际交付

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\server.py`
  - 47829 bytes
  - SHA-256 `2247027d653b3f0180b276cebacff0f7e0a491d64e9a9aac54deb88dce6447b2`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\source-stage.py`
  - 24462 bytes
  - SHA-256 `b1b6d89a93e817e1dcc86e241e355011e37367da70dfdc92b85dee31b0edc36e`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\README.md`
  - 5868 bytes
  - SHA-256 `3ee601d15b1808a3f8e651721f05eb00d8d8c036f8e0d7956f0d5cb5640d7c0d`

## 修改范围

- `server.py` 从 `server-before.py` 逐字复制后仅做以下增量：
  1. `ROUTES` 追加 `POST /api/materials/relocate`。
  2. `CASE_ROUTES` 追加同一路径。
  3. `Firewall` 新增短专用 `_relocate_target`：固定 ready 目标、旧 source 必须以 `lexists` 判断不存在、绝对规范路径、无重解析、普通文件、`st_nlink=1`、非 sparse、47379 bytes、固定 SHA-256。
  4. `_policy` 新增 relocate 分支：body 必须为 dict、case 已绑定且相同、`ref_id` 严格 `R01`、目标与文件身份全部通过后才转交原生产品 app。
- `source-stage.py` 是 stdlib-only 新脚本，CLI 仅 `--root` 加 `--create`/`--move`/`--verify` 三选一。固定本单 `runs` 基座与 `T33-host-YYYYMMDD-HHMMSS`；create 复制固定 JPEG 并写 `relocation-source.json`；move 先读取真实 `引用.json`、`index.json`、`started.json`、`gui/state/current.json`，确认真实 R01 与 running 后用 `os.rename` 单次改名并写 `relocation-move.json`；verify 只读识别 create/move 两态。
- `README.md` 写明 root prepare/create/verify、审 server SHA、真实 app 启动、`mode=ref` 登记、真实 GUI running/PID、move、missing 重扫、原生选择固定目标、relocate 请求、move 后 verify 和 600 秒关闭边界。

未修改产品、契约、模型、E50、旧入口、旧启动器、网络 guard、PDF、权限、审批、锁或 TEMP。未写 launcher。

## 只读核对

- 正式输入五项当前 SHA 与 `pins.json` 全部一致：
  - `server-before.py`、`safe-source-before.py`、`refs.py`、`materials.py`、`folder-actions.ts`。
- 用 Windows `fc.exe /n` 对照 server baseline，变更仅为上述路由、路由集、专用方法和 policy 分支。
- 静态检查确认 source-stage 导入均为 stdlib，无 socket/httpx/urllib/requests/subprocess，无 delete/rmtree/unlink/replace；唯一改名调用是 `os.rename(source, target)`。
- 目标输出目录在本次前不存在；现在仅上述三份授权源码/文档。没有其他 worktree 写入。

## 未运行

- 未运行 `server.py --prepare` 或 `--serve`。
- 未运行 `source-stage.py` 的 create/move/verify。
- 未运行 Python compile/parser、测试、安装、导入、scan、relocate、OCR、网络或 GUI。
- 未调用 Git；没有 add/commit/rebase/stash/reset/clean/checkout/push，也未处理 `index.lock`、权限或 writer 锁。
- 因此源码语法、真实产品 API、GUI、候选匹配、最终 cleanup 均仍须 root 验证。

## root 后续依赖

1. root 完整审 `server.py` 与 `source-stage.py`，并以已记录 SHA 固定待用件。
2. root 准备一个全新的本单 `runs\T33-host-YYYYMMDD-HHMMSS`，按 README 执行 prepare/create，先取得 `state=create`。
3. root 核对 `<root>\started.json` 的真实 PID，并确认真实 GUI `<root>\gui\state\current.json` 的 `runRoot` 是同一根、`phase` 为 `running`。
4. 必须由获批的真实 launcher/environment 注入运行期 `LB_PORT`、64 位十六进制 `LB_TOKEN` 和准确 `LB_APPDATA`；本交回件不含 token 或 launcher。
5. 必须由原生产品 app 打开 `<root>\case`，用 `POST /api/materials/import` 的 `mode=ref` 真实登记固定源；`source-stage.py --move` 会拒绝手写/未真实解析的 R01、非 `ok` 引用、非 `parsed` 材料、非 running GUI 或错误路径。
6. move 后必须在真实 GUI 重扫到 `missing`，由律师原生选择固定 `relocation-moved.jpg`，再走真实 `POST /api/materials/relocate`；不得用预设响应替代。
7. 最后运行 `source-stage.py --verify`，预期仅文件态 `state=move`；它不证明 GUI/API 成功。root 还需核对原生 relocate 返回、引用/索引更新、listener/net/log/event-loop 关闭及 `final-metadata.json`。

若任一 stage 失败，保留整个 run 和准确阻碍；不要重复 create/move、覆盖目标、清理证据或扩权。
