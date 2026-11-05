# ORCH-B：T33 目录引用搬移准备交回

状态：独立最小准备已完成，等待 root 全累计审与后续运行；本交回不代表 green、GUI 通过或 T33 验收。

## 目标

在既有已审 9 routes Host 基座和原安全守卫框架上，把 `R01` 引用根从固定文件改为固定单成员目录：只准备一份新 `server.py`、一份目录源 helper 和说明，不运行 prepare/serve/GUI/RPC/HTTP 或任何测试。

## 实际改动与全部新路径

新证据目录：

```text
D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateEntry-20261025-195450\server.py
D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateEntry-20261025-195450\source-stage.py
D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\DirRelocateEntry-20261025-195450\README.md
```

正式交回：

```text
D:\Lawbeach\lawbench-coord\ORCH-B-T33DirRelocateReturn-20261025-195450.md
```

没有生成 `runs`、run、引用、index、history、task、rollout、launcher、start/stop 文件或测试产物。未写产品、tests、contracts、lib、原 E50、原 RelocateEntry 证据或历史状态。

### server.py

`server.py` 以输入目录中的已审原件（47829 bytes，SHA-256 `2247027d653b3f0180b276cebacff0f7e0a491d64e9a9aac54deb88dce6447b2`）为新文件字节基座，累计 diff 限定为：

- `Firewall._relocate_target` 的说明和实现。
- 固定源目录改为 `self.ready / "relocation-source-dir"`。
- 固定目标目录改为 `self.ready / "relocation-moved-dir"`。
- 只接受绝对且 canonical 精确相等的固定目标；旧源目录无论文件还是目录，都用 `lexists` 要求不存在。
- 目标目录自身及唯一 child 全链拒绝 link/junction/reparse。
- 目标目录必须恰有一个成员，且只能是 `relocation.jpg`；child 必须普通、`nlink=1`、非 sparse、47379 bytes、固定 SHA-256。
- 哈希前后复核 child 的 size/mtime/inode、mode、nlink、file attributes，同时复核目录安全身份和成员集合。
- 原 `Deny` / `OSError` 等异常继续 fail-closed。

原 9 条 `ROUTES`、`CASE_ROUTES`、认证、headers/messages/body delegation、source pins、prepare、socket/getter/Keyring/OCR/lifespan/Retainer 和总界未改。

### source-stage.py

`source-stage.py` 以输入目录中的已审单文件（24454 bytes，SHA-256 `391a6da87a3ce2dc3f0a4f013d42967e26a5f4defbeeacba0ed998cb958df50e`）为字节基座，累计改动范围为：

- `ALLOWED_BASE` 改为本准备目录下 `runs`。
- sidecar schema 改为 `T33-dir-relocate-source-v1` / `T33-dir-relocate-move-v1`。
- 固定源/目标改为 `relocation-source-dir` / `relocation-moved-dir`，唯一 child 为 `relocation.jpg`。
- 新增目录安全身份与唯一 child 守卫；`_hash_file` 在哈希前后增加 mode/nlink/file attributes 身份核对。
- `--create`：仅 fresh 原 shape、空 case、ready 唯一原 JPEG；exclusive mkdir 源目录、exclusive copy child、exclusive 写 source sidecar。source sidecar 以目录 path record 加 child file record 表示，不把目录送入 `_file_record`。
- `--move`：要求 source sidecar、真实 `R01 kind=dir/status=ok/path=source-dir`、恰一份 `origin=ref` 且 `rel_path=工作区/引用/R01/relocation.jpg` 的 `needs_ocr` 材料、47379 bytes/固定 SHA，以及真实字段 `material_id/name/imported_at/text_path` 存在；要求 `started.json` 和 `gui/state/current.json` 同 root 且 running；只执行一次同父兄弟目录 `os.rename`，禁止目标已存在或重复 move。
- move 前后保留 child size/hash/mtime/inode 与安全属性、目录安全身份和成员集合；核对 prepared、原 JPEG、source sidecar、refs、index 完全未改。helper 不写 refs/index/GUI。
- `--verify`：create 态只接受原 JPEG 与 source dir 且 case 空；move 态只接受原 JPEG 与 target dir；检查目录唯一 child、sidecar、原 JPEG/prepared 和 move 记录。不要求目录 mtime 保持。

原 runRoot 规范/直接父目录、prepared shape、unsafe path、hardlink/sparse、真实原生登记、GUI running 和 exclusive sidecar 守卫保留。

### README.md

说明固定路径、CLI、root 生命周期、真实 PID/exe/creation 与 GUI running 前置、真实 native 登记后才可 move、create/move/verify 边界、未运行声明，以及旧 GUI launcher 不能固定新 server；下一独立启动准备由 root 另裁定。

## 未运行声明

本作者没有运行：

- `server.py --prepare` 或 `--serve`；
- 任何 GUI、launcher、RPC、HTTP、socket 服务、网络请求；
- `source-stage.py --create/--move/--verify`；
- pytest、Vitest、tsc、collect、parser、compile、build、import、语法检查或任何自测/自证 hash；
- Git add/commit/rebase/stash/reset/clean/checkout/push。

因此当前没有新 run、服务、PID、请求、sidecar 或 GUI 证据。旧已通过证据只作为输入源码/真实 shape 参考，未把它们复制冒充本次运行元数据。

## 实际阻碍与残留

- 只读 `git status --short` 在 B 工作树被 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-B-new/modules/dsh` 的 Permission denied 阻断，命令退出 1。按本执行令未尝试修复、扩权、改 ACL、改审批、拆锁或执行任何 Git 写操作；既有 dirty 通过只写白名单新路径保全。由于状态读取不完整，本交回不声称已枚举全部既有 dirty。
- 本单明确禁止运行，故当前源码没有运行证据、行为绿灯或 GUI 证据。
- 新 server 不能沿用旧 GUI launcher 的 pin；需 root 先独立审查本目录，再另行裁定有限 guard 验证、GUI 与启动准备。

建议 root 下一步：审完整新源码与累计 diff，确认原 9 routes 和其余 AST/逻辑边界，再按新单独立决定是否运行有限目录 guard 验证及后续 GUI 生命周期。
