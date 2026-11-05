# A 线交回：T34 enabled-settings pin finalizer

状态：SOURCE_FINALIZER_COMPLETE；产品运行态仍为 `not_run`。

## 已完成的令内修改

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledSettingsGUI-20261031-113924\start.ps1`
  - 精确替换一次：`$NativeEntryBytes = 88651` -> `$NativeEntryBytes = 88697`。
  - 当前字节数：96147。
  - 当前 SHA256：`569825f782ab6f46aca8d4265806817cd739321a06653c23c7c3592706f16387`。
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\EnabledSettingsGUI-20261031-113924\literal-inputs.json`
  - 从填充候选 `D:\Lawbeach\lawbench-coord\T34EnabledSettingsGUIInput-20261031-113924\manifest.expected-template.json` 原样落位后，仅将旧 `start.ps1` 哈希 `aa4d12b3134a2bac159a9c5e6190a7cb61c99cfbd88c42cd5eda366ff45e594a` 精确替换为上述新哈希。
  - 当前字节数：34778，与填充候选同长。
  - 当前 SHA256：`885f2f1e07f707841ca666be71d8a8ad91c60446f86ba774781f7eec39515ca1`。
  - 替换区外变化字节数：0。

填充候选输入文件未修改，仍为 34778 字节，SHA256：
`83c8f3256fe2359e3f6ed006009d8706e883aee9606704867ccf4305f164c876`。

## 验证与边界

- 执行 shell：`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`，login=false；命令退出码 0，错误数 0。
- runtime 启动次数：0。未执行 prepare、admit、start、GUI、stop 或 cleanup；未运行 Node、Python、AST、parser、JSON parse、check、tests、build、HTTP、model、Key 或沙箱/审批/ACL 操作。
- 未执行任何 Git 命令，未 add、commit、rebase、stash、reset、clean、checkout 或 push。
- 未联系其他聊天，未改 API；dirty 状态已保全。README 静态警告与原 formal 保持历史原状。
- Root 仍拥有 whole-byte 反查、prepare、admit、start、GUI、stop 与全部清理。
