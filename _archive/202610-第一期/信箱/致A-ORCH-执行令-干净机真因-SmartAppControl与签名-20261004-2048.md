# 致线 A · 执行令 · 干净机实装真因：Smart App Control 拦截未签名 DLL；安装目录名未品牌化（2026-10-04 20:48）

- 发件：ORCH（用户在场）。用户新电脑（Win11）装第一版：服务 0.4 秒退出码 1，手动跑 `python.exe -I -m lawbench` 报
  `ImportError: DLL load failed while importing _sqlite3: 应用程序控制策略已阻止此文件`——**Smart App Control / 应用控制策略拦下未签名的 .pyd/.dll**。安装目录名是 `%LOCALAPPDATA%\Programs\@deepseek-aidsh-desktop`（DSH 原版名）。本令并入 2015/2033 令，一起交；**优先**。

## 必修
1. **内置 Python 换成 python.org 官方发行（PSF 签名）**：uild.ps1 的 python 步改从官方 embeddable/安装包取（3.12.x，与现用小版本一致），记来源与 sha256；核对包内 `python\*.dll`、`python\DLLs\*.pyd`、`python\python.exe` 的 Authenticode 签名（`Get-AuthenticodeSignature` 全部 Valid 且签名者 Python Software Foundation）→ `evidence\T20\python-signatures.txt`。wheelhouse 里带二进制的轮子（pywin32、onnxruntime、opencv、rapidocr、pypdfium2 等）**逐个列出哪些 DLL/pyd 无签名**，写进交付说明"待签名清单"——这些要靠我方证书签（N73 候 owner），或在打包时用 signtool 签（证书到位后）。
2. **安装目录名、开始菜单、卸载项、注册表 DisplayName** 全部用"连越律师工作台"：electron-builder 的 `productName`/`directories`/`nsis` 配置（P-4 范围）。
3. **启动失败要可见**（2033 令第 2 条）——这次 host 日志只有 `service.exit code 1`，没有 stderr。改为捕获服务 stderr 最后 20 行写 `service.start_failed`（只记异常类名与消息，路径只记相对安装根）；首次配置页显示"本机服务未能启动：<消息>"。像这次的"应用程序控制策略已阻止"律师一看就知道去找 IT。
4. 交付说明加一节"Windows 应用控制/SmartScreen"：现状（未签名）、影响、绕法（测试机关闭 Smart App Control）、正解（代码签名证书，N73）。

## 一并（打包脚本里预留）
- `build.ps1` 加 `-SignCert` 可选步：证书到位后对安装器、exe、我方 DLL/pyd 批量 `signtool sign /fd sha256 /tr <时间戳>`；现在没证书就跳过并在 build.txt 记"未签名"。

## 交回
随 `致ORCH-A-交回-T20第二版前修法-<HHMM>.md`。明早热点重打第二版。