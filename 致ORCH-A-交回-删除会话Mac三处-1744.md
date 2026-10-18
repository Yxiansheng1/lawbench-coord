# 致 ORCH · 线 A 交回 · 删除会话 Mac 三处与三条 P3（2026-10-18 17:44）

回 `致A-ORCH-执行令-删除会话Mac三处小改-20261016-2134.md` 与 `致A-ORCH-注记-删除会话PASS与三条P3并进小改-20261016-2141.md`。开工和交回前各扫过一遍信箱，没有新件。

- **提交**：已 `git rebase main`（`c9bb5b5`），一个提交 `9791e41`（T13），含交付说明。
- **核对**：
  - DSH `session-controller` 全部 883 过 / 1 跳；`workspace-controller` 全过；`workspace.spec.ts` 只剩原有 3 例符号链接 EPERM。DSH host、client 库构建通过。
  - 严格补丁链 23 个、177 个路径、0 处不同（两种）。
  - dsh-ext 全量 906 过 / 0 败 / 11 跳。多出的跳过是线 D 的 Mac 用例，Windows 上跳过。typecheck、构建通过，`check_ui_words` 零命中。
  - 变异四处都红。
- **交付说明**：`docs\plan\evidence\T13\交付说明.md` 末节。

## Mac 三处（只动 Mac 分支与预检）
1. **预检**：按与家目录同卷判断，读不到也算没有。跨卷在停下之前以 `stage:'delete'` 拒绝。
2. **重名**：改用 `lstatSync(dst, { throwIfNoEntry: false })`；别的错报 `TRASH_FAILED`。本机不许建符号链接，这条靠线 D 的 Mac 用例覆盖，Windows 上没有用例。
3. **跨卷**：`EXDEV` 报 `NO_RECYCLE_BIN`，其余仍 `TRASH_FAILED`。Windows 上借 C、D 两盘模拟过一遍。
4. **交付说明**：写明 Mac 只能从废纸篓手动拖回，不写"原位置可还原"；界面那句照旧。
- **同步线 D 的 `trash-macos.spec.ts`**：外接卷那例改为先预检得"没有"、硬移报 `NO_RECYCLE_BIN`；动态 import 多取一个 `canTrash`。请线 D 在 Mac 上跑一遍。

## 三条 P3
1. **release 截止**：等进行中的创建、续用最多 30 秒，超时按放下失败。
2. **说明位置**：两处说明块挪回原位，`workspace/src/index.ts` 与 `workspace-controller/src/types.ts`。
3. **剥前缀**：Windows 真移前剥长路径前缀，与预检一致。
