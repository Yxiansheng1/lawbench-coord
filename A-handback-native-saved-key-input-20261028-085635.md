# 线 A 交回：T31 saved-key stdin 输入接线

## 交回状态

| 类型和状态 | 内容 |
|---|---|
| 做了什么 | 按 `A-native-saved-key-input-order-20261028-085635.md` 完成作者侧有界修改：full 模式显式 `--credential-stdin`、严格 EOF 管道读取、默认 TTY 与 `--preflight-only` 语义保留；未运行、未验收。 |
| 目标是什么 | 让 root 通过匿名非 TTY stdin 管道复用其受 DPAPI 保护的合成测试凭证，同时保持原 full/preflight、网络闸门、脱敏、报告和清理路径。 |
| 在等什么 | 等 root 首轮审计完整源码、全部命令、写入面、输入边界和 finally 清理；通过后才可用公共假值做有限读取器准入，并按原流程跑真实 full。 |
| 卡在哪 | 作者侧无停摆。`git status` 因子模块 `dsh` 权限被拒；按令记为只读阻碍，未尝试修锁、权限、审批或沙箱。 |

## 写入面与指纹

- 修改：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\native-real-conversation.mts`
  - 修改前 54,823 字节，SHA-256 `2F25E05E75D0512F2445B27D412A6D8C13A900688CF3F4D9D9EC49BDDF7C6084`
  - 修改后 58,057 字节，SHA-256 `80C603F94C42F19CE635D245FC0520559AA9BB72FED55D2EF91685AE4D3C2343`
- 新建证据：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\NativeRealConversation-20261028-000823\root-saved-key-input-20261028-085635.md`
  - SHA-256 `2359FF07E04BDE596102884DCE55770CCC079B2184C5B92739ABD0C16FC3C7CE`
- 新建本交回件：`D:\Lawbeach\lawbench-coord\A-handback-native-saved-key-input-20261028-085635.md`

只有以上三个文件被写入。Git HEAD 为 `a23271abee333a9a256fd46a3141da16975c2380`，分支 `line-A`；没有 add、commit、rebase、stash、reset、clean、checkout 或 push。

## 边界与静态结论

- 接受参数只有三类：空参 → 原交互 TTY full；`--preflight-only` → 不读凭证、不开网络的预检；`--credential-stdin` → 非 TTY 管道 full。未知、额外和冲突参数统一拒绝。
- 新读取器要求非 TTY，接收 1–4,096 字节可打印 ASCII，可带一个末尾 LF 或 CRLF；拒绝空值、超限、NUL、非 ASCII、多记录和尾随内容。读取器不输出凭证，错误不夹带凭证。
- 原 `readCredentialFromTty()` 函数体未改。凭证读入、输出脱敏、网络闸门、模型调用、最终报告脱敏、JSONL 与 finally 清理顺序未改。
- 同目录旧 `.ts`、README、fixed-inputs 和既有正式记录哈希在修改前后一致。
- 本次没有运行候选或读取器；没有 Node、Python、tsx、Vitest、tsc、parser、AST、import、HTTP、模型、Key、SSH、GUI、build、selftest。也没有读取或触碰凭证槽、Keyring、密钥文件或真实 Key。

## 命令记录与降级

完整命令顺序、退出码、非零结果、冻结文件哈希和写入面记录见证据文件“实际命令与结果”一节。两次执行面异常均已如实记录：

- `git status --short --untracked-files=all` 退出码 1，原因是子模块 `dsh` 管理路径权限拒绝。
- 一次冻结文件哈希调用误填 `bash`，退出码 1 且命令未执行；未做 setup、未切换 legacy，随即改用规定的 native PowerShell 完成只读哈希，结果与修改前一致。

未验证 TypeScript 语法、导入、ESM 或词法绑定；未做公共假值读取器准入。这些均留给 root，静态作者检查不能替代 full 模型流程或 T31 验收。

## 下一步

root 现在先审计完整源码和本证据；发现越界时按证据中的精确写入面返修，审计通过后再做有限读取器准入与真实 full 流程。线 A 交回后停止，不自行运行或提交。

Response ID: local execution (runtime did not expose a response identifier)  
Response log path: `D:\Lawbeach\lawbench-coord\A-handback-native-saved-key-input-20261028-085635.md`
