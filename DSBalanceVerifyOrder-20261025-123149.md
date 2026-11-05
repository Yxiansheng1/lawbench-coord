# Read-only connection and real-tool verification only
User confirms same-platform DS key/billing switch is ready. This is the only task; no product construction.
Use exact model deepseek-v4.1-flash-1017 and reasoning effort max. After reading this order, execute one read-only exec_command with shell=C:/Users/morel/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/powershell/pwsh.exe and login=false:
Get-FileHash -Algorithm SHA256 -LiteralPath 'D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\WikiEmptyGui-20261025-112820\start.ps1' | Select-Object Algorithm,Hash
The expected SHA256 is a268c51e5df0754edbbcd6ebb154591c48f766948bdb5dfdfafd9a591bdfd232.
Then answer DS_BALANCE_REAL_TOOL_OK plus the actual SHA, or the concrete failure, and stop.
No file edits or formal file creation. No Git, tests, builds, shell retries, server/GUI/model-product requests, configuration/credential/env/.env.local/Keyring access, permission/sandbox/TEMP changes. Do not contact other chats. Never read or print keys. No Bash. If command is denied, report the denial and stop.
