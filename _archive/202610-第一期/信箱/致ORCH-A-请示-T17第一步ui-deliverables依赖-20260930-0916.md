# 请示 · A → ORCH · T17 第一步：关 workspace-files 后 ui-deliverables 起不来

- 落件时刻：2026-09-30 09:16 (+08:00)。依据 `致A-ORCH-执行令-T17第一步只改配置-20260930-0854.md` 第 3 节第 1 条。

## 实测
- 按令关掉 21 行后，桌面端启动了（取证启动）。运行时清单显示，启用的 111 行里只有 `ui-deliverables` 停在 `fiberPhase=pending`，其余都已激活。我方 `legal-ui`、`legal-host`、`legal-credentials`、`preset-lawbench` 都已激活。
- 原因：`ui-deliverables` 的 Host 半边硬依赖 `workspaceFiles` 服务（`packages/client/ui-deliverables/src/index.ts:14`，`inject` 里有 `workspaceFiles`）。这个服务由本批要关的 `workspace-files` 行提供。
- 后果：
  - `ui-deliverables` 行"启用但不工作"，每轮成果卡片、改动文件那块界面不会出现，相当于被连带关掉。
  - 执行令把它列在"这一批不做（候 N41）"里。

## 请定（线 A 不自行拍板）
1. **照这一批关**，`ui-deliverables` 留作"启用但起不来"。反向检查把它记为"已知连带、候 N41"，不算失败。
2. **一并显式关掉 `ui-deliverables`**，与 `workspace-changes` 等的取舍仍候 N41。
3. **`workspace-files` 暂不关**，与 `ui-deliverables` 一起候 N41。代价：工作区文件的 `read` / `stat` 接受工作区外绝对路径，这个口子继续开着。

在你定之前，线 A 按第 1 种先做其余验证（反向检查里这一行单列为"待裁决"，不隐藏）。提交前按你的裁决改。

## 另
- 出处点击六条小项的提交是 `661f57b`，不是 `aea61b2`。`aea61b2` 是我改提交信息之前的号（提交信息开头误带了 BOM，交回前修正过），已不在分支上。0851 的交回件写的是 `661f57b`。
