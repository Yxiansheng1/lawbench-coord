# Windows UAC与MXC执行通道

更新 2026-10-21T20:44:05.218922+08:00。用户问能否自动同意 codex-windows-sandbox-setup.exe 的Windows UAC。UAC安全桌面不能由AI代为自动批准，不关闭UAC或修改ACL。官方文档 https://learn.chatgpt.com/docs/windows/windows-sandbox 指明支持的MXC无需管理员初始化，并保留managed文件/网络边界。

已实际探针MXC_OK exit0；20:23备份两份config至 C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\MXC-preference-backup-20261021-202329，唯一增加features.prefer_mxc=true（GPT和独立DeepSeek）。模型/API/Key/approval_policy/saved sandbox-mode未改。两边正常沙箱验证ROOT_SANDBOX_OK/DEEPSEEK_SANDBOX_OK exit0。旧桌面tool helper缓存仍可能报sandbox-bin锁拒绝，不能声称热加载修复或保证不再UAC。

复核执行实际可用 C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\run-in-mxc.py <自己outputs目录.ps1>，显式原生windows.sandbox=mxc + include-managed-config + :workspace，UTF8/125秒，无legacy回退或setup。Node只读授权代码/Git对象可补身份；MXC内git -C D树可能denied，不改ACL；Vitest缓存如AC Temp EPERM，只为自己子进程设TMP/TEMP自己目录。两个A复核已走此通道完成真实React反例。新DeepSeek有限job显式选MXC，不能反复启动旧管理员setup，不绕过managed安全边界。当前弹窗若仍存在，只能人亲手处理；不伪称已点击或关闭。
