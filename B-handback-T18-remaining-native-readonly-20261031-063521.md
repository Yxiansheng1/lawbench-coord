# B 线交回：T18 remaining native readonly preparation

交回时间：2026-10-31  
状态：SOURCE_NOT_RUN / ROOT_PENDING

## 已完成

- 已核读正式执行令、inventory、四份 approved 输入和完整 baseline 源码。
- 仅新建四个任务的 `readback.mjs` 与四份 `literal-inputs.json`，另写本目录 README 和本交回件，共 10 个文件面。
- 四份脚本由同一 baseline 机械复制；唯一文本变化是 purpose 常量从 `ORIGINAL_FAILED_PREISSUE_JSONL_READONLY_REOPEN_ONLY` 改为 `ORIGINAL_FAILED_NATIVE_RUN_JSONL_READONLY_REOPEN_ONLY`。未改逻辑、helper、guard、import、condition、pin、Context/JsonlPersistence、两次 open/read/close、finally 或退出处理。
- 四份 `literal-inputs.json` 均来自对应 approved 文件的逐字节复制；四份输入保留各自独立的 session root 与 task path。
- baseline：8938 bytes，SHA-256 `14a5a1bba490624f7767fce4ccf35924a7fd2103c5cad9858a9a3ae65596e920`。
- 四个准备脚本共同为 8940 bytes，SHA-256 `5e109463c32f142d4e83c5a313f371b80c882ab23b0f7c5db3e1f6f0aa30eabb`。

## 未运行与不可宣称

- 未执行任何 `readback.mjs`；B 侧实际 readonly SDK 检查数为 0。
- 未运行 Node、SDK、model、GUI、HTTP、Agent、parser、AST、import、tests、checks、assertions、prepare、App 或全量套件。
- 未重跑业务、法律、模型、GUI、Agent、history、UUID、R、migration 或 callback 流程。
- 因此不得宣称四任务通过、T18 全通过、Skill 通过、业务通过、法律通过或整体 PASS；原始业务状态仍为 FAILED，原始 reopen 状态仍为 NOT_REACHED。
- 全量套件仍等待 owner 同步放行；本交回不构成放行条件。

## 原始证据准备路径

`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\RemainingNativeReadonly-20261031-063521\`

该目录含 README.md、四组 `readback.mjs` 与 `literal-inputs.json`。这些仅是待 Root 检查的 source/input 准备件，不是运行结果。

## 只读 Git 状态阻碍

允许的只读 `git status --short --untracked-files=all` 被既有 worktree/submodule 权限拒绝：

`fatal: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh': Permission denied`

随后报告子模块 `dsh` 失败。未尝试修复或扩展权限；未执行任何 Git 写入、lock 修改、ACL/审批变更或 stash/reset/clean/checkout。除本次明确授权的新文件外，未触碰既有 dirty、原始 sources、FAILED 状态、raw、formal、旧封包、SDK 或私有状态。

## 写入阶段说明

八组脚本和输入先落盘；同一 Shell 阶段在枚举 README 元数据时提前中止，因此 README 与本交回件随后以文件补丁补齐。该过程没有增加写面，也没有触发其他执行或验证。

## Root 后续边界

Root 继续做 full whole-byte inverse、source pin/core-approved byte equality、同一个新脚本字节的四副本语法检查、四个实际只读 SDK 检查、OS/source closure 及最终判读。B 到此停止。
