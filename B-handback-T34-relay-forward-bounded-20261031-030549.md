# B handback — T34 relay-forward bounded order

状态：SOURCE_DELIVERED；runtime 0；actual NOT_RUN；whole T34 NOT PASS。

## 交付

- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549\relay-forward.py`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549\literal-inputs.json`
- `D:\Lawbeach\lawbench-B\docs\plan\evidence\T34\RelayForwardBoundedActual-20261031-030549\README.md`

消费器只接受新的 `runs` 直属子目录，并由 stdin 读取唯一
`{key: secret}` 对象到内存。源码包含五个批准 pin 的前置校验、五道无出站
准入控制、唯一真实 HTTPS 转发门、原响应原样透传、64 KiB 原始回复上限、
密钥扫描、120 秒总预算、单项 5 秒清理预算和 150 秒外层上限。

## 边界与证据诚实性

- 本次未执行脚本、未导入应用、未启动 HTTP、未访问模型，未运行动态测试或全量测试。
- 未修改产品源码或当前 B346/B346 持有面；未执行 Git 写入操作。
- Native SDK / GUI / agent / system credential store 未运行。
- 原 source-only job 已停止并保持停止；不重演旧开工、安装、调研或全量测试。
- 未执行 package/installer、merge/push/deploy、actions/fees、security policy、395、GPU 或真实案卷测试。
- 实际请求、真实响应和 OS 级关闭仍需主编排独立执行与核验；本交回不声称 actual PASS。
- 全部 T34 仍是 NOT PASS；全量套件等待人工同步放行。

正式输入：
`D:\Lawbeach\lawbench-coord\T34RelayForwardBoundedInput-20261031-030549\approved-inputs.json`

本文件是协调目录中的正式交回件，不是 Git 提交。
