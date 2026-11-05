# A 线交回：DemandClosure P0-5 所外接入状态真实性

执行令：`D:\Lawbeach\lawbench-coord\ORCH-A-DemandClosure-P05-UI-20261102-180600.md`

## 交付结论

已完成令内允许的有界源码修改，并新增一份窄范围组件单测。未执行任何测试、解析、类型检查、构建、准备、运行时、HTTP、模型、GUI、Key 或 self-test，因此本交回不宣称测试 PASS，也不构成 GUI 验收。

## 实际写入文件

1. `D:\Lawbeach\lawbench-A\dsh-ext\ui\remote-access.tsx`（修改）
2. `D:\Lawbeach\lawbench-A\dsh-ext\tests\owner-remote-p05-20261102.spec.ts`（新建）
3. `D:\Lawbeach\lawbench-coord\ORCH-A-DemandClosure-P05-UI-handback-20261102-180600.md`（本交回文件）

除此之外没有写产品、契约、Host、Agent、SDK、旧测试或其他文件。

## 实现范围

- `off` 且 `has_code=false`：显示“未设置接入码”；即使 `enabled=true` 也不显示连接中。
- `off` 且 `has_code=true`：显示“已设置接入码·未连接”。
- `connecting`：显示“连接中”。
- `connected`：显示“已连接（对端可达）”，并明确仅为至少一台律所服务器可达，不表示两台都可用或身份认证已通过。
- `external`：显示“已使用所外地址（对端可达）”，保留软件托管隧道、认证和中继均未验证的边界。
- `failed`：保留契约原因详情；`NO_CODE` 显示“未设置接入码”。
- 读取返回 `SERVICE_UNAVAILABLE`：显示“服务未启动或不可达，请先启动工作台服务”。
- 其他读取失败：显示“状态读取失败（固定错误码），请检查工作台服务”，不显示原始服务 message 或请求输入。
- 读取失败会清除旧的已成功状态；失败后的轮询重试期间不再同时显示“读取中”，也不会保留旧 connected。

接入码密码输入框、输入后立即清空、不写 `localStorage`、不回显接入码、单动作 POST、先保存后启用、现有 epoch/busy/ref 竞态门、轮询清理、按钮和持久化说明均保持原有实现。契约字段和原因未改动。

## 新单测覆盖

`owner-remote-p05-20261102.spec.ts` 通过现有 `contracts-source.mjs` 的 `loadContracts()` 读取当前 A 契约，挂载真实组件并注入可控假 API。覆盖：

- 无码 off，包括 `enabled=true` 时不得假装连接。
- 有码 off。
- connected 的“至少一台可达”边界。
- 读取失败清除旧 connected、显示固定服务提示、失败后不再同时显示“读取中”。
- 其他读取错误显示固定错误码且不泄露原始 message。
- 密码输入、不回显、不写本地存储，以及保存仍为一次单动作 POST。

该测试文件按要求仅新增，未运行。旧 `dsh-ext/tests/remote-access.spec.ts` 原样未改、未运行。

## 既有状态与证据复用

- 开工只读核对时，`remote-access.tsx` 无 dirty 差异，旧 `remote-access.spec.ts` 未改动。
- 工作树现有大量旧任务 dirty 内容（包括 P0 archive/case-tab/overview/shared schema 与 centeredlogo 相关路径）均未触碰。
- 只读 Git 状态显示当前分支为 `line-A...origin/line-A [ahead 93, behind 1]`（使用 `--ignore-submodules=all`）。
- 协调目录及本线证据中未找到 P0-5 专属既存证据。既往 P0 UI 证据对应的组件源码已被本次修改改变，不可作为本次源码的通过证据冒充复用。

## Git 边界

本轮未执行 `git add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。无提交 SHA。仅使用只读 `git status`、`git diff` 命令。

## 命令失败与警告

1. 首次 `git status --short --branch` 退出码 1：Git 尝试进入受保护子模块 `D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh` 时返回 `Permission denied`。随后使用 `git status --short --branch --ignore-submodules=all` 完成只读状态核对；未修复权限、未改 ACL、未拆 writer 锁。
2. `rg --files docs/plan/evidence -g '*P05*'` 退出码 1，无匹配；属于证据搜索无结果，不是执行故障。
3. `rg -n "P0-5|P05|所外接入状态真实性|owner-remote" ...` 退出码 1，无匹配；属于证据搜索无结果，不是执行故障。
4. `git diff` 提示 `remote-access.tsx` 的 LF 将以 CRLF 写回，属现有换行属性提示，命令退出码 0。
5. 最终只读检索新测试时，一条 PowerShell `rg` 正则因引号转义未闭合而退出码 1，报 `regex parse error ... unclosed group`；未执行测试或修改文件，随后改用无正则参数复核。

## 遗留

- 新单测尚待在允许执行验证的车道运行；本交回不评价红绿，不宣称通过。
- 当前 Root 的 B 线缺失路由由独立作者处理，A 线未触碰。
- 真实 GUI、真机、HTTP、模型和所外接入端到端验收不在本次授权范围。
