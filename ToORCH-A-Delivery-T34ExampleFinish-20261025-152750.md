# A线交回：T34 示例精确补齐

- 状态：COMPLETED_PENDING_ROOT_VALIDATION
- 执行者：A线独立 DeepSeek 执行者
- 正式执行令：`D:\Lawbeach\lawbench-coord\ORCH-ToA-T34ExampleFinish-20261025-152750.md`
- 输入目录：`D:\Lawbeach\lawbench-coord\ORCH-T34ExampleFinishInput-20261025-152750`
- 保全快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T34-example-finish-before-20261025-152750`
- 完成时间：2026-10-25T15:28:48+08:00

## 8 个目标文件

| 文件 | before SHA-256 | current SHA-256 |
|---|---|---|
| `api_task_current.res.json` | `f326478213423c67dba1939e2dcc70e0202bb4a459344efbc73f650770b5ee69` | `f7495d698d767204f0d2b7b43712ddae34b590606845133527573af7ef768f64` |
| `core_task_begin.res.json` | `1f318be12f6b153bc55e3b64e373de4f8021c4819b95031f407ec2d63e592fa9` | `0064d8dd06850059cf7d605309ae49df6ef23f03e002a224524be84eb1e24a38` |
| `file_task.json` | `4e0aadd3c97a552fe325be8342dc8e6f41406c94ef9531d5f792108fc619f0ae` | `ab740560b0bbfcb699eb5e0768bf5f1e4ab928b440d0c373bc5777a072799034` |
| `file_task.legacy.json` | 不存在 | `716230f5a779bfca7076a86a7fdcc956cc7e6a86fa2b184efc443bd2939952b1` |
| `api_task_create.req.json` | 不存在 | `3d50ef40d21cfa116dc27fa0dc3a0fae82d00e985084ebfdd4425676f36d39f7` |
| `api_task_create.req_legacy.json` | 不存在 | `e791951d88d1b9d1777e69e7af922a5aeaf1ebcfb0eb92cc5a00b77f1b5842d0` |
| `file_settings.external.json` | 不存在 | `9a3b73923821af19b1cdc89bdf232d7ce3b4f0a163e36adcd353c676cc527f18` |
| `manifest.json` | `7470636eb536e6fb51e76a27a225d28e4c166d444088f83e6030c5c3a3ecec2e` | `779dcca36753580d89d2e6e57f61f8f5740be94c58450c64b1d0b99fc3fbe234` |

上表 7 个样例的 current SHA-256 均与输入同名原件逐项相等。

## 准确变更

1. 覆盖 `api_task_current.res.json`、`core_task_begin.res.json`、`file_task.json`，内容逐字节复制输入同名原件。
2. 新增 `file_task.legacy.json`、`api_task_create.req.json`、`api_task_create.req_legacy.json`、`file_settings.external.json`，内容逐字节复制输入同名原件。
3. `manifest.json` 保留全部原条目与顺序，只在末尾按 `facts.json` 的 `missing_entries` 顺序追加上述 4 个新 case；未增删、重排或改写旧 case、schema、pointer、expect。
4. 除 `contracts/examples` 内的上述 8 个目标外，未改动产品、测试、schema67、生成器、VERSION、lib、E50、准备、guard、权限、TEMP、沙箱或锁。

## 作者验证边界

- 仅执行了读写、逐字节复制、SHA-256 固定和目标存在性核对。
- 按令未运行任何 parser、测试、`check_examples.py`、build、服务、GUI 或联网/Key 检查；样例 JSON 的机器验证留给 root。
- 按令未执行任何 Git 写操作，包括 add、commit、rebase、stash、reset、clean、checkout、push；因此无提交 SHA。本协调目录文件即为正式交回。
- Packaging 保持 HOLD；未 package、安装、merge、push、部署或产生费用。
