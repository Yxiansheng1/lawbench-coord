# C 线交回件：Legacy Tk Skip Closure

状态：`AUTHORED_NOT_RUN`

执行者：C 线独立执行器

任务令：`D:\Lawbeach\lawbench-coord\ORCH-C-LegacyTkSkipClosure-20261101-104213.md`

## 产物

- 新消费器：`D:\Lawbeach\lawbench-C\docs\plan\evidence\T19\LegacyTkSkipClosure-20261101-104213\consumer.py`
- 复制基座：`D:\Lawbeach\lawbench-C\docs\plan\evidence\FullRegression\CSafetyRunner-20261031-135039\consumer.py`
- 复制基座既知 SHA-256：`0620f5e613cdbd2c38feb47150731794729b0fbeae7a35f62d6a83e4ab6817fa`
- 复制基座既知大小：`11200` 字节
- 新文件最终 SHA-256：`0624a24e23d9b7c11b4290475391f2895c21ecfca9246d25f511bb9b23e78736`
- 新文件最终大小：`12696` 字节

## 有界修改

- 从原消费器原样复制全部字节后，仅增加标准库 `json` 导入。
- 将 `pytest_args` 中原先指向整个 `tools/tests` 目录的末项精确替换为单个用例：
  `D:/Lawbeach/lawbench-C/tools/tests/test_convert.py::test_legacy_word_note_in_gui`。
- 在原有 Guard 安装完成之后、导入 `pytest` 之前，保存原始 `tk.Tk` 类并安装被动构造观察包装。包装只调用原构造器并返回其同一对象。
- 构造成功时向 stderr 输出固定 kind 与 `success: true` 的 JSON；构造抛异常时输出固定 kind、异常类型及异常消息 JSON，随后以裸 `raise` 原样抛出。
- 使用内层 `finally` 在原有摘要写入前恢复 `tk.Tk`。若 `tkinter` 导入自身抛错，不执行新恢复分支，由既有外层异常处理承接，不增加回退路径。
- 未修改 Guard 4b3c、守护逻辑、环境、断言、产品代码、重试、跳过、teardown、摘要字段或退出码流程。

## 执行计数与偏差

- 验证用例执行次数：`0`。
- pytest 调用次数：`0`。
- GUI/Tk 启动次数：`0`。
- HTTP/模型/运行时自测次数：`0`。
- 源码测试或 Guard 文件读取之外的产品发现、历史查询、目录枚举：`0`。
- Git 读取、暂存、提交或其他写操作：`0`。
- 功能偏差：无。
- 执行阻碍：无。
- 作者未运行目标用例；按令由根控制方在完整静态复核后，以全新私有目录、60 秒私有守护边界运行这一个用例。

## 继承证据，非本轮执行

原始证据显示完整 C tools 为 `31 SKIP / 84`，目标 Tk 用例为 `SKIP`，目标用例既知 runtime 为 `0.160s`；同组另外 3 个 Tk 用例通过。以上均为旧证据事实，本交回不将其重述为本轮运行结果，也不声称目标用例已通过或已修复。

## 静态复核结论

新文件已完整复核。操作顺序保持为：验证 Guard、安装原 Guard、观察 Tk 构造、导入 pytest、运行唯一固定用例、恢复 `tk.Tk`、写原摘要。未发现越出本令范围的源码或控制流改动。
