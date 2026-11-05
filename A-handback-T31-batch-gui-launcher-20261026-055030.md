# A 线 T31 私有 GUI 启动器交回

## 状态

| 类型 | 内容 |
| --- | --- |
| 做了什么 | 在唯一授权目录写入 `prepare.ps1`、`start.ps1`、`stop.ps1`、`README.md`，完成私有三包路由、实际 B 入口、固定构建身份和交回说明。 |
| 目标是什么 | 让主编排审计后以 fresh root 运行真实 T31 输入批次 GUI；当前离 GUI、停止与真人门仍待主编排执行。 |
| 在等什么 | 等主编排累计审计结论。收到放行信号后，主编排新建 fresh root，依次执行 prepare、start、输入区动作和 stop。 |
| 卡在哪 | 本轮无执行阻碍。GUI、服务与模型均未运行，这是执行令边界，不作为启动器失败。 |

## 交回位置

- 工单：`T31-batch-gui-launcher-20261026-055030`
- 分支：`line-A`
- 分支最新提交 SHA：`a23271abee333a9a256fd46a3141da16975c2380`
- Git 状态：本轮禁止 Git 写入；未 add、commit、rebase、stash、reset、checkout 或 push
- 交付目录：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030`
- 主说明：
  `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`

本轮按执行令不创建 `交付说明.md`；本交回件与交付目录 `README.md` 共同承载交回信息。

## 文件身份

| 文件 | 字节 | SHA-256 |
| --- | ---: | --- |
| `prepare.ps1` | 14697 | `0077ad2b8e6776433843bbc10a8f8bb6493edae93c0948c1d0f3fea000ff7af6` |
| `start.ps1` | 63704 | `e24a26332223242cfc960cfb19fd3529e32721699ce000aaba8e34ec74f86b7a` |
| `stop.ps1` | 7127 | `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67` |
| `README.md` | 13333 | `3114b7d03f21a94a35f0d7a16751bbbe116448b1938946735cb37712e584b314` |

## 依据与验证

- 实际 B 入口固定为
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\server.py`；
  实测 `109968` 字节，SHA-256
  `23d95503eeed9c86216a611a47efc88d513b3765228a1e916367ca12ef281d89`。
- B runs 根固定为
  `D:\Lawbeach\lawbench-B\docs\plan\evidence\T31\BatchGuiEntry-20261026-044214\runs`。
- 私有构建清单实测 SHA-256
  `50c04674f198278e3e426448fa265729243c89386045534bb9810951783c7401`。
- 重算私有构建 24 个输出，字节与 SHA-256 全部匹配；输出清单与脚本字面针脚完全一致。
- 重算 18 个冻结身份，全部匹配输入文件 `legacy18-pins.json`。
- `README.md` 的 24 行输出表与构建清单逐项一致。
- 授权目录实测恰有四个文件，无链接或 reparse point。
- 目标目录在 Git 中仅显示为未跟踪目录；既有 dirty 内容未被修改。

## 未做与降级

- 未运行 author parser、prepare、start、serve、probe、测试、TypeScript、Vitest、pytest、collect、build、HTTP、模型、网络、GUI 或 selftest。
- 未产生 Key、Keyring、真实凭据、模型输入输出或真实案卷内容。
- 未执行包装、安装、合并、推送、部署或 GitHub Actions。
- 初始普通 `git status` 因共享 worktree 的嵌套 `dsh` 子模块元数据只读权限拒绝而未完成；随后用 `--ignore-submodules=all` 只读核对。未尝试修权限、改锁或扩权。
- 运行器曾拒绝数次误配置为 Bash 的只读子调用。拒绝时未执行命令；后续任务操作均使用指定 PowerShell 绝对路径。
- 按禁区分界，本轮未用 PowerShell parser 检查脚本语法，脚本实际可执行性由主编排后续准入运行决定。

## 下一步建议

主编排先完成累计审计，并确认三包路由、T50 唯一凭据 provider、24 个输出身份和新 B 入口。审计放行后，主编排以 fresh root 执行四文件目录中的 prepare、start、实际输入区动作和 stop；不得把本轮文件交回写成 GUI 或 T31 验收。

Response ID: file handoff
Response log path: D:\Lawbeach\lawbench-coord\A-handback-T31-batch-gui-launcher-20261026-055030.md
