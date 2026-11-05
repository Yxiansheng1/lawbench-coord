# B T18 当前案件 wiki 生产流水线交回件

状态：`SOURCE_ONLY_RUNTIME0_NOT_RUN`

正式执行令：`D:\Lawbeach\lawbench-coord\B-T18-current-wiki-pipeline-order-20261030-031059.md`

## 产物

证据目录：`D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\CurrentWikiPipeline-20261030-031059\`

| 文件 | Bytes | SHA-256 |
|---|---:|---|
| `genuine-wiki-pipeline.py` | 72535 | `7925f51ac96401ee7479e3b91ef560b100d5f58544368dfd80a9e25587db5b1c` |
| `literal-inputs.json` | 5339 | `f65ca8ca346d3573f9e0a0bf26835fff797580ab6ae3060255012049a5baa6eb` |
| `README.md` | 9025 | `ee124cb26cd4f48cdeee3eafdc00430a28d3338a47665ce95403f227adf92b1f` |

`literal-inputs.json` 原样保留批准输入，只新增 helper 的 path/bytes/SHA。

## 已核固定事实

- 批准输入：5207 bytes，SHA-256 `80adbfce60c9bf55d8318a783f6a38647730827045d26af8e34f1cf690e870bf`，mtime_ns `1793301059153612300`。
- B346：53548 bytes，SHA-256 `5b2f44a111f9a21dafa7c185a4f62615d151ee96b887b532d60bc7e51d98b098`，346 行；逐项 bytes/SHA 全部一致。
- 批准 8 项原件：bytes/SHA/mtime 全部一致。
- 当前 `line-B` HEAD：`dc56a93be4b07dbe7a48863e3135351659817fb5`。这是只读事实，不是本件提交。

## 实现边界

helper 使用真实 B `create_app`、`httpx.ASGITransport`、生产鉴权、响应契约校验、真实 case registry、scanner、task store、pipeline runner、prompts、checker 和真实 6000D HTTPTransport。私有设置只指向 `http://10.126.126.1:8000/v1`，出站只放行固定 GET `/v1/models` 与 POST `/v1/chat/completions`。

只调用一次 `POST /api/pipeline/run`，由生产流程生成真实 `P-` 任务；无 NativeAgent、SessionUUID、Agent loop、ask callback、prep 或 OCR。生产最终检查结果原样保留，不为求绿重跑。资源设计为共享观测器加每请求独立真实连接池，单请求 close 可真实断流，不会关闭并行另一路 pool；结束、取消并 join 后才关闭全局 pool。

`root-run-report.json` 将由 root 的唯一一次运行生成；作者未生成、未伪造该文件。

## Git 与阻碍

本轮严格执行 Git 只读：没有 add、commit、rebase、stash、reset、clean、checkout 或 push；没有暂存，没有扩权，没有改锁、ACL 或审批。既有 dirty 工作树原样保全，本任务只新增指定证据目录中的三份文件和本交回件。

普通 `git status` 因共享 worktree 的只读 `dsh` 子模块权限返回失败；改用 `--ignore-submodules=all` 完成限定路径只读核对。该权限拒绝不是交付阻碍，未尝试修复。

作者侦察中有 14 次工具调用误填 Bash，全部在目标命令执行前被 packaged Bash、MXC launcher 或 `E_ACCESSDENIED` 拒绝；没有写入或运行产品代码、setup 或 legacy。完整记录见 `README.md`。

## Root 接续

root 先做 whole-source 独立复核，再以 `--root <本证据目录下的新 run-* 目录> --credential-stdin` 执行一次，匿名 stdin 送入专用 Key，保留私有根和全部产物。root 还需独立记录 wrapper/children 的可执行文件、PID、UTC 出生时间、OS/socket 关闭，并人工读取五份 canonical TXT 与最终 wiki 做争议、错误字符、表格筛选和案件卡片核对。
