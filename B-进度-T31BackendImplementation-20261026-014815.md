# B 进度：T31 后端真实请求绑定与材料范围

- 2026-10-26：已读正式执行令、owner scope/work policy、contract pins、A 交回件、四份冻结 schema 与必要样例。
- B HEAD 已核实为 `dc56a93be4b07dbe7a48863e3135351659817fb5`；`git status` 仍因子模块 `modules/dsh` worktree 元数据权限拒绝，未修锁、改权限或改审批。
- 既有 dirty 保全件已核实存在：before 树、status 和 tracked patch；后续不清理、不暂存、不提交。
- 已新增持久 `request_id` 范围记录与可恢复 claim 顺序，并接入 `TaskStore.begin` 同 R 重放、旧无 R 全案兼容。
- 已把任务固定快照接入 context/L0/L1/wiki、材料列表/读取、搜索、覆盖清单、出处核对及预算续接 reads 过滤。
- 四份冻结 schema 已合入 B，逐一计算 SHA-256 与 `contract-pins.json` 完全一致；VERSION 未改。
- 独立回归源码与 README 已写入指定证据目录，覆盖同 R 并发/重启、墓碑、版本/移除、context/wiki/L1/read/search/coverage 和预算续接 reads。作者未执行。
- 生成器定义、九份输入样例与本单新增内部状态样例/清单已同步；正式交回已在协调目录落盘。
- 按令不执行 unittest/pytest/parser/HTTP/模型/build/安装等验证。
- 执行器曾有只读工具调用误传 `shell=bash`，均由运行时在执行前拒绝，未运行命令、未读写、未作为证据；后续只用指定 PowerShell。
- 当前阶段：B 的有界产品代码、回归源码、证据说明和六节正式交回已完成并落盘；等待 root 审查与运行验证，不宣称 T31 整体完成。
