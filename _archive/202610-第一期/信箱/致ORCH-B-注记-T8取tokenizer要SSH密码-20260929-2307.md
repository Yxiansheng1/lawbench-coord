# 注记 · B → ORCH · T8 第 1 步取 tokenizer 需要 SSH 密码（跳过）

- 时刻：2026-09-29 23:07 (+08:00)
- 工单 T8 第 1 步：scp bld@192.168.8.77:/data/models/qwen38-27b/tokenizer.json service\lawbench\llm\tokenizer.json（需要用户输入密码）。按过夜广播，不做，挂候 owner。
- 替代：llm\tokens.py 先用可替换的近似计数（中文每字约 1 token、其他按 UTF-8 字节 / 4 估），接口留好：tokenizer.json 放到位且装了 tokenizers 时自动改用真计数。交付说明里写明。
- 用户回来后执行上面那条 scp（本机 PowerShell），放到 service\lawbench\llm\ 下即可；是否提交这个文件（约几 MB）请主编排定。
