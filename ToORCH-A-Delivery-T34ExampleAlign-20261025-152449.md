# To ORCH — A线 T34 Example Align 交回

## 结论

**状态：BLOCKED（未改文件，待主编排裁决）。**

执行令的前提与 A 工作区事实不一致：`facts.json` 的 4 个 `missing_entries` 所指样例在 A 中不存在，而执行令同时要求“A 已经存在且与 B 同字节”“不能再新建样例”。若按令追加 `manifest.json`，会留下 4 个悬空文件引用，故未继续施工。

## 只读核验

- 指定输入目录：`D:\Lawbeach\lawbench-coord\ORCH-T34ExampleInput-20261025-152449`
- 已完整读取：`facts.json`、`api_task_current.res.json`、`core_task_begin.res.json`、`file_task.json`、`manifest.json`
- `git status --short -- contracts/examples`：无输出
- A `contracts\examples`：101 项
- B `contracts\examples`：105 项
- A/B 唯一差异：B 独有 `file_task.legacy.json`、`api_task_create.req.json`、`api_task_create.req_legacy.json`、`file_settings.external.json`
- A 中按准确文件名递归检索上述 4 项：无匹配
- 指定 before 保全目录中检索上述 4 项：无匹配

## SHA256 对账

| 目标文件 | A before/current 文件 SHA256 | facts.json 的 source SHA256 |
| --- | --- | --- |
| `api_task_current.res.json` | `f326478213423c67dba1939e2dcc70e0202bb4a459344efbc73f650770b5ee69` | `f7495d698d767204f0d2b7b43712ddae34b590606845133527573af7ef768f64` |
| `core_task_begin.res.json` | `1f318be12f6b153bc55e3b64e373de4f8021c4819b95031f407ec2d63e592fa9` | `0064d8dd06850059cf7d605309ae49df6ef23f03e002a224524be84eb1e24a38` |
| `file_task.json` | `4e0aadd3c97a552fe325be8342dc8e6f41406c94ef9531d5f792108fc619f0ae` | `ab740560b0bbfcb699eb5e0768bf5f1e4ab928b440d0c373bc5777a072799034` |
| `manifest.json` | `7470636eb536e6fb51e76a27a225d28e4c166d444088f83e6030c5c3a3ec2e` | `1c075616fdfea0775637f175741d9d502fa435ea5ad59d7dda04f17d7abfe30c` |

因未改文件，A 的 current SHA256 与 before 相同。Git commit SHA：不适用；本运行未产生提交。

## 验证与边界

- 未修改任何产品、测试、schema、生成器、`VERSION`、`lib`、`E50`、启动准备、guard 或配置。
- 未新增样例，未修改 `manifest.json`。
- 按作者禁区，未运行任何自测、parser、Vitest、tsc、pytest、collect、`check_examples.py`、build 或准备脚本。
- 未运行服务、GUI、联网、Key/凭据/真实案卷操作。
- 未执行任何 Git 写操作，未改权限、TEMP、隔离、锁或审批。
- Packaging HOLD；未 package、安装、merge、push 或部署。

## 待裁决

请在以下范围内二选一：

1. 明确授权补齐 B 中已有的上述 4 个被指样例，再按原令追加 4 个清单项；
2. 修正本次输入事实与施工范围，避免 `manifest.json` 引用不存在的文件。
