# A-handback T31 launcher health/build pins

- 执行令：`D:\Lawbeach\lawbench-coord\T31-launcher-health-build-pins-order-20261026-070230.md`
- 状态：令内允许的有界修改、静态核验和文件交回已完成；本件即为交回，不是 Git 提交。
- 权限边界：Git 全程只读；未执行 `add`、`commit`、`rebase`、`stash`、`reset`、`clean`、`checkout` 或 `push`。

## 修改前后

### `start.ps1`

- 路径：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1`
- 字节数：`75433` -> `75433`
- SHA-256：`762cd49129670664adf31a0a9d47a2f1e1779219e222f2fd3f8f69806bb1405e` -> `442285451eab8321c4a5d69efa28c22cd91cca943e694b55b239a9908c4d68dd`
- 只执行下列五个不同字面量、合计七处替换：

| 旧字面量 | 新字面量 | 次数 |
| --- | --- | ---: |
| `private-output-20261026-054741` | `private-output-20261026-070027` | 1 |
| `50c04674f198278e3e426448fa265729243c89386045534bb9810951783c7401` | `3b2eddfafba27e22f482a0cd4fbe053efb8236a3dc3a13d815977fcf083b16dd` | 1 |
| `17a43e69d0065f8cbb0d41bfe4ba2bfb1a8391b0f085ba9d6cc9019dbb3ca2a7` | `ea8eedcb36da764b6543f91d623f9dfeb7fa868f3aa90bd3b49360caba490c64` | 1 |
| `7c2f1a2c2e4825a5626a8deba279d0a75b38b060620269c71a1c2c5beea7bb63` | `69647cb95beae8f481a2e844a0cac44621d77b1f26cebe9f2638eb5b33710660` | 2 |
| `900186` | `900383` | 2 |

- 替换后旧字面量计数均为 `0`，新字面量计数分别为 `1/1/1/2/2`。
- 将新文件的上述七处替换逆向后，字节长度仍为 `75433`，SHA-256 精确恢复为改动前的 `762cd49129670664adf31a0a9d47a2f1e1779219e222f2fd3f8f69806bb1405e`；因此其他字节未变。
- 改动前快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31HealthAuth-20261026-065249\before-launcher-new-health-pins-20261026-070230\start.ps1`

### `README.md`

- 路径：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`
- 字节数：`20684` -> `20827`
- SHA-256：`e83e1aab9e2368ea7492729404950846a7ed7129af799ea40795e7dd07b1beb9` -> `2408f361907b0f8a6685ebf58016054238d5c4eee3eb7bae3267db66956f45aa`
- 仅更新当前私有构建根、当前 manifest 身份、当前 Client/Host 行的字节数及哈希，并加入短事实：既有 health-auth 根回归 `3/3` 通过、类型检查 `0` 错；新私有构建仅完成静态核验。
- 历史 staticfix 小节的实际过去身份保持不变。
- 改动前快照：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31HealthAuth-20261026-065249\before-launcher-new-health-pins-20261026-070230\README.md`

## 复用的既有静态证据

- 接受证据：`C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31HealthAuth-20261026-065249\root-new-build-accepted.json`
- 私有构建根：`D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\PrivateRuntimeBuild-20261026-043910\private-output-20261026-070027`
- `manifest.json`：`57729` 字节，SHA-256 `3b2eddfafba27e22f482a0cd4fbe053efb8236a3dc3a13d815977fcf083b16dd`
- `lawbench-dsh/lib/client.js`：`528465` 字节，SHA-256 `ea8eedcb36da764b6543f91d623f9dfeb7fa868f3aa90bd3b49360caba490c64`
- `lawbench-dsh/lib/host.js`：`900383` 字节，SHA-256 `69647cb95beae8f481a2e844a0cac44621d77b1f26cebe9f2638eb5b33710660`
- 既有证据核定 inventory `25` 项；Client 仅一个构建 stamp 字面量变化，Host/Client 之外其他 `22` 项与已接受 `054741` 构建逐字节相同；Host 完整差异已由既有证据复核。本线程未重跑构建。
- 冻结文件未变：`prepare.ps1` SHA-256 `44cf57da9ed1532415b84e0195fd22408c281cb452a0ebea0ad79dff2d924c70`；`stop.ps1` SHA-256 `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67`。

## Git 只读核验

- 首次 `git status --short` 因子模块 `dsh` 指向的主工作树 `.git` 路径权限不足而中止；原样记录，未修改权限、ACL、沙箱、审批或锁文件。
- 随后仅对两个目标路径执行带 `--ignore-submodules=all` 的只读状态查询，显示二者在本轮前均为未跟踪文件。既有 dirty 状态被保留，未暂存。

## 禁止项与未执行项

- 未 author/run：parser、prepare、start、stop、serve、probe、GUI、HTTP、model、network、test、Vitest、tsc、pytest、collect、build、selftest 或 install。
- 未修改其他源码或证据文件；未处理权限、ACL、沙箱、审批、锁、全局 API、Keyring 或真实案卷。
- Packaging 保持 HOLD：未生成 installer/package，未 merge、push、deploy，也未触发 Actions。

## 运行时声明边界

本次只交回静态构建针脚、README 身份更新和字节级反证。没有新一轮 runtime 证据，不声称 `start.ps1` 已解析、私有构建已运行、GUI 已启动或可交互，不声称 T31 整体通过。既有 health-auth `3/3`、类型检查 `0` 错只作历史静态/根健康证据引用；新构建结论仍为 static-only。
