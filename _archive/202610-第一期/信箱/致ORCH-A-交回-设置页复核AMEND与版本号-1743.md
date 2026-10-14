# 线 A 交回 · 设置页三提交复核 AMEND（令 1726）＋版本号（注记 1706）· 2026-10-04 17:43 (+08:00)

## 提交

line-A：`8dc72d8` 之上新增 `c5fba37 T13:`，一个提交。前面的提交没有改动。

## 逐条

1. **P1 去掉关窗口拦截**
   - 已删除 `installUnloadGuard`，界面代码里不再有任何 `beforeunload` 监听。
   - 点 × 只是藏窗口，草稿在内存里不丢。
   - "退出前问"要接 DSH 主进程的退出确认，**记为独立后续**。
   - 用例：有修改时 `beforeunload` 不被阻止，并扫描 `ui\` 确认没有该监听。
2. **P2 "取消"按钮**
   - DSH 打开设置的入口（快捷键命令 `settings.open` 的 run、设置外壳的 open）都在 DSH 内部，扩展拿不到。
   - 按令走第二条路：按钮改为"留着修改（下次打开设置还在）"，选它什么都不做；已删除 `reopenSettings`。
   - 真机核对：三个按钮依次为"留着修改（下次打开设置还在）｜不保存｜保存"；选第一项后弹框关闭、设置仍开着。
3. **pathState**
   - 新文件 `host\path-state.ts`：网络路径、设备路径（`\\host\share`、`//host`、`\\?\`、`\\.\`）和相对路径不收。
   - 改为带 3 秒超时的异步 `stat`；超时或除"不存在"外的错误都回"不知道"，界面不撤。用例三例。
   - 移除逻辑挪到 `rightbar.ts` 的 `forgetIfGone`，用例覆盖"不在就撤、还在不撤、问不到不撤"，并核对先问了 pathState（复核员变异 M2 现在能抓到）。
4. **NOTE 切换菜单**：不再监听整页滚动，只在窗口尺寸变化时收起。标题栏不随对话滚动，固定定位的菜单不会错位。
5. **版本号**
   - DSH"通用设置"现在显示"当前版本：0.1.0"，真机已核对。
   - 做法：P-4 补丁加两个文件节（`CurrentVersionRow.tsx` 和它的测试）。`DSH_CLIENT_VERSION` 本身不动，更新检查仍用它。
   - dsh-ext 有一例核对它与 `PRODUCT_VERSION` 一致。

## 检查

- dsh-ext 607 通过、6 跳过；typecheck 通过。
- DSH 全量构建通过；补丁链 143 个路径、0 不一致；DSH `components.client.spec.tsx` 13 例通过。
- 同目录 `apply`、`shell` 两个测试文件在本机单独跑时加载不了（`cannot resolve plugin package @deepseek-ai/dsh-web-app`）。这是测试环境问题，与本改动无关，已记在 PATCHES.md。
- 交付说明：`T13\交付说明.md` 末节；PATCHES.md 末节。

## 演示实例

- 已重启到全新的 `D:\lawbench-devhome-demo9`，停在"首次配置"，留给用户。
- 真机核对用过 `-shots` 数据目录：只改了内存里的草稿，选了"留着修改"，没有保存。
