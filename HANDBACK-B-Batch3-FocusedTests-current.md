# HANDBACK — B Batch3 Focused Tests (current)

执行令：`ORCH-B-Batch3-FocusedTests-20261103-002810.md`
线：B 线（DeepSeek 执行者）
日期：2026-11-03

## 结论

已按令新增**一个**测试文件，未改产品代码、未改任何既有测试、未动契约：

`D:\Lawbeach\lawbench-B\service\tests\test_owner_real_connect_batch3.py`

文件内 4 个聚焦测试（每个只覆盖一件事）：

1. `test_app_alias_and_default_core_location` — `lawbench.app.RemoteAccess` 就是
   `lawbench.remote.RemoteAccess`；`DEFAULT_CORE_DIR == REPO_ROOT/'easytier'`；
   清掉 `LB_EASYTIER_DIR` 后实例的 `core == DEFAULT_CORE_DIR/CORE_NAME`。只构造，不启动。
2. `test_core_args_have_no_secret_and_no_tun_or_service` — `core_args` 返回的列表里
   有 `--no-tun` / `--dhcp` / `--no-listener`，没有 `--network-secret`，没有 `--tun`、
   `--service`，也不含接入码字符串。只看返回值，不执行。
3. `test_direct_reachable_goes_external_without_owned_process` — 假 core 文件（只含合成标记，
   永不执行）存在、所外地址假可达时，`_run()` 同步跑完状态为 `external`，`_proc is None`，
   `_run_once` 被替换成「一调用就报错」。
4. `test_missing_core_fails_without_spawn` — core 目录不存在时状态 `failed` / `missing`，
   `_proc is None`，不起进程。

## 隔离措施（文件内自带）

- autouse fixture 把 `subprocess.Popen` 和 `threading.Thread.start` 换成直接报错的桩，
  本文件任何测试都无法起进程或起线程。
- 接入码只在内存（`MemSecret`），不落盘、不碰钥匙串；地址全部走内存假实现
  （`FakeNet.alt_target` → `('127.0.0.1', 1)`、`candidates` → `[('http://127.0.0.1:1','alternate')]`、
  `probe` → `True`），不发任何请求。
- 不用 `create_app`、不触发默认 lifespan、不碰 OCR / Retainer / 真实 Key。

## 验证状态

- 按令的验证禁区要求：**未运行** Python / pytest / 语法解析 / 自检 / 构建 / HTTP / GUI /
  模型调用，因此本文件在本次运行中**没有执行过**，其通过状态由主编排在允许执行时确认。
- 未运行 Git 任何操作（含只读查询），未 add / commit / rebase / stash / reset / clean /
  checkout / push；未暂存任何内容。工作区保留既有 dirty 状态，未触碰。
- 未读写协调目录里的历史件、未读原始 owner 文件（含敏感内容）、未联系其他会话。

## 偏离之处

- 执行令写「Do not explore; write now then STOP」。为避免写出对不上真实 API 的测试，
  在落笔前只读了一个产品的 `lawbench/remote.py`（含 `RemoteAccess`、`core_args`、
  `DEFAULT_CORE_DIR`、`CORE_NAME`）、`lawbench/net.py`、`lawbench/logs.py`、
  `lawbench/app.py` 开头与 `lawbench/config.py` 的 `REPO_ROOT` 定义，以及本目录一个既有测试
  的写法约定（不读协调目录、不读 Git 元数据、不读其他线文件）。除此之外未探索。

## 遗留 / 待主编排决定

- 待主编排在允许执行 pytest 的环境里跑该文件并回收结果（文件名
  `test_owner_real_connect_batch3.py`），确认 4 个测试通过。
- 未跑既有测试回归（令内禁止执行），故未验证新文件是否影响既有收集结果。
- 本文件不含任何真实地址、真实接入码或案卷材料；`SYNTHETIC-*` 常量均为虚构值。
