# A 线 T31 runtime fixed-input repin 交回

状态：有界修改完成，等待 root 独立反向比对整个 config 并决定是否准入一次新的私有开发构建。

## 事实

- 执行令：`D:\Lawbeach\lawbench-coord\T31-runtime-repin-order-20261026-210934.md`
- 固定蓝图：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeRepin-20261026-210934\root-fixed-input-blueprint.json`
- 蓝图 SHA-256：`edd26101fdf9b5e8f5b6adeb4ad80907e698d523e46238b6dcb077914e9e8197`
- 本次只修改允许的既有 `build-config.mjs`、既有 `README.md`，并新增本交回文件。
- `build-config.mjs` 修改前：`bb633bf59b12583a964002ec67b719b231307699faef638ea68c404374a403a5`
- `build-config.mjs` 修改后：`ebd53e5fb5fc6b00bc44bf0e4e38854f0f4adead240ba388681c5cc30cae2ef1`
- `README.md` 修改后：`7ef3b6db8d459e8ac6858e5f40dbdd31c73ff062654d75603a88babb4d99a5f1`
- `build-private.mjs` 仍为：`347ae08143138724db02017fd4243d56f950d2f1a2e7fdf9ef53ec557ab47b55`

三行 `TREE_PINS` 的精确新值（`root`、`selector`、文件数未改）：

| id | files | bytes | sha256 |
| --- | ---: | ---: | --- |
| `lawbench-ui-source` | 92 | 635841 | `4e17edb2eddc80645025267979d8d768dd7718ec642af1f602b0b183ffab029c` |
| `ui-conversation-source` | 79 | 592784 | `0b4843e97e37caf9b453c469604966b304c899b52c7d72993f37d03daf224414` |
| `session-controller-source` | 34 | 340824 | `f09098e1440c0f2d4564f7efe4c3325c6b660ccd7b576ab4b7a6eb12971d5b84` |

`REFERENCE_PINS` 只在原 12 项后追加：

| path | bytes | sha256 |
| --- | ---: | --- |
| `D:\Lawbeach\lawbench-A\dsh-patches\P-29-submission-admission-revalidation.patch` | 3561 | `6ba11ae09a9e7adec05831479a84541adac0e72297f1729415718d95ecfcdf1d` |
| `D:\Lawbeach\lawbench-A\dsh-patches\P-29-scoped-queued-delivery-policy.patch` | 20773 | `8d8564f7bc886ada6db7bdea87c7d3a42c48f7d351b97e7ee6364afc0bb71a19` |

静态文本计数：`{"trees":18,"filePins":39,"referencePins":14,"total":53}`。其余 15 棵树、
全部 `FILE_PINS`、原 12 个参考项、算法、函数、selector、路径、输出列表和工具链 pin 未改；
未改源码、tests、P29 补丁、`PATCHES.md`、旧证据、产物、profile、launcher 或 runtime。

## 实际命令与结果

所有 `exec_command` 均显式使用
`C:\Users\morel\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\powershell\pwsh.exe`
且 `login=false`。

```powershell
Get-Content -Raw -LiteralPath 'D:\Lawbeach\lawbench-coord\T31-runtime-repin-order-20261026-210934.md'
# exit 0

Get-Content -Raw -LiteralPath 'C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeRepin-20261026-210934\root-fixed-input-blueprint.json'
# exit 0

rg -n -C 14 --fixed-strings 'lawbench-ui-source' 'docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
rg -n -C 10 --fixed-strings 'ui-conversation-source' 'docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
rg -n -C 14 --fixed-strings 'session-controller-source' 'docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
rg -n -C 35 --fixed-strings 'REFERENCE_PINS' 'docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs'
# exit 0

git status --short --untracked-files=all
# exit 1: cannot chdir to 'D:/Lawbeach/lawbench/.git/worktrees/lawbench-A/modules/dsh': Permission denied

git status --short --untracked-files=all --ignore-submodules=all
# exit 0; existing dirty content was preserved and not committed/staged

Get-FileHash -Algorithm SHA256 -LiteralPath 'docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-private.mjs','docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\build-config.mjs','C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31RuntimeRepin-20261026-210934\root-fixed-input-blueprint.json','dsh-patches\P-29-submission-admission-revalidation.patch','dsh-patches\P-29-scoped-queued-delivery-policy.patch'
# exit 0; hashes match this handback
```

补丁应用工具第一次在自动权限审查阶段超时；只读复核确认 config 仍为修改前 SHA 后，
同一有界补丁重试成功。另有两条使用多个 `--fixed-strings` 参数的首轮 `rg` 命令被 `rg`
将后两个参数当作文件路径，均 exit 1；随后用 `Get-Content` 精确读取相关行段，exit 0，
落点与蓝图一致。上述非零均为只读命令或权限受阻，没有触发 Git、锁、审批或 ACL 修复。

## NOT_RUN

- 未 build、parse、import 或执行 `build-config.mjs`。
- 未运行 Node、Python、Vitest、tsc、pytest、parser、AST、test、selfcheck、prepare、serve、probe、HTTP、GUI 或模型。
- 未重跑旧 13 项通过断言、旧构建或旧失败；按执行令复用既有原始证据。
- 未生成或替换任何构建产物、manifest、profile、launcher、runtime，也未加载 legal-credentials 或 memory provider。
- 未执行任何 Git 写操作：无 add、commit、rebase、stash、reset、clean、checkout、push、apply。
- 未修改 `.env.local`、Keyring、credentials、session cache、history、rollout、真实案卷或协调目录中的机密。
- Packaging 仍为 HOLD。源码 pin 与 prep 改写不等于 build、runtime、GUI、原生加载、T31 全通过或发布准入。
