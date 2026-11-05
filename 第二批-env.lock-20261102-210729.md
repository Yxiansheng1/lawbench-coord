env.lock 的确切文件名白名单修复已落到第二批打包控制器，实际安全复制落盘897字节且SHA与源树一致。当前阶段源码与私有载荷验证完成；最终包解包、干净安装环境检查和首次导入建账尚未运行，不记为安装验收PASS。

根因：engine-safe只允许一组扩展名，含.zip不含.lock。改动仅在engine-safe分支显式允许 invoice-ledger/vendor/env.lock；未把.lock加入通配扩展名集合。新增必需载荷断言：897字节、SHA256209cd5914f427bceb95a96193a364f42c69ac10cd8f0f709c0bfc05202434d45，否则打包失败。原控制器和第一批包均未更改。

实测：旧选择器false→新true；other.lock、其它引擎env.lock、.env.local、真实台账.xlsx、tests/env.lock均仍false。原安全复制流程从engines拷出285个允许文件，新私有路径 D:\Lawbeach\_acceptance\B2Env-20261102-210146\engines\invoice-ledger\vendor\env.lock 实际897字节且SHA相同。

私有载荷的原env_check.py --deep 自然退出0/0.3768759秒，原输出“环境包有效，缓存尚未建立；首次运行将自动创建”。无缓存创建，无真实台账/OCR/网络；短进程未捕获完整exe+出生身份，PID回读不存在，不声称完整进程封存。这不是“装后检查通过”。

证据：C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\Batch2-20261102-210146\env-lock-selector-and-copy-facts.json、env-lock-private-env-check.json。第二批控制器：D:\Lawbeach\lawbench-A\.p\B2-20261102-210146\build-windows-candidate.ps1；将随最终唯一第二包再做解包/安装检查并补本条状态。按owner顺序继续P0-6，第一批六项保持owner真机通过原判。