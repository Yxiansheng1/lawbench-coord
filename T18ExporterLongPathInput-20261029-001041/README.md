# T18 真实导出器续接

状态：`AUTHOR_READY_NOT_RUN`

本目录承接主编排已有的一次真实 T18 原生会话。原会话已经完成合同审查并在同一任务保存了真实模型修改清单；原报告仍为 `FAILED`，业务质量仍不合格，因为审查意见的风险 3 把合同 `4.1` 误写成“合同第七条”。本次不重写草稿、不修报告、不重跑模型，也不改变这些结论。

脚本 `continue-genuine-exporter.py` 只做技术续接：

1. 校验输入清单、原报告、真实任务、案卷与原生会话文件清单、两份材料夹具和 346 个源码 pin；
2. 把已完成案卷逐字节复制到调用方指定的全新空根，源案卷和原会话只读；
3. 用生产 `create_app` 装配私有 appdata、假令牌、拒绝型 Key getter 与 `httpx.MockTransport`；
4. 不进入 lifespan，不起 ASGI/HTTP 服务，不启动 OCR、网络转发或证件识别；创建后立即把 `retainer` 换成既有有限运行模式使用的关闭哨兵；
5. 调用 `CaseRegistry.open` 打开复制案卷，确认原 `case_id` 不变，再以现有 `TaskStore` 读取已完成任务；
6. 直接调用生产 `Exporter.redline`，使用原任务中真实模型保存的修改清单生成修订版 DOCX；
7. 确认 DOCX 登记在同一已完成任务，独立检查 ZIP/OXML 中的插入、删除、批注、表格、超链接和外部关系字符串；
8. 断言源案卷、原生 JSONL、两份外部夹具和源码 pin 前后不变，并记录复制案卷唯一允许的差异。

执行后只允许产生技术链证据。成功不等同于完整 T18 通过、业务质量通过、Word GUI 验收、法律审阅或打包放行。

## 主编排执行

脚本必须由主编排在完整复核后执行。`--owned-root` 必须是不存在、且直接位于本目录下的新路径，例如：

```powershell
& 'C:\Users\morel\AppData\Local\Programs\Python\Python312\python.exe' `
  'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\continue-genuine-exporter.py' `
  --owned-root 'D:\Lawbeach\lawbench-B\docs\plan\evidence\T18\GenuineExporterContinuation-20261028-235617\owned-root-20261028-235617'
```

成功时，结果见新根下的 `continuation-report.json`。预检失败不会创建新根，只向终端返回失败；进入已创建的运行根后发生失败时，也会在该根内留下失败报告，不删除已生成材料。
