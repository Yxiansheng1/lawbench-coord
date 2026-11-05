# ORCH-A T33 LargeRef GUI 交回

状态：STOPPED。准备产物未生成，GUI 未启动，作证未运行。

阻断：一次并行只读查询误将 shell 参数设为 `bash`，运行器立即拒绝为
`BASH/E_ACCESS_DENIED`。按正式执行令“禁止 shell 拒绝即 STOP、不得重试”，
作者停止全部后续执行；未以 Bash 重试，也未改用默认 shell 绕过。

已完成的只读核对：

- 正式执行令已完整读取。
- pinned-manifest.json 已读取。
- 六个固定输入均与 manifest 的 SHA256/字节数完全一致。
- `git status --short --untracked-files=all --ignore-submodules=all` 已只读核对；
  工作树此前即存在大量 dirty/untracked 项，作者未清理或改写。
- 指定的 preserved dirty 目录存在：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T33-large-ref-gui-before-20261025-131300`。

固定输入 SHA256：

- start-before.ps1: `a268c51e5df0754edbbcd6ebb154591c48f766948bdb5dfdfafd9a591bdfd232`
- stop-before.ps1: `7e9bc2e1216cdd5edc4d70d6d22582329363b3a376bf6c26a11334dea560f647`
- prepare-before.ps1: `1f5ae62fc4675d70f10d6cc0d7b0f44e84b3659a7b3b0460ce4067b658a91b37`
- native-host-entry.py: `93d957dc9a6d7c8ba0150fdf921de94f1854ae719a4fdd3d225c2f4725061139`
- large-source-before.py: `1e2a61ec3104e4339d9bea4802f7344461406b8d276a03126a927cf0324d1609`
- consumer-cases.ts: `5184cd47306d4e419a9b4934a82407b98329cf51c24e5299cf896f0c63cae539`

要求的五个输出文件均未创建，因此没有可报告的产物 SHA：
`prepare.ps1`、`start.ps1`、`stop.ps1`、`create-large-source.py`、`README.md`。
白名单目录
`D:\Lawbeach\lawbench-A\docs\plan\evidence\T33\LargeRefGui-20261025-131300`
未创建。

未改变的不变量：

- 未写旧 A/B/product/E50/native-entry/guard/source/lib/tests/contracts/profiles。
- 未运行 GUI、测试、构建、parser、selftest、setup、service 或旧准备脚本。
- 未使用真实凭据、`.env.local`、Keyring、真实案卷、6000D/395 或真实模型。
- 未调用 Git add/commit/rebase/stash/reset/clean/checkout/push。
- 未更改沙箱、审批、ACL、UAC、隔离、全局设置、端口或 writer lock。

实际命令与拒绝：

- 首命令以绝对原生 pwsh、`login=false` 读取正式执行令，成功。
- pinned manifest 及固定输入 SHA/字节数只读核对，成功。
- Git 工作树与 preserved dirty 目录只读核对；preserved 目录成功，Git 状态成功。
- 一次并行只读查询错误指定 Bash，被拒绝为 `BASH/E_ACCESS_DENIED`；随后立即停止。

根编排下一步：将任务交给符合原生 pwsh 执行边界的运行器，从正式执行令重新开工。
本交回仅为 STOP 事实记录；不得视为 preparation 或 GUI PASS，不得进入 packaging。
