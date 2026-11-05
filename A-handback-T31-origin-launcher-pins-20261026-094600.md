# T31 原始启动器诊断入口身份 pin 交回

## 结论

有界修改已完成。`prepare.ps1` 与 `start.ps1` 各更新两处入口身份 literal，
共四处替换；`README.md` 仅在末尾追加诊断入口身份说明。目标脚本文件长度未变，
冻结的 `stop.ps1` 哈希未变。

本件是源码交回，不是验收声明。Packaging HOLD。

## 执行边界

- 执行令：`D:\Lawbeach\lawbench-coord\T31-origin-launcher-pins-order-20261026-094600.md`
- 工作树：`D:\Lawbeach\lawbench-A`，原 `line-A...origin/line-A [ahead 93, behind 1]`。
- 开工时工作树已有大量 dirty/untracked 内容；全部原样保全，未清理、未暂存、未提交。
- Git 全程只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、
  `checkout` 或 `push`。
- 未读取旧交回件，未联系其他聊天，未更换 API，未修改沙箱、审批、ACL 或锁。

## 源码变更

### `docs\plan\evidence\T31\BatchGui-20261026-055030\prepare.ps1`

- 第 10 行：`110075` 改为 `112475`。
- 第 11 行：旧 SHA-256
  `664cb78ce373fad79ba1b80aca99e55ff51cd46a817072dcfd58a3f235097826`
  改为新 SHA-256
  `c44334b2c8d28531c080403d4aa6d1a7c8e5069b699155c4f25fe432ff978d6e`。

### `docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1`

- 第 135 行：`110075` 改为 `112475`。
- 第 136 行：旧 SHA-256
  `664cb78ce373fad79ba1b80aca99e55ff51cd46a817072dcfd58a3f235097826`
  改为新 SHA-256
  `c44334b2c8d28531c080403d4aa6d1a7c8e5069b699155c4f25fe432ff978d6e`。

### `docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`

- 仅追加 `## 2026-10-26 诊断入口身份 pin 复验` 一节。
- 新节记录入口
  `D:/Lawbeach/lawbench-B/docs/plan/evidence/T31/BatchGuiEntry-20261026-044214/server.py`
  为 `112475` 字节、SHA-256
  `c44334b2c8d28531c080403d4aa6d1a7c8e5069b699155c4f25fe432ff978d6e`。
- 旧历史内容未改写；README 从 `22150` 字节增至 `22503` 字节。

## 静态核对

| 文件 | 改前 SHA-256 | 改后 SHA-256 | 改前/改后字节 |
| --- | --- | --- | --- |
| `prepare.ps1` | `edacbeb6999b43774e1f82a7d9460d116845b0474291d70486f03f3dbab1c0ae` | `6218eb10b1c737b1a86c8fcbaab5bbc6d1b05ef05dd3406b17a7b2a089edb958` | `15407` / `15407` |
| `start.ps1` | `7e97e4d826e26c0a8ecd3dd07422dc4ba75ce93b7cebb4f651df8d8b47ae391e` | `aae811cfd650b0d21f4baf52264128532705409bc0481bf0443b7b70519ef1af` | `75433` / `75433` |
| `README.md` | `027cfb2ba85776a5ddd336825fd9ad86116a4f196900ac51e5d2d3f6aef30d1e` | `910654103f5fadfb0e1f85bfb0bd45401c752da955bc5f2527d531a10d489de2` | `22150` / `22503` |

- `prepare.ps1`：旧身份值 `0` 处，新身份值 `2` 处。
- `start.ps1`：旧身份值 `0` 处，新身份值 `2` 处。
- 两个脚本的文件长度均未变化，与等长 literal 替换一致。
- `stop.ps1` 保持 `7127` 字节、SHA-256
  `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67`。

## 未执行与遗留

按令未运行 parser、AST、Python、selfchecks、tests、Vitest、tsc、prepare、
start、stop、probe、build、GUI、HTTP、model、network 或 install；也未读取或
重算 B 线入口文件、未重跑既有构建、路由、鉴权、cleanup、source pin 或 legacy 验证。

本轮只证明四处身份 pin 和 README 记录已按令更新，不证明运行时通过，也不改变
T31 整体验收状态。后续仍需由根编排独立执行反向全字节核对、三路 parser 与 fresh
GUI。无本轮范围内的阻碍；Packaging HOLD。
