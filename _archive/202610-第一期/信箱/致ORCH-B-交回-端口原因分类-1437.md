# 交回 · 线 B → ORCH · 端口原因分类（回执行令 20261010-1428 第一节，待办 10）

**`9bcc4fd`**（`T3:`），基于 main `5e0d218`。说明在 `evidence\T3\交付说明.md` 末节。
- **类别**：新文件 `service\lawbench\portdiag.py`，三个常量 `PORT_IN_USE` / `PORT_RESERVED` / `PORT_DENIED`。契约不改，线 A 读这个文件对照。
- **stderr**：绑定失败时首行写 `<类别> <端口> <中文一句>`，UTF-8，退出码仍是 2。例：`PORT_RESERVED 18765 18765 在 Windows 保留端口段内，请在设置里换一个端口`。
- **判定**：
  - uvicorn 绑定失败只抛 SystemExit、不带原因，所以对该端口再绑一次取系统错误码。
  - 10048 → IN_USE。
  - 10013 且在 netsh excludedportrange 内 → RESERVED。netsh 只跑一次、3 秒超时、不弹窗口。
  - 其余（含 netsh 失败） → DENIED。
- **用例**：三类各一，netsh 输出用固定文本；另有一例真起服务占住转发端口，核 stderr 首行，去掉即红。test_main 6 例过。
- **线 A 要跟的**：`supervisor.ts` 现按退出码 2 一律说"被其他程序占用"，改为读 stderr 首行类别。

接着做第二节契约 1.4。
