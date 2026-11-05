# A 线交回：T31 目录选择 launcher pins

## 结论

已完成 `T31-directory-launcher-pins-order-20261026-073616.md` 指定的有界修改和静态验证。

结果：`PASS_STATIC_PIN_UPDATE_ONLY`。本次没有运行 parser、prepare、start、stop、
serve、probe、HTTP、GUI、model、network、selftest、test、build 或 install，
因此不声明 GUI 通过或 T31 整体通过。Packaging 继续 HOLD。

## 修改范围

仅修改协调目录已授权的两个文件：

- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\start.ps1`
- `D:\Lawbeach\lawbench-A\docs\plan\evidence\T31\BatchGui-20261026-055030\README.md`

`start.ps1` 的四项精确替换为：

1. `private-output-20261026-070027` -> `private-output-20261026-073502`
2. manifest SHA-256 `3b2eddfafba27e22f482a0cd4fbe053efb8236a3dc3a13d815977fcf083b16dd` -> `52ebf5cfb50fbe863c4fd183744d374b537693dbdbd387f7425dabdbff0cce42`
3. client 字节数 `528465` -> `532527`
4. client SHA-256 `ea8eedcb36da764b6543f91d623f9dfeb7fa868f3aa90bd3b49360caba490c64` -> `5eb66c09e3c3f819b0f98382778c5e901e3b6fcee92b932a9a9c00e39d044859`

## start.ps1 验证

- 修改前与 `T31DirectoryLauncherPins-20261026-073616\before\start.ps1` 字节完全一致：
  `75433` 字节，SHA-256 `442285451eab8321c4a5d69efa28c22cd91cca943e694b55b239a9908c4d68dd`。
- 修改后：`75433` 字节，SHA-256 `691aa3ed150cb7a72ba889f6362b7362a2a39b91e3a061b4ff66aa1e1169f367`。
- 四个旧 literal 当前均为 `0` 次，四个新 literal 均为 `1` 次。
- 对四处新值做逆向替换后，结果与 before 快照逐字节相等，证明除四项指定 pin 外没有源码字节变化。
- 保持 UTF-8 无 BOM、纯 LF；修改前后均为 `1554` 个 LF、`0` 个 CR。

## README 与现有证据复用

- README 原有 `20827` 字节前缀逐字节保留，SHA-256 仍为
  `2408f361907b0f8a6685ebf58016054238d5c4eee3eb7bae3267db66956f45aa`。
- 仅在末尾追加 `985` 字节静态事实；最终 `21812` 字节，SHA-256
  `fbcd2ea85132dda5dad5e53594d613db89b99982a057db7956daedd6d427114a`。
- 追加部分保留历史 `070027` 运行表不动，只记录新 `073502` 根、manifest/client
  pin 及“其余 pin 与运行时约束不变”的事实。
- 复用既有 source-only 静态验收证明：
  `C:\Users\morel\Documents\Codex\2026-10-21\deepseek-codex-gpt-advisor-reviewer\outputs\T31DirectoryPicker-20261026-070942\root-new-build-accepted.json`。
- 新构建目录中的实际身份与证明一致：`manifest.json` 为 `57729` 字节、SHA-256
  `52ebf5cfb50fbe863c4fd183744d374b537693dbdbd387f7425dabdbff0cce42`；
  `lawbench-dsh/lib/client.js` 为 `532527` 字节、SHA-256
  `5eb66c09e3c3f819b0f98382778c5e901e3b6fcee92b932a9a9c00e39d044859`。
- Host 仍为 `900383` 字节、SHA-256
  `69647cb95beae8f481a2e844a0cac44621d77b1f26cebe9f2638eb5b33710660`。
- `prepare.ps1` 仍为 `44cf57da9ed1532415b84e0195fd22408c281cb452a0ebea0ad79dff2d924c70`；
  `stop.ps1` 仍为 `064fb97e0976af386a83d3657b0a74729db6cf1c1de08a03f02cec411bb2bf67`。

## Git 与边界

开工时工作树已有大量未提交修改和未跟踪文件，本轮原样保全。Git 全程只读，
未执行 add、commit、rebase、stash、reset、clean、checkout 或 push；没有暂存，
没有清理锁、权限、ACL、审批或全局 API 设置。

没有修改打包、安装、合并、推送或部署内容。剩余动作仅是主编排的累计精确 diff
复核及其后续 parser/prepare/start/real GUI 验证。
