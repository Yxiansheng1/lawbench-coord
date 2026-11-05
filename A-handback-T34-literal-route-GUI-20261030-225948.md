# A 线交回：T34 literal-route GUI source bundle

状态：`SOURCE_ONLY_READY_FOR_ROOT_REVIEW`

这不是 T34 PASS。实际 GUI、settings read、necessary unset、physical patch
verification 和 owned OS closure 均未运行。底层 `ConfigEditor` 写入原因仍为
`UNKNOWN`；没有声称 literal route 已解决实际 GUI 问题。

## 正式产物

证据目录：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T34\LiteralRouteGUI-20261030-225948`

目录内恰有批准的 11 份文件：

- `prepare.ps1`：13558 bytes，SHA-256
  `63b0aafdfb726ef4a1828cad77124791580814aa0b63c9161c97f3a0935f3168`
- `start.ps1`：88133 bytes，SHA-256
  `fd558f5e60d85b16ac06fc7ddc4d758ab299dac408750be9c6c55d277e8a6526`
- `stop.ps1`：7175 bytes，SHA-256
  `e6c99dab813cd424626b027640e0ae145b2626790e5dc758012964b7369bfbf9`
- `entry.py`：88649 bytes，SHA-256
  `667ef178b610b4b1bf88e8fd97dfd442a7f0c455f64467b0617453d9b740fe96`
- `projection-observer.mjs`：20058 bytes，SHA-256
  `2c594da0154dc3dfda506d557249cc2213788d9a28c759af1edec2ddb7b39eac`
- `private-provider-binding.mjs`：2499 bytes，SHA-256
  `376570143a8af0235af627ec87af06cef9a3e717c1928f777343386387381a4e`
- `settings-read-observer.mjs`：11513 bytes，SHA-256
  `4fac11cf4a8bd75d46f932a0ce3cbb1d5dd263d15a81c2c180953715bf8ce107`
- `signature-finite.mjs`：5381 bytes，SHA-256
  `d52d1848983de75a8fb30f4ce9ca0340a349fc7942972a06fa44a8588f1aefed`
- `observer-finite.mjs`：6845 bytes，SHA-256
  `80100aa3b4c343448ee705f83f4d6bd6b28c026227304eb90005f4d521c07ccb`
- `literal-inputs.json`：按批准 blueprint 生成；自引用字段固定为
  `bytes: null`、`sha256: SELF_NOT_REFERENCED`
- `README.md`：4209 bytes，SHA-256
  `cff9baab82d4ee7a8f313b043fd526cf56b807798b88f73485cdfefa7362a26a`

## 有界修改

`prepare.ps1`、`stop.ps1`、`entry.py` 只做 self-root relocation；
反替换后与 baseline 字节完全一致。`entry.py` 的根路径在源码中分两段，
最终校验按后缀反替换确认。

五个 helper 保持 baseline 字节一致：projection observer、
private-provider binding、settings-read observer、observer finite、
signature finite。Host 仍为 904755 bytes / `ad0f...`，未改变。

`start.ps1` 的私有构建已切到：

`D:\Lawbeach\lawbench-A\docs\plan\evidence\T18\GeneralReadOrderPrivateBuild-20261030-164557\private-output-20261030-171028`

manifest 为 58199 bytes / `89725c...`。24 个输出钉和 3 个 shim 行全部匹配
当前构建；相对旧构建只变化 `lawbench-dsh/lib/agent.js` 和
`lawbench-dsh/lib/client.js`，两者已钉为：

- agent：558006 bytes / `f395c8557d7095c9a98183c8dfaf01fd66344c1636bbb983d11eab0568ab7311`
- client：539499 bytes / `b818090fc0b52bd15c2b63a76689b178b887c2e35b2d4f05f7d208d360be7e62`

URL 适配只作用于新 owned profile：

- 原始源前缀：2146 bytes /
  `7bb1e3fa7bb7bdb412487db11e1be48d025521130dd7104d5b9210ab3e3b025f`
- 唯一 `lawfirm.baseURL` 表达式行替换为
  `http://127.0.0.1:65005/v1`
- 字面化前缀：2110 bytes /
  `c4734c3a5be68ae3a6a3a89fd44ca43b1f9a4d18037d6353203f0136b3d35649`
- 替换次数为 1，反向替换字节等于原始前缀
- 既有 synthetic `external` seed 改用同一 literal URL；seed inverse 与
  on-disk seeded-prefix inverse 均针对 normalized prefix

`NODE_OPTIONS` 现在是 `--import=<resolver> --require=<guard>`，不含
`private-provider-binding.mjs`。candidate provider component 未注册、未 import、
未绑定、未构建；其文件、pin 与定义保留为历史钉。

## 最终只读校验

最后一次只读 PowerShell 检查返回：

`PASS_SOURCE_ONLY`

结果是：11 files；5 helper byte-equal；3 self-root inverses；source prefix
2146/`7bb1...`；literal prefix 2110/`c473...`；literal inverse true；24
private outputs；3 native shims；8 primary pins；Node options 仅
resolver+guard；author runtime 0；actual GUI `NOT_RUN`；model calls 0；
packaging `HOLD`。

本 job 共 51 次命令调用：40 次返回 0，11 次非零。非零构成为：
1 次只读 `git status` 在 `dsh` 子模块权限拒绝；2 次 bash 在预执行阶段被拒；
3 次 PowerShell 引号/解析错误；4 次验证器 binding/path/text 假设错误；
1 次预期为非零的只读 `git diff --no-index`。另有 1 次只读哈希命令误用了
`pwsh.exe` 别名而非规定的绝对路径，已在
`literal-inputs.json` 的 `noncanonical_shell_alias_invocations` 如实记录。

未运行 Node、Python、AST/parser/import/check/test/build、prepare、admission、
start、app、GUI、HTTP、model、environment-key、DPAPI、process probe 或 stop。
Git writes 为 0。没有 add、commit、rebase、stash、reset、clean、checkout 或
push。

调用形式为
`& pwsh -NoProfile -File prepare.ps1 -RunRoot <fresh-run-root>`；
ROOT 按执行令决定是否启动 fresh actual GUI。若 literal case 仍 RED，必须保留 RED，
不得自动尝试第二 variant。

## 历史违规与边界

既有 T34 read-signature source-finalization violation 原样保留：其 commands
32/33 运行了 `finite5`、`finite2`，不能作为独立 ROOT acceptance；原始 failed
状态未改写。该历史 job 记录为 38 条 raw commands、无 GUI/model 执行。

没有产品、测试、SDK、default-lib 或 old-served 改动，没有读取真实 Key、
密码、DPAPI 或真实案卷。Git 只读状态探测的 `dsh` 子模块权限拒绝仍是环境阻碍；
没有尝试修锁、改权限、扩审批或拆 writer。
