# A 进度：T31 UI 竞态修复

时间：`2026-10-26T15:25:47.5714717+08:00`

状态：`SOURCE_PATCH_COMPLETE / FORMAL_HANDBACK_WRITTEN / ROOT_RUN_PENDING`

- 正式执行令已读，当前 HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`，分支 `line-A`。
- 已核对根实际红、冻结新 4 项、旧 15 项源码、Spec 5.1、D13 和 request-scope 契约。
- 只改产品文件 `dsh-ext\ui\material-batch.ts`；没有改 `.tsx`、测试、配置、契约或 B。
- 修复内容：建批 owner 代次阻止迟到成功/失败/提示落账；异步 prepare 后重核当前案件、
  批次 ID 和当前选材，不一致即释放同一个 R 并保留当前批次供新 R 重试。
- 作者验证：`NOT_RUN`。四个新红是否转绿、旧 15 项是否无回归、受影响类型是否通过，
  均由根独立复核后实际执行；当前没有绿色声明。
- 全程 Git 严格只读；共享 `dsh` 子模块权限拒绝没有修复。所有既有 dirty 均保留。
- 正式交回：`A-handback-T31-ui-race-fix-20261026-152026.md`。
- 根待跑：
  `node scripts\test.mjs tests\material-batch-races.spec.tsx`；
  `node scripts\test.mjs tests\material-batch.spec.tsx tests\material-batch-boundaries.spec.tsx`；
  `node ..\dsh\node_modules\typescript\bin\tsc -p tsconfig.json --noEmit`。
- 开放：prepare 成功到 prompt admission、queued R2 -> steer -> R1、B 丢持久 scope 行。
