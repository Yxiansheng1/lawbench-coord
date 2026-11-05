# ORCH-B T33 relocate final return

状态：有界修改完成；按令未运行。

## 前提纠正

真实 JPEG 为 47379 字节，SHA-256 为
`feeb9faf008bffb8bdea5977d7ffd269de1177d81b160e1883ba456f186059ad`。
真实 API 成功登记 R01、path 与 identity，不代表 OCR 完成；原生材料状态应为
`needs_ocr`，不是 `parsed`。本次按该事实把断言严格收为 `needs_ocr`。

## 具体改动

- `docs\plan\evidence\T33\RelocateEntry-20261025-135639\source-stage.py`
  - 仅将 `_registered_identity` 中的状态断言改为
    `_guard(material.get("status") == "needs_ocr", "R01 材料状态不是待识别")`。
  - 函数内其余内容及文件其余字节未改。
- `docs\plan\evidence\T33\RelocateEntry-20261025-135639\README.md`
  - 将实际存在的一处材料状态字面前提从 `parsed` 改为 `needs_ocr`。
  - 执行令称有两处；整文件只读核对后实际仅找到一处 `parsed` 字面，因此没有臆造第二处。
    当前为 `parsed=0`、`needs_ocr=1`。
- `docs\plan\evidence\T33\RelocateEntry-20261025-135639\start.ps1`
  - 从已审源文件原样复制。
  - `NativeEntry` 仅改为
    `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\server.py`。
  - `NativeEntrySha256` 仅改为
    `2247027d653b3f0180b276cebacff0f7e0a491d64e9a9aac54deb88dce6447b2`。
- `docs\plan\evidence\T33\RelocateEntry-20261025-135639\stop.ps1`
  - 从已审源文件原样复制。
  - `runsRoot` 仅改为
    `D:\Lawbeach\lawbench-B\docs\plan\evidence\T33\RelocateEntry-20261025-135639\runs`。

`server.py`、产品代码、旧准备件、旧 formal、E50、guard/resolver、PDF 分支、环境、
关闭逻辑、预算、C551、overlay 前缀和 disable+insert suffix 均未改。

## 文件完整性

| 文件 | 字节 | 当前 SHA-256 |
|---|---:|---|
| `source-stage.py` | 24454 | `391A6DA87A3CE2DC3F0A4F013D42967E26A5F4DEFBEEACBA0ED998CB958DF50E` |
| `README.md` | 5871 | `BB407D9638724FCF10E3FD6706D69C13D9D292705A328D0A0B10AECE178390E9` |
| `start.ps1` | 43406 | `D6135E7810BC768A783A0FF2B5A2BE4443D30043AD4545639B351373AEFE2567` |
| `stop.ps1` | 7127 | `0B544E88A9C0877FC4157968547510CA3B7D89926E12F7F2624F2D8C202358FA` |

只读字节级反替换核对通过：

- `start.ps1` 反替换指定路径和哈希后，与已审输入完全一致，输入 SHA-256
  `592A7C77479B429FE2E8CF7479A66070B10512A8A4E29A26B980B06034B11051`。
- `stop.ps1` 反替换指定 `runsRoot` 后，与已审输入完全一致，输入 SHA-256
  `09ADEEF6710C1DA24ECB9EC2E75F16727B66009DFE4202559F962C2C25E4C7A0`。
- `source-stage.py` 反替换目标行后，哈希前缀为改动前记录的
  `B1B6D89A93E81`；`README.md` 反替换目标字面后，哈希前缀为改动前记录的
  `3EE601D15B180`。

## 未运行与边界

- 未执行 Git 读写；没有 add、commit、rebase、stash、reset、clean、checkout 或 push，
  因而没有提交 SHA。
- 未运行搜索、测试、compile、parser、静态审计、服务、GUI、准备件或根生成。
  这些由 root 按累计审查流程负责。
- 未联系其他聊天，未更换 API，未更改沙箱、审批、ACL、权限或 writer 锁，未使用 Bash。
- 无沙箱或权限拒绝阻碍。两次 PowerShell 包装脚本在预解析阶段因空管道语法报错，
  均未执行、未写盘；修正后完成本交回。
