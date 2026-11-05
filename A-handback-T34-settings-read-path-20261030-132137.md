# A 线正式交回：T34 settings-read 正确 Host 路径

状态：`SOURCEONLY_CORRECTED_PATH_EVIDENCE_READY_NOT_RUNTIME_VERIFIED`

## 交付物

- 新证据目录：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\SettingsReadPathGUI-20261030-132137`
- 目录内仅有批准基线复制件 10 个，未增加第 11 个文件。
- 原 `SettingsReadBoundaryGUI-20261030-125910`、旧 131808 packet 与原有 dirty 均未改动。
- Git 提交：无。本运行无 Git 写入授权；未执行 add、commit、rebase、stash、reset、clean、checkout 或 push。

131808 既有结论仅按批准输入继承：15 个受控身份退出、4 个端口 `Listen=0`、私有窗口消失、原 12 窗口未动；观察器因根令省略 `lib` 而 `install_failed`，不是产品读失败原因。原 UI 读失败、mutate 0、根因 `UNKNOWN` 均保持不变。

## 精确改动

| 文件 | 允许改动 | 字节 | 最终 SHA-256 |
|---|---|---:|---|
| `prepare.ps1` | 仅自身根路径 | 13562 | `7b110608aafc64225ecb15c97b22c88f0b6d2600a94f90038b031ae0c9f6b76d` |
| `stop.ps1` | 仅自身根路径 | 7179 | `712d51399bf01e957f92ba30ccccbf7793757c140dab0bdae838abe4e33a7261` |
| `entry.py` | 仅自身根路径后缀 | 88653 | `9101f2800f60e69ab5cd46466d113db9f22012623511089ca1ce38820677bc48` |
| `start.ps1` | 两处自身根路径、入口字节/SHA、新观察器字节/SHA | 86064 | `6e59c4d4237f9ce48213f50f76ff3d3bfef889466588093ffb9a73549e8bd68d` |
| `settings-read-observer.mjs` | `expectedHostPath` 仅增加一个 `'lib'` 路径段 | 11515 | `b53e64830958656d39b92f5360cb41856847f0cd083fbd94248d1d8c97080d08` |
| `README.md` | 仅自身根路径与 `private-native/lib/host.js` 正确路径文本 | 2334 | `a96544bf1f383239030f85e3ce57d88caceba38845f0adf4cbdcbb4d494bab38` |
| `literal-inputs.json` | 证据根路径与 `host_runtime_relative` | 25656 | `d559488fd75f01214bc7bb695d59b7f31a19fc7b96aee0e86d79b096a3493293` |

观察器目标现为：

```js
resolve(stateDir, '..', 'private-native', 'lib', 'host.js')
```

未改 Hash/canonical/URL guard，未改 original-once、`sameThisArgs`、原 promise、throw/logger、privacy/caps、restore 或任何关闭断言。未引入第二 Host、模块猜测、源码 import、服务、Agent 或 Key。

以下 3 个文件逐字节等同于原基线：

- `private-provider-binding.mjs`：2499 字节，`376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e`
- `projection-observer.mjs`：20058 字节，`2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac`
- `observer-finite.mjs`：6845 字节，`80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb`

## 字节反向与闭包

- 10/10 文件通过整文件反向核对：7 个允许变化文件精确还原为对应基线，3 个不变文件直接逐字节相等。
- 预期字节差：`prepare.ps1 -4`、`stop.ps1 -4`、`entry.py -4`、`start.ps1 -8`、观察器 `+7`；README 与 `literal-inputs.json` 净差 0。
- `start.ps1` 中入口 pin 已匹配实际 `88653 / 9101…bc48`，观察器 pin 已匹配实际 `11515 / b53e…0d08`。
- `literal-inputs.json` 与根令提供的 `root-approved-manifest-blueprint.json` 逐字节一致；既有 current-25、私有组件、legacy-18 与 B346 literal pins 保持不变。

## 计数与非零

- 证据文件最终数：10；允许变化：7；逐字节不变：3。
- prepare/admit/start/GUI/stop、Node/Python、HTTP、模型、网络、进程探测、parser/import/check/test/build 与产品写均为 0。
- Git 写入、锁/权限/ACL/沙箱修改均为 0。
- 一次 `git status --short` 因既有 `dsh` 子模块权限拒绝而失败；未尝试修复、改锁或扩权。`git status --short --ignore-submodules=all` 只读确认 dirty 并保持原样。
- 一次工具请求误设为 Bash，运行器在命令执行前以 `Bash/E_ACCESSDENIED` 拒绝；无命令执行、无文件影响，已如实记录。

## NOT RUN

prepare、admit、start、GUI、设置页读取、UI 操作、观察器捕获、settings-read capture、finite five controls、stop、OS closure、Node/Python、私有 provider hook import、模块绑定、parser/import/type/check/test/build、磁盘 patch/current provider 检查、模型/网络、native projection PASS、whole T34 PASS 与 packaging 均未运行。

有限五项既有 PASS 来自根 131409；其函数字节未变，故按要求复用，不重跑。Host 仍为 `902499` 字节 / `ca849d…e56b`，本执行未重测亦未改产品。

Root 下一步仍须做 FULL audit、parser 与一次全新 actual correct-Host boundary GUI 全程闭包；不得停在 prepare。本轮不构成 T34 PASS。
